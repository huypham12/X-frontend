# Yêu cầu Frontend và UX cho Notification, Unread và Realtime

Tài liệu này là nguồn yêu cầu cho hành vi hiển thị của frontend. API là nguồn dữ liệu bền vững và có thẩm quyền; Socket.IO chỉ giúp giao diện phản ứng sớm với thay đổi đã commit. Frontend không được suy diễn thêm field, quyền truy cập hoặc trạng thái mà contract không cung cấp.

Hai miền unread phải được quản lý độc lập:

- **Notification unread** là số notification item chưa đọc và chưa bị invalidated. Một aggregate có nhiều actor vẫn chỉ là một item.
- **Inbox unread** gồm `unread_message_count` của từng conversation và `unread_conversation_count` toàn inbox. Badge Messages dùng số conversation chưa đọc, không dùng tổng message.

Đọc notification không tự động đọc conversation. Đọc conversation cũng không tự động đọc notification liên quan. Khi người dùng đi từ một notification message vào chat, frontend xử lý lần lượt trạng thái của notification và trạng thái đọc của conversation theo đúng điều kiện nhìn thấy message.

## 1. Mục tiêu sản phẩm

### Notification tab

Notification tab là activity feed cá nhân cho các sự kiện social, directed message và group management mà backend thực sự tạo notification. Tab này giúp người dùng biết ai đã thực hiện hành động gì, trên đối tượng nào, và đi tới đích an toàn khi đích còn tồn tại và còn quyền truy cập. Tab không thay thế Inbox và không chứa mọi message mới.

### Notification badge

Badge trên icon Notifications thể hiện `unreadCount` từ notification state. Badge giúp người dùng nhận biết có bao nhiêu notification item chưa đọc, bao gồm aggregate như một item duy nhất. Badge không chứa unread conversation hoặc unread message.

### Messages badge

Badge trên icon Messages thể hiện `unread_conversation_count` từ unread summary. Nếu ba conversation lần lượt có 20, 5 và 1 message chưa đọc thì badge là `3`, không phải `26`. `total_unread_message_count` không được dùng cho badge này.

### Unread conversation và unread message

Một conversation là unread khi `unread_message_count > 0`. `unread_message_count` là số message chưa đọc trong chính conversation đó; read position được mô tả bởi `last_read_message_id` và `last_read_at`. Frontend dùng các field do backend trả về, không quét toàn bộ message đã tải để tự tính.

### Realtime update

Realtime update giữ Sidebar, Notification feed, Conversation list và Chat đồng bộ mà không cần reload. Mọi event phải được xử lý idempotent. Sau reconnect, regain focus hoặc nghi ngờ cache lệch, frontend phải đối soát bằng REST vì socket không replay event đã bỏ lỡ.

### System message trong group

System message là activity bất biến trong lịch sử group, có `kind=system`, `system_event_type`, `affected_user_ids`, `context` và `content`. Nó được trình bày như một mốc sự kiện, không phải bubble của người dùng; không có edit, revoke, react, reply hoặc forward. System message tăng unread/inbox như message khác đối với current member, trừ actor, nhưng không mặc nhiên tạo notification cá nhân.

## 2. Sidebar

### Badge Notifications

- Nguồn khởi tạo và đối soát là `GET /api/notifications/unread-count`. Có thể nhận `unreadCount` từ `GET /api/notifications` khi tải feed, nhưng không dùng số row đang có trong cache để thay thế global count.
- Realtime dùng `@notification:unread-count`, `@notification:read-state` và count/version đi kèm `@notification:removed`. Chỉ áp dụng count khi `version` không cũ hơn state hiện có; event count riêng yêu cầu `version` lớn hơn state đang giữ.
- Count bằng `0`: không render badge, nhưng icon và vùng bấm giữ nguyên kích thước và accessible name.
- Count từ `1` đến `99`: hiển thị số chính xác. Count từ `100` trở lên: hiển thị `99+`; accessible label vẫn thông báo số chính xác từ backend.
- Aggregate Like/Repost/Reaction có nhiều actor vẫn tăng badge tối đa một item trong active window. `@notification:updated` không tăng badge.

### Badge Messages

- Nguồn khởi tạo và đối soát là `GET /api/conversations/unread-summary`.
- Hiển thị `unread_conversation_count`, không hiển thị `total_unread_message_count` và không cộng `unread_message_count` từ các row đang tải.
- Count bằng `0`: không render badge. Quy tắc `1..99` và `99+` giống Notifications.
- Khi `@conversation:read-state` đến, cập nhật row conversation và summary trong cùng một lần cập nhật cache. Không tự cộng/trừ delta; dùng state có thẩm quyền trong payload nếu `version` không cũ hơn state cache.
- Message mới chỉ làm badge tăng khi backend unread state xác nhận có thêm conversation unread. Nếu conversation đã unread, các message tiếp theo không làm `unread_conversation_count` tăng thêm.

### Desktop và mobile

- Desktop đặt badge ở góc trên bên phải icon, không che hình icon và không làm thay đổi chiều rộng Sidebar. Khi Sidebar thu gọn, badge vẫn gắn với icon.
- Mobile dùng cùng ý nghĩa và cùng count trên bottom navigation hoặc navigation tương đương. Vùng chạm của mỗi icon tối thiểu 44 x 44 px; badge không phải phần tử focus riêng.
- Chuyển breakpoint không tạo state badge thứ hai. Desktop và mobile đọc cùng một cache/state có thẩm quyền.
- Accessible name phải gồm tên đích và trạng thái, ví dụ “Thông báo, 12 chưa đọc” hoặc “Tin nhắn, không có cuộc trò chuyện chưa đọc”.

### Loading, lỗi và socket disconnect

- Lần tải đầu chưa có cache: giữ chỗ badge ổn định bằng skeleton nhỏ, không hiển thị `0` giả. Icon vẫn điều hướng được. Skeleton phải có `aria-busy` tại vùng navigation, không được đọc như count.
- Khi refetch và đã có cache: giữ count gần nhất, thêm trạng thái syncing kín đáo; không nhấp nháy về `0`.
- Nếu REST count lỗi: giữ dữ liệu cache gần nhất nếu có; nếu chưa từng có dữ liệu thì ẩn badge và cung cấp trạng thái tải lỗi qua tooltip/status phù hợp, không bịa count.
- Khi socket disconnect: không xóa badge. Giữ state REST gần nhất, hiển thị chỉ báo “Đang kết nối lại” dùng chung cho realtime nếu trạng thái kéo dài; các thao tác REST vẫn có thể cập nhật state. Không polling liên tục.
- Khi reconnect hoặc tab lấy lại focus: refetch notification unread count, notification page đầu khi cần, conversation unread summary và conversation list; sau đó merge theo ID/version.

