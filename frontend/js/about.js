// about.js - Слайдер отзывов и дополнительный функционал
document.addEventListener('DOMContentLoaded', function() {
    initReviewsSlider();
    initGallery();
    initTeamAnimations();
});

// Инициализация слайдера отзывов
function initReviewsSlider() {
    const sliderTrack = document.querySelector('.slider__track');
    const slides = document.querySelectorAll('.slider__slide');
    const prevBtn = document.querySelector('.slider__btn--prev');
    const nextBtn = document.querySelector('.slider__btn--next');
    const dotsContainer = document.querySelector('.slider__dots');
    
    if (!sliderTrack || !slides.length) return;
    
    let currentSlide = 0;
    const slideCount = slides.length;
    
    // Создаем точки навигации
    slides.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = 'slider__dot';
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });
    
    const dots = document.querySelectorAll('.slider__dot');
    
    function goToSlide(slideIndex) {
        currentSlide = slideIndex;
        sliderTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
        
        // Обновляем активную точку
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
        
        // Обновляем состояние кнопок
        updateButtons();
    }
    
    function nextSlide() {
        if (currentSlide < slideCount - 1) {
            goToSlide(currentSlide + 1);
        }
    }
    
    function prevSlide() {
        if (currentSlide > 0) {
            goToSlide(currentSlide - 1);
        }
    }
    
    function updateButtons() {
        prevBtn.disabled = currentSlide === 0;
        nextBtn.disabled = currentSlide === slideCount - 1;
    }
    
    // Обработчики событий
    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);
    
    // Автопрокрутка
    let autoSlide = setInterval(nextSlide, 5000);
    
    // Останавливаем автопрокрутку при наведении
    const slider = document.querySelector('.reviews-slider');
    slider.addEventListener('mouseenter', () => clearInterval(autoSlide));
    slider.addEventListener('mouseleave', () => {
        autoSlide = setInterval(nextSlide, 5000);
    });
    
    // Инициализация
    updateButtons();
}

// Инициализация галереи
function initGallery() {
    const galleryItems = document.querySelectorAll('.gallery__item');
    
    galleryItems.forEach(item => {
        item.addEventListener('click', function() {
            // Можно добавить функционал модального окна для просмотра изображений
            console.log('Открытие изображения галереи');
        });
    });
}

// Анимации для команды
function initTeamAnimations() {
    const teamMembers = document.querySelectorAll('.team-member');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });
    
    teamMembers.forEach(member => {
        member.style.opacity = '0';
        member.style.transform = 'translateY(30px)';
        member.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(member);
    });
}

// Обработка CTA кнопок
document.addEventListener('DOMContentLoaded', function() {
    const ctaButtons = document.querySelectorAll('.cta-section .btn');
    
    ctaButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (this.textContent.includes('консультацию')) {
                // Открытие формы заявки
                console.log('Открытие формы консультации');
            } else {
                // Позвонить
                console.log('Инициация звонка');
            }
        });
    });
});