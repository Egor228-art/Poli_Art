// js/laminate-product.js - ДЛЯ ТВОЕЙ СТРУКТУРЫ HTML
let currentProduct = null;
let currentPrice = 0;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Страница ламината загружена');
    
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (!productId) {
        console.error('ID товара не найден');
        return;
    }
    
    await loadProduct(productId);
    initOrderModal();
});

async function loadProduct(productId) {
    try {
        if (!window.apiClient) {
            setTimeout(() => loadProduct(productId), 500);
            return;
        }
        
        currentProduct = await window.apiClient.getProduct('laminate', productId);
        currentPrice = parsePrice(currentProduct.price);
        
        renderProduct();
        loadReviews();
        
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        document.querySelector('.product-main__inner').innerHTML = '<div class="error">Ошибка загрузки товара</div>';
    }
}

function renderProduct() {
    const container = document.querySelector('.product-main__inner');
    if (!container) return;
    
    const pictures = currentProduct.pictures || currentProduct.picture || [];
    const mainImage = pictures[0] || '/image/no-image.jpg';
    
    container.innerHTML = `
        <div class="product-gallery-section">
            <div class="product-gallery" id="productGallery">
                <div class="gallery-thumbs" id="galleryThumbs">
                    ${pictures.map((img, i) => `
                        <div class="thumb ${i === 0 ? 'active' : ''}" data-img="${img}">
                            <img src="${img}" onerror="this.src='/image/no-image.jpg'">
                        </div>
                    `).join('')}
                    ${pictures.length === 0 ? '<div class="thumb active"><img src="/image/no-image.jpg"></div>' : ''}
                </div>
                <div class="gallery-main">
                    <img src="${mainImage}" alt="${currentProduct.name}" class="gallery-main__image" id="mainImage" onerror="this.src='/image/no-image.jpg'">
                </div>
            </div>
        </div>
        <div class="product-info-section">
            <h1 class="product-title" id="productTitle">${escapeHtml(currentProduct.name || 'Ламинат')}</h1>
            <div class="product-sku" id="productSku">Код: ${currentProduct.id?.substring(0, 8) || '---'}</div>
            
            <div class="product-price-block">
                <div class="laminate-price" id="productPrice">
                    <span class="price-current">${formatPrice(currentPrice)}</span>
                    <span class="price-unit">за м²</span>
                </div>
            </div>

            <div class="product-actions" id="productActions">
                <button class="btn btn--primary" id="orderBtn">🛒 Оформить заказ</button>
                <button class="btn-constructor" id="constructorBtn">🧮 В конструктор</button>
            </div>

            <div class="laminate-features-tags" id="laminateFeatures">
                ${currentProduct.type ? `<span class="laminate-feature-tag">${currentProduct.type} класс</span>` : ''}
                ${currentProduct.thickness ? `<span class="laminate-feature-tag">${currentProduct.thickness} мм</span>` : ''}
                ${currentProduct.wear_class ? `<span class="laminate-feature-tag">Класс ${currentProduct.wear_class}</span>` : ''}
            </div>
        </div>
    `;
    
    // Галерея
    document.querySelectorAll('.thumb').forEach(thumb => {
        thumb.addEventListener('click', function() {
            document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            const imgSrc = this.dataset.img;
            if (imgSrc) document.getElementById('mainImage').src = imgSrc;
        });
    });
    
    // Описание
    const descTab = document.getElementById('description');
    if (descTab) {
        descTab.innerHTML = `
            <h2>${escapeHtml(currentProduct.name)}</h2>
            <div class="description-text">${currentProduct.description || 'Описание отсутствует'}</div>
        `;
    }
    
    // Характеристики
    const specsGrid = document.querySelector('.laminate-specs-grid');
    if (specsGrid) {
        specsGrid.innerHTML = `
            <div class="laminate-spec-item"><h4>Толщина</h4><p>${currentProduct.thickness || '—'} мм</p></div>
            <div class="laminate-spec-item"><h4>Класс</h4><p>${currentProduct.type || '—'}</p></div>
            <div class="laminate-spec-item"><h4>Износостойкость</h4><p>${currentProduct.wear_class || '—'}</p></div>
            <div class="laminate-spec-item"><h4>Цвета</h4><p>${getColorsString(currentProduct.color)}</p></div>
        `;
    }
    
    // Кнопка конструктора
    document.getElementById('constructorBtn')?.addEventListener('click', () => {
        window.location.href = `laminate-constructor.html?product_id=${currentProduct.id}&product_name=${encodeURIComponent(currentProduct.name)}`;
    });
}

