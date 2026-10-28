/**
 * Miss Roses Exquisite — Super Admin Portal Controller
 * Manages JWT Auth, Orders, Catalog CRUD, Inventory Adjustments, Reports,
 * Live On-Site Chat Responders with Instant Notification Beeps & Toast Alerts.
 */

let adminToken = localStorage.getItem('miss_roses_admin_token') || null;
let currentProducts = [];
let lastMessageCounts = {};
let chatMonitorInterval = null;

document.addEventListener('DOMContentLoaded', () => {
  if (adminToken) {
    showDashboard();
  } else {
    showLogin();
  }
});

function showLogin() {
  document.getElementById('loginView').style.display = 'block';
  document.getElementById('dashboardView').style.display = 'none';
  if (chatMonitorInterval) clearInterval(chatMonitorInterval);
}

function showDashboard() {
  document.getElementById('loginView').style.display = 'none';
  document.getElementById('dashboardView').style.display = 'flex';
  loadAdminStats();
  loadOrders();
  startChatMonitor();
}

async function handleAdminLogin(e) {
  e.preventDefault();
  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value.trim();
  const alertEl = document.getElementById('loginAlert');

  alertEl.style.display = 'none';

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Authentication failed.');

    adminToken = data.token;
    localStorage.setItem('miss_roses_admin_token', adminToken);
    showDashboard();
  } catch (err) {
    alertEl.style.display = 'block';
    alertEl.style.background = '#f8d7da';
    alertEl.style.color = '#721c24';
    alertEl.textContent = err.message;
  }
}

function adminLogout() {
  adminToken = null;
  localStorage.removeItem('miss_roses_admin_token');
  showLogin();
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  };
}

// Tab Switching
function showTab(tabName, linkEl) {
  ['orders', 'livechat', 'inquiries', 'products', 'inventory', 'reports', 'notifications', 'backup'].forEach(t => {
    const el = document.getElementById(`tab-${t}`);
    if (el) el.style.display = t === tabName ? 'block' : 'none';
  });

  document.querySelectorAll('.admin-menu a').forEach(a => a.classList.remove('active'));
  if (linkEl) {
    linkEl.classList.add('active');
  } else {
    const menuLinks = document.querySelectorAll('.admin-menu a');
    if (tabName === 'livechat' && menuLinks[1]) menuLinks[1].classList.add('active');
  }

  const titles = {
    orders: ['Orders & Deliveries', 'Manage customer reservations and update delivery dispatch status'],
    livechat: ['Live On-Site Chats', 'Real-time conversation threads with online clients currently on the website'],
    inquiries: ['Client Concierge Desk', 'View and reply to customer inquiries, WhatsApp questions, and bespoke requests'],
    products: ['Catalogue Management', 'Add, modify, or retire dresses, bangles, and slippers'],
    inventory: ['Inventory & Stock Control', 'Monitor stock quantities, SKU codes, and low-stock alerts'],
    reports: ['Sales Analytics & Intelligence', 'Comprehensive revenue reports, order tallies, and piece performance'],
    notifications: ['Dispatch & Delivery Logs', 'Audited log of SMS, Email and Live Chat notifications'],
    backup: ['Database & Backup Maintenance', 'Export safe point-in-time database snapshots to local storage']
  };

  if (titles[tabName]) {
    document.getElementById('tabTitle').textContent = titles[tabName][0];
    document.getElementById('tabDesc').textContent = titles[tabName][1];
  }

  if (tabName === 'orders') loadOrders();
  if (tabName === 'livechat') {
    loadLiveChats();
    dismissToast();
  }
  if (tabName === 'inquiries') loadInquiries();
  if (tabName === 'products') loadProducts();
  if (tabName === 'inventory') loadInventory();
  if (tabName === 'reports') loadReports();
  if (tabName === 'notifications') loadNotifications();
}

// Load Stats
async function loadAdminStats() {
  try {
    const res = await fetch('/api/admin/reports/sales', { headers: authHeaders() });
    const data = await res.json();
    if (data.report) {
      document.getElementById('statRevenue').textContent = `GHS ${data.report.totalRevenue.toFixed(2)}`;
      document.getElementById('statOrders').textContent = data.report.totalOrders;
      document.getElementById('statChats').textContent = data.report.activeChatsCount || 0;
      document.getElementById('statInquiries').textContent = data.report.inquiriesCount || 0;

      const badge = document.getElementById('inquiryBadgeCount');
      if (badge && data.report.inquiriesCount > 0) {
        badge.style.display = 'inline-block';
        badge.textContent = data.report.inquiriesCount;
      }
    }
  } catch (e) {
    console.error('Stats load error:', e);
  }
}

