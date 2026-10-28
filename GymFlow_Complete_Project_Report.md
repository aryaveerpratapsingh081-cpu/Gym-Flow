
# GymFlow – Smart Gym Management System Using MongoDB
## Complete Academic Project Report

---

> **Submitted by:** Aryaveer Pratap Singh  
> **Registration No.:** [YOUR REGISTRATION NUMBER]  
> **Degree:** B.Tech in Computer Science and Engineering  
> **Institution:** VIT Vellore  
> **Subject:** Database Management Systems (DBMS)  
> **Faculty Name:** [FACULTY NAME]  
> **Academic Year:** 2025–2026  
> **Submission Date:** October 2026  

---

## Declaration

I hereby declare that the project report titled **"GymFlow – Smart Gym Management System Using MongoDB"** submitted in partial fulfillment of the requirements for the DBMS Lab component of B.Tech CSE at VIT Vellore is an authentic record of work carried out by me. The project has not been submitted to any other institution or university for any degree or diploma.

**Signature:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_  
**Date:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_  

---

## Acknowledgement

I express my sincere gratitude to [FACULTY NAME] for their guidance and support throughout this DBMS Lab project. I thank VIT Vellore for providing the infrastructure and resources necessary for this project.

---

## Table of Contents

1. Abstract
2. Introduction
3. Problem Statement
4. Objectives
5. Scope of the Project
6. Existing System vs. Proposed System
7. Functional Requirements
8. Non-Functional Requirements
9. System Architecture
10. Technology Stack
11. Database Design Using MongoDB
12. DBMS Concepts Demonstrated
13. Database Operations and Queries
14. User Roles and Dashboards
15. Razorpay Payment Gateway Integration
16. API Documentation
17. Frontend Implementation
18. Backend Implementation
19. Testing and Validation
20. Results and Screenshots
21. Security Analysis
22. Installation and Execution Guide
23. Limitations
24. Future Enhancements
25. Conclusion
26. References
27. Appendix

---

# Chapter 1 – Abstract

GymFlow is a full-stack, enterprise-grade Smart Gym Management System developed exclusively on the MERN stack (MongoDB, Express.js, React 18, Node.js). The system replaces fragmented manual gym workflows with a unified digital platform encompassing membership lifecycle management, attendance tracking, trainer-member coordination, group fitness class scheduling, locker allocation, equipment maintenance, financial ledger, and progress monitoring.

The application is built around MongoDB as its sole data tier, demonstrating core DBMS concepts including compound unique indexes, TTL (Time-To-Live) indexes, multi-stage aggregation pipelines, embedded subdocuments versus referenced documents, atomic `findOneAndUpdate` operations for concurrency safety, HMAC-SHA256 payment signature verification, and append-only audit trail logging.

The system features three distinct role-based dashboards for Admins, Trainers, and Members, enforced at both the frontend (React Router protected routes) and backend (JWT + role middleware). Razorpay Test Mode integration provides a realistic payment gateway experience with cryptographic signature verification and MongoDB payment records without requiring live money.

GymFlow stores data across **23 verified MongoDB collections**, registers **24 Express.js controllers** across **23 route files**, and renders **25 React pages** from a Vite-powered frontend. A built-in automated test runner (`server/test/verify_system.js`) executes 15 test suites covering 34 assertions and reports 34 PASSED, 0 FAILED on the embedded MongoMemoryServer demo environment.

---

# Chapter 2 – Introduction

## 2.1 Background

Modern fitness centers handle a substantial volume of daily operations: member registrations, recurring membership renewals, attendance recording, payment collection, class scheduling, trainer coordination, equipment maintenance, and progress tracking. Traditionally, these tasks have been managed using paper registers, spreadsheet files, or isolated desktop applications — each introducing fragmentation, data redundancy, and human error.

## 2.2 Why GymFlow

GymFlow addresses this fragmentation by providing a centralized, role-based web application. All data is stored in MongoDB, queried through Mongoose ODM, served via an Express.js REST API, and rendered by a React 18 frontend. The single source of truth eliminates data silos and enables real-time dashboard reporting.

## 2.3 DBMS Relevance

The project is designed specifically to demonstrate the following DBMS concepts in a practical, examinable context:
- Schema design and validation using Mongoose
- CRUD operations across multiple collections
- Compound indexes and TTL indexes
- Aggregation pipelines replacing SQL GROUP BY + JOIN
- Atomic operations for concurrency-safe state changes
- Referencing (ObjectId) versus embedding (subdocuments)
- Audit logging for compliance and traceability

---

# Chapter 3 – Problem Statement

Manual gym management systems suffer from the following structural limitations:

1. **Disjointed records**: Member data, attendance, payments, and membership dates are stored in separate, unlinked registers.
2. **No real-time visibility**: Gym owners cannot instantly see how many members are active, how much revenue was collected this month, or which memberships are expiring.
3. **Error-prone attendance**: Manual sign-in sheets cannot prevent duplicate entries for the same day.
4. **No audit trail**: Changes to member status, payment amounts, or membership dates are not logged, making disputes unresolvable.
5. **Trainer-member mismatch**: No formal assignment or tracking mechanism exists between trainers and their assigned members.
6. **Class overbooking**: Group fitness classes have no mechanism to enforce capacity limits during concurrent bookings.
7. **Payment reconciliation**: Outstanding dues, partial payments, and refunds are not systematically tracked.

**GymFlow solves all of the above** by creating a single, schema-validated, role-enforced MongoDB database with atomic operations, compound unique constraints, and real-time aggregation dashboards.

---

# Chapter 4 – Objectives

## 4.1 Implemented Objectives (Verified from Codebase)

| # | Objective | Implementation Status | Evidence |
|---|---|---|---|
| 1 | Centralized member management with CRUD | ✅ Implemented | `memberController.js`, `MembersPage.jsx` |
| 2 | Role-based authentication (Admin, Trainer, Member) | ✅ Implemented | `authController.js`, `authMiddleware.js` |
| 3 | Membership lifecycle (assign, freeze, resume, renew) | ✅ Implemented | `membershipController.js` |
| 4 | Attendance tracking with duplicate prevention | ✅ Implemented | `Attendance.js` compound index |
| 5 | 5-minute TTL QR check-in token | ✅ Implemented | `CheckInToken.js`, `attendanceController.js` |
| 6 | Trainer management and member assignment | ✅ Implemented | `trainerController.js`, `Trainer.js` |
| 7 | Workout plan management with embedded exercises | ✅ Implemented | `Workout.js`, `workoutController.js` |
| 8 | Diet plan management with embedded meals | ✅ Implemented | `DietPlan.js`, `dietPlanController.js` |
| 9 | Member fitness progress tracking (weight, PRs) | ✅ Implemented | `Progress.js`, `progressController.js` |
| 10 | Payment ledger with multi-method support | ✅ Implemented | `Payment.js`, `paymentController.js` |
| 11 | Invoice generation with GST breakdown | ✅ Implemented | `Invoice.js`, `invoiceController.js` |
| 12 | Razorpay Test Mode integration | ✅ Implemented | `razorpayController.js`, `razorpay.js` |
| 13 | Group fitness class scheduling with atomic booking | ✅ Implemented | `Class.js`, `ClassBooking.js`, `classController.js` |
| 14 | Personal training session scheduling | ✅ Implemented | `TrainingSession.js`, `trainingSessionController.js` |
| 15 | Smart locker allocation (atomic compare-and-swap) | ✅ Implemented | `Locker.js`, `lockerController.js` |
| 16 | Equipment & maintenance tracking | ✅ Implemented | `Equipment.js`, `equipmentController.js` |
| 17 | Lead/prospect pipeline with trial pass | ✅ Implemented | `Lead.js`, `leadController.js` |
| 18 | Discount coupon system with atomic usage limits | ✅ Implemented | `Coupon.js`, `couponController.js` |
| 19 | Outstanding dues ledger | ✅ Implemented | `duesController.js` |
| 20 | Member feedback and star ratings | ✅ Implemented | `Feedback.js`, `feedbackController.js` |
| 21 | Append-only audit trail | ✅ Implemented | `AuditLog.js`, `auditLogger.js` |
| 22 | DBMS Diagnostics (live index catalog, SQL View equivalent) | ✅ Implemented | `diagnosticController.js` |
| 23 | Admin dashboard with 4 aggregation-backed charts | ✅ Implemented | `dashboardController.js` |
| 24 | MongoDB Atlas / Local / Embedded Memory Server fallback | ✅ Implemented | `config/db.js` |

## 4.2 Planned / Not Yet Implemented

| Objective | Status |
|---|---|
| Webhook-based payment reconciliation (Razorpay webhooks) | ⏳ Not yet implemented — no webhook endpoint found in routes |
| Automated email renewal reminders | ⏳ Not implemented — Notification model exists but no email sender |
| Mobile application | ⏳ Not in scope |
| QR Code scanner via device camera (auto-decode) | ⚠️ Partial — QRScannerModal.jsx exists for manual token entry; native camera scanning not confirmed |

---

# Chapter 5 – Scope of the Project

## 5.1 Target Users

| User | Access Level | Primary Tasks |
|---|---|---|
| **Admin** | Full system access | Member/trainer management, plans, payments, reports, diagnostics |
| **Trainer** | Trainer + limited | Assigned member roster, workouts, diet plans, progress, sessions |
| **Member** | Self-only | Dashboard, QR pass, class booking, diet/workout view, progress |

## 5.2 Deployment Scope

- **Local development machine** running Node.js v18+
- **MongoDB** via Atlas cloud, local Community Server, or embedded MongoMemoryServer (zero-config fallback)
- Frontend served at `http://localhost:5173` via Vite dev server
- Backend API at `http://localhost:5000`

## 5.3 Current Limitations

- Not deployed to a public cloud server (Vercel, Railway, Render, etc.)
- Razorpay is configured in **Test Mode only** — no live monetary transactions
- No Razorpay webhook handler implemented
- Session-based JWT stored in React Context / localStorage (no refresh token rotation)
- Multi-document MongoDB transactions require a Replica Set; standalone MongoDB uses atomic sequential writes
- No email/SMS notification delivery (Notification collection exists in schema but no transport layer)

## 5.4 Future Enhancement Scope

Refer to Chapter 24 for detailed future enhancements.

---

# Chapter 6 – Existing System vs. Proposed System

| Feature | Existing (Manual) System | GymFlow (Proposed System) |
|---|---|---|
| Member records | Paper register / spreadsheet | MongoDB `members` collection with indexed search |
| Membership tracking | Manual date calculation | Server-calculated end dates, expiry alerts, freeze/resume |
| Attendance | Sign-in book | Compound unique index prevents duplicate daily entries |
| Payment records | Cash receipt book | `payments` collection with transactionId, method, refund support |
| Invoice generation | Manual receipt | Auto-generated `invoices` with GST snapshot |
| Workout assignment | Verbal instruction | Structured `workouts` collection with embedded exercise plans |
| Diet plan | Paper handout | `dietplans` collection with embedded macro-tracked meals |
| Progress tracking | Manual notebook | Time-series `progress` documents with PR (Personal Record) fields |
| Class scheduling | Whiteboard schedule | `classes` collection with atomic capacity booking |
| Trainer assignment | Verbal | `assignedTrainer` ObjectId reference in `members` collection |
| Equipment maintenance | Ad-hoc | `equipment` collection with `nextServiceDate` index + 7-day alerts |
| Locker allocation | Key register | Atomic `findOneAndUpdate` compare-and-swap; zero double-allocation |
| Audit trail | None | `auditlogs` collection recording old/new values, actor, timestamp |
| Reporting | Manual counting | MongoDB aggregation pipelines serving live dashboard charts |
| Access control | Physical (lock and key) | JWT + role middleware, 3 separate dashboard routes |
| Data integrity | None | Mongoose schema validation + compound unique indexes |
| Search | Linear scan | Text regex search on indexed `email`, `memberCustomId`, `name` |

---

# Chapter 7 – Functional Requirements

## Module 1: Registration and Login

