$(document).ready(function () {
    // Login status and account icon management
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const loginRegister = document.getElementById('login-register');
    const profile = document.getElementById('profile');
    const loginIconBtn = document.querySelector('.login-icon-btn, .account-icon-btn');

    // Update login icon to account icon based on login state
    function updateLoginIcon() {
        if (loginIconBtn) {
            if (isLoggedIn) {
                loginIconBtn.href = 'account/order.html';
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

    // Cart: read from localStorage and render
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    
    // Migrate old cart items with formatted prices to raw numbers
    cartItems = cartItems.map(item => {
        if (typeof item.price === 'string' && item.price.includes('₫')) {
            // Convert formatted price back to number
            item.price = parseFloat(item.price.replace(/[^0-9]/g, ''));
        }
        return item;
    });
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    
    const cartCountElement = document.getElementById('cart-count');
    const drawerCountElement = document.getElementById('drawer-cart-count');
    const drawerItemsList = document.getElementById('drawer-items');
    const drawerSubtotal = document.getElementById('drawer-subtotal');

    function updateCartCount() {
        const count = cartItems.reduce((acc, i) => acc + (i.quantity || 1), 0);
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
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }

    function formatMoney(amount) {
        // Handle both number and string inputs
        const num = typeof amount === 'number' ? amount : parseFloat(amount);
        if (isNaN(num)) return '0₫';
        return num.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + '₫';
    }

    function renderDrawerItems() {
        if (!drawerItemsList) return;
        drawerItemsList.innerHTML = '';
        let subtotal = 0;
        
        // Empty state and footer visibility
        const emptyState = document.getElementById('cart-empty-state');
        const footerContent = document.getElementById('cart-footer-content');
        
        if (cartItems.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            if (footerContent) footerContent.style.display = 'none';
        } else {
            if (emptyState) emptyState.style.display = 'none';
            if (footerContent) footerContent.style.display = 'block';
        }
        
        // the header preview thumbnails
        const preview = document.getElementById('drawer-preview');
        if (preview) preview.innerHTML = '';
        
        cartItems.forEach((item, idx) => {
            const li = document.createElement('li');
            li.className = 'drawer-item d-flex align-items-center gap-3 mb-3';
            const img = `<div class="drawer-item-media"><img src="${item.image}" alt="${item.name}" class="drawer-thumb"></div>`;
            
            // Format price for display
            const displayPrice = typeof item.price === 'number' ? formatMoney(item.price) : item.price;
            const info = `<div class="drawer-item-info flex-grow-1"><div class="name">${item.name}</div><div class="price text-muted">${displayPrice}</div></div>`;
            
            const qty = `<div class="drawer-item-qty d-flex align-items-center gap-2"><button class="btn btn-light qty-minus" data-index="${idx}">-</button><input class="qty-input text-center" data-index="${idx}" type="number" min="1" value="${item.quantity||1}" /><button class="btn btn-light qty-plus" data-index="${idx}">+</button></div>`;
            const remove = `<div class="drawer-item-remove"><a href="#" class="remove-link text-danger" data-index="${idx}">Xóa</a></div>`;
            li.innerHTML = img + info + qty + remove;
            drawerItemsList.appendChild(li);

            // Calculate subtotal using raw price number
            const priceNumber = typeof item.price === 'number' ? item.price : parseFloat((item.price || '0').replace(/[^0-9.-]+/g, ''));
            subtotal += priceNumber * (item.quantity || 1);
        });
        // Clear preview thumbnails (removed feature)
        if (preview) {
            preview.innerHTML = '';
        }
        if (drawerSubtotal) drawerSubtotal.textContent = formatMoney(subtotal);
        // add listeners
        document.querySelectorAll('.qty-plus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const i = parseInt(btn.dataset.index);
                cartItems[i].quantity = (cartItems[i].quantity || 1) + 1;
                localStorage.setItem('cartItems', JSON.stringify(cartItems));
                updateCartCount(); renderDrawerItems();
            });
        });
        document.querySelectorAll('.qty-minus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const i = parseInt(btn.dataset.index);
                cartItems[i].quantity = Math.max(1, (cartItems[i].quantity || 1) - 1);
                localStorage.setItem('cartItems', JSON.stringify(cartItems));
                updateCartCount(); renderDrawerItems();
            });
        });
        document.querySelectorAll('.remove-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const i = parseInt(link.dataset.index);
                cartItems.splice(i, 1);
                localStorage.setItem('cartItems', JSON.stringify(cartItems));
                updateCartCount(); renderDrawerItems();
            });
        });
        document.querySelectorAll('.qty-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const i = parseInt(input.dataset.index);
                const v = Math.max(1, parseInt(input.value) || 1);
                cartItems[i].quantity = v;
                input.value = v;
                localStorage.setItem('cartItems', JSON.stringify(cartItems));
                updateCartCount(); renderDrawerItems();
            });
        });
    }

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
    const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
    addToCartBtns.forEach((button) => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Get product details from button data attributes and card
            const productName = button.getAttribute('data-product');
            const productPrice = button.getAttribute('data-price');
            const card = button.closest('.product-card');
            const productImage = card ? card.querySelector('.product-image-primary').src : '';

            // Store raw price number for calculations
            const rawPrice = parseFloat(productPrice);

            // Check if item already exists in cart
            const existingItem = cartItems.find(i => i.name === productName);
            if (existingItem) {
                existingItem.quantity = (existingItem.quantity || 1) + 1;
            } else {
                cartItems.push({ 
                    name: productName, 
                    price: rawPrice, 
                    image: productImage, 
                    quantity: 1 
                });
            }

            // Save to localStorage
            localStorage.setItem('cartItems', JSON.stringify(cartItems));
            updateCartCount(); 
            renderDrawerItems();

            // Visual feedback
            const originalText = button.innerHTML;
            button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check2 me-2" viewBox="0 0 16 16" style="vertical-align: middle;"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg>Đã thêm!';
            button.disabled = true;
            button.classList.add('btn-success');

            // Open cart drawer
            openCartDrawer();

            // Reset button after 2 seconds
            setTimeout(() => {
                button.innerHTML = originalText;
                button.disabled = false;
                button.classList.remove('btn-success');
            }, 2000);
        });
    });

    // Cart drawer toggle
    const cartToggle = document.querySelectorAll('.cart-toggle');
    const cartDrawer = document.getElementById('cart-drawer');
    const drawerCloseBtn = document.getElementById('cart-close');

    function openCartDrawer() {
        if (!cartDrawer) return;
        const overlay = document.getElementById('cart-overlay');
        cartDrawer.classList.add('is-open');
        cartDrawer.setAttribute('aria-hidden', 'false');
        if (overlay) overlay.classList.add('is-visible');
        renderDrawerItems();
    }
    function closeCartDrawer() {
        if (!cartDrawer) return;
        const overlay = document.getElementById('cart-overlay');
        cartDrawer.classList.remove('is-open');
        cartDrawer.setAttribute('aria-hidden', 'true');
        if (overlay) overlay.classList.remove('is-visible');
    }
    cartToggle.forEach(t => t.addEventListener('click', (e)=>{ e.preventDefault(); openCartDrawer(); }));
    if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeCartDrawer);
    if (cartDrawer) {
        const overlay = cartDrawer.querySelector('.cart-overlay');
        if (overlay) overlay.addEventListener('click', closeCartDrawer);
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