### Sau mark-read

- Mark one notification: dùng `unreadCount` và `version` trong response để cập nhật badge; item chỉ chuyển read theo kết quả thành công hoặc optimistic state có rollback/refetch rõ ràng.
- Mark all notification: dùng `unreadCount`, `version` và `updatedCount`; không ép badge về `0` nếu response nói khác. Item xuất hiện/reactivate sau cutoff vẫn unread.
- Read conversation: dùng `unread_conversation_count`, `total_unread_message_count`, `unread_message_count` và `version` từ REST/socket acknowledgement. Không tự đoán badge dựa trên việc route chat đã mở.

## 3. Notification feed

### Bố cục item

Mỗi item là một row có toàn bộ vùng nội dung chính có thể click khi có route hợp lệ:

1. Khu vực actor: một avatar cho notification cá nhân; tối đa ba avatar xếp chồng đối với aggregate theo `actor_infos_preview`.
2. Khu vực nội dung: tên hiển thị là phần nhấn mạnh, sau đó là câu mô tả hành động. Username có thể xuất hiện như thông tin phụ khi `actor_info` cung cấp.
3. Timestamp từ `created_at`; aggregate thay đổi actor có thể dùng `updated_at` để thể hiện hoạt động gần nhất nếu UI gắn nhãn rõ, nhưng thứ tự feed vẫn theo `created_at DESC, _id DESC` như REST.
4. Target preview bên dưới: text tối đa đúng projection backend trả về, không tự fetch hoặc lộ nội dung ngoài policy.
5. Thumbnail chỉ xuất hiện khi contract cung cấp media an toàn. Contract hiện tại không có media/thumbnail trong notification target projection.

Row dùng padding 16–20 px, khoảng trắng thoáng, border mảnh và bảng màu dark-mode-first theo design system. Không dùng gradient, glassmorphism hoặc animation gây xao nhãng.

### Trạng thái unread/read

- Unread: text chính có weight cao hơn, nền `#121212` hoặc indicator accent nhỏ ở mép; indicator không được là dấu hiệu duy nhất, để vẫn phân biệt được khi người dùng không nhận biết màu.
- Read: nền đen mặc định, text phụ màu xám, không làm mờ đến mức giảm khả năng đọc.
- Chuyển trạng thái dùng animation 150–250 ms; tắt animation khi người dùng bật reduced motion.
- Feed vẫn hiển thị cả read và unread; mark-read không remove row.

### Actor và target không còn khả dụng

- `actor_info=null`: dùng avatar placeholder trung tính và nhãn “Tài khoản không còn khả dụng”; không khôi phục tên/avatar từ cache cũ, `sender_id` cũ hoặc `actor_ids_preview` đã bị redact; không cho click profile.
- Aggregate có một phần actor bị lọc: render đúng `actor_infos_preview` và `actor_count` hiện tại. Không đoán danh tính actor thiếu.
- `target_info=null`: giữ item nếu REST vẫn trả, hiển thị “Nội dung không còn khả dụng” hoặc “Bạn không còn quyền truy cập nội dung này” theo cách trung tính; tắt CTA đích. Không tự remove item chỉ vì target null và không fetch bằng ID đã bị redact.
- Item chỉ bị remove khi nhận `@notification:removed` hoặc khi lần REST đối soát không còn item đó.

### Aggregate notification

- Frontend không tự gom. Chỉ render aggregate do backend trả bằng `_id`, `actor_infos_preview`, `actor_count` và `aggregation_active`.
- Với một actor: “A đã thích bài viết của bạn”. Với hai hoặc ba actor có đủ preview: “A và B…” hoặc “A, B và C…”. Khi `actor_count` lớn hơn số actor preview: “A, B và N người khác…”, trong đó N được tính từ count và số preview thực tế, không từ số avatar đã tải ở nơi khác.
- `@notification:updated` replace/upsert đúng `_id`, cập nhật actor, count và timestamp; không tạo row mới, không tăng badge và giữ `is_read` theo payload có thẩm quyền.
- Đọc aggregate đóng active window. Activity sau đó có `_id` mới là một row mới; không merge chỉ vì trùng `aggregation_key` hoặc target.

### UI theo từng notification type backend có thể trả

| `type` | Nội dung và preview | Click behavior |
| --- | --- | --- |
| `follow` | “{actor} đã theo dõi bạn”. Hiển thị avatar, display name, username nếu có; không có target tweet. | Mở profile bằng `actor_info._id`; legacy `target_id=null` không ảnh hưởng nếu actor còn hydrate được. |
| `followed_user_tweet` | “{actor} đã đăng một bài viết mới”. Preview `target_info.content`. | Mở tweet bằng `target_info._id`, fallback `target_id` khi không bị redact. |
| `like` | “{actor/actors} đã thích bài viết của bạn”. Aggregate theo dữ liệu backend; preview tweet. | Mở tweet gốc. |
| `retweet` | “{actor/actors} đã đăng lại bài viết của bạn”. Aggregate theo dữ liệu backend; preview tweet. | Mở tweet gốc. |
| `quote` | “{actor} đã trích dẫn bài viết của bạn”. Preview nội dung quote là target child. Không tự aggregate. | Mở quote tweet. |
| `reply` | “{actor} đã trả lời bài viết của bạn”. Preview reply là target child. Không tự aggregate. | Nếu có `context.parent_tweet_id`, mở thread cha và focus reply `target_id`; nếu không, mở target tweet. |
| `mention` | “{actor} đã nhắc đến bạn trong một bài viết”. Preview tweet chứa mention. | Mở target tweet; nếu có parent context, mở trong đúng thread. |
| `message_reply` | “{actor} đã trả lời tin nhắn của bạn”. Preview `target_info.content`; conversation lấy từ `context.conversation_id`. | Mở conversation rồi focus/scroll tới message `target_id` khi có thể tải được. |
| `message_mention` | “{actor} đã nhắc đến bạn trong nhóm”. Preview message; context xác định conversation. | Mở conversation rồi focus/scroll tới message `target_id`. |
| `message_reaction` | “{actor/actors} đã bày tỏ cảm xúc {context.emoji} với tin nhắn của bạn”. Đây là aggregate; preview target message. | Mở conversation trong context rồi focus target message. |
| `message` | Compatibility item: “{actor} đã gửi cho bạn một tin nhắn”. Không coi đây là runtime flow mới. | Mở conversation bằng `target_info._id`, fallback target ID còn hợp lệ. Không hứa deep-link message. |
| `group_add` | “Bạn đã được thêm vào nhóm {tên nhóm nếu target projection có}”. | Mở conversation nếu còn membership và target hydrate được. |
| `group_join` | Compatibility item: “{actor} đã tham gia nhóm”. | Mở conversation nếu target hydrate được. |
| `group_kick` | “Bạn đã bị xóa khỏi nhóm”. Không hiển thị nội dung riêng tư của group khi target null. | Không đưa CTA mở group nếu `target_info=null`; đồng thời dọn route/cache như mục Group events. |
| `admin_granted` | “Bạn đã được trao quyền quản trị nhóm”. | Mở group nếu target hydrate được; invalidate thông tin member/role. |
| `admin_revoked` | “Quyền quản trị nhóm của bạn đã bị thu hồi”. | Mở group nếu người dùng vẫn là member; nếu mất quyền truy cập thì bỏ CTA và dọn cache tương ứng. |
| `system` | Dùng nội dung generic an toàn và target thực tế nếu có; không suy diễn actor/target từ `context={}`. | Chỉ điều hướng khi `target_type` và target còn hydrate hợp lệ. |

