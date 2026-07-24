tôi đang vibe code frontend cho clone X
tôi nghĩ trước khi code cần thiết lập các rule để AI tuân theo, ví dụ như giới hạn công nghệ sử dụng, phong cách chủ đạo là gì, còn gì nữa không nhỉ

Đúng rồi. Thực tế, chất lượng code AI sinh ra phụ thuộc 80% vào bộ rule + context, chỉ khoảng 20% là prompt của từng task.

Nếu bạn đang làm X (Twitter) Clone Frontend, thì nên xem AI như một junior dev rất giỏi nhưng không có tiêu chuẩn. Bạn phải đưa tiêu chuẩn trước.

Mình thường chia thành khoảng 12 nhóm rule.

1. Tech Stack (Bắt buộc)

Đây là thứ đầu tiên.

Ví dụ

Framework:
- React 19
- Next.js 15 App Router

Language
- TypeScript strict

Styling
- TailwindCSS
- shadcn/ui

State
- Zustand

Server State
- TanStack Query

Form
- React Hook Form
- Zod

Animation
- Framer Motion

Icons
- Lucide

Package Manager
- pnpm

Nếu không ghi rõ AI rất dễ:

Redux
Context
Axios
CSS Module
Styled Components

=> project thành nồi lẩu.

2. Coding Style

Ví dụ

- Functional Component only
- Arrow function only
- Không dùng class
- Không any
- Strict TypeScript
- Prefer composition over inheritance
- Early return
- Không nested if quá 2 tầng
3. Folder Structure

Ví dụ

src/
    app/
    components/
        common/
        ui/
        tweet/
    hooks/
    services/
    stores/
    lib/
    types/
    utils/

AI phải biết

Component này đặt ở đâu.

Nếu không

Nó sẽ tạo

Button.tsx
Button2.tsx
ButtonNew.tsx

khắp project.

4. Naming Convention

Ví dụ

Component
PascalCase

Hook
useXXX

Store
xxx.store.ts

API
xxx.service.ts

Type
xxx.type.ts

Constant
UPPER_CASE

Folder
kebab-case

File
kebab-case
5. UI Design Rule

Đây là cái rất nhiều người quên.

Ví dụ

Theme

Minimal

Dark mode first

Radius

12px

Shadow

Soft

Spacing

8px system

Primary Color

Twitter Blue

Animation

Subtle

Responsive

Mobile first

Nếu không nói

AI sẽ mỗi màn một style.

6. Component Rule

Ví dụ

Ưu tiên reusable component.

Không viết component >250 dòng.

Nếu component có nhiều responsibility thì tách.

Business logic không đặt trong UI component.

Presentation và Logic tách riêng nếu phức tạp.
7. State Management Rule

Ví dụ

UI State

useState

Global State

Zustand

Server State

React Query

Derived State

useMemo

Không duplicate state.

AI rất hay:

fetch

↓

setState

↓

useEffect

↓

fetch

↓

setState

Lặp vô tận.

8. API Rule

Ví dụ

Không fetch trực tiếp trong component.

Mọi API nằm trong services/.

Sử dụng React Query.

Error xử lý tập trung.

Response được typing đầy đủ.

Không dùng any.
9. Performance Rule

Ví dụ

Memo component khi cần.

Lazy loading.

Dynamic import.

Virtual list khi >100 items.

Không re-render không cần thiết.

Image tối ưu.

Skeleton thay vì spinner nếu loading >300ms.
10. Accessibility Rule

Ví dụ

ARIA Label

Keyboard Navigation

Semantic HTML

Focus State

Contrast

AI gần như không tự thêm nếu bạn không yêu cầu.

11. Code Quality Rule

Ví dụ

ESLint pass

Prettier pass

Không warning

Không TODO

Không console.log

Không dead code

Không duplicated code
12. Output Rule (Quan trọng nhất)

Đây là cái mình thấy hiệu quả nhất.

Ví dụ:

Khi tạo code:

1. Phân tích yêu cầu.

2. Liệt kê component cần tạo.

3. Liệt kê file cần sửa.

4. Giải thích kiến trúc.

5. Sinh code.

6. Kiểm tra TypeScript.

7. Kiểm tra lint.

8. Kiểm tra responsive.

9. Kiểm tra accessibility.

10. Chỉ kết thúc khi toàn bộ đều pass.

AI sẽ "nghĩ" trước khi code thay vì code ngay.

Ngoài ra, với dự án clone X, mình còn thêm 5 rule rất đáng giá
1. Không tự ý thêm thư viện
Không cài package mới nếu chưa được yêu cầu.

Nếu cần package mới:
- giải thích lý do
- đưa ra ít nhất 2 lựa chọn
- chờ xác nhận
2. Không thay đổi API
Frontend phải tuân thủ contract.

Không đổi request.

Không đổi response.

Nếu API thiếu field thì ghi chú thay vì tự thêm.
3. Không tự refactor toàn project
Chỉ sửa file liên quan.

Không đổi naming.

Không đổi architecture nếu chưa được yêu cầu.

Điều này tránh việc AI "tiện tay" sửa hàng chục file.

4. Luôn giải thích trade-off

Ví dụ:

Nếu có nhiều cách triển khai, hãy:
- nêu các phương án
- phân tích ưu/nhược
- chọn phương án phù hợp với dự án

Điều này giúp bạn học được từ AI thay vì chỉ nhận code.

5. Đặt câu hỏi khi thiếu thông tin
Nếu yêu cầu còn mơ hồ hoặc thiếu thông tin quan trọng, không được tự suy đoán.
Hãy hỏi để làm rõ trước khi sinh code.
Nếu mục tiêu là "vibe coding" nhưng vẫn giữ chất lượng cao

Mình sẽ tách thành 3 tầng tài liệu thay vì một prompt rất dài:

AI Constitution (ít thay đổi)
Tech stack
Coding conventions
Architecture
Design principles
Performance
Accessibility
Output rules
Project Knowledge Base
Cấu trúc thư mục
Quy ước component
API contract
Design system
Các pattern đang dùng trong dự án
Những quyết định kiến trúc (ADR)
Task Prompt
Mục tiêu của feature
Yêu cầu cụ thể
Tiêu chí hoàn thành (Definition of Done)
Ràng buộc riêng của task

Cách này giúp AI luôn có "luật chơi" cố định, trong khi mỗi prompt chỉ cần tập trung vào feature đang phát triển. Đây cũng là cách các IDE AI hiện nay (Cursor, Claude Code, Gemini CLI, GitHub Copilot Agent...) hoạt động hiệu quả nhất trên các codebase lớn.

tôi đang muốn phong cách giao diện của dự án giống threads

Nếu mục tiêu là clone X nhưng UI theo phong cách Threads, thì đây là một quyết định rất hợp lý. Threads có giao diện hiện đại, tối giản và dễ triển khai hơn Twitter hiện tại.

Bạn nên mô tả bằng các rule có thể thực thi được, thay vì chỉ ghi "giống Threads". AI thường không hiểu chính xác "giống" ở mức nào.

UI Philosophy
Design Philosophy

- Threads-inspired interface
- Minimalist
- Content-first
- Clean visual hierarchy
- Comfortable reading experience
- Modern and premium feel
- Subtle animations
- No visual clutter
Color System
Theme

Dark mode first

Primary Background
#000000

Secondary Background
#121212

Card Background
#181818

Border
Low contrast

Primary Text
White

Secondary Text
Gray

Accent Color
Twitter Blue only for interactive actions.

Avoid colorful UI unless necessary.
Typography
Font

Inter

Style

Large readable text

Strong hierarchy

Generous line height

No decorative fonts
Layout
Layout Rules

Content centered.

Maximum content width around 600~700px.

Large white space.

No unnecessary side decorations.

Simple navigation.

Responsive first.
Components
Component Style

Rounded corners.

Soft shadow.

Thin borders.

Minimal icons.

No heavy gradients.

No glassmorphism.

No neumorphism.
Buttons
Primary Button

Rounded

Medium weight

Simple color

No gradient

Hover only slightly brighter

Small transition
Cards
Cards

Flat

Thin border

Minimal shadow

Padding 16~20px

Comfortable spacing
Motion
Animation

Fast

Subtle

150~250ms

Use Framer Motion.

Never create flashy animations.
Spacing
Spacing System

8px scale

4

8

12

16

24

32

48
Icons
Icons

Lucide

Outline style

Consistent size

Avoid filled icons.
Images
Avatar

Circular

High priority

Post image

Rounded

Lazy loading

Cover mode
Forms
Input

Rounded

Minimal border

Focus ring

No thick outline

Clear placeholder
Feed

Đây là phần quan trọng nhất vì nó quyết định "chất Threads".

Feed Rules

Content is the hero.

Avatar small.

Username emphasized.

Metadata subtle.

Actions lightweight.

Replies visually connected.

Infinite scrolling.

Skeleton loading instead of spinner.
Những điều AI KHÔNG được làm
Avoid

Heavy gradients

Large shadows

Colorful buttons

Random animations

Complex backgrounds

Over-designed cards

Different border radius

Different spacing systems

Multiple accent colors

Inconsistent icon styles
Một rule rất hiệu quả

Thêm một mục "Visual Benchmark" để AI luôn so sánh với phong cách mong muốn:

Visual Benchmark

The overall visual quality should feel similar to Threads.

When unsure between two designs:

Choose the simpler one.

Choose the one with more whitespace.

Choose the one with fewer borders.

Choose the one that emphasizes content rather than UI.

Choose consistency over creativity.

Đây là quy tắc khá mạnh vì AI sẽ tự ưu tiên các quyết định thiết kế theo "tinh thần Threads" thay vì cố gắng sáng tạo.

Lưu ý

Bạn nên ghi "Threads-inspired" thay vì "Clone Threads UI".

"Threads-inspired" nghĩa là học triết lý thiết kế: tối giản, content-first, khoảng trắng hợp lý, typography rõ ràng.
Tránh yêu cầu sao chép nguyên xi bố cục, icon, hoặc các yếu tố nhận diện đặc trưng của Threads.

Với dự án portfolio, cách này vừa tạo được cảm giác hiện đại, vừa thể hiện khả năng xây dựng một giao diện có phong cách riêng thay vì chỉ sao chép một sản phẩm có sẵn.