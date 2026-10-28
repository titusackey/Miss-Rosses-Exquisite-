# Database Guide & Architecture

## Overview
Miss Roses Exquisite uses a persistent relational database to ensure all records (products, inventory levels, customer details, and customer orders) are safely stored on disk and never lost when the browser or server restarts.

## Default Database Setup
- **Development Engine:** SQLite (`database/miss_roses_exquisite.sqlite`) — self-contained, requiring zero external server setup on your PC.
- **Production Engine (Recommended):** PostgreSQL / MySQL when deployed to a 24/7 web host.

## Schema Overview
1. **`admins`**: Super Admin accounts with bcrypt-hashed passwords and session timestamps.
2. **`categories`**: Product classifications (`Dresses`, `Bangles`, `Slippers`).
3. **`products`**: Item titles, slugs, descriptions, price, category_id, is_active, created_at.
4. **`inventory`**: Size/variant attributes, stock quantity, low-stock threshold alert levels.
5. **`customers`**: Customer name, phone number, email, delivery address, GPS/coordinates (if allowed).
6. **`orders`**: Order tracking ID, customer_id, total amount, payment status, fulfillment status, delivery notes.
7. **`order_items`**: Line items per order linking product_id, quantity, unit price.
