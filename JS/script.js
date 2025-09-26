$(document).ready(function () {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const loginRegister = document.getElementById('login-register');
    const profile = document.getElementById('profile');

    if (isLoggedIn) {
        loginRegister.style.display = 'none'; 
        profile.style.display = 'block'; 
    } else {
        loginRegister.style.display = 'block'; 
        profile.style.display = 'none'; 
    }
});
$(document).ready(function () {
    let cartCount = 0;

    const cartCountElement = document.getElementById('cart-count');

    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach((button) => {
        button.addEventListener('click', () => {
            cartCount++;

            cartCountElement.textContent = cartCount;

            cartCountElement.classList.add('cart-update');
            setTimeout(() => {
                cartCountElement.classList.remove('cart-update');
            }, 300);
        });
    });
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


nextButton.addEventListener('click', nextSlide);
prevButton.addEventListener('click', prevSlide);


setInterval(nextSlide, 8000);
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

