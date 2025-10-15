import { TelegramBot } from './telegram';
import { OpenAIService } from './openai';
import { SessionManager } from './session';
import { ImageComposer } from './imageComposer';
import { Env, TelegramUpdate, TelegramMessage, TelegramCallbackQuery } from './types';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Vérifier que la méthode est POST
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      // Initialiser les services
      const bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN);
      const openai = new OpenAIService(env.OPENAI_API_KEY);
      const sessionManager = new SessionManager(env.USER_SESSIONS);
      const imageComposer = new ImageComposer();

      console.log('[Main] New request received, SessionManager created with KV persistence');

      // Parser le body de la requête
      const update: TelegramUpdate = await request.json();
      
      if (update.message) {
        console.log('[Main] Processing message from user:', update.message.from.id);
        await handleMessage(update.message, bot, openai, sessionManager, imageComposer);
      } else if (update.callback_query) {
        console.log('[Main] Processing callback query from user:', update.callback_query.from.id);
        await handleCallbackQuery(update.callback_query, bot, sessionManager);
      }

      return new Response('OK', { status: 200 });
    } catch (error) {
      console.error('Erreur dans le webhook:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};

async function handleCallbackQuery(
  callbackQuery: TelegramCallbackQuery,
  bot: TelegramBot,
  sessionManager: SessionManager
): Promise<void> {
  const chatId = callbackQuery.message?.chat.id;
  const userId = callbackQuery.from.id;

  if (!chatId) return;

  // Répondre au callback pour enlever le "loading"
  await bot.answerCallbackQuery(callbackQuery.id);

  // Pour l'expérience simplifiée, on redirige vers l'état d'attente de photo
  await sessionManager.updateSession(userId, { state: 'waiting_photo' }, callbackQuery.from.username);
  await bot.sendMessage(chatId, "Send me your image.");
}

async function handleMessage(
  message: TelegramMessage,
  bot: TelegramBot,
  openai: OpenAIService,
  sessionManager: SessionManager,
  imageComposer: ImageComposer
): Promise<void> {
  const chatId = message.chat.id;
  const userId = message.from.id;
  const username = message.from.username;
  const text = message.text;

  console.log(`[Main] Processing message from user ${userId} (@${username || 'no_username'})`);

  // Expérience simplifiée : au démarrage, on attend directement une photo
  if (text === '/start') {
    const remaining = await sessionManager.getRemainingGenerations(userId, username);
    const used = await sessionManager.getUsedGenerations(userId, username);
    
    await bot.sendMessage(
      chatId, 
      `🎭 Welcome to Futardio Mask Bot!

Send me a photo with a face and I'll apply a Futardio mask to it automatically.

📊 Generations: ${used}/5 used (${remaining} remaining)

Just drop your image here to get started! 📸`
    );
    await sessionManager.updateSession(userId, { state: 'waiting_photo' }, username);
    return;
  }

  // Si l'utilisateur envoie une photo, on la traite immédiatement
  if (message.photo) {
    console.log(`[Main] Photo received from user ${userId} (@${username || 'no_username'}), checking limit...`);
    
    // Vérifier si l'utilisateur a atteint la limite
    if (await sessionManager.hasReachedLimit(userId, username)) {
      const used = await sessionManager.getUsedGenerations(userId, username);
      console.log(`[Main] User ${userId} (@${username || 'no_username'}) has reached limit (${used}/5), sending limit message`);
      
      await bot.sendMessage(
        chatId,
        `🚫 You have reached the maximum limit of ${used}/5 image generations.\n\nThank you for using Futardio Mask Bot!`
      );
      return;
    }

    console.log(`[Main] User ${userId} (@${username || 'no_username'}) has not reached limit, proceeding with photo upload...`);
    await handlePhotoUpload(message, bot, openai, sessionManager, imageComposer, chatId, userId, username);
    return;
  }

  // Pour tout autre message, on rappelle gentiment ce qu'on attend
  if (text === '/help') {
    const remaining = await sessionManager.getRemainingGenerations(userId, username);
    const used = await sessionManager.getUsedGenerations(userId, username);
    
    await bot.sendMessage(
      chatId,
      `🎭 Futardio Mask Bot Help

Send me a photo with a face and I'll add the Futardio mask to it automatically.

📊 Your usage: ${used}/5 generations used (${remaining} remaining)

Commands:
/start - Welcome message
/help - This help message  
/status - Check remaining generations`
    );
    return;
  }

  if (text === '/status') {
    const remaining = await sessionManager.getRemainingGenerations(userId, username);
    const used = await sessionManager.getUsedGenerations(userId, username);
    
    await bot.sendMessage(
      chatId,
      `📊 Your Generation Status:

Used: ${used}/5 generations
Remaining: ${remaining} generations

${remaining > 0 ? 'Send me a photo to generate a masked image!' : '🚫 You have reached the maximum limit.'}`
    );
    return;
  }

  // Message par défaut simplifié
  await bot.sendMessage(chatId, "Send me your image.");
  await sessionManager.updateSession(userId, { state: 'waiting_photo' }, username);
}

async function handlePhotoUpload(
  message: TelegramMessage,
  bot: TelegramBot,
  openai: OpenAIService,
  sessionManager: SessionManager,
  imageComposer: ImageComposer,
  chatId: number,
  userId: number,
  username?: string
): Promise<void> {
  try {
    // Marquer comme en cours de traitement
    await sessionManager.updateSession(userId, { state: 'processing' }, username);

    // Message de traitement minimal et rassurant
    await bot.sendMessage(chatId, '⏳ Processing...');

    // Obtenir la photo de la meilleure qualité
    const photos = message.photo!;
    const bestPhoto = photos[photos.length - 1];

    // Obtenir les informations du fichier
    const fileInfo = await bot.getFile(bestPhoto.file_id);
    
    if (!fileInfo.ok) {
      throw new Error('Unable to get file information');
    }

    // Télécharger la photo
    const imageBuffer = await bot.downloadFile(fileInfo.result.file_path);

    await bot.sendMessage(chatId, `🎭 Applying Futardio Mask...`);

    // Créer un prompt détaillé pour la génération d'image
    const generationPrompt = `INSTRUCTIONS: Create a merge of this character wearing the mask..

FUSION REQUIREMENTS:
- Seamlessly blend the mask with the person's facial contours
- Maintain the original lighting and shadows from the photo
- Preserve hair, ears, and lower face visibility
- Ensure the mask follows the face's natural curves and angles
- Ensure that the mask fit well the face and if needed out it behind the hair if some are on the face
- The result should look like the person is actually wearing the mask
It can be non-human character so keep the same color as the original image, the same body, everything should be the same. You just merge the mask on the character.
Generate the same image where the mask appears naturally applied to this specific person's face. The style should match the original photo exactly.
Do not change the original photo style, color or body and juste merge the mask on the character. Do not add anything else.`;

    // Envoyer les 2 images (utilisateur + masque 1) à gpt-image-1
    const generatedImage = await openai.generateFusedImageFromComposite(imageBuffer, generationPrompt);

    // Envoyer l'image générée
    await bot.sendPhoto(chatId, generatedImage);

    console.log(`[Main] Image sent successfully for user ${userId} (@${username || 'no_username'}), now incrementing generations...`);
    
    // Incrémenter le compteur de générations
    await sessionManager.incrementGenerations(userId, username);
    
    console.log(`[Main] Generations incremented for user ${userId} (@${username || 'no_username'}), getting new counts...`);
    
    const remaining = await sessionManager.getRemainingGenerations(userId, username);
    const used = await sessionManager.getUsedGenerations(userId, username);

    console.log(`[Main] Final counts for user ${userId} (@${username || 'no_username'}): used=${used}, remaining=${remaining}`);

    // Message avec le statut des générations restantes
    if (remaining > 0) {
      await bot.sendMessage(chatId, `✨ Futardio mask applied! 

📊 Generations: ${used}/5 used (${remaining} remaining)

Send me another image if you want to try again!`);
    } else {
      await bot.sendMessage(chatId, `✨ Futardio mask applied! 

🚫 You have used all 5 generations. Thank you for using Futardio Mask Bot!`);
    }

    // Réinitialiser pour permettre une nouvelle photo immédiatement
    await sessionManager.updateSession(userId, { state: 'waiting_photo' }, username);

  } catch (error) {
    console.error('Error processing photo:', error);
    
    await bot.sendMessage(
      chatId,
      "Sorry, something went wrong. Please try with another image."
    );

    // Réinitialiser en cas d'erreur pour permettre une nouvelle tentative
    await sessionManager.updateSession(userId, { state: 'waiting_photo' }, username);
  }
}
