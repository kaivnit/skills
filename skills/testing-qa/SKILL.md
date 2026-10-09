---
name: testing-qa
description: Chiến lược kiểm thử cho MVP - test pyramid, unit/integration/contract/E2E, TDD, Testcontainers, architecture test, test hiệu năng, test dữ liệu, quality gate trong CI. Dùng khi cần viết test, đặt chiến lược test, tăng độ tin cậy trước release, hoặc debug test flaky.
---

# Testing & QA

## Đầu ra
Bộ test chạy trong CI + `docs/07-test-strategy.md`

## Test pyramid (tỉ lệ gợi ý 70 / 20 / 10)
| Tầng | Công cụ (.NET / Web) | Phạm vi |
|---|---|---|
| Unit | xUnit, FluentAssertions, NSubstitute / Vitest | Domain, validator, hàm thuần — không I/O |
| Integration | **WebApplicationFactory + Testcontainers** (Postgres, Redis, RabbitMQ) | Handler + DB thật + API |
| Contract | OpenAPI diff, Pact (khi có consumer ngoài) | Không phá vỡ API |
| Architecture | NetArchTest | Quy tắc phụ thuộc/module |
| E2E | Playwright | 3–5 flow quan trọng nhất |
| Non-functional | k6 (tải), OWASP ZAP (bảo mật) | Theo NFR |

## Nguyên tắc
- **Domain test không mock**: aggregate test bằng giá trị thật; chỉ mock ranh giới (cổng ra ngoài).
- **DB thật trong integration test** (Testcontainers) thay vì InMemory — InMemory che giấu lỗi SQL/constraint.
- Đặt tên: `Method_Scenario_ExpectedResult`; mỗi test 1 lý do fail; AAA (Arrange-Act-Assert).
- Dữ liệu test dựng bằng builder/Bogus; mỗi test độc lập, không phụ thuộc thứ tự.
- **Không sleep** — chờ điều kiện (polling có timeout). Test flaky = bug, sửa ngay hoặc cách ly có issue.

## Ví dụ
```csharp
public class OrderTests
{
    [Fact]
    public void Place_WithNoLines_Throws()
    {
        var order = Order.Create(CustomerId.New());
        var act = () => order.Place();
        act.Should().Throw<DomainException>().WithMessage("Empty order");
    }
}

public class PlaceOrderApiTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Fact]
    public async Task Post_ValidOrder_Returns201_AndPersists()
    {
        var client = factory.CreateAuthenticatedClient();
        var res = await client.PostAsJsonAsync("/api/v1/orders", Fixtures.ValidOrder());
        res.StatusCode.Should().Be(HttpStatusCode.Created);
        (await factory.Db.Orders.CountAsync()).Should().Be(1);
    }
}

[Fact] public void Domain_ShouldNot_DependOn_Infrastructure() =>
    Types.InAssembly(typeof(Order).Assembly).ShouldNot().HaveDependencyOn("Microsoft.EntityFrameworkCore")
         .GetResult().IsSuccessful.Should().BeTrue();
```

## Quy trình
1. Từ acceptance criteria → test case (mỗi Gherkin = ≥ 1 test).
2. TDD cho domain; test-after chấp nhận được cho glue code.
3. Quality gate CI: build + unit + integration + architecture + lint; coverage tham khảo (≥ 70% domain/application) — **không** dùng coverage làm mục tiêu duy nhất.
4. Smoke test sau deploy lên staging; test hồi quy cho mỗi bug đã sửa.
5. Test tải k6 theo NFR trước launch (kịch bản = flow chính, tải = đỉnh ×2).
6. Exploratory test thủ công theo charter trước release.

## Gate
- [ ] Mỗi Must-story có ≥ 1 integration/E2E test
- [ ] CI chặn merge khi test đỏ
- [ ] Load test đạt p95 theo NFR
- [ ] Không còn test flaky bị bỏ qua

## Anti-patterns
Mock mọi thứ khiến test chỉ kiểm mock; test phụ thuộc thứ tự/dữ liệu chung; E2E quá nhiều và chậm; theo đuổi 100% coverage; `[Skip]` để pass CI.
