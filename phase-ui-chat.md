# Kế hoạch triển khai Conversation Details cho nút `i`

> Phạm vi tài liệu: lập kế hoạch cho giao diện và các luồng phía sau nút `i` trong trang chat, có đối chiếu mã nguồn frontend `X-frontend` và backend `X-ver2` tại thời điểm viết. Tài liệu này **không coi `api.md` là contract thật**; `endpoint.md`, route/controller/service/schema hiện có mới là nguồn xác nhận chính.

## 1. Mục tiêu cuối cùng

Khi đang ở `/messages/:conversationId`:

- Mặc định cột bên phải vẫn hiển thị `ConversationSidebar` như hiện tại.
- Bấm nút `i` trong header chat sẽ thay riêng nội dung cột bên phải bằng `ConversationDetailsPanel`; khung chat ở giữa không bị unmount, mất nội dung đang gõ hoặc mất vị trí cuộn.
- Bấm lại đúng nút `i` sẽ đóng details và đưa `ConversationSidebar` trở lại.
- Nút `i` phải có trạng thái active rõ ràng: `aria-pressed`, nền/icon khác trạng thái thường và animation nhẹ 150–250 ms. Không dùng gradient, glassmorphism hoặc hiệu ứng nặng.
- Khi đổi conversation, đóng chat bằng nút `X`, hoặc rời `/messages`, trạng thái details cũ phải được reset, không “rò” sang conversation khác.
- Trên màn hình nhỏ hơn `lg`, nơi `RightSidebar` hiện đang bị ẩn, cùng nội dung details được hiển thị dưới dạng lớp full-height trong vùng chat, có nút quay lại và quản lý focus đúng chuẩn.

Các chức năng dự kiến trong panel:

1. Tổng quan người/nhóm và liên kết xem profile.
2. Ghim/bỏ ghim.
3. Tắt/bật thông báo theo thời lượng.
4. Tìm kiếm tin nhắn và nhảy tới đúng tin nhắn.
5. Xem ảnh, video, audio đã gửi.
6. Tạo nhóm mới với người đang chat trực tiếp.
7. Ẩn cuộc trò chuyện khỏi hộp thư của chính mình.
8. Chặn/bỏ chặn người đang chat trực tiếp.
9. Với group: đổi tên/avatar, xem/thêm/xóa thành viên và rời nhóm.

## 2. Kết quả khảo sát code hiện tại

### 2.1. Frontend

- `src/features/conversations/components/chat-window.tsx` chứa nút `Info`, nhưng nút chưa có handler.
- `src/components/layout/right-sidebar.tsx` tự render `ConversationSidebar` khi pathname bắt đầu bằng `/messages`; component này độc lập với `ChatWindow`.
- Vì hai component nằm ở hai nhánh khác nhau của layout, state mở details phải đặt trong feature `conversations`, không đặt business/UI state trong `src/app` và không truyền props xuyên qua `MainLayout`.
- `src/app/(main)/messages/[conversationId]/page.tsx` đang đúng vai trò thin route wrapper và không cần thêm logic.
- React Query, Zustand, Framer Motion, Zod, Sonner và Lucide đã có trong `package.json`; **không cần cài package mới**.
- API chat mới chỉ có lấy danh sách conversation, lấy message, tạo direct/group và mark read. Các API pin, mute, search, media, group member, hide chưa được nối vào frontend.
- `MessageList` đang dùng infinite query, API trả tin mới nhất trước rồi frontend đảo lại để render. Điều này phải được giữ nguyên khi thêm “jump to message”.
- `Conversation` đã có `is_pinned`, `muted_by`, `partner_info` và dữ liệu group cơ bản; trạng thái mute active có thể suy ra từ `muted_by` của current user và thời gian `until`.
- Các viewer ảnh/video/audio đã có trong feature `media`, có thể tái sử dụng. Không tạo viewer riêng trong feature conversation.
- Repo chưa có test runner/test script. Không được tự cài Jest/Vitest/Playwright; mỗi phase dùng lint, TypeScript, build và test API/UI thủ công cho đến khi người dùng cho phép bổ sung test framework.

### 2.2. Backend và contract thật

- Prefix thật là `/api/conversations`, `/api/media`, `/api/user`, `/api/search`. `endpoint.md` đang ghi User Module là `/users`, nhưng frontend hiện dùng `/user` và khớp `app.ts`.
- `GET /conversations/:id/search` đã có cursor pagination và MongoDB text search.
- `DatabaseService.createIndexes()` có tạo compound text index cho message, nhưng `app.ts` chưa gọi hàm này khi bootstrap.
- `GET /conversations/:id/media` hiện chỉ trả message có `media_ids`, chưa `$lookup` collection `medias`; frontend không nên tạo N+1 request bằng cách gọi `GET /media/:id` cho từng item.
- Media gửi trong chat hiện chỉ hỗ trợ `image | video | audio`; `file` trong type/preview không đồng nghĩa backend đã hỗ trợ PDF, Word hoặc file tài liệu.
- `POST/DELETE /:id/pin`, `POST/DELETE /:id/mute`, `DELETE /:id`, group routes và user block routes đã tồn tại.
- `DELETE /conversations/:id` chỉ thêm current user vào `hidden_by`; nhãn UI đúng phải là **“Ẩn/Xóa khỏi hộp thư của bạn”**, không được mô tả là xóa cho mọi người.
- `getOrCreateDirectConversation()` đang reset `hidden_by: []`, có thể làm conversation hiện lại cho cả hai người. Phải đổi thành chỉ `$pull` người đang mở lại.
- Nhiều method nhận `userId` nhưng chưa kiểm tra membership; riêng `getMessages()` còn chưa nhận `userId` từ controller. Không được public search/media/group UI trước khi khóa quyền truy cập.
- Mutate group chưa invalidation cache `conv_members:*`; socket có thể giữ danh sách member cũ trong 24 giờ.
- Socket chỉ join room theo `userId`; các event message edit/revoke/react hiện emit theo `conversation_id`, nên client khác không nhận được event đó.
- User block hiện chỉ ghi vào collection `userBlocks`; `@conversation:send` chưa kiểm tra block hai chiều. Vì vậy chưa được đưa nút “Block” ra production trước phase gia cố tương ứng.
- Group schema có `admin_only_messaging` và `last_seen`, nhưng chưa có luồng API hoàn chỉnh. Nickname chỉ có trong tài liệu phác thảo, không có trong direct schema/implementation.

