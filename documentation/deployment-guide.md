# Miss Roses Exquisite — Deployment & Hosting Guide

This guide details how to launch **Miss Roses Exquisite** both locally on your PC and deploy it live to the cloud for 24/7 global customer access, automatic order processing, and reliable SMS/Email alerts.

---

## 💻 1. Local PC Setup & Running (Offline / Development)

### Prerequisites
- Node.js installed on your PC (v18 or higher recommended). Download from [nodejs.org](https://nodejs.org/).

### Step 1: Open the Project
Open PowerShell or Terminal and navigate to the website folder:
```powershell
cd "c:\Users\Nii Bortey\Desktop\Miss Roses Exquisite\website"
```

### Step 2: Install Dependencies
```powershell
npm install
```

### Step 3: Run the Local Server
```powershell
npm run dev
```

### Step 4: Access the Website
- **Storefront:** [http://localhost:3000](http://localhost:3000)
- **Super Admin Portal:** [http://localhost:3000/admin](http://localhost:3000/admin)
- **Default Super Admin Credentials:**
  - Email: `admin@missrosesexquisite.com`
  - Password: `AdminRose2026!`

---

## ☁️ 2. Production Deployment (24/7 Live Store)

To allow customers to order online when your computer is turned off, deploy the application to a cloud provider.

### Option A: Render / Railway / Heroku (Recommended for Fast Launch)
1. Initialize a Git repository inside `Miss Roses Exquisite/`:
   ```powershell
   git init
   git add .
   git commit -m "Initial launch of Miss Roses Exquisite"
   ```
2. Push your code to GitHub or GitLab.
3. Link the repository to [Render.com](https://render.com) or [Railway.app](https://railway.app):
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Root Directory:** `website`
4. In the cloud dashboard, configure the Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `3000` (or host provided port)
   - `JWT_SECRET`: Generate a random 64-character secret.
   - `SUPER_ADMIN_INITIAL_PASSWORD`: Set a strong private password.
   - `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`: Your live email provider credentials (e.g. Mailgun, SendGrid, Amazon SES).
   - `SMS_API_KEY`: Your Arkesel, Hubtel, or Twilio production SMS token.

### Option B: VPS (DigitalOcean / Linode / AWS EC2)
1. Clone the project onto Ubuntu 22.04 LTS:
2. Install Node.js & Nginx reverse proxy.
3. Use PM2 process manager for continuous 24/7 uptime:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "miss-roses"
   pm2 startup
   pm2 save
   ```
4. Install free SSL with Certbot:
   ```bash
   sudo certbot --nginx -d missrosesexquisite.com
   ```

---

## 🔒 3. Backup & Security Checklist
1. **Never commit `.env`** to public Git repositories.
2. Regularly trigger backups via the Super Admin portal or the command:
   ```powershell
   node backup.js
   ```
3. Backup snapshots are preserved in `Miss Roses Exquisite/backups/`.
