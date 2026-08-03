# Review hiện trạng Frontend Notification, Unread và Realtime

Tài liệu này ghi nhận trạng thái source tại thời điểm review. Đây là đánh giá hiện trạng, không phải kế hoạch triển khai và không thay đổi source code.

## Phạm vi và nguồn đối chiếu

Đã kiểm tra `src/app`, `src/features`, `src/components/layout`, `src/providers`, API client, auth store/initializer, toàn bộ feature conversations, các socket listener, React Query keys/cache mutation, những thành phần tweet/user/media có khả năng tái sử dụng, cùng các tài liệu `AI_RULES.md`, `architecture.md`, `design-system.md` và `input-frontend-noti.md`.

Repo không có file tên `notification-backend-contract.md`. Contract notification backend duy nhất tìm thấy là `../X-ver2/frontend-notification-contract.md`; tài liệu review dùng file này làm contract backend được nhắc tới trong yêu cầu. Đây là giới hạn bằng chứng cần lưu ý nếu hai tên file vốn được kỳ vọng là hai phiên bản khác nhau.

Kết quả kiểm tra tĩnh hiện tại:

- `npx tsc --noEmit`: đạt, không có lỗi TypeScript.
- `npm run lint`: không đạt, có 28 error và 20 warning toàn repo. Trong phạm vi trực tiếp có `any` ở auth/login, state update trong effect của `profile-menu.tsx` và `message-list.tsx`, cùng một số cảnh báo ảnh chưa tối ưu.

Kết luận ngắn: source hiện chưa có hệ thống Notification frontend. Messaging đã có nền tảng React Query, Socket.IO, conversation list/detail, reply context, reaction và group lifecycle tương đối rõ, nhưng chưa tích hợp unread contract mới. Link Notifications tồn tại nhưng route không tồn tại; Messages chưa có badge; conversation/message types thiếu toàn bộ unread fields; read API là hàm không được gọi; các notification/read-state socket event chưa được nghe.

## 1. Kiến trúc frontend hiện tại

### Routing

Ứng dụng dùng Next.js App Router:

- Root layout `src/app/layout.tsx` bọc toàn ứng dụng bằng `AppProvider` rồi `SocketProvider`.
- Nhóm auth ở `src/app/(auth)` có layout riêng cho login/register/password/email.
- Nhóm main ở `src/app/(main)` bọc `Sidebar`, vùng nội dung giữa và `RightSidebar` trong `FriendPresenceProvider`.
- Route conversation detail thực tế là `src/app/(main)/messages/[conversationId]/page.tsx`, chỉ làm thin wrapper và render `ChatWindow`.
- `src/app/(main)/messages/page.tsx` hiện import và render `../home/page`, vì vậy `/messages` hiển thị Home feed thay vì Inbox landing/empty chat.
- Sidebar có link `/notifications`, nhưng không có `src/app/(main)/notifications/page.tsx`; điều hướng hiện đi tới Not Found.
- `src/proxy.ts` bảo vệ route dựa duy nhất vào cookie `access_token`. Trường hợp chỉ còn `refresh_token` vẫn bị redirect khỏi main route trước khi client initializer có cơ hội refresh.

Route components phần lớn mỏng đúng FSD, ngoại trừ `/messages` đang tái sử dụng sai page component của Home thay vì composition dành cho Inbox.

### Feature boundaries

- Domain messaging nằm tập trung tại `src/features/conversations` với `api`, `components`, `hooks`, `stores`, `types`, `constants`, `utils`.
- Auth nằm tại `src/features/auth`; user/friend presence ở `src/features/users`; tweet ở `src/features/tweets`; media ở `src/features/media`.
- Shared layout ở `src/components/layout`; shared primitive ở `src/components/ui`.
- Các thư mục global `src/types`, `src/utils`, `src/hooks`, `src/store`, `src/stores`, `src/layouts` hiện không có source file. Shared utility thực tế chỉ có `src/lib/utils.ts` với helper `cn`.
- Không có `src/features/notifications`, notification service, notification type, query key, store, hook hoặc component.
- `SocketProvider` là provider global nhưng gọi trực tiếp hook domain `useConversationSocketSync`. Điều này khiến lifecycle socket toàn app biết chi tiết feature conversations, tạo coupling ngược từ global provider vào domain.

### Server state

React Query là nơi giữ server state:

- Một `QueryClient` sống suốt phiên client trong `AppProvider`.
- Default `staleTime` là 5 phút, `retry: 1`, `refetchOnWindowFocus: false`.
- Conversation list dùng key `['conversations']`.
- Message timeline dùng `['messages', conversationId]` dưới dạng infinite query.
- Message context, search, media, reaction details và group members dùng các query riêng.
- Socket handlers patch hoặc invalidate React Query cache trực tiếp.
- Chưa có notification cache hoặc unread summary cache.

### Client state

Zustand hiện giữ ba nhóm state:

- `auth.store.ts`: current user và `isAuthenticated`, persist vào `localStorage` với key `auth-storage`; tokens thực tế được lưu trong cookies.
- `conversation-details.store.ts`: trạng thái panel details và message target dùng cho deep-link/focus.
- `message-composer.store.ts`: reply draft đang chọn.

Socket instance và `isConnected` không nằm trong Zustand mà nằm trong React Context/local state của `SocketProvider`. Presence của bạn bè là local state trong `FriendPresenceProvider`.

### Socket lifecycle

- `SocketProvider` chỉ tạo socket khi Zustand báo `isAuthenticated=true`.
- Socket dùng `autoConnect:false`, auth callback đọc access token từ cookie rồi gọi `.connect()`.
- `connect` chỉ set `isConnected=true`; `disconnect` set false.
- `connect_error` có prefix authentication sẽ refresh token rồi connect lại; lỗi khác chỉ log và để cơ chế reconnect mặc định của Socket.IO xử lý.
- Cleanup provider gọi `removeAllListeners()`, `disconnect()`, clear socket/context state.
- Global conversation listeners được gắn qua `useConversationSocketSync(socket)` bên trong provider.
- Chat-specific listeners chỉ được gắn khi một `ChatWindow` mount và socket connected.
- Không có logic REST reconciliation khi socket reconnect hoặc browser regain focus.

### Auth lifecycle

- Login mutation trả token rồi gọi `setAuth(null as any, ...)`, persist `isAuthenticated=true` với `user=null`, sau đó chuyển `/home`.
- `AuthInitializer` chạy global, đọc access cookie; nếu thiếu thì thử refresh cookie; nếu store chưa có user/auth thì gọi `/user/me` và gọi lại `setAuth`.
- Vì login bật authenticated trước khi `/user/me` hoàn tất, socket có thể connect trong lúc current user vẫn null. Personal socket room vẫn có thể đúng nhờ token, nhưng UI và cache updater phụ thuộc current user ID có một khoảng không xác định.
- Nếu `/user/me` lỗi, initializer chỉ `console.error`, không clear session hoặc công bố auth-loading/error state.
- Logout xóa cookies và Zustand state, nhưng không clear React Query cache, conversation detail store, composer store hoặc in-memory reopen markers.
- Axios interceptor dùng một shared refresh promise để chống nhiều refresh request đồng thời; refresh thất bại xóa cookies/local auth storage và hard redirect `/login`.