## 3. Quyết định kiến trúc

### 3.1. State của panel

Tạo Zustand store trong `src/features/conversations/stores/`, giữ một nguồn sự thật duy nhất:

```text
openConversationId: string | null
view: overview | search | media | members
targetMessageId: string | null
```

- `toggleDetails(conversationId)`: cùng id thì đóng; id khác thì mở overview cho id mới.
- `closeDetails()`: reset cả view và target.
- `openView(view)`: chỉ đổi subview trong panel đang mở.
- `focusMessage(messageId)` / `clearFocusedMessage()`: phục vụ jump-to-message, không tạo state trùng trong component.

Không lưu state này vào localStorage: details là state tạm theo route, reload nên trở về danh sách conversation.

### 3.2. Ranh giới component

```text
MainLayout
├─ ChatWindow
│  ├─ nút i đọc/ghi conversation-details.store
│  ├─ MessageList đọc targetMessageId khi cần
│  └─ mobile ConversationDetailsPanel
└─ RightSidebar
   └─ desktop: ConversationSidebar ↔ ConversationDetailsPanel
```

- `right-sidebar.tsx` chỉ làm nhiệm vụ layout/switch; toàn bộ UI và logic details nằm trong `features/conversations` để giữ FSD.
- Component không gọi API trực tiếp. Mỗi request nằm trong `conversations.api.ts` hoặc `user.service.ts`; React Query hook quản lý server state.
- Mutation thành công phải cập nhật/invalidate đúng query key. Mutation lỗi phải rollback hoặc refetch và báo bằng Sonner.
- Không đưa các thao tác reply/edit/revoke/delete/reaction/forward vào panel `i`; chúng thuộc menu của từng message.

### 3.3. Hành vi responsive và animation

| Tình huống                  | Hành vi                                                             |
| --------------------------- | ------------------------------------------------------------------- |
| Desktop `lg+`, details đóng | Cột phải render `ConversationSidebar`                               |
| Desktop `lg+`, details mở   | Cột phải render `ConversationDetailsPanel`, chat giữa giữ nguyên    |
| Bấm `i` lần hai             | Đóng details, trả lại `ConversationSidebar`                         |
| Đổi conversation            | Reset về overview/đóng details, không giữ subview của id cũ         |
| Mobile/tablet               | Details phủ vùng chat dưới header chính; back/close trả về chat     |
| `prefers-reduced-motion`    | Tắt translate/scale, chỉ đổi trạng thái tức thời hoặc fade rất ngắn |

Framer Motion chỉ dùng `AnimatePresence` + fade/translate nhỏ trong 150–250 ms. Nút `i` active dùng màu nền `#181818`, icon accent nhất quán, focus ring rõ; không xoay mạnh hoặc animation lặp.

## 4. Nguyên tắc chia phase

- Mỗi phase chỉ mở tối đa 1–2 hành vi người dùng.
- Backend security/data gate phải hoàn thành trước phase frontend phụ thuộc vào nó.
- Kết thúc từng phase phải lint/typecheck/build phần vừa tác động và test lại luồng toggle `i`; không dồn kiểm thử tới cuối.
- Không đổi tên hàng loạt file legacy (`conversations.api.ts`, `types/index.ts`) trong phạm vi này. File mới phải theo naming convention của `architecture.md`.
- Nếu một phase fail gate, dừng ở phase đó; không triển khai phase kế tiếp bằng mock hoặc dữ liệu giả.

---

## Bước chuẩn bị — Khóa phạm vi và contract (không phải phase triển khai)

**Mục đích:** chỉ xác nhận phạm vi trước khi bắt đầu Phase 1; chưa code và chưa kiểm thử chức năng.

**File tạo mới:** không có.

**File sửa:** không có.

**Công việc:**

1. Chốt nguồn contract: code route/controller/service và `endpoint.md` là nguồn chính; `api.md` chỉ tham khảo.
2. Chốt danh sách file dự kiến tạo/sửa và dependency giữa các phase trong tài liệu này.
3. Ghi nhận `git status` để bảo toàn thay đổi có sẵn của người dùng trước khi bắt đầu code.
4. Không tạo tài khoản test, không gửi message và không chạy test UI/socket ở bước này.

**Gate hoàn thành:** phạm vi và contract đã rõ để bắt đầu Phase 1; chưa có yêu cầu về kết quả test chức năng.

## Phase 1 — Backend membership authorization và message index

**Trạng thái: Đã hoàn thành.**

**Hai chức năng:** khóa quyền truy cập conversation; bảo đảm search index được tạo khi khởi động.

**File tạo mới:**

- `X-ver2/src/modules/conversation/conversation-access.service.ts`: helper typed để tìm direct/group, xác nhận member, lấy member ids và trả `404/403` nhất quán.

**File sửa:**

