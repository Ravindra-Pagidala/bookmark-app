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
  user_id: string;
}

export interface User {
  id: string;
  email: string;
  user_metadata?: {
    avatar_url?: string;
    full_name?: string;
  };
}