### Cache lifecycle

- Cache tạo một lần trong `AppProvider` và không scoped theo user ID.
- Conversation/message mutation cập nhật nhiều cache bằng helper rồi invalidate active queries.
- Revoke/delete/reaction patch timeline, context, search và media caches khá nhất quán.
- Leave/kick/admin-transfer có helper remove các query theo conversation.
- Logout không clear toàn bộ cache nên user đăng nhập tiếp theo trong cùng tab có thể nhìn thấy server state của user trước cho tới khi refetch.
- Reconnect không invalidate cache; do `refetchOnWindowFocus:false`, dữ liệu bị bỏ lỡ khi offline có thể tiếp tục stale.

### UI composition

Desktop main layout có ba cột: Sidebar trái, main giữa tối đa 600 px, RightSidebar 350 px. Trên route messages, RightSidebar đổi thành Conversation list hoặc Conversation details. Chat detail nằm ở main column.

Responsive hiện chưa hoàn chỉnh:

- Sidebar trái bị ẩn dưới breakpoint `sm`.
- RightSidebar chứa Conversation list bị ẩn dưới `lg`.
- Không có bottom navigation/mobile Sidebar thay thế trong source.
- Vì `/messages` lại render Home, mobile/tablet không có Inbox list thực sự từ UI chính.

## 2. Luồng dữ liệu hiện tại

### App bootstrap, auth và socket connect

```text
Browser request
  -> src/proxy.ts kiểm tra access_token
  -> RootLayout
     -> AppProvider tạo QueryClient
        -> AuthInitializer đọc cookies/Zustand
        -> SocketProvider đọc isAuthenticated
           -> MainLayout/AuthLayout
```

Với persisted session hợp lệ:

```text
AuthInitializer
  -> có access token
  -> nếu user/auth thiếu: GET /user/me
  -> setAuth(user, tokens)
  -> SocketProvider thấy isAuthenticated=true
  -> tạo Socket.IO client
  -> connect
  -> isConnected=true
```

Với login mới:

```text
LoginForm -> POST /auth/login
  -> setAuth(user=null bằng cast any, tokens)
  -> router.push('/home')
  -> SocketProvider có thể connect
  -> AuthInitializer GET /user/me
  -> setAuth(user thật)
```

### Socket reconnect hiện tại

```text
disconnect
  -> isConnected=false
  -> UI chat vẫn giữ cache/draft
  -> Socket.IO tự reconnect
  -> connect
  -> isConnected=true
  -> chat/presence listeners gắn lại khi dependency đổi
  -> KHÔNG refetch conversations/messages/unread/notifications
```

Nếu `connect_error` là lỗi auth, provider refresh token rồi gọi connect lại. Không có bước đối soát những event đã mất trong thời gian disconnect.

### Tải conversation list

```text
RightSidebar trên /messages*
  -> ConversationSidebar
  -> useConversations
  -> React Query ['conversations']
  -> conversationsApi.getConversations()
  -> GET /conversations
  -> render skeleton / error text / empty / ConversationItem[]
```

`ChatWindow` và `ConversationDetailsPanel` cũng gọi `useConversations`; React Query dùng chung key nên thường dedupe request/cache, dù nhiều component cùng subscribe.

### Mở conversation

```text
ConversationItem click
  -> router.push('/messages/:id')
  -> route render ChatWindow
  -> ChatWindow tìm conversation trong ['conversations']
  -> MessageList -> useMessages
  -> GET /conversations/:id/messages?limit=20&cursor=...
  -> reverse newest-first thành timeline oldest-to-newest
  -> initial scroll xuống cuối
```

Không có read acknowledgement trong luồng này. Việc mở route, initial scroll và message visibility đều không gọi `markAsRead`.

### Nhận message mới

```text
@conversation:receive raw Message
  -> useConversationSocketSync
  -> nếu timeline cache tồn tại và chưa có _id: prepend vào page 0
  -> cập nhật last_message_at + last_message_preview của conversation cache
  -> sort: pinned trước, rồi last_message_at giảm dần
  -> nếu chưa có conversation row: invalidate ['conversations']
  -> MessageList phát hiện latest ID thay đổi
     -> auto-scroll nếu đang gần đáy
```

Không có bước cập nhật unread conversation/message, Messages badge, mention highlight, system-message branch hoặc read ack.

### Message context navigation

```text
Message search/reply action
  -> conversation-details.store.focusMessage(conversationId, messageId)
  -> MessageList chuyển sang useMessageContext
  -> GET /conversations/:conversationId/messages/:messageId/context
  -> render cửa sổ context
  -> scrollIntoView + highlight target
```

Đây là luồng hiện có phù hợp để phục vụ deep-link message sau này, dù notification chưa gọi nó.

### Mark message read

```text
conversationsApi.markAsRead(conversationId) tồn tại
  -> POST /conversations/:id/read với body rỗng
  -> type chỉ là { success: boolean }

Không có hook/component gọi hàm này.
Không có @conversation:read emit.
Không có @conversation:read-state listener.
Không có unread cache để cập nhật.
```

### Sidebar badge

```text
Sidebar -> navItems tĩnh -> icon + label
```

Không có query, store, badge component hoặc socket update cho Notifications/Messages. Icon Bell và MessageCircle chỉ phản ánh active route.

### Notification hiện tại

```text
Click Sidebar /notifications
  -> không có route
  -> Not Found
```

Không có feed, API load, pagination, unread, mark-read, listener hoặc click navigation.

## 3. Những phần đã tồn tại

