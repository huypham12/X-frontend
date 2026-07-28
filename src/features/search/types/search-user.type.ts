export interface SearchUser {
  _id: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  is_following?: boolean;
}

export interface SearchUserPage {
  users: SearchUser[];
  next_cursor: string | null;
  has_next_page: boolean;
}

export interface SearchUsersApiResponse {
  data: SearchUserPage;
}