- `X-ver2/src/modules/conversation/conversation.service.ts`: dùng helper cho get messages, search, media, hide, pin, mute, forward và các group action; bỏ các update chỉ lọc `_id` mà không lọc member.
- `X-ver2/src/modules/conversation/conversation.controller.ts`: truyền `user_id` vào `getMessages()` và giữ response shape hiện tại.
- `X-ver2/src/socket/chat.handler.ts`: dùng chung helper membership thay vì một bản logic/cache riêng rẽ.
- `X-ver2/src/app.ts`: gọi `await databaseService.createMessageIndexes()` sau `connect()` và trước khi server nhận request để index chat không bị chặn bởi dữ liệu legacy của module khác.
- `X-ver2/endpoint.md`, `X-ver2/swagger.yaml`: ghi rõ các endpoint conversation yêu cầu membership và có thể trả 403.

**Chi tiết:**

1. Helper phải phân biệt conversation không tồn tại (404) với tồn tại nhưng không phải member (403), không làm lộ nội dung.
2. Direct kiểm tra `user1_id/user2_id`; group kiểm tra `members.user_id`.
3. `getMessages` đổi signature nội bộ thành `(userId, conversationId, cursor, limit)`; URL và JSON response không đổi.
4. Pin/mute/hide chỉ update document khi current user là member.
5. Forward chỉ cho phép đọc message `sent` trong conversation nguồn mà current user là member; mọi conversation đích phải tồn tại và current user cũng phải là member.
6. Bootstrap index phải idempotent; không tạo index mỗi request.

**Gate hoàn thành:** tài khoản ngoài conversation không thể get messages/search/media/pin/mute/hide/forward; member hợp lệ vẫn dùng được; backend build pass; khởi động hai lần không lỗi index.

## Phase 2 — Backend search/media trả dữ liệu an toàn và đủ dùng

**Trạng thái: Đã hoàn thành.**

**Hai chức năng:** chuẩn hóa kết quả search; loại N+1 cho shared media.

**File tạo mới:** không có.

**File sửa:**

- `X-ver2/src/modules/conversation/conversation.service.ts`.
- `X-ver2/src/modules/conversation/conversation.validator.ts` nếu cần siết cursor/limit cho hai endpoint.
- `X-ver2/src/modules/conversation/dto/index.ts`: thay `any` ở response liên quan bằng type cụ thể, không đổi JSON contract ngoài phần bổ sung `medias_info`.
- `X-ver2/src/schemas/Message.schema.ts` nếu cần export type dùng chung, không đổi database fields.
- `X-ver2/endpoint.md`, `X-ver2/swagger.yaml`.

**Chi tiết:**

1. Search và media loại message `revoked`/`deleted`; search chỉ tìm content text hợp lệ.
2. Media dùng aggregation `$lookup` từ `media_ids` sang `medias`, trả `medias_info` giống `getMessages`; chỉ trả metadata `ready` cần cho render.
3. Giữ cursor theo `_id` và response `{ messages, next_cursor, has_next_page }` để frontend dùng cùng cấu trúc phân trang.
4. Không bổ sung PDF/Word/file document giả. Type frontend cho gallery chỉ là `image | video | audio`.

**Gate hoàn thành:** một page shared media không phát sinh request `/media/:id` cho từng item; message bị revoke/delete không xuất hiện; search không lỗi vì thiếu index.

## Phase 3 — Khung panel desktop và toggle nút `i`

**Trạng thái: Đã hoàn thành.**

**Một chức năng:** bấm `i` chuyển cột phải giữa conversation list và details, bấm lần nữa quay lại.

**File tạo mới:**

- `X-frontend/src/features/conversations/stores/conversation-details.store.ts`.
- `X-frontend/src/features/conversations/types/conversation-panel.type.ts`.
- `X-frontend/src/features/conversations/components/conversation-details-panel.tsx`.

**File sửa:**

- `X-frontend/src/features/conversations/components/chat-window.tsx`.
- `X-frontend/src/components/layout/right-sidebar.tsx`.

**Chi tiết:**

1. Store giữ `openConversationId`, `view`, `targetMessageId` và các action đã nêu ở mục 3.1.
2. `ChatWindow` xác định active bằng `openConversationId === conversationId`; nút dùng `aria-label`, `aria-pressed`, `aria-controls` và visible focus.
3. `RightSidebar` chỉ render details khi pathname có conversation id và store id khớp; các trường hợp khác render `ConversationSidebar`.
4. `AnimatePresence` dùng key `conversation-list`/`conversation-details`; animation 150–250 ms, không làm thay đổi width 350 px.
5. Khi conversation không tồn tại/loading, không cho mở details của dữ liệu chưa có.
6. Cleanup khi đổi route hoặc bấm `X`; không reset do một render bình thường.

**Gate hoàn thành:** kiểm thử lặp 20 lần open/close không mất draft trong `MessageInput`, không refetch/unmount `MessageList`, nút có active state rõ và keyboard Space/Enter hoạt động.

## Phase 4 — Nội dung overview và trải nghiệm mobile

**Trạng thái: Đã hoàn thành.**

**Hai chức năng:** hiển thị danh tính conversation; mở/đóng details trên mobile.

**File tạo mới:**

- `X-frontend/src/features/conversations/components/conversation-details-overview.tsx`.
- `X-frontend/src/features/conversations/components/conversation-details-mobile.tsx`.

**File sửa:**

- `X-frontend/src/features/conversations/components/conversation-details-panel.tsx`.
- `X-frontend/src/features/conversations/components/chat-window.tsx`.

**Chi tiết:**

