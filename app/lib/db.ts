import { supabase } from './supabase';
import { logger } from './utils/logger';
import type { Bookmark, BookmarkCreate } from '../types';

export class BookmarkRepository {
  private static instance: BookmarkRepository | null = null;

  private constructor() {}

  static getInstance(): BookmarkRepository {
    if (!BookmarkRepository.instance) BookmarkRepository.instance = new BookmarkRepository();
    return BookmarkRepository.instance;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  }

  // ✅ FIX: accepts user_id in data so RLS WITH CHECK (user_id = auth.uid()) passes
  async create(data: BookmarkCreate): Promise<Bookmark> {
    const title = data.title.trim();
    const url = data.url.trim();
    const user_id = data.user_id;

    if (!title || title.length > 500) throw new Error('Title must be 1–500 characters');
    if (!url || url.length > 2000) throw new Error('URL is too long');
    if (!this.isValidUrl(url)) throw new Error('Please enter a valid URL (e.g. https://example.com)');
    if (!user_id) throw new Error('Not authenticated');

    logger.debug('Creating bookmark', { title: title.substring(0, 40) });

    const { data: result, error } = await supabase
      .from('bookmarks')
      .insert([{ title, url, user_id }])  // ← user_id included so RLS passes
      .select()
      .single();

    if (error) {
      logger.error('BookmarkRepository.create failed', error);
      throw error;
    }
    if (!result) throw new Error('No data returned from insert');

    logger.info('Bookmark created', { id: result.id });
    return result;
  }

  async getByUser(userId: string): Promise<Bookmark[]> {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('getByUser failed', error);
      throw error;
    }
    return data ?? [];
  }

  async delete(id: number, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      logger.error('delete failed', error);
      return false;
    }
    return true;
  }
}

export const bookmarkRepo = BookmarkRepository.getInstance();