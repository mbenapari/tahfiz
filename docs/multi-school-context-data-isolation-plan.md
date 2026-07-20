# Multi-School Context Data Isolation Fix Plan

## Executive Summary

**Root Cause**: All data-fetching and data-mutation endpoints (Dashboard, Students, Instructors, Reports, Settings) ignore the validated `X-School-Context` header and use the stale `tenantId` from the JWT token instead. The JWT's `tenantId` is set at login time and never updates when users switch school contexts.

**Impact**: Users switching between schools/branches see data from their primary school regardless of which school context is active. **Critically, this extends to "Write" operations, meaning users may inadvertently create or modify data in the wrong school.**

---

## Technical Analysis

### Frontend Flow (Correct)

| Step | Component | Action |
|------|-----------|--------|
| 1 | `AuthContext.tsx` | Stores `active_school_context` in localStorage as `active_school_id` |
| 2 | `api.ts` | Reads `active_school_id` from localStorage and sends as `X-School-Context` header (lines 47-51) |

### Backend Flow (Broken)

| Step | Middleware/Controller | Action |
|------|----------------------|--------|
| 1 | `authenticate` middleware | Reads `X-School-Context` header, validates via `schoolService.validateSchoolAccess()`, sets `req.activeSchoolId` (authMiddleware.ts lines 75-92) |
| 2 | **Controllers** | Extract `tenantId` from `req.user?.tenantId` (JWT payload) - **IGNORES** `req.activeSchoolId` |

### The Bug

```typescript
// authMiddleware.ts lines 89-91 (CORRECTLY sets activeSchoolId)
req.activeSchoolId = schoolId;  // from X-School-Context header
// OR
req.activeSchoolId = decoded.tenantId;  // fallback to JWT tenantId

// BUT all controllers use (WRONG):
const tenantId = req.user?.tenantId;  // stale JWT tenantId, NOT req.activeSchoolId
```

### JWT Token Issue

```typescript
// authController.ts lines 163-167 (login creates token with PRIMARY tenantId)
const token = jwtHelper.signToken({
  userId: user.id,
  roleId: user.role_id,
  tenantId: user.tenant_id,  // PRIMARY school, set at account creation
});

// schoolContextRoutes.ts lines 55-65 (switch updates DB but NOT JWT)
const user = await schoolService.switchSchoolContext(userId, schoolId, logId);
// JWT is never refreshed with new school context!
```

---

## Affected Endpoints Summary

| Frontend Page | Backend Endpoints | Issue |
|---------------|------------------|-------|
| `Dashboard.tsx` | `/api/stats/active-students`, `/api/stats/total-hifz`, `/api/stats/today-sessions`, `/api/stats/attendance-trends`, `/api/metrics/juz-revised` | Controllers use `req.user?.tenantId` instead of `req.activeSchoolId` |
| `Students.tsx` | `/api/users/students`, `/api/users/students/search` | Same issue |
| `Instructors.tsx` | `/api/users/instructors` | Same issue |
| `Reports.tsx` | `/api/reports/school-performance`, `/api/reports/overall-performance/download`, `/api/reports/overall-attendance/download` | Same issue |
| `Settings.tsx` | `/api/schools/me`, `/api/schools/update` | Same issue |

---

## Controllers Using Wrong Tenant ID

Count: **38 occurrences** across 11 controllers

```bash
# grep output showing all usages:
req.user?.tenantId usages:
- profileController.ts: 3 occurrences
- instructorController.ts: 5 occurrences
- reportController.ts: 6 occurrences
- feedbackController.ts: 1 occurrence
- schoolController.ts: 4 occurrences
- revisionController.ts: 7 occurrences
- studentController.ts: 5 occurrences
- surahController.ts: 2 occurrences
- sessionController.ts: 5 occurrences
```

---

## Solution Architecture

### Option A: Use `req.activeSchoolId` in Controllers (RECOMMENDED)

Modify all controllers to use a fail-fast helper `getTenantId(req)` that prefers `req.activeSchoolId` over `req.user?.tenantId`.

**Pros:**
- Minimal changes, respects validated school context
- Flexible - doesn't require JWT refresh on context switch
- Leverages existing middleware validation
- Prevents "global" query leaks by enforcing a valid ID

**Cons:**
- Changes required in 11 controllers

### Option B: Refresh JWT on Context Switch

When switching contexts, issue a new JWT with the new `tenantId`.

**Pros:**
- Simpler controller logic (always use `req.user?.tenantId`)

**Cons:**
- Requires token refresh on every context switch
- Breaks existing sessions immediately
- More complex implementation

---

## Implementation Plan

### Phase 1: Create Fail-Fast Helper Function

Create a utility function that extracts the correct tenant ID and throws an error if no context is available to prevent accidental data leakage.