1. Direct hiển thị avatar, name, username, online indicator và link `/profile/:username`.
2. Group hiển thị avatar, name và số member lấy từ dữ liệu hiện có; chưa render nút admin ở phase này.
3. Desktop panel có header “Conversation details” và nút đóng; mobile dùng cùng panel content, không copy markup/action.
4. Mobile layer không phá lịch sử chat; khi mở phải khóa scroll nền, focus vào heading/close, Escape đóng và focus trả về nút `i`.
5. Loading >300 ms dùng skeleton, lỗi có retry; không dùng spinner trống.

**Gate hoàn thành:** direct/group render đúng identity; desktop và mobile dùng cùng state; screen reader đọc được dialog/panel title và trạng thái nút.

## Phase 5 — Ghim/bỏ ghim conversation

**Trạng thái: Đã hoàn thành.**

**Một chức năng:** pin/unpin, tối đa năm conversation theo backend.

**File tạo mới:**

- `X-frontend/src/features/conversations/hooks/use-conversation-actions.ts`.
- `X-frontend/src/features/conversations/types/conversation-action.type.ts`.

**File sửa:**

- `X-frontend/src/features/conversations/api/conversations.api.ts`: thêm `pinConversation`/`unpinConversation` typed.
- `X-frontend/src/features/conversations/components/conversation-details-overview.tsx`.
- `X-frontend/src/features/conversations/components/conversation-item.tsx` chỉ nếu cần thay emoji pin bằng Lucide icon/accessibility label; không đổi layout ngoài phạm vi.

**Chi tiết:**

1. Action label lấy từ `conversation.is_pinned`, không giữ boolean bản sao trong local state.
2. Mutation optimistic cập nhật `CONVERSATIONS_QUERY_KEY`, sort pinned trước; lưu snapshot để rollback khi lỗi.
3. Lỗi giới hạn 5 pin hiển thị message backend bằng Sonner; không tự tăng giới hạn hoặc giả thành công.

**Gate hoàn thành:** pin/unpin đổi ngay panel và sidebar, reload vẫn đúng; lỗi thứ sáu rollback đúng thứ tự.

## Phase 6 — Mute/unmute conversation

**Trạng thái: Đã hoàn thành.**

**Một chức năng:** mute theo thời lượng hoặc vô thời hạn, và unmute.

**File tạo mới:**

- `X-frontend/src/features/conversations/components/mute-conversation-dialog.tsx`.

**File sửa:**

- `X-frontend/src/features/conversations/api/conversations.api.ts`.
- `X-frontend/src/features/conversations/hooks/use-conversation-actions.ts`.
- `X-frontend/src/features/conversations/types/conversation-action.type.ts`.
- `X-frontend/src/features/conversations/components/conversation-details-overview.tsx`.

**Chi tiết:**

1. Các lựa chọn: 1 giờ, 8 giờ, 24 giờ, vô thời hạn; payload POST là `{ type, duration_hours? }`.
2. Unmute gửi `type` bằng query param vì DELETE controller hiện đọc body hoặc query; ưu tiên query để tránh DELETE body không ổn định qua proxy.
3. Helper typed xác định active mute: entry đúng current user và `until === null` hoặc `until > now`.
4. Không tạo interval global chỉ để countdown. Label có thể hiển thị thời điểm hết mute và cập nhật khi query refetch/mở panel.

**Gate hoàn thành:** bốn kiểu mute và unmute đúng cho direct/group; expired entry không bị hiển thị là đang mute; mutation lỗi rollback.

## Phase 7 — Tìm kiếm tin nhắn trong panel

**Trạng thái: Đã hoàn thành.**

**Một chức năng:** nhập từ khóa và xem kết quả phân trang.

**File tạo mới:**

- `X-frontend/src/features/conversations/hooks/use-message-search.ts`.
- `X-frontend/src/features/conversations/components/conversation-search-view.tsx`.
- `X-frontend/src/features/conversations/types/message-search.type.ts`.

**File sửa:**

- `X-frontend/src/features/conversations/api/conversations.api.ts`.
- `X-frontend/src/features/conversations/stores/conversation-details.store.ts` để thêm điều hướng overview/search.
- `X-frontend/src/features/conversations/components/conversation-details-panel.tsx`.
- `X-frontend/src/features/conversations/components/conversation-details-overview.tsx`.

**Chi tiết:**

1. Dùng `useDeferredValue` hoặc debounce nội bộ 250–300 ms, query chỉ enable khi `trim().length > 0`.
2. Query key gồm conversation id và keyword; dùng `useInfiniteQuery`, cursor từ response.
3. Result hiển thị content snippet, sender, thời gian; với group map sender từ member data khi đã có, nếu chưa có chỉ dùng nhãn an toàn, không fake user.
4. Có empty/loading/error/retry state và nút load more/infinite sentinel.
5. Phase này chỉ bảo đảm danh sách search. Nút “Xem trong cuộc trò chuyện” chỉ bật sau Phase 9 để không hứa hành vi backend chưa hỗ trợ.

**Gate hoàn thành:** đổi keyword không trộn cache, request rỗng không chạy, pagination không lặp message, revoked/deleted không xuất hiện.

## Phase 8 — Backend endpoint lấy context quanh một message

**Trạng thái: Đã hoàn thành.**

**Một chức năng:** trả một cửa sổ message quanh kết quả search để frontend nhảy chính xác tới tin cũ.

**File tạo mới:** không bắt buộc; type response đặt trong DTO hiện có nếu ngắn và rõ.

**File sửa:**

- `X-ver2/src/modules/conversation/conversation.route.ts`: thêm `GET /:conversation_id/messages/:message_id/context`.
- `X-ver2/src/modules/conversation/conversation.validator.ts`: validate cả hai id và giới hạn before/after.
- `X-ver2/src/modules/conversation/conversation.controller.ts`.
- `X-ver2/src/modules/conversation/conversation.service.ts`.
- `X-ver2/src/modules/conversation/dto/index.ts`.
- `X-ver2/endpoint.md`, `X-ver2/swagger.yaml`.

