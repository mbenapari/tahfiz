# School Branch Management Feature - Implementation Plan

**Document Version:** 1.0
**Date:** 2026-06-25
**Project:** Tahfiz School Management System

---

## 1. Executive Summary

This document outlines a comprehensive implementation plan for adding parent-branch school hierarchy functionality to the existing Tahfiz school management system. The feature enables parent school administrators to create and manage multiple independent school branches while maintaining centralized oversight and seamless context switching between branch operations.

---

## 2. Current System Analysis

### 2.1 Existing Data Models

#### School Model (`/src/server/model/School.ts`)
- **Table:** `tenants`
- **Key Fields:**
  - `id` (BIGINT, PK)
  - `name` (STRING)
  - `slug` (STRING, UNIQUE)
  - `owner_id` (BIGINT, FK to users)
  - `timezone` (STRING, default: 'UTC')
  - `study_days` (JSON)
  - `schedule_mode` ('simple' | 'advanced')
  - `session_type_day_map` (JSON)
  - `enabled_memorization_subtypes` (JSON)
  - `start_time`, `end_time`, `email`, `phone`, `address` (STRING)
- **Soft Deletes:** Enabled via `paranoid: true`

#### User Model (`/src/server/model/User.ts`)
- **Table:** `users`
- **Key Fields:**
  - `id` (BIGINT, PK)
  - `tenant_id` (BIGINT, FK to tenants)
  - `role` (ENUM: student, instructor, admin)
  - `first_name`, `last_name`, `email`, `phone` (encrypted)
  - `email_blind_index` (for lookup)
  - `student_identifier` (encrypted)
  - `grade_level`, `class_name`, `daily_revision_target`
  - `is_onboarded` (BOOLEAN)
- **Hooks:** beforeCreate/beforeUpdate for password hashing and PII encryption
- **Methods:** `validatePassword()`

#### SchoolMember Model (`/src/server/model/SchoolMember.ts`)
- **Table:** `school_members`
- **Key Fields:**
  - `id` (BIGINT, PK)
  - `school_id` (BIGINT, FK)
  - `user_id` (BIGINT, FK)
  - `role` (ENUM from UserRole)
- **Constraints:** UNIQUE(school_id, user_id)
- **Note:** No soft delete support currently

### 2.2 Existing Services

#### schoolService.ts
- `createSchool()` - Creates school with schedule validation
- `getSchoolById()` - Fetches single school
- `getSchoolsByName()` - Searches by name
- `getAllSchools()` - Returns all schools
- `updateSchool()` - Updates with validation
- `deleteSchool()` - Soft delete via paranoid

### 2.3 Existing Routes

| Route File | Purpose |
|------------|---------|
| authRoutes.ts | Authentication |
| ownerRoutes.ts | Owner-specific operations |
| ownerManageRoutes.ts | Owner management operations |
| schoolRoutes.ts | School CRUD |
| userRoutes.ts | User management |
| sessionRoutes.ts | Session management |
| revisionRoutes.ts | Revision tracking |
| reportRoutes.ts | Reporting |
| statsRoutes.ts | Statistics |
| analyticsRoutes.ts | Analytics |
| notificationRoutes.ts | Notifications |
| surahRoutes.ts | Quran content |

---

## 3. Database & Backend Schema Updates

### 3.1 School Model Updates

**File:** `/src/server/model/School.ts`

```typescript
// New Fields to Add
interface SchoolAttributes {
  // ... existing fields ...

  // NEW: Hierarchical fields
  parent_school_id: number | null;  // FK to parent School, null for root/parent schools
  is_branch: boolean;                // true = branch school, false = parent/root school
  branch_code: string | null;        // Unique code for branch identification
  branch_admin_ids: number[];        // Array of User IDs authorized as branch admins

  // NEW: Branch metadata & Inheritance
  branch_name?: string;              // Optional display name for branch
  branch_address?: string;          // Branch-specific address
  is_active: boolean;               // Can be deactivated without deletion
  deactivated_at?: Date;            // When branch was deactivated
  
  // NEW: Inheritance Overrides
  // If null, the branch inherits the value from the parent_school
  override_study_days?: JSON | null;
  override_schedule_mode?: 'simple' | 'advanced' | null;
  override_memorization_subtypes?: JSON | null;
}

// New Indexes Required
indexes: [
  { name: 'idx_school_parent_id', fields: ['parent_school_id'] },
  { name: 'idx_school_is_branch', fields: ['is_branch'] },
  { name: 'idx_school_branch_code', fields: ['branch_code'] },
]
```

