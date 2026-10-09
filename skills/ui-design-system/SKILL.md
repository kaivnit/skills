---
name: ui-design-system
description: Xây dựng UI visual design và design system tối giản cho MVP - design tokens (màu, typography, spacing), component library, dark mode, responsive, hand-off cho frontend. Dùng khi cần chọn bảng màu, typography, thiết kế component, chuẩn hóa giao diện, hoặc map design sang Tailwind/shadcn/MUI.
---

# UI Design System (MVP-grade)

## Đầu ra
`docs/02-design-tokens.md` + `web/src/styles/tokens.css` (hoặc `tailwind.config`)

## Quy trình
1. **Chọn nền thay vì tự vẽ**: MVP dùng thư viện sẵn (shadcn/ui + Tailwind, MUI, Ant Design, hoặc MudBlazor nếu stack Blazor). Tuỳ biến bằng token, không fork component.
2. **Design tokens** (nguồn sự thật duy nhất):
   ```css
   :root {
     --color-primary: #2563eb;  --color-primary-fg: #fff;
     --color-bg: #fff;          --color-surface: #f8fafc;
     --color-text: #0f172a;     --color-muted: #64748b;
     --color-danger: #dc2626;   --color-success: #16a34a;
     --radius: 8px;
     --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-6: 24px;
     --font-sans: "Inter", system-ui, sans-serif;
   }
   :root[data-theme="dark"] { --color-bg:#0b1220; --color-surface:#111a2e; --color-text:#e5e7eb; }
   ```
3. **Typography scale** (tỉ lệ 1.25): 12/14/16/20/24/32; chỉ 1–2 font; line-height 1.5 cho body.
4. **Màu**: 1 primary + neutral + 3 semantic (success/warning/danger). Kiểm tra tương phản AA cho mọi cặp chữ/nền.
5. **Spacing theo lưới 4/8px**; layout dùng container + grid 12 cột; breakpoints `sm 640 / md 768 / lg 1024 / xl 1280`.
6. **Component tối thiểu (≤ 15)**: Button, Input, Select, Checkbox/Radio, Form field (label+error), Modal, Toast, Table, Card, Tabs, Badge, Skeleton, Empty state, Navbar, Pagination.
7. **Mỗi component có**: variants, sizes, states (hover/focus/disabled/loading/error), ghi chú a11y.
8. **Hand-off cho FE**: tên token = tên biến CSS; component có Storybook story; ảnh dùng SVG/WebP; icon một bộ (lucide).
9. **Mobile-first**, touch target ≥ 44px, hỗ trợ `prefers-color-scheme` và `prefers-reduced-motion`.

## Gate
- [ ] Token định nghĩa 1 chỗ, FE tiêu thụ qua biến
- [ ] ≤ 15 component, đủ states
- [ ] Contrast AA đạt cho light + dark
- [ ] Responsive kiểm tra ở 375 / 768 / 1280

## Anti-patterns
Hard-code hex trong component; 6 font-size ngẫu nhiên; tự viết lại date-picker/table; thiết kế từng màn hình thay vì từ component.
