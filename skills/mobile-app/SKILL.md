---
name: mobile-app
description: Phát triển ứng dụng di động cho MVP - chọn hướng (PWA, React Native/Expo, Flutter, .NET MAUI, native), kiến trúc app, offline-first và đồng bộ, auth an toàn trên thiết bị, push notification, deep link, API cho mobile, CI/CD và phát hành lên App Store/Google Play. Dùng khi sản phẩm cần app iOS/Android hoặc trải nghiệm di động.
---

# Mobile App

## Đầu ra
`docs/19-mobile.md` (lựa chọn công nghệ, kiến trúc, kế hoạch phát hành) + `mobile/`.

## 1. Có cần app native không?
| Nhu cầu | Chọn |
|---|---|
| Nội dung/công việc đơn giản, muốn nhanh và rẻ | **Web responsive / PWA** (cài được, push trên Android & iOS 16.4+) |
| App đầy đủ, đội mạnh web/TypeScript | **React Native + Expo** (OTA update, EAS Build) |
| Giao diện tuỳ biến cao, một codebase | Flutter |
| Đội .NET, ứng dụng nghiệp vụ nội bộ | **.NET MAUI** (hoặc Blazor Hybrid) |
| Cần hiệu năng/API hệ điều hành sâu (AR, camera nâng cao) | Native (Swift/Kotlin) |
Quy tắc MVP: **PWA hoặc cross-platform một codebase**; chỉ native khi có lý do đo được.

## 2. Kiến trúc app
- Phân lớp như backend: `UI → ViewModel/Hook → UseCase → Repository → DataSource (API/Local)`; domain logic không phụ thuộc framework UI (MVVM/MVI).
- Quản lý state có định hướng; điều hướng tập trung; DI; tách theo feature.
- Client API sinh từ OpenAPI (`api-design`); hợp đồng **tương thích ngược** vì người dùng không cập nhật ngay → versioning API + cơ chế **force update** (kiểm phiên bản tối thiểu).

## 3. Offline-first & đồng bộ
Lưu cục bộ (SQLite/Realm/MMKV) làm nguồn hiển thị; hàng đợi thao tác ghi gửi lại khi có mạng (outbox phía client); **idempotency key** cho mọi ghi; giải quyết xung đột (last-write-wins có phiên bản / hợp nhất theo trường); phân trang & đồng bộ delta (`updated_since`); trạng thái mạng rõ trên UI.

## 4. Bảo mật trên thiết bị
- Auth: OIDC Authorization Code + **PKCE** qua trình duyệt hệ thống (không webview nhúng); token trong **Keychain / Keystore** (SecureStore), không lưu AsyncStorage thường.
- Certificate pinning khi dữ liệu nhạy cảm; phát hiện root/jailbreak tuỳ mức rủi ro; che dữ liệu trong ảnh chụp app switcher.
- Không nhúng secret/API key trong app (có thể bị trích xuất) — gọi qua backend; obfuscation chỉ là lớp phụ.
- Quyền thiết bị: xin đúng lúc, giải thích lý do, hoạt động được khi bị từ chối.

## 5. Push notification & deep link
FCM (Android) / APNs (iOS), qua dịch vụ trung gian (Expo Push, OneSignal, Azure Notification Hubs); lưu device token theo người dùng, dọn token hết hạn; payload chỉ chứa ID, tải dữ liệu sau; xin phép đúng thời điểm; universal links / app links để mở đúng màn hình.

## 6. Hiệu năng & chất lượng
Khởi động nhanh (< 2s), danh sách ảo hoá, ảnh cache & đúng kích thước, tiết kiệm pin/dữ liệu, hỗ trợ cỡ chữ lớn & screen reader, dark mode, thiết bị cấu hình thấp. Theo dõi crash & hiệu năng (Sentry/Crashlytics), analytics sự kiện (`data-engineering`).

## 7. Test & phát hành
- Unit + component test, E2E (Maestro/Detox/Appium) cho flow chính trên thiết bị thật/simulator.
- CI/CD: build ký số tự động (Fastlane/EAS), kênh **TestFlight / Internal testing** → beta → production; phát hành theo giai đoạn (staged rollout 5% → 100%).
- Chuẩn bị store: tài khoản developer (Apple 99$/năm, Google 25$ một lần), icon/ảnh chụp/mô tả, **chính sách quyền riêng tư & khai báo dữ liệu**, tuân thủ hướng dẫn review; dành thời gian duyệt (Apple vài ngày) và kế hoạch xử lý bị từ chối.
- Phiên bản: `versionName` theo SemVer + `buildNumber` tăng đơn điệu; changelog từ `git-workflow-release`.

## Gate
- [ ] Flow chính chạy E2E trên ≥ 2 thiết bị thật mỗi nền tảng
- [ ] Token lưu trong kho an toàn; không có secret trong binary
- [ ] Có force-update, crash reporting và staged rollout
- [ ] Hồ sơ store (quyền riêng tư, ảnh, mô tả) hoàn chỉnh

## Anti-patterns
Làm native hai bản ngay từ MVP; giả định luôn có mạng; token trong bộ nhớ thường; đổi API phá vỡ khi bản app cũ vẫn lưu hành; xin mọi quyền ngay lúc mở app lần đầu; bỏ qua thời gian duyệt store khỏi kế hoạch launch.
