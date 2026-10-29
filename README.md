# ILMS — Multi-Laboratory Inventory and Lab Management System

> **Enterprise Full-Stack Web App • Firebase Backend • Installable Mobile PWA • Capacitor Android Packaging Ready**

ILMS is a comprehensive, secure, multi-laboratory inventory, asset, booking, and safety management platform built for universities, research institutes, and engineering facilities. It unifies operations across scientific, computing, mechanical, civil, and specialized research laboratories under one cohesive platform.

---

## 🏛️ System Architecture

ILMS implements a **Three-Layer Multi-Laboratory Architecture**:

1. **Layer A — Shared Platform:**
   - Universal inventory tracking with movement ledgers and negative stock prevention.
   - Equipment asset registry with maintenance blocking and status tracking.
   - Concurrency-safe equipment booking and lab scheduling calendar.
   - Equipment checkout (Issue & Return) with physical inspection sign-offs.
   - Maintenance, calibration tracking, and service unlock workflows.
   - Multi-level procurement and purchase requisition approvals.
   - Laboratory safety inspection and hazard incident tracking.
   - Live telemetry dashboard and immutable compliance audit logs.
   - Printable QR labels and camera-based barcode/QR scanning.

2. **Layer B — Specialized Laboratory Modules:**
   - **Physics:** Optical tables, Michelson interferometers, laser safety class (Class 3R), experiment observation protocols.
   - **Chemistry:** Chemical inventory, CAS registry numbers, GHS hazard classification (Corrosive, Flammable, Toxic), PubChem SDS linkages, fume hood face-velocity monitoring.
   - **Biology:** Specimen registry, -80°C ultra-low temperature cryo-storage, BSL-2 protocol containment.
   - **Computer Science & IT:** AI GPU server cluster (NVIDIA DGX Station A100), software license seat management, network hardware.
   - **Electronics & Electrical:** Microcontroller kits (ESP32-S3, STM32), component consumption, ESD workbench rework stations.
   - **Mechanical Engineering:** Haas 5-axis CNC machining centers, spindle run hour counters, cutting tool crib.
   - **Civil Engineering:** Universal Testing Machine (UTM 1000kN compression frame), geotechnical triaxial shear apparatus, Leica total stations.
   - **Biotechnology:** Tuttnauer autoclave sterilization logs, Sartorius 5L bioreactor fermentation monitoring.
   - **Additional Modules:** Environmental Science, Automobile Engineering, Medical Education, Agricultural Science.

3. **Layer C — Configurable Laboratory Scope & RBAC:**
   - Role-Based Access Control: `admin`, `labManager`, `faculty`, `technician`, `student`.
   - Dynamic laboratory switching with authorized access scopes.
   - Real-time online/offline network detection and responsive mobile navigation.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js `v20+` or `v24+`
- npm `v10+` or `v11+`

### 1. Installation
Clone the workspace and install project dependencies:
```bash
npm install
```

### 2. Local Development Server
Launch the development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Running Automated Tests
Execute the Vitest automated test suite:
```bash
npm test
```
The test suite validates:
- Role-based permissions (students blocked from inventory creation).
- Atomic stock movements and negative-stock balance prevention.
- Concurrency-safe equipment booking and overlapping slot collision prevention.
- Maintenance-blocked equipment reservation rejection.
- Issue and return workflows with condition sign-offs.
- Procurement self-approval restrictions.
- Real-time dashboard analytics aggregation.

### 4. Production Build
Generate the production-optimized static bundle:
```bash
npm run build
```
Output is compiled cleanly into the `dist/` directory.

---

## 🔌 Firebase Backend Integration

ILMS features a **Dual-Engine Architecture**:
- **Live Firebase Mode:** Connects to real Firebase Authentication, Cloud Firestore, Cloud Storage, and Cloud Functions.
- **Resilient Persistent Engine (Default Demo Mode):** In development or when Firebase credentials are not yet configured, ILMS runs seamlessly out of the box using a browser-persisted transactional engine pre-seeded with complete data for 7+ laboratories, allowing full end-to-end testing without external setup.

### Connecting Your Real Firebase Project:

