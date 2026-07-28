# Kế hoạch nâng cấp trải nghiệm và tương tác trong chat

> Tài liệu này là kế hoạch mở rộng sau `phase-ui-chat.md`, được lập từ code hiện tại của `X-frontend` và `X-ver2`. Contract thật phải đối chiếu route/controller/service/schema và `endpoint.md`; `api.md` chỉ là tài liệu phác thảo. Chưa phase nào trong tài liệu này được xem là hoàn thành cho tới khi code, kiểm tra kỹ thuật và gate của chính phase đó đều đạt.

## 1. Mục tiêu cuối cùng

Sau khi hoàn thành toàn bộ kế hoạch:

1. Message ở direct và group nhận diện được người gửi bằng avatar; group có tên sender ở đầu cụm message, avatar có tooltip dùng được bằng chuột và bàn phím.
2. Người dùng có thể reply message, thu hồi message của mình, xóa một message chỉ ở phía mình và thả/gỡ reaction.
3. Người dùng có thể xóa lịch sử của một conversation vĩnh viễn ở phía mình mà không làm mất dữ liệu của thành viên khác.
4. Conversation đã mute có biểu tượng rõ ràng trong sidebar, tương tự trạng thái pin.
5. Ảnh nằm ngay trong message có thể mở lightbox để xem lớn, điều hướng và đóng bằng bàn phím.
6. REST, Socket.IO, Redis và React Query không hiển thị trạng thái mâu thuẫn sau mutation.

## 2. Kết quả khảo sát code hiện tại

### 2.1. Schema và backend

- `Message.schema.ts` đã có `sender_id`, `reply_to_message_id`, `status` và `reactions`, nhưng chưa có `deleted_by` cho xóa riêng từng người.
- `DirectConversation.schema.ts` và `GroupConversation.schema.ts` mới có `hidden_by`, `pinned_by`, `muted_by`; chưa có mốc xóa lịch sử theo user.
- `@conversation:send` nhận `reply_to_message_id` nhưng mới validate ObjectId, chưa xác minh target tồn tại, thuộc cùng conversation và còn được người gửi nhìn thấy.
- `GET /:conversation_id/messages` chỉ hydrate `medias_info`, chưa trả public identity của sender hoặc preview của message được reply.
- Revoke/delete/react/unreact/reaction-details đã có route và service, nhưng chưa đồng nhất membership, validator, status gate, Redis invalidation và realtime.
- Revoke/delete hiện chỉ đổi `status`; message cache có thể cũ và frontend vẫn render `content` vì chưa hiểu tombstone.
- `DELETE /messages/:message_id` hiện chỉ cho sender và đặt `status: deleted`, trái với mô tả “xóa chỉ phía người gọi” trong `endpoint.md`.
- `reactMessageValidator` chưa validate `emoji`; reaction đang dùng hai update `$pull` rồi `$push`, không nguyên tử.
- Các event action message đang emit vào room `conversation_id`, trong khi socket hiện chỉ join personal room `userId`; `@conversation:receive` đã dùng personal rooms đúng và nên là mẫu chuẩn.
- `DELETE /conversations/:conversation_id` hiện là hide bằng `hidden_by`, không phải xóa lịch sử hay xóa conversation vật lý.
- Search message và shared media đã lọc `status: sent`; message list thường, context, cache và action mutation chưa có một policy visibility dùng chung.
- User module đã có dữ liệu public cần thiết (`_id`, `name`, `username`, `avatar`). Không dùng global search để hydrate sender và không gọi User API theo từng message.

### 2.2. Frontend

- `message-list.tsx` chỉ biết `conversationId`, xác định `isMine` rồi truyền thẳng message vào `message-bubble.tsx`; chưa có clustering hoặc sender identity.
- `message-bubble.tsx` đang gánh text, audio, video, image và timestamp; chưa xử lý status, reply, action menu, reaction hoặc avatar.
- `Message` type đã có các field thô từ schema nhưng chưa có `sender_info`, `reply_to`, `deleted_by` hay reaction summary được type rõ.
- `message-input.tsx` chưa có reply state/bar và chưa truyền `reply_to_message_id` khi gửi.
- `conversations.api.ts` chưa nối revoke/delete/react/unreact/reaction-details.
- `use-chat-socket.ts` chỉ nghe message mới và conversation error; chưa xử lý action event.
- `conversation-item.tsx` chỉ hiển thị icon pin dù `muted_by` và helper `getActiveConversationMute()` đã tồn tại.
- `conversation-media-view.tsx` đã dùng `MediaLightbox`; ảnh trong `message-bubble.tsx` vẫn là `<img>` không tương tác.
- Repo chưa có test runner. Không tự cài Jest/Vitest/Playwright; dùng lint, TypeScript, build và test API/UI thủ công cho tới khi người dùng cho phép bổ sung test framework.

## 3. Quyết định sản phẩm và kiến trúc

### 3.1. Phân biệt hide, delete message và delete chat

