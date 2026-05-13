// product-core.js - Единая система для страниц товаров
// Подключать на всех страницах товаров (product.html и laminate-product.html)

let pb = null;
let currentProduct = null;
let currentProductPrice = 0;
let currentProductType = null; // 'door' или 'laminate'

// ============ ИНИЦИАЛИЗАЦИЯ ============

function initProductCore() {
    console.log('🎯 Инициализация ProductCore...');
    
    // Инициализируем PocketBase
    if (typeof PocketBase !== 'undefined') {
        pb = new PocketBase('http://127.0.0.1:8090');
        pb.autoCancellation(false);
        window.pb = pb;
    } else {
        console.error('❌ PocketBase не загружен');
        return;
    }
    
    // Получаем ID товара из URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (!productId) {
        showError('Товар не найден');
        return;
    }
    
    window.currentProductId = productId;
    
    // Определяем тип страницы
    currentProductType = window.location.href.includes('laminate-product.html') ? 'laminate' : 'door';
    console.log(`📄 Тип страницы: ${currentProductType}`);
    
    // Загружаем товар
    loadProduct(productId);
}

// ============ ЗАГРУЗКА ТОВАРА ============

async function loadProduct(productId) {
    console.log(`📦 Загрузка товара ${productId}...`);
    
    try {
        let collectionName;
        if (currentProductType === 'laminate') {
            collectionName = 'laminate';
        } else {
            collectionName = 'doors';
        }
        
        currentProduct = await pb.collection(collectionName).getOne(productId);
        currentProductPrice = parsePrice(currentProduct.prise);
        
        console.log('✅ Товар загружен:', currentProduct.name);
        
        // Вызываем колбэк для рендеринга страницы
        if (window.renderProductPage) {
            window.renderProductPage(currentProduct, currentProductType);
        }
        
        // Загружаем отзывы
        loadReviews(productId, currentProductType);
        
        // Загружаем похожие товары
        loadSimilarProducts(currentProduct, collectionName);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки товара:', error);
        showError('Не удалось загрузить товар');
    }
}

// ============ ПАРСИНГ ЦЕНЫ ============

function parsePrice(priceStr) {
    if (!priceStr) return 0;
    const cleanStr = priceStr.toString().replace(/[^\d]/g, '');
    const price = parseInt(cleanStr);
    return isNaN(price) ? 0 : price;
}

function formatPrice(price) {
    return price.toLocaleString('ru-RU') + ' ₽';
}

// ============ ПОХОЖИЕ ТОВАРЫ ============

async function loadSimilarProducts(currentProduct, collectionName) {
    console.log('🔄 Загрузка похожих товаров...');
    
    try {
        const response = await pb.collection(collectionName).getList(1, 200);
        const otherProducts = response.items.filter(p => p.id !== currentProduct.id);
        
        if (otherProducts.length === 0) {
            hideSimilarSection();
            return;
        }
        
        // Перемешиваем и берем 4 товара
        const similar = [...otherProducts]
            .sort(() => Math.random() - 0.5)
            .slice(0, 4);
        
        renderSimilarProducts(similar, collectionName);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки похожих:', error);
        hideSimilarSection();
    }
}

function renderSimilarProducts(products, collectionName) {
    const grid = document.getElementById('similarProductsGrid');
    const loading = document.getElementById('similarLoading');
    const noResults = document.getElementById('noSimilarProducts');
    
    if (!grid) return;
    
    if (loading) loading.style.display = 'none';
    
    if (!products || products.length === 0) {
        if (noResults) noResults.style.display = 'block';
        return;
    }
    
    grid.innerHTML = '';
    
    products.forEach(product => {
        const isLaminate = collectionName === 'laminate';
        const productPage = isLaminate ? 'laminate-product.html' : 'product.html';
        
        let imageUrl = '';
        if (product.picture && product.picture[0]) {
            imageUrl = `http://127.0.0.1:8090/api/files/${collectionName}/${product.id}/${product.picture[0]}`;
        }
        
        const price = parsePrice(product.prise);
        const priceDisplay = price > 0 ? formatPrice(price) : 'Цена по запросу';
        
        const card = document.createElement('div');
        card.className = 'product-card similar-card';
        card.innerHTML = `
            <div class="product-image-container">
                <img src="${imageUrl}" alt="${escapeHtml(product.name)}" 
                     class="product-image"
                     onclick="window.location.href='${productPage}?id=${product.id}'">
            </div>
            <div class="product-info">
                <h3 class="product-title">${escapeHtml(product.name || 'Без названия')}</h3>
                <div class="product-price">${priceDisplay}</div>
                <div class="product-actions">
                    <a href="${productPage}?id=${product.id}" class="btn-details">Подробнее</a>
                </div>
            </div>
        `;
        
        grid.appendChild(card);
    });
    
    if (noResults) noResults.style.display = 'none';
}

