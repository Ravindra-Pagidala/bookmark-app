import { Bookmark, BookmarkCreate } from '../types';
import { supabase } from './supabase';
import { logger } from './utils/logger';

export class BookmarkRepository {
  private static instance: BookmarkRepository | null = null;

  private constructor() {}

  public static getInstance(): BookmarkRepository {
    if (!BookmarkRepository.instance) {
      BookmarkRepository.instance = new BookmarkRepository();
    }
    return BookmarkRepository.instance;
  }

  async create(data: BookmarkCreate): Promise<Bookmark> {
    try {
      logger.debug('Creating bookmark', { title: data.title.substring(0, 50) });
      
      // Input validation
      const title = (data.title || '').trim();
      const url = (data.url || '').trim();
      
      if (!title || title.length < 1 || title.length > 500) {
        throw new Error('Title must be 1-500 characters');
      }
      
      if (!url || url.length < 5 || url.length > 2000) {
        throw new Error('URL must be 5-2000 characters');
      }
      
      if (!this.isValidUrl(url)) {
        throw new Error('Invalid URL format');
      }

      const { data: result, error } = await supabase
        .from('bookmarks')
        .insert([{ title, url }])
        .select()
        .single()
        .throwOnError();

      if (!result) {
        throw new Error('Bookmark creation failed - no data returned');
      }

      logger.info('Bookmark created', { id: result.id });
      return result;
    } catch (error) {
      logger.error('BookmarkRepository.create failed', error);
      throw error instanceof Error ? error : new Error('Failed to create bookmark');
    }
  }

  async getByUser(userId: string): Promise<Bookmark[]> {
    try {
      logger.debug('Fetching bookmarks', { userId: userId.substring(0, 8) + '...' });
      
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch bookmarks', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('BookmarkRepository.getByUser failed', error);
      return [];
    }
  }

  async delete(id: number, userId: string): Promise<boolean> {
    try {
      logger.debug('Deleting bookmark', { id, userId: userId.substring(0, 8) + '...' });
      
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        logger.error('Delete failed', error);
        return false;
      }

      logger.info('Bookmark deleted', { id });
      return true;
    } catch (error) {
      logger.error('BookmarkRepository.delete failed', error);
      return false;
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  }
}

export const bookmarkRepo = BookmarkRepository.getInstance();
