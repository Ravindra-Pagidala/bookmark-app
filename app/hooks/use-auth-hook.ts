// Authentication Hook - Enterprise Auth State Management
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AuthService } from '../lib/auth';
import { logger } from '../lib/utils/logger';
import type { User } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state + realtime listener
  useEffect(() => {
    logger.debug('Auth hook initializing');

    const initializeAuth = async () => {
      try {
        setLoading(true);
        const currentUser = await AuthService.getCurrentUser();
        setUser(currentUser);
        logger.debug('Auth state loaded', { userId: currentUser?.id });
      } catch (err) {
        logger.error('Auth initialization failed', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes (login/logout) - FIXED
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        logger.info('Auth state changed', { event });
        
        if (event === 'SIGNED_IN') {
          // FIXED: Proper session.user typing
          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              user_metadata: session.user.user_metadata || {},
            });
            setError(null);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setError(null);
        } else if (event === 'TOKEN_REFRESHED') {
          // Refresh user data
          initializeAuth();
        }
      }
    );

    return () => {
      logger.debug('Cleaning up auth subscription');
      subscription?.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      await AuthService.signInWithGoogle();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google login failed';
      setError(message);
      logger.error('Google sign in failed', err);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await AuthService.signOut();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign out failed';
      setError(message);
      logger.error('Sign out failed', err);
    }
  };

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user,
  };
}
