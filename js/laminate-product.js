// js/laminate-product.js - ПОЛНОСТЬЮ РАБОЧАЯ ВЕРСИЯ
let currentProduct = null;
let currentProductPrice = 0;
let currentProductId = null;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Страница ламината загружена');
    
    const urlParams = new URLSearchParams(window.location.search);
    currentProductId = urlParams.get('id');
    
    if (!currentProductId) {
        showError('Товар не найден');
        return;
    }
    
    await loadProduct();
});

async function loadProduct() {
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
        initOrderModal();
        
    } catch (error) {
        console.error('Ошибка:', error);
        showError('Не удалось загрузить товар');
    } finally {
        hideLoading();
    }
}

function renderProductPage() {
    const container = document.querySelector('.product-main__inner');
    if (!container) return;
    
    const pictures = currentProduct.pictures || currentProduct.picture || [];
    const mainImage = pictures[0] || '/image/no-image.jpg';
    
    container.innerHTML = `
        <div class="product-gallery-section">
            <div class="product-gallery">
                <div class="gallery-thumbs" id="galleryThumbs">
                    ${pictures.map((img, i) => `<div class="thumb ${i === 0 ? 'active' : ''}" data-img="${img}"><img src="${img}" onerror="this.src='/image/no-image.jpg'"></div>`).join('')}
                    ${pictures.length === 0 ? '<div class="thumb active"><img src="/image/no-image.jpg"></div>' : ''}
                </div>
                <div class="gallery-main">
                    <img src="${mainImage}" alt="${currentProduct.name}" class="gallery-main__image" id="mainImage" onerror="this.src='/image/no-image.jpg'">
                </div>
            </div>
        </div>
        <div class="product-info-section">
            <h1 class="product-title">${escapeHtml(currentProduct.name || 'Ламинат')}</h1>
            <div class="product-sku">Код: ${currentProduct.id?.substring(0, 8)}</div>
            <div class="product-price-block">
                <div class="laminate-price"><span class="price-current">${formatPrice(currentProductPrice)}</span><span class="price-unit">за м²</span></div>
            </div>
            <div class="product-actions">
                <button class="btn btn--primary" id="orderBtn">🛒 Оформить заказ</button>
                <button class="btn-constructor" id="constructorBtn">🧮 В конструктор</button>
            </div>
            <div class="laminate-features-tags" id="laminateFeatures">
                ${currentProduct.type ? `<span class="laminate-feature-tag">${currentProduct.type} класс</span>` : ''}
                ${currentProduct.thickness ? `<span class="laminate-feature-tag">${currentProduct.thickness} мм</span>` : ''}
            </div>
        </div>
    `;
    
    // Галерея
    document.querySelectorAll('.thumb').forEach(thumb => {
        thumb.addEventListener('click', function() {
            document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            const img = this.dataset.img;
            if (img) document.getElementById('mainImage').src = img;
        });
    });
    
    // Описание
    const descTab = document.getElementById('description');
    if (descTab) descTab.innerHTML = `<h2>${escapeHtml(currentProduct.name)}</h2><div class="description-text">${currentProduct.description || 'Описание отсутствует'}</div>`;
    
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
    
    // Конструктор
    document.getElementById('constructorBtn')?.addEventListener('click', () => {
        window.location.href = `laminate-constructor.html?product_id=${currentProduct.id}&product_name=${encodeURIComponent(currentProduct.name)}`;
    });
}

function initOrderModal() {
    const orderBtn = document.getElementById('orderBtn');
    if (!orderBtn) return;
    
    const newBtn = orderBtn.cloneNode(true);
    orderBtn.parentNode.replaceChild(newBtn, orderBtn);
    newBtn.addEventListener('click', () => openOrderModal());
    
    document.getElementById('closeOrderModal')?.addEventListener('click', closeOrderModal);
    document.getElementById('cancelLaminateOrder')?.addEventListener('click', closeOrderModal);
    
    document.querySelector('#laminateOrderModal .qty-minus')?.addEventListener('click', () => changeQty(-1));
    document.querySelector('#laminateOrderModal .qty-plus')?.addEventListener('click', () => changeQty(1));
    document.getElementById('laminateOrderQuantity')?.addEventListener('input', updateTotal);
    
    document.querySelectorAll('#laminateOrderModal input[name="laminateDelivery"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const isDelivery = document.querySelector('#laminateOrderModal input[name="laminateDelivery"]:checked')?.value !== 'pickup';
            const addrBlock = document.getElementById('laminateDeliveryAddress');
            if (addrBlock) addrBlock.style.display = isDelivery ? 'block' : 'none';
            updateTotal();
        });
    });
    
    document.getElementById('laminateServiceWarranty')?.addEventListener('change', updateTotal);
    document.getElementById('laminateServiceAssembly')?.addEventListener('change', updateTotal);
    document.getElementById('submitLaminateOrder')?.addEventListener('click', submitOrder);
    
    setTimeout(() => {
        const user = window.authManager?.currentUser;
        if (user?.address) {
            const addrInput = document.getElementById('laminateAddressInput');
            if (addrInput) addrInput.value = user.address;
            document.getElementById('saveLaminateAddress').checked = true;
        }
    }, 500);
}