### 3.2 User Model Updates

**File:** `/src/server/model/User.ts`

```typescript
// New Fields to Add
interface UserAttributes {
  // ... existing fields ...

  // NEW: School context and access tracking
  active_school_context: number | null;      // Current school ID user is operating in
  // Note: accessible_school_ids is treated as a cached field; primary source is SchoolMember table
  accessible_school_ids: number[];           // All schools user can access

  // NEW: Parent school linkage (for users who own/manage parent schools)
  // Changed to allow for potential multi-parent management in future
  management_parent_school_ids: number[];    // IDs of parent schools this user can manage
  can_manage_branches: boolean;               // Permission to create/manage branches
}

// New Indexes Required
indexes: [
  { name: 'idx_user_active_context', fields: ['active_school_context'] },
  { name: 'idx_user_accessible_schools', fields: ['accessible_school_ids'] },
  { name: 'idx_user_parent_school', fields: ['parent_school_id'] },
]
```

### 3.3 SchoolMember Model Updates

**File:** `/src/server/model/SchoolMember.ts`

```typescript
// New Fields to Add
interface SchoolMemberAttributes {
  // ... existing fields ...

  // NEW: Scope control
  scope_type: 'school' | 'branch' | 'all';  // Defines membership scope
  is_primary_admin: boolean;                 // For branch admins managing their branch

  // NEW: Audit fields
  granted_by_user_id: number | null;         // Who granted this membership
  granted_at: Date | null;                   // When membership was granted
}

// New Indexes Required
indexes: [
  { name: 'idx_school_member_scope', fields: ['scope_type'] },
  { name: 'idx_school_member_granted_by', fields: ['granted_by_user_id'] },
]
```

### 3.4 Migration Strategy

1. **Phase 1: Add Nullable Columns**
   - Add `parent_school_id`, `is_branch`, `branch_code`, `override_study_days`, `override_schedule_mode`, `override_memorization_subtypes` to School (nullable initially)
   - Add `active_school_context`, `accessible_school_ids`, `management_parent_school_ids`, `can_manage_branches` to User
   - Add `scope_type`, `is_primary_admin`, `granted_by_user_id`, `granted_at` to SchoolMember

2. **Phase 2: Backfill Data**
   - Set existing schools as parent schools (`is_branch = false`, `parent_school_id = NULL`)
   - Set `scope_type = 'school'` for existing memberships
   - Generate `accessible_school_ids` for existing users by querying the SchoolMember table
   - Initialize `management_parent_school_ids` based on existing owner_id linkage

3. **Phase 3: Add Constraints & Indexes**
   - Add foreign key constraints (including cascading soft-delete logic: deleting a parent school marks all child branches as deactivated)
   - Create indexes for performance
   - Add unique constraint on `branch_code`

---

## 4. Backend Service & API Development

### 4.1 Extended SchoolService

**File:** `/src/server/services/schoolService.ts`

#### New Methods Required

```typescript
// Branch Management
createBranchSchool(parentSchoolId: number, data: CreateBranchDTO): Promise<School>
getBranchesForParentSchool(parentSchoolId: number): Promise<School[]>
getBranchById(branchId: number): Promise<School>
updateBranchSettings(branchId: number, data: UpdateBranchDTO): Promise<School>
deactivateBranch(branchId: number): Promise<boolean>
reactivateBranch(branchId: number): Promise<School>

// Context Management
switchSchoolContext(userId: number, targetSchoolId: number): Promise<User>
getUserSchoolContext(userId: number): Promise<{ user: User; school: School }>
validateSchoolAccess(userId: number, schoolId: number): Promise<boolean>
getAccessibleSchools(userId: number): Promise<School[]>

// Access Control
grantBranchAdminAccess(parentSchoolId: number, userId: number, branchId: number): Promise<SchoolMember>
revokeBranchAdminAccess(branchId: number, userId: number): Promise<boolean>
getBranchAdmins(branchId: number): Promise<User[]>
```

#### Update Existing Methods

```typescript
// Modify to filter based on active context
getAllSchools(filters?: { parentOnly?: boolean; branchOnly?: boolean }): Promise<School[]>
getSchoolById(id: number, validateAccess?: boolean): Promise<School>
updateSchool(id: number, data: UpdateSchoolDTO): Promise<School>

// Add context-aware query support
getSchoolMembers(schoolId: number): Promise<SchoolMember[]>
addSchoolMember(schoolId: number, userId: number, role: UserRole): Promise<SchoolMember>
removeSchoolMember(schoolId: number, userId: number): Promise<boolean>
```

