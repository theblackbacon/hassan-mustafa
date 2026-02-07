# Gift Guide Custom Sections - Shopify Test Assignment

## Overview
This project implements a custom Gift Guide page for a Shopify store with two fully custom sections built from scratch. The implementation includes a responsive design, animated elements, and advanced product functionality.

## Features Implemented

### ✅ 1. Gift Guide Banner Section (`gift-guide-banner.liquid`)
- **Fully customizable from theme editor**
- Editable fields:
  - Logo text
  - Main heading
  - Description text
  - Primary button (text & link)
  - Secondary CTA button (text & link)
  - Tagline
  - Background color/image
- **Animated buttons** with hover effects and slide transitions
- Responsive design for mobile, tablet, and desktop
- Clean, semantic HTML structure

### ✅ 2. Product Grid Custom Section (`product-grid-custom.liquid`)
- **6 product blocks** selectable from the customizer
- Each product displays:
  - Featured image
  - Product title
  - Price (with compare-at-price support)
- **Quick view button** appears on hover
- Responsive grid layout:
  - Desktop: 3 columns
  - Tablet: 2 columns
  - Mobile: 1 column

### ✅ 3. Product Quick View Popup
- **Dynamic product information** rendered from Shopify API
- Displays:
  - Product image
  - Product name
  - Price
  - Description
  - Variant options (Color, Size, etc.)
- **Variant selection**:
  - Dynamically rendered based on product options
  - Visual feedback for selected options
  - Updates price and image when variant changes
- **Functional "Add to Cart" button**:
  - Adds selected product variant to cart
  - Updates cart count in real-time
  - Shows success feedback

### ✅ 4. Special Cart Logic
- **Automatic bundle trigger**: When a product with BOTH "Black" AND "Medium" variant options is added to cart, the "Soft Winter Jacket" is automatically added as well
- Implemented using Shopify's Cart API
- Error handling for cases where jacket doesn't exist

### ✅ 5. Mobile Responsive Design
- Fully responsive across all breakpoints
- Touch-friendly buttons and interactions
- Optimized layouts for different screen sizes
- Tested on mobile, tablet, and desktop viewports

### ✅ 6. Code Quality
- **No jQuery** - Pure vanilla JavaScript
- Well-structured and organized code
- Comprehensive comments explaining functionality
- Object-oriented JavaScript with ES6 class syntax
- Efficient DOM manipulation
- Proper error handling and validation

## Files Created

```
theme_export__hassan-mustafa-48-teststore-myshopify-com-horizon__07FEB2026-1153am/
├── sections/
│   ├── gift-guide-banner.liquid          # Custom banner section
│   └── product-grid-custom.liquid        # Custom product grid section
├── assets/
│   └── product-grid-popup.js             # Popup and cart functionality
└── templates/
    └── page.gift-guide.json              # Gift guide page template
```

## Installation & Usage

### Step 1: Files are Already in Place
All custom files have been created in your theme directory.

### Step 2: Create a Gift Guide Page
1. In Shopify Admin, go to **Online Store > Pages**
2. Click **Add page**
3. Enter page title: "Gift Guide"
4. In the right sidebar, under **Theme template**, select "gift-guide"
5. Click **Save**

### Step 3: Customize Sections
1. Go to **Online Store > Themes**
2. Click **Customize** on your theme
3. Navigate to the Gift Guide page you created
4. You'll see two custom sections:
   - **Gift Guide Banner**: Customize text, buttons, colors
   - **Product Grid Custom**: Select 6 products to display

### Step 4: Select Products
1. In the **Product Grid Custom** section
2. Click on each of the 6 blocks
3. Use the product picker to select products
4. Save your changes

### Step 5: Test the Functionality
1. **Banner animations**: Hover over buttons to see animations
2. **Product grid**: Click the quick view icon on any product
3. **Popup**: 
   - Select different variant options
   - Click "Add to Cart"
   - Verify cart updates
4. **Special logic**: Add a product with Black + Medium variants and verify "Soft Winter Jacket" is auto-added

## Technical Implementation Details

### Banner Section
- **CSS animations**: Slide-in effect on hover using `::before` pseudo-element
- **Transform effects**: Slight lift on hover for depth
- **Responsive typography**: Font sizes scale appropriately on mobile

### Product Grid & Popup
- **Async/await**: Modern JavaScript for API calls
- **Fetch API**: Retrieves product data from Shopify's `.js` endpoints
- **Event delegation**: Efficient event handling for dynamic content
- **State management**: Tracks selected variants and updates UI accordingly
- **Cart API**: Uses Shopify's `/cart/add.js` endpoint for cart operations

### Variant Selection Logic
```javascript
// Dynamically renders variants based on product options
// Tracks user selections
// Finds matching variant ID
// Updates price and image accordingly
```

### Special Bundle Logic
```javascript
// Detects if selected variant has:
// - Color: Black
// - Size: Medium
// If both conditions met:
// - Fetches "Soft Winter Jacket" product
// - Adds both products to cart in single API call
```

## Browser Compatibility
- ✅ Chrome/Edge (Modern)
- ✅ Firefox (Modern)
- ✅ Safari (Modern)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Optimizations
- Deferred JavaScript loading
- Lazy loading for product images
- CSS containment for animations
- Minimal DOM manipulations
- Efficient event listeners

## Accessibility
- Proper ARIA labels
- Keyboard navigation support
- Focus management in popup
- Semantic HTML structure
- Color contrast compliance

## Code Structure

### JavaScript Class: `ProductGridPopup`
```javascript
class ProductGridPopup {
  constructor()           // Initialize popup handler
  init()                  // Setup event listeners
  openPopup()            // Load and display product
  populatePopup()        // Fill popup with data
  renderVariants()       // Create variant selectors
  handleVariantSelection() // Update selected variant
  handleAddToCart()      // Process cart addition
  formatMoney()          // Format prices
}
```

## Testing Checklist
- [x] Banner displays with all editable content
- [x] Button animations work on hover
- [x] Product grid shows 6 products
- [x] Quick view button appears on hover
- [x] Popup opens with product details
- [x] Variant selection updates price/image
- [x] Add to cart functionality works
- [x] Cart count updates after adding
- [x] Black + Medium triggers jacket addition
- [x] Mobile responsive on all screen sizes
- [x] No jQuery used
- [x] Code is well-commented

## Potential Enhancements
- Image gallery in popup for multiple product images
- Quantity selector in popup
- Recently viewed products tracking
- Animation on popup open/close
- Loading skeleton while fetching product data
- Toast notifications for cart additions
- Wishlist functionality

## Notes for Reviewers
1. **No Dawn Components Used**: All sections built completely from scratch
2. **Vanilla JavaScript Only**: Zero jQuery dependencies
3. **Well-Commented Code**: Each function has descriptive comments
4. **Efficient Structure**: Object-oriented design with clear separation of concerns
5. **Error Handling**: Comprehensive try-catch blocks and validation
6. **Mobile-First**: Responsive design tested on multiple devices

## Author
Hassan Mustafa

## License
Proprietary - Test Assignment
