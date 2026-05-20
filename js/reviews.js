// js/reviews.js - ПЕРЕПИСАННАЯ ВЕРСИЯ (система отзывов)

class ReviewSystem {
    constructor() {
        this.currentUser = null;
        this.selectedRating = 0;
        this.isLaminate = window.location.href.includes('laminate-product.html');
        this.currentProductId = null;
        
        this.init();
    }

    async init() {
        console.log('💬 Инициализация системы отзывов...');
        
        // Ждем apiClient и authManager
        if (!window.apiClient || !window.authManager) {
            setTimeout(() => this.init(), 500);
            return;
        }
        
        this.currentUser = window.authManager.currentUser;
        this.currentProductId = this.getCurrentProductId();
        
        this.setupEventListeners();
        await this.loadProductReviews();
    }

    getCurrentProductId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id') || window.currentProductId;
    }

    async loadProductReviews() {
        const productId = this.currentProductId;
        if (!productId) {
            console.log('⚠️ Нет ID товара для загрузки отзывов');
            return;
        }

        try {
            const reviews = await window.apiClient.getReviews(productId, this.isLaminate);
            console.log(`✅ Загружено ${reviews.length} отзывов`);
            this.displayReviews(reviews);
            
        } catch (error) {
            console.error('❌ Ошибка загрузки отзывов:', error);
            this.displayReviews([]);
        }
    }

    displayReviews(reviews) {
        const container = document.getElementById('reviewsList') || document.querySelector('.reviews-list');
        
        if (!container) {
            console.log('ℹ️ Контейнер для отзывов не найден');
            this.createReviewsContainer();
            return this.displayReviews(reviews);
        }

        // Определяем может ли пользователь оставить отзыв
        let canReview = false;
        let statusText = '🔒 Отзыв только для купивших товар';
        
        if (this.currentUser) {
            const hasReviewed = reviews.some(r => 
                r.author_email === this.currentUser.email && r.approved === true
            );
            
            if (hasReviewed) {
                statusText = '✓ Вы уже оставили отзыв';
            } else {
                canReview = true;
                statusText = '✍️ Оставить отзыв';
            }
        } else {
            statusText = 'Войдите, чтобы оставить отзыв';
        }

        if (reviews.length === 0) {
            container.innerHTML = `
                <div class="no-reviews">
                    <div class="no-reviews__icon">💬</div>
                    <div class="no-reviews__text">Пока нет отзывов. Будьте первым!</div>
                    ${canReview ? `<button class="btn btn--primary no-reviews__btn" id="addReviewBtn">Написать отзыв</button>` : 
                                 `<button class="btn" disabled style="background:#f0f0f0; color:#999;">${statusText}</button>`}
                </div>
            `;
        } else {
            const approvedReviews = reviews.filter(r => r.approved);
            const pendingReviews = reviews.filter(r => !r.approved && 
                this.currentUser && r.author_email === this.currentUser.email);
            
            this.updateReviewsStats(approvedReviews);
            
            let html = `
                <div class="reviews-actions" style="margin-bottom: 30px;">
                    ${canReview ? 
                        `<button class="btn btn--primary" id="addReviewBtn" style="background: #27ae60;">✍️ ${statusText}</button>` :
                        `<button class="btn" disabled style="background:#f0f0f0; color:#999;">${statusText}</button>`
                    }
                </div>
            `;
            
            html += approvedReviews.map(review => this.createReviewHTML(review)).join('');
            html += pendingReviews.map(review => this.createReviewHTML(review)).join('');
            
            container.innerHTML = html;
        }
        
        this.updateReviewButton();
    }

    createReviewHTML(review) {
        const date = new Date(review.created_at).toLocaleDateString('ru-RU', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        
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
                            <div class="review-item__name">${this.escapeHtml(authorName)}</div>
                            <div class="review-item__date">${date}</div>
                        </div>
                    </div>
                    <div class="review-item__rating" title="${review.rating} из 5">
                        ${ratingStars}
                    </div>
                </div>
                <div class="review-item__content">${this.escapeHtml(review.text)}</div>
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
                <div class="reviews-list" id="reviewsList">
                    <div class="no-reviews">
                        <div class="no-reviews__icon">💬</div>
                        <div class="no-reviews__text">Загрузка отзывов...</div>
                    </div>
                </div>
            </div>
        `;

        productContainer.insertAdjacentHTML('beforeend', reviewsHTML);
        this.updateReviewButton();
    }

    updateReviewButton() {
        const addBtn = document.getElementById('addReviewBtn');
        if (!addBtn) return;

        if (!this.currentUser) {
            addBtn.innerHTML = '🔒 Войдите, чтобы оставить отзыв';
            addBtn.disabled = true;
            addBtn.onclick = () => {
                window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
            };
        } else {
            addBtn.innerHTML = '✍️ Оставить отзыв';
            addBtn.disabled = false;
            addBtn.onclick = () => this.openReviewModal();
        }
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('#addReviewBtn')) {
                e.preventDefault();
                this.openReviewModal();
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.closest('.star')) {
                const star = e.target.closest('.star');
                const rating = parseInt(star.dataset.rating);
                this.setRating(rating);
            }
        });

        const commentTextarea = document.getElementById('reviewComment');
        if (commentTextarea) {
            commentTextarea.addEventListener('input', () => {
                this.updateCharCount();
                this.validateForm();
            });
        }

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

        this.selectedRating = 0;
        const commentField = document.getElementById('reviewComment');
        if (commentField) commentField.value = '';
        
        document.querySelectorAll('.star').forEach(star => star.classList.remove('active'));
        const ratingValue = document.getElementById('ratingValue');
        if (ratingValue) ratingValue.textContent = '0 из 5';
        
        const charCount = document.getElementById('charCount');
        if (charCount) charCount.textContent = '0';
        
        const submitBtn = document.getElementById('submitReview');
        if (submitBtn) submitBtn.disabled = true;

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
        
        document.querySelectorAll('.star').forEach((star, index) => {
            star.classList.toggle('active', index < rating);
        });
        
        const ratingValue = document.getElementById('ratingValue');
        if (ratingValue) ratingValue.textContent = `${rating} из 5`;
        
        this.validateForm();
    }

    updateCharCount() {
        const textarea = document.getElementById('reviewComment');
        const charCount = document.getElementById('charCount');
        if (textarea && charCount) {
            const count = textarea.value.length;
            charCount.textContent = count;
            charCount.style.color = count > 900 ? '#e74c3c' : count > 700 ? '#e67e22' : '#666';
        }
    }

    validateForm() {
        const submitBtn = document.getElementById('submitReview');
        if (submitBtn) {
            const comment = document.getElementById('reviewComment')?.value.trim() || '';
            submitBtn.disabled = !(this.selectedRating > 0 && comment.length >= 10 && comment.length <= 1000);
        }
    }

    async submitReview() {
        const productId = this.currentProductId;
        const comment = document.getElementById('reviewComment')?.value.trim() || '';
        
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

        const submitBtn = document.getElementById('submitReview');
        const originalText = submitBtn?.innerHTML || '';
        if (submitBtn) {
            submitBtn.innerHTML = '⏳ Отправка...';
            submitBtn.disabled = true;
        }

        try {
            await window.apiClient.createReview({
                product_id: productId,
                product_name: document.querySelector('.product-title')?.textContent || 'Товар',
                rating: this.selectedRating,
                text: comment,
                isLaminate: this.isLaminate
            });
            
            this.closeReviewModal();
            this.showMessage('✅ Отзыв отправлен на модерацию!', 'success');
            
            setTimeout(() => this.loadProductReviews(), 2000);
            
        } catch (error) {
            console.error('❌ Ошибка отправки отзыва:', error);
            this.showMessage('❌ Ошибка при отправке отзыва', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }
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
        if (window.authManager?.showNotification) {
            window.authManager.showNotification(message, type);
        } else {
            alert(message);
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Глобальная инициализация
let reviewSystem = null;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        reviewSystem = new ReviewSystem();
        window.reviewSystem = reviewSystem;
    }, 800);
});