### 4.2 New Route Files Required

| File | Routes | Description |
|------|--------|--------------|
| `branchRoutes.ts` | `/api/branches/*` | Branch CRUD operations |
| `schoolContextRoutes.ts` | `/api/context/*` | Context switching operations |
| `branchAdminRoutes.ts` | `/api/branch-admins/*` | Branch admin management |

### 4.3 Route Definitions

#### branchRoutes.ts
```
POST   /api/branches                          - Create new branch (parent admin only)
GET    /api/branches                          - List accessible branches
GET    /api/branches/:branchId                - Get branch details
PUT    /api/branches/:branchId                - Update branch settings
PATCH  /api/branches/:branchId/status         - Activate/deactivate branch
DELETE /api/branches/:branchId                - Soft delete branch
GET    /api/branches/:branchId/members        - List branch members
POST   /api/branches/:branchId/members        - Add member to branch
DELETE /api/branches/:branchId/members/:userId - Remove member from branch
```

#### schoolContextRoutes.ts
```
GET    /api/context/current                  - Get current school context
POST   /api/context/switch/:schoolId          - Switch active school context
GET    /api/context/accessible               - List all accessible schools
GET    /api/context/accessible/tree          - Get school hierarchy tree
```

#### branchAdminRoutes.ts
```
POST   /api/branch-admins/grant              - Grant branch admin access
DELETE /api/branch-admins/revoke/:userId/:branchId - Revoke branch admin access
GET    /api/branch-admins/branch/:branchId    - List branch admins
GET    /api/branch-admins/user/:userId        - Get user's branch admin roles
```

### 4.4 Middleware Requirements

```typescript
// New Middleware Functions
validateSchoolContext        - Validates active_school_context is set
requireParentSchoolAccess     - Ensures user can manage parent school
requireBranchAccess          - Ensures user can access specific branch
requireBranchAdminRole       - Ensures user is admin of the branch
auditContextSwitch           - Logs all context switch events
rateLimitBranchCreation      - Rate limiting for branch creation
```

### 4.5 Access Control Matrix

| Action | Parent Admin | Branch Admin | Instructor | Student |
|--------|--------------|--------------|------------|---------|
| Create Branch | ✓ (own parent) | ✗ | ✗ | ✗ |
| Update Branch | ✓ (own branches) | ✓ (own branch) | ✗ | ✗ |
| Delete Branch | ✓ (own branches) | ✗ | ✗ | ✗ |
| Switch Context | ✓ | ✓ | ✗ | ✗ |
| View Branch Data | ✓ (all own) | ✓ (own branch) | ✓ (own branch) | ✓ (own) |
| Manage Branch Users | ✓ (all branches) | ✓ (own branch) | ✗ | ✗ |
| View Parent Data | ✓ | ✗ | ✗ | ✗ |

---

## 5. Frontend Feature Implementation

### 5.1 New Frontend Files Required

#### Pages
| File | Purpose |
|------|---------|
| `pages/BranchManagement.tsx` | Main branch management dashboard |
| `pages/BranchDetail.tsx` | Individual branch configuration |
| `pages/SchoolSwitcher.tsx` | Context switcher modal/page |

#### Components
| Component | Purpose |
|-----------|---------|
| `components/BranchCard.tsx` | Branch display card |
| `components/SchoolSwitcherDropdown.tsx` | Quick school switch in navbar |
| `components/BranchFormModal.tsx` | Create/edit branch form |
| `components/ActiveSchoolBanner.tsx` | Shows current context |
| `components/BranchStats.tsx` | Branch-specific statistics |
| `components/BranchMemberList.tsx` | Branch user management |

#### Context/Hooks
| File | Purpose |
|------|---------|
| `context/SchoolContext.tsx` | Active school context state |
| `hooks/useSchoolContext.ts` | Hook for context operations |
| `hooks/useBranchManagement.ts` | Branch CRUD operations |

### 5.2 Updated Files

#### App.tsx Updates
```typescript
// Add routes
<Route path="/branches" element={<BranchManagement />} />
<Route path="/branches/:branchId" element={<BranchDetail />} />
<Route path="/switch-school" element={<SchoolSwitcher />} />
```

#### OwnerSidebar.tsx Updates
- Add "Branches" menu item
- Show branch count badge
- Indicate active branch context

