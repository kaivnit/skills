---
name: ux-research-flows
description: Thiết kế trải nghiệm người dùng (UX) cho MVP - user journey, user flow, information architecture, wireframe low-fi, trạng thái lỗi/rỗng/loading, accessibility và usability test nhanh. Dùng khi cần thiết kế luồng màn hình, sitemap, wireframe, hoặc đánh giá UX của một tính năng.
---

# UX Research & Flows

## Đầu ra
`docs/01-user-flows.md` (flow Mermaid + wireframe ASCII/Figma link + checklist trạng thái)

## Quy trình
1. **Từ story → task**: mỗi Must-story phân rã thành chuỗi hành động người dùng.
2. **Journey map ngắn**: Trigger → Khám phá → Hành động → Kết quả → Phản hồi. Đánh dấu điểm đau & "moment of truth".
3. **Information Architecture**: sitemap ≤ 3 cấp; điều hướng chính ≤ 5–7 mục (Hick's law).
4. **User flow** (happy path + ≥ 1 nhánh lỗi) bằng Mermaid:
   ```mermaid
   flowchart TD
     A[Landing] --> B{Đã đăng nhập?}
     B -- Không --> C[Đăng nhập/Đăng ký] --> D
     B -- Có --> D[Danh sách sản phẩm]
     D --> E[Chi tiết] --> F[Giỏ hàng] --> G[Thanh toán]
     G -- Lỗi thanh toán --> H[Thông báo + thử lại] --> G
     G -- Thành công --> I[Xác nhận đơn]
   ```
5. **Wireframe low-fidelity**: khung layout, thứ bậc nội dung, CTA chính **duy nhất** mỗi màn hình. Chưa màu sắc.
6. **Bảng trạng thái bắt buộc** cho mỗi màn hình dữ liệu: `loading` · `empty` · `error` · `partial` · `success` · `offline/timeouts`.
7. **Microcopy**: nút = động từ cụ thể ("Đặt hàng", không "Submit"); thông báo lỗi nói *chuyện gì + cách sửa*.
8. **Accessibility (WCAG 2.2 AA)**: tương phản ≥ 4.5:1, điều hướng bàn phím, label cho input, focus rõ, target ≥ 24px (ưu tiên 44px mobile).
9. **Usability test 5 người** (Nielsen): giao 3 tác vụ, quan sát không gợi ý, ghi lỗi theo mức nghiêm trọng.

## Heuristics kiểm nhanh (Nielsen)
Hiển thị trạng thái hệ thống · Khớp với thế giới thực · Kiểm soát/undo · Nhất quán · Ngăn lỗi · Nhận biết thay vì nhớ · Linh hoạt · Tối giản · Giúp khôi phục lỗi · Trợ giúp.

## Gate
- [ ] Mỗi Must-story có flow happy path + lỗi chính
- [ ] Mỗi màn hình có đủ bảng trạng thái
- [ ] Mỗi màn hình có đúng 1 primary CTA
- [ ] Checklist a11y cơ bản đạt

## Anti-patterns
Bắt đầu bằng UI đẹp trước khi có flow; form dài không chia bước; chỉ thiết kế happy path; dùng màu là tín hiệu duy nhất.