| Thao tác              | Phạm vi                                                        | Người khác có bị ảnh hưởng?   | Dữ liệu vật lý                               |
| --------------------- | -------------------------------------------------------------- | ----------------------------- | -------------------------------------------- |
| Hide conversation     | Chỉ bỏ khỏi inbox của actor                                    | Không                         | Giữ nguyên                                   |
| Delete message for me | Ẩn đúng một message với actor                                  | Không                         | Giữ message, thêm actor vào `deleted_by`     |
| Revoke message        | Thu hồi message do actor gửi                                   | Có, mọi member thấy tombstone | Nội dung/media không còn được trả cho client |
| Delete chat for me    | Xóa toàn bộ lịch sử đến một mốc với actor và hide conversation | Không                         | Giữ message, lưu cutoff theo actor           |

Trong kế hoạch này, “xóa hẳn đoạn chat” được chốt là **delete chat for me**. Không triển khai xóa vật lý cho tất cả, giải tán group hoặc cho một phía xóa lịch sử của phía còn lại. Nếu product muốn hành vi đó, phải lập kế hoạch riêng về quyền, retention, media, notification và recovery.

Tin nhắn mới không tự bỏ actor khỏi `hidden_by`, giữ đúng quyết định của kế hoạch cũ. Actor muốn mở lại phải tìm person/group và unhide; khi mở lại chỉ thấy message sau mốc đã clear.

### 3.2. Contract message dùng chung

Response message nên mở rộng theo hướng typed, không trả toàn bộ user document:

```text
sender_info: {
  _id: string,
  name: string,
  username: string,
  avatar?: string
} | null

reply_to?: {
  _id: string,
  sender_info: SenderInfo | null,
  content: string,
  media_type?: image | video | audio,
  status: sent | revoked
} | null

reactions: Array<{ emoji: string, user_id: string }>
deleted_by?: string[]
```

- `sender_info` và `reply_to` là response projection, không copy name/avatar vào schema message.
- Message revoked trả tombstone, không trả lại content/media/reaction cũ.
- Message đã bị actor delete hoặc nằm trước `cleared_at` không xuất hiện trong response của actor.
- Cache Redis vẫn có thể dùng chung, nhưng trước khi trả phải áp dụng visibility của actor; cache không đủ `limit` sau lọc thì fallback MongoDB thay vì trả thiếu trang.

### 3.3. Ranh giới frontend

```text
MessageList
└─ MessageRow                 # layout, clustering, avatar, action trigger
   ├─ MessageSenderAvatar    # public identity + accessible tooltip
   ├─ MessageBubble          # text/tombstone/reply/reaction placement
   │  ├─ MessageReplyPreview
   │  └─ MessageAttachments
   └─ MessageActionsMenu

MessageInput
└─ reply bar đọc message-composer.store
```

- API chỉ nằm trong `features/conversations/api`.
- React Query giữ server state; Zustand chỉ giữ composer selection tạm thời như message đang reply.
- Không đưa domain code vào `src/app`, shared `src/services` hoặc global layout.
- Không tạo viewer ảnh mới; tái sử dụng `features/media/components/viewers/MediaLightbox.tsx`.
- Không để action chỉ xuất hiện bằng hover: desktop có hover/focus, mobile/touch có nút action hoặc long-press có đường thay thế rõ.

### 3.4. Chuẩn event realtime

Các action message dùng personal rooms của member, không dùng room `conversation_id` khi client chưa join room đó:

```text
@message:revoked
@message:deleted-for-me
@message:reaction-updated
@conversation:history-cleared
```

Mỗi payload tối thiểu có `conversation_id`, `message_id` nếu liên quan, actor/status cần thiết và version dữ liệu đủ để client invalidate hoặc patch đúng cache. Delete-for-me/history-cleared chỉ emit tới personal room của actor để đồng bộ nhiều thiết bị.

## 4. Nguyên tắc triển khai

- Mỗi phase chỉ mở 1–2 hành vi người dùng hoặc một backend gate bắt buộc.
- Phase backend/contract phải hoàn thành trước frontend phụ thuộc; không mock field còn thiếu.
- Không triển khai edit/forward UI trong kế hoạch này dù backend có endpoint, vì người dùng chưa yêu cầu.
- Không sửa global Search module; search conversation hiện có chỉ cần áp dụng message visibility mới.
- Mỗi mutation phải xét đồng thời MongoDB, Redis message cache, conversation preview, personal-room event và React Query cache.
- Không optimistic update phá hủy dữ liệu đối với revoke/delete/history clear. Chỉ đóng dialog/remove item sau server success; lỗi giữ UI để retry.
- Mỗi phase frontend phải kiểm tra keyboard, focus, touch target tối thiểu 44px, reduced motion và các breakpoint 320/375/768/1024/desktop.
- Giữ nguyên các thay đổi đang có trong worktree; không format/refactor file ngoài phạm vi phase.

---

## Bước chuẩn bị — Khóa baseline, chưa triển khai

