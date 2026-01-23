// reviews.js - Система управления отзывами

class ReviewSystem {
    constructor() {
        this.pb = null;
        this.currentProduct = null;
        this.currentUser = null;
        this.selectedRating = 0;
        this.isSubmitting = false;
        this.isLaminate = false; // Определяем тип товара
        
        // Инициализируем если PocketBase доступен
        if (typeof PocketBase !== 'undefined') {
            this.pb = new PocketBase('http://127.0.0.1:8090');
        }
        
        // Получаем текущего пользователя
        this.getCurrentUser();
        
        this.init();
    }

    init() {
        console.log('💬 Инициализация системы отзывов...');
        
        // Определяем тип товара
        this.detectProductType();
        
        // Ищем кнопку "Оставить отзыв"
        this.setupEventListeners();
        
        // Загружаем отзывы для текущего товара
        this.loadProductReviews();
    }

    detectProductType() {
        // Определяем по URL или другим признакам
        const currentUrl = window.location.href;
        this.isLaminate = currentUrl.includes('laminate-product.html') || 
                         currentUrl.includes('laminate') ||
                         (typeof window.isLaminateProduct !== 'undefined' && window.isLaminateProduct === true);
        
        console.log('📋 Тип товара для отзывов:', this.isLaminate ? 'Ламинат' : 'Двери');
    }

    getCurrentUser() {
        // Проверяем глобальный authManager
        if (window.authManager && window.authManager.currentUser) {
            this.currentUser = window.authManager.currentUser;
        } else if (window.pb && window.pb.authStore && window.pb.authStore.isValid) {
            this.currentUser = window.pb.authStore.model;
        }
        
        return this.currentUser;
    }

    getCurrentProductId() {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id') || 
                         document.querySelector('[data-product-id]')?.dataset.productId ||
                         window.currentProductId;
        
        // Сохраняем в глобальную переменную
        window.currentProductId = productId;
        window.isLaminateProduct = this.isLaminate;
        
        console.log('📦 ID текущего товара:', productId, 'Тип:', this.isLaminate ? 'laminate' : 'doors');
        return productId;
    }

    getReviewsCollectionName() {
        return this.isLaminate ? 'reviews_laminate' : 'reviews';
    }

    async loadProductReviews() {
        const productId = this.getCurrentProductId();
        if (!productId || !this.pb) {
            console.log('⚠️ Не удалось загрузить отзывы: отсутствует productId или pb');
            this.displayReviews([]);
            return;
        }

        const collectionName = this.getReviewsCollectionName();
        
        try {
            console.log(`📥 Загрузка отзывов из ${collectionName} для товара:`, productId);
            
            const response = await this.pb.collection(collectionName).getList(1, 50, {
                filter: `product = "${productId}"`,
                sort: '-created'
            });

            console.log(`✅ Загружено ${response.items.length} отзывов`);
            this.displayReviews(response.items);
            
        } catch (error) {
            console.error('❌ Ошибка загрузки отзывов:', error);
            
            // Если таблицы еще нет, показываем пустой список
            if (error.status === 404) {
                console.log('Таблица отзывов не найдена, показываем пустой список');
                this.displayReviews([]);
            } else {
                this.showMessage('Не удалось загрузить отзывы', 'error');
            }
        }
    }

