[AI_RULES.md](d:/NodeJS/X-full/X-frontend/AI_RULES.md)
[architecture.md](d:/NodeJS/X-full/X-frontend/architecture.md)
[design-system.md](d:/NodeJS/X-full/X-frontend/design-system.md)
[input-frontend-noti.md](d:/NodeJS/X-full/X-frontend/input-frontend-noti.md)
[frontend-noti-review.md](d:/NodeJS/X-full/X-frontend/frontend-noti-review.md)
[phase-frontend-noti.md](d:/NodeJS/X-full/X-frontend/phase-frontend-noti.md)
[frontend-notification-contract.md](d:/NodeJS/X-full/X-ver2/frontend-notification-contract.md)

Hãy review lại toàn bộ implementation hiện tại của Phase [X].

Giá trị `X` sẽ được cung cấp ở mỗi lần tôi yêu cầu. Mọi `Phase [X]`, phase `[X].1` và trạng thái liên quan trong prompt này phải được hiểu theo đúng giá trị đó. Không thay thế hoặc suy diễn sang phase khác.

Đây chỉ là bước review:

- Không sửa code.
- Không tạo file.
- Không cập nhật tài liệu.
- Không triển khai phần còn thiếu.
- Không triển khai phase sau.
- Không tự mở hoặc triển khai phase `[X].1`.
- Không chạy runtime browser test, tạo tài khoản, seed dữ liệu hoặc E2E test.

“Review toàn bộ Phase [X]” nghĩa là phải kiểm tra tất cả phạm vi, mục con, edge case, UI state, dependency và gate nằm bên trong Phase [X], không chỉ kiểm tra các file được liệt kê trong báo cáo triển khai trước đó.

## 0. Ranh giới review và thứ tự ưu tiên

Trước khi kết luận:

1. Xác định change set của Phase [X] từ commit/diff riêng, báo cáo implementation và source hiện tại.
2. Nếu workspace dùng Git, đọc `git status --short`, `git diff --name-only` và diff liên quan ở chế độ read-only để nhận biết file dirty từ trước và thay đổi ngoài phạm vi.
3. Nếu không có baseline/commit/change boundary đáng tin cậy, vẫn review source hiện tại nhưng không khẳng định một lỗi là “do Phase [X] tạo ra” hoặc “đã tồn tại trước”. Dùng phân loại `không xác định được provenance`.

Khi có khác biệt, áp dụng thứ tự ưu tiên sau:

1. Contract backend hiện hành và bằng chứng từ backend source thực tế.
2. Yêu cầu sản phẩm tương ứng trong `input-frontend-noti.md`.
3. Phạm vi, dependency, edge case, “Những việc không làm” và gate của Phase [X] trong `phase-frontend-noti.md`.
4. Quy tắc trong `AI_RULES.md`, `architecture.md` và `design-system.md`.
5. Checklist chung trong prompt này.

Nếu contract tài liệu và backend source mâu thuẫn, báo cáo đó là contract/backend gap; không âm thầm chọn một bên và không đề nghị frontend fake workaround.

Chỉ áp dụng một nhóm kiểm tra khi nhóm đó:

- Nằm trực tiếp trong Phase [X]; hoặc
- Cần để xác minh dependency/gate đầu vào; hoặc
- Có thể bị regression bởi change set của Phase [X].

Không coi capability được lên kế hoạch cho phase sau là hạng mục thiếu của Phase [X]. Ví dụ, nếu Phase [X] không bao gồm Notification route/feed, Inbox landing, active-read hoặc system message thì việc các capability đó chưa tồn tại không phải finding của Phase [X]. Đánh dấu nhóm đó `Không áp dụng — thuộc Phase N`.

## 1. Nguồn đối chiếu

Đọc và đối chiếu:

- Toàn bộ Phase [X].
- Dependency và quyết định kiến trúc liên quan.
- Gate hoàn thành, rollback và điều kiện mở phase phụ.
- Yêu cầu tương ứng trong `input-frontend-noti.md`.
- Hiện trạng và technical debt trong `frontend-noti-review.md`.
- Quy tắc trong `AI_RULES.md`, `architecture.md` và `design-system.md`.
- Backend contract thực tế frontend đang sử dụng.
- Source code hiện tại, không dựa hoàn toàn vào báo cáo triển khai trước.
- Dòng `**Trạng thái: ...**` của Phase [X] trong kế hoạch.

