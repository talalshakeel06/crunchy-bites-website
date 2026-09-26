function getSlugFromUrl() {
  // Works with a pretty URL like /product/chocolate-cake (via Netlify's
  // redirect rule serving this same file), or a local ?slug=chocolate-cake
  // query string when opened without a rewrite-capable server.
  const params = new URLSearchParams(location.search);
  if (params.get('slug')) return params.get('slug');

  const parts = location.pathname.split('/').filter(Boolean);
  const idx = parts.indexOf('product');
  const next = idx !== -1 ? parts[idx + 1] : null;
  if (next && !next.endsWith('.html')) return decodeURIComponent(next);
  return null;
}

function renderNotFound(container) {
  container.innerHTML = `
    <div class="product-not-found">
      <div class="emoji">🧁</div>
      <h2>We couldn't find that product</h2>
      <p style="color:var(--cocoa-soft); margin-top:10px;">It may have been renamed or is no longer available.</p>
      <div style="margin-top:24px;"><a class="btn btn-primary" href="../menu.html">Back to the Menu →</a></div>
    </div>
  `;
}

function renderProduct(container, p) {
  const hasToppings = Array.isArray(p.toppings) && p.toppings.length > 0;
  const fmt = window.CB_fmt || (n => 'Rs. ' + n.toLocaleString('en-PK'));

  document.getElementById('pageTitle').textContent = `${p.name} — Crunchy Bites | Karachi`;
  document.getElementById('pageDescription').setAttribute('content', p.desc || '');
  document.getElementById('productCrumbName').textContent = p.name;

  container.innerHTML = `
    <div class="product-detail">
      <div>
        <div class="product-gallery-main"><img src="${p.img}" alt="${p.name}"></div>
      </div>
      <div class="product-info">
        ${p.tag ? `<span class="menu-tag" style="position:static; display:inline-block;">${p.tag}</span>` : ''}
        <h1>${p.name}</h1>
        <p class="desc">${p.desc || ''}</p>

        <span class="option-label">Size</span>
        <div class="size-row size-options">
          ${p.sizes.map((s,i)=>`<button class="size-pill${i===0?' active':''}" data-size-index="${i}">${s.label}</button>`).join('')}
        </div>

        ${hasToppings ? `
        <span class="option-label">Topping</span>
        <div class="topping-select-wrap">
          <select class="topping-select">
            ${p.toppings.map((t,i)=>`<option value="${i}">${t.label}${t.price>0?' (+'+fmt(t.price)+')':''}</option>`).join('')}
          </select>
        </div>` : ''}

        <div class="buy-row" style="margin-top:16px;">
          <div class="price-tag"><span class="price-val">${fmt(p.sizes[0].price)}</span></div>
          <div class="buy-controls">
            <div class="qty-stepper">
              <button class="qty-minus" aria-label="Decrease quantity">−</button>
              <span class="qty-val">1</span>
              <button class="qty-plus" aria-label="Increase quantity">+</button>
            </div>
            <button class="add-btn">Add to Cart</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const selection = { sizeIndex: 0, toppingIndex: 0, qty: 1 };
  const priceVal = container.querySelector('.price-val');
  const qtyVal = container.querySelector('.qty-val');
  const addBtn = container.querySelector('.add-btn');

  function updatePrice() {
    const sizePrice = p.sizes[selection.sizeIndex].price;
    const toppingPrice = hasToppings ? p.toppings[selection.toppingIndex].price : 0;
    priceVal.textContent = fmt(sizePrice + toppingPrice);
  }

  container.querySelectorAll('.size-options .size-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.size-options .size-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selection.sizeIndex = parseInt(btn.dataset.sizeIndex, 10);
      updatePrice();
    });
  });

  const toppingSelect = container.querySelector('.topping-select');
  if (toppingSelect) {
    toppingSelect.addEventListener('change', () => {
      selection.toppingIndex = parseInt(toppingSelect.value, 10);
      updatePrice();
    });
  }

  container.querySelector('.qty-minus').addEventListener('click', () => {
    selection.qty = Math.max(1, selection.qty - 1);
    qtyVal.textContent = selection.qty;
  });
  container.querySelector('.qty-plus').addEventListener('click', () => {
    selection.qty = Math.min(20, selection.qty + 1);
    qtyVal.textContent = selection.qty;
  });

  addBtn.addEventListener('click', () => {
    const size = p.sizes[selection.sizeIndex];
    const topping = hasToppings ? p.toppings[selection.toppingIndex] : null;
    const toppingHasPrice = topping && topping.price > 0;
    window.CB_addToCart({
      productId: p.id,
      name: p.name,
      img: p.img,
      sizeLabel: size.label + (toppingHasPrice ? ' + ' + topping.label : ''),
      price: size.price + (topping ? topping.price : 0),
      qty: selection.qty,
    });
    addBtn.textContent = 'Added ✓';
    addBtn.classList.add('added');
    setTimeout(() => { addBtn.textContent = 'Add to Cart'; addBtn.classList.remove('added'); }, 1300);
    selection.qty = 1;
    qtyVal.textContent = 1;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('productContent');
  const slug = getSlugFromUrl();

  if (!slug) {
    renderNotFound(container);
    return;
  }

  fetch('../content/products.json')
    .then(res => { if (!res.ok) throw new Error('bad response'); return res.json(); })
    .then(data => {
      const product = (data.products || []).find(p => p.id === slug);
      if (!product) {
        renderNotFound(container);
      } else {
        renderProduct(container, product);
      }
    })
    .catch((err) => {
      console.error('Could not load products.json.', err);
      container.innerHTML = `<p style="color:var(--cocoa-soft);">Sorry, this product couldn't load right now. Please message us on <a href="https://wa.me/923218736373" target="_blank" rel="noopener" style="color:var(--berry); text-decoration:underline;">WhatsApp</a>.</p>`;
    });
});
