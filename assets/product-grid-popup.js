/**
 * ============================================================================
 * Shop the Look – Product Grid Popup Handler
 * ============================================================================
 *
 * Vanilla JavaScript (no jQuery) that powers the "Shop the Look" grid section.
 *
 * Responsibilities
 * ────────────────
 * 1. Listen for clicks on ".js-stl-hotspot" buttons inside the grid.
 * 2. Fetch the product JSON from Shopify's `/products/<handle>.js` endpoint.
 * 3. Render a compact popup card with:
 *    - product image, title, price & description
 *    - dynamic variant option selectors (buttons for colour, dropdown for size)
 * 4. Handle "Add to Cart" via `/cart/add.js` (POST, JSON body).
 * 5. Special rule: when the selected variant includes **both** "Black" (colour)
 *    **and** "Medium" (size), automatically add the "Soft Winter Jacket"
 *    product to the same cart request.
 * 6. After a successful cart add, dispatch a `cart:update` CustomEvent so the
 *    theme's CartDrawer / header cart-count refresh automatically.
 *
 * Browser support: modern evergreen browsers (uses async/await, fetch, template
 * literals, optional chaining).
 * ============================================================================
 */

(function () {
  'use strict';

  /* ──────────────────────────────────────────────
     DOM references (resolved once on init)
     ────────────────────────────────────────────── */
  /** @type {HTMLElement|null} */ let popup        = null;
  /** @type {HTMLImageElement|null} */ let elImg    = null;
  /** @type {HTMLElement|null} */ let elTitle       = null;
  /** @type {HTMLElement|null} */ let elPrice       = null;
  /** @type {HTMLElement|null} */ let elDesc        = null;
  /** @type {HTMLElement|null} */ let elVariants    = null;
  /** @type {HTMLInputElement|null} */ let elVarId  = null;
  /** @type {HTMLFormElement|null} */ let elForm     = null;
  /** @type {HTMLButtonElement|null} */ let elAtcBtn = null;

  /* ──────────────────────────────────────────────
     State
     ────────────────────────────────────────────── */
  /** Full product object returned by Shopify */
  let currentProduct = null;

  /** Currently resolved variant object */
  let selectedVariant = null;

  /**
   * Map of option-name → selected-value.
   * e.g. { Color: "Black", Size: "Medium" }
   * @type {Record<string, string>}
   */
  let selections = {};

  /* ================================================================
     Initialisation
     ================================================================ */

  /**
   * Resolve cached DOM references and attach all event listeners.
   * Called once when the DOM is ready.
   */
  function init() {
    popup      = document.getElementById('stlPopup');
    elImg      = document.getElementById('stlPopupImg');
    elTitle    = document.getElementById('stlPopupTitle');
    elPrice    = document.getElementById('stlPopupPrice');
    elDesc     = document.getElementById('stlPopupDesc');
    elVariants = document.getElementById('stlPopupVariants');
    elVarId    = document.getElementById('stlVariantId');
    elForm     = document.getElementById('stlAddToCartForm');
    elAtcBtn   = document.getElementById('stlAtcBtn');

    if (!popup) return; // Section not present on this page

    /* --- Hotspot clicks (delegated) --- */
    document.addEventListener('click', handleHotspotClick);

    /* --- Close button --- */
    const closeBtn = popup.querySelector('.js-stl-close');
    if (closeBtn) closeBtn.addEventListener('click', closePopup);

    /* --- Click on backdrop (outside the card) closes popup --- */
    popup.addEventListener('click', function (e) {
      if (e.target === popup) closePopup();
    });

    /* --- ESC key closes popup --- */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && popup.getAttribute('aria-hidden') === 'false') {
        closePopup();
      }
    });

    /* --- Form submit → Add to Cart --- */
    if (elForm) {
      elForm.addEventListener('submit', function (e) {
        e.preventDefault();
        handleAddToCart();
      });
    }
  }

  // Boot when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ================================================================
     Hotspot click handler
     ================================================================ */

  /**
   * Delegated click handler – opens the popup if a hotspot was clicked.
   * @param {MouseEvent} e
   */
  function handleHotspotClick(e) {
    const btn = e.target.closest('.js-stl-hotspot');
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();

    const handle = btn.getAttribute('data-product-handle');
    if (handle) openPopup(handle);
  }

  /* ================================================================
     Open / Close popup
     ================================================================ */

  /**
   * Fetch product data and show the popup card.
   * @param {string} handle – Shopify product handle
   */
  async function openPopup(handle) {
    // Reset state
    currentProduct  = null;
    selectedVariant = null;
    selections      = {};

    // Show popup in loading state
    showPopup();
    setLoading(true);

    try {
      const res = await fetch('/products/' + handle + '.js');
      if (!res.ok) throw new Error('HTTP ' + res.status);

      currentProduct = await res.json();
      populatePopup(currentProduct);
    } catch (err) {
      console.error('[STL] Failed to load product:', err);
      if (elTitle) elTitle.textContent = 'Unable to load product';
    } finally {
      setLoading(false);
    }
  }

  /** Make the popup visible. */
  function showPopup() {
    if (!popup) return;
    popup.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  /** Hide the popup and reset transient state. */
  function closePopup() {
    if (!popup) return;
    popup.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    currentProduct  = null;
    selectedVariant = null;
    selections      = {};
  }

  /**
   * Toggle a simple loading indicator on the ATC button.
   * @param {boolean} loading
   */
  function setLoading(loading) {
    if (!elAtcBtn) return;
    elAtcBtn.disabled = loading;
  }

  /* ================================================================
     Populate popup with product data
     ================================================================ */

  /**
   * Fill every element of the popup card with data from the product JSON.
   * @param {Object} product
   */
  function populatePopup(product) {
    /* ── Image ── */
    if (elImg && product.featured_image) {
      elImg.src = product.featured_image;
      elImg.alt = product.title;
    }

    /* ── Title ── */
    if (elTitle) elTitle.textContent = product.title;

    /* ── Price ── */
    if (elPrice) elPrice.textContent = formatMoney(product.price);

    /* ── Description (strip HTML, clamp via CSS) ── */
    if (elDesc) {
      const raw = product.description || '';
      const tmp = document.createElement('div');
      tmp.innerHTML = raw;
      elDesc.textContent = tmp.textContent || tmp.innerText || '';
    }

    /* ── Variants ── */
    renderVariantSelectors(product);

    /* ── Set default variant ── */
    selectedVariant = product.variants[0];
    if (elVarId && selectedVariant) elVarId.value = selectedVariant.id;
  }

  /* ================================================================
     Variant rendering
     ================================================================ */

  /**
   * Build variant-option UI dynamically from the product's `options` array.
   *
   * Convention used in the Figma design:
   *   • "Size" options → `<select>` dropdown with a "Choose your size" placeholder.
   *   • All other options (e.g. "Color") → a row of `<button>` elements.
   *
   * @param {Object} product – full product JSON
   */
  function renderVariantSelectors(product) {
    if (!elVariants) return;
    elVariants.innerHTML = '';

    // Skip rendering if there are no meaningful options
    if (
      !product.options ||
      product.options.length === 0 ||
      (product.options.length === 1 && product.options[0] === 'Title')
    ) {
      return;
    }

    product.options.forEach(function (optionName, idx) {
      const position = idx + 1;                       // Shopify uses 1-based option positions
      const values   = getUniqueOptionValues(product, position);
      if (values.length === 0) return;

      // Wrapper
      const group = document.createElement('div');
      group.className = 'stl__variant-group';

      // Label
      const label = document.createElement('span');
      label.className = 'stl__variant-label';
      label.textContent = optionName;
      group.appendChild(label);

      // Decide: dropdown for "Size", buttons for everything else
      if (optionName.toLowerCase() === 'size') {
        group.appendChild(buildSelect(optionName, values));
      } else {
        group.appendChild(buildButtons(optionName, values));
      }

      elVariants.appendChild(group);
    });
  }

  /**
   * Create a `<select>` element for a given option (typically "Size").
   * @param {string} name   – option name (e.g. "Size")
   * @param {string[]} values – unique option values
   * @returns {HTMLSelectElement}
   */
  function buildSelect(name, values) {
    const select = document.createElement('select');
    select.className = 'stl__variant-select';

    // Placeholder
    const placeholder = document.createElement('option');
    placeholder.value    = '';
    placeholder.textContent = 'Choose your ' + name.toLowerCase();
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);

    values.forEach(function (val) {
      const opt = document.createElement('option');
      opt.value       = val;
      opt.textContent = val;
      select.appendChild(opt);
    });

    // Pre-select first real value
    if (values.length > 0) {
      select.value = values[0];
      selections[name] = values[0];
    }

    select.addEventListener('change', function () {
      selections[name] = select.value;
      resolveVariant();
    });

    return select;
  }

  /**
   * Create a row of `<button>` elements for an option (e.g. "Color").
   * @param {string} name
   * @param {string[]} values
   * @returns {HTMLDivElement}
   */
  function buildButtons(name, values) {
    const wrap = document.createElement('div');
    wrap.className = 'stl__variant-btns';

    values.forEach(function (val, i) {
      const btn = document.createElement('button');
      btn.type      = 'button';
      btn.className = 'stl__variant-btn';
      btn.textContent = val;

      // First value is active by default
      if (i === 0) {
        btn.classList.add('is-active');
        selections[name] = val;
      }

      btn.addEventListener('click', function () {
        // Toggle active state within this group
        wrap.querySelectorAll('.stl__variant-btn').forEach(function (b) {
          b.classList.remove('is-active');
        });
        btn.classList.add('is-active');

        selections[name] = val;
        resolveVariant();
      });

      wrap.appendChild(btn);
    });

    return wrap;
  }

  /* ================================================================
     Variant resolution
     ================================================================ */

  /**
   * Given the current `selections` map, find the matching variant in
   * `currentProduct.variants` and update the hidden input + displayed price.
   */
  function resolveVariant() {
    if (!currentProduct) return;

    const match = currentProduct.variants.find(function (v) {
      return Object.keys(selections).every(function (optName) {
        var idx = currentProduct.options.indexOf(optName);
        if (idx === -1) return true;
        return v['option' + (idx + 1)] === selections[optName];
      });
    });

    if (match) {
      selectedVariant = match;
      if (elVarId) elVarId.value = match.id;
      if (elPrice) elPrice.textContent = formatMoney(match.price);

      // Swap image when the variant carries its own featured image
      if (match.featured_image && elImg) {
        elImg.src = match.featured_image.src;
      }
    }
  }

  /* ================================================================
     Add to Cart
     ================================================================ */

  /**
   * POST selected variant(s) to `/cart/add.js`.
   * If the user picked **Black + Medium**, we also add "Soft Winter Jacket".
   */
  async function handleAddToCart() {
    if (!selectedVariant) return;

    // Build items array (primary product first)
    var items = [{ id: selectedVariant.id, quantity: 1 }];

    /* ── Special rule: Black + Medium → auto-add Soft Winter Jacket ── */
    var hasBlack  = Object.values(selections).some(function (v) {
      return v.toLowerCase().trim() === 'black';
    });
    var hasMedium = Object.values(selections).some(function (v) {
      return v.toLowerCase().trim() === 'medium';
    });

    if (hasBlack && hasMedium) {
      try {
        var jacketRes = await fetch('/products/soft-winter-jacket.js');
        if (jacketRes.ok) {
          var jacket = await jacketRes.json();
          if (jacket && jacket.variants && jacket.variants.length) {
            items.push({ id: jacket.variants[0].id, quantity: 1 });
          }
        }
      } catch (err) {
        console.warn('[STL] Could not fetch Soft Winter Jacket:', err);
      }
    }

    // Disable button while request is in flight
    var origHTML = elAtcBtn.innerHTML;
    elAtcBtn.disabled  = true;
    elAtcBtn.textContent = 'Adding…';

    try {
      var res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ items: items }),
      });

      if (!res.ok) throw new Error('Cart API returned ' + res.status);

      /* ── Success ── */
      elAtcBtn.textContent = 'Added ✓';

      // Refresh the theme's cart state (drawer, icon count, etc.)
      refreshCart();

      // Close popup after a brief success flash
      setTimeout(function () {
        closePopup();
        elAtcBtn.innerHTML = origHTML;
        elAtcBtn.disabled  = false;
      }, 900);

    } catch (err) {
      console.error('[STL] Add-to-cart error:', err);
      elAtcBtn.textContent = 'Error – try again';
      setTimeout(function () {
        elAtcBtn.innerHTML = origHTML;
        elAtcBtn.disabled  = false;
      }, 2000);
    }
  }

  /* ================================================================
     Cart refresh – integrate with the theme's existing cart system
     ================================================================ */

  /**
   * After adding items we:
   *  1. Fetch the updated cart JSON.
   *  2. Update any visible cart-count badges.
   *  3. Dispatch a `cart:update` CustomEvent so the theme's CartDrawer
   *     (which listens on `document`) can re-render itself.
   */
  async function refreshCart() {
    try {
      var res  = await fetch('/cart.js', { headers: { Accept: 'application/json' } });
      var cart = await res.json();

      // Update header cart-count badges
      document.querySelectorAll('[data-cart-count], .cart-count-bubble span, cart-icon-component .count').forEach(function (el) {
        el.textContent = cart.item_count;
      });

      // Dispatch the same event name the theme's CartDrawer listens for
      document.dispatchEvent(
        new CustomEvent('cart:update', {
          bubbles: true,
          detail: { cart: cart },
        })
      );
    } catch (err) {
      console.warn('[STL] Could not refresh cart state:', err);
    }
  }

  /* ================================================================
     Helpers
     ================================================================ */

  /**
   * Collect unique values for a product option by position (1-based).
   * @param {Object} product
   * @param {number} position – 1, 2 or 3
   * @returns {string[]}
   */
  function getUniqueOptionValues(product, position) {
    var seen = [];
    product.variants.forEach(function (v) {
      var val = v['option' + position];
      if (val && seen.indexOf(val) === -1) seen.push(val);
    });
    return seen;
  }

  /**
   * Format a price (in cents/minor units) according to the shop's money format.
   *
   * Falls back to `${{amount}}` if `window.theme.moneyFormat` is unavailable.
   * Supports all Shopify format placeholders.
   *
   * @param {number|string} cents
   * @returns {string}
   */
  function formatMoney(cents) {
    if (typeof cents === 'string') cents = cents.replace('.', '');
    cents = parseInt(cents, 10) || 0;

    var fmt = (window.theme && window.theme.moneyFormat)
           || (window.Theme && window.Theme.moneyFormat)
           || '${{amount}}';

    /**
     * @param {number} num
     * @param {number} precision
     * @param {string} thousands
     * @param {string} decimal
     * @returns {string}
     */
    function delimit(num, precision, thousands, decimal) {
      precision = precision == null ? 2 : precision;
      thousands = thousands || ',';
      decimal   = decimal   || '.';

      var fixed = (num / 100).toFixed(precision);
      var parts = fixed.split('.');
      var left  = parts[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1' + thousands);
      return parts[1] ? left + decimal + parts[1] : left;
    }

    var placeholder = /\{\{\s*(\w+)\s*\}\}/;
    var key = (fmt.match(placeholder) || [])[1] || 'amount';

    var value;
    switch (key) {
      case 'amount':
        value = delimit(cents, 2); break;
      case 'amount_no_decimals':
        value = delimit(cents, 0); break;
      case 'amount_with_comma_separator':
        value = delimit(cents, 2, '.', ','); break;
      case 'amount_no_decimals_with_comma_separator':
        value = delimit(cents, 0, '.', ','); break;
      case 'amount_no_decimals_with_space_separator':
        value = delimit(cents, 0, ' '); break;
      default:
        value = delimit(cents, 2);
    }

    return fmt.replace(placeholder, value);
  }
})();
