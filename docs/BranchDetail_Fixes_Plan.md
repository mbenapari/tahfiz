# BranchDetail.tsx Issues - Fix Plan (v2)

## Executive Summary

After deep code analysis:
- **Issues 1 and 3 may share the same root cause**: Email encryption/decryption in the User model via `afterFind` hook
- **Issue 2** is purely a frontend UI issue - no edit form exists
- **Issue 3** likely has a React component remounting issue causing state loss

**Critical discovery**: The API response structure (`{ success: true, data: { users: [...] } }`) matches what the frontend expects - so Issue 3 is NOT a response structure mismatch. The bug is likely React-related.

---

## Issue 1: Encrypted Email Displayed for Branch Members (Line 506)

### Problem Analysis

The `User` model (User.ts) uses:
- `beforeCreate`/`beforeUpdate` hooks to encrypt `email`, `phone`, `student_identifier` before storage
- `afterFind` hook to decrypt these fields after retrieval (lines 234-246)

**Data flow for branch members:**
1. `GET /api/branches/:branchId/members` → `schoolService.getSchoolMembers()`
2. `SchoolMember.findAll({ include: [{ model: User, as: 'user' }] })`
3. `afterFind` hook decrypts `email` on User instances

**Likely bug**: The `afterFind` hook in Sequelize may not properly fire for **eager-loaded associations** in all versions/configurations. When User is included via `include`, the hook behavior can be inconsistent.

### Verification Steps (Before Fix)
1. Open browser DevTools → Network tab
2. Call `GET /api/branches/{branchId}/members`
3. Check if `members[].user.email` is decrypted (plain text) or encrypted (format: `iv:tag:hexstring`)

### Fix Options

**Option A - Backend Fix (Proper)**: Ensure `afterFind` hook properly decrypts for eager-loaded associations
- Location: `src/server/model/User.ts` lines 234-246
- May need to explicitly call decryption in the service layer after fetching

**Option B - Frontend Fallback (Quick UX Fix)**:
```tsx
// Line ~506 in BranchDetail.tsx
// Replace:
{member.user?.email} - {member.role}
// With: 
{member.user?.email?.includes(':') ? 'Email hidden' : member.user?.email} - {member.role}
```

**Recommendation**: Implement both - backend fix to ensure proper decryption everywhere, frontend fallback as belt-and-suspenders.

---

## Issue 2: Schedule Configuration Not Editable (Lines 740-771)

### Problem Analysis

The Schedule tab only displays values as read-only. Backend already supports updates via:
- `schoolService.updateBranch()` handles `schedule_mode`, `study_days`, `timezone`
- Uses `override_study_days` and `override_schedule_mode` on Branch model

### Required Changes

**1. Add edit state** (in BranchDetail.tsx):
```tsx
const [isEditingSchedule, setIsEditingSchedule] = useState(false);
const [scheduleForm, setScheduleForm] = useState({
  schedule_mode: branch?.schedule_mode || 'simple',
  timezone: branch?.timezone || 'UTC',
  study_days: branch?.study_days || [],
});
```

**2. Replace read-only display with conditional edit mode**:
```tsx
{activeTab === 'schedule' && (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h3 className="text-white font-semibold">Schedule Configuration</h3>
      {!isEditingSchedule ? (
        <button onClick={() => setIsEditingSchedule(true)}>Edit</button>
      ) : (
        <div className="flex gap-2">
          <button onClick={handleSaveSchedule}>Save</button>
          <button onClick={() => setIsEditingSchedule(false)}>Cancel</button>
        </div>
      )}
    </div>
    {/* Form fields or read-only display based on isEditingSchedule */}
  </div>
)}
```

**3. Form controls needed**:
- `schedule_mode`: `<select>` with options `simple` and `advanced`
- `timezone`: `<select>` with common timezones (or input)
- `study_days`: Checkbox group for Sun(0) through Sat(6)

**4. Save handler**:
```tsx
const handleSaveSchedule = async () => {
  const success = await updateBranch(branch.id, {
    schedule_mode: scheduleForm.schedule_mode,
    study_days: scheduleForm.study_days,
    timezone: scheduleForm.timezone,
  });
  if (success) {
    setBranch(prev => ({ ...prev, ...scheduleForm }));
    setIsEditingSchedule(false);
  }
};
```

---

## Issue 3: User Selection from Dropdown Not Working (Lines 814-843)

### Problem Analysis

**User reports**: Selecting from dropdown "just vanishes", but search-then-select works.

**Code analysis**:
The `UserSearchSelector` component has two selection paths:
1. **Dropdown** (lines 222-236): Native `<select>` element
2. **Search** (lines 259-275): Custom search results with buttons