function hideSimilarSection() {
    const section = document.querySelector('.recommended-products');
    if (section) section.style.display = 'none';
}

// ============ ОТЗЫВЫ - ЕДИНАЯ СИСТЕМА ============

async function loadReviews(productId, productType) {
    console.log(`📝 Загрузка отзывов для ${productType}:`, productId);
    
    const collection = productType === 'laminate' ? 'reviews_laminate' : 'reviews';
    
    try {
        // Загружаем отзывы
        const response = await pb.collection(collection).getList(1, 100, {
            filter: `product = "${productId}"`,
            sort: '-created',
            requestKey: null
        });
        
        const reviews = response.items || [];
        console.log(`✅ Загружено ${reviews.length} отзывов`);
        
        // Проверяем, может ли пользователь оставить отзыв
        let canReview = false;
        let reviewStatus = 'not_available';
        let statusText = '🔒 Отзыв только для купивших товар';
        
        if (window.authManager?.currentUser) {
            const userEmail = window.authManager.currentUser.email;
            
            // Проверяем, оставлял ли уже отзыв
            const hasReviewed = reviews.some(r => r.author_email === userEmail);
            
            if (hasReviewed) {
                reviewStatus = 'already_reviewed';
                statusText = '✓ Вы уже оставили отзыв';
            } else {
                // Проверяем, покупал ли товар
                const hasPurchased = await checkUserPurchased(productId);
                
                if (hasPurchased) {
                    reviewStatus = 'can_review';
                    statusText = '✍️ Оставить отзыв';
                    canReview = true;
                }
            }
        } else {
            statusText = '🔑 Войдите, чтобы оставить отзыв';
        }
        
        // Отображаем отзывы
        displayReviews(reviews, canReview, statusText, productId, productType);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки отзывов:', error);
    }
}

async function checkUserPurchased(productId) {
    if (!window.authManager?.currentUser) return false;
    
    try {
        const userId = window.authManager.currentUser.id;
        const response = await pb.collection('orders').getList(1, 100, {
            filter: `user = "${userId}"`,
            sort: '-created',
            requestKey: null
        });
        
        const PAID_STATUSES = ['оплачено', 'доставлено', 'delivered', 'оплачен', 'получен', 'paid', 'completed'];
        
        for (const order of response.items || []) {
            const status = (order.status || '').toLowerCase();
            const isPaid = PAID_STATUSES.some(s => status.includes(s.toLowerCase()));
            
            if (!isPaid) continue;
            
            // Проверяем поле product
            if (order.product?.toString() === productId) {
                console.log('🎉 Товар найден в заказе!');
                return true;
            }
            
            // Проверяем поле products
            if (order.products) {
                let products = [];
                if (typeof order.products === 'string') {
                    try { products = JSON.parse(order.products) || []; } catch (e) {}
                } else if (Array.isArray(order.products)) {
                    products = order.products;
                }
                
                const found = products.find(p => {
                    const pid = p.id || p.product_id || p.item_id || p.product;
                    return pid?.toString() === productId;
                });
                
                if (found) return true;
            }
        }
        
        return false;
        
    } catch (error) {
        console.error('❌ Ошибка проверки покупки:', error);
        return false;
    }
}

