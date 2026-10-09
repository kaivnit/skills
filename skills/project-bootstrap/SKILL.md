---
name: project-bootstrap
description: Dựng khung solution .NET Modular Monolith chạy được ngay trong ngày đầu - cấu trúc thư mục, Directory.Build.props, analyzers, .editorconfig, module registration, health check, docker-compose, CI, test architecture. Dùng khi bắt đầu codebase mới, "scaffold dự án", "tạo solution", "khởi tạo repo", hoặc cần module mẫu để nhân bản.
---

# Project Bootstrap (.NET Modular Monolith)

## Đầu ra
Repo clone về là `docker compose up` chạy được: API `/health/ready` xanh, 1 module mẫu có test, CI xanh.

## Thứ tự dựng khung
1. `git init` + `.gitignore` (dotnet, node) + `.editorconfig` + `LICENSE`; quy ước commit theo `conventional-commit`.
2. Solution + cấu trúc từ `architecture-ddd`:
   ```bash
   dotnet new sln -n Acme
   dotnet new webapi -minimal -n Acme.Api -o src/Host/Api
   for l in Domain Application Infrastructure Contracts; do
     dotnet new classlib -n Acme.Ordering.$l -o src/Modules/Ordering/Acme.Ordering.$l; done
   dotnet new classlib -n Acme.BuildingBlocks -o src/BuildingBlocks
   dotnet new xunit -n Acme.Ordering.Tests -o tests/Ordering.Tests
   dotnet new xunit -n Acme.Architecture.Tests -o tests/Architecture.Tests
   dotnet sln add $(find src tests -name '*.csproj')
   ```
3. **`Directory.Build.props`** — chuẩn hoá toàn solution:
   ```xml
   <Project>
     <PropertyGroup>
       <TargetFramework>net8.0</TargetFramework>
       <Nullable>enable</Nullable>
       <ImplicitUsings>enable</ImplicitUsings>
       <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
       <AnalysisLevel>latest-recommended</AnalysisLevel>
       <EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>
       <InvariantGlobalization>true</InvariantGlobalization>
     </PropertyGroup>
     <ItemGroup>
       <PackageReference Include="SonarAnalyzer.CSharp" PrivateAssets="all" />
     </ItemGroup>
   </Project>
   ```
   Dùng **Central Package Management** (`Directory.Packages.props`) để một nơi quản lý phiên bản.
4. **Module contract** — mỗi module tự đăng ký, Host không biết nội bộ:
   ```csharp
   public interface IModule
   {
       string Name { get; }
       void AddServices(IServiceCollection s, IConfiguration c);
       void MapEndpoints(IEndpointRouteBuilder e);
   }
   // Program.cs
   var modules = new IModule[] { new OrderingModule() };
   foreach (var m in modules) m.AddServices(builder.Services, builder.Configuration);
   var app = builder.Build();
   foreach (var m in modules) m.MapEndpoints(app);
   ```
5. **Nền tảng cắt ngang ngay từ đầu**: Serilog + OpenTelemetry (`observability`), ProblemDetails + `IExceptionHandler`, FluentValidation, MediatR pipeline, health checks, `IOptions` có validate, CORS/HSTS (`security-auth`).
6. **Hạ tầng local**: `deploy/docker-compose.yml` (Postgres, Redis, RabbitMQ, Seq) + `.env.example` (`devops-cicd`).
7. **Test mẫu**: 1 domain unit test, 1 integration test (Testcontainers), 1 architecture test chặn Domain phụ thuộc Infrastructure và chặn module gọi nội bộ module khác.
8. **CI** `.github/workflows/ci.yml`: restore → build `--warnaserror` → test → vulnerable-package scan; thêm `commitlint` workflow.
9. **Frontend** (nếu có): `web/` từ Vite/Next + openapi client generate script + ESLint/Prettier + Vitest + Playwright (`frontend-web`).
10. **Tài liệu**: `README.md` (chạy local trong 3 lệnh), `docs/adr/0001-modular-monolith.md`, `CONTRIBUTING.md`.
11. **Makefile/justfile**: `make up|down|test|migrate|lint` để ai cũng chạy cùng một lệnh.

## Module mẫu (vertical slice)
Mỗi module: `Domain` (aggregate + test) → `Application` (1 command + validator + handler) → `Infrastructure` (EF config + schema riêng + migration) → endpoint `POST`. Nhân bản module này khi thêm bounded context mới.

## Gate
- [ ] Clone sạch → `make up` → `curl /health/ready` = 200
- [ ] `dotnet build` không warning, `dotnet test` xanh, CI xanh
- [ ] Architecture test fail khi cố tình vi phạm phụ thuộc (đã thử)
- [ ] README hướng dẫn người mới chạy được dưới 10 phút

## Anti-patterns
Copy cấu trúc từ template tải về mà không hiểu; tạo sẵn 10 module rỗng; bỏ qua analyzers "để sau"; migration chạy tự động lúc app start; không có lệnh thống nhất để chạy dự án.
