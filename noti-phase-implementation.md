[AI_RULES.md](d:/NodeJS/X-full/X-frontend/AI_RULES.md)
[architecture.md](d:/NodeJS/X-full/X-frontend/architecture.md)
[design-system.md](d:/NodeJS/X-full/X-frontend/design-system.md)
[input-frontend-noti.md](d:/NodeJS/X-full/X-frontend/input-frontend-noti.md)
[frontend-noti-review.md](d:/NodeJS/X-full/X-frontend/frontend-noti-review.md)
[phase-frontend-noti.md](d:/NodeJS/X-full/X-frontend/phase-frontend-noti.md)
[frontend-notification-contract.md](d:/NodeJS/X-full/X-ver2/frontend-notification-contract.md)

Dựa trên kế hoạch trong `phase-frontend-noti.md`, hãy triển khai đầy đủ Phase [X].

Giá trị `X` sẽ được cung cấp ở mỗi lần tôi yêu cầu. Mọi `Phase [X]`, phase `[X].1` và trạng thái liên quan trong prompt này phải được hiểu theo đúng giá trị đó. Không thay thế hoặc suy diễn sang phase khác.

“Triển khai đầy đủ Phase [X]” nghĩa là phải xử lý toàn bộ phạm vi, hạng mục, nhánh công việc, edge case, UI state, kiểm tra và gate nằm bên trong Phase [X]. Không được bỏ qua một mục chỉ vì Phase [X] có nhiều mục con.

Các phase phụ dạng `[X].1` không thuộc phạm vi triển khai mặc định. Chỉ được ghi nhận hoặc đề xuất mở phase phụ khi đúng điều kiện blocker trong kế hoạch; không tự sửa backend và không tự triển khai phase phụ nếu chưa được yêu cầu riêng.

## 0. Thứ tự ưu tiên và phạm vi áp dụng

Khi có khác biệt hoặc một checklist chung rộng hơn Phase [X], áp dụng thứ tự ưu tiên sau:

1. Contract backend hiện hành và bằng chứng từ backend source thực tế.
2. Yêu cầu sản phẩm tương ứng trong `input-frontend-noti.md`.
3. Phạm vi, dependency, edge case, “Những việc không làm” và gate của Phase [X] trong `phase-frontend-noti.md`.
4. Quy tắc kiến trúc/UI trong `AI_RULES.md`, `architecture.md` và `design-system.md`.
5. Checklist chung trong prompt này.

Nếu contract tài liệu và backend source mâu thuẫn, không tự chọn một bên để che mismatch. Hãy ghi nhận bằng chứng và xử lý theo mục backend gap bên dưới.

Checklist chung chỉ áp dụng khi nội dung đó:

- Nằm trực tiếp trong Phase [X]; hoặc
- Cần để bảo vệ dependency đã hoàn thành khỏi regression do thay đổi của Phase [X].

Không coi capability được lên kế hoạch cho phase sau là phần còn thiếu của Phase [X]. Không triển khai capability phase sau chỉ để thỏa một checklist chung.

## 1. Trước khi sửa code

1. Đọc đầy đủ:
   - Phase [X].
   - Các quyết định kiến trúc liên quan.
   - Dependency bắt buộc của Phase [X].
   - Các phase trước có ảnh hưởng trực tiếp.
   - Gate hoàn thành, rollback và điều kiện mở phase phụ.
   - Các phần tương ứng trong `input-frontend-noti.md`, `frontend-noti-review.md`, `AI_RULES.md`, `architecture.md`, `design-system.md` và backend contract.

2. Đối chiếu với source hiện tại:
   - Không giả định danh sách file trong kế hoạch luôn còn chính xác.
   - Xác minh implementation của các phase trước thực sự tồn tại và đủ điều kiện để Phase [X] tiếp tục.
   - Tái sử dụng component, hook, API service, query key, cache helper và store hiện có khi phù hợp.
   - Không viết lại toàn bộ module nếu có thể mở rộng hoặc refactor từng bước.
   - Nếu workspace dùng Git, chạy `git status --short` và ghi nhận các file đã thay đổi trước khi bắt đầu; không ghi đè hoặc nhận là thay đổi của Phase [X] đối với phần người dùng đã sửa sẵn.
   - Ghi nhận baseline `npx tsc --noEmit` trước khi sửa nếu lệnh có thể chạy trong repo hiện tại.
   - Xác định lệnh lint từ package scripts hoặc dependency đã cài trong repo; không để `npx` tự tải package mới.

