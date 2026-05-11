# REST API Documentation

## Base Configuration
- **Base URL:** `/api`
- **Authentication:** Most endpoints require a valid JWT token sent in cookies or via the `Authorization: Bearer <token>` header.
- **Content-Type:** `application/json`

---

## 1. Authentication (`/api/users`)

### Register User
- **POST** `/api/users/register`
- **Description:** Creates a new user account. Rate-limited.
- **Body:** `{ "email", "password", "firstName", "lastName", "roleId", "tenantId" (optional) }`

### Login
- **POST** `/api/users/login`
- **Description:** Authenticates a user and issues a JWT.
- **Body:** `{ "email", "password" }`
- **Response:** `{ "token", "user": { ... } }`

---

## 2. Schools / Tenants (`/api/schools`)

### Create School
- **POST** `/api/schools`
- **Description:** Registers a new tenant and sets the creator as the Owner.
- **Auth Required:** Yes
- **Body:** `{ "name", "slug", "address", "phone", "email" }`

---

## 3. Daily Sessions (`/api/sessions`)

### Record Daily Session
- **POST** `/api/sessions/daily`
- **Description:** Saves a session along with optional attendance, hifz, and revision records.
- **Auth Required:** Yes (Instructor/Admin)
- **Body:**
  ```json
  {
    "studentId": 1,
    "date": "2026-03-21",
    "attendance": { "status": "present" },
    "hifzRecord": {
      "surahNumber": 1,
      "startAyah": 1,
      "endAyah": 7,
      "grade": "A"
    },
    "revisionRecord": { ... }
  }
  ```
- **Validation:** Backend strictly verifies that `endAyah` does not exceed the total Ayahs in the requested `surahNumber`.

---

## 4. Quranic Metadata (`/api/surahs`)

### Get All Surahs
- **GET** `/api/surahs`
- **Description:** Retrieves the list of all 114 Surahs with their metadata (name, total ayahs, revelation type).
- **Auth Required:** Yes

---

## 5. Dashboard Statistics (`/api/stats`) *(In Development)*

### Get Dashboard Metrics
- **GET** `/api/stats/overview`
- **Description:** Returns aggregated statistics for the tenant dashboard.
- **Auth Required:** Yes
- **Response:**
  ```json
  {
    "activeStudents": { "value": 150, "trend": "+5%" },
    "totalHifz": { "value": 12000, "trend": "+12%" },
    "todaySessions": { "value": 45, "completed": 30 },
    "pendingReviews": { "value": 12 }
  }
  ```

---

## 6. Analytics (`/api/analytics`)

### Get Active Students
- **GET** `/api/analytics/active-students`
- **Description:** Returns the count of unique students who logged at least one session or logged in during daily, weekly, and monthly windows.
- **Auth Required:** Yes
- **Response:** `{ "daily": number, "weekly": number, "monthly": number }`

### Get Attendance Metrics
- **GET** `/api/analytics/attendance`
- **Description:** Returns total attendance counts and percentage for a specified date range.
- **Query Params:** `startDate` (required), `endDate` (required), `class_name` (optional), `grade_level` (optional), `studentId` (optional)
- **Response:** `{ "total": number, "present": number, "absent": number, "excused": number, "percentage": number }`

### Get Attendance Breakdown
- **GET** `/api/analytics/attendance/breakdown`
- **Description:** Returns average attendance percentage breakdown by class, grade, and school-wide.
- **Query Params:** `startDate` (required), `endDate` (required)
- **Response:** `{ "classes": [...], "grades": [...], "schoolWide": {...} }`

### Get Memorization Progress
- **GET** `/api/analytics/memorization/progress`
- **Description:** Returns pages memorized and performance trends over a specified date range.
- **Query Params:** `startDate` (required), `endDate` (required), `studentId` (optional), `class_name` (optional)
- **Response:** `{ "pages_memorized": number, "records_count": number, "trend": [...] }`

---

## 7. Reports (`/api/reports`)

### Get School Performance Report
- **GET** `/api/reports/school-performance`
- **Description:** Comprehensive data for the School Performance dashboard, including stats, trends, and top performers.
- **Query Params:** `startDate` (required), `endDate` (required)
- **Response:** Aggregate object with `stats`, `trendData`, `topPerformers`, `reportTypes`, and `recentExports`.

### Get Students Performance List
- **GET** `/api/reports/students-performance`
- **Description:** Paginated list of students with their individual memorization and attendance performance.
- **Query Params:** `page` (default 1), `limit` (default 10), `class_name` (optional), `grade_level` (optional)
- **Response:** Paginated object with `data` and `meta`.

