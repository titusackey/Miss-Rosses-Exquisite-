# Changelog

All notable updates and releases for **Miss Roses Exquisite** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.0.2] - 2026-10-28
### Mobile Optimization & Shop Location Update
- Removed VIP complimentary delivery text from top banner and headers.
- Added physical boutique location (**Weija Old Barrier, Accra**) prominently in the top announcement bar, hero trust indicators, concierge direct contact channels, and footer.
- Comprehensive mobile-friendly responsiveness:
  - Responsive 2-column e-commerce grid on mobile phones with touch-friendly cards.
  - Native touch-scrolling horizontal pills for category filtering.
  - Full-width stacked form rows for effortless checkout typing on phones.
  - Mobile cart drawer and chat drawer optimized with non-intrusive floating trigger.
  - Auto-closing mobile navigation drawer upon link clicks.

## [1.0.1] - 2026-10-28
### GitHub Production Deployment
- Initialized and deployed the complete production codebase and assets to GitHub: `https://github.com/titusackey/Miss-Rosses-Exquisite-`.
- Included storefront, admin dashboard, persistent database layer, documentation, and `.gitignore`.

## [1.0.0] - 2026-10-12
### Completed Implementation of Entire Website & Backlog
- **E-Commerce Storefront (`website/public/index.html`, `style.css`, `app.js`):**
  - Luxury branding for Miss Roses Exquisite with Cormorant Garamond typography and rose-gold accents.
  - Interactive catalogue with category filtering (Dresses, Bangles, Slippers), instant live text search, and price sorting.
  - Dynamic product modal with size and variant selector.
  - Interactive slide-out cart drawer with item quantity adjustments and persistent browser storage.
  - GPS location detection permission integration with coordinate pinpointing and fallback manual delivery address entry.
  - Instant order checkout flow with customer receipt and order code generation.
- **Super Admin Portal (`website/public/admin.html`, `admin.js`):**
  - Secure bcrypt authentication and JWT-protected management portal.
  - Complete Product CRUD (Create, Edit price/description/image/badge, Delete).
  - Inventory management with size variant SKUs and low-stock threshold warning alerts.
  - Orders management table with live order status updates (Pending, Confirmed, Out for Delivery, Delivered, Cancelled).
  - Business intelligence analytics dashboard displaying gross sales revenue, fulfilled orders, and best-selling pieces.
  - Real-time notification log auditing all SMS and Email alerts.
  - One-click database backup button generating timestamped snapshots.
- **Backend Architecture & APIs (`website/server.js`, `src/db.js`, `src/notifications.js`):**
  - Express.js REST API with clean endpoint separation.
  - Crash-resilient, persistent database driver with ACID atomic writes.
  - Email (SMTP/transporter) and SMS dispatch service with local simulation logging.
  - Initial seed script (`seed.js`) populating royal dresses, 24K filigree bangles, and artisanal pearl slippers.
- **Project Structure, Rules & Operations:**
  - One-click launcher script [`START-WEBSITE.bat`](file:///c:/Users/Nii%20Bortey/Desktop/Miss%20Roses%20Exquisite/START-WEBSITE.bat).
  - Updated [`documentation/deployment-guide.md`](file:///c:/Users/Nii%20Bortey/Desktop/Miss%20Roses%20Exquisite/documentation/deployment-guide.md) with local PC and 24/7 cloud hosting instructions.
  - Updated [`backlog/BACKLOG.md`](file:///c:/Users/Nii%20Bortey/Desktop/Miss%20Roses%20Exquisite/backlog/BACKLOG.md) reflecting all 12 tasks completed.
