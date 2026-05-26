// js/laminate-product.js - ПОЛНОСТЬЮ РАБОЧАЯ ВЕРСИЯ
let currentProduct = null;
let currentProductPrice = 0;
let currentProductId = null;

// Инициализация
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Инициализация страницы ламината...');
    
    const urlParams = new URLSearchParams(window.location.search);
    currentProductId = urlParams.get('id');
    
    if (!currentProductId) {
        showError('Товар не найден');
        return;
    }
    
    await loadProduct();
});

// Загрузка товара через API
async function loadProduct() {
    console.log('Загрузка ламината:', currentProductId);
    
    showLoading();
    
    try {
        if (!window.apiClient) {
            setTimeout(() => loadProduct(), 500);
            return;
        }
        
        currentProduct = await window.apiClient.getProduct('laminate', currentProductId);
        
        if (!currentProduct) {
            throw new Error('Товар не найден');
        }
        
        currentProductPrice = parsePrice(currentProduct.price || currentProduct.prise);
        
        renderProductPage();
        
        // Загружаем отзывы
        await loadReviews();
        
        // Загружаем похожие товары
        await loadSimilarProducts();
        
        // Инициализируем модальное окно заказа
        initOrderModal();
        
    } catch (error) {
        console.error('Ошибка загрузки ламината:', error);
        showError('Не удалось загрузить информацию о товаре');
    } finally {
        hideLoading();
    }
}

// Рендеринг страницы товара
function renderProductPage() {
    console.log('Рендеринг страницы ламината...');
    
    // Заполняем информацию о товаре в существующей структуре
    const titleEl = document.querySelector('.product-title');
    const skuEl = document.querySelector('.product-sku');
    const priceEl = document.querySelector('.laminate-price .price-current');
    const priceUnit = document.querySelector('.laminate-price .price-unit');
    const featuresEl = document.getElementById('laminateFeatures');
    const mainImage = document.querySelector('.gallery-main__image');
    const galleryThumbs = document.querySelector('.gallery-thumbs');
    
    if (titleEl) titleEl.textContent = currentProduct.name || 'Ламинат';
    if (skuEl) skuEl.textContent = `Код: ${currentProduct.id?.substring(0, 8) || '---'}`;
    if (priceEl) priceEl.textContent = formatPrice(currentProductPrice);
    if (priceUnit) priceUnit.textContent = 'за м²';
    
    if (featuresEl) {
        featuresEl.innerHTML = `
            ${currentProduct.type ? `<span class="laminate-feature-tag">${escapeHtml(currentProduct.type)} класс</span>` : ''}
            ${currentProduct.thickness ? `<span class="laminate-feature-tag">${escapeHtml(currentProduct.thickness)} мм</span>` : ''}
            ${currentProduct.wear_class ? `<span class="laminate-feature-tag">Класс ${escapeHtml(currentProduct.wear_class)}</span>` : ''}
        `;
    }
    
    // Настройка галереи
    const pictures = currentProduct.pictures || currentProduct.picture || [];
    
    if (mainImage && pictures.length > 0) {
        mainImage.src = pictures[0];
        mainImage.onerror = () => mainImage.src = '/image/no-image.jpg';
        mainImage.alt = currentProduct.name || 'Изображение ламината';
    } else if (mainImage) {
        mainImage.src = '/image/no-image.jpg';
    }
    
    if (galleryThumbs) {
        if (pictures.length > 0) {
            galleryThumbs.innerHTML = pictures.map((img, i) => `
                <div class="thumb ${i === 0 ? 'active' : ''}" data-img="${img}">
                    <img src="${img}" onerror="this.src='/image/no-image.jpg'">
                </div>
            `).join('');
        } else {
            galleryThumbs.innerHTML = '<div class="thumb active"><img src="/image/no-image.jpg"></div>';
        }
        
        // Обработчики для миниатюр
        document.querySelectorAll('.thumb').forEach(thumb => {
            thumb.addEventListener('click', function() {
                document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                const imgUrl = this.dataset.img;
                if (imgUrl && mainImage) mainImage.src = imgUrl;
            });
        });
    }
    
    // Заполнение описания
    const descriptionTab = document.getElementById('description');
    if (descriptionTab) {
        descriptionTab.innerHTML = `
            <h2>${escapeHtml(currentProduct.name)}</h2>
            <div class="description-text">${currentProduct.description || 'Описание отсутствует'}</div>
        `;
    }
    
    // Заполнение характеристик
    const specsGrid = document.querySelector('.laminate-specs-grid');
    if (specsGrid) {
        specsGrid.innerHTML = `
            <div class="laminate-spec-item"><h4>Толщина доски</h4><p>${currentProduct.thickness ? currentProduct.thickness + ' мм' : 'Не указана'}</p></div>
            <div class="laminate-spec-item"><h4>Класс износостойкости</h4><p>${currentProduct.wear_class || 'Не указан'}</p></div>
            <div class="laminate-spec-item"><h4>Влагостойкость</h4><p>${getMoistureResistance(currentProduct.thickness)}</p></div>
            <div class="laminate-spec-item"><h4>Размер доски</h4><p>${currentProduct.size || 'Не указан'}</p></div>
            <div class="laminate-spec-item"><h4>Количество в упаковке</h4><p>${currentProduct.pack_quantity || 'Не указано'} шт</p></div>
            <div class="laminate-spec-item"><h4>Площадь в упаковке</h4><p>${currentProduct.pack_area ? currentProduct.pack_area + ' м²' : 'Не указано'}</p></div>
            <div class="laminate-spec-item"><h4>Вес упаковки</h4><p>${currentProduct.pack_weight ? currentProduct.pack_weight + ' кг' : 'Не указано'}</p></div>
            <div class="laminate-spec-item"><h4>Тип замка</h4><p>${currentProduct.lock_type || 'Click'}</p></div>
            <div class="laminate-spec-item"><h4>Срок службы</h4><p>${currentProduct.lifespan || '15-25 лет'}</p></div>
        `;
    }
    
    // Кнопка конструктора
    const constructorBtn = document.getElementById('constructorBtn');
    if (constructorBtn) {
        const newBtn = constructorBtn.cloneNode(true);
        constructorBtn.parentNode.replaceChild(newBtn, constructorBtn);
        newBtn.addEventListener('click', () => {
            window.location.href = `laminate-constructor.html?product_id=${currentProduct.id}&product_name=${encodeURIComponent(currentProduct.name)}`;
        });
    }
}

