# Scheduling Business Rules Enforcement — Implementation Plan

## Executive Summary

This document defines the end-to-end implementation plan to enforce two core scheduling business rules across the Tahfiz school management system:

1. **Mutual Exclusivity Constraint** — When advanced scheduling mode is enabled, memorisation and revision sessions must occupy mutually exclusive days. No day may be simultaneously designated for both session types.
2. **School Schedule Alignment Validation** — All session records (memorisation and revision) must fall within the school's officially configured active operating calendar.

These rules must be enforced at the database, API/service, and frontend input layers with full logging, test coverage, and security hardening.

---

## 1. Codebase Analysis & Impact Map

### 1.1 Database Tables

| Table | Affected Columns | Indexes to Modify | Notes |
|---|---|---|---|
| `tenants` (School model) | `schedule_mode`, `session_type_day_map`, `study_days`, `enabled_memorization_subtypes` | None (existing fields) | Source of truth for school schedule configuration. `session_type_day_map` is JSON; no DB-level constraint on mutual exclusivity exists today. |
| `sessions` | `session_date`, `recording_date` | `ux_student_date` (unique on `student_id, session_date`), `idx_sessions_tenant_date` | All session records are anchored here. The unique index already prevents duplicate same-student same-date sessions. |
| `memorization_records` | `session_id`, `tenant_id`, `record_type` | `idx_mem_session_type` | Records are linked to sessions via `session_id`. Record type is always `MEMORIZED`. |
| `revision_records` | `session_id`, `tenant_id` | `idx_revision_session` | Records are linked to sessions via `session_id`. |

### 1.2 API Endpoints

| Endpoint | Method | File | Current State | Required Changes |
|---|---|---|---|---|
| `/api/sessions` | POST | `src/server/routes/sessionRoutes.ts` → `sessionController.saveDailySession` | Validates schedule per session type; no mutual-exclusivity check at the session level. | Add mutual-exclusivity validation: if recording date already has a session for the opposite type, reject the save. |
| `/api/schools/update` | PUT | `src/server/routes/schoolRoutes.ts` → `schoolController.updateSchool` | Accepts schedule fields; normalizes via `ScheduleService`. No cross-validation of `session_type_day_map` for overlapping days. | Add validation: reject `session_type_day_map` entries where memorisation and revision share days. Add retroactive-session-invalidation warning. |
| `/api/schools/create` | POST | `src/server/routes/schoolRoutes.ts` → `schoolController.createSchool` | Accepts `sessionTypeDayMap` during creation. | Same cross-validation as update. |
| `/api/schools/me` | GET | `src/server/routes/schoolRoutes.ts` → `schoolController.getSchool` | Returns school config including schedule fields. | No functional change; ensure response includes validation metadata for frontend. |
| `/api/owner/schools` | POST/PUT | `src/server/routes/ownerManageRoutes.ts` → `ownerManagementController.createSchool/updateSchool` | Passes raw payload directly to `schoolService`. No schedule validation. | Must incorporate the same schedule validation via `ScheduleService.normalizeScheduleInput` and mutual-exclusivity checks. |
| `/api/sessions/history/:studentId` | GET | `src/server/routes/sessionRoutes.ts` → `sessionController.getSessionHistory` | Read-only history. | No functional change. |

### 1.3 Services & Controllers

| File | Current Responsibility | Changes Required |
|---|---|---|
| `src/server/services/scheduleService.ts` | Validates individual date per session type; resolves allowed days; normalizes input. | Add `validateMutualExclusivity()` method. Add `validateScheduleAlignment()` sub-function for session-level checks. Add `checkExistingOppositeTypeSession()` method. |
| `src/server/services/sessionService.ts` | Creates/finds sessions; idempotent same-day merge. | No structural change needed; controller handles validation before calling. |
| `src/server/services/schoolService.ts` | CRUD pass-through for school model. | Add DTO validation for schedule fields before persistence. |
| `src/server/controller/sessionController.ts` | Orchestrates session save. | Integrate mutual-exclusivity check before saving. Add contextual validation: when saving Hifz only, check no revision exists on that date; when saving revision only, check no Hifz exists on that date. |
| `src/server/controller/schoolController.ts` | Orchestrates school create/update. | Add schedule cross-validation; add retroactive-invalidation warning when schedule is tightened. |
| `src/server/controller/ownerManagementController.ts` | Owner-level school management. | Route through same validation pipeline as schoolController. |

### 1.4 Frontend Components

