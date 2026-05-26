# Instructor Management Feature Implementation

## Overview
Implemented a complete instructor management system allowing admins to add instructors to their institutions/schools. This includes service layer, controller endpoints, routes, and comprehensive unit/regression tests.


## Components Created/Updated

### 1. **Service Layer** (`userService.ts`)
- **Function**: `getInstructorsByTenant(tenant_id: number)`
  - Fetches all instructors for a given school/tenant
  - Returns instructor details (id, first_name, last_name, email, phone, role)
  - Sorted alphabetically by first_name
  - Already existed in the codebase

### 2. **Controller** (`userController.ts`)
- **New Function**: `createInstructor(req: Request, res: Response)`
  - Validates admin permission to manage users (`users:manage`)
  - Validates input: firstName and email required
  - Validates email format (regex validation)
  - Checks for duplicate emails
  - Creates new instructor user with INSTRUCTOR role
  - Returns 201 with created instructor details
  - Comprehensive error handling and logging

**Validation Flow**:
1. Check tenantId exists (403)
2. Check user has `users:manage` permission (403)
3. Validate firstName and email present (400)
4. Validate email format (400)
5. Check email not already registered (409)
6. Create user and return (201)

### 3. **Routes** (`userRoutes.ts`)
- **New Route**: `POST /api/users/instructors`
  - Authenticated endpoint
  - Calls `userController.createInstructor`
  - Requires:
    - Auth token (via middleware)
    - Valid tenantId in auth context
    - Request body: `{ firstName, lastName?, email, phone? }`

**Existing Route**:
- `GET /api/users/instructors` - Fetch all instructors for a school

### 4. **Tests** (`userController.test.ts` - New)
Integration tests covering:

**Test 1: Create Instructor with Valid Data**
- ✅ Instructor created successfully
- ✅ Correct role assigned (INSTRUCTOR)
- ✅ Tenant association correct

**Test 2: Permission Check**
- ✅ Admin user has `users:manage` permission

**Test 3: Duplicate Email Handling**
- ✅ Validation error thrown for duplicate email

## Request/Response Examples

### Create Instructor Request
```bash
POST /api/users/instructors
Content-Type: application/json
Authorization: Bearer {jwt_token}

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@school.com",
  "phone": "1234567890"
}
```

### Success Response (201)
```json
{
  "message": "Instructor created successfully",
  "instructor": {
    "id": 3,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@school.com",
    "phone": "1234567890",
    "role": "instructor",
    "tenant_id": 1
  }
}
```

### Error Response (403 - No Permission)
```json
{
  "error": "Forbidden: You do not have permission to manage users"
}
```

### Error Response (409 - Duplicate Email)
```json
{
  "error": "Email already registered"
}
```

## Security Features

1. **Permission-Based Access**: Only users with `users:manage` permission can create instructors
2. **Tenant Isolation**: Instructors are always bound to the requester's tenant
3. **Email Uniqueness**: Enforced at database level (unique constraint)
4. **Input Validation**:
   - Email format validation
   - Required field validation
   - Password hashing (automatic via User model hooks)
5. **Logging**: All operations logged with correlation IDs for audit trails

## Role & Permission Integration

**RBAC Setup** (from seeders):
- **Admin Role**: Has `users:manage` permission
- **Instructor Role**: Granted `dashboard:view`, `attendance:edit`, `reports:view`
- **Student Role**: Granted `dashboard:view`

Permission check flow:
1. User override in `UserPermission` table checked first
2. If no override, role permissions from `RolePermission` table used
3. Default: deny access

## Testing Results

### Integration Test Results
```
Running User Controller Tests...
✅ Create Instructor test passed.
✅ Permission test passed.
✅ Duplicate email test passed.
```

### Existing Tests (No Regressions)
```
Running User Role Assignment Tests...
✅ Role assignment passed.
```

## Database Relationships

```
tenants (schools)
  ├── one tenant can have many instructors
  └── instructor.tenant_id references tenants.id

users
  ├── role relationship (user.role_id references role.id)
  └── tenant relationship (user.tenant_id references tenants.id)

roles
  └── has many permissions via role_permissions

permissions
  └── can be assigned to roles or individual users
```

## Running Tests

```bash
# Run instructor controller tests
npx tsx src/server/tests/userController.test.ts

# Run all tests
npm test

# Run with specific pattern
npm test -- userController.test.ts
```

## Files Modified

1. **src/server/controller/userController.ts**
   - Added `createInstructor()` function

2. **src/server/routes/userRoutes.ts**
   - Added `POST /instructors` route

3. **src/server/tests/userController.test.ts** (New)
   - Integration tests for createInstructor

## Future Enhancements

1. **Update Instructor**: `PUT /api/users/instructors/:id`
2. **Delete Instructor**: `DELETE /api/users/instructors/:id`
3. **Assign Courses**: Link instructors to specific courses/sessions
4. **Bulk Upload**: CSV import for multiple instructors
5. **Email Notifications**: Auto-send credentials to new instructors
6. **Role Management UI**: Frontend forms for instructor management
