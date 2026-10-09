---
name: api-design
description: Thiết kế API contract-first cho MVP - RESTful (OpenAPI) hoặc GraphQL, quy ước resource, versioning, phân trang, lỗi chuẩn (ProblemDetails), idempotency, rate limit, gRPC cho nội bộ. Dùng khi cần thiết kế endpoint, viết OpenAPI, thống nhất contract giữa frontend và backend.
---

# API Design (Contract-first)

## Đầu ra
`docs/api/openapi.yaml` (hoặc `schema.graphql`) được FE và BE cùng duyệt trước khi code.

## Chọn giao thức
| Nhu cầu | Chọn |
|---|---|
| CRUD + client công khai, cache HTTP | **REST** (mặc định) |
| Client đa dạng, truy vấn lồng/ghép dữ liệu linh hoạt (mobile + web) | **GraphQL** (HotChocolate) |
| Service-to-service hiệu năng cao, streaming | **gRPC** |
| Đẩy realtime tới client | **SignalR / SSE** |

## Quy ước REST
- Resource là danh từ số nhiều: `GET /api/v1/orders/{id}`, `POST /api/v1/orders`, `POST /api/v1/orders/{id}/cancel` (hành động nghiệp vụ không-CRUD dùng sub-resource động từ).
- Mã trạng thái đúng nghĩa: `201 + Location`, `204`, `400` (validate), `401/403`, `404`, `409` (conflict/concurrency), `422`, `429`.
- **Lỗi chuẩn RFC 9457 ProblemDetails**; có `traceId`, `errors` theo field.
- **Phân trang cursor** (`?limit=20&cursor=...`) cho danh sách lớn; lọc/sắp xếp theo query param whitelisted.
- **Idempotency-Key** header cho POST tạo đơn/thanh toán; **ETag/If-Match** cho optimistic concurrency.
- **Versioning**: URL `/v1` (đơn giản nhất cho MVP); không phá vỡ contract — chỉ thêm field.
- Định dạng: JSON camelCase, ISO-8601 UTC, tiền tệ = `{ "amount": "12.50", "currency": "USD" }`.
- DTO riêng cho request/response — **không** trả entity domain.

## Ví dụ Minimal API (.NET)
```csharp
var orders = app.MapGroup("/api/v1/orders").RequireAuthorization().WithTags("Orders");

orders.MapPost("/", async (PlaceOrderRequest req, ISender sender, CancellationToken ct) =>
{
    var result = await sender.Send(new PlaceOrderCommand(req.CustomerId, req.Lines), ct);
    return result.IsSuccess
        ? Results.Created($"/api/v1/orders/{result.Value}", new { id = result.Value })
        : result.ToProblem();           // map Error → ProblemDetails
})
.AddEndpointFilter<IdempotencyFilter>()
.Produces(StatusCodes.Status201Created)
.ProducesProblem(StatusCodes.Status422UnprocessableEntity);
```

## OpenAPI mẫu (rút gọn)
```yaml
paths:
  /api/v1/orders:
    post:
      operationId: placeOrder
      parameters: [{ name: Idempotency-Key, in: header, required: true, schema: { type: string } }]
      requestBody: { $ref: '#/components/requestBodies/PlaceOrder' }
      responses:
        '201': { description: Created }
        '422': { $ref: '#/components/responses/ValidationProblem' }
```

## Quy trình
1. Từ user flow → liệt kê endpoint/operation (map `US-xx`).
2. Viết OpenAPI; lint bằng Spectral.
3. Sinh **mock server** (Prism) cho FE + **client TypeScript** (openapi-typescript / orval) và kiểm contract bằng test.
4. Thêm rate limiting (`AddRateLimiter`), CORS whitelist, giới hạn kích thước body.
5. GraphQL: giữ schema theo nhu cầu màn hình, dùng DataLoader chống N+1, giới hạn depth/complexity.

## Gate
- [ ] OpenAPI lint sạch, mỗi endpoint map về user story
- [ ] Lỗi, phân trang, idempotency thống nhất toàn API
- [ ] FE có mock/client sinh tự động

## Anti-patterns
Verb trong URL kiểu `/getOrders`; luôn trả `200` kèm `success:false`; lộ entity/ID tự tăng nhạy cảm; đổi contract không đổi version; GraphQL không giới hạn query depth.
