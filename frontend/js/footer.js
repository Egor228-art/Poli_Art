// Динамическая загрузка футера
function loadFooter() {
    const footerContainer = document.querySelector('footer');
    
    if (!footerContainer) {
        console.error('Footer container not found');
        return;
    }

    footerContainer.innerHTML = `
        <div class="container">
            <div class="footer__inner">
                <div class="footer__col">
                    <div class="footer__logo">ПолиАрт</div>
                    <p class="footer__text">Продажа качественных дверей, ламината и комплектующих в Новгородской области</p>
                    <div class="footer__social">
                        <img src="image/icon/VK.png" class="social-link" alt="VK">
                        <img src="image/icon/One.jpg" class="social-link" alt="Schoolmates">
                        <img src="image/icon/Youtube.png" class="social-link" alt="YouTube">
                    </div>
                </div>
                <div class="footer__col">
                    <h3 class="footer__title">Каталог</h3>
                    <ul class="footer__list">
                        <li><a href="catalog/interior.html">Межкомнатные двери</a></li>
                        <li><a href="catalog/entrance.html">Входные двери</a></li>
                        <li><a href="catalog/sliding.html">Раздвижные двери</a></li>
                        <li><a href="catalog/laminate.html">Ламинат</a></li>
                        <li><a href="catalog/components.html">Комплектующие</a></li>
                    </ul>
                </div>
                <div class="footer__col">
                    <h3 class="footer__title">Услуги</h3>
                    <ul class="footer__list">
                        <li><a href="services/measure.html">Бесплатный замер</a></li>
                        <li><a href="services/delivery.html">Доставка</a></li>
                        <li><a href="services/installation.html">Установка</a></li>
                        <li><a href="services/warranty.html">Гарантия</a></li>
                    </ul>
                </div>
                <div class="footer__col">
                    <h3 class="footer__title">Контакты</h3>
                    <div class="footer__contacts">
                        <div class="contact-item">
                            <span class="contact-label">Телефон:⠀</span>
                            <a href="tel: +78162555555" class="contact-link"> +7 (8162) 55-55-55</a>
                        </div>
                        <div class="contact-item">
                            <span class="contact-label">Адрес:⠀</span>
                            <span class="contact-text"> г. Великий Новгород, ул. Примерная, д. 123</span>
                        </div>
                        <div class="contact-item">
                            <span class="contact-label">Email:⠀</span>
                            <a href="mailto: info@polyart.ru" class="contact-link"> info@polyart.ru</a>
                        </div>
                        <div class="contact-item">
                            <span class="contact-label">Режим работы:</span>
                            <span class="contact-text">Пн-Пт: 9:00-19:00, Сб-Вс: 10:00-17:00</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="footer__bottom">
                <div class="footer__copyright">© 2025 ПолиАрт. Все права защищены.</div>
                <div class="footer__links">
                    <a href="#" class="footer-link">Политика конфиденциальности</a>
                    <a href="#" class="footer-link">Пользовательское соглашение</a>
                </div>
            </div>
        </div>
    `;

    // Инициализация функционала футера после загрузки
    initFooterFunctionality();
}

function initFooterFunctionality() {
    // Обработка социальных ссылок
    const socialLinks = document.querySelectorAll('.social-link');
    socialLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const socialType = this.alt;
            console.log('Переход в социальную сеть:', socialType);
            // Здесь можно добавить переход по реальным ссылкам
        });
    });

    // Аккордеон для мобильной версии
    if (window.innerWidth <= 768) {
        const footerTitles = document.querySelectorAll('.footer__title');
        footerTitles.forEach(title => {
            title.addEventListener('click', function() {
                const content = this.nextElementSibling;
                this.classList.toggle('active');
                
                if (content.style.maxHeight) {
                    content.style.maxHeight = null;
                } else {
                    content.style.maxHeight = content.scrollHeight + "px";
                }
            });
        });
    }
}

// Загружаем футер при загрузке страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadFooter);
} else {
    loadFooter();
}