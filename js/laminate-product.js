// js/laminate-product.js - ГОТОВАЯ ВЕРСИЯ
let currentProduct = null;
let currentPrice = 0;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Страница ламината загружена');
    
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (!productId) {
        showError('Товар не найден');
        return;
    }
    
    await loadProduct(productId);
    initOrderModal();
});

async function loadProduct(productId) {
    try {
        const result = await window.apiClient.getProduct('laminate', productId);
        currentProduct = result;
        currentPrice = parsePrice(currentProduct.price);
        
        renderProduct();
        loadReviews();
        
    } catch (error) {
        console.error('Ошибка:', error);
        showError('Не удалось загрузить товар');
    }
}

function renderProduct() {
    const container = document.getElementById('productContainer');
    if (!container) return;
    
    const imageUrl = (currentProduct.pictures || currentProduct.picture)?.[0] || '/image/no-image.jpg';
    
    container.innerHTML = `
        <div class="product-gallery-section">
            <div class="product-gallery">
                <div class="gallery-main">
                    <img src="${imageUrl}" alt="${currentProduct.name}" id="mainImage" onerror="this.src='/image/no-image.jpg'">
                </div>
            </div>
        </div>
        <div class="product-info-section">
            <h1 class="product-title">${currentProduct.name || 'Ламинат'}</h1>
            <div class="product-sku">Код: ${currentProduct.id?.substring(0, 8)}</div>
            <div class="product-price-block">
                <div class="product-price">${formatPrice(currentPrice)} <span class="price-unit">за м²</span></div>
            </div>
            <div class="product-actions">
                <button class="btn btn--primary" id="orderBtn">🛒 Оформить заказ</button>
                <button class="btn btn--secondary" id="constructorBtn">🧮 В конструктор</button>
            </div>
        </div>
    `;
    
    document.getElementById('orderBtn')?.addEventListener('click', () => openOrderModal());
    document.getElementById('constructorBtn')?.addEventListener('click', () => {
        window.location.href = `laminate-constructor.html?product_id=${currentProduct.id}&product_name=${encodeURIComponent(currentProduct.name)}`;
    });
}

function initOrderModal() {
    // Закрытие
    document.getElementById('closeModalBtn')?.addEventListener('click', closeOrderModal);
    document.getElementById('cancelModalBtn')?.addEventListener('click', closeOrderModal);
    
    // Количество
    document.getElementById('qtyMinus')?.addEventListener('click', () => changeQty(-1));
    document.getElementById('qtyPlus')?.addEventListener('click', () => changeQty(1));
    document.getElementById('orderQty')?.addEventListener('input', updateTotal);
    
    // Доставка
    document.querySelectorAll('input[name="deliveryType"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const isDelivery = document.querySelector('input[name="deliveryType"]:checked')?.value !== 'pickup';
            document.getElementById('addressBlock').style.display = isDelivery ? 'block' : 'none';
            updateTotal();
        });
    });
    
    // Услуги
    document.getElementById('serviceWarranty')?.addEventListener('change', updateTotal);
    document.getElementById('serviceAssembly')?.addEventListener('change', updateTotal);
    
    // Отправка
    document.getElementById('submitOrderBtn')?.addEventListener('click', submitOrder);
    
    // Подтягиваем адрес из профиля
    setTimeout(() => {
        const user = window.authManager?.currentUser;
        if (user?.address) {
            document.getElementById('deliveryAddress').value = user.address;
            document.getElementById('saveAddressChk').checked = true;
        }
    }, 500);
}

