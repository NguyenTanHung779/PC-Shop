$(document).ready(function () {
    // Login status (unchanged)
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const loginRegister = document.getElementById('login-register');
    const profile = document.getElementById('profile');

    if (isLoggedIn) {
        if (loginRegister) loginRegister.classList.add('hidden');
        if (profile) profile.classList.remove('hidden');
    } else {
        if (loginRegister) loginRegister.classList.remove('hidden');
        if (profile) profile.classList.add('hidden');
    }

    // Cart: read from localStorage and render
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const cartCountElement = document.getElementById('cart-count');
    const drawerCountElement = document.getElementById('drawer-cart-count');
    const drawerItemsList = document.getElementById('drawer-items');
    const drawerSubtotal = document.getElementById('drawer-subtotal');

    function updateCartCount() {
        const count = cartItems.reduce((acc, i) => acc + (i.quantity || 1), 0);
        if (cartCountElement) {
            cartCountElement.textContent = count;
            // Show/hide count badge - only show when count > 0
            if (count > 0) {
                cartCountElement.style.display = 'inline';
            } else {
                cartCountElement.style.display = 'none';
            }
        }
        if (drawerCountElement) {
            drawerCountElement.textContent = count;
            // Show/hide drawer count - only show when count > 0
            if (count > 0) {
                drawerCountElement.style.display = 'inline';
            } else {
                drawerCountElement.style.display = 'none';
            }
        }
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }

    function formatMoney(amount) {
        return '$' + parseFloat(amount).toFixed(2);
    }

    function renderDrawerItems() {
        if (!drawerItemsList) return;
        drawerItemsList.innerHTML = '';
        let subtotal = 0;
        
        // Show/hide empty state and cart content
        const emptyState = document.getElementById('cart-empty-state');
        const cartItemsContainer = document.getElementById('cart-items-container');
        const cartFooter = document.getElementById('cart-footer');
        
        if (cartItems.length === 0) {
            if (emptyState) emptyState.style.display = 'flex';
            if (cartItemsContainer) cartItemsContainer.style.display = 'none';
            if (cartFooter) cartFooter.style.display = 'none';
            return;
        } else {
            if (emptyState) emptyState.style.display = 'none';
            if (cartItemsContainer) cartItemsContainer.style.display = 'flex';
            if (cartFooter) cartFooter.style.display = 'block';
        }
        
        cartItems.forEach((item, idx) => {
            const li = document.createElement('li');
            li.className = 'horizontal-product';
            
            // Media
            const mediaDiv = document.createElement('a');
            mediaDiv.className = 'horizontal-product__media';
            mediaDiv.href = '#';
            const img = document.createElement('img');
            img.src = item.image;
            img.alt = item.name;
            mediaDiv.appendChild(img);
            
            // Details container
            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'horizontal-product__details';
            
            // Title and info
            const infoDiv = document.createElement('div');
            infoDiv.className = 'horizontal-product__info';
            const titleDiv = document.createElement('div');
            const titleLink = document.createElement('a');
            titleLink.href = '#';
            titleLink.className = 'horizontal-product__title';
            titleLink.textContent = item.name;
            titleDiv.appendChild(titleLink);
            infoDiv.appendChild(titleDiv);
            
            const priceDiv = document.createElement('div');
            priceDiv.className = 'horizontal-product__price';
            priceDiv.textContent = item.price;
            infoDiv.appendChild(priceDiv);
            
            detailsDiv.appendChild(infoDiv);
            
            // Quantity container
            const quantityDiv = document.createElement('div');
            quantityDiv.className = 'horizontal-product__quantity';
            
            const quantityInfo = document.createElement('div');
            quantityInfo.className = 'cart-quantity__info';
            
            const quantityInput = document.createElement('div');
            quantityInput.className = 'cart-quantity';
            
            const input = document.createElement('input');
            input.className = 'quantity__input';
            input.type = 'number';
            input.min = '1';
            input.value = item.quantity || 1;
            input.dataset.index = idx;
            
            const buttonsDiv = document.createElement('div');
            buttonsDiv.className = 'quantity__buttons';
            
            const plusBtn = document.createElement('button');
            plusBtn.type = 'button';
            plusBtn.className = 'quantity__button';
            plusBtn.dataset.index = idx;
            plusBtn.innerHTML = '<svg class="icon icon-increase" viewBox="0 0 8 6" stroke="currentColor" fill="none"><path stroke-linecap="round" stroke-linejoin="round" d="M0.5 4.75L4 1.25L7.5 4.75"></path></svg>';
            
            const minusBtn = document.createElement('button');
            minusBtn.type = 'button';
            minusBtn.className = 'quantity__button';
            minusBtn.dataset.index = idx;
            minusBtn.innerHTML = '<svg class="icon icon-decrease" viewBox="0 0 8 6" stroke="currentColor" fill="none"><path stroke-linecap="round" stroke-linejoin="round" d="M0.5 1.25L4 4.75L7.5 1.25"></path></svg>';
            
            buttonsDiv.appendChild(plusBtn);
            buttonsDiv.appendChild(minusBtn);
            
            quantityInput.appendChild(input);
            quantityInput.appendChild(buttonsDiv);
            quantityInfo.appendChild(quantityInput);
            
            const removeDiv = document.createElement('div');
            removeDiv.className = 'cart-remove';
            const removeLink = document.createElement('a');
            removeLink.href = '#';
            removeLink.className = 'link';
            removeLink.textContent = 'Remove';
            removeLink.dataset.index = idx;
            removeDiv.appendChild(removeLink);
            
            quantityInfo.appendChild(removeDiv);
            quantityDiv.appendChild(quantityInfo);
            
            detailsDiv.appendChild(quantityDiv);
            
            li.appendChild(mediaDiv);
            li.appendChild(detailsDiv);
            drawerItemsList.appendChild(li);

            // subtotal (strip $)
            const priceNumber = parseFloat((item.price || '0').replace(/[^0-9.-]+/g, ''));
            subtotal += priceNumber * (item.quantity || 1);
        });
        
        if (drawerSubtotal) drawerSubtotal.textContent = formatMoney(subtotal) + ' USD';
        
        // Add event listeners
        document.querySelectorAll('.quantity__button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const i = parseInt(btn.dataset.index);
                const svg = btn.querySelector('svg');
                if (svg && svg.classList.contains('icon-increase')) {
                    cartItems[i].quantity = (cartItems[i].quantity || 1) + 1;
                } else if (svg && svg.classList.contains('icon-decrease')) {
                    cartItems[i].quantity = Math.max(1, (cartItems[i].quantity || 1) - 1);
                }
                localStorage.setItem('cartItems', JSON.stringify(cartItems));
                updateCartCount(); renderDrawerItems();
            });
        });
        
        document.querySelectorAll('.cart-remove .link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const i = parseInt(link.dataset.index);
                cartItems.splice(i, 1);
                localStorage.setItem('cartItems', JSON.stringify(cartItems));
                updateCartCount(); renderDrawerItems();
            });
        });
        
        document.querySelectorAll('.quantity__input').forEach(input => {
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
    const overlay = document.getElementById('cart-overlay');
    if (overlay) overlay.addEventListener('click', closeCartDrawer);
    const checkoutBtn = document.getElementById('drawer-checkout');
    if (checkoutBtn) checkoutBtn.addEventListener('click', ()=>{ 
        // Sync cart to checkout page
        localStorage.setItem('checkoutItems', JSON.stringify(cartItems));
        window.location.href = 'checkout.html'; 
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
    const cells = Array.from(container.querySelectorAll('.col-md-4'));
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
        // destroy flickity if exists and restore layout
        if (container._flkty) {
            container._flkty.destroy();
            delete container._flkty;
        }
        cells.forEach(cell => {
            cell.classList.remove('carousel-cell', 'col-12');
            if (!cell.classList.contains('col-md-4')) cell.classList.add('col-md-4');
        });
        container.classList.remove('why-buy-carousel');
    }
}

// initialize and listen for resize events (debounce)
let _resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(() => { setupWhyBuyFlickity(); }, 150);
});
document.addEventListener('DOMContentLoaded', setupWhyBuyFlickity);
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

// Video Banner Controls
const videoControl = document.getElementById('video-control');
const featuredVideo = document.getElementById('featured-video');
const playIcon = document.querySelector('.video-play-icon');
const pauseIcon = document.querySelector('.video-pause-icon');

if (videoControl && featuredVideo) {
    // Initially video is playing (autoplay), so show pause icon
    if (playIcon) playIcon.style.display = 'none';
    if (pauseIcon) pauseIcon.style.display = 'block';
    
    videoControl.addEventListener('click', () => {
        if (featuredVideo.paused) {
            featuredVideo.play();
            if (playIcon) playIcon.style.display = 'none';
            if (pauseIcon) pauseIcon.style.display = 'block';
        } else {
            featuredVideo.pause();
            if (playIcon) playIcon.style.display = 'block';
            if (pauseIcon) pauseIcon.style.display = 'none';
        }
    });
    
    // Handle video end
    featuredVideo.addEventListener('ended', () => {
        if (playIcon) playIcon.style.display = 'block';
        if (pauseIcon) pauseIcon.style.display = 'none';
    });
}