| File | Current Behaviour | Changes Required |
|---|---|---|
| `src/client/pages/sessions/DailySession.tsx` | Two separate save paths (`handleSaveHifz`, `handleSaveRevision`). `isDateValidForType()` checks single-type validity only. | Add `isDateConflictWithOtherType()` to check if opposing session type already occupies the date. Show notification popup via `showNotification()` (already imported and used throughout the page). |
| `src/client/pages/settings/Settings.tsx` — `StudyScheduleTab` | Toggle simple/advanced mode; per-type day chips. No cross-validation between memorisation and revision day selections. | Add real-time overlap detection: when advanced mode is active, highlight conflicting days between memorisation and revision. Disallow save if overlap exists. Add visual warning banner. |
| `src/client/pages/CreateSchool.tsx` | Simple study day selection only. | Add optional advanced mode toggle; include overlap detection if advanced mode used during creation. |

### 1.5 Integration Points Requiring Updates

1. **Attendance flow**: `attendanceService.markAttendance()` — no schedule changes needed; attendance inherits session validation.
2. **Progress computation**: `progressService.updateAggregatedProgress()` — no changes.
3. **Reports/Analytics**: `reportService`, `analyticsService`, `statsService` — no changes; they read from existing records.
4. **Session history**: `sessionHistoryService` — no changes.
5. **Student profile**: No changes.
6. **Notification system**: May optionally notify admins when schedule changes retroactively invalidate planned sessions.

---

## 2. Phase-by-Phase Implementation Plan

### Phase 1: Database & Model Layer (Foundation)

**Duration target**: 1 sprint

#### Task 1.1: Database Migration for Mutual Exclusivity

Create a new migration: `migrations/YYYYMMDDHHMMSS-add-mutual-exclusivity-validation.cjs`

- **Add stored function `fn_check_mutual_exclusivity(tenant_id BIGINT, session_date DATE, session_type VARCHAR)`**:
  - For a given tenant + date, checks if both a memorisation record (via `memorization_records`) and a revision record (via `revision_records`) exist on the same `session_date` via joined `sessions` table.
  - Returns `BOOLEAN` — `TRUE` if conflict exists, `FALSE` otherwise.
  - This provides a last-resort DB-level enforcement that the application layer can call.
- **Concurrency Strategy**: 
  - To prevent race conditions where two opposite session types are saved simultaneously, use a DB transaction with `SELECT ... FOR UPDATE` on the student's row or a similar locking mechanism to serialize checks for the same student/date.
- **Add composite partial index**:
  ```sql
  CREATE INDEX idx_mem_student_date_type ON memorization_records(tenant_id, session_date) 
    WHERE record_type = 'memorized';
  ```
  (If PostgreSQL — MySQL/MariaDB handles differently; Sequelize-level constraint is the primary approach given the dialect.)

- **Migration rollback**: Drop the function and index if they exist.

**File**: `migrations/YYYYMMDDHHMMSS-enforce-mutual-exclusivity.cjs`

#### Task 1.2: Model Validation Hook

Update `src/server/model/Session.ts`:

- Add a Sequelize `beforeCreate` and `beforeUpdate` hook that calls `ScheduleService.validateScheduleAlignment()`.
- This provides ORM-level enforcement so that even direct model access prevents violations.

#### Task 1.3: Constants / Canonical Session Type Registry

Update `src/server/constants.ts`:

```typescript
export const CANONICAL_SESSION_TYPES = {
  MEMORIZATION_DEFAULT: 'memorization:default',
  REVISION: 'revision',
} as const;

export const CANONICAL_SESSION_TYPE_LABELS: Record<string, string> = {
  'memorization:default': 'Memorization (Hifz)',
  'revision': 'Revision (Muraja\'ah)',
};

export const SCHEDULE_OVERLAP_ERROR_CODE = 'MUTUAL_EXCLUSIVITY_VIOLATION';
export const SCHEDULE_OUTSIDE_CALENDAR_ERROR_CODE = 'DATE_OUTSIDE_SCHOOL_CALENDAR';
```

---

### Phase 2: Service Layer — Schedule Validation Engine

**Duration target**: 1.5 sprints

#### Task 2.1: Mutual Exclusivity Validator

Update `src/server/services/scheduleService.ts` — add the following public static methods:

```typescript
/**
 * Checks if a session type can be recorded on a given date,
 * considering mutual exclusivity with the opposite type.
 *
 * @param school          The school (tenant) configuration
 * @param sessionType     The type being saved (e.g., 'memorization:default' or 'revision')
 * @param recordingDate   The target date (YYYY-MM-DD)
 * @param tenantId        The tenant ID (for DB checks)
 * @param studentId       Optional student ID for per-student checks
 * @param logId           Correlation ID for logging
 * @returns ValidationResult with { isValid, error, code, details }
 */
public static async validateMutualExclusivity(
  school: School,
  sessionType: SessionType,
  recordingDate: string,
  tenantId: number,
  studentId: number,
  logId: string
): Promise<ScheduleValidationResult>
```

Logic:

1. If `schedule_mode === 'simple'`: Skip — mutual exclusivity only applies to advanced mode.
2. Determine the **opposite type**:
   - `memorization:default` → `revision`
   - `revision` → `memorization:default`
