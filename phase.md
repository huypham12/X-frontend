# Lộ trình triển khai Frontend (Frontend Development Roadmap)
*Dự án: X-Clone (Twitter Clone)*

Dựa trên tài liệu Backend (SRS & API Endpoints), quá trình triển khai Frontend cần được thực hiện tuần tự để đảm bảo các tính năng phụ thuộc (như Authentication) phải có trước khi làm các tính năng cốt lõi (như Đăng Tweet, Nhắn tin). Dưới đây là lộ trình 6 giai đoạn (Phases) chi tiết.

---

## Phase 1: Nền tảng & Xác thực (Foundation & Authentication)
*Mục tiêu: Xây dựng bộ khung dự án, các UI Component cơ bản và luồng Đăng nhập/Đăng ký để xác định danh tính (Access Token).*

**1.1. Khởi tạo & Cấu hình Core (Setup)**
- Cấu hình Axios Interceptors: Tự động đính kèm `AccessToken` vào header `Authorization` cho mọi request.
- Tự động gọi API `POST /auth/refresh-token` khi token hết hạn (mã lỗi 401) và retry request gốc.
- Cấu hình Global State (Redux/Zustand) để lưu trữ thông tin `currentUser` và trạng thái xác thực.
- Xây dựng Layout cơ bản: `AuthLayout` (cho đăng nhập/đăng ký) và `MainLayout` (có Sidebar, Header chung).

**1.2. Tính năng Auth (Xác thực)**
- **UI:** Trang Đăng nhập, Đăng ký, Quên mật khẩu, Đặt lại mật khẩu.
- **API Tích hợp:**
  - `POST /auth/login` (Lưu token vào LocalStorage/Cookies).
  - `POST /auth/register`
  - `POST /auth/verify-email`
  - `POST /auth/forgot-password` & `POST /auth/reset-password`
  - `POST /auth/logout` (Clear state và token).

**1.3. Route Protection (Bảo vệ luồng truy cập)**
- Tạo các middleware/Guard (ví dụ: `<ProtectedRoute />`) ở Frontend để đá người dùng chưa đăng nhập về trang Login nếu họ vào `/home`.

---

## Phase 2: Hồ sơ người dùng & Đa phương tiện (Profile & Media)
*Mục tiêu: Hoàn thiện thông tin cá nhân của người dùng, tích hợp hệ thống upload file (chuẩn bị cho việc đăng ảnh/video ở Tweet sau này).*

**2.1. Tính năng Đa phương tiện (Media)**
- Xây dựng component `MediaUploader` (Chọn file, preview ảnh/video trước khi tải lên).
- **API Tích hợp:**
  - `POST /media/upload-image`
  - `POST /media/upload-video` (Xử lý trạng thái pending do video cần chạy BullMQ ở backend).

**2.2. Hồ sơ người dùng (User Profile)**
- **UI:** Trang Profile cá nhân (Banner, Avatar, Bio), Form Edit Profile.
- **API Tích hợp:**
  - `GET /users/me`: Lấy và đồng bộ thông tin user hiện tại vào Global State.
  - `PATCH /users/me`: Chỉnh sửa thông tin cá nhân (kết hợp API upload image để đổi Avatar/Cover).
  - `GET /users/profile/:username`: Xem hồ sơ công khai của người khác.

---

## Phase 3: Mạng lưới xã hội - Follow & Search (Social Network)
*Mục tiêu: Kết nối người dùng lại với nhau, tạo nền tảng để hiển thị News Feed (bảng tin chỉ hiện bài của người mình follow).*

**3.1. Tính năng Mạng lưới (Follow/Block)**
- **UI:** Nút Follow/Unfollow/Block, Modal hiển thị danh sách Followers/Following.
- **API Tích hợp:**
  - `POST /users/:id/follow` & `DELETE /users/:id/follow` (Cập nhật UI Optimistic UI cho mượt).
  - `GET /users/:id/followers` & `GET /users/:id/following`.
  - `POST /users/:id/block` & `DELETE /users/:id/block`.

**3.2. Tìm kiếm (Search & Khám phá)**
- **UI:** Thanh Search Bar (Global Search), Trang kết quả tìm kiếm (Tabs: Users, Tweets, Hashtags).
- **API Tích hợp:**
  - `GET /search/users` & `GET /search/tweets`
  - `GET /search/hashtags` & `GET /search/history`.

