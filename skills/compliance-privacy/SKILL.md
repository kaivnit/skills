---
name: compliance-privacy
description: Tuân thủ và quyền riêng tư - GDPR/CCPA/Nghị định 13/2023 Việt Nam, phân loại dữ liệu cá nhân, cơ sở pháp lý và consent, quyền của chủ thể dữ liệu (truy cập, xoá, xuất), lưu giữ và xoá dữ liệu, DPIA, xử lý vi phạm dữ liệu, PCI DSS khi có thanh toán, SOC 2/ISO 27001 cơ bản. Dùng khi sản phẩm thu thập dữ liệu cá nhân, bán cho khách hàng doanh nghiệp, hoặc chuẩn bị launch ở thị trường có luật bảo vệ dữ liệu.
---

# Compliance & Privacy

> Đây là hướng dẫn kỹ thuật, **không phải tư vấn pháp lý**. Xác nhận với luật sư/DPO trước khi launch tại thị trường có quy định.

## Đầu ra
`docs/20-privacy-compliance.md`: sổ đăng ký dữ liệu (data inventory), cơ sở xử lý, chính sách lưu giữ, quy trình quyền chủ thể, kế hoạch phản ứng vi phạm.

## 1. Xác định phạm vi áp dụng
| Khung | Khi nào áp dụng |
|---|---|
| **GDPR** (EU/EEA, UK GDPR) | Có người dùng ở EU/UK, dù công ty ở đâu |
| **CCPA/CPRA** (California) | Ngưỡng doanh thu/số bản ghi người dùng California |
| **Nghị định 13/2023/NĐ-CP** (Việt Nam) | Xử lý dữ liệu cá nhân của người Việt; dữ liệu nhạy cảm cần đồng ý rõ ràng, cần hồ sơ đánh giá tác động |
| **PCI DSS** | Lưu/xử lý/truyền dữ liệu thẻ → giảm phạm vi bằng Stripe/Paddle (không chạm số thẻ) |
| **HIPAA** | Dữ liệu y tế ở Mỹ |
| **SOC 2 / ISO 27001** | Khách hàng doanh nghiệp yêu cầu; bắt đầu từ kiểm soát nền tảng |

## 2. Data inventory (bước quan trọng nhất)
Bảng: `dữ liệu | loại (thường/nhạy cảm) | mục đích | cơ sở pháp lý | nơi lưu | ai truy cập | bên xử lý thứ ba | thời hạn lưu`. Không biết mình có dữ liệu gì thì không tuân thủ được. Gắn nhãn cột PII trong schema (`database-design`).

## 3. Nguyên tắc thiết kế (Privacy by Design)
**Tối thiểu hoá** (chỉ thu cái cần) · **Giới hạn mục đích** · **Giới hạn lưu giữ** · **Chính xác** · **Toàn vẹn & bảo mật** · **Minh bạch** · **Trách nhiệm giải trình**. Mặc định riêng tư (privacy by default).

## 4. Cơ sở pháp lý & consent
Cơ sở: hợp đồng, nghĩa vụ pháp lý, lợi ích chính đáng, **đồng ý**. Khi dùng consent: chủ động (không tick sẵn), cụ thể theo mục đích, **rút lại dễ như đồng ý**, lưu bằng chứng (ai, khi nào, phiên bản chính sách). Cookie banner với phân loại (cần thiết/phân tích/quảng cáo), không nạp tracker trước khi đồng ý. Cập nhật Chính sách quyền riêng tư & Điều khoản bằng ngôn ngữ dễ hiểu.

