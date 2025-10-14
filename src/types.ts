// Types pour l'environnement Cloudflare Workers
export interface Env {
  TELEGRAM_BOT_TOKEN: string;
  OPENAI_API_KEY: string;
  FUTARDIO_MASKS: R2Bucket;
}

// Types pour les messages Telegram
export interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username?: string;
  };
  chat: {
    id: number;
    type: string;
  };
  date: number;
  text?: string;
  photo?: TelegramPhoto[];
}

export interface TelegramPhoto {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export interface TelegramCallbackQuery {
  id: string;
  from: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username?: string;
  };
  message?: TelegramMessage;
  data?: string;
}

// Types pour l'API OpenAI
export interface OpenAIImageRequest {
  prompt: string;
  model: string;
  size: string;
  quality: string;
  n: number;
}

export interface OpenAIImageResponse {
  data: Array<{
    url: string;
  }>;
}

// États du bot pour chaque utilisateur
export interface UserSession {
  state: 'waiting_photo' | 'processing' | 'idle';
  uploaded_photo?: string;
  mask_image?: string;
}
