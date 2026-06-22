// Update this when your deployed URL changes
const APP_URL = 'https://wardrobe-app.vercel.app';

// ── DOM refs ──────────────────────────────────────────────────────────────────
const states = {
  loading: document.getElementById('state-loading'),
  found:   document.getElementById('state-found'),
  empty:   document.getElementById('state-empty'),
  error:   document.getElementById('state-error'),
};

function show(name) {
  Object.entries(states).forEach(([k, el]) => el.classList.toggle('hidden', k !== name));
}

// ── Product data extraction (runs inside the page context) ────────────────────
function extractProductData() {
  const getMeta = prop => {
    const el = document.querySelector(
      `meta[property="${prop}"], meta[name="${prop}"]`
    );
    return el?.content?.trim() || null;
  };

  const images = new Set();
  const addImg = src => {
    if (!src || src.startsWith('data:')) return;
    try {
      const abs = new URL(src, location.href).href;
      if (abs.startsWith('http')) images.add(abs);
    } catch {}
  };

  // Meta image tags
  addImg(getMeta('og:image'));
  addImg(getMeta('og:image:url'));
  addImg(getMeta('twitter:image'));
  addImg(getMeta('twitter:image:src'));

  // JSON-LD
  let name = '', brand = '', price = '', material = '';

  const findProduct = obj => {
    if (!obj || typeof obj !== 'object') return null;
    if (obj['@type'] === 'Product') return obj;
    if (Array.isArray(obj)) {
      for (const o of obj) { const r = findProduct(o); if (r) return r; }
    }
    for (const v of Object.values(obj)) { const r = findProduct(v); if (r) return r; }
    return null;
  };

  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const product = findProduct(JSON.parse(script.textContent));
      if (!product) continue;

      if (!name && product.name)   name   = String(product.name).slice(0, 120);
      if (!brand && product.brand) brand  = (typeof product.brand === 'string'
        ? product.brand : product.brand?.name || '').slice(0, 80);
      if (!material && product.material) material = String(product.material).slice(0, 100);

      if (!material && product.additionalProperty) {
        const props = Array.isArray(product.additionalProperty)
          ? product.additionalProperty : [product.additionalProperty];
        const comp = props.find(p =>
          /^(?:composition|material|fabric|fiber|content)$/i.test(String(p?.name || '').trim())
        );
        if (comp?.value) material = String(comp.value).slice(0, 100);
      }

      if (!price && product.offers) {
        const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
        if (offer?.price != null) price = String(offer.price);
      }

      const imgList = Array.isArray(product.image)
        ? product.image : product.image ? [product.image] : [];
      for (const img of imgList) addImg(typeof img === 'string' ? img : img?.url);
    } catch {}
  }

  // Price fallbacks
  if (!price) price = getMeta('product:price:amount') || getMeta('og:price:amount') || '';
  if (!price) {
    const label1 = getMeta('twitter:label1') || '';
    const label2 = getMeta('twitter:label2') || '';
    if (/price/i.test(label1)) price = getMeta('twitter:data1') || '';
    else if (/price/i.test(label2)) price = getMeta('twitter:data2') || '';
  }
  if (!price) {
    const el = document.querySelector('[itemprop="price"]');
    if (el) price = el.getAttribute('content') || el.textContent?.trim() || '';
  }
  price = price.replace(/^[^0-9]*/, '').trim();

  if (!name) {
    const el = document.querySelector('[itemprop="name"]');
    name = el?.textContent?.trim() || getMeta('og:title') || document.title || '';
  }

  // Clean name: strip trailing "| L | Farfetch" style suffixes iteratively
  for (let i = 0; i < 3; i++) {
    const cleaned = name.replace(/\s*[|–—]\s*[^|–—]{1,50}$/, '').trim();
    if (cleaned === name || cleaned.length < 3) break;
    name = cleaned;
  }

  // Material fallback from description
  if (!material) {
    const desc = getMeta('og:description') || getMeta('description') || '';
    const pct  = desc.match(/\b(\d+\s*%\s*\w+(?:[,\s&+]+\d+\s*%\s*\w+)*)/i);
    const word = desc.match(/\b(silk|cotton|linen|wool|cashmere|polyester|nylon|leather|suede|denim|satin|velvet|chiffon|georgette|rayon|viscose|bamboo|lyocell|tencel|modal|alpaca|mohair|angora)\b/i);
    const hit  = pct?.[1] || word?.[1] || '';
    if (hit) material = hit.charAt(0).toUpperCase() + hit.slice(1);
  }

  // DOM images — the big advantage over server-side: we see JS-rendered & lazy-loaded images
  for (const img of document.querySelectorAll('img')) {
    if (images.size >= 20) break;
    const src = img.currentSrc || img.src
      || img.dataset.src || img.dataset.lazySrc
      || img.getAttribute('data-original') || '';
    if (!src || src.startsWith('data:')) continue;
    if (/logo|icon|avatar|sprite|pixel|tracking|beacon|placeholder|blank/i.test(src)) continue;

    // Prefer images that are visually large (product gallery tiles, hero images)
    const natW = img.naturalWidth || 0;
    const natH = img.naturalHeight || 0;
    if (natW > 0 && natW < 80) continue;
    if (natH > 0 && natH < 80) continue;

    // Also grab the highest-resolution from srcset
    if (img.srcset) {
      const parts = img.srcset.split(',')
        .map(s => s.trim().split(/\s+/))
        .filter(p => p[0]);
      const best = parts.sort((a, b) => (parseFloat(b[1]) || 0) - (parseFloat(a[1]) || 0))[0];
      if (best?.[0]) { addImg(best[0]); continue; }
    }

    addImg(src);
  }

  return {
    name:     name.trim().slice(0, 120),
    brand:    brand.trim(),
    price:    price.trim(),
    material: material.trim(),
    images:   [...images].slice(0, 16),
    pageUrl:  location.href,
  };
}