**Mục đích:** ghi nhận trạng thái trước khi code; không yêu cầu test chức năng chưa tồn tại.

**File tạo mới:** không có.

**File sửa:** không có.

**Công việc:**

1. Ghi `git status` của cả hai repo và xác định thay đổi có sẵn của người dùng.
2. Xác nhận route/controller/service/schema và `endpoint.md` là contract thật.
3. Chuẩn bị ba tài khoản khi bắt đầu có code: A/B direct; A/B/C group, A admin và C member thường.
4. Không gửi message, chụp baseline hay đánh dấu test pass ở bước chuẩn bị.

**Gate hoàn thành:** phạm vi đã rõ và worktree đã được ghi nhận; chưa có gate runtime.

## Phase 1 — Backend authorization và đồng bộ chung cho message action

**Trạng thái: Đã hoàn thành.**

**Hai chức năng:** authorize action theo message/conversation; emit/invalidate theo đúng recipients.

**File tạo mới:**

- `X-ver2/src/modules/conversation/conversation-message-access.service.ts`.
- `X-ver2/src/modules/conversation/conversation-message-sync.service.ts`.

**File sửa:**

- `X-ver2/src/modules/conversation/conversation.service.ts`.
- `X-ver2/src/modules/conversation/conversation.validator.ts`.
- `X-ver2/src/modules/conversation/conversation.route.ts`.
- `X-ver2/endpoint.md`, `X-ver2/swagger.yaml`.

**Chi tiết:**

1. Access helper load message một lần, resolve conversation thật từ `conversation_id/conversation_type`, bắt buộc current user là member và hỗ trợ option `requireSender`, `allowedStatuses`.
2. Revoke/delete/react/unreact/reaction-details đều dùng helper; revoke yêu cầu sender, reaction/delete-for-me yêu cầu member.
3. Gắn `messageIdParamValidator` cho revoke/delete; sửa reaction validator thành body typed thay vì object rỗng. Emoji allowlist sẽ khóa ở Phase 11.
4. Sync helper xóa `chat:messages:<conversationId>` và emit tới personal rooms lấy từ access service. Có method riêng emit chỉ actor cho state riêng tư.
5. Không đổi semantics delete/revoke ở phase nền; phase này chỉ đóng lỗ quyền, ID invalid và event/cache stale rõ ràng.

**Gate hoàn thành:** outsider không gọi được action/reaction-details; ObjectId sai trả 400; action event tới đúng member personal rooms; message cache bị xóa sau mutation.

## Phase 2 — Backend hydrate public identity của sender

**Trạng thái: Đã hoàn thành.**

**Một chức năng:** mọi message response/socket có `sender_info` tối thiểu.

**File tạo mới:**

- `X-ver2/src/modules/conversation/conversation-message-hydration.service.ts`.

**File sửa:**

- `X-ver2/src/modules/conversation/dto/index.ts`.
- `X-ver2/src/modules/conversation/conversation.service.ts`.
- `X-ver2/src/socket/chat.handler.ts`.
- `X-ver2/endpoint.md`, `X-ver2/swagger.yaml`.

**Chi tiết:**

1. Hydration service batch unique `sender_id`, query `users` một lần và chỉ project `_id/name/username/avatar`; không gọi User API theo từng message.
2. Áp dụng cho get messages, context, search và shared media để contract nhất quán.
3. Cache hit cũng đi qua hydration; không tin cache legacy đã có đủ field.
4. `@conversation:receive` gắn cùng `sender_info`; sender bị thiếu user trả `null`, client dùng avatar/name fallback mà không crash.
5. Không sửa Search module chung và không trả email/date_of_birth/token.

**Gate hoàn thành:** direct/group, message cũ/mới, cache hit/miss đều có sender identity đúng; không có N+1 user request/query.

## Phase 3 — Frontend avatar, tên sender và message clustering

**Trạng thái: Đã hoàn thành.**

**Hai chức năng:** hiển thị sender identity; gom cụm message liên tiếp.

**File tạo mới:**

- `X-frontend/src/features/conversations/components/message-row.tsx`.
- `X-frontend/src/features/conversations/components/message-sender-avatar.tsx`.

**File sửa:**

- `X-frontend/src/features/conversations/types/index.ts`.
- `X-frontend/src/features/conversations/components/message-list.tsx`.
- `X-frontend/src/features/conversations/components/message-bubble.tsx`.

**Chi tiết:**

1. `MessageList` tính đầu/cuối cụm bằng sender kế trước/kế sau; không tạo state cho dữ liệu dẫn xuất.
2. Incoming direct/group đều có avatar lane; chỉ cuối cụm hiện avatar thật, các row trước giữ spacer để bubble thẳng hàng. Own message vẫn căn phải và không cần avatar.
3. Group hiện tên sender ở đầu cụm; direct không lặp tên trong từng bubble.
4. Avatar 28–32px, fallback rõ, tooltip tên xuất hiện bằng hover và focus; không chỉ dùng `title` mà thiếu visual feedback.
5. Layout áp dụng đồng nhất cho text/image/video/audio, không làm bubble vượt quá vùng chat ở 320px.

