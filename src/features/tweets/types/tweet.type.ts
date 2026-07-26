export interface TweetAuthor {
  _id?: string;
  avatar?: string;
  name?: string;
  username?: string;
}

export interface Tweet {
  _id: string;
  parent_tweet?: Tweet;
  like_count?: number;
  bookmark_count?: number;
  retweet_count?: number;
  reply_count?: number;
  user_views?: number;
  guest_views?: number;
  is_liked?: boolean;
  is_bookmarked?: boolean;
  is_retweeted?: boolean;
  content?: string;
  created_at?: string;
  medias_info?: MediaMetadata[];
  author?: TweetAuthor;
  audience?: number;
  type?: number;
  user_id?: string;
}

export interface TweetPage {
  tweets: Tweet[];
  has_next_page?: boolean;
  next_cursor?: string;
}
import type { MediaMetadata } from '@/features/media/types/media.type';
