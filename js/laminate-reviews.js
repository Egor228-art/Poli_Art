// ============ ОТЗЫВЫ ДЛЯ ЛАМИНАТА ============
// Добавьте этот код в laminate-product.js или сохраните как laminate-reviews.js

// Убедитесь, что pb доступен глобально
const pb = window.pb || new PocketBase('http://127.0.0.1:8090');

async function loadLaminateReviews(productId) {
    console.log('🔥 ЗАГРУЗКА ОТЗЫВОВ ЛАМИНАТА:', productId);
    
    // ИСПРАВЛЕНИЕ 1: ОЧИЩАЕМ ВЕСЬ КЭШ POCKETBASE
    if (pb) {
        pb.cancelAllRequests(); // Отменяем все текущие запросы
        pb.autoCancellation(false); // Отключаем автоотмену
    }
    
    // ИСПРАВЛЕНИЕ 2: ОЧИЩАЕМ ЛОКАЛЬНОЕ ХРАНИЛИЩЕ
    try {
        // Удаляем все возможные ключи кэша для этого товара
        localStorage.removeItem(`pb_cache_reviews_laminate_${productId}`);
        sessionStorage.removeItem(`pb_cache_reviews_laminate_${productId}`);
        
        // Также очищаем общий кэш
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('reviews_laminate') || key.includes('pb_cache'))) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        console.log('🧹 Кэш очищен');
    } catch (e) {
        console.log('Ошибка очистки кэша:', e);
    }
    
    try {
        // ИСПРАВЛЕНИЕ 3: ЗАГРУЖАЕМ С ПРИНУДИТЕЛЬНЫМ ОБНОВЛЕНИЕМ
        let reviews = [];
        try {
            const response = await pb.collection('reviews_laminate').getList(1, 100, {
                filter: `product = "${productId}"`,
                sort: '-created',
                requestKey: null,  // Отключаем кэширование запроса
                $autoCancel: false, // Отключаем автоотмену
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            reviews = response.items || [];
            console.log(`✅ Загружено ${reviews.length} отзывов для ламината (без кэша)`);
            
            // Логируем все загруженные отзывы для отладки
            if (reviews.length > 0) {
                console.log('📝 Загруженные отзывы:', reviews.map(r => ({
                    id: r.id,
                    text: r.text.substring(0, 30) + '...',
                    author: r.author_name,
                    created: r.created
                })));
            }
            
        } catch (e) {
            console.log('❌ Ошибка загрузки из reviews_laminate:', e);
        }

        // Определяем состояние кнопки отзыва
        let canReview = false;
        let reviewStatus = 'not_available';
        let statusText = '🔒 Отзыв только для купивших товар';

        if (window.authManager && window.authManager.currentUser) {
            const userId = window.authManager.currentUser.id;
            const userName = window.authManager.currentUser.name;

            console.log('Проверка для пользователя:', userName, 'ID:', userId);

            // Проверяем - оставлял ли уже отзыв? (ТОЛЬКО ПО ID В БД)
            const hasReviewed = reviews.some(review => 
                review.author_email === window.authManager.currentUser.email
            );

            if (hasReviewed) {
                reviewStatus = 'already_reviewed';
                statusText = '✓ Вы уже оставили отзыв';
                console.log('Пользователь уже оставлял отзыв');
            } else {
                // Проверяем - покупал ли товар?
                const hasPurchased = await checkUserPurchasedLaminate(productId, userId);

                if (hasPurchased) {
                    reviewStatus = 'can_review';
                    statusText = '✍️ Оставить отзыв';
                    canReview = true;
                    console.log('✅ Пользователь МОЖЕТ оставить отзыв');
                } else {
                    reviewStatus = 'not_available';
                    statusText = 'Отзыв только для купивших товар';
                    console.log('❌ Пользователь НЕ покупал этот товар');
                }
            }
        } else {
            statusText = 'Войдите, чтобы оставить отзыв';
            console.log('Пользователь не авторизован');
        }

        // Отображаем отзывы
        displayLaminateReviews(reviews, reviewStatus, statusText, canReview, productId);

    } catch (error) {
        console.error('❌ Ошибка загрузки отзывов для ламината:', error);
    }
}

async function checkUserPurchasedLaminate(productId, userId) {
    console.log('🔍 ПРОВЕРКА ПОКУПКИ ЛАМИНАТА:', productId, 'Пользователь:', userId);

    try {
        const response = await pb.collection('orders').getList(1, 100, {
            filter: `user = "${userId}"`,
            sort: '-created',
            requestKey: null
        });

        if (!response.items || response.items.length === 0) {
            console.log('❌ У пользователя нет заказов');
            return false;
        }

        const PAID_STATUSES = ['оплачено', 'доставлено', 'delivered', 'оплачен', 'выполнен'];

        for (const order of response.items) {
            const status = (order.status || '').toLowerCase();
            const isPaid = PAID_STATUSES.some(s => status.includes(s.toLowerCase()));
            
            if (!isPaid) continue;
            
            console.log(`\n✅ Оплаченный заказ #${order.order_number || order.id}`);
            
            // Проверяем поле product
            if (order.product) {
                const productField = order.product.toString().trim();
                if (productField === productId.toString()) {
                    console.log('🎉 ЛАМИНАТ НАЙДЕН в поле product!');
                    return true;
                }
            }

            // Проверяем products
            if (order.products) {
                let products = [];
                if (typeof order.products === 'string') {
                    try { products = JSON.parse(order.products) || []; } catch (e) {}
                } else if (Array.isArray(order.products)) {
                    products = order.products;
                }
                
                const found = products.find(p => {
                    const itemId = p.id || p.product_id || p.product;
                    return itemId && itemId.toString() === productId.toString();
                });
                
                if (found) {
                    console.log('🎉 ЛАМИНАТ НАЙДЕН в поле products!');
                    return true;
                }
            }
        }

        console.log('❌ Ламинат НЕ НАЙДЕН в оплаченных заказах');
        return false;

    } catch (error) {
        console.error('❌ Ошибка проверки заказов:', error);
        return false;
    }
}

function displayLaminateReviews(reviews, reviewStatus, statusText, canReview, productId) {
    console.log('🖥️ ОТОБРАЖЕНИЕ ОТЗЫВОВ ЛАМИНАТА');

    const reviewsList = document.querySelector('#reviews .reviews-list');
    if (!reviewsList) {
        console.error('❌ Контейнер #reviews .reviews-list не найден!');
        
        // Пробуем найти другой контейнер
        const altContainer = document.querySelector('.reviews-list');
        if (altContainer) {
            console.log('✅ Найден альтернативный контейнер .reviews-list');
        } else {
            return;
        }
    }

    const container = reviewsList || document.querySelector('.reviews-list');
    if (!container) return;

    const productName = document.querySelector('.product-title')?.textContent || 'Ламинат';
    let html = '';

    // КНОПКА ОТЗЫВА
    html += `
        <div class="reviews-header">
            <h2 class="reviews-title">Отзывы покупателей</h2>
            <div class="reviews-stats">
                <div class="reviews-average">${calculateAverageRating(reviews)} ★</div>
                <div class="reviews-count">${reviews.length} ${getDeclension(reviews.length, ['отзыв', 'отзыва', 'отзывов'])}</div>
            </div>
        </div>
        
        <div class="reviews-actions" style="margin-bottom: 30px;">
    `;

    if (canReview) {
        html += `
            <button class="btn btn--primary" id="addLaminateReviewBtn" 
                    onclick="openLaminateReviewModal('${productId}')"
                    style="background: linear-gradient(135deg, #27ae60, #20c997); border: none; padding: 12px 25px; border-radius: 8px; color: white; font-weight: 500; cursor: pointer;">
                ✍️ Оставить отзыв
            </button>
            <span style="color: #27ae60; margin-left: 15px;">✓ Вы купили этот товар</span>
        `;
    } else {
        html += `
            <button class="btn" disabled 
                    style="background: #f0f0f0; color: #999; border: 1px solid #ddd; padding: 12px 25px; border-radius: 8px; cursor: not-allowed;">
                🔒 ${statusText}
            </button>
        `;
    }

    html += `</div>`;

    // ОТЗЫВЫ
    const approvedReviews = reviews.filter(r => r.approved === true);

    if (approvedReviews.length === 0) {
        html += `
            <div class="no-reviews" style="text-align: center; padding: 40px;">
                <div style="font-size: 48px; margin-bottom: 15px;">💬</div>
                <div style="color: #666;">Пока нет отзывов. Будьте первым!</div>
            </div>
        `;
    } else {
        approvedReviews.forEach(review => {
            const date = new Date(review.created).toLocaleDateString('ru-RU');
            const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

            html += `
                <div style="background: white; padding: 25px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #eee;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                        <div>
                            <strong>${review.author_name || 'Пользователь'}</strong>
                            <span style="color: #27ae60; margin-left: 10px;">✓ покупатель</span>
                        </div>
                        <span style="color: #999;">${date}</span>
                    </div>
                    <div style="color: #ffc107; margin-bottom: 15px; font-size: 20px;">${stars}</div>
                    <p style="color: #666;">${review.text}</p>
                </div>
            `;
        });
    }

    container.innerHTML = html;
    
    // Обновляем счетчик на вкладке
    const reviewsTabBtn = document.querySelector('[data-tab="reviews"]');
    if (reviewsTabBtn && approvedReviews.length > 0) {
        reviewsTabBtn.textContent = `Отзывы (${approvedReviews.length})`;
    }
}

function calculateAverageRating(reviews) {
    if (!reviews || reviews.length === 0) return '0.0';
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return (sum / reviews.length).toFixed(1);
}

function getDeclension(count, forms) {
    const cases = [2, 0, 1, 1, 1, 2];
    return forms[(count % 100 > 4 && count % 100 < 20) ? 2 : cases[Math.min(count % 10, 5)]];
}

// ============ МОДАЛЬНОЕ ОКНО ОТЗЫВА ДЛЯ ЛАМИНАТА ============

window.openLaminateReviewModal = function(productId) {
    console.log('📝 Открытие окна отзыва для ламината:', productId);
    
    if (!window.authManager?.currentUser) {
        alert('Авторизуйтесь, чтобы оставить отзыв');
        return;
    }
    
    const productName = document.querySelector('.product-title')?.textContent || 'Ламинат';
    
    const modalHTML = `
        <div id="laminateReviewModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 10000; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; border-radius: 16px; padding: 30px; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="margin: 0;">Оставить отзыв</h2>
                    <button onclick="closeLaminateReviewModal()" style="font-size: 28px; background: none; border: none; cursor: pointer;">&times;</button>
                </div>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <strong>${productName}</strong>
                </div>
                
                <form id="laminateReviewForm">
                    <input type="hidden" id="laminateReviewProductId" value="${productId}">
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 10px; font-weight: 600;">Оценка</label>
                        <div style="display: flex; gap: 10px;" id="laminateRatingStars">
                            ${[1,2,3,4,5].map(i => 
                                `<span onclick="setLaminateRating(${i})" style="font-size: 30px; cursor: pointer; color: #f1c40f;">☆</span>`
                            ).join('')}
                        </div>
                        <input type="hidden" id="laminateReviewRating" value="5">
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 10px; font-weight: 600;">Отзыв *</label>
                        <textarea id="laminateReviewText" rows="4" required
                                style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px;"
                                placeholder="Поделитесь впечатлениями..."></textarea>
                    </div>
                    
                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button type="button" onclick="closeLaminateReviewModal()" 
                                style="padding: 12px 24px; background: white; border: 2px solid #ddd; border-radius: 8px; cursor: pointer;">
                            Отмена
                        </button>
                        <button type="submit" 
                                style="padding: 12px 24px; background: #27ae60; color: white; border: none; border-radius: 8px; cursor: pointer;">
                            Отправить
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
    
    document.getElementById('laminateReviewForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitLaminateReview();
    });
    
    setLaminateRating(5);
};

window.setLaminateRating = function(rating) {
    const stars = document.querySelectorAll('#laminateRatingStars span');
    stars.forEach((star, index) => {
        star.textContent = index < rating ? '★' : '☆';
        star.style.color = '#f1c40f';
    });
    document.getElementById('laminateReviewRating').value = rating;
};

window.closeLaminateReviewModal = function() {
    const modal = document.getElementById('laminateReviewModal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
};

function initLaminateCharCounter() {
    const textarea = document.getElementById('laminateReviewText');
    const charCount = document.getElementById('laminateCharCount');
    
    if (!textarea || !charCount) return;
    
    textarea.addEventListener('input', () => {
        let length = textarea.value.length;
        if (length > 1000) {
            textarea.value = textarea.value.substring(0, 1000);
            length = 1000;
        }
        charCount.textContent = length;
        
        if (length > 900) {
            charCount.style.color = '#e74c3c';
        } else if (length > 700) {
            charCount.style.color = '#f39c12';
        } else {
            charCount.style.color = '#27ae60';
        }
    });
}

// ============ ИСПРАВЛЕННАЯ ФУНКЦИЯ ОТПРАВКИ ОТЗЫВА ============
async function submitLaminateReview() {
    const productId = document.getElementById('laminateReviewProductId')?.value;
    const rating = parseInt(document.getElementById('laminateReviewRating')?.value || '5');
    const text = document.getElementById('laminateReviewText')?.value.trim();
    
    if (!text) {
        alert('Напишите отзыв');
        return;
    }
    
    try {
        const reviewData = {
            product: productId,
            product_name: document.querySelector('.product-title')?.textContent || 'Ламинат',
            rating: rating,
            text: text,
            author_name: window.authManager.currentUser.name || 'Пользователь',
            author_email: window.authManager.currentUser.email || '',
            approved: false
        };
        
        console.log('📤 Отправка отзыва:', reviewData);
        
        // ИСПРАВЛЕНИЕ: Отключаем кэш при отправке
        const result = await pb.collection('reviews_laminate').create(reviewData, {
            requestKey: null,
            $autoCancel: false,
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        
        console.log('✅ Отзыв создан, ID:', result.id);
        
        closeLaminateReviewModal();
        alert('✅ Отзыв отправлен!');
        
        // ИСПРАВЛЕНИЕ: Принудительно очищаем кэш и перезагружаем
        setTimeout(() => {
            // Очищаем кэш перед загрузкой
            if (pb) {
                pb.cancelAllRequests();
            }
            loadLaminateReviews(productId);
        }, 500);
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
        alert('❌ Ошибка отправки отзыва: ' + (error.message || 'Попробуйте позже'));
    }
}

// ============ УВЕДОМЛЕНИЯ ============
function showLaminateNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `laminate-notification laminate-notification--${type}`;
    notification.innerHTML = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? 'linear-gradient(135deg, #27ae60, #20c997)' : 'linear-gradient(135deg, #e74c3c, #c0392b)'};
        color: white;
        border-radius: 12px;
        z-index: 10001;
        font-weight: 600;
        font-size: 14px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
        max-width: 350px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 4000);
}

// ============ ИНИЦИАЛИЗАЦИЯ ============
function initLaminateReviews() {
    const productId = window.currentProductId;
    if (productId) {
        console.log('🚀 ЗАПУСК ОТЗЫВОВ ЛАМИНАТА, ID:', productId);
        
        // Принудительно очищаем кэш перед первой загрузкой
        if (pb) {
            pb.cancelAllRequests();
        }
        
        setTimeout(() => {
            loadLaminateReviews(productId);
        }, 500);
    }
}

// Запускаем после загрузки товара
setTimeout(initLaminateReviews, 500);

// Запускаем при загрузке DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLaminateReviews);
} else {
    initLaminateReviews();
}