function displayReviews(reviews, canReview, statusText, productId, productType) {
    const container = document.querySelector('#reviews .reviews-list');
    if (!container) {
        console.error('❌ Контейнер отзывов не найден');
        return;
    }
    
    const approvedReviews = reviews.filter(r => r.approved === true);
    const productName = document.querySelector('.product-title')?.textContent || 'Товар';
    
    let html = `
        <div class="reviews-header">
            <h2 class="reviews-title">Отзывы покупателей</h2>
            <div class="reviews-stats">
                <div class="reviews-average">${calculateAvgRating(approvedReviews)} ★</div>
                <div class="reviews-count">${approvedReviews.length} ${declOfNum(approvedReviews.length, ['отзыв', 'отзыва', 'отзывов'])}</div>
            </div>
        </div>
        
        <div class="reviews-actions" style="margin-bottom: 30px;">
    `;
    
    if (canReview) {
        html += `<button class="btn btn--primary" onclick="openReviewModal('${productId}', '${productType}')" 
                style="background: #27ae60; padding: 12px 25px; border: none; border-radius: 8px; color: white; cursor: pointer; font-weight: 500;">
                ✍️ Оставить отзыв
            </button>`;
    } else {
        html += `<button class="btn" disabled 
                style="background: #f0f0f0; color: #999; padding: 12px 25px; border: 1px solid #ddd; border-radius: 8px; cursor: not-allowed;">
                ${statusText}
            </button>`;
    }
    
    html += `</div>`;
    
    if (approvedReviews.length === 0) {
        html += `
            <div class="no-reviews" style="text-align: center; padding: 60px 20px; background: #f8f9fa; border-radius: 12px;">
                <div style="font-size: 48px; margin-bottom: 15px;">💬</div>
                <h4 style="margin: 0 0 10px; color: #2c3e50;">Пока нет отзывов</h4>
                <p style="margin: 0; color: #7f8c8d;">Будьте первым, кто оставит отзыв!</p>
            </div>
        `;
    } else {
        approvedReviews.forEach(review => {
            const date = new Date(review.created).toLocaleDateString('ru-RU', {
                day: 'numeric', month: 'long', year: 'numeric'
            });
            const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
            
            html += `
                <div class="review-item" style="background: white; padding: 25px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #e0e0e0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                        <div>
                            <strong style="color: #2c3e50; font-size: 16px;">${escapeHtml(review.author_name || 'Пользователь')}</strong>
                            <span style="margin-left: 10px; padding: 3px 10px; background: #e8f5e9; color: #27ae60; border-radius: 20px; font-size: 13px;">✓ покупатель</span>
                        </div>
                        <span style="color: #999; font-size: 13px;">${date}</span>
                    </div>
                    <div style="color: #ffc107; font-size: 20px; margin-bottom: 15px;">${stars}</div>
                    <p style="color: #666; line-height: 1.6; margin: 0;">${escapeHtml(review.text)}</p>
                    ${review.pros ? `<div style="margin-top: 15px; padding: 10px 15px; background: #e8f5e9; border-radius: 8px; color: #27ae60;">✅ Достоинства: ${escapeHtml(review.pros)}</div>` : ''}
                    ${review.cons ? `<div style="margin-top: 10px; padding: 10px 15px; background: #ffebee; border-radius: 8px; color: #e74c3c;">❌ Недостатки: ${escapeHtml(review.cons)}</div>` : ''}
                </div>
            `;
        });
    }
    
    container.innerHTML = html;
    
    // Обновляем счетчик на вкладке
    const tabBtn = document.querySelector('[data-tab="reviews"]');
    if (tabBtn) {
        tabBtn.innerHTML = `Отзывы ${approvedReviews.length > 0 ? `(${approvedReviews.length})` : ''}`;
    }
}

function calculateAvgRating(reviews) {
    if (!reviews.length) return '0.0';
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return (sum / reviews.length).toFixed(1);
}

