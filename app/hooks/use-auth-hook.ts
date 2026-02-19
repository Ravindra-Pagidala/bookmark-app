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

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const currentUser = await AuthService.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        logger.error('Auth init failed', err);
        setError('Failed to load session');
      } finally {
        setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      logger.info('Auth state changed', { event });
      if (event === 'SIGNED_IN' && session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          user_metadata: session.user.user_metadata ?? {},
        });
        setError(null);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setError(null);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED') {
        init();
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      await AuthService.signInWithGoogle();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google login failed';
      setError(msg);
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      setLoading(true);
      await AuthService.signOut();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign out failed';
      setError(msg);
      setLoading(false);
    }
  };

  return { user, loading, error, signInWithGoogle, signOut, isAuthenticated: !!user };
}