**Contract đề xuất:**

```text
GET /api/conversations/:conversation_id/messages/:message_id/context?before=20&after=20
data: {
  messages: MessageWithMediasInfo[],
  target_message_id: string,
  older_cursor: string | null,
  newer_cursor: string | null
}
```

**Chi tiết:**

1. Bắt buộc membership bằng helper Phase 1.
2. Message id phải thuộc đúng conversation và không ở trạng thái revoked/deleted.
3. Kết quả có `$lookup medias_info`, sắp tăng dần khi trả về để UI render trực tiếp.
4. Truy vấn before/after tách rõ theo `_id`, giới hạn cứng để tránh response quá lớn.

**Gate hoàn thành:** id ngoài conversation trả 404/403 phù hợp; context chứa target đúng một lần; query cũ/mới ở đầu/cuối conversation vẫn đúng.

## Phase 9 — Nhảy tới và highlight message từ search

**Trạng thái: Đã hoàn thành.**

**Một chức năng:** “Xem trong cuộc trò chuyện”.

**File tạo mới:**

- `X-frontend/src/features/conversations/hooks/use-message-context.ts`.

**File sửa:**

- `X-frontend/src/features/conversations/api/conversations.api.ts`.
- `X-frontend/src/features/conversations/types/message-search.type.ts`.
- `X-frontend/src/features/conversations/stores/conversation-details.store.ts`.
- `X-frontend/src/features/conversations/components/conversation-search-view.tsx`.
- `X-frontend/src/features/conversations/components/message-list.tsx`.
- `X-frontend/src/features/conversations/components/message-bubble.tsx`.

**Chi tiết:**

1. Click result đặt `targetMessageId`; `MessageList` tải context và cuộn phần tử bằng stable `data-message-id`/ref.
2. Highlight bằng border/background nhẹ 1.5–2 giây, tôn trọng reduced motion.
3. Context mode có nút “Quay lại tin nhắn mới nhất”; clear target trả lại infinite query hiện tại và vị trí cuối, không trộn page context vào cache latest.
4. Socket message mới vẫn cập nhật conversation list; không ép scroll khi người dùng đang xem context cũ.

**Gate hoàn thành:** nhảy được tới message chưa từng load ở client; quay về latest không duplicate/mất message; target không tồn tại hiển thị lỗi phục hồi được.

## Phase 10 — Shared media: ảnh, video và audio

**Một chức năng:** xem media đã gửi theo tab.

**File tạo mới:**

- `X-frontend/src/features/conversations/hooks/use-conversation-media.ts`.
- `X-frontend/src/features/conversations/components/conversation-media-view.tsx`.
- `X-frontend/src/features/conversations/types/conversation-media.type.ts`.

**File sửa:**

- `X-frontend/src/features/conversations/api/conversations.api.ts`.
- `X-frontend/src/features/conversations/stores/conversation-details.store.ts`.
- `X-frontend/src/features/conversations/components/conversation-details-panel.tsx`.
- `X-frontend/src/features/conversations/components/conversation-details-overview.tsx`.

**Chi tiết:**

1. Infinite query dùng response message pagination; flatten `medias_info` và deduplicate theo media `_id`.
2. Ba tab Photos/Videos/Audio lọc client trên pages đã tải. Khi tab hiện tại chưa có item nhưng `has_next_page`, UI cho phép load tiếp thay vì kết luận empty sớm.
3. Tái sử dụng `MediaPlayer`, `MediaLightbox`, `AudioPlayer`; không gọi `GET /media/:id` theo từng media.
4. Không hiển thị tab Files cho tới khi backend thực sự hỗ trợ document.

**Gate hoàn thành:** ảnh mở lightbox, video/audio điều khiển được bằng keyboard, pagination không duplicate, network không có N+1.

## Phase 11 — Tạo group với người đang chat trực tiếp

**Một chức năng:** tạo group mới, partner hiện tại được chọn sẵn.

**File tạo mới:**

- `X-frontend/src/features/conversations/components/create-group-with-partner-dialog.tsx`.
- `X-frontend/src/features/conversations/hooks/use-create-group-conversation.ts`.
- `X-frontend/src/features/conversations/types/create-group.type.ts`.

**File sửa:**

- `X-frontend/src/features/conversations/api/conversations.api.ts` để dùng payload type mới.
- `X-frontend/src/features/conversations/components/conversation-details-overview.tsx`.
- `X-frontend/src/features/users/api/user.service.ts`/`types/user.type.ts` chỉ khi cần type hóa nguồn following hiện có; không gọi API trong dialog.

**Chi tiết:**

1. Chỉ render cho direct conversation.
2. Current user được backend tự thêm; partner bị khóa selected; người dùng chọn ít nhất một người nữa để tổng số unique member đạt ba.
3. Nguồn chọn ban đầu dùng following/friends hiện có, có search client-side; loại current user, partner và duplicate id.
4. Form React Hook Form + Zod, name 1–100 ký tự. Avatar để optional và có thể bổ sung bằng upload image hiện có, nhưng không chặn create nếu bỏ trống.
5. Thành công: invalidate conversations, đóng dialog/details, route tới `/messages/:newGroupId`; không chèn raw create response vào cache vì response đó chưa normalized `type/partner_info` như GET list.

**Gate hoàn thành:** không thể submit với chỉ A+B, duplicate không làm đủ số lượng, lỗi backend giữ form để retry, group mới mở đúng route.

