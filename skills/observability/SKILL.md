---
name: observability
description: Thiết lập logging, metrics, tracing và alerting cho hệ thống .NET - Serilog + Seq/ELK, OpenTelemetry, health checks, dashboard 4 golden signals, SLO, on-call cơ bản, error tracking. Dùng khi cần theo dõi/giám sát hệ thống, debug production, thiết kế log có cấu trúc, hoặc thiết lập alert.
---

# Observability

## Đầu ra
Cấu hình log/metric/trace + dashboard + alert + `docs/09-slo-alerts.md`

## Ba trụ cột + sự kiện nghiệp vụ
| Trụ cột | Công cụ | Mục đích |
|---|---|---|
| Logs có cấu trúc | **Serilog** → **Seq** (nhỏ/nhanh) hoặc **ELK/OpenSearch** (quy mô lớn) | "Chuyện gì đã xảy ra" |
| Metrics | OpenTelemetry/Prometheus → Grafana | "Hệ thống khoẻ không" |
| Traces | OpenTelemetry → Jaeger/Tempo/Application Insights | "Chậm/lỗi ở đâu" |
| Error tracking | Sentry (BE + FE) | Gom lỗi, release health |

## Cấu hình .NET
```csharp
builder.Host.UseSerilog((ctx, lc) => lc
    .ReadFrom.Configuration(ctx.Configuration)
    .Enrich.FromLogContext().Enrich.WithProperty("Service", "ordering-api")
    .WriteTo.Console(new RenderedCompactJsonFormatter())
    .WriteTo.Seq(ctx.Configuration["Seq:Url"]!));

builder.Services.AddOpenTelemetry()
    .ConfigureResource(r => r.AddService("ordering-api"))
    .WithTracing(t => t.AddAspNetCoreInstrumentation().AddHttpClientInstrumentation()
                       .AddEntityFrameworkCoreInstrumentation().AddSource("MassTransit").AddOtlpExporter())
    .WithMetrics(m => m.AddAspNetCoreInstrumentation().AddRuntimeInstrumentation().AddOtlpExporter());

app.UseSerilogRequestLogging();
app.MapHealthChecks("/health/live");
app.MapHealthChecks("/health/ready", new() { Predicate = c => c.Tags.Contains("ready") });
```

## Quy ước log
- **Structured logging**: `log.LogInformation("Order {OrderId} placed by {CustomerId}", id, cid)` — không nối chuỗi.
- Mọi log mang `TraceId`/`CorrelationId`; truyền xuyên service & message (header).
- Level: `Debug` dev · `Information` luồng nghiệp vụ chính · `Warning` bất thường phục hồi được · `Error` thất bại cần xem.
- **Không log PII, mật khẩu, token**; dùng destructuring policy che dữ liệu.
- Retention theo mức: log 14–30 ngày, audit log lâu hơn.

## Dashboard & Alert
- **4 Golden Signals**: Latency, Traffic, Errors, Saturation. Thêm **RED** cho API (Rate/Errors/Duration) và **USE** cho hạ tầng.
- **Business metrics**: đơn tạo/giờ, tỉ lệ thanh toán thất bại, độ trễ queue.
- **SLO MVP**: ví dụ 99.5% request thành công, p95 < 300ms; alert theo **burn rate**, không theo từng spike.
- Alert phải **actionable** (có runbook link), phân mức page/ticket; kênh Slack/Email/PagerDuty.
- Synthetic check (uptime) cho endpoint chính từ bên ngoài.

## Gate
- [ ] Trace end-to-end qua API → DB → queue → worker xem được bằng 1 TraceId
- [ ] Dashboard 4 golden signals + business metrics
- [ ] ≥ 3 alert chính (5xx cao, p95 cao, queue backlog) kèm runbook
- [ ] Đã diễn tập tìm nguyên nhân 1 lỗi giả lập chỉ bằng công cụ quan sát

## Anti-patterns
`Console.WriteLine` làm log; log mọi thứ ở Information; alert ồn gây mù cảm giác (alert fatigue); không có correlation id; chỉ monitor CPU mà không có metric nghiệp vụ.
