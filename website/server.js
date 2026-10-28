/**
 * Miss Roses Exquisite — Main Application Server
 * Serves E-Commerce Storefront, Customer Checkout, Client-Shop Concierge Interaction,
 * Live On-Site Chat with Instant Notifications, Order Tracker, Super Admin Portal, and RESTful APIs
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const Joi = require('joi');

// Load environment variables if present
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const db = require('./src/db');
const notifications = require('./src/notifications');
const { createBackup } = require('./backup');
const seed = require('./seed');

// Run seed immediately to ensure admin & initial products exist
seed();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'miss_roses_exquisite_super_secret_jwt_key_2026';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/product-images', express.static(path.resolve(__dirname, '../product-images')));

// JWT Auth Middleware for Admin Routes
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication token required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Forbidden: Invalid or expired session token.' });
  }
}

// ==============================================================================
// PUBLIC STOREFRONT & CLIENT-SHOP INTERACTION APIs
// ==============================================================================

// 1. Get Categories
app.get('/api/categories', (req, res) => {
  res.json({ categories: db.getCategories() });
});

// 2. Get Products (with category & search filter)
app.get('/api/products', (req, res) => {
  const { category_id, search, sort } = req.query;
  let products = db.getProducts(category_id);

  if (search) {
    const q = search.toLowerCase();
    products = products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.description.toLowerCase().includes(q)
    );
  }

  if (sort === 'price_asc') {
    products.sort((a, b) => a.price - b.price);
  } else if (sort === 'price_desc') {
    products.sort((a, b) => b.price - a.price);
  }

  res.json({ products });
});

// 3. Get Single Product
app.get('/api/products/:id', (req, res) => {
  const product = db.getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  res.json({ product });
});

// 4. Place Customer Order (with location & notifications)
app.post('/api/orders/checkout', async (req, res) => {
  try {
    const { customer, items, payment_method, notes, delivery_fee } = req.body;

    if (!customer || !customer.full_name || !customer.phone || !customer.delivery_address) {
      return res.status(400).json({ error: 'Customer full name, phone number, and delivery address are required.' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty. Please add items before checking out.' });
    }

    const order = db.createOrder({
      customer,
      items,
      payment_method,
      notes,
      delivery_fee: delivery_fee || 0
    });

    // Send notifications (Email & SMS)
    await notifications.sendOrderNotifications(order);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order
    });
  } catch (err) {
    console.error('Order checkout error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// 5. Client Order Tracker (Instant Look Up)
app.get('/api/orders/track/:code', (req, res) => {
  const order = db.getOrderByCode(req.params.code);
  if (!order) {
    return res.status(404).json({ error: 'Order not found. Please check your order code (e.g. MRE-123456).' });
  }
  res.json({ order });
});

// 6. Client Concierge Inquiries
app.post('/api/inquiries', (req, res) => {
  const { name, phone, email, category, message } = req.body;
  if (!name || !phone || !message) {
    return res.status(400).json({ error: 'Name, phone number, and message are required.' });
  }

  const inquiry = db.createInquiry({ name, phone, email, category, message });

  db.logNotification(null, 'Concierge Request', `${name} (${phone})`, `[Inquiry: ${category || 'General'}] ${message.substring(0, 60)}...`, 'Logged');

  res.status(201).json({
    success: true,
    message: 'Your inquiry has been sent to the Miss Roses Exquisite concierge team! We will contact you directly via phone/WhatsApp.',
    inquiry
  });
});

// 7. LIVE ON-SITE CHAT (Client <-> Shop)
app.get('/api/chat/:sessionId', (req, res) => {
  const chat = db.getOrCreateChatSession(req.params.sessionId);
  res.json({ chat });
});

app.post('/api/chat/:sessionId/message', (req, res) => {
  const { sender, senderName, text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Message text is required.' });
  }

  const clientName = senderName || 'Guest Shopper';
  const newMsg = db.addChatMessage(
    req.params.sessionId,
    sender || 'client',
    clientName,
    text.trim()
  );

  // Notify admin when a client posts a message
  if (sender !== 'admin') {
    notifications.notifyAdminOfClientMessage(req.params.sessionId, clientName, text.trim());
  }

  const updatedChat = db.getChatSession(req.params.sessionId);
  res.json({ success: true, message: newMsg, chat: updatedChat });
});

// ==============================================================================
// SUPER ADMIN APIs (Secure)
// ==============================================================================

// Admin Login
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const admin = db.getAdminByEmail(email) || db.getAdminByUsername(email);
  if (!admin) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const isValid = bcrypt.compareSync(password, admin.password_hash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  db.updateAdminLoginTime(admin.id);

  const token = jwt.sign(
    { id: admin.id, email: admin.email, role: admin.role, username: admin.username },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  res.json({
    success: true,
    message: 'Welcome back, Super Admin!',
    token,
    admin: {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role
    }
  });
});

// Admin Products CRUD
app.post('/api/admin/products', authenticateAdmin, (req, res) => {
  try {
    const product = db.createProduct(req.body);
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/admin/products/:id', authenticateAdmin, (req, res) => {
  const updated = db.updateProduct(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Product not found.' });
  res.json({ success: true, product: updated });
});

app.delete('/api/admin/products/:id', authenticateAdmin, (req, res) => {
  db.deleteProduct(req.params.id);
  res.json({ success: true, message: 'Product deleted.' });
});

// Admin Inventory Management
app.put('/api/admin/inventory/:id', authenticateAdmin, (req, res) => {
  const { stock_quantity } = req.body;
  if (stock_quantity === undefined) return res.status(400).json({ error: 'stock_quantity is required.' });
  const updated = db.updateInventoryStock(req.params.id, stock_quantity);
  if (!updated) return res.status(404).json({ error: 'Inventory record not found.' });
  res.json({ success: true, inventory: updated });
});

app.get('/api/admin/inventory/alerts', authenticateAdmin, (req, res) => {
  const alerts = db.getInventoryAlerts();
  res.json({ alerts });
});

// Admin Orders & Status Management
app.get('/api/admin/orders', authenticateAdmin, (req, res) => {
  res.json({ orders: db.getOrders() });
});

app.put('/api/admin/orders/:id/status', authenticateAdmin, (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required.' });
  const updated = db.updateOrderStatus(req.params.id, status);
  if (!updated) return res.status(404).json({ error: 'Order not found.' });
  res.json({ success: true, order: updated });
});

// Admin Inquiries
app.get('/api/admin/inquiries', authenticateAdmin, (req, res) => {
  res.json({ inquiries: db.getInquiries() });
});

app.put('/api/admin/inquiries/:id/reply', authenticateAdmin, (req, res) => {
  const { reply } = req.body;
  if (!reply) return res.status(400).json({ error: 'Reply text is required.' });
  const updated = db.replyInquiry(req.params.id, reply);
  if (!updated) return res.status(404).json({ error: 'Inquiry not found.' });
  res.json({ success: true, inquiry: updated });
});

// Admin Live Chats Management & Interacting with Clients
app.get('/api/admin/chats', authenticateAdmin, (req, res) => {
  res.json({ chats: db.getAllChatSessions() });
});

app.post('/api/admin/chats/:sessionId/reply', authenticateAdmin, (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Reply text is required.' });
  const newMsg = db.addChatMessage(req.params.sessionId, 'admin', 'Super Admin (Miss Roses)', text.trim());
  res.json({ success: true, message: newMsg });
});

// Admin Sales & Reports
app.get('/api/admin/reports/sales', authenticateAdmin, (req, res) => {
  res.json({ report: db.getSalesReport() });
});

// Admin Notification Log
app.get('/api/admin/notifications', authenticateAdmin, (req, res) => {
  res.json({ notifications: db.getNotificationsLog() });
});

// Admin Database Backup Trigger
app.post('/api/admin/database/backup', authenticateAdmin, (req, res) => {
  const backupFile = createBackup();
  if (!backupFile) return res.status(500).json({ error: 'Failed to create backup.' });
  res.json({ success: true, message: 'Backup created successfully!', backupFile });
});

// HTML Page Routes
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🌸 MISS ROSES EXQUISITE — WEBSITE READY`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`👑 Admin Portal: http://localhost:${PORT}/admin`);
  console.log(`======================================================\n`);
});
