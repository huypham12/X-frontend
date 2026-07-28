export interface GroupConversationLookupItem {
  _id: string;
  name: string;
  avatar_url?: string;
  member_count: number;
  is_hidden: boolean;
}

export interface GroupConversationLookupPage {
  groups: GroupConversationLookupItem[];
  next_cursor: string | null;
  has_next_page: boolean;
}