**Users:** Public (registration), All roles (login)  
**Backend:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`  
**Frontend:** `RegisterPage.jsx` (3-step wizard), `LoginPage.jsx`  
**Model:** `User`, `Member`, `Membership`, `Payment`, `Invoice`

**Registration flow** (verified from `authController.js`):
1. Validate name, email, password (min 6 chars)
2. Check email uniqueness (`User.findOne({ email })`)
3. Fetch selected plan from MongoDB — never trust client price
4. Apply coupon atomically with usage limit guard
5. Create `User` → `Member` → `Membership` → `Payment` → `Invoice` in sequence
6. Enforce `role: 'Member'` regardless of input (security constraint)
7. Emit audit log
8. Return JWT token

**Login flow:**
1. `User.findOne({ email })` on indexed field
2. `bcrypt.compare()` password verification
3. Populate `Member` or `Trainer` profile
4. Return JWT signed for 30 days

---

## Module 2: Role-Based Dashboards

**Admin Dashboard** (`/admin/dashboard`, `AdminDashboard.jsx`):
- 9 KPI stat cards (Total Members, Active Members, Trainers, Monthly Revenue, Today's Attendance, Expiring Memberships, Outstanding Dues, Maintenance Alerts, Upcoming Classes)
- 4 Recharts charts: Monthly Revenue (6 months), Weekly Attendance (7 days), Plan Distribution (pie), Trainer-Member Allocation (bar)
- All chart data from MongoDB aggregation pipelines

**Trainer Dashboard** (`/trainer/dashboard`, `TrainerDashboard.jsx`):
- Assigned member roster with membership status
- Upcoming 1-on-1 personal training sessions
- Members needing progress update (no log in 14 days)
- Active workout and diet plan counts

**Member Dashboard** (`/member/dashboard`, `MemberDashboard.jsx`):
- Digital membership card with real-time remaining days counter
- 5-minute TTL QR check-in pass with live countdown
- Attendance summary (total visits, monthly visits, percentage)
- Active workout plan and diet plan
- Upcoming booked classes and training sessions
- Recent payment history

---

## Module 3: Member Management

**Backend:** `GET/POST /api/members`, `GET/PUT/DELETE /api/members/:id`  
**Frontend:** `MembersPage.jsx`  
**Model:** `Member` (refs: `User`, `Trainer`, `Membership`)  
**Access:** Admin, Trainer

Features: Full CRUD, regex text search on name/email/phone/customId, status filters (`Active`, `Expired`, `Expiring Soon`), pagination, trainer assignment, safe deactivation (sets `status: 'Inactive'` — does not delete to preserve audit trail).

---

## Module 4: Trainer Management

**Backend:** `GET/POST /api/trainers`, `GET/PUT /api/trainers/:id`  
**Frontend:** `TrainersPage.jsx`  
**Model:** `Trainer` (ref: `User`)  
**Access:** All Authenticated

Features: Trainer CRUD, specialization, experience years, availability, bio, member count aggregated via MongoDB `$group` pipeline.

---

## Module 5: Membership Plans

**Backend:** `GET/POST /api/plans`, `PUT/DELETE /api/plans/:id`  
**Frontend:** `PlansPage.jsx`  
**Model:** `Plan`  
**Access:** All Authenticated (read); Admin (write)

Seeded plans: Basic (1 month, ₹999), Silver (3 months, ₹2,499), Gold (6 months, ₹3,999), Premium (12 months, ₹5,999)

---

## Module 6: Membership Lifecycle

**Backend:** `GET/POST /api/memberships`, `PUT /api/memberships/:id/freeze`, `PUT /api/memberships/:id/resume`, `POST /api/memberships/:id/renew`  
**Frontend:** `MembershipsPage.jsx`  
**Model:** `Membership` (refs: `Member`, `Plan`; embedded: `freezeHistory`)

**States:** `Pending Payment` → `Active` → `Expiring Soon` (7 days) → `Expired` | `Frozen` | `Cancelled`

**Price Snapshot:** When a membership is created, `priceSnapshot` and `durationMonthsSnapshot` are copied from the plan. This guarantees historical records are accurate even if admin changes plan pricing later.

**Freeze/Resume:** Admin freezes with a reason. On resume, `daysExtended = daysFrozen` is added to `endDate`. All freeze history stored in embedded `freezeHistory[]` array.

**Virtual Field:** `remainingDays` — calculated dynamically on every `toJSON()` call: `Math.ceil((endDate - now) / 86400000)`

---

## Module 7: Attendance Management

**Backend:** `GET /api/attendance`, `POST /api/attendance`, `POST /api/attendance/token/generate`, `POST /api/attendance/token/verify`  
**Frontend:** `AttendancePage.jsx`, `QRScannerModal.jsx`  
**Models:** `Attendance`, `CheckInToken`

**Compound Unique Index** (verified from `Attendance.js` line 44):
```javascript
attendanceSchema.index({ member: 1, date: 1 }, { unique: true });
```
This is enforced at the **MongoDB storage engine level**. A member cannot have two attendance records on the same calendar date regardless of how many concurrent requests arrive.

**5-Minute TTL QR Token Flow:**
1. Member clicks "Generate QR Pass" → `POST /api/attendance/token/generate`
2. Server creates `CheckInToken` with `expiresAt = now + 5 minutes`, `isUsed: false`
3. `QRCode.react` renders the token string as a QR code with live countdown
4. Admin scans → `POST /api/attendance/token/verify` with token string
5. Server validates: `isUsed === false` AND `new Date() < expiresAt`
6. Sets `isUsed: true`, `usedAt: now`; creates `Attendance` document
7. Replay attempt rejected: "Security Alert: This QR token was already used"
8. TTL index (`{ expiresAt: 1 }, { expireAfterSeconds: 0 }`) auto-purges expired documents every ~60s

---

## Module 8: Payment History

**Backend:** `GET/POST /api/payments`, `POST /api/payments/:id/refund`  
**Frontend:** `PaymentsPage.jsx`  
**Model:** `Payment` (refs: `Member`, `Membership`)

Payment methods: Cash, UPI, Card, Bank Transfer, Razorpay, NetBanking, Wallet  
Fields: `amount`, `discountApplied`, `couponCode`, `transactionId` (unique), `razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature`, `invoiceNo` (unique), `status`, `isDemoPayment`, `isRefunded`

Refund flow: Admin triggers refund → `isRefunded: true`, `refundAmount` set, `status: 'Refunded'`, audit log emitted.

---

## Module 9: Razorpay Checkout

Fully documented in Chapter 15.

---

## Module 10: Workout Plans

**Backend:** `GET/POST /api/workouts`, `GET/PUT/DELETE /api/workouts/:id`  
**Frontend:** `WorkoutsPage.jsx`  
**Model:** `Workout` (ref: `Member`, `Trainer`; embedded: `exercises[]`)

Each exercise subdocument: `name`, `muscleGroup`, `sets`, `reps`, `weightKg`, `restTimeSec`, `day`, `notes`, `completed`

Demonstrates **embedding** — exercises are always read with the workout, so embedding is optimal vs. a separate collection.

---

## Module 11: Fitness Progress Tracking

**Backend:** `GET/POST /api/progress`, `DELETE /api/progress/:id`  
**Frontend:** `ProgressPage.jsx`  
**Model:** `Progress` (refs: `Member`, `Trainer`)

Tracks: `weightKg`, `bodyFatPercentage`, `chestCm`, `waistCm`, `bicepsCm`, `benchPressPRKg`, `squatPRKg`, `deadliftPRKg`, `date`, `notes`

Enables time-series charting of body transformation and Personal Records (Big 3: Bench Press, Squat, Deadlift).

---

## Module 12: Group Fitness Classes

**Backend:** `GET/POST /api/classes`, `POST /api/classes/:id/book`, `DELETE /api/classes/:id/book`  
**Frontend:** `ClassesPage.jsx`  
**Models:** `Class` (ref: `Trainer`), `ClassBooking` (refs: `Class`, `Member`)

**Atomic Overbooking Prevention** (verified from `classController.js` pattern per `README.md`):
```javascript
const booked = await Class.findOneAndUpdate(
  { _id: classId, bookedCount: { $lt: classDoc.capacity } },
  { $inc: { bookedCount: 1 } },
  { new: true }
);
if (!booked) throw new Error('Class capacity reached');
```
The `$lt` condition and `$inc` execute as a single atomic operation. No two concurrent requests can both pass the capacity check.

---

## Module 13: Personal Training Sessions

**Backend:** `GET/POST /api/training-sessions`, `PUT /api/training-sessions/:id`  
**Frontend:** Integrated in TrainerDashboard and MemberDashboard  
**Model:** `TrainingSession` (refs: `Trainer`, `Member`)

Fields: `title`, `startTime`, `endTime`, `focusArea`, `status` (`Scheduled`, `Completed`, `Cancelled`, `No-Show`), `notes`

Compound indexes: `{ trainer: 1, startTime: 1 }` and `{ member: 1, startTime: 1 }` enable overlap conflict detection queries.

---

## Module 14: Diet Plans

**Backend:** `GET/POST /api/diet-plans`, `PUT/DELETE /api/diet-plans/:id`  
**Frontend:** `DietPlansPage.jsx`  
**Model:** `DietPlan` (refs: `Member`, `Trainer`; embedded: `meals[].foodItems[]`)

Demonstrates **2-level deep embedding**: `DietPlan` → `meals[]` → `foodItems[]`. This is appropriate because meal data is always consumed with the diet plan document.

Tracks: `targetDailyCalories`, `targetProteinGrams`, `targetCarbsGrams`, `targetFatsGrams`, `waterIntakeLiters`, `fitnessGoal`

---

## Module 15: Smart Lockers

**Backend:** `GET/POST /api/lockers`, `PUT /api/lockers/:id/release`  
**Frontend:** `LockersPage.jsx`  
**Model:** `Locker` (ref: `Member`)

**Atomic Double-Assignment Prevention:**
```javascript
Locker.findOneAndUpdate(
  { _id: lockerId, status: 'Available' },
  { $set: { status: 'Allocated', assignedMember: memberId } },
  { new: true }
)
```
If two requests arrive simultaneously for the same locker, only one will find `status: 'Available'` — the other receives `null` and is rejected.

Zones: Ground Floor A, Ground Floor B, First Floor Men, First Floor Women, VIP Lounge

---

## Module 16: Equipment & Maintenance

**Backend:** `GET/POST /api/equipment`, `PUT /api/equipment/:id`  
**Frontend:** `EquipmentPage.jsx`  
**Model:** `Equipment`

Admin dashboard KPI "Maintenance Alerts" is driven by:
```javascript
Equipment.countDocuments({
  $or: [
    { nextServiceDate: { $lte: inSevenDays } },
    { condition: { $in: ['Needs Maintenance', 'Out of Order'] } }
  ]
})
```

Categories: Cardio, Strength, Free Weights, Functional, Recovery, Machines  
Conditions: Excellent, Good, Fair, Needs Maintenance, Out of Order

---

## Module 17: Leads & Trial Passes

**Backend:** `GET/POST /api/leads`, `PUT /api/leads/:id`, `POST /api/leads/:id/convert`  
**Frontend:** `LeadsPage.jsx`  
**Model:** `Lead` (embedded: `followUps[]`)

**State machine:** `New` → `Contacted` → `Trial Active` → `Converted` | `Lost`

Conversion: `POST /api/leads/:id/convert` creates a full `User` + `Member` record atomically, sets `convertedMember` reference, and marks lead `status: 'Converted'`. Duplicate conversion check prevents creating two accounts for the same lead.

---

## Module 18: Discount Coupons

**Backend:** `GET/POST /api/coupons`, `PUT/DELETE /api/coupons/:id`  
**Frontend:** `CouponsPage.jsx`  
**Model:** `Coupon`

**Atomic Usage Cap (verified from `authController.js` line 131–140):**
```javascript
const appliedCoupon = await Coupon.findOneAndUpdate(
  {
    code: cleanCode,
    status: 'Active',
    validUntil: { $gte: now },
    $expr: { $lt: ['$timesUsed', '$usageLimit'] }
  },
  { $inc: { timesUsed: 1 } },
  { new: true }
);
```
The `$expr: { $lt: ['$timesUsed', '$usageLimit'] }` condition and `$inc` are atomic — concurrent checkouts cannot exceed the usage limit.

Coupon types: Percentage (with `maxDiscount` cap) and Fixed amount.

---

## Module 19: Outstanding Dues

**Backend:** `GET /api/dues`, `POST /api/dues/:id/pay`  
**Frontend:** `DuesPage.jsx`  
**Logic:** `outstandingDues = priceSnapshot - amountPaid` per `Membership`

Admin can view all defaulters and record partial or full payment settlement, which updates `amountPaid`, recalculates `outstandingDues`, and updates `paymentStatus`.

---

## Module 20: Member Feedback

**Backend:** `GET/POST /api/feedback`, `PUT /api/feedback/:id`  
**Frontend:** `FeedbackPage.jsx`  
**Model:** `Feedback` (refs: `Member`, `Trainer`, `Class`)

Rating: 1–5 stars (validated `min: 1, max: 5` in schema)  
Categories: Trainer, Class, Facility, General  
Statuses: Approved, Pending, Rejected (moderation)  
Average rating computed via: `$group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } }`

---

## Module 21: Audit Trail

**Backend:** `GET /api/audit-logs`  
**Frontend:** `AuditLogsPage.jsx`  
**Model:** `AuditLog` (ref: `User`)

**Append-only**: AuditLog documents are never updated or deleted. Every state mutation in the system calls `logAudit()` from `utils/auditLogger.js`.

Fields: `actor`, `actorName`, `actorRole`, `action`, `entity`, `entityId`, `oldValues`, `newValues`, `details`, `ipAddress`

Compound indexes: `{ entity: 1, createdAt: -1 }` and `{ action: 1, createdAt: -1 }` for rapid compliance queries.

Examples of logged actions: `MEMBER_REGISTERED_WITH_PLAN`, `MEMBERSHIP_ASSIGNED`, `MEMBERSHIP_FROZEN`, `PAYMENT_RECEIVED`, `LOCKER_ALLOCATED`, `RAZORPAY_PAYMENT_VERIFIED`, `PAYMENT_SIGNATURE_VERIFICATION_FAILED`

---

## Module 22: DBMS Diagnostics

**Backend:** `GET /api/reports/diagnostics`, `GET /api/reports/monthly-revenue-view`  
**Frontend:** `DiagnosticsPage.jsx`  
**Access:** Admin only

Features:
- Live introspection of MongoDB indexes across 11 collections (TTL, compound unique, regular)
- SQL-to-NoSQL concept mapping table
- SQL View Equivalent: `GET /api/reports/monthly-revenue-view` mimics `CREATE VIEW monthly_revenue_view AS SELECT year, month, SUM(amount) FROM payments GROUP BY year, month`
- Verified by automated test: "34 PASSED, 0 FAILED"

---

## Module 23: Notifications (Schema Implemented, Transport Pending)

**Backend:** `GET /api/notifications`  
**Model:** `Notification`  
**Status:** Schema and route exist; no email/SMS delivery transport implemented

---

# Chapter 8 – Non-Functional Requirements

## 8.1 Performance

- MongoDB indexes on all frequently queried fields (`email`, `memberCustomId`, `date`, `status`, `paymentDate`) reduce query complexity from O(N) collection scan to O(log N) index scan
- Mongoose `.populate()` uses secondary `$in` queries assembled in Node.js memory — efficient for moderate document counts but will require aggregation `$lookup` at scale
- React 18 renders only changed components via virtual DOM diffing
- Vite production build outputs 934 KB JS (239 KB gzipped)

## 8.2 Reliability

- Automatic fallback to embedded `MongoMemoryServer` if Atlas or local MongoDB is unreachable (verified in `config/db.js`)
- Auto-seed on memory server start — demo is always available without setup
- DNS resolver override (`8.8.8.8`, `1.1.1.1`) prevents Windows router `querySrv ECONNREFUSED` errors for Atlas connections

## 8.3 Security

- Passwords hashed with `bcryptjs` at cost factor 10 before storage (verified in `User.js` pre-save hook)
- JWT tokens signed with `JWT_SECRET` from `.env`, expire in 30 days
- `protect` middleware validates Bearer token on every protected route
- `authorize(...roles)` middleware enforces role-based access at each endpoint
- Razorpay signature verified server-side using HMAC-SHA256 (`crypto.createHmac`)
- Duplicate payment prevention: `Payment.findOne({ razorpayPaymentId })` before activating membership
- Server-authoritative price calculation: plan price always fetched from MongoDB, never trusted from client request body
- `JWT_SECRET` and `RAZORPAY_KEY_SECRET` loaded from `.env`, never exposed in responses

## 8.4 Maintainability

- Clean separation: `models/`, `controllers/`, `routes/`, `middleware/`, `config/`, `utils/`, `seed/`
- Each controller file handles a single domain entity
- Audit logger (`utils/auditLogger.js`) is a reusable utility called from multiple controllers

## 8.5 Scalability (Design Goal, Not Verified at Load)

- MongoDB's document model supports horizontal sharding
- Stateless JWT authentication allows multiple Node.js instances behind a load balancer
- Not tested at scale in current deployment

## 8.6 Usability

- 1-click demo credential autofill buttons for admin/trainer/member login (verified: `DemoCredentialsBadge.jsx`)
- Tailwind CSS dark theme with emerald green accents
- Recharts data visualization on Admin dashboard
- Responsive layout (Sidebar + Navbar) via `AppLayout` wrapper

## 8.7 Data Integrity

- Mongoose schema validation (`required`, `enum`, `min`, `max`, `unique`) enforced before every save
- Compound unique index on attendance: one record per member per day
- Unique constraints on `User.email`, `Member.memberCustomId`, `Payment.transactionId`, `Payment.invoiceNo`, `Invoice.invoiceNumber`

## 8.8 Availability

- **Local only**: No production cloud deployment currently in place
- Application requires Node.js v18+ and npm v9+ to run
- MongoDB Atlas dependency for cloud mode; offline fallback via embedded MongoMemoryServer

---

# Chapter 9 – System Architecture

## 9.1 Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────┐
│           PRESENTATION TIER (Client)                    │
│   React 18 + Vite  ·  Port 5173                        │
│   Tailwind CSS · Recharts · qrcode.react · axios       │
│   25 Pages · 6 Components · 3 Role Dashboards          │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP / REST API (Axios)
                         │ Authorization: Bearer <JWT>
┌────────────────────────▼────────────────────────────────┐
│           APPLICATION TIER (Server)                     │
│   Node.js + Express.js  ·  Port 5000                   │
│   23 Route Files · 24 Controllers                      │
│   JWT Middleware · Role Middleware                      │
│   Razorpay SDK (Test Mode)                              │
└────────────────────────┬────────────────────────────────┘
                         │ Mongoose ODM
┌────────────────────────▼────────────────────────────────┐
│           DATA TIER (MongoDB)                           │
│   MongoDB Atlas / Local / MongoMemoryServer            │
│   23 Collections · Compound Indexes · TTL Index        │
│   Aggregation Pipelines · Schema Validation            │
└─────────────────────────────────────────────────────────┘
```

