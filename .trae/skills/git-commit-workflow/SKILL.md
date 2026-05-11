---
name: "git-commit-workflow"
description: "Reviews uncommitted changes, groups files logically, creates structured commits with conventional messages, and updates the project CHANGELOG. Invoke when user asks to commit, review changes, or create a changelog."
---

# Git Commit Workflow

This skill executes a structured, multi-step commit process for a project with many uncommitted changes.

## Workflow Steps

1. **Review** — Run `git status` and `git diff --stat` to understand the full scope of uncommitted changes.
2. **Group** — Organise files into logical commits using the following conventions:
   - Files that changed together for a single purpose belong in one commit
   - New pages/components → `feat:`
   - Bug fixes → `fix:`
   - UI/Dashboard changes → `feat:`
   - Backend logic (controllers, services, models) → `feat:` (or `refactor:` if rewriting)
   - Config, tsconfig, package changes → `chore:`
   - Tests → `test:`
   - Docs → `docs:`
3. **Commit each group** using `git add <files>` then `git commit -m "<type>: <description>"`.
4. **Create/Update CHANGELOG.md** at the project root using the format below, inserting each new entry at the top under a `## [Unreleased]` section.
5. **Commit the changelog** with `docs: update CHANGELOG for <description>`.

## Commit Message Format

```
<type>: <short summary>

[Optional body: explains WHAT changed and WHY]
```

## CHANGELOG Format

```markdown
## [Unreleased]

### Added
- **<Commit title>**: <description> (<commit-hash>)

### Changed
...

### Fixed
...

### Refactored
...

### Docs
...

### Tests
...

### Chore
...
```

## Grouping Heuristic (Tahfiz project)

| Group | Files | Type |
|-------|-------|------|
| Landing page | Home.tsx, Home.css | feat |
| New pages | Instructors.tsx, Profile.tsx | feat |
| Backend analytics/notifications | analytics*, notification* | feat |
| New models | BlacklistedToken, Class, ClassStudent, Notification | feat |
| Middleware/helpers | cacheMiddleware, paginationHelper | feat |
| Reports/Dashboard/Settings UI | Reports, Dashboard, Settings | feat |
| Client pages | CreateSchool, EnrollStudent, StudentProfile, App, Navbar, Sidebar, AuthContext | feat |
| Server logic | userController, reportController, schoolController, userService, reportService | feat |
| Server models | School, SchoolMember, User, index | refactor |
| Server routes | userRoutes, reportRoutes, schoolRoutes, statsRoutes | feat |
| Server entry | main.ts | feat |
| Config/docs | tsconfig.json, package.json, API_DOCS.md | chore |
| Tests | *.test.ts, jest.config.js | test |
| CI | .github/ | chore |