Ưu tiên source hiện tại khi danh sách file trong kế hoạch không còn khớp, nhưng không được tự thay đổi yêu cầu hoặc contract.

## 2. Phạm vi review

Hãy kiểm tra và báo cáo các nội dung sau.

### A. Mức độ hoàn thành Phase [X]

1. Phase [X] đã triển khai những gì.
2. Mỗi thay đổi đóng góp gì cho Notification, Inbox unread, realtime, active chat, group behavior hoặc session safety.
3. Có mục, mục con, edge case, UI state hoặc gate nào còn thiếu không.
4. Có phần nào chỉ được dựng khung nhưng chưa nối vào luồng dữ liệu thực tế không.
5. Trạng thái `Đã hoàn thành` trong kế hoạch có phản ánh đúng gate thực tế không.

### B. Phạm vi và dependency

1. Dependency bắt buộc của Phase [X] đã thực sự đạt chưa.
2. Có code nào vượt phạm vi Phase [X] không.
3. Có vô tình triển khai trước chức năng của phase sau không.
4. Có tự động triển khai nội dung thuộc phase `[X].1` hoặc backend gap không.
5. Có refactor rộng sang auth, tweets, search, media, layout hoặc conversations mà Phase [X] không yêu cầu không.

### C. Contract và type safety

1. Request, response, Socket.IO payload và DTO có khớp backend contract không.
2. Có fake field, default giả, reconstructed actor/target/member/conversation hoặc assumption không có bằng chứng không.
3. Có dùng `any`, `@ts-ignore`, unsafe cast hoặc broad `eslint-disable` mới không.
4. Có trộn backend DTO với client-only state không.
5. Có dùng `read_by` legacy làm nguồn unread không.
6. Có tự định nghĩa notification type, event hoặc API contract mới ở frontend không.
7. Null/redacted actor hoặc target có được xử lý an toàn không.

### D. State ownership và React Query

1. Server state có thuộc React Query đúng như kế hoạch không.
2. Có duplicate state giữa React Query, Zustand, Context và local component state không.
3. Notification unread và Inbox unread có được giữ độc lập không.
4. Notifications badge có dùng đúng notification unread item count không.
5. Messages badge có dùng đúng `unread_conversation_count`, thay vì tổng message hoặc số row đã tải không.
6. Query keys có nhất quán và đúng feature ownership không.
7. Cache update có atomic khi cần cập nhật row và summary cùng lúc không.
8. Optimistic update có rollback hoặc refetch recovery không.
9. Logout/account switch có clear personal cache và UI store đúng không.
10. Có nguy cơ dữ liệu user trước xuất hiện cho user sau không.

### E. Realtime, ordering và deduplication

1. Socket listener có ownership đúng feature không.
2. Listener có mount đúng một lần và cleanup bằng đúng handler không.
3. Có listener global nào vẫn phụ thuộc active route hoặc active ChatWindow không.
4. Có nguy cơ đăng ký trùng listener sau rerender/reconnect không.
5. Notification/message có được upsert và dedupe theo ID có thẩm quyền không.
6. Pending message có dùng `client_message_id` ổn định khi Phase [X] yêu cầu không.
7. Count/read state có áp dụng đúng version ordering không.
8. Có cộng/trừ local delta làm sai unread khi event duplicate hoặc out-of-order không.
9. Aggregate update có vô tình tạo row mới hoặc tăng badge không.
10. Reaction/revoke/delete/group event có vô tình làm tăng Inbox unread hoặc tạo notification giả không.
11. Socket có bị dùng như nguồn dữ liệu bền vững thay cho REST không.
12. Reconnect hoặc regain focus có REST reconciliation đúng phạm vi phase không.

### F. Notification feed và điều hướng, nếu Phase [X] liên quan