3. Trước khi triển khai, trình bày ngắn:
   - Mục tiêu cụ thể của Phase [X].
   - Dependency/gate đầu vào đã đạt hay chưa.
   - Các file dự kiến tạo mới và chỉnh sửa.
   - Luồng dữ liệu và state ownership dự kiến.
   - Những điểm contract hoặc backend gap cần lưu ý.

Nếu một dependency bắt buộc hoặc gate đầu vào chưa đạt:

- Không sửa code Phase [X].
- Không tự sửa phase dependency trong cùng lần chạy.
- Trả về trạng thái `Bị chặn` và nêu gate chưa đạt, file/luồng liên quan cùng bằng chứng cụ thể.
- Chỉ tiếp tục một phần độc lập nếu chính kế hoạch Phase [X] nói rõ phần đó được phép thực hiện khi thiếu dependency; phần này vẫn không được đánh dấu hoàn thành.

## 2. Giới hạn phạm vi

- Chỉ triển khai Phase [X].
- Không triển khai trước chức năng thuộc phase sau, kể cả khi thấy thuận tiện.
- Không tự triển khai phase `[X].1` hoặc bất kỳ phase phụ nào.
- Không sửa backend, database, schema, index, queue, worker, REST contract hoặc Socket.IO contract.
- Không fake field, actor, target, conversation, member, unread state hoặc response để khớp UI.
- Không thêm package mới.
- Không refactor toàn bộ auth, conversations, tweets, providers hoặc cấu trúc dự án nếu Phase [X] không yêu cầu.
- Không dọn toàn bộ lỗi lint hoặc technical debt ngoài phạm vi trực tiếp.
- Không tạo mock server, test account, test data hoặc script runtime phục vụ kiểm thử.
- Không dùng loaded feed length, số conversation đang tải hoặc quét messages để tự tính unread.
- Không coi socket là durable source of truth; REST vẫn là nguồn bootstrap và reconciliation.
- Không sửa capability còn thiếu đã được giao cho phase sau. Ví dụ, nếu Phase [X] không bao gồm Notification route/feed, Inbox landing hoặc active-read behavior thì việc chúng chưa tồn tại không phải lý do để triển khai trước.
- Không sửa hoặc format lại file ngoài change set cần thiết của Phase [X].

## 3. Yêu cầu kiến trúc và code

1. Tuân thủ Feature-Sliced Design:
   - Domain-specific API, type, hook, store và component phải nằm trong `src/features/[domain]`.
   - `src/app` chỉ chứa route hoặc thin wrapper.
   - Shared layout/component chỉ chứa logic thực sự dùng chung.
   - Không đẩy business logic vào `src/components`, `src/providers` hoặc route component chỉ để làm nhanh.

2. State ownership:
   - React Query quản lý notification, unread summary, conversation và message server state.
   - Zustand/local state chỉ quản lý auth projection, UI intent, draft hoặc state thuần client.
   - Không tạo Zustand store làm bản sao notification feed hoặc unread state.
   - Không tạo hai source of truth cho desktop/mobile badge.

3. TypeScript:
   - Không thêm `any`.
   - Không dùng `@ts-ignore`.
   - Không dùng `eslint-disable` diện rộng.
   - Không ép kiểu không an toàn để che mismatch contract.
   - Phân biệt rõ DTO backend, normalized server state và client-only UI state.

4. API:
   - Không fetch trực tiếp trong component.
   - API call phải nằm trong API service của feature.
   - Request, response và error phải được type rõ.
   - Cursor phải được giữ opaque, không tự parse hoặc tự dựng.
   - Không sửa request/response theo suy đoán frontend.

