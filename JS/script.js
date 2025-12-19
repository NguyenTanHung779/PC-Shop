// ============ GLOBAL CART SETUP (Outside jQuery ready) ============
// These need to be global so they persist across page loads
window.appState = window.appState || {
    cartItems: [],
    cartId: null,
    cartInitialized: false,
    isLoggedIn: localStorage.getItem('isLoggedIn') === 'true',
    authToken: localStorage.getItem('authToken') || localStorage.getItem('token'),
    addToCartListenerAdded: false
};

// Global functions for cart operations
window.addItemToCartAPI = async function(itemId, quantity = 1) {
    const { cartId, authToken, isLoggedIn } = window.appState;
    console.log('addItemToCartAPI called:', { itemId, quantity, isLoggedIn, cartId, authToken: !!authToken });
    
    if (!isLoggedIn || !cartId || !authToken) {
        console.log('Cannot add to cart - not logged in or cart not initialized', { isLoggedIn, cartId, authToken: !!authToken });
        return false;
    }

    try {
        const url = `http://localhost:5000/api/cart/${cartId}/add`;
        console.log('Sending request to:', url, { item_id: itemId, quantity });
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ item_id: itemId, quantity })
        });

        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Failed to add item to cart:', errorData);
            return false;
        }

        const data = await response.json();
        console.log('Item added to cart:', data);
        
        // Reload cart items to get updated list
        await window.loadCartItems();
        return true;
    } catch (err) {
        console.error('Error adding item to cart:', err);
        return false;
    }
};

// Load cart items from database
window.loadCartItems = async function() {
    const { isLoggedIn, cartId, authToken } = window.appState;
    if (!isLoggedIn || !cartId || !authToken) {
        console.log('Cannot load cart items - not logged in or cart not initialized');
        return;
    }

    try {
        const response = await fetch(`http://localhost:5000/api/cart/${cartId}/items`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Failed to load cart items');
            return;
        }

        const data = await response.json();
        window.appState.cartItems = data.items || [];
        console.log('Loaded', window.appState.cartItems.length, 'cart items');
        window.updateCartCountUI();
        window.renderDrawerItems();
    } catch (err) {
        console.error('Error loading cart items:', err);
    }
};

// Initialize cart for logged-in users
window.initializeCart = async function() {
    const { isLoggedIn, authToken } = window.appState;
    if (!isLoggedIn || !authToken) {
        console.log('User not logged in, using localStorage for cart');
        window.appState.cartInitialized = true;
        return;
    }

    try {
        console.log('Initializing cart with token:', authToken.substring(0, 20) + '...');
        // Get or create cart for user
        const response = await fetch('http://localhost:5000/api/cart', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Cart init response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Failed to initialize cart:', response.status, errorData);
            window.appState.cartInitialized = true;
            return;
        }

        const data = await response.json();
        window.appState.cartId = data.cart_id;
        console.log('✅ Cart initialized with ID:', window.appState.cartId);
        
        // Load cart items
        await window.loadCartItems();
        window.appState.cartInitialized = true;
    } catch (err) {
        console.error('Error initializing cart:', err);
        window.appState.cartInitialized = true;
    }
};

// ============ END GLOBAL CART SETUP ============

