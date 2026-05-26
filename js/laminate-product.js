// js/laminate-product.js - ИСПРАВЛЕНА ТОЛЬКО МОДАЛКА
let currentProduct = null;
let currentProductPrice = 0;
let currentProductId = null;

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

async function loadProduct() {
    console.log('Загрузка ламината:', currentProductId);
    showLoading();
    
    try {
        if (!window.apiClient) {
            setTimeout(() => loadProduct(), 500);
            return;
        }
        
        currentProduct = await window.apiClient.getProduct('laminate', currentProductId);
        currentProductPrice = parsePrice(currentProduct.price || currentProduct.prise);
        
        renderProductPage();
        await loadReviews();
        await loadSimilarProducts();
        initOrderModal(); // Инициализируем модальное окно
        
    } catch (error) {
        console.error('Ошибка загрузки ламината:', error);
        showError('Не удалось загрузить информацию о товаре');
    } finally {
        hideLoading();
    }
}

function renderProductPage() {
    console.log('Рендеринг страницы ламината...');
    
    // Сохраняем существующую структуру, не пересоздаем всё
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
            ${currentProduct.type ? `<span class="laminate-feature-tag">${currentProduct.type} класс</span>` : ''}
            ${currentProduct.thickness ? `<span class="laminate-feature-tag">${currentProduct.thickness} мм</span>` : ''}
            ${currentProduct.wear_class ? `<span class="laminate-feature-tag">Класс ${currentProduct.wear_class}</span>` : ''}
        `;
    }
    
    // Галерея
    const pictures = currentProduct.pictures || currentProduct.picture || [];
    if (mainImage && pictures.length > 0) {
        mainImage.src = pictures[0];
        mainImage.onerror = () => mainImage.src = '/image/no-image.jpg';
    }
    
    if (galleryThumbs && pictures.length > 0) {
        galleryThumbs.innerHTML = pictures.map((img, i) => `
            <div class="thumb ${i === 0 ? 'active' : ''}" data-img="${img}">
                <img src="${img}" onerror="this.src='/image/no-image.jpg'">
            </div>
        `).join('');
        
        document.querySelectorAll('.thumb').forEach(thumb => {
            thumb.addEventListener('click', function() {
                document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                const img = this.dataset.img;
                if (img && mainImage) mainImage.src = img;
            });
        });
    }
    
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
    const constructorBtn = document.getElementById('constructorBtn');
    if (constructorBtn) {
        const newBtn = constructorBtn.cloneNode(true);
        constructorBtn.parentNode.replaceChild(newBtn, constructorBtn);
        newBtn.addEventListener('click', () => {
            window.location.href = `laminate-constructor.html?product_id=${currentProduct.id}&product_name=${encodeURIComponent(currentProduct.name)}`;
        });
    }
}

function initOrderModal() {
    console.log('🎯 Инициализация модального окна заказа');
    
    // Кнопка заказа
    const orderBtn = document.getElementById('orderBtn');
    if (orderBtn) {
        const newBtn = orderBtn.cloneNode(true);
        orderBtn.parentNode.replaceChild(newBtn, orderBtn);
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🛒 Открытие модального окна');
            openOrderModal();
        });
    }
    
    // Закрытие
    const closeBtn = document.getElementById('closeOrderModal');
    if (closeBtn) {
        const newClose = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newClose, closeBtn);
        newClose.addEventListener('click', closeOrderModal);
    }
    
    const cancelBtn = document.getElementById('cancelLaminateOrder');
    if (cancelBtn) {
        const newCancel = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
        newCancel.addEventListener('click', closeOrderModal);
    }
    
    // Количество
    const minusBtn = document.querySelector('#laminateOrderModal .qty-minus');
    const plusBtn = document.querySelector('#laminateOrderModal .qty-plus');
    const qtyInput = document.getElementById('laminateOrderQuantity');
    
    if (minusBtn) {
        const newMinus = minusBtn.cloneNode(true);
        minusBtn.parentNode.replaceChild(newMinus, minusBtn);
        newMinus.addEventListener('click', () => changeQty(-1));
    }
    if (plusBtn) {
        const newPlus = plusBtn.cloneNode(true);
        plusBtn.parentNode.replaceChild(newPlus, plusBtn);
        newPlus.addEventListener('click', () => changeQty(1));
    }
    if (qtyInput) {
        const newQty = qtyInput.cloneNode(true);
        qtyInput.parentNode.replaceChild(newQty, qtyInput);
        newQty.addEventListener('input', updateTotal);
    }
    
    // Доставка
    document.querySelectorAll('#laminateOrderModal input[name="laminateDelivery"]').forEach(radio => {
        const newRadio = radio.cloneNode(true);
        radio.parentNode.replaceChild(newRadio, radio);
        newRadio.addEventListener('change', () => {
            const isDelivery = document.querySelector('#laminateOrderModal input[name="laminateDelivery"]:checked')?.value !== 'pickup';
            const addressBlock = document.getElementById('laminateDeliveryAddress');
            if (addressBlock) addressBlock.style.display = isDelivery ? 'block' : 'none';
            updateTotal();
        });
    });
    
    // Услуги
    const warrantyChk = document.getElementById('laminateServiceWarranty');
    if (warrantyChk) {
        const newWarranty = warrantyChk.cloneNode(true);
        warrantyChk.parentNode.replaceChild(newWarranty, warrantyChk);
        newWarranty.addEventListener('change', updateTotal);
    }
    
    const assemblyChk = document.getElementById('laminateServiceAssembly');
    if (assemblyChk) {
        const newAssembly = assemblyChk.cloneNode(true);
        assemblyChk.parentNode.replaceChild(newAssembly, assemblyChk);
        newAssembly.addEventListener('change', updateTotal);
    }
    
    // Отправка
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
            const addrInput = document.getElementById('laminateAddressInput');
            if (addrInput) addrInput.value = user.address;
            const saveChk = document.getElementById('saveLaminateAddress');
            if (saveChk) saveChk.checked = true;
        }
    }, 500);
}

function openOrderModal() {
    const modal = document.getElementById('laminateOrderModal');
    if (!modal) return;
    
    // Заполняем данные
    document.getElementById('orderProductName').textContent = currentProduct.name;
    document.getElementById('orderProductPrice').textContent = formatPrice(currentProductPrice);
    
    const mainImage = document.getElementById('mainImage');
    if (mainImage) {
        document.getElementById('orderProductImage').src = mainImage.src;
    }
    
    // Сброс
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
        const addrInput = document.getElementById('laminateAddressInput');
        if (addrInput) addrInput.value = user.address;
        const saveChk = document.getElementById('saveLaminateAddress');
        if (saveChk) saveChk.checked = true;
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
    const productTotal = currentProductPrice * qty;
    
    let deliveryCost = 0;
    const deliveryType = document.querySelector('#laminateOrderModal input[name="laminateDelivery"]:checked')?.value;
    if (deliveryType === 'delivery') deliveryCost = 500;
    if (deliveryType === 'installation') deliveryCost = 1500;
    
    let servicesCost = 0;
    if (document.getElementById('laminateServiceWarranty')?.checked) servicesCost += 500;
    if (document.getElementById('laminateServiceAssembly')?.checked) servicesCost += 1000;
    
    const total = productTotal + deliveryCost + servicesCost;
    
    const summaryProduct = document.getElementById('summaryProduct');
    if (summaryProduct) summaryProduct.textContent = formatPrice(productTotal);
    
    const summaryDelivery = document.getElementById('summaryDelivery');
    if (summaryDelivery) summaryDelivery.textContent = deliveryCost === 0 ? 'Бесплатно' : formatPrice(deliveryCost);
    
    const summaryServices = document.getElementById('summaryServices');
    if (summaryServices) summaryServices.textContent = servicesCost === 0 ? '—' : formatPrice(servicesCost);
    
    const summaryTotal = document.getElementById('summaryTotal');
    if (summaryTotal) summaryTotal.textContent = formatPrice(total);
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
    
    // Сохраняем адрес
    if (saveAddress && address) {
        try {
            await window.apiClient.updateProfile({ address: address });
            if (window.authManager.currentUser) window.authManager.currentUser.address = address;
            console.log('✅ Адрес сохранен');
        } catch (e) { console.warn(e); }
    }
    
    const cartItem = {
        id: currentProduct.id,
        name: currentProduct.name,
        price: currentProductPrice,
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
        const reviews = await window.apiClient.getReviews(currentProductId, true);
        const container = document.getElementById('reviewsList');
        if (!container) return;
        
        if (!reviews || reviews.length === 0) {
            container.innerHTML = '<div class="no-reviews">Пока нет отзывов</div>';
            return;
        }
        
        const approved = reviews.filter(r => r.approved);
        if (approved.length === 0) {
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

function getColorsString(colorData) {
    if (!colorData) return '—';
    if (Array.isArray(colorData)) return colorData.join(', ');
    if (typeof colorData === 'string') return colorData;
    return '—';
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

function showLoading() {
    const container = document.querySelector('.product-main__inner');
    if (container && !container.querySelector('.loading-container')) {
        container.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Загрузка...</p></div>';
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