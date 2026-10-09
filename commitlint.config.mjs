// Conventional Commits 1.0.0 — https://www.conventionalcommits.org/en/v1.0.0/
// Scope = tên skill hoặc khu vực của repo (xem skills/conventional-commit/SKILL.md).
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', 72],
    'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],
    'subject-full-stop': [2, 'never', '.'],
    'scope-enum': [
      1,
      'always',
      [
        'mvp-orchestrator', 'product-discovery', 'ux-research-flows', 'ui-design-system',
        'system-design', 'architecture-ddd', 'api-design', 'database-design',
        'backend-dotnet', 'frontend-web', 'security-auth', 'testing-qa',
        'devops-cicd', 'observability', 'data-engineering', 'mvp-launch-readiness',
        'conventional-commit', 'readme', 'plugin', 'ci', 'deps',
      ],
    ],
  },
  // Commit khởi tạo bộ skill được viết trước khi có quy ước này.
  ignores: [(msg) => msg.startsWith('Add MVP fullstack skill suite')],
};
