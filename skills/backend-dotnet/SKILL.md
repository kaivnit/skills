---
name: backend-dotnet
description: Triển khai backend ASP.NET Core (.NET 8/9) theo Clean Architecture + CQRS + MediatR - Minimal API, FluentValidation, EF Core/Dapper, Result pattern, Outbox, background jobs, caching Redis, messaging RabbitMQ, SignalR. Dùng khi viết hoặc review code backend, tạo use case, handler, repository, pipeline behavior.
---

# Backend .NET (Clean Architecture + CQRS)

## Đầu ra
Code `src/` chạy được, có test; tuân theo `architecture-ddd` và `api-design`.

## Thứ tự làm 1 lát cắt dọc (vertical slice)
1. Viết **test** acceptance cho story (Given/When/Then).
2. **Domain**: aggregate + invariant + domain event (unit test thuần, không mock).
3. **Application**: Command/Query + Handler + Validator.
4. **Infrastructure**: EF config, repository, adapter ngoài.
5. **Api**: endpoint mỏng, map Result → HTTP.
6. Integration test (Testcontainers) → xanh → sang lát cắt tiếp.

## CQRS với MediatR
```csharp
public sealed record PlaceOrderCommand(Guid CustomerId, IReadOnlyList<LineDto> Lines) : IRequest<Result<Guid>>;

internal sealed class PlaceOrderHandler(IOrderRepository repo, IUnitOfWork uow, IProductCatalog catalog)
    : IRequestHandler<PlaceOrderCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(PlaceOrderCommand c, CancellationToken ct)
    {
        var order = Order.Create(new CustomerId(c.CustomerId));
        foreach (var l in c.Lines)
        {
            var price = await catalog.GetPriceAsync(new ProductId(l.ProductId), ct);
            if (price is null) return Error.NotFound("Product.NotFound", $"{l.ProductId}");
            order.AddLine(new ProductId(l.ProductId), l.Quantity, price);
        }
        order.Place();
        await repo.AddAsync(order, ct);
        await uow.SaveChangesAsync(ct);          // 1 transaction + ghi Outbox
        return order.Id.Value;
    }
}

public sealed class PlaceOrderValidator : AbstractValidator<PlaceOrderCommand>
{
    public PlaceOrderValidator()
    {
        RuleFor(x => x.Lines).NotEmpty();
        RuleForEach(x => x.Lines).ChildRules(l => l.RuleFor(i => i.Quantity).InclusiveBetween(1, 1000));
    }
}
```
**Query** đọc bằng Dapper/EF `AsNoTracking` + projection thẳng ra DTO (bỏ qua domain).

## Pipeline Behaviors (Decorator)
`Logging → Validation (FluentValidation) → Transaction → Caching(query)`. Đăng ký bằng `AddOpenBehavior`.

## Cross-cutting
- **Result pattern** thay exception cho lỗi nghiệp vụ; exception chỉ cho lỗi bất thường → `IExceptionHandler` + ProblemDetails.
- **Outbox**: ghi `OutboxMessage` cùng transaction với aggregate; worker publish lên RabbitMQ (MassTransit/Wolverine) → at-least-once, consumer **idempotent** (Inbox/dedupe).
- **Domain Event** dispatch trong `SaveChanges` (interceptor) cho side effect nội module; **Integration Event** cho module/service khác.
- **Caching**: cache-aside Redis cho read hot, TTL + invalidation theo event; `HybridCache` (.NET 9).
- **Background jobs**: `BackgroundService`/Hangfire/Quartz; mọi job idempotent và có retry.
- **Cấu hình**: `IOptions<T>` + validate on start; secret qua env/Key Vault, không commit.
- **Resilience**: Polly v8 (`AddStandardResilienceHandler`) cho HttpClient; timeout, retry, circuit breaker.
- **Mapping**: viết tay hoặc Mapperly cho đường nóng; AutoMapper chỉ cho DTO đơn giản, tránh trong domain.
- **Health checks** `/health/live`, `/health/ready`; **graceful shutdown**.
- **Realtime**: SignalR hub chỉ để đẩy thông báo; logic nằm ở handler.

## Khi nào dùng pattern nâng cao
| Pattern | Dùng khi | Đừng dùng khi |
|---|---|---|
| CQRS tách DB đọc/ghi | read/write profile khác hẳn | CRUD đơn giản (chỉ cần tách code) |
| Event Sourcing | audit bất biến, replay, temporal query | MVP thông thường |
| Saga | giao dịch phân tán qua nhiều service | còn là monolith (dùng 1 transaction) |
| Specification | điều kiện query nghiệp vụ lặp lại | query một lần |

## Gate
- [ ] Mỗi Must-story có endpoint + integration test (Testcontainers)
- [ ] Validation, lỗi chuẩn ProblemDetails, logging có correlation id
- [ ] Outbox + idempotent consumer cho mọi event quan trọng
- [ ] Không vi phạm kiến trúc (NetArchTest xanh)

## Anti-patterns
Controller/handler "béo" chứa luật nghiệp vụ; trả entity ra API; `Repository` generic bọc `DbContext` vô nghĩa; gọi HTTP/DB trong domain; `async void`; quên `CancellationToken`; publish event trước khi commit.