**Gate hoàn thành:** phân biệt đúng sender trong group; avatar/name không lặp rối; keyboard đọc được tên; load context/pagination không làm sai clustering ở ranh giới trang.

## Phase 4 — Backend contract reply message

**Trạng thái: Đã hoàn thành.**

**Hai chức năng:** validate reply target; hydrate reply preview.

**File tạo mới:** không có; mở rộng hydration/access service Phase 1–2.

**File sửa:**

- `X-ver2/src/socket/chat.handler.ts`.
- `X-ver2/src/modules/conversation/conversation-message-access.service.ts`.
- `X-ver2/src/modules/conversation/conversation-message-hydration.service.ts`.
- `X-ver2/src/modules/conversation/dto/index.ts`.
- `X-ver2/src/modules/conversation/conversation.service.ts`.
- `X-ver2/endpoint.md`, `X-ver2/swagger.yaml`.

**Chi tiết:**

1. Trước insert, `reply_to_message_id` phải tồn tại, thuộc đúng conversation và đang visible/sent với actor; khác conversation hoặc revoked trả lỗi code ổn định trong socket acknowledgement.
2. Response/broadcast trả `reply_to` compact gồm id, sender public, content rút gọn, media type đầu tiên và status.
3. Không trả toàn bộ media/user document trong quoted preview; không tạo request riêng cho mỗi reply.
4. Khi target về sau revoked, hydration trả unavailable/tombstone; action event Phase 6 cho phép client cập nhật reply preview đang cache.

**Gate hoàn thành:** không tạo dangling/cross-conversation reply; reply text/media có preview đúng trong REST và socket; cache hit không mất reply preview.

## Phase 5 — Frontend reply composer và quoted message

**Trạng thái: Đã hoàn thành.**

**Hai chức năng:** chọn/hủy reply; gửi và hiển thị quoted preview.

**File tạo mới:**

- `X-frontend/src/features/conversations/stores/message-composer.store.ts`.
- `X-frontend/src/features/conversations/components/message-actions-menu.tsx`.
- `X-frontend/src/features/conversations/components/message-reply-preview.tsx`.

**File sửa:**

- `X-frontend/src/features/conversations/types/index.ts`.
- `X-frontend/src/features/conversations/components/message-row.tsx`.
- `X-frontend/src/features/conversations/components/message-bubble.tsx`.
- `X-frontend/src/features/conversations/components/message-input.tsx`.
- `X-frontend/src/features/conversations/components/chat-window.tsx`.
- `X-frontend/src/features/conversations/hooks/use-chat-socket.ts`.

**Chi tiết:**

1. Store chỉ giữ `{ conversationId, replyTo }`; đổi/rời conversation reset, không lưu localStorage.
2. Menu phase này chỉ mở action Reply; desktop dùng hover/focus, touch có nút action truy cập được, Escape đóng và trả focus.
3. Composer có reply bar với sender/content/media label và nút cancel; payload gửi `reply_to_message_id`.
4. Chỉ clear reply sau socket acknowledgement success. Timeout/block/network error giữ draft, media và reply selection.
5. Quoted preview trong bubble có nút focus target bằng context/jump flow hiện có; target unavailable hiển thị copy trung tính.

**Gate hoàn thành:** reply text/media direct/group đúng; lỗi gửi giữ nguyên composer; click quoted message nhảy đúng target cũ hoặc báo unavailable.

## Phase 6 — Backend revoke message đúng semantics

**Trạng thái: Đã hoàn thành.**

**Một chức năng:** sender thu hồi message đối với mọi member.

**File tạo mới:** không có.

**File sửa:**

- `X-ver2/src/modules/conversation/conversation.service.ts`.
- `X-ver2/src/modules/conversation/conversation-message-sync.service.ts`.
- `X-ver2/src/modules/conversation/conversation-message-hydration.service.ts`.
- `X-ver2/src/modules/conversation/dto/index.ts`.
- `X-ver2/endpoint.md`, `X-ver2/swagger.yaml`.

**Chi tiết:**

1. Revoke chỉ cho current sender còn là member và message `sent`; dùng filter nguyên tử để request lặp/race không trả success giả.
2. Update nguyên tử đặt `status: revoked`, xóa `content`, làm rỗng `media_ids/reactions` và bỏ `reply_to_message_id`; giữ sender/time/id làm tombstone. Không chỉ che ở frontend hoặc projection vì cache/endpoint legacy có thể làm lộ payload cũ.
3. Xóa Redis cache, emit `@message:revoked` tới personal rooms của member với conversation/message id.
4. Nếu message là preview cuối, recompute preview hợp lệ gần nhất hoặc tombstone; sidebar không tiếp tục lộ content đã revoke.
5. Search/media không trả revoked; context/main list có thể trả tombstone để giữ mạch hội thoại.

