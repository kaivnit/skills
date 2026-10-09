---
name: lang-rust
description: Profile Rust cho service hiệu năng cao, CLI, hệ thống nhúng, WebAssembly - cargo workspace theo tầng Clean/DDD, Axum + Tokio, SQLx, serde, thiserror/anyhow, tracing, ownership và newtype/typestate trong domain, test với nextest/proptest/insta, clippy, cargo-deny, Docker, profiling. Dùng khi viết hoặc review Rust, thiết kế service Rust, hoặc chuyển nguyên tắc DDD sang Rust.
---

# Rust Profile

## 1. Khi nên / không nên chọn
**Nên**: hiệu năng và độ trễ ổn định (không GC), an toàn bộ nhớ, hệ thống nhúng, engine/parsing, WASM, CLI nhanh, thư viện lõi dùng đa ngôn ngữ (FFI/PyO3/napi-rs), khi bug lớp "nil/race" rất đắt. **Không nên**: MVP cần ra thị trường rất nhanh với đội chưa biết Rust, CRUD thông thường (chi phí học + thời gian biên dịch không đáng), prototyping thay đổi liên tục.

## 2. Toolchain
| Việc | Công cụ |
|---|---|
| Phiên bản | `rust-toolchain.toml` (pin `stable`/phiên bản + `components = ["clippy","rustfmt"]`) |
| Build | `cargo build --release`; `sccache`/`mold` để rút ngắn build |
| Format | `cargo fmt` |
| Lint | `cargo clippy --all-targets -- -D warnings` |
| Phụ thuộc | **cargo-deny** (giấy phép, advisory, trùng lặp), `cargo audit`, `cargo-udeps` |
| Test | `cargo nextest run`, `cargo test --doc` |

## 3. Layout → Clean/DDD bằng Cargo workspace
```
Cargo.toml                    # [workspace]
crates/
  ordering-domain/            # không phụ thuộc framework/IO (chỉ std, thiserror, serde nếu cần)
  ordering-app/               # use case + port (trait); phụ thuộc domain
  ordering-infra/             # sqlx repo, lapin; phụ thuộc app + domain
  api/                        # axum, composition root; phụ thuộc tất cả
```
**Mỗi crate là một tầng — trình biên dịch cưỡng chế quy tắc phụ thuộc** qua `Cargo.toml` (domain không thể `use sqlx`). Không cần thư viện kiểm kiến trúc riêng.

## 4. Thư viện theo concern
Async runtime: **Tokio** · Web: **Axum** (tower middleware), Actix-web · Serialization: **serde** · Validation: constructor trả `Result` + `garde`/`validator` ở biên · Data: **SQLx** (query kiểm lúc compile, `sqlx::query!`), SeaORM, Diesel · Migration: `sqlx migrate` · Messaging: lapin, async-nats, rdkafka · Log/trace: **tracing** + `tracing-subscriber` (JSON) + `tracing-opentelemetry` · Lỗi: **thiserror** (thư viện/domain), **anyhow** (binary/biên) · Config: `figment`/`config` · HTTP client: reqwest · Test: nextest, proptest, insta, mockall (hạn chế), testcontainers-rs, wiremock.

## 5. Idiom DDD (kiểu làm bất hợp lệ không biểu diễn được)
```rust
// domain crate
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Money { amount_minor: i64, currency: Currency }

impl Money {
    pub fn new(amount_minor: i64, currency: Currency) -> Result<Self, DomainError> {
        if amount_minor < 0 { return Err(DomainError::NegativeAmount); }
        Ok(Self { amount_minor, currency })
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct OrderId(uuid::Uuid);                 // newtype: không nhầm ID

pub struct Order { id: OrderId, status: OrderStatus, lines: Vec<OrderLine>, events: Vec<DomainEvent> }

impl Order {
    pub fn place(&mut self) -> Result<(), DomainError> {
        if self.lines.is_empty() { return Err(DomainError::EmptyOrder); }
        self.status = OrderStatus::Placed;
        self.events.push(DomainEvent::OrderPlaced { id: self.id });
        Ok(())
    }
    pub fn take_events(&mut self) -> Vec<DomainEvent> { std::mem::take(&mut self.events) }
}

// app crate: port là trait
pub trait OrderRepository: Send + Sync {
    async fn save(&self, order: &mut Order) -> Result<(), RepoError>;   // async fn in trait (Rust ≥ 1.75)
}
```
Nâng cao: **typestate** (`Order<Draft>` → `Order<Placed>`) khi chuyển trạng thái phải bị trình biên dịch kiểm; `enum` có dữ liệu thay cờ boolean; `#[non_exhaustive]` cho lỗi công khai. Dùng generics (static dispatch) cho port; `dyn Trait` + `async_trait` khi cần đa hình lúc chạy.