## Phase 12 — Backend sửa đúng semantics ẩn/mở lại direct conversation

**Một chức năng:** hide chỉ ảnh hưởng current user và mở lại cũng chỉ unhide current user.

**File tạo mới:** không có.

**File sửa:**

- `X-ver2/src/modules/conversation/conversation.service.ts`.
- `X-ver2/endpoint.md`, `X-ver2/swagger.yaml`.

**Chi tiết:**

1. `deleteConversation` đã được membership-protect ở Phase 1; giữ `$addToSet hidden_by` cho đúng user.
2. `getOrCreateDirectConversation` thay `$set: { hidden_by: [] }` bằng `$pull` id của người đang mở conversation.
3. Tài liệu và response message đổi cách diễn đạt từ “delete conversation” thành “hide/remove from your inbox”; URL không đổi.

**Gate hoàn thành:** A hide không làm biến mất phía B; A mở lại không làm thay đổi `hidden_by` của B; group hide cũng chỉ tác động A.

## Phase 13 — UI “Ẩn khỏi hộp thư của bạn”

**Một chức năng:** hide conversation với confirm an toàn.

**File tạo mới:**

- `X-frontend/src/features/conversations/components/hide-conversation-dialog.tsx`.

**File sửa:**

- `X-frontend/src/features/conversations/api/conversations.api.ts`.
- `X-frontend/src/features/conversations/hooks/use-conversation-actions.ts`.
- `X-frontend/src/features/conversations/components/conversation-details-overview.tsx`.

**Chi tiết:**

1. Copy xác nhận nói rõ lịch sử không bị xóa cho người khác và conversation có thể xuất hiện lại khi nhắn tiếp.
2. Thành công: remove item khỏi conversations cache, đóng details, route `/messages`, sau đó invalidate để đồng bộ server.
3. Lỗi: giữ nguyên route/panel và báo toast; không optimistic navigate trước khi server xác nhận.

**Gate hoàn thành:** không dùng chữ “xóa cho mọi người”; hide đúng một phía; back/forward browser không làm panel stale.

## Phase 14 — Backend thực thi block trong direct messaging

**Một chức năng:** block thực sự ngăn tạo/gửi direct message mới theo cả hai chiều.

**File tạo mới:** không có nếu helper access Phase 1 đã đủ; nếu logic phình to, tạo `X-ver2/src/modules/conversation/conversation-block.service.ts` thay vì nhét query vào socket handler.

**File sửa:**

- `X-ver2/src/modules/conversation/conversation-access.service.ts`.
- `X-ver2/src/modules/conversation/conversation.service.ts`.
- `X-ver2/src/socket/chat.handler.ts`.
- `X-ver2/endpoint.md`, `X-ver2/swagger.yaml`.

**Chi tiết:**

1. Khi direct `@conversation:send`, kiểm tra block A→B hoặc B→A; nếu có, từ chối trước khi insert MongoDB/update Redis/notification.
2. `getOrCreateDirectConversation` không tạo/mở direct mới khi đang có block hai chiều.
3. Giữ quyền xem lịch sử cũ trừ khi product quyết định khác; không tự xóa message.
4. Socket error cần có code ổn định (ví dụ `DIRECT_MESSAGE_BLOCKED`) để frontend không phải parse chuỗi; đây là bổ sung có kiểm soát và phải ghi docs.

**Gate hoàn thành:** cả người block và bị block đều không gửi được; không có message/notification/cache entry mới; unblock khôi phục gửi tin.

## Phase 15 — Profile và block/unblock trong details

**Hai chức năng:** mở profile; block/unblock direct partner.

**File tạo mới:**

- `X-frontend/src/features/conversations/hooks/use-conversation-partner-profile.ts`.
- `X-frontend/src/features/conversations/components/block-user-dialog.tsx`.

**File sửa:**

- `X-frontend/src/features/users/types/user.type.ts`: bổ sung profile type có `is_blocked`, không dùng `any`.
- `X-frontend/src/features/users/api/user.service.ts`: giữ tương thích response array hiện tại và type rõ.
- `X-frontend/src/features/conversations/components/conversation-details-overview.tsx`.
- `X-frontend/src/features/conversations/components/chat-window.tsx` và `message-input.tsx`: khi profile query xác nhận block, disable composer với lý do rõ.
- `X-frontend/src/features/conversations/hooks/use-chat-socket.ts`: map socket error code Phase 14 thành toast/state phù hợp, không dùng `console.log`.

**Chi tiết:**

1. Link profile dùng username đã có; profile query cung cấp `is_blocked` làm server state duy nhất.
2. Block cần confirm và giải thích sẽ ngăn direct message mới, không xóa lịch sử.
3. Thành công invalidate `['user', username]` và partner-profile query; không tự giả block state lâu dài.
4. Group không render block action ở overview vì block từng member là luồng khác và dễ gây nhầm.

**Gate hoàn thành:** block/unblock label đúng sau reload; composer disabled đúng hai chiều theo response/socket; profile navigation hoạt động.

## Phase 16 — Backend hardening group member và realtime invalidation

**Hai chức năng:** siết quyền group; đồng bộ cache/event sau member mutation.

**File tạo mới:** không có nếu dùng helper Phase 1.

**File sửa:**

- `X-ver2/src/modules/conversation/conversation-access.service.ts`.
- `X-ver2/src/modules/conversation/conversation.service.ts`.
- `X-ver2/src/modules/conversation/conversation.validator.ts`.
- `X-ver2/src/socket/chat.handler.ts` hoặc helper emit chung trong module conversation.
- `X-ver2/endpoint.md`, `X-ver2/swagger.yaml`.

**Chi tiết:**