```typescript
// src/server/utils/schoolContext.ts
import { Request } from 'express';

export const getTenantId = (req: Request): number => {
  // req.activeSchoolId is set by authenticate middleware when X-School-Context header is present
  // It has already been validated by schoolService.validateSchoolAccess()
  const tenantId = req.activeSchoolId ?? req.user?.tenantId;
  
  if (!tenantId) {
    throw new Error('NO_SCHOOL_CONTEXT'); // Should be handled by global error middleware as 401/403
  }
  
  return tenantId;
};
```

### Phase 2: Update Controllers (Prioritize Mutations)

Replace all `req.user?.tenantId` with `getTenantId(req)`. 

**CRITICAL**: Implementation must prioritize **Write/Mutation** endpoints (POST, PUT, DELETE) over **Read** endpoints to prevent cross-school data corruption.

**Files to modify:**
1. `src/server/controller/statsController.ts` - 6 occurrences
2. `src/server/controller/studentController.ts` - 5 occurrences
3. `src/server/controller/instructorController.ts` - 5 occurrences
4. `src/server/controller/reportController.ts` - 6 occurrences
5. `src/server/controller/schoolController.ts` - 4 occurrences
6. `src/server/controller/sessionController.ts` - 5 occurrences
7. `src/server/controller/revisionController.ts` - 7 occurrences
8. `src/server/controller/surahController.ts` - 2 occurrences
9. `src/server/controller/profileController.ts` - 3 occurrences
10. `src/server/controller/feedbackController.ts` - 1 occurrence

### Phase 3: Update Route Registrations

Verify routes are mounted correctly with authentication:

```typescript
// main.ts - verify route order
app.use('/api/stats', authenticate, statsRoutes);  // ✓ has authenticate
app.use('/api/users', authenticate, userRoutes);  // ✓ has authenticate
app.use('/api/reports', authenticate, reportRoutes);  // ✓ has authenticate
app.use('/api/schools', authenticate, schoolRoutes);  // ✓ has authenticate
```

### Phase 4: QA Compliance Testing

1. **Multi-school isolation test**
   - Create 2 schools (School A, School B)
   - Add different students to each
   - Login as admin of School A
   - Switch context to School B
   - Verify Dashboard/Students/Instructors show School B data

2. **Context switch regression test**
   - Login as user with access to multiple schools
   - Verify context switch updates all pages correctly
   - Verify no data leakage between schools

3. **Permission escalation test**
   - Login as instructor (limited access)
   - Switch context to school where they have no membership
   - Verify 403 Forbidden response

4. **Branch context test**
   - Create parent school with branches
   - Login as parent school admin
   - Switch context to a branch
   - Verify branch-specific data shown

### Phase 5: Logging Enhancement

Add structured logging to track school context in requests:

```typescript
// In affected controllers
logger.info('ControllerName: Operation', {
  correlationId,
  tenantId: getTenantId(req),  // Log actual tenant ID used
  activeSchoolContext: req.activeSchoolId,  // Log what header was sent
  userId: req.user?.userId
});
```

---

## File Change Summary

| File | Change Type | Lines Affected |
|------|-------------|----------------|
| `src/server/utils/schoolContext.ts` | NEW | ~10 lines |
| `src/server/controller/statsController.ts` | MODIFY | ~6 occurrences |
| `src/server/controller/studentController.ts` | MODIFY | ~5 occurrences |
| `src/server/controller/instructorController.ts` | MODIFY | ~5 occurrences |
| `src/server/controller/reportController.ts` | MODIFY | ~6 occurrences |
| `src/server/controller/schoolController.ts` | MODIFY | ~4 occurrences |
| `src/server/controller/sessionController.ts` | MODIFY | ~5 occurrences |
| `src/server/controller/revisionController.ts` | MODIFY | ~7 occurrences |
| `src/server/controller/surahController.ts` | MODIFY | ~2 occurrences |
| `src/server/controller/profileController.ts` | MODIFY | ~3 occurrences |
| `src/server/controller/feedbackController.ts` | MODIFY | ~1 occurrence |

---

## Verification Checklist

- [ ] Unit tests pass for all modified controllers
- [ ] Integration tests verify school context isolation
- [ ] Manual QA testing on all 5 frontend pages
- [ ] **Mutation Audit**: Verify that no POST/PUT/DELETE requests are using the wrong tenantId
- [ ] **Repository Audit**: Ensure all Sequelize queries utilize the passed tenantId in `where` clauses
- [ ] No regression in existing functionality
- [ ] Logs show correct tenantId in all operations
- [ ] Branch/school switching works correctly
- [ ] Permission boundaries enforced correctly

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Missing some `req.user?.tenantId` usages | Medium | High | Comprehensive grep before/after |
| Side effects on other endpoints | Low | High | Full regression test suite |
| JWT token confusion | Low | Medium | Clear documentation that `activeSchoolId` takes precedence |
