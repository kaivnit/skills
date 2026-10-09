---
name: project-planning
description: Lập kế hoạch giao hàng MVP - roadmap, chia vertical slice thành sprint, ước lượng, quản lý rủi ro và phụ thuộc, Definition of Ready/Done, nhịp họp và demo, theo dõi tiến độ. Dùng khi cần lên kế hoạch thực hiện sau discovery, ước lượng thời gian, chia task cho đội hoặc cho một mình, hoặc khi dự án trễ cần cắt scope.
---

# Project Planning & Delivery

## Đầu ra
`docs/13-delivery-plan.md` (roadmap, sprint plan, risk register, DoD) — cập nhật mỗi sprint.

## Quy trình
1. **Đầu vào**: backlog Must từ `product-discovery`, kiến trúc từ `architecture-ddd`, ràng buộc (deadline, ngân sách, số người).
2. **Chia theo lát cắt dọc** (UI → API → DB → deploy), không chia theo tầng. Lát đầu tiên là **walking skeleton**: đăng nhập → 1 hành động nghiệp vụ → lưu DB → deploy staging.
3. **Phân rã**: Epic → Story (`US-xx`, ≤ 3 ngày) → Task (≤ 1 ngày). Story quá lớn thì tách theo luồng, quy tắc nghiệp vụ, hoặc dữ liệu.
4. **Ước lượng**:
   - Dùng khoảng (best/likely/worst) thay vì một con số: `E = (O + 4M + P) / 6`.
   - Planning poker/T-shirt cho đội; ghi giả định.
   - Cộng đệm 20–30% cho tích hợp, bug, review; không đệm từng task.
   - Đo **velocity thực** sau 2 sprint rồi hiệu chỉnh.
5. **Sắp xếp theo rủi ro + giá trị**: làm sớm phần rủi ro kỹ thuật cao (tích hợp thanh toán, auth, import dữ liệu) và phần kiểm chứng giả định lớn nhất.
6. **Sprint 1–2 tuần**: mục tiêu sprint là 1 câu "người dùng có thể …"; kết thúc bằng demo trên staging.
7. **Risk register**: `rủi ro | xác suất | tác động | biện pháp | chủ sở hữu | trigger`. Duyệt mỗi tuần.
8. **Phụ thuộc**: liệt kê phụ thuộc ngoài (đối tác, thiết kế, tài khoản cloud, pháp lý) và ngày cần có.
9. **Theo dõi**: burn-up chart (thấy cả scope đổi), cycle time, số bug mở. Báo cáo ngắn mỗi tuần: xong gì, tuần tới, rủi ro, cần gì.

## Định nghĩa
**Definition of Ready**: có acceptance criteria, thiết kế/flow, phụ thuộc đã rõ, ước lượng được.
**Definition of Done**: code review xong, test xanh, đã deploy staging, tài liệu/OpenAPI cập nhật, có log/metric cho tính năng, product owner nghiệm thu, **commit theo `conventional-commit`**.

## Khi trễ tiến độ
Thứ tự cắt: tính năng Should/Could → độ hoàn thiện UI → tự động hoá phụ → tối ưu sớm. **Không cắt**: test nền tảng, bảo mật, observability, backup. Thông báo sớm bằng số liệu, đề xuất 2–3 phương án (cắt scope / thêm thời gian / thêm người — nhớ luật Brooks).

## Làm một mình
Giữ WIP = 1–2, timebox khám phá (spike) tối đa 1 ngày, review code bằng chính mình qua checklist sau 24h, demo cho người dùng thử mỗi tuần để có phản hồi ngoài.

## Gate
- [ ] Walking skeleton lên staging trong sprint đầu
- [ ] Mỗi sprint có mục tiêu 1 câu và demo
- [ ] Risk register có người sở hữu; rủi ro cao đã có kế hoạch
- [ ] Còn buffer; scope Must không vượt năng lực đã đo

## Anti-patterns
Gantt chi tiết 6 tháng; ước lượng một con số rồi coi là cam kết; làm xong tất cả backend rồi mới làm frontend; thêm scope giữa sprint không đổi; "gần xong 90%" kéo dài.