Type không nhận diện được phải dùng fallback an toàn “Bạn có một thông báo mới”, vẫn hiển thị timestamp/read state, không dựng route từ field không có. Việc hỗ trợ fallback không đồng nghĩa frontend tự định nghĩa type mới.

### Loading, empty, error và pagination

- Initial loading: skeleton có cùng cấu trúc row, gồm avatar tròn, hai dòng text và một preview; không dùng spinner cho tải kéo dài.
- Empty: icon tối giản và nội dung “Chưa có thông báo”; phân biệt với lỗi tải. Không dùng minh họa nặng.
- Initial error: thông báo ngắn, nút “Thử lại”, giữ navigation sử dụng được. Pagination error: giữ item đã tải và đặt nút retry tại cuối danh sách.
- Infinite scroll dùng `next_cursor` nguyên vẹn và `has_next_page`; không parse/tự tạo cursor. Chặn request trang kế tiếp trùng nhau.
- Merge page và socket theo `_id`; giữ order `{created_at DESC, _id DESC}`. Không lấy activity update của aggregate làm lý do đổi thứ tự nếu REST không đổi `created_at`.
- Khi nhận raw socket item chưa hydrate, upsert theo `_id`, sau đó refetch page đầu để lấy actor/target projection. Chỉ prepend trực quan ngay khi tuple của item thực sự mới hơn head; reactivation của `_id` cũ phải upsert và đối soát, không mặc định tạo row đầu mới.

### Mark one, mark all và click

- Item unread có action “Đánh dấu đã đọc” sử dụng `POST /api/notifications/:id/read`. Action lặp là idempotent. Khi thành công, cập nhật item, `read_at`, badge và version theo response/socket; khi lỗi, phục hồi trạng thái hoặc refetch.
- “Đánh dấu tất cả đã đọc” dùng `POST /api/notifications/read-all`, disabled khi request đang chạy hoặc count đã xác nhận bằng 0. Không đánh dấu item mới/reactivate sau cutoff. Nếu có activity đồng thời và `@notification:read-state` không đủ cutoff, refetch page đầu và unread count.
- Click row unread vừa mark one vừa điều hướng nếu route an toàn. Lỗi mark-read không được khóa người dùng khỏi nội dung; giữ item unread và vẫn điều hướng. Với row không có target hợp lệ, click chỉ có thể mark read, không điều hướng.
- Focus bằng bàn phím và action phụ không được tạo hai request mark-read hoặc hai navigation.

> **Backend gap**
>
> Notification target projection hiện không có media/thumbnail, nên frontend chỉ có thể render text preview. Nút Follow Back cũng không có relationship state trong notification payload; chỉ được hiển thị nếu một nguồn user/follow độc lập cung cấp trạng thái có thẩm quyền.

## 4. Conversation list và inbox unread

### Bố cục conversation

Mỗi row hiển thị avatar, tên conversation, preview message cuối, timestamp và unread badge. Direct dùng avatar/tên đối phương theo contract conversation hiện có. Group dùng avatar/tên nhóm; preview ưu tiên “{sender}: {nội dung}” khi backend hoặc hydrated message cung cấp sender công khai. Không suy ra sender từ ID không hydrate.

### Trạng thái unread

- `unread_message_count > 0`: tên conversation và preview dùng weight cao hơn, timestamp dùng màu text chính/accent nhẹ, badge hiển thị count.
- `unread_message_count = 0`: bỏ badge, typography bình thường.
- Badge từng row hiển thị `1..99`, từ 100 là `99+`; accessible label dùng số chính xác.
- `last_read_message_id` và `last_read_at` là read position do backend quản lý. `read_by` legacy không được dùng làm nguồn truth.

### Preview message

- User message: hiển thị text ngắn một dòng; media-only dùng nhãn loại nội dung chỉ khi hydrated message hiện tại đã cung cấp dữ liệu tương ứng.
- Message do chính current user gửi có thể có prefix “Bạn:”. Group message của người khác có prefix tên sender khi có projection an toàn.
- Reply vẫn preview nội dung message mới; phần “Đang trả lời…” chỉ dùng khi hydrated message cung cấp dữ liệu reply tương ứng.
- Message đã revoke/deleted và được backend biểu diễn không còn `sent`: thay content bằng “Tin nhắn đã bị thu hồi”, không giữ text cũ trong cache hiển thị.
- System message: dùng câu activity trung tính theo `system_event_type`, căn giữa trong Chat; trong Conversation list dùng một dòng tóm tắt, không gắn prefix như user message.

### Sắp xếp và cập nhật realtime

- Danh sách sắp theo last-message time từ dữ liệu conversation hiện hành. Khi `@conversation:receive` mang message mới đã commit, upsert message, cập nhật preview/timestamp và đưa conversation lên đầu.
- Nếu conversation chưa có trong cache hoặc payload không đủ metadata để tạo row đúng contract, invalidate/refetch conversation list; không dựng conversation giả từ `conversation_id`.
- Event trùng không đưa row lên đầu nhiều lần hoặc tăng unread nhiều lần. Message được upsert theo `_id`; optimistic message đối soát bằng `message_id` và `client_message_id` ổn định.
- Revoke/delete/reaction không được tự coi là một message mới để thay đổi inbox unread. Reaction cập nhật bubble bằng event reaction có thẩm quyền.

