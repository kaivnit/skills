---
name: saas-foundations
description: Nền tảng cho sản phẩm SaaS - multi-tenancy (isolation, tenant resolution, EF Core query filter, Row-Level Security), tổ chức/thành viên/vai trò, gói và subscription, billing với Stripe, quota/usage metering, email giao dịch, onboarding, audit. Dùng khi xây SaaS đa khách hàng, thiết kế tenant, tính tiền theo gói, hoặc cần các khối nền tảng lặp lại ở mọi SaaS.
---

# SaaS Foundations

## Đầu ra
`docs/15-saas-foundations.md` (mô hình tenant, gói, billing) + module `Tenancy`, `Billing`, `Notifications`.

## 1. Chọn mô hình multi-tenancy
| Mô hình | Cô lập | Chi phí vận hành | Phù hợp |
|---|---|---|---|
| **Shared DB + `tenant_id`** (+ RLS) | Logic | Thấp nhất | MVP, nhiều tenant nhỏ (**mặc định**) |
| Schema-per-tenant | Trung bình | Trung bình | Vài trăm tenant, cần tuỳ biến |
| DB-per-tenant | Cao | Cao | Enterprise, yêu cầu tuân thủ/dữ liệu riêng |
Thiết kế để **nâng cấp được** (mọi bảng có `tenant_id`, code truy cập qua một điểm).

## 2. Tenant resolution & cô lập (bắt buộc làm đúng)
```csharp
public interface ITenantContext { Guid TenantId { get; } }
// Middleware: lấy từ claim `tid` (ưu tiên), subdomain, hoặc header đã xác thực — KHÔNG tin input người dùng.

modelBuilder.Entity<Order>().HasQueryFilter(o => o.TenantId == _tenant.TenantId);   // EF global filter
// Ghi: SaveChanges interceptor tự gán TenantId; chặn ghi nếu khác tenant hiện tại.
```
Phòng thủ nhiều lớp: EF filter + **Postgres Row-Level Security** (`SET app.tenant_id`) + test tự động "tenant A không đọc/ghi được dữ liệu tenant B" cho **mọi** endpoint. Cache key, file path, queue message đều chứa tenant.

## 3. Tổ chức & thành viên
`Organization` (tenant) — `Membership(user, org, role)` — `Invitation`. Một user có thể thuộc nhiều org; chuyển org đổi tenant context. Vai trò theo org (`Owner/Admin/Member/Viewer`), quyền chi tiết bằng policy (`security-auth`). Owner cuối cùng không tự xoá được.

## 4. Gói, subscription & billing
- **Không tự xử lý thẻ**: dùng Stripe (Checkout + Customer Portal) hoặc Paddle/Lemon Squeezy (merchant of record, lo thuế).
- Bảng `Plan` (giới hạn/quota/feature flag) tách khỏi `Subscription` (org, plan, trạng thái, kỳ hiện tại).
- **Webhook là nguồn sự thật** (`invoice.paid`, `customer.subscription.updated/deleted`): ký xác thực, idempotent, dedupe theo event id (`messaging-integration`).
- Trạng thái: `trialing → active → past_due → canceled`; chính sách grace period và khoá mềm khi quá hạn.
- Nâng/hạ gói: proration do Stripe tính; áp dụng entitlement ngay khi webhook xác nhận.
- Dùng thử: không cần thẻ → email nhắc trước khi hết hạn.

## 5. Entitlement & quota
Một điểm kiểm tra duy nhất: `IEntitlements.CanAsync(tenant, Feature.X)` và `UsageMeter.IncrementAsync(tenant, Metric.ApiCalls)`. Giới hạn mềm (cảnh báo) vs cứng (chặn, trả `402/429` kèm hướng dẫn nâng cấp). Chạy usage metering bất đồng bộ, tổng hợp theo kỳ.

## 6. Email & thông báo giao dịch
Provider (Postmark/SendGrid/SES), template có version, xếp hàng qua queue, retry, theo dõi bounce/complaint, SPF/DKIM/DMARC. Email cần có: xác minh, đặt lại mật khẩu, mời thành viên, hoá đơn, sắp hết hạn dùng thử, thanh toán lỗi. Có trang tuỳ chọn nhận thông báo.

## 7. Onboarding & vòng đời
Đăng ký → tạo org → (mời đồng đội) → hành động kích hoạt đầu tiên ("aha") → thu thập metric activation. Offboarding: xuất dữ liệu, huỷ gói, **xoá dữ liệu theo chính sách lưu giữ** (`compliance-privacy`).

## 8. Vận hành đa tenant
Rate limit theo tenant (tránh noisy neighbor), log/metric gắn `tenant_id`, super-admin có **impersonation có audit**, backup/restore theo tenant (nếu cần), feature flag theo tenant.

## Gate
- [ ] Test cô lập tenant chạy trong CI cho mọi endpoint ghi/đọc dữ liệu
- [ ] Billing chạy end-to-end ở chế độ test (đăng ký, nâng gói, thanh toán lỗi, huỷ)
- [ ] Webhook idempotent, có bảng đối soát với Stripe
- [ ] Quota/entitlement kiểm tại một điểm duy nhất

## Anti-patterns
Quên `tenant_id` ở một query/cache key/file path; tin tenant từ tham số client; tự lưu thẻ; cập nhật trạng thái gói bằng redirect thay vì webhook; hard-code tên gói trong code nghiệp vụ; impersonation không audit.