| Loại | File | Trách nhiệm hiện tại |
| --- | --- | --- |
| Root provider | `src/providers/app-provider.tsx` | Tạo QueryClient, cấu hình stale/retry/focus, mount global Sonner Toaster và AuthInitializer. |
| Auth initializer | `src/providers/auth-initializer.tsx` | Refresh token khi cần, gọi `/user/me`, đồng bộ Zustand/cookies. Không có auth loading state. |
| Socket provider | `src/providers/socket-provider.tsx` | Tạo/đóng socket, auth reconnect, cung cấp `socket/isConnected`, mount conversation socket sync. |
| API client | `src/services/api.client.ts` | Axios base URL, Bearer interceptor, single-flight refresh token, redirect khi refresh lỗi. |
| Auth store | `src/features/auth/stores/auth.store.ts` | Persist `user/isAuthenticated`, ghi/xóa cookies. |
| Main layout | `src/app/(main)/layout.tsx` | Compose Sidebar, main content, RightSidebar, friend presence. |
| Sidebar | `src/components/layout/sidebar.tsx` | Render bốn nav item và Create Tweet. Có link Notifications/Messages nhưng không badge/mobile variant. |
| Right sidebar | `src/components/layout/right-sidebar.tsx` | Trên messages route render ConversationSidebar hoặc details; route khác render search/friends/suggestions. |
| Messages landing route | `src/app/(main)/messages/page.tsx` | Hiện render Home page; chưa phải Inbox landing. |
| Conversation route | `src/app/(main)/messages/[conversationId]/page.tsx` | Thin wrapper truyền route ID vào ChatWindow. |
| Conversation API | `src/features/conversations/api/conversations.api.ts` | Conversation list, message pagination/context/search/media, lifecycle, mute/pin/hide, group actions, revoke/delete/reaction; có read method chưa dùng. |
| Conversation types | `src/features/conversations/types/index.ts` và các file `types/*` | Model Conversation/Message/UserPreview/reply/reaction/group events hiện tại. Chưa có unread/system/mention/idempotency types mới. |
| Query keys | `src/features/conversations/constants/conversation-query-keys.ts` | Chỉ định `['conversations']` và `['messages', id]`. Các key khác được khai báo rải rác trong hooks. |
| Conversation query | `src/features/conversations/hooks/use-conversations.ts` | Query toàn bộ conversation list. |
| Messages query | `src/features/conversations/hooks/use-messages.ts` | Infinite query message với cursor, page size 20. |
| Message context query | `src/features/conversations/hooks/use-message-context.ts` | Fetch cửa sổ message trước/sau target để focus. |
| Message search/media/group hooks | `use-message-search.ts`, `use-conversation-media.ts`, `use-group-members.ts` | Các query scoped theo conversation và cursor/context tương ứng. |
| Global conversation sync | `src/features/conversations/hooks/use-conversation-socket-sync.ts` | Nghe group update, receive message, history cleared; patch/remove/invalidate React Query cache và route. |
| Chat socket hook | `src/features/conversations/hooks/use-chat-socket.ts` | Nghe conversation error, revoke/delete/reaction; gửi message và typing command. |
| Conversation actions | `use-conversation-actions.ts` | Optimistic pin/mute, hide/history cleanup, invalidation và toast. |
| Group actions | `use-group-actions.ts` | Update/add/remove/leave/atomic transfer-and-leave; cache cleanup theo invariant một admin. |
| Message actions | `use-message-actions.ts` | Patch và refetch timeline/context/search/media cho revoke/delete/reaction. |
| Conversation cache helpers | `src/features/conversations/utils/conversation-cache.ts` | Sort/upsert conversation, remove conversation-scoped queries, clear history cache. |
| Conversation list | `conversation-sidebar.tsx`, `conversation-item.tsx` | Search, skeleton/error/empty, row avatar/title/preview/time/mute/pin/presence. Không unread. |
| Active chat | `chat-window.tsx`, `message-list.tsx` | Resolve conversation, load/paginate timeline, scroll/context focus, loading/error/empty, composer/details. |
| Message rendering | `message-row.tsx`, `message-bubble.tsx`, `message-reply-preview.tsx` | User bubbles, sender avatar/name, reply excerpt/navigation, revoked tombstone, media, timestamp, reaction summary. Không system/mention unread. |
| Message commands | `message-input.tsx`, `message-actions-menu.tsx`, reaction components | Send/reply/media/typing, reply/revoke/delete, reaction picker/details. Không client idempotency ID/mention IDs. |
| Details stores | `conversation-details.store.ts`, `message-composer.store.ts` | UI panel/focus target và reply draft. |
| Friend presence | `friend-presence-provider.tsx`, `friend-presence-dot.tsx` | Fetch friends, query presence, nghe online/offline, hiển thị dot. |
| Tweet presentation | `tweet-card.tsx`, feed components | Avatar/name/content/media/timestamp và tweet navigation; hiện là card đầy đủ, chưa có compact target preview. |
| Infinite scroll pattern | `home-feed.tsx`, `message-list.tsx`, search/media hooks | React Query cursor + intersection observer hoặc Load more. |
| Loading/error state | Nhiều conversation components | Conversation list có skeleton/error/empty; message context có skeleton/retry; message initial load còn dùng spinner và error không retry. |
| Notification feature | Không tồn tại | Không service/type/store/hook/query/component/route/listener/query key/loading/error. |

## 4. Những phần có thể tái sử dụng

| Thành phần cần cho notification | Hiện có | Mức tái sử dụng thực tế |
| --- | --- | --- |
| Avatar | `MessageSenderAvatar`, avatar markup ở `ConversationItem`, `TweetCard`, user lists | Có thể tái sử dụng pattern fallback/image/focus. `MessageSenderAvatar` có semantics “message sender” nên không nên import thẳng sang notification nếu làm sai FSD; phần primitive có thể được chia sẻ mà không viết lại hành vi ảnh. |
| User preview | `UserPreview`, friend/user profile types và nhiều row người dùng | Type public tối thiểu gần với `actor_info`; cần type notification riêng vì backend avatar nullability/target redaction khác. Pattern name/username/avatar có thể giữ. |
| Tweet preview | `TweetCard` và quote preview trong chính card | Không nên dùng nguyên `TweetCard` cho target preview vì component quá nặng, có mutation/menu/media/action riêng. Có thể giữ typography, route và content treatment; compact preview chưa tồn tại. |
| Timestamp | `date-fns` đang được dùng ở ConversationItem, TweetCard, MessageBubble/Search | Package đã có. Logic format đang lặp và không có shared timestamp component; có thể dùng cùng package nhưng chưa có abstraction tái sử dụng trực tiếp. |
| Infinite scroll | `useInfiniteQuery` + `useInView` ở Home feed/MessageList | Pattern và package đã có, phù hợp notification cursor. Không có generic hook/component nên cần tránh copy sai pagination semantics. |
| Skeleton | ConversationSidebar, message context, group members/details/search | Visual tokens và reduced-motion pattern có thể mở rộng. Không có shared Skeleton primitive. |
| Sidebar item | Mapping + `SidebarNavIcon` local trong `sidebar.tsx` | Nên mở rộng item hiện có để thêm badge, không thay Sidebar. Icon renderer là local nên badge phải được compose trong cùng component hoặc tách shared có chủ ý. |
| Badge | Không có badge count | Không có component tái sử dụng. Presence dot không phải count badge và không nên dùng thay. |
| Socket provider | `SocketProvider` + `useSocket` | Có thể giữ connection/auth/context. Notification sync nên là domain listener riêng; provider hiện đủ để cấp socket nhưng reconnect reconciliation còn thiếu. |
| Conversation row | `ConversationItem` | Có đầy đủ avatar/title/preview/time/mute/pin; nên mở rộng unread visual/count và group sender preview thay vì viết row mới. |
| Message navigation | `conversation-details.store.focusMessage`, `useMessageContext`, MessageList highlight | Tái sử dụng trực tiếp cho message reply/mention/reaction notification sau khi route đã mở. Đây là phần phù hợp nhất với yêu cầu deep-link. |
| Reaction realtime | Cache patch helpers và `@message:reaction-updated` listener | Có thể giữ nguyên cho Chat; notification reaction aggregate là cache khác và không được trộn vào helper message reaction. |
| Toast | Sonner Toaster đã mount global | Package/cơ sở hiển thị đã có. Chưa có policy notification toast, dedupe hoặc hydration. |
| Group route/cache cleanup | `removeConversationCaches`, group update listener, group action success | Có thể giữ và mở rộng cho read summary/notification invalidation; atomic transfer-and-leave đã đúng invariant. |

Không có lý do kiến trúc để viết lại conversation UI, socket connection hoặc message context navigation. Khoảng thiếu nằm ở type/read-state/cache ownership và lớp notification mới, không nằm ở presentation cơ bản của chat.

## 5. State ownership

