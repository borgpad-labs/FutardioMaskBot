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
      const sessionManager = new SessionManager();
      const imageComposer = new ImageComposer();

      // Parser le body de la requête
      const update: TelegramUpdate = await request.json();
      
      if (update.message) {
        await handleMessage(update.message, bot, openai, sessionManager, imageComposer);
      } else if (update.callback_query) {
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
  sessionManager.updateSession(userId, { state: 'waiting_photo' });
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
  const text = message.text;

  // Expérience simplifiée : au démarrage, on attend directement une photo
  if (text === '/start') {
    await bot.sendMessage(
      chatId, 
      `🎭 Welcome to Futardio Mask Bot!

Send me a photo with a face and I'll apply a Futardio mask to it automatically.

Just drop your image here to get started! 📸`
    );
    sessionManager.updateSession(userId, { state: 'waiting_photo' });
    return;
  }

  // Si l'utilisateur envoie une photo, on la traite immédiatement
  if (message.photo) {
    await handlePhotoUpload(message, bot, openai, sessionManager, imageComposer, chatId, userId);
    return;
  }

  // Pour tout autre message, on rappelle gentiment ce qu'on attend
  if (text === '/help') {
    await bot.sendMessage(
      chatId,
      `Send me a photo with a face and I'll add the Futardio mask to it automatically.`
    );
    return;
  }

  // Message par défaut simplifié
  await bot.sendMessage(chatId, "Send me your image.");
  sessionManager.updateSession(userId, { state: 'waiting_photo' });
}

async function handlePhotoUpload(
  message: TelegramMessage,
  bot: TelegramBot,
  openai: OpenAIService,
  sessionManager: SessionManager,
  imageComposer: ImageComposer,
  chatId: number,
  userId: number
): Promise<void> {
  try {
    // Marquer comme en cours de traitement
    sessionManager.updateSession(userId, { state: 'processing' });

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
    const generationPrompt = `INSTRUCTIONS: Create a merge of this person wearing the mask..

FUSION REQUIREMENTS:
- Seamlessly blend the mask with the person's facial contours
- Maintain the original lighting and shadows from the photo
- Preserve hair, ears, and lower face visibility
- Ensure the mask follows the face's natural curves and angles
- Ensure that the mask fit well the face and if needed out it behind the hair if some are on the face
- The result should look like the person is actually wearing the mask

Generate the same image where the mask appears naturally applied to this specific person's face. The style should match the original photo exactly.
Do not change the original photo style and juste merge the mask on the person. Do not add anything else or create a realistic version of the photo or the person.`;

    // Envoyer les 2 images (utilisateur + masque 1) à gpt-image-1
    const generatedImages = await openai.generateFusedImageFromComposite(imageBuffer, generationPrompt);

    // Envoyer toutes les images générées
    await bot.sendMessage(chatId, `🎨 Generated ${generatedImages.length} variations:`);
    
    for (let i = 0; i < generatedImages.length; i++) {
      await bot.sendPhoto(chatId, generatedImages[i]);
    }

    // Message simple pour encourager à recommencer
    await bot.sendMessage(chatId, `✨ Futardio mask applied! Send me another image if you want to try again!`);

    // Réinitialiser pour permettre une nouvelle photo immédiatement
    sessionManager.updateSession(userId, { state: 'waiting_photo' });

  } catch (error) {
    console.error('Error processing photo:', error);
    
    await bot.sendMessage(
      chatId,
      "Sorry, something went wrong. Please try with another image."
    );

    // Réinitialiser en cas d'erreur pour permettre une nouvelle tentative
    sessionManager.updateSession(userId, { state: 'waiting_photo' });
  }
}
