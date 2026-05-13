// Функционал для страницы услуг
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация плавной прокрутки к услугам
    initServiceNavigation();
    
    // Инициализация анимаций при скролле
    initScrollAnimations();
    
    // Перенаправляем кнопки замера на глобальный обработчик
    redirectMeasureButtons();
});

function redirectMeasureButtons() {
    // Перенаправляем все кнопки замера на глобальный обработчик из footer.js
    const measureButtons = document.querySelectorAll('.free-measure-btn');
    
    measureButtons.forEach(btn => {
        // Удаляем все существующие обработчики
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        // Добавляем новый обработчик
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('🔄 Перенаправление на модальное окно замера из services.js');
            
            // Вызываем глобальную функцию открытия модального окна
            if (typeof window.openMeasureModal === 'function') {
                window.openMeasureModal();
            } else if (window.footerManager && typeof window.footerManager.openMeasureModal === 'function') {
                window.footerManager.openMeasureModal();
            } else {
                console.warn('⚠️ Функция openMeasureModal не найдена, пробуем альтернативный метод...');
                
                // Альтернативный метод - ищем модальное окно и показываем его напрямую
                const modal = document.getElementById('measureModal');
                if (modal) {
                    modal.style.display = 'flex';
                    document.body.style.overflow = 'hidden';
                    
                    // Пробуем заполнить форму данными пользователя
                    if (typeof window.populateMeasureForm === 'function') {
                        window.populateMeasureForm();
                    }
                } else {
                    console.error('❌ Модальное окно замера не найдено');
                    alert('Модальное окно не найдено. Пожалуйста, обновите страницу.');
                }
            }
        });
    });
    
    console.log('✅ Кнопки замера перенаправлены на глобальный обработчик');
}

function initServiceNavigation() {
    // Плавная прокрутка к услугам из футера
    const serviceLinks = document.querySelectorAll('a[href^="services.html#"]');
    serviceLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.pathname === window.location.pathname) {
                e.preventDefault();
                const targetId = this.hash.substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
                    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
}

function initScrollAnimations() {
    // Анимация появления элементов при скролле
    const animatedElements = document.querySelectorAll('.service, .advantage-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    animatedElements.forEach(el => {
        observer.observe(el);
    });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.innerHTML = `
        <div class="notification__content">
            <span class="notification__message">${message}</span>
            <button class="notification__close">&times;</button>
        </div>
    `;
    
    // Добавляем стили для уведомления
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 0;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 400px;
        transform: translateX(120%);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Анимация появления
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Кнопка закрытия
    const closeBtn = notification.querySelector('.notification__close');
    closeBtn.addEventListener('click', function() {
        notification.style.transform = 'translateX(120%)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Автоматическое закрытие через 5 секунд
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(120%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}