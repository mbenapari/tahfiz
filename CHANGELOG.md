# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **feat: implement user onboarding flow and tracking**: Add is_onboarded field to User model, create WelcomeOnboarding component, and enhance EnrollStudent for specialized onboarding mode.
- **feat: implement user feedback system**: Create Feedback model, submission interface for users, and management dashboard for platform owners.

### Changed
- **refactor: migrate react-router-dom imports**: Standardized all routing imports to use `react-router` across the client codebase.
- **feat: enhance feedback management**: Include user phone number and contact details in the feedback review interface for system owners.

### Fixed
- **fix: resolve TypeError in student search**: Correctly handle backend response format (students vs users array) and add defensive checks for search results.
- **fix: address 403 Forbidden on search**: Improve feedback and state handling when student search fails due to missing tenant context.

### Added
- **feat**: redesign landing page with new assets and mobile-first approach (f781998)
- **feat**: implement responsive collapsible sidebar for mobile views (e2c60f8)
- **feat**: optimize dashboard, students, and instructors pages for mobile (a7c3933)
- **feat**: Add performance indexes for sessions and memorization records.
- **feat**: Implement double-submit cookie CSRF protection with `csrf-csrf`.
- **feat**: Add security hardening with JWT algorithm enforcement (HS256) and secure cookies.
- **feat**: Implement pagination for student search endpoints.
- **feat**: Add input length limiting and prefix sanitization for database search queries.

### Changed
- **refactor**: Unify student progress mapping logic in `userService`.
- **style**: Standardize `tenant_id` to `tenantId` in frontend and API responses for camelCase consistency.

### Fixed
- **fix**: resolve CSRF token generation error and infinite fetch recursion (d0ad9bd)
- **fix**: correct routing structure for dashboard sub-pages (3381f98)
- **fix**: Address potential memory leaks in rate limiter by adding periodic cleanup.
- **fix**: Resolve N+1 query issue in permission checks with in-memory TTL caching.
- **fix**: Fix inconsistent error logging in `statsService` using custom logger.

### Chore
- **chore**: Add `csrf-csrf` dependency for security middleware.

## [0.2.1] - 2026-05-04

### Added
- **feat**: Landing page Home rebuilt with Tailwind CSS
- **feat**: Add instructors list and profile pages
- **feat**: Add analytics and notification backend modules
- **feat**: Add Class, ClassStudent, BlacklistedToken, and Notification models
- **feat**: Add cacheMiddleware and paginationHelper utilities
- **feat**: Overhaul Reports, Dashboard and Settings pages with new UI
- **feat**: Update App, Navbar, Sidebar, AuthContext and student pages; add ContactParentModal
- **feat**: Expand user, report, school, session and stats controllers
- **feat**: Expand and refactor server services including classService and progressService
- **feat**: Update user, report, school, stats routes; add authRoutes
- **feat**: Update server main entry to register new routes and middleware
- **feat**: Update authMiddleware; add database migrations for notifications, reporting, classes and blacklisted tokens
- **refactor**: Update School, SchoolMember, User models and model index
- **chore**: Update tsconfig, package.json, API docs and analytics collection
- **chore**: Add GitHub CI configuration
- **chore**: Add Trae IDE skills and rules configuration
- **test**: Add Jest config and test suites for analytics, reports and user controller

### Changed
- Landing page redesigned and rebuilt with Tailwind CSS
- Reports, Dashboard, and Settings pages overhauled with new UI
- App, Navbar, Sidebar, and AuthContext updated with new routing and state management
- Student enrollment and profile pages updated
- All server models (School, SchoolMember, User) refactored
- Server services expanded with classService and progressService

### Fixed
- JSX tag mismatch in Home.tsx (closing tag corrected)

## [0.2.1] - 2026-05-04

### Added
- **feat**: Implement role-based redirection on root path (`/`) to send owners to `/owner` and others to `/dashboard`.
- **feat**: Add strict dashboard protection to prevent cross-role dashboard access (e.g., owner accessing user dashboard).
- **feat**: Move normal user dashboard routes from `/` to `/dashboard` for better path isolation.

### Changed
- **refactor**: Updated `OwnerDashboard` quick links to use correct administrative routes.
- **refactor**: Centralized redirection logic in `Home.tsx` and `ProtectedRoute.tsx`.

### Fixed
- **fix**: Ensure `SystemOwner` session correctly identifies the `owner` role during login and auth check.
- **fix**: Fix persistent redirection issue where owners could land on the normal user dashboard.
- **fix**: Corrected `OwnerLogin` to correctly map backend response to frontend auth state.

## [0.2.0] - 2026-05-04

### Added
- **feat**: Add `system_owners` db table, Sequelize model and default seeder for platform owners.
- **feat**: Add owner authentication (login/logout) and token blacklisting support.
- **feat**: Add owner-only middleware and owner management REST API to manage schools, users and system owners.
- **feat**: Add platform metrics service and `/api/stats/platform` endpoint (total users, system owners, schools).
- **feat**: Add owner UI: `OwnerLayout`, `OwnerSidebar`, `OwnerLogin`, `OwnerDashboard`, `ManageSchools`, `ManageUsers`, `ManageOwners` and corresponding routes.

### Changed
- **chore**: Mount owner routes at `/api/owner` in server main startup.

### Notes
- After upgrading, run migrations and seeders to create the `system_owners` table and default owner:

	```bash
	npx sequelize-cli db:migrate
	npx sequelize-cli db:seed:all
	```

	Default owner credentials are set via `DEFAULT_SYSTEM_OWNER_EMAIL` and `DEFAULT_SYSTEM_OWNER_PASSWORD` environment variables; if not provided, defaults are used.
