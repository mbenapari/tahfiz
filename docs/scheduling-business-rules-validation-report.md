# Scheduling Business Rules Validation Report

## Scope

This report records the implementation status of the scheduling enforcement plan in `docs/scheduling-business-rules-enforcement-plan.md` and maps each mandatory rule to the deployed code paths.

## Extracted Mandatory Requirements

### Business Rules

1. Advanced scheduling mode must prevent Memorization and Revision from sharing the same day.
2. All session records must fall inside the school operating calendar.
3. Absent students must not receive lesson records.
4. School configuration updates must reject overlapping advanced-mode day maps.
5. Owner-management school create/update flows must apply the same validation as standard admin flows.
6. Frontend save flows must validate required fields, attendance, date format, school calendar, and mutual exclusivity before POST.
7. Existing future sessions affected by schedule tightening must produce impact warnings instead of silent deletion.

### Technical Requirements

1. Enforce rules across database, service/controller, and frontend layers.
2. Standardize machine-readable schedule error codes.
3. Add conflict-check and schedule-validation APIs for proactive frontend validation.
4. Preserve simple-mode and legacy fallback behavior.
5. Add automated tests covering schedule validation, mutual exclusivity, and school-config enforcement.

### Compliance And Security Requirements

1. Validate date format before processing.
2. Sanitize `study_days` and `session_type_day_map` values to integers `0-6` with no duplicates.
3. Prevent owner-path mass assignment by explicit DTO construction.
4. Exclude soft-deleted records from mutual exclusivity checks.
5. Log rule violations and schedule updates with correlation-aware context.

## Implementation Roadmap To Module Mapping

| Requirement | Implemented In |
|---|---|
| Canonical scheduling constants and error codes | `src/server/constants.ts` |
| Day-map normalization, overlap detection, calendar validation, mutual exclusivity checks, retroactive impact detection | `src/server/services/scheduleService.ts` |
| DTO-level schedule validation before persistence | `src/server/services/schoolService.ts` |
| Session save enforcement, absent-student blocking, conflict-check endpoint | `src/server/controller/sessionController.ts`, `src/server/routes/sessionRoutes.ts` |
| School create/update validation, validation metadata, schedule-impact and draft-validation endpoints | `src/server/controller/schoolController.ts`, `src/server/routes/schoolRoutes.ts` |
| Owner school create/update hardening with explicit DTO mapping | `src/server/controller/ownerManagementController.ts` |
| ORM-level optional school-calendar hook | `src/server/model/Session.ts` |
| Frontend Daily Session conflict detection and validation ordering | `src/client/pages/sessions/DailySession.tsx` |
| Frontend Settings overlap detection and save blocking | `src/client/pages/settings/Settings.tsx` |
| Frontend school creation advanced scheduling controls | `src/client/pages/CreateSchool.tsx` |
| DB support for scheduling conflict function and missing note table used by existing tests | `migrations/20260621120000-enforce-mutual-exclusivity.cjs`, `migrations/20260621121000-create-instructor-notes.cjs` |
| Automated scheduling coverage | `src/server/tests/scheduleService.test.ts`, `src/server/tests/sessionSaveValidation.test.ts`, `src/server/tests/schoolScheduleValidation.test.ts` |

## Delivered Changes

### Backend

- Added canonical session type and error-code constants for schedule enforcement.
- Expanded `ScheduleService` with strict input normalization, overlap validation, school-calendar validation, mutual exclusivity checks, date-conflict caching, and retroactive schedule impact detection.
- Enforced absent-student lesson blocking in `saveDailySession()`.
- Added `GET /api/sessions/check-conflict` for frontend date conflict detection.
- Added `GET /api/schools/schedule-impact` and `POST /api/schools/schedule-validation`.
- Added school response `validationMetadata` for schedule-aware clients.
- Hardened owner-management school writes with explicit DTO shaping instead of raw body pass-through.

### Frontend

- Added date conflict checks and disabled save buttons for conflicting Hifz/Revision dates.
- Added real-time advanced-mode overlap warnings and disabled Settings save when overlap exists.
- Added optional advanced scheduling setup during school creation with overlap prevention.
- Preserved fallback behavior for simple mode and schools without advanced maps.

### Database

- Added `fn_check_mutual_exclusivity(...)` PostgreSQL helper function.
- Added `idx_sessions_tenant_student_date` to support efficient conflict lookups.
- Added the missing `instructor_notes` migration so the existing repository schema matches the current model set.

## Validation Coverage

### Automated Suites Executed

Command:

```bash
npm test -- --runInBand src/server/tests/scheduleService.test.ts src/server/tests/sessionSaveValidation.test.ts src/server/tests/schoolScheduleValidation.test.ts
```

Result:

- 3 test suites passed
- 34 tests passed
- Covered service rules, session-save enforcement, school-config rejection paths, and owner-path error handling

### Validated Rule Coverage

- `validateSchedule()` covers session-type day enforcement.
- `validateSchoolCalendarDate()` covers operating-calendar enforcement.
- `validateMutualExclusivity()` covers opposite-type same-student same-date blocking, simple-mode bypass, empty-map bypass, and soft-delete query filtering.
- `saveDailySession()` tests cover valid Hifz/Revision saves, invalid-session-day rejection, 409 mutual exclusivity rejection, absent-student rejection, and mixed-payload advanced-mode rejection.
- `schoolController` and `ownerManagementController` tests cover overlap rejection and valid/non-overlapping updates.

## Known Repository-Level Gaps

Running the full repository Jest suite still exposes unrelated pre-existing failures outside the scheduling scope:

1. `instructorNote.test.ts` expects stronger XSS sanitization than the current instructor note service performs.
2. `revisionPerformance.test.ts` expects null handling for unrated records that is not currently implemented in the revision performance service.
3. `userServiceLimit.test.ts` has an existing mock setup issue against the `User` model export.

These failures are not introduced by the scheduling changes, but they prevent whole-repository sign-off until resolved separately.

## Sign-Off Status

- Scheduling implementation: complete for the documented business rules delivered in this change set.
- Scheduling validation suite: passed.
- Whole-repository regression sign-off: blocked by unrelated pre-existing test failures listed above.
