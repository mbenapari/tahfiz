# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **feat: server-backed notification bell and Messages page**: Replace the static navbar bell with `NotificationBell` backed by the new `useNotifications` hook (60s unread-count polling). Add a `/messages` page for contacting students' parents, linked from the navbar. Add `notificationService.notifyTenantAdmins` to notify school admins of events without ever failing the originating request.
- **feat: persist progress-onboarding dismissal per user**: Add `users.progress_onboarding_dismissed` (migration `20260701000000`), exposed via `GET /users/me` and set through the new `POST /users/progress-onboarding/dismiss` endpoint. `useInstructorProgressFlag` now reads the server flag instead of encrypted localStorage state.

### Security
- **fix: never serialize credentials in User JSON**: `User.toJSON()` strips `password` and `email_blind_index` from all API responses.
- **fix: harden `saveDailySession`**: Require an authenticated instructor (`req.user.userId`), validate `studentId`, and verify the student is enrolled in the active school before saving (404 otherwise).

### Removed
- **refactor: remove the advanced scheduling engine**: Remove `ScheduleService`, the `Session` calendar-alignment hooks, schedule draft/impact endpoints, the `checkDateConflict` endpoint, related error-code constants, and the advanced schedule UI in Settings, CreateSchool, BranchDetail and DailySession. Delete the associated schedule test suites and trim `sessionSaveValidation.test.ts`. Existing `schedule_mode` columns are left in place.

### Chore
- Ignore `.claude`, `.trae` and `docs` in `.gitignore`.
- Simplify `AnimatedActionButtons`, `BranchCard`, `BranchFormModal` and branch management hooks; minor controller/service cleanups for school-context handling.
- Add `progressOnboarding.test.ts`.