$(document).ready(function () {
    // Update local references from global state
    const { isLoggedIn, authToken } = window.appState;
    
    // Login status and account icon management
    const loginRegister = document.getElementById('login-register');
    const profile = document.getElementById('profile');
    const loginIconBtn = document.querySelector('.login-icon-btn, .account-icon-btn');

    // Update login icon to account icon based on login state
    function updateLoginIcon() {
        if (loginIconBtn) {
            if (isLoggedIn) {
                loginIconBtn.href = 'account/profile.html';
                loginIconBtn.title = 'Account';
                loginIconBtn.classList.remove('login-icon-btn');
                loginIconBtn.classList.add('account-icon-btn');
                loginIconBtn.querySelector('.sr-only').textContent = 'Account';
            } else {
                loginIconBtn.href = 'login.html';
                loginIconBtn.title = 'Login';
                loginIconBtn.classList.remove('account-icon-btn');
                loginIconBtn.classList.add('login-icon-btn');
                loginIconBtn.querySelector('.sr-only').textContent = 'Login';
            }
        }
    }

    // Hide the "Hồ Sơ" text link when logged in (we use the icon instead)
    if (isLoggedIn) {
        if (profile) profile.classList.add('hidden');
    } else {
        if (profile) profile.classList.add('hidden');
    }
    
    // Initialize login icon state
    updateLoginIcon();

    // Local cart UI references
    const cartCountElement = document.getElementById('cart-count');
    const drawerCountElement = document.getElementById('drawer-cart-count');
    const drawerItemsList = document.getElementById('drawer-items');
    const drawerSubtotal = document.getElementById('drawer-subtotal');

    // Update cart count in UI
    window.updateCartCountUI = function() {
        const count = window.appState.cartItems.reduce((acc, i) => acc + (i.quantity || 1), 0);
        if (cartCountElement) {
            cartCountElement.textContent = count;
            if (count > 0) {
                cartCountElement.style.display = 'inline-block';
            } else {
                cartCountElement.style.display = 'none';
            }
        }
        if (drawerCountElement) drawerCountElement.textContent = count;
        localStorage.setItem('cartItems', JSON.stringify(window.appState.cartItems));
    };

    // Initialize cart on page load
    window.initializeCart();

    // Update cart item quantity via API
    async function updateCartItemQuantity(cartItemId, quantity) {
        const { isLoggedIn, cartId, authToken } = window.appState;
        if (!isLoggedIn || !cartId || !authToken) {
            return false;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/cart/${cartId}/items/${cartItemId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ quantity })
            });

            if (!response.ok) {
                console.error('Failed to update cart item');
                return false;
            }

            await window.loadCartItems();
            return true;
        } catch (err) {
            console.error('Error updating cart item:', err);
            return false;
        }
    }

    // Remove item from cart via API
    async function removeCartItem(cartItemId) {
        const { isLoggedIn, cartId, authToken } = window.appState;
        if (!isLoggedIn || !cartId || !authToken) {
            return false;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/cart/${cartId}/items/${cartItemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.error('Failed to remove cart item');
                return false;
            }

            await window.loadCartItems();
            return true;
        } catch (err) {
            console.error('Error removing cart item:', err);
            return false;
        }
    }

    // Initialize cart on page load (already done globally, but calling again for this page)
    window.initializeCart();

    function updateCartCount() {
        const count = window.appState.cartItems.reduce((acc, i) => acc + (i.quantity || 1), 0);
        if (cartCountElement) {
            cartCountElement.textContent = count;
            // Show/hide badge based on count
            if (count > 0) {
                cartCountElement.style.display = 'inline-block';
            } else {
                cartCountElement.style.display = 'none';
            }
        }
        if (drawerCountElement) drawerCountElement.textContent = count;
        localStorage.setItem('cartItems', JSON.stringify(window.appState.cartItems));
    }

    function formatMoney(amount) {
        // Handle both number and string inputs
        const num = typeof amount === 'number' ? amount : parseFloat(amount);
        if (isNaN(num)) return '0₫';
        return num.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + '₫';
    }

    // Export render functions globally so they work across page loads
    window.renderDrawerItems = renderDrawerItems;
    
    // Track pending render to prevent duplicates from async rendering
    let pendingRenderPromise = Promise.resolve();
    
    function renderDrawerItems() {
        if (!drawerItemsList) return;
        
        // Chain renders to prevent race conditions
        pendingRenderPromise = pendingRenderPromise.then(async () => {
            drawerItemsList.innerHTML = '';
            let subtotal = 0;
            
            // Empty state and footer visibility
            const emptyState = document.getElementById('cart-empty-state');
            const footerContent = document.getElementById('cart-footer-content');
            
            if (window.appState.cartItems.length === 0) {
                if (emptyState) emptyState.style.display = 'block';
                if (footerContent) footerContent.style.display = 'none';
                return;
            } else {
                if (emptyState) emptyState.style.display = 'none';
                if (footerContent) footerContent.style.display = 'block';
            }
            
            // the header preview thumbnails
            const preview = document.getElementById('drawer-preview');
            if (preview) preview.innerHTML = '';
            
            // Calculate subtotal first (don't wait for async image fetches)
            window.appState.cartItems.forEach(item => {
                let priceNumber;
                if (typeof item.price === 'number') {
                    priceNumber = item.price;
                } else {
                    priceNumber = parseFloat((item.price || '0').replace(/[^0-9.-]+/g, ''));
                }
                subtotal += priceNumber * (item.quantity || 1);
            });
            
            // Render items sequentially to avoid race conditions
            for (let idx = 0; idx < window.appState.cartItems.length; idx++) {
                const item = window.appState.cartItems[idx];
                const li = document.createElement('li');
                li.className = 'drawer-item d-flex align-items-center gap-3 mb-3';
                li.setAttribute('data-item-index', idx);
                
                // Always fetch image from API using item_id for real product data
                let imageUrl = item.image_url || '/PC-Shop/images/placeholder.png';
                
                if (item.item_id) {
                    try {
                        const response = await fetch(`http://localhost:5000/api/public/items/${item.item_id}`);
                        if (response.ok) {
                            const data = await response.json();
                            const product = data.item;
                            // Get image from API - check images array first, then image_url
                            if (product && product.images && product.images.length > 0) {
                                imageUrl = product.images[0];
                            } else if (product && product.image_url) {
                                imageUrl = product.image_url;
                            }
                        }
                    } catch (err) {
                        console.log('Could not fetch product image for item', item.item_id);
                    }
                }
                
                const img = `<div class="drawer-item-media"><img src="${imageUrl}" alt="${item.name}" class="drawer-thumb" onerror="this.src='/PC-Shop/images/placeholder.png'"></div>`;
                
                // Format price for display
                let displayPriceNum;
                if (typeof item.price === 'number') {
                    displayPriceNum = item.price;
                } else {
                    displayPriceNum = parseFloat((item.price || '0').replace(/[^0-9.-]+/g, ''));
                }
                const displayPrice = formatMoney(displayPriceNum);
                const info = `<div class="drawer-item-info flex-grow-1"><div class="name">${item.name}</div><div class="price text-muted">${displayPrice}</div></div>`;
                
                // Use cart_item_id if available (database), otherwise fall back to index
                const controlId = item.cart_item_id !== undefined ? `cart-${item.cart_item_id}` : `local-${idx}`;
                const qty = `<div class="drawer-item-qty d-flex align-items-center gap-2"><button class="btn btn-light qty-minus" data-control-id="${controlId}">-</button><input class="qty-input text-center" data-control-id="${controlId}" type="number" min="1" value="${item.quantity||1}" /><button class="btn btn-light qty-plus" data-control-id="${controlId}">+</button></div>`;
                const remove = `<div class="drawer-item-remove"><a href="#" class="remove-link text-danger" data-control-id="${controlId}">Xóა</a></div>`;
                li.innerHTML = img + info + qty + remove;
                drawerItemsList.appendChild(li);
            }
            
            // Clear preview thumbnails (removed feature)
            if (preview) {
                preview.innerHTML = '';
            }
            if (drawerSubtotal) drawerSubtotal.textContent = formatMoney(subtotal);
            
            // Add event listeners after all items are rendered
            addCartEventListeners();
        });
    }
    
    // Separate function for adding event listeners
    function addCartEventListeners() {
        document.querySelectorAll('.qty-plus').forEach(btn => {
            btn.removeEventListener('click', qtyPlusHandler);
            btn.addEventListener('click', qtyPlusHandler);
        });
        
        document.querySelectorAll('.qty-minus').forEach(btn => {
            btn.removeEventListener('click', qtyMinusHandler);
            btn.addEventListener('click', qtyMinusHandler);
        });
        
        document.querySelectorAll('.remove-link').forEach(link => {
            link.removeEventListener('click', removeItemHandler);
            link.addEventListener('click', removeItemHandler);
        });
        
        document.querySelectorAll('.qty-input').forEach(input => {
            input.removeEventListener('change', qtyInputHandler);
            input.addEventListener('change', qtyInputHandler);
        });
    }
    
    // Event handler functions
    const qtyPlusHandler = async (e) => {
        e.preventDefault();
        const controlId = e.target.dataset.controlId;
        const item = window.appState.cartItems.find((it, idx) => {
            const id = it.cart_item_id !== undefined ? `cart-${it.cart_item_id}` : `local-${idx}`;
            return id === controlId;
        });
        
        if (item) {
            const newQty = (item.quantity || 1) + 1;
            if (item.cart_item_id && window.appState.isLoggedIn) {
                await updateCartItemQuantity(item.cart_item_id, newQty);
            } else {
                item.quantity = newQty;
                window.updateCartCountUI();
                window.renderDrawerItems();
            }
        }
    };
    
    const qtyMinusHandler = async (e) => {
        e.preventDefault();
        const controlId = e.target.dataset.controlId;
        const item = window.appState.cartItems.find((it, idx) => {
            const id = it.cart_item_id !== undefined ? `cart-${it.cart_item_id}` : `local-${idx}`;
            return id === controlId;
        });
        
        if (item) {
            const newQty = Math.max(1, (item.quantity || 1) - 1);
            if (item.cart_item_id && window.appState.isLoggedIn) {
                await updateCartItemQuantity(item.cart_item_id, newQty);
            } else {
                item.quantity = newQty;
                window.updateCartCountUI();
                window.renderDrawerItems();
            }
        }
    };
    
    const removeItemHandler = async (e) => {
        e.preventDefault();
        const controlId = e.currentTarget.dataset.controlId;
        const itemIndex = window.appState.cartItems.findIndex((it, idx) => {
            const id = it.cart_item_id !== undefined ? `cart-${it.cart_item_id}` : `local-${idx}`;
            return id === controlId;
        });
        
        if (itemIndex >= 0) {
            const item = window.appState.cartItems[itemIndex];
            if (item.cart_item_id && window.appState.isLoggedIn) {
                await removeCartItem(item.cart_item_id);
            } else {
                window.appState.cartItems.splice(itemIndex, 1);
                window.updateCartCountUI();
                window.renderDrawerItems();
            }
        }
    };
    
    const qtyInputHandler = async (e) => {
        const controlId = e.target.dataset.controlId;
        const item = window.appState.cartItems.find((it, idx) => {
            const id = it.cart_item_id !== undefined ? `cart-${it.cart_item_id}` : `local-${idx}`;
            return id === controlId;
        });
        
        if (item) {
            const v = Math.max(1, parseInt(e.target.value) || 1);
            if (item.cart_item_id && window.appState.isLoggedIn) {
                await updateCartItemQuantity(item.cart_item_id, v);
            } else {
                item.quantity = v;
                e.target.value = v;
                window.updateCartCountUI();
                window.renderDrawerItems();
            }
        }
    };

    // initial render
    updateCartCount(); renderDrawerItems();

    // add-to-cart handlers (if present)
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach((button) => {
        button.addEventListener('click', () => {
            button.classList.add('btn-added');
            button.textContent = 'Đã thêm!';
            button.disabled = true;

            // Get product details
            const card = button.closest('.card');
            const productName = card.querySelector('p').textContent;
            const productPrice = card.querySelector('span').textContent;
            const productImage = card.querySelector('img').src;
            const existingItem = cartItems.find(i => i.name === productName);
            if (existingItem) {
                existingItem.quantity = (existingItem.quantity || 1) + 1;
            } else {
                cartItems.push({ name: productName, price: productPrice, image: productImage, quantity: 1 });
            }
            localStorage.setItem('cartItems', JSON.stringify(cartItems));
            updateCartCount(); renderDrawerItems();

            // open drawer
            openCartDrawer();

        });
    });

    // Add-to-cart handlers for product cards (gaming-pc-prebuilts.html)
    // This is inside jQuery ready but uses global state
    if (!window.appState.addToCartListenerAdded) {
        window.appState.addToCartListenerAdded = true;
        document.addEventListener('click', async (e) => {
            const button = e.target.closest('.add-to-cart-btn');
            if (!button) return; // Not a cart button
            
            e.preventDefault();
            e.stopPropagation();
            console.log('Add to cart button clicked');

            // Wait for cart to be initialized
            if (!window.appState.cartInitialized) {
                alert('Cart is initializing... Please try again in a moment');
                console.log('Cart not initialized yet, waiting...');
                // Wait up to 5 seconds for cart to initialize
                let waited = 0;
                while (!window.appState.cartInitialized && waited < 5000) {
                    await new Promise(r => setTimeout(r, 100));
                    waited += 100;
                }
                if (!window.appState.cartInitialized) {
                    alert('Failed to initialize cart');
                    return;
                }
            }

            // Get item_id from button data attribute
            const itemId = button.getAttribute('data-item-id');
            const productName = button.getAttribute('data-product');
            console.log('Button data:', { itemId, productName, isLoggedIn: window.appState.isLoggedIn, cartId: window.appState.cartId });
            
            // If not logged in, show message and redirect to login
            if (!window.appState.isLoggedIn) {
                alert('Please log in to add items to your cart');
                window.location.href = 'login.html';
                return;
            }

            // Visual feedback - show loading
            const originalText = button.innerHTML;
            button.innerHTML = 'Đang thêm...';
            button.disabled = true;

            try {
                // If itemId is not available, show error
                if (!itemId) {
                    alert('Product information not available. Please refresh the page.');
                    button.innerHTML = originalText;
                    button.disabled = false;
                    return;
                }
                
                // Add to cart via API using item_id
                const success = await window.addItemToCartAPI(parseInt(itemId), 1);
                
                if (success) {
                    // Visual feedback - success
                    button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check2 me-2" viewBox="0 0 16 16" style="vertical-align: middle;"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg>Đã thêm!';
                    button.classList.add('btn-success');
                    
                    // Open cart drawer
                    window.openCartDrawer();

                    // Reset button after 2 seconds
                    setTimeout(() => {
                        button.innerHTML = originalText;
                        button.disabled = false;
                        button.classList.remove('btn-success');
                    }, 2000);
                } else {
                    // Failed
                    alert('Failed to add item to cart');
                    button.innerHTML = originalText;
                    button.disabled = false;
                }
            } catch (err) {
                console.error('Error adding item to cart:', err);
                alert('Error adding item to cart: ' + err.message);
                button.innerHTML = originalText;
                button.disabled = false;
            }
        });
    }

    // Cart drawer toggle
    const cartToggleElem = document.getElementById('cart-toggle');
    const cartDrawer = document.getElementById('cart-drawer');
    const drawerCloseBtn = document.getElementById('cart-close');

    // Export openCartDrawer globally
    window.openCartDrawer = openCartDrawer;
    
    function openCartDrawer() {
        if (!cartDrawer) {
            console.log('cartDrawer element not found');
            return;
        }
        console.log('Opening cart drawer...');
        cartDrawer.classList.add('is-open');
        cartDrawer.setAttribute('aria-hidden', 'false');
        window.renderDrawerItems();
    }
    function closeCartDrawer() {
        if (!cartDrawer) return;
        cartDrawer.classList.remove('is-open');
        cartDrawer.setAttribute('aria-hidden', 'true');
    }
    
    if (cartToggleElem) {
        cartToggleElem.addEventListener('click', (e) => {
            console.log('Cart toggle link clicked');
            e.preventDefault();
            openCartDrawer();
        });
    } else {
        console.log('Cart toggle element not found');
    }
    
    if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeCartDrawer);
    if (cartDrawer) {
        const overlay = cartDrawer.querySelector('.cart-overlay');
        if (overlay) overlay.addEventListener('click', closeCartDrawer);
    } else {
        console.log('cartDrawer not found during initialization');
    }
    const checkoutBtn = document.getElementById('drawer-checkout');
    if (checkoutBtn) checkoutBtn.addEventListener('click', (e)=>{ 
        e.preventDefault();
        // Sync cart to checkout page
        localStorage.setItem('checkoutItems', JSON.stringify(cartItems));
        window.location.href = checkoutBtn.href; 
    });
});

