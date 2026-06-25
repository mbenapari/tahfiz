# DailySession Page Enhancement Plan

## Overview
Split the combined Hifz/Revision save flow into separate save actions, add new-user onboarding guidance, and implement history viewing for previous memorization and revision records.

---

## Part 1: Separate Save Actions (No Backend Changes)

### Problem
Currently `handleSaveSession` saves both Hifz and Revision in one click. Users must fill both sections to save, even when they only want to record one type.

### Solution
Split into two independent save functions.

### Implementation

#### 1.1 Split Validation Logic
```
handleSaveHifz()     → validates Hifz fields only
handleSaveRevision()  → validates Revision fields only
```

**Hifz Validation (handleSaveHifz):**
- Requires: `selectedSurah`, `hifzStartAyah`, `hifzEndAyah`
- Validates ayah range within surah bounds
- Requires attendance !== 'absent'
- Validates rating (1-5)

**Revision Validation (handleSaveRevision):**
- Requires: `revisionTab === 'page'` → `revisionStart`, `revisionEnd` pages
- Requires: `revisionTab === 'surah'` → `selectedRevisionSurah`, `selectedEndRevisionSurah`, `revisionStart`, `revisionEnd`
- Requires attendance !== 'absent'
- Validates rating (1-5)

#### 1.2 Add Section-Level Save Buttons

Add a "Save Hifz" button to the Hifz card header and "Save Revision" button to the Revision card header. Remove the single footer "Save Session" button or convert to conditional dual-buttons.

**Hifz Section (line ~498):**
```tsx
<h2 className="text-xl font-bold text-white">New Lesson (Hifz)</h2>
<button onClick={handleSaveHifz} className="...">Save Hifz</button>
```

**Revision Section (line ~658):**
```tsx
<h2 className="text-xl font-bold text-white">Revision (Muraja'ah)</h2>
<button onClick={handleSaveRevision} className="...">Save Revision</button>
```

#### 1.3 API Payload Changes

Each function sends only its relevant record:
```tsx
// handleSaveHifz
{ hifzRecord: { ... }, revisionRecord: null, rating, notes, attendance }

// handleSaveRevision
{ hifzRecord: null, revisionRecord: { ... }, rating, notes, attendance }
```

---

## Part 2: UI/UX Improvements for New Users

### 2.1 Welcome Banner (First-Time Users)
```tsx
{isFirstSession && (
  <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
    <p className="text-sm font-medium text-primary">
      💡 Welcome! Record today's Hifz progress and any revision work separately
      using the save buttons in each section.
    </p>
  </div>
)}
```

### 2.2 Section Helper Text
Add tooltip/info icons with explanatory text:

| Section | Helper Text |
|---------|-------------|
| Hifz Surah dropdown | "Select the surah you're memorising today" |
| Hifz Ayah range | "Enter the ayah range you covered in this session" |
| Revision | "Choose pages or surahs to revise based on curriculum" |
| Rating | "Rate the student's performance this session" |

### 2.3 Improved Empty State for Weak Spots
Replace generic "No weak spots recorded yet." with actionable empty state:
```tsx
<div className="flex flex-col items-center gap-2 py-4">
  <p className="text-xs text-text-muted italic">No weak spots recorded yet.</p>
  <button className="text-xs text-primary hover:underline">Mark difficult ayahs</button>
</div>
```

### 2.4 Visual Progress Indicators
Enhance the revision progress card with:
- Color-coded progress (green = on target, yellow = behind, red = far behind)
- Percentage display
- Days until next scheduled revision hint

---

## Part 3: View Previous Memorization & Revision History

### Problem
Instructors cannot view a student's past memorization or revision records on the DailySession page without navigating away.

### Solution
Add expandable/collapsible history panels within the Hifz and Revision sections showing recent records.

### 3.1 Backend Implementation Required

#### New Endpoint: GET /api/sessions/history/:studentId

