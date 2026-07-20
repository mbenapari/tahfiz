

```markdown
# Extended Session Type Scheduling Solution Plan (Revised)

*Based on internal review, this document has been updated to address edge cases, performance considerations, and UX refinements. Revisions are integrated throughout.*

---

## Objective
Design a scalable scheduling model that supports:

- the existing simple school-wide day selection workflow
- an optional advanced mode with day assignment per session type
- future expansion for multiple memorization subtypes
- user-selectable session recording dates
- strict backend and frontend validation
- full backward compatibility for existing schools, routes, reports, and workflows

This document is analysis and implementation planning only. No production code changes are included.

---

## Executive Summary

### Recommendation
Do not introduce only separate `memorization_days` and `revision_days` fields.

Instead, keep the existing `study_days` field as the legacy and simple-mode source of truth, then add an opt-in advanced scheduling layer on `School` using:

- `schedule_mode`: `'simple' | 'advanced'`
- `session_type_day_map`: JSON object keyed by canonical session type IDs
- `enabled_memorization_subtypes`: optional JSON array so schools with multiple memorization subtypes can configure them without future schema churn

For `Session`, do not replace `session_date` immediately because it is already used across analytics, reporting, history, attendance, and deduplication. Add a new explicit date field such as `recording_date`, then mirror it to `session_date` during the transition period so all existing services continue to work unchanged.

### Why this is the best long-term option

- It preserves the current workflow for existing schools.
- It supports the simpler "memorization vs revision" split.
- It also scales to per-subtype memorization day assignment without another schema redesign.
- It avoids breaking all current reporting and analytics code that depends on `session_date`.
- It allows the frontend to expose a simple toggle while the backend maintains a single extensible validation model.

---

## Current State Audit

### Backend Findings

#### 1. Current school scheduling model

Current school scheduling is modeled only at the school level.

Observed in `src/server/model/School.ts`:

- `study_days` is the only day-selection field.
- It is stored as `DataTypes.JSON`.
- There is no schedule mode.
- There is no per-session-type schedule.
- There is no subtype catalog for memorization.

Observed in `src/server/controller/schoolController.ts`:

- school creation accepts `studyDays` from the frontend as weekday strings such as `MON`, `TUE`
- these are mapped to numeric days `0-6`
- school update accepts either strings or numbers and normalizes them to numeric values
- there is no structural validation beyond array coercion
- there is no validation for minimum one active day
- there is no validation for duplicate days or out-of-range values

Observed in `src/server/services/schoolService.ts`:

- create/update are pass-through operations
- no domain validation exists for school schedule payloads
- owner management routes can also pass raw school payloads directly into the service

#### 2. Current session model

Observed in `src/server/model/Session.ts`:

- `session_date` is the only date field representing the session day
- there is no separate explicit "recorded for" date field
- the unique index `ux_student_date` is on `['student_id', 'session_date']`
- reporting and retrieval indexes also depend on `session_date`

Important behavior:

- `sessionService.createSession()` first looks up an existing session by `student_id + tenant_id + session_date`
- if found, it reuses the session instead of creating a new one
- this is how separate Hifz and Revision saves on the same day collapse into one session

#### 3. How memorization and revision are modeled today

The system currently does not model "session type" at the `Session` level.

Instead:

- Hifz is inferred from the presence of `hifzRecord` in `sessionController.saveDailySession()`
- Revision is inferred from the presence of `revisionRecord`
- a single session can contain attendance only, Hifz only, Revision only, or both Hifz and Revision

Observed in `src/server/model/MemorizationRecord.ts`:

- memorization rows have a `record_type`
- the enum includes both `MEMORIZED` and `REVISED`
- however the current services force memorization records to `MEMORIZED`

Observed in `src/server/services/memorizationService.ts`:

- memorization records are always persisted as `RecordType.MEMORIZED`
- the service comment explicitly states revision is stored separately

Observed in `src/server/model/RevisionRecord.ts`:

- revision is a separate table entirely
- revision subtype is not explicit
- revision mode is inferred from populated fields:
  - page revision: `start_page` / `end_page`
  - surah revision: `start_surah_number` / `end_surah_number` and ayah range

Implication:

- the current data model supports only two practical scheduling dimensions:
  - memorization
  - revision
- it does not yet support explicit memorization subtypes without new metadata

#### 4. Current session validation

Observed in `src/server/controller/sessionController.ts`:

- validates that at least one of Hifz, Revision, or Attendance exists
- validates Hifz ayah ranges and surah bounds
- validates revision ranges using `validateRevisionRecord()`
- validates revision rating range
- does not validate school-configured allowed days
- does not validate date format rigorously
- does not validate timezone-aware day-of-week against school configuration
- does not validate session type against a server-side allowlist

Observed in `src/server/services/sessionService.ts`:

- no scheduling validation exists
- no day-of-week validation exists
- no school lookup occurs before session creation

#### 5. Current route and service dependency map

The following backend surfaces are directly affected or downstream-dependent:

##### Creation and settings

- `src/server/routes/sessionRoutes.ts`
- `src/server/controller/sessionController.ts`
- `src/server/services/sessionService.ts`
- `src/server/routes/schoolRoutes.ts`
- `src/server/controller/schoolController.ts`
- `src/server/services/schoolService.ts`
- `src/server/routes/ownerManageRoutes.ts`
- `src/server/controller/ownerManagementController.ts`

##### Session-date dependent consumers

- `src/server/services/sessionHistoryService.ts`
- `src/server/services/reportService.ts`
- `src/server/services/analyticsService.ts`
- `src/server/services/statsService.ts`
- `src/server/services/attendanceService.ts`
- `src/server/services/userService.ts`

These services currently depend on `session_date` for:

- ordering
- date filtering
- attendance calculations
- active student metrics
- reports and CSV exports
- student profile timelines
- history responses

Any change that removes or redefines `session_date` without a compatibility layer will break current behavior.

#### 6. Current backend risks discovered during audit

##### Risk A: schedule enforcement does not exist

Schools can configure `study_days`, but those days are not enforced when saving sessions.

##### Risk B: "today only" is currently a frontend behavior, not a backend rule

The backend accepts `sessionDate` from the request. The real restriction comes from the frontend, which always sends today's date.

##### Risk C: timezone handling is weak

Multiple services derive dates using `new Date().toISOString().split('T')[0]`, which is UTC-based and can drift from the school's configured timezone.

##### Risk D: payload shape inconsistency exists for study days

Current inputs vary across surfaces:

- strings like `MON`, `TUE`
- numeric day indexes
- raw JSON from owner management

This is manageable now but becomes fragile once advanced schedules are added.

##### Risk E: school table naming verified

The `School.ts` model uses `tableName: 'tenants'`, and it has been verified that the physical database table is indeed named `tenants`. All migrations should target the `tenants` table.

##### Risk F: attendance status mismatch already exists

`DailySession.tsx` can submit `late`, while `AttendanceStatus` currently supports only:

- `present`
- `absent`
- `excused`

This is outside the scheduling feature itself, but it should be corrected while touching the session save contract.

##### Risk G: validation and logging are inconsistent

- `schoolController.ts` uses `console.error` instead of the existing logger utility
- owner management school create/update accepts broad raw payloads
- new scheduling fields must not be mass-assigned without whitelist validation

---

### Frontend Findings

#### 1. Current school creation and settings workflow

Observed in `src/client/pages/CreateSchool.tsx`:

- school setup only supports `studyDays`
- there is no advanced scheduling mode
- there is no session-type concept

Observed in `src/client/pages/settings/Settings.tsx`:

- the schedule tab edits only `schoolData.study_days`
- the save payload only sends `studyDays`
- there is no UI for per-type day assignment
- there is no UX distinction between simple mode and advanced mode

Observed in `src/client/pages/owner/ManageSchools.tsx`:

- owner management currently exposes raw `study_days` JSON editing
- this page will also need compatibility handling once new schedule fields exist

#### 2. Current Daily Session workflow

Observed in `src/client/pages/sessions/DailySession.tsx`:

- the header displays the current date as read-only
- `handleSaveHifz()` always sends:
  - `sessionDate: new Date().toISOString().split('T')[0]`
- `handleSaveRevision()` always sends:
  - `sessionDate: new Date().toISOString().split('T')[0]`
- there is no date picker
- there is no school schedule lookup
- there is no client-side validation against allowed days
- there is no invalid-date helper message
- there is no settings deep link for schedule corrections

#### 3. Current frontend implications

- the UI currently assumes all session types can be recorded on the same date
- there is no state representing selected session type for scheduling purposes
- the frontend does not know whether the school is in simple mode or advanced mode
- there is no shared schedule contract from backend to frontend

---

## Option Evaluation

## Option 1: Add Only `memorization_days` and `revision_days`

### Advantages

- simple to understand
- minimal initial UI changes
- covers the common split between memorization and revision

### Limitations

- does not support multiple memorization subtypes
- requires another schema redesign later
- duplicates schedule fields and logic
- encourages special-case validation branches
- does not generalize well for future session categories

### Verdict

Useful only as a short-lived stopgap. Not recommended as the primary design.

## Option 2: Add a Generic Per-Session-Type Day Map

Example concept:

```json
{
  "revision": [0, 2, 4],
  "memorization:default": [1, 3, 5],
  "memorization:sabaq": [1, 3],
  "memorization:sabaqi": [2, 4],
  "memorization:manzil": [0, 6]
}
```

### Advantages

- supports memorization vs revision immediately
- supports per-subtype memorization scheduling without schema churn
- supports future session categories and subtypes
- can still power a very simple UI through a mode toggle
- centralizes validation in one generic service

### Limitations

- requires a slightly richer UI and API contract
- needs a canonical session type registry

### Verdict

Recommended. This is the only option that satisfies both backward compatibility and long-term scalability.

---

## Recommended Architecture

## 1. School Configuration Model

Retain the current field:

- `study_days: number[]`

Add:

- `schedule_mode: 'simple' | 'advanced'`
- `session_type_day_map: Record<string, number[]> | null`
- `enabled_memorization_subtypes: Array<{ key: string; label: string; active: boolean }> | null`

### Design Guardrails

- **Calendar Date Integrity:** `recording_date` must be stored as a `DATE` type (YYYY-MM-DD) to ensure it remains a calendar date, avoiding timestamp drift across timezones.
- **Timezone Anchoring:** All day-of-week validations must be performed using the school's configured timezone via `luxon` or `moment-timezone` to prevent the "Midnight Problem" (where a save at 12:05 AM UTC is technically a different day than the local school date).
- **Mode Transition UX:** When switching from `simple` $\to$ `advanced`, the `session_type_day_map` is pre-populated with `study_days`. The UI should provide a confirmation prompt to let users know their existing schedule has been mirrored across all session types.
- **Session Consolidation:** Since the `ux_student_date` index on `session_date` forces a single session per student per day, validation for "Advanced Mode" must be applied at the point of save for the specific session type being recorded.

### Recommended semantics


#### `study_days`

- remains the simple-mode source of truth
- remains the compatibility fallback for all existing schools
- remains editable in simple mode

#### `schedule_mode`

- `simple`: current behavior
- `advanced`: use `session_type_day_map` for type-specific scheduling

#### `session_type_day_map`

- optional in the database
- only used when `schedule_mode = 'advanced'`
- keys are canonical server-approved session type IDs
- values are weekday arrays using the same `0-6` numeric convention

#### `enabled_memorization_subtypes`

- optional
- only needed for schools that actually use multiple memorization subtypes
- allows the UI to render subtype rows dynamically
- avoids hardcoding subtype labels into the schema

### Backward compatibility rule

If `schedule_mode` is absent or `simple`, then:

- all session types use `study_days`

If `schedule_mode = 'advanced'`, then:

- use `session_type_day_map[sessionType]` when present
- if a session type is missing from the map, fall back to `study_days`

This fallback prevents accidental lockouts during migration and partial configuration.

### Mode Switching Behavior

- **Switching `advanced` → `simple`**: The `session_type_day_map` is **retained** in the database but ignored. This allows seamless return to advanced mode without reconfiguring.
- **Switching `simple` → `advanced`**: The system will **automatically pre-populate** `session_type_day_map` with `study_days` for all known canonical session types (e.g., `memorization:default`, `revision`). This prevents a school from entering advanced mode with an empty/blocked schedule.
- A convenience API endpoint (`POST /api/schools/preview-mode-switch`) may be implemented to show admins what the advanced map will look like before committing.

---

## 2. Session Date Model

Retain existing:

- `session_date`

Add:

- `recording_date` as `DATEONLY`

### Why this is necessary

The project requirement asks for an explicit field representing the user-selected recording date. However:

- `session_date` is already deeply integrated across the codebase
- replacing it in one step would create high regression risk

### Recommended transition rule

During the first implementation phase:

- `recording_date` becomes the new explicit request field
- `session_date` is still populated with the same value
- reads continue using `session_date`
- new validation logic uses `recording_date || session_date`

Later, after full rollout and backfill verification:

- services can be incrementally migrated to read `recording_date`
- `session_date` can remain as a compatibility alias for older consumers

### Index strategy

Phase 1:

- keep existing unique index on `student_id + session_date`
- add a non-unique index on `recording_date`

Phase 2, only if needed:

- backfill all rows
- migrate uniqueness semantics to `student_id + recording_date`

This avoids a dangerous high-blast-radius migration.

---

## 3. Canonical Session Type Strategy

Introduce a server-side session type registry rather than trusting raw frontend strings.

### Base types

- `revision`
- `memorization:default`

### Optional future memorization subtype examples

- `memorization:sabaq`
- `memorization:sabaqi`
- `memorization:manzil`

The exact subtype labels should be configurable or server-seeded, but the backend must only accept whitelisted IDs.

### Important design choice

Do not schedule revision separately by "page" vs "surah" at this stage.

Reason:

- page vs surah is currently a content-entry mode inside the same revision workflow
- it is not modeled as a distinct educational session type today
- splitting it now increases complexity without a proven business requirement

If later needed, the generic map can support:

- `revision:page`
- `revision:surah`

without another schema redesign.

---

## Validation Design

## 1. Single Schedule Resolution Function

Introduce one backend scheduling resolver used by:

- session create/update
- school settings normalization
- future calendar or availability APIs

Suggested behavior:

1. Load the school by `tenant_id`
2. Determine active schedule mode
3. Resolve the canonical session type
4. Determine allowed day indexes
5. Compute weekday from the selected date in the school's timezone
6. validate membership
7. return a structured result for error handling and frontend display

### Resolution rules

#### Simple mode

- allowed days = `study_days`

#### Advanced mode

- allowed days = `session_type_day_map[sessionType]`
- fallback = `study_days` if type is not configured

---

## 2. Validation for requests containing multiple record types

The current API can accept both Hifz and Revision in one request.

**Crucial distinction for Daily Session UI:**  
The frontend currently saves Hifz and Revision via **separate buttons**. Therefore, the backend validation strategy must be **contextual**:

- If the payload contains **only Hifz** records: validate against `memorization:default` (or the specific subtype selected).
- If the payload contains **only Revision** records: validate against `revision`.
- If a **hypothetical future bulk/batch payload** includes *both* types simultaneously: resolve all included session types. The selected date must be valid for **every** included type; if not, reject the entire batch with a composite error naming each invalid type.

> **Why this nuance:** Enforcing a strict "both must be valid" rule on the current separate-save flows would prevent a teacher from recording Hifz on a Monday if Revision is not allowed that day, even though they are only trying to save Hifz. The backend must adapt to the frontend's actual usage patterns while still enforcing the rules per type.

### Error response shape

Use safe, user-friendly responses:

```json
{
  "error": "The selected date is not available for Revision sessions.",
  "code": "INVALID_SESSION_DAY",
  "details": {
    "sessionType": "revision",
    "recordingDate": "2026-06-18",
    "allowedDays": [2, 4],
    "allowedDatesPreview": ["2026-06-20", "2026-06-22", "2026-06-27"]
  }
}
```

Do not expose internal stack traces to the client.

---

## 3. Timezone-safe day calculation

Never derive the weekday using raw browser locale or server UTC defaults.

Always:

- parse the selected `recording_date`
- evaluate its weekday in the school's configured timezone using a robust library (e.g., `luxon` or `moment-timezone`)

Why:

- a school in `Asia/Riyadh` and a browser in `America/New_York` can disagree on what "today" means
- `toISOString().split('T')[0]` is UTC-based and can shift the effective day around midnight

---

## 4. Validation hardening rules

Add strict validation for:

- valid ISO date-only format
- allowed day values are integers `0-6`
- no duplicate weekday entries
- at least one active day in simple mode
- whitelisted session type IDs only
- school belongs to authenticated tenant
- session student belongs to tenant
- graceful fallback for legacy schools with only `study_days`

---

## API Design Proposal

## 1. School APIs

### Existing endpoints to extend

- `GET /api/schools/me`
- `PUT /api/schools/update`
- `POST /api/schools/create`
- owner management school endpoints

### Response shape

Return a normalized scheduling block instead of only raw fields.

Suggested response shape:

```json
{
  "id": 12,
  "name": "Al-Huda Academy",
  "timezone": "Asia/Riyadh",
  "study_days": [1, 2, 3, 4, 5],
  "schedule_mode": "simple",
  "session_type_day_map": null,
  "enabled_memorization_subtypes": [],
  "supported_session_types": [
    { "id": "memorization:default", "label": "Memorization", "group": "memorization" },
    { "id": "revision", "label": "Revision", "group": "revision" }
  ]
}
```

### Update payload

Suggested request contract:

```json
{
  "schoolName": "Al-Huda Academy",
  "timezone": "Asia/Riyadh",
  "studyDays": [1, 2, 3, 4, 5],
  "scheduleMode": "advanced",
  "sessionTypeDayMap": {
    "memorization:default": [1, 3, 5],
    "revision": [2, 4]
  },
  "enabledMemorizationSubtypes": [
    { "key": "sabaq", "label": "Sabaq", "active": true },
    { "key": "sabaqi", "label": "Sabaqi", "active": true }
  ]
}
```

### Compatibility rule

For old clients:

- if only `studyDays` is sent, server stores simple mode semantics
- server should continue accepting existing payload shapes
- server may accept weekday strings temporarily for compatibility, but normalize to numeric arrays internally

---

## 2. Session Save API

### Existing endpoint

- `POST /api/sessions`

### Proposed additions

- `recordingDate`
- `sessionType` for explicit single-type submissions
- `sessionSubtype` when applicable for memorization flows

### Compatibility rule

Support both old and new payloads:

- old client:
  - sends `sessionDate`
  - no explicit type metadata
  - server infers types from `hifzRecord` and `revisionRecord`
- new client:
  - sends `recordingDate`
  - can also send explicit `sessionType` / `sessionSubtype`

### Recommended normalization logic

1. `effectiveDate = recordingDate || sessionDate`
2. infer included types from record payloads
3. validate each included type against school configuration (contextually)
4. save:
   - `recording_date = effectiveDate`
   - `session_date = effectiveDate`

---

## Frontend Solution Design

## 1. Settings UI

Update `src/client/pages/settings/Settings.tsx` to support two modes:

### Simple mode

- preserves the current day-chip experience
- edits only `study_days`
- show a small explanation:
  - "All session types use the same available days"

### Advanced mode

- enabled by a clear toggle or segmented control
- displays one row per session type
- each row has weekday chips
- show a summary of inherited/fallback behavior

### Recommended UX structure

1. `Scheduling Mode`
   - `Simple`
   - `Advanced`

2. `Simple Schedule`
   - existing weekday chip selector

3. `Advanced Schedule`
   - read-only inherited `study_days` summary
   - editable per-session-type rows
   - optional memorization subtype section only when subtypes are enabled

### UX guardrails

- keep simple mode as default for all existing schools
- do not show advanced controls unless explicitly enabled
- explain that advanced mode overrides only configured session types
- show fallback behavior for unconfigured types

---

## 2. Create School UI

Update `src/client/pages/CreateSchool.tsx` to:

- keep simple mode as default
- **allow advanced mode optionally** via a toggle during creation, which immediately reveals the advanced scheduling UI
- avoid forcing new schools into a complex configuration, but remove the extra post-creation step for power users

---

## 3. Daily Session UI

Update `src/client/pages/sessions/DailySession.tsx` to introduce:

- a user-selectable date picker
- school schedule fetch
- schedule-aware validation
- user guidance when a selected date is invalid

### Recommended UX changes

#### A. Add shared selected date state

- replace the read-only current date badge with a date input
- default it intelligently:
  - today in school timezone if valid
  - otherwise nearest next valid date for the current session type, or today with warning

#### B. Load and cache school schedule

On page load, fetch:

- student
- surahs
- school schedule config

**Performance & UX:** Compute allowed weekdays and the next 3 valid dates **locally** from the fetched schedule. This provides instant feedback when the user changes the date, avoiding unnecessary API calls. The backend remains the final authority during save.

#### C. Compute allowed dates by type

Because the page has separate save buttons:

- Hifz save should validate against memorization type
- Revision save should validate against revision type

If memorization subtype selection is added later:

- Hifz validation should use the selected subtype

#### D. Disable invalid save actions

If the selected date is invalid for the record being saved:

- show inline error
- disable the save button for that section
- keep the other section available if its date remains valid

### Recommended error message content

When invalid:

- clearly state the selected date is unavailable for that session type
- list the valid weekdays
- optionally show the next 3 valid dates
- include a direct link/button to `/settings` with a query parameter (e.g., `?tab=schedule`) to auto-focus the schedule section

Example:

> Revision can only be recorded on Tuesday and Thursday for this school. The next available dates are Jun 20, Jun 22, and Jun 27. Update school settings if this schedule needs to change.

---

## 4. Client-side validation sequence

Before save:

1. validate required form fields
2. validate selected date format
3. validate selected date against locally cached school schedule for the relevant session type
4. only then call `/api/sessions`

This improves UX, but backend validation remains mandatory.

---

## Backend Implementation Plan

## 1. School model changes

Update `src/server/model/School.ts` to add:

- `schedule_mode`
- `session_type_day_map`
- `enabled_memorization_subtypes`

### Defaults

- `schedule_mode` default = `'simple'`
- `session_type_day_map` default = `null`
- `enabled_memorization_subtypes` default = `[]`

### Mapping rule for existing schools

Existing rows remain valid because:

- `study_days` already exists
- `schedule_mode` defaults to `simple`
- no data migration is needed to preserve current behavior

---

## 2. Session model changes

Update `src/server/model/Session.ts` to add:

- `recording_date` (nullable initially)

### Defaults and write logic

- on new writes, set `recording_date = providedDate`
- also set `session_date = providedDate`
- if old client sends only `sessionDate`, use it
- if neither is sent, reject rather than silently defaulting

Rejecting missing dates is preferable because it avoids hidden timezone bugs and makes client behavior explicit.

---

## 3. Service-layer additions

Introduce a focused scheduling domain utility or service, for example:

- `src/server/services/scheduleService.ts`

Suggested responsibilities:

- normalize school schedule payloads
- resolve canonical session types
- compute allowed weekdays
- validate recording dates
- generate user-safe error metadata

**Performance & Caching:**  
`scheduleService` must implement a short-lived **in-memory cache** (e.g., TTL of 60 seconds) or leverage a distributed cache (Redis) for school configuration. This prevents repeated database hits under high concurrent session saves. The cache must be invalidated immediately upon school settings updates.

---

## 4. Controller updates

### `schoolController`

Enhance to:

- accept `scheduleMode`
- accept `sessionTypeDayMap`
- accept `enabledMemorizationSubtypes`
- validate and normalize all schedule inputs
- stop using `console.error`
- use the existing logger with correlation data

### `sessionController`

Enhance to:

- accept `recordingDate`
- normalize `recordingDate || sessionDate`
- infer or validate session types
- **Apply contextual validation:** If payload contains only Hifz records → validate Hifz schedule. If only Revision → validate Revision schedule. If both (bulk) → validate both and reject if any fail.
- call schedule validation before creating the session
- return user-friendly validation errors

---

## 5. Service updates

### `sessionService`

Enhance to:

- create/find sessions using the normalized effective date
- write both `recording_date` and `session_date`
- keep current idempotent same-day merge behavior

### `schoolService`

Enhance to:

- stop acting as raw pass-through for scheduling fields
- validate DTO structure
- ensure only whitelisted fields are persisted

### downstream services

These should remain unchanged in phase 1 because `session_date` is preserved:

- `reportService`
- `analyticsService`
- `statsService`
- `attendanceService`
- `sessionHistoryService`
- `userService`

That is the main backward compatibility advantage of the mirrored-date strategy.

---

## Migration Strategy

## Phase 1: Safe Schema Extension

1. Add new school fields with defaults.
2. Add `recording_date` to sessions (nullable initially).
3. **Backfill `recording_date = session_date` for existing rows.**  
   ⚠️ **Critical Execution Note:** This backfill must be executed in **batches** (e.g., 10,000 rows per transaction) to prevent long-running locks and replication lag on the large `sessions` table. Consider using a background job or a tool like `pt-online-schema-change` for zero-downtime deployments.
4. After backfill verification, convert `recording_date` to `NOT NULL`.
5. Keep all reads using `session_date`.
6. Deploy new validation and UI incrementally.

## Phase 2: Frontend Rollout

1. Update Settings with simple/advanced mode.
2. Update DailySession with date picker and schedule-aware validation (utilizing local caching).
3. Keep old payload support on the backend.

## Phase 3: Optional Internal Refactor

After production verification:

1. Gradually migrate read services to prefer `recording_date`.
2. Review whether `session_date` should remain as compatibility alias.
3. Consider index evolution only if needed.

---

## Backward Compatibility Safeguards

The implementation must guarantee all of the following:

- existing schools without advanced scheduling continue using `study_days`
- existing APIs accepting `studyDays` continue to work
- existing `sessionDate` payloads continue to work during rollout
- current reporting based on `session_date` continues to work
- current merged same-day session behavior continues to work
- owner management school flows continue to work after field whitelisting
- analytics and history endpoints remain stable
- Past sessions are never retroactively invalidated by schedule changes. Validation applies strictly to new saves/updates.

### Specific compatibility rules

#### Legacy school data

- if `schedule_mode` missing: treat as `simple`
- if `session_type_day_map` missing: ignore and use `study_days`

#### Legacy session payload

- if `recordingDate` missing and `sessionDate` exists: use `sessionDate`

#### Legacy consumers

- continue populating `session_date` even after adding `recording_date`

---

## Security, Compliance, and Best Practices

## 1. Input validation

Apply strict server-side validation for:

- date format
- weekday arrays
- session type IDs
- subtype keys and labels
- tenant scoping
- payload size limits for JSON schedule maps

Do not trust any client-computed validity.

## 2. Authorization and tenant isolation

Before schedule lookup or save:

- verify authenticated user belongs to the tenant
- verify the target student belongs to the same tenant
- verify the school being updated matches the authenticated tenant unless using owner management

## 3. Mass assignment prevention

Do not pass raw request bodies directly into model update/create calls for new scheduling fields.

Current owner management behavior is too broad for this feature. New code should use explicit DTO whitelists.

## 4. Logging

Use the existing logger utility consistently.

For scheduling validation failures, log:

- correlation ID
- tenant ID
- student ID
- session type
- selected date
- resolved allowed days
- schedule mode

Do not log stack traces or internal objects to the client response.

## 5. Timezone correctness

This feature must treat the school timezone as authoritative for:

- default date suggestions
- weekday validation
- any "today" comparisons

## 6. Error messaging

Client-facing errors should be:

- specific
- safe
- actionable

Good:

- "Revision can only be recorded on Tuesday and Thursday for this school."

Avoid:

- raw ORM errors
- stack traces
- internal schema details

## 7. Testing requirements

Add focused backend tests for:

- simple-mode day validation
- advanced-mode day validation
- fallback behavior for missing type config
- backward compatibility for old payloads
- timezone-boundary cases
- combined Hifz + Revision request validation (both separate and hypothetical batch)
- session reuse on same student/date
- cache invalidation after school update

Add focused frontend tests or verification scripts for:

- settings toggle behavior
- date picker restriction logic
- invalid date messaging
- settings deep link visibility
- old schools rendering correctly in simple mode
- separate save buttons respecting different type rules

## 8. Performance Consideration

- The new `scheduleService` will utilize caching to avoid excessive database round-trips.
- Monitor the cache hit/miss ratio and TTL effectiveness post-deployment.

---

## Recommended File Impact Summary

## Backend

- `src/server/model/School.ts`
- `src/server/model/Session.ts`
- `src/server/controller/schoolController.ts`
- `src/server/controller/sessionController.ts`
- `src/server/services/schoolService.ts`
- `src/server/services/sessionService.ts`
- `src/server/routes/schoolRoutes.ts`
- `src/server/routes/sessionRoutes.ts`
- `src/server/controller/ownerManagementController.ts`
- `src/server/routes/ownerManageRoutes.ts`
- new scheduling utility/service module

## Frontend

- `src/client/pages/settings/Settings.tsx`
- `src/client/pages/CreateSchool.tsx`
- `src/client/pages/sessions/DailySession.tsx`
- `src/client/pages/owner/ManageSchools.tsx`
- optionally shared schedule types/utilities in `src/client`

## Read-only compatibility-sensitive consumers

- `src/server/services/reportService.ts`
- `src/server/services/analyticsService.ts`
- `src/server/services/statsService.ts`
- `src/server/services/attendanceService.ts`
- `src/server/services/sessionHistoryService.ts`
- `src/server/services/userService.ts`

---

## Implementation Order

1. 🔍 Verify real database table and FK metadata for `School` before migration.
2. 🗄️ Extend `School` and `Session` schemas with compatibility-safe defaults (including nullable `recording_date`).
3. ⚙️ Add a dedicated schedule resolution/validation service with caching layer.
4. 🧪 Implement batch backfill script for `recording_date` with logging.
5. 🔧 Update school create/update controllers and services with strict DTO validation (and mode-switch pre-population logic).
6. 🚦 Update session save flow to validate selected dates by session type (contextually per save type).
7. 🖥️ Update Settings UI with simple/advanced schedule modes.
8. 📅 Update DailySession with date picker, local schedule caching, and schedule-aware save validation (respecting separate buttons).
9. ✅ Add regression tests for backward compatibility, combined/bulk validation, and timezone-sensitive cases.
10. 📈 Deploy with monitoring focused on validation failures, cache effectiveness, and same-day session reuse.

---

## Final Recommendation

Adopt a dual-mode scheduling architecture:

- simple mode keeps the current `study_days` behavior unchanged
- advanced mode uses a generic `session_type_day_map`

Add an explicit `recording_date` to `Session`, but keep `session_date` populated and readable during the migration period.

This approach is the lowest-risk design that:

- preserves current functionality
- supports dedicated memorization and revision day assignments
- scales to multiple memorization subtypes
- avoids breaking analytics and reports
- supports secure, validated, user-friendly scheduling enforcement across frontend and backend

---

## Summary of Key Revisions (Based on Internal Review)

| Area | Original Plan | Revised/Updated Approach |
| :--- | :--- | :--- |
| **Combined Payload Validation** | Reject if any included type is invalid for the date. | Clarified contextual validation: separate saves only validate their specific type; batch saves validate all. |
| **Mode Switching** | Not specified. | Map is preserved when switching away; pre-populated when switching to advanced. |
| **Data Backfill** | Simple backfill mentioned. | Explicit batch processing (10k rows) to prevent table locks. |
| **Frontend Performance** | Schedule fetched and validated on save. | Schedule fetched once and computed locally for instant UX feedback. |
| **Backend Performance** | No caching mentioned. | Added in-memory/Redis caching with TTL for `scheduleService`. |
| **Deep Link UX** | Link to settings mentioned. | Added query parameter (`?tab=schedule`) to auto-focus the schedule section. |
| **Past Session Integrity** | Implicitly assumed. | Explicitly stated that schedule changes do not retroactively invalidate past sessions. |
```

---