1. Pagination có giữ `next_cursor` opaque và chống request trùng không.
2. Merge REST pages và socket item có dedupe, giữ canonical order không.
3. Mark one/read all có dùng authoritative count/version từ response không.
4. Concurrent notification/reactivation/read-all có được xử lý an toàn không.
5. Actor/target null có crash, khôi phục dữ liệu redact hoặc route sai không.
6. Aggregate có render theo dữ liệu backend thay vì tự gom không.
7. Unknown type có fallback an toàn không.
8. Click row và action mark-read có gây hai request hoặc hai lần navigation không.
9. Directed message notification có tái sử dụng đúng message focus/context flow không.
10. Lỗi mark-read có vô tình chặn navigation không.

### G. Conversation unread và active read, nếu Phase [X] liên quan

1. Conversation row có dùng `unread_message_count` backend không.
2. Global Messages badge có độc lập với số message từng row không.
3. Message receive trùng có làm tăng unread hoặc reorder nhiều lần không.
4. Mở route conversation có bị coi sai là đã đọc không.
5. Read acknowledgement có chỉ gửi khi document visible, conversation active và message đủ điều kiện được xem không.
6. Có gửi exact `message_id` phù hợp không.
7. Hidden tab, user đang đọc message cũ hoặc đang ở conversation khác có bị auto-mark read không.
8. REST/socket read-state có cập nhật conversation row và unread summary đồng bộ không.
9. Loading lịch sử cũ có vô tình mark read không.
10. Có loop read acknowledgement hoặc request dư thừa rõ ràng không.

### H. Group, system message và directed interaction, nếu Phase [X] liên quan

1. System message có presentation riêng và không đi qua user-message actions không.
2. System message có bị reply, react, revoke, delete hoặc forward không.
3. Mention có dựa trên backend IDs thay vì parse text không.
4. Message reply/reaction notification có focus đúng message không.
5. Group kick/leave/admin transfer có dọn route và cache cho mọi tab không.
6. Có giữ invariant một group chỉ có một admin không.
7. Frontend có mô phỏng transfer admin bằng nhiều request không.
8. Group event thiếu projection có bị frontend tự dựng member/name/role không.

### I. FSD, coupling và code quality

1. Domain-specific logic có bị đặt trong `src/app`, global `src/components`, `src/services` hoặc provider không phù hợp không.
2. Route có còn là thin wrapper không.
3. Business logic có bị nhét vào presentation component không.
4. Component có quá lớn, nhiều trách nhiệm hoặc coupling cao không.
5. Có useEffect chain, derived duplicate state hoặc dependency không ổn định gây loop không.
6. Có logic cache/socket/version lặp ở nhiều nơi không.
7. Có dead code, TODO, debug log hoặc compatibility branch không cần thiết không.
8. Có thay đổi gây regression rõ ràng cho auth, chat, reaction, group actions, pin/mute hoặc message context không.

### J. UI, responsive và accessibility

1. Có đủ loading, empty, error, pagination error, cached refetch và reconnect state thuộc Phase [X] không.
2. Initial loading có fake count `0` hoặc làm layout nhảy không.
3. UI desktop và mobile có dùng chung authoritative state không.
4. Badge có đúng `0`, `1..99`, `99+` và accessible exact count không.
5. Có semantic link/button và keyboard support không.
6. Có interactive control lồng nhau không.
7. Focus-visible và focus management có hợp lý không.
8. Unread có dựa duy nhất vào màu không.
9. Skeleton có bị screen reader đọc như dữ liệu thật không.
10. Live region có spam hoặc notification mới tự cướp focus không.
11. Có tôn trọng `prefers-reduced-motion` không.
12. UI có phù hợp Threads-inspired design system, spacing, contrast và breakpoint hiện tại không.

## 3. Kiểm tra tĩnh

Chạy:

```bash
npx tsc --noEmit
```

Chạy lint có mục tiêu trên toàn bộ file thuộc Phase [X] đã tạo hoặc chỉnh sửa.

Nếu repo đã có sẵn unit/component test infrastructure và có targeted tests liên quan, có thể chạy các test đó ở chế độ không tạo dữ liệu/tài khoản và không thêm package. Không dựng test framework mới trong bước review.

Không yêu cầu lint toàn repo phải pass. Hãy phân biệt rõ:

- Lỗi do Phase [X] tạo ra.
- Lỗi đã tồn tại trước.
- Lỗi nằm ngoài phạm vi Phase [X].
- Lỗi không xác định được provenance do thiếu baseline/change boundary.

Không sửa bất kỳ lỗi nào trong bước review.

Không để `npx` tự tải package mới. Dùng package scripts hoặc dependency đã cài trong repo.

Các hành vi chỉ có thể xác minh bằng browser/runtime phải được ghi là `Runtime acceptance: chưa xác minh`. Không kết luận runtime UX đã được chứng minh chỉ dựa trên code inspection, TypeScript hoặc lint.

## 4. Quy tắc kết luận

- Chỉ nêu vấn đề thực sự quan sát được từ source hoặc contract.
- Không suy đoán lỗi runtime khi không có bằng chứng từ luồng code.
- Có thể nêu “rủi ro” khi tồn tại một đường thực thi cụ thể dẫn tới vấn đề; phải chỉ rõ đường đó.
- Không đề xuất tính năng mới ngoài kế hoạch.
- Không biến preference cá nhân về code style thành blocker.
- Ưu tiên vấn đề theo mức độ:
  - Critical: sai dữ liệu, rò session, mất quyền, duplicate/race nghiêm trọng.
  - High: sai contract, sai unread/version, listener lifecycle hoặc gate chính.
  - Medium: incomplete UI state, accessibility, responsive hoặc coupling đáng kể.
  - Low: code smell/technical debt không làm sai hành vi hiện tại.

## 5. Định dạng báo cáo

Trả về báo cáo ngắn gọn theo cấu trúc:

### 1. Kết luận Phase [X]

- Đạt qua kiểm tra tĩnh.
- Đạt một phần.
- Không đạt.
- Bị chặn bởi dependency/backend gap.

Nêu lý do ngắn, phân biệt `Static gate` với `Runtime acceptance`, và xác định đúng dòng trạng thái trong `phase-frontend-noti.md` có phản ánh gate thực tế không. Không sửa trạng thái trong bước review.

### 2. Coverage theo phạm vi Phase [X]

Lập bảng ngắn gồm:

- Nhóm kiểm tra.
- Có áp dụng cho Phase [X] hay không.
- Kết quả: Pass, Findings hoặc `Không áp dụng — thuộc Phase N`.

### 3. Những gì đã triển khai đúng

Liệt kê các capability chính và đóng góp của chúng.

### 4. Vấn đề phát hiện

Mỗi vấn đề phải có:

- Mức độ.
- File/vị trí hoặc luồng code liên quan.
- Bằng chứng quan sát được.
- Hành vi hiện tại.
- Hành vi đúng theo phase/contract.
- Ảnh hưởng tới gate.
- Provenance: do change set Phase [X], tồn tại trước, ngoài phạm vi hoặc không xác định được.

### 5. Hạng mục còn thiếu

Liệt kê theo đúng mục hoặc gate của Phase [X], không đề xuất ngoài kế hoạch.

### 6. Phần vượt phạm vi

Nêu code thuộc phase sau, phase phụ hoặc refactor không cần thiết nếu có.

### 7. Contract/backend gap

Nêu mismatch có bằng chứng và phân biệt rõ:

- Frontend implement sai.
- Contract không rõ.
- Backend capability thực sự thiếu.

Không đề nghị frontend fake workaround.

### 8. Kết quả kiểm tra

- `npx tsc --noEmit`.
- Targeted lint.
- Targeted tests nếu có sẵn.
- Lỗi mới.
- Lỗi tồn tại trước.
- Lỗi không xác định được provenance.
- Runtime acceptance chưa xác minh.

### 9. Technical debt dành cho phase sau

Chỉ nêu điểm đã có trong kế hoạch hoặc phát sinh trực tiếp từ implementation, không thêm chức năng mới.

Không lặp câu “Không phát hiện vấn đề có bằng chứng” cho từng checklist con. Dùng bảng coverage để ghi `Pass` hoặc `Không áp dụng`; chỉ mở rộng phần có finding hoặc bằng chứng đáng chú ý.