### Direct, group và muted conversation

- Direct: avatar/tên đối phương, preview không cần sender prefix khi ngữ cảnh đã rõ; `mention_user_ids` luôn rỗng theo backend.
- Group: avatar/tên group, sender prefix khi có dữ liệu, nhận mention, system message và membership/admin updates.
- Muted không làm thay đổi `unread_message_count`, `unread_conversation_count` hoặc việc tạo `message_reply`/`message_mention` in-app. Nếu có trạng thái mute có thẩm quyền, row hiển thị icon mute và chỉ giảm âm thanh/toast không thiết yếu; không ẩn unread.

> **Backend gap**
>
> Contract được cung cấp không có field/API mute trong conversation list, nên frontend chưa thể hiển thị hoặc thay đổi mute một cách bền vững. Contract cũng chưa bảo đảm last-message sender projection trong `GET /api/conversations`; sau reload, prefix sender của group bị chặn nếu response legacy hiện tại không cung cấp dữ liệu này.

### Badge Messages

- `@conversation:receive` cập nhật nội dung ngay, nhưng badge toàn cục không được cộng thủ công từ event. Dùng unread summary/read-state có version hoặc invalidate/refetch summary khi event receive không kèm state.
- Khi conversation được đọc, rời, bị xóa khỏi membership hoặc bị kick, áp dụng `@conversation:read-state` có `unread_message_count: 0` và summary version; remove row nếu không còn quyền.
- Khi conversation bị xóa khỏi danh sách mà không có state đủ mới, refetch unread summary. Không lấy số row có badge trong page hiện tại làm global count.

## 5. Active conversation

### Khi user mở conversation

- Tải conversation, membership và message bằng API hiện có. Chỉ vì route đang mở không có nghĩa toàn bộ message đã đọc.
- Chỉ gửi read acknowledgement khi document đang visible, conversation đang active và frontend xác định được message đích đã thực sự được trình bày trong viewport theo quy tắc đọc của UI.
- Ưu tiên gửi `message_id` cụ thể qua `@conversation:read` hoặc `POST /api/conversations/:conversation_id/read`. Body rỗng chỉ dùng khi chủ ý mark tới visible newest của backend.
- UI chỉ cập nhật read position/badge theo ack thành công hoặc `@conversation:read-state`; không dùng việc mount component làm nguồn truth.

### Message cũ chưa đọc được tải

- Chèn đúng vị trí thời gian và upsert theo `_id`, không append như message mới.
- Loading thêm lịch sử không tự mark read. Khi các message chưa đọc đi vào vùng đọc và tab visible, frontend có thể gửi acknowledgement tới message có thứ tự cao nhất thực sự đã đọc.
- Vì read position chỉ tiến về trước, không gửi một `message_id` xa hơn nếu UI chưa muốn coi toàn bộ message trước đó là đã đọc.

### Message mới tới conversation đang mở

- Append/upsert ngay khi nhận `@conversation:receive`.
- Nếu tab visible và người dùng đang ở cuối/đủ gần cuối để message mới xuất hiện trong viewport, giữ scroll ổn định, trình bày message, rồi ack đúng message. Chỉ sau backend xác nhận mới đưa unread về 0. Kết quả cuối là không tăng badge Messages cho message đã thực sự đọc.
- Nếu người dùng đang đọc đoạn cũ và message mới nằm ngoài viewport, không auto-scroll cưỡng bức, không tự mark read. Hiển thị nút “Tin nhắn mới” kèm số lượng cục bộ phục vụ điều hướng trong phiên; count cục bộ này không thay thế backend unread.

### Message mới tới conversation khác

- Không thay đổi active chat. Cập nhật/upsert row kia, preview, timestamp và đưa row lên đầu.
- Cập nhật inbox state theo event/read summary có thẩm quyền. Có thể hiện toast tối giản nếu product bật toast và payload đã đủ dữ liệu an toàn; click toast mở conversation. Không tạo notification item nếu backend không phát `@notification:new`.

### Browser tab hidden hoặc mất focus

- Khi `document.visibilityState` không visible, không tự ack message chỉ vì conversation route vẫn mount.
- Message đến vẫn được upsert và conversation/inbox cập nhật. Khi tab visible lại, refetch unread summary/conversation list nếu cần, kiểm tra viewport rồi mới gửi read ack.
- Không dựa vào socket connected để suy ra người dùng đã nhìn thấy message.

### Read acknowledgement

- `@conversation:read` và REST read là hai cách gọi cùng semantics; frontend chọn một đường chính và dùng REST làm fallback/reconcile, không gửi đồng thời không cần thiết.
- Áp dụng ack/read-state như state có thẩm quyền, không phải delta. Payload `version` nhỏ hơn state hiện tại bị bỏ qua; payload bằng version có thể dùng để đồng bộ row tương ứng.
- Read của chính user không đồng nghĩa backend cung cấp read receipt của participant khác.

### Socket reconnect

- Giữ message/cache hiện có và trạng thái gửi optimistic rõ ràng.
- Refetch unread summary, conversation list và dữ liệu active conversation cần thiết. Merge message theo `_id`.
- Nếu send ack timeout, retry đúng `client_message_id` với cùng payload; không tạo ID mới cho cùng thao tác. Ack trả `message_id` phải replace/upsert optimistic message, tránh duplicate với `@conversation:receive`.

### Bị kick hoặc mất quyền truy cập

- Khi nhận group update/read-state cho biết user bị loại: remove group khỏi conversation cache/list, xóa message và member query nhạy cảm, đóng composer, rời route active và điều hướng về Inbox với thông báo trung tính.
- `group_kick` notification cá nhân có thể vẫn ở Notification feed nhưng không mở group khi target null.
- Nếu REST/read ack trả `403`, xử lý như mất membership: không retry vô hạn và không giữ nội dung group trên màn hình. Với `404`/target null do lifecycle, hiển thị unavailable rồi dọn cache thích hợp.
- Với atomic admin transfer-and-leave thành công, mọi tab của admin cũ phải remove group caches và thoát route; không chờ socket duy nhất mới dọn.

> **Backend gap**
>
> Contract hỗ trợ read position của current user nhưng chưa cung cấp participant read receipts. UI kiểu “Đã xem bởi…” bị chặn. Deep-link tới message cụ thể cũng chưa có contract fetch-around/anchor khi message không nằm trong page đã tải; frontend chỉ có thể scroll nếu target đã có trong cache hoặc API message hiện hữu có thể tải được nó.

## 6. Message-specific notification

