import type { InfiniteData } from '@tanstack/react-query';
import type { Message, PaginationResponse } from '../types';

export type MessageInfiniteData = InfiniteData<
  PaginationResponse<Message>,
  string | undefined
>;

const belongsToOperation = (
  message: Message,
  messageId: string,
  clientMessageId?: string,
) =>
  message._id === messageId ||
  Boolean(clientMessageId && message.client_message_id === clientMessageId);

export const hasCommittedMessage = (
  data: MessageInfiniteData | undefined,
  messageId: string,
  clientMessageId?: string,
) =>
  Boolean(
    data?.pages.some((page) =>
      page.messages.some((message) =>
        belongsToOperation(message, messageId, clientMessageId),
      ),
    ),
  );

export const reconcileSendAcknowledgement = (
  data: MessageInfiniteData | undefined,
  messageId: string,
  clientMessageId: string,
): MessageInfiniteData | undefined => {
  if (!data) return data;

  let didMatch = false;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      messages: page.messages.flatMap((message) => {
        if (!belongsToOperation(message, messageId, clientMessageId)) return [message];
        if (didMatch) return [];

        didMatch = true;
        return [
          {
            ...message,
            _id: messageId,
            client_message_id: clientMessageId,
          },
        ];
      }),
    })),
  };
};

export const upsertReceivedMessage = (
  data: MessageInfiniteData | undefined,
  newMessage: Message,
): MessageInfiniteData | undefined => {
  if (!data) return data;

  let didMatch = false;
  const pages = data.pages.map((page) => ({
    ...page,
    messages: page.messages.flatMap((message) => {
      if (
        !belongsToOperation(
          message,
          newMessage._id,
          newMessage.client_message_id,
        )
      ) {
        return [message];
      }
      if (didMatch) return [];

      didMatch = true;
      return [newMessage];
    }),
  }));

  if (!didMatch && pages[0]) {
    pages[0] = {
      ...pages[0],
      messages: [newMessage, ...pages[0].messages],
    };
  }

  return { ...data, pages };
};