3. Query existing sessions on the same `session_date` for the same student within the tenant.
4. If an existing session has records of the opposite type, return `{ isValid: false, code: 'MUTUAL_EXCLUSIVITY_VIOLATION' }`.
5. If no conflict, return `{ isValid: true }`.

**Database Query Strategy**:

```sql
SELECT 1 FROM sessions s
JOIN memorization_records mr ON mr.session_id = s.id
WHERE s.tenant_id = :tenantId
  AND s.student_id = :studentId
  AND s.session_date = :date
  AND s.deleted_at IS NULL
  AND mr.deleted_at IS NULL
LIMIT 1;
```

Run the reverse query for the opposite type. This is two lightweight `EXISTS` subqueries.

**Performance**: Add caching with a 60-second TTL (per tenant+date+student) to avoid repeated lookups for rapid UI interactions.

#### Task 2.2: Schedule Alignment Validator

Update `src/server/services/scheduleService.ts` — enhance existing `validateSchedule()`:

- Already validates session-type day alignment.
- Add `validateScheduleAlignment()` that also checks mutual exclusivity as a compound call.
- New public method:

```typescript
public static async validateFullScheduleCompliance(
  school: School,
  sessionType: SessionType,
  recordingDate: string,
  tenantId: number,
  studentId: number,
  logId: string
): Promise<ScheduleValidationResult>
```

This is the single entry point that:
1. Validates the date against school active calendar (`validateSchedule`)
2. Validates mutual exclusivity with opposite type (`validateMutualExclusivity`)
3. Returns the first failing result or `{ isValid: true }`

#### Task 2.3: Schedule Overlap Validator for School Config

Add to `src/server/services/scheduleService.ts`:

```typescript
/**
 * Validates that memorization and revision day assignments in
 * session_type_day_map do not overlap.
 */
public static validateNoDayOverlap(
  sessionTypeDayMap: Record<string, number[]>
): { isValid: boolean; overlappingDays?: number[]; error?: string }
```

Logic:

1. Extract `memorization:default` days and `revision` days from the map.
2. Compute intersection: `overlap = memDays.filter(d => revDays.includes(d))`.
3. If `overlap.length > 0`, return `{ isValid: false, overlappingDays: overlap }`.
4. Otherwise `{ isValid: true }`.

Used at:
- School settings save (frontend pre-check + backend enforcement)
- School creation
- Owner management school update

#### Task 2.4: Retroactive Invalidation Warning & Mode Transition

When a school schedule is updated and days are removed (either from `study_days` in simple mode or from `session_type_day_map` in advanced mode), future sessions on now-invalid days are not automatically deleted. Instead:

- Add `ScheduleService.detectRetroactiveConflicts()`:
  - Queries existing future sessions that fall on days no longer in the schedule.
  - Returns count and date list.
- Expose via `GET /api/schools/schedule-impact?newSchedule={...}`.
- Frontend shows a confirmation dialog: "Updating this schedule will affect X existing future sessions on [dates]. These sessions will no longer be editable."

**Mode Transition Handling (Simple $\rightarrow$ Advanced)**:
- When transitioning from Simple to Advanced mode, existing "Mixed" days (where a student has both Hifz and Revision) are grandfathered in.
- These records remain in the DB, but if a user attempts to *edit* one of these legacy "Mixed" sessions, the new mutual exclusivity rules apply, requiring them to remove one type to save changes.

---

### Phase 3: API / Controller Layer

**Duration target**: 1 sprint

#### Task 3.1: Session Save — Mutual Exclusivity Enforcement

Update `src/server/controller/sessionController.ts` — `saveDailySession()`:

Before the existing schedule validation block (currently around line 60-80), add:

```typescript
// Mutual Exclusivity Check (Advanced Mode Only)
const fullValidation = await ScheduleService.validateFullScheduleCompliance(
  school,
  sessionTypeForThisSave, // 'memorization:default' or 'revision' based on payload
  effectiveDate,
  tenantId,
  Number(studentId),
  correlationId
);

if (!fullValidation.isValid) {
  logger.warn('Mutual exclusivity violation blocked', {
    correlationId,
    tenantId,
    studentId: Number(studentId),
    sessionType: sessionTypeForThisSave,
    recordingDate: effectiveDate,
    code: fullValidation.code,
  });
  return res.status(409).json({
    error: fullValidation.error,
    code: fullValidation.code,
    details: fullValidation.details,
  });
}
```

**HTTP Status Code**: 409 Conflict for mutual exclusivity violations (distinguishes from 400 Bad Request for format issues).

#### Task 3.2: School Update — Overlap Enforcement

Update `src/server/controller/schoolController.ts` — `updateSchool()`:

Add after normalization and before calling `schoolService.updateSchool()`:

```typescript
if (normalizedSchedule.schedule_mode === 'advanced' && normalizedSchedule.session_type_day_map) {
  const overlapCheck = ScheduleService.validateNoDayOverlap(normalizedSchedule.session_type_day_map);
  if (!overlapCheck.isValid) {
    return res.status(400).json({
      error: 'Memorization and Revision days cannot overlap in advanced scheduling mode.',
      code: 'SCHEDULE_OVERLAP',
      details: { overlappingDays: overlapCheck.overlappingDays },
    });
  }
}
```

Also apply to `createSchool()`.

#### Task 3.3: Owner Management — Apply Same Validation

Update `src/server/controller/ownerManagementController.ts` — `createSchool()` and `updateSchool()`:

- Add call to `ScheduleService.normalizeScheduleInput()` before saving.
- Add overlap validation before persistence.
- Ensure mass-assignment prevention by using explicit DTO whitelists.

Current risk: `ownerManagementController.createSchool` passes `req.body` directly to `schoolService.createSchool(payload)`. This must be hardened:

```typescript
const safePayload: CreateSchoolDTO = {
  name: payload.name || payload.schoolName,
  slug: payload.slug,
  timezone: payload.timezone,
  study_days: ScheduleService.normalizeScheduleInput({ studyDays: payload.studyDays || payload.study_days }).study_days || [],
  schedule_mode: payload.schedule_mode || payload.scheduleMode || 'simple',
  session_type_day_map: payload.session_type_day_map || payload.sessionTypeDayMap || null,
  enabled_memorization_subtypes: payload.enabled_memorization_subtypes || payload.enabledMemorizationSubtypes || [],
};
```

#### Task 3.4: New Endpoint — GET /api/schools/schedule-validation

Optional convenience endpoint that allows the frontend to validate a proposed schedule before committing:

```
POST /api/schools/schedule-validation
Body: { scheduleMode, studyDays, sessionTypeDayMap }
Response: { isValid, errors[], warnings[] }
```

#### Task 3.5: Error Response Standardisation

All schedule validation errors must follow a consistent shape:

```typescript
interface ScheduleErrorResponse {
  error: string;           // User-facing message
  code: string;            // Machine-readable code
  details?: {
    sessionType?: string;
    recordingDate?: string;
    allowedDays?: number[];
    conflictingType?: string;
    overlappingDays?: number[];
    affectedSessionCount?: number;
  };
}
```

Error codes:
- `INVALID_SESSION_DAY` — Date not in school calendar
- `MUTUAL_EXCLUSIVITY_VIOLATION` — Day has opposite session type
- `SCHEDULE_OVERLAP` — Memorisation and revision days overlap in config
- `INVALID_DATE_FORMAT` — Bad date string
- `SCHEDULE_VALIDATION_ERROR` — Internal error

---

### Phase 4: Frontend Validation Layer

**Duration target**: 1.5 sprints

#### Task 4.1: DailySession — Conflict Detection

Update `src/client/pages/sessions/DailySession.tsx`:

Add state and a helper to detect when the selected date already has an opposing session type:

```typescript
const [dateConflict, setDateConflict] = useState<{
  hifz: boolean;
  revision: boolean;
}>({ hifz: false, revision: false });
```

New function:

```typescript
const checkDateConflicts = async (date: string) => {
  if (!schoolSchedule || schoolSchedule.schedule_mode !== 'advanced') return;
  try {
    // Use a debounced version of this call to prevent API hammering during rapid date changes
    const res = await fetch(`/api/sessions/check-conflict?studentId=${studentId}&date=${date}`);
    const data = await res.json();
    setDateConflict({
      hifz: data.hasRevisionOnDate || false,
      revision: data.hasMemorizationOnDate || false,
    });
  } catch {
    // Fail silently; backend enforces at save time
  }
};
```

**UI Changes**:

1. When `dateConflict.hifz` is `true`:
   - The "Save Hifz" button is disabled
   - An error notification popup fires via `showNotification('error', 'Date Conflict', 'A Revision session already exists on this date. Hifz and Revision cannot share the same day in Advanced Scheduling mode. Switch to a Hifz-allowed day or update the school schedule in Settings.')`

2. When `dateConflict.revision` is `true`:
   - Same pattern for the Revision save button.

3. Call `checkDateConflicts()` whenever `hifzDate` or `revisionDate` changes. Ensure the UI shows a loading indicator if the check takes > 100ms to prevent "stale" button states.

#### Task 4.2: Settings — Schedule Overlap Detection

Update `src/client/pages/settings/Settings.tsx` — `StudyScheduleTab`:

Add real-time overlap detection in the advanced mode:

```typescript
const getOverlappingDays = (): number[] => {
  const map = data.session_type_day_map || {};
  const memDays = map['memorization:default'] || [];
  const revDays = map['revision'] || [];
  return memDays.filter((d: number) => revDays.includes(d));
};

const overlappingDays = getOverlappingDays();
const hasOverlap = overlappingDays.length > 0;
```