Both call `onUserSelect(user)` which sets `selectedAdminUser` in parent.

**Key observation**: The `loadDropdownUsers` function (lines 81-96) fetches from `/api/users/role/:role`. This API:
1. Calls `userService.getUsersByRole(tenantId, role)` which uses `User.findAll()`
2. The `afterFind` hook SHOULD decrypt emails
3. Then `profileController.listUsersByRole` maps the result to plain objects

**If emails are encrypted** in the API response:
- `dropdownUsers` would contain users with encrypted emails
- When user selects from dropdown, the encrypted email is passed to `onUserSelect`
- The selected user display would show garbled email
- BUT this shouldn't cause the selection to "vanish"

**Actual bug might be**: The API response structure mismatch.

Looking at `profileController.listUsersByRole` (line 176):
```js
res.json(apiResponse.success({ users: results }));
```

But `loadDropdownUsers` in UserSearchSelector expects:
```js
result.data?.users
```

Let me check `apiResponse.success` format...

### Verification Steps (Before Fix)

1. Open browser DevTools → Network
2. Call `GET /api/users/role/instructor`
3. Check response structure - is it `{ success: true, data: { users: [...] } }`?
4. Also verify if `users[].email` is decrypted or encrypted (check for `:` delimiter pattern)

### Confirmed: API Response Structure is Correct

The `apiResponse.success({ users: results })` returns `{ success: true, data: { users: [...] } }`.
Frontend accesses `result.data?.users` - this matches.

### Actual Bug Analysis

After thorough code analysis, the most likely cause is **React component remounting**.

In `UserSearchSelector`:
- The `<select>` element has `value=""` hardcoded (line 223)
- After selection, the select's value resets to `""` immediately
- This triggers `onChange` again? No, `onChange` only fires on user action.

**Hypothesis**: When user selects from dropdown, the state update (`setSelectedAdminUser(user)`) causes a re-render of the parent `BranchDetail`. This might trigger the `useEffect` in `UserSearchSelector` that loads dropdown users, which could cause a brief moment where `dropdownUsers` is empty before being refilled. During this window, React might be re-evaluating the render.

**Most likely fix**: Ensure stable component identity or add explicit key to force fresh instance:

```tsx
// In BranchDetail.tsx line ~825
<UserSearchSelector
  key={adminGrantOpen ? 'open' : 'closed'}  // Forces fresh instance on modal open/close
  // ...other props
/>
```

### Additional Fix: API Response Handling

Even though structure is correct, add defensive coding:

```js
// UserSearchSelector.tsx line 87
// Change from:
setDropdownUsers(result.data?.users || []);
// To:
const users = result?.data?.users;
setDropdownUsers(Array.isArray(users) ? users : []);
```

Or fix backend to return flat structure `apiResponse.success(results)` without wrapping in `{ users }`.

---

## Shared Investigation: Email Encryption State

### Key Files to Check

1. **`src/server/model/User.ts`** - Lines 203-232 (hooks)
2. **`src/server/controller/profileController.ts`** - Lines 149-181 (listUsersByRole)
3. **`src/server/services/userService.ts`** - Lines 218-231 (getUsersByRole)
4. **`src/server/services/schoolService.ts`** - Lines 697-707 (getSchoolMembers)

### Crypto Utilities

**`src/server/utils/crypto.ts`**:
- Encrypted format: `iv:tag:hexstring` (separated by colons)
- `decrypt()` returns original text if format is wrong (line 65)
- `decrypt()` returns original text if decryption fails (line 79)

### Test for Encrypted Email

In browser console or API response, check if email contains `:` delimiter:
- Plain text: `john@example.com`
- Encrypted: `a1b2c3...:d4e5f6...:1a2b3c...` (three parts separated by `:`)

---

## Implementation Order Recommendation

1. **First**: Fix Issue 3's dropdown selection - add `key` prop to UserSearchSelector (quick, likely to fix)
2. **Second**: Implement Issue 2's schedule editing (pure frontend, straightforward)
3. **Third**: Investigate Issue 1's email decryption - verify actual API response to confirm root cause

---

## Files to Modify

| File | Issue | Changes |
|------|-------|---------|
| `src/client/pages/BranchDetail.tsx` | 1, 2, 3 | Add key prop to UserSearchSelector, email fallback, schedule edit form |
| `src/client/components/UserSearchSelector.tsx` | 3 | Defensive array check, investigate component remounting |
| `src/server/model/User.ts` | 1 | Verify/fix `afterFind` hook for eager-loaded associations |
| `src/server/controller/profileController.ts` | 1, 3 | May need to explicitly decrypt after mapping |
