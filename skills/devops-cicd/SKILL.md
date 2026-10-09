---
name: devops-cicd
description: DevOps cho MVP - Dockerfile đa tầng cho .NET, docker-compose local, CI/CD GitHub Actions, môi trường dev/staging/prod, Infrastructure as Code (Terraform/Bicep), Kubernetes/Helm hoặc PaaS, quản lý cấu hình/secret, migration khi deploy, rollback. Dùng khi cần container hoá, viết pipeline, deploy, hoặc chọn nền tảng chạy.
---

# DevOps, CI/CD & Deployment

## Đầu ra
`deploy/` (Dockerfile, compose, IaC, k8s/helm) + `.github/workflows/*.yml` + `docs/08-runbook.md`

## Chọn nền tảng chạy
| Bối cảnh | Chọn |
|---|---|
| MVP, đội nhỏ, muốn tập trung sản phẩm | **PaaS**: Azure Container Apps / App Service, Fly.io, Railway, Render |
| Đã có kinh nghiệm/yêu cầu kiểm soát, nhiều service | **Kubernetes** (AKS/EKS/GKE) + Helm |
| Một VM rẻ cho thử nghiệm | docker compose + Caddy/Traefik |
Mặc định MVP: **container + PaaS**, Kubernetes chỉ khi có nhu cầu thật.

## Dockerfile đa tầng (.NET 8)
```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY *.sln Directory.*.props ./
COPY src/ src/
RUN dotnet restore && dotnet publish src/Host/Api -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0-jammy-chiseled AS final
WORKDIR /app
COPY --from=build /app .
USER app
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
HEALTHCHECK CMD ["dotnet","Api.dll","--healthcheck"]   # hoặc dùng probe của orchestrator
ENTRYPOINT ["dotnet","Api.dll"]
```
Quy tắc: image nhỏ, non-root, pin phiên bản, `.dockerignore`, không nhúng secret.

## docker-compose local (1 lệnh chạy cả hệ)
```yaml
services:
  api:   { build: ., ports: ["8080:8080"], depends_on: [db, redis, mq], env_file: .env }
  db:    { image: postgres:16, environment: { POSTGRES_PASSWORD: dev }, volumes: [pg:/var/lib/postgresql/data] }
  redis: { image: redis:7 }
  mq:    { image: rabbitmq:3-management, ports: ["15672:15672"] }
  seq:   { image: datalust/seq, environment: { ACCEPT_EULA: "Y" }, ports: ["5341:80"] }
volumes: { pg: {} }
```

## CI/CD pipeline (GitHub Actions)
```yaml
name: ci
on: { pull_request: {}, push: { branches: [main] } }
jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with: { dotnet-version: 8.0.x }
      - run: dotnet build -c Release --warnaserror
      - run: dotnet test -c Release --no-build      # Testcontainers cần Docker (có sẵn)
      - run: dotnet list package --vulnerable --include-transitive
  image:
    needs: build-test
    if: github.ref == 'refs/heads/main'
    # build & push image (tag = git sha) → deploy staging → smoke test → manual approve → prod
```
Giai đoạn: **lint/build → test → scan (SAST, dep, secret, image) → build image → deploy staging → smoke → approve → prod**.

## Môi trường & cấu hình
- `dev` (local compose) · `staging` (giống prod, dữ liệu giả) · `prod`. Mỗi môi trường tách secret và database.
- Cấu hình 12-factor qua env; secret từ Key Vault/Secrets Manager/GitHub Environments.
- **Migration**: bước pipeline riêng (job/init container) chạy trước khi rollout; migration tương thích ngược (expand/contract).
- **Chiến lược release**: rolling/blue-green; feature flag cho tính năng chưa sẵn sàng; **rollback = redeploy image trước** (tag bất biến).
- **IaC**: Terraform/Bicep cho mọi tài nguyên cloud; state từ xa; review qua PR.
- **Kubernetes tối thiểu**: Deployment + HPA, readiness/liveness probe, resource requests/limits, Ingress + TLS (cert-manager), PodDisruptionBudget, secrets từ External Secrets.
- **Chi phí**: đặt budget alert; tắt staging ngoài giờ nếu có thể.

## Gate
- [ ] `docker compose up` dựng được hệ thống local từ clone sạch
- [ ] Merge vào main → tự deploy staging; prod có bước duyệt
- [ ] Rollback thử thành công trong < 10 phút
- [ ] Runbook: deploy, rollback, restore DB, xoay secret

## Anti-patterns
Deploy thủ công bằng SSH; dùng tag `latest`; secret trong repo/image; migration tự chạy khi app start ở nhiều replica; Kubernetes cho 1 service; staging khác prod hoàn toàn.

## Đa ngôn ngữ

| Ngôn ngữ | Base image runtime | Lệnh CI chính |
|---|---|---|
| C# | `aspnet:*-jammy-chiseled` | `dotnet build --warnaserror` · `dotnet test` · `dotnet list package --vulnerable` |
| TypeScript/JS | `node:*-slim` / distroless | `pnpm lint` · `tsc --noEmit` · `pnpm test` · `pnpm audit` |
| Go | `distroless/static` | `golangci-lint run` · `go test -race ./...` · `govulncheck ./...` |
| Rust | `distroless/cc` / `scratch` (musl) | `cargo clippy -D warnings` · `cargo nextest run` · `cargo deny check` |
| Python | `python:*-slim` | `ruff check` · `mypy --strict` · `pytest` · `pip-audit` |

Dockerfile đa tầng, non-root, pin phiên bản, path-filter trong CI cho monorepo đa ngôn ngữ; Dockerfile đầy đủ ở mục 10 của từng `lang-*`.
