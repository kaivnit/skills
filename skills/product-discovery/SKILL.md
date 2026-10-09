---
name: product-discovery
description: Biến ý tưởng mơ hồ thành product brief và backlog MVP rõ ràng. Dùng khi cần xác định vấn đề, persona, phạm vi MVP, user stories, MoSCoW, success metric, hoặc khi người dùng hỏi "nên làm gì trước", "scope MVP là gì", "viết user story/PRD".
---

# Product Discovery → MVP Scope

## Đầu ra
`docs/00-product-brief.md` + `docs/00-backlog.md`

## Quy trình
1. **Problem statement** (1 câu): `[Persona] gặp [vấn đề] khi [bối cảnh], hiện giải quyết bằng [cách hiện tại], tệ ở [điểm đau].`
2. **Persona & JTBD**: tối đa 2 persona. Mỗi persona: mục tiêu, điểm đau, mức am hiểu công nghệ. Viết Job-to-be-done: *"Khi … tôi muốn … để …"*.
3. **Giá trị cốt lõi (value proposition)**: 1 lý do chính khiến người dùng chọn sản phẩm.
4. **Liệt kê tính năng → chấm điểm** bằng RICE hoặc MoSCoW. MVP = chỉ **Must**, tối đa 5.
5. **User story + acceptance criteria** (Gherkin):
   ```
   US-03: Là khách hàng, tôi muốn đặt hàng để nhận sản phẩm.
   Given giỏ hàng có ≥ 1 sản phẩm còn tồn kho
   When tôi xác nhận thanh toán
   Then đơn hàng được tạo ở trạng thái Pending và tôi nhận email xác nhận
   ```
6. **Success metric** (đo được, có ngưỡng): activation, retention D7, conversion, thời gian hoàn thành tác vụ.
7. **Giả định rủi ro nhất** (riskiest assumption) + cách kiểm chứng rẻ nhất (landing page, concierge MVP, Wizard-of-Oz).
8. **Ngoài phạm vi (Out of scope)**: ghi rõ để chống scope creep.

## Template brief
```markdown
# Product Brief: <tên>
## Problem | Persona | Value proposition
## MVP scope (Must) / Should / Could / Won't (lần này)
## Success metrics (North Star + 2–3 input metrics)
## Rủi ro & giả định
## Ràng buộc (ngân sách, thời gian, compliance, đội)
## Glossary (Ubiquitous Language ban đầu — dùng lại ở DDD)
```

## Liên kết DDD
Glossary ở đây chính là mầm của **Ubiquitous Language**; danh từ/động từ lặp lại trong story → ứng viên Entity/Aggregate/Domain Event. Chuyển giao cho `architecture-ddd` (Event Storming).

## Gate
- [ ] Problem statement 1 câu, được stakeholder đồng ý
- [ ] ≤ 5 tính năng Must, mỗi cái có acceptance criteria
- [ ] Có metric thành công + ngưỡng + cách thu thập
- [ ] Có danh sách Out of scope

## Anti-patterns
Tính năng "nice to have" lẻn vào Must; metric mơ hồ ("tăng trải nghiệm"); thiết kế giải pháp trước khi hiểu vấn đề.
