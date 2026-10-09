---
name: conventional-commit
description: Viết commit message (và tiêu đề PR) đúng chuẩn Conventional Commits 1.0.0 - type, scope, description, body, footer, BREAKING CHANGE, revert, liên kết với SemVer và changelog tự động. Dùng mỗi khi tạo git commit, squash/merge commit, tiêu đề pull request, đặt quy ước commit cho repo, hoặc khi người dùng nói "commit", "viết commit message", "conventional commits".
---

# Conventional Commits 1.0.0

Spec gốc: https://www.conventionalcommits.org/en/v1.0.0/

## Cấu trúc

```
<type>[optional scope][!]: <description>

[optional body]

[optional footer(s)]
```

- Dòng đầu (header) là **bắt buộc**; body và footer tuỳ chọn, **cách header đúng một dòng trống**.
- `type` + `: ` (dấu hai chấm và **một khoảng trắng**) + `description`.
- Mỗi footer cách body một dòng trống.

## Type

| Type | Dùng khi | SemVer |
|---|---|---|
| `feat` | Thêm tính năng mới cho người dùng/API | **MINOR** |
| `fix` | Sửa lỗi | **PATCH** |
| `docs` | Chỉ đổi tài liệu | — |
| `style` | Định dạng, khoảng trắng, dấu chấm phẩy (không đổi logic) | — |
| `refactor` | Đổi cấu trúc code, không sửa lỗi, không thêm tính năng | — |
| `perf` | Cải thiện hiệu năng | — |
| `test` | Thêm/sửa test | — |
| `build` | Hệ thống build, dependency (csproj, npm, Dockerfile) | — |
| `ci` | Cấu hình CI/CD (GitHub Actions…) | — |
| `chore` | Việc vặt không đụng src/test (cấu hình, script) | — |
| `revert` | Hoàn tác commit trước | — |

Chỉ `feat` và `fix` do spec quy định; các type còn lại là quy ước phổ biến (Angular) và được phép theo spec. Mọi commit có **breaking change** → **MAJOR**, bất kể type.

## Scope

Danh từ trong ngoặc đơn, mô tả vùng code bị ảnh hưởng: `feat(ordering): ...`. Với repo này dùng tên skill hoặc module: `docs(architecture-ddd)`, `feat(api-design)`. Với dự án Modular Monolith: tên module (`ordering`, `payments`, `identity`) hoặc tầng (`api`, `infra`, `web`, `deploy`). Giữ danh sách scope ngắn, nhất quán; bỏ scope nếu thay đổi chạm nhiều nơi.

## Description (dòng đầu)

- Thể **mệnh lệnh, hiện tại**: *add*, *fix*, *remove* — không "added", "adds", "fixed".
- Viết thường chữ đầu, **không dấu chấm cuối**, mục tiêu ≤ 50 ký tự, tối đa 72.
- Nói *thay đổi gì*, không nói *làm thế nào*; có thể viết tiếng Việt hoặc Anh nhưng **thống nhất trong repo** (type/scope luôn tiếng Anh).

## Body

Giải thích **vì sao** và bối cảnh (không lặp lại diff). Wrap ~72–100 cột. Có thể nhiều đoạn, cách nhau dòng trống.

## Footer

Định dạng `token: value` hoặc `token #value` (git trailer). Token dùng `-` thay khoảng trắng (`Reviewed-by`, `Refs`, `Closes`), **ngoại lệ duy nhất**: `BREAKING CHANGE`.

```
Closes: #123
Refs: #120, #121
Reviewed-by: Name
```

## Breaking change (hai cách, có thể dùng cả hai)

1. Dấu `!` ngay trước dấu `:` — `feat(api)!: remove v1 orders endpoint`
2. Footer **viết hoa**, kèm mô tả: `BREAKING CHANGE: GET /api/v1/orders now requires cursor pagination`

```
feat(api)!: replace offset pagination with cursor pagination

Offset pagination caused unbounded scans on large order tables.

BREAKING CHANGE: `page` and `pageSize` query params are removed; use `cursor` and `limit`.
Closes: #87
```

## Revert

```
revert: let us never again speak of the noodle incident

Refs: 676104e, a215868
```

## Ví dụ

```
feat(ordering): add PlaceOrder command handler
fix(payments): prevent double charge when Idempotency-Key is reused
refactor(domain): extract Money value object from Order aggregate
perf(database): add composite index on orders(customer_id, created_at)
test(architecture): enforce Domain does not depend on Infrastructure
build(deps): bump Npgsql to 8.0.4
ci: run Testcontainers integration tests on pull requests
docs(readme): document plugin installation
chore: add .editorconfig
```

## Quy trình khi tạo commit

1. Xem thay đổi: `git status`, `git diff --staged`.
2. **Một commit = một thay đổi logic.** Nếu diff trộn `feat` + `refactor` + `docs`, tách thành nhiều commit (`git add -p`).
3. Chọn *type* theo tác động lên người dùng/hành vi, không theo file bị sửa: sửa bug nằm trong file test vẫn là `fix` nếu bug ở code, `test` nếu chỉ thêm test.
4. Xác định scope (nếu có), có breaking change không → thêm `!` + footer.
5. Viết header → body (nếu cần giải thích *vì sao*) → footer (issue, breaking, trailer).
6. Nếu môi trường/hook yêu cầu trailer attribution (ví dụ `Co-Authored-By:`), thêm vào **cuối footer**, sau một dòng trống — không làm hỏng header.
7. Truyền message nhiều dòng an toàn:
   ```bash
   git commit -F - <<'EOF'
   fix(payments): prevent double charge on retry

   Reuse of the Idempotency-Key created a second capture.

   Closes: #42
   EOF
   ```

## Liên quan tới các skill khác

- **`devops-cicd`**: thêm bước lint commit (commitlint hoặc `cocogitto`) vào CI/PR; dùng `release-please` / `semantic-release` / GitVersion để tự tính phiên bản SemVer và sinh `CHANGELOG.md` từ lịch sử commit.
- **PR / squash merge**: tiêu đề PR cũng theo Conventional Commits vì squash commit lấy tiêu đề PR.
- **`mvp-launch-readiness`**: changelog sinh tự động dùng làm release notes.

### Cấu hình commitlint mẫu

```js
// commitlint.config.js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],
    'header-max-length': [2, 'always', 72],
    'scope-enum': [1, 'always', ['api', 'web', 'infra', 'deploy', 'ordering', 'payments', 'identity']],
  },
};
```

```yaml
# .github/workflows/commitlint.yml
name: commitlint
on: { pull_request: {} }
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: wagoid/commitlint-github-action@v6
```

## Checklist trước khi commit

- [ ] Header đúng `type(scope)!: description`, mệnh lệnh, không dấu chấm cuối, ≤ 72 ký tự
- [ ] `feat`/`fix` chỉ dùng khi thực sự đổi hành vi; còn lại dùng type phù hợp
- [ ] Có breaking change → có `!` và/hoặc footer `BREAKING CHANGE:`
- [ ] Một commit một mục đích; không commit secret, file build, file không liên quan
- [ ] Footer liên kết issue (`Closes:`/`Refs:`) nếu có

## Anti-patterns

`update code`, `fix bug`, `WIP`, `misc changes`; trộn nhiều thay đổi trong một commit; dùng `feat` cho refactor; quên đánh dấu breaking change; mô tả bằng quá khứ ("fixed"); header dài như đoạn văn; dùng `chore` làm thùng rác cho mọi thứ.
