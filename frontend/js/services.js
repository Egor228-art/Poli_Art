// Функционал для страницы услуг
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация модального окна
    initServiceModal();
    
    // Инициализация плавной прокрутки к услугам
    initServiceNavigation();
    
    // Инициализация анимаций при скролле
    initScrollAnimations();
});

function initServiceModal() {
    const modal = document.getElementById('serviceModal');
    const orderButtons = document.querySelectorAll('.service__order-btn, #orderMeasureBtn, #ctaOrderBtn');
    const closeButton = document.getElementById('modalClose');
    const serviceTypeInput = document.getElementById('serviceType');
    const form = document.getElementById('serviceForm');

    // Открытие модального окна
    orderButtons.forEach(button => {
        button.addEventListener('click', function() {
            const serviceName = this.getAttribute('data-service') || 'Услуга';
            serviceTypeInput.value = serviceName;
            
            // Обновление заголовка в модальном окне
            const modalTitle = document.querySelector('.modal__title');
            modalTitle.textContent = `Заказать ${serviceName.toLowerCase()}`;
            
            openModal(modal);
        });
    });

    // Закрытие модального окна
    closeButton.addEventListener('click', function() {
        closeModal(modal);
    });

    // Закрытие по клику на оверлей
    modal.querySelector('.modal__overlay').addEventListener('click', function() {
        closeModal(modal);
    });

    // Закрытие по ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal(modal);
        }
    });

    // Обработка отправки формы
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const serviceData = {
            service: formData.get('service_type'),
            name: formData.get('name'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            message: formData.get('message')
        };
        
        // Отправка данных (заглушка)
        submitServiceRequest(serviceData);
    });
}

function openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function submitServiceRequest(data) {
    // Здесь должна быть реальная логика отправки данных на сервер
    console.log('Отправка данных услуги:', data);
    
    // Показываем уведомление об успехе
    showNotification('Ваша заявка успешно отправлена! Мы свяжемся с вами в течение 15 минут.', 'success');
    
    // Закрываем модальное окно
    closeModal(document.getElementById('serviceModal'));
    
    // Очищаем форму
    document.getElementById('serviceForm').reset();
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
                    const headerHeight = document.querySelector('.header').offsetHeight;
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