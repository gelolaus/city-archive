# 🏛️ City Archive Library: Hybrid-Polyglot Database Solution

> **An Enterprise Library Management System engineered for strict ACID transactions, automated penalty tracking, and high-velocity analytics.**

![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20MySQL%20%7C%20MongoDB-blue)
![Course](https://img.shields.io/badge/Course-DATAMA2-success)
![Section](https://img.shields.io/badge/Section-SF241-orange)

## 👥 Group 4: JhunDB Database Solutions

- **Data Architects:** Jonard Bacani, Xander Revelar
- **Database Developers:** Breneth Ananayo, Qelvin Nagales, John Ochoa
- **Documentation Specialists:** Angelo Laus, Andrei Villa

---

## 📖 Executive Summary

The City Archive Library was previously constrained by severe data redundancy, unreliable inventory tracking, and manual workflows. To resolve this, we engineered a highly normalized, **Hybrid-Polyglot database architecture** utilizing **MySQL** for strict ACID transactions and **MongoDB** for high-velocity telemetry data. This enterprise-grade solution automates book circulation, securely enforces Role-Based Access Control (RBAC), and guarantees real-time catalog accuracy with automated "Soft Delete" archival vaults.

## ✨ Core System Features

- **The Hoarder Blocker (Trigger):** Automatically prevents members from borrowing if they reach the 5-book limit.
- **Autonomous Fine Engine (Functions):** Dynamically calculates overdue penalties at ₱20.00/day the moment a book is returned.
- **The Archival Vaults (Triggers & JSON):** Intercepts deleted catalog records and serializes them into schema-less JSON payloads for an immutable audit trail.
- **Telemetry & Analytics (MongoDB):** Passively captures UI interactions and automatically calculates conversion rates using Mongoose `pre-save` hooks.
- **Dual-Layer Security:** Secures endpoints with JSON Web Tokens (JWT) and validates all payloads using Zod schemas.

---

## 🛠️ System Architecture & Tech Stack

- **Relational Database (Core Transactions):** MySQL 8.0+
- **NoSQL Database (Telemetry & Content):** MongoDB
- **Backend Runtime & API:** Node.js, Express.js, TypeScript
- **Frontend Command Center:** React.js, Vite, Tailwind CSS, Axios

---

## 🚀 Quick Start / Deployment Guide

### Phase 1: Prerequisites

Ensure the following engines are installed and running on your local machine:

1. **Node.js** (v18+)
2. **MySQL Server** (v8.0+)
3. **MongoDB Community Server** (running on `localhost:27017`)

### Phase 2: Database Initialization

1. Open your MySQL Client (e.g., MySQL Workbench).
2. Execute the provided `Group4_SF241_DATAMA2_MySQLSchema.sql` script.
3. This script will autonomously build the 3NF schema, establish Triggers/Procedures, and seed the default administrative account.

### Phase 3: Environment Configuration

Create the necessary `.env` files to link the Monorepo to your local databases.

**Backend (`/be/.env`):**

```env
PORT=5000
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=city_archive_library_system
MONGO_URI=mongodb://localhost:27017/city_archive_telemetry
JWT_SECRET=super_secure_academic_secret_key
```

**Frontend (`/fe/.env`):**

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### Phase 4: Bootstrapping the Application

Open two separate terminal windows.

**Terminal 1 (Backend API):**

```bash
cd be
npm install
npm run dev
```

*(The console will verify that both MySQL and MongoDB connection pools are active).* 

**Terminal 2 (Frontend React SPA):**

```bash
cd fe
npm install
npm run dev
```

### Phase 5: System Access

Open your browser and navigate to `http://localhost:5173`. Select the **Librarian / Admin Login** and use the foundational root credentials:

- **Role:** System Administrator
- **Username:** `janel`
- **Password:** `Libro@2026!`

*(Note: It is strictly advised to change this password upon initial system login).* 

---

*Prepared by JhunDB Database Solutions for the DATAMA2 Final Project Defense. 2026.*
