# 🏋️‍♂️ GymFlow — Smart Gym Management System using MongoDB
> **DBMS Lab Project • Final Full-Stack System • Complete Demonstration Guide**

GymFlow is an enterprise-grade, full-stack Smart Gym Management System built exclusively on **MongoDB**, **Express.js**, **React (Vite)**, and **Node.js** (MERN). Designed for DBMS Lab faculty reviews and viva examinations, GymFlow combines practical health-club management operations with core database engineering concepts: multi-stage aggregation pipelines, compound unique indexes, 5-minute TTL token eviction, atomic concurrency locks, audit trails, and SQL-to-NoSQL architectural mappings.

---

## 📑 Table of Contents
1. [Project Overview & Key Features](#-key-features)
2. [Technology Stack](#-technology-stack)
3. [Prerequisites & System Requirements](#-prerequisites)
4. [MongoDB Database Setup (Atlas & Local)](#-database-setup)
5. [Environment Variables Configuration](#-environment-variables)
6. [Installation & Startup Guide](#-installation--startup)
7. [Database Seed Script & Demo Credentials](#-seed-script--demo-credentials)
8. [Complete REST API Reference](#-rest-api-reference)
9. [Database Architecture & Collection Relationships](#-database-architecture)
10. [Automated Verification & Test Results](#-verification--test-results)
11. [Faculty Viva Review Guide & DBMS Concepts](#-faculty-viva-review--dbms-concepts)
12. [Live Faculty Demonstration Workflow](#-faculty-demonstration-walkthrough)
13. [Known Limitations & Architecture Notes](#-known-limitations)

---

## 🌟 Key Features

### 1. Three Distinct Role-Based Dashboards
* **Admin Dashboard (`/admin/dashboard`):** Real-time MongoDB KPI cards (Active Members, Total Trainers, Today's Attendance, Monthly Revenue, Expiring Plans, Outstanding Dues, Maintenance Alerts). 4 MongoDB aggregation-backed interactive charts (Monthly Revenue, Weekly Attendance, Plan Distribution, Trainer Allocation).
* **Trainer Dashboard (`/trainer/dashboard`):** Trainee roster, scheduled 1-on-1 personal training sessions, assigned workout plans, diet regimes, and member PR progression tracking.
* **Member Dashboard (`/member/dashboard`):** Digital membership card with real-time remaining days counter, 5-minute dynamic QR check-in pass with live countdown, assigned workout splits, macro diet plans, and weight/PR transformation graphs.

### 2. Multi-Step Self-Registration & Plan Selection Flow
* Public registration with enforced `Member` role (public users can never self-register as Admin or Trainer).
* Interactive membership catalog loaded directly from MongoDB plans (`Basic`, `Silver`, `Gold`, `Premium`).
* Promotional coupon application with atomic usage limit enforcement.
* Transparent demo checkout workflow with automatic Invoice generation and immediate membership activation.

### 3. Core Gym Management Modules
* **Member Management:** Full CRUD with regex text search (Name, Email, Phone, Custom ID `GF-1001+`), status filters, trainer assignment, and pagination.
* **Trainer Management:** Track specializations, certifications, bio, and assigned member counts aggregated via single-stage MongoDB pipeline.
* **Membership Lifecycle:** Server-calculated start/end dates, 7-day expiration risk projections, freeze & resume with automatic expiration extension, and renewal.
* **Attendance System:** Check-in/check-out timestamping, member visit percentage, daily attendance ledger, and compound unique index preventing duplicate check-ins on the same calendar day.
* **5-Minute TTL QR Attendance:** Single-use QR token with 5-minute lifetime, server-side timestamp validation, and immediate single-use flag preventing replay attacks.
* **Financial Ledger & Billing:** Multi-method payments (Cash, UPI, Card, Net Banking), transaction references, refund processing, and formal GST invoices.

### 4. Extended Operations & Engagement Modules
* **Group Fitness Classes (`/classes`):** Timetable scheduling (Yoga, Zumba, Spin, CrossFit) with atomic capacity booking (`$inc` guarded by `$lt` condition) to eliminate overbooking.
* **Personal Training Sessions:** 1-on-1 calendar scheduling with overlap conflict detection for trainers and members.
* **Equipment & Maintenance (`/equipment`):** Gym asset inventory, condition flags, 7-day maintenance projections, and service log history.
* **Smart Lockers (`/lockers`):** Graphical locker grid with atomic compare-and-swap allocation preventing double-assignment.
* **Diet & Nutrition Plans (`/diet-plans`):** Embedded subdocument meals breakdown with macro calorie/protein/carb tracking.
* **Leads & Trial Passes (`/leads`):** Sales prospect pipeline, 3-day trial pass validity, and duplicate-safe 1-click member conversion.
* **Discount Coupons (`/coupons`):** Percentage and flat discounts with atomic usage counter limits and expiration rules.
* **Dues & Defaulters (`/dues`):** Financial reconciliation calculating `Price - Sum(Completed Payments)`, outstanding receivables summary, and partial payment settlement.
* **Member Feedback (`/feedback`):** Star ratings (1-5) and written reviews with MongoDB aggregation calculating average scores.
* **Audit Trail (`/audit-logs`):** Append-only compliance log recording entity modifications, old/new states, timestamps, and actors.
* **DBMS Lab Diagnostics (`/diagnostics`):** Real-time index introspection catalog, SQL View equivalent comparison, and schema metadata.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose & DBMS Concept Demonstrated |
| :--- | :--- | :--- |
| **Database** | MongoDB (v6.0+ / Atlas) | Document Store, JSON/BSON, Indexes, Aggregations |
| **ODM** | Mongoose v8.3 | Schemas, Validations, Virtuals, Middleware, Population |
| **Backend** | Node.js + Express.js | RESTful APIs, JWT Security, Centralized Error Handling |
| **Frontend** | React 18 + Vite | Component-Driven SPA, Protected Route Guards |
| **Styling** | Tailwind CSS | Charcoal/Black (#0a0d12) & Emerald Green Dark Theme |
| **Charts** | Recharts | Aggregation Pipeline Data Visualization |
| **QR Engine** | qrcode.react | Client-Side Dynamic Token QR Rendering |
| **Auth** | JWT + bcryptjs | Stateless Claims Authentication & 10-Salt Hashing |

---

## 📋 Prerequisites

Before running the application, ensure the following are installed:
* **Node.js**: v18.0.0 or higher (`node -v`)
* **npm**: v9.0.0 or higher (`npm -v`)
* **MongoDB**:
  * **Option A (Recommended for Offline Demos):** Zero-config embedded `mongodb-memory-server` (starts automatically if no external MongoDB is reachable).
  * **Option B:** Local MongoDB Community Server running at `mongodb://127.0.0.1:27017/gymflow`.
  * **Option C:** MongoDB Atlas Cloud Cluster.

---

## 🗄️ Database Setup

### Option 1: MongoDB Atlas (Cloud)
1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free shared M0 cluster.
3. Under **Database Access**, create a database user (e.g., `gymflow_admin`) with password.
4. Under **Network Access**, add IP `0.0.0.0/0` (Allow access from anywhere) or your current IP.
5. Click **Connect** -> **Drivers** (Node.js) -> Copy connection string:
   ```text
   mongodb+srv://gymflow_admin:<password>@cluster0.xxxxx.mongodb.net/gymflow?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your database user password and paste into `server/.env`.

### Option 2: Local MongoDB Community Server
1. Download and start MongoDB Community Server:
   ```powershell
   # Windows Service default
   net start MongoDB
   ```
2. Your connection string is:
   ```text
   mongodb://127.0.0.1:27017/gymflow
   ```
3. Update `MONGO_URI` in `server/.env`.

### Option 3: Zero-Config Embedded Memory Engine (Offline Demo Fallback)
If network firewall or DNS blocks MongoDB Atlas (`querySrv ECONNREFUSED`), GymFlow's custom connection manager in `server/config/db.js` automatically starts an embedded, high-performance in-memory MongoDB instance and auto-seeds all 22 collections. Your live demo will **never fail** even without internet access!

---

## ⚙️ Environment Variables

Create `server/.env` based on `server/.env.example`:

```env
# MongoDB Connection String (Atlas, Local, or fallback)
MONGO_URI=mongodb://127.0.0.1:27017/gymflow

# Backend Express Port
PORT=5000

# JSON Web Token Secret Key
JWT_SECRET=gymflow_secure_jwt_secret_dbms_lab_2026_review

# Allowed Client Origin for CORS
CLIENT_URL=http://localhost:5173

# Application Environment
NODE_ENV=development
```

> **Security Note:** `.env` is ignored by git (`.gitignore`). Never commit real credentials.

---

## 🚀 Installation & Startup

### Step 1: Clone & Navigate to Project Root
```bash
cd "d:/dbms project"
```

### Step 2: Install Backend Dependencies
```bash
cd server
npm install
```

### Step 3: Seed Initial Database Records
```bash
npm run seed
```
*(Creates 1 admin, 3 trainers, 16 members, 4 plans, 14-day attendance records, group classes, equipment, lockers, diet plans, workouts, and audit logs).*

### Step 4: Install Frontend Dependencies
```bash
cd ../client
npm install
```

### Step 5: Start Both Servers

**Terminal 1 — Backend API Server (Port 5000):**
```bash
cd server
npm run start
```
*API will listen at `http://localhost:5000`.*
*Health Check: `http://localhost:5000/api/health`.*

**Terminal 2 — Frontend Client (Port 5173):**
```bash
cd client
npm run dev
```
*Open your browser at `http://localhost:5173`.*

---

## 🔑 Seed Script & Demo Credentials

The database seeder is located at `server/seed/seed.js`. It runs with:
```bash
cd server
npm run seed
```

### Ready-to-Use Accounts for Faculty Viva:

| Role | Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| 👑 **Admin** | `admin@gymflow.com` | `Admin@123` | Full control, financial ledgers, audit logs, diagnostics |
| 🏋️ **Trainer** | `trainer@gymflow.com` | `Trainer@123` | Assigned trainees, workouts, diet plans, PR logging |
| 👤 **Member** | `member@gymflow.com` | `Member@123` | Digital pass, 5-min QR token, class booking, progress |

*(The login screen and top navigation bar include instant 1-click credential autofill buttons for hassle-free demonstration!)*

---

## 📡 REST API Reference

All protected endpoints require an `Authorization: Bearer <JWT_TOKEN>` header.

### 1. Authentication & Health
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Server uptime & real database engine status |
| `POST` | `/api/auth/register` | Public | Enforces Member role, calculates plan pricing, generates invoice |
| `POST` | `/api/auth/login` | Public | Authenticates credentials & issues JWT token |
| `GET` | `/api/auth/me` | Protected | Returns current authenticated user record |

### 2. Dashboards (Role-Specific)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/admin` | Admin | 9 KPI metrics + 4 MongoDB aggregation chart feeds |
| `GET` | `/api/dashboard/trainer` | Trainer | Trainees roster, schedule, and pending progress logs |
| `GET` | `/api/dashboard/member` | Member | Private membership status, days left, diet, workout, PRs |

### 3. Core Modules
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET/POST` | `/api/members` | Admin, Trainer | List members (search/filter/paginate) & create member |
| `GET/PUT/DEL` | `/api/members/:id` | Admin, Trainer | Get profile, update member details, safe deactivation |
| `GET/POST` | `/api/trainers` | All Authenticated | List trainers with member counts & add trainer |
| `GET/POST` | `/api/plans` | All Authenticated | Public active catalog & admin plan management |
| `GET` | `/api/memberships` | All Authenticated | Active memberships with remaining days |
| `PUT` | `/api/memberships/:id/freeze` | Admin | Freeze membership with reason |
| `PUT` | `/api/memberships/:id/resume` | Admin | Resume membership & extend end date by frozen days |
| `POST` | `/api/memberships/:id/renew` | Admin | Renew plan with snapshot pricing |
| `GET` | `/api/attendance` | All Authenticated | Daily attendance logs & date filtering |
| `POST` | `/api/attendance/token/generate` | Member | Generates 5-minute TTL QR check-in token |
| `POST` | `/api/attendance/token/verify` | Admin | Validates token, rejects replay attacks, marks attendance |
| `GET/POST` | `/api/payments` | Admin, Trainer | Ledger records & record payment |
| `POST` | `/api/payments/:id/refund` | Admin | Processes refund & creates negative balance audit log |
| `GET` | `/api/invoices` | All Authenticated | Formal invoices with subtotal, tax & discount |
| `GET/POST` | `/api/workouts` | All Authenticated | List assigned workout plans & create exercise splits |
| `GET/POST` | `/api/progress` | All Authenticated | Time-series measurements & Big 3 PR tracking |

### 4. Extended Modules & DBMS Concepts
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET/POST` | `/api/classes` | All Authenticated | Group classes timetable & create class |
| `POST` | `/api/classes/:id/book` | Member | Atomic `$inc` capacity slot booking |
| `DELETE` | `/api/classes/:id/book` | Member | Cancel booking and decrement booked counter |
| `GET/POST` | `/api/equipment` | Admin | Asset registry & condition logging |
| `GET/POST` | `/api/lockers` | Admin, Member | Locker grid & atomic compare-and-swap allocation |
| `PUT` | `/api/lockers/:id/release` | Admin | Release locker back to `Available` status |
| `GET/POST` | `/api/diet-plans` | All Authenticated | Embedded subdocument meal plans |
| `GET/POST` | `/api/leads` | Admin, Trainer | Sales lead pipeline & 3-day trial pass |
| `POST` | `/api/leads/:id/convert` | Admin | Duplicate-safe 1-click lead to member conversion |
| `GET/POST` | `/api/coupons` | Admin | Discount codes & atomic usage caps |
| `GET` | `/api/dues` | Admin | Outstanding dues ledger & defaulters list |
| `POST` | `/api/dues/:id/pay` | Admin | Settle partial or full dues payment |
| `GET/POST` | `/api/feedback` | All Authenticated | Reviews & MongoDB aggregation rating calculation |
| `GET` | `/api/audit-logs` | Admin | Read-only compliance audit trail |
| `GET` | `/api/reports/diagnostics` | Admin | Live index catalog & DBMS viva concepts |
| `GET` | `/api/reports/monthly-revenue-view` | Admin | MongoDB SQL View Equivalent aggregation |

---

## 🏗️ Database Architecture

GymFlow uses MongoDB as its sole data tier. Architectural decisions follow standard DBMS design principles:

```mermaid
erDiagram
    User ||--o| Member : "references (1:1)"
    User ||--o| Trainer : "references (1:1)"
    Trainer ||--o{ Member : "assignedTo (1:N)"
    Member ||--o{ Membership : "holds (1:N)"
    Plan ||--o{ Membership : "definesSnapshot (1:N)"
    Member ||--o{ Payment : "pays (1:N)"
    Membership ||--o{ Payment : "funds (1:N)"
    Payment ||--|| Invoice : "generates (1:1)"
    Member ||--o{ Attendance : "records (1:N)"
    Member ||--o{ CheckInToken : "generates (1:N)"
    Trainer ||--o{ Class : "instructs (1:N)"
    Class ||--o{ ClassBooking : "books (1:N)"
    Member ||--o{ ClassBooking : "attends (1:N)"
    Member ||--o| Locker : "allocates (1:1)"
    Member ||--o{ Workout : "assigned (1:N)"
    Member ||--o{ DietPlan : "assigned (1:N)"
    Member ||--o{ Progress : "measures (1:N)"
```

### Embedding vs. Referencing Design Strategy:
* **Referencing (`ObjectId` + `ref`):** Used between high-cardinality independent entities (`Member -> User`, `Membership -> Plan`, `ClassBooking -> Class`). Prevents document bloat past MongoDB's 16MB document size limit and enables independent indexing.
* **Embedding (Subdocuments):** Used when data is tightly coupled and always read together with the parent:
  * `Workout.exercises`: Array of `{ exerciseName, muscleGroup, sets, reps, weightKg, day }`.
  * `DietPlan.meals`: Array of `{ mealName, time, foodItems, calories, proteinGrams }`.
  * `Membership.freezeHistory`: Array of `{ frozenAt, resumedAt, reason, daysExtended }`.

---

## 🧪 Verification & Test Results

GymFlow includes a native automated test runner (`server/test/verify_system.js`) executing 15 comprehensive test suites covering all prompt requirements.

### Test Execution Command:
```bash
cd server
node test/verify_system.js
```

### Actual Terminal Execution Output:
```text
=== GYMFLOW COMPREHENSIVE SYSTEM VERIFICATION ===

--- TEST 1: Health & Database Diagnostic ---
[PASS] Health endpoint responds with 200 OK
[PASS] Database status is Connected (connected: true)
[PASS] Database host is present (Embedded MongoMemoryServer (Demo Mode))

--- TEST 2: Admin Authentication ---
[PASS] Admin login succeeds
[PASS] Admin role verified in JWT payload

--- TEST 3: Trainer Authentication ---
[PASS] Trainer login succeeds
[PASS] Trainer role verified in JWT payload

--- TEST 4: Member Authentication ---
[PASS] Member login succeeds
[PASS] Member role verified in JWT payload

--- TEST 5: Role Authorization & Security ---
[PASS] Member correctly blocked from admin audit-logs with 403 Forbidden
[PASS] Trainer correctly blocked from dues with 403 Forbidden

--- TEST 6: Dashboard Statistics ---
[PASS] Admin dashboard returns successfully
[PASS] Total members metric: 19
[PASS] Monthly revenue metric: Rs 1998
[PASS] Member dashboard returns successfully
[PASS] Member profile is present

--- TEST 7: Membership Plans API ---
[PASS] Active plans loaded from MongoDB: 4 plans

--- TEST 8: Public Registration Flow ---
[PASS] New user registered with selected plan and coupon
[PASS] Registered user strictly assigned Member role

--- TEST 9: Duplicate Email Registration Prevention ---
[PASS] Duplicate email registration correctly rejected with 400 Bad Request

--- TEST 10: QR Attendance Token & Replay Prevention ---
[PASS] 5-minute QR token generated for new member
[PASS] Token string exists
[PASS] QR token checked in successfully
[PASS] Replay check-in correctly rejected with 400 (Token already consumed)

--- TEST 11: Class Booking ---
[PASS] Classes retrieved
[PASS] Class "Morning Sunrise Yoga" booked atomically

--- TEST 12: Locker Allocation ---
[PASS] Lockers retrieved
[PASS] Locker #L-105 assigned atomically to new member

--- TEST 13: Dues & Defaulters ---
[PASS] Dues ledger retrieved
[PASS] Total outstanding dues: Rs 999

--- TEST 14: DBMS Diagnostics & SQL View Equivalent ---
[PASS] Introspected indexes across 11 collections
[PASS] SQL View equivalent aggregation retrieved
[PASS] Monthly revenue view returned 3 months

--- TEST 15: Audit Logs Trail ---
[PASS] Audit logs verified (5 recent system records)

========================================
VERIFICATION SUMMARY: 34 PASSED, 0 FAILED
========================================
```

### Frontend Production Build Output:
```text
> gymflow-client@1.0.0 build
> vite build

vite v5.4.21 building for production...
✓ 2387 modules transformed.
dist/index.html                   0.92 kB │ gzip:   0.53 kB
dist/assets/index-B_LztwHz.css   33.68 kB │ gzip:   6.32 kB
dist/assets/index-BwKk_FAb.js   934.23 kB │ gzip: 239.57 kB
✓ built in 9.90s
```

---

## 🎓 Faculty Viva Review & DBMS Concepts

Be prepared to answer these core questions during your DBMS Lab faculty evaluation:

### 1. CRUD Operations in MongoDB
* **Create:** `User.create()`, `Member.create()`, `Payment.create()`.
* **Read:** `find()`, `findOne()`, with projection `{ name: 1, email: 1 }` and `.populate()`.
* **Update:** Atomic `$set`, `$inc`, and `$push` using `findOneAndUpdate()`.
* **Delete:** Safe deactivation (`status: 'Inactive'`) preserving financial audit trails; physical deletion (`deleteOne()`) only for draft tokens.

### 2. ObjectId Referencing vs. SQL Foreign Keys
* **In SQL:** Foreign key constraints are enforced at the database engine level with strict referential integrity (`ON DELETE CASCADE`).
* **In MongoDB:** References are stored as 12-byte binary BSON `ObjectId` values. Referential integrity is managed through Mongoose middleware and service-level checks. This trades rigid normalization for flexible horizontal partitioning (sharding) across distributed nodes.

### 3. Mongoose `populate()` vs. SQL `JOIN`
* **SQL `JOIN`:** Performed inside the database query engine in a single round-trip using relational index matching.
* **Mongoose `populate()`:** Executes an initial query to fetch the parent documents, collects the referenced `ObjectId`s, and issues a secondary `$in` query to the related collection, assembling the documents in Node.js application memory.

### 4. MongoDB Aggregation Pipelines
GymFlow replaces SQL `GROUP BY` and `JOIN` with multi-stage pipelines:
```javascript
// Monthly Revenue Aggregation (dashboardController.js)
Payment.aggregate([
  { $match: { status: 'Completed', paymentDate: { $gte: sixMonthsAgo } } },
  {
    $group: {
      _id: { year: { $year: '$paymentDate' }, month: { $month: '$paymentDate' } },
      totalRevenue: { $sum: '$amount' },
      transactionCount: { $sum: 1 }
    }
  },
  { $sort: { '_id.year': 1, '_id.month': 1 } }
]);
```

### 5. Indexing & B-Trees
* **B-Tree Structure:** MongoDB indexes are balanced search trees. Without an index, lookups require a `COLLSCAN` (O(N)). With an index, lookups are `IXSCAN` (O(log N)).
* **Compound Unique Index:** `attendanceSchema.index({ member: 1, date: 1 }, { unique: true })`. This guarantees at the database storage engine level that a member can never have duplicate attendance on the same calendar day.

### 6. Atomic Operations & Concurrency Safety
* **Class Overbooking Prevention:**
  ```javascript
  // Uses atomic precondition check inside findOneAndUpdate
  const booked = await Class.findOneAndUpdate(
    { _id: classId, bookedCount: { $lt: classDoc.capacity } },
    { $inc: { bookedCount: 1 } },
    { new: true }
  );
  if (!booked) throw new Error('Class capacity reached');
  ```
* **Locker Double-Assignment Prevention:**
  `Locker.findOneAndUpdate({ _id, status: 'Available' }, { $set: { status: 'Allocated' } })`.

### 7. 5-Minute TTL (Time-To-Live) Index
* Created via: `checkInTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })`.
* **Important Viva Point:** MongoDB's background TTL thread runs every 60 seconds. Therefore, expired documents may persist in storage for up to 60 seconds after expiry. GymFlow implements strict server-side validation (`if (new Date() > token.expiresAt) reject`) to ensure immediate security while relying on the TTL index for zero-maintenance disk garbage collection.

### 8. SQL View Equivalent
* Endpoint: `GET /api/reports/monthly-revenue-view`.
* Mimics `CREATE VIEW monthly_revenue_view AS SELECT ... FROM payments GROUP BY ...` by returning a virtualized, read-only aggregation result without storing redundant physical records.

### 9. Multi-Document ACID Transactions
* Used in `authController.js` and `paymentController.js` via `mongoose.startSession()`, `session.startTransaction()`, and `session.abortTransaction()`.
* **Deployment Fallback:** Multi-document transactions require a MongoDB Replica Set. On standalone single-node deployments, GymFlow executes atomic sequential writes with comprehensive audit logging.

---

## 🎯 Faculty Demonstration Walkthrough

Follow this 5-minute flow during your lab examination:

1. **Phase 1 — Health & Database Engine Status:**
   * Open `http://localhost:5173`.
   * Point out the real-time Database Engine Indicator badge in the Admin Dashboard header (Connected host & status from `GET /api/health`).
2. **Phase 2 — Multi-Role Authentication:**
   * Click the top-bar role switcher or click **Sign Out**.
   * Use the demo badges to log in as **Admin**, **Trainer**, and **Member** to prove automatic role-based routing (`/admin/dashboard`, `/trainer/dashboard`, `/member/dashboard`).
3. **Phase 3 — Public Registration & Plan Selection:**
   * Log out -> Click **Register here**.
   * Complete the 3-step wizard:
     1. Enter personal details.
     2. Select a Membership Plan (loaded from MongoDB).
     3. Apply promo code `FITNESS10` (shows 10% instant discount).
     4. Click **Complete Demo Payment**.
   * Demonstrate that the new user is instantly redirected to their personal **Member Dashboard** with active membership and zero outstanding balance.
4. **Phase 4 — 5-Minute TTL QR Pass & Replay Rejection:**
   * In Member Dashboard, click **Generate Dynamic QR Pass**.
   * Show the live countdown timer. Copy the token string.
   * Switch to Admin -> Click **Attendance & QR** -> Paste token in scanner -> Click **Verify & Mark Attendance**.
   * Immediately submit the same token again: observe the database rejection: *"Security Alert: This QR token was already used at [time]"*.
5. **Phase 5 — DBMS Diagnostics & Index Catalog:**
   * In Admin sidebar, click **DBMS Diagnostics** (`/diagnostics`).
   * Show the live index catalog introspected across 11 collections (Compound unique indexes, TTL index, B-tree search keys).
   * Demonstrate the **SQL View Equivalent** tab comparing traditional SQL `CREATE VIEW` syntax with GymFlow's MongoDB aggregation pipeline.

---

## ⚠️ Known Limitations

1. **Multi-Document Transactions on Standalone MongoDB:** MongoDB strictly requires a Replica Set (`rs.initiate()`) to support `session.startTransaction()`. When running on single-node standalone instances, GymFlow uses atomic operations (`findOneAndUpdate` with `$inc` and `$set`) with compensating rollback logic.
2. **TTL Index Deletion Latency:** MongoDB's internal TTL reaper thread wakes up once every 60 seconds. GymFlow handles this by enforcing application-level timestamp comparisons so expired tokens are rejected at millisecond precision.
3. **Demo Payment Gateway:** The payment workflow simulates real gateway webhooks (Razorpay/Stripe) and records formal invoices without requiring live credit card processing.

---

**Developed for DBMS Lab Examination • Academic Year 2025–2026**
*GymFlow is fully connected, seeded, and verified for production demonstration.*
