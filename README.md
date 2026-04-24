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
-- In psql terminal:
CREATE DATABASE akebono_cyber_academy;
\q
```

Then run the migration and seed:
```bash
cd server
node db/seed.js           # Creates tables + seeds 20 demo employees
node db/add_test_user.js  # Adds 'tester_admin' for testing (No NPK needed)
```

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

| Employee    | 10001        | password123  |
| Manager     | 10002        | password123  |
| Admin       | admin001     | admin123     |
| Test Admin  | tester_admin | akebono2024  |
| New User    | 10003        | password123  |

> **Note:** The app works in **Demo Mode** even without a backend — just use the credentials above from the Login page demo buttons.

---

## 📁 Project Structure

```
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── pages/          # 12 pages (Login, Dashboard, VN Engine, etc.)
│   │   ├── components/     # Layout, AvatarDisplay, ProtectedRoute
│   │   ├── contexts/       # AuthContext, GameContext
│   │   └── data/chapters/  # VN chapter scripts (JSON)
│
└── server/                 # Node.js + Express backend
    ├── routes/             # auth, users, progress, leaderboard, admin
    ├── middleware/         # JWT auth, role guard
    ├── db/                 # pool, migrations, seed
    └── index.js            # Server entry + Socket.io
```

---

## 🎯 Features

| Feature | Status |
|---------|--------|
| Login with NIK/Password | ✅ |
| Character Setup (name + avatar) | ✅ |
| Employee Dashboard | ✅ |
| VN Engine + Chapter 1 playable | ✅ |
| Typewriter dialogue | ✅ |
| Timed choice countdown | ✅ |
| XP popup animations | ✅ |
| Chapter Result + Confetti | ✅ |
| Leaderboard (podium + table) | ✅ |
| Department bar chart | ✅ |
| Badge collection | ✅ |
| Profile editing | ✅ |
| Admin Dashboard | ✅ |
| Admin User Management | ✅ |
| Bulk CSV/Excel Import | ✅ |
| Admin Reports + Export | ✅ |
| Socket.io real-time updates | ✅ |
| JWT authentication | ✅ |
| Role-based access | ✅ |
| Content-Management Studio | ✅ |

---

## 🎨 Tech Stack

- **Frontend:** React 19 + Vite 7 + Tailwind CSS 3 + Framer Motion + Recharts
- **Backend:** Node.js + Express 4 + Socket.io
- **Database:** PostgreSQL + pg
- **Auth:** JWT + bcryptjs
- **Export:** xlsx + pdfkit
- **Real-time:** Socket.io leaderboard updates

© 2026 Akebono Brake Astra — Cyber Academy
