// js/laminate-product.js - ИСПРАВЛЕННЫЙ
let currentProduct = null;
let currentProductPrice = 0;
let currentProductId = null;

document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    currentProductId = urlParams.get('id');
    if (!currentProductId) return;
    
    if (!window.apiClient) {
        setTimeout(() => document.dispatchEvent(new Event('DOMContentLoaded')), 500);
        return;
    }
    
    await loadProduct();
});

async function loadProduct() {
    try {
        currentProduct = await window.apiClient.getProduct('laminate', currentProductId);
        currentProductPrice = parsePrice(currentProduct.price);
        
        // Заполняем данные
        document.querySelector('.product-title').textContent = currentProduct.name || 'Ламинат';
        document.querySelector('.product-sku').textContent = `Код: ${currentProduct.id?.substring(0, 8)}`;
        document.querySelector('.price-current').textContent = formatPrice(currentProductPrice);
        
        // Картинки
        const pics = currentProduct.pictures || currentProduct.picture || [];
        const mainImg = document.querySelector('.gallery-main__image');
        if (mainImg && pics.length) {
            mainImg.src = pics[0];
            mainImg.onerror = () => mainImg.src = '/image/no-image.jpg';
        }
        
        // Миниатюры
        const thumbs = document.querySelector('.gallery-thumbs');
        if (thumbs && pics.length) {
            thumbs.innerHTML = pics.map((img, i) => `<div class="thumb ${i===0?'active':''}" data-img="${img}"><img src="${img}" onerror="this.src='/image/no-image.jpg'"></div>`).join('');
            document.querySelectorAll('.thumb').forEach(t => {
                t.addEventListener('click', function() {
                    document.querySelectorAll('.thumb').forEach(x => x.classList.remove('active'));
                    this.classList.add('active');
                    if (mainImg) mainImg.src = this.dataset.img;
                });
            });
        }
        
        // Особенности
        const features = document.getElementById('laminateFeatures');
        if (features) {
            features.innerHTML = `
                ${currentProduct.type ? `<span class="laminate-feature-tag">${currentProduct.type} класс</span>` : ''}
                ${currentProduct.thickness ? `<span class="laminate-feature-tag">${currentProduct.thickness} мм</span>` : ''}
                ${currentProduct.wear_class ? `<span class="laminate-feature-tag">Класс ${currentProduct.wear_class}</span>` : ''}
            `;
        }
        
        // Описание
        const desc = document.getElementById('description');
        if (desc) desc.innerHTML = `<h2>${currentProduct.name}</h2><div>${currentProduct.description || 'Описание отсутствует'}</div>`;
        
        // Характеристики
        const specs = document.querySelector('.laminate-specs-grid');
        if (specs) {
            specs.innerHTML = `
                <div class="laminate-spec-item"><h4>Толщина</h4><p>${currentProduct.thickness || '—'} мм</p></div>
                <div class="laminate-spec-item"><h4>Класс</h4><p>${currentProduct.type || '—'}</p></div>
                <div class="laminate-spec-item"><h4>Износостойкость</h4><p>${currentProduct.wear_class || '—'}</p></div>
                <div class="laminate-spec-item"><h4>Цвета</h4><p>${getColorsString(currentProduct.color)}</p></div>
            `;
        }
        
        // Кнопка конструктора
        const constrBtn = document.getElementById('constructorBtn');
        if (constrBtn) constrBtn.onclick = () => window.location.href = `laminate-constructor.html?product_id=${currentProduct.id}&product_name=${encodeURIComponent(currentProduct.name)}`;
        
        // Кнопка заказа
        const orderBtn = document.getElementById('orderBtn');
        if (orderBtn) orderBtn.onclick = () => openOrderModal();
        
        loadReviews();
        loadSimilar();
    } catch(e) { console.error(e); }
}

