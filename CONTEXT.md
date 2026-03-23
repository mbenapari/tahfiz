# Tahfiz Management System - Project Context

## 1. Overview
The Tahfiz Management System is a full-stack, multi-tenant web application designed to help Quran memorization (Tahfiz) schools manage their students, track daily memorization (Hifz) and revision sessions, and provide detailed analytical insights into student progress.

## 2. Technical Stack
### Frontend
- **Framework:** React 19, Vite
- **Styling:** Tailwind CSS v4
- **Routing:** React Router v7 (`react-router` strictly, avoiding `react-router-dom` imports per project rules)
- **UI Components:** Lucide React for icons, Recharts for analytics

### Backend
- **Environment:** Node.js, Express 5, TypeScript
- **Database ORM:** Sequelize v6 (MySQL/PostgreSQL compatible)
- **Authentication:** JWT-based auth with bcrypt password hashing (cost factor 12)
- **Logging:** Winston (daily rotating files, unstructured printf-style format, contextualized with `correlationId`)

## 3. Core Domain Models & Database Structure
The system is built on a robust relational database schema featuring multi-tenancy and RBAC:
- **Tenancy:** `School`, `SchoolMember`
- **Identity & Access (RBAC):** `User`, `Role`, `Permission`, `RolePermission`, `UserPermission`
- **Academics:** `Enrollment` (links students to specific schools)
- **Daily Operations:** `Session`, `Attendance`, `MemorizationRecord`, `RevisionRecord`
- **Quran Metadata:** `Surah`, `JuzMap`
- **Progress Tracking:** `SurahProgress`, `JuzProgress`

## 4. Key Architectural & Development Rules
- **Performance First:** Code must be optimized for performance. Reduce computational complexity.
- **Component Modularity:** Break down monolithic files (SRP). Backend uses separate files for routers, controllers, services, and models.
- **Error Handling:** Zero-tolerance for unhandled errors. Use robust `try...catch` blocks and user-friendly frontend error messages.
- **Logging Standards:** Use unstructured `printf-style` logging (no JSON). Format: `[context] [logId] [message] [data]`. Pass `correlationId` through request lifecycles.
- **Model Integrity:** Sequelize models strictly use the `declare` keyword for attributes to prevent shadowing getters/setters.
- **Security:** Strict OWASP Top 10 adherence (Rate limiting, BCrypt hashing, strict input validation).
- **Testing:** Adhere to the AAA (Arrange, Act, Assert) pattern. Mock external systems. Ensure zero regressions when modifying shared utilities.
- **UI/UX:** Mobile-first design approach exclusively using Tailwind CSS.