// Page transition behavior for internal links
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a').forEach(link => {
        // ignore links that are empty, are anchors, external or have a target _blank
        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('mailto:') || link.target === '_blank') return;
        const isExternal = href.startsWith('http') && !href.includes(location.hostname);
        if (isExternal) return;

        link.addEventListener('click', (e) => {
            // ignore JS only or cart toggle
            if (link.classList.contains('cart-toggle')) return;
            e.preventDefault();
            const target = link.getAttribute('href');
            document.body.classList.add('page-exit');
            setTimeout(() => {
                location.href = target;
            }, 240);
        });
    });

    // Page enter animation
    document.addEventListener('readystatechange', () => {
        if (document.readyState === 'complete') {
            document.body.classList.add('page-enter');
            // small delay then show active animation; after animation remove both classes
            setTimeout(() => {
                document.body.classList.add('active');
                setTimeout(()=>{ document.body.classList.remove('page-enter'); document.body.classList.remove('active'); }, 500);
            }, 40);
        }
    });
});
// Flickity for 'Why Buy' row (use only on small viewport widths)
function setupWhyBuyFlickity() {
    const container = document.getElementById('why-buy-row');
    if (!container) return;
    const cells = Array.from(container.querySelectorAll('.col-md-4, .carousel-cell'));
    const breakpoint = 768;
    if (window.innerWidth <= breakpoint) {
        // initialize flickity if not already initialized
        if (!container._flkty) {
            // convert column classes: set these as Flickity cells
            cells.forEach(cell => {
                cell.classList.add('carousel-cell');
                cell.classList.add('col-12');
                cell.classList.remove('col-md-4');
            });
            container.classList.add('why-buy-carousel');
            const flkty = new Flickity(container, {
                cellSelector: '.carousel-cell',
                contain: true,
                pageDots: true,
                prevNextButtons: false,
                draggable: true,
                wrapAround: false,
                groupCells: 1
            });
            container._flkty = flkty;
        }
    } else {
        // destroy flickity if exists and restore layout immediately
        if (container._flkty) {
            container._flkty.destroy();
            delete container._flkty;
            container.classList.remove('why-buy-carousel');
            // Immediately restore grid layout
            cells.forEach(cell => {
                cell.classList.remove('carousel-cell', 'col-12');
                if (!cell.classList.contains('col-md-4')) {
                    cell.classList.add('col-md-4');
                }
            });
            // Force reflow to apply changes immediately
            container.style.display = 'none';
            container.offsetHeight; // trigger reflow
            container.style.display = '';
        }
    }
}

