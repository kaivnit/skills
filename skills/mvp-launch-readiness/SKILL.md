---
name: mvp-launch-readiness
description: Kiểm tra sẵn sàng phát hành MVP (Go/No-Go) - checklist chức năng, hiệu năng, bảo mật, vận hành, pháp lý, kế hoạch rollout, rollback, hỗ trợ và đo lường sau launch. Dùng khi sắp release MVP, cần review trước go-live, hoặc lập kế hoạch ra mắt/beta.
---

# MVP Launch Readiness

## Đầu ra
`docs/11-launch-checklist.md` — mỗi mục `✅ / ⚠️ chấp nhận rủi ro / ❌` + chữ ký Go/No-Go.

## Checklist theo miền
**Sản phẩm**
- [ ] Mọi Must-story đạt acceptance criteria (demo end-to-end trên staging)
- [ ] Onboarding đến "khoảnh khắc aha" < 5 phút; trang trống/lỗi có hướng dẫn
- [ ] Kênh phản hồi trong app (form/email/chat)

**Chất lượng** (`testing-qa`)
- [ ] CI xanh; E2E flow chính xanh; không bug Critical/High mở
- [ ] Load test đạt NFR; thử với dữ liệu gần thật

**Bảo mật** (`security-auth`)
- [ ] Scan dependency/secret/SAST sạch; kiểm quyền IDOR; HTTPS/HSTS; CORS đúng
- [ ] Điều khoản sử dụng + chính sách quyền riêng tư + cookie consent (nếu cần)

**Vận hành** (`devops-cicd`, `observability`)
- [ ] Deploy tự động + rollback thử thành công
- [ ] Backup tự động + đã **thử restore**
- [ ] Dashboard + alert + runbook; người on-call/kênh sự cố xác định
- [ ] Domain, DNS, TLS, email gửi (SPF/DKIM/DMARC) hoạt động
- [ ] Giới hạn chi phí / budget alert; rate limit chống lạm dụng

**Dữ liệu** (`data-engineering`)
- [ ] Event tracking hoạt động; dashboard success metric có số liệu

**Hỗ trợ & truyền thông**
- [ ] Trang status/FAQ; quy trình xử lý ticket; kế hoạch thông báo

## Kế hoạch rollout
1. **Dogfood nội bộ** → 2. **Closed beta** (10–50 người, feature flag/allowlist) → 3. **Open beta** → 4. **GA**.
Mỗi bước có tiêu chí qua cổng (lỗi, retention, phản hồi) và **điều kiện rollback**.

## Ngày launch
- Freeze thay đổi 24h trước; deploy giờ ít tải, có người sẵn sàng.
- Theo dõi dashboard realtime 48h đầu; kênh sự cố mở sẵn.
- Ghi log quyết định; mỗi sự cố → post-mortem không đổ lỗi.

## Sau launch (2 tuần đầu)
Đo success metric theo brief → so với ngưỡng; phân loại phản hồi; quyết định **iterate / pivot / persevere**; cập nhật backlog; trả nợ kỹ thuật đã ghi nhận (đối chiếu ADR/risks).

## Gate cuối
Go chỉ khi: không còn ❌ ở Chất lượng/Bảo mật/Vận hành; mọi ⚠️ có chủ sở hữu + ngày xử lý.
