import { ProfileView } from '@/features/users/components/profile-view';
import { use } from 'react';

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export default function UserProfilePage({ params }: ProfilePageProps) {
  const resolvedParams = use(params);
  let username = resolvedParams.username;
  
  // If user types @username in URL, remove the @ character
  if (username.startsWith('%40')) {
    username = username.substring(3);
  } else if (username.startsWith('@')) {
    username = username.substring(1);
  }

  return <ProfileView username={username} />;
}
