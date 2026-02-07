/**
 * Custom Product Grid Popup Handler
 * Created from scratch for test assignment
 * Features: Product quick view, variant selection, add to cart functionality
 * Dependencies: None - Pure vanilla JavaScript
 */

class ProductGridPopup {
  /**
   * Initialize the popup handler
   */
  constructor() {
    this.popup = null;
    this.currentProduct = null;
    this.selectedVariant = null;
    this.variantSelections = {};
    this.init();
  }

  /**
   * Initialize event listeners and DOM elements
   */
  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
    } else {
      this.setupEventListeners();
    }
  }

  /**
   * Set up all event listeners
   */
  setupEventListeners() {
    // Get popup element
    this.popup = document.getElementById('productPopup');
    
    if (!this.popup) {
      console.warn('Product popup element not found');
      return;
    }

    // Quick view button clicks
    document.addEventListener('click', (e) => {
      const quickViewBtn = e.target.closest('.product-quick-view');
      if (quickViewBtn) {
        e.preventDefault();
        e.stopPropagation();
        const productHandle = quickViewBtn.getAttribute('data-product-handle');
        this.openPopup(productHandle);
      }
    });

    // Close button
    const closeBtn = this.popup.querySelector('.popup-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closePopup());
    }

    // Close on overlay click
    this.popup.addEventListener('click', (e) => {
      if (e.target === this.popup) {
        this.closePopup();
      }
    });

    // Close on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.popup.classList.contains('active')) {
        this.closePopup();
      }
    });

    // Add to cart form submission
    const form = document.getElementById('popupAddToCartForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleAddToCart();
      });
    }
  }

  /**
   * Open popup and load product data
   * @param {string} productHandle - Shopify product handle
   */
  async openPopup(productHandle) {
    try {
      // Show loading state
      this.showLoadingState();
      
      // Fetch product data
      const response = await fetch(`/products/${productHandle}.js`);
      if (!response.ok) {
        throw new Error('Failed to fetch product data');
      }
      
      const product = await response.json();
      this.currentProduct = product;
      
      // Populate popup with product data
      this.populatePopup(product);
      
      // Show popup
      this.popup.classList.add('active');
      this.popup.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      
    } catch (error) {
      console.error('Error loading product:', error);
      this.showErrorState();
    }
  }

  /**
   * Close the popup
   */
  closePopup() {
    this.popup.classList.remove('active');
    this.popup.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    this.currentProduct = null;
    this.selectedVariant = null;
    this.variantSelections = {};
  }

  /**
   * Show loading state in popup
   */
  showLoadingState() {
    this.popup.classList.add('active');
    const popupTitle = document.getElementById('popupTitle');
    if (popupTitle) {
      popupTitle.textContent = 'Loading...';
    }
  }

  /**
   * Show error state in popup
   */
  showErrorState() {
    const popupTitle = document.getElementById('popupTitle');
    if (popupTitle) {
      popupTitle.textContent = 'Error loading product';
    }
  }

  /**
   * Populate popup with product data
   * @param {Object} product - Product data from Shopify
   */
  populatePopup(product) {
    // Set product image
    const popupImage = document.getElementById('popupImage');
    if (popupImage && product.featured_image) {
      popupImage.src = product.featured_image;
      popupImage.alt = product.title;
    }

    // Set product title
    const popupTitle = document.getElementById('popupTitle');
    if (popupTitle) {
      popupTitle.textContent = product.title;
    }

    // Set product price
    const popupPrice = document.getElementById('popupPrice');
    if (popupPrice) {
      popupPrice.textContent = this.formatMoney(product.price);
    }

    // Set product description
    const popupDescription = document.getElementById('popupDescription');
    if (popupDescription) {
      // Use actual description or fallback text
      let description = product.description;
      if (description && description.trim()) {
        // Strip HTML tags for description
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = description;
        popupDescription.textContent = tempDiv.textContent || tempDiv.innerText || '';
      } else {
        // Fallback description for products without description
        popupDescription.innerHTML = 'This one-piece swimsuit is crafted from jersey featuring an all-over micro Monogram motif in relief.';
      }
    }

    // Render variants
    this.renderVariants(product);

    // Set initial variant
    this.selectedVariant = product.variants[0];
    const variantIdInput = document.getElementById('popupVariantId');
    if (variantIdInput) {
      variantIdInput.value = this.selectedVariant.id;
    }
  }

  /**
   * Render product variants dynamically
   * @param {Object} product - Product data
   */
  renderVariants(product) {
    const variantsContainer = document.getElementById('popupVariants');
    if (!variantsContainer) return;

    // Clear existing variants
    variantsContainer.innerHTML = '';

    // If product has no options or only default, don't show variant selector
    if (!product.options || product.options.length === 0 || 
        (product.options.length === 1 && product.options[0].name === 'Title')) {
      return;
    }

    // Get all option names (e.g., Color, Size)
    const optionNames = product.options.map(opt => opt.name);

    // Create variant selectors for each option
    optionNames.forEach((optionName, index) => {
      const optionPosition = index + 1;
      const optionValues = this.getOptionValues(product, optionPosition);

      if (optionValues.length === 0) return;

      const optionDiv = document.createElement('div');
      optionDiv.className = 'variant-option';

      const label = document.createElement('label');
      label.className = 'variant-label';
      label.textContent = optionName;
      optionDiv.appendChild(label);

      // Use dropdown for Size, buttons for other options like Color
      if (optionName.toLowerCase().includes('size')) {
        // Create dropdown for size
        const select = document.createElement('select');
        select.className = 'variant-select';
        select.setAttribute('data-option-name', optionName);
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = `Choose your ${optionName.toLowerCase()}`;
        defaultOption.disabled = true;
        defaultOption.selected = true;
        select.appendChild(defaultOption);
        
        // Add size options
        optionValues.forEach((value, idx) => {
          const option = document.createElement('option');
          option.value = value;
          option.textContent = value;
          select.appendChild(option);
          
          // Set first actual value as selected
          if (idx === 0) {
            option.selected = true;
            this.variantSelections[optionName] = value;
          }
        });
        
        select.addEventListener('change', (e) => {
          this.handleVariantSelection(optionName, e.target.value, e.target);
        });
        
        optionDiv.appendChild(select);
      } else {
        // Use buttons for color and other options
        const valuesDiv = document.createElement('div');
        valuesDiv.className = 'variant-values';

        optionValues.forEach((value, idx) => {
          const valueBtn = document.createElement('button');
          valueBtn.type = 'button';
          valueBtn.className = 'variant-value';
          valueBtn.textContent = value;
          valueBtn.setAttribute('data-option-name', optionName);
          valueBtn.setAttribute('data-option-value', value);
          
          // Set first value as selected by default
          if (idx === 0) {
            valueBtn.classList.add('selected');
            this.variantSelections[optionName] = value;
          }

          valueBtn.addEventListener('click', () => {
            this.handleVariantSelection(optionName, value, valueBtn);
          });

          valuesDiv.appendChild(valueBtn);
        });

        optionDiv.appendChild(valuesDiv);
      }

      variantsContainer.appendChild(optionDiv);
    });
  }

  /**
   * Get unique values for a specific option
   * @param {Object} product - Product data
   * @param {number} position - Option position (1, 2, or 3)
   * @returns {Array} Array of unique option values
   */
  getOptionValues(product, position) {
    const values = [];
    product.variants.forEach(variant => {
      const value = variant[`option${position}`];
      if (value && !values.includes(value)) {
        values.push(value);
      }
    });
    return values;
  }

  /**
   * Handle variant option selection
   * @param {string} optionName - Name of the option (e.g., "Color")
   * @param {string} value - Selected value
   * @param {HTMLElement} element - Clicked button or select element
   */
  handleVariantSelection(optionName, value, element) {
    // Update selection state
    this.variantSelections[optionName] = value;

    // Update button states for button-based options
    if (element.tagName === 'BUTTON') {
      const parentDiv = element.parentElement;
      parentDiv.querySelectorAll('.variant-value').forEach(btn => {
        btn.classList.remove('selected');
      });
      element.classList.add('selected');
    }
    // For select elements, the change is automatic

    // Find matching variant
    this.updateSelectedVariant();
  }

  /**
   * Update selected variant based on current selections
   */
  updateSelectedVariant() {
    if (!this.currentProduct) return;

    const variant = this.currentProduct.variants.find(v => {
      return Object.keys(this.variantSelections).every(optionName => {
        const optionIndex = this.currentProduct.options.findIndex(opt => opt.name === optionName);
        if (optionIndex === -1) return true;
        const variantValue = v[`option${optionIndex + 1}`];
        return variantValue === this.variantSelections[optionName];
      });
    });

    if (variant) {
      this.selectedVariant = variant;
      
      // Update variant ID in form
      const variantIdInput = document.getElementById('popupVariantId');
      if (variantIdInput) {
        variantIdInput.value = variant.id;
      }

      // Update price if variant has different price
      const popupPrice = document.getElementById('popupPrice');
      if (popupPrice) {
        popupPrice.textContent = this.formatMoney(variant.price);
      }

      // Update image if variant has its own image
      if (variant.featured_image) {
        const popupImage = document.getElementById('popupImage');
        if (popupImage) {
          popupImage.src = variant.featured_image.src;
        }
      }
    }
  }

  /**
   * Handle add to cart form submission
   */
  async handleAddToCart() {
    if (!this.selectedVariant) {
      alert('Please select a variant');
      return;
    }

    const addToCartBtn = this.popup.querySelector('.popup-add-to-cart');
    const originalText = addToCartBtn.innerHTML;

    try {
      // Disable button and show loading state
      addToCartBtn.disabled = true;
      addToCartBtn.textContent = 'Adding...';

      // Prepare cart items
      const items = [{ id: this.selectedVariant.id, quantity: 1 }];

      // Special logic: If variant has Black and Medium selected, add "Soft Winter Jacket"
      const hasBlack = Object.entries(this.variantSelections).some(([key, value]) => 
        value.toLowerCase().trim() === 'black'
      );
      const hasMedium = Object.entries(this.variantSelections).some(([key, value]) => 
        value.toLowerCase().trim() === 'medium'
      );

      console.log('Variant selections:', this.variantSelections);
      console.log('Has Black:', hasBlack, 'Has Medium:', hasMedium);

      if (hasBlack && hasMedium) {
        // Fetch "Soft Winter Jacket" to get its variant ID
        try {
          const jacketResponse = await fetch('/products/soft-winter-jacket.js');
          if (jacketResponse.ok) {
            const jacketProduct = await jacketResponse.json();
            if (jacketProduct && jacketProduct.variants.length > 0) {
              items.push({
                id: jacketProduct.variants[0].id,
                quantity: 1
              });
            }
          }
        } catch (err) {
          console.warn('Could not add Soft Winter Jacket:', err);
        }
      }

      // Add items to cart using Shopify Ajax API
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items })
      });

      if (!response.ok) {
        throw new Error('Failed to add to cart');
      }

      const result = await response.json();

      // Success - update cart UI
      this.updateCartCount();
      
      // Show success message
      addToCartBtn.textContent = 'Added!';
      addToCartBtn.style.backgroundColor = '#4CAF50';

      // Close popup after short delay
      setTimeout(() => {
        this.closePopup();
        addToCartBtn.innerHTML = originalText;
        addToCartBtn.style.backgroundColor = '';
        addToCartBtn.disabled = false;
      }, 1000);

    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add product to cart. Please try again.');
      addToCartBtn.innerHTML = originalText;
      addToCartBtn.disabled = false;
    }
  }

  /**
   * Update cart count in header
   */
  async updateCartCount() {
    try {
      const response = await fetch('/cart.js');
      const cart = await response.json();
      
      // Update cart count elements
      const cartCountElements = document.querySelectorAll('[data-cart-count], .cart-count');
      cartCountElements.forEach(el => {
        el.textContent = cart.item_count;
      });

      // Trigger cart drawer update if exists
      if (window.theme && window.theme.CartDrawer) {
        window.theme.CartDrawer.update();
      }

      // Dispatch custom event for cart update
      document.dispatchEvent(new CustomEvent('cart:updated', { 
        detail: { cart } 
      }));
      
    } catch (error) {
      console.error('Error updating cart count:', error);
    }
  }

  /**
   * Format money according to shop currency
   * @param {number} cents - Price in cents
   * @returns {string} Formatted price
   */
  formatMoney(cents) {
    if (typeof cents === 'string') {
      cents = cents.replace('.', '');
    }
    
    let value = '';
    const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    const formatString = window.theme?.moneyFormat || '${{amount}}';
    
    function formatWithDelimiters(number, precision, thousands, decimal) {
      precision = precision || 2;
      thousands = thousands || ',';
      decimal = decimal || '.';

      if (isNaN(number) || number == null) {
        return '0';
      }

      number = (number / 100.0).toFixed(precision);

      const parts = number.split('.');
      const dollarsAmount = parts[0].replace(
        /(\d)(?=(\d\d\d)+(?!\d))/g,
        '$1' + thousands
      );
      const centsAmount = parts[1] ? decimal + parts[1] : '';

      return dollarsAmount + centsAmount;
    }

    switch (formatString.match(placeholderRegex)[1]) {
      case 'amount':
        value = formatWithDelimiters(cents, 2);
        break;
      case 'amount_no_decimals':
        value = formatWithDelimiters(cents, 0);
        break;
      case 'amount_with_comma_separator':
        value = formatWithDelimiters(cents, 2, '.', ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        value = formatWithDelimiters(cents, 0, '.', ',');
        break;
      case 'amount_no_decimals_with_space_separator':
        value = formatWithDelimiters(cents, 0, ' ');
        break;
      default:
        value = formatWithDelimiters(cents, 2);
    }

    return formatString.replace(placeholderRegex, value);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ProductGridPopup();
  });
} else {
  new ProductGridPopup();
}
