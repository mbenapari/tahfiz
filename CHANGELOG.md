# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-04-22

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