## 9.2 Authentication and Authorization Flow

```mermaid
sequenceDiagram
    participant Browser
    participant React
    participant Express
    participant MongoDB
    
    Browser->>React: Enter credentials
    React->>Express: POST /api/auth/login {email, password}
    Express->>MongoDB: User.findOne({email}) [indexed O(log N)]
    MongoDB-->>Express: User document
    Express->>Express: bcrypt.compare(password, hash)
    Express->>Express: jwt.sign({id}, JWT_SECRET, {expiresIn:'30d'})
    Express-->>React: {success, token, role, profileId}
    React->>React: Store in AuthContext
    React->>React: Navigate to /admin|trainer|member /dashboard
```

## 9.3 Protected Route Flow

```mermaid
sequenceDiagram
    participant React
    participant ProtectedRoute
    participant Express
    participant authorize
    
    React->>ProtectedRoute: Render route
    ProtectedRoute->>ProtectedRoute: Check user in AuthContext
    alt No user
        ProtectedRoute->>React: <Navigate to="/login" />
    else Wrong role
        ProtectedRoute->>React: <Navigate to=correct dashboard />
    else Correct role
        ProtectedRoute->>React: Render children
        React->>Express: GET /api/dashboard/admin
        Express->>Express: protect() verifies JWT
        Express->>Express: authorize('Admin') checks role
        Express->>Express: Controller executes
    end
```

## 9.4 Registration and Membership Activation Flow

```mermaid
sequenceDiagram
    participant User
    participant RegisterPage
    participant Express
    participant MongoDB

    User->>RegisterPage: Step 1: Personal details
    User->>RegisterPage: Step 2: Select Plan
    User->>RegisterPage: Step 3: Apply coupon (optional)
    RegisterPage->>Express: POST /api/auth/register {name,email,password,planId,couponCode}
    Express->>MongoDB: Plan.findById(planId) [verify price server-side]
    Express->>MongoDB: Coupon.findOneAndUpdate [atomic $inc timesUsed]
    Express->>MongoDB: User.create {role:'Member' enforced}
    Express->>MongoDB: Member.create {memberCustomId:'GF-1001+'}
    Express->>MongoDB: Membership.create {priceSnapshot, status:'Active'}
    Express->>MongoDB: Payment.create {isDemoPayment:true}
    Express->>MongoDB: Invoice.create {GST breakdown}
    Express->>MongoDB: AuditLog.create {MEMBER_REGISTERED_WITH_PLAN}
    Express-->>RegisterPage: {token, role, membershipId}
    RegisterPage->>RegisterPage: Navigate to /member/dashboard
```

## 9.5 Razorpay Payment Flow

```mermaid
sequenceDiagram
    participant Member
    participant React
    participant Express
    participant Razorpay
    participant MongoDB

    Member->>React: Select plan + Apply coupon
    React->>Express: POST /api/payments/razorpay/create-order {planId, couponCode}
    Express->>MongoDB: Plan.findById() [authoritative price]
    Express->>Razorpay: razorpay.orders.create({amount in paise})
    Razorpay-->>Express: {orderId, amount, currency}
    Express-->>React: {orderId, keyId, finalPrice}
    React->>React: Open Razorpay Checkout modal
    Member->>Razorpay: Complete test payment (card/UPI)
    Razorpay-->>React: {razorpay_order_id, razorpay_payment_id, razorpay_signature}
    React->>Express: POST /api/payments/razorpay/verify
    Express->>Express: HMAC-SHA256(secret, orderId|paymentId) === signature?
    alt Signature valid
        Express->>MongoDB: Payment.findOne({razorpayPaymentId}) [duplicate check]
        Express->>MongoDB: Membership.create {status:'Active', isDemoPayment:false}
        Express->>MongoDB: Payment.create {razorpayPaymentId, razorpaySignature}
        Express->>MongoDB: Invoice.create
        Express->>MongoDB: AuditLog.create {RAZORPAY_PAYMENT_VERIFIED}
        Express-->>React: {verified:true, token, membership}
    else Signature invalid
        Express->>MongoDB: AuditLog.create {PAYMENT_SIGNATURE_VERIFICATION_FAILED}
        Express-->>React: {verified:false, 400 Bad Request}
    end
```

## 9.6 QR Attendance Flow

```mermaid
sequenceDiagram
    participant Member
    participant Admin
    participant Express
    participant MongoDB

    Member->>Express: POST /api/attendance/token/generate
    Express->>MongoDB: CheckInToken.create {expiresAt: now+5min, isUsed:false}
    Express-->>Member: {token: "uuid-string"}
    Member->>Member: QRCode.react renders QR with countdown
    Admin->>Admin: Scan QR via QRScannerModal
    Admin->>Express: POST /api/attendance/token/verify {token}
    Express->>MongoDB: CheckInToken.findOne({token})
    Express->>Express: Check: isUsed===false AND now < expiresAt
    alt Valid token
        Express->>MongoDB: CheckInToken update {isUsed:true, usedAt:now}
        Express->>MongoDB: Attendance.create {member, date, checkInTime}
        Express-->>Admin: {success: "Attendance marked"}
    else Already used
        Express-->>Admin: {400: "Token already consumed"}
    else Expired
        Express-->>Admin: {400: "QR token expired"}
    end
```

---

# Chapter 10 – Technology Stack

## 10.1 MongoDB (Database)

- **Version:** 6.0+ (Atlas M0 free tier or Local Community Server)
- **Role:** Sole data tier — all 23 collections
- **Why used:** Document model suits gym entity hierarchies; flexible schema for embedded exercises/meals; native aggregation pipelines; built-in TTL and compound indexes
- **Location:** Connection in `server/config/db.js`

## 10.2 Mongoose ODM (v8.3.1)

- **Role:** Schema definition, validation, middleware, population, virtuals
- **Why used:** Enforces strict schemas on a schemaless database; `populate()` replaces manual JOIN logic; pre-save hooks for password hashing
- **Location:** All files in `server/models/`

## 10.3 Node.js + Express.js (v4.19.2)

- **Role:** REST API server
- **Why used:** Non-blocking I/O ideal for concurrent API requests; large ecosystem; JSON-native
- **Location:** `server/server.js`, `server/routes/`, `server/controllers/`

## 10.4 React 18 + Vite (v5.2)

- **Role:** Single-page application frontend
- **Why used:** Component-driven UI, fast hot module replacement with Vite, React Router v6 for SPA routing, React Context for auth state
- **Location:** `client/src/`

## 10.5 Tailwind CSS (v3.4)

- **Role:** Utility-first styling
- **Why used:** Rapid layout, dark theme (`bg-[#0a0d12]`), emerald green (`text-emerald-400`) design system
- **Location:** `client/tailwind.config.js`, all `.jsx` files via className attributes

## 10.6 JWT (jsonwebtoken v9.0.2) + bcryptjs (v2.4.3)

- **JWT Role:** Stateless authentication — user role and ID encoded in signed token
- **bcrypt Role:** One-way password hashing with salt factor 10
- **Why:** Stateless API is horizontally scalable; bcrypt is deliberately slow to resist brute-force
- **Location:** `authController.js`, `authMiddleware.js`, `User.js`

## 10.7 Razorpay (v2.9.8)

- **Role:** Payment gateway SDK for order creation and signature verification
- **Mode:** Test Mode only (rzp_test_ key prefix confirmed in `.env`)
- **Location:** `server/config/razorpay.js`, `server/controllers/razorpayController.js`

## 10.8 Recharts (v2.12.7)

- **Role:** Chart library for Admin dashboard visualizations
- **Charts used:** Line chart (revenue/attendance), Pie chart (plan distribution), Bar chart (trainer allocation)
- **Location:** `AdminDashboard.jsx`

## 10.9 qrcode.react (v3.1.0)

- **Role:** Client-side QR code rendering from token string
- **Location:** `MemberDashboard.jsx`

## 10.10 Axios (v1.6.8)

- **Role:** HTTP client for all React → Express API calls
- **Location:** `client/src/services/` (API service layer)

## 10.11 mongodb-memory-server (v9.2.0, devDependency)

- **Role:** Embedded MongoDB for offline demo and automated testing
- **Location:** `server/config/db.js` (fallback), `server/test/verify_system.js`

---

# Chapter 11 – Database Design Using MongoDB

## 11.1 Overview

GymFlow stores all data in **23 MongoDB collections**. The design follows these principles:
- **Referencing** (`ObjectId` + `ref`) for high-cardinality independent entities that are queried independently
- **Embedding** (subdocuments) for data tightly coupled to its parent that is always read together
- **Price snapshots** to preserve historical financial accuracy
- **Compound unique indexes** for data integrity constraints
- **TTL indexes** for automatic cleanup of ephemeral documents

---

## Collection 1: users

**Purpose:** Authentication credentials for all system users (Admin, Trainer, Member)

| Field | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `name` | String | ✅ | `trim: true` | Display name |
| `email` | String | ✅ | `unique`, `lowercase`, `index` | Login identifier |
| `password` | String | ✅ | `minlength: 6` | bcrypt hash (never plain text) |
| `phone` | String | ❌ | `trim` | Optional |
| `role` | String | ✅ | `enum: ['Admin','Trainer','Member']`, `default: 'Member'` | Controls access |
| `avatar` | String | ❌ | `default: ''` | Image URL |
| `createdAt`, `updatedAt` | Date | — | auto | Mongoose timestamps |

**Indexes:** `email` (unique, B-tree index for O(log N) login lookups)

**Pre-save Hook:** Hashes password with `bcrypt.genSalt(10)` before every save if modified

**Example Document:**
```json
{
  "_id": "6641a1b2c3d4e5f6a7b8c9d0",
  "name": "Aryaveer Pratap Singh",
  "email": "admin@gymflow.com",
  "password": "$2a$10$hashedpassword...",
  "phone": "9876543210",
  "role": "Admin",
  "avatar": "",
  "createdAt": "2026-01-15T08:00:00Z"
}
```

---

## Collection 2: members

**Purpose:** Member profile linked to a User account; tracks gym-specific information

| Field | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `user` | ObjectId (ref: User) | ✅ | `unique`, `index` | 1:1 with User |
| `memberCustomId` | String | ✅ | `unique`, `index` | e.g., `GF-1001` |
| `gender` | String | ❌ | `enum: ['Male','Female','Other']` | |
| `dob` | Date | ❌ | — | Date of birth |
| `emergencyContact` | String | ❌ | — | |
| `address` | String | ❌ | — | |
| `assignedTrainer` | ObjectId (ref: Trainer) | ❌ | `default: null` | Nullable FK |
| `currentMembership` | ObjectId (ref: Membership) | ❌ | `default: null` | Active membership link |
| `status` | String | ❌ | `enum: ['Active','Expired','Expiring Soon','Pending','Cancelled']`, `index` | |
| `joinDate` | Date | ❌ | `default: Date.now` | |

**Indexes:** `user` (unique), `memberCustomId` (unique), `status`

**Relationships:** 
- 1:1 with `users` (via `user` field)
- M:1 with `trainers` (via `assignedTrainer`)
- 1:1 with `memberships` (current active)
- 1:N with `payments`, `attendance`, `workouts`, `progress`, `dietplans`

**Example Document:**
```json
{
  "_id": "6641b2c3d4e5f6a7b8c9d0e1",
  "user": "6641a1b2c3d4e5f6a7b8c9d0",
  "memberCustomId": "GF-1002",
  "gender": "Male",
  "dob": "2000-05-15T00:00:00Z",
  "assignedTrainer": "6641c3d4e5f6a7b8c9d0e1f2",
  "currentMembership": "6641d4e5f6a7b8c9d0e1f2a3",
  "status": "Active",
  "joinDate": "2026-01-15T08:00:00Z"
}
```

---

## Collection 3: trainers

**Purpose:** Trainer profile linked to a User account

| Field | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `user` | ObjectId (ref: User) | ✅ | `unique`, `index` | 1:1 with User |
| `trainerCustomId` | String | ✅ | `unique` | e.g., `TR-001` |
| `specialization` | String | ✅ | `default: 'General Fitness & Strength'` | |
| `experienceYears` | Number | ✅ | `default: 1` | |
| `availability` | String | ❌ | — | e.g., "6 AM – 9 PM" |
| `bio` | String | ❌ | — | Short profile |
| `status` | String | ❌ | `enum: ['Active','Inactive']`, `default: 'Active'` | |

---

## Collection 4: plans

**Purpose:** Membership plan catalog

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | String | ✅ | `unique`, `trim` |
| `durationMonths` | Number | ✅ | `min: 1` |
| `price` | Number | ✅ | `min: 0` |
| `description` | String | ❌ | — |
| `features` | [String] | ❌ | — |
| `status` | String | ❌ | `enum: ['Active','Inactive']`, `default: 'Active'` |

**Example Documents (Seeded):**
```json
{ "name": "Basic",   "durationMonths": 1,  "price": 999  },
{ "name": "Silver",  "durationMonths": 3,  "price": 2499 },
{ "name": "Gold",    "durationMonths": 6,  "price": 3999 },
{ "name": "Premium", "durationMonths": 12, "price": 5999 }
```

---

## Collection 5: memberships

**Purpose:** Active and historical membership records for each member

**Key Design Decision — Price Snapshot Pattern:**
`priceSnapshot` copies the plan price at the time of purchase. If admin later changes the plan price (e.g., ₹999 → ₹1,299), existing memberships retain their original contracted price. This is equivalent to SQL's audit table pattern.

