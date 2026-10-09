---
name: data-engineering
description: Kỹ thuật dữ liệu cho MVP - thiết kế event/tracking schema, pipeline ETL/ELT, CDC, data warehouse/lakehouse, dbt, orchestration, data quality, analytics dashboard đo success metric, cơ bản về feature/ML. Dùng khi cần phân tích dữ liệu sản phẩm, xây pipeline báo cáo, đồng bộ dữ liệu OLTP sang kho phân tích.
---

# Data Engineering

## Đầu ra
`docs/10-data-plan.md` (tracking plan, pipeline, metric definitions) + pipeline chạy được

## Nguyên tắc MVP
Đừng dựng Kafka + Spark + lakehouse trước khi cần. Lộ trình tăng dần:

| Giai đoạn | Giải pháp |
|---|---|
| 0 — ngay MVP | SQL trực tiếp trên **read replica** + Metabase/Grafana; bảng `events` trong Postgres |
| 1 — có người dùng | ELT vào **warehouse** (BigQuery / Snowflake / ClickHouse / DuckDB+Parquet) bằng Airbyte/Fivetran/CDC; **dbt** cho transform |
| 2 — quy mô lớn/realtime | Kafka/Redpanda + stream processing, lakehouse (Iceberg/Delta) |

## Quy trình
1. **Metric tree**: North Star → input metrics → định nghĩa chính xác (công thức, nguồn, bộ lọc). Một định nghĩa duy nhất cho mỗi metric.
2. **Tracking plan**: bảng event `tên | khi nào bắn | thuộc tính | owner`. Quy ước `object_action` (`order_placed`). Schema có version; PII tách riêng.
   ```json
   { "event":"order_placed","event_id":"uuid","occurred_at":"2026-01-01T10:00:00Z",
     "user_id":"u_123","props":{"order_id":"o_9","amount":"12.50","currency":"USD"},"schema_version":1 }
   ```
3. **Nguồn dữ liệu**: (a) domain/integration event qua **Outbox** (chuẩn nhất), (b) CDC từ WAL (Debezium) cho bảng, (c) client analytics (PostHog/Segment).
4. **Pipeline ELT**: `Extract → Load raw (bất biến) → Transform (dbt: staging → intermediate → marts)`. Idempotent, chạy lại được (partition theo ngày, `MERGE`/upsert).
5. **Orchestration**: cron/GitHub Actions cho MVP → Dagster/Airflow khi có nhiều phụ thuộc.
6. **Data quality**: test dbt (`not_null`, `unique`, `relationships`, `accepted_values`), kiểm freshness, volume anomaly; alert khi vỡ.
7. **Mô hình hoá**: star schema (fact/dim) cho BI; slowly changing dimension khi cần lịch sử.
8. **Quản trị**: phân quyền theo vai trò, che/băm PII, retention, lineage cơ bản, catalog tài liệu.
9. **Dashboard**: cho *product* (funnel, retention cohort), *vận hành* (độ trễ, lỗi), *kinh doanh* (doanh thu).
10. **ML (tuỳ chọn)**: chỉ khi có bài toán rõ; bắt đầu bằng rule/heuristic → model đơn giản; feature từ warehouse; theo dõi drift.

## Ví dụ dbt model
```sql
-- models/marts/fct_orders.sql
select o.order_id, o.customer_id, date_trunc('day', o.placed_at) as order_date,
       sum(l.quantity * l.unit_amount) as revenue
from {{ ref('stg_orders') }} o
join {{ ref('stg_order_lines') }} l using (order_id)
group by 1,2,3
```

## Gate
- [ ] Success metric của brief xem được trên dashboard, định nghĩa thống nhất
- [ ] Pipeline idempotent, có test chất lượng & cảnh báo
- [ ] Không có PII thô trong tầng analytics không cần thiết

## Anti-patterns
Truy vấn analytics nặng trên DB primary; mỗi dashboard một định nghĩa metric khác nhau; không version schema event; xây stream platform khi batch hằng giờ là đủ.

## Đa ngôn ngữ

Python là mặc định cho data (polars, DuckDB, dbt, Dagster/Airflow, thư viện ML). Service ingest/streaming hiệu năng cao có thể viết bằng Go hoặc Rust; dịch vụ nghiệp vụ giữ nguyên ngôn ngữ của hệ thống. Ranh giới giữa các phần là schema event có version (`lang-python` mục 4, `stack-selector` mục 2).
