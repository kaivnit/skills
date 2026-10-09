---
name: lang-python
description: Profile Python 3.12+ cho API, worker, data/ML và tự động hoá - uv, ruff, mypy/pyright, FastAPI + Pydantic v2, SQLAlchemy 2 + Alembic, asyncio, structlog/OpenTelemetry, pytest + Hypothesis + Testcontainers, import-linter, Docker, profiling; mô hình Clean/DDD bằng dataclass và Protocol. Dùng khi viết hoặc review Python, xây API FastAPI, pipeline dữ liệu, tích hợp AI/ML, hoặc chuyển nguyên tắc DDD sang Python.
---

# Python Profile

## 1. Khi nên / không nên chọn
**Nên**: dữ liệu/ETL/phân tích, ML/AI/LLM, tự động hoá, prototyping nhanh, API vừa phải (FastAPI), tích hợp nhiều thư viện khoa học. **Không nên**: dịch vụ CPU-bound độ trễ thấp ở quy mô lớn (GIL; xét Go/Rust/C#), codebase lớn không kỷ luật kiểu, mobile/UI. Dịch vụ ML nhỏ trong hệ thống C#/Go là mẫu **polyglot hợp lý** (`stack-selector`).

## 2. Toolchain
| Việc | Công cụ |
|---|---|
| Phiên bản + môi trường + lockfile | **uv** (`pyproject.toml`, `uv.lock`, `.python-version`); poetry là lựa chọn khác |
| Format + lint | **ruff** (`ruff format`, `ruff check`) |
| Kiểu tĩnh | **mypy --strict** hoặc pyright (bắt buộc cho codebase nghiêm túc) |
| Kiểm kiến trúc | **import-linter** (contracts layers/independence) |
| Bảo mật | `pip-audit`/`uv pip audit`, bandit |
| Task | `Makefile`/`just`/`nox` |

## 3. Layout → Clean/DDD
```
src/acme/ordering/
  domain/          # dataclass(frozen), value object, event — không import FastAPI/SQLAlchemy
  application/     # use case, port (Protocol), DTO
  infrastructure/  # SQLAlchemy repo, adapter, outbox
  api/             # FastAPI router, Pydantic schema, ánh xạ lỗi
src/acme/main.py   # composition root
tests/
```
`import-linter`:
```ini
[importlinter:contract:layers]
name = Clean layers
type = layers
layers = acme.ordering.api | acme.ordering.infrastructure | acme.ordering.application | acme.ordering.domain
```

## 4. Thư viện theo concern
Web: **FastAPI** (ASGI, OpenAPI tự sinh), Django (khung đầy đủ + admin) · Validation/DTO: **Pydantic v2** (ở biên) · Data: **SQLAlchemy 2.0** (async, kiểu), SQLModel · Migration: **Alembic** · Task/queue: Celery, Dramatiq, Arq, aio-pika · Log: **structlog** · Tracing: opentelemetry-python · HTTP client: httpx · Config: pydantic-settings · Dữ liệu: pandas/**polars**, DuckDB, dbt, Dagster/Airflow · Test: **pytest**, pytest-asyncio, Hypothesis, testcontainers-python, respx.

## 5. Idiom DDD (dataclass + Protocol)
```python
from dataclasses import dataclass, field
from typing import Protocol

@dataclass(frozen=True, slots=True)
class Money:
    amount_minor: int
    currency: str
    def __post_init__(self) -> None:
        if self.amount_minor < 0:
            raise DomainError("Amount must be >= 0")

@dataclass(slots=True)
class Order:
    id: OrderId
    status: OrderStatus = OrderStatus.DRAFT
    lines: list[OrderLine] = field(default_factory=list)
    _events: list[DomainEvent] = field(default_factory=list, repr=False)

    def place(self) -> None:
        if not self.lines:
            raise DomainError("Empty order")
        self.status = OrderStatus.PLACED
        self._events.append(OrderPlaced(self.id))

class OrderRepository(Protocol):          # port — cấu trúc, không cần kế thừa
    async def save(self, order: Order) -> None: ...

# API layer (Pydantic ở biên, domain thuần)
@router.post("/orders", status_code=201)
async def place_order(body: PlaceOrderRequest, uc: PlaceOrder = Depends(get_place_order)) -> OrderCreated:
    order_id = await uc(body.to_command())
    return OrderCreated(id=order_id)
```
Pydantic cho **ranh giới I/O**, `dataclass` cho domain (nhẹ, không phụ thuộc framework). Dùng `Enum`, `NewType` cho ID, `match` cho union.

## 6. Xử lý lỗi
Exception theo cây lỗi riêng (`DomainError` → `ValidationError`…); không `except Exception: pass`; dùng `raise ... from err`. Exception handler FastAPI chuyển thành **ProblemDetails** (`application/problem+json`). Với luồng thường có thể trả `Result` tự định nghĩa/`returns`, nhưng exception là idiom chuẩn.

## 7. Đồng thời
`asyncio` cho I/O (không gọi hàm chặn trong `async def` — dùng `asyncio.to_thread`/`run_in_executor`); **GIL** → CPU-bound dùng `multiprocessing`/`ProcessPoolExecutor`/công cụ native (polars, numpy) hoặc queue worker; `asyncio.TaskGroup` (3.11+) quản lý task, `asyncio.timeout`; chạy nhiều worker `uvicorn`/`gunicorn -k uvicorn.workers.UvicornWorker`. Free-threaded build (3.13+) còn thử nghiệm.

## 8. Testing
pytest (fixtures, parametrize) · domain test không mock · integration với **Testcontainers** (Postgres thật) + `httpx.AsyncClient` + `ASGITransport` · **Hypothesis** property test · coverage `pytest-cov` · `pytest -W error` bắt cảnh báo · kiểm kiến trúc `lint-imports`.
```python
def test_place_rejects_empty_order() -> None:
    with pytest.raises(DomainError, match="Empty order"):
        Order(id=OrderId.new()).place()
```

## 9. Observability
structlog JSON (`contextvars` cho `trace_id`/request id), OpenTelemetry auto-instrumentation (`opentelemetry-instrument`), `/health/live|ready`, che dữ liệu nhạy cảm bằng processor.

## 10. Docker
```dockerfile
FROM python:3.12-slim AS build
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project
COPY src ./src
RUN uv sync --frozen --no-dev
FROM python:3.12-slim
WORKDIR /app
COPY --from=build /app /app
ENV PATH="/app/.venv/bin:$PATH" PYTHONUNBUFFERED=1
USER nobody
CMD ["uvicorn", "acme.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

## 11. CI
`uv sync --frozen` → `ruff format --check` → `ruff check` → `mypy --strict src` → `lint-imports` → `pytest -q --cov` → `pip-audit` → build image.

## 12. Hiệu năng
Đo trước: `py-spy` (sampling, không cần sửa code), `cProfile`/`snakeviz`, `scalene`, `memray`; vector hoá (numpy/polars) thay vòng lặp Python; tránh N+1 SQLAlchemy (`selectinload`); `uvloop`; cache (`functools.cache`, Redis); với nút thắt CPU thật → Cython/Rust (PyO3)/dịch vụ Go-Rust.

## 13. Gate & Anti-patterns
- [ ] `mypy --strict` xanh, `ruff` sạch, import-linter xanh, lockfile commit, tests chạy trong CI
- ✗ Kiểu `Any`/dict lung tung thay model; domain phụ thuộc Pydantic/ORM; hàm chặn trong `async def`; mutable default argument; global state & import có tác dụng phụ; `pip install` không khoá phiên bản; notebook thành production code không test; bắt `Exception` rộng