function getMoistureResistance(thickness) {
    if (!thickness) return 'Не указана';
    const thickNum = parseInt(thickness);
    if (isNaN(thickNum)) return 'Не указана';
    if (thickNum >= 12) return 'Высокая (до 72 часов)';
    if (thickNum >= 10) return 'Средняя (до 48 часов)';
    return 'Базовая (до 24 часов)';
}

// ============ МОДАЛЬНОЕ ОКНО ЗАКАЗА ============

function initOrderModal() {
    console.log('Инициализация модального окна заказа для ламината');
    
    const orderBtn = document.getElementById('orderBtn');
    if (!orderBtn) {
        console.log('Кнопка заказа не найдена');
        return;
    }
    
    // Удаляем старые обработчики
    const newOrderBtn = orderBtn.cloneNode(true);
    orderBtn.parentNode.replaceChild(newOrderBtn, orderBtn);
    
    newOrderBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Открытие модального окна заказа');
        openOrderModal();
    });
    
    // Закрытие модального окна
    const closeBtn = document.getElementById('closeOrderModal');
    if (closeBtn) {
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        newCloseBtn.addEventListener('click', closeOrderModal);
    }
    
    const cancelBtn = document.getElementById('cancelLaminateOrder');
    if (cancelBtn) {
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        newCancelBtn.addEventListener('click', closeOrderModal);
    }
    
    // Количество товара
    const minusBtn = document.querySelector('#laminateOrderModal .qty-minus');
    const plusBtn = document.querySelector('#laminateOrderModal .qty-plus');
    const qtyInput = document.getElementById('laminateOrderQuantity');
    
    if (minusBtn) {
        const newMinus = minusBtn.cloneNode(true);
        minusBtn.parentNode.replaceChild(newMinus, minusBtn);
        newMinus.addEventListener('click', () => changeQuantity(-1));
    }
    if (plusBtn) {
        const newPlus = plusBtn.cloneNode(true);
        plusBtn.parentNode.replaceChild(newPlus, plusBtn);
        newPlus.addEventListener('click', () => changeQuantity(1));
    }
    if (qtyInput) {
        const newQty = qtyInput.cloneNode(true);
        qtyInput.parentNode.replaceChild(newQty, qtyInput);
        newQty.addEventListener('input', updateOrderSummary);
    }
    
    // Доставка
    const deliveryRadios = document.querySelectorAll('#laminateOrderModal input[name="laminateDelivery"]');
    deliveryRadios.forEach(radio => {
        const newRadio = radio.cloneNode(true);
        radio.parentNode.replaceChild(newRadio, radio);
        newRadio.addEventListener('change', function() {
            const isDelivery = document.querySelector('#laminateOrderModal input[name="laminateDelivery"]:checked')?.value !== 'pickup';
            const addressBlock = document.getElementById('laminateDeliveryAddress');
            if (addressBlock) {
                addressBlock.style.display = isDelivery ? 'block' : 'none';
            }
            updateOrderSummary();
        });
    });
    
    // Дополнительные услуги
    const warrantyChk = document.getElementById('laminateServiceWarranty');
    if (warrantyChk) {
        const newWarranty = warrantyChk.cloneNode(true);
        warrantyChk.parentNode.replaceChild(newWarranty, warrantyChk);
        newWarranty.addEventListener('change', updateOrderSummary);
    }
    
    const assemblyChk = document.getElementById('laminateServiceAssembly');
    if (assemblyChk) {
        const newAssembly = assemblyChk.cloneNode(true);
        assemblyChk.parentNode.replaceChild(newAssembly, assemblyChk);
        newAssembly.addEventListener('change', updateOrderSummary);
    }
    
    // Кнопка отправки
    const submitBtn = document.getElementById('submitLaminateOrder');
    if (submitBtn) {
        const newSubmit = submitBtn.cloneNode(true);
        submitBtn.parentNode.replaceChild(newSubmit, submitBtn);
        newSubmit.addEventListener('click', submitOrder);
    }
    
    // Подтягиваем адрес из профиля
    setTimeout(() => {
        const user = window.authManager?.currentUser;
        if (user?.address) {
            const addressInput = document.getElementById('laminateAddressInput');
            if (addressInput) addressInput.value = user.address;
            const saveCheckbox = document.getElementById('saveLaminateAddress');
            if (saveCheckbox) saveCheckbox.checked = true;
        }
    }, 500);
}

