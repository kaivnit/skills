---
name: lang-javascript
description: Profile JavaScript (ES2023+, Node.js, trình duyệt) khi không dùng TypeScript - ESM, JSDoc + checkJs để có type, ESLint/Biome, node:test/Vitest, cấu trúc module, bất biến và Value Object bằng class private, async/await, bảo mật npm, Docker. Dùng khi dự án là JavaScript thuần, script/tooling nhỏ, mã legacy, hoặc code chạy trực tiếp không có bước build.
---

# JavaScript Profile

> Cho MVP có logic nghiệp vụ, **ưu tiên TypeScript** (`lang-typescript`). Dùng JavaScript thuần khi: script/tooling nhỏ, mã legacy chưa thể chuyển, trang tĩnh/vanilla, môi trường không cho bước build, hoặc đội chọn có ý thức. Có thể đạt gần như an toàn kiểu của TS bằng JSDoc + `checkJs`.

## 1. Khi nên / không nên chọn
**Nên**: tự động hoá, CLI nhỏ, userscript, tích hợp nhanh, frontend vanilla/htmx, Node scripts. **Không nên**: backend lớn nhiều người đóng góp, miền phức tạp, thư viện công khai cần kiểu cho người dùng (xuất `.d.ts` từ JSDoc nếu buộc dùng JS).

## 2. Toolchain
| Việc | Công cụ |
|---|---|
| Runtime | Node.js LTS (ESM), pin phiên bản `.nvmrc`/`mise` |
| Module | **ESM** (`"type": "module"`), không dùng CommonJS cho code mới |
| Kiểu | `// @ts-check` hoặc `jsconfig.json` với `"checkJs": true, "strict": true`; `tsc --noEmit` trong CI |
| Lint/format | **Biome** hoặc ESLint (flat config) + Prettier |
| Package | pnpm (hoặc npm) + lockfile; `engines` trong `package.json` |
| Test | `node:test` (built-in) hoặc Vitest |

`jsconfig.json`:
```json
{ "compilerOptions": { "checkJs": true, "strict": true, "target": "ES2023", "module": "NodeNext", "noEmit": true }, "include": ["src"] }
```

## 3. Layout → Clean/DDD (nhẹ)
```
src/
  domain/ordering/{money.js, order.js, events.js}   # thuần, không import hạ tầng
  application/ordering/place-order.js               # use case nhận port qua tham số
  infrastructure/{db.js, queue.js}
  http/{routes.js, errors.js}
  main.js                                           # composition root
```
Quy tắc phụ thuộc kiểm bằng dependency-cruiser; domain không `import` từ `infrastructure`.

## 4. Thư viện
Web: Fastify/Express · Validation: Zod/Joi (không có type tĩnh → bắt buộc validate ranh giới) · Data: Knex/Kysely/Drizzle · Log: pino · Test: `node:test`/Vitest · HTTP: `fetch` built-in · Schema → type: JSDoc `@typedef` hoặc `z.infer` (qua JSDoc import type).

## 5. Idiom DDD (class + trường private + JSDoc)
```js
// @ts-check
export class Money {
  #amountMinor; #currency;
  /** @param {bigint} amountMinor @param {string} currency */
  constructor(amountMinor, currency) {
    if (amountMinor < 0n) throw new DomainError("Amount must be >= 0");
    this.#amountMinor = amountMinor; this.#currency = currency;
    Object.freeze(this);                          // bất biến
  }
  get amountMinor() { return this.#amountMinor; }
  get currency() { return this.#currency; }
  /** @param {Money} o @returns {Money} */
  add(o) {
    if (o.currency !== this.#currency) throw new DomainError("Currency mismatch");
    return new Money(this.#amountMinor + o.amountMinor, this.#currency);
  }
}

/** @typedef {{ orders: { save(o: Order): Promise<void> } }} Deps */
/** @param {Deps} deps */
export const placeOrder = (deps) => async (/** @type {{customerId: string}} */ cmd) => { /* ... */ };
```
Không có interface: dùng **duck typing + `@typedef`** để mô tả port; kiểm tra bằng `tsc --checkJs`.

## 6. Xử lý lỗi
Lớp lỗi riêng kế thừa `Error` (`cause` để nối lỗi): `throw new DomainError("...", { cause })`. Ánh xạ sang ProblemDetails ở lớp HTTP. Luôn `await`/bắt Promise; xử lý `process.on("unhandledRejection")` bằng log + thoát có kiểm soát.

## 7. Đồng thời
Giống TypeScript: event loop đơn luồng, không chặn; `Promise.all` có giới hạn; `AbortSignal.timeout()`; `worker_threads` cho CPU. Không trộn callback và Promise — dùng `util.promisify`/API Promise.

## 8. Testing
```js
import { test } from "node:test"; import assert from "node:assert/strict";
test("Order.place rejects empty order", () => {
  assert.throws(() => new Order("o1").place(), { message: "Empty order" });
});
```
Chạy `node --test`; thêm integration với testcontainers-node; coverage `--experimental-test-coverage` hoặc c8.

## 9. Observability
pino + OpenTelemetry giống `lang-typescript`; `/health/live|ready`; redact dữ liệu nhạy cảm.

## 10. Docker
Giống `lang-typescript` nhưng không cần bước build: copy `src` + `node_modules --omit=dev`, `USER node`, base `node:22-slim`/distroless.

## 11. CI
`pnpm install --frozen-lockfile` → `pnpm lint` → `tsc --noEmit` (checkJs) → `node --test` → `pnpm audit --prod`.

## 12. Hiệu năng
Như TypeScript: `--cpu-prof`, clinic.js; tránh làm chậm event loop; streams cho dữ liệu lớn.

## 13. Gate & Anti-patterns
- [ ] `checkJs` strict xanh, ESM, không dùng `var`, có test chạy trong CI
- ✗ Không có kiểm kiểu; `==` thay vì `===`; mutate đối tượng đầu vào; callback hell; trộn CJS/ESM; `eval`/`new Function`; cài gói npm không rà soát (**supply chain**: khoá phiên bản, `npm audit`, bật `ignore-scripts` cho gói không tin cậy)
