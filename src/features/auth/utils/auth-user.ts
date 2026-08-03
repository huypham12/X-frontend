import type { User } from '../stores/auth.store';

const isOptionalString = (value: unknown): value is string | undefined =>
  value === undefined || typeof value === 'string';

const isOptionalNumber = (value: unknown): value is number | undefined =>
  value === undefined || typeof value === 'number';

const isAuthenticatedUser = (value: unknown): value is User => {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate._id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.email === 'string' &&
    typeof candidate.username === 'string' &&
    isOptionalString(candidate.avatar) &&
    isOptionalString(candidate.cover_photo) &&
    isOptionalString(candidate.bio) &&
    isOptionalNumber(candidate.verify) &&
    isOptionalNumber(candidate.tweet_count) &&
    isOptionalNumber(candidate.follower_count) &&
    isOptionalNumber(candidate.following_count)
  );
};

export const getAuthenticatedUser = (data: unknown): User | null => {
  if (!Array.isArray(data)) return null;
  const currentUser = data[0];
  return isAuthenticatedUser(currentUser) ? currentUser : null;
};
