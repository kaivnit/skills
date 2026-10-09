---
name: security-auth
description: Bảo mật cho hệ thống MVP - threat modeling (STRIDE), authentication/authorization (OIDC, JWT, RBAC/policy), OWASP Top 10, quản lý secret, mã hoá dữ liệu, bảo vệ API, audit log, GDPR cơ bản. Dùng khi thiết kế đăng nhập/phân quyền, review bảo mật, hoặc chuẩn bị launch.
---

# Security & Auth

## Đầu ra
`docs/06-security.md` (threat model + quyết định authN/Z + checklist)

## Quy trình
1. **Threat model nhanh (STRIDE)** trên sơ đồ C4: xác định tài sản (PII, tiền, token), ranh giới tin cậy, mối đe doạ & biện pháp giảm thiểu.
2. **Authentication — đừng tự viết**:
   | Lựa chọn | Khi nào |
   |---|---|
   | Managed IdP (Auth0, Entra ID, Cognito, Clerk) | MVP nhanh, ít rủi ro (**khuyến nghị**) |
   | Keycloak / ASP.NET Core Identity + OpenIddict | cần tự host/kiểm soát |
   Dùng OIDC Authorization Code + PKCE; access token ngắn (5–15 phút) + refresh token xoay vòng; MFA cho admin.
3. **Authorization**: RBAC cho MVP, chuyển sang policy/claims/ABAC khi phức tạp.
   ```csharp
   builder.Services.AddAuthorizationBuilder()
       .AddPolicy("CanCancelOrder", p => p.RequireRole("Admin").Or().RequireAssertion(ctx => /* owner check */ true));
   // Kiểm tra quyền SỞ HỮU ở handler: order.CustomerId == currentUser.Id (chống IDOR)
   ```
4. **OWASP Top 10 checklist**: Broken Access Control (IDOR), Cryptographic failures, Injection (tham số hoá query, EF/Dapper parameters), Insecure design, Misconfiguration, Vulnerable components (Dependabot, `dotnet list package --vulnerable`), Auth failures, Integrity (ký artifact), Logging failures, SSRF.
5. **Bảo vệ API**: HTTPS + HSTS, CORS whitelist, rate limiting, giới hạn body, validate input (FluentValidation), security headers (CSP, X-Content-Type-Options), CSRF nếu dùng cookie.
6. **Secret**: không commit; dùng env/Key Vault/Secrets Manager; quét secret trong CI (gitleaks); xoay vòng định kỳ.
7. **Dữ liệu**: mã hoá at-rest (DB/disk) & in-transit (TLS); cột nhạy cảm mã hoá ứng dụng (Data Protection API); băm mật khẩu Argon2id/bcrypt nếu tự lưu; **không log PII/token**.
8. **Audit log** bất biến cho hành động nhạy cảm (ai, làm gì, khi nào, từ đâu).
9. **Chuỗi cung ứng**: khoá phiên bản, SBOM, image base tối giản, chạy container non-root.
10. **Quyền riêng tư**: tối thiểu hoá dữ liệu, chính sách lưu giữ, hỗ trợ xoá/xuất dữ liệu người dùng.

## Gate
- [ ] Threat model + mitigations cho 5 rủi ro hàng đầu
- [ ] Không có endpoint thiếu `[Authorize]` ngoài whitelist công khai (test tự động)
- [ ] SAST/dependency/secret scan chạy trong CI, không có lỗ hổng High/Critical
- [ ] Kiểm thử IDOR/quyền cho các resource chính

## Anti-patterns
Tự viết crypto/đăng nhập; JWT dài hạn trong localStorage; chỉ kiểm quyền ở UI; `AllowAnyOrigin` + credentials; log chứa token/PII; dùng secret mặc định ở production.
