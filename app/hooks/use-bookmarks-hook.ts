// Business logic for bookmarks + REALTIME subscriptions
'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { bookmarkRepo } from '../lib/db';
import { logger } from '../lib/utils/logger';
import type { Bookmark } from '../types';

export function useBookmarks(userId: string | null) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);

  // Load bookmarks (initial fetch)
  const fetchBookmarks = useCallback(async () => {
    if (!userId) {
      setBookmarks([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      logger.debug('Fetching bookmarks for user', { userId });
      
      const fetchedBookmarks = await bookmarkRepo.getByUser(userId);
      setBookmarks(fetchedBookmarks);
      logger.info('Bookmarks loaded', { count: fetchedBookmarks.length });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load bookmarks';
      setError(message);
      logger.error('Failed to fetch bookmarks', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Setup realtime subscription
  useEffect(() => {
    if (!userId) {
      logger.debug('No user ID - clearing subscription');
      setSubscribed(false);
      return;
    }

    logger.info('Setting up realtime subscription', { userId });
    
    // Initial load
    fetchBookmarks();

    // Realtime subscription
    const channel = supabase
      .channel('bookmarks-channel')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          logger.debug('Realtime bookmark change', { payload });
          
          switch (payload.eventType) {
            case 'INSERT':
              setBookmarks((prev) => [payload.new as Bookmark, ...prev]);
              break;
            case 'UPDATE':
              setBookmarks((prev) =>
                prev.map((bookmark) =>
                  bookmark.id === (payload.new as Bookmark).id
                    ? (payload.new as Bookmark)
                    : bookmark
                )
              );
              break;
            case 'DELETE':
              setBookmarks((prev) =>
                prev.filter((bookmark) => bookmark.id !== (payload.old as Bookmark).id)
              );
              break;
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('Realtime subscription active');
          setSubscribed(true);
        } else {
          logger.warn('Subscription status changed', { status });
        }
      });

    return () => {
      logger.debug('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [userId, fetchBookmarks]);

  // Add bookmark (optimistic UI)
  const addBookmark = async (data: { title: string; url: string }) => {
    try {
      setError(null);
      
      // Optimistic update
      const optimisticBookmark: Bookmark = {
        id: Date.now(), // Temporary ID
        user_id: userId!,
        ...data,
        created_at: new Date().toISOString(),
      };
      
      setBookmarks((prev) => [optimisticBookmark, ...prev]);
      
      // Real database call
      const newBookmark = await bookmarkRepo.create(data);
      
      // Replace optimistic with real bookmark
      setBookmarks((prev) =>
        prev.map((b) => (b.id === optimisticBookmark.id ? newBookmark : b))
      );
      
      logger.info('Bookmark added', { id: newBookmark.id });
      return newBookmark;
    } catch (err) {
      // Revert optimistic update
      setBookmarks((prev) => prev.filter((b) => b.id !== Date.now()));
      
      const message = err instanceof Error ? err.message : 'Failed to add bookmark';
      setError(message);
      logger.error('Add bookmark failed', err);
      throw err;
    }
  };

  // Delete bookmark (optimistic)
  const deleteBookmark = async (id: number) => {
    try {
      // Optimistic delete
      const previousBookmarks = [...bookmarks];
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
      
      const success = await bookmarkRepo.delete(id, userId!);
      
      if (!success) {
        // Revert on failure
        setBookmarks(previousBookmarks);
        throw new Error('Failed to delete bookmark');
      }
      
      logger.info('Bookmark deleted', { id });
      return true;
    } catch (err) {
      // Revert optimistic delete
      setBookmarks(bookmarks);
      
      const message = err instanceof Error ? err.message : 'Delete failed';
      setError(message);
      logger.error('Delete bookmark failed', err);
      return false;
    }
  };

  return {
    bookmarks,
    loading,
    error,
    subscribed,
    addBookmark,
    deleteBookmark,
    refetch: fetchBookmarks,
  };
}
