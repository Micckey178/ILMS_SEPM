# ILMS — Intelligent Laboratory Management System
## Multi-Laboratory Inventory, Asset, Practical & Safety Management Platform

> **Enterprise Full-Stack Application • Firebase Backend • Responsive Mobile PWA • Downloadable Distribution**

ILMS (Intelligent Laboratory Management System) is an enterprise-grade academic, research, and engineering laboratory administration platform. It unifies multi-disciplinary laboratory facilities (Physics, Chemistry, Biology, Computer Science, Electronics, Mechanical, Civil, Biotechnology) with certified vendor procurement, real-time scheduling, practical attendance tracking, equipment calibration, and OSHA/EHS incident monitoring.

---

## 🌟 Key Features & Functional Modules

### 1. Unified Schedule & Schedule Planner
- **Internal Scheduling Engine:** Uses actual timestamps, system timezones, and Firestore records (strictly independent of third-party calendar mandates).
- **Multi-View Timetable:** Month, Week, Day, and chronological Agenda list views.
- **Disciplinary Filter Bar:** One-click filtering across Physics, Chemistry, Biology, Computer Science, Electronics, Mechanical, Civil, Biotechnology, and General Laboratories.
- **Event Classification:** Practical classes, faculty lecture sessions, workstation reservations, calibration appointments, and EHS safety audits.
- **Export Capabilities:** Download standards-compliant iCalendar (`.ics`) schedules anytime.

### 2. Faculty Attendance Management Module
- **Direct Practical Tracking:** Select assigned laboratory, class section, and scheduled practical session.
- **Live Participation Metrics:** Real-time calculation of Present, Absent, Late, Excused, and Total Attendance Rate (%).
- **Authorized Audit Corrections:** Prevent unauthorized duplicate entries; track correction reasons, timestamps, and faculty signatures.
- **Accreditation Ready:** Export official attendance ledgers to CSV for university registrar compliance (75% minimum participation enforcement).

### 3. Certified Vendor Directory & Procurement Portal
- **Institutional Marketplace:** College-approved directory of certified suppliers for chemical reagents, analytical apparatus, electronic modules, and safety PPE.
- **Verification Governance:** Strict distinction between *Registered*, *Documents Pending*, *Verified*, *Expired*, and *Suspended* statuses. Only authorized administrators can certify vendors.
- **Multi-Tier Requisition Lifecycle:** Product Selection → Purchase Request → Department Review → Formal Approval → Purchase Order (PO) Issuance → Goods Physical Receipt → Automated Universal Inventory Stock Credit.
- **Self-Approval Safeguards:** Users cannot approve their own financial purchase requests.

### 4. Interactive Clickable Reports & Dark Incident Cards
- **Clickable Executive Reports:** Low Stock & Material Depletion, Equipment Health & Availability, Faculty Attendance Audit, and Maintenance SLA Compliance.
- **Exploratory Modals:** Inspect calculation formulas, data sources, quantitative KPIs, raw data breakdowns, and recommended institutional actions.
- **Dark Incident Card System (`#10182B`):** High-contrast OSHA/EHS incident cards displaying severity indicators (Critical, High, Medium, Low), immediate containment actions, resolution timeline, and authorized technician sign-off.

### 5. Multi-Role Dashboards & Role-Based Access Control (RBAC)
- **Administrator Dashboard:** Cross-campus KPI telemetry, total computer lab workstation health, low-stock alerts, pending user approvals, and compliance overview.
- **Lab Manager Dashboard:** Assigned laboratory roster, staff scheduling, booking queue, stock alerts, and incident resolution.
- **Faculty Dashboard:** Assigned practical sessions, attendance compliance tracking, experiment records, and workstation reservations.
- **Technician Dashboard:** Issue & return loans, overdue checkouts, preventative maintenance intervals, calibration stickers, and QR scanning.
- **Student Dashboard:** Enrolled practical timetable, attendance percentage, active equipment loans, and self-service reservation requests.

### 6. Laboratory Selector & Management
- **Top-Right Navigation Selector:** Displays the currently active laboratory and type with swift search and switching.
- **Facility Cards:** Displays live resource counts (working computers for IT labs, apparatus counts for scientific labs) with deep-dive inspection tabs.

---

## 📦 How to Run on Another Windows Computer