**UI Changes**:

1. When `hasOverlap` is `true`:
   - Overlapping day chips render with a red border and an error icon.
   - A warning banner appears: "Memorization and Revision share {count} day(s). In Advanced mode, each day can only be assigned to one session type. Please resolve the overlap before saving."
   - The "Save Changes" button is disabled when overlap exists.

2. Visual distinction:
   - Memorisation-selected days: Primary/blue colour
   - Revision-selected days: Secondary/green colour
   - Conflicting days (both selected): Red/warning colour with pulse animation

#### Task 4.3: CreateSchool — Optional Advanced Mode

Update `src/client/pages/CreateSchool.tsx`:

- Add an "Enable Advanced Scheduling" toggle (default: off).
- When toggled on, reveal the same per-type day assignment UI used in Settings.
- Apply the same overlap detection from Task 4.2.
- Send `scheduleMode` and `sessionTypeDayMap` in the creation payload.

#### Task 4.4: Client-Side Validation Sequence

Before any save action (Hifz or Revision), the frontend validates in this order:

1. Required fields check (surah, ayah range, etc.)
2. Attendance status check (cannot save records for absent students)
3. Date format check
4. Date-in-school-calendar check (`isDateValidForType`)
5. Mutual exclusivity check (`checkDateConflicts`)
6. Only then call the backend API

If any step fails, do not proceed to the next; show the appropriate error notification popup via `showNotification()`.

---

### Phase 5: Error Handling & User Feedback

**Duration target**: 0.5 sprints (runs in parallel with Phase 4)

#### Task 5.1: Error Response Mapping

Define frontend error handling for all schedule-related error codes:

| Backend Code | User-Facing Message | Action |
|---|---|---|
| `MUTUAL_EXCLUSIVITY_VIOLATION` | "This date already has a {otherType} session. {currentType} cannot be recorded on the same day in Advanced mode." | Show error notification popup via `showNotification()` with suggestion to adjust the date or update school schedule in Settings |
| `INVALID_SESSION_DAY` | "{type} sessions are only available on {days}. The next available dates are: {nextDates}" | Show error notification popup via `showNotification()`; also highlight valid dates in date picker |
| `SCHEDULE_OVERLAP` | "Memorisation and Revision days overlap on {days}. Please assign each day to only one type." | Highlight conflicting chips |
| `DATE_OUTSIDE_SCHOOL_CALENDAR` | "The selected date is not within the school's active calendar." | Redirect to settings |

#### Task 5.2: Notification for Retroactive Invalidation

When a schedule update removes days, optionally create a `Notification` record for affected instructors:

```typescript
await notificationService.createBatchNotifications({
  tenantId,
  targetUserIds: affectedInstructorIds,
  type: 'SCHEDULE_CHANGED',
  title: 'School schedule updated',
  body: `The school schedule has been modified. ${affectedCount} existing future sessions on now-inactive days have been flagged for review.`,
});
```

---

### Phase 6: Test Coverage

**Duration target**: 1 sprint (runs alongside development)

#### Task 6.1: Unit Tests — ScheduleService

File: `src/server/tests/scheduleService.test.ts` (extend existing)

**Test cases**:

1. `validateMutualExclusivity`
   - [ ] Allows Hifz on a date with no existing Revision for same student
   - [ ] Allows Revision on a date with no existing Hifz for same student
   - [ ] Rejects Hifz when Revision already exists on same date for same student in advanced mode
   - [ ] Rejects Revision when Hifz already exists on same date for same student in advanced mode
   - [ ] Does not enforce mutual exclusivity in simple mode
   - [ ] Does not reject based on a different student's session on same date
   - [ ] Handles deleted (soft-deleted) sessions correctly

2. `validateNoDayOverlap`
   - [ ] Returns valid when memorisation and revision days are disjoint
   - [ ] Returns invalid with overlapping days when they intersect
   - [ ] Handles empty arrays gracefully
   - [ ] Handles missing session type entries (null/undefined)

3. `validateSchedule` (existing — extend)
   - [ ] Rejects dates outside school calendar in both simple and advanced mode

4. `validateFullScheduleCompliance` (integration)
   - [ ] Returns valid when both schedule alignment and mutual exclusivity pass
   - [ ] Returns schedule alignment error before mutual exclusivity check (fail-fast)
   - [ ] Returns mutual exclusivity error when schedule alignment passes but conflict exists

#### Task 6.2: Integration Tests — Session Save Flow

File: `src/server/tests/sessionSaveValidation.test.ts` (new)

**Test cases**:

1. [ ] POST `/api/sessions` with Hifz record on a valid memorisation day → 201
2. [ ] POST `/api/sessions` with Revision record on a valid revision day → 201
3. [ ] POST `/api/sessions` with Hifz on a Revision-only day (advanced mode) → 400
4. [ ] POST `/api/sessions` with Revision on a Hifz-only day (advanced mode) → 400
5. [ ] POST `/api/sessions` with Hifz on a date that already has a Revision session for same student (advanced) → 409
6. [ ] POST `/api/sessions` with Revision on a date that already has a Hifz session for same student (advanced) → 409
7. [ ] POST `/api/sessions` with Hifz on a date where a different student has Revision (advanced) → 201 (no cross-student conflict)
8. [ ] POST `/api/sessions` outside school calendar entirely → 400
9. [ ] POST `/api/sessions` with both Hifz and Revision in one payload (future bulk scenario) on a day valid for both → rejected if overlap exists in config
10. [ ] Concurrent requests: two simultaneous saves for same student+date+opposite types → only one succeeds, other gets 409

#### Task 6.3: Integration Tests — School Config Validation

File: `src/server/tests/schoolScheduleValidation.test.ts` (new)

**Test cases**:

1. [ ] PUT `/api/schools/update` with overlapping memorisation/revision days → 400 with `SCHEDULE_OVERLAP`
2. [ ] PUT `/api/schools/update` with valid non-overlapping advanced config → 200
3. [ ] POST `/api/schools/create` with overlapping days → 400
4. [ ] Simple mode update with only `studyDays` → 200 (no overlap check needed)
5. [ ] Switching from advanced (with defined per-type days) back to simple → 200, `session_type_day_map` retained
6. [ ] Owner management school update with overlapping days → 400

#### Task 6.4: End-to-End Tests — Frontend

**Manual test scenarios (UAT)**:

1. [ ] Log in → Navigate to Settings → Schedule tab → Toggle Advanced Scheduling On → Set Memorisation to [Mon, Wed, Fri] → Set Revision to [Tue, Thu] → Save → Verify success
2. [ ] In Settings → Advanced Mode → Set both Memorisation and Revision to [Mon] → Observe overlap warning → Save button is disabled
3. [ ] Navigate to Daily Session → Select a student → Select Monday → Save Hifz → Success → Then attempt to save Revision on same Monday → Observe conflict error via notification popup
4. [ ] Navigate to Daily Session → Select Tuesday (Revision day) → Save Revision → Success → Then attempt to save Hifz on same Tuesday → Observe conflict error via notification popup
5. [ ] Navigate to Daily Session → Select Sunday (not in school calendar) → Observe date blocked → Cannot save either type
6. [ ] Create new school with Advanced Scheduling enabled → Set non-overlapping days → School created successfully
7. [ ] Update school schedule to remove a day → Observe retroactive impact warning

#### Task 6.5: Edge Case Tests