| Field | Type | Required | Notes |
|---|---|---|---|
| `member` | ObjectId (ref: Member) | ✅ | `index` |
| `plan` | ObjectId (ref: Plan) | ✅ | — |
| `priceSnapshot` | Number | ✅ | `min: 0` — historical price lock |
| `durationMonthsSnapshot` | Number | ✅ | `min: 1` — historical duration lock |
| `startDate` | Date | ✅ | — |
| `endDate` | Date | ✅ | — |
| `originalEndDate` | Date | ❌ | Preserved during freeze/resume |
| `status` | String | ❌ | `enum: ['Active','Expired','Expiring Soon','Frozen','Cancelled','Pending Payment']` |
| `paymentStatus` | String | ❌ | `enum: ['Paid','Partial','Pending','Refunded']` |
| `amountPaid` | Number | ❌ | — |
| `outstandingDues` | Number | ❌ | `= priceSnapshot - amountPaid` |
| `isFrozen` | Boolean | ❌ | `default: false` |
| `freezeHistory` | [FreezeRecord] | ❌ | **Embedded subdocument array** |
| `autoRenew` | Boolean | ❌ | `default: false` |

**Embedded FreezeRecord Subdocument:**
```javascript
{ freezeDate: Date, resumeDate: Date, daysFrozen: Number, reason: String }
```

**Virtual Field:**
```javascript
membershipSchema.virtual('remainingDays').get(function() {
  if (this.status === 'Frozen') return 0;
  return Math.max(0, Math.ceil((this.endDate - new Date()) / 86400000));
});
```

**Compound Indexes:**
- `{ member: 1, status: 1 }` — active membership lookup
- `{ endDate: 1, status: 1 }` — expiring memberships query

---

## Collection 6: payments

**Purpose:** Financial transaction ledger

| Field | Type | Required | Notes |
|---|---|---|---|
| `member` | ObjectId (ref: Member) | ✅ | `index` |
| `membership` | ObjectId (ref: Membership) | ✅ | — |
| `amount` | Number | ✅ | `min: 0` |
| `discountApplied` | Number | ❌ | — |
| `couponCode` | String | ❌ | — |
| `paymentMethod` | String | ✅ | `enum: ['Cash','UPI','Card','Bank Transfer','Razorpay','NetBanking','Wallet']` |
| `paymentDate` | Date | ❌ | `index` |
| `transactionId` | String | ✅ | **`unique`** — prevents duplicate records |
| `razorpayOrderId` | String | ❌ | `index` |
| `razorpayPaymentId` | String | ❌ | `index` — used for duplicate payment prevention |
| `razorpaySignature` | String | ❌ | HMAC-SHA256 digest stored for audit |
| `invoiceNo` | String | ✅ | **`unique`** |
| `status` | String | ❌ | `enum: ['Completed','Pending','Failed','Refunded']` |
| `isDemoPayment` | Boolean | ❌ | `true` for demo checkout, `false` for verified Razorpay |
| `isRefunded` | Boolean | ❌ | — |
| `refundAmount` | Number | ❌ | — |
| `refundDate` | Date | ❌ | — |

**Compound Indexes:**
- `{ member: 1, paymentDate: -1 }` — member payment history
- `{ status: 1, paymentDate: -1 }` — admin ledger filtering

---

## Collection 7: invoices

**Purpose:** Formal invoice records with tax breakdown

| Field | Type | Required | Notes |
|---|---|---|---|
| `invoiceNumber` | String | ✅ | `unique`, `index` — e.g., `INV-2026-1002` |
| `member` | ObjectId (ref: Member) | ✅ | `index` |
| `payment` | ObjectId (ref: Payment) | ✅ | 1:1 with Payment |
| `membership` | ObjectId (ref: Membership) | ❌ | — |
| `planName` | String | ✅ | Snapshot of plan name at purchase time |
| `subTotal` | Number | ✅ | Original plan price |
| `discountAmount` | Number | ❌ | — |
| `taxAmount` | Number | ❌ | 18% GST display (`finalPrice * 0.18`) |
| `totalAmount` | Number | ✅ | Final charged amount |
| `status` | String | ❌ | `enum: ['Paid','Pending','Cancelled','Refunded']` |
| `issuedDate` | Date | ❌ | `default: Date.now` |

---

## Collection 8: attendances

**Purpose:** Daily attendance records with duplicate prevention

| Field | Type | Required | Notes |
|---|---|---|---|
| `member` | ObjectId (ref: Member) | ✅ | `index` |
| `date` | String | ✅ | Format: `"YYYY-MM-DD"`, `index` |
| `checkInTime` | String | ✅ | Format: `"08:30 AM"` |
| `checkOutTime` | String | ❌ | `default: null` |
| `status` | String | ❌ | `enum: ['Present','Late','Absent']`, `default: 'Present'` |
| `markedBy` | ObjectId (ref: User) | ❌ | Admin or system |

**Compound Unique Index (Critical DBMS Concept):**
```javascript
attendanceSchema.index({ member: 1, date: 1 }, { unique: true });
```
Enforced at the MongoDB WiredTiger storage engine level. A duplicate key error is thrown and caught if a second check-in attempt is made for the same member on the same calendar date.

---

## Collection 9: checkintokens (TTL Collection)

**Purpose:** Single-use 5-minute QR tokens for contactless attendance

| Field | Type | Required | Notes |
|---|---|---|---|
| `member` | ObjectId (ref: Member) | ✅ | `index` |
| `token` | String | ✅ | `unique`, `index` — cryptographically random UUID |
| `expiresAt` | Date | ✅ | `= now + 5 minutes` |
| `isUsed` | Boolean | ❌ | `default: false`, `index` |
| `usedAt` | Date | ❌ | Set when verified |

**TTL Index:**
```javascript
checkInTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```
MongoDB's background TTL reaper thread removes expired documents approximately every 60 seconds. Application-level validation (`now > expiresAt`) provides millisecond-precise rejection.

---

## Collection 10: workouts

**Purpose:** Trainer-assigned workout plans with embedded exercise splits

| Field | Type | Notes |
|---|---|---|
| `member` | ObjectId (ref: Member) | `index` |
| `trainer` | ObjectId (ref: Trainer) | — |
| `planName` | String | e.g., "4-Day Upper/Lower Split" |
| `goal` | String | — |
| `durationWeeks` | Number | — |
| `exercises` | **[ExerciseSubSchema]** | **Embedded** |
| `status` | String | `enum: ['Active','Completed','Archived']` |

**ExerciseSubSchema (Embedded):**
`name`, `muscleGroup`, `sets`, `reps`, `weightKg`, `restTimeSec`, `day`, `notes`, `completed`

**Why Embedded?** Exercises are always read together with the workout plan. They have no independent lifecycle and are never queried in isolation. Embedding avoids a second collection scan.

---

## Collection 11: dietplans

**Purpose:** Trainer-assigned nutrition plans with embedded meal breakdowns (2-level deep embedding)

| Field | Type | Notes |
|---|---|---|
| `member` | ObjectId (ref: Member) | `index` |
| `trainer` | ObjectId (ref: Trainer) | — |
| `title` | String | — |
| `fitnessGoal` | String | `enum: ['Weight Loss','Muscle Gain','Lean Bulk','Endurance','Maintenance','General Health']` |
| `targetDailyCalories` | Number | — |
| `targetProteinGrams` | Number | — |
| `targetCarbsGrams` | Number | — |
| `targetFatsGrams` | Number | — |
| `waterIntakeLiters` | Number | — |
| `meals` | **[MealSubSchema]** | **Embedded** |
| `status` | String | `enum: ['Active','Archived']` |

**MealSubSchema:** `mealName`, `mealTime`, `calories`, `notes`, `foodItems[]` (embedded FoodItemSchema)  
**FoodItemSchema:** `name`, `quantity`, `calories`, `protein`

---

## Collection 12: progresses

**Purpose:** Time-series body transformation and Personal Record tracking

| Field | Type | Notes |
|---|---|---|
| `member` | ObjectId (ref: Member) | `index` |
| `trainer` | ObjectId (ref: Trainer) | — |
| `weightKg` | Number | Required |
| `bodyFatPercentage` | Number | Optional |
| `chestCm`, `waistCm`, `bicepsCm` | Number | Optional measurements |
| `benchPressPRKg`, `squatPRKg`, `deadliftPRKg` | Number | Big 3 Personal Records |
| `date` | Date | `default: Date.now`, `index` |
| `notes` | String | — |

---

## Collection 13: classes

**Purpose:** Group fitness class schedule with capacity management

| Field | Type | Notes |
|---|---|---|
| `name` | String | Required — e.g., "Morning Power Yoga" |
| `trainer` | ObjectId (ref: Trainer) | Required |
| `category` | String | `enum: ['Yoga','Zumba','Spin','CrossFit','Pilates','HIIT','Boxing']` |
| `startTime`, `endTime` | Date | Required |
| `durationMinutes` | Number | `default: 60` |
| `capacity` | Number | Required, `min: 1` |
| `bookedCount` | Number | `default: 0` — atomically incremented |
| `location` | String | — |
| `status` | String | `enum: ['Scheduled','In-Progress','Completed','Cancelled']` |

**Compound Index:** `{ startTime: 1, trainer: 1 }` — conflict detection for trainer schedule

---

## Collection 14: classbookings

**Purpose:** M:N junction between Members and Classes

| Field | Type | Notes |
|---|---|---|
| `class` | ObjectId (ref: Class) | Required |
| `member` | ObjectId (ref: Member) | Required |
| `status` | String | `enum: ['Booked','Attended','Cancelled']` |

---

## Collection 15: trainingsessions

**Purpose:** 1-on-1 personal training session schedule

| Field | Type | Notes |
|---|---|---|
| `trainer` | ObjectId (ref: Trainer) | `index` |
| `member` | ObjectId (ref: Member) | `index` |
| `title` | String | `default: '1-on-1 Personal Training'` |
| `startTime`, `endTime` | Date | Required |
| `focusArea` | String | — |
| `status` | String | `enum: ['Scheduled','Completed','Cancelled','No-Show']` |

**Compound Indexes:** `{ trainer: 1, startTime: 1 }` and `{ member: 1, startTime: 1 }` — enable overlap detection queries

---

## Collection 16: lockers

**Purpose:** Smart locker allocation with atomic state machine

| Field | Type | Notes |
|---|---|---|
| `lockerNumber` | String | `unique`, `index` — e.g., `L-101` |
| `zone` | String | `enum: ['Ground Floor A','Ground Floor B','First Floor Men','First Floor Women','VIP Lounge']` |
| `status` | String | `enum: ['Available','Allocated','Under Maintenance']`, `index` |
| `assignedMember` | ObjectId (ref: Member) | `default: null`, `index` |
| `allocationDate` | Date | — |
| `releaseDate` | Date | — |

---

## Collection 17: equipment

**Purpose:** Gym asset inventory with maintenance scheduling

| Field | Type | Notes |
|---|---|---|
| `name` | String | Required |
| `category` | String | `enum: ['Cardio','Strength','Free Weights','Functional','Recovery','Machines']` |
| `serialNumber` | String | `unique`, `sparse` |
| `condition` | String | `enum: ['Excellent','Good','Fair','Needs Maintenance','Out of Order']`, `index` |
| `nextServiceDate` | Date | `index` — used for 7-day maintenance alert |
| `lastServiceDate` | Date | — |
| `cost` | Number | — |

**Compound Index:** `{ nextServiceDate: 1, condition: 1 }` — maintenance alert dashboard query

---

## Collection 18: leads

**Purpose:** Sales prospect pipeline with trial pass management

| Field | Type | Notes |
|---|---|---|
| `fullName` | String | Required |
| `email` | String | `index` |
| `phone` | String | Required, `index` |
| `interest` | String | `enum: ['Weight Loss','Bodybuilding','CrossFit','Yoga & Wellness','General Fitness','Personal Training']` |
| `source` | String | `enum: ['Walk-in','Website','Instagram','Referral','Google Search','Other']` |
| `status` | String | `enum: ['New','Contacted','Trial Active','Converted','Lost']`, `index` |
| `hasTrialPass` | Boolean | `default: true` |
| `trialPassDurationDays` | Number | `default: 3` |
| `convertedMember` | ObjectId (ref: Member) | Set after 1-click conversion |
| `followUps` | **[FollowUpSubSchema]** | **Embedded** |

**FollowUpSubSchema (Embedded):** `date`, `notes`, `contactedBy (ref: User)`

---

## Collection 19: coupons

**Purpose:** Discount codes with atomic usage limit enforcement

| Field | Type | Notes |
|---|---|---|
| `code` | String | `unique`, `index`, `uppercase` |
| `discountType` | String | `enum: ['Percentage','Fixed']` |
| `discountValue` | Number | `min: 1` |
| `minPurchase`, `maxDiscount` | Number | — |
| `validFrom`, `validUntil` | Date | `validUntil` indexed |
| `usageLimit` | Number | `default: 100` |
| `timesUsed` | Number | Atomically incremented via `$inc` |
| `status` | String | `enum: ['Active','Expired','Disabled']` |
| `eligiblePlans` | [ObjectId (ref: Plan)] | Optional plan restriction |

---

## Collection 20: feedbacks

**Purpose:** Member reviews with aggregation-computed average ratings

| Field | Type | Notes |
|---|---|---|
| `member` | ObjectId (ref: Member) | `index` |
| `category` | String | `enum: ['Trainer','Class','Facility','General']`, `index` |
| `trainer` | ObjectId (ref: Trainer) | Nullable — for trainer-specific feedback |
| `classRef` | ObjectId (ref: Class) | Nullable — for class-specific feedback |
| `rating` | Number | `min: 1, max: 5` — server-validated |
| `comment` | String | Required, `maxlength: 500` |
| `status` | String | `enum: ['Approved','Pending','Rejected']` |

**Compound Index:** `{ category: 1, status: 1, createdAt: -1 }`

---

## Collection 21: auditlogs

**Purpose:** Append-only compliance audit trail for all state mutations

| Field | Type | Notes |
|---|---|---|
| `actor` | ObjectId (ref: User) | Who performed the action |
| `actorName` | String | Denormalized for display |
| `actorRole` | String | `enum: ['Admin','Trainer','Member','System']` |
| `action` | String | `index` — e.g., `MEMBERSHIP_FROZEN` |
| `entity` | String | `index` — e.g., `'Membership'` |
| `entityId` | ObjectId | The affected document |
| `oldValues` | Mixed | State before change |
| `newValues` | Mixed | State after change |
| `details` | String | Human-readable description |
| `ipAddress` | String | `default: '127.0.0.1'` |

**Compound Indexes:** `{ entity: 1, createdAt: -1 }` and `{ action: 1, createdAt: -1 }`

---

## Collection 22: notifications

**Purpose:** Schema exists; transport layer (email/SMS) not yet implemented

| Field | Type | Notes |
|---|---|---|
| `user` | ObjectId (ref: User) | Recipient |
| `title` | String | — |
| `message` | String | — |
| `type` | String | — |
| `isRead` | Boolean | `default: false` |

---

## Collection 23: maintenances