---

## Phase 4: Tính năng cốt lõi - Bài đăng (Tweets & Timeline)
*Mục tiêu: Triển khai linh hồn của ứng dụng X-Clone, hiển thị bảng tin và các tương tác Tweet.*

**4.1. Hiển thị Bảng tin (News Feed)**
- **UI:** Component `TweetCard` hiển thị nội dung bài đăng, ảnh/video, thời gian, số lượt like/comment. Cấu trúc cuộn vô hạn (Infinite Scroll).
- **API Tích hợp:**
  - `GET /tweets` (News Feed).
  - `GET /users/:username/tweets` (Timeline của một user cụ thể).

**4.2. Tạo và Tương tác Tweet**
- **UI:** Khu vực Create Tweet (có text area, nút đính kèm ảnh/video, chọn Audience: Everyone/Twitter Circle).
- **API Tích hợp:**
  - `POST /tweets`: Đăng bài mới.
  - `POST /tweets/:id/like` & `DELETE /tweets/:id/like`.
  - `POST /tweets/:id/bookmark` & Lấy danh sách `GET /tweets/bookmarks`.

**4.3. Tweet Chi tiết & Trả lời (Replies / Retweets)**
- **UI:** Trang chi tiết một Tweet, hiển thị danh sách các Comment bên dưới.
- **API Tích hợp:**
  - `GET /tweets/:tweet_id` & `GET /tweets/:tweet_id/children` (Lấy bình luận/Retweet).

---

## Phase 5: Giao tiếp thời gian thực - Chat (Real-time Messaging)
*Mục tiêu: Đưa Socket.io vào hoạt động, triển khai tính năng nhắn tin 1-1 và Group.*

**5.1. Tích hợp Socket & Danh sách hội thoại**
- Khởi tạo kết nối `socket.io-client` với Backend, truyền `AccessToken` để xác thực socket.
- **UI:** Layout Chat, Danh sách các hội thoại bên trái (`Sidebar`).
- **API Tích hợp:**
  - `GET /conversations`: Lấy danh sách hội thoại.

**5.2. Chức năng Nhắn tin (1-1 & Group)**
- **UI:** Khung Chat (ChatBox), bong bóng tin nhắn (Message Bubbles), Form nhập tin nhắn (Hỗ trợ upload ảnh/video).
- **Tính năng & API/Socket:**
  - Gửi tin qua Socket hoặc REST API. Lắng nghe event `receive_message` từ backend để update UI tức thì.
  - `GET /conversations/:id/messages`: Tải lịch sử tin nhắn.
  - Tính năng Nhóm: Tạo nhóm (`POST /conversations/group`), thêm/xóa thành viên.
  - Tương tác tin nhắn: Thả icon (`POST /messages/:id/react`), Thu hồi (`POST /messages/:id/revoke`).
  - Đánh dấu đã đọc tin nhắn (`POST /conversations/:id/read`).

---

## Phase 6: Thông báo & Hoàn thiện (Notifications & Polish)
*Mục tiêu: Kéo người dùng trở lại app thông qua thông báo real-time và chải chuốt UI/UX.*

**6.1. Thông báo (Notifications)**
- **UI:** Nút chuông thông báo (kèm badge đỏ số lượng), Trang danh sách thông báo.
- **Tính năng & API:**
  - Lắng nghe event `new_notification` qua Socket.io.
  - `GET /notifications`
  - `POST /notifications/read-all`

**6.2. Hoàn thiện (Polish & Performance)**
- **Optimistic UI:** Cập nhật UI trước (VD: Bấm like -> Xanh luôn), nếu API lỗi thì rollback (để tránh người dùng cảm thấy app bị lag).
- **Skeleton Loaders:** Thêm hiệu ứng khung xương tải trang thay vì chỉ dùng Spinners đơn điệu.
- **Error Boundaries & Toast Messages:** Xử lý hiển thị lỗi API đẹp mắt (bằng thư viện như `react-hot-toast` hoặc `sonner`), thông báo khi Rate Limit bị chạm giới hạn.
- Tối ưu hóa SEO (Meta tags) hoặc Server Side Rendering (nếu dùng Next.js) cho các trang public như Profile cá nhân hoặc Chi tiết Tweet.
