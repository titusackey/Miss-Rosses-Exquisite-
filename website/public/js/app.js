/**
 * Miss Roses Exquisite — Storefront Client Controller
 * Manages catalogue, cart, GPS geolocation, order tracking,
 * client-shop interactions, and Live On-Site Chat engine.
 */

let allProducts = [];
let currentCategory = 0;
let currentSearch = '';
let cart = [];

// Chat Session State
let chatSessionId = localStorage.getItem('mre_chat_session_id');
if (!chatSessionId) {
  chatSessionId = 'chat_' + Math.random().toString(36).substring(2, 9) + Date.now();
  localStorage.setItem('mre_chat_session_id', chatSessionId);
}
let chatPollingInterval = null;

document.addEventListener('DOMContentLoaded', () => {
  loadCartFromStorage();
  fetchProducts();
  initChatSession();
});

// Load / Save Cart
function loadCartFromStorage() {
  try {
    const saved = localStorage.getItem('miss_roses_cart');
    if (saved) cart = JSON.parse(saved);
  } catch (e) {
    cart = [];
  }
  updateCartUI();
}

function saveCartToStorage() {
  localStorage.setItem('miss_roses_cart', JSON.stringify(cart));
  updateCartUI();
}

// Fetch products from API
async function fetchProducts() {
  const grid = document.getElementById('productsGrid');
  const tally = document.getElementById('productTally');
  try {
    let url = '/api/products';
    const params = new URLSearchParams();
    if (currentCategory > 0) params.append('category_id', currentCategory);
    if (currentSearch) params.append('search', currentSearch);
    
    const sortVal = document.getElementById('sortSelect') ? document.getElementById('sortSelect').value : '';
    if (sortVal && sortVal !== 'featured') params.append('sort', sortVal);

    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url);
    const data = await res.json();
    allProducts = data.products || [];
    renderProducts(allProducts);

    if (tally) tally.textContent = `Showing ${allProducts.length} exquisite pieces`;
  } catch (err) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #c93b3b;"><i class="fa-solid fa-triangle-exclamation"></i> Unable to load products. Please refresh page.</div>`;
  }
}