#### Navbar.tsx Updates
- Add school switcher dropdown
- Show current school name/logo
- Visual indicator when in branch context

#### OwnerLayout.tsx Updates
- Include ActiveSchoolBanner
- Pass school context to all pages

### 5.3 UI/UX Specifications

#### School Switcher Component
- **Location:** Navbar, always visible when logged in as admin
- **Display:** Current school name with dropdown arrow
- **Dropdown Items:**
  - Parent school (top, prominent)
  - "All Branches" section header
  - List of accessible branches with branch code
  - "Switch Context" action per item
  - Current selection highlighted

#### Branch Management Dashboard
- **Layout:** Grid of BranchCards with summary stats
- **Actions:**
  - Create New Branch button (top right)
  - View/Edit per branch
  - Deactivate/Reactivate toggle
- **Filters:** Active/Inactive/All
- **Search:** By branch name or code

#### Branch Detail View
- **Tabs:** Overview, Members, Schedule, Settings
- **Overview:** Branch info, stats, recent activity
- **Members:** List with roles, add/remove functionality
- **Schedule:** Branch-specific schedule configuration
- **Settings:** Branch admin assignment, activation status

---

## 6. Non-Functional Requirements

### 6.1 Performance

#### Database Indexes
```sql
-- School table
CREATE INDEX idx_tenants_parent_school_id ON tenants(parent_school_id);
CREATE INDEX idx_tenants_is_branch ON tenants(is_branch);
CREATE INDEX idx_tenants_branch_code ON tenants(branch_code);

-- User table
CREATE INDEX idx_users_active_school_context ON users(active_school_context);
CREATE INDEX idx_users_parent_school_id ON users(parent_school_id);

-- SchoolMember table
CREATE INDEX idx_school_members_scope ON school_members(scope_type);
CREATE INDEX idx_school_members_granted_by ON school_members(granted_by_user_id);
```

#### Caching Strategy
- **Redis Cache Keys:**
  - `school:{id}` - Individual school data (TTL: 5 min)
  - `school:{id}:branches` - Branch list for parent (TTL: 5 min)
  - `user:{id}:accessible_schools` - User's accessible schools (TTL: 15 min)
  - `school:{id}:members` - School members (TTL: 2 min)

- **Cache Invalidation:**
  - Invalidate on school update/delete
  - Invalidate user accessible schools on branch changes
  - Invalidate members on membership changes

#### Query Optimization
- Use `active_school_context` for automatic filtering
- Implement cursor-based pagination for large lists
- Use `include` sparingly; fetch related data separately when possible

### 6.2 Security

#### Row-Level Security (RLS)
```typescript
// Middleware to enforce RLS
const enforceRLS = async (req, res, next) => {
  const user = req.user;
  if (!user.active_school_context) {
    return res.status(403).json({ error: 'No active school context' });
  }
  req.schoolFilter = { school_id: user.active_school_context };
  next();
};
```

#### Context Switch Audit Log
```typescript
interface ContextSwitchEvent {
  id: string;
  user_id: number;
  from_school_id: number;
  to_school_id: number;
  ip_address: string;
  user_agent: string;
  timestamp: Date;
}
```

#### Rate Limiting
- Branch creation: 5 per hour per parent school
- Context switching: 30 per hour per user
- Branch admin changes: 20 per hour per parent school

### 6.3 Logging Requirements

#### Project-Aligned Log Format
All branch-related logging must follow the existing project logger patterns (see `/src/server/utils/logger.ts` and `/src/server/middleware/loggingMiddleware.ts`):

```typescript
// Variables embedded in message string, correlationId passed through request
logger.info(`Branch created: parentSchoolId=${parentSchoolId} branchId=${branchId} by adminId=${adminId}`, {
  correlationId: req.correlationId,
  action: 'BRANCH_CREATED',
});

// Error with stack trace
logger.error(`Failed to switch context: userId=${userId} targetSchoolId=${targetSchoolId} error=${error.message}`, {
  correlationId: req.correlationId,
  stack: error.stack,
});

// Warn for unauthorized attempts
logger.warn(`Unauthorized branch access attempt: userId=${userId} targetBranchId=${branchId} ip=${req.ip}`, {
  correlationId: req.correlationId,
});
```

#### Correlation ID Flow
The `correlationId` (UUID) is automatically attached to each request by `loggingMiddleware.ts`. All branch service methods must accept `correlationId` as a parameter to enable end-to-end request tracing:

```typescript
// Example service method signature
async function createBranchSchool(
  parentSchoolId: number,
  data: CreateBranchDTO,
  correlationId: string
): Promise<School> {
  logger.info(`Creating branch school: parentId=${parentSchoolId} name=${data.name}`, {
    correlationId,
  });
  // ... implementation
}
```

#### Required Log Events (Message Format)
| Event | Level | Log Message Pattern |
|-------|-------|-------------------|
| Branch created | info | `Branch created: parentId=${parentId} branchId=${branchId} name=${name} byAdminId=${adminId}` |
| Branch updated | info | `Branch updated: branchId=${branchId} changes=${JSON.stringify(changes)} byAdminId=${adminId}` |
| Branch deactivated | info | `Branch deactivated: branchId=${branchId} reason=${reason} byAdminId=${adminId}` |
| Branch reactivated | info | `Branch reactivated: branchId=${branchId} byAdminId=${adminId}` |
| Context switched | info | `Context switched: userId=${userId} fromSchoolId=${fromId} toSchoolId=${toId}` |
| Admin access granted | info | `Branch admin access granted: userId=${userId} branchId=${branchId} grantedBy=${grantedById}` |
| Admin access revoked | info | `Branch admin access revoked: userId=${userId} branchId=${branchId} revokedBy=${revokedById}` |
| Unauthorized access | warn | `Unauthorized access attempt: userId=${userId} resource=${resource} ip=${ip}` |
| Rate limit exceeded | warn | `Rate limit exceeded: userId=${userId} endpoint=${endpoint} ip=${ip}` |
| Validation failed | warn | `Validation failed: action=${action} error=${errorMessage} correlationId=${correlationId}` |

### 6.4 Compliance

#### Data Segregation Enforcement
- All queries MUST include `active_school_context` filter
- Branch admins cannot see parent school data
- Parent admins can ONLY see branch data they own
- No UNION queries across unauthorized schools

#### Audit Log Retention
- Retention period: 7 years minimum
- Storage: Separate audit database/table
- Access: Restricted to compliance officers
- Export: Available in CSV/JSON format

### 6.5 Testing Requirements

#### Unit Tests (Jest)
```
schoolService/
  ├── createBranchSchool.test.ts
  ├── getBranchesForParentSchool.test.ts
  ├── switchSchoolContext.test.ts
  ├── validateSchoolAccess.test.ts
  └── updateBranchSettings.test.ts
```

#### Integration Tests (Supertest)
```
Routes:
  ├── POST /api/branches
  ├── GET /api/branches
  ├── PATCH /api/branches/:id/status
  ├── POST /api/context/switch/:schoolId
  └── POST /api/branch-admins/grant
```

#### E2E Tests (Playwright)
```
Features:
  ├── Branch creation flow
  ├── Branch management dashboard
  ├── School context switching
  ├── Branch admin assignment
  └── Cross-school data isolation
```

---

## 7. Implementation Phases

### Phase 1: Database Schema (Week 1)
- [ ] Create migration files
- [ ] Update School model
- [ ] Update User model
- [ ] Update SchoolMember model
- [ ] Add indexes
- [ ] Verify migrations

### Phase 2: Core Backend Services (Week 2)
- [ ] Extend schoolService with branch methods
- [ ] Create branchRoutes
- [ ] Create schoolContextRoutes
- [ ] Create branchAdminRoutes
- [ ] Implement RLS middleware
- [ ] Add audit logging
- [ ] Unit tests

### Phase 3: Authentication & Authorization (Week 2-3)
- [ ] Update auth service for context
- [ ] Implement context switch logic
- [ ] Add permission checks
- [ ] Rate limiting implementation
- [ ] Integration tests

### Phase 4: Frontend Core (Week 3-4)
- [ ] SchoolContext setup
- [ ] SchoolSwitcher component
- [ ] BranchManagement page
- [ ] BranchDetail page
- [ ] Navigation updates
- [ ] E2E tests

### Phase 5: Frontend Features (Week 4-5)
- [ ] Branch creation form
- [ ] Branch member management
- [ ] Branch settings
- [ ] ActiveSchoolBanner
- [ ] Notifications integration
- [ ] Full E2E test suite

### Phase 6: Polish & Documentation (Week 5-6)
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation
- [ ] Penetration testing
- [ ] Production deployment

---