function declOfNum(n, titles) {
    return titles[n % 10 === 1 && n % 100 !== 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2];
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============ МОДАЛЬНОЕ ОКНО ОТЗЫВА ============

window.openReviewModal = function(productId, productType) {
    const productName = document.querySelector('.product-title')?.textContent || 'Товар';
    
    if (!window.authManager?.currentUser) {
        alert('Пожалуйста, авторизуйтесь');
        window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
        return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'reviewModal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.6); z-index: 10000;
        display: flex; align-items: center; justify-content: center;
        backdrop-filter: blur(5px);
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 16px; padding: 30px; max-width: 550px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #2c3e50; font-size: 24px;">Оставить отзыв</h2>
                <button onclick="closeReviewModal()" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #999;">&times;</button>
            </div>
            
            <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 15px 20px; border-radius: 12px; margin-bottom: 25px; border-left: 4px solid ${productType === 'laminate' ? '#eabb66' : '#e74c3c'};">
                <strong style="color: #2c3e50; font-size: 16px;">${escapeHtml(productName)}</strong>
            </div>
            
            <form id="reviewForm">
                <input type="hidden" id="reviewProductId" value="${productId}">
                <input type="hidden" id="reviewProductType" value="${productType}">
                
                <div style="margin-bottom: 25px;">
                    <label style="display: block; margin-bottom: 12px; font-weight: 600; color: #2c3e50;">Оценка товара</label>
                    <div style="display: flex; gap: 12px;" id="ratingStars">
                        ${[1,2,3,4,5].map(i => 
                            `<span onclick="setRating(${i})" style="font-size: 36px; cursor: pointer; color: #f1c40f;">☆</span>`
                        ).join('')}
                    </div>
                    <input type="hidden" id="reviewRating" value="5">
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 10px; font-weight: 600; color: #2c3e50;">Ваш отзыв <span style="color: #e74c3c;">*</span></label>
                    <textarea id="reviewText" rows="5" required
                        style="width: 100%; padding: 15px; border: 2px solid #e0e0e0; border-radius: 12px; font-size: 15px; resize: vertical;"
                        placeholder="Поделитесь впечатлениями о товаре..."></textarea>
                    <div style="text-align: right; margin-top: 8px; font-size: 13px; color: #999;">
                        <span id="charCount">0</span> / 1000
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 10px; font-weight: 600; color: #2c3e50;">Достоинства (необязательно)</label>
                    <textarea id="reviewPros" rows="2"
                        style="width: 100%; padding: 15px; border: 2px solid #e0e0e0; border-radius: 12px; font-size: 15px; resize: vertical;"
                        placeholder="Что вам понравилось?"></textarea>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 10px; font-weight: 600; color: #2c3e50;">Недостатки (необязательно)</label>
                    <textarea id="reviewCons" rows="2"
                        style="width: 100%; padding: 15px; border: 2px solid #e0e0e0; border-radius: 12px; font-size: 15px; resize: vertical;"
                        placeholder="Что можно улучшить?"></textarea>
                </div>
                
                <div style="background: #f8f9fa; padding: 15px 20px; border-radius: 12px; margin-bottom: 25px; border: 1px solid #e0e0e0;">
                    <p style="margin: 0; color: #666; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 18px;">📝</span>
                        <span>Отзыв будет опубликован после проверки модератором</span>
                    </p>
                </div>
                
                <div style="display: flex; gap: 15px; justify-content: flex-end;">
                    <button type="button" onclick="closeReviewModal()" 
                            style="padding: 14px 30px; background: white; border: 2px solid #e0e0e0; border-radius: 12px; color: #666; cursor: pointer; font-weight: 600;">
                        Отмена
                    </button>
                    <button type="submit" 
                            style="padding: 14px 30px; background: linear-gradient(135deg, #27ae60, #20c997); color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 18px;">✍️</span>
                        <span>Отправить отзыв</span>
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Инициализация
    document.getElementById('reviewForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitReview();
    });
    
    initCharCounter();
    setRating(5);
};

window.setRating = function(rating) {
    const stars = document.querySelectorAll('#ratingStars span');
    stars.forEach((star, i) => {
        star.textContent = i < rating ? '★' : '☆';
    });
    document.getElementById('reviewRating').value = rating;
};

window.closeReviewModal = function() {
    const modal = document.getElementById('reviewModal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
};

function initCharCounter() {
    const textarea = document.getElementById('reviewText');
    const counter = document.getElementById('charCount');
    
    if (textarea && counter) {
        textarea.addEventListener('input', () => {
            let len = textarea.value.length;
            if (len > 1000) {
                textarea.value = textarea.value.slice(0, 1000);
                len = 1000;
            }
            counter.textContent = len;
            counter.style.color = len > 900 ? '#e74c3c' : len > 700 ? '#f39c12' : '#27ae60';
        });
    }
}

async function submitReview() {
    const productId = document.getElementById('reviewProductId').value;
    const productType = document.getElementById('reviewProductType').value;
    const rating = parseInt(document.getElementById('reviewRating').value);
    const text = document.getElementById('reviewText').value.trim();
    const pros = document.getElementById('reviewPros')?.value.trim() || '';
    const cons = document.getElementById('reviewCons')?.value.trim() || '';
    
    if (!text) {
        alert('Пожалуйста, напишите отзыв');
        return;
    }
    
    const collection = productType === 'laminate' ? 'reviews_laminate' : 'reviews';
    const productName = document.querySelector('.product-title')?.textContent || 'Товар';
    
    const reviewData = {
        product: productId,
        product_name: productName,
        rating: rating,
        text: text,
        author_name: window.authManager.currentUser.name,
        author_email: window.authManager.currentUser.email,
        approved: false
    };
    
    if (pros) reviewData.pros = pros;
    if (cons) reviewData.cons = cons;
    
    try {
        const submitBtn = document.querySelector('#reviewForm button[type="submit"]');
        submitBtn.innerHTML = '<span>⏳</span><span>Отправка...</span>';
        submitBtn.disabled = true;
        
        await pb.collection(collection).create(reviewData);
        
        closeReviewModal();
        showNotification('✓ Отзыв отправлен на модерацию!', 'success');
        
        setTimeout(() => {
            loadReviews(productId, productType);
        }, 2000);
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
        alert('Ошибка отправки отзыва');
    }
}

// ============ УВЕДОМЛЕНИЯ ============

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? 'linear-gradient(135deg, #27ae60, #20c997)' : 'linear-gradient(135deg, #e74c3c, #c0392b)'};
        color: white;
        border-radius: 12px;
        z-index: 10001;
        font-weight: 600;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

function showError(message) {
    const container = document.querySelector('.product-page');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 80px 20px;">
                <h2 style="color: #e74c3c;">❌ Ошибка</h2>
                <p style="color: #666;">${message}</p>
                <button onclick="location.reload()" style="padding: 12px 25px; background: #e74c3c; color: white; border: none; border-radius: 8px; margin-top: 20px; cursor: pointer;">
                    Обновить страницу
                </button>
            </div>
        `;
    }
}

// ============ СТИЛИ ============

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// ============ ЗАПУСК ============

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductCore);
} else {
    initProductCore();
}