| Tình huống | Notification tab | Inbox unread | Realtime trong Chat | Điều hướng |
| --- | --- | --- | --- | --- |
| Message reply hợp lệ | Có `message_reply` cho owner của message được reply, trừ khi recipient đồng thời được group mention thì chỉ có `message_mention`. | Có, vì đây vẫn là message mới; read phụ thuộc active/visible/ack. | Append message; hiển thị reply preview khi dữ liệu hydrated hỗ trợ. | Conversation cụ thể, sau đó target message mới `target_id`; original reply ID ở `context.reply_to_message_id` khi có. |
| Group mention | Có `message_mention` cho member được mention. | Có. Highlight message khi `mention_user_ids` chứa current user. | Append, highlight mention; không tạo notification duplicate. | Conversation và message cụ thể. |
| Message reaction | Có aggregate `message_reaction` cho owner message khi actor khác reaction và feature backend đang bật. | Không tăng unread message/conversation vì reaction không phải message mới. | `@message:reaction-updated` replace reaction list/summary của bubble, không refetch toàn conversation. | Conversation và message bị reaction. |
| Generic direct message | Không có runtime notification activity item; `message` chỉ là compatibility type nếu dữ liệu cũ trả về. | Có nếu message chưa được đọc. | Append/upsert và update conversation. | Từ Inbox mở conversation; legacy notification nếu có cũng chỉ mở conversation. |
| Generic group message không directed | Không có notification activity item. | Có nếu message chưa được đọc. | Append/upsert; sender preview và group row cập nhật. | Từ Inbox mở conversation. |

Mute không suppress `message_reply` hoặc `message_mention` in-app. Khi directed notification backend bị tắt, message vẫn giao và Inbox vẫn cập nhật; frontend không tự tạo generic notification để bù.

Việc một directed message được đọc ngay trong active conversation không tự xóa hoặc tự đánh dấu read notification activity tương ứng. Nếu backend đã tạo `message_reply`/`message_mention`, item đó vẫn tuân theo notification read state riêng và chỉ đổi trạng thái qua notification read API/event.

Trong Chat, reply bubble hiển thị khối “Trả lời” và excerpt message gốc chỉ khi hydrated message hoặc cache hiện tại có dữ liệu gốc. Click excerpt scroll tới original nếu đã tải; nếu original unavailable/revoked, hiển thị “Tin nhắn gốc không còn khả dụng” và không suy diễn content cũ.

> **Backend gap**
>
> Contract notification chỉ bảo đảm `reply_to_message_id`, không bảo đảm projection nội dung/tác giả message gốc hoặc endpoint fetch-around. Reply excerpt bền vững sau reload và scroll chính xác tới original bị chặn nếu contract message hiện hành không hydrate các dữ liệu đó.

## 7. Tweet và social notification

### Follow

- Text: “{display name} đã theo dõi bạn”, username là metadata phụ.
- Target preview: không có tweet preview; actor card nhỏ chỉ dùng field public đã hydrate.
- Click: profile actor.
- Unread: một Follow item unread tăng Notification badge một; không ảnh hưởng Messages.
- Follow Back chỉ xuất hiện khi frontend có relationship state có thẩm quyền từ nguồn khác; không suy ra từ sự tồn tại notification.

### Followed-user post

- Text: “{actor} đã đăng một bài viết mới”.
- Preview: `target_info.content`, tối đa projection backend trả.
- Click: tweet target.
- Chỉ được backend tạo cho tweet gốc audience Everyone khi follow relation đã opt-in `posts=true`. Frontend không tự tạo notification từ tweet feed và không giữ preference cũ sau unfollow/refollow.

### Like aggregate

- Text dùng actor preview/count: “A đã thích…”, “A và B đã thích…”, “A, B và N người khác đã thích…”.
- Preview/click: tweet gốc.
- Update aggregate replace cùng `_id`, giữ unread, không tạo item/badge mới. Undo actor cuối remove item theo event.

### Repost aggregate

- Giống Like nhưng động từ là “đã đăng lại”. Backend type là `retweet`.
- Preview/click: tweet gốc.
- Không tự gom và không đổi order theo `updated_at` nếu REST order không đổi.

### Quote

- Text: “{actor} đã trích dẫn bài viết của bạn”.
- Preview: nội dung quote target; không aggregate.
- Click: quote tweet (`target_id`/`target_info._id`), không phải tự động tweet gốc.

### Reply

- Text: “{actor} đã trả lời bài viết của bạn”.
- Preview: child reply.
- Click: mở thread bằng `context.parent_tweet_id` khi có và focus child target; fallback mở target.
- Nếu parent owner đồng thời được mention, backend chỉ tạo Reply với `context.mentioned=true`; frontend không render thêm Mention giả.

### Mention

- Text: “{actor} đã nhắc đến bạn trong một bài viết”.
- Preview: tweet chứa mention.
- Click: target tweet, trong thread cha nếu context cung cấp.
- Frontend upsert theo `_id`; không tự duplicate vì content và explicit mentions cùng chỉ tới một user. Khi mention bị edit bỏ, remove item theo `@notification:removed`.

Mọi social item target null dùng unavailable state, không điều hướng từ ID/cache cũ. Like/Repost actor bị block hoặc bị xóa có thể làm aggregate update/remove; render đúng state backend mới nhất.

## 8. Group events

Frontend phải tôn trọng invariant: group không rỗng có đúng một admin. Không hiển thị thao tác tạo nhiều admin. Sole admin không được gọi leave thường khi còn member; phải chọn một current member và dùng mutation atomic transfer-admin-and-leave. Frontend không mô phỏng bằng grant rồi leave hoặc hai request rời rạc.