**Gate hoàn thành:** chỉ sender revoke được; hai client đổi sang tombstone realtime; reload/cache hit không lộ content/media cũ; sidebar preview không lộ nội dung thu hồi.

## Phase 7 — Frontend revoke action và tombstone

**Trạng thái: Đã hoàn thành.**

**Hai chức năng:** confirm revoke; đồng bộ tombstone UI.

**File tạo mới:**

- `X-frontend/src/features/conversations/hooks/use-message-actions.ts`.
- `X-frontend/src/features/conversations/components/revoke-message-dialog.tsx`.
- `X-frontend/src/features/conversations/types/message-action.type.ts`.

**File sửa:**

- `X-frontend/src/features/conversations/api/conversations.api.ts`.
- `X-frontend/src/features/conversations/components/message-actions-menu.tsx`.
- `X-frontend/src/features/conversations/components/message-bubble.tsx`.
- `X-frontend/src/features/conversations/hooks/use-chat-socket.ts`.

**Chi tiết:**

1. Chỉ own message trạng thái sent có Revoke; dialog giải thích ảnh hưởng tới mọi người.
2. Không optimistic xóa content trước server success; pending khóa đúng action, lỗi giữ dialog/menu và toast có thể retry.
3. Success/event patch hoặc invalidate messages/context/search/media/conversations query theo conversation id.
4. Tombstone không render attachment/reaction/actions không hợp lệ; reply tới tombstone hiển thị unavailable.

**Gate hoàn thành:** non-owner không thấy/gọi được revoke; nhiều client và reload hiển thị đồng nhất; failure không làm mất bubble cục bộ.

## Phase 8 — Data contract cho delete message phía mình

**Trạng thái: Chưa triển khai.**

**Hai chức năng nền:** visibility riêng theo message; preview riêng theo user khi cần.

**File tạo mới:** không có.

**File sửa:**

- `X-ver2/src/schemas/Message.schema.ts`: thêm `deleted_by`.
- `X-ver2/src/schemas/DirectConversation.schema.ts`.
- `X-ver2/src/schemas/GroupConversation.schema.ts`.
- `X-ver2/src/socket/chat.handler.ts`.
- `X-ver2/src/modules/conversation/conversation.service.ts` phần forward/send preview.
- `X-ver2/src/modules/conversation/dto/index.ts`.

**Chi tiết:**

1. `deleted_by` mặc định `[]`; status `deleted` legacy được coi là unavailable toàn cục, không tiếp tục dùng cho delete-for-me mới.
2. Bổ sung `message_id` optional trong `last_message_preview` để biết preview đang trỏ message nào.
3. Bổ sung `last_message_overrides: [{ user_id, message_id, last_message_at, last_message_preview }]`; mỗi user tối đa một entry. Actor xóa message cuối sẽ nhận preview visible gần nhất của riêng mình, còn member khác vẫn dùng global preview.
4. Send/forward mới set `message_id` và xóa override cũ đã bị message mới supersede; document legacy thiếu field có fallback an toàn.
5. Chưa mở endpoint/UI delete trong phase contract này.

**Gate hoàn thành:** schema/constructor/type compile; send/forward mới lưu preview id; dữ liệu legacy không crash; chưa thay đổi hành vi UI.

## Phase 9 — Backend delete message for me

**Trạng thái: Chưa triển khai.**

**Một chức năng:** member xóa một message chỉ khỏi phía mình.

**File tạo mới:** không có; dùng helper Phase 1–2 và contract Phase 8.

**File sửa:**

- `X-ver2/src/modules/conversation/conversation.service.ts`.
- `X-ver2/src/modules/conversation/conversation-message-hydration.service.ts`.
- `X-ver2/src/modules/conversation/conversation-message-sync.service.ts`.
- `X-ver2/src/modules/conversation/conversation.controller.ts` nếu response type cần chuẩn hóa.
- `X-ver2/endpoint.md`, `X-ver2/swagger.yaml`.

**Chi tiết:**

1. `DELETE /messages/:message_id` cho mọi current member đang thấy message; atomic `$addToSet` actor vào `deleted_by`, không đổi global status.
2. Main messages, context, search, shared media và reaction-details đều áp dụng `deleted_by != currentUserId` trước sort/limit.
3. Cache hit lọc theo actor; nếu còn dưới `limit`, fallback MongoDB để pagination không hụt/duplicate.
4. Nếu actor xóa preview hiện tại, tính preview visible gần nhất cho actor và lưu override; không sửa preview của người khác.
5. Emit `@message:deleted-for-me` chỉ tới personal room actor; không gửi cho member khác.

**Gate hoàn thành:** actor có thể xóa message của mình hoặc người khác chỉ phía actor; thiết bị thứ hai của actor đồng bộ; B vẫn thấy message; search/media/context không làm message xuất hiện lại.

## Phase 10 — Frontend delete message for me

**Trạng thái: Chưa triển khai.**

**Một chức năng:** menu và confirm xóa message phía mình.

**File tạo mới:**

