# System Architecture

## 1. System Overview
The Tahfiz application follows a monolithic, full-stack architecture using a React frontend and an Express/Node.js backend, communicating via RESTful APIs.

### Design Principles
- **Separation of Concerns:** Strict boundaries between routing, business logic, and data access.
- **Multi-Tenancy:** Data is isolated per `School` using a `tenant_id` foreign key.
- **Role-Based Access Control (RBAC):** Hierarchical permissions governing API access.

---

## 2. Directory Structure

```text
src/
├── client/                 # React Frontend
│   ├── components/         # Reusable UI elements (Logo, Navbar, Sidebar)
│   ├── context/            # React Context providers (AuthContext)
│   ├── layouts/            # Page wrappers (DashboardLayout)
│   ├── pages/              # Route-level components (Auth, Dashboard, Sessions)
│   └── App.tsx             # Frontend router configuration
│
└── server/                 # Node.js/Express Backend
    ├── config/             # Environment and DB configs
    ├── controller/         # Request handling and HTTP responses
    ├── middleware/         # Express middlewares (Auth, Logging, Rate Limiting)
    ├── model/              # Sequelize Database Models
    ├── routes/             # API Route definitions
    ├── services/           # Core business logic and DB queries
    ├── tests/              # Automated testing suites
    ├── utils/              # Shared utilities (Logger)
    └── main.ts             # Backend entry point
```

---

## 3. Data Flow Pattern
All backend requests follow a strict sequential flow:

1. **Route (`routes/*.ts`):** Defines the HTTP method, endpoint, and attaches middleware.
2. **Middleware (`middleware/*.ts`):** Handles cross-cutting concerns:
   - `requestLogger`: Assigns a `correlationId` and logs the incoming request.
   - `authMiddleware`: Verifies JWTs and user permissions.
3. **Controller (`controller/*.ts`):** Validates request parameters/body, calls the necessary service(s), and returns the formatted HTTP response.
4. **Service (`services/*.ts`):** Contains the core business logic. Performs computations, enforces business rules (e.g., Ayah count validation), and interacts with models.
5. **Model (`model/*.ts`):** Sequelize definitions that execute queries against the relational database.

---

## 4. Entity Relationship Model (High-Level)

### Identity & Tenancy
- **School:** The root tenant.
- **User:** Can belong to multiple Schools (via `SchoolMember`) and holds a specific `Role`.
- **Enrollment:** Links a `User` (Student) to a `School`.

### Daily Operations
- **Session:** A daily instance where a student meets an instructor.
- **Attendance:** Attached 1:1 to a Session.
- **MemorizationRecord (Hifz):** Attached to a Session, logging newly memorized Ayahs for a specific `Surah`.
- **RevisionRecord:** Attached to a Session, logging reviewed Ayahs.

### Progress Aggregation
- **SurahProgress / JuzProgress:** Aggregated tables that maintain a student's overall completion status for quick querying.