| Sự kiện | Notification cá nhân | System message | Conversation update | Route/cache |
| --- | --- | --- | --- | --- |
| Member added | Affected user có thể nhận `group_add`. | Current members nhận `member_added` qua `@conversation:receive`; user bị add nhận theo membership hiện hành. | `@conversation:group-updated`; invalidate conversation/member query. | Thêm/refetch group row cho user mới nếu payload chưa đủ metadata. |
| Member left | Không có type notification cá nhân được bảo đảm. | Current members còn lại nhận `member_left`; người đã rời không nhận/fetch message sau removal. | Group update và membership/read state thay đổi. | Tab của người rời remove group cache và thoát route sau mutation thành công; current members refetch member list. |
| Member kicked | User bị kick nhận `group_kick`; target có chủ ý có thể null. | Chỉ current members nhận `member_kicked`; người bị kick không nhận system message sau removal. | Group update tới cả affected user; read-state của họ về 0. | Affected user remove group list/messages/members và thoát route; notification không có CTA khi target null. |
| Admin granted | Affected user có thể nhận `admin_granted`. | `admin_granted` trong timeline. | Invalidate role/member/conversation data. | Không tự sửa role từ UI label đơn lẻ; refetch state có thẩm quyền. |
| Admin revoked | Affected user có thể nhận `admin_revoked`. | `admin_revoked` trong timeline. | Invalidate role/member/conversation data. | Ẩn admin controls sau khi state xác nhận; nếu mất membership thì dọn route/cache. |
| Admin transferred | Không có notification type cá nhân riêng được bảo đảm. | `admin_transferred_and_left` ghi lại việc chuyển và admin cũ rời group. | `@conversation:group-updated` với `change_type=admin_transferred`; invalidate conversation/member queries. | Mọi tab của admin cũ phải remove group caches và thoát route; admin mới refetch role. |

System message dùng presentation căn giữa, icon nhỏ trung tính, text phụ và timestamp; không có avatar sender/bubble/actions. Dùng `system_event_type` để chọn câu localized khi đủ dữ liệu. Nếu tên affected user không có trong hydrated payload/cache có thẩm quyền, dùng `content` backend hoặc câu trung tính, không dựng tên từ ID.

`group_created` là system activity và group update hợp lệ dù không nằm trong danh sách thao tác người dùng nêu trên; render theo cùng nguyên tắc. Compatibility `group_join` notification không được biến thành system message nếu backend chỉ trả notification item.

> **Backend gap**
>
> Không có notification cá nhân riêng cho `member_left` hoặc `admin_transferred` trong contract hiện tại; UX có thể phản ánh bằng system message, group update và cache cleanup, nhưng không được tự tạo Notification row. Payload system message được mô tả chỉ có affected user IDs và content generic, nên câu localized có tên đầy đủ của actor/affected members cần thêm public actor/affected-user projections an toàn.

## 9. Realtime behavior

### Ma trận xử lý event

| Socket event | Hành vi frontend bắt buộc |
| --- | --- |
| `@notification:new` | Upsert theo `_id`; nếu là item mới với tuple mới nhất thì prepend, nếu `_id` đã có thì update tại chỗ; không cộng badge thủ công; raw payload chưa hydrate nên invalidate/refetch notification page đầu để render actor/target; chờ count event/state có version cho badge. Bỏ qua duplicate về mặt side effect. |
| `@notification:unread-count` | Không thêm feed item. Replace Notification badge khi `version` lớn hơn version hiện có; bỏ qua version cũ/trùng. Nếu payload bất thường hoặc cache chưa khởi tạo, refetch unread-count. |
| `@notification:read-state` | `mark_one` với `updated_count=1`: set đúng item read; `read_all`: cập nhật item cache có thể xác định an toàn, còn có concurrent activity thì refetch page đầu. Badge replace bằng `unread_count/version`; không remove item. Đồng bộ mọi tab. |
| `@notification:updated` | Replace/upsert aggregate cùng `_id`, cập nhật actor preview/count/context/timestamp; không prepend row mới, không đổi unread badge, không tự merge window khác. Vì payload raw, refetch page đầu khi cần hydration. |
| `@notification:removed` | Remove đúng `notification_id` ở mọi page/cache. Nếu có count/version thì replace badge khi version không cũ; nếu thiếu thì giữ count và refetch unread-count. Không tự decrement thêm. |
| `@conversation:receive` | Upsert message theo `_id`; nếu conversation active thì insert đúng vị trí và áp dụng visibility/read rule; nếu conversation khác thì cập nhật preview/time và move row lên đầu. Nếu row/metadata thiếu, invalidate/refetch conversations. Không tạo Notification row. Reconcile Inbox bằng state/refetch, không cộng delta mù. |
| Ack của `@conversation:send` | Khi success, replace/upsert optimistic message bằng `message_id`; retry timeout với cùng `client_message_id` và payload. Không append duplicate nếu receive đã tới trước ack. Conflict giữ trạng thái lỗi có thể retry/chỉnh sửa, không phát sinh ID mới cho cùng payload retry. |
| Ack của `@conversation:read` | Apply `unread_message_count`, inbox counts và `version` như authoritative state; cập nhật active row và Sidebar cùng lúc. Failure giữ unread và cho retry; `403` chuyển sang luồng mất quyền. |
| `@conversation:read-state` | Chỉ apply payload có version không cũ hơn summary cache. Update conversation theo `conversation_id` và toàn bộ inbox summary trong một transaction; `unread_message_count=0` do leave/kick phải dọn row/cache nếu membership mất. Event duplicate không tạo delta. |
| `@message:reaction-updated` | Replace reaction list/summary của đúng message bubble theo payload có thẩm quyền; không refetch toàn conversation, không đổi inbox unread và không tự tạo Notification row. Notification activity reaction chỉ thay đổi qua các event `@notification:*`. |
| `@conversation:group-updated` | Dựa trên `change_type` hiện có để invalidate conversation/member query. Với kick/leave/admin transfer ảnh hưởng current user, dọn route/cache ngay; với thay đổi khác, refetch metadata/member list. Không dựng member/role mới từ field không có. |

`@conversation:send` và `@conversation:read` là client command có acknowledgement, không phải server broadcast để render như notification. Mọi event đến từ nhiều tab/device có thể trùng và phải idempotent.

### Ordering, cache và reconciliation

- Notification dedupe bằng notification `_id`; message dedupe bằng message `_id`, đồng thời dùng `client_message_id` cho optimistic send.
- Count/read state dedupe bằng `version`, không bằng timestamp phía client.
- Socket item event và count event là hai message riêng; có thể đến khác thứ tự. Item vẫn upsert/remove theo ID, count chỉ theo version.
- REST là source of truth cho initial load, pagination, reconnect, focus reconciliation và phục hồi sau lỗi socket.
- Không refetch toàn bộ dữ liệu cho reaction đơn thuần; chỉ invalidate/refetch nơi payload không đủ để cập nhật chính xác, như notification hydration, conversation row chưa tồn tại hoặc group membership thay đổi.
- Không có polling định kỳ. Focus/reconnect/manual retry và invalidation từ event là các điểm đối soát.
- Toast là feedback tạm thời, không phải dữ liệu bền vững. Chỉ toast event người dùng thực sự cần chú ý; không biến mọi socket event thành toast hoặc Notification row. Raw notification chưa hydrate không được dùng để lộ/suy diễn actor/target.

