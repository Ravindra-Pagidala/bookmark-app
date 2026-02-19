import { supabase } from './supabase';
import { logger } from './utils/logger';
import type { User } from '../types';

export class AuthService {
  static async signInWithGoogle(): Promise<void> {
    if (typeof window === 'undefined') throw new Error('Google OAuth only available in browser');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/bookmarks` },
    });

    if (error) {
      logger.error('Google OAuth failed', error);
      throw error;
    }
  }

  static async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      logger.error('Sign out failed', error);
      throw error;
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return null;
      return {
        id: user.id,
        email: user.email ?? '',
        user_metadata: user.user_metadata ?? {},
      };
    } catch (err) {
      logger.error('getCurrentUser failed', err);
      return null;
    }
  }
}