1. Create a Firebase project at the [Firebase Console](https://console.firebase.google.com/).
2. Enable:
   - **Authentication** (Email/Password provider).
   - **Cloud Firestore** (Production mode).
   - **Cloud Storage** (Default bucket).
   - **Cloud Functions** (Node.js 20).
3. Copy your Web App config credentials into `.env`:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=1:...
```
4. Deploy Firestore Rules and Indexes:
```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```
5. Deploy Cloud Functions:
```bash
cd functions
npm install
npm run deploy
```

### Using Local Firebase Emulators:
```bash
# Start Firebase Emulator Suite
firebase emulators:start

# Set in .env:
VITE_USE_FIREBASE_EMULATORS=true
```

---

## 📱 Mobile App (PWA) & Installation Instructions

ILMS is engineered as a fully compliant, installable **Progressive Web App (PWA)**:
- **Standalone Display Mode:** Runs full-screen without browser address bars on Android, iOS, and Desktop.
- **Service Worker (`public/sw.js`):** Pre-caches the application shell and static assets.
- **Offline Protection:** Displays a branded offline fallback screen (`public/offline.html`) if connection drops. Critical write operations (approvals, stock decrements) are protected from unsynchronized conflicts.
- **Real-Time Network Status:** Real-time Online / Offline status badge in the navigation bar.

### How to Install on Android:
1. Open ILMS in Google Chrome on your Android smartphone.
2. Either click the **"Install App"** button in the top navigation bar or tap browser menu (**⋮**) -> **"Install App"** (or **"Add to Home screen"**).
3. The ILMS app icon will appear on your device's home screen and app drawer.

### How to Install on iOS (iPhone / iPad):
1. Open ILMS in Safari.
2. Tap the **Share** button (box with upward arrow).
3. Scroll down and tap **"Add to Home Screen"**.

### How to Install on Desktop (Chrome / Edge):
1. In Google Chrome or Microsoft Edge, look for the install icon in the URL bar (or click **"Install App"** in the ILMS navigation bar).
2. Click **Install**. ILMS opens as a dedicated desktop application window.

---

## 🤖 Optional Android APK Generation via Capacitor

To produce a native Android `.apk` or `.aab` package:

1. Install Capacitor CLI and Android platform:
```bash
npm install -D @capacitor/cli @capacitor/core @capacitor/android --legacy-peer-deps
```
2. Initialize and add the Android project:
```bash
npx cap init ILMS edu.institution.ilms --web-dir dist
npm run build
npx cap add android
```
3. Sync build assets:
```bash
npx cap sync android
```
4. Open the project in Android Studio:
```bash
npx cap open android
```
5. In Android Studio:
   - Select **Build** -> **Build Bundle(s) / APK(s)** -> **Build APK(s)** for a debug APK.
   - For a production release, select **Generate Signed Bundle / APK** and supply your institution's release keystore credentials.

---

## 👥 Demo User Profiles & Quick Role Switcher

For instant testing, ILMS provides a built-in role switcher in the top navigation bar:

| Role | Demo User | Permissions & Scope |
| :--- | :--- | :--- |
| **Admin** | `Dr. Sarah Jenkins` | Full platform access, laboratory registry, multi-department reports, user role administration |
| **Lab Manager** | `Prof. Marcus Vance` | Chemistry lab manager, purchase approvals, equipment status locks, booking authorizations |
| **Senior Technician** | `Elena Alvarez` | Multi-lab technician (Chem & Physics), inventory movements, equipment issue/return sign-offs, maintenance completion |
| **Faculty / Researcher** | `Dr. Kavita Raman` | Equipment booking reservations, research protocols, experiment logbooks |
| **Student** | `Alex Thorne` | Equipment reservation requests, borrower loans viewing, restricted administrative access |

---

## 🔒 Security & Data Integrity Controls

- **Negative-Stock Prevention:** Stock movements verify that `currentQuantity + changeAmount >= 0`. Deductions that exceed available stock are blocked.
- **Booking Conflict Engine:** Prevents double-booking overlapping time windows for the same equipment asset.
- **Maintenance Block Enforcement:** Instruments marked as `MAINTENANCE_BLOCKED` or `UNDER_MAINTENANCE` cannot be booked until signed off by a technician.
- **Procurement Self-Approval Block:** Lab Managers cannot approve their own purchase requisitions, enforcing strict separation of duties.
- **Tamper-Evident Audit Ledger:** All inventory movements, asset condition changes, and approval decisions write immutable audit logs with user IDs and timestamps.
- **Firestore Security Rules:** `firestore.rules` enforces authentication, role verification, and laboratory scoping on all database collections.
