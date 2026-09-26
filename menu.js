/* ---------------- PRODUCT DATA + MENU RENDERING (menu.html only) ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  const menuGrid = document.getElementById('menuGrid');
  if (!menuGrid) return;

  const fmt = window.CB_fmt || (n => 'Rs. ' + n.toLocaleString('en-PK'));

  // Used only if content/products.json can't be loaded (e.g. opening this file
  // directly from disk instead of through a web server, or the live site is offline).
  const FALLBACK_PRODUCTS = [
    {
      id: 'brownies',
      name: 'Brownies',
      tag: 'Bestseller',
      desc: 'Dense, fudgy, cut thick — pick a size and a topping.',
      img: 'https://images.pexels.com/photos/2373520/pexels-photo-2373520.jpeg?auto=compress&cs=tinysrgb&w=500',
      sizes: [
        { label:'9 pc',  price:1200 },
        { label:'12 pc', price:1500 },
        { label:'16 pc', price:1900 },
        { label:'20 pc', price:2300 },
        { label:'24 pc', price:2700 }
      ],
      toppings: [
        { label:'No Topping', price:0 },
        { label:'Nutella',    price:150 },
        { label:'Lotus',      price:150 },
        { label:'Oreo',       price:120 },
        { label:'Dairy Milk', price:130 }
      ]
    },
    {
      id: 'cakes',
      name: 'Cakes',
      tag: '',
      desc: 'Layered, frosted and finished to order for any celebration.',
      img: 'https://images.pexels.com/photos/17289681/pexels-photo-17289681.jpeg?auto=compress&cs=tinysrgb&w=500',
      sizes: [
        { label:'1 lb', price:1800 },
        { label:'2 lb', price:3200 },
        { label:'3 lb', price:4500 }
      ]
    },
    {
      id: 'tresleches',
      name: 'Tres Leches',
      tag: 'Signature',
      desc: 'Soaked slow in three milks, finished with cream. Our most-requested slice.',
      img: 'https://images.pexels.com/photos/22674098/pexels-photo-22674098.jpeg?auto=compress&cs=tinysrgb&w=500',
      sizes: [
        { label:'1 lb', price:2000 },
        { label:'2 lb', price:3600 }
      ]
    },
    {
      id: 'more',
      name: 'Cupcakes & More',
      tag: '',
      desc: 'Cupcakes and dessert jars — ask what is on today’s specials list.',
      img: 'https://images.pexels.com/photos/3592423/pexels-photo-3592423.jpeg?auto=compress&cs=tinysrgb&w=500',
      sizes: [
        { label:'Box of 6',  price:1400 },
        { label:'Box of 12', price:2600 }
      ]
    }
  ];

  function renderMenu(PRODUCTS) {
    menuGrid.innerHTML = '';
    const selection = {}; // productId -> { sizeIndex, toppingIndex, qty }

    PRODUCTS.forEach((p, pi) => {
      selection[p.id] = { sizeIndex: 0, toppingIndex: 0, qty: 1 };
      const hasToppings = Array.isArray(p.toppings) && p.toppings.length > 0;

      const card = document.createElement('div');
      card.className = 'menu-card reveal' + (pi % 2 === 1 ? ' d1' : '');
      card.innerHTML = `
        <div class="menu-photo">
          ${p.tag ? `<span class="menu-tag">${p.tag}</span>` : ''}
          <a href="product/${p.id}"><img src="${p.img}" alt="${p.name}"></a>
        </div>
        <div class="menu-body">
          <h3><a href="product/${p.id}">${p.name}</a></h3>
          <p class="desc">${p.desc}</p>

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

          <div class="buy-row">
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
      `;
      menuGrid.appendChild(card);

      const priceVal = card.querySelector('.price-val');
      const qtyVal = card.querySelector('.qty-val');
      const addBtn = card.querySelector('.add-btn');

      function updatePrice(){
        const sizePrice = p.sizes[selection[p.id].sizeIndex].price;
        const toppingPrice = hasToppings ? p.toppings[selection[p.id].toppingIndex].price : 0;
        priceVal.textContent = fmt(sizePrice + toppingPrice);
      }

      card.querySelectorAll('.size-options .size-pill').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          card.querySelectorAll('.size-options .size-pill').forEach(b=>b.classList.remove('active'));
          btn.classList.add('active');
          selection[p.id].sizeIndex = parseInt(btn.dataset.sizeIndex,10);
          updatePrice();
        });
      });

      const toppingSelect = card.querySelector('.topping-select');
      if(toppingSelect){
        toppingSelect.addEventListener('change', ()=>{
          selection[p.id].toppingIndex = parseInt(toppingSelect.value,10);
          updatePrice();
        });
      }

      card.querySelector('.qty-minus').addEventListener('click', ()=>{
        selection[p.id].qty = Math.max(1, selection[p.id].qty - 1);
        qtyVal.textContent = selection[p.id].qty;
      });
      card.querySelector('.qty-plus').addEventListener('click', ()=>{
        selection[p.id].qty = Math.min(20, selection[p.id].qty + 1);
        qtyVal.textContent = selection[p.id].qty;
      });

      addBtn.addEventListener('click', ()=>{
        const sel = selection[p.id];
        const size = p.sizes[sel.sizeIndex];
        const topping = hasToppings ? p.toppings[sel.toppingIndex] : null;
        const toppingHasPrice = topping && topping.price > 0;
        window.CB_addToCart({
          productId: p.id,
          name: p.name,
          img: p.img,
          sizeLabel: size.label + (toppingHasPrice ? ' + ' + topping.label : ''),
          price: size.price + (topping ? topping.price : 0),
          qty: sel.qty
        });
        addBtn.textContent = 'Added ✓';
        addBtn.classList.add('added');
        setTimeout(()=>{ addBtn.textContent='Add to Cart'; addBtn.classList.remove('added'); }, 1300);
        selection[p.id].qty = 1;
        qtyVal.textContent = 1;
      });
    });

    // Re-run reveal observer for cards injected after DOMContentLoaded's initial pass
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      menuGrid.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
      menuGrid.querySelectorAll('.reveal').forEach(el => io.observe(el));
    }
  }

  fetch('content/products.json')
    .then(res => { if (!res.ok) throw new Error('bad response'); return res.json(); })
    .then(data => renderMenu(Array.isArray(data.products) ? data.products : FALLBACK_PRODUCTS))
    .catch(() => {
      console.warn('Could not load content/products.json (are you opening this file directly instead of through a web server?). Showing default menu data instead.');
      renderMenu(FALLBACK_PRODUCTS);
    });
});