function getColorsString(colorData) {
    if (!colorData) return '—';
    if (Array.isArray(colorData)) return colorData.join(', ');
    if (typeof colorData === 'string') return colorData;
    return '—';
}

function initOrderModal() {
    console.log('🎯 Инициализация модального окна заказа');
    
    // Находим существующее модальное окно
    const modal = document.getElementById('laminateOrderModal');
    if (!modal) {
        console.error('Модальное окно #laminateOrderModal не найдено');
        return;
    }
    
    // Кнопка заказа
    const orderBtn = document.getElementById('orderBtn');
    if (orderBtn) {
        const newBtn = orderBtn.cloneNode(true);
        orderBtn.parentNode.replaceChild(newBtn, orderBtn);
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openOrderModal();
        });
    }
    
    // Закрытие модального окна
    document.getElementById('closeOrderModal')?.addEventListener('click', closeOrderModal);
    document.getElementById('cancelLaminateOrder')?.addEventListener('click', closeOrderModal);
    
    // Количество
    const minusBtn = document.querySelector('#laminateOrderModal .qty-minus');
    const plusBtn = document.querySelector('#laminateOrderModal .qty-plus');
    const qtyInput = document.getElementById('laminateOrderQuantity');
    
    if (minusBtn) minusBtn.addEventListener('click', () => changeQty(-1));
    if (plusBtn) plusBtn.addEventListener('click', () => changeQty(1));
    if (qtyInput) qtyInput.addEventListener('input', updateTotal);
    
    // Доставка
    document.querySelectorAll('#laminateOrderModal input[name="laminateDelivery"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const isDelivery = document.querySelector('#laminateOrderModal input[name="laminateDelivery"]:checked')?.value !== 'pickup';
            const addressBlock = document.getElementById('laminateDeliveryAddress');
            if (addressBlock) addressBlock.style.display = isDelivery ? 'block' : 'none';
            updateTotal();
        });
    });
    
    // Услуги
    document.getElementById('laminateServiceWarranty')?.addEventListener('change', updateTotal);
    document.getElementById('laminateServiceAssembly')?.addEventListener('change', updateTotal);
    
    // Отправка заказа
    document.getElementById('submitLaminateOrder')?.addEventListener('click', submitOrder);
    
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
    if (!modal) return;
    
    // Заполняем данные товара
    document.getElementById('orderProductName').textContent = currentProduct.name;
    document.getElementById('orderProductPrice').textContent = formatPrice(currentPrice);
    
    const mainImage = document.getElementById('mainImage');
    if (mainImage) {
        document.getElementById('orderProductImage').src = mainImage.src;
    }
    
    // Сброс значений
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
    
    updateTotal();
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

function changeQty(delta) {
    const input = document.getElementById('laminateOrderQuantity');
    if (!input) return;
    let val = parseInt(input.value) || 1;
    val = Math.max(1, Math.min(99, val + delta));
    input.value = val;
    updateTotal();
}