## 6. Xử lý lỗi
`Result<T, E>` + toán tử `?`; lỗi domain = `enum` với `thiserror`; adapter chuyển `RepoError`/`DomainError` → HTTP qua `impl IntoResponse` (ProblemDetails). `anyhow::Context` ở biên ứng dụng. **Không `unwrap()`/`expect()` trong đường chạy thật** (clippy `unwrap_used` = deny); `panic` chỉ cho invariant bị phá.

## 7. Đồng thời
Ownership/borrowing loại bỏ data race lúc biên dịch (`Send`/`Sync`). Tokio: không chặn runtime (dùng `spawn_blocking` cho CPU/IO đồng bộ), `tokio::select!` cho timeout/huỷ, `JoinSet` quản lý task, kênh `mpsc`/`broadcast`, graceful shutdown (`CancellationToken`). Cẩn thận giữ `MutexGuard` qua `.await`; ưu tiên truyền thông điệp hơn chia sẻ trạng thái.

## 8. Testing
Unit test trong `#[cfg(test)]`; domain test không mock; integration ở `tests/` với **testcontainers-rs**; `proptest` cho property; `insta` snapshot; `cargo nextest` nhanh/song song; doc-test làm tài liệu sống; `cargo miri` cho `unsafe`; `cargo llvm-cov` coverage.

## 9. Observability
`tracing` span quanh use case (`#[tracing::instrument(skip(self))]`), subscriber JSON, OTLP exporter, `tower-http` `TraceLayer`, `/health/live|ready`. Không log dữ liệu nhạy cảm (`skip`/`secrecy::SecretString`).

## 10. Docker
```dockerfile
FROM rust:1.83 AS build
WORKDIR /src
COPY . .
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/src/target \
    cargo build --release -p api && cp target/release/api /api
FROM gcr.io/distroless/cc-debian12:nonroot
COPY --from=build /api /api
ENTRYPOINT ["/api"]
```
Hoặc target `x86_64-unknown-linux-musl` + `scratch` cho binary tĩnh. `cargo-chef` để cache phụ thuộc.

## 11. CI
`cargo fmt --check` → `cargo clippy --all-targets -- -D warnings` → `cargo nextest run` → `cargo test --doc` → `cargo deny check` → `cargo build --release`. Cache `~/.cargo` và `target/` (`Swatinem/rust-cache`).

## 12. Hiệu năng
`cargo bench` (criterion), `cargo flamegraph`, `perf`, `tokio-console`, DHAT/heaptrack; profile `release` với `lto = "thin"`, `codegen-units = 1`, `panic = "abort"` khi phù hợp; tránh `clone()` thừa, dùng `Cow`/slice/`Arc`; đo trước khi dùng `unsafe`.

## 13. Gate & Anti-patterns
- [ ] clippy `-D warnings` sạch, `cargo deny` sạch, không `unwrap` ở đường thật, mỗi crate đúng tầng
- ✗ Chống lại borrow checker bằng `clone()`/`Rc<RefCell>` khắp nơi; `unsafe` không cần thiết; `async` khắp nơi cho tính toán thuần; trait + generic quá mức (over-abstraction kiểu Java); chặn runtime Tokio; một crate khổng lồ khiến build chậm và không có ranh giới kiến trúc

> Phiên bản Rust/thư viện thay đổi nhanh — kiểm lại MSRV và độ duy trì crate trước khi chốt.
