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
        if (cartCountElement) cartCountElement.textContent = count;
        if (drawerCountElement) drawerCountElement.textContent = count;
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }

    function formatMoney(amount) {
        return '$' + parseFloat(amount).toFixed(2);
    }

    function renderDrawerItems() {
        if (!drawerItemsList) return;
        drawerItemsList.innerHTML = '';
        let subtotal = 0;
        // the header preview thumbnails
        const preview = document.getElementById('drawer-preview');
        if (preview) preview.innerHTML = '';
        cartItems.forEach((item, idx) => {
            const li = document.createElement('li');
            li.className = 'drawer-item d-flex align-items-center gap-3 mb-3';
            const img = `<div class="drawer-item-media"><img src="${item.image}" alt="${item.name}" class="drawer-thumb"></div>`;
            const info = `<div class="drawer-item-info flex-grow-1"><div class="name">${item.name}</div><div class="price text-muted">${item.price}</div></div>`;
            const qty = `<div class="drawer-item-qty d-flex align-items-center gap-2"><button class="btn btn-light qty-minus" data-index="${idx}">-</button><input class="qty-input text-center" data-index="${idx}" type="number" min="1" value="${item.quantity||1}" /><button class="btn btn-light qty-plus" data-index="${idx}">+</button></div>`;
            const remove = `<div class="drawer-item-remove"><a href="#" class="remove-link text-danger" data-index="${idx}">Xóa</a></div>`;
            li.innerHTML = img + info + qty + remove;
            drawerItemsList.appendChild(li);

            // subtotal (strip $)
            const priceNumber = parseFloat((item.price || '0').replace(/[^0-9.-]+/g, ''));
            subtotal += priceNumber * (item.quantity || 1);
        });
        // preview thumbnails: show up to 4 images in the header
        if (preview) {
            cartItems.slice(0,4).forEach(i => {
                const thumb = document.createElement('img');
                thumb.src = i.image;
                thumb.alt = i.name;
                thumb.className = 'drawer-preview-thumb';
                preview.appendChild(thumb);
            });
            if (cartItems.length > 4) {
                const more = document.createElement('span');
                more.className = 'drawer-preview-more badge bg-secondary ms-2';
                more.textContent = `+${cartItems.length - 4}`;
                preview.appendChild(more);
            }
        }
        if (drawerSubtotal) drawerSubtotal.textContent = formatMoney(subtotal);
        // add listeners
        document.querySelectorAll('.qty-plus').forEach(btn => {
            btn.addEventListener('click', (e) => {
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
        cartDrawer.classList.add('is-open');
        cartDrawer.setAttribute('aria-hidden', 'false');
        renderDrawerItems();
    }
    function closeCartDrawer() {
        if (!cartDrawer) return;
        cartDrawer.classList.remove('is-open');
        cartDrawer.setAttribute('aria-hidden', 'true');
    }
    cartToggle.forEach(t => t.addEventListener('click', (e)=>{ e.preventDefault(); openCartDrawer(); }));
    if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeCartDrawer);
    if (cartDrawer) {
        const overlay = cartDrawer.querySelector('.cart-overlay');
        if (overlay) overlay.addEventListener('click', closeCartDrawer);
    }
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