function updateTotal() {
    const qty = parseInt(document.getElementById('laminateOrderQuantity')?.value) || 1;
    const productTotal = currentPrice * qty;
    
    let deliveryCost = 0;
    const deliveryType = document.querySelector('#laminateOrderModal input[name="laminateDelivery"]:checked')?.value;
    if (deliveryType === 'delivery') deliveryCost = 500;
    if (deliveryType === 'installation') deliveryCost = 1500;
    
    let servicesCost = 0;
    if (document.getElementById('laminateServiceWarranty')?.checked) servicesCost += 500;
    if (document.getElementById('laminateServiceAssembly')?.checked) servicesCost += 1000;
    
    const total = productTotal + deliveryCost + servicesCost;
    
    document.getElementById('summaryProduct').textContent = formatPrice(productTotal);
    document.getElementById('summaryDelivery').textContent = deliveryCost === 0 ? 'Бесплатно' : formatPrice(deliveryCost);
    document.getElementById('summaryServices').textContent = servicesCost === 0 ? '—' : formatPrice(servicesCost);
    document.getElementById('summaryTotal').textContent = formatPrice(total);
}

async function submitOrder() {
    if (!window.authManager?.currentUser) {
        alert('Для оформления заказа необходимо войти в систему');
        window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
        return;
    }
    
    const qty = parseInt(document.getElementById('laminateOrderQuantity')?.value) || 1;
    const deliveryType = document.querySelector('#laminateOrderModal input[name="laminateDelivery"]:checked')?.value;
    const address = document.getElementById('laminateAddressInput')?.value.trim() || '';
    const saveAddress = document.getElementById('saveLaminateAddress')?.checked || false;
    const warranty = document.getElementById('laminateServiceWarranty')?.checked || false;
    const assembly = document.getElementById('laminateServiceAssembly')?.checked || false;
    
    if ((deliveryType === 'delivery' || deliveryType === 'installation') && !address) {
        alert('Укажите адрес доставки');
        return;
    }
    
    // Сохраняем адрес в профиль
    if (saveAddress && address) {
        try {
            const result = await window.apiClient.updateProfile({ address: address });
            if (result && window.authManager.currentUser) {
                window.authManager.currentUser.address = result.address;
            }
            console.log('✅ Адрес сохранен');
        } catch (e) {
            console.warn('Не удалось сохранить адрес:', e);
        }
    }
    
    const cartItem = {
        id: currentProduct.id,
        name: currentProduct.name,
        price: currentPrice,
        quantity: qty,
        image: document.getElementById('orderProductImage')?.src || '',
        delivery_type: deliveryType,
        delivery_address: address,
        warranty_service: warranty,
        assembly_service: assembly,
        collection: 'laminate'
    };
    
    const userId = window.authManager.currentUser.id;
    const cartKey = `user_cart_${userId}`;
    let cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    cart.push(cartItem);
    localStorage.setItem(cartKey, JSON.stringify(cart));
    
    closeOrderModal();
    alert('✅ Товар добавлен в корзину!');
}

async function loadReviews() {
    try {
        const reviews = await window.apiClient.getReviews(currentProduct.id, true);
        const container = document.getElementById('reviewsList');
        if (!container) return;
        
        if (!reviews.length) {
            container.innerHTML = '<div class="no-reviews">Пока нет отзывов</div>';
            return;
        }
        
        const approved = reviews.filter(r => r.approved);
        if (!approved.length) {
            container.innerHTML = '<div class="no-reviews">Пока нет отзывов</div>';
            return;
        }
        
        container.innerHTML = approved.map(r => `
            <div class="review-item">
                <strong>${escapeHtml(r.author_name || 'Пользователь')}</strong>
                <div class="review-rating">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
                <p>${escapeHtml(r.text)}</p>
                <small>${new Date(r.created_at).toLocaleDateString()}</small>
            </div>
        `).join('');
        
    } catch (e) {
        console.warn('Отзывы не загружены');
    }
}

function parsePrice(price) {
    if (!price) return 0;
    const num = parseInt(price.toString().replace(/[^\d]/g, ''));
    return isNaN(num) ? 0 : num;
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