    displayReviews(reviews) {
        const container = document.getElementById('reviewsList') || 
                         document.querySelector('.reviews-list');
        
        if (!container) {
            console.log('ℹ️ Контейнер для отзывов не найден, создаем новый');
            this.createReviewsContainer();
            return this.displayReviews(reviews); // Повторяем после создания контейнера
        }

        if (reviews.length === 0) {
            container.innerHTML = `
                <div class="no-reviews">
                    <div class="no-reviews__icon">💬</div>
                    <div class="no-reviews__text">Пока нет отзывов. Будьте первым!</div>
                    ${this.currentUser ? `
                        <button class="btn btn--primary no-reviews__btn" id="addFirstReview">
                            Написать отзыв
                        </button>
                    ` : ''}
                </div>
            `;
            return;
        }

        // Фильтруем отзывы - сначала одобренные
        const approvedReviews = reviews.filter(r => r.approved);
        const pendingReviews = reviews.filter(r => !r.approved && 
            this.currentUser && r.author_name === (this.currentUser.name || this.currentUser.username));

        // Показываем статистику
        this.updateReviewsStats(approvedReviews);

        // Отображаем отзывы
        container.innerHTML = [
            ...approvedReviews.map(review => this.createReviewHTML(review)),
            ...pendingReviews.map(review => this.createReviewHTML(review))
        ].join('');

        // Обновляем кнопку "Оставить отзыв"
        this.updateReviewButton();
    }