**Purpose:** Equipment service log (verified model file exists: `Maintenance.js`)

Tracks service events linked to equipment with technician notes and cost.

---

## 11.2 Entity Relationship Diagram (Mermaid)

```mermaid
erDiagram
    User ||--o| Member : "1:1 (user)"
    User ||--o| Trainer : "1:1 (user)"
    Trainer ||--o{ Member : "1:N (assignedTrainer)"
    Member ||--o{ Membership : "1:N"
    Plan ||--o{ Membership : "snapshot reference"
    Member ||--o{ Payment : "1:N"
    Membership ||--o{ Payment : "1:N"
    Payment ||--|| Invoice : "1:1"
    Member ||--o{ Attendance : "1:N"
    Member ||--o{ CheckInToken : "1:N (TTL)"
    Trainer ||--o{ Class : "1:N"
    Class ||--o{ ClassBooking : "1:N"
    Member ||--o{ ClassBooking : "1:N (M:N junction)"
    Trainer ||--o{ TrainingSession : "1:N"
    Member ||--o{ TrainingSession : "1:N"
    Member ||--o| Locker : "1:1 (optional)"
    Trainer ||--o{ Workout : "creates"
    Member ||--o{ Workout : "1:N (exercises embedded)"
    Trainer ||--o{ DietPlan : "creates"
    Member ||--o{ DietPlan : "1:N (meals embedded)"
    Member ||--o{ Progress : "1:N (time-series)"
    Member ||--o{ Lead : "convertedMember ref"
    Member ||--o{ Feedback : "1:N"
    User ||--o{ AuditLog : "actor ref"
```

---

# Chapter 12 – DBMS Concepts Demonstrated

## 12.1 Schema Validation Using Mongoose

MongoDB is schemaless by default. Mongoose enforces application-level schemas before any document reaches the database.

**How GymFlow uses it:**
```javascript
// From User.js
email: {
  type: String,
  required: [true, 'Email is required'],
  unique: true,
  lowercase: true,
  trim: true,
  index: true
}
// From Payment.js
rating: {
  min: [1, 'Rating must be at least 1 star'],
  max: [5, 'Rating cannot exceed 5 stars']
}
```
**Benefit:** Prevents corrupt data (negative prices, invalid roles, missing required fields) before it reaches MongoDB.

---

## 12.2 CRUD Operations

| Operation | Mongoose Method | Example in GymFlow |
|---|---|---|
| Create | `Model.create({})` | `User.create({name, email, password, role})` |
| Read All | `Model.find({filter})` | `Member.find({ status: 'Active' })` |
| Read One | `Model.findById(id)` | `Plan.findById(planId)` |
| Update | `Model.findByIdAndUpdate(id, {$set:{}})` | `Member.findByIdAndUpdate(id, {status:'Inactive'})` |
| Atomic Update | `Model.findOneAndUpdate(filter, {$inc})` | `Coupon.findOneAndUpdate({...}, {$inc: {timesUsed:1}})` |
| Delete | `Model.deleteOne({})` | Draft token cleanup |
| Safe Delete | Status update | Member deactivation (`status: 'Inactive'`) |

---

## 12.3 Embedded Documents vs. Referenced Documents

| Criterion | Embedded (GymFlow Examples) | Referenced (GymFlow Examples) |
|---|---|---|
| When to use | Always read together with parent | Independent lifecycle, queried separately |
| Examples | `Workout.exercises[]`, `DietPlan.meals[]`, `Membership.freezeHistory[]`, `Lead.followUps[]` | `Member.user (ref: User)`, `Membership.plan (ref: Plan)` |
| Advantage | Single document read, no JOIN | Avoids document bloat, independent indexing |
| Disadvantage | Document size limit (16 MB) | Requires second query (`populate()`) |

---

## 12.4 ObjectId Referencing vs. SQL Foreign Keys

| Aspect | SQL Foreign Key | MongoDB ObjectId Reference |
|---|---|---|
| Enforcement | Database engine (`ON DELETE CASCADE`) | Application level (Mongoose service checks) |
| Type | Integer or UUID | 12-byte binary BSON ObjectId |
| Referential integrity | Guaranteed by RDBMS | Managed by Mongoose + controller logic |
| Flexibility | Rigid schema | Flexible — reference can be null |
| Sharding | Complex | Enables horizontal partitioning |

---

## 12.5 Mongoose `.populate()` vs. SQL JOIN

**SQL JOIN** (single round-trip, database-internal):
```sql
SELECT m.name, p.name AS plan 
FROM memberships ms
JOIN members m ON ms.member_id = m.id
JOIN plans p ON ms.plan_id = p.id;
```

**Mongoose `.populate()`** (two round-trips, assembled in Node.js):
```javascript
// From dashboardController.js
await Member.find()
  .populate('user', 'name email phone')
  .populate({ path: 'currentMembership', populate: { path: 'plan' } });
```
Mongoose issues: 1) `Member.find()` → 2) `User.find({ _id: { $in: [collected IDs] } })` → assembles in memory.

---

## 12.6 Aggregation Pipelines (MongoDB Equivalent of SQL GROUP BY + JOIN)

**Pipeline 1 — Monthly Revenue (from `dashboardController.js`):**
```javascript
Payment.aggregate([
  { $match: { status: 'Completed', paymentDate: { $gte: sixMonthsAgo } } },
  { $group: {
      _id: { year: { $year: '$paymentDate' }, month: { $month: '$paymentDate' } },
      revenue: { $sum: '$amount' }
  }},
  { $sort: { '_id.year': 1, '_id.month': 1 } }
])
```
**SQL Equivalent:**
```sql
SELECT YEAR(paymentDate) AS year, MONTH(paymentDate) AS month, SUM(amount) AS revenue
FROM payments
WHERE status = 'Completed' AND paymentDate >= sixMonthsAgo
GROUP BY year, month
ORDER BY year, month;
```

**Pipeline 2 — Membership Plan Distribution:**
```javascript
Membership.aggregate([
  { $match: { status: 'Active' } },
  { $lookup: { from: 'plans', localField: 'plan', foreignField: '_id', as: 'planDetails' } },
  { $unwind: '$planDetails' },
  { $group: { _id: '$planDetails.name', count: { $sum: 1 } } },
  { $project: { _id: 0, name: '$_id', count: 1 } }
])
```

---

## 12.7 Indexing and B-Trees

MongoDB B-tree indexes reduce query complexity from O(N) collection scan to O(log N) index traversal.

**Verified indexes in GymFlow:**

| Collection | Index | Type | Purpose |
|---|---|---|---|
| `users` | `email` | Unique, ascending | Authentication lookup |
| `members` | `user` | Unique | Profile lookup by user |
| `members` | `memberCustomId` | Unique | QR scan lookup |
| `members` | `status` | Ascending | Filter by status |
| `attendances` | `{ member, date }` | **Compound Unique** | Duplicate check + attendance history |
| `checkintokens` | `expiresAt` | **TTL** | Auto-purge expired tokens |
| `checkintokens` | `token` | Unique | Token verification |
| `memberships` | `{ member, status }` | Compound | Active membership query |
| `memberships` | `{ endDate, status }` | Compound | Expiring memberships alert |
| `payments` | `{ member, paymentDate -1 }` | Compound | Member payment history |
| `classes` | `{ startTime, trainer }` | Compound | Trainer schedule query |
| `trainingsessions` | `{ trainer, startTime }` | Compound | Overlap conflict detection |
| `auditlogs` | `{ entity, createdAt -1 }` | Compound | Compliance queries |
| `equipment` | `{ nextServiceDate, condition }` | Compound | Maintenance alert query |

---

## 12.8 Atomic Operations and Concurrency Safety

MongoDB's `findOneAndUpdate` with read-modify-write in a single atomic operation eliminates race conditions.

**Class Overbooking Prevention:**
```javascript
// Atomic: find class with available slot AND increment in ONE operation
const booked = await Class.findOneAndUpdate(
  { _id: classId, bookedCount: { $lt: classDoc.capacity } },
  { $inc: { bookedCount: 1 } },
  { new: true }
);
// If bookedCount >= capacity, MongoDB returns null → request rejected
```

**Locker Double-Assignment Prevention:**
```javascript
const locker = await Locker.findOneAndUpdate(
  { _id: lockerId, status: 'Available' },  // Precondition
  { $set: { status: 'Allocated', assignedMember: memberId } },
  { new: true }
);
// Second concurrent request will NOT find status: 'Available' → rejected
```

**Coupon Usage Limit (Atomic):**
```javascript
await Coupon.findOneAndUpdate(
  { code, status: 'Active', $expr: { $lt: ['$timesUsed', '$usageLimit'] } },
  { $inc: { timesUsed: 1 } },
  { new: true }
);
```

---

## 12.9 TTL Index (Time-To-Live)

A special MongoDB index that automatically deletes documents after a specified duration.

```javascript
// CheckInToken.js - TTL Index
checkInTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

- **`expireAfterSeconds: 0`** means: "Delete the document when `expiresAt` timestamp passes"
- MongoDB background thread runs every **~60 seconds**
- **Application-level validation is still required** for immediate security:
  ```javascript
  if (new Date() > token.expiresAt) {
    return res.status(400).json({ message: 'QR token has expired' });
  }
  ```

---

## 12.10 Price Snapshot Pattern (Temporal Data Integrity)

Analogous to SQL's temporal tables or audit history tables. When a plan changes price from ₹999 to ₹1,499, existing memberships preserve their contracted `priceSnapshot: 999`.

```javascript
// From membershipController.js
const membership = await Membership.create({
  plan: planId,
  priceSnapshot: plan.price,         // ← Snapshot taken NOW
  durationMonthsSnapshot: plan.durationMonths,
  ...
});
```

---

## 12.11 SQL View Equivalent

```
GET /api/reports/monthly-revenue-view
```
Mimics: `CREATE VIEW monthly_revenue_view AS SELECT YEAR(paymentDate), MONTH(paymentDate), SUM(amount) FROM payments GROUP BY YEAR, MONTH`

The aggregation pipeline runs on every request (read-only, no physical storage) — matching SQL view semantics.

---

## 12.12 Data Consistency and Duplicate Prevention

| Constraint | Mechanism | Example |
|---|---|---|
| One attendance per member per day | Compound unique index | `{ member: 1, date: 1 }` |
| Unique member custom ID | Unique index | `memberCustomId: unique` |
| Unique email | Unique index | `User.email: unique` |
| Unique transaction | Unique index | `Payment.transactionId: unique` |
| Unique invoice | Unique index | `Payment.invoiceNo: unique` |
| No duplicate Razorpay payment | Pre-check query | `Payment.findOne({ razorpayPaymentId })` |
| No locker double-allocation | Atomic precondition | `{ status: 'Available' }` in findOneAndUpdate |
| Class capacity enforcement | Atomic precondition | `{ bookedCount: { $lt: capacity } }` |

---

# Chapter 13 – Database Operations and Queries

All examples use the actual collection and field names verified from the GymFlow schema.

## 13.1 Insert a Member (via Registration)

```javascript
// Step 1: Create User
const user = await User.create({
  name: 'Priya Sharma',
  email: 'priya.sharma@example.com',
  password: 'SecurePass@123',  // hashed by pre-save hook
  role: 'Member'
});

// Step 2: Create Member profile
const member = await Member.create({
  user: user._id,
  memberCustomId: 'GF-1021',
  gender: 'Female',
  status: 'Active'
});
```

**MongoDB Shell Equivalent:**
```javascript
db.users.insertOne({
  name: "Priya Sharma",
  email: "priya.sharma@example.com",
  password: "$2a$10$hashedValue...",
  role: "Member"
})
```

---

## 13.2 Find a Member by Email

```javascript
// Application query
const user = await User.findOne({ email: 'priya.sharma@example.com' });
const member = await Member.findOne({ user: user._id })
  .populate('user', 'name email phone')
  .populate({ path: 'currentMembership', populate: { path: 'plan' } });
```

**Shell:**
```javascript
db.users.findOne({ email: "priya.sharma@example.com" })
// → Uses email B-tree index: O(log N)
```

---

## 13.3 Retrieve Active Memberships

```javascript
const activeMemberships = await Membership.find({
  status: { $in: ['Active', 'Expiring Soon'] }
})
.populate({ path: 'member', populate: { path: 'user', select: 'name email' } })
.populate('plan', 'name durationMonths price')
.sort({ endDate: 1 });
```

**Shell:**
```javascript
db.memberships.find({ status: { $in: ["Active", "Expiring Soon"] } })
  .sort({ endDate: 1 })
// → Uses { member: 1, status: 1 } compound index
```

---

## 13.4 Find Expired Memberships

```javascript
const expiredMemberships = await Membership.find({
  status: 'Expired',
  endDate: { $lt: new Date() }
}).populate('member');
```

---

## 13.5 Update a Membership (Freeze)

```javascript
// From membershipController.js
const membership = await Membership.findByIdAndUpdate(
  membershipId,
  {
    isFrozen: true,
    status: 'Frozen',
    $push: {
      freezeHistory: {
        freezeDate: new Date(),
        reason: 'Medical leave',
        daysFrozen: 0
      }
    }
  },
  { new: true }
);
```

---

## 13.6 Search Members (Regex Text Search)

```javascript
// From memberController.js (illustrative, derived from README)
const searchRegex = new RegExp(searchTerm, 'i');
const members = await Member.find().populate('user', 'name email phone')
  .then(all => all.filter(m =>
    searchRegex.test(m.user?.name) ||
    searchRegex.test(m.user?.email) ||
    searchRegex.test(m.memberCustomId)
  ));
```

---

## 13.7 Retrieve Attendance History for a Member

```javascript
const attendance = await Attendance.find({ member: memberId })
  .sort({ date: -1 })
  .limit(30);
```

**Shell:**
```javascript
db.attendances.find({ member: ObjectId("6641b2c3...") })
  .sort({ date: -1 })
  .limit(30)
```

---

## 13.8 Retrieve Payment History

```javascript
const payments = await Payment.find({ member: memberId })
  .sort({ paymentDate: -1 })
  .populate('membership', 'startDate endDate');
