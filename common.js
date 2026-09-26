/* ---------------- SHARED SITE LOGIC (nav, cart, reveal, counters) ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const fmt = n => 'Rs. ' + n.toLocaleString('en-PK');
  window.CB_fmt = fmt;

  /* ---------------- CART STATE (shared across pages via localStorage) ---------------- */
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem('cb_cart') || '[]'); } catch (e) { cart = []; }

  const cartItemsEl = document.getElementById('cartItems');
  const cartSubtotalEl = document.getElementById('cartSubtotal');
  const cartCountEl = document.getElementById('cartCount');
  const checkoutBtn = document.getElementById('checkoutBtn');

  function saveCart() {
    localStorage.setItem('cb_cart', JSON.stringify(cart));
  }

  function addToCart(item) {
    const existing = cart.find(c => c.productId === item.productId && c.sizeLabel === item.sizeLabel);
    if (existing) { existing.qty += item.qty; }
    else { cart.push(item); }
    saveCart();
    renderCart();
    openCart();
  }
  window.CB_addToCart = addToCart;

  function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    renderCart();
  }

  function renderCart() {
    if (!cartItemsEl) return;
    const totalQty = cart.reduce((sum, c) => sum + c.qty, 0);
    if (cartCountEl) {
      cartCountEl.textContent = totalQty;
      cartCountEl.classList.toggle('show', totalQty > 0);
    }

    if (cart.length === 0) {
      cartItemsEl.innerHTML = `<div class="cart-empty"><div class="emoji">🧁</div>Your cart is empty.<br>Add something sweet from the menu.</div>`;
      if (checkoutBtn) { checkoutBtn.style.pointerEvents = 'none'; checkoutBtn.style.opacity = '0.5'; }
    } else {
      if (checkoutBtn) { checkoutBtn.style.pointerEvents = 'auto'; checkoutBtn.style.opacity = '1'; }
      cartItemsEl.innerHTML = cart.map((c, i) => `
        <div class="cart-line">
          <img src="${c.img}" alt="${c.name}">
          <div class="cart-line-info">
            <div class="name">${c.name}</div>
            <div class="size">${c.sizeLabel} × ${c.qty}</div>
            <div class="cart-line-bottom">
              <span class="cart-line-price">${fmt(c.price * c.qty)}</span>
              <button class="cart-remove" data-index="${i}">Remove</button>
            </div>
          </div>
        </div>
      `).join('');
      cartItemsEl.querySelectorAll('.cart-remove').forEach(btn => {
        btn.addEventListener('click', () => removeFromCart(parseInt(btn.dataset.index, 10)));
      });
    }

    const subtotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
    if (cartSubtotalEl) cartSubtotalEl.textContent = fmt(subtotal);

    if (checkoutBtn) {
      const lines = cart.map(c => `• ${c.name} (${c.sizeLabel}) x${c.qty} — ${fmt(c.price * c.qty)}`).join('\n');
      const msg = `Hi Crunchy Bites! I'd like to order:\n\n${lines}\n\nSubtotal: ${fmt(subtotal)}\n\nPlease confirm availability and delivery date.`;
      const whatsappNumber = (window.CB_SETTINGS && window.CB_SETTINGS.whatsapp) || '923218736373';
      checkoutBtn.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
    }
  }
  window.CB_renderCart = renderCart;
  renderCart();

  /* ---------------- CART DRAWER OPEN/CLOSE ---------------- */
  const overlay = document.getElementById('cartOverlay');
  const drawer = document.getElementById('cartDrawer');
  function openCart() { if (overlay && drawer) { overlay.classList.add('open'); drawer.classList.add('open'); } }
  function closeCart() { if (overlay && drawer) { overlay.classList.remove('open'); drawer.classList.remove('open'); } }
  const cartOpenBtn = document.getElementById('cartOpenBtn');
  const cartCloseBtn = document.getElementById('cartCloseBtn');
  if (cartOpenBtn) cartOpenBtn.addEventListener('click', openCart);
  if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCart);
  if (overlay) overlay.addEventListener('click', closeCart);

  /* ---------------- MOBILE NAV ---------------- */
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));
  }

  /* ---------------- HEADER SCROLL ---------------- */
  const header = document.getElementById('siteHeader');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }

  /* ---------------- SMOOTH IN-PAGE SCROLL ---------------- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - 84;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });

  /* ---------------- REVEAL ON SCROLL ---------------- */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealEls = document.querySelectorAll('.reveal');
  if (prefersReduced) {
    revealEls.forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  }

  /* ---------------- ANIMATED COUNTERS ---------------- */
  const counters = document.querySelectorAll('[data-count]');
  const countIo = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const dur = 1400;
        const start = performance.now();
        function tick(now) {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          const val = Math.round(target * eased);
          el.textContent = val + suffix;
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        countIo.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(c => countIo.observe(c));
});
