---
name: frontend-web
description: Xây dựng frontend web cho MVP - React/Next.js + TypeScript (hoặc Blazor), quản lý state/server state, form, routing, auth phía client, tích hợp OpenAPI client, hiệu năng, a11y, test. Dùng khi cần dựng giao diện, cấu trúc project frontend, gọi API, xử lý loading/error, tối ưu Core Web Vitals.
---

# Frontend Web

## Đầu ra
Code `web/` kết nối API thật; đạt gate a11y + hiệu năng cơ bản.

## Chọn stack (mặc định)
| Nhu cầu | Chọn |
|---|---|
| App có SEO/landing + dashboard | **Next.js (App Router) + TypeScript** |
| Dashboard nội bộ thuần SPA | Vite + React + TypeScript |
| Đội thuần C#, giao diện nội bộ | Blazor (Server/WASM) + MudBlazor |
Styling: Tailwind + shadcn/ui (xem `ui-design-system`). Server state: **TanStack Query**. Form: **React Hook Form + Zod**. Client state: Zustand (chỉ khi cần).

## Cấu trúc theo feature (khớp bounded context)
```
web/src/
  app/                 # routes
  features/orders/     # components, hooks, api, schemas, tests của 1 feature
  shared/ui/           # component dùng chung (từ design system)
  shared/api/          # client sinh từ OpenAPI, fetch wrapper
  shared/lib/          # utils, auth, i18n
```

## Quy trình
1. Sinh API client + type từ `openapi.yaml` (orval / openapi-typescript) — **không** viết type tay.
2. Dựng khung: layout, routing, auth guard, error boundary, toast, theme.
3. Mỗi màn hình triển khai đủ **loading / empty / error / success** (từ `ux-research-flows`).
4. Server state qua query hooks; mutation có optimistic update + invalidate:
   ```tsx
   export function usePlaceOrder() {
     const qc = useQueryClient();
     return useMutation({
       mutationFn: (body: PlaceOrderRequest) =>
         api.placeOrder(body, { headers: { "Idempotency-Key": crypto.randomUUID() } }),
       onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
     });
   }
   ```
5. Form: schema Zod dùng chung, hiển thị lỗi `ProblemDetails.errors` theo field; disable nút khi submitting.
6. **Auth**: token trong cookie `HttpOnly; Secure; SameSite` (ưu tiên BFF); không lưu JWT ở localStorage.
7. **Hiệu năng**: code splitting theo route, ảnh `next/image`/WebP, font tối ưu, SSR/ISR cho trang công khai; mục tiêu LCP < 2.5s, INP < 200ms, CLS < 0.1.
8. **A11y**: semantic HTML, label, focus management trong modal, `aria-live` cho toast, kiểm bằng axe.
9. **i18n** từ đầu nếu có kế hoạch đa ngôn ngữ (không hard-code chuỗi).
10. **Realtime**: SignalR client / SSE cho thông báo; reconnect có backoff.
11. **Observability FE**: Sentry/OpenTelemetry web; gắn `traceparent` vào request.

## Test
Unit (Vitest + Testing Library) cho logic/component; **E2E Playwright** cho flow chính (đăng nhập → tạo đơn → xác nhận); visual regression tuỳ chọn; mock API bằng MSW.

## Gate
- [ ] Flow chính chạy E2E với API thật trên môi trường dev
- [ ] Mọi màn hình có đủ 4 trạng thái
- [ ] Lighthouse: Performance ≥ 90, A11y ≥ 95 trên trang chính
- [ ] Không secret trong bundle; CSP cơ bản

## Anti-patterns
Fetch trong `useEffect` thủ công thay vì Query; state server nhân bản vào global store; `any` tràn lan; component 500 dòng; validate chỉ ở client; lưu token ở localStorage.