1. [ ] **Bulk import scenario**: Simulate a bulk session import endpoint (future) — ensure each record is validated individually.
2. [ ] **Concurrent creation**: Two instructors save opposite session types for same student+date simultaneously — verify one gets 409.
3. [ ] **Schedule update with existing sessions**: Change advanced config to remove a day that has existing sessions — verify retroactive warnings are generated.
4. [ ] **Soft-deleted sessions**: Create Hifz session → Soft-delete it → Create Revision on same date → Should succeed (deleted sessions don't count).
5. [ ] **Midnight boundary**: Save session at 11:59 PM school time zone on a valid day → save another session 2 minutes later (next day) → both should validate independently.
6. [ ] **Empty `session_type_day_map`**: Advanced mode with null/empty map → falls back to `study_days` → no mutual exclusivity needed.
7. [ ] **Mixed student scenario**: Student A has Hifz on Monday → Student B saves Revision on Monday → Both succeed (mutual exclusivity is per-student, not per-school).

---

### Phase 7: Quality & Security

**Duration target**: Integrated across all phases

#### 7.1 Code Quality Standards

- All new TypeScript code must pass `tsc --noEmit` with `strict: true`.
- ESLint configuration: Enforce `no-unused-vars`, `no-explicit-any` (with explicit exceptions only), `prefer-const`.
- Prettier formatting consistency with existing codebase style.
- **Peer Review Requirement**: All PRs touching schedule validation must be reviewed by at least one senior developer. Review checklist:
  - [ ] All business rules are enforced
  - [ ] Edge cases covered
  - [ ] Performance impact assessed
  - [ ] Logging is appropriate
  - [ ] Error messages are user-friendly
- **Static Analysis Gate**: CI pipeline runs `tsc --noEmit`, ESLint, and Jest tests before merge.

#### 7.2 Security Requirements

1. **Authorization**: All schedule enforcement endpoints must:
   - Verify `req.user.tenantId` matches the target resource's tenant
   - Verify the authenticated user has appropriate role (instructor/admin)
   - For owner management: verify owner-only middleware is applied

2. **Input Sanitisation**:
   - `session_date` / `recording_date`: Must match `/^\d{4}-\d{2}-\d{2}$/` regex before processing
   - Session type IDs: Must be whitelisted against `CANONICAL_SESSION_TYPES`
   - `session_type_day_map` values: Each array must contain only integers 0-6, no duplicates
   - All string inputs sanitised against SQL injection (Sequelize parameterised queries handle this by default, but raw queries must use `replacements`)

3. **Injection Protection**:
   - No raw SQL string concatenation
   - Stored function `fn_check_mutual_exclusivity` uses parameterised arguments
   - JSON fields validated before write (JSON Schema or manual type-checking)

4. **Rate Limiting**:
   - Use existing `rateLimitMiddleware` on `/api/sessions` POST — ensure concurrent requests from the same source don't bypass exclusivity checks.

5. **Mass Assignment Prevention**:
   - Explicit DTO interfaces in `schoolService` are already defined.
   - `ownerManagementController` must be updated to use these DTOs instead of passing raw `req.body`.

#### 7.3 Compliance

- **Educational Data Standards**: The system stores only session scheduling data, not personally identifiable educational records beyond what is already stored. No new PII is introduced.
- **Data Minimisation**: Only the minimum required fields (`session_date`, `recording_date`, `student_id`, `tenant_id`) are used for validation queries.
- **Audit Trail**: All schedule configuration changes are logged with the acting user ID, timestamp, and before/after state.
- **Data Retention**: Soft-deleted sessions are excluded from mutual exclusivity checks.

#### 7.4 Logging & Monitoring

Use existing `logger` utility (`src/server/utils/logger.ts` — Winston-based) consistently:

**Logging Events**:

| Event | Level | Fields |
|---|---|---|
| Mutual exclusivity violation blocked | `warn` | `correlationId, tenantId, studentId, sessionType, recordingDate, code` |
| Schedule overlap rejected during config update | `warn` | `correlationId, tenantId, overlappingDays, userId` |
| Session saved successfully with schedule validation | `info` | `correlationId, tenantId, studentId, sessionType, recordingDate` |
| School schedule updated (mode change) | `info` | `correlationId, tenantId, oldMode, newMode, userId` |
| School schedule updated (day changes) | `info` | `correlationId, tenantId, affectedFutureSessionCount, userId` |
| Schedule validation error (internal) | `error` | `correlationId, tenantId, error, stack` |
| Concurrent conflict detected | `warn` | `correlationId, tenantId, studentId, date, existingType, attemptedType` |

**Alerting Thresholds** (suggested — not implemented in this plan):

- > 5 mutual exclusivity violations per tenant per hour → possible UI misunderstanding or configuration error
- > 50 `INVALID_SESSION_DAY` errors per hour → possible frontend bug or bulk import issue
- > 10 schedule configuration changes per day → possible admin error or abuse

---

### Phase 8: Quality Assurance & Regression

#### 8.1 UAT Test Scenarios

| # | Scenario | Expected Outcome |
|---|---|---|
| UAT-1 | Admin enables advanced mode, sets non-overlapping days, saves successfully | Settings saved; instructors see correct per-type day constraints |
| UAT-2 | Instructor saves Hifz on Monday (Hifz day), then immediately tries saving Revision on Monday | Revision save rejected with clear "conflict" message |
| UAT-3 | Instructor saves Revision on Tuesday (Revision day), then saves Hifz on Tuesday | Hifz save rejected with clear "conflict" message |
| UAT-4 | Admin sets overlapping days in advanced mode settings | Save button disabled; overlap warning visible |
| UAT-5 | Instructor selects a date outside school calendar | Date picker highlights invalid; save button disabled |
| UAT-6 | Admin switches from advanced back to simple mode | All session types now use `study_days`; no mutual exclusivity enforced |
| UAT-7 | Owner manages a school and attempts to set overlapping days | Same validation as regular admin; overlapping rejected |
| UAT-8 | Concurrent saves from two instructors for same student+date+opposite types | First save succeeds; second gets 409 Conflict |

#### 8.2 Performance Benchmarks

| Metric | Target | Measurement Method |
|---|---|---|
| Schedule validation latency (DB + logic) | < 50ms p95 | Server-side timing logs |
| Mutual exclusivity check latency | < 30ms p95 (cached), < 100ms p95 (uncached) | Server-side timing logs |
| Session save endpoint (including validation) | < 200ms p95 | Existing endpoint latency monitoring |
| Schedule config update endpoint | < 100ms p95 | Standard API monitoring |
| Frontend conflict check (API call) | < 200ms end-to-end | Browser Network tab |

**Optimisation strategies**:
- In-memory cache for school schedule config (TTL: 60s; invalidated on config update).
- Indexed queries on `sessions(session_date, tenant_id, student_id)` — already exists via `ux_student_date`.
- Batch pre-computation of "valid session dates" on frontend after schedule fetch.

#### 8.3 Regression Testing Protocol

Before each deployment, run:

1. Full existing test suite: `npm test` — all existing tests must pass.
2. New schedule validation test suite.
3. Manual smoke test: Simple-mode school saves a session successfully (no regression).
4. Manual smoke test: Advanced-mode school with pre-existing overlapping config (legacy) continues to work (backward compatibility — overlap only enforced on new saves, not retroactively).
5. API contract test: Old frontend clients (without `scheduleMode` field) can still save sessions.

**Backward Compatibility Checklist**:

- [ ] Schools with `schedule_mode = 'simple'` — no behavioural change
- [ ] Schools with `session_type_day_map = null` — no behavioural change
- [ ] Old clients sending only `sessionDate` (no `recordingDate`) — still accepted
- [ ] Old clients sending only `studyDays` (no `scheduleMode`) — still accepted
- [ ] Sessions created before the migration are not retroactively invalidated
- [ ] Reporting, analytics, and history endpoints continue to return data correctly
- [ ] Attendance-only saves (no Hifz or Revision records) are not blocked by schedule rules

---

## 3. File Impact Summary

### Backend — Files to Modify

| File | Scope of Changes |
|---|---|
| `src/server/services/scheduleService.ts` | **Major** — Add `validateMutualExclusivity()`, `validateNoDayOverlap()`, `validateFullScheduleCompliance()` |
| `src/server/controller/sessionController.ts` | **Moderate** — Integrate mutual exclusivity check before session save; contextual validation |
| `src/server/controller/schoolController.ts` | **Moderate** — Add overlap validation on create/update; retroactive invalidation warnings |
| `src/server/controller/ownerManagementController.ts` | **Moderate** — Apply DTO whitelisting; pass through schedule validation |
| `src/server/services/schoolService.ts` | **Minor** — Add DTO-level validation for schedule fields |
| `src/server/model/Session.ts` | **Minor** — Add `beforeCreate`/`beforeUpdate` hooks for ORM-level enforcement |
| `src/server/constants.ts` | **Minor** — Add session type constants and error codes |
| `src/server/routes/schoolRoutes.ts` | **Minor** — Add optional `/schedule-validation` endpoint |

### Backend — Files to Create

| File | Purpose |
|---|---|
| `migrations/YYYYMMDDHHMMSS-enforce-mutual-exclusivity.cjs` | DB-level stored function and index for mutual exclusivity |
| `src/server/tests/sessionSaveValidation.test.ts` | Integration tests for session save validation |
| `src/server/tests/schoolScheduleValidation.test.ts` | Integration tests for school schedule validation |

### Frontend — Files to Modify

| File | Scope of Changes |
|---|---|
| `src/client/pages/sessions/DailySession.tsx` | **Major** — Add conflict detection, notification popups via `showNotification()`, date picker validation |
| `src/client/pages/settings/Settings.tsx` | **Moderate** — Add overlap detection in StudyScheduleTab, disable save on overlap |
| `src/client/pages/CreateSchool.tsx` | **Moderate** — Add optional advanced mode toggle with overlap detection |

### No Files to Delete

---

## 4. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Legacy schools with pre-existing overlapping config see previously valid sessions blocked | Medium | High | Only enforce on **new** session saves, not retroactively. Schools with existing overlap get a warning but are not blocked from creating new sessions on either type (grace period). |
| Performance regression from per-save DB lookups | Low | Medium | In-memory cache with 60s TTL; indexes already in place. |
| Frontend date picker UX confusion when valid dates shift by session type | Medium | Low | Colour-code the calendar: blue = memorisation, green = revision, grey = unavailable. Show legend. |
| Owner management bypasses validation | High | High | Explicitly add same validation path to owner management controllers. |
| Concurrent save race condition | Low | High | Database unique index on `(student_id, session_date)` already prevents duplicate sessions. Mutual exclusivity check + unique index together cover this. |
| Timezone edge cases at midnight boundaries | Medium | Medium | Use school-configured timezone for all date calculations (already partially implemented in ScheduleService). |

---

## 5. Success Criteria

- [ ] Memorisation session rejected (409) when Revision already exists on same date in advanced mode
- [ ] Revision session rejected (409) when Memorisation already exists on same date in advanced mode
- [ ] Sessions on days outside school calendar rejected (400) in both simple and advanced mode
- [ ] School config update with overlapping memorisation/revision days rejected (400)
- [ ] All existing functionality (simple mode, old clients, reports, analytics) continues to work
- [ ] All test suites pass (existing + new)
- [ ] Frontend provides clear, actionable feedback for all violation scenarios
- [ ] All schedule violations are logged with structured data
- [ ] Performance benchmarks met (p95 < 200ms for session save)

---

*Plan version: 1.0 — 2026-06-21*