## 5. Quyền của chủ thể dữ liệu — xây vào sản phẩm
| Quyền | Triển khai kỹ thuật |
|---|---|
| Truy cập / **xuất** (portability) | Endpoint xuất JSON/CSV toàn bộ dữ liệu người dùng |
| Chỉnh sửa | Màn hình hồ sơ, audit thay đổi |
| **Xoá** ("quên") | Quy trình xoá cứng/ẩn danh hoá xuyên DB, cache, search index, backup (xoá khi hết vòng), log, kho phân tích, bên xử lý thứ ba |
| Hạn chế / phản đối | Cờ trạng thái chặn xử lý marketing/profiling |
Phản hồi trong ≤ 30 ngày (GDPR); xác minh danh tính người yêu cầu; theo dõi yêu cầu có hạn.
```csharp
// Xoá/ẩn danh qua Domain Event để mọi module tự dọn phần của mình
public sealed record UserErasureRequested(Guid UserId, DateTime At) : IIntegrationEvent;
// Mỗi module: consumer idempotent → xoá hoặc ẩn danh dữ liệu cá nhân, giữ dữ liệu pháp lý bắt buộc (hoá đơn)
```

## 6. Biện pháp kỹ thuật & tổ chức
- Mã hoá at-rest/in-transit, mã hoá cấp cột cho dữ liệu nhạy cảm, quản lý khoá (`security-auth`); phân quyền tối thiểu; audit truy cập dữ liệu nhạy cảm.
- **Không log PII**; môi trường dev/staging dùng dữ liệu giả hoặc đã ẩn danh; che dữ liệu khi hỗ trợ khách hàng.
- Pseudonymization cho phân tích (`data-engineering`); tách bảng định danh khỏi bảng hành vi.
- **Chính sách lưu giữ**: job xoá/ẩn danh theo hạn; log 30 ngày, dữ liệu đã đóng tài khoản theo quy định.
- Chuyển dữ liệu xuyên biên giới: chọn vùng lưu trữ (data residency), SCC/cơ chế hợp lệ; ghi nhận trong inventory.

## 7. Bên xử lý thứ ba
Danh sách sub-processor (Stripe, email, analytics, LLM…), **DPA** đã ký, đánh giá bảo mật nhà cung cấp, thông báo khi thay đổi (đặc biệt cho khách doanh nghiệp).

## 8. DPIA / đánh giá tác động
Bắt buộc/nên làm khi xử lý quy mô lớn, dữ liệu nhạy cảm, theo dõi/profiling, hoặc dùng AI ra quyết định (`ai-llm-integration`). Nội dung: mô tả xử lý, cần thiết & tương xứng, rủi ro, biện pháp giảm thiểu.

## 9. Vi phạm dữ liệu
Quy trình kết nối với `incident-response`: phát hiện → đánh giá phạm vi → **báo cơ quan quản lý trong 72 giờ (GDPR)** nếu có rủi ro → thông báo người bị ảnh hưởng khi rủi ro cao → ghi nhận vào sổ vi phạm. Chuẩn bị sẵn mẫu thông báo và đầu mối.

## 10. Kiểm soát cho SOC 2 / ISO 27001 (nền tảng)
Quản lý truy cập & MFA, quản lý thay đổi (PR bắt buộc review — `git-workflow-release`), sao lưu & khôi phục, giám sát & log, quản lý lỗ hổng (scan trong CI), đào tạo nhân sự, đánh giá nhà cung cấp, chính sách văn bản. Dùng công cụ tự động thu thập bằng chứng (Vanta/Drata) khi khách hàng yêu cầu.

## Gate
- [ ] Data inventory đầy đủ và được cập nhật khi thêm tính năng
- [ ] Chính sách quyền riêng tư, điều khoản, cookie consent hoạt động đúng
- [ ] Xuất và xoá dữ liệu người dùng chạy được end-to-end (đã thử)
- [ ] Có chính sách lưu giữ tự động, DPA với bên xử lý, quy trình xử lý vi phạm 72 giờ

## Anti-patterns
Thu thập "phòng khi cần"; xoá ở DB chính nhưng còn trong search/log/analytics; consent gộp chung một ô; dùng dữ liệu thật ở staging; để PII trong log và URL; cho rằng dùng Stripe thì hết trách nhiệm; tuân thủ như dự án một lần thay vì quy trình liên tục.