// Render Products Grid
function renderProducts(products) {
  const grid = document.getElementById('productsGrid');
  if (!products || products.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
        <i class="fa-solid fa-gem fa-3x" style="color: #d4af37; margin-bottom: 18px;"></i>
        <h3 style="font-family: var(--font-cinzel); font-size: 1.6rem;">No Matching Pieces Found</h3>
        <p style="color: #777; margin: 8px 0 20px;">Try clearing your search query or selecting a different collection tab.</p>
        <button class="btn btn-gold btn-sm" onclick="clearSearch()">View All Pieces</button>
      </div>`;
    return;
  }

  grid.innerHTML = products.map(prod => {
    const hasDiscount = prod.compare_price && prod.compare_price > prod.price;
    const isOutOfStock = prod.total_stock <= 0;
    const isLowStock = prod.total_stock > 0 && prod.total_stock <= 4;

    let stockText = `<span class="stock-indicator in-stock"><i class="fa-solid fa-circle-check"></i> In Stock (${prod.total_stock} available)</span>`;
    if (isOutOfStock) {
      stockText = `<span class="stock-indicator out-of-stock"><i class="fa-solid fa-circle-xmark"></i> Sold Out</span>`;
    } else if (isLowStock) {
      stockText = `<span class="stock-indicator low-stock"><i class="fa-solid fa-hourglass-half"></i> Only ${prod.total_stock} remaining!</span>`;
    }

    return `
      <div class="product-card">
        <div class="product-thumb">
          <img src="${prod.image_url}" alt="${prod.name}" loading="lazy">
          ${prod.video_url ? `<span class="video-indicator-badge" title="Showcase Video Available"><i class="fa-solid fa-play"></i> Video</span>` : ''}
          ${prod.badge ? `<span class="product-badge">${prod.badge}</span>` : ''}
          <div class="rating-badge"><i class="fa-solid fa-star"></i> 5.0</div>
        </div>
        <div class="product-info">
          <span class="product-category-tag">${prod.category_name || 'Boutique Collection'}</span>
          <h3 class="product-name">${prod.name}</h3>
          <p class="product-desc">${prod.description}</p>
          <div class="product-price-row">
            <span class="product-price">GHS ${prod.price.toFixed(2)}</span>
            ${hasDiscount ? `<span class="compare-price">GHS ${prod.compare_price.toFixed(2)}</span>` : ''}
          </div>
          ${stockText}
          <div class="card-actions">
            <button class="btn btn-gold btn-block ${isOutOfStock ? 'disabled' : ''}" 
              onclick="openProductDetails(${prod.id})" ${isOutOfStock ? 'disabled' : ''}>
              ${isOutOfStock ? 'Sold Out' : 'Select Size & Purchase'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Category tabs
function filterCategory(catId, btnElement) {
  currentCategory = catId;
  document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
  if (btnElement) {
    btnElement.classList.add('active');
  } else {
    const pills = document.querySelectorAll('.cat-pill');
    if (pills[catId]) pills[catId].classList.add('active');
  }
  fetchProducts();
}

// Search
let searchTimeout = null;
function handleSearch(val) {
  const clearBtn = document.getElementById('clearSearchBtn');
  if (clearBtn) clearBtn.style.display = val.length > 0 ? 'block' : 'none';

  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentSearch = val.trim();
    fetchProducts();
  }, 250);
}

function clearSearch() {
  const input = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearSearchBtn');
  if (input) input.value = '';
  if (clearBtn) clearBtn.style.display = 'none';
  currentSearch = '';
  currentCategory = 0;
  document.querySelectorAll('.cat-pill').forEach((b, i) => {
    if (i === 0) b.classList.add('active');
    else b.classList.remove('active');
  });
  fetchProducts();
}

function handleSort() {
  fetchProducts();
}

// Mobile navigation
function toggleMobileNav() {
  const nav = document.getElementById('mainNav');
  if (nav) nav.classList.toggle('mobile-open');
}

function closeMobileNav() {
  const nav = document.getElementById('mainNav');
  if (nav) nav.classList.remove('mobile-open');
}

// Auto-close mobile menu on link click
document.addEventListener('DOMContentLoaded', () => {
  const nav = document.getElementById('mainNav');
  if (nav) {
    nav.addEventListener('click', (e) => {
      if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.closest('a') || e.target.closest('button')) {
        closeMobileNav();
      }
    });
  }
});

// Scroll helpers
function scrollToSocialHub() {
  const hub = document.getElementById('social-hub');
  if (hub) hub.scrollIntoView({ behavior: 'smooth' });
}