// 1. ORDERS
async function loadOrders() {
  const tbody = document.getElementById('ordersTableBody');
  try {
    const res = await fetch('/api/admin/orders', { headers: authHeaders() });
    const data = await res.json();
    const orders = data.orders || [];

    if (orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:35px; color:#888;">No orders placed yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = orders.map(o => `
      <tr>
        <td><strong>#${o.order_code}</strong><br><small style="color:#777;">${new Date(o.created_at).toLocaleDateString()}</small></td>
        <td><strong>${o.customer.full_name}</strong></td>
        <td>
          ${o.customer.phone}
          <br><a href="https://wa.me/${o.customer.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(o.customer.full_name)},%20this%20is%20Miss%20Roses%20Exquisite%20regarding%20order%20%23${o.order_code}" target="_blank" style="color:#25d366; font-size:0.75rem;"><i class="fa-brands fa-whatsapp"></i> WhatsApp Client</a>
        </td>
        <td>
          ${o.customer.delivery_address}
          ${o.customer.latitude ? `<br><a href="https://maps.google.com/?q=${o.customer.latitude},${o.customer.longitude}" target="_blank" style="color:#27834a; font-size:0.75rem;"><i class="fa-solid fa-map-location-dot"></i> Open GPS Location</a>` : ''}
        </td>
        <td>
          ${o.items.map(i => `${i.quantity}x ${i.product_name} (${i.variant_name})`).join('<br>')}
        </td>
        <td><strong>GHS ${o.total_amount.toFixed(2)}</strong><br><small style="color:#777;">${o.payment_method}</small></td>
        <td><span class="badge-status badge-${o.order_status.replace(/\s+/g, '')}">${o.order_status}</span></td>
        <td>
          <select onchange="updateOrderStatus(${o.id}, this.value)" style="padding:6px 10px; border-radius:4px; font-size:0.82rem; border:1px solid #ccc; font-weight:600;">
            <option value="Pending" ${o.order_status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Confirmed" ${o.order_status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="Out for Delivery" ${o.order_status === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery</option>
            <option value="Delivered" ${o.order_status === 'Delivered' ? 'selected' : ''}>Delivered</option>
            <option value="Cancelled" ${o.order_status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:red;">Failed to load orders.</td></tr>`;
  }
}

async function updateOrderStatus(orderId, status) {
  try {
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Status update failed');
    loadOrders();
    loadAdminStats();
  } catch (err) {
    alert(err.message);
  }
}

// 2. LIVE CHATS MONITOR & NOTIFICATIONS
function startChatMonitor() {
  if (chatMonitorInterval) clearInterval(chatMonitorInterval);
  chatMonitorInterval = setInterval(checkLiveChatUpdates, 3000);
}

async function checkLiveChatUpdates() {
  if (!adminToken) return;
  try {
    const res = await fetch('/api/admin/chats', { headers: authHeaders() });
    if (!res.ok) return;
    const data = await res.json();
    const chats = data.chats || [];

    let hasNewClientMessage = false;
    let latestClientMsg = null;

    chats.forEach(c => {
      const currentCount = c.messages.length;
      const prevCount = lastMessageCounts[c.session_id] || 0;

      if (prevCount > 0 && currentCount > prevCount) {
        const lastMsg = c.messages[c.messages.length - 1];
        if (lastMsg.sender === 'client') {
          hasNewClientMessage = true;
          latestClientMsg = { client: c.client_name, text: lastMsg.text };
        }
      }
      lastMessageCounts[c.session_id] = currentCount;
    });

    if (hasNewClientMessage && latestClientMsg) {
      triggerChatAlert(latestClientMsg.client, latestClientMsg.text);
      // Auto reload if currently on livechat tab
      const chatTab = document.getElementById('tab-livechat');
      if (chatTab && chatTab.style.display !== 'none') {
        renderLiveChatGrid(chats);
      }
    }
  } catch (e) {
    // Silent fail in polling
  }
}

// Audio Beep Generator using Web Audio API
function playAlertBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch notification chime
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {
    console.log('Audio alert muted/blocked');
  }
}

function triggerChatAlert(clientName, text) {
  playAlertBeep();

  const toast = document.getElementById('adminLiveChatToast');
  const preview = document.getElementById('toastChatPreview');
  const badge = document.getElementById('chatAlertBadge');

  if (toast && preview) {
    preview.innerHTML = `<strong>${clientName}:</strong> "${text.substring(0, 50)}..."`;
    toast.style.display = 'flex';
  }

  if (badge) badge.style.display = 'inline-block';
}

function dismissToast() {
  const toast = document.getElementById('adminLiveChatToast');
  const badge = document.getElementById('chatAlertBadge');
  if (toast) toast.style.display = 'none';
  if (badge) badge.style.display = 'none';
}

async function loadLiveChats() {
  try {
    const res = await fetch('/api/admin/chats', { headers: authHeaders() });
    const data = await res.json();
    renderLiveChatGrid(data.chats || []);
  } catch (err) {
    document.getElementById('liveChatsContainer').innerHTML = `<p style="color:red;">Failed to load live chats.</p>`;
  }
}

function renderLiveChatGrid(chats) {
  const container = document.getElementById('liveChatsContainer');
  if (!container) return;

  if (chats.length === 0) {
    container.innerHTML = `<p style="grid-column: 1/-1; color: #888; text-align: center; padding: 40px;">No on-site chat sessions initiated yet.</p>`;
    return;
  }

  container.innerHTML = chats.map(c => `
    <div style="background:#fff; border-radius:var(--radius-md); padding:22px; box-shadow:0 2px 10px rgba(0,0,0,0.05); border:1px solid var(--border-subtle); display:flex; flex-direction:column;">
      <div style="display:flex; justify-content:space-between; margin-bottom:12px; border-bottom:1px solid #eee; padding-bottom:10px;">
        <div>
          <strong style="font-size:1.05rem; color:var(--noir-deep);">${c.client_name || 'Guest Shopper'}</strong>
          <div style="font-size:0.75rem; color:#888;">Session: <code>${c.session_id}</code></div>
        </div>
        <span style="font-size:0.75rem; color:#27834a; font-weight:700;"><i class="fa-solid fa-circle" style="font-size:0.6rem;"></i> Live Online</span>
      </div>

      <div style="flex:1; max-height:240px; overflow-y:auto; background:#faf8f5; padding:12px; border-radius:8px; margin-bottom:14px; display:flex; flex-direction:column; gap:8px;">
        ${c.messages.map(m => `
          <div style="font-size:0.85rem; padding:8px 12px; border-radius:8px; background:${m.sender === 'client' ? '#fff' : 'var(--noir-deep)'}; color:${m.sender === 'client' ? '#111' : '#fff'}; align-self:${m.sender === 'client' ? 'flex-start' : 'flex-end'}; border:1px solid #eee; max-width:85%;">
            <strong style="font-size:0.72rem; color:${m.sender === 'client' ? 'var(--gold-dark)' : 'var(--gold-primary)'}; display:block;">${m.sender_name}:</strong>
            ${m.text}
          </div>
        `).join('')}
      </div>

      <div style="display:flex; gap:8px;">
        <input type="text" id="admin-reply-${c.session_id}" placeholder="Reply to customer live..." style="flex:1; padding:10px 14px; border:1px solid #ccc; border-radius:4px; font-size:0.88rem;" onkeypress="if(event.key === 'Enter') replyToLiveChat('${c.session_id}')">
        <button onclick="replyToLiveChat('${c.session_id}')" class="btn btn-gold btn-sm" style="padding:10px 16px;"><i class="fa-solid fa-paper-plane"></i> Reply</button>
      </div>
    </div>
  `).join('');
}

async function replyToLiveChat(sessionId) {
  const input = document.getElementById(`admin-reply-${sessionId}`);
  const text = input ? input.value.trim() : '';
  if (!text) return;

  input.value = '';

  try {
    const res = await fetch(`/api/admin/chats/${sessionId}/reply`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ text })
    });
    if (!res.ok) throw new Error('Reply failed');
    loadLiveChats();
  } catch (err) {
    alert(err.message);
  }
}