1. View members/leave: member hợp lệ; update group/add/remove member: admin hợp lệ.
2. Add member so sánh theo `user_id`, không dùng `$addToSet` cả object có `joined_at` vì cách đó vẫn có thể tạo duplicate.
3. Remove không cho admin xóa chính mình qua endpoint remove; leave dùng endpoint riêng.
4. Sole admin không được leave nếu vẫn còn member và chưa có cơ chế chuyển admin; trả code lỗi rõ, không để group mồ côi quyền quản trị.
5. Sau add/remove/leave, delete `conv_members:<conversationId>` ngay.
6. Emit event tới personal rooms của member liên quan, không emit theo room conversation mà socket chưa join. Frontend về sau chỉ cần invalidate conversation/member query.

**Gate hoàn thành:** member thường không edit/add/remove; duplicate không sinh ra; user bị remove không gửi/nhận message sau mutation; nhiều client thấy thay đổi sau event/refetch.

## Phase 17 — Đổi tên và avatar group

**Hai chức năng:** rename group; đổi group avatar.

**File tạo mới:**

- `X-frontend/src/features/conversations/components/edit-group-dialog.tsx`.
- `X-frontend/src/features/conversations/hooks/use-group-actions.ts`.
- `X-frontend/src/features/conversations/types/group-action.type.ts`.

**File sửa:**

- `X-frontend/src/features/conversations/api/conversations.api.ts`.
- `X-frontend/src/features/conversations/components/conversation-details-overview.tsx`.
- `X-frontend/src/features/conversations/hooks/use-chat-socket.ts` để invalidate khi nhận group-updated event Phase 16.

**Chi tiết:**

1. Chỉ admin thấy action; không chỉ dựa UI, backend Phase 16 vẫn quyết định quyền.
2. Name validate 1–100. Avatar dùng `mediaService.uploadImage`, lấy URL ready rồi PATCH; không tạo upload flow mới.
3. Nếu upload thành công nhưng PATCH fail, thông báo rõ và cho retry PATCH; không xóa media ngoài ý người dùng.
4. Success cập nhật/invalidate conversation cache để header chat, panel và sidebar đổi đồng thời.

**Gate hoàn thành:** member không thấy/không gọi được edit; name/avatar đồng bộ trên hai client; upload/PATCH failure có đường retry.

## Phase 18 — Danh sách thành viên group

**Một chức năng:** xem member và role.

**File tạo mới:**

- `X-frontend/src/features/conversations/hooks/use-group-members.ts`.
- `X-frontend/src/features/conversations/components/group-members-view.tsx`.
- `X-frontend/src/features/conversations/types/group-member.type.ts`.

**File sửa:**

- `X-frontend/src/features/conversations/api/conversations.api.ts`.
- `X-frontend/src/features/conversations/stores/conversation-details.store.ts`.
- `X-frontend/src/features/conversations/components/conversation-details-panel.tsx`.
- `X-frontend/src/features/conversations/components/conversation-details-overview.tsx`.

**Chi tiết:**

1. Type phải phản ánh response aggregate thật: role, joined_at và `user`; không ép dùng `GroupMember` summary nếu shape khác.
2. Hiển thị admin trước, sau đó member; avatar/name/username link profile; có skeleton/error/retry/empty bất thường.
3. Event group-member-changed chỉ invalidate `['conversation-members', id]` và conversations query.

**Gate hoàn thành:** admin/member label đúng, profile link đúng, user ngoài group nhận 403, danh sách cập nhật sau add/remove/leave.

## Phase 19 — Thêm và xóa thành viên group

**Hai chức năng:** admin thêm member; admin remove member.

**File tạo mới:**

- `X-frontend/src/features/conversations/components/add-group-members-dialog.tsx`.
- `X-frontend/src/features/conversations/components/remove-group-member-dialog.tsx`.

**File sửa:**

- `X-frontend/src/features/conversations/api/conversations.api.ts`.
- `X-frontend/src/features/conversations/hooks/use-group-actions.ts`.
- `X-frontend/src/features/conversations/components/group-members-view.tsx`.
- `X-frontend/src/features/search/api/search.service.ts` và type search liên quan chỉ nếu cần tìm ngoài following; phải loại `any`, không đổi global search UI.

**Chi tiết:**

1. Picker loại current members/current user, deduplicate id và yêu cầu ít nhất một lựa chọn.
2. Search user có debounce và cursor; không reuse component global chứa nút Follow vì sai trách nhiệm.
3. Remove luôn confirm, không hiện remove cho current admin, và không optimistic remove trước server để tránh sai quyền/cache.
4. Success invalidate members + conversations; event Phase 16 cập nhật client khác.

**Gate hoàn thành:** duplicate không xuất hiện, member thường không có controls, remove sai quyền rollback/giữ list, người bị remove mất quyền socket ngay.

## Phase 20 — Rời group

**Một chức năng:** current user rời group.

**File tạo mới:**

- `X-frontend/src/features/conversations/components/leave-group-dialog.tsx`.

**File sửa:**

- `X-frontend/src/features/conversations/api/conversations.api.ts`.
- `X-frontend/src/features/conversations/hooks/use-group-actions.ts`.
- `X-frontend/src/features/conversations/components/conversation-details-overview.tsx`.

**Chi tiết:**

1. Confirm nói rõ user sẽ mất quyền xem/gửi message mới trong group.
2. Nếu sole admin bị backend từ chối, hiển thị lý do cần cơ chế chuyển admin; không tự promote ngầm ở frontend.
3. Thành công: remove conversation khỏi cache, close details, clear target/search/media queries của id và route `/messages`.