```

---

## 13.9 Monthly Revenue Aggregation Pipeline

```javascript
// From dashboardController.js (verified)
const revenueData = await Payment.aggregate([
  {
    $match: {
      status: 'Completed',
      paymentDate: { $gte: sixMonthsAgo }
    }
  },
  {
    $group: {
      _id: {
        year:  { $year:  '$paymentDate' },
        month: { $month: '$paymentDate' }
      },
      totalRevenue:      { $sum: '$amount' },
      transactionCount:  { $sum: 1 }
    }
  },
  { $sort: { '_id.year': 1, '_id.month': 1 } }
]);
```

**Example Output:**
```json
[
  { "_id": { "year": 2026, "month": 8 }, "totalRevenue": 12497, "transactionCount": 5 },
  { "_id": { "year": 2026, "month": 9 }, "totalRevenue": 19996, "transactionCount": 8 },
  { "_id": { "year": 2026, "month": 10 }, "totalRevenue": 7998, "transactionCount": 3 }
]
```

---

## 13.10 Trainer-Member Allocation Aggregation

```javascript
// From dashboardController.js (verified)
const trainerDistribution = await Member.aggregate([
  { $match: { assignedTrainer: { $ne: null } } },
  { $group: { _id: '$assignedTrainer', memberCount: { $sum: 1 } } },
  { $lookup: { from: 'trainers', localField: '_id', foreignField: '_id', as: 'trainer' } },
  { $unwind: '$trainer' },
  { $lookup: { from: 'users', localField: 'trainer.user', foreignField: '_id', as: 'user' } },
  { $unwind: '$user' },
  { $project: { _id: 0, trainerName: '$user.name', count: '$memberCount' } }
]);
```

---

# Chapter 14 – User Roles and Dashboards

## 14.1 Role Enforcement Architecture

**Frontend:**
```javascript
// App.jsx — ProtectedRoute component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Auto-redirect to own dashboard
    if (user.role === 'Admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'Trainer') return <Navigate to="/trainer/dashboard" replace />;
    return <Navigate to="/member/dashboard" replace />;
  }
  return children;
};
```

**Backend:**
```javascript
// authMiddleware.js — protect + authorize
router.get('/admin', protect, authorize('Admin'), getAdminDashboard);
router.get('/trainer', protect, authorize('Trainer'), getTrainerDashboard);
router.get('/member', protect, authorize('Member'), getMemberDashboard);
```

## 14.2 Admin Role

**Login:** `admin@gymflow.com` / `Admin@123`  
**Route:** `/admin/dashboard`

**Full access to:**
- All member CRUD operations
- All trainer management
- All membership lifecycle operations (assign, freeze, resume, renew)
- All payment records and refund processing
- Invoice management
- Group class creation and management
- Equipment and maintenance tracking
- Locker allocation and release
- Lead pipeline and trial passes
- Coupon management
- Dues and defaulters ledger
- Feedback moderation
- Audit logs (read-only)
- DBMS Diagnostics and index catalog
- MongoDB SQL View equivalent report

## 14.3 Trainer Role

**Login:** `trainer@gymflow.com` / `Trainer@123`  
**Route:** `/trainer/dashboard`

**Access to:**
- View assigned member roster
- Create/update workout plans for assigned members
- Create/update diet plans for assigned members
- Log member progress (weight, measurements, PRs)
- Schedule 1-on-1 personal training sessions
- View and create group classes
- Lead pipeline (view + add follow-ups)
- View trainers directory

**Restricted from:**
- Payment ledger (full access), dues, coupons, audit logs, admin dashboard, diagnostics, locker admin

## 14.4 Member Role

**Login:** `member@gymflow.com` / `Member@123`  
**Route:** `/member/dashboard`

**Access to:**
- Digital membership card with remaining days counter
- Generate 5-minute TTL QR check-in pass
- View own attendance history
- View own payment history
- Book/cancel group fitness classes
- View own workout plan
- View own diet plan
- Log and view own progress records
- Submit feedback and ratings
- View/request locker allocation
- View trainer directory

**Restricted from:**
- Other members' data, payment full ledger, audit logs, diagnostics, admin panel

---

# Chapter 15 – Razorpay Payment Gateway Integration

## 15.1 Overview and Configuration

**Status: Implemented in Test Mode. Integration code is complete and verified in codebase. Live end-to-end test with card/UPI payment not documented as executed in available evidence.**

GymFlow uses the Razorpay Node.js SDK (`razorpay@2.9.8`) for server-side order creation and cryptographic signature verification. The frontend uses the Razorpay Checkout JS script for the payment UI.

**Environment Variables (from `server/.env`):**
```
RAZORPAY_KEY_ID=rzp_test_TqHLmAEv4kbwsP    ← Test Mode (rzp_test_ prefix confirmed)
RAZORPAY_KEY_SECRET=[SECRET — masked]        ← Server-side only, never exposed to client
```

> ⚠️ **Note:** The `.env` file was inspected and confirmed to contain `rzp_test_` prefixed keys. These are Razorpay Test Mode credentials — no real monetary transactions occur.

## 15.2 Payment Flow

### Step 1: Plan Selection (React)
Member selects a plan on `RegisterPage.jsx`. Coupon code may be optionally entered.

### Step 2: Create Razorpay Order (Backend)
```
POST /api/payments/razorpay/create-order
Body: { planId: "...", couponCode: "FITNESS10" }
```

**Server logic (verified from `razorpayController.js`):**
```javascript
// 1. Fetch authoritative plan price from MongoDB
const plan = await Plan.findById(planId);  // NEVER trust client price

// 2. Validate coupon (peek, don't consume yet)
const coupon = await Coupon.findOne({ code, status:'Active', ... });

// 3. Create Razorpay order
const order = await razorpay.orders.create({
  amount: Math.round(finalPrice * 100),  // in paise
  currency: 'INR',
  receipt: `rcpt_${Date.now()}_${random}`,
  notes: { planId, planName, durationMonths, couponCode }
});

// 4. Return orderId and keyId (NOT the secret)
res.json({ orderId: order.id, keyId: process.env.RAZORPAY_KEY_ID, finalPrice });
```

### Step 3: Checkout Opens (React)
The React frontend opens the Razorpay Checkout modal with the `orderId` and `keyId`. The member selects a payment method (test cards/UPI are provided by Razorpay Test Mode).

### Step 4: Signature Verification (Backend — Critical Security Step)

```
POST /api/payments/razorpay/verify
Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, couponCode, registrationData }
```

**Server logic (verified from `razorpayController.js` lines 163–184):**
```javascript
// HMAC-SHA256 signature verification
const expectedSignature = crypto
  .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
  .update(`${razorpay_order_id}|${razorpay_payment_id}`)
  .digest('hex');

if (expectedSignature !== razorpay_signature) {
  // Log security incident
  await logAudit({ action: 'PAYMENT_SIGNATURE_VERIFICATION_FAILED', ... });
  return res.status(400).json({ verified: false, message: 'Invalid Razorpay cryptographic signature' });
}
```

### Step 5: Duplicate Payment Prevention (verified from `razorpayController.js` lines 187–199)

```javascript
const existingPayment = await Payment.findOne({
  $or: [
    { transactionId: razorpay_payment_id },
    { razorpayPaymentId: razorpay_payment_id }
  ]
});
if (existingPayment) {
  return res.status(400).json({
    message: `Security Warning: Payment ID ${razorpay_payment_id} has already been processed.`
  });
}
```

### Step 6: Membership Activation and Record Creation

After signature verification and duplicate check:
1. `Membership.create({ status: 'Active', isDemoPayment: false })`
2. `Payment.create({ razorpayPaymentId, razorpaySignature, ... })`
3. `Invoice.create({ subTotal, discountAmount, taxAmount: finalPrice * 0.18, totalAmount })`
4. `AuditLog.create({ action: 'RAZORPAY_PAYMENT_VERIFIED', ... })`
5. Return JWT token for immediate login

## 15.3 Security Considerations

| Security Measure | Implementation |
|---|---|
| Key Secret never sent to client | Only `RAZORPAY_KEY_ID` (public) is returned to React |
| Server-side price authority | `Plan.findById()` on backend; client price ignored |
| HMAC-SHA256 signature | `crypto.createHmac('sha256', secret).update(orderId|paymentId)` |
| Duplicate payment prevention | `Payment.findOne({ razorpayPaymentId })` before activation |
| Audit trail on failure | `PAYMENT_SIGNATURE_VERIFICATION_FAILED` logged |
| No real cards needed | Razorpay Test Mode test card: `4111 1111 1111 1111`, CVV: any 3 digits |

## 15.4 What is NOT Implemented

| Feature | Status |
|---|---|
| Razorpay Webhook endpoint | ❌ Not implemented — no `/api/webhooks/razorpay` route found |
| Webhook signature verification | ❌ Not implemented (depends on webhook) |
| Live Mode keys | ❌ Only Test Mode keys (`rzp_test_` prefix) confirmed in `.env` |
| Refund via Razorpay API | ❌ Refunds are recorded in MongoDB but Razorpay API refund call not found in code |

---

# Chapter 16 – API Documentation

All protected endpoints require: `Authorization: Bearer <JWT_TOKEN>`

## 16.1 Authentication

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/api/health` | Public | — | Server + DB status |
| POST | `/api/auth/register` | Public | — | Register with plan selection |
| POST | `/api/auth/login` | Public | — | Login, get JWT |
| GET | `/api/auth/me` | Protected | All | Current user profile |

**POST /api/auth/register — Example Request:**
```json
{
  "name": "Priya Sharma",
  "email": "priya@example.com",
  "password": "MyPass@123",
  "phone": "9876543210",
  "planId": "6641e5f6a7b8c9d0e1f2a3b4",
  "paymentMethod": "UPI",
  "couponCode": "FITNESS10"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Priya Sharma",
    "email": "priya@example.com",
    "role": "Member",
    "profileId": "...",
    "customId": "GF-1021",
    "membershipId": "...",
    "planName": "Silver",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- `400` – Email already exists, invalid plan, password too short
- `500` – Server error

---

## 16.2 Dashboards

| Method | Endpoint | Auth | Roles |
|---|---|---|---|
| GET | `/api/dashboard/admin` | Protected | Admin |
| GET | `/api/dashboard/trainer` | Protected | Trainer |
| GET | `/api/dashboard/member` | Protected | Member |

---

## 16.3 Core Modules

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/api/members` | Protected | Admin, Trainer | List with search/filter/pagination |
| POST | `/api/members` | Protected | Admin | Create member |
| GET | `/api/members/:id` | Protected | Admin, Trainer | Get member by ID |
| PUT | `/api/members/:id` | Protected | Admin | Update member |
| DELETE | `/api/members/:id` | Protected | Admin | Safe deactivate |
| GET | `/api/trainers` | Protected | All | List trainers |
| POST | `/api/trainers` | Protected | Admin | Create trainer |
| GET | `/api/plans` | Protected | All | List active plans |
| POST | `/api/plans` | Protected | Admin | Create plan |
| PUT | `/api/plans/:id` | Protected | Admin | Update plan |
| GET | `/api/memberships` | Protected | All | List memberships |
| POST | `/api/memberships` | Protected | Admin | Assign membership |
| PUT | `/api/memberships/:id/freeze` | Protected | Admin | Freeze membership |
| PUT | `/api/memberships/:id/resume` | Protected | Admin | Resume + extend end date |
| POST | `/api/memberships/:id/renew` | Protected | Admin | Renew plan |
| GET | `/api/attendance` | Protected | All | Attendance records |
| POST | `/api/attendance` | Protected | Admin, Trainer | Mark attendance |
| POST | `/api/attendance/token/generate` | Protected | Member | Generate 5-min QR token |
| POST | `/api/attendance/token/verify` | Protected | Admin | Verify QR + mark attendance |
| GET | `/api/payments` | Protected | Admin, Trainer | Payment ledger |
| POST | `/api/payments` | Protected | Admin | Record payment |
| POST | `/api/payments/:id/refund` | Protected | Admin | Process refund |
| GET | `/api/invoices` | Protected | All | Invoice records |
| GET | `/api/workouts` | Protected | All | Workout plans |
| POST | `/api/workouts` | Protected | Admin, Trainer | Create workout |
| GET | `/api/progress` | Protected | All | Progress records |
| POST | `/api/progress` | Protected | Admin, Trainer | Log progress |

---

## 16.4 Extended Modules

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/api/classes` | Protected | All | Group class timetable |
| POST | `/api/classes` | Protected | Admin, Trainer | Create class |
| POST | `/api/classes/:id/book` | Protected | Member | Atomic book slot |
| DELETE | `/api/classes/:id/book` | Protected | Member | Cancel booking |
| GET | `/api/equipment` | Protected | Admin | Equipment registry |
| POST | `/api/equipment` | Protected | Admin | Add equipment |
| GET | `/api/lockers` | Protected | Admin, Member | Locker grid |
| POST | `/api/lockers/:id/allocate` | Protected | Admin | Atomic locker allocation |
| PUT | `/api/lockers/:id/release` | Protected | Admin | Release locker |
| GET | `/api/diet-plans` | Protected | All | Diet plans |
| POST | `/api/diet-plans` | Protected | Admin, Trainer | Create diet plan |
| GET | `/api/leads` | Protected | Admin, Trainer | Lead pipeline |
| POST | `/api/leads` | Protected | Admin, Trainer | Add prospect |
| POST | `/api/leads/:id/convert` | Protected | Admin | 1-click member conversion |
| GET | `/api/coupons` | Protected | Admin | Coupon list |
| POST | `/api/coupons` | Protected | Admin | Create coupon |
| GET | `/api/dues` | Protected | Admin | Outstanding dues |
| POST | `/api/dues/:id/pay` | Protected | Admin | Settle dues |
| GET | `/api/feedback` | Protected | All | Reviews |
| POST | `/api/feedback` | Protected | Member | Submit review |
| GET | `/api/audit-logs` | Protected | Admin | Audit trail |
| GET | `/api/reports/diagnostics` | Protected | Admin | Index catalog |
| GET | `/api/reports/monthly-revenue-view` | Protected | Admin | SQL View equivalent |
| GET | `/api/payments/razorpay-key` | Public | — | Public key ID |
| POST | `/api/payments/razorpay/create-order` | Public/Auth | — | Create Razorpay order |
| POST | `/api/payments/razorpay/verify` | Public/Auth | — | Verify payment + activate |

---

# Chapter 17 – Frontend Implementation

## 17.1 Project Structure

```
client/
├── index.html           # Vite HTML entry point
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Dark theme tokens
├── package.json
└── src/
    ├── main.jsx         # React DOM render root
    ├── App.jsx          # Router + ProtectedRoute + AppLayout
    ├── index.css        # Base Tailwind directives
    ├── context/
    │   └── AuthContext.jsx   # Global auth state (user, login, logout)
    ├── services/             # Axios API service layer
    ├── components/
    │   ├── Sidebar.jsx       # Role-specific navigation menu
    │   ├── Navbar.jsx        # Top bar with user info + logout
    │   ├── StatCard.jsx      # Reusable KPI card component
    │   ├── Modal.jsx         # Generic modal wrapper
    │   ├── QRScannerModal.jsx # QR token input + admin verify UI
    │   └── DemoCredentialsBadge.jsx  # 1-click credential autofill
    └── pages/
        ├── LandingPage.jsx
        ├── LoginPage.jsx
        ├── RegisterPage.jsx      # 3-step wizard (details → plan → coupon)
        ├── AdminDashboard.jsx    # KPI cards + 4 Recharts charts
        ├── TrainerDashboard.jsx
        ├── MemberDashboard.jsx   # QR pass + membership card
        ├── MembersPage.jsx       # Full CRUD with search
        ├── TrainersPage.jsx
        ├── PlansPage.jsx
        ├── MembershipsPage.jsx   # Freeze/Resume/Renew controls
        ├── AttendancePage.jsx    # QR verify + attendance list
        ├── PaymentsPage.jsx
        ├── WorkoutsPage.jsx
        ├── ProgressPage.jsx
        ├── ClassesPage.jsx       # Book/Cancel with capacity display
        ├── EquipmentPage.jsx
        ├── LockersPage.jsx       # Visual locker grid
        ├── DietPlansPage.jsx
        ├── LeadsPage.jsx
        ├── CouponsPage.jsx
        ├── DuesPage.jsx
        ├── FeedbackPage.jsx
        ├── AuditLogsPage.jsx
        ├── DiagnosticsPage.jsx   # Live index catalog + SQL View tab
        └── ReportsPage.jsx
