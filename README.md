# 🛡️ Akebono Cyber Academy — Visual Novel Security Awareness

> A AAA-quality interactive Visual Novel-style security awareness platform for Akebono Brake Astra employees.

![Tech Stack](https://img.shields.io/badge/Frontend-React%20%2B%20Vite%20%2B%20Tailwind-blue)
![Backend](https://img.shields.io/badge/Backend-Node%20%2B%20Express%20%2B%20PostgreSQL-green)
![Real-time](https://img.shields.io/badge/Realtime-Socket.io-orange)

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- PostgreSQL 14+

### 1. Setup PostgreSQL Database

```sql
-- In psql terminal or your PostgreSQL client:
CREATE DATABASE akebono_cyber_academy;
\q
```

Then initialize the database schema, run migrations, seed visual novel scenes, and set up test accounts with a single command:
```bash
cd server
npm run db:init
```

This single master command automates the entire database setup:
- 📦 Runs all SQL migrations sequentially (`001_init.sql` through `006_pretest.sql`).
- 🎭 Seeds visual novel characters, expressions, backgrounds, and settings.
- 📖 Compiles and links Chapter 1 & Chapter 2 dialogue scenes, choices, and consequences.
- 👤 Provisions all default Sunfish demo and test employee/admin accounts.

### 2. Configure Server

```bash
cd server
cp .env.example .env
# Edit .env — set DB_PASSWORD to your PostgreSQL password
```

### 3. Start Backend

```bash
cd server
npm run dev
# Server runs on http://localhost:3001
```

### 4. Start Frontend

```bash
cd client
npm run dev
# App runs on http://localhost:5173
```

---

## 🎮 Demo Credentials

| Role | Username / NPK | Password |
|---|---|---|
| Employee | `10001` | `password123` |
| Manager | `10002` | `password123` |
| Admin | `admin001` | `admin123` |
| Test Admin | `tester_admin` | `akebono2024` |
| New User | `10003` | `password123` |

> 💡 **Note:** The app works in **Demo Mode** even without a backend — just click the demo login shortcuts directly on the Login page.

---

## 📁 Project Structure

```
├── client/                     # React + Vite frontend
│   ├── src/
│   │   ├── pages/              # App Pages
│   │   │   ├── PretestPage.jsx # [NEW] Employee Security Pretest
│   │   │   ├── ELearningPage.jsx # Security E-Learning Portal
│   │   │   └── admin/
│   │   │       ├── AdminPretestPage.jsx # [NEW] Pretest results & metrics
│   │   │       └── cms/
│   │   │           └── BadgesTab.jsx    # [NEW] Badge configurations & visual studio
│   │   ├── components/         # GuidedTour, Layout, OnboardingGuide, ProtectedRoute
│   │   ├── contexts/           # AuthContext, GameContext
│   │   └── data/chapters/      # VN chapter scripts (JSON)
│
└── server/                     # Node.js + Express backend
    ├── routes/                 # API Endpoints
    │   ├── preTest.js          # [NEW] Pretest answers, submissions, and metrics API
    │   ├── elearning.js        # [NEW] E-Learning module operations and video streams
    │   └── cms.js              # Story Flow & Chapter Studio backend
    ├── middleware/             # JWT auth, role guard
    ├── db/                     # pool, seeds, and schema
    │   └── migrations/         # [NEW] SQL Migration files (001_init.sql to 006_pretest.sql)
    └── scripts/                # Refactored Utility & Administrative scripts
```

---

## 🎯 Features

| Feature | Status | Description |
|---------|--------|-------------|
| Login with NIK/Password | ✅ | Secure authentication with role redirection |
| Character Setup | ✅ | Custom avatar picking and name inputs |
| Employee Dashboard | ✅ | Stats, progress, daily streaks, and quick links |
| **Pretest Assessment** | ✅ | Interactive pretest portal with dynamic evaluations & admin reports |
| **E-Learning Hub** | ✅ | Course modules, progress trackers, video lessons & CMS editor integration |
| VN Engine & Playback | ✅ | Typewriter dialogues, timed choices, cinematic transitions, character emotions |
| XP & Streak Systems | ✅ | XP pops, streak rewards, and user engagement trackers |
| Leaderboard & Stats | ✅ | Podium visualizations, department bar charts, real-time Socket.io updates |
| **CMS Badges Tab** | ✅ | Visual studio tab to track, assign, and customize awards and badges |
| Content-Management Studio | ✅ | Reorder roadmap nodes (drag-n-drop), modify story flows, manage scenes |
| Admin / Super-Admin Portal | ✅ | Employee database management, bulk excel imports, system controls, CSV reports |

---

## 🎨 Tech Stack

- **Frontend:** React 19 + Vite 7 + Tailwind CSS 3 + Framer Motion + Recharts
- **Backend:** Node.js + Express 4 + Socket.io
- **Database:** PostgreSQL + pg client
- **Auth:** JWT + bcryptjs
- **Export:** xlsx + pdfkit
- **Real-time:** Socket.io live synchronization

© 2026 Akebono Brake Astra — Cyber Academy