> **Backend gap**
>
> `@notification:new` và `@notification:updated` không có `actor_info`, `actor_infos_preview` hoặc `target_info`, đồng thời contract không có endpoint get-notification-by-ID. Frontend có thể upsert raw item và refetch page đầu, nhưng rich row/toast tức thời với avatar, tên và preview bị chặn cho tới khi refetch trả projection. Backend nên bổ sung public hydrated projection vào event hoặc endpoint fetch item theo ID.

## 10. Responsive và accessibility

### Mobile-first và Threads-inspired

- Thiết kế từ viewport nhỏ trước, một cột, content-centered; feed tối đa khoảng 600–700 px trên desktop.
- Mobile dùng edge-to-edge hợp lý với padding 16 px, row chạm tối thiểu 44 px, bottom navigation không che item cuối hoặc composer.
- Desktop có Sidebar cố định và panel nội dung; nếu Inbox dùng master-detail, conversation list và chat phải giữ focus/order hợp lý khi thay đổi kích thước.
- Dark mode first: nền `#000000`, secondary `#121212`, card `#181818`, border mảnh low-contrast, text chính trắng, text phụ xám nhưng đạt contrast đọc được. Accent chỉ dùng cho action/indicator nhỏ.
- Animation chỉ 150–250 ms, không dùng layout jump cho badge/feed insert; ưu tiên content và khoảng trắng.

### Keyboard và focus

- Mọi icon Sidebar, notification row có route, mark-read action, retry, pagination fallback và conversation row đều truy cập được bằng bàn phím.
- Dùng semantic link cho điều hướng, button cho mutation. Không đặt interactive control lồng nhau; action phụ có vùng focus riêng và chặn click row đúng cách.
- Focus state luôn nhìn thấy trên nền tối. Sau navigation, focus chuyển tới heading/trọng tâm nội dung; sau remove item, focus về item hợp lý kế tiếp hoặc heading feed.
- Nút “Tin nhắn mới” đưa focus/scroll tới message đầu tiên chưa xem mà không gây mất ngữ cảnh.

### ARIA và thông báo trạng thái

- Badge có accessible label nêu số chính xác và đơn vị đúng: notification item hoặc conversation, không chỉ đọc “99+”.
- Feed dùng list semantics; mỗi item có tên truy cập mô tả actor, action, target và read state trong giới hạn hợp lý.
- Avatar decorative có alt rỗng khi tên đã nằm trong text; avatar là thông tin duy nhất phải có alt phù hợp.
- Loading container dùng `aria-busy`; skeleton bị ẩn khỏi accessibility tree. Error và reconnect status dùng live region lịch sự, không lặp liên tục.
- Notification mới/message mới không tự cướp focus. Live announcement ngắn và được debounce/batch khi nhiều event đến cùng lúc.
- Unread không chỉ biểu diễn bằng màu; kết hợp weight, label hoặc indicator hình học.

### Reduced motion và trạng thái hệ thống

- Tôn trọng `prefers-reduced-motion`: tắt slide/pulse, dùng state change tức thời hoặc fade tối thiểu.
- Loading, empty và error là ba trạng thái riêng cho Notification feed, Conversation list và Chat.
- Offline/reconnecting không xóa content. CTA retry/refetch rõ ràng và không làm người dùng mất draft chat.

## 11. Các điều không được làm

- Không fake field backend, không dựng actor/target/conversation/member từ ID hoặc cache đã bị redact.
- Không sửa API/socket contract và không định nghĩa notification type runtime mới ở frontend.
- Không scan toàn bộ messages để tính unread khi backend đã có unread state.
- Không dùng số item đã tải trong Notification feed làm global notification unread count.
- Không dùng số conversation row đang tải để tính global Messages badge.
- Không dùng `total_unread_message_count` cho badge Messages.
- Không coi việc mở route conversation là bằng chứng mọi message đã đọc.
- Không coi socket là nguồn dữ liệu bền vững, không giả định socket replay event offline.
- Không áp dụng socket count như delta; dùng payload/version có thẩm quyền.
- Không append notification/message trùng; luôn upsert/dedupe theo ID phù hợp.
- Không hiển thị mọi socket event thành notification item hoặc toast.
- Không tự tạo generic message notification khi backend chỉ cập nhật Inbox.
- Không tự aggregate Like, Repost hoặc Message Reaction.
- Không merge hai aggregate window khác `_id` dù trùng target/key.
- Không remove notification chỉ vì actor/target hydration là null.
- Không điều hướng tới target đã null/redact hoặc cố fetch nội dung group sau khi user bị kick.
- Không dùng `read_by` legacy làm nguồn read/unread.
- Không mô phỏng transfer admin bằng nhiều request và không cho UI tạo trạng thái nhiều admin trái invariant.
- Không polling để thay cho realtime/reconnect reconciliation.
- Không thêm package mới.
- Không thiết kế push notification, notification preference ngoài `posts` trên follow relation, participant read receipt hoặc khả năng khác vượt contract.
- Không chia yêu cầu này thành các giai đoạn hay biến tài liệu thành kế hoạch triển khai.

## 12. Backend gaps

Mỗi mục sau là yêu cầu UX hợp lệ nhưng chưa thể hoàn thiện chỉ với contract hiện tại.

### Gap 1 — Hydration tức thời cho notification socket

**Backend gap**

- **Yêu cầu UX:** Notification row/toast mới phải có ngay avatar, actor name và target preview.
- **Backend đang thiếu:** `@notification:new` và `@notification:updated` chỉ gửi raw object, không có `actor_info`, `actor_infos_preview`, `target_info`; không có endpoint lấy một notification theo ID.
- **Frontend vẫn có thể làm:** Upsert/dedupe raw item, cập nhật badge bằng count event, hiển thị loading placeholder và refetch page đầu.
- **Phần bị chặn:** Rich content tức thời, đặc biệt khi item không nằm đúng page đầu do reactivation/order.
- **Contract backend cần bổ sung:** Public hydrated projection trong socket event hoặc endpoint fetch-by-ID có cùng redaction/policy với feed.

### Gap 2 — Thumbnail/media preview trong Notification feed

**Backend gap**

- **Yêu cầu UX:** Hiển thị thumbnail khi tweet/message target có media.
- **Backend đang thiếu:** Các `target_info` projection hiện chỉ có metadata và content tối đa 140 ký tự, không có media thumbnail.
- **Frontend vẫn có thể làm:** Render text preview và layout không thumbnail.
- **Phần bị chặn:** Thumbnail chính xác, an toàn theo audience/visibility.
- **Contract backend cần bổ sung:** Media preview public tối thiểu, loại media, URL/asset ID an toàn và lifecycle/redaction tương ứng.

