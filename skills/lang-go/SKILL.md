---
name: lang-go
description: Profile Go cho API, worker, CLI và công cụ hạ tầng - toolchain, layout cmd/internal theo Hexagonal/Clean, net/http + chi, pgx + sqlc, slog, goroutine/context/errgroup, xử lý lỗi bằng giá trị, testing table-driven + testcontainers, golangci-lint, Docker distroless, pprof. Dùng khi viết hoặc review code Go, thiết kế service Go, hoặc chuyển nguyên tắc DDD sang Go.
---

# Go Profile

## 1. Khi nên / không nên chọn
**Nên**: service mạng đồng thời cao, gateway/proxy, worker, CLI và tooling, triển khai một binary tĩnh, build nhanh, đội cần ngôn ngữ nhỏ dễ đọc. **Không nên**: miền nghiệp vụ rất giàu hành vi cần hệ kiểu biểu đạt cao (generic/sum type hạn chế), ML/data science (Python), UI.

## 2. Toolchain
| Việc | Công cụ |
|---|---|
| Phiên bản | `go.mod` (`go` + `toolchain` directive), `mise`/`asdf` |
| Build | `go build ./...`, `-trimpath -ldflags="-s -w"` cho release |
| Format | `gofmt`/`goimports` (không tranh cãi style) |
| Lint | **golangci-lint** (govet, staticcheck, errcheck, gosec, revive, depguard) |
| Vuln | `govulncheck ./...` |
| Task | `Makefile`/`just`; `go generate` cho sqlc/mock/proto |

## 3. Layout → Hexagonal/Clean
```
cmd/api/main.go                # composition root, wiring thủ công
internal/ordering/
  domain/        # entity, value object, event, lỗi — không import ngoài stdlib
  app/           # use case (command/query handler), port (interface do người DÙNG định nghĩa)
  adapters/
    postgres/    # repo (sqlc/pgx)
    http/        # handler chi, ánh xạ lỗi → ProblemDetails
    amqp/        # publisher/consumer, outbox
internal/platform/             # log, config, otel, db
```
`internal/` ngăn import ngoài module. **Interface đặt ở nơi sử dụng** (app), nhỏ (1–3 method), không đặt cạnh implementation. Kiểm quy tắc bằng `depguard` hoặc `go-arch-lint`.

## 4. Thư viện theo concern
Web: `net/http` (1.22+ có routing method/pattern) + **chi**; Echo/Gin nếu đội quen · Validation: go-playground/validator + ràng buộc trong constructor domain · Data: **pgx + sqlc** (SQL được kiểm lúc biên dịch) / GORM/ent · Migration: goose, atlas, golang-migrate · Messaging: amqp091-go, watermill, nats.go · Log: `log/slog` · Tracing: otel-go (`otelhttp`, `otelpgx`) · Config: env (`envconfig`/`koanf`) · Test: stdlib `testing`, testify, testcontainers-go · Resilience: `context` timeout + retry thư viện nhỏ.

## 5. Idiom DDD
```go
package domain

type Money struct{ amountMinor int64; currency string }

func NewMoney(minor int64, cur string) (Money, error) {
	if minor < 0 { return Money{}, ErrNegativeAmount }
	return Money{minor, cur}, nil
}

type Order struct {
	id     OrderID
	status Status
	lines  []Line
	events []Event
}

func (o *Order) Place() error {
	if len(o.lines) == 0 { return ErrEmptyOrder }
	o.status = Placed
	o.events = append(o.events, OrderPlaced{OrderID: o.id})
	return nil
}
func (o *Order) PullEvents() []Event { e := o.events; o.events = nil; return e }

// app layer: port do use case sở hữu
type OrderRepo interface { Save(ctx context.Context, o *domain.Order) error }

type PlaceOrderHandler struct{ repo OrderRepo; tx TxManager }

func (h PlaceOrderHandler) Handle(ctx context.Context, cmd PlaceOrder) (domain.OrderID, error) {
	o, err := domain.NewOrder(cmd.CustomerID, cmd.Lines)
	if err != nil { return "", fmt.Errorf("new order: %w", err) }
	if err := o.Place(); err != nil { return "", err }
	return o.ID(), h.tx.Do(ctx, func(ctx context.Context) error { return h.repo.Save(ctx, o) })
}
```
Trường không export + constructor trả `error` để bảo vệ invariant. Không cần MediatR/DI container: handler là struct + method, nối dây ở `main`.

## 6. Xử lý lỗi
Lỗi là **giá trị**: trả `error`, không panic cho luồng thường. Bọc ngữ cảnh `fmt.Errorf("...: %w", err)`; so khớp bằng `errors.Is/As`; lỗi sentinel/kiểu riêng ở domain (`ErrEmptyOrder`). Adapter HTTP ánh xạ → ProblemDetails (`errors.Is(err, domain.ErrEmptyOrder)` → 422). `panic` chỉ cho lỗi lập trình; recover middleware ở biên.

## 7. Đồng thời
Mỗi goroutine **phải có đường thoát**: truyền `context.Context` (tham số đầu), `errgroup.Group` để chạy song song có huỷ và gom lỗi, kênh có chủ sở hữu đóng, `sync.WaitGroup`/`sync.Once`. Tránh rò rỉ goroutine, kênh không đệm gây deadlock, chia sẻ bộ nhớ không khoá — chạy test với `-race`. Graceful shutdown: `signal.NotifyContext` + `http.Server.Shutdown`.

## 8. Testing
Table-driven test + `t.Run`; test domain thuần không mock; fake in-memory cho port hoặc **testcontainers-go** (Postgres thật); `go test -race -cover ./...`; fuzz (`go test -fuzz`); golden file; `httptest` cho handler.
```go
func TestPlace_EmptyOrder(t *testing.T) {
	o, _ := domain.NewOrder("c1", nil)
	if err := o.Place(); !errors.Is(err, domain.ErrEmptyOrder) { t.Fatalf("got %v", err) }
}
```

## 9. Observability
`slog` JSON handler + `slog.With("trace_id", ...)`; `otelhttp` middleware; metrics Prometheus/OTel; `/healthz` + `/readyz`; bật `net/http/pprof` trên cổng nội bộ.

## 10. Docker
```dockerfile
FROM golang:1.23 AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/api ./cmd/api
FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/api /api
ENTRYPOINT ["/api"]
```

## 11. CI
`go mod tidy -diff` (kiểm sạch) → `gofmt -l .` → `golangci-lint run` → `go vet ./...` → `go test -race -cover ./...` → `govulncheck ./...` → `go build ./...`.

## 12. Hiệu năng
`pprof` (CPU/heap/goroutine/mutex), `go test -bench -benchmem`, `benchstat`, `go tool trace`; giảm cấp phát (tái dùng buffer `sync.Pool`, preallocate slice), tránh `interface{}` nóng, đặt `GOMEMLIMIT`/`GOMAXPROCS` đúng trong container.

## 13. Gate & Anti-patterns
- [ ] `-race` xanh, `golangci-lint` sạch, `govulncheck` sạch, shutdown graceful
- ✗ Interface to đặt cạnh implementation; `init()` và biến toàn cục có trạng thái; bỏ qua `error`; goroutine không `context`; `panic` làm luồng điều khiển; package `utils`/`common`; nhái DDD kiểu Java/C# (getter/setter, factory dày đặc, DI container) thay vì idiom Go

> Ví dụ trên viết cho Go 1.22+. Kiểm lại phiên bản toolchain/thư viện hiện hành trước khi chốt.