| State | Hiện được lưu ở đâu | Source of truth hiện tại | Có trùng state không | Nên giữ hay thay đổi |
| --- | --- | --- | --- | --- |
| Current user | Zustand persisted `auth-storage`; cookies giữ tokens; `/user/me` hydrate user | Backend `/user/me`, nhưng UI thường đọc Zustand | Có lệch tạm thời: login persist authenticated với `user=null`; cookies và Zustand có lifecycle riêng | Giữ Zustand làm client projection nhưng cần auth initialization có trạng thái rõ và clear cache theo user/session. |
| Socket connection | Local state trong `SocketProvider`, expose qua Context | Socket.IO connection state | Không có duplicate chính; consumers cũng suy ra availability từ `socket` + `isConnected` | Giữ Context; bổ sung semantics reconnect/reconciliation ở domain, không cần Zustand hóa chỉ để có badge. |
| Notifications | Không tồn tại | Backend REST theo contract | Không | Cần server state trong React Query; không dùng Zustand làm bản sao feed. |
| Notification unread | Không tồn tại | Backend NotificationState qua unread-count/version | Không | Cần một cache/state có version dùng chung Sidebar/feed; không tính từ loaded feed. |
| Conversation list | React Query `['conversations']` | `GET /conversations`, sau đó socket patch tạm thời | Có nhiều subscribers nhưng chung cache, không phải duplicate state | Giữ React Query; mở rộng type/cache bằng unread fields. |
| Message unread | Không tồn tại; `Message.read_by` chỉ có trong type legacy và không được dùng | Backend conversation read state/unread summary | Chưa duplicate vì chưa triển khai | Thay type legacy bằng read-state contract; thêm summary query và conversation unread fields. |
| Active conversation | URL `/messages/:conversationId`; details store có `openConversationId`; focus store có target conversation/message | URL là navigation truth | Có nhiều khái niệm gần nhau nhưng store hiện phục vụ panel/focus, không đại diện active route | Giữ URL làm active conversation; không thêm active-conversation global state trùng. |
| Message cache | React Query timeline, context, search, media; reply draft snapshot trong Zustand | Message REST + socket receive/action events | Có cùng message projection ở nhiều query caches; helper đang patch nhiều nơi | Giữ React Query projections và central cache helpers; tránh thêm message store mới. |
| Group membership | `Conversation.members` trong list và `['conversation-members', id]` chi tiết | Backend conversation/member APIs + group-updated invalidation | Có, hai projection có thể lệch giữa event và refetch | Giữ cả hai vì mục đích khác nhau, nhưng group event phải invalidate cả hai và type đủ change_type. |
| Mute state | `conversation.muted_by` trong conversation cache; optimistic mutation | Conversation API hiện frontend kỳ vọng | Không có store khác | Giữ trong conversation server state. Contract notification được cung cấp không mô tả field/API này nên cần xác nhận contract tổng thể. |
| Focused message | Zustand `targetConversationId/targetMessageId` | UI intent; message context API xác nhận target | Không | Giữ; clear khi target delete, conversation removal hoặc navigation hoàn tất. |
| Reply composer | Zustand snapshot `replyTo` + local input/media state | UI draft, backend chỉ xác nhận khi send | Có draft bị chia giữa Zustand và local component, nhưng mỗi phần khác trách nhiệm | Giữ hiện trạng nếu logout/conversation cleanup được bổ sung đầy đủ. |

## 6. Socket listener audit

### Listener tại SocketProvider

| Event | Đăng ký/cleanup | Payload type | Cache/store cập nhật | Reconnect | Duplicate/stale closure/route coupling |
| --- | --- | --- | --- | --- | --- |
| `connect` | `socket-provider.tsx`; cleanup chung bằng `removeAllListeners` | Socket.IO built-in, callback inline | `isConnected=true` | Có chạy lại khi reconnect, nhưng không invalidate/refetch | Một socket instance/một listener; không stale closure đáng kể; không route-dependent. Thiếu reconciliation là rủi ro cao. |
| `disconnect` | Cùng file; cleanup chung | Không khai báo reason | `isConnected=false` | Chỉ phản ánh mất kết nối | Không duplicate nếu effect cleanup đúng. Không lưu lý do hoặc expose trạng thái reconnect chi tiết cho UI. |
| `connect_error` | Cùng file; cleanup chung | `Error` | Có thể refresh cookies/logout; log lỗi | Chỉ refresh khi message bắt đầu bằng chuỗi auth cụ thể | Phụ thuộc string prefix của error; mutable flag trong closure ngăn refresh song song. Không stale route. |
| `@user:block-status-changed` | Cùng file; cleanup chung | Không có interface | Invalidate mọi query prefix `['user']` | Không reconcile event miss | Type thiếu; không route-dependent. Prefix rộng có chủ ý nhưng không chạm conversations/notifications bị lifecycle block. |

### Listener global của conversations

Tất cả nằm trong `use-conversation-socket-sync.ts`, được gọi đúng một lần từ `SocketProvider`.

| Event | Cleanup | Payload type | Cache/store cập nhật | Reconnect | Duplicate/stale closure/route coupling |
| --- | --- | --- | --- | --- | --- |
| `@conversation:group-updated` | `socket.off` đúng handler | `GroupUpdatedEvent` | Invalidate conversations/members hoặc remove conversation caches; close details/reply; route replace | Không refetch toàn bộ sau reconnect | Listener re-register khi `pathname` đổi và cleanup đúng, nên duplicate risk thấp. Route-coupled trực tiếp. Type thiếu `group_created`, `admin_granted`, `admin_revoked`. |
| `@conversation:receive` | `socket.off` đúng handler | `Message` | Upsert timeline theo `_id`; patch preview/time và sort list; invalidate list khi row thiếu | Không phục hồi message bỏ lỡ | Không stale route; handler dùng QueryClient. Dedupe `_id` có. Không update unread/system/mention. |
| `@conversation:history-cleared` | `socket.off` đúng handler | `ConversationHistoryClearedEvent` | Clear timeline/context/search/media/list row, store UI và route; dùng in-memory reopen marker chống event cũ | Marker không persist và không reset logout | Route-coupled; effect dependency đảm bảo pathname mới. Duplicate event tương đối idempotent. |

### Listener scoped theo active ChatWindow

Tất cả nằm trong `use-chat-socket.ts`. Mỗi mounted ChatWindow có một hook; cleanup dùng đúng handler.

| Event | Payload type | Cache/store cập nhật | Reconnect | Duplicate/stale closure/route coupling |
| --- | --- | --- | --- | --- |
| `@conversation:error` | Interface local `ConversationSocketError` | Toast; invalidate partner profile nếu blocked | Listener được gắn lại khi `isConnected` đổi | Phụ thuộc `conversationId`/`partnerUsername`, được đưa vào deps nên closure mới. Event cho conversation khác bị lọc. |
| `@message:revoked` | `MessageRevokedEvent` | Patch timeline/context/search/media, clear reply target, invalidate related queries | Không reconcile event miss ngoài lần query tự refetch | Không filter conversation; mọi mounted chat handler sẽ xử lý cùng event. Hiện chỉ có một ChatWindow nên risk thấp, nhưng listener bản chất global lại đặt trong route component. |
| `@message:deleted-for-me` | `MessageDeletedForMeEvent` | Remove message ở nhiều caches, clear selection, invalidate | Như trên | Cùng coupling route; thao tác idempotent phần lớn. |
| `@message:reaction-updated` | `MessageReactionUpdatedEvent` | Patch reactions ở timeline/context/search/media; invalidate active reaction detail | Như trên | Không filter active conversation nhưng helper scoped bằng payload ID. Không stale closure đáng kể. |