// 3. INQUIRIES
async function loadInquiries() {
  const tbody = document.getElementById('inquiriesTableBody');
  try {
    const res = await fetch('/api/admin/inquiries', { headers: authHeaders() });
    const data = await res.json();
    const inqs = data.inquiries || [];

    if (inqs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:35px; color:#888;">No inquiries received yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = inqs.map(i => `
      <tr>
        <td><small>${new Date(i.created_at).toLocaleString()}</small></td>
        <td><strong>${i.name}</strong></td>
        <td>
          ${i.phone}<br>
          <a href="https://wa.me/${i.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(i.name)},%20thank%20you%20for%20contacting%20Miss%20Roses%20Exquisite." target="_blank" style="color:#25d366; font-size:0.75rem;"><i class="fa-brands fa-whatsapp"></i> Chat on WhatsApp</a>
        </td>
        <td><span style="background:rgba(212,175,55,0.15); color:var(--noir-deep); padding:3px 8px; border-radius:3px; font-size:0.78rem; font-weight:600;">${i.category}</span></td>
        <td style="max-width:300px;">${i.message}</td>
        <td><span class="badge-status ${i.status === 'Replied' ? 'badge-Delivered' : 'badge-Pending'}">${i.status}</span></td>
        <td>
          <button onclick="replyToInquiry(${i.id}, '${escape(i.name)}')" class="btn btn-sm btn-gold" style="padding:4px 10px; font-size:0.75rem;">
            <i class="fa-solid fa-reply"></i> Log Reply
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="color:red; text-align:center;">Failed to load inquiries.</td></tr>`;
  }
}

async function replyToInquiry(inqId, escapedName) {
  const name = unescape(escapedName);
  const text = prompt(`Log response to ${name}:`);
  if (!text) return;

  try {
    const res = await fetch(`/api/admin/inquiries/${inqId}/reply`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ reply: text })
    });
    if (!res.ok) throw new Error('Failed to record reply');
    alert('Inquiry marked as Replied!');
    loadInquiries();
    loadAdminStats();
  } catch (err) {
    alert(err.message);
  }
}

// 4. PRODUCTS
async function loadProducts() {
  const tbody = document.getElementById('productsTableBody');
  try {
    const res = await fetch('/api/products');
    const data = await res.json();
    currentProducts = data.products || [];

    tbody.innerHTML = currentProducts.map(p => `
      <tr>
        <td><img src="${p.image_url}" style="width:50px; height:58px; object-fit:cover; border-radius:4px;"></td>
        <td><strong>${p.name}</strong></td>
        <td>${p.category_name}</td>
        <td><strong>GHS ${p.price.toFixed(2)}</strong></td>
        <td>${p.total_stock} in stock</td>
        <td>${p.badge ? `<span style="background:#eee; padding:2px 8px; border-radius:3px; font-size:0.75rem; font-weight:600;">${p.badge}</span>` : '-'}</td>
        <td>
          <button onclick="editProduct(${p.id})" class="btn btn-sm" style="padding:5px 9px; font-size:0.8rem; border:1px solid #ccc; background:#fff;"><i class="fa-solid fa-pen"></i></button>
          <button onclick="deleteProduct(${p.id})" class="btn btn-sm" style="padding:5px 9px; font-size:0.8rem; border:1px solid #c93b3b; color:#c93b3b; background:#fff;"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="color:red; text-align:center;">Failed to load products.</td></tr>`;
  }
}

function openNewProductModal() {
  document.getElementById('adminModalTitle').textContent = 'Add New Luxury Piece';
  document.getElementById('editProdId').value = '';
  document.getElementById('editProdName').value = '';
  document.getElementById('editProdCategory').value = '1';
  document.getElementById('editProdPrice').value = '';
  document.getElementById('editProdComparePrice').value = '';
  document.getElementById('editProdImage').value = '';
  document.getElementById('editProdDesc').value = '';
  document.getElementById('editProdBadge').value = '';
  document.getElementById('adminProductModal').classList.add('active');
}

function editProduct(id) {
  const p = currentProducts.find(item => item.id === id);
  if (!p) return;

  document.getElementById('adminModalTitle').textContent = 'Edit Piece Details';
  document.getElementById('editProdId').value = p.id;
  document.getElementById('editProdName').value = p.name;
  document.getElementById('editProdCategory').value = p.category_id;
  document.getElementById('editProdPrice').value = p.price;
  document.getElementById('editProdComparePrice').value = p.compare_price || '';
  document.getElementById('editProdImage').value = p.image_url;
  document.getElementById('editProdDesc').value = p.description;
  document.getElementById('editProdBadge').value = p.badge || '';
  document.getElementById('adminProductModal').classList.add('active');
}

function closeAdminProductModal() {
  document.getElementById('adminProductModal').classList.remove('active');
}

async function handleProductSave(e) {
  e.preventDefault();
  const id = document.getElementById('editProdId').value;
  const payload = {
    name: document.getElementById('editProdName').value.trim(),
    category_id: parseInt(document.getElementById('editProdCategory').value, 10),
    price: parseFloat(document.getElementById('editProdPrice').value),
    compare_price: document.getElementById('editProdComparePrice').value ? parseFloat(document.getElementById('editProdComparePrice').value) : null,
    image_url: document.getElementById('editProdImage').value.trim(),
    description: document.getElementById('editProdDesc').value.trim(),
    badge: document.getElementById('editProdBadge').value.trim()
  };

  try {
    const url = id ? `/api/admin/products/${id}` : `/api/admin/products`;
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to save product');

    closeAdminProductModal();
    loadProducts();
    loadAdminStats();
  } catch (err) {
    alert(err.message);
  }
}

async function deleteProduct(id) {
  if (!confirm('Are you sure you want to remove this piece from the catalog?')) return;
  try {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Delete failed');
    loadProducts();
    loadAdminStats();
  } catch (err) {
    alert(err.message);
  }
}

// 5. INVENTORY
async function loadInventory() {
  const tbody = document.getElementById('inventoryTableBody');
  const alertBanner = document.getElementById('inventoryAlertsBanner');

  try {
    const res = await fetch('/api/products');
    const data = await res.json();
    const products = data.products || [];

    const alertRes = await fetch('/api/admin/inventory/alerts', { headers: authHeaders() });
    const alertData = await alertRes.json();
    const alerts = alertData.alerts || [];

    if (alerts.length > 0) {
      alertBanner.innerHTML = `
        <div style="background:#fff3cd; border:1px solid #ffeeba; color:#856404; padding:16px; border-radius:var(--radius-sm);">
          <strong><i class="fa-solid fa-triangle-exclamation"></i> Low Stock Warning:</strong>
          <ul style="margin-top:8px; margin-left:22px; font-size:0.88rem;">
            ${alerts.map(a => `<li><strong>${a.product_name}</strong> (${a.variant_name}) — Only <strong>${a.stock_quantity}</strong> remaining!</li>`).join('')}
          </ul>
        </div>`;
    } else {
      alertBanner.innerHTML = `<div style="background:#d4edda; color:#155724; padding:14px; border-radius:var(--radius-sm); font-size:0.88rem;"><i class="fa-solid fa-circle-check"></i> All item stock quantities are healthy and well-stocked!</div>`;
    }

    let rows = [];
    products.forEach(p => {
      (p.inventory || []).forEach(inv => {
        rows.push(`
          <tr>
            <td><strong>${p.name}</strong></td>
            <td>${inv.variant_name}</td>
            <td><code>${inv.sku || '-'}</code></td>
            <td><strong style="color:${inv.stock_quantity <= inv.low_stock_threshold ? 'red' : 'inherit'};">${inv.stock_quantity}</strong></td>
            <td>${inv.low_stock_threshold}</td>
            <td>
              <div style="display:flex; gap:8px;">
                <input type="number" id="inv-input-${inv.id}" value="${inv.stock_quantity}" style="width:75px; padding:6px 10px; border:1px solid #ccc; border-radius:4px;">
                <button onclick="updateStockLevel(${inv.id})" class="btn btn-gold btn-sm" style="padding:6px 12px; font-size:0.78rem;">Save</button>
              </div>
            </td>
          </tr>
        `);
      });
    });

    tbody.innerHTML = rows.join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">Failed to load inventory.</td></tr>`;
  }
}

async function updateStockLevel(invId) {
  const input = document.getElementById(`inv-input-${invId}`);
  if (!input) return;
  const newStock = parseInt(input.value, 10);

  try {
    const res = await fetch(`/api/admin/inventory/${invId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ stock_quantity: newStock })
    });
    if (!res.ok) throw new Error('Stock update failed');
    alert('Stock updated successfully!');
    loadInventory();
    loadAdminStats();
  } catch (err) {
    alert(err.message);
  }
}

// 6. REPORTS
async function loadReports() {
  const container = document.getElementById('reportContainer');
  try {
    const res = await fetch('/api/admin/reports/sales', { headers: authHeaders() });
    const data = await res.json();
    const r = data.report;

    container.innerHTML = `
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap:24px; margin-bottom:35px;">
        <div style="background:#f8f9fa; padding:20px; border-radius:8px; border: 1px solid #eee;">
          <div style="color:#777; font-size:0.8rem; text-transform:uppercase; font-weight:600;">Gross Boutique Sales</div>
          <div style="font-size:2rem; font-weight:800; color:var(--noir-deep); margin-top:4px;">GHS ${r.totalRevenue.toFixed(2)}</div>
        </div>
        <div style="background:#f8f9fa; padding:20px; border-radius:8px; border: 1px solid #eee;">
          <div style="color:#777; font-size:0.8rem; text-transform:uppercase; font-weight:600;">Orders Received</div>
          <div style="font-size:2rem; font-weight:800; color:var(--noir-deep); margin-top:4px;">${r.totalOrders}</div>
        </div>
        <div style="background:#f8f9fa; padding:20px; border-radius:8px; border: 1px solid #eee;">
          <div style="color:#777; font-size:0.8rem; text-transform:uppercase; font-weight:600;">Orders Delivered</div>
          <div style="font-size:2rem; font-weight:800; color:#27834a; margin-top:4px;">${r.deliveredOrders}</div>
        </div>
      </div>

      <h4 style="margin-bottom:18px; font-family:var(--font-cinzel); font-size:1.4rem;">Top Performing Pieces</h4>
      ${r.topSelling.length === 0 ? '<p style="color:#888;">No sales registered yet.</p>' : `
        <table class="admin-table">
          <thead>
            <tr><th>Product Piece</th><th>Units Sold</th><th>Generated Revenue</th></tr>
          </thead>
          <tbody>
            ${r.topSelling.map(item => `
              <tr>
                <td><strong>${item.name}</strong></td>
                <td>${item.count} units</td>
                <td><strong>GHS ${item.revenue.toFixed(2)}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `}
    `;
  } catch (err) {
    container.innerHTML = `<p style="color:red;">Error loading report data.</p>`;
  }
}

// 7. NOTIFICATIONS
async function loadNotifications() {
  const tbody = document.getElementById('notificationsTableBody');
  try {
    const res = await fetch('/api/admin/notifications', { headers: authHeaders() });
    const data = await res.json();
    const notifs = data.notifications || [];

    if (notifs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#888; padding:30px;">No notifications recorded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = notifs.map(n => `
      <tr>
        <td><small>${new Date(n.created_at).toLocaleString()}</small></td>
        <td><strong>${n.channel}</strong></td>
        <td>${n.recipient}</td>
        <td>${n.message}</td>
        <td><span style="font-size:0.75rem; background:#eee; padding:4px 8px; border-radius:4px; font-weight:600;">${n.status}</span></td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">Failed to load logs.</td></tr>`;
  }
}

// 8. BACKUP
async function triggerBackup() {
  const resultDiv = document.getElementById('backupResult');
  resultDiv.innerHTML = `<span><i class="fa-solid fa-spinner fa-spin"></i> Creating verified database snapshot...</span>`;
  try {
    const res = await fetch('/api/admin/database/backup', {
      method: 'POST',
      headers: authHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Backup creation failed');

    resultDiv.innerHTML = `
      <div style="background:#d4edda; color:#155724; padding:18px; border-radius:var(--radius-sm); font-size:0.9rem;">
        <i class="fa-solid fa-circle-check"></i> <strong>Success!</strong> Verified snapshot saved at:<br>
        <code style="word-break: break-all;">${data.backupFile}</code>
      </div>`;
  } catch (err) {
    resultDiv.innerHTML = `<div style="background:#f8d7da; color:#721c24; padding:18px; border-radius:var(--radius-sm);">${err.message}</div>`;
  }
}
