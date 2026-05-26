# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **feat: implement surah range revisions and mastery calculation**: Added support for multi-surah revision records (Muraja'ah) across models, services, and UI. Includes a new `masteryHelper` utility for robust student progress calculation and a comprehensive test suite.
- **feat: add surah range support to RevisionRecord model**: Added `start_surah_number` and `end_surah_number` columns to the `revision_records` table with appropriate database migrations and Sequelize associations.
- **feat: add configurable daily revision target per student**: Added `daily_revision_target` field to User model allowing students to have individualized daily page targets. Updated studentController to handle the new field during updates, userService to include it in student profiles with a default of 20 pages, and frontend components (EditStudentModal, DailySession) to display and edit this per-student setting. (9859272)
- **feat: improve Reports page date range picker with separate pending state and Apply button**: Refactored date range selection to use a pending state that only applies when the user clicks Apply, preventing unnecessary API calls on every date change. Added proper date input fields instead of displaying raw date strings. (dffc1e9)
- **feat: add mobile card view for session history in StudentReportModal**: Added responsive mobile-friendly cards (md:hidden) to display session history on small screens alongside the existing desktop table view (hidden md:block). Each card shows date, attendance status, memorization and revision details. (eec7dab)

### Changed
- **feat: update DailySession and StudentProfile for surah range revisions**: Refactored the session logging and student profile interfaces to support selecting and displaying a range of surahs for revision activity.
- **feat: integrate surah range revisions into session and report services**: Updated backend controllers and reporting logic to correctly process and format multi-surah revision data in API responses and CSV exports.

### Refactored
- **refactor: extract revision record validation into dedicated utility**: Extracted revision record validation logic from sessionController into a separate revisionValidation utility with better error messages and support for single-surah, surah-range, and page-range revision types. Added comprehensive unit tests for the validation logic. (b0d0603)
- **refactor: improve school performance report with batch progress calculation**: Refactored getSchoolPerformanceReport to use batch student progress calculation instead of individual queries per student, improving performance. Added error logging to report service functions. Enhanced revision record display with page range support and better surah name handling. (101cc0a)

### Docs
- **docs: add Quranic verse range validation refactoring plan**: Added documentation for the Quranic verse range validation refactoring plan. (7a632aa)

### Chore
- **chore: add migration for daily_revision_target column to users table**: Added database migration to add the `daily_revision_target` column to the users table. (74c5223)

### Style
- **style: optimize Settings page for mobile devices**: Overhauled the school configuration page with a mobile-first design, featuring collapsible layouts, scrollable tabs, and responsive input controls for smaller screens (425px and below).
- **style: refine Navbar for mobile view**: Improved mobile navigation with better spacing and responsive layout adjustments.

### Fixed
- **fix: correct API response parsing in DailySession**: Fixed a bug where student data was not being correctly extracted from the nested API response, resolving "Student not found" errors.
- **fix: add proper validation for cross-surah revision verse ranges**: Fixed revision record validation to properly enforce ayah limits per surah in cross-surah ranges. Previously, startAyah and endAyah were not validated against their respective surah's ayah counts when using surah range revision (e.g., Al-Fatihah to Al-Baqarah). Now validates that startAyah is within the start surah's bounds and endAyah is within the end surah's bounds.

### Tests
- **test: fix foreign key constraint handling in user tests**: Create School (tenant) before user creation in auth_security and user_role tests to satisfy foreign key constraints. Update tenant_id from hardcoded 1 to dynamically created testSchool.id. Increase password validation timeout from 500ms to 1000ms for bcrypt overhead. Increase test timeouts to 10-30s range per project conventions. (6f42f06)
- **test: implement masteryHelper for surah progress calculation**: Added unit tests in `masteryHelper.test.ts` to verify progress calculation logic for single-surah, multi-surah, and invalid range scenarios.

## [0.2.2] - 2026-05-20

### Fixed
- **fix: validate ENCRYPTION_KEY length and provide descriptive errors**: Added key length validation for AES-256-GCM to prevent "Invalid key length" errors during encryption operations. The system now falls back to a development key in non-production environments while failing fast in production if the key is missing or invalid. (d075a90)
- **fix: improve CSRF token handling with credentials inclusion and stable session identifiers**: Enhanced CSRF protection by ensuring credentials (cookies) are always included in fetch requests and using a stable session identifier ("authenticated"/"anonymous") instead of the full JWT token. This prevents token rejection during auth state transitions. (6ca11fd)
- **fix: correct API response parsing in auth context to prevent logout after onboarding**: Fixed `checkAuth` function to correctly parse the standardized `apiResponse` format (`result.data.user`) instead of reading from the root level, preventing users from being unexpectedly logged out after completing onboarding. (0c82991)

### Added
- **feat: add student and instructor CRUD permissions to RBAC seeder**: Added `student:write`, `student:delete`, `instructor:write`, and `instructor:delete` permissions to the database seeder and assigned them to admin and super_admin roles. (3caa527)
- **feat: add comprehensive logging to permission service with embedded data**: Enhanced `permissionService.ts` with detailed structured logging at every decision point (cache hits/misses, role checks, override applications) using embedded data format for better traceability. Includes `logId` parameter for end-to-end request correlation. (cdd93e6)

### Refactored
- **refactor: adopt apiFetch utility across all frontend pages for consistent CSRF handling**: Replaced native `fetch` calls with the `apiFetch` utility across all frontend pages (Login, Register, OwnerLogin, CreateSchool, ManageSchools, ManageUsers, ManageOwners, OwnerDashboard, EnrollStudent, StudentProfile, Students) to ensure consistent CSRF token handling and proper credential inclusion. (8306fb3)

### Added
- **feat: implement field-level encryption with blind indexing for PII**: Implemented AES-256-GCM encryption for sensitive user data (email, phone, student identifier) and HMAC-SHA256 blind indexing for secure, efficient lookups. (c6e29e3)
- **feat: enhance security with distributed rate limiting and hardened secrets**: Upgraded rate limiting to support Redis for distributed environments and implemented strict fail-fast validation for environment variables (JWT_SECRET, DB credentials). Added immediate token revocation on logout. (ce7281c)
- **feat: optimize database performance and resolve N+1 query issues**: Optimized student profile loading with concurrent queries, implemented batch progress calculation for lists, and refactored analytics to use SQL aggregations. Improved search performance by removing leading wildcards. (6dd4af0)

### Changed
- **refactor: decompose monolithic userController and standardize API responses**: Split userController into domain-specific controllers (Auth, Student, Instructor, Profile) and standardized API response formats. Hardened authentication flows with brute-force protection and timing attack mitigations. (d2aa9ea)

### Docs
- **docs: finalize security audit and resolution report**: Updated security_report.md with final status and implementation details for all identified vulnerabilities. (59ce490)

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
