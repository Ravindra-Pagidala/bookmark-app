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

  const fetchBookmarks = useCallback(async () => {
    if (!userId) { setBookmarks([]); return; }
    try {
      setLoading(true);
      setError(null);
      const data = await bookmarkRepo.getByUser(userId);
      setBookmarks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookmarks');
      logger.error('fetchBookmarks failed', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) { setSubscribed(false); return; }

    fetchBookmarks();

    const channel = supabase
      .channel(`bookmarks:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookmarks',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        logger.debug('Realtime event', { type: payload.eventType });
        switch (payload.eventType) {
          case 'INSERT':
            setBookmarks(prev => {
              // Avoid duplicates if optimistic insert already in list
              const exists = prev.some(b => b.id === (payload.new as Bookmark).id);
              if (exists) return prev;
              return [payload.new as Bookmark, ...prev];
            });
            break;
          case 'UPDATE':
            setBookmarks(prev => prev.map(b =>
              b.id === (payload.new as Bookmark).id ? (payload.new as Bookmark) : b
            ));
            break;
          case 'DELETE':
            setBookmarks(prev => prev.filter(b => b.id !== (payload.old as Bookmark).id));
            break;
        }
      })
      .subscribe(status => {
        setSubscribed(status === 'SUBSCRIBED');
        if (status !== 'SUBSCRIBED') logger.warn('Realtime status', { status });
      });

    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchBookmarks]);

  //  pass user_id to repo so RLS INSERT policy passes
  //  capture optimisticId at creation time, not in catch block
  const addBookmark = async (data: { title: string; url: string }) => {
    if (!userId) throw new Error('Not authenticated');

    setError(null);
    const optimisticId = Date.now(); // ← captured once, used consistently

    const optimisticBookmark: Bookmark = {
      id: optimisticId,
      user_id: userId,
      title: data.title,
      url: data.url,
      created_at: new Date().toISOString(),
    };

    setBookmarks(prev => [optimisticBookmark, ...prev]);

    try {
      // ✅ Pass user_id so the DB insert includes it → RLS check passes
      const newBookmark = await bookmarkRepo.create({ ...data, user_id: userId });

      // Replace optimistic entry with real DB row
      setBookmarks(prev => prev.map(b => b.id === optimisticId ? newBookmark : b));

      logger.info('Bookmark added', { id: newBookmark.id });
      return newBookmark;
    } catch (err) {
      // ✅ FIX: revert using captured optimisticId, not a fresh Date.now()
      setBookmarks(prev => prev.filter(b => b.id !== optimisticId));
      const msg = err instanceof Error ? err.message : 'Failed to add bookmark';
      setError(msg);
      logger.error('addBookmark failed', err);
      throw err;
    }
  };

  const deleteBookmark = async (id: number) => {
    if (!userId) return false;
    const snapshot = [...bookmarks];
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