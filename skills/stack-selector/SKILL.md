---
name: stack-selector
description: Chọn ngôn ngữ và stack cho từng thành phần hệ thống (C#, TypeScript, JavaScript, Go, Rust, Python...) theo bài toán, đội ngũ và hệ sinh thái; quy tắc làm hệ thống đa ngôn ngữ (polyglot) với contract rõ ràng; bảng tương đương công cụ giữa các ngôn ngữ cho framework, ORM, test, logging, lint, build. Dùng khi bắt đầu dự án mới, khi phải chọn ngôn ngữ cho service/worker/CLI/data pipeline, khi chuyển ví dụ C# sang ngôn ngữ khác, hoặc khi làm việc trong repo không phải .NET.
---

# Stack Selector & Polyglot Rules

Các skill khác (kiến trúc, API, DB, test, DevOps…) viết **nguyên tắc độc lập ngôn ngữ**, ví dụ minh hoạ bằng C#. Skill này nối nguyên tắc đó sang ngôn ngữ thực tế bạn dùng, qua các profile `lang-*`.

## Đầu ra
ADR `docs/adr/NNNN-stack.md`: ngôn ngữ cho từng thành phần, lý do, ngày xem lại.

## 1. Cách chọn (theo thứ tự ưu tiên)
1. **Năng lực đội hiện có** — thời gian đến MVP thường quan trọng hơn hiệu năng lý thuyết.
2. **Bản chất bài toán** (bảng dưới).
3. **Hệ sinh thái** có sẵn thư viện cho miền của bạn (thanh toán, ML, GIS, PDF, hardware…).
4. **Tuyển dụng, vận hành, hiệu năng, chi phí hạ tầng** — xét sau cùng, trừ khi là ràng buộc cứng.

| Bài toán | Lựa chọn tốt | Ghi chú |
|---|---|---|
| Web API nghiệp vụ phức tạp (DDD, nhiều quy tắc) | **C#**, TypeScript, Java/Kotlin | Hệ kiểu mạnh, tooling tốt, ORM trưởng thành |
| API/BFF mỏng, full-stack một ngôn ngữ, real-time | **TypeScript** (Node/Bun/Deno) | Chia sẻ kiểu với frontend |
| Service mạng đồng thời cao, công cụ hạ tầng/CLI, deploy đơn giản | **Go** | Binary tĩnh, goroutine, build nhanh |
| Hiệu năng/độ an toàn bộ nhớ tối đa, hệ thống nhúng, engine, WASM | **Rust** | Chi phí học và biên dịch cao hơn |
| Dữ liệu, ETL, ML/AI, tự động hoá, prototyping | **Python** | Hệ sinh thái dữ liệu/AI vượt trội |
| Frontend web | **TypeScript** | Mặc định; JavaScript thuần chỉ cho script nhỏ |
| Script, glue, tooling nhỏ | Python / TypeScript / Go / shell | Chọn thứ đội thạo nhất |
| Serverless/edge nhẹ | TypeScript, Go, Rust (Wasm) | Chú ý cold start & giới hạn runtime |

## 2. Quy tắc đa ngôn ngữ (polyglot)
- **Tối đa 2 ngôn ngữ backend cho MVP** (+ TypeScript cho frontend). Mỗi ngôn ngữ thêm = thêm CI, image, người hiểu, lỗ hổng cần theo dõi.
- Ranh giới giữa ngôn ngữ phải là **contract**, không phải code chung: OpenAPI (`api-design`), `.proto`/gRPC, JSON Schema/AsyncAPI cho event. Sinh client/type từ contract ở mỗi phía.
- **Modular Monolith chỉ nên một ngôn ngữ**; khác ngôn ngữ ⇒ khác process ⇒ chi phí microservice. Chỉ tách khi lợi ích rõ (ví dụ worker ML bằng Python, gateway bằng Go).
- Monorepo, mỗi thư mục một toolchain; lệnh thống nhất qua `make`/`just` (`project-bootstrap`): `make up | test | lint | build`.
- Chuẩn chung xuyên ngôn ngữ: **cùng** quy ước commit, logging JSON có `traceId`, OpenTelemetry, health endpoint `/health/live|ready`, cấu hình 12-factor qua env, cùng định dạng lỗi ProblemDetails.
- CI chạy theo path filter từng thư mục; cache riêng từng toolchain.

## 3. Bảng tương đương (concern → công cụ)

| Concern | C# | TypeScript | JavaScript | Go | Rust | Python |
|---|---|---|---|---|---|---|
| Web framework | ASP.NET Core Minimal API | Fastify / NestJS / Hono | Fastify / Express | `net/http` + chi (Echo, Gin) | Axum (Actix-web) | FastAPI (Django) |
| DI | Built-in `IServiceCollection` | NestJS DI / thủ công | Thủ công | Constructor thủ công (wire, fx) | Generics/traits, thủ công | `Depends` / thủ công |
| Validation | FluentValidation | Zod / Valibot | Zod / Joi | go-playground/validator | garde / validator + kiểu | Pydantic v2 |
| Data access | EF Core, Dapper | Drizzle / Prisma / Kysely | Knex / Prisma | sqlc + pgx (GORM, ent) | SQLx (SeaORM, Diesel) | SQLAlchemy 2 |
| Migration | EF Migrations, DbUp | drizzle-kit / Prisma Migrate | Knex migrate | goose / atlas | `sqlx migrate` / refinery | Alembic |
| Mediator/CQRS | MediatR, Wolverine | Handler thủ công / NestJS CQRS | Thủ công | Handler thủ công | Handler thủ công (traits) | Handler thủ công |
| Messaging | MassTransit | BullMQ, amqplib, NATS | BullMQ, amqplib | amqp091-go, watermill, NATS | lapin, async-nats | Celery, Dramatiq, aio-pika |
| Logging | Serilog | pino | pino | `log/slog` (zap, zerolog) | `tracing` | structlog / `logging` |
| Tracing/metrics | OpenTelemetry .NET | `@opentelemetry/sdk-node` | giống TS | otel-go | `tracing-opentelemetry` | opentelemetry-python |
| Unit test | xUnit + FluentAssertions | Vitest / Jest | Vitest / `node:test` | `testing` + testify | `#[test]` + nextest | pytest |
| Property test | FsCheck | fast-check | fast-check | `testing/quick`, rapid | proptest | Hypothesis |
| Integration (container) | Testcontainers .NET | testcontainers-node | testcontainers-node | testcontainers-go | testcontainers-rs | testcontainers-python |
| Format / lint | `dotnet format` + analyzers | Biome hoặc ESLint + Prettier | giống TS | gofmt + golangci-lint | rustfmt + clippy | ruff (format + lint) |
| Type check | Compiler | `tsc --strict` | JSDoc + `tsc --checkJs` | Compiler | Compiler | mypy / pyright |
| Package & build | dotnet CLI + NuGet | pnpm + tsc/esbuild/tsx | pnpm | Go modules | cargo | uv (hoặc poetry) |
| Kiểm kiến trúc | NetArchTest | dependency-cruiser, eslint-plugin-boundaries | giống TS | go-arch-lint, depguard | Cargo workspace (crate = layer) | import-linter |
| Profiling/benchmark | BenchmarkDotNet, dotnet-trace | clinic.js, `--cpu-prof` | giống TS | pprof, `go test -bench` | criterion, cargo-flamegraph | py-spy, scalene, cProfile |
| Mô hình đồng thời | async/await + thread pool | Event loop, worker_threads | giống TS | Goroutine + channel | Tokio async / thread | asyncio; process cho CPU |
| Xử lý lỗi | Result pattern / exception | Exception hoặc `neverthrow` | Exception | `error` là giá trị | `Result<T, E>` | Exception |
| Base image runtime | `aspnet` (chiseled) | `node:slim` / distroless | giống TS | distroless static / scratch | distroless cc / scratch | `python:slim` |

> Đây là mặc định hợp lý, không phải luật. Thư viện cụ thể thay đổi theo thời gian — kiểm phiên bản và độ duy trì trước khi chốt.

## 4. Quy trình áp dụng
1. Với mỗi thành phần (API, worker, frontend, data pipeline, CLI) điền: *bài toán → ngôn ngữ → lý do → rủi ro*.
2. Mở profile tương ứng: `lang-csharp`, `lang-typescript`, `lang-javascript`, `lang-go`, `lang-rust`, `lang-python`. Ngôn ngữ khác → `language-profile-template`.
3. Giữ nguyên nguyên tắc của `architecture-ddd`, `api-design`, `database-design`, `testing-qa`, `devops-cicd`, `observability`; chỉ **thay công cụ** theo bảng.
4. Ghi ADR; đặt điều kiện xem lại (ví dụ "nếu p95 > 300 ms ở 200 RPS thì xét lại Python → Go cho dịch vụ X").

## Gate
- [ ] Mỗi thành phần có ngôn ngữ + lý do + người đủ năng lực bảo trì
- [ ] ≤ 2 ngôn ngữ backend; ranh giới giữa chúng là contract sinh được client
- [ ] Lệnh `make test|lint|build` chạy cho mọi ngôn ngữ trong repo
- [ ] CI, logging, tracing, health check thống nhất giữa các ngôn ngữ

## Anti-patterns
Chọn ngôn ngữ vì thời thượng; rewrite sang Rust/Go khi chưa đo nút thắt; mỗi service một ngôn ngữ; chia sẻ code (không phải contract) giữa hai ngôn ngữ; dịch máy móc mẫu C# sang ngôn ngữ khác (mang theo MediatR, interface cho mọi thứ vào Go/Rust) thay vì dùng idiom bản địa.
