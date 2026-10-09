---
name: git-workflow-release
description: Quy trình Git và phát hành phần mềm - branching (trunk-based/GitHub Flow/GitFlow), pull request và code review, branch protection, SemVer, changelog tự động (release-please/semantic-release), tag, hotfix, feature flag. Dùng khi thiết lập quy trình làm việc nhóm, mở PR, đóng gói release, hoặc xử lý hotfix. Kết hợp với skill conventional-commit.
---

# Git Workflow & Release

## Đầu ra
`CONTRIBUTING.md`, `.github/pull_request_template.md`, branch protection, workflow release, `CHANGELOG.md` tự sinh.

## Chọn mô hình nhánh
| Mô hình | Phù hợp | Ghi chú |
|---|---|---|
| **Trunk-based / GitHub Flow** | MVP, deploy liên tục, đội nhỏ | Mặc định: nhánh ngắn, merge vào `main` nhiều lần/ngày, feature flag |
| GitFlow | Phát hành theo phiên bản, hỗ trợ nhiều bản cũ | Nặng; tránh cho web app |
Tên nhánh: `feat/<scope>-<mô-tả>`, `fix/<issue>-<mô-tả>`, `chore/...` (khớp type của `conventional-commit`). Nhánh sống ≤ 2 ngày.

## Quy trình một thay đổi
1. Tạo nhánh từ `main` mới nhất → commit nhỏ theo `conventional-commit`.
2. Mở PR sớm (draft). Tiêu đề PR theo Conventional Commits (squash commit lấy tiêu đề này).
3. CI chạy: build, test, lint, commitlint, scan bảo mật.
4. Review → sửa → **squash merge** (lịch sử `main` tuyến tính, mỗi PR một commit).
5. Merge vào `main` → tự deploy staging (`devops-cicd`).

## PR template
```markdown
## Mục đích
<!-- Vì sao thay đổi? Link issue: Closes #123 -->
## Thay đổi chính
## Cách kiểm thử
## Checklist
- [ ] Test mới/được cập nhật   - [ ] Migration an toàn, tương thích ngược
- [ ] Tài liệu/OpenAPI cập nhật - [ ] Không secret, không dữ liệu nhạy cảm
- [ ] Breaking change đã đánh dấu (`!` / `BREAKING CHANGE:`)
```
PR nhỏ (< 400 dòng đổi), một mục đích. Ảnh/GIF cho thay đổi UI.

## Code review
Người review kiểm theo thứ tự: **đúng đắn → thiết kế/kiến trúc → bảo mật → test → dễ đọc → hiệu năng → style** (style để máy lo). Nhận xét cụ thể, có lý do, phân loại `blocker / suggestion / nit`. Phản hồi trong 1 ngày làm việc. Tác giả tự review diff trước khi nhờ người khác.

## Branch protection cho `main`
Bắt buộc PR, ≥ 1 approval (đội ≥ 2 người), status checks `build-test` + `commitlint`, nhánh up-to-date, cấm force-push, resolve conversation, signed commits (tuỳ chọn), CODEOWNERS cho module nhạy cảm.

## Phiên bản & phát hành (SemVer)
`MAJOR.MINOR.PATCH` suy ra từ commit: `fix` → PATCH, `feat` → MINOR, breaking → MAJOR. Tự động hoá bằng **release-please**:
```yaml
name: release-please
on: { push: { branches: [main] } }
permissions: { contents: write, pull-requests: write }
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v4
        with: { release-type: simple }
```
Bot mở "release PR" gom changelog; merge → tạo tag + GitHub Release → pipeline build image gắn tag `vX.Y.Z` và deploy prod (có bước duyệt). Pre-1.0 (`0.x`) cho MVP; lên `1.0.0` khi API ổn định.

## Hotfix
Nhánh `fix/...` từ `main` (hoặc từ tag đang chạy nếu `main` đã đi xa) → PR nhanh → tag patch → deploy → **luôn có test hồi quy**. Rollback ưu tiên redeploy tag trước, không `git revert` vội dưới áp lực.

## Feature flag
Tách *deploy* khỏi *release*: code vào `main` sớm, bật dần bằng flag (OpenFeature/Unleash/LaunchDarkly hoặc bảng cấu hình đơn giản). Có ngày gỡ flag; flag không sống quá 1–2 release.

## Gate
- [ ] Branch protection bật trên `main`; PR template và CONTRIBUTING có sẵn
- [ ] Release tự động tạo changelog + tag từ commit
- [ ] Diễn tập hotfix và rollback ít nhất một lần
- [ ] Không có nhánh sống quá 1 tuần

## Anti-patterns
Nhánh dài hàng tuần; commit thẳng vào `main`; PR hàng nghìn dòng; merge commit rối; force-push lên nhánh chung; changelog viết tay; sửa tag đã phát hành.