### Added
- **feat: add multi-school context infrastructure with RLS middleware**: Introduce Row Level Security (RLS) middleware to enforce school context validation on all protected routes. Add schoolContextRoutes for context management (current, switch, accessible schools). Update jwtHelper to include activeSchoolContext in JWT payload and authMiddleware to extract and attach school context to requests. (e0f7666)
- **feat: add branch management to schoolService with CRUD operations**: Implement branch creation, updates, and admin management in schoolService. Add branch hierarchy validation (branch can't be its own parent). Refactor permissionService to support branch-level access control with primary and secondary admin roles. Update userService to handle multi-school contexts. (3df1588)
- **feat: add branch hierarchy migrations for multi-school data model**: Add migrations for: Branch hierarchy fields on School model (is_branch, parent_school_id, branch_code), Branch fields on User model (is_branch_admin, branch_id, primary_branch_id), Scope and audit fields on SchoolMember model, Backfill school owner ID. (5be90ab)
- **feat: add SchoolContext and branch management components for multi-school UI**: Add SchoolContext for managing school/branch selection state with retry logic for race conditions. Create ActiveSchoolBanner, BranchCard, BranchFormModal, SchoolSwitcherDropdown, and UserSearchSelector components. Add useBranchManagement hook for branch CRUD operations. (d3aa0e9)
- **feat: add BranchDetail, BranchManagement, and SchoolSwitcher pages**: Add pages for branch management including: BranchManagement for listing/managing branches, BranchDetail for viewing/editing individual branches, SchoolSwitcher for switching between accessible schools/branches. (3f75cc2)
- **feat: integrate SchoolContext and branch navigation into frontend app**: Update App.tsx to add SchoolProvider and branch routes. Integrate SchoolSwitcherDropdown and ActiveSchoolBanner into Navbar. Update Sidebar and OwnerSidebar with branch management links. Enhance AuthContext with multi-school awareness. Update ProtectedRoute for branch access control. (29c94e5)
- **feat: add branch routes and update user routes for multi-school**: Add branchRoutes for branch CRUD operations and branchAdminRoutes for branch admin management. Update userRoutes with branch-aware endpoints. (137c9ac)
- **feat: update models with branch hierarchy fields**: Add branch fields to School model (is_branch, parent_school_id, branch_code). Add branch admin fields to User model (is_branch_admin, branch_id, primary_branch_id). Update SchoolMember with scope and audit fields. Update model associations for branch relationships. (2cc8551)

### Refactored
- **refactor: update all controllers for multi-school context support**: Refactor all controllers to respect school context from RLS middleware. Add school context validation to protected endpoints. Controllers now use req.rlsFilter or req.userSchoolId for data isolation. Update query scopes to filter by school context. (3323de5)

### Chore
- **chore: update server entry point and middleware for multi-school support**: Update main.ts to register schoolContextRoutes and apply RLS middleware. Enhance loggingMiddleware, cacheMiddleware, and rateLimitMiddleware with school context awareness. (5957fb8)

### Docs
- **docs: add planning documentation for multi-school branch management**: Add planning documents covering: Branch management implementation plan, Multi-branch instructor login analysis, Multi-school context data isolation plan. (d1ddff6)

### Tests
- **test: add multi-school isolation test suite**: Add tests for verifying data isolation between schools and branches. Test RLS middleware enforcement and branch access control. (8f80696)

### Added
- **feat: implement advanced scheduling engine with business rule enforcement**: Added `ScheduleService` with calendar validation, date format checking, mutual exclusivity between hifz/revision days, retroactive conflict detection, and conflict cache invalidation. School model now supports `schedule_mode` (simple/advanced), `session_type_day_map`, and `enabled_memorization_subtypes`. Session model includes `recording_date` with calendar-alignment hook. Includes 3 DB migrations for schema changes. (7b7d60d)
- **feat: add 1-5 performance rating scale to memorization and revision records**: Introduced rating field (1-5) on MemorizationRecord and RevisionRecord models with validation, human-readable labels (RevisionRating enum), and detailed grading criteria. Includes DB migrations for both tables. (396358a)
- **feat: add instructor notes system for revision sessions**: New `InstructorNote` model with public/private visibility, `NoteTargetType` for polymorphic targeting, and `NoteVisibility` enum. Notes are created during revision recording with a 20-note cap and content validation. Includes `revisionController`, `instructorNoteService`, `revisionPerformanceService`, and dedicated routes. (7b7d60d)
- **feat: enforce scheduling compliance in session recording**: Added schedule validation to `saveDailySession` (absent student guard, date format checks, mutual exclusivity enforcement, full schedule compliance for hifz/revision). New endpoints: `checkDateConflict`, `getInstructorHasActivity`, `getSessionHistory` with combined hifz/revision history. Added `sessionHistoryService` for unified history retrieval. (e6d4214)
- **feat: add school schedule management with validation, impact analysis and draft preview**: Added `validateScheduleDraft`, `getScheduleImpact` endpoints, schedule validation on school create/update, retroactive conflict impact reporting, and `validationMetadata` in school responses. Owner management controller hardened with DTO normalization for schedule inputs. (02ecd8c)
- **feat: redesign DailySession with performance ratings, schedule enforcement, and date conflict detection**: Major frontend rewrite (913 insertions) of the daily session recording page. Added 1-5 star ratings for hifz and revision, real-time schedule conflict detection, date validation, recording vs. session date distinction, and instructor notes UI for revision entries. (f6f8e89)
- **feat: add advanced schedule mode to Settings and CreateSchool pages**: Settings page now includes simple/advanced schedule toggle, per-session-type day selection, overlap detection and prevention, error state with retry button, and disabled save when conflicts exist. CreateSchool page supports schedule mode during initial setup. (2f40034)
- **feat: enhance student enrollment UX with onboarding flow and animated actions**: Added no-results create-student flow on EnrollStudent, ProgressOnboardingModal for first-time instructors, AnimatedActionButtons with pulse-glow animation, NotificationProvider context for global notifications, and useInstructorProgressFlag hook for tracking instructor activity. (e836177)
- **feat: add admin-only route guard for instructor management pages**: Restricted `/instructors` route to admin roles only, conditionally showing the Instructors tab in Sidebar based on user role. (a247f9d)

### Fixed
- **fix: switch search to substring matching with iLike and improve logging**: Changed student search from prefix matching (`LIKE 'query%'`) to substring matching (`iLike '%query%'`) for better user experience. Added structured logging with correlationId throughout student search pipeline in userService and studentController. Made activity limit configurable in student profile endpoint. (70ff649)

### Changed
- **feat: update DailySession and StudentProfile for surah range revisions**: Refactored the session logging and student profile interfaces to support selecting and displaying a range of surahs for revision activity.
- **feat: integrate surah range revisions into session and report services**: Updated backend controllers and reporting logic to correctly process and format multi-surah revision data in API responses and CSV exports.

### Style
- **style: add global CSS animations with reduced-motion support**: Added pulse-glow, fade-in-up, and progress-shrink keyframe animations. Included `prefers-reduced-motion` media query to disable animations for accessibility. (a247f9d)
- **style: optimize Settings page for mobile devices**: Overhauled the school configuration page with a mobile-first design, featuring collapsible layouts, scrollable tabs, and responsive input controls for smaller screens (425px and below).
- **style: refine Navbar for mobile view**: Improved mobile navigation with better spacing and responsive layout adjustments.

### Refactored
- **refactor: extract revision record validation into dedicated utility**: Extracted revision record validation logic from sessionController into a separate revisionValidation utility with better error messages and support for single-surah, surah-range, and page-range revision types. Added comprehensive unit tests for the validation logic. (b0d0603)
- **refactor: improve school performance report with batch progress calculation**: Refactored getSchoolPerformanceReport to use batch student progress calculation instead of individual queries per student, improving performance. Added error logging to report service functions. Enhanced revision record display with page range support and better surah name handling. (101cc0a)

### Chore
- **chore: remove deprecated GitHub rules and skills directories**: Removed 67 obsolete performance rules and skills markdown files that were no longer relevant to the project. (418c4db)
- **chore: add migration for daily_revision_target column to users table**: Added database migration to add the `daily_revision_target` column to the users table. (74c5223)

### Docs
- **docs: add planning documents for scheduling, revision, and UX improvements**: Added 6 planning documents covering daily session enhancements, enroll student UX improvements, extended session type scheduling, and business rules enforcement with validation reports. (7bd453c)
- **docs: add Quranic verse range validation refactoring plan**: Added documentation for the Quranic verse range validation refactoring plan. (7a632aa)

### Tests
- **test: add comprehensive test suites for scheduling, notes, and session validation**: Added 6 new test suites: instructorNote, revisionPerformance, scheduleService, schoolScheduleValidation, sessionSaveValidation, and userServiceLimit. Total 1,237 lines of test coverage across 34+ scheduling enforcement scenarios. (121a9cf)
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
