---
name: language-profile-template
description: Mẫu và checklist để tạo profile cho một ngôn ngữ/stack mới (Java, Kotlin, PHP, Ruby, Swift, Elixir, C++...) cùng cấu trúc với các skill lang-*, giữ nhất quán với bộ skill nguyên tắc. Dùng khi người dùng làm việc với ngôn ngữ chưa có profile hoặc muốn thêm/cập nhật một profile ngôn ngữ.
---

# Language Profile Template

Một profile giúp áp dụng nguyên tắc chung (Clean/DDD, API, DB, test, DevOps, observability) vào **idiom thật** của một ngôn ngữ. Nó không lặp lại nguyên tắc — chỉ trả lời "ở ngôn ngữ này thì làm bằng gì và làm thế nào cho đúng kiểu".

## Cách tạo
1. Tạo `skills/lang-<tên>/SKILL.md`, `name` khớp thư mục (`lang-java`).
2. `description` nêu: ngôn ngữ, loại việc (API, CLI, data…), và các từ khoá kích hoạt (framework chính, tên công cụ).
3. Điền **đủ 13 mục** dưới đây; ví dụ code ngắn, chạy được, đúng idiom (không dịch máy móc từ C#).
4. Thêm cột ngôn ngữ vào bảng tương đương của `stack-selector`.
5. Thêm scope vào `commitlint.config.mjs` và dòng vào `README.md`.
6. Kiểm: cài toolchain, tạo dự án mẫu theo profile, chạy được `build → lint → test`.

## Khung 13 mục bắt buộc
```markdown
---
name: lang-<tên>
description: <Ngôn ngữ> cho <loại việc> — <framework/công cụ chính>. Dùng khi ...
---
# <Ngôn ngữ> Profile
## 1. Khi nên / không nên chọn
## 2. Toolchain (quản lý phiên bản, build, format, lint, type check)
## 3. Layout dự án → ánh xạ Clean/Onion/DDD (module, tầng, quy tắc phụ thuộc)
## 4. Bảng thư viện theo concern (web, validation, data, migration, messaging, logging, test)
## 5. Idiom DDD: Value Object + Aggregate + Use case handler (code ngắn)
## 6. Xử lý lỗi (mô hình lỗi bản địa, ánh xạ sang ProblemDetails)
## 7. Đồng thời & bất đồng bộ (mô hình, cạm bẫy)
## 8. Testing (unit, integration với container, property, kiểm kiến trúc)
## 9. Observability (log có cấu trúc, OpenTelemetry, health)
## 10. Đóng gói & Docker (image nhỏ, non-root, đa tầng)
## 11. CI (lệnh chuẩn: build, lint, test, scan phụ thuộc)
## 12. Hiệu năng & công cụ profiling
## 13. Gate + Anti-patterns riêng của ngôn ngữ
```

## Tiêu chí chất lượng
- **Idiom bản địa**: tuân thủ quy ước cộng đồng (error handling, đặt tên, cấu trúc package).
- **Nguyên tắc không đổi, công cụ thì đổi**: DDD, ranh giới module, contract-first, idempotency, outbox… giữ nguyên.
- **Tối thiểu hoá phép màu**: ưu tiên thư viện chuẩn/ổn định, ghi phiên bản tối thiểu và lý do chọn.
- **Có thể kiểm chứng**: mỗi lệnh trong profile phải chạy được; ví dụ biên dịch được.
- **Tránh lỗi thời**: ghi ngày rà soát; thư viện nên kiểm lại phiên bản và tình trạng duy trì trước khi chốt.

## Gate
- [ ] Đủ 13 mục, ví dụ biên dịch/chạy được
- [ ] Đã thêm vào `stack-selector`, `README.md`, `commitlint.config.mjs`
- [ ] Có anti-patterns riêng (không chỉ lặp lại của skill khác)
