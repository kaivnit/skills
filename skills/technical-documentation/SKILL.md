---
name: technical-documentation
description: Viết và duy trì tài liệu kỹ thuật cho dự án - README, ADR, sơ đồ as-code (Mermaid, C4/Structurizr), tài liệu API (OpenAPI), runbook, onboarding, changelog, Architecture Decision Records, docs-as-code với kiểm tra trong CI. Dùng khi cần viết hoặc tổ chức tài liệu, bàn giao dự án, onboard thành viên mới, hoặc tài liệu đang lỗi thời.
---

# Technical Documentation (docs-as-code)

## Đầu ra
Thư mục `docs/` có mục lục, `README.md` chạy được trong 10 phút, ADR, runbook; được review và kiểm tra trong CI như code.

## Khung tài liệu (Diátaxis)
| Loại | Trả lời | Ví dụ |
|---|---|---|
| **Tutorial** | "Hãy học qua làm" | Chạy hệ thống local lần đầu |
| **How-to** | "Làm X thế nào?" | Thêm module mới, xoay secret |
| **Reference** | "Chính xác là gì?" | OpenAPI, cấu hình, event catalog |
| **Explanation** | "Vì sao?" | Kiến trúc, ADR, đánh đổi |
Không trộn bốn loại trong một trang.

## Bộ tài liệu tối thiểu cho MVP
```
README.md                  # Là gì · Chạy local (3 lệnh) · Cấu trúc repo · Liên kết
CONTRIBUTING.md            # Quy trình nhánh/commit/PR (git-workflow-release)
docs/
  00-product-brief.md …    # Artifact từ các skill phase
  adr/NNNN-<quyết-định>.md
  architecture/            # C4 + giải thích module
  api/openapi.yaml
  runbooks/                # deploy, rollback, restore, sự cố thường gặp
  onboarding.md            # Tuần đầu của thành viên mới
CHANGELOG.md               # Tự sinh (release-please)
```

## README tốt
1. 1–2 câu: sản phẩm làm gì. 2. Điều kiện cần (SDK, Docker). 3. `make up` → mở URL nào. 4. Chạy test. 5. Cấu trúc thư mục. 6. Liên kết tới docs sâu hơn. Câu lệnh phải **copy-paste chạy được**; kiểm tra trên máy sạch.

## ADR (Architecture Decision Record)
```markdown
# ADR-0007: Dùng PostgreSQL thay vì SQL Server
- Trạng thái: Accepted · Ngày: 2026-02-01 · Người quyết định: …
## Bối cảnh      (ràng buộc, lực tác động)
## Quyết định    (một câu rõ ràng)
## Hệ quả        (tốt, xấu, rủi ro)
## Phương án đã cân nhắc  (kèm lý do loại)
```
ADR **bất biến**: quyết định mới thì viết ADR mới và đánh dấu cái cũ là `Superseded by ADR-00xx`.

## Sơ đồ as-code
- **Mermaid** ngay trong Markdown (GitHub render): flowchart, sequence, ER, state.
- **C4** (Context → Container → Component) bằng Structurizr DSL hoặc Mermaid C4; một sơ đồ = một thông điệp, có chú giải.
- Sơ đồ nằm trong repo, review cùng code → không lỗi thời.

## Tài liệu API
OpenAPI là nguồn sự thật (`api-design`); render bằng Scalar/Redoc/Swagger UI; mỗi operation có mô tả, ví dụ request/response, mã lỗi. XML comments `///` + `GenerateDocumentationFile` cho thư viện nội bộ.

## Runbook
Mỗi alert (`observability`) có runbook: **triệu chứng → kiểm tra nhanh → nguyên nhân thường gặp → cách xử lý → khi nào leo thang → liên hệ**. Viết cho người đang bị đánh thức lúc 3 giờ sáng.

## Duy trì
- Tài liệu thay đổi cùng PR với code (mục trong PR template).
- CI: kiểm link (`lychee`), lint Markdown (`markdownlint`), build Mermaid, kiểm OpenAPI (Spectral).
- Mỗi trang có chủ sở hữu và ngày xem xét; xoá tài liệu chết thay vì để sai.
- Văn phong: câu ngắn, chủ động, thuật ngữ nhất quán với **Ubiquitous Language**, ví dụ cụ thể hơn mô tả trừu tượng.

## Gate
- [ ] Người mới chạy được hệ thống chỉ bằng README
- [ ] Mọi quyết định kiến trúc lớn có ADR
- [ ] Mỗi alert production có runbook
- [ ] CI kiểm link/lint tài liệu và xanh

## Anti-patterns
Wiki ngoài repo không ai cập nhật; tài liệu viết một lần sau khi xong; sơ đồ ảnh chụp không có nguồn; ADR sửa lại lịch sử; README toàn khẩu hiệu mà không có lệnh chạy.
