// DTOs - Enterprise TypeScript interfaces
export interface Bookmark {
  id: number;
  user_id: string;
  title: string;
  url: string;
  created_at: string;
}

export interface BookmarkCreate {
  title: string;
  url: string;
}

export interface User {
  id: string;
  email: string;
  user_metadata?: {
    avatar_url?: string;
    full_name?: string;
  };
}

export interface DatabaseError {
  message: string;
  code?: string;
  details?: string;
}

export type ApiResponse<T> = {
  data: T | null;
  error: DatabaseError | null;
};
