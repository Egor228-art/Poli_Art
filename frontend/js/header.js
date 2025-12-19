// Динамическая загрузка хедера
function loadHeader() {
    const headerContainer = document.querySelector('header');
    
    if (!headerContainer) {
        console.error('Header container not found');
        return;
    }

    headerContainer.innerHTML = `
        <div class="container">
            <div class="header__inner">
                <div class="header__logo">
                    <a href="index.html" class="logo">ПолиАрт</a>
                </div>
                <nav class="header__nav">
                    <ul class="nav__list">
                        <li class="nav__item"><a href="index.html" class="nav__link">Главная</a></li>
                        <li class="nav__item"><a href="catalog.html" class="nav__link">Каталог</a></li>
                        <li class="nav__item"><a href="services.html" class="nav__link">Услуги</a></li>
                        <li class="nav__item"><a href="about.html" class="nav__link">О компании</a></li>
                        <li class="nav__item"><a href="contacts.html" class="nav__link">Контакты</a></li>
                    </ul>
                </nav>
                <div class="header__contacts">
                    <a href="tel:+78162555555" class="phone">+7 (8162) 55-55-55</a>
                </div>
                <div class="header__actions">
                    <button href="contacts.html" class="btn btn--secondary">Заказать замер</button>
                </div>
                <div class="header__burger">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    `;

    // Инициализация функционала хедера после загрузки
    initHeaderFunctionality();
}

function initHeaderFunctionality() {
    // Бургер-меню
    const burger = document.querySelector('.header__burger');
    const nav = document.querySelector('.header__nav');
    const body = document.body;
    
    if (burger && nav) {
        burger.addEventListener('click', function() {
            this.classList.toggle('active');
            nav.classList.toggle('active');
            body.classList.toggle('no-scroll');
        });

        // Закрытие меню при клике на ссылку
        const navLinks = document.querySelectorAll('.nav__link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                burger.classList.remove('active');
                nav.classList.remove('active');
                body.classList.remove('no-scroll');
            });
        });
    }

    // Подсветка активной страницы
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav__link');
    
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if ((currentPage === 'index.html' && linkHref === '/') || 
            (linkHref === currentPage) ||
            (currentPage === '' && linkHref === '/')) {
            link.classList.add('active');
        }
    });

    // Фиксация хедера при скролле
    const header = document.querySelector('.header');
    if (header) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }
}

// Загружаем хедер при загрузке страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadHeader);
} else {
    loadHeader();
}