**Query Parameters:**
- `type`: `'hifz' | 'revision' | 'all'` (default: `'all'`)
- `limit`: number (default: 10)
- `offset`: number (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "hifzRecords": [
      {
        "id": 1,
        "sessionDate": "2026-06-10",
        "surahName": "Al-Baqarah",
        "surahNumber": 2,
        "startAyah": 255,
        "endAyah": 260,
        "isFullSurah": false,
        "rating": 4,
        "notes": "Good progress"
      }
    ],
    "revisionRecords": [
      {
        "id": 2,
        "sessionDate": "2026-06-10",
        "type": "surah",
        "startSurah": "Al-Fatihah",
        "endSurah": "Al-Baqarah",
        "pages": null,
        "isFullSurah": false,
        "rating": 3
      }
    ],
    "pagination": {
      "total": 45,
      "limit": 10,
      "offset": 0
    }
  }
}
```

#### Files to Create/Modify:

1. **Create:** `src/server/services/sessionHistoryService.ts`
   - `getHifzHistory(studentId, tenantId, options)`
   - `getRevisionHistory(studentId, tenantId, options)`
   - `getCombinedHistory(studentId, tenantId, options)`

2. **Modify:** `src/server/routes/sessionRoutes.ts`
   - Add `GET /api/sessions/history/:studentId` route

3. **Modify:** `src/server/controllers/sessionController.ts`
   - Add `getSessionHistory` handler

### 3.2 Frontend Implementation

#### State Additions:
```tsx
const [hifzHistory, setHifzHistory] = useState<HifzRecord[]>([]);
const [revisionHistory, setRevisionHistory] = useState<RevisionRecord[]>([]);
const [isHistoryLoading, setIsHistoryLoading] = useState(false);
const [expandedHistory, setExpandedHistory] = useState<'hifz' | 'revision' | null>(null);
```

#### Fetch on Mount:
```tsx
useEffect(() => {
  if (studentId) {
    fetchSessionHistory(Number(studentId));
  }
}, [studentId]);
```

#### UI Components:

**Hifz History Panel (collapsible, inside Hifz section):**
```tsx
<div className="border-t border-border-green/20 mt-4 pt-4">
  <button
    onClick={() => setExpandedHistory(expandedHistory === 'hifz' ? null : 'hifz')}
    className="flex items-center gap-2 text-sm text-text-muted hover:text-white"
  >
    <History size={16} />
    <span>View Previous Hifz ({hifzHistory.length})</span>
    <ChevronDown className={expandedHistory === 'hifz' ? 'rotate-180' : ''} />
  </button>

  {expandedHistory === 'hifz' && (
    <div className="mt-3 space-y-2">
      {hifzHistory.map(record => (
        <div key={record.id} className="p-3 bg-background-dark/30 rounded-lg">
          <div className="flex justify-between">
            <span className="font-bold text-white">{record.surahName}</span>
            <span className="text-xs text-text-muted">{record.sessionDate}</span>
          </div>
          <p className="text-xs text-text-muted">Ayahs {record.startAyah}-{record.endAyah}</p>
        </div>
      ))}
    </div>
  )}
</div>
```

**Revision History Panel (similar structure):**

---

## File Changes Summary

| File | Action |
|------|--------|
| `src/client/pages/sessions/DailySession.tsx` | Full refactor: split save handlers, add history panels, add onboarding UI |
| `src/server/services/sessionHistoryService.ts` | Create new service |
| `src/server/controllers/sessionController.ts` | Add `getSessionHistory` handler |
| `src/server/routes/sessionRoutes.ts` | Add history route |

---

## Implementation Order

1. **Backend:** Create session history service and endpoint
2. **Frontend:** Add history state and fetch logic
3. **Frontend:** Add history panel UI components
4. **Frontend:** Split save handlers (handleSaveHifz, handleSaveRevision)
5. **Frontend:** Add section-level save buttons
6. **Frontend:** Add onboarding UI (welcome banner, helper text, empty states)
7. **Testing:** Verify all save flows work independently