### Listener friend presence

`friend-presence-provider.tsx` nghe `user:online` và `user:offline`, cleanup đúng handler; payload dùng `FriendPresenceEvent`. Effect phụ thuộc socket/connection/friend list và gắn lại khi danh sách thay đổi. Callback presence ban đầu có cờ `isActive` chống late response. Không phụ thuộc route, nhưng provider chỉ mount trong main layout. Đây là pattern listener có cleanup tốt có thể tham khảo; không giải quyết notification reconciliation.

### Listener còn thiếu theo contract

Không có listener cho:

- `@notification:new`;
- `@notification:unread-count`;
- `@notification:read-state`;
- `@notification:updated`;
- `@notification:removed`;
- `@conversation:read-state`.

Frontend có gửi `@conversation:send` và typing events, nhưng không gửi `@conversation:read`. Send acknowledgement bị rút gọn thành boolean, bỏ `message_id` nên không thể reconcile optimistic item theo ack.

## 7. API và cache audit

### Fetching boundary

- Conversation components không gọi Axios/fetch trực tiếp; request đi qua `conversationsApi`, phù hợp feature boundary.
- React Query calls vẫn nằm ở component ở một số domain khác, nhưng trong messaging phần lớn đã tách thành hooks.
- `AuthInitializer` gọi `userService` trực tiếp trong effect, phù hợp vai trò bootstrap nhưng không dùng React Query/auth status machine.
- Media service có Axios riêng cho multipart, ngoài phạm vi unread nhưng cho thấy API client chưa hoàn toàn thống nhất.

### Typing

- `conversationsApi` có return type cụ thể ở hầu hết method, nhưng Axios response envelope không dùng generic và không có runtime validation.
- `Message`, `Conversation` và socket payload được type rõ theo model cũ.
- Auth service/login còn nhiều `any`; login ép `null as any` vào `User`.
- Notification hoàn toàn chưa có type.
- Read method type `{success:boolean}` không khớp additive response backend hiện tại.

### Query keys

- `CONVERSATIONS_QUERY_KEY` và `MESSAGES_QUERY_KEY` được centralize.
- Các key `conversation-message-context`, `conversation-message-search`, `conversation-media`, `message-reaction-details`, `conversation-members`, `following`, `user` được khai báo ở nhiều hook hoặc hard-code lại trong cache helpers.
- Prefix hard-code hiện đồng nhất về string nhưng dễ lệch khi mở rộng notification/invalidation.
- Không có key factory bao trùm conversations và không có notification query keys.

### Pagination

- Message, message search, media, group lookup và tweet feed dùng opaque cursor đúng cách: truyền `next_cursor`, không parse.
- Timeline API trả newest-first; UI flatten pages rồi reverse toàn bộ. Receive handler prepend vào page đầu, phù hợp assumption page đầu chứa newest.
- Cache receive chỉ kiểm tra duplicate trong timeline query chính, không merge context/search; message mới thông thường không cần vào historical search/context.
- Notification infinite pagination chưa tồn tại.

### Mutation và invalidation

- Pin/mute có optimistic update, rollback snapshot và invalidation settled.
- Group mutations chủ yếu invalidate conversation/member queries; departure success remove scoped caches và route.
- Revoke/delete/reaction patch nhiều projections bằng helper rồi invalidate server state.
- Send message không optimistic insert, không dùng React Query mutation, không dùng `client_message_id`, không consume `message_id`; UI chỉ khóa composer và chờ ack/receive.
- Read mutation không có hook, invalidation hoặc cache transaction.
- Notification mark-one/read-all không có service/mutation.

### Logout cleanup và stale cache

- Logout không gọi `queryClient.clear()`/remove queries và không reset conversation UI stores.
- QueryClient không keyed theo current user. Đây là nguy cơ lộ conversation/message/notification của phiên trước khi account khác đăng nhập trong cùng tab.
- `refetchOnWindowFocus:false` và không có reconnect handler khiến cache bỏ lỡ socket event không tự lành theo contract.
- `staleTime:5 phút` áp dụng cả conversation/message nếu hook không override; reconnect trong khoảng stale không tự fetch.
- `conversationReopenedAtById` là module-level Map, không clear khi logout.

### Duplicated fetching/state

- `ConversationSidebar`, `ChatWindow` và `ConversationDetailsPanel` cùng subscribe `useConversations`; React Query thường dedupe cùng key nên đây không phải ba network source, nhưng toàn bộ UI phụ thuộc một array lớn để resolve một conversation.
- Conversation membership có cả `conversation.members` và query members chi tiết; group update phải invalidate cả hai.
- Message tồn tại trong timeline/context/search/media projections; cache mutation đã được centralize một phần, nhưng query keys hard-code khiến nguy cơ bỏ sót cao.
- Không có duplicate notification/unread state vì các state đó chưa tồn tại.

## 8. UI hiện trạng

### Sidebar

- Desktop Sidebar dark, icon outline/filled theo active route, label Home/Notifications/Messages/Profile và Post button.
- Không có count badge, loading badge, disconnect indicator hoặc accessible unread label.
- Sidebar bị ẩn trên màn hình dưới `sm`; không có mobile bottom navigation.
- Notification icon trỏ route không tồn tại.

### Notification route

Không tồn tại. Không có page header, feed row, actor/target preview, aggregate state, empty/loading/error, infinite scroll, mark read/all hoặc unavailable state.

### Messages badge

Không tồn tại. Frontend không gọi `/conversations/unread-summary`, không lưu `version`, không nghe read-state.

### Conversation unread visual state

Không tồn tại. `ConversationItem` luôn dùng cùng font/color và chỉ có mute/pin icons. Type `Conversation` không có `unread_message_count`, `last_read_message_id`, `last_read_at`. Group row không có sender name trong preview vì `MessagePreview` chỉ giữ `sender_id`, content và type.

### Conversation list

- Có search people/groups, presence, skeleton, error text và empty welcome state.
- Error state không có retry button.
- Row có avatar/title/timestamp/content prefix `You:`; group sender prefix không có.
- Sort pinned trước rồi latest time; receive event cập nhật realtime.
- `/messages` desktop vẫn thấy list ở RightSidebar, nhưng main content là Home feed. Dưới `lg`, list biến mất.

### Active conversation

- Header có avatar/name/presence/details/close.
- Timeline có cursor load older, initial scroll bottom, giữ vị trí khi đọc message cũ, auto-scroll khi gần đáy, message context focus/highlight và back-to-latest.
- Không có “new messages” pill/count khi user ở xa đáy; message mới chỉ không auto-scroll.
- Không kiểm tra document visibility/IntersectionObserver theo từng message để ack read.
- Không có read state, read receipt hoặc socket disconnect banner; composer chỉ báo lỗi khi user cố send lúc disconnected.

### Message rendering