- `X-frontend/src/features/conversations/components/delete-message-dialog.tsx`.

**File sửa:**

- `X-frontend/src/features/conversations/api/conversations.api.ts`.
- `X-frontend/src/features/conversations/hooks/use-message-actions.ts`.
- `X-frontend/src/features/conversations/components/message-actions-menu.tsx`.
- `X-frontend/src/features/conversations/hooks/use-chat-socket.ts`.

**Chi tiết:**

1. Mọi message visible có “Delete for me”; copy nói rõ người khác vẫn thấy.
2. Chỉ remove/invalidate cache sau success; refetch page để bù đủ pagination thay vì tự nối sai cursor.
3. Xóa đồng thời khỏi main/context/search/media cache của actor và refresh conversation preview.
4. Realtime private event đồng bộ tab/device khác nhưng không phát toast cho người còn lại.

**Gate hoàn thành:** delete đúng một phía, không nhảy cursor/duplicate, preview sidebar actor đúng và message không quay lại sau reload.

## Phase 11 — Backend reaction nguyên tử và an toàn

**Trạng thái: Chưa triển khai.**

**Hai chức năng:** thả/đổi/gỡ reaction; xem người reaction.

**File tạo mới:** không có.

**File sửa:**

- `X-ver2/src/modules/conversation/conversation.validator.ts`.
- `X-ver2/src/modules/conversation/conversation.service.ts`.
- `X-ver2/src/modules/conversation/conversation-message-sync.service.ts`.
- `X-ver2/src/modules/conversation/dto/index.ts`.
- `X-ver2/endpoint.md`, `X-ver2/swagger.yaml`.

**Chi tiết:**

1. Chốt allowlist reaction nhỏ, ví dụ `👍 ❤️ 😂 😮 😢 😡`; reject chuỗi rỗng, emoji ngoài danh sách và payload dư.
2. Chỉ current member, message sent và visible với actor được react/unreact/xem details.
3. Một user tối đa một reaction/message; đổi reaction bằng một update pipeline nguyên tử, không `$pull`/`$push` tách hai query.
4. API trả reaction list/summary mới; details chỉ project public identity.
5. Xóa cache và emit `@message:reaction-updated` tới personal rooms member.

**Gate hoàn thành:** concurrent react không sinh duplicate user; outsider/deleted/revoked bị từ chối; reaction đồng bộ nhiều client và reload.

## Phase 12 — Frontend reaction picker, summary và details

**Trạng thái: Chưa triển khai.**

**Hai chức năng:** thả/gỡ reaction; xem chi tiết reaction.

**File tạo mới:**

- `X-frontend/src/features/conversations/components/message-reaction-picker.tsx`.
- `X-frontend/src/features/conversations/components/message-reaction-summary.tsx`.
- `X-frontend/src/features/conversations/components/message-reactions-dialog.tsx`.

**File sửa:**

- `X-frontend/src/features/conversations/types/message-action.type.ts`.
- `X-frontend/src/features/conversations/api/conversations.api.ts`.
- `X-frontend/src/features/conversations/hooks/use-message-actions.ts`.
- `X-frontend/src/features/conversations/components/message-actions-menu.tsx`.
- `X-frontend/src/features/conversations/components/message-bubble.tsx`.
- `X-frontend/src/features/conversations/hooks/use-chat-socket.ts`.

**Chi tiết:**

1. Picker compact dùng allowlist backend; không cần cài package mới hoặc mở full emoji picker của composer.
2. Summary nhóm theo emoji/count, đánh dấu reaction của current user; click mở dialog danh sách user public.
3. Keyboard arrow/Enter/Escape, focus return và touch target đạt chuẩn; animation 150–250ms, reduced motion tắt scale.
4. Mutation pending tránh double click; error rollback/refetch, event server là nguồn thật.

**Gate hoàn thành:** react/đổi/gỡ đúng ở direct/group; counts và details đúng nhiều client; revoked/deleted message không còn picker.

## Phase 13 — Lightbox cho ảnh trong message

**Trạng thái: Chưa triển khai.**

**Một chức năng:** mở ảnh attachment trực tiếp từ bubble.

**File tạo mới:**

- `X-frontend/src/features/conversations/components/message-attachments.tsx`.

**File sửa:**

- `X-frontend/src/features/conversations/components/message-bubble.tsx`.
- `X-frontend/src/features/media/components/viewers/MediaLightbox.tsx`.

**Chi tiết:**

1. Tách image/video/audio rendering khỏi bubble; giữ behavior video/audio đang ổn.
2. Ảnh bọc trong semantic button, Enter/Space mở lightbox; một message nhiều ảnh cho phép previous/next đúng index.
3. Reuse `MediaLightbox`, bổ sung label tùy ngữ cảnh thay vì hard-code “Shared media viewer”.
4. Escape/backdrop đóng, trap/return focus đúng; không kích hoạt message action menu khi click ảnh.

**Gate hoàn thành:** ảnh text-only/multi-media mở lớn đúng; video/audio không regression; keyboard/mobile/focus đều hoạt động.