### Quick Setup (Automated via Script)
1. Extract `ILMS-Complete-Source.zip` into any folder on the computer.
2. Double-click `setup-windows.bat`:
   - Automatically checks for Node.js (`v18+` or `v20+`).
   - Copies `.env.example` to `.env` if not already present.
   - Installs all dependencies cleanly using `package-lock.json`.
   - Runs the automated validation test suite.
   - Launches the web application at `http://localhost:5173` in your default browser.
3. For subsequent launches, simply double-click `run-windows.bat`.

### Manual Setup via Terminal
```bash
# 1. Unzip the package and enter directory
cd ILMS_SEPM

# 2. Copy environment file (pre-configured for local transactional fallback)
cp .env.example .env

# 3. Install dependencies
npm install

# 4. Run automated test suite
npm test

# 5. Launch development server
npm run dev
```

---

## 🔌 Firebase Backend Configuration & Deployment

ILMS features a **Dual-Engine Architecture**:
- **Live Firebase Engine:** Full integration with Firebase Auth, Cloud Firestore, Cloud Storage, and Cloud Functions.
- **Local Transactional Fallback Engine:** Pre-seeded out of the box with 7+ multi-disciplinary laboratories, inventory items, equipment, and audit logs. Allows full functionality without immediate cloud credentials.

### Step-by-Step Firebase Setup:
1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. Under **Build > Authentication**, enable the **Email/Password** sign-in provider.
3. Under **Build > Firestore Database**, click **Create Database** (Start in Production Mode).
4. Under **Build > Storage**, enable Cloud Storage.
5. In Project Settings, create a Web App and copy your credentials into `.env`:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef
```

### Deploying Security Rules & Cloud Functions:
```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Associate project
firebase use your-project-id

# Deploy Firestore and Storage security rules
firebase deploy --only firestore:rules,storage

# Deploy Cloud Functions
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

### Creating Your First Administrator Account Securely:
1. Open the application and click **Create Account** on the login page.
2. Fill out your details (name, email, password) and select `Administrator` as requested role.
3. Because public registration assigns a safe `pending` state, open the Firebase Console:
   - Go to **Firestore > users collection**.
   - Find your user document and update: `role = "admin"` and `status = "active"`.
4. Sign in with your administrator account. You now have access to `/users` to approve faculty, managers, and technicians directly from the UI.

---

## 📱 Mobile Experience & PWA Installation

ILMS is a certified Progressive Web Application (PWA):
- **Desktop (Chrome/Edge):** Click the install icon in the URL address bar or the "Install App" button in the navigation header.
- **Android:**
  1. Open the application URL in Google Chrome on your phone.
  2. Tap the browser menu (three dots) and select **Install app** or **Add to Home screen**.
  3. The app will launch in standalone full-screen mode with native mobile bottom navigation.
- **iOS:** Open in Safari, tap the Share button, and select **Add to Home Screen**.

---

## 🧪 Testing & Production Build

### Running Automated Test Suite
```bash
npm test
```
Validates:
- Role-based authorization rules (students blocked from stock adjustments).
- Atomic stock receipts, consumptions, and negative-stock balance prevention.
- Concurrency-safe workstation and equipment booking conflict detection.
- Equipment checkout and condition sign-off.
- Self-approval governance restrictions in procurement.
- Faculty practical attendance recording and correction audit logging.
- Safe user onboarding and admin approval workflows.
- Certified vendor accreditation verification rules.

### Compiling Production Build
```bash
npm run build
```
Build output is generated cleanly into the `dist/` directory ready for deployment on Firebase Hosting, Vercel, Netlify, or any standard HTTP web server.

---

## 🛠️ Technology Stack
- **Frontend Core:** React 19, TypeScript, Vite
- **Styling & Design System:** Tailwind CSS, Custom Theme Tokens (`#9333EA`, `#A855F7`, `#4F7DFF`, `#10182B`, `#F7F7FC`)
- **Icons & UI:** Lucide React, Glassmorphism, Rounded Cards
- **Routing & Forms:** React Router v7, React Hook Form
- **Charts:** Recharts
- **Testing:** Vitest, Testing Library
- **Backend:** Firebase Authentication, Cloud Firestore, Cloud Storage, Cloud Functions (Node.js 20)
