import { ChatWindow } from '@/features/conversations/components/chat-window';

export default async function ConversationPage(props: { params: Promise<{ conversationId: string }> }) {
  const params = await props.params;
  return <ChatWindow conversationId={params.conversationId} />;
}