function scrollToTracker() {
  const el = document.getElementById('order-tracker');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// Product Details Modal
function openProductDetails(prodId) {
  const prod = allProducts.find(p => p.id === prodId);
  if (!prod) return;

  const modal = document.getElementById('productModal');
  const details = document.getElementById('modalProductDetails');
  const variants = prod.inventory || [{ variant_name: 'Standard', stock_quantity: prod.total_stock }];

  details.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px; align-items: start;">
      <div>
        ${prod.video_url ? `
          <div class="media-toggle-tabs" style="display: flex; gap: 8px; margin-bottom: 12px;">
            <button type="button" class="media-tab-btn active" id="modalPhotoTabBtn" onclick="switchModalMedia('photo')">
              <i class="fa-solid fa-image"></i> High-Res Photo
            </button>
            <button type="button" class="media-tab-btn" id="modalVideoTabBtn" onclick="switchModalMedia('video')">
              <i class="fa-solid fa-play" style="color: #d4af37;"></i> Watch Video Clip
            </button>
          </div>
          <div id="modalPhotoView">
            <img src="${prod.image_url}" alt="${prod.name}" style="width: 100%; height: 420px; max-height: 55vh; object-fit: cover; border-radius: var(--radius-md); box-shadow: var(--shadow-card);">
          </div>
          <div id="modalVideoView" style="display: none;">
            <video src="${prod.video_url}" controls autoplay loop playsinline style="width: 100%; height: 420px; max-height: 55vh; object-fit: cover; border-radius: var(--radius-md); box-shadow: var(--shadow-card); background: #000;"></video>
          </div>
        ` : `
          <img src="${prod.image_url}" alt="${prod.name}" style="width: 100%; height: 420px; max-height: 55vh; object-fit: cover; border-radius: var(--radius-md); box-shadow: var(--shadow-card);">
        `}
      </div>
      <div>
        <span class="product-category-tag">${prod.category_name}</span>
        <h2 style="font-family: var(--font-cinzel); font-size: 1.85rem; margin: 8px 0; line-height: 1.25;">${prod.name}</h2>
        <div style="font-size: 1.6rem; font-weight: 800; color: var(--noir-deep); margin-bottom: 12px;">GHS ${prod.price.toFixed(2)}</div>
        <p style="font-size: 0.92rem; color: #555; line-height: 1.6; margin-bottom: 22px;">${prod.description}</p>
        
        <div class="form-group">
          <label style="font-weight: 700; font-size: 0.85rem;">Select Size / Variant:</label>
          <select id="modalVariantSelect" class="form-control" style="font-weight: 500;">
            ${variants.map(v => `
              <option value="${v.variant_name}" ${v.stock_quantity <= 0 ? 'disabled' : ''}>
                ${v.variant_name} ${v.stock_quantity > 0 ? `(${v.stock_quantity} in stock)` : '(Sold Out)'}
              </option>
            `).join('')}
          </select>
        </div>

        <div class="form-group">
          <label style="font-weight: 700; font-size: 0.85rem;">Quantity:</label>
          <input type="number" id="modalQtyInput" class="form-control" value="1" min="1" max="10">
        </div>

        <div style="display: flex; gap: 12px; margin-top: 25px;">
          <button class="btn btn-gold btn-block btn-glow" onclick="addToCartFromModal(${prod.id})">
            <i class="fa-solid fa-bag-shopping"></i> Add to Shopping Bag
          </button>
        </div>

        <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid var(--border-subtle); display: flex; gap: 15px; font-size: 0.8rem; color: #666;">
          <span><i class="fa-solid fa-truck-fast gold-icon"></i> Express Doorstep Dispatch</span>
          <span><i class="fa-solid fa-shield-halved gold-icon"></i> Guaranteed Authenticity</span>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('active');
}

function switchModalMedia(type) {
  const photoView = document.getElementById('modalPhotoView');
  const videoView = document.getElementById('modalVideoView');
  const photoBtn = document.getElementById('modalPhotoTabBtn');
  const videoBtn = document.getElementById('modalVideoTabBtn');
  if (type === 'video') {
    if (photoView) photoView.style.display = 'none';
    if (videoView) {
      videoView.style.display = 'block';
      const vid = videoView.querySelector('video');
      if (vid) vid.play().catch(() => {});
    }
    if (photoBtn) photoBtn.classList.remove('active');
    if (videoBtn) videoBtn.classList.add('active');
  } else {
    if (photoView) photoView.style.display = 'block';
    if (videoView) {
      videoView.style.display = 'none';
      const vid = videoView.querySelector('video');
      if (vid) vid.pause();
    }
    if (photoBtn) photoBtn.classList.add('active');
    if (videoBtn) videoBtn.classList.remove('active');
  }
}

function closeProductModal() {
  const modal = document.getElementById('productModal');
  if (modal) {
    const vid = modal.querySelector('video');
    if (vid) vid.pause();
    modal.classList.remove('active');
  }
}

function addToCartFromModal(prodId) {
  const prod = allProducts.find(p => p.id === prodId);
  if (!prod) return;

  const variantSelect = document.getElementById('modalVariantSelect');
  const qtyInput = document.getElementById('modalQtyInput');

  const variantName = variantSelect ? variantSelect.value : 'Standard';
  const qty = parseInt(qtyInput ? qtyInput.value : 1, 10);

  const existingIndex = cart.findIndex(c => c.product_id === prod.id && c.variant_name === variantName);
  if (existingIndex > -1) {
    cart[existingIndex].quantity += qty;
  } else {
    cart.push({
      product_id: prod.id,
      name: prod.name,
      variant_name: variantName,
      price: prod.price,
      image_url: prod.image_url,
      quantity: qty
    });
  }

  saveCartToStorage();
  closeProductModal();
  toggleCartDrawer(true);
}

// Cart Drawer
function toggleCartDrawer(forceOpen = false) {
  const drawer = document.getElementById('cartDrawer');
  if (forceOpen) {
    drawer.classList.add('open');
  } else {
    drawer.classList.toggle('open');
  }
}

function updateCartUI() {
  const countEl = document.getElementById('cartCount');
  const drawerBody = document.getElementById('cartDrawerBody');
  const drawerFooter = document.getElementById('cartDrawerFooter');
  const subtotalEl = document.getElementById('cartSubtotal');

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (countEl) countEl.textContent = totalItems;

  if (cart.length === 0) {
    if (drawerBody) {
      drawerBody.innerHTML = `
        <div style="text-align: center; padding: 50px 10px;">
          <i class="fa-solid fa-bag-shopping fa-3x" style="color: #ddd; margin-bottom: 15px;"></i>
          <p style="color: #777; font-size: 0.95rem;">Your shopping bag is currently empty.</p>
          <a href="#catalogue" onclick="toggleCartDrawer()" class="btn btn-gold btn-sm" style="margin-top: 15px;">Browse Catalogue</a>
        </div>`;
    }
    if (drawerFooter) drawerFooter.style.display = 'none';
    return;
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (drawerBody) {
    drawerBody.innerHTML = cart.map((item, index) => `
      <div class="cart-item">
        <img src="${item.image_url}" alt="${item.name}">
        <div class="cart-item-info">
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-variant">${item.variant_name}</div>
          <div style="font-weight: 700; font-size: 0.95rem; margin-top: 4px;">GHS ${item.price.toFixed(2)}</div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
            <div style="display: flex; align-items: center; border: 1px solid #ddd; border-radius: 4px;">
              <button onclick="changeCartQty(${index}, -1)" style="padding: 2px 8px; border:none; background:none; cursor:pointer;">-</button>
              <span style="padding: 0 8px; font-weight:700; font-size:0.85rem;">${item.quantity}</span>
              <button onclick="changeCartQty(${index}, 1)" style="padding: 2px 8px; border:none; background:none; cursor:pointer;">+</button>
            </div>
            <button onclick="removeCartItem(${index})" style="background:none; border:none; color:#c93b3b; cursor:pointer; font-size:0.85rem;">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  if (drawerFooter) drawerFooter.style.display = 'block';
  if (subtotalEl) subtotalEl.textContent = `GHS ${subtotal.toFixed(2)}`;
}

function changeCartQty(index, delta) {
  if (cart[index]) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
      cart.splice(index, 1);
    }
    saveCartToStorage();
  }
}

function removeCartItem(index) {
  cart.splice(index, 1);
  saveCartToStorage();
}

// Checkout Modal
function openCheckoutModal() {
  if (cart.length === 0) return;
  toggleCartDrawer(false);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 30.00;
  const grandTotal = subtotal + deliveryFee;

  document.getElementById('checkoutSubtotal').textContent = `GHS ${subtotal.toFixed(2)}`;
  document.getElementById('checkoutGrandTotal').textContent = `GHS ${grandTotal.toFixed(2)}`;

  document.getElementById('checkoutModal').classList.add('active');
}

function closeCheckoutModal() {
  document.getElementById('checkoutModal').classList.remove('active');
}

// Geolocation Pinpoint
function requestCustomerLocation() {
  const statusEl = document.getElementById('locationStatus');
  const btn = document.getElementById('geoBtn');

  if (!navigator.geolocation) {
    statusEl.innerHTML = `<span style="color:#c93b3b;"><i class="fa-solid fa-xmark"></i> Geolocation not supported. Please type address manually.</span>`;
    return;
  }

  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Detecting...`;
  statusEl.innerHTML = `<span>Requesting device GPS permission...</span>`;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const acc = position.coords.accuracy;

      document.getElementById('custLat').value = lat;
      document.getElementById('custLng').value = lng;
      document.getElementById('custAcc').value = `${Math.round(acc)} meters`;

      btn.innerHTML = `<i class="fa-solid fa-check"></i> GPS Attached`;
      btn.classList.add('btn-gold');
      btn.classList.remove('btn-outline-gold');

      statusEl.innerHTML = `
        <span style="color:#27834a; font-weight: 600;">
          <i class="fa-solid fa-circle-check"></i> GPS Pinpoint attached! Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)} (±${Math.round(acc)}m accuracy)
        </span>
      `;
    },
    (error) => {
      btn.innerHTML = `<i class="fa-solid fa-crosshairs"></i> Retry GPS`;
      let errMsg = 'Location permission declined. Please type your detailed address below.';
      statusEl.innerHTML = `<span style="color:#777;"><i class="fa-solid fa-circle-info"></i> ${errMsg}</span>`;
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

// Checkout Submit
async function handleCheckoutSubmit(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('submitOrderBtn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing & Sending Notifications...`;

  const orderPayload = {
    customer: {
      full_name: document.getElementById('custName').value.trim(),
      phone: document.getElementById('custPhone').value.trim(),
      email: document.getElementById('custEmail').value.trim(),
      delivery_address: document.getElementById('custAddress').value.trim(),
      latitude: document.getElementById('custLat').value ? parseFloat(document.getElementById('custLat').value) : null,
      longitude: document.getElementById('custLng').value ? parseFloat(document.getElementById('custLng').value) : null,
      location_accuracy: document.getElementById('custAcc').value || null
    },
    items: cart.map(i => ({
      product_id: i.product_id,
      variant_name: i.variant_name,
      quantity: i.quantity
    })),
    delivery_fee: 30.00,
    payment_method: document.getElementById('paymentMethod').value,
    notes: document.getElementById('orderNotes').value.trim()
  };

  try {
    const res = await fetch('/api/orders/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to place order.');

    cart = [];
    saveCartToStorage();
    closeCheckoutModal();

    showOrderSuccess(result.order);
  } catch (err) {
    alert(`Order failed: ${err.message}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<i class="fa-solid fa-lock"></i> Place Order & Send Confirmation`;
  }
}

function showOrderSuccess(order) {
  const card = document.getElementById('successOrderCard');
  card.innerHTML = `
    <div style="background: #fff; padding: 22px; border-radius: var(--radius-md); border: 1px solid var(--border-gold); text-align: left;">
      <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 14px;">
        <span style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; color: #777;">Tracking Code:</span>
        <span style="color: var(--gold-primary); font-family: var(--font-cinzel); font-weight: 700; font-size: 1.3rem;">#${order.order_code}</span>
      </div>
      <div style="margin-bottom: 6px;"><strong>Customer:</strong> ${order.customer.full_name} (${order.customer.phone})</div>
      <div style="margin-bottom: 6px;"><strong>Delivery Destination:</strong> ${order.customer.delivery_address}</div>
      ${order.customer.latitude ? `<div style="font-size: 0.85rem; color: #27834a; margin-bottom: 8px;"><i class="fa-solid fa-location-crosshairs"></i> GPS Coordinates: ${order.customer.latitude}, ${order.customer.longitude}</div>` : ''}
      <div style="margin-bottom: 6px;"><strong>Payment Method:</strong> ${order.payment_method}</div>
      <div style="border-top: 1px solid #eee; padding-top: 12px; margin-top: 12px; font-weight: 700; display: flex; justify-content: space-between; font-size: 1.15rem;">
        <span>Total Amount:</span>
        <span style="color: var(--noir-deep);">GHS ${order.total_amount.toFixed(2)}</span>
      </div>
      <div style="margin-top: 18px; font-size: 0.85rem; background: var(--bg-page); padding: 12px; border-radius: var(--radius-sm); border-left: 3px solid var(--gold-primary);">
        <i class="fa-solid fa-paper-plane gold-icon"></i> <strong>Real-Time Notification:</strong> SMS alert queued for <strong>${order.customer.phone}</strong> and record stored in the persistent database.
      </div>
    </div>
  `;

  document.getElementById('orderSuccessModal').classList.add('active');
  fetchProducts();
}

function closeSuccessModal() {
  document.getElementById('orderSuccessModal').classList.remove('active');
}

// Client Concierge Inquiry
function openConciergeModal() {
  const contactSection = document.getElementById('contact');
  if (contactSection) contactSection.scrollIntoView({ behavior: 'smooth' });
}

async function handleInquirySubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('inqSubmitBtn');
  const alertEl = document.getElementById('inqAlert');

  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Transmitting...`;

  const payload = {
    name: document.getElementById('inqName').value.trim(),
    phone: document.getElementById('inqPhone').value.trim(),
    email: document.getElementById('inqEmail').value.trim(),
    category: document.getElementById('inqCategory').value,
    message: document.getElementById('inqMessage').value.trim()
  };

  try {
    const res = await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit inquiry.');

    alertEl.style.display = 'block';
    alertEl.style.background = '#d4edda';
    alertEl.style.color = '#155724';
    alertEl.style.padding = '12px';
    alertEl.style.borderRadius = 'var(--radius-sm)';
    alertEl.style.marginTop = '15px';
    alertEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> Thank you ${payload.name}! Your request has been delivered to Miss Roses Exquisite. We will contact you at <strong>${payload.phone}</strong> shortly.`;

    document.getElementById('inquiryForm').reset();
  } catch (err) {
    alertEl.style.display = 'block';
    alertEl.style.background = '#f8d7da';
    alertEl.style.color = '#721c24';
    alertEl.style.padding = '12px';
    alertEl.textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Submit to Concierge Desk`;
  }
}

// Track Order
async function trackOrder() {
  const input = document.getElementById('trackerInput');
  const resultDiv = document.getElementById('trackerResult');
  const code = input ? input.value.trim() : '';

  if (!code) {
    alert('Please enter your Order Code (e.g. MRE-123456).');
    return;
  }

  resultDiv.style.display = 'block';
  resultDiv.innerHTML = `<p style="text-align:center;"><i class="fa-solid fa-spinner fa-spin gold-icon"></i> Retrieving order records...</p>`;

  try {
    const res = await fetch(`/api/orders/track/${encodeURIComponent(code)}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Order record not found.');

    const o = data.order;
    resultDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-subtle); padding-bottom: 14px; margin-bottom: 14px;">
        <div>
          <h3 style="font-family: var(--font-cinzel); font-size: 1.3rem;">Order #${o.order_code}</h3>
          <span style="font-size: 0.8rem; color: #777;">Placed on ${new Date(o.created_at).toLocaleDateString()}</span>
        </div>
        <span class="badge-status" style="background: var(--noir-deep); color: var(--gold-primary); padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 0.85rem;">
          ${o.order_status}
        </span>
      </div>

      <div style="margin-bottom: 8px;"><strong>Customer:</strong> ${o.customer.full_name}</div>
      <div style="margin-bottom: 8px;"><strong>Destination:</strong> ${o.customer.delivery_address}</div>
      <div style="margin-bottom: 12px;"><strong>Items:</strong> ${o.items.map(i => `${i.quantity}x ${i.product_name} (${i.variant_name})`).join(', ')}</div>
      <div style="font-size: 1.1rem; font-weight: 700; color: var(--noir-deep); border-top: 1px solid var(--border-subtle); padding-top: 10px;">
        Total: GHS ${o.total_amount.toFixed(2)} (${o.payment_method})
      </div>
    `;
  } catch (err) {
    resultDiv.innerHTML = `<div style="color: #c93b3b; text-align: center;"><i class="fa-solid fa-circle-exclamation"></i> ${err.message}</div>`;
  }
}

// ==============================================================================
// LIVE ON-SITE CHAT ENGINE (Client <-> Boutique Shop)
// ==============================================================================
function toggleLiveChat() {
  const win = document.getElementById('liveChatWindow');
  win.classList.toggle('active');
  if (win.classList.contains('active')) {
    fetchChatHistory();
    startChatPolling();
  } else {
    stopChatPolling();
  }
}

function openLiveChat() {
  const win = document.getElementById('liveChatWindow');
  win.classList.add('active');
  fetchChatHistory();
  startChatPolling();
}

function closeLiveChat() {
  const win = document.getElementById('liveChatWindow');
  win.classList.remove('active');
  stopChatPolling();
}

async function initChatSession() {
  try {
    const res = await fetch(`/api/chat/${chatSessionId}`);
    const data = await res.json();
    if (data.chat && data.chat.messages) {
      renderChatMessages(data.chat.messages);
    }
  } catch (e) {
    console.log('Chat session init error:', e);
  }
}

async function fetchChatHistory() {
  try {
    const res = await fetch(`/api/chat/${chatSessionId}`);
    const data = await res.json();
    if (data.chat && data.chat.messages) {
      renderChatMessages(data.chat.messages);
    }
  } catch (e) {
    console.error('Fetch chat failed:', e);
  }
}

function startChatPolling() {
  if (chatPollingInterval) clearInterval(chatPollingInterval);
  chatPollingInterval = setInterval(fetchChatHistory, 3000);
}

function stopChatPolling() {
  if (chatPollingInterval) {
    clearInterval(chatPollingInterval);
    chatPollingInterval = null;
  }
}

function renderChatMessages(messages) {
  const container = document.getElementById('chatMessages');
  if (!container) return;

  container.innerHTML = messages.map(m => {
    const isClient = m.sender === 'client';
    const timeFormatted = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `
      <div class="chat-message ${m.sender}">
        <div class="message-sender">${isClient ? 'You' : m.sender_name}</div>
        <div class="message-bubble">${m.text}</div>
        <span class="message-time">${timeFormatted}</span>
      </div>
    `;
  }).join('');

  container.scrollTop = container.scrollHeight;
}

async function handleChatSend(e) {
  e.preventDefault();
  const input = document.getElementById('chatInput');
  const text = input ? input.value.trim() : '';
  if (!text) return;

  input.value = '';

  try {
    const res = await fetch(`/api/chat/${chatSessionId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: 'client',
        senderName: 'Shopper',
        text
      })
    });
    const data = await res.json();
    if (data.chat && data.chat.messages) {
      renderChatMessages(data.chat.messages);
    }
  } catch (err) {
    console.error('Failed to send chat message:', err);
  }
}

function sendQuickChat(promptText) {
  const input = document.getElementById('chatInput');
  if (input) {
    input.value = promptText;
    document.getElementById('chatForm').dispatchEvent(new Event('submit'));
  }
}