- User message, group sender name/avatar, reply preview, attachments, revoke tombstone, actions và reaction UI đã có.
- Không có `kind`/`system_event_type` trong type. System message backend gửi sẽ đi qua user-message branch, có thể hiện avatar/bubble/reply/reaction/delete/revoke actions trái contract; đây là lỗi chức năng mức cao.
- Không có `mention_user_ids` hoặc highlight group mention.
- `read_by` vẫn là required field trong TypeScript dù backend nói field này chỉ legacy và không còn dual-write.
- Message initial loading dùng spinner, không phải skeleton; error chỉ có text, không retry. Context loading/error tốt hơn và có skeleton/retry.

### Mobile layout

- Chat detail có height/overlay details responsive và focus trap khá tốt.
- Navigation tổng thể và Inbox list mobile thiếu. Người dùng mobile không có Sidebar hoặc RightSidebar để chuyển giữa Home/Notifications/Messages/conversations.
- Conversation row dùng `div onClick`, không phải link/button và không có keyboard handler/tabIndex; accessibility kém dù các action chi tiết khác có focus state tốt.

### Toast

Sonner Toaster tồn tại global. Toast hiện dùng cho auth, conversation/group/message errors/success. Không có notification toast policy hoặc dedupe.

## 9. Chênh lệch với yêu cầu

| Yêu cầu | Hiện trạng | Thiếu gì | Backend đã hỗ trợ chưa | Mức ảnh hưởng |
| --- | --- | --- | --- | --- |
| Notification tab cá nhân | Không có route/feature; link đi Not Found | Toàn bộ service/type/query/feed/navigation/state | Có REST feed và socket activity | Nghiêm trọng |
| Notification badge | Không có | Unread-count query, versioned socket sync, badge UI | Có | Nghiêm trọng |
| Messages badge = số conversation unread | Không có | Unread-summary service/query/listener/badge | Có | Nghiêm trọng |
| Count 0/99+/loading/disconnect | Không có badge | Toàn bộ presentation/state | Backend có numeric count/version; disconnect là client state | Cao |
| Notification feed pagination | Không có | Infinite query opaque cursor, merge/dedupe | Có | Nghiêm trọng |
| Feed loading/empty/error | Không có | UI states và retry | Có đủ API để thực hiện | Cao |
| Actor/target/unavailable rendering | Không có | Hydrated types và fallback UI | REST hỗ trợ; socket raw cần refetch | Cao |
| Aggregate Like/Repost/Reaction | Không có | Replace/remove by ID, actor count UI | Có | Cao |
| Follow và followed-user post | Không có item/UI/preference toggle | Renderer, profile/tweet navigation và follow-post preference integration | Có notification type; preference `posts` có API | Cao |
| Quote/Reply/Mention tweet | Không có notification UI | Type-specific text/preview/thread navigation/dedupe | Có target/context và lifecycle remove | Cao |
| Message reply/group mention activity | Chat có reply; mention chưa có; Notification tab không có | Directed notification renderer, badge/read state và message focus handoff | Có `message_reply`/`message_mention` | Cao |
| Group add/kick/admin personal activity | Chỉ có group cache update, không Notification row | Type-specific unavailable/route behavior và notification sync | Có `group_add`, `group_kick`, `admin_granted`, `admin_revoked` | Cao |
| Mark one/read all notification | Không có | API methods, mutation, cache/version sync | Có | Nghiêm trọng |
| Notification click/deep link tweet/profile | Tweet/profile routes có; notification không nối vào | Type-to-route mapping, safe null handling | Có target/context theo contract | Cao |
| Deep link tới message | Message context navigation đã có | Notification route phải gọi focus store sau navigation | Có ID/context trong notification; frontend còn có context endpoint | Trung bình |
| Conversation unread row/count | Không có field/UI | Type, rendering và authoritative cache update | Có | Nghiêm trọng |
| Group sender preview trong list | Chỉ có sender ID, không tên | Sender projection/cache mapping | Contract notification handoff không bảo đảm last sender projection | Trung bình |
| New message đưa row lên đầu | Đã có, giữ pinned trước | Dedupe/unread state chưa đi cùng | Receive event có | Đạt một phần |
| Active visible chat không giữ unread | Không mark read | Visibility rule, exact message ack, state transaction | Có read REST/socket | Nghiêm trọng |
| Hidden tab/scrolled-away message vẫn unread | Không có read logic nên mọi trường hợp đều không ack | Visibility/viewport/new-message indicator | Backend hỗ trợ exact read position | Cao |
| Reconnect reconciliation | Không có | Refetch summary/list/feed/active data khi reconnect/focus | REST có; socket không replay | Nghiêm trọng |
| Message send idempotency | Không có client ID; ack bị bỏ message ID | Stable `client_message_id`, retry/upsert semantics | Có | Cao |
| Message reply | UI reply/excerpt/context navigation đã có | Directed notification integration; send idempotency | Có | Đạt một phần |
| Group mention | Không gửi/lưu/highlight mention IDs | Composer mention intent, type/UI/listener | Có `mention_user_ids` và directed notification | Cao |
| Message reaction realtime | Chat patch hoạt động; activity notification không có | Notification aggregate feed/listeners | Có | Đạt một phần |
| Generic message chỉ cập nhật Inbox | Receive cập nhật conversation/message, không tạo notification giả | Unread summary còn thiếu | Có | Đạt một phần |
| System message group | Không phân nhánh; render như user message | Type + presentation + cấm actions | Có | Nghiêm trọng |
| Member add/leave/kick updates | Group listener invalidate/remove cache cho các change type cũ | System row, direct notification, unread/read-state, type mới | Có | Đạt một phần |
| Admin transfer-and-leave invariant | UI/mutation/cache cleanup đã có | Event type completeness và unread cleanup | Có | Tốt, còn thiếu sync mới |
| Admin granted/revoked events | Không có API/UI role action và event type thiếu | Type/listener invalidation + system/direct notification UI | Backend contract có endpoints/events | Cao |
| Muted conversation | UI/API/optimistic state đã có | Contract tổng thể cần xác nhận; không nối policy toast notification | Notification handoff không mô tả mute API nhưng nói directed item không bị suppress | Đạt một phần |
| Deleted/revoked message | Revoke/delete cache sync và tombstone có | Conversation unread/notification lifecycle sync | Backend hỗ trợ lifecycle | Đạt một phần |
| Notification remove do delete/block | Không nghe notification events | Remove/update feed and versioned badge | Có | Cao |
| Multi-tab read sync | Không có notification/read-state listener | Versioned state application | Có personal-room events | Nghiêm trọng |
| Mobile-first navigation/inbox | Thiếu nav và list mobile | Navigation + responsive Inbox composition | Frontend responsibility | Nghiêm trọng |
| Keyboard/accessibility | Nhiều control tốt; ConversationItem không keyboard; badge/feed chưa có | Semantic row/link, labels/focus/live state | Frontend responsibility | Cao |
| Reduced motion | Nhiều conversation detail/action đã hỗ trợ | Sidebar/feed/new message chưa tồn tại; vài spinner/pulse chưa nhất quán | Frontend responsibility | Trung bình |
| Toast có chọn lọc | Global toaster có | Notification policy/hydration/dedupe | Socket raw chưa hydrate | Thấp đến trung bình |

## 10. Chênh lệch với backend contract

| Contract backend | Frontend hiện tại | Nguy cơ |
| --- | --- | --- |
| Notification REST list/unread/mark-one/read-all | Không có service/type/hook/query | Không thể hiển thị hoặc thay đổi notification state. |
| `@notification:new`, unread-count, read-state, updated, removed | Không listener nào | Feed/badge không realtime, aggregate/lifecycle không phản ánh. |
| Socket notification payload raw, không hydrate | Chưa có xử lý | Khi triển khai không thể render rich item chỉ từ event; phải refetch. |
| Conversation có `unread_message_count`, `last_read_message_id`, `last_read_at` | `Conversation` type không khai báo | Field backend bị bỏ qua ở compile model/UI; unread không render. |
| `/conversations/unread-summary` trả hai count + version | Không có API/query key | Messages badge không có source of truth. |
| Read endpoint nhận optional `{message_id}` và trả toàn bộ count/version | `markAsRead` luôn body rỗng, type response chỉ `{success}` và không được gọi | Nếu bắt đầu dùng hàm hiện tại, frontend sẽ bỏ authoritative state và có thể mark quá xa. |
| `@conversation:read` command và `@conversation:read-state` broadcast | Không emit/listen | Không đồng bộ read giữa UI/tab/device. |
| Message mới không còn dual-write `read_by` | `Message.read_by: string[]` là required | Type frontend không khớp payload mới; code tương lai dễ đọc field undefined hoặc dùng sai nguồn unread. |
| Send có `client_message_id`, `mention_user_ids`, ack `message_id` | Payload frontend thiếu cả hai; ack ID bị bỏ, send trả boolean | Retry timeout có thể duplicate; không directed mention; không reconcile optimistic message. |
| Message có additive `kind`, `system_event_type`, `affected_user_ids`, `context` | Type không có các field này | System message render như user message và hiện action backend cấm. |
| User message mới có `kind=user`, legacy thiếu kind fallback user | Frontend không kiểm tra kind | Legacy vẫn render được, nhưng system branch hoàn toàn thiếu. |
| Directed types `message_reply`, `message_mention`; aggregate `message_reaction` | Không có notification types/renderer | Mất activity item dù Chat nhận message/reaction. |
| Generic `message` chỉ compatibility, runtime generic message không tạo item | Frontend không có notification nên chưa tạo sai | Khi thêm feature phải tránh suy diễn mọi receive thành notification. |
| `@message:reaction-updated` là reaction state có thẩm quyền | Listener và cache patch hiện có | Phần này khớp contract về ý nghĩa; notification aggregate vẫn thiếu. |
| Group updated thêm `group_created`, `admin_granted`, `admin_revoked` | `GroupUpdateChangeType` chỉ có info/members/remove/left/admin_transferred | Type mismatch; handler runtime vẫn invalidate generic nếu event qua được, nhưng code không mô tả đầy đủ và nhánh cleanup có thể thiếu. |
| Kick/read-state remove unread state và row | Listener dựa `member_removed` + affected IDs, không nghe read-state | Route cleanup có thể hoạt động theo group event nhưng Sidebar unread không thể đồng bộ. |
| Admin transfer requires atomic endpoint và old admin cleanup | Frontend có đúng endpoint và cleanup ở mutation/listener | Khớp tốt nhất với contract; multi-tab vẫn phụ thuộc event, reconnect miss không reconcile. |
| Target/message lifecycle phát notification updated/removed | Frontend chỉ xử lý message revoke/delete/reaction caches | Notification item stale/không tồn tại vì feature thiếu. |
| Reconnect/focus phải refetch vì socket không replay | Query default tắt focus refetch; connect handler không invalidate | Runtime có thể giữ conversation/message/read/notification stale vô thời hạn sử dụng session. |
| REST/socket state dùng version, không dùng delta | Không có version model | Chưa thể chống out-of-order event hoặc multi-tab state race. |
| Message context navigation cần target ID; contract notification không mô tả fetch-around endpoint | Frontend đang gọi `/messages/:messageId/context` và đã có UI focus | Có capability source-side vượt phần handoff notification, nhưng endpoint cần được xác nhận trong contract backend tổng thể để tránh runtime 404. |
| Mute state không được mô tả trong handoff notification | Frontend kỳ vọng `muted_by` và `/mute` endpoints | Không thể xác nhận độ khớp chỉ từ contract được cung cấp; có thể là contract conversation cũ ngoài tài liệu. |

Các mismatch có khả năng gây lỗi runtime trực tiếp:

- System message `status='sent'` có thể hiện Reply/Reaction/Delete/Revoke actions dù backend từ chối.
- `message.reactions.length` giả định `reactions` luôn tồn tại; nếu system payload/hydration không giữ field này, render sẽ throw.
- `GroupUpdatedEvent.affected_user_ids.includes(...)` giả định array luôn có; type local không phòng payload compatibility thiếu field.
- Login `setAuth(null as any)` làm components đọc current user null trong lúc socket/message UI đã mount.
- Cache không clear logout có thể hiển thị dữ liệu user trước cho user sau.

Frontend hiện không tự quét messages để tính unread và cũng không dùng loaded item count làm badge; điểm này không vi phạm contract vì unread chưa được triển khai. Tuy nhiên không được biến sự thiếu hụt hiện tại thành phép tính client khi bổ sung UI.

## 11. Coupling và technical debt liên quan trực tiếp

### Global provider phụ thuộc feature

`SocketProvider` import và chạy `useConversationSocketSync`. Provider chịu đồng thời connection/auth refresh, block event và conversation domain synchronization. Khi thêm notification/unread, tiếp tục nhồi listener vào provider sẽ làm provider quá lớn và cache mutation khó sở hữu. Connection context có thể giữ; domain listeners nên có ownership rõ trong feature composition.

### Socket listener scope không đúng bản chất

Revoke/delete/reaction là events ảnh hưởng cache toàn app nhưng listener đặt trong `useChatSocket`, chỉ tồn tại khi ChatWindow mount. Nếu event đến lúc user ở Home/Inbox, caches có thể không được patch. Notification lifecycle càng không thể phụ thuộc route mount.

### Route/UI coupling

Global group sync import `usePathname/useRouter` và trực tiếp điều hướng. Điều này giúp kick/leave cleanup ngay nhưng buộc cache listener biết URL string. `/messages` sai composition làm route cleanup đưa user về Home feed thay vì Inbox.

### Duplicate server projections

Message xuất hiện ở timeline/context/search/media caches; group members xuất hiện trong conversation list và member query. Helper đã giảm phân tán cho message action, nhưng receive/group/read/unread vẫn cần transaction cache rõ. Hard-coded query key prefixes làm rủi ro bỏ sót tăng.

### Auth/cache boundary

QueryClient không reset theo session. Đây là debt trực tiếp chặn notification/unread vì badge/feed là dữ liệu cá nhân nhạy cảm và sẽ chịu cùng stale leak nếu thêm vào cache hiện tại mà không có logout cleanup.

### Type debt

- Auth service/forms có `any`, vi phạm AI rules.
- Notification types hoàn toàn thiếu.
- Conversation/Message types là model cũ, thiếu unread, system, mention và client idempotency; vẫn required `read_by` legacy.
- Socket built-in/block payload và API envelopes chỉ typed một phần.

### UI/business logic coupling

