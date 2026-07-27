export interface CreateGroupPayload {
  name: string;
  members: string[];
  avatar_url?: string;
}

export interface CreatedGroupConversation {
  _id: string;
  name: string;
  avatar_url?: string;
}

export interface CreateGroupMutationInput {
  name: string;
  members: string[];
  avatarFile?: File;
}

export interface CreateGroupPartner {
  _id: string;
  name: string;
  username?: string;
  avatar?: string;
}
