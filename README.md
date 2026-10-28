# Miss Roses Exquisite

> E-Commerce platform for Miss Roses Exquisite — featuring exclusive collections of dresses, bangles, and slippers.

---

## 📍 Project Location on Your PC
- **Full Path:** `c:\Users\Nii Bortey\Desktop\Miss Roses Exquisite\` (or inside `management szstem\Miss Roses Exquisite\`)

---

## 📁 Folder Structure

```
Miss Roses Exquisite/
├── website/             # All frontend and backend website source code
├── database/            # Database setup scripts, schema, migrations, backup instructions
├── product-images/      # Product photos for dresses, bangles, and slippers
├── documentation/       # Setup guides, credentials setup, technical docs
├── backlog/             # Backlog file (BACKLOG.md) tracking pending features and fixes
├── reports/             # Inventory, sales, order, and development reports
├── backups/             # Local backup instructions and approved database backups
├── .env.example         # Template for environment variables
├── README.md            # This main project guide
└── CHANGELOG.md         # History of website updates and changes
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher recommended) / Python (v3.10+) or local web runtime.
- SQLite or PostgreSQL / MySQL for persistent storage.

### 1. Opening the Project
Navigate to the project directory:
```powershell
cd "c:\Users\Nii Bortey\Desktop\Miss Roses Exquisite"
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```powershell
cp .env.example .env
```
Open `.env` in your editor and configure your secrets, database credentials, and notification API keys. Never commit your `.env` file to Git or public repositories.

### 3. Running Locally
Run the local development server (setup scripts located in `website/`):
```powershell
cd website
npm install
npm run dev
```

---

## 🛡️ Project & Development Rules
1. **Encapsulation:** All website code and documentation reside inside this folder.
2. **Persistent Records:** Customer data, orders, inventory, and catalog items are backed by a persistent database in `database/`.
3. **Backlog & Changelog Discipline:** All features, bug fixes, and tasks are tracked in [BACKLOG.md](backlog/BACKLOG.md) and recorded in [CHANGELOG.md](CHANGELOG.md).
4. **Security & Secrets:** Real passwords and API tokens must never be hardcoded. Use `.env`.
5. **Backups:** Database backups and restore procedures are maintained in `backups/`.

---

## 🌐 Local Development vs. Production Hosting
- **Local PC Development:** The site and local database run on your PC for development, testing, and administration.
- **Live Online Store:** For customers to visit the store online 24/7 and receive instant email/SMS order alerts while your computer is powered off, the site and database should be deployed to a reliable cloud hosting provider (e.g. Vercel, Render, Railway, AWS, DigitalOcean) with cloud notification services configured.
