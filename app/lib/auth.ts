import { User } from '../types';
import { supabase } from './supabase';
import { logger } from './utils/logger';


export class AuthService {
  static async signInWithGoogle(): Promise<void> {
    try {
      logger.info('Google OAuth initiated');
      
      if (typeof window === 'undefined') {
        throw new Error('Google OAuth only available in browser');
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google' as const,
        options: {
          redirectTo: `${window.location.origin}/bookmarks`,
        },
      });

      if (error) {
        logger.error('Google OAuth failed', error);
        throw error;
      }

      logger.info('Google OAuth success');
    } catch (error) {
      logger.error('AuthService.signInWithGoogle failed', error);
      throw error;
    }
  }

  static async signOut(): Promise<void> {
    try {
      logger.info('User sign out initiated');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        logger.error('Sign out failed', error);
        throw error;
      }
      
      logger.info('User signed out successfully');
    } catch (error) {
      logger.error('AuthService.signOut failed', error);
      throw error;
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        logger.debug('No authenticated user found');
        return null;
      }
      
      return {
        id: user.id,
        email: user.email || '',
        user_metadata: user.user_metadata || {},
      };
    } catch (error) {
      logger.error('AuthService.getCurrentUser failed', error);
      return null;
    }
  }
}