## 8. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Data migration failure | Medium | High | Pre-migration backup, rollback plan |
| Cross-school data leak | Low | Critical | RLS enforcement, penetration testing |
| Performance degradation | Medium | Medium | Indexes, caching, query optimization |
| Branch admin privilege abuse | Low | High | Audit logging, permission validation |
| Cache inconsistency | Medium | Low | Cache invalidation strategy |

---

## 9. Rollback Plan

1. **Database Changes:** Use Sequelize migrations with down() support
2. **Code Changes:** Feature flag for gradual rollout
3. **Data Issues:** Snapshot before migration, restore if critical issue found
4. **Rollback Sequence:
   - Disable new routes
   - Revert frontend changes
   - Run migration down()
   - Deploy previous code version

---

## 10. Dependencies & External Packages

### Required NPM Packages
```json
{
  "dependencies": {
    "uuid": "^9.0.0",
    "ioredis": "^5.3.0"
  },
  "devDependencies": {
    "@types/uuid": "^9.0.0",
    "supertest": "^6.3.0",
    "@playwright/test": "^1.40.0"
  }
}
```

### Existing Project Dependencies (Verified Compatible)
- sequelize, sequelize-typescript
- express
- bcrypt, jsonwebtoken
- winston (for logging)
- zod (for validation)
- react, react-router

---

## 11. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Branch creation time | < 2 seconds | APM |
| Context switch time | < 500ms | APM |
| Query performance (with RLS) | < 100ms p95 | APM |
| Test coverage | > 80% | Code coverage |
| Security vulnerabilities | 0 critical | Pentest |
| User satisfaction | > 4/5 | Survey |

---

## 12. Appendix

### A. Type Definitions

```typescript
// Branch-specific DTOs
interface CreateBranchDTO {
  name: string;
  slug: string;
  branchCode: string;
  timezone?: string;
  studyDays: number[];
  scheduleMode?: 'simple' | 'advanced';
  sessionTypeDayMap?: Record<string, number[]>;
  address?: string;
  email?: string;
  phone?: string;
}

interface UpdateBranchDTO {
  name?: string;
  timezone?: string;
  studyDays?: number[];
  scheduleMode?: 'simple' | 'advanced';
  sessionTypeDayMap?: Record<string, number[]>;
  address?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
}

interface BranchAdminGrantDTO {
  userId: number;
  branchId: number;
  isPrimaryAdmin?: boolean;
}
```

### B. Error Codes

| Code | Message | HTTP Status |
|------|---------|--------------|
| BRANCH_001 | Parent school not found | 404 |
| BRANCH_002 | Branch not found | 404 |
| BRANCH_003 | Branch code already exists | 409 |
| BRANCH_004 | Maximum branches reached | 400 |
| BRANCH_005 | Cannot deactivate with active members | 400 |
| CONTEXT_001 | No active school context | 403 |
| CONTEXT_002 | School access denied | 403 |
| CONTEXT_003 | Invalid context switch | 400 |
| ADMIN_001 | User is not a branch admin | 403 |
| ADMIN_002 | Admin access already exists | 409 |

### C. File Change Summary

| File | Action | Changes |
|------|--------|---------|
| src/server/model/School.ts | Modify | +5 fields, +3 indexes |
| src/server/model/User.ts | Modify | +4 fields, +3 indexes |
| src/server/model/SchoolMember.ts | Modify | +4 fields, +2 indexes |
| src/server/services/schoolService.ts | Extend | +12 new methods |
| src/server/routes/schoolRoutes.ts | Modify | Add branch routes |
| src/server/routes/branchRoutes.ts | Create | New file |
| src/server/routes/schoolContextRoutes.ts | Create | New file |
| src/server/routes/branchAdminRoutes.ts | Create | New file |
| src/client/context/SchoolContext.tsx | Create | New file |
| src/client/hooks/useSchoolContext.ts | Create | New file |
| src/client/components/SchoolSwitcherDropdown.tsx | Create | New file |
| src/client/components/BranchCard.tsx | Create | New file |
| src/client/components/BranchFormModal.tsx | Create | New file |
| src/client/components/ActiveSchoolBanner.tsx | Create | New file |
| src/client/pages/BranchManagement.tsx | Create | New file |
| src/client/pages/BranchDetail.tsx | Create | New file |
| src/client/pages/SchoolSwitcher.tsx | Create | New file |
| src/client/App.tsx | Modify | +3 routes |
| src/client/components/OwnerSidebar.tsx | Modify | Branch menu |
| src/client/components/Navbar.tsx | Modify | Switcher |
