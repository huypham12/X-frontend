import { ConversationSidebar } from './conversation-sidebar';

export const MessagesInbox = () => (
  <section
    aria-labelledby="messages-inbox-title"
    className="min-h-full bg-black lg:hidden"
  >
    <h1 id="messages-inbox-title" className="sr-only">
      Messages inbox
    </h1>

    <div className="h-[calc(100dvh_-_6.5rem_-_env(safe-area-inset-bottom))] min-h-[32rem] sm:h-screen">
      <ConversationSidebar />
    </div>
  </section>
);
