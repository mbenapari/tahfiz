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
