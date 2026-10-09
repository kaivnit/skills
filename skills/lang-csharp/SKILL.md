---
name: lang-csharp
description: Profile C#/.NET 8/9 cho backend, worker, CLI - toolchain, layout Clean/DDD Modular Monolith, ASP.NET Core Minimal API, EF Core/Dapper, FluentValidation, MediatR, Serilog/OpenTelemetry, xUnit/Testcontainers, Docker, CI, Native AOT. Dùng khi viết hoặc review code C#/.NET; đi cùng skill backend-dotnet và architecture-ddd cho phần sâu.
---

# C# / .NET Profile

> Skill chuyên sâu: `architecture-ddd` (DDD, cấu trúc solution), `backend-dotnet` (CQRS, Outbox, pipeline). Profile này tóm tắt toolchain và quy ước để chuyển đổi nhất quán với các ngôn ngữ khác.

## 1. Khi nên / không nên chọn
**Nên**: miền nghiệp vụ phức tạp, đội .NET, cần hệ kiểu mạnh + tooling (Rider/VS), hiệu năng tốt, hệ sinh thái doanh nghiệp (Entra ID, Azure). **Không nên**: script nhỏ chạy một lần, đội hoàn toàn không biết .NET và deadline gấp, thứ cần binary siêu nhỏ/khởi động µs (xem Go/Rust, hoặc Native AOT).

## 2. Toolchain
| Việc | Công cụ |
|---|---|
| Phiên bản SDK | `global.json` (pin SDK) |
| Build/restore | `dotnet build/restore`, **Central Package Management** (`Directory.Packages.props`) |
| Format | `dotnet format`, `.editorconfig` |
| Lint | Roslyn analyzers (`Microsoft.CodeAnalysis.NetAnalyzers`, SonarAnalyzer), `TreatWarningsAsErrors` |
| Kiểu | Nullable reference types bật toàn solution |
| Kiểm phụ thuộc | `dotnet list package --vulnerable --include-transitive` |

## 3. Layout (Clean/DDD)
```
src/Modules/Ordering/{Domain, Application, Infrastructure, Contracts}
src/Host/Api            # composition root
tests/{Ordering.Tests, Architecture.Tests}
```
Quy tắc: `Domain ← Application ← Infrastructure/Api`. Kiểm bằng **NetArchTest**.

## 4. Thư viện theo concern
Web: ASP.NET Core Minimal API · Validation: FluentValidation · Data: EF Core (ghi), Dapper (đọc) · Migration: EF Migrations · CQRS: MediatR/Wolverine · Messaging: MassTransit · Logging: Serilog (+Seq) · Tracing: OpenTelemetry · Resilience: Polly v8 / `AddStandardResilienceHandler` · Test: xUnit, FluentAssertions, NSubstitute, Testcontainers.

## 5. Idiom DDD
```csharp
public sealed record Money(long AmountMinor, string Currency)
{
    public static Money Of(long minor, string cur) =>
        minor < 0 ? throw new DomainException("Amount must be >= 0") : new(minor, cur);
}

public sealed class Order : AggregateRoot
{
    private readonly List<OrderLine> _lines = new();
    public OrderStatus Status { get; private set; } = OrderStatus.Draft;
    public void Place()
    {
        if (_lines.Count == 0) throw new DomainException("Empty order");
        Status = OrderStatus.Placed;
        Raise(new OrderPlaced(Id));
    }
}
// Handler: IRequestHandler<PlaceOrderCommand, Result<Guid>> — xem backend-dotnet
```

## 6. Xử lý lỗi
Lỗi nghiệp vụ → **Result pattern** (không ném exception cho luồng thường); lỗi bất thường → exception → `IExceptionHandler` → **ProblemDetails** (`TypedResults.Problem`). Domain ném `DomainException` cho vi phạm invariant, tầng Application chuyển thành `Result`.

## 7. Đồng thời
`async/await` toàn đường (không `.Result`/`.Wait()`), truyền `CancellationToken`, `Channel<T>` cho producer/consumer nội bộ, `BackgroundService` cho tác vụ nền; tránh `async void`; giới hạn song song (`SemaphoreSlim`, `Parallel.ForEachAsync` với `MaxDegreeOfParallelism`).

## 8. Testing
xUnit + `WebApplicationFactory` + **Testcontainers** (DB thật); domain test không mock; NetArchTest cho kiến trúc; FsCheck cho property; BenchmarkDotNet cho đường nóng. Chi tiết: `testing-qa`.

## 9. Observability
`UseSerilog` + `RenderedCompactJsonFormatter`; `AddOpenTelemetry().WithTracing/WithMetrics`; `MapHealthChecks("/health/live|ready")`. Chi tiết: `observability`.

## 10. Docker
```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .
RUN dotnet publish src/Host/Api -c Release -o /app --no-self-contained
FROM mcr.microsoft.com/dotnet/aspnet:8.0-jammy-chiseled
WORKDIR /app
COPY --from=build /app .
USER app
ENTRYPOINT ["dotnet", "Api.dll"]
```

## 11. CI
`dotnet restore` → `dotnet build -c Release --warnaserror` → `dotnet format --verify-no-changes` → `dotnet test -c Release --no-build` → `dotnet list package --vulnerable`.

## 12. Hiệu năng
`dotnet-counters`, `dotnet-trace`, PerfView, `dotnet-gcdump`; Server GC khi nhiều core; `System.Text.Json` source generators; **Native AOT** cho CLI/function cần khởi động nhanh (hạn chế reflection). Tránh N+1 EF (`AsNoTracking`, projection). Chi tiết: `performance-engineering`.

## 13. Gate & Anti-patterns
- [ ] Build không warning, nullable bật, NetArchTest xanh, integration test dùng DB thật
- ✗ Anemic domain, Generic Repository bọc DbContext, entity lộ ra API, `Task.Run` bọc I/O, quên `CancellationToken`, publish event trước commit
