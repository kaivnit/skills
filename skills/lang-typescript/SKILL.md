---
name: lang-typescript
description: Profile TypeScript cho backend Node.js/Bun/Deno và frontend - tsconfig strict, layout Clean/DDD, Fastify/NestJS/Hono, Zod, Drizzle/Prisma, pino, Vitest, Testcontainers, dependency-cruiser, Docker, CI, pnpm monorepo. Dùng khi viết hoặc review code TypeScript, thiết kế API BFF, full-stack chia sẻ kiểu, hoặc chuyển nguyên tắc DDD sang TypeScript.
---

# TypeScript Profile

## 1. Khi nên / không nên chọn
**Nên**: API/BFF mỏng đến vừa, full-stack cùng ngôn ngữ (chia sẻ kiểu/schema với frontend), real-time (WebSocket/SSE), đội web, serverless/edge. **Không nên**: tính toán CPU nặng kéo dài (event loop đơn luồng — dùng worker_threads hoặc ngôn ngữ khác), miền cực phức tạp mà đội thiếu kỷ luật kiểu, dữ liệu/ML (Python).

## 2. Toolchain
| Việc | Công cụ |
|---|---|
| Runtime | Node.js LTS (pin bằng `.nvmrc`/`volta`/`mise`); Bun/Deno khi đã đánh giá |
| Package | **pnpm** + workspaces; `packageManager` field; lockfile commit |
| Biên dịch | `tsc` (type check) + `tsx` (dev) + `tsup`/`esbuild` (build) |
| Format + lint | **Biome** hoặc ESLint (`typescript-eslint` strict) + Prettier |
| Kiểu | `tsconfig`: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `moduleResolution: "NodeNext"/"Bundler"` |

## 3. Layout → Clean/DDD
```
apps/api/src/
  modules/ordering/
    domain/          # entity, value object, event (không import framework/DB)
    application/     # use case, port (interface), DTO schema
    infrastructure/  # repo Drizzle/Prisma, adapter, outbox
    http/            # route Fastify/Hono, ánh xạ lỗi → ProblemDetails
  shared/            # building blocks
  main.ts            # composition root
packages/contracts/  # Zod schema + type sinh từ OpenAPI dùng chung FE/BE
```
Kiểm quy tắc phụ thuộc: **dependency-cruiser** hoặc `eslint-plugin-boundaries` (Nx module boundaries) chạy trong CI.

## 4. Thư viện theo concern
Web: **Fastify** (hiệu năng, schema) / **NestJS** (khung đầy đủ, DI) / **Hono** (edge) · Validation: **Zod**/Valibot (suy ra type từ schema) · Data: **Drizzle** / Kysely / Prisma · Migration: drizzle-kit/Prisma Migrate · Queue: BullMQ, amqplib, NATS · Logging: **pino** · Tracing: `@opentelemetry/sdk-node` · HTTP client: undici/fetch + retry · Test: **Vitest**, supertest/`app.inject`, testcontainers-node, fast-check, MSW.

## 5. Idiom DDD
```ts
// Branded ID — chống nhầm lẫn giữa các ID
export type OrderId = string & { readonly __brand: "OrderId" };

export class Money {
  private constructor(readonly amountMinor: bigint, readonly currency: string) {}
  static of(amountMinor: bigint, currency: string): Money {
    if (amountMinor < 0n) throw new DomainError("Amount must be >= 0");
    return new Money(amountMinor, currency);
  }
  add(o: Money): Money {
    if (o.currency !== this.currency) throw new DomainError("Currency mismatch");
    return new Money(this.amountMinor + o.amountMinor, this.currency);
  }
}

export class Order extends AggregateRoot {
  private lines: OrderLine[] = [];
  private status: "draft" | "placed" = "draft";
  constructor(readonly id: OrderId) { super(); }
  place(): void {
    if (this.lines.length === 0) throw new DomainError("Empty order");
    this.status = "placed";
    this.raise({ type: "OrderPlaced", orderId: this.id });
  }
}

// Use case — hàm thuần nhận port, không cần framework DI
export const placeOrder =
  (deps: { orders: OrderRepository; uow: UnitOfWork }) =>
  async (cmd: PlaceOrder): Promise<Result<OrderId, PlaceOrderError>> => { /* ... */ };
```
Dùng **discriminated union** cho trạng thái (`{ kind: "placed"; at: Date } | { kind: "draft" }`) thay vì cờ boolean.

## 6. Xử lý lỗi
Lỗi nghiệp vụ → kiểu `Result` (`neverthrow`/tự định nghĩa) hoặc union; lỗi hạ tầng → exception. Handler toàn cục chuyển thành **ProblemDetails** (RFC 9457). Không `catch` rồi nuốt; không `throw` string; luôn `await` Promise (bật rule `no-floating-promises`).

## 7. Đồng thời & bất đồng bộ
Event loop đơn luồng: **không chặn** (không sync I/O, không vòng lặp CPU dài). CPU nặng → `worker_threads`/queue. Dùng `Promise.all` có giới hạn song song (`p-limit`); `AbortController` cho timeout/huỷ; xử lý `unhandledRejection`; graceful shutdown (đóng server, drain queue, đóng pool).

## 8. Testing
Vitest cho unit/domain (không mock domain); integration với **Testcontainers** + DB thật; contract test với OpenAPI; `fast-check` cho property; Playwright cho E2E (`frontend-web`); `tsc --noEmit` là một dạng test. Kiểm kiến trúc: dependency-cruiser.

## 9. Observability
pino JSON + `pino-http` (gắn `traceId` qua `AsyncLocalStorage`), OpenTelemetry auto-instrumentation (khởi tạo **trước** khi import app), `/health/live|ready`, redact trường nhạy cảm trong pino.

## 10. Docker
```dockerfile
FROM node:22-slim AS build
WORKDIR /app
RUN corepack enable
COPY pnpm-lock.yaml package.json ./
RUN pnpm fetch
COPY . .
RUN pnpm install --offline --frozen-lockfile && pnpm build && pnpm prune --prod
FROM gcr.io/distroless/nodejs22-debian12
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
USER nonroot
CMD ["dist/main.js"]
```

## 11. CI
`pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm typecheck` (`tsc --noEmit`) → `pnpm test` → `pnpm audit --prod` → `pnpm build`.

## 12. Hiệu năng
`node --cpu-prof`, `clinic doctor/flame`, `--inspect`; theo dõi event-loop lag (`perf_hooks.monitorEventLoopDelay`); streaming thay vì buffer lớn; tránh `JSON.parse` payload khổng lồ đồng bộ; pool DB có giới hạn; bundle frontend: analyzer (`frontend-web`).

## 13. Gate & Anti-patterns
- [ ] `strict` bật, không `any` ngầm, CI chạy typecheck + lint + test, boundary check xanh
- ✗ `any` lan tràn; type tay thay vì sinh từ schema/OpenAPI; Promise không await; domain import ORM/Express; class "service" khổng lồ; `enum` TypeScript runtime (ưu tiên union/`as const`); mutable shared state ở module scope