function openOrderModal() {
    const modal = document.getElementById('laminateOrderModal');
    if (!modal) return;
    
    document.getElementById('orderProductName').textContent = currentProduct.name;
    document.getElementById('orderProductPrice').textContent = formatPrice(currentProductPrice);
    const mainImg = document.getElementById('mainImage');
    if (mainImg) document.getElementById('orderProductImage').src = mainImg.src;
    
    document.getElementById('laminateOrderQuantity').value = 1;
    document.querySelector('#laminateOrderModal input[name="laminateDelivery"][value="pickup"]').checked = true;
    document.getElementById('laminateDeliveryAddress').style.display = 'none';
    document.getElementById('laminateServiceWarranty').checked = false;
    document.getElementById('laminateServiceAssembly').checked = false;
    
    const user = window.authManager?.currentUser;
    if (user?.address) {
        document.getElementById('laminateAddressInput').value = user.address;
        document.getElementById('saveLaminateAddress').checked = true;
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
    let val = parseInt(input.value) || 1;
    val = Math.max(1, Math.min(99, val + delta));
    input.value = val;
    updateTotal();
}

function updateTotal() {
    const qty = parseInt(document.getElementById('laminateOrderQuantity').value) || 1;
    const productTotal = currentProductPrice * qty;
    
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
    
    const qty = parseInt(document.getElementById('laminateOrderQuantity').value) || 1;
    const deliveryType = document.querySelector('#laminateOrderModal input[name="laminateDelivery"]:checked')?.value;
    const address = document.getElementById('laminateAddressInput')?.value.trim() || '';
    const saveAddress = document.getElementById('saveLaminateAddress')?.checked || false;
    const warranty = document.getElementById('laminateServiceWarranty')?.checked || false;
    const assembly = document.getElementById('laminateServiceAssembly')?.checked || false;
    
    if ((deliveryType === 'delivery' || deliveryType === 'installation') && !address) {
        alert('Укажите адрес доставки');
        return;
    }
    
    if (saveAddress && address) {
        try {
            await window.apiClient.updateProfile({ address: address });
            if (window.authManager.currentUser) window.authManager.currentUser.address = address;
        } catch(e) { console.warn(e); }
    }
    
    const cartItem = {
        id: currentProduct.id, name: currentProduct.name, price: currentProductPrice,
        quantity: qty, image: document.getElementById('orderProductImage')?.src || '',
        delivery_type: deliveryType, delivery_address: address,
        warranty_service: warranty, assembly_service: assembly, collection: 'laminate'
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
        
        const approved = (reviews || []).filter(r => r.approved);
        if (approved.length === 0) {
            container.innerHTML = '<div class="no-reviews">Пока нет отзывов</div>';
            return;
        }
        
        container.innerHTML = approved.map(r => `
            <div class="review-item"><strong>${escapeHtml(r.author_name || 'Пользователь')}</strong>
            <div>${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
            <p>${escapeHtml(r.text)}</p><small>${new Date(r.created_at).toLocaleDateString()}</small></div>
        `).join('');
    } catch(e) { console.warn(e); }
}

async function loadSimilarProducts() {
    try {
        const result = await window.apiClient.getLaminate();
        const others = (result.items || []).filter(p => p.id !== currentProductId).slice(0, 4);
        const grid = document.getElementById('similarProductsGrid');
        if (!grid) return;
        
        if (others.length === 0) {
            document.getElementById('similarLoading')?.remove();
            document.getElementById('noSimilarProducts')?.style.display = 'block';
            return;
        }
        
        grid.innerHTML = others.map(p => `
            <div class="product-card similar-card">
                <div class="product-image-container"><img src="${(p.pictures || p.picture)?.[0] || '/image/no-image.jpg'}" class="product-image" onclick="location.href='laminate-product.html?id=${p.id}'" onerror="this.src='/image/no-image.jpg'"></div>
                <div class="product-info"><h3 class="product-title">${escapeHtml(p.name)}</h3><div class="product-price">${parsePrice(p.price).toLocaleString()} ₽</div><a href="laminate-product.html?id=${p.id}" class="btn-details">Подробнее</a></div>
            </div>
        `).join('');
        document.getElementById('similarLoading')?.remove();
    } catch(e) { console.warn(e); }
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
    if (container) container.innerHTML = '<div class="loading-container">Загрузка...</div>';
}

function hideLoading() {
    // handled in render
}

function showError(msg) {
    const container = document.querySelector('.product-main__inner');
    if (container) container.innerHTML = `<div class="error">${msg}</div>`;
}