// ── Open app with scraped data ────────────────────────────────────────────────
function openApp(data) {
  const encoded = encodeURIComponent(JSON.stringify(data));
  chrome.tabs.create({ url: `${APP_URL}/?ext_data=${encoded}` });
  window.close();
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  show('loading');

  let tab;
  try {
    [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  } catch {
    document.getElementById('error-msg').textContent = 'Could not access the current tab.';
    show('error');
    return;
  }

  let result;
  try {
    [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractProductData,
    });
  } catch {
    document.getElementById('error-msg').textContent =
      'Cannot read this page (browser pages and extensions are off-limits).';
    show('error');
    return;
  }

  const hasData = result && (result.name || result.images.length > 0);

  if (!hasData) {
    show('empty');
    document.getElementById('btn-save-empty').addEventListener('click', () =>
      openApp({ name: '', brand: '', price: '', material: '', images: [], pageUrl: tab.url })
    );
    return;
  }

  // ── Image grid ──────────────────────────────────────────────────────────────
  const grid = document.getElementById('image-grid');
  let selectedIdx = result.images.length > 0 ? 0 : -1;

  if (result.images.length === 0) {
    const msg = document.createElement('p');
    msg.className = 'no-images';
    msg.textContent = 'No images found on this page.';
    grid.appendChild(msg);
  } else {
    result.images.forEach((url, i) => {
      const cell = document.createElement('div');
      cell.className = 'img-cell' + (i === 0 ? ' selected' : '');
      cell.innerHTML = `
        <img src="${url}" alt="" loading="lazy" />
        <div class="check">
          <svg viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3" /></svg>
        </div>
      `;
      cell.addEventListener('click', () => {
        document.querySelectorAll('.img-cell').forEach(c => c.classList.remove('selected'));
        cell.classList.add('selected');
        selectedIdx = i;
      });
      grid.appendChild(cell);
    });
  }

  // ── Form fields ─────────────────────────────────────────────────────────────
  document.getElementById('field-name').value     = result.name     || '';
  document.getElementById('field-brand').value    = result.brand    || '';
  document.getElementById('field-price').value    = result.price    || '';
  document.getElementById('field-material').value = result.material || '';

  // ── Save button ─────────────────────────────────────────────────────────────
  document.getElementById('btn-save').addEventListener('click', () => {
    const data = {
      name:          document.getElementById('field-name').value.trim(),
      brand:         document.getElementById('field-brand').value.trim(),
      price:         document.getElementById('field-price').value.trim(),
      size:          document.getElementById('field-size').value.trim(),
      material:      document.getElementById('field-material').value.trim(),
      images:        result.images,
      selectedImage: selectedIdx >= 0 ? result.images[selectedIdx] : null,
      pageUrl:       result.pageUrl,
    };
    openApp(data);
  });

  show('found');
})();