    createReviewHTML(review) {
        const date = new Date(review.created).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        // Используем author_name из записи отзыва
        const authorName = review.author_name || 'Анонимный пользователь';
        const initials = this.getUserInitials(authorName);
        const ratingStars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
        const statusClass = review.approved ? 'approved' : 'pending';
        const statusText = review.approved ? 'Одобрен' : 'Ожидает модерации';

        return `
            <div class="review-item" data-review-id="${review.id}">
                <div class="review-item__header">
                    <div class="review-item__author">
                        <div class="review-item__avatar">${initials}</div>
                        <div class="review-item__info">
                            <div class="review-item__name">${authorName}</div>
                            <div class="review-item__date">${date}</div>
                        </div>
                    </div>
                    <div class="review-item__rating" title="${review.rating} из 5">
                        ${ratingStars}
                    </div>
                </div>
                <div class="review-item__content">${review.text}</div>
                ${!review.approved ? `
                    <div class="review-item__footer">
                        <div class="review-item__status review-item__status--${statusClass}">
                            ${statusText}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    updateReviewsStats(reviews) {
        const statsContainer = document.querySelector('.reviews-stats');
        if (!statsContainer) return;

        const averageRating = reviews.length > 0 
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : 0;

        statsContainer.innerHTML = `
            <div class="reviews-average">
                <span>${averageRating}</span>
                <span>★</span>
            </div>
            <div class="reviews-count">${reviews.length} отзывов</div>
        `;
    }

    createReviewsContainer() {
        // Проверяем, есть ли уже контейнер
        if (document.getElementById('reviewsContainer')) return;

        const productContainer = document.querySelector('.product-details') || 
                               document.querySelector('.product-info') ||
                               document.querySelector('main');

        if (!productContainer) {
            console.warn('⚠️ Контейнер для товара не найден');
            return;
        }

        const reviewsHTML = `
            <div class="reviews-container" id="reviewsContainer">
                <div class="reviews-header">
                    <h2 class="reviews-title">Отзывы покупателей</h2>
                    <div class="reviews-stats">
                        <div class="reviews-average">0 ★</div>
                        <div class="reviews-count">0 отзывов</div>
                    </div>
                </div>
                <div class="reviews-actions">
                    <button class="review-add-btn" id="addReviewBtn">
                        <span>💬 Оставить отзыв</span>
                    </button>
                </div>
                <div class="reviews-list" id="reviewsList">
                    <div class="no-reviews">
                        <div class="no-reviews__icon">💬</div>
                        <div class="no-reviews__text">Пока нет отзывов. Будьте первым!</div>
                    </div>
                </div>
            </div>
        `;

        productContainer.insertAdjacentHTML('beforeend', reviewsHTML);
        
        // Обновляем кнопку
        this.updateReviewButton();
        
        // Добавляем обработчики
        this.setupEventListeners();
    }

    updateReviewButton() {
        const addBtn = document.getElementById('addReviewBtn') || 
                      document.getElementById('addFirstReview');
        
        if (!addBtn) return;

        if (!this.currentUser) {
            addBtn.innerHTML = '<span>🔒 Войдите, чтобы оставить отзыв</span>';
            addBtn.disabled = true;
            addBtn.onclick = () => {
                window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
            };
        } else {
            addBtn.innerHTML = '<span>💬 Оставить отзыв</span>';
            addBtn.disabled = false;
            addBtn.onclick = () => this.openReviewModal();
        }
    }

    setupEventListeners() {
        // Обработчик для кнопки "Оставить отзыв"
        document.addEventListener('click', (e) => {
            if (e.target.closest('#addReviewBtn') || 
                e.target.closest('#addFirstReview') ||
                e.target.closest('[data-action="add-review"]')) {
                e.preventDefault();
                this.openReviewModal();
            }
        });

        // Звезды рейтинга
        document.addEventListener('click', (e) => {
            if (e.target.closest('.star')) {
                const star = e.target.closest('.star');
                const rating = parseInt(star.dataset.rating);
                this.setRating(rating);
            }
        });

        // Счетчик символов
        const commentTextarea = document.getElementById('reviewComment');
        if (commentTextarea) {
            commentTextarea.addEventListener('input', (e) => {
                this.updateCharCount();
                this.validateForm();
            });
        }

        // Кнопки модального окна
        document.addEventListener('click', (e) => {
            if (e.target.closest('#closeReviewModal') || 
                e.target.closest('#cancelReview') ||
                e.target.closest('.review-modal__overlay')) {
                this.closeReviewModal();
            }
            
            if (e.target.closest('#submitReview')) {
                e.preventDefault();
                this.submitReview();
            }
        });

        // Закрытие по ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('reviewModal')?.style.display !== 'none') {
                this.closeReviewModal();
            }
        });
    }

    openReviewModal() {
        if (!this.currentUser) {
            this.showMessage('Войдите в систему, чтобы оставить отзыв', 'error');
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
            return;
        }

        const modal = document.getElementById('reviewModal');
        if (!modal) {
            console.error('❌ Модальное окно не найдено');
            return;
        }

        // Сбрасываем форму
        this.selectedRating = 0;
        if (document.getElementById('reviewComment')) {
            document.getElementById('reviewComment').value = '';
        }
        document.querySelectorAll('.star').forEach(star => star.classList.remove('active'));
        if (document.getElementById('ratingValue')) {
            document.getElementById('ratingValue').textContent = '0 из 5';
        }
        if (document.getElementById('charCount')) {
            document.getElementById('charCount').textContent = '0';
        }
        if (document.getElementById('submitReview')) {
            document.getElementById('submitReview').disabled = true;
        }

        // Показываем модальное окно
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    closeReviewModal() {
        const modal = document.getElementById('reviewModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    setRating(rating) {
        this.selectedRating = rating;
        
        // Обновляем звезды
        document.querySelectorAll('.star').forEach((star, index) => {
            star.classList.toggle('active', index < rating);
        });
        
        // Обновляем текст
        if (document.getElementById('ratingValue')) {
            document.getElementById('ratingValue').textContent = `${rating} из 5`;
        }
        
        // Валидируем форму
        this.validateForm();
    }

    updateCharCount() {
        const textarea = document.getElementById('reviewComment');
        const charCount = document.getElementById('charCount');
        if (textarea && charCount) {
            const count = textarea.value.length;
            charCount.textContent = count;
            
            // Меняем цвет при приближении к лимиту
            charCount.style.color = count > 900 ? '#e74c3c' : count > 700 ? '#e67e22' : '#666';
        }
    }

    validateForm() {
        const submitBtn = document.getElementById('submitReview');
        if (submitBtn) {
            const comment = document.getElementById('reviewComment') ? document.getElementById('reviewComment').value.trim() : '';
            submitBtn.disabled = !(this.selectedRating > 0 && comment.length >= 10 && comment.length <= 1000);
        }
    }

    async submitReview() {
        if (this.isSubmitting) return;
        
        const productId = this.getCurrentProductId();
        const commentElement = document.getElementById('reviewComment');
        const comment = commentElement ? commentElement.value.trim() : '';
        
        if (!productId) {
            this.showMessage('Не удалось определить товар', 'error');
            return;
        }
        
        if (!this.currentUser) {
            this.showMessage('Войдите в систему', 'error');
            return;
        }
        
        if (!this.selectedRating || !comment) {
            this.showMessage('Заполните все поля', 'error');
            return;
        }

        this.isSubmitting = true;
        const submitBtn = document.getElementById('submitReview');
        const originalText = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
            submitBtn.innerHTML = '<span>Отправка...</span><span class="btn-icon">⏳</span>';
            submitBtn.disabled = true;
        }

        try {
            // Получаем имя пользователя
            const userName = this.currentUser.name || 
                           this.currentUser.username || 
                           'Анонимный пользователь';
            
            // Структура данных для PocketBase
            const reviewData = {
                product: productId, // ID продукта (строка)
                author_name: userName,
                rating: this.selectedRating,
                text: comment,
                approved: false // На модерации
            };

            const collectionName = this.getReviewsCollectionName();
            console.log('📤 Отправка отзыва:', reviewData);
            console.log('📋 Коллекция:', collectionName);
            
            // Отправляем в правильную коллекцию
            const record = await this.pb.collection(collectionName)
                .create(reviewData);
            
            console.log('✅ Отзыв отправлен:', record);
            
            // Закрываем модальное окно
            this.closeReviewModal();
            
            // Показываем уведомление
            this.showMessage('Отзыв отправлен на модерацию', 'success');
            
            // Добавляем отзыв в список (со статусом ожидания)
            this.addReviewToList(record);
            
        } catch (error) {
            console.error('❌ Ошибка отправки отзыва:', error);
            console.error('Детали ошибки:', error.data);
            
            let errorMessage = 'Ошибка при отправке отзыва';
            
            if (error.status === 404) {
                errorMessage = 'Таблица для отзывов не найдена. Сообщите администратору.';
            } else if (error.data?.data) {
                // Показываем первую ошибку из PocketBase
                const firstError = Object.values(error.data.data)[0];
                errorMessage = firstError?.message || 'Проверьте введенные данные';
            }
            
            this.showMessage(errorMessage, 'error');
        } finally {
            this.isSubmitting = false;
            if (submitBtn) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }
    }

    addReviewToList(review) {
        const reviewsList = document.getElementById('reviewsList');
        const noReviews = document.querySelector('.no-reviews');
        
        if (noReviews) {
            noReviews.remove();
        }
        
        if (reviewsList) {
            const reviewHTML = this.createReviewHTML(review);
            reviewsList.insertAdjacentHTML('afterbegin', reviewHTML);
        }
        
        // Обновляем статистику
        this.loadProductReviews();
    }

    getUserInitials(name) {
        if (!name) return '?';
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    showMessage(message, type = 'info') {
        // Используем существующую систему уведомлений или создаем свою
        if (window.authManager && window.authManager.showNotification) {
            window.authManager.showNotification(message, type);
        } else {
            alert(message);
        }
    }
}

// Глобальная инициализация
let reviewSystem = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 Инициализация системы отзывов...');
    
    // Ждем немного, чтобы другие скрипты (auth-state.js) успели загрузиться
    setTimeout(() => {
        reviewSystem = new ReviewSystem();
        
        // Экспортируем для глобального использования
        window.reviewSystem = reviewSystem;
        
        // Также проверяем, есть ли кнопка "отзывы" на вкладке и инициализируем
        const reviewTabBtn = document.querySelector('[data-tab="reviews"]');
        if (reviewTabBtn) {
            reviewTabBtn.addEventListener('click', () => {
                // Загружаем отзывы при клике на вкладку
                if (reviewSystem) {
                    reviewSystem.loadProductReviews();
                }
            });
        }
    }, 500);
});