## Phase 14 — Icon mute trong conversation sidebar

**Trạng thái: Chưa triển khai.**

**Một chức năng:** hiển thị trạng thái notifications muted cạnh pin.

**File tạo mới:** không có.

**File sửa:**

- `X-frontend/src/features/conversations/components/conversation-item.tsx`.
- `X-frontend/src/features/conversations/hooks/use-conversation-actions.ts` chỉ khi cần tách helper pure sang file phù hợp.

**Chi tiết:**

1. Reuse `getActiveConversationMute()`, không viết lại logic `until` trong component.
2. Render `BellOff` và `Pin` trong trailing icon group; cả hai có accessible label, không làm co title/time ở 320px.
3. Optimistic mute/unmute hiện có phải cập nhật icon ngay; server refetch rollback khi lỗi.
4. Mute hết hạn không được coi active khi render lại; không sửa backend contract nếu `muted_by` hiện có đủ dữ liệu.

**Gate hoàn thành:** icon đúng sau mute/unmute/reload và hết hạn; pinned+muted cùng lúc không lệch layout.

## Phase 15 — Backend delete chat history for me

**Trạng thái: Chưa triển khai.**

**Một chức năng:** clear toàn bộ lịch sử đến thời điểm hiện tại chỉ cho actor.

**File tạo mới:** không có.

**File sửa:**

- `X-ver2/src/schemas/DirectConversation.schema.ts`.
- `X-ver2/src/schemas/GroupConversation.schema.ts`.
- `X-ver2/src/modules/conversation/conversation.validator.ts`.
- `X-ver2/src/modules/conversation/conversation.route.ts`.
- `X-ver2/src/modules/conversation/conversation.controller.ts`.
- `X-ver2/src/modules/conversation/conversation.service.ts`.
- `X-ver2/src/modules/conversation/conversation-message-hydration.service.ts`.
- `X-ver2/src/modules/conversation/conversation-message-sync.service.ts`.
- `X-ver2/endpoint.md`, `X-ver2/swagger.yaml`.

**Contract đề xuất:**

```text
DELETE /api/conversations/:conversation_id/history
data: { success: true, cleared_at: ISODate }
```

**Chi tiết:**

1. Schema thêm `history_cleared_by: [{ user_id, cleared_at, cleared_through_message_id }]`; update thay mốc cũ của actor bằng mốc mới, không thêm duplicate. `cleared_through_message_id` chụp message mới nhất tại thời điểm clear để phân trang theo `_id` ổn định, `cleared_at` phục vụ audit/copy UI.
2. Operation cùng lúc add actor vào `hidden_by`, bỏ actor khỏi `pinned_by/muted_by` và reset preview override của actor; không delete message/media vật lý.
3. Main messages/context/search/media/read chỉ nhận message có `_id > cleared_through_message_id`; target tại/trước cutoff trả 404 với actor nhưng member khác vẫn đọc được. Không lọc chính bằng clock `send_at` vì dễ lệch thời gian và khó tận dụng index timeline hiện có.
4. Redis cache bị invalidate; event `@conversation:history-cleared` chỉ tới actor devices.
5. New message không tự `$pull hidden_by`. Khi actor chủ động unhide, chỉ message sau `cleared_at` xuất hiện.

**Gate hoàn thành:** A clear không ảnh hưởng B/C; A không lấy lại lịch sử cũ qua API/search/media/context; unhide A chỉ thấy message mới hơn cutoff; group/direct cùng semantics.

## Phase 16 — Frontend delete chat history for me

**Trạng thái: Chưa triển khai.**

**Một chức năng:** destructive action “Delete chat for me” trong details.

**File tạo mới:**

- `X-frontend/src/features/conversations/components/delete-chat-history-dialog.tsx`.

**File sửa:**

- `X-frontend/src/features/conversations/types/conversation-action.type.ts`.
- `X-frontend/src/features/conversations/api/conversations.api.ts`.
- `X-frontend/src/features/conversations/hooks/use-conversation-actions.ts`.
- `X-frontend/src/features/conversations/components/conversation-details-overview.tsx`.
- `X-frontend/src/features/conversations/hooks/use-chat-socket.ts` hoặc global conversation sync hook cho private event.

**Chi tiết:**

1. Giữ Hide và Delete chat for me là hai action/copy khác nhau; delete dùng destructive confirm nói rõ không thể khôi phục ở phía actor nhưng người khác không bị ảnh hưởng.
2. Không optimistic clear. Success remove conversation khỏi sidebar, đóng details, route `/messages` và remove/invalidate messages/context/search/media/conversations keys của id.
3. Error giữ dialog và lịch sử hiện tại; không route hoặc clear cache giả.
4. Event private từ thiết bị khác thực hiện cùng cleanup, tránh tab cũ tiếp tục render history.

**Gate hoàn thành:** direct/group delete đúng phía actor; browser back không render cache cũ; B/C không thấy thay đổi; hide/unhide cũ không bị đổi semantics.