**Gate hoàn thành:** member rời thành công và socket mất quyền ngay; sole admin không làm group mồ côi; history/cache cũ không còn render sau route.

## Phase 21 — Release audit, accessibility và tài liệu

**Chức năng:** không mở thêm feature; khóa chất lượng toàn bộ luồng.

**File tạo mới:** không có mặc định. Chỉ thêm test files nếu repo đã có runner hoặc người dùng cho phép cài/thiết lập test framework.

**File sửa dự kiến:**

- Các file conversation đã chạm để sửa lỗi lint/type/a11y phát hiện trong audit.
- `X-frontend/src/services/api.client.ts`: loại `console.log("API_URL IS:", ...)` đang vi phạm `AI_RULES.md` nếu chưa được xử lý ở phase trước.
- `X-ver2/endpoint.md`, `X-ver2/swagger.yaml`: đồng bộ contract cuối cùng.
- `X-frontend/phase-ui-chat.md`: đánh dấu phase thực tế hoàn thành và ghi khác biệt đã được duyệt, không viết TODO mơ hồ trong source.

**Checklist bắt buộc:**

1. Frontend: `npm run lint`, `npx tsc --noEmit`, `npm run build`.
2. Backend: `npm run lint`, `npm run prettier`, `npm run build`.
3. Chuẩn bị tài khoản ở thời điểm đã có chức năng để test: A/B cho direct; A/B/C cho group, trong đó A là group admin và C là member thường.
4. Responsive: 320, 375, 768, 1024 và desktop rộng; không overflow ngang, composer không bị che.
5. Keyboard: Tab/Shift+Tab, Enter/Space cho action, Escape đóng dialog/mobile details, focus return đúng.
6. Screen reader: heading, button names, `aria-pressed`, dialog description, live error/toast không trùng lặp.
7. Motion: 150–250 ms và reduced motion.
8. Network: không request search khi query rỗng, không N+1 media, không duplicate query sau toggle.
9. Security: outsider 403, removed member mất quyền ngay, block chặn socket hai chiều, hide chỉ một phía.
10. Regression thủ công sau khi đã có code: `/messages`, `/messages/:id`, gửi text/image/video/audio, typing, load thêm message, presence, conversation sidebar, sorting và navigation.
11. Không `any` mới, không direct fetch trong component, không domain code mới trong `src/components`, `src/services` hoặc `src/app`.

**Gate hoàn thành:** toàn bộ checklist pass; nếu có lỗi đã tồn tại từ trước thì phải ghi rõ và có bằng chứng không do feature này tạo ra.

---

## 5. Bảng phụ thuộc giữa các phase

| Phase UI                 | Backend gate bắt buộc                                        | Lý do                                                                     |
| ------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------- |
| 3–4 Panel shell/overview | Không cần endpoint mới, nhưng nên xong Phase 1 trước release | Không public panel trên conversation không được authorize                 |
| 5 Pin                    | Phase 1                                                      | Pin hiện update theo id nếu chưa khóa member                              |
| 6 Mute                   | Phase 1                                                      | Mute hiện tin vào `type` từ client                                        |
| 7 Search                 | Phase 1–2                                                    | Membership, text index, lọc status                                        |
| 9 Jump message           | Phase 8                                                      | Không thể nhảy chắc chắn tới message chưa load nếu thiếu context endpoint |
| 10 Shared media          | Phase 1–2                                                    | Membership và `medias_info`                                               |
| 11 Create group          | API hiện có; Phase 16 cần xong trước khi mở quản trị member  | Group create chỉ cần POST hiện tại                                        |
| 13 Hide                  | Phase 12                                                     | Tránh làm lộ bug reset `hidden_by` của người còn lại                      |
| 15 Block                 | Phase 14                                                     | Nút block phải có tác dụng thật với socket                                |
| 17–20 Group admin        | Phase 16                                                     | Quyền, cache member và realtime phải an toàn                              |

## 6. Những mục chủ động không làm trong kế hoạch này

- Gửi/xem PDF, Word hoặc file document: backend upload/socket/schema thực thi chưa hỗ trợ; chữ `file` trong preview type không đủ để triển khai.
- Bật `admin_only_messaging`: chưa có endpoint và socket chưa enforce.
- Chuyển quyền/thêm admin, giải tán group: chưa có contract. Do đó sole admin leave sẽ bị chặn thay vì tự suy diễn hành vi.
- Nickname direct/group: direct schema không có field, PATCH thật chỉ update group name/avatar.
- Hiển thị group `last_seen`: field có trong schema nhưng không có luồng cập nhật đáng tin cậy.
- Reply/edit/revoke/delete/reaction/forward: để ở kế hoạch menu từng message, không đưa vào nút `i`.
- Sửa toàn bộ lỗi `any`, naming hoặc cấu trúc legacy ngoài các file chạm bởi feature; việc đó là refactor khác phạm vi.

## 7. Thứ tự phát hành khuyến nghị

Không cần chờ toàn bộ Phase 1–21 mới có giá trị. Chia release thành các mốc có thể rollback:

1. **Release A — an toàn + panel nền:** Phase 1–4. Chỉ mở toggle/overview sau khi backend access gate pass.
2. **Release B — tiện ích ít rủi ro:** Phase 5–7. Pin, mute và search list.
3. **Release C — điều hướng/media nâng cao:** Phase 8–10. Context, jump-to-message và shared media.
4. **Release D — direct actions:** Phase 11–15. Create group, hide, block.
5. **Release E — group management:** Phase 16–20.
6. **Release final:** Phase 21.

Mỗi release nên có feature flag hoặc ít nhất một commit độc lập theo phase để có thể revert đúng chức năng mà không gỡ toàn bộ panel.
