import { Env } from './types';

export class TelegramBot {
  private token: string;
  private baseUrl: string;

  constructor(token: string) {
    this.token = token;
    this.baseUrl = `https://api.telegram.org/bot${token}`;
  }

  // Envoyer un message texte
  async sendMessage(chatId: number, text: string, replyMarkup?: any): Promise<any> {
    const payload = {
      chat_id: chatId,
      text: text,
      reply_markup: replyMarkup
    };

    const response = await fetch(`${this.baseUrl}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return response.json();
  }

  // Envoyer une photo
  async sendPhoto(chatId: number, photo: string | ArrayBuffer, caption?: string): Promise<any> {
    // Si c'est un ArrayBuffer, utiliser FormData
    if (photo instanceof ArrayBuffer) {
      const formData = new FormData();
      formData.append('chat_id', chatId.toString());
      
      const photoBlob = new Blob([photo], { type: 'image/png' });
      formData.append('photo', photoBlob, 'generated-image.png');
      
      if (caption) {
        formData.append('caption', caption);
      }

      const response = await fetch(`${this.baseUrl}/sendPhoto`, {
        method: 'POST',
        body: formData,
      });

      return response.json();
    }
    
    // Si c'est une string (URL ou file_id), utiliser JSON
    const payload = {
      chat_id: chatId,
      photo: photo,
      caption: caption
    };

    const response = await fetch(`${this.baseUrl}/sendPhoto`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return response.json();
  }

  // Obtenir le fichier depuis Telegram
  async getFile(fileId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/getFile?file_id=${fileId}`);
    return response.json();
  }

  // Télécharger le fichier depuis Telegram
  async downloadFile(filePath: string): Promise<ArrayBuffer> {
    const response = await fetch(`https://api.telegram.org/file/bot${this.token}/${filePath}`);
    return response.arrayBuffer();
  }

  // Répondre à un callback query
  async answerCallbackQuery(callbackQueryId: string, text?: string): Promise<any> {
    const payload = {
      callback_query_id: callbackQueryId,
      text: text
    };

    const response = await fetch(`${this.baseUrl}/answerCallbackQuery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return response.json();
  }

  // Créer un clavier inline simple (optionnel, non utilisé dans le flux principal)
  createInlineKeyboard(buttons: Array<Array<{text: string, callback_data: string}>>): any {
    return {
      inline_keyboard: buttons
    };
  }
}