### Gap 3 — Follow Back tại notification item

**Backend gap**

- **Yêu cầu UX:** Nút Follow Back phản ánh đúng trạng thái hiện tại và không gửi request trùng.
- **Backend đang thiếu:** Notification payload không có current follow relationship state.
- **Frontend vẫn có thể làm:** Điều hướng tới profile; chỉ render CTA nếu một query profile/follow độc lập đã cung cấp state có thẩm quyền.
- **Phần bị chặn:** CTA chính xác ngay trong feed chỉ dựa trên notification contract.
- **Contract backend cần bổ sung:** Relationship projection an toàn hoặc endpoint batch trạng thái follow cho actor IDs.

### Gap 4 — Muted conversation

**Backend gap**

- **Yêu cầu UX:** Hiển thị icon mute, giữ lựa chọn sau reload và áp dụng chính sách toast/sound nhất quán.
- **Backend đang thiếu:** Contract cung cấp không có mute state, mutation hoặc event đồng bộ mute.
- **Frontend vẫn có thể làm:** Giữ nguyên unread/badge; directed in-app notification vẫn hiển thị theo contract.
- **Phần bị chặn:** Trạng thái mute bền vững và đồng bộ nhiều tab/device.
- **Contract backend cần bổ sung:** Field mute trong conversation/user preference, API mutation và event/version đồng bộ.

### Gap 5 — Sender preview bền vững trong group conversation row

**Backend gap**

- **Yêu cầu UX:** Preview “Tên người gửi: nội dung” phải đúng cả realtime và sau reload.
- **Backend đang thiếu:** Phần additive contract của `GET /api/conversations` không bảo đảm public sender projection cho last message.
- **Frontend vẫn có thể làm:** Dùng hydrated receive/cache khi payload hiện có cung cấp sender; fallback chỉ hiển thị content.
- **Phần bị chặn:** Khôi phục sender name chính xác sau reload/cache miss.
- **Contract backend cần bổ sung:** Last-message sender public projection hoặc hydrated last-message shape được ghi rõ.

### Gap 6 — Reply preview và deep-link/fetch-around message

**Backend gap**

- **Yêu cầu UX:** Hiển thị excerpt message gốc và scroll chính xác tới original/target dù message nằm ngoài page đang tải.
- **Backend đang thiếu:** Contract notification chỉ bảo đảm các message ID/context; không bảo đảm original-message projection hay endpoint fetch-around theo message ID.
- **Frontend vẫn có thể làm:** Scroll khi message đã có trong cache; hiển thị target message preview từ `target_info`; fallback unavailable/generic reply label.
- **Phần bị chặn:** Deep-link ổn định và reply excerpt sau reload với lịch sử dài.
- **Contract backend cần bổ sung:** Endpoint lấy message kèm cửa sổ trước/sau và quyền visibility, hoặc message hydration có reply preview an toàn.

### Gap 7 — Participant read receipts

**Backend gap**

- **Yêu cầu UX:** Hiển thị “Đã xem” hoặc danh sách thành viên đã đọc message của current user.
- **Backend đang thiếu:** Contract chỉ cung cấp read position/unread state của caller; `read_by` là legacy và không còn là source of truth.
- **Frontend vẫn có thể làm:** Ack và hiển thị trạng thái đọc của chính current user qua `last_read_message_id`/`last_read_at`.
- **Phần bị chặn:** Read receipt của người nhận/thành viên khác.
- **Contract backend cần bổ sung:** Receipt projection/event có policy, version và semantics rõ cho direct/group.

### Gap 8 — Tên actor/affected member trong group system message

**Backend gap**

- **Yêu cầu UX:** Câu tự nhiên như “Anna đã thêm John” hoặc “Minh đã trở thành quản trị viên”.
- **Backend đang thiếu:** Shape được bảo đảm chỉ có `affected_user_ids`, context và content generic; không bảo đảm public actor/affected-user projections.
- **Frontend vẫn có thể làm:** Dùng backend `content`, `system_event_type` và tên đang có trong member cache nếu vẫn hợp lệ; fallback câu trung tính.
- **Phần bị chặn:** Câu localized có tên chính xác sau cache miss, đặc biệt với user đã rời/bị kick.
- **Contract backend cần bổ sung:** Snapshot/projection public tối thiểu cho actor và affected users, có quy tắc redaction.

### Gap 9 — Notification cá nhân cho member left/admin transferred

**Backend gap**

- **Yêu cầu UX:** Nếu product muốn một activity item cá nhân riêng cho các sự kiện này trong Notification tab.
- **Backend đang thiếu:** Không có notification type/caller được bảo đảm cho `member_left` hoặc `admin_transferred`; hiện có system message và group update.
- **Frontend vẫn có thể làm:** Cập nhật timeline, conversation/member query, role và route/cache bằng các event hiện có.
- **Phần bị chặn:** Notification row/badge cá nhân riêng.
- **Contract backend cần bổ sung:** Typed notification, recipient policy, target/context, lifecycle và deduplication semantics. Trước khi có contract, frontend không tự tạo item.

### Gap 10 — Phân biệt lý do target unavailable

**Backend gap**

- **Yêu cầu UX:** Thông báo chính xác “đã bị xóa”, “bạn bị mất quyền” hay “tài khoản không còn tồn tại”.
- **Backend đang thiếu:** `actor_info=null`/`target_info=null` và redaction không cung cấp reason code công khai.
- **Frontend vẫn có thể làm:** Hiển thị unavailable state trung tính, tắt CTA và chờ lifecycle remove/refetch.
- **Phần bị chặn:** Copy theo nguyên nhân và CTA phục hồi/quyền truy cập cụ thể.
- **Contract backend cần bổ sung:** Public-safe availability reason enum, chỉ khi không làm rò rỉ dữ liệu hoặc quan hệ block.

### Gap 11 — Notification push ngoài ứng dụng

**Backend gap**

- **Yêu cầu UX:** Push notification khi ứng dụng đóng/offline.
- **Backend đang thiếu:** Push subscription, delivery và preference contract; Socket.IO không replay và chỉ hoạt động khi client kết nối.
- **Frontend vẫn có thể làm:** In-app badge/feed/toast khi app đang chạy và REST reconciliation khi quay lại.
- **Phần bị chặn:** OS/browser push bền vững khi offline.
- **Contract backend cần bổ sung:** Push subscription lifecycle, permission/preferences, payload redaction, delivery/dedupe semantics.
