'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { bookmarkRepo } from '../lib/db';
import { logger } from '../lib/utils/logger';
import type { Bookmark } from '../types';

export function useBookmarks(userId: string | null) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);

  // Keep a stable ref so realtime handlers always have latest bookmarks
  // without needing to be in the dependency array (avoids subscription thrash)
  const bookmarksRef = useRef<Bookmark[]>([]);
  bookmarksRef.current = bookmarks;

  const fetchBookmarks = useCallback(async () => {
    if (!userId) { setBookmarks([]); return; }
    try {
      setLoading(true);
      setError(null);
      const data = await bookmarkRepo.getByUser(userId);
      setBookmarks(data);
      logger.info('Bookmarks fetched', { count: data.length });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookmarks');
      logger.error('fetchBookmarks failed', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setSubscribed(false);
      setBookmarks([]);
      return;
    }

    // Initial fetch
    fetchBookmarks();

    // Use a unique channel name per user + timestamp to avoid
    // stale channel reuse issues across hot-reloads / re-mounts
    const channelName = `bookmarks-private-${userId}`;   // stable per user;

    logger.info('Opening realtime channel', { channelName });

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          logger.info('Realtime INSERT received', { id: (payload.new as Bookmark).id });
          const incoming = payload.new as Bookmark;
          setBookmarks(prev => {
            // Deduplicate: real row may replace our optimistic entry
            // Optimistic entries have numeric Date.now() IDs (13 digits)
            // Real DB rows have BIGSERIAL IDs (much smaller numbers)
            // So we remove any optimistic entry with same url+title, then prepend real row
            const withoutOptimistic = prev.filter(b => {
              const isOptimistic = b.id > 9_000_000_000_000; // 13-digit timestamp
              return !(isOptimistic && b.url === incoming.url && b.title === incoming.title);
            });
            // Also guard against exact ID duplicate
            if (withoutOptimistic.some(b => b.id === incoming.id)) return withoutOptimistic;
            return [incoming, ...withoutOptimistic];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          logger.info('Realtime UPDATE received', { id: (payload.new as Bookmark).id });
          setBookmarks(prev =>
            prev.map(b => b.id === (payload.new as Bookmark).id ? (payload.new as Bookmark) : b)
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          logger.info('Realtime DELETE received', { id: (payload.old as Bookmark).id });
          setBookmarks(prev => prev.filter(b => b.id !== (payload.old as Bookmark).id));
        }
      )
      .subscribe((status, err) => {
        logger.info('Realtime subscription status', { status, err });
        if (status === 'SUBSCRIBED') {
          setSubscribed(true);
          logger.info('Realtime subscribed successfully');
        } else if (status === 'CHANNEL_ERROR') {
          setSubscribed(false);
          logger.error('Realtime channel error', err);
        } else if (status === 'TIMED_OUT') {
          setSubscribed(false);
          logger.error('Realtime timed out');
        } else if (status === 'CLOSED') {
          setSubscribed(false);
          logger.warn('Realtime channel closed');
        }
      });

    return () => {
      logger.info('Removing realtime channel', { channelName });
      supabase.removeChannel(channel);
      setSubscribed(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // ← intentionally exclude fetchBookmarks to prevent re-subscription on every render

  const addBookmark = async (data: { title: string; url: string }) => {
    if (!userId) throw new Error('Not authenticated');

    setError(null);
    const optimisticId = Date.now();

    const optimisticBookmark: Bookmark = {
      id: optimisticId,
      user_id: userId,
      title: data.title,
      url: data.url,
      created_at: new Date().toISOString(),
    };

    setBookmarks(prev => [optimisticBookmark, ...prev]);

    try {
      const newBookmark = await bookmarkRepo.create({ ...data, user_id: userId });
      // Replace optimistic entry with real DB row
      setBookmarks(prev => prev.map(b => b.id === optimisticId ? newBookmark : b));
      logger.info('Bookmark added', { id: newBookmark.id });
      return newBookmark;
    } catch (err) {
      setBookmarks(prev => prev.filter(b => b.id !== optimisticId));
      const msg = err instanceof Error ? err.message : 'Failed to add bookmark';
      setError(msg);
      logger.error('addBookmark failed', err);
      throw err;
    }
  };

  const deleteBookmark = async (id: number) => {
    if (!userId) return false;
    const snapshot = [...bookmarksRef.current];
    setBookmarks(prev => prev.filter(b => b.id !== id));
    try {
      const ok = await bookmarkRepo.delete(id, userId);
      if (!ok) { setBookmarks(snapshot); return false; }
      logger.info('Bookmark deleted', { id });
      return true;
    } catch (err) {
      setBookmarks(snapshot);
      const msg = err instanceof Error ? err.message : 'Delete failed';
      setError(msg);
      logger.error('deleteBookmark failed', err);
      return false;
    }
  };

  return { bookmarks, loading, error, subscribed, addBookmark, deleteBookmark, refetch: fetchBookmarks };
}