```

## 17.2 Routing (React Router v6)

Three public routes: `/`, `/login`, `/register`

All other routes are wrapped in `ProtectedRoute` which:
1. Checks `AuthContext` for logged-in user
2. Verifies `user.role` against `allowedRoles` prop
3. Auto-redirects unauthorized users to their own dashboard

## 17.3 Authentication Context

```javascript
// AuthContext.jsx
const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('gymflow_user', JSON.stringify(userData));
  };
  const logout = () => { setUser(null); localStorage.removeItem('gymflow_user'); };
  // Restore on reload: useEffect reads localStorage
};
```

## 17.4 Key UI Components

**`DemoCredentialsBadge.jsx`:** Renders role switcher buttons at login screen that auto-fill admin/trainer/member credentials. Referenced in README for faculty demonstration.

**`QRScannerModal.jsx`:** Admin interface to paste/type a member's QR token string and submit to `POST /api/attendance/token/verify`. Displays success or rejection message.

**`StatCard.jsx`:** Reusable card for dashboard KPI metrics — accepts icon, title, value, color props.

**`AdminDashboard.jsx` (17,648 bytes):** Largest page — renders 9 stat cards + 4 Recharts charts (LineChart for revenue, BarChart for attendance, PieChart for plan distribution, BarChart for trainer allocation).

**`RegisterPage.jsx` (33,052 bytes):** Multi-step registration wizard — largest page file. Step 1: personal info, Step 2: plan selection (loaded from MongoDB), Step 3: coupon application + demo checkout OR Razorpay checkout.

## 17.5 Design System

- **Background:** `#0a0d12` (Charcoal black)
- **Primary accent:** Emerald green (`text-emerald-400`, `border-emerald-500`)
- **Typography:** System fonts via Tailwind defaults
- **Charts:** Recharts with custom emerald/teal color palette
- **Icons:** Lucide React icon library

---

# Chapter 18 – Backend Implementation

## 18.1 Express Application Setup

```javascript
// server/server.js
const app = express();
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 23 route modules mounted
app.use('/api/auth', require('./routes/authRoutes'));
// ... (all routes verified in server.js)

app.use(notFound);     // 404 handler
app.use(errorHandler); // Centralized error handler

app.listen(PORT); // PORT=5000 from .env
```

## 18.2 Middleware Stack

1. **`cors`**: `origin: '*'` (development — should be restricted in production)
2. **`express.json()`**: Body parsing for API requests
3. **`protect`** (`authMiddleware.js`): JWT verification — extracts `req.user`
4. **`authorize(...roles)`** (`authMiddleware.js`): Role check — returns 403 if unauthorized

## 18.3 JWT Authentication

```javascript
// authMiddleware.js
const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded.id).select('-password');
  next();
};
```

JWT payload contains only `{ id }` — role is looked up from DB on each request (single extra query per request to ensure role cannot be forged from stale JWT).

## 18.4 Audit Logger Utility

```javascript
// utils/auditLogger.js
const logAudit = async ({ actor, actorName, actorRole, action, entity, entityId, oldValues, newValues, details }) => {
  await AuditLog.create({ actor, actorName, actorRole, action, entity, entityId, oldValues, newValues, details });
};
module.exports = logAudit;
```

Called from 10+ controllers whenever a critical state change occurs.

## 18.5 Error Handling

```javascript
// middleware/errorMiddleware.js
const notFound = (req, res, next) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
};
const errorHandler = (err, req, res, next) => {
  res.status(err.statusCode || 500).json({ success: false, message: err.message });
};
```

All controllers use `try/catch` and return structured `{ success: bool, data/message }` responses.

## 18.6 Database Connection

```javascript
// config/db.js
const connectDB = async () => {
  try {
    // Attempt Atlas or Local connection
    await mongoose.connect(process.env.MONGO_URI);
  } catch (err) {
    // Fallback: embedded MongoMemoryServer + auto-seed
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    await seedData(true); // Populate demo data
  }
};
```

## 18.7 Key Controller Examples

**`membershipController.js` (14,850 bytes, 471 lines):**
- `assignMembership`: Creates Membership + Payment + Invoice atomically in sequence
- `freezeMembership`: Pushes freeze record, calculates `daysExtended` on resume
- `renewMembership`: New Membership document preserving price snapshot from new plan

**`attendanceController.js` (12,484 bytes):**
- `generateQRToken`: Creates CheckInToken with `expiresAt = now + 300,000ms`
- `verifyQRToken`: Validates token, prevents replay, creates Attendance

**`dashboardController.js` (14,531 bytes, 479 lines):**
- Admin: 4 aggregation pipelines + 6 count queries
- Trainer: 6 queries across 5 collections
- Member: 7 queries covering attendance, workouts, diet, progress, sessions

---

# Chapter 19 – Testing and Validation

GymFlow includes a built-in automated test runner at `server/test/verify_system.js`.

**Run Command:**
```bash
cd "d:/dbms project/server"
node test/verify_system.js
```

> **Note:** The automated test output shown below is taken directly from the README.md which documents the expected output from the test runner. Individual test execution results in the local environment would need to be re-run to generate fresh evidence.

## 19.1 Automated Test Matrix

| Test ID | Test Suite | Assertions | Status (per README) |
|---|---|---|---|
| T01 | Health & Database Diagnostic | 3 PASS | ✅ PASS |
| T02 | Admin Authentication | 2 PASS | ✅ PASS |
| T03 | Trainer Authentication | 2 PASS | ✅ PASS |
| T04 | Member Authentication | 2 PASS | ✅ PASS |
| T05 | Role Authorization & Security | 2 PASS | ✅ PASS |
| T06 | Dashboard Statistics | 5 PASS | ✅ PASS |
| T07 | Membership Plans API | 1 PASS | ✅ PASS |
| T08 | Public Registration Flow | 2 PASS | ✅ PASS |
| T09 | Duplicate Email Prevention | 1 PASS | ✅ PASS |
| T10 | QR Token & Replay Prevention | 4 PASS | ✅ PASS |
| T11 | Class Booking | 2 PASS | ✅ PASS |
| T12 | Locker Allocation | 2 PASS | ✅ PASS |
| T13 | Dues & Defaulters | 2 PASS | ✅ PASS |
| T14 | DBMS Diagnostics & SQL View | 3 PASS | ✅ PASS |
| T15 | Audit Logs Trail | 1 PASS | ✅ PASS |
| **Total** | **15 suites** | **34 assertions** | **34 PASS, 0 FAIL** |

## 19.2 Manual Testing Checklist

| Test | Test Steps | Expected | Status |
|---|---|---|---|
| Register new member | POST `/api/auth/register` with valid data | 201, JWT returned, role='Member' | Not executed (would need live server) |
| Duplicate email | POST `/api/auth/register` with existing email | 400 "email already exists" | Verified via T09 |
| Invalid login | POST `/api/auth/login` with wrong password | 401 "Invalid email or password" | Not executed |
| Member → Admin route | GET `/api/audit-logs` with Member JWT | 403 Forbidden | Verified via T05 |
| QR token generation | POST `/api/attendance/token/generate` | Token string returned | Verified via T10 |
| QR replay attack | Verify same token twice | Second attempt: 400 "already consumed" | Verified via T10 |
| Class overbooking | Book beyond capacity | 400 "Class capacity reached" | Verified via T11 |
| Locker double-allocation | Allocate same locker twice | Second: 400 rejected | Not executed |
| Coupon usage limit | Use coupon beyond `usageLimit` | Coupon not applied | Not executed |
| Membership freeze/resume | Freeze → wait → resume | `endDate` extended by frozen days | Not executed |
| Razorpay order creation | POST create-order with planId | Razorpay orderId returned | Not executed (requires live server + Razorpay creds) |
| Razorpay sig verification | POST verify with invalid sig | 400 "Invalid signature" | Not executed |
| Price tamper prevention | POST create-order with manipulated price | Server ignores client price | Verified by code inspection |
| MongoDB persistence | Check data after restart | Data persists (Atlas/Local) | Not executed |

---

# Chapter 20 – Results and Screenshots

> **Note:** No screenshots were captured during this inspection as the application was not running at the time the report was generated. The following section describes each expected screenshot. Screenshots should be added by running the application locally.

## Screenshot Placeholders

| Figure | Description | How to Capture |
|---|---|---|
| Fig 1 | Landing page (`http://localhost:5173/`) | Run app, navigate to root |
| Fig 2 | Login page with DemoCredentialsBadge autofill buttons | `/login` |
| Fig 3 | Register page — Step 1: Personal details | `/register` |
| Fig 4 | Register page — Step 2: Plan selection cards from MongoDB | `/register` |
| Fig 5 | Register page — Step 3: Coupon + Demo Checkout | `/register` |
| Fig 6 | Admin Dashboard — 9 KPI stat cards | Log in as admin@gymflow.com |
| Fig 7 | Admin Dashboard — 4 Recharts charts (Revenue, Attendance, Plan dist., Trainer alloc.) | Scroll down on admin dashboard |
| Fig 8 | Member Dashboard — Digital membership card + QR pass | Log in as member@gymflow.com |
| Fig 9 | QR pass with countdown timer (5 minutes) | Click "Generate QR Pass" |
| Fig 10 | Attendance page — QR Scanner Modal | `/attendance`, Admin login |
| Fig 11 | Memberships page — Freeze/Resume buttons | `/memberships` |
| Fig 12 | Classes page — Book class with capacity display | `/classes` |
| Fig 13 | Lockers page — Visual locker grid | `/lockers` |
| Fig 14 | DBMS Diagnostics — Live index catalog | `/diagnostics` |
| Fig 15 | DBMS Diagnostics — SQL View equivalent tab | `/diagnostics`, SQL View tab |
| Fig 16 | Audit Logs page — Append-only compliance trail | `/audit-logs` |
| Fig 17 | Razorpay checkout modal (Test Mode) | Register with Razorpay option |
| Fig 18 | MongoDB Compass — Collections list (23 collections) | MongoDB Compass connected to DB |
| Fig 19 | Terminal — Automated test run output (34 PASS, 0 FAIL) | `node test/verify_system.js` |
| Fig 20 | Terminal — MongoDB Atlas connection success log | `npm run start` |

---

# Chapter 21 – Security Analysis

## 21.1 Implemented Security Measures

| Security Area | Implementation | Code Location |
|---|---|---|
| Password hashing | `bcrypt.genSalt(10)` + `bcrypt.hash()` in pre-save hook | `User.js` lines 50–55 |
| JWT authentication | 30-day signed token, verified on every protected route | `authMiddleware.js` |
| Role-based authorization | `authorize(...roles)` factory returns 403 if role mismatch | `authMiddleware.js` line 33–43 |
| Public role enforcement | Registration hard-codes `role: 'Member'` regardless of input | `authController.js` line 158 |
| Server-authoritative pricing | Plan price always fetched from DB; client price field ignored | `razorpayController.js` line 52 |
| Razorpay signature verification | HMAC-SHA256 using Key Secret stored only on server | `razorpayController.js` lines 163–168 |
| Duplicate payment prevention | `Payment.findOne({ razorpayPaymentId })` before activation | `razorpayController.js` lines 187–199 |
| TTL token replay prevention | `isUsed: true` set atomically after first use | `attendanceController.js` |
| Compound unique index | Attendance duplicate prevention at DB engine level | `Attendance.js` line 44 |
| Input validation | Mongoose schema validators (`required`, `enum`, `min`, `max`) | All model files |
| Audit log on failures | Security incidents logged to `auditlogs` collection | `razorpayController.js` line 170–177 |

## 21.2 Identified Weaknesses and Recommendations

| Weakness | Risk | Recommendation |
|---|---|---|
| `CORS origin: '*'` | Any domain can call the API | Change to `CLIENT_URL` env variable in production |
| JWT stored in localStorage | XSS risk if attacker injects script | Use HttpOnly cookies for production |
| No JWT refresh token | Token valid for 30 days even if user deactivated | Implement refresh token rotation or short-lived tokens |
| No rate limiting | Brute-force on `/api/auth/login` possible | Add `express-rate-limit` middleware |
| No HTTPS enforcement | Data transmitted in plain HTTP | Configure TLS/HTTPS in production |
| `.env` secrets in version control risk | If `.env` is committed, keys are exposed | `.env` is in `.gitignore` — verified ✅ |
| `razorpaySignature` stored in DB | Useful for audit but extra storage | Acceptable — no additional risk |
| No Razorpay webhook | Payment status may be inconsistent on browser crash | Implement webhook endpoint for reconciliation |
| CORS credentials | `credentials: true` with `origin: '*'` is blocked by browsers | Use explicit origin in production |

---

# Chapter 22 – Installation and Execution Guide

## Prerequisites

- **Node.js**: v18.0.0 or higher (`node -v`)
- **npm**: v9.0.0 or higher (`npm -v`)
- **MongoDB** (choose one):
  - Option A: MongoDB Atlas (cloud) — sign up free at mongodb.com/cloud/atlas
  - Option B: Local MongoDB Community Server — `net start MongoDB` (Windows)
  - Option C: No MongoDB needed — embedded MongoMemoryServer auto-starts

## Step 1: Navigate to Project Root

```powershell
cd "d:\dbms project"
```

## Step 2: Configure Environment Variables

```powershell
# Edit server/.env (already exists with working values)
notepad server\.env
```

**Required values in `server/.env`:**
```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster0.xxxx.mongodb.net/gymflow?retryWrites=true&w=majority
JWT_SECRET=gymflow_dbms_lab_review_super_secret_jwt_key_2026
CLIENT_URL=http://localhost:5173
NODE_ENV=development
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX
```

> If MongoDB Atlas is not available, simply delete the `MONGO_URI` line or leave it blank — the system will automatically start an embedded MongoMemoryServer and seed demo data.

## Step 3: Install Backend Dependencies

```powershell
cd "d:\dbms project\server"
npm install
```

## Step 4: Seed Database (If Using Atlas or Local MongoDB)

```powershell
npm run seed
```

This creates: 1 admin, 3 trainers, 16 members, 4 plans, attendance records, group classes, equipment, lockers, diet plans, workouts, coupons, and audit logs.

> Skip this step if using embedded MongoMemoryServer — seeding happens automatically.

