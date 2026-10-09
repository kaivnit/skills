---
name: system-design
description: Phân tích yêu cầu phi chức năng, ước lượng tải/dung lượng, vẽ sơ đồ C4, chọn thành phần hạ tầng (cache, queue, storage) và đánh đổi (CAP, consistency, latency) cho hệ thống. Dùng khi người dùng hỏi "thiết kế hệ thống", "capacity planning", "chịu bao nhiêu user", "chọn Redis/RabbitMQ/CDN", hoặc cần tài liệu system design.
---

# System Design

## Đầu ra
`docs/03-system-design.md`

## Quy trình
1. **Yêu cầu chức năng cốt lõi** (từ brief) + **NFR có số liệu**:
   | NFR | Ví dụ MVP |
   |---|---|
   | Tải | 1.000 DAU, đỉnh 50 RPS |
   | Latency | p95 API < 300 ms |
   | Availability | 99.5% (~3.6h downtime/tháng) |
   | Dữ liệu | 5 GB năm đầu, RPO 15 phút, RTO 1h |
   | Bảo mật | PII mã hoá at-rest, audit log |
2. **Back-of-envelope**: `RPS = DAU × hành động/ngày ÷ 86.400 × hệ số đỉnh (3–10)`; `storage = bản ghi/ngày × kích thước × 365 × replication`. Ghi giả định rõ.
3. **C4**: Level 1 (Context) và Level 2 (Container); Level 3 chỉ cho phần phức tạp.
   ```mermaid
   flowchart LR
     U[User] --> CDN --> FE[Web SPA]
     FE --> GW[API - ASP.NET Core]
     GW --> DB[(PostgreSQL)]
     GW --> R[(Redis cache)]
     GW --> MQ[[RabbitMQ]]
     MQ --> W[Worker]
     W --> DB
     GW --> OBS[Seq / OTel]
   ```
4. **Chọn thành phần theo nhu cầu, không theo thời thượng**:
   | Nhu cầu | Mặc định MVP | Chỉ nâng cấp khi |
   |---|---|---|
   | OLTP | PostgreSQL / SQL Server | cần scale ghi vượt 1 node |
   | Cache | Redis (cache-aside) | đã đo được hot path |
   | Async/Job | Hangfire hoặc RabbitMQ + worker | cần fan-out/độ tin cậy cao |
   | Search | DB full-text | cần relevance/facet → OpenSearch |
   | File | Object storage (S3/Blob) + CDN | — |
   | Realtime | SignalR | > vài chục nghìn kết nối → Azure SignalR |
5. **Đánh đổi chính**: consistency vs availability (CAP/PACELC), sync vs async, đọc nhiều vs ghi nhiều, build vs buy. Mỗi lựa chọn → 1 ADR.
6. **Scaling path** (vẽ sẵn, chưa làm): stateless API → scale ngang; read replica; cache; partition; tách service.
7. **Failure modes**: với mỗi dependency hỏi "nếu nó chết thì sao?" → timeout, retry có backoff+jitter, circuit breaker (Polly), idempotency key, graceful degradation.
8. **Rủi ro & chi phí**: ước lượng chi phí hạ tầng/tháng cho MVP.

## Gate
- [ ] NFR có con số và cách đo
- [ ] Sơ đồ C4 L1–L2
- [ ] Mỗi thành phần hạ tầng có lý do; phần "để sau" ghi rõ trigger nâng cấp
- [ ] Failure mode cho dependency quan trọng

## Anti-patterns
Thiết kế cho 10 triệu user khi chưa có 100; thêm Kafka/Kubernetes "cho chắc"; không có số liệu NFR; quên idempotency ở API thanh toán/đặt hàng.
