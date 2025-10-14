import { UserSession } from './types';

export class SessionManager {
  private sessions: Map<number, UserSession> = new Map();

  // Obtenir la session d'un utilisateur
  getSession(userId: number): UserSession {
    if (!this.sessions.has(userId)) {
      this.sessions.set(userId, {
        state: 'idle'
      });
    }
    return this.sessions.get(userId)!;
  }

  // Mettre à jour la session d'un utilisateur
  updateSession(userId: number, updates: Partial<UserSession>): void {
    const session = this.getSession(userId);
    Object.assign(session, updates);
    this.sessions.set(userId, session);
  }

  // Réinitialiser la session d'un utilisateur
  resetSession(userId: number): void {
    this.sessions.set(userId, {
      state: 'idle'
    });
  }

  // Vérifier si l'utilisateur est en train de télécharger une photo
  isWaitingForPhoto(userId: number): boolean {
    const session = this.getSession(userId);
    return session.state === 'waiting_photo';
  }

  // Vérifier si l'utilisateur est en cours de traitement
  isProcessing(userId: number): boolean {
    const session = this.getSession(userId);
    return session.state === 'processing';
  }
}
