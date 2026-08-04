import { MessagesInbox } from '@/features/conversations/components/messages-inbox';
import HomePage from '../home/page';

export default function MessagesPage() {
  return (
    <>
      <MessagesInbox />
      <div className="hidden lg:block">
        <HomePage />
      </div>
    </>
  );
}