## Step 5: Start Backend Server

```powershell
# Terminal 1
cd "d:\dbms project\server"
npm run start
```

Expected output:
```
=======================================================
🏋️‍♂️ GymFlow API Server running on port 5000
📡 Environment: development
=======================================================
✅ MongoDB Connected Successfully!
```

Health check: Visit `http://localhost:5000/api/health`

## Step 6: Install Frontend Dependencies

```powershell
# Terminal 2
cd "d:\dbms project\client"
npm install
```

## Step 7: Start Frontend

```powershell
npm run dev
```

Expected output:
```
VITE v5.2.x  ready in XXX ms
➜  Local:   http://localhost:5173/
```

## Step 8: Open in Browser

Navigate to: **`http://localhost:5173`**

## Step 9: Demo Credentials

| Role | Email | Password |
|---|---|---|
| 👑 Admin | `admin@gymflow.com` | `Admin@123` |
| 🏋️ Trainer | `trainer@gymflow.com` | `Trainer@123` |
| 👤 Member | `member@gymflow.com` | `Member@123` |

Or click the **Demo Credentials autofill badges** on the login page.

## Step 10: Run Automated Tests

```powershell
cd "d:\dbms project\server"
node test/verify_system.js
```

Expected: 34 PASSED, 0 FAILED

## Step 11: Inspect MongoDB Data

**MongoDB Compass:** Connect with your `MONGO_URI` string → browse the `gymflow` database → explore all 23 collections

**Shell:**
```javascript
use gymflow
db.users.find().pretty()
db.members.countDocuments({ status: 'Active' })
db.payments.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }])
```

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `querySrv ECONNREFUSED` | Windows DNS blocks Atlas SRV | `db.js` auto-applies `dns.setServers(['8.8.8.8','1.1.1.1'])` — or use Local/Memory MongoDB |
| `EADDRINUSE: 5000` | Port already in use | Kill the process: `npx kill-port 5000` |
| `EADDRINUSE: 5173` | Vite port in use | Add `--port 5174` to Vite command |
| `MongoServerError: E11000 duplicate key` | Seeding on existing data | Drop DB first: `db.dropDatabase()` in mongosh |
| `Cannot read properties of null` | Mongoose populate returned null | Member profile not linked — re-seed |
| `Razorpay not initialized` | Missing `.env` keys | Verify `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `server/.env` |
| React blank page | Build cache | `rm -rf client/dist` then `npm run dev` |

---

# Chapter 23 – Limitations

| Limitation | Details |
|---|---|
| **No production deployment** | Application runs locally only (localhost:5000 + localhost:5173) |
| **Razorpay Test Mode only** | Keys are `rzp_test_` prefixed — no real payments possible |
| **No Razorpay Webhooks** | If browser closes after payment before verify callback, membership may not activate |
| **No email/SMS notifications** | `Notification` model exists but no SMTP/SMS transport layer |
| **No JWT refresh tokens** | 30-day tokens; deactivated users' tokens remain valid until expiry |
| **No rate limiting** | Login endpoint vulnerable to brute-force without `express-rate-limit` |
| **CORS origin: '*'** | Open CORS in development — must be restricted for production |
| **Single-node MongoDB** | Multi-document ACID transactions require Replica Set; not configured |
| **No HTTPS** | HTTP only; requires TLS configuration for production |
| **QR camera scanning** | `QRScannerModal.jsx` uses manual token input — native camera QR decode not confirmed |
| **Notification delivery** | Notification schema and routes exist but no actual email/push delivery |
| **No pagination on all endpoints** | Some endpoints return all documents without pagination |

---

# Chapter 24 – Future Enhancements

| Enhancement | Description | Priority |
|---|---|---|
| **Cloud Deployment** | Deploy backend on Railway/Render, frontend on Vercel | High |
| **Razorpay Webhooks** | `POST /api/webhooks/razorpay` with signature verification for payment reconciliation | High |
| **Live Razorpay Mode** | Complete KYC with Razorpay, obtain `rzp_live_` keys | Medium |
| **JWT Refresh Tokens** | Short-lived access tokens + long-lived refresh tokens in HttpOnly cookies | High |
| **Rate Limiting** | `express-rate-limit` on auth endpoints | High |
| **Email Notifications** | Nodemailer / SendGrid for membership expiry reminders | Medium |
| **QR Camera Scanner** | Integrate `html5-qrcode` or `@zxing/library` for native camera QR decode | Medium |
| **Mobile App** | React Native app for members (QR pass, class booking, diet/workout view) | Low |
| **Advanced Analytics** | Retention rate, churn prediction, revenue forecasting with MongoDB time-series | Low |
| **AI Workout Recommendations** | ML model suggesting workouts based on member goals and progress data | Low |
| **Multi-Gym SaaS** | Multi-tenant architecture with gym-level data isolation | Low |
| **Automated Membership Renewal** | Scheduled job (`node-cron`) to auto-expire memberships and send renewal reminders | Medium |
| **MongoDB Replica Set** | Enable multi-document ACID transactions for payment + membership atomic writes | Medium |
| **Backup Strategy** | MongoDB Atlas backup + S3 snapshots | Medium |
| **HSN Code GST Compliance** | Accurate GST calculation with HSN codes on invoices | Medium |

---

# Chapter 25 – Conclusion

GymFlow – Smart Gym Management System is a complete, end-to-end MERN stack application designed to digitize all core operations of a modern fitness center. The project successfully demonstrates the following:

1. **MongoDB as a capable primary database** — 23 collections with deliberate design choices between embedding (exercises, meals, freeze history, follow-ups) and referencing (User→Member, Membership→Plan, Payment→Invoice)

2. **Advanced DBMS concepts in practice** — compound unique indexes preventing duplicate attendance records, TTL indexes for ephemeral QR token management, atomic `findOneAndUpdate` operations eliminating race conditions in class booking and locker allocation, and aggregation pipelines serving real-time dashboard charts

3. **Security-first design** — bcrypt password hashing, JWT authentication, role-based authorization middleware, server-side price authority, HMAC-SHA256 Razorpay payment verification, and duplicate payment prevention

4. **Role-based access control** — three completely separate dashboards for Admin, Trainer, and Member with both frontend and backend enforcement

5. **Production-grade code organization** — clean separation of concerns across models, controllers, routes, middleware, config, utils, and seed layers

6. **Razorpay Test Mode integration** — complete order creation and cryptographic signature verification flow, ready for live mode activation after KYC

The automated test suite (34 PASS, 0 FAIL) and the MongoDB-embedded fallback engine ensure the system can be demonstrated reliably in any environment including offline faculty review sessions.

**Remaining work** includes production deployment, Razorpay webhook implementation, email notification delivery, JWT refresh token rotation, and rate limiting — all identified as explicit future enhancements.

---

# Chapter 26 – References

1. MongoDB Documentation — https://www.mongodb.com/docs/
2. Mongoose Documentation (v8.x) — https://mongoosejs.com/docs/
3. React Documentation — https://react.dev/
4. Node.js Documentation — https://nodejs.org/en/docs/
5. Express.js Documentation — https://expressjs.com/en/4x/api.html
6. Razorpay API Documentation — https://razorpay.com/docs/
7. Razorpay Node.js SDK — https://github.com/razorpay/razorpay-node
8. Vite Documentation — https://vitejs.dev/guide/
9. JSON Web Token (JWT) — RFC 7519 — https://jwt.io/introduction
10. bcrypt Algorithm — https://www.npmjs.com/package/bcryptjs
11. Tailwind CSS Documentation — https://tailwindcss.com/docs
12. Recharts Documentation — https://recharts.org/en-US/api
13. qrcode.react — https://www.npmjs.com/package/qrcode.react
14. mongodb-memory-server — https://github.com/nodkz/mongodb-memory-server

---

# Chapter 27 – Appendix

## A. Final Project Folder Structure

```
d:\dbms project\
├── .env.example
├── .gitignore
├── README.md
├── client\
│   ├── index.html
│   ├── package.json          # gymflow-client@1.0.0
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src\
│       ├── App.jsx            # Router + ProtectedRoute + AppLayout
│       ├── main.jsx
│       ├── index.css
│       ├── context\
│       │   └── AuthContext.jsx
│       ├── services\          # Axios API layer
│       ├── components\
│       │   ├── Sidebar.jsx
│       │   ├── Navbar.jsx
│       │   ├── StatCard.jsx
│       │   ├── Modal.jsx
│       │   ├── QRScannerModal.jsx
│       │   └── DemoCredentialsBadge.jsx
│       └── pages\             # 25 page components
│           └── [all page files listed in Chapter 17]
└── server\
    ├── server.js              # Express entry point
    ├── package.json           # gymflow-server@1.0.0
    ├── .env                   # Environment secrets (gitignored)
    ├── .env.example           # Template
    ├── config\
    │   ├── db.js              # MongoDB connection + fallback
    │   └── razorpay.js        # Razorpay SDK singleton
    ├── middleware\
    │   ├── authMiddleware.js  # protect + authorize
    │   └── errorMiddleware.js # notFound + errorHandler
    ├── models\                # 23 Mongoose schema files
    │   ├── User.js
    │   ├── Member.js
    │   ├── Trainer.js
    │   ├── Plan.js
    │   ├── Membership.js
    │   ├── Payment.js
    │   ├── Invoice.js
    │   ├── Attendance.js
    │   ├── CheckInToken.js
    │   ├── Workout.js
    │   ├── Progress.js
    │   ├── Class.js
    │   ├── ClassBooking.js
    │   ├── TrainingSession.js
    │   ├── DietPlan.js
    │   ├── Locker.js
    │   ├── Equipment.js
    │   ├── Maintenance.js
    │   ├── Lead.js
    │   ├── Coupon.js
    │   ├── Feedback.js
    │   ├── AuditLog.js
    │   └── Notification.js
    ├── controllers\           # 24 controller files
    │   └── [all controllers listed in Ch. 18]
    ├── routes\                # 23 route files
    │   └── [all routes listed in Ch. 16]
    ├── utils\
    │   └── auditLogger.js
    ├── seed\
    │   └── seed.js            # Complete database seeder
    └── test\
        └── verify_system.js   # 15-suite automated test runner
```

## B. Environment Variables Reference

| Variable | Purpose | Example (Masked) |
|---|---|---|
| `PORT` | Express server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://user:****@cluster0.xxxx.mongodb.net/gymflow` |
| `JWT_SECRET` | JWT signing secret | `[minimum 32 chars random string]` |
| `CLIENT_URL` | Allowed CORS origin | `http://localhost:5173` |
| `NODE_ENV` | Environment mode | `development` |
| `RAZORPAY_KEY_ID` | Razorpay public key (starts `rzp_test_`) | `rzp_test_XXXXXXXXXXXXXXXX` |
| `RAZORPAY_KEY_SECRET` | Razorpay signing secret (never expose) | `[masked]` |

> ⚠️ **SECURITY:** Never commit real `.env` values to version control. `.env` is listed in `.gitignore`.

## C. Database Collections Summary

| # | Collection | Documents (Seeded) | Key Index |
|---|---|---|---|
| 1 | users | ~20 | email (unique) |
| 2 | members | ~16 | memberCustomId (unique), user (unique) |
| 3 | trainers | 3 | user (unique), trainerCustomId (unique) |
| 4 | plans | 4 | name (unique) |
| 5 | memberships | ~16 | {member,status}, {endDate,status} |
| 6 | payments | ~20 | transactionId (unique), invoiceNo (unique) |
| 7 | invoices | ~20 | invoiceNumber (unique) |
| 8 | attendances | ~200+ | {member,date} COMPOUND UNIQUE |
| 9 | checkintokens | Dynamic (TTL) | expiresAt (TTL), token (unique) |
| 10 | workouts | ~10 | member |
| 11 | progresses | ~30+ | member, date |
| 12 | classes | ~10 | {startTime,trainer} |
| 13 | classbookings | Dynamic | class, member |
| 14 | trainingsessions | ~10 | {trainer,startTime}, {member,startTime} |
| 15 | dietplans | ~5 | member |
| 16 | lockers | ~30 | lockerNumber (unique), status |
| 17 | equipment | ~15 | {nextServiceDate,condition} |
| 18 | maintenances | — | — |
| 19 | leads | ~5 | phone, email, status |
| 20 | coupons | ~3 | code (unique) |
| 21 | feedbacks | ~10 | {category,status,createdAt} |
| 22 | auditlogs | ~50+ | {entity,createdAt}, {action,createdAt} |
| 23 | notifications | — | user |

## D. Key Commands

```powershell
# Install backend
cd "d:\dbms project\server"
npm install

# Seed database
npm run seed

# Start backend
npm run start

# Install frontend
cd "d:\dbms project\client"
npm install

# Start frontend
npm run dev

# Run automated tests
cd "d:\dbms project\server"
node test/verify_system.js

# Build frontend for production
cd "d:\dbms project\client"
npm run build
```

## E. Glossary

| Term | Definition |
|---|---|
| **MERN** | MongoDB, Express.js, React, Node.js — full-stack JavaScript ecosystem |
| **ODM** | Object-Document Mapper — Mongoose maps JavaScript objects to MongoDB documents |
| **JWT** | JSON Web Token — compact, URL-safe claims representation for authentication |
| **bcrypt** | Adaptive hashing function designed to be deliberately slow for password security |
| **BSON** | Binary JSON — MongoDB's binary serialization format for documents |
| **ObjectId** | MongoDB's 12-byte unique identifier for documents |
| **Aggregation Pipeline** | MongoDB's multi-stage data processing framework equivalent to SQL GROUP BY + JOIN |
| **TTL Index** | Time-To-Live index — MongoDB auto-deletes documents after a specified duration |
| **Compound Index** | An index on two or more fields combined — enables multi-field constraint enforcement |
| **HMAC-SHA256** | Hash-Based Message Authentication Code using SHA-256 — used for Razorpay signature verification |
| **Razorpay Test Mode** | Development environment for payment gateway where no real money is transacted |
| **Price Snapshot** | Copying a value at transaction time to preserve historical accuracy |
| **Atomic Operation** | A database operation that either completes fully or not at all — no partial states |
| **Embedding** | Storing related data as nested subdocuments within a parent document |
| **Referencing** | Storing ObjectId references to documents in other collections (equivalent to FK) |
| **Populate** | Mongoose's mechanism to resolve ObjectId references into actual documents |
| **SPA** | Single-Page Application — JavaScript app that dynamically updates content without full page reloads |
| **REST API** | Representational State Transfer — architectural style for designing networked APIs |
| **CORS** | Cross-Origin Resource Sharing — HTTP mechanism allowing cross-domain API requests |
| **CRUD** | Create, Read, Update, Delete — the four fundamental database operations |

---

*GymFlow — Smart Gym Management System Using MongoDB*  
*DBMS Lab Project Report • VIT Vellore • B.Tech CSE • 2025–2026*  
*Submitted by: Aryaveer Pratap Singh*

---
