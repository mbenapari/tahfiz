# Roadmap: Dashboard Statistics API Refactor

## 1. Overview
The goal is to refactor the dashboard statistics from hardcoded frontend values to a robust, scalable backend architecture with dedicated endpoints for each metric. This allows for real-time updates, independent caching, and better error isolation.

## 2. Endpoint Specification
All endpoints will be under `/api/stats/` and require authentication.

| Metric | Endpoint | Response Structure | Description |
|--------|----------|--------------------|-------------|
| **Active Students** | `GET /active-students` | `{ "value": number, "trend": string }` | Total students with active enrollments. |
| **Total Hifz** | `GET /total-hifz` | `{ "value": number, "trend": string }` | Aggregate of all Juz/pages memorized. |
| **Today's Sessions** | `GET /today-sessions` | `{ "value": number, "completed": number }` | Count of sessions scheduled for today. |
| **Pending Reviews** | `GET /pending-reviews` | `{ "value": number, "status": string }` | Records requiring instructor feedback. |

## 3. Backend Architecture

### 3.1. Data Models (Sequelize)
- **User/Enrollment**: Filter by role 'student' and active status.
- **JuzProgress/SurahProgress**: Aggregate progress records.
- **Session**: Filter by today's date and tenant.
- **MemorizationRecord**: Filter by status 'pending_review'.

### 3.2. Service Layer (`statsService.ts`)
- `getActiveStudentsCount(tenantId)`
- `getTotalHifzProgress(tenantId)`
- `getTodaySessionsStats(tenantId)`
- `getPendingReviewsCount(tenantId)`

### 3.3. Controller Layer (`statsController.ts`)
- Individual functions for each service call.
- Standardized error handling and 200/400/500 responses.

### 3.4. Routing (`statsRoutes.ts`)
- Protected by `authenticate` middleware.
- RESTful structure.

## 4. Frontend Integration Strategy
- Replace hardcoded `stats` array in `Dashboard.tsx` with stateful data.
- Implement a custom hook or individual `fetch` calls in `useEffect`.
- Maintain UI consistency using the existing Lucide icons and Tailwind styles.

## 5. Migration & Compatibility
- **Phase 1**: Implement backend infrastructure.
- **Phase 2**: Verify endpoints via unit/integration tests.
- **Phase 3**: Update frontend to consume new APIs.
- **Fallback**: Display placeholder/zero values if an endpoint fails.

## 6. Verification Plan
- Unit tests for service logic.
- Postman/Curl verification for REST endpoints.
- UI validation for data rendering accuracy.
