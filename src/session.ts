import { UserSession } from './types';

export class SessionManager {
  private readonly MAX_GENERATIONS = 5; // Limite maximum de générations par utilisateur
  private kv: KVNamespace;

  constructor(kv: KVNamespace) {
    this.kv = kv;
    console.log('[SessionManager] Initialized with KV storage for persistence');
  }

  // Obtenir la session d'un utilisateur
  async getSession(userId: number, username?: string): Promise<UserSession> {
    const userKey = username ? `@${username}` : `user_id:${userId}`;
    console.log(`[SessionManager] Getting session for ${userKey} from KV`);
    
    const sessionKey = `user:${userKey}:session`;
    const sessionData = await this.kv.get(sessionKey);
    
    if (!sessionData) {
      console.log(`[SessionManager] Creating new session for ${userKey}`);
      const newSession: UserSession = {
        state: 'idle',
        generationsUsed: 0
      };
      await this.kv.put(sessionKey, JSON.stringify(newSession));
      console.log(`[SessionManager] New session saved to KV for ${userKey}:`, JSON.stringify(newSession));
      return newSession;
    }
    
    const session = JSON.parse(sessionData) as UserSession;
    console.log(`[SessionManager] Loaded session from KV for ${userKey}:`, JSON.stringify(session));
    return session;
  }

  // Mettre à jour la session d'un utilisateur
  async updateSession(userId: number, updates: Partial<UserSession>, username?: string): Promise<void> {
    const userKey = username ? `@${username}` : `user_id:${userId}`;
    console.log(`[SessionManager] Updating session for ${userKey} with:`, JSON.stringify(updates));
    
    const session = await this.getSession(userId, username);
    const oldSession = { ...session };
    Object.assign(session, updates);
    
    const sessionKey = `user:${userKey}:session`;
    await this.kv.put(sessionKey, JSON.stringify(session));
    
    console.log(`[SessionManager] Session updated in KV for ${userKey}:`);
    console.log(`  Before:`, JSON.stringify(oldSession));
    console.log(`  After:`, JSON.stringify(session));
  }

  // Réinitialiser la session d'un utilisateur
  async resetSession(userId: number, username?: string): Promise<void> {
    const userKey = username ? `@${username}` : `user_id:${userId}`;
    const newSession: UserSession = {
      state: 'idle',
      generationsUsed: 0
    };
    
    const sessionKey = `user:${userKey}:session`;
    await this.kv.put(sessionKey, JSON.stringify(newSession));
    console.log(`[SessionManager] Session reset in KV for ${userKey}`);
  }

  // Vérifier si l'utilisateur est en train de télécharger une photo
  async isWaitingForPhoto(userId: number, username?: string): Promise<boolean> {
    const session = await this.getSession(userId, username);
    return session.state === 'waiting_photo';
  }

  // Vérifier si l'utilisateur est en cours de traitement
  async isProcessing(userId: number, username?: string): Promise<boolean> {
    const session = await this.getSession(userId, username);
    return session.state === 'processing';
  }

  // Vérifier si l'utilisateur a atteint la limite de générations
  async hasReachedLimit(userId: number, username?: string): Promise<boolean> {
    const userKey = username ? `@${username}` : `user_id:${userId}`;
    const session = await this.getSession(userId, username);
    const used = session.generationsUsed || 0;
    const hasReached = used >= this.MAX_GENERATIONS;
    
    console.log(`[SessionManager] Checking limit for ${userKey}:`);
    console.log(`  Generations used: ${used}`);
    console.log(`  Max generations: ${this.MAX_GENERATIONS}`);
    console.log(`  Has reached limit: ${hasReached}`);
    
    return hasReached;
  }

  // Incrémenter le compteur de générations
  async incrementGenerations(userId: number, username?: string): Promise<void> {
    const userKey = username ? `@${username}` : `user_id:${userId}`;
    console.log(`[SessionManager] Incrementing generations for ${userKey}`);
    
    const session = await this.getSession(userId, username);
    const oldUsed = session.generationsUsed || 0;
    session.generationsUsed = oldUsed + 1;
    
    const sessionKey = `user:${userKey}:session`;
    await this.kv.put(sessionKey, JSON.stringify(session));
    
    console.log(`[SessionManager] Generations incremented in KV for ${userKey}:`);
    console.log(`  Before: ${oldUsed}`);
    console.log(`  After: ${session.generationsUsed}`);
    console.log(`  Session after increment:`, JSON.stringify(session));
  }

  // Obtenir le nombre de générations restantes
  async getRemainingGenerations(userId: number, username?: string): Promise<number> {
    const userKey = username ? `@${username}` : `user_id:${userId}`;
    const session = await this.getSession(userId, username);
    const used = session.generationsUsed || 0;
    const remaining = Math.max(0, this.MAX_GENERATIONS - used);
    
    console.log(`[SessionManager] Getting remaining generations for ${userKey}:`);
    console.log(`  Used: ${used}, Max: ${this.MAX_GENERATIONS}, Remaining: ${remaining}`);
    
    return remaining;
  }

  // Obtenir le nombre de générations utilisées
  async getUsedGenerations(userId: number, username?: string): Promise<number> {
    const userKey = username ? `@${username}` : `user_id:${userId}`;
    const session = await this.getSession(userId, username);
    const used = session.generationsUsed || 0;
    
    console.log(`[SessionManager] Getting used generations for ${userKey}: ${used}`);
    
    return used;
  }
}