5. React Query và cache:
   - Dùng query-key factory nhất quán cho các key bị Phase [X] tác động.
   - Dedupe notification/message theo ID có thẩm quyền.
   - State count/read có version phải bỏ qua payload cũ hoặc trùng theo đúng rule trong kế hoạch.
   - Không cộng/trừ unread bằng local delta khi backend đã trả authoritative snapshot.
   - Update các cache liên quan trong cùng transaction khi contract yêu cầu.
   - Optimistic update phải có rollback hoặc refetch recovery rõ ràng.
   - Logout/account switch không được để dữ liệu cá nhân của session trước tồn tại trong cache.

6. Socket.IO và realtime:
   - Listener domain phải có ownership rõ ràng, mount đúng một lần và cleanup bằng đúng handler.
   - Không đăng ký listener trong Sidebar hoặc component presentation.
   - Không để global event chỉ hoạt động khi active chat đang mount.
   - Event phải idempotent và chịu được duplicate/out-of-order.
   - Reconnect và browser focus phải reconciliation bằng REST theo phạm vi phase.
   - Không biến mọi socket event thành notification hoặc toast.

7. UI/UX:
   - Bám đúng `input-frontend-noti.md` và `design-system.md`.
   - Có đầy đủ loading, empty, initial error, pagination error, cached refetch và reconnect state khi Phase [X] liên quan.
   - Không fake số `0` trong lúc chưa tải được count.
   - Không để disconnect làm mất dữ liệu cache hoặc draft.
   - Hỗ trợ responsive theo phạm vi phase, không chỉ desktop.
   - Unread không được biểu diễn chỉ bằng màu.
   - Animation phải tôn trọng `prefers-reduced-motion`.

8. Accessibility:
   - Dùng semantic link cho navigation và button cho mutation.
   - Không lồng interactive control sai semantics.
   - Có keyboard navigation và focus-visible.
   - Badge phải có accessible label dùng số chính xác.
   - Skeleton phải ẩn khỏi accessibility tree.
   - Loading/error/reconnect status dùng ARIA phù hợp và không spam live region.
   - Vùng chạm mobile tối thiểu theo yêu cầu kế hoạch.

## 4. Xử lý backend gap hoặc contract mismatch

Nếu phát hiện response, event hoặc capability backend thực tế không khớp contract/kế hoạch:

1. Không fake field hoặc local behavior để vượt gate.
2. Không tự sửa backend.
3. Hoàn thành phần frontend độc lập an toàn còn triển khai được.
4. Ghi rõ:
   - Endpoint/event liên quan.
   - Shape contract dự kiến.
   - Shape thực tế quan sát được.
   - File hoặc bằng chứng source.
   - Phần frontend đã hoàn thành.
   - Phần bị chặn.
   - Ảnh hưởng tới gate của Phase [X].

5. Giữ Phase [X] ở trạng thái chưa hoàn thành nếu mismatch làm hỏng gate chính.
6. Chỉ đề xuất mở Phase `[X].1` theo đúng template trong kế hoạch; không tự triển khai phase phụ.

Không dừng toàn bộ phase chỉ vì một hạng mục bị chặn nếu các hạng mục khác vẫn có thể triển khai độc lập và an toàn.

## 5. Kiểm tra sau khi triển khai

Bắt buộc chạy:

```bash
npx tsc --noEmit
```

Chạy lint có mục tiêu trên các file được tạo hoặc chỉnh sửa bằng lệnh phù hợp với project.

Nếu repo đã có sẵn unit/component test infrastructure, chạy targeted tests liên quan tới code Phase [X]. Không thêm package, không dựng test framework mới và không tạo account/test data chỉ để chạy test.

Không yêu cầu `npm run lint` toàn repo phải đạt nếu repo đã có lỗi tồn tại trước. Tuy nhiên:

- Không được tạo lỗi lint mới trong các file bị thay đổi.
- Nếu lint targeted vẫn lỗi, phải phân biệt lỗi do thay đổi lần này với lỗi đã tồn tại.
- Không sửa lỗi ngoài phạm vi chỉ để làm đẹp báo cáo.

Ngoài ra, kiểm tra tĩnh:

- Import và dependency direction có đúng FSD không.
- Query key và cache update có nhất quán không.
- Listener có mount/cleanup đúng không.
- Có duplicate state hoặc useEffect loop không.
- UI có đủ loading/error/empty/responsive/accessibility state thuộc Phase [X] không.
- Có vô tình thay đổi hành vi hiện có của auth, conversation, message, group hoặc route không.
- Có code nào thuộc phase sau bị triển khai trước không.

Nếu workspace dùng Git, dùng `git diff --name-only` và `git diff` sau triển khai để:

- Xác định change set thực tế của Phase [X].
- Phân biệt file đã dirty trước với file được tạo/sửa trong lần này.
- Phát hiện thay đổi ngoài phạm vi hoặc format churn không cần thiết.

Nếu không có baseline hoặc change boundary đáng tin cậy, không khẳng định một lỗi là “đã tồn tại trước”. Ghi là `không xác định được provenance`.

Không tự chạy runtime browser test, tạo tài khoản, seed dữ liệu, load test hoặc E2E test nếu chưa được yêu cầu.

Các hành vi chỉ có thể xác minh bằng browser/runtime phải được ghi rõ là `Runtime acceptance: chưa xác minh`, trừ khi đã có targeted automated test phù hợp chạy thành công. Không dùng code inspection, TypeScript hoặc lint làm bằng chứng rằng runtime UX đã được chứng minh.

## 6. Cập nhật tài liệu

Cập nhật `phase-frontend-noti.md` như sau:

- Chỉ sửa đúng dòng `**Trạng thái: ...**` ngay dưới tiêu đề Phase [X], ngoài một ghi chú blocker ngắn nếu thật sự cần.
- Các giá trị trạng thái hợp lệ là `Chưa triển khai.`, `Hoàn thành một phần.`, `Bị chặn.` và `Đã hoàn thành.`.
- Chỉ đổi trạng thái Phase [X] thành `**Trạng thái: Đã hoàn thành.**` khi toàn bộ gate của phase thực sự đạt.
- Nếu phase chỉ hoàn thành một phần, đổi thành `**Trạng thái: Hoàn thành một phần.**` và ghi ngắn gọn phần chưa đạt/bằng chứng tại vị trí phù hợp mà không viết lại toàn bộ kế hoạch.
- Nếu dependency hoặc backend gap chặn gate chính, đổi thành `**Trạng thái: Bị chặn.**` và ghi blocker/bằng chứng ngắn gọn.
- Không đổi trạng thái phase sau.
- Không tự đánh dấu phase `[X].1` đã mở hoặc hoàn thành.
- Không sửa lại mục tiêu, scope hoặc acceptance criteria để làm implementation hiện tại có vẻ đạt.

Không cập nhật `endpoint.md`, `swagger.yaml` hoặc backend contract vì đây là triển khai frontend. Nếu phát hiện contract backend sai hoặc thiếu, chỉ báo cáo bằng chứng.

## 7. Báo cáo cuối cùng

Trả về báo cáo ngắn nhưng đầy đủ gồm:

1. Trạng thái Phase [X]: hoàn thành, hoàn thành một phần hoặc bị chặn.
2. Các file đã tạo.
3. Các file đã chỉnh sửa.
4. Nội dung chính đã triển khai.
5. Luồng dữ liệu, cache và socket behavior sau thay đổi.
6. Các UI state, responsive và accessibility đã xử lý.
7. Kết quả `npx tsc --noEmit`.
8. Kết quả lint targeted.
9. Kết quả targeted tests nếu repo có sẵn hạ tầng.
10. Phân biệt `Static gate` và `Runtime acceptance`; nêu rõ phần runtime chưa xác minh.
11. Gate nào đã đạt và gate nào chưa đạt.
12. Backend gap hoặc contract mismatch đã phát hiện, kèm bằng chứng.
13. Các ảnh hưởng hoặc nguy cơ regression đối với chức năng hiện có.
14. Change set thực tế và các file đã dirty từ trước nếu xác định được.
15. Xác nhận không triển khai trước phase sau và không tự triển khai phase phụ.