MessageList quản lý pagination, scroll, context mode, highlight, dialogs và action mutations trong một component hơn 300 dòng. Thêm read visibility/unread logic trực tiếp vào đây sẽ làm responsibility dày hơn. Review chỉ ghi nhận coupling này vì nó ảnh hưởng trực tiếp khả năng đưa read acknowledgement đúng semantics.

### Unread và reconnect chưa có owner

Không có nơi sở hữu versioned unread summary. Receive listener chỉ patch message/list, Sidebar chỉ render nav tĩnh, ChatWindow không ack. Nếu cache mutation được thêm phân tán ở cả ba nơi sẽ dễ duplicate/delta race.

### Loading/error không nhất quán

Conversation list có skeleton nhưng error không retry; MessageList initial dùng spinner và error không retry; context view có skeleton/retry tốt. Notification requirements cần một pattern thống nhất, nhưng hiện chưa có shared state component.

## 12. File map

### File chắc chắn liên quan

- `src/app/layout.tsx`: provider composition.
- `src/app/(main)/layout.tsx`: Sidebar/main/RightSidebar composition.
- `src/app/(main)/messages/page.tsx`: Inbox landing hiện sai nội dung.
- `src/app/(main)/messages/[conversationId]/page.tsx`: active conversation route.
- `src/components/layout/sidebar.tsx`: hai badge và notification link.
- `src/components/layout/right-sidebar.tsx`: conversation list/details responsive composition.
- `src/providers/app-provider.tsx`: QueryClient/focus/stale/logout cache boundary và Toaster.
- `src/providers/auth-initializer.tsx`: session bootstrap trước personal queries/socket.
- `src/providers/socket-provider.tsx`: socket lifecycle và connection state.
- `src/services/api.client.ts`: auth request/refresh/logout failure.
- `src/features/auth/stores/auth.store.ts`: current user/session state.
- Toàn bộ `src/features/conversations/api`, `types`, `constants`, `hooks`, `stores`, `utils`.
- `conversation-sidebar.tsx`, `conversation-item.tsx`, `chat-window.tsx`, `message-list.tsx`, `message-row.tsx`, `message-bubble.tsx`, `message-input.tsx`, reply/reaction/action components.
- Group details/member/leave components vì group event/system message/route cleanup.

### File có khả năng chịu tác động khi đáp ứng yêu cầu

Đây là impact map, không phải danh sách hành động:

- Một route Notifications dưới `src/app/(main)` hiện đang thiếu.
- Một feature notification dưới `src/features` hiện đang thiếu hoàn toàn.
- `src/features/conversations/types/index.ts` và socket/group action types do contract additive.
- `conversations.api.ts`, conversation query keys/hooks/cache helpers do unread summary/read state.
- `sidebar.tsx`, conversation row/list, ChatWindow/MessageList/MessageRow do badge/unread/system/visibility.
- Provider composition để mount listener domain độc lập và reconcile reconnect.
- Auth logout/session boundary để clear personal caches/stores.

### File có thể tái sử dụng

- `src/services/api.client.ts`: base authenticated API client và refresh single-flight.
- `src/providers/socket-provider.tsx`: socket context/connection base.
- `src/features/conversations/utils/conversation-cache.ts`: scoped cache removal và sort/upsert.
- `src/features/conversations/stores/conversation-details.store.ts`: message focus target.
- `src/features/conversations/hooks/use-message-context.ts` và MessageList context UI: deep-link target.
- `src/features/conversations/components/message-reply-preview.tsx`: reply unavailable treatment trong chat.
- Conversation skeleton/focus/reduced-motion patterns.
- `src/components/ui/button.tsx`, `dialog.tsx` cho shared primitives.
- Packages đã cài: React Query, Zustand, Socket.IO client, date-fns, react-intersection-observer, Sonner, Framer Motion, lucide-react.

### Khu vực không nên chạm tới cho phạm vi notification/unread

- Auth form chức năng như forgot/reset/verify, trừ lỗi session boundary chung đã nêu.
- Tweet create/edit/like/bookmark mutation logic; notification chỉ cần navigation/compact preview, không cần thay TweetCard business actions.
- Media upload pipeline và viewers, trừ khi backend sau này thực sự cung cấp notification thumbnail contract.
- Search page, profile edit và follow modal logic không liên quan trực tiếp.
- Shared Dialog/Input/Button không cần viết lại.
- Backend contract, payload hoặc notification types không được frontend tự mở rộng.

## 13. Blocker hiện tại

### Frontend architecture

- Không có notification feature/route/state/cache/listener nào để mở rộng.
- Personal React Query cache không được clear khi logout/account switch.
- Reconnect/focus không có REST reconciliation trong khi socket không replay.
- Listener message lifecycle global lại chỉ mount trong active ChatWindow.
- `/messages` không phải Inbox landing và mobile không có conversation/navigation UI.
- Không có owner rõ cho versioned notification/inbox unread state.

### Frontend contract/type

- Conversation type thiếu ba read fields.
- Message type thiếu `kind`, system fields, mention IDs, `client_message_id` và `origin_message_id`; `is_forwarded` đã có, còn `read_by` vẫn bị yêu cầu như field bắt buộc.
- Read API type/body không đủ để dùng authoritative response.
- Send command không có idempotency/mention và bỏ ack message ID.
- Group update union thiếu các change type mới.
- Không có notification REST/socket types.

### Backend contract và bằng chứng contract

- File `notification-backend-contract.md` được yêu cầu không tồn tại; chỉ có `../X-ver2/frontend-notification-contract.md`. Nếu đây không phải cùng contract, review cần contract đúng để xác nhận lại.
- Notification socket không hydrate actor/target và không có fetch-by-ID, nên rich realtime item phải chờ refetch page đầu.
- Contract notification handoff không mô tả mute endpoints/`muted_by`, last-message sender projection hoặc message context endpoint mà frontend hiện kỳ vọng; cần contract tổng thể để xác nhận những phần này.
- Backend chưa hỗ trợ push, participant read receipts, notification media thumbnail và một số personal group activity theo `input-frontend-noti.md`.

### Thiếu package

Không có package blocker cho phạm vi hiện tại. React Query, Zustand, Socket.IO client, cursor intersection observer, date formatting, toast, animation và icon đều đã cài. Quy tắc repo cấm thêm package mới, và review không thấy nhu cầu bắt buộc phải thêm package để đáp ứng contract hiện có.

### Chất lượng build hiện tại

- TypeScript compile đạt.
- Lint toàn repo đang fail. Lỗi trực tiếp đáng chú ý cho luồng này là auth `any/null as any`, effect state update trong ProfileMenu/MessageList và console production trong API/socket/auth files.
- System message có nguy cơ runtime/render sai trước cả khi notification UI tồn tại.

### Code chưa tồn tại

- Notification route/page/feed/item/type/service/query/mutation/query keys.
- Notification unread state và Sidebar badge.
- Conversation unread summary query và Messages badge.
- Read acknowledgement hook/visibility policy/read-state listener.
- System message component/branch.
- Mention send/highlight.
- Reconnect/focus reconciliation.
- Mobile navigation và Inbox list.

Các blocker trên là mô tả giới hạn hiện trạng. Thứ tự liệt kê không biểu thị trình tự triển khai.