function openOrderModal() {
    const modal = document.getElementById('laminateOrderModal');
    if (!modal) return;
    
    document.getElementById('orderProductName').textContent = currentProduct.name;
    document.getElementById('orderProductPrice').textContent = formatPrice(currentProductPrice);
    const mainImg = document.querySelector('.gallery-main__image');
    if (mainImg) document.getElementById('orderProductImage').src = mainImg.src;
    
    document.getElementById('laminateOrderQuantity').value = 1;
    const pickup = document.querySelector('#laminateOrderModal input[name="laminateDelivery"][value="pickup"]');
    if (pickup) pickup.checked = true;
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

function closeModal() {
    const modal = document.getElementById('laminateOrderModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

document.getElementById('closeOrderModal')?.addEventListener('click', closeModal);
document.getElementById('cancelLaminateOrder')?.addEventListener('click', closeModal);

document.querySelector('#laminateOrderModal .qty-minus')?.addEventListener('click', () => {
    const input = document.getElementById('laminateOrderQuantity');
    let val = parseInt(input.value) || 1;
    if (val > 1) input.value = val - 1;
    updateTotal();
});

document.querySelector('#laminateOrderModal .qty-plus')?.addEventListener('click', () => {
    const input = document.getElementById('laminateOrderQuantity');
    let val = parseInt(input.value) || 1;
    if (val < 99) input.value = val + 1;
    updateTotal();
});

document.getElementById('laminateOrderQuantity')?.addEventListener('input', updateTotal);

document.querySelectorAll('#laminateOrderModal input[name="laminateDelivery"]').forEach(r => {
    r.addEventListener('change', () => {
        const isDelivery = document.querySelector('#laminateOrderModal input[name="laminateDelivery"]:checked')?.value !== 'pickup';
        document.getElementById('laminateDeliveryAddress').style.display = isDelivery ? 'block' : 'none';
        updateTotal();
    });
});

document.getElementById('laminateServiceWarranty')?.addEventListener('change', updateTotal);
document.getElementById('laminateServiceAssembly')?.addEventListener('change', updateTotal);

document.getElementById('submitLaminateOrder')?.addEventListener('click', async () => {
    if (!window.authManager?.currentUser) {
        alert('Войдите в систему');
        window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
        return;
    }
    
    const qty = parseInt(document.getElementById('laminateOrderQuantity').value) || 1;
    const deliveryType = document.querySelector('#laminateOrderModal input[name="laminateDelivery"]:checked')?.value;
    const address = document.getElementById('laminateAddressInput').value.trim();
    const saveAddr = document.getElementById('saveLaminateAddress').checked;
    const warranty = document.getElementById('laminateServiceWarranty').checked;
    const assembly = document.getElementById('laminateServiceAssembly').checked;
    
    if ((deliveryType === 'delivery' || deliveryType === 'installation') && !address) {
        alert('Укажите адрес доставки');
        return;
    }
    
    if (saveAddr && address) {
        try {
            const res = await window.apiClient.updateProfile({ address });
            if (res && window.authManager.currentUser) window.authManager.currentUser.address = res.address;
        } catch(e) {}
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
    
    closeModal();
    alert('✅ Товар добавлен в корзину!');
    if (window.cartManager) window.cartManager.updateCartCounter();
});

function updateTotal() {
    const qty = parseInt(document.getElementById('laminateOrderQuantity').value) || 1;
    const productTotal = currentProductPrice * qty;
    
    let deliveryCost = 0;
    const dt = document.querySelector('#laminateOrderModal input[name="laminateDelivery"]:checked')?.value;
    if (dt === 'delivery') deliveryCost = 500;
    if (dt === 'installation') deliveryCost = 1500;
    
    let servicesCost = 0;
    if (document.getElementById('laminateServiceWarranty')?.checked) servicesCost += 500;
    if (document.getElementById('laminateServiceAssembly')?.checked) servicesCost += 1000;
    
    const total = productTotal + deliveryCost + servicesCost;
    
    document.getElementById('summaryProduct').textContent = formatPrice(productTotal);
    document.getElementById('summaryDelivery').textContent = deliveryCost === 0 ? 'Бесплатно' : formatPrice(deliveryCost);
    document.getElementById('summaryServices').textContent = servicesCost === 0 ? '—' : formatPrice(servicesCost);
    document.getElementById('summaryTotal').textContent = formatPrice(total);
}

async function loadReviews() {
    try {
        const reviews = await window.apiClient.getReviews(currentProductId, true);
        const container = document.getElementById('reviewsList');
        if (!container) return;
        const approved = (reviews || []).filter(r => r.approved);
        if (!approved.length) {
            container.innerHTML = '<div class="no-reviews">Пока нет отзывов</div>';
            return;
        }
        container.innerHTML = approved.map(r => `<div class="review-item"><strong>${escapeHtml(r.author_name || 'Пользователь')}</strong><div>${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div><p>${escapeHtml(r.text)}</p><small>${new Date(r.created_at).toLocaleDateString()}</small></div>`).join('');
    } catch(e) {}
}

async function loadSimilar() {
    try {
        const res = await window.apiClient.getLaminate();
        const others = (res.items || []).filter(p => p.id !== currentProductId).slice(0, 4);
        const grid = document.getElementById('similarProductsGrid');
        if (!grid) return;
        if (!others.length) {
            document.getElementById('similarLoading')?.remove();
            document.getElementById('noSimilarProducts')?.style.display = 'block';
            return;
        }
        grid.innerHTML = others.map(p => `
            <div class="product-card similar-card">
                <div class="product-image-container">
                    <img src="${(p.pictures || p.picture)?.[0] || '/image/no-image.jpg'}" class="product-image" onclick="location.href='laminate-product.html?id=${p.id}'" onerror="this.src='/image/no-image.jpg'">
                </div>
                <div class="product-info">
                    <h3 class="product-title">${escapeHtml(p.name)}</h3>
                    <div class="laminate-price">${parsePrice(p.price).toLocaleString()} ₽ <span class="price-unit">за м²</span></div>
                    <a href="laminate-product.html?id=${p.id}" class="btn-details">Подробнее</a>
                </div>
            </div>
        `).join('');
        document.getElementById('similarLoading')?.remove();
    } catch(e) {}
}

function getColorsString(c) {
    if (!c) return '—';
    if (Array.isArray(c)) return c.join(', ');
    return c;
}

function parsePrice(p) { 
    if (!p) return 0; 
    const n = parseInt(p.toString().replace(/[^\d]/g, '')); 
    return isNaN(n) ? 0 : n; 
}

function formatPrice(p) { 
    return p.toLocaleString('ru-RU') + ' ₽'; 
}

function escapeHtml(t) { 
    if (!t) return ''; 
    const d = document.createElement('div'); 
    d.textContent = t; 
    return d.innerHTML; 
}