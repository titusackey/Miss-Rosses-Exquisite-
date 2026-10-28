# Miss Roses Exquisite — Project Backlog

This backlog tracks all features, bug fixes, improvements, and tasks for the Miss Roses Exquisite platform.

---

## 📋 Status Key
- 🟡 `Pending` — Scheduled for work
- 🔵 `In Progress` — Currently being developed
- 🟢 `Completed` — Implemented and verified
- 🔴 `Blocked` — Waiting on dependency or clarification

---

## 🎯 Task Items

| ID | Task / Feature | Priority | Status | Date Completed | Details & Verification |
|:---|:---|:---:|:---:|:---:|:---|
| **TASK-01** | Set up the project folder and development environment | High | 🟢 Completed | 2026-10-12 | Folder hierarchy (`website/`, `database/`, `product-images/`, `documentation/`, `backlog/`, `reports/`, `backups/`) established with directives in `GEMINI.md`. |
| **TASK-02** | Build the website homepage and product catalogue | High | 🟢 Completed | 2026-10-12 | High-end luxury storefront with Cormorant Garamond typography, hero banner, category filters, real-time search, and price sorting. |
| **TASK-03** | Add dresses, bangles, and slippers with editable prices and descriptions | High | 🟢 Completed | 2026-10-12 | Comprehensive catalog seeded across dresses, 24K bangles, and artisanal leather slippers with sizes/variants and editable pricing. |
| **TASK-04** | Build secure Super Admin authentication | High | 🟢 Completed | 2026-10-12 | JWT token-based auth with bcrypt-hashed master credentials (`admin@missrosesexquisite.com`), protected admin API middleware and login portal. |
| **TASK-05** | Create product and inventory management | High | 🟢 Completed | 2026-10-12 | Admin CRUD interface for catalog items, stock quantity updates, variant SKUs, and real-time low-stock alerts. |
| **TASK-06** | Implement customer cart and order checkout | High | 🟢 Completed | 2026-10-12 | Slide-out shopping bag, variant selector, quantity adjustment, persistent cart storage, subtotal calculation, and order submission. |
| **TASK-07** | Implement customer location permission and manual address entry | Medium | 🟢 Completed | 2026-10-12 | HTML5 Geolocation API integration with coordinate capture and precision accuracy, plus manual address/landmark entry. |
| **TASK-08** | Configure email and SMS order notifications | Medium | 🟢 Completed | 2026-10-12 | Notification service supporting SMTP email dispatch, SMS API gateway, notification logging, and local simulated logging mode. |
| **TASK-09** | Implement order management and sales reporting | Medium | 🟢 Completed | 2026-10-12 | Super Admin orders table with status updates (Pending, Confivered, Out for Delivery, Delivered), sales revenue metrics, and best-seller analytics. |
| **TASK-10** | Configure and test the database and backups | High | 🟢 Completed | 2026-10-12 | Relational schema in `database/schema.sql`, persistent disk-backed database driver in `src/db.js`, and automated backup utility in `backup.js`. |
| **TASK-11** | Test security, mobile responsiveness, and all major features | High | 🟢 Completed | 2026-10-12 | Fully responsive mobile layouts, input validation, bcrypt password hashing, and clean separation of environment variables. |
| **TASK-12** | Prepare deployment instructions | Medium | 🟢 Completed | 2026-10-12 | Complete instructions in `documentation/deployment-guide.md` covering local PC launch, one-click `START-WEBSITE.bat`, and 24/7 cloud deployment. |

---

## 📝 Backlog Management Rules
1. Whenever a feature is requested but not completed, add it to this file with its **Status**, **Priority**, **Date**, and **Next Action**.
2. When a task is finished, update its status to `🟢 Completed` and log notable details in [CHANGELOG.md](../CHANGELOG.md).
3. Do not remove completed items; keep them documented for auditing and project history.
