/**
 * Miss Roses Exquisite — Persistent Database Driver
 * Supports persistent file-backed JSON/WAL mode with atomic writes,
 * live on-site chat sessions, messages, inquiries, and orders.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const BUNDLED_DB_FILE = path.resolve(__dirname, '../../database/miss_roses_exquisite.json');
const DB_DIR = isServerless ? path.join('/tmp', 'database') : path.resolve(__dirname, '../../database');
const DB_FILE = isServerless ? path.join(DB_DIR, 'miss_roses_exquisite.json') : BUNDLED_DB_FILE;
const SCHEMA_FILE = path.join(DB_DIR, 'schema.sql');

try {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('DB directory initialization note:', e.message);
}

// Initial state template
const INITIAL_DB = {
  categories: [
    { id: 1, name: 'Dresses', slug: 'dresses', description: 'Exquisite evening wear, casual silhouettes, and ceremonial dresses.', icon: 'fa-female' },
    { id: 2, name: 'Bangles', slug: 'bangles', description: 'Handcrafted luxury, gold-plated, and beaded royal bangles.', icon: 'fa-ring' },
    { id: 3, name: 'Slippers', slug: 'slippers', description: 'Artisanal leather slides, mules, and embellished comfort slippers.', icon: 'fa-shoe-prints' }
  ],
  products: [],
  inventory: [],
  admins: [],
  customers: [],
  orders: [],
  order_items: [],
  notifications_log: [],
  inquiries: [],
  reviews: [],
  live_chats: [] // Live on-site client-shop chat threads
};

class PersistentDatabase {
  constructor() {
    this.init();
  }

  init() {
    if (isServerless && !fs.existsSync(DB_FILE) && fs.existsSync(BUNDLED_DB_FILE)) {
      try {
        fs.copyFileSync(BUNDLED_DB_FILE, DB_FILE);
      } catch (err) {
        console.warn('Could not copy bundled DB to /tmp, will read or use initial:', err.message);
      }
    }

    const sourceFile = fs.existsSync(DB_FILE) ? DB_FILE : (fs.existsSync(BUNDLED_DB_FILE) ? BUNDLED_DB_FILE : null);

    if (!sourceFile) {
      this.data = JSON.parse(JSON.stringify(INITIAL_DB));
      this.persist();
      console.log('✅ Persistent Database created at:', DB_FILE);
    } else {
      try {
        const raw = fs.readFileSync(sourceFile, 'utf8');
        this.data = JSON.parse(raw);
        // Ensure collections exist
        if (!this.data.inquiries) this.data.inquiries = [];
        if (!this.data.reviews) this.data.reviews = [];
        if (!this.data.live_chats) this.data.live_chats = [];
      } catch (err) {
        console.error('Error loading DB file, restoring backup or initial:', err);
        this.data = JSON.parse(JSON.stringify(INITIAL_DB));
        this.persist();
      }
    }
  }

  persist() {
    try {
      const tempPath = DB_FILE + '.tmp';
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Persistence error:', err);
    }
  }

  // Categories
  getCategories() {
    return this.data.categories || [];
  }

  // Products
  getProducts(categoryId = null) {
    let prods = this.data.products || [];
    if (categoryId) {
      prods = prods.filter(p => p.category_id === parseInt(categoryId, 10));
    }
    return prods.map(p => {
      const inv = (this.data.inventory || []).filter(i => i.product_id === p.id);
      const totalStock = inv.reduce((sum, item) => sum + (item.stock_quantity || 0), 0);
      const category = (this.data.categories || []).find(c => c.id === p.category_id);
      const prodReviews = (this.data.reviews || []).filter(r => r.product_id === p.id);
      const avgRating = prodReviews.length > 0 
        ? (prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length).toFixed(1) 
        : '5.0';
      return { 
        ...p, 
        inventory: inv, 
        total_stock: totalStock, 
        category_name: category ? category.name : '',
        review_count: prodReviews.length,
        avg_rating: avgRating
      };
    });
  }

  getProductById(id) {
    const p = (this.data.products || []).find(prod => prod.id === parseInt(id, 10));
    if (!p) return null;
    const inv = (this.data.inventory || []).filter(i => i.product_id === p.id);
    const totalStock = inv.reduce((sum, item) => sum + (item.stock_quantity || 0), 0);
    const category = (this.data.categories || []).find(c => c.id === p.category_id);
    const prodReviews = (this.data.reviews || []).filter(r => r.product_id === p.id);
    const avgRating = prodReviews.length > 0 
      ? (prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length).toFixed(1) 
      : '5.0';
    return { 
      ...p, 
      inventory: inv, 
      total_stock: totalStock, 
      category_name: category ? category.name : '',
      reviews: prodReviews,
      avg_rating: avgRating
    };
  }

  createProduct(item) {
    const nextId = (this.data.products || []).reduce((max, p) => Math.max(max, p.id || 0), 0) + 1;
    const newProduct = {
      id: nextId,
      category_id: parseInt(item.category_id, 10),
      name: item.name,
      slug: item.slug || item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + nextId,
      description: item.description || '',
      price: parseFloat(item.price) || 0,
      compare_price: item.compare_price ? parseFloat(item.compare_price) : null,
      image_url: item.image_url || '/images/placeholder.jpg',
      badge: item.badge || '',
      is_featured: item.is_featured ? 1 : 0,
      is_active: item.is_active !== undefined ? (item.is_active ? 1 : 0) : 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.data.products.push(newProduct);

    const variants = item.variants && Array.isArray(item.variants) && item.variants.length > 0 
      ? item.variants 
      : [{ variant_name: item.variant_name || 'Standard', stock_quantity: parseInt(item.stock_quantity || 10, 10) }];

    variants.forEach(v => {
      const invNextId = (this.data.inventory || []).reduce((max, i) => Math.max(max, i.id || 0), 0) + 1;
      this.data.inventory.push({
        id: invNextId,
        product_id: newProduct.id,
        variant_name: v.variant_name || 'Standard',
        stock_quantity: parseInt(v.stock_quantity || 0, 10),
        low_stock_threshold: parseInt(v.low_stock_threshold || 3, 10),
        sku: v.sku || `MRE-${newProduct.id}-${v.variant_name || 'STD'}`.toUpperCase(),
        updated_at: new Date().toISOString()
      });
    });

    this.persist();
    return this.getProductById(newProduct.id);
  }

  updateProduct(id, updates) {
    const idx = (this.data.products || []).findIndex(p => p.id === parseInt(id, 10));
    if (idx === -1) return null;

    const current = this.data.products[idx];
    this.data.products[idx] = {
      ...current,
      name: updates.name !== undefined ? updates.name : current.name,
      category_id: updates.category_id !== undefined ? parseInt(updates.category_id, 10) : current.category_id,
      description: updates.description !== undefined ? updates.description : current.description,
      price: updates.price !== undefined ? parseFloat(updates.price) : current.price,
      compare_price: updates.compare_price !== undefined ? (updates.compare_price ? parseFloat(updates.compare_price) : null) : current.compare_price,
      image_url: updates.image_url !== undefined ? updates.image_url : current.image_url,
      badge: updates.badge !== undefined ? updates.badge : current.badge,
      is_featured: updates.is_featured !== undefined ? (updates.is_featured ? 1 : 0) : current.is_featured,
      is_active: updates.is_active !== undefined ? (updates.is_active ? 1 : 0) : current.is_active,
      updated_at: new Date().toISOString()
    };

    if (updates.stock_quantity !== undefined) {
      const inv = (this.data.inventory || []).find(i => i.product_id === current.id);
      if (inv) {
        inv.stock_quantity = parseInt(updates.stock_quantity, 10);
        inv.updated_at = new Date().toISOString();
      }
    }

    this.persist();
    return this.getProductById(current.id);
  }

  deleteProduct(id) {
    const prodId = parseInt(id, 10);
    this.data.products = (this.data.products || []).filter(p => p.id !== prodId);
    this.data.inventory = (this.data.inventory || []).filter(i => i.product_id !== prodId);
    this.persist();
    return true;
  }

  // Inventory
  updateInventoryStock(inventoryId, newStock) {
    const inv = (this.data.inventory || []).find(i => i.id === parseInt(inventoryId, 10));
    if (!inv) return null;
    inv.stock_quantity = parseInt(newStock, 10);
    inv.updated_at = new Date().toISOString();
    this.persist();
    return inv;
  }

  getInventoryAlerts() {
    const alerts = [];
    (this.data.inventory || []).forEach(inv => {
      if (inv.stock_quantity <= inv.low_stock_threshold) {
        const prod = (this.data.products || []).find(p => p.id === inv.product_id);
        if (prod) {
          alerts.push({
            inventory_id: inv.id,
            product_id: prod.id,
            product_name: prod.name,
            variant_name: inv.variant_name,
            stock_quantity: inv.stock_quantity,
            low_stock_threshold: inv.low_stock_threshold,
            status: inv.stock_quantity === 0 ? 'Out of Stock' : 'Low Stock'
          });
        }
      }
    });
    return alerts;
  }

  // Admin Auth
  getAdminByEmail(email) {
    return (this.data.admins || []).find(a => a.email.toLowerCase() === email.toLowerCase());
  }

  getAdminByUsername(username) {
    return (this.data.admins || []).find(a => a.username.toLowerCase() === username.toLowerCase());
  }

  createAdmin(username, email, passwordHash, role = 'super_admin') {
    const nextId = (this.data.admins || []).reduce((max, a) => Math.max(max, a.id || 0), 0) + 1;
    const newAdmin = {
      id: nextId,
      username,
      email,
      password_hash: passwordHash,
      role,
      last_login: null,
      created_at: new Date().toISOString()
    };
    this.data.admins.push(newAdmin);
    this.persist();
    return newAdmin;
  }

  updateAdminLoginTime(adminId) {
    const admin = (this.data.admins || []).find(a => a.id === adminId);
    if (admin) {
      admin.last_login = new Date().toISOString();
      this.persist();
    }
  }

  // Orders
  createOrder(orderData) {
    const { customer, items, payment_method, notes, delivery_fee = 0 } = orderData;

    const custNextId = (this.data.customers || []).reduce((max, c) => Math.max(max, c.id || 0), 0) + 1;
    const newCustomer = {
      id: custNextId,
      full_name: customer.full_name,
      phone: customer.phone,
      email: customer.email || '',
      delivery_address: customer.delivery_address,
      latitude: customer.latitude || null,
      longitude: customer.longitude || null,
      location_accuracy: customer.location_accuracy || null,
      created_at: new Date().toISOString()
    };
    this.data.customers.push(newCustomer);

    let subtotal = 0;
    const orderItemsRecord = [];

    for (const it of items) {
      const prod = this.getProductById(it.product_id);
      if (!prod) throw new Error(`Product with ID ${it.product_id} not found.`);
      
      const unitPrice = prod.price;
      const lineSubtotal = unitPrice * it.quantity;
      subtotal += lineSubtotal;

      const invRecord = (this.data.inventory || []).find(
        i => i.product_id === prod.id && (!it.variant_name || i.variant_name === it.variant_name)
      );

      if (invRecord) {
        if (invRecord.stock_quantity < it.quantity) {
          throw new Error(`Insufficient stock for "${prod.name}" (${invRecord.variant_name}). Only ${invRecord.stock_quantity} remaining.`);
        }
        invRecord.stock_quantity -= it.quantity;
        invRecord.updated_at = new Date().toISOString();
      }

      orderItemsRecord.push({
        product_id: prod.id,
        product_name: prod.name,
        variant_name: it.variant_name || 'Standard',
        unit_price: unitPrice,
        quantity: it.quantity,
        subtotal: lineSubtotal
      });
    }

    const totalAmount = subtotal + parseFloat(delivery_fee);
    const orderCode = 'MRE-' + Math.floor(100000 + Math.random() * 900000);
    const ordNextId = (this.data.orders || []).reduce((max, o) => Math.max(max, o.id || 0), 0) + 1;

    const newOrder = {
      id: ordNextId,
      order_code: orderCode,
      customer_id: newCustomer.id,
      subtotal,
      delivery_fee: parseFloat(delivery_fee),
      total_amount: totalAmount,
      payment_method: payment_method || 'Cash on Delivery',
      order_status: 'Pending',
      notes: notes || '',
      created_at: new Date().toISOString()
    };

    this.data.orders.push(newOrder);

    orderItemsRecord.forEach(oi => {
      const itemNextId = (this.data.order_items || []).reduce((max, oiItem) => Math.max(max, oiItem.id || 0), 0) + 1;
      this.data.order_items.push({
        id: itemNextId,
        order_id: newOrder.id,
        ...oi
      });
    });

    this.persist();
    return this.getOrderById(newOrder.id);
  }

  getOrderById(id) {
    const ord = (this.data.orders || []).find(o => o.id === parseInt(id, 10));
    if (!ord) return null;
    const cust = (this.data.customers || []).find(c => c.id === ord.customer_id);
    const items = (this.data.order_items || []).filter(oi => oi.order_id === ord.id);
    return { ...ord, customer: cust, items };
  }

  getOrderByCode(code) {
    const ord = (this.data.orders || []).find(o => o.order_code.toUpperCase() === code.trim().toUpperCase());
    if (!ord) return null;
    const cust = (this.data.customers || []).find(c => c.id === ord.customer_id);
    const items = (this.data.order_items || []).filter(oi => oi.order_id === ord.id);
    return { ...ord, customer: cust, items };
  }

  getOrders() {
    return (this.data.orders || []).map(ord => {
      const cust = (this.data.customers || []).find(c => c.id === ord.customer_id);
      const items = (this.data.order_items || []).filter(oi => oi.order_id === ord.id);
      return { ...ord, customer: cust, items };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  updateOrderStatus(orderId, status) {
    const ord = (this.data.orders || []).find(o => o.id === parseInt(orderId, 10));
    if (!ord) return null;
    ord.order_status = status;
    this.persist();
    return ord;
  }

  // Inquiries
  createInquiry(inquiryData) {
    const nextId = (this.data.inquiries || []).reduce((max, inq) => Math.max(max, inq.id || 0), 0) + 1;
    const newInquiry = {
      id: nextId,
      name: inquiryData.name,
      phone: inquiryData.phone,
      email: inquiryData.email || '',
      category: inquiryData.category || 'General Inquiries',
      message: inquiryData.message,
      status: 'Unread',
      reply: null,
      replied_at: null,
      created_at: new Date().toISOString()
    };
    if (!this.data.inquiries) this.data.inquiries = [];
    this.data.inquiries.push(newInquiry);
    this.persist();
    return newInquiry;
  }

  getInquiries() {
    return (this.data.inquiries || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  replyInquiry(inquiryId, replyText) {
    const inq = (this.data.inquiries || []).find(i => i.id === parseInt(inquiryId, 10));
    if (!inq) return null;
    inq.reply = replyText;
    inq.status = 'Replied';
    inq.replied_at = new Date().toISOString();
    this.persist();
    return inq;
  }

  // ==========================================================================
  // LIVE ON-SITE CHAT (Client <-> Boutique Shop Interaction)
  // ==========================================================================
  getOrCreateChatSession(sessionId, clientName = 'Guest Shopper') {
    if (!this.data.live_chats) this.data.live_chats = [];
    let chat = this.data.live_chats.find(c => c.session_id === sessionId);
    if (!chat) {
      chat = {
        session_id: sessionId,
        client_name: clientName,
        status: 'Active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        messages: [
          {
            id: 1,
            sender: 'bot',
            sender_name: 'Miss Roses Stylist',
            text: 'Welcome to Miss Roses Exquisite! 🌸 How may our personal concierge assist you with dresses, bangles, or slippers today?',
            timestamp: new Date().toISOString()
          }
        ]
      };
      this.data.live_chats.push(chat);
      this.persist();
    }
    return chat;
  }

  getChatSession(sessionId) {
    return (this.data.live_chats || []).find(c => c.session_id === sessionId);
  }

  getAllChatSessions() {
    return (this.data.live_chats || []).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }

  addChatMessage(sessionId, sender, senderName, text) {
    let chat = this.getOrCreateChatSession(sessionId, sender === 'client' ? senderName : undefined);
    const nextMsgId = chat.messages.reduce((max, m) => Math.max(max, m.id || 0), 0) + 1;
    const newMsg = {
      id: nextMsgId,
      sender, // 'client', 'admin', 'bot'
      sender_name: senderName,
      text,
      timestamp: new Date().toISOString()
    };
    chat.messages.push(newMsg);
    chat.updated_at = new Date().toISOString();

    // Auto-reply assistant logic when admin is away
    if (sender === 'client') {
      const q = text.toLowerCase();
      let autoReply = null;
      if (q.includes('dress') || q.includes('size') || q.includes('fitting')) {
        autoReply = "Our dresses feature tailored corset and stretch silhouettes with UK sizes 8 to 16. You can request bespoke fittings or alterations directly with our head stylist here!";
      } else if (q.includes('bangle') || q.includes('gold') || q.includes('wrist')) {
        autoReply = "Our bangles are 24K gold-plated and crafted with authentic coral & filigree brass with anti-tarnish protective sealing. Most fit standard 6.5 to 7.5-inch wrists comfortably.";
      } else if (q.includes('slipper') || q.includes('shoe') || q.includes('slide')) {
        autoReply = "Our artisanal slippers are crafted with genuine padded Moroccan calfskin leather and memory foam footbeds in EU sizes 37 to 41.";
      } else if (q.includes('deliver') || q.includes('location') || q.includes('gps')) {
        autoReply = "We offer same-day and next-day GPS doorstep delivery across Accra and express shipping nationwide! You can pin your location during checkout.";
      } else if (q.includes('price') || q.includes('cost') || q.includes('how much')) {
        autoReply = "All collection pieces display clear GHS prices in the catalogue above. Let us know if you'd like a custom package bundle!";
      }

      if (autoReply) {
        setTimeout(() => {
          chat.messages.push({
            id: nextMsgId + 1,
            sender: 'bot',
            sender_name: 'Miss Roses Concierge',
            text: autoReply,
            timestamp: new Date().toISOString()
          });
          this.persist();
        }, 600);
      }
    }

    this.persist();
    return newMsg;
  }

  // Reports
  getSalesReport() {
    const orders = this.data.orders || [];
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const deliveredOrders = orders.filter(o => o.order_status === 'Delivered').length;
    const pendingOrders = orders.filter(o => o.order_status === 'Pending').length;

    const itemMap = {};
    (this.data.order_items || []).forEach(oi => {
      if (!itemMap[oi.product_name]) {
        itemMap[oi.product_name] = { name: oi.product_name, count: 0, revenue: 0 };
      }
      itemMap[oi.product_name].count += oi.quantity;
      itemMap[oi.product_name].revenue += oi.subtotal;
    });

    const topSelling = Object.values(itemMap).sort((a, b) => b.count - a.count).slice(0, 5);

    return {
      totalOrders,
      totalRevenue,
      deliveredOrders,
      pendingOrders,
      topSelling,
      inquiriesCount: (this.data.inquiries || []).filter(i => i.status === 'Unread').length,
      activeChatsCount: (this.data.live_chats || []).length,
      generatedAt: new Date().toISOString()
    };
  }

  // Notifications Log
  logNotification(orderId, channel, recipient, message, status) {
    const nextId = (this.data.notifications_log || []).reduce((max, n) => Math.max(max, n.id || 0), 0) + 1;
    this.data.notifications_log.push({
      id: nextId,
      order_id: orderId,
      channel,
      recipient,
      message,
      status,
      created_at: new Date().toISOString()
    });
    this.persist();
  }

  getNotificationsLog() {
    return (this.data.notifications_log || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
}

module.exports = new PersistentDatabase();
