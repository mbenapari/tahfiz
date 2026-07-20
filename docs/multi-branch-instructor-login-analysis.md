# Multi-Branch Instructor Login Scenario Analysis

## Current System Behavior

### Login Flow Overview

When an instructor belongs to 2 different branches/schools and logs in:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        LOGIN REQUEST                                │
│                   email + password                                  │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     authController.login()                          │
│  1. userService.getUserByEmail(email)                               │
│     - Includes: tenant (School) association only                    │
│     - Does NOT include schools (SchoolMember) association          │
│  2. Validate password                                               │
│  3. jwtHelper.signToken({ userId, roleId, tenantId })              │
│  4. permissionService.getEffectivePermissions(user.id)              │
│  5. Return response with user data                                  │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      LOGIN RESPONSE                                 │
│                                                                     │
│  {                                                                  │
│    user: {                                                          │
│      id, first_name, last_name, email, role,                       │
│      tenantId: <PRIMARY_TENANT_ID>,                                │
│      school_name: <PRIMARY_TENANT_NAME>,  // ← Only primary!       │
│      is_onboarded,                                                 │
│      permissions                                                   │
│    },                                                              │
│    token: <JWT_WITH tenantId_ONLY>                                  │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Problem Analysis

### Problem 1: Missing School Memberships in Response

**Current State**: Login only returns the **primary tenant** school information.

**Impact**: The frontend has **no knowledge** of the instructor's other school memberships. The `accessible_school_ids` and `active_school_context` fields on the User model are never populated or returned.

---

### Problem 2: JWT Token Contains Only Primary `tenantId`

**Impact**: Every subsequent API request uses this JWT. If the instructor wants to access **Branch B**, the JWT still contains **Branch A's ID**, causing:
1. **Authorization failures** when accessing Branch B's resources.
2. **Incorrect data scoping** - API queries might filter by wrong tenant.
3. **Permission mismatches** - Permissions are role-based but scoped to tenant context.

---

### Problem 3: No School Context Switching Mechanism

**Current State**: No mechanism for an instructor to see memberships or switch active school context.
**User Experience Issue**: An instructor belonging to both Branch A and B is locked into Branch A upon login with no way to pivot to Branch B's data.

---

### Problem 4: Permissions Are Not School-Scoped

**Current State**: `permissionService.getEffectivePermissions(userId)` returns global permissions regardless of school context.
**Impact**: Permissions are not filtered by the active operating school, leading to potential privilege escalation or incorrect access levels across different branches.

---

## Architectural Strategy (Expert Recommendations)

To avoid technical debt and security vulnerabilities, the following architectural patterns must be implemented:

### 1. Stateless Auth vs. Contextual State
*   **Avoid JWT Bloat**: Do not store the full list of `accessible_school_ids` in the JWT. If a user belongs to many schools, the token will exceed header size limits.
*   **Solution**: Store only `userId` and `primaryTenantId` in the JWT. Cache the membership list in **Redis** or a server-side session store.

### 2. The "Context Header" Pattern
*   **Mechanism**: To maintain a stateless backend while supporting school switching, implement a custom request header: `X-School-Context: <school_id>`.
*   **Flow**:
    1. Frontend stores the `active_school_id` in Redux/LocalStorage.
    2. Every scoped API request includes the `X-School-Context` header.
    3. Middleware validates that the `userId` from the JWT has membership access to the `school_id` provided in the header.

### 3. Dynamic Contextual RBAC
*   **Shift from Static to Dynamic**: Permissions should not be a static array returned at login.
*   **Solution**: Implement `permissionService.getPermissionsForUserInSchool(userId, schoolId)`. Permissions are resolved on-the-fly based on the `X-School-Context` header.

### 4. Database Optimization
*   **Query Efficiency**: Ensure `schoolService.getAccessibleSchools(user.id)` performs a single optimized JOIN between `Users` $\to$ `SchoolMembers` $\to$ `Schools`. Indices must exist on `member_id` and `school_id`.

---

## Implementation Plan

### Expected Login Response (Optimized)

```typescript
{
  user: {
    id, first_name, last_name, email, role,
    tenantId: 1,                           // Primary tenant
    active_school_context: 1,               // Current operating school
    schools: [                              // Full school membership list
      { id: 1, name: "Branch A", role: "admin", is_primary: true },
      { id: 5, name: "Branch B", role: "instructor", is_primary: false }
    ],
    is_onboarded,
    global_permissions: [...]               // Only permissions applicable everywhere
  },
  token: {
    userId: 123,
    primaryTenantId: 1
  }
}
```

### Required Frontend Changes

1.  **Membership Store**: Store the `schools` array and `active_school_context` in the auth slice.
2.  **Context Switcher**: Create a UI component to switch the `active_school_context`.
3.  **Interceptor**: Update the API client (e.g., Axios interceptor) to attach the `X-School-Context` header to all requests.
4.  **Permission Refresh**: Trigger a permission re-fetch/refresh upon switching schools.

### Required Backend Changes

1.  **`authController.ts`**: Fetch all accessible schools and return them in the login response.
2.  **`authMiddleware.ts`**: 
    *   Extract `userId` from JWT.
    *   Extract `schoolId` from `X-School-Context` header.
    *   Verify membership in the cache/DB.
3.  **`permissionService.ts`**: Update logic to resolve permissions based on the `userId` AND the `activeSchoolId`.

---

## Summary Table

| Aspect | Current Behavior | Required Behavior (Architected) |
|--------|------------------|----------------------------------|
| Login response | Only primary tenant | All memberships + Global permissions |
| JWT token | `tenantId` only | `userId` + `primaryTenantId` (Lean) |
| School context | No switching | `X-School-Context` Header + UI Switcher |
| API authorization | Role-based | JWT User $\to$ Context Header $\to$ Membership Check |
| Permissions | Global/Static | Context-aware / Dynamic RBAC |

---

## Files to Modify

1.  `src/server/controller/authController.ts` - Logic to include school memberships.
2.  `src/server/middleware/authMiddleware.ts` - Implement `X-School-Context` validation.
3.  `src/server/services/permissionService.ts` - Implement contextual permission resolution.
4.  `src/client/store/authSlice.ts` - Store active context and membership list.
5.  `src/client/api/client.ts` - Add request interceptor for the context header.
6.  `src/client/pages/BranchDetail.tsx` - Ensure data is fetched using the active context.