## Phase 17 — Release audit và cập nhật tài liệu

**Trạng thái: Chưa triển khai.**

**Chức năng:** không mở thêm feature; khóa chất lượng toàn bộ kế hoạch.

**File tạo mới:** chỉ test file nếu repo đã có runner hoặc người dùng cho phép thiết lập; mặc định không có.

**File sửa dự kiến:**

- Các file trong phase trước nếu audit phát hiện lỗi type/lint/a11y/runtime thuộc đúng phạm vi.
- `X-ver2/endpoint.md`, `X-ver2/swagger.yaml`.
- `X-frontend/input-ui-chat.md` nếu cần cập nhật tư duy sản phẩm đã chốt.
- `X-frontend/phase-update-chat.md`: chỉ đánh dấu phase đã thực sự đạt gate.

**Checklist bắt buộc:**

1. Frontend: `npm run lint`, `npx tsc --noEmit`, `npm run build`.
2. Backend: `npm run lint`, `npm run prettier`, `npm run build`; Swagger YAML parse thành công.
3. API security: outsider, removed group member, invalid ObjectId, cross-conversation reply và action vào revoked/deleted đều bị từ chối đúng code.
4. Direct A/B và group A/B/C: sender avatar, reply, revoke, delete-for-me, reactions và history clear.
5. Realtime nhiều tab/device: receive, revoke, private delete, reaction, private history clear; không event sai người.
6. Redis: cache hit/miss cùng response; mutation không làm content revoked/deleted quay lại; pagination đủ `limit`, không duplicate.
7. Search/context/media: cùng visibility policy với message list.
8. Sidebar preview: revoke/delete-for-me/history clear không lộ nội dung actor không còn quyền thấy.
9. UI: mute icon, image lightbox, desktop hover/focus và mobile touch.
10. Responsive 320/375/768/1024/desktop; không overflow ngang hoặc che composer/menu/dialog.
11. Accessibility: semantic button/menu/dialog, focus trap/return, Escape, aria-label/live error, reduced motion.
12. Không `any` mới, không direct fetch trong component, không package mới và không domain logic trong `src/app`/global services.

**Gate hoàn thành:** toàn bộ checklist đạt hoặc lỗi tồn tại trước được ghi bằng bằng chứng và không ảnh hưởng feature mới; chỉ lúc đó mới coi kế hoạch update chat hoàn thành.

---

## 5. Bảng phụ thuộc

| Phase                | Phụ thuộc bắt buộc                        | Không được làm sớm                                        |
| -------------------- | ----------------------------------------- | --------------------------------------------------------- |
| 2 Sender contract    | Phase 1                                   | Frontend không tự lookup từng user                        |
| 3 Sender UI          | Phase 2                                   | Không fake `sender_info` từ group member list             |
| 4 Reply backend      | Phase 1–2                                 | Không chỉ lưu raw reply id                                |
| 5 Reply frontend     | Phase 4                                   | Không gửi reply nếu server chưa validate/hydrate          |
| 6–7 Revoke           | Phase 1–2                                 | Không mở menu revoke khi cache/event còn sai              |
| 8–10 Delete message  | Phase 1–2, Phase 8 contract trước Phase 9 | Không tái dùng global `status: deleted` cho delete-for-me |
| 11–12 Reaction       | Phase 1                                   | Không dùng validator rỗng/hai update rời                  |
| 13 Image lightbox    | Không cần backend mới                     | Không tạo viewer thứ hai                                  |
| 14 Mute icon         | Mute Phase 6 kế hoạch cũ                  | Không thêm `is_muted` contract nếu `muted_by` đủ          |
| 15–16 Delete history | Phase 8–10 visibility foundation          | Không deleteMany message hoặc xóa Cloudinary              |
| 17 Audit             | Tất cả phase trước                        | Không đánh dấu pass bằng compile thay cho runtime         |

## 6. Thứ tự phát hành khuyến nghị

1. **Release A — identity:** Phase 1–3.
2. **Release B — reply:** Phase 4–5.
3. **Release C — message removal:** Phase 6–10.
4. **Release D — reactions:** Phase 11–12.
5. **Release E — UI polish:** Phase 13–14.
6. **Release F — delete chat for me:** Phase 15–16.
7. **Release final:** Phase 17.

Mỗi release nên nằm trong commit/nhóm commit độc lập để revert đúng chức năng. Nếu một phase fail gate, dừng tại đó; không tiếp tục phase frontend bằng mock hoặc nới lỏng quyền backend.

## 7. Chủ động ngoài phạm vi

- Xóa conversation/message vật lý cho tất cả người dùng.
- Giải tán group, chuyển quyền admin hoặc retention/compliance workflow.
- Edit message và forward UI.
- Read receipt UI chi tiết.
- Notification/system message cho reaction/reply/member change.
- PDF/Word/document attachment.
- Refactor global Search/User legacy `any` ngoài các projection/type bắt buộc cho message contract.
