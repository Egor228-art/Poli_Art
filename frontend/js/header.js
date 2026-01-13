// header.js - Упрощенная версия

function loadHeader() {
    const headerContainer = document.querySelector('header');
    
    if (!headerContainer) {
        console.error('Header container not found');
        return;
    }

    headerContainer.innerHTML = `
        <style>
/* ============ ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ (УЛУЧШЕННЫЙ) ============ */
.header-user-info {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 22px;
    background: linear-gradient(135deg, rgba(255,255,255,0.97), rgba(255,255,255,0.92));
    backdrop-filter: blur(20px);
    border-radius: 16px;
    border: 2px solid rgba(255,255,255,0.8);
    box-shadow: 
        0 12px 40px rgba(0,0,0,0.12),
        0 4px 20px rgba(0,0,0,0.06),
        inset 0 1px 0 rgba(255,255,255,0.9),
        0 0 0 1px rgba(0,0,0,0.03);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    min-width: 300px;
    max-width: 400px;
}

.header-user-info::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #eabb66 0%, #e74c3c 50%, #eabb66 100%);
    background-size: 200% 100%;
    animation: gradientFlow 3s ease infinite;
    z-index: 1;
}

.header-user-info::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 30% 50%, rgba(234, 187, 102, 0.08) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 0;
}

.header-user-info:hover {
    transform: translateY(-4px);
    box-shadow: 
        0 20px 50px rgba(0,0,0,0.18),
        0 8px 30px rgba(0,0,0,0.1),
        inset 0 1px 0 rgba(255,255,255,0.95),
        0 0 0 1px rgba(0,0,0,0.05);
    border-color: rgba(255,255,255,0.9);
}

.header-user-info:hover::after {
    opacity: 1;
}

.user-profile {
    display: flex;
    align-items: center;
    gap: 15px;
}

/* Ссылка на профиль */
.user-profile-link {
    display: flex;
    align-items: center;
    gap: 16px;
    text-decoration: none !important;
    flex: 1;
    position: relative;
    z-index: 2;
    padding-right: 10px;
    transition: transform 0.3s ease;
}

.user-profile-link:hover {
    transform: translateX(3px);
}

/* Аватар пользователя */
.user-avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: linear-gradient(135deg, #eabb66 0%, #e74c3c 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 20px;
    box-shadow: 
        0 6px 20px rgba(234, 187, 102, 0.4),
        0 2px 8px rgba(0,0,0,0.1),
        inset 0 1px 1px rgba(255,255,255,0.4);
    border: 3px solid white;
    position: relative;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    flex-shrink: 0;
}

.user-avatar::after {
    content: '';
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    bottom: -3px;
    border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.8);
    opacity: 0;
    transition: opacity 0.3s ease;
}

.user-profile-link:hover .user-avatar {
    transform: scale(1.08) rotate(5deg);
    box-shadow: 
        0 10px 30px rgba(234, 187, 102, 0.6),
        0 4px 15px rgba(0,0,0,0.15),
        inset 0 1px 1px rgba(255,255,255,0.6);
}

.user-profile-link:hover .user-avatar::after {
    opacity: 1;
}

/* Информация о пользователе */
.user-details {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
    min-width: 0;
    position: relative;
}

.user-name {
    color: #2c3e50;
    font-weight: 700;
    font-size: 17px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    position: relative;
    line-height: 1.3;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: color 0.3s ease;
    cursor: pointer;
}

.user-name::before {
    content: '👤';
    font-size: 16px;
    filter: drop-shadow(0 1px 1px rgba(0,0,0,0.1));
    opacity: 0.9;
}

.user-profile-link:hover .user-name {
    color: #e74c3c;
}

.user-email {
    color: #666;
    font-size: 13px;
    font-weight: 500;
    opacity: 0.9;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.2;
    padding-left: 24px;
    position: relative;
}

.user-email::before {
    content: '✉️';
    position: absolute;
    left: 0;
    font-size: 12px;
    opacity: 0.7;
}

/* Индикатор статуса */
.user-status-indicator {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: linear-gradient(135deg, #2ecc71, #27ae60);
    border: 2px solid white;
    box-shadow: 
        0 0 0 3px rgba(46, 204, 113, 0.3),
        0 3px 6px rgba(0,0,0,0.15);
    animation: pulseStatus 2s infinite;
    z-index: 3;
}

/* Бейдж администратора */
.user-role-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    background: linear-gradient(135deg, #e74c3c, #c0392b);
    color: white;
    font-size: 10px;
    padding: 4px 10px;
    border-radius: 14px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    box-shadow: 
        0 4px 12px rgba(0,0,0,0.25),
        0 2px 0 rgba(255,255,255,0.3);
    z-index: 4;
    border: 2px solid white;
    text-shadow: 0 1px 1px rgba(0,0,0,0.3);
}

/* ============ КНОПКА ВЫЙТИ (С ТАКИМ ЖЕ СТИЛЕМ) ============ */
.logout-btn {
    padding: 12px 24px !important;
    font-size: 14px !important;
    border-radius: 12px !important;
    text-decoration: none !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 8px !important;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
    border: 2px solid #e74c3c !important;
    font-weight: 600 !important;
    text-align: center !important;
    min-width: 110px !important;
    position: relative !important;
    overflow: hidden !important;
    box-shadow: 0 4px 15px rgba(231, 76, 60, 0.2) !important;
    background: white !important;
    color: #e74c3c !important;
    cursor: pointer !important;
    white-space: nowrap !important;
    flex-shrink: 0 !important;
    z-index: 2 !important;
}

.logout-btn::before {
    content: '' !important;
    position: absolute !important;
    top: 0 !important;
    left: -100% !important;
    width: 100% !important;
    height: 100% !important;
    background: linear-gradient(90deg, transparent, rgba(231, 76, 60, 0.1), transparent) !important;
    transition: 0.6s !important;
}

.logout-btn:hover {
    background: linear-gradient(135deg, rgba(231, 76, 60, 0.05), rgba(234, 187, 102, 0.05)) !important;
    transform: translateY(-3px) !important;
    box-shadow: 0 8px 25px rgba(231, 76, 60, 0.3) !important;
    color: #c0392b !important;
    border-color: #c0392b !important;
}

.logout-btn:hover::before {
    left: 100% !important;
}

.logout-btn:active {
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 15px rgba(231, 76, 60, 0.25) !important;
}

.logout-btn-icon {
    font-size: 16px;
    transition: transform 0.3s ease;
}

.logout-btn:hover .logout-btn-icon {
    transform: translateX(2px);
}

/* ============ СТИЛИ ДЛЯ ГОСТЕЙ ============ */
.auth-buttons {
    display: flex;
    gap: 15px;
    align-items: center;
}

.btn-auth {
    padding: 12px 24px !important;
    font-size: 14px !important;
    border-radius: 12px !important;
    text-decoration: none !important;
    display: inline-block !important;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
    border: 2px solid #e9af61 !important;
    font-weight: 600 !important;
    text-align: center !important;
    min-width: 110px !important;
    position: relative !important;
    overflow: hidden !important;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1) !important;
}

.btn-auth::before {
    content: '' !important;
    position: absolute !important;
    top: 0 !important;
    left: -100% !important;
    width: 100% !important;
    height: 100% !important;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent) !important;
    transition: 0.6s !important;
}

.btn--secondary.btn-auth {
    background: white !important;
    color: #e74c3c !important;
    border-color: #e74c3c !important;
}

.btn {
    padding: 10px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    border: 2px solid var(--primary);
}

.btn--secondary.btn-auth:hover {
    background: linear-gradient(135deg, rgba(231, 76, 60, 0.05), rgba(234, 187, 102, 0.05)) !important;
    transform: translateY(-3px) !important;
    box-shadow: 0 8px 25px rgba(231, 76, 60, 0.25) !important;
}

.btn--primary.btn-auth {
    background: linear-gradient(135deg, #eabb66 0%, #e74c3c 100%) !important;
    color: white !important;
}

.btn--primary.btn-auth:hover {
    transform: translateY(-3px) !important;
    box-shadow: 0 10px 30px rgba(231, 76, 60, 0.35) !important;
}

.btn-auth:hover::before {
    left: 100% !important;
}

/* ============ АДАПТИВНОСТЬ ДЛЯ ПРОФИЛЯ ============ */
@media (max-width: 768px) {
    .header-user-info {
        min-width: 260px;
        padding: 10px 18px;
        gap: 14px;
    }
    
    .user-avatar {
        width: 46px;
        height: 46px;
        font-size: 18px;
    }
    
    .user-name {
        font-size: 16px;
    }
    
    .user-email {
        font-size: 12px;
    }
    
    .logout-btn,
    .btn-auth {
        padding: 10px 20px !important;
        font-size: 13px !important;
        min-width: 95px !important;
    }
    
    .auth-buttons {
        gap: 12px;
    }
}

@media (max-width: 480px) {
    .header-user-info {
        min-width: auto;
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
        padding: 14px;
    }
    
    .user-profile-link {
        flex-direction: column;
        text-align: center;
        gap: 12px;
        padding-right: 0;
    }
    
    .user-details {
        align-items: center;
    }
    
    .user-name {
        justify-content: center;
    }
    
    .user-email {
        padding-left: 0;
        padding-top: 4px;
    }
    
    .user-email::before {
        display: none;
    }
    
    .user-status-indicator {
        top: 8px;
        right: 8px;
    }
    
    .logout-btn,
    .btn-auth {
        width: 100% !important;
        padding: 12px !important;
        justify-content: center !important;
    }
    
    .auth-buttons {
        flex-direction: column;
        gap: 10px;
        width: 100%;
    }
}

/* ============ АНИМАЦИИ ============ */
@keyframes gradientFlow {
    0% {
        background-position: 0% 50%;
    }
    50% {
        background-position: 100% 50%;
    }
    100% {
        background-position: 0% 50%;
    }
}

@keyframes pulseStatus {
    0% {
        box-shadow: 
            0 0 0 0 rgba(46, 204, 113, 0.7),
            0 3px 6px rgba(0,0,0,0.15);
        transform: scale(1);
    }
    50% {
        box-shadow: 
            0 0 0 10px rgba(46, 204, 113, 0),
            0 3px 6px rgba(0,0,0,0.15);
        transform: scale(1.1);
    }
    100% {
        box-shadow: 
            0 0 0 0 rgba(46, 204, 113, 0),
            0 3px 6px rgba(0,0,0,0.15);
        transform: scale(1);
    }
}

@keyframes slideInUser {
    from {
        opacity: 0;
        transform: translateY(-15px) scale(0.95);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

/* Эффект наведения для всей карточки пользователя */
.header-user-info:hover .user-name {
    text-decoration: underline;
    text-decoration-color: #eabb66;
    text-underline-offset: 3px;
}
        </style>
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
                    <!-- Контейнер будет заполняться динамически -->
                    <div id="user-info-header">
                        <!-- По умолчанию показываем кнопки входа/регистрации -->
                        <div class="auth-buttons">
                            <a href="login.html" class="btn btn--secondary btn-auth">Войти</a>
                            <a href="register.html" class="btn btn--primary btn-auth">Регистрация</a>
                        </div>
                    </div>
                </div>
                <div class="header__burger">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    `;

    initHeaderFunctionality();
    checkAuthStatus();
}

async function checkAuthStatus() {
    try {
        if (typeof PocketBase !== 'undefined') {
            const pb = new PocketBase('http://127.0.0.1:8090');
            
            if (pb.authStore.isValid) {
                updateHeaderForLoggedInUser(pb.authStore.model);
            }
        }
    } catch (error) {
        console.log('Проверка авторизации:', error.message);
    }
}

function updateHeaderForLoggedInUser(user) {
    const headerActions = document.querySelector('.header__actions');
    if (!headerActions) return;
    
    const userName = user.name || user.email?.split('@')[0] || 'Пользователь';
    
    headerActions.innerHTML = `
        <div class="user-profile">
            <span class="user-name">${userName}</span>
            <button class="btn btn--secondary" onclick="logout()">Выйти</button>
        </div>
    `;
}

async function logout() {
    try {
        const pb = new PocketBase('http://127.0.0.1:8090');
        pb.authStore.clear();
        location.reload();
    } catch (error) {
        console.error('Ошибка выхода:', error);
        location.reload();
    }
}

// Остальные функции без изменений
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

    // Фиксация хедера
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

// Загрузка
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadHeader);
} else {
    loadHeader();
}