// Initialize benefits Flickity carousel
function setupBenefitsFlickity() {
    const container = document.getElementById('benefits-row');
    if (!container) return;
    const cells = Array.from(container.querySelectorAll('.col-md-4, .carousel-cell'));
    const breakpoint = 768;
    if (window.innerWidth <= breakpoint) {
        // initialize flickity if not already initialized
        if (!container._flkty) {
            // convert column classes: set these as Flickity cells
            cells.forEach(cell => {
                cell.classList.add('carousel-cell');
                cell.classList.add('col-12');
                cell.classList.remove('col-md-4');
            });
            container.classList.add('benefits-carousel');
            const flkty = new Flickity(container, {
                cellSelector: '.carousel-cell',
                contain: true,
                pageDots: true,
                prevNextButtons: false,
                draggable: true,
                wrapAround: false,
                groupCells: 1
            });
            container._flkty = flkty;
        }
    } else {
        // destroy flickity if exists and restore layout immediately
        if (container._flkty) {
            container._flkty.destroy();
            delete container._flkty;
            container.classList.remove('benefits-carousel');
            // Immediately restore grid layout
            cells.forEach(cell => {
                cell.classList.remove('carousel-cell', 'col-12');
                if (!cell.classList.contains('col-md-4')) {
                    cell.classList.add('col-md-4');
                }
            });
            // Force reflow to apply changes immediately
            container.style.display = 'none';
            container.offsetHeight; // trigger reflow
            container.style.display = '';
        }
    }
}