function openOrderModal() {
    const modal = document.getElementById('orderModal');
    if (!modal) return;
    
    // Заполняем данные
    document.getElementById('modalProductName').textContent = currentProduct.name;
    document.getElementById('modalProductPrice').textContent = formatPrice(currentPrice);
    const mainImage = document.getElementById('mainImage');
    if (mainImage) document.getElementById('modalProductImage').src = mainImage.src;
    
    // Сброс
    document.getElementById('orderQty').value = 1;
    document.querySelector('input[name="deliveryType"][value="pickup"]').checked = true;
    document.getElementById('addressBlock').style.display = 'none';
    document.getElementById('serviceWarranty').checked = false;
    document.getElementById('serviceAssembly').checked = false;
    
    // Подтягиваем адрес
    const user = window.authManager?.currentUser;
    if (user?.address) {
        document.getElementById('deliveryAddress').value = user.address;
        document.getElementById('saveAddressChk').checked = true;
    }
    
    updateTotal();
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeOrderModal() {
    const modal = document.getElementById('orderModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function changeQty(delta) {
    const input = document.getElementById('orderQty');
    let val = parseInt(input.value) || 1;
    val = Math.max(1, Math.min(99, val + delta));
    input.value = val;
    updateTotal();
}

function updateTotal() {
    const qty = parseInt(document.getElementById('orderQty').value) || 1;
    const productTotal = currentPrice * qty;
    
    let deliveryCost = 0;
    const deliveryType = document.querySelector('input[name="deliveryType"]:checked')?.value;
    if (deliveryType === 'delivery') deliveryCost = 500;
    if (deliveryType === 'installation') deliveryCost = 1500;
    
    let servicesCost = 0;
    if (document.getElementById('serviceWarranty')?.checked) servicesCost += 500;
    if (document.getElementById('serviceAssembly')?.checked) servicesCost += 1000;
    
    const total = productTotal + deliveryCost + servicesCost;
    
    document.getElementById('totalProduct').textContent = formatPrice(productTotal);
    document.getElementById('totalDelivery').textContent = deliveryCost === 0 ? 'Бесплатно' : formatPrice(deliveryCost);
    document.getElementById('totalServices').textContent = servicesCost === 0 ? '—' : formatPrice(servicesCost);
    document.getElementById('totalAmount').textContent = formatPrice(total);
}

async function submitOrder() {
    if (!window.authManager?.currentUser) {
        alert('Для оформления заказа необходимо войти в систему');
        window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
        return;
    }
    
    const qty = parseInt(document.getElementById('orderQty').value) || 1;
    const deliveryType = document.querySelector('input[name="deliveryType"]:checked')?.value;
    const address = document.getElementById('deliveryAddress').value.trim();
    const saveAddress = document.getElementById('saveAddressChk').checked;
    const warranty = document.getElementById('serviceWarranty').checked;
    const assembly = document.getElementById('serviceAssembly').checked;
    
    if ((deliveryType === 'delivery' || deliveryType === 'installation') && !address) {
        alert('Укажите адрес доставки');
        return;
    }
    
    // Сохраняем адрес
    if (saveAddress && address) {
        try {
            await window.apiClient.updateProfile({ address: address });
            if (window.authManager.currentUser) window.authManager.currentUser.address = address;
        } catch (e) { console.warn(e); }
    }
    
    // Добавляем в корзину
    const cartItem = {
        id: currentProduct.id,
        name: currentProduct.name,
        price: currentPrice,
        quantity: qty,
        image: document.getElementById('modalProductImage')?.src || '',
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

function parsePrice(price) {
    if (!price) return 0;
    const num = parseInt(price.toString().replace(/[^\d]/g, ''));
    return isNaN(num) ? 0 : num;
}

function formatPrice(price) {
    return price.toLocaleString('ru-RU') + ' ₽';
}

function showError(msg) {
    const container = document.getElementById('productContainer');
    if (container) container.innerHTML = `<div class="error">${msg}</div>`;
}

async function loadReviews() {
    try {
        const reviews = await window.apiClient.getReviews(currentProduct.id, true);
        const container = document.querySelector('.reviews-list');
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
                <strong>${r.author_name || 'Пользователь'}</strong>
                <div>${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
                <p>${r.text}</p>
                <small>${new Date(r.created_at).toLocaleDateString()}</small>
            </div>
        `).join('');
        
    } catch (e) {
        console.warn('Отзывы не загружены');
    }
}