function openOrderModal() {
    const modal = document.getElementById('laminateOrderModal');
    if (!modal) {
        console.error('Модальное окно не найдено');
        return;
    }
    
    // Заполняем данные товара
    const productNameEl = document.getElementById('orderProductName');
    const productPriceEl = document.getElementById('orderProductPrice');
    const productImageEl = document.getElementById('orderProductImage');
    const mainImage = document.getElementById('mainImage');
    
    if (productNameEl) productNameEl.textContent = currentProduct.name || 'Ламинат';
    if (productPriceEl) productPriceEl.textContent = formatPrice(currentProductPrice);
    if (productImageEl && mainImage) productImageEl.src = mainImage.src;
    
    // Сбрасываем значения
    const qtyInput = document.getElementById('laminateOrderQuantity');
    if (qtyInput) qtyInput.value = 1;
    
    const pickupRadio = document.querySelector('#laminateOrderModal input[name="laminateDelivery"][value="pickup"]');
    if (pickupRadio) pickupRadio.checked = true;
    
    const addressBlock = document.getElementById('laminateDeliveryAddress');
    if (addressBlock) addressBlock.style.display = 'none';
    
    const warrantyChk = document.getElementById('laminateServiceWarranty');
    if (warrantyChk) warrantyChk.checked = false;
    
    const assemblyChk = document.getElementById('laminateServiceAssembly');
    if (assemblyChk) assemblyChk.checked = false;
    
    // Подтягиваем адрес из профиля
    const user = window.authManager?.currentUser;
    if (user?.address) {
        const addressInput = document.getElementById('laminateAddressInput');
        if (addressInput) addressInput.value = user.address;
        const saveCheckbox = document.getElementById('saveLaminateAddress');
        if (saveCheckbox) saveCheckbox.checked = true;
    }
    
    updateOrderSummary();
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeOrderModal() {
    const modal = document.getElementById('laminateOrderModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function changeQuantity(delta) {
    const input = document.getElementById('laminateOrderQuantity');
    if (!input) return;
    
    let value = parseInt(input.value) || 1;
    value += delta;
    if (value < 1) value = 1;
    if (value > 99) value = 99;
    input.value = value;
    
    updateProductPriceDisplay();
    updateOrderSummary();
}

function updateProductPriceDisplay() {
    const quantity = parseInt(document.getElementById('laminateOrderQuantity')?.value) || 1;
    const total = currentProductPrice * quantity;
    const priceElement = document.getElementById('orderProductPrice');
    if (priceElement) priceElement.textContent = formatPrice(total);
}

function updateOrderSummary() {
    const quantity = parseInt(document.getElementById('laminateOrderQuantity')?.value) || 1;
    const productTotal = currentProductPrice * quantity;
    
    let deliveryCost = 0;
    const deliveryRadio = document.querySelector('#laminateOrderModal input[name="laminateDelivery"]:checked');
    if (deliveryRadio) {
        if (deliveryRadio.value === 'delivery') deliveryCost = 500;
        if (deliveryRadio.value === 'installation') deliveryCost = 1500;
    }
    
    let servicesCost = 0;
    if (document.getElementById('laminateServiceWarranty')?.checked) servicesCost += 500;
    if (document.getElementById('laminateServiceAssembly')?.checked) servicesCost += 1000;
    
    const totalCost = productTotal + deliveryCost + servicesCost;
    
    const summaryProduct = document.getElementById('summaryProduct');
    if (summaryProduct) summaryProduct.textContent = formatPrice(productTotal);
    
    const summaryDelivery = document.getElementById('summaryDelivery');
    if (summaryDelivery) summaryDelivery.textContent = deliveryCost === 0 ? 'Бесплатно' : formatPrice(deliveryCost);
    
    const summaryServices = document.getElementById('summaryServices');
    if (summaryServices) summaryServices.textContent = servicesCost === 0 ? '—' : formatPrice(servicesCost);
    
    const summaryTotal = document.getElementById('summaryTotal');
    if (summaryTotal) summaryTotal.textContent = formatPrice(totalCost);
}

async function submitOrder() {
    console.log('Отправка заказа...');
    
    if (!window.authManager?.currentUser) {
        alert('Для оформления заказа необходимо войти в систему');
        window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
        return;
    }
    
    const quantity = parseInt(document.getElementById('laminateOrderQuantity')?.value) || 1;
    const deliveryType = document.querySelector('#laminateOrderModal input[name="laminateDelivery"]:checked')?.value || 'pickup';
    const address = document.getElementById('laminateAddressInput')?.value.trim() || '';
    const saveAddress = document.getElementById('saveLaminateAddress')?.checked || false;
    const warranty = document.getElementById('laminateServiceWarranty')?.checked || false;
    const assembly = document.getElementById('laminateServiceAssembly')?.checked || false;
    
    if ((deliveryType === 'delivery' || deliveryType === 'installation') && !address) {
        alert('Пожалуйста, укажите адрес доставки');
        return;
    }
    
    // Сохраняем адрес в профиль
    if (saveAddress && address) {
        try {
            const result = await window.apiClient.updateProfile({ address: address });
            if (result && result.address && window.authManager.currentUser) {
                window.authManager.currentUser.address = result.address;
            }
            console.log('✅ Адрес сохранен в профиль');
        } catch (error) {
            console.warn('⚠️ Не удалось сохранить адрес:', error);
        }
    }
    
    const cartItem = {
        id: currentProduct.id,
        name: currentProduct.name,
        price: currentProductPrice,
        quantity: quantity,
        image: document.getElementById('orderProductImage')?.src || '',
        code: currentProduct.id?.substring(0, 8) || '',
        color: getFormattedColorsString(currentProduct.color),
        delivery_type: deliveryType,
        delivery_address: address,
        warranty_service: warranty,
        assembly_service: assembly,
        payment_method: 'наличные',
        collection: 'laminate',
        added_at: new Date().toISOString(),
        save_address: saveAddress
    };
    
    const userId = window.authManager.currentUser.id;
    const cartKey = `user_cart_${userId}`;
    let cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    
    // Проверяем, есть ли уже такой товар в корзине
    const existingIndex = cart.findIndex(item => 
        item.id === currentProduct.id && 
        item.collection === 'laminate' &&
        item.delivery_type === deliveryType &&
        item.warranty_service === warranty &&
        item.assembly_service === assembly
    );
    
    if (existingIndex !== -1) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push(cartItem);
    }
    
    localStorage.setItem(cartKey, JSON.stringify(cart));
    
    // Закрываем модальное окно
    closeOrderModal();
    
    // Показываем уведомление
    alert('✅ Товар добавлен в корзину!');
    
    // Обновляем счетчик корзины
    if (window.cartManager) window.cartManager.updateCartCounter();
}

function getFormattedColorsString(colorData) {
    if (!colorData) return '';
    let colors = [];
    if (typeof colorData === 'string') {
        try {
            const parsed = JSON.parse(colorData);
            colors = Array.isArray(parsed) ? parsed : [colorData];
        } catch (e) {
            colors = [colorData];
        }
    } else if (Array.isArray(colorData)) {
        colors = colorData;
    }
    return colors.filter(c => c).join(', ');
}

// ============ ОТЗЫВЫ ============

async function loadReviews() {
    const reviewsList = document.getElementById('reviewsList');
    if (!reviewsList) return;
    
    try {
        const reviews = await window.apiClient.getReviews(currentProductId, true);
        
        let html = '';
        let canReview = false;
        let statusText = '🔒 Отзыв только для купивших товар';
        
        if (window.authManager?.currentUser) {
            const hasPurchased = await checkUserPurchased();
            if (hasPurchased) {
                canReview = true;
                statusText = '✍️ Оставить отзыв';
            } else {
                statusText = 'Отзыв только для купивших товар';
            }
        } else {
            statusText = 'Войдите, чтобы оставить отзыв';
        }
        
        html = `
            <div class="reviews-header">
                <h2 class="reviews-title">Отзывы покупателей</h2>
                <div class="reviews-stats">
                    <div class="reviews-average">${calculateAvgRating(reviews)} ★</div>
                    <div class="reviews-count">${reviews.length} ${declOfNum(reviews.length, ['отзыв', 'отзыва', 'отзывов'])}</div>
                </div>
            </div>
            <div class="reviews-actions" style="margin-bottom: 30px;">
                ${canReview ? 
                    `<button class="btn btn--primary" onclick="openLaminateReviewModal('${currentProductId}')" style="background: #27ae60;">✍️ ${statusText}</button>` :
                    `<button class="btn" disabled style="background: #f0f0f0; color: #999;">${statusText}</button>`
                }
            </div>
        `;
        
        const approvedReviews = reviews.filter(r => r.approved);
        
        if (approvedReviews.length === 0) {
            html += `<div class="no-reviews"><div class="no-reviews__icon">💬</div><div class="no-reviews__text">Пока нет отзывов. Будьте первым!</div></div>`;
        } else {
            approvedReviews.forEach(review => {
                const date = new Date(review.created_at).toLocaleDateString('ru-RU');
                const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
                html += `
                    <div style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #eee;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                            <div><strong>${escapeHtml(review.author_name || 'Пользователь')}</strong><span style="color: #27ae60; margin-left: 10px;">✓ покупатель</span></div>
                            <span style="color: #999;">${date}</span>
                        </div>
                        <div style="color: #ffc107; margin-bottom: 15px;">${stars}</div>
                        <p style="color: #666;">${escapeHtml(review.text)}</p>
                    </div>
                `;
            });
        }
        
        reviewsList.innerHTML = html;
        
        const reviewsTab = document.querySelector('[data-tab="reviews"]');
        if (reviewsTab && approvedReviews.length > 0) {
            reviewsTab.textContent = `Отзывы (${approvedReviews.length})`;
        }
        
    } catch (error) {
        console.error('Ошибка загрузки отзывов:', error);
        reviewsList.innerHTML = '<div class="no-reviews"><p>Не удалось загрузить отзывы</p></div>';
    }
}

async function checkUserPurchased() {
    try {
        if (!window.authManager?.currentUser) return false;
        
        const orders = await window.apiClient.getOrders();
        
        const PAID_STATUSES = ['оплачено', 'доставлено', 'delivered', 'оплачен', 'выполнен'];
        
        for (const order of orders) {
            const status = (order.status || '').toLowerCase();
            const isPaid = PAID_STATUSES.some(s => status.includes(s.toLowerCase()));
            if (!isPaid) continue;
            
            let products = [];
            if (typeof order.products === 'string') {
                try { products = JSON.parse(order.products); } catch(e) {}
            } else if (Array.isArray(order.products)) {
                products = order.products;
            }
            
            const found = products.find(p => p.id === currentProductId);
            if (found) return true;
        }
        
        return false;
    } catch (error) {
        console.error('Ошибка проверки покупки:', error);
        return false;
    }
}

function calculateAvgRating(reviews) {
    if (!reviews.length) return '0.0';
    const approved = reviews.filter(r => r.approved);
    if (!approved.length) return '0.0';
    const sum = approved.reduce((acc, r) => acc + (r.rating || 0), 0);
    return (sum / approved.length).toFixed(1);
}

function declOfNum(n, titles) {
    return titles[n % 10 === 1 && n % 100 !== 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2];
}

// Модальное окно для отзыва
window.openLaminateReviewModal = function(productId) {
    const modalHTML = `
        <div id="laminateReviewModal" style="position: fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.6); z-index:10000; display:flex; align-items:center; justify-content:center;">
            <div style="background:white; border-radius:16px; padding:30px; max-width:500px; width:90%;">
                <div style="display:flex; justify-content:space-between; margin-bottom:20px;">
                    <h2>Оставить отзыв</h2>
                    <button onclick="this.closest('#laminateReviewModal').remove()" style="font-size:24px; background:none; border:none; cursor:pointer;">&times;</button>
                </div>
                <div style="background:#f8f9fa; padding:15px; border-radius:8px; margin-bottom:20px;">
                    <strong>${escapeHtml(currentProduct?.name || 'Ламинат')}</strong>
                </div>
                <form id="laminateReviewForm">
                    <div style="margin-bottom:20px;">
                        <label>Оценка</label>
                        <div style="display:flex; gap:10px;" id="ratingStars">
                            ${[1,2,3,4,5].map(i => `<span onclick="setLaminateRating(${i})" style="font-size:30px; cursor:pointer;">☆</span>`).join('')}
                        </div>
                        <input type="hidden" id="reviewRating" value="5">
                    </div>
                    <div style="margin-bottom:20px;">
                        <label>Отзыв *</label>
                        <textarea id="reviewText" rows="4" style="width:100%; padding:12px; border:2px solid #ddd; border-radius:8px;"></textarea>
                    </div>
                    <div style="display:flex; gap:10px; justify-content:flex-end;">
                        <button type="button" onclick="this.closest('#laminateReviewModal').remove()" style="padding:12px 24px; background:#f0f0f0; border:none; border-radius:8px;">Отмена</button>
                        <button type="submit" style="padding:12px 24px; background:#27ae60; color:white; border:none; border-radius:8px;">Отправить</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
    
    window.setLaminateRating = function(rating) {
        const stars = document.querySelectorAll('#ratingStars span');
        stars.forEach((star, i) => {
            star.textContent = i < rating ? '★' : '☆';
        });
        document.getElementById('reviewRating').value = rating;
    };
    window.setLaminateRating(5);
    
    document.getElementById('laminateReviewForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const rating = parseInt(document.getElementById('reviewRating').value);
        const text = document.getElementById('reviewText').value.trim();
        
        if (!text) {
            alert('Напишите отзыв');
            return;
        }
        
        try {
            await window.apiClient.createReview({
                product_id: productId,
                product_name: currentProduct?.name,
                rating: rating,
                text: text,
                isLaminate: true
            });
            
            alert('✅ Отзыв отправлен на модерацию!');
            document.getElementById('laminateReviewModal')?.remove();
            document.body.style.overflow = '';
            
            setTimeout(() => loadReviews(), 2000);
            
        } catch (error) {
            console.error('Ошибка:', error);
            alert('❌ Ошибка отправки отзыва');
        }
    });
};

// ============ ПОХОЖИЕ ТОВАРЫ ============

async function loadSimilarProducts() {
    const grid = document.getElementById('similarProductsGrid');
    const loading = document.getElementById('similarLoading');
    const noResults = document.getElementById('noSimilarProducts');
    
    if (!grid) return;
    
    try {
        const result = await window.apiClient.getLaminate();
        const allProducts = result.items || [];
        const otherProducts = allProducts.filter(p => p.id !== currentProductId);
        
        if (otherProducts.length === 0) {
            if (loading) loading.style.display = 'none';
            if (noResults) noResults.style.display = 'block';
            return;
        }
        
        const similar = [...otherProducts].sort(() => Math.random() - 0.5).slice(0, 4);
        
        grid.innerHTML = '';
        
        similar.forEach(product => {
            const imageUrl = (product.pictures || product.picture)?.[0] || '/image/no-image.jpg';
            const priceValue = product.price || product.prise;
            const priceDisplay = priceValue ? `${parsePrice(priceValue).toLocaleString()} ₽` : 'Цена по запросу';
            
            const card = document.createElement('div');
            card.className = 'product-card similar-card';
            card.innerHTML = `
                <div class="product-image-container">
                    <img src="${imageUrl}" alt="${escapeHtml(product.name)}" class="product-image" loading="lazy" onerror="this.src='/image/no-image.jpg'" onclick="window.location.href='laminate-product.html?id=${product.id}'">
                </div>
                <div class="product-info">
                    <h3 class="product-title">${escapeHtml(product.name)}</h3>
                    <div class="laminate-price">${priceDisplay} <span class="price-unit">за м²</span></div>
                    <div class="product-actions">
                        <a href="laminate-product.html?id=${product.id}" class="btn-details">Подробнее</a>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
        
        if (loading) loading.style.display = 'none';
        if (noResults) noResults.style.display = 'none';
        
    } catch (error) {
        console.error('Ошибка загрузки похожих:', error);
        if (loading) loading.style.display = 'none';
        if (noResults) noResults.style.display = 'block';
    }
}

// ============ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ============

function parsePrice(priceStr) {
    if (!priceStr) return 0;
    const cleanStr = priceStr.toString().replace(/[^\d]/g, '');
    const price = parseInt(cleanStr);
    return isNaN(price) ? 0 : price;
}

function formatPrice(price) {
    return price.toLocaleString('ru-RU') + ' ₽';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showLoading() {
    const container = document.querySelector('.product-main__inner');
    if (container && !container.querySelector('.loading-container')) {
        container.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Загрузка информации о ламинате...</p></div>';
    }
}

function hideLoading() {
    const loading = document.querySelector('.loading-container');
    if (loading) loading.remove();
}

function showError(message) {
    const container = document.querySelector('.product-main__inner');
    if (container) {
        container.innerHTML = `<div class="error-container"><h2>Ошибка</h2><p>${message}</p><a href="catalog.html" class="btn btn--primary">Вернуться в каталог</a></div>`;
    }
}