// initialize and listen for resize events with faster response
let _resizeTimer;
let _lastWidth = window.innerWidth;
window.addEventListener('resize', () => {
    const currentWidth = window.innerWidth;
    const crossedBreakpoint = (_lastWidth <= 768 && currentWidth > 768) || (_lastWidth > 768 && currentWidth <= 768);
    
    if (crossedBreakpoint) {
        // Immediate execution when crossing breakpoint
        clearTimeout(_resizeTimer);
        setupWhyBuyFlickity();
        setupBenefitsFlickity();
        _lastWidth = currentWidth;
    } else {
        // Debounce for other resize events
        clearTimeout(_resizeTimer);
        _resizeTimer = setTimeout(() => {
            setupWhyBuyFlickity();
            setupBenefitsFlickity();
            _lastWidth = currentWidth;
        }, 100);
    }
});
document.addEventListener('DOMContentLoaded', () => {
    setupWhyBuyFlickity();
    setupBenefitsFlickity();
    _lastWidth = window.innerWidth;
});
let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
const totalSlides = slides.length;
const prevButton = document.querySelector('.prev');
const nextButton = document.querySelector('.next');

function showSlide(index) {
    slides.forEach((slide, i) => {
        slide.classList.remove('active');
        if (i === index) {
            slide.classList.add('active');
        }
    });
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % totalSlides;
    showSlide(currentSlide);
}

