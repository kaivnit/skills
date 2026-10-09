---
name: code-quality-refactoring
description: Giữ chất lượng code C#/.NET - nhận diện code smell, nguyên tắc SOLID/DRY/KISS/YAGNI, refactoring an toàn có test, áp dụng Design Patterns đúng chỗ, static analysis (Roslyn analyzers, SonarQube), quản lý nợ kỹ thuật, checklist code review. Dùng khi review code, code khó đọc/khó sửa, cần refactor, hoặc thiết lập chuẩn chất lượng cho team.
---

# Code Quality & Refactoring

## Đầu ra
Chuẩn chất lượng trong repo (analyzers, `.editorconfig`), danh sách nợ kỹ thuật `docs/tech-debt.md`, refactor nhỏ có test đi kèm.

## 1. Nguyên tắc nền
- **SOLID**: SRP (một lý do thay đổi) · OCP (mở rộng không sửa) · LSP · ISP (interface nhỏ) · DIP (phụ thuộc trừu tượng).
- **DRY** đúng nghĩa là trùng *tri thức*, không phải trùng chữ; **KISS**; **YAGNI** — đừng thêm abstraction cho nhu cầu chưa xảy ra. Quy tắc 3: trùng lần thứ ba mới trích xuất.
- Tên gọi theo **Ubiquitous Language**; hàm làm một việc; ít tham số (≤ 3); tránh cờ boolean (`bool isAdmin`) → tách hàm hoặc enum.

## 2. Code smell → hướng xử lý
| Smell | Dấu hiệu | Refactor |
|---|---|---|
| Long method / God class | > 30 dòng, nhiều trách nhiệm | Extract Method/Class, tách theo use case |
| Anemic domain | Entity chỉ getter/setter, logic ở service | Move Method vào Aggregate (`architecture-ddd`) |
| Primitive obsession | `string email`, `decimal price` khắp nơi | Value Object (`Email`, `Money`) |
| Switch/if lặp theo kiểu | `switch (type)` ở nhiều nơi | Strategy / polymorphism |
| Feature envy | Method dùng dữ liệu lớp khác nhiều hơn dữ liệu mình | Move Method |
| Shotgun surgery | Một thay đổi sửa 8 file | Gom về một module |
| Duplicate code | Khối lặp | Extract + đặt tên theo nghiệp vụ |
| Deep nesting | > 3 cấp | Guard clause, early return |
| Magic number/string | `if (status == 3)` | Enum/hằng/Value Object |
| Temporal coupling | Phải gọi A rồi B | Builder / ép qua constructor |

## 3. Refactoring an toàn
1. **Có test bao quanh** trước (characterization test nếu code cũ chưa có).
2. Bước nhỏ, build + test sau mỗi bước; **không trộn refactor với đổi hành vi** (hai commit riêng: `refactor:` và `feat:/fix:` — `conventional-commit`).
3. Dùng công cụ IDE (Rename, Extract, Move) thay vì sửa tay; Roslyn code fixes.
4. Kỹ thuật cho code cũ: *Strangler Fig*, *Branch by Abstraction*, *Parallel Run* (`legacy-migration`).
5. Quy tắc Boy Scout: để chỗ mình đụng vào sạch hơn một chút, không gom thành "đại tu".

## 4. Ví dụ: guard clause + Value Object + Strategy
```csharp
// Trước
public decimal Total(Order o, string customerType) {
    decimal t = 0;
    if (o != null) { if (o.Lines.Count > 0) {
        foreach (var l in o.Lines) t += l.Qty * l.Price;
        if (customerType == "VIP") t *= 0.9m; else if (customerType == "STAFF") t *= 0.8m;
    } }
    return t;
}
// Sau
public Money Total(Order order, IDiscountPolicy discount)
{
    ArgumentNullException.ThrowIfNull(order);
    if (order.Lines.Count == 0) return Money.Zero;
    var subtotal = order.Lines.Aggregate(Money.Zero, (s, l) => s.Add(l.UnitPrice.Multiply(l.Quantity)));
    return discount.Apply(subtotal);          // VipDiscount, StaffDiscount, NoDiscount ...
}
```

## 5. Design Patterns: dùng khi có vấn đề, không để trang trí
Strategy (chính sách đổi được) · Decorator (cross-cutting qua MediatR behavior) · Factory (tạo aggregate hợp lệ) · Adapter/ACL (bên thứ ba) · Observer (domain event) · Specification (điều kiện nghiệp vụ tái sử dụng) · Builder (test data). Nếu pattern làm code dài hơn mà không bớt phức tạp → bỏ.

## 6. Tự động hoá chất lượng
- `.editorconfig` + `EnforceCodeStyleInBuild`, **Roslyn analyzers** (`Microsoft.CodeAnalysis.NetAnalyzers`, SonarAnalyzer, Meziantou), `TreatWarningsAsErrors`; `dotnet format --verify-no-changes` trong CI.
- Nullable reference types bật; nghiêm ngặt với `!` (null-forgiving).
- SonarQube/SonarCloud: theo dõi bug, vulnerability, code smell, duplication, coverage trên **code mới** (quality gate).
- NetArchTest bảo vệ kiến trúc; mutation testing (Stryker.NET) cho domain quan trọng.
- Metric tham khảo, không thành mục tiêu: độ phức tạp cyclomatic < 10/hàm, coupling giữa module thấp.

## 7. Code review checklist
Đúng chức năng & biên · Tên rõ nghĩa · Một trách nhiệm · Xử lý lỗi/ `CancellationToken` · Bảo mật (input, quyền, secret) · Test đủ & có ý nghĩa · Không rò rỉ domain qua API · Hiệu năng ở đường nóng (N+1) · Tài liệu/ADR nếu quyết định lớn.

## 8. Quản lý nợ kỹ thuật
Ghi vào `docs/tech-debt.md`: *mô tả · lý do vay · chi phí lãi (chậm bao nhiêu) · cách trả · mức ưu tiên*. Dành ~15–20% mỗi sprint trả nợ; nợ có chủ đích (để kịp MVP) phải có ngày xem lại.

## Gate
- [ ] Build với analyzers không warning; `dotnet format` sạch trong CI
- [ ] Quality gate (Sonar) cho code mới đạt
- [ ] Refactor luôn có test và commit tách riêng
- [ ] Danh sách nợ kỹ thuật có ưu tiên và chủ

## Anti-patterns
Refactor lớn không test; over-engineering (abstraction cho một implementation duy nhất, "cho tương lai"); generic repository bọc DbContext; comment giải thích code rối thay vì sửa code; dùng pattern để khoe; "rewrite from scratch" khi có thể refactor từng bước.

## Đa ngôn ngữ

| Ngôn ngữ | Format / lint | Kiểm kiểu | Smell đặc thù |
|---|---|---|---|
| C# | `dotnet format`, Roslyn analyzers | nullable reference types | Generic Repository bọc DbContext |
| TypeScript/JS | Biome hoặc ESLint + Prettier | `tsc --strict` (JS: checkJs) | `any` lan tràn, Promise không await |
| Go | gofmt, golangci-lint | compiler | Interface to đặt cạnh implementation, `utils` package |
| Rust | rustfmt, clippy `-D warnings` | compiler | `clone()`/`Rc<RefCell>` để né borrow checker, `unwrap()` |
| Python | ruff | mypy --strict / pyright | `Any`, mutable default, bắt `Exception` rộng |

SOLID, DRY, KISS, YAGNI áp dụng ở mọi ngôn ngữ nhưng thể hiện khác nhau (Go: interface nhỏ ở nơi dùng; Rust: trait + kiểu làm trạng thái sai không biểu diễn được).