function prevSlide() {
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    showSlide(currentSlide);
}



if (nextButton) nextButton.addEventListener('click', nextSlide);
if (prevButton) prevButton.addEventListener('click', prevSlide);


if (totalSlides > 1) {
    setInterval(nextSlide, 8000);
}
let lastScrollTop = 0; 
const navbar = document.querySelector('header'); 

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

    if (currentScroll > lastScrollTop) {
        navbar.style.top = '-100px'; 
    } else {
        navbar.style.top = '0';
    }

    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll; 
});

// Featured Product Gallery Slider
document.addEventListener('DOMContentLoaded', function() {
    const galleryTrack = document.querySelector('.featured-gallery-track');
    const prevBtn = document.querySelector('.featured-gallery-prev');
    const nextBtn = document.querySelector('.featured-gallery-next');
    const thumbnails = document.querySelectorAll('.thumbnail-btn');
    const quantityInput = document.querySelector('.quantity-selector input[type="number"]');
    const decreaseBtn = document.querySelector('.quantity-decrease');
    const increaseBtn = document.querySelector('.quantity-increase');
    
    if (!galleryTrack) return;
    
    let currentGallerySlide = 0;
    const totalGallerySlides = document.querySelectorAll('.featured-gallery-slide').length;
    
    function updateGallerySlide(index) {
        if (index < 0 || index >= totalGallerySlides) return;
        
        currentGallerySlide = index;
        galleryTrack.style.transform = `translateX(-${currentGallerySlide * 100}%)`;
        
        // Update thumbnail active state
        thumbnails.forEach((thumb, i) => {
            thumb.classList.toggle('active', i === currentGallerySlide);
        });
        
        // Update navigation buttons
        if (prevBtn) prevBtn.classList.toggle('d-none', currentGallerySlide === 0);
        if (nextBtn) nextBtn.classList.toggle('d-none', currentGallerySlide === totalGallerySlides - 1);
    }
    
    // Navigation buttons
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            updateGallerySlide(currentGallerySlide - 1);
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            updateGallerySlide(currentGallerySlide + 1);
        });
    }
    
    // Thumbnail navigation
    thumbnails.forEach((thumb, index) => {
        thumb.addEventListener('click', () => {
            updateGallerySlide(index);
        });
    });
    
    // Quantity selector
    if (quantityInput && decreaseBtn && increaseBtn) {
        function updateQuantityButtons() {
            const value = parseInt(quantityInput.value) || 1;
            decreaseBtn.disabled = value <= 1;
        }
        
        decreaseBtn.addEventListener('click', () => {
            const currentValue = parseInt(quantityInput.value) || 1;
            if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
                updateQuantityButtons();
            }
        });
        
        increaseBtn.addEventListener('click', () => {
            const currentValue = parseInt(quantityInput.value) || 1;
            quantityInput.value = currentValue + 1;
            updateQuantityButtons();
        });
        
        quantityInput.addEventListener('input', updateQuantityButtons);
        updateQuantityButtons();
    }
    
    // Initialize
    updateGallerySlide(0);
});

