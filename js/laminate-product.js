// js/laminate-product.js - ПЕРЕПИСАННАЯ ВЕРСИЯ (без PocketBase)

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
            throw new Error('API клиент не инициализирован');
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
    
    createPageStructure();
    fillBasicInfo();
    setupGallery();
    fillSpecifications();
    fillDescription();
    initTabs();
    initOrderModal();
    initConstructorButton();
}

// Создание структуры страницы
function createPageStructure() {
    const productMain = document.querySelector('.product-main');
    if (!productMain) return;
    
    let productMainInner = document.querySelector('.product-main__inner');
    
    if (!productMainInner) {
        productMainInner = document.createElement('div');
        productMainInner.className = 'product-main__inner';
        
        const container = productMain.querySelector('.container');
        if (container) {
            container.innerHTML = '';
            container.appendChild(productMainInner);
        } else {
            const newContainer = document.createElement('div');
            newContainer.className = 'container';
            newContainer.appendChild(productMainInner);
            productMain.appendChild(newContainer);
        }
    }
    
    productMainInner.innerHTML = `
        <div class="product-gallery-section">
            <div class="product-gallery" id="productGallery">
                <div class="gallery-thumbs" id="galleryThumbs"></div>
                <div class="gallery-main">
                    <img src="" alt="" class="gallery-main__image" id="mainImage">
                </div>
            </div>
            <div class="laminate-features-tags" id="laminateFeatures"></div>
        </div>
        <div class="product-info-section">
            <h1 class="product-title" id="productTitle">${escapeHtml(currentProduct.name || 'Загрузка...')}</h1>
            <div class="product-sku" id="productSku">Код: ${currentProduct.id?.substring(0, 8) || '---'}</div>
            
            <div class="product-price-block">
                <div class="laminate-price" id="productPrice">
                    <span class="price-current">${formatPrice(currentProductPrice)}</span>
                    <span class="price-unit">за м²</span>
                </div>
            </div>

            <div class="product-actions" id="productActions">
                <button class="btn btn--primary" id="orderBtn">🛒 Оформить заказ</button>
                <button class="btn btn--secondary" id="constructorBtn">🧮 В конструктор</button>
            </div>

            <div class="product-features">
                <div class="feature"><div class="feature-icon"><img src="/image/icon/thuislevering.png" alt="Грузовик"></div><div class="feature-text">Бесплатная доставка по Новгороду</div></div>
                <div class="feature"><div class="feature-icon"><img src="/image/icon/flash.png" alt="Молния"></div><div class="feature-text">Укладка за 1 день</div></div>
                <div class="feature"><div class="feature-icon"><img src="/image/icon/shield.png" alt="Щит"></div><div class="feature-text">Гарантия 5 лет</div></div>
            </div>
        </div>
    `;
}

// Заполнение основной информации
function fillBasicInfo() {
    const titleEl = document.getElementById('productTitle');
    const skuEl = document.getElementById('productSku');
    const priceEl = document.getElementById('productPrice');
    const featuresEl = document.getElementById('laminateFeatures');
    
    if (titleEl) titleEl.textContent = currentProduct.name || 'Ламинат без названия';
    if (skuEl) skuEl.textContent = `Код: ${currentProduct.id?.substring(0, 8) || '---'}`;
    
    if (priceEl) {
        if (currentProductPrice > 0) {
            priceEl.innerHTML = `<span class="price-current">${formatPrice(currentProductPrice)}</span><span class="price-unit">за м²</span>`;
        } else {
            priceEl.innerHTML = '<div class="price-on-request">Цена по запросу</div>';
        }
    }
    
    // Особенности ламината
    if (featuresEl) {
        let featuresHTML = '';
        if (currentProduct.type) featuresHTML += `<span class="laminate-feature-tag">${escapeHtml(currentProduct.type)} класс</span>`;
        if (currentProduct.thickness) featuresHTML += `<span class="laminate-feature-tag">${escapeHtml(currentProduct.thickness)} мм</span>`;
        if (currentProduct.wear_class) featuresHTML += `<span class="laminate-feature-tag">Класс ${escapeHtml(currentProduct.wear_class)}</span>`;
        featuresEl.innerHTML = featuresHTML;
    }
    
    // Кнопки
    document.getElementById('orderBtn')?.addEventListener('click', openOrderModal);
}

// Настройка галереи
function setupGallery() {
    const galleryThumbs = document.getElementById('galleryThumbs');
    const mainImage = document.getElementById('mainImage');
    
    if (!galleryThumbs || !mainImage) return;
    
    const pictures = currentProduct.pictures || currentProduct.picture || [];
    const pictureList = Array.isArray(pictures) ? pictures : [];
    
    if (pictureList.length === 0) {
        mainImage.src = '/image/no-image.jpg';
        mainImage.alt = currentProduct.name || 'Нет изображения';
        galleryThumbs.innerHTML = '<p>Изображения отсутствуют</p>';
        return;
    }
    
    mainImage.src = pictureList[0];
    mainImage.alt = currentProduct.name || 'Изображение ламината';
    
    galleryThumbs.innerHTML = '';
    
    pictureList.forEach((imgUrl, index) => {
        const thumbElement = document.createElement('div');
        thumbElement.className = `thumb ${index === 0 ? 'active' : ''}`;
        thumbElement.innerHTML = `<img src="${imgUrl}" alt="${currentProduct.name} - ${index + 1}" loading="lazy" onerror="this.src='/image/no-image.jpg'">`;
        thumbElement.addEventListener('click', () => {
            document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
            thumbElement.classList.add('active');
            mainImage.src = imgUrl;
        });
        galleryThumbs.appendChild(thumbElement);
    });
}

// Заполнение характеристик
function fillSpecifications() {
    const specsGrid = document.querySelector('#specifications .laminate-specs-grid');
    if (!specsGrid) return;
    
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

function getMoistureResistance(thickness) {
    if (!thickness) return 'Не указана';
    const thickNum = parseInt(thickness);
    if (isNaN(thickNum)) return 'Не указана';
    if (thickNum >= 12) return 'Высокая (до 72 часов)';
    if (thickNum >= 10) return 'Средняя (до 48 часов)';
    return 'Базовая (до 24 часов)';
}

// Заполнение описания
function fillDescription() {
    const descriptionTab = document.getElementById('description');
    if (!descriptionTab) return;
    
    let descriptionHTML = `
        <h2>${escapeHtml(currentProduct.name || 'Ламинат')}</h2>
        <div class="product-description-content">
            ${currentProduct.description ? `<div class="description-text">${currentProduct.description.replace(/\r\n/g, '<br>').replace(/\n/g, '<br>')}</div>` : '<p>Описание отсутствует</p>'}
    `;
    
    const colorsHTML = getColorChipsHTML(currentProduct.color);
    if (colorsHTML) {
        descriptionHTML += `<div class="colors-section"><h3>Доступные цвета и текстуры:</h3><div class="color-chips laminate-colors">${colorsHTML}</div></div>`;
    }
    
    descriptionHTML += `</div>`;
    descriptionTab.innerHTML = descriptionHTML;
}

function getColorChipsHTML(colorData) {
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
    
    colors = colors.filter(c => c);
    if (colors.length === 0) return '';
    
    return colors.map(color => {
        const hexColor = getLaminateColorHex(color);
        return `<div class="color-chip laminate-color-chip" title="${escapeHtml(color)}"><div class="color-sample" style="background-color: ${hexColor};"></div><span class="color-name">${escapeHtml(color)}</span></div>`;
    }).join('');
}

function getLaminateColorHex(colorName) {
    const colorMap = {
        'дуб': '#D2B48C', 'дуб светлый': '#E8D0A9', 'дуб темный': '#8B4513',
        'орех': '#773F1A', 'ясень': '#F5EBDC', 'ясень серый': '#D3D3D3',
        'бук': '#DEB887', 'венге': '#3C2F23', 'белый': '#FFFFFF',
        'черный': '#000000', 'серый': '#808080', 'бежевый': '#F5F5DC',
        'коричневый': '#8B4513', 'под камень': '#C0C0C0', 'под бетон': '#A9A9A9'
    };
    
    const lowerName = colorName.toString().toLowerCase().trim();
    if (colorMap[lowerName]) return colorMap[lowerName];
    
    for (const [name, hex] of Object.entries(colorMap)) {
        if (lowerName.includes(name) || name.includes(lowerName)) return hex;
    }
    
    let hash = 0;
    for (let i = 0; i < colorName.length; i++) hash = colorName.charCodeAt(i) + ((hash << 5) - hash);
    return `hsl(${(hash % 30) + 25}, ${(hash % 40) + 40}%, ${(hash % 30) + 50}%)`;
}

// Инициализация табов
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    if (tabButtons.length === 0) return;
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            tabPanes.forEach(pane => pane.classList.remove('active'));
            const activePane = document.getElementById(tabId);
            if (activePane) activePane.classList.add('active');
        });
    });
    
    const firstTab = tabButtons[0];
    if (firstTab) {
        firstTab.classList.add('active');
        const firstPane = document.getElementById(firstTab.getAttribute('data-tab'));
        if (firstPane) firstPane.classList.add('active');
    }
}

// Кнопка конструктора
function initConstructorButton() {
    const constructorBtn = document.getElementById('constructorBtn');
    if (constructorBtn) {
        constructorBtn.addEventListener('click', () => {
            window.location.href = `laminate-constructor.html?product_id=${currentProduct.id}&product_name=${encodeURIComponent(currentProduct.name)}`;
        });
    }
}

// Загрузка отзывов
async function loadReviews() {
    const reviewsList = document.querySelector('#reviews .reviews-list');
    if (!reviewsList) return;
    
    try {
        const reviews = await window.apiClient.getReviews(currentProductId, true);
        
        let html = '';
        let canReview = false;
        let statusText = '🔒 Отзыв только для купивших товар';
        
        if (window.authManager?.isAuthenticated()) {
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

// Загрузка похожих товаров
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
            const card = createSimilarCard(product);
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

function createSimilarCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card similar-card';
    
    const imageUrl = (product.pictures || product.picture)?.[0] || '/image/no-image.jpg';
    const priceValue = product.price || product.prise;
    const priceDisplay = priceValue ? `${parsePrice(priceValue).toLocaleString()} ₽` : 'Цена по запросу';
    
    card.innerHTML = `
        <div class="product-image-container">
            <img src="${imageUrl}" alt="${escapeHtml(product.name)}" class="product-image" loading="lazy" onerror="this.src='/image/no-image.jpg'" onclick="window.location.href='laminate-product.html?id=${product.id}'">
        </div>
        <div class="product-info">
            <h3 class="product-title">${escapeHtml(product.name)}</h3>
            <div class="product-meta">
                ${product.type ? `<span class="product-type">${escapeHtml(product.type)}</span>` : ''}
                ${product.thickness ? `<span class="product-thickness">${escapeHtml(product.thickness)} мм</span>` : ''}
                ${product.wear_class ? `<span class="product-class">${escapeHtml(product.wear_class)} класс</span>` : ''}
            </div>
            <div class="laminate-price">${priceDisplay} <span class="price-unit">за м²</span></div>
            <div class="product-actions">
                <a href="laminate-product.html?id=${product.id}" class="btn-details">Подробнее</a>
            </div>
        </div>
    `;
    
    return card;
}

// ============ МОДАЛЬНОЕ ОКНО ЗАКАЗА ============
function initOrderModal() {
    console.log('🎯 Инициализация модального окна заказа для ламината');
    
    const orderBtn = document.getElementById('orderBtn');
    if (orderBtn) {
        const newBtn = orderBtn.cloneNode(true);
        orderBtn.parentNode.replaceChild(newBtn, orderBtn);
        
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🛒 Кнопка заказа нажата');
            openOrderModal();
        });
        console.log('✅ Обработчик кнопки заказа установлен');
    }
    
    // Закрытие модального окна — ПРАВИЛЬНЫЕ ID
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
    
    // Отправка
    document.getElementById('submitLaminateOrder')?.addEventListener('click', submitOrder);
    
    // Подтягиваем адрес
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
    console.log('📦 Открытие модального окна заказа');
    
    const modal = document.getElementById('laminateOrderModal');
    if (!modal) {
        console.error('❌ Модальное окно #laminateOrderModal не найдено');
        return;
    }
    
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
    
    document.getElementById('laminateServiceWarranty').checked = false;
    document.getElementById('laminateServiceAssembly').checked = false;
    
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

function createOrderModal() {
    console.log('🏗️ Создаем модальное окно заказа');
    
    const modalHTML = `
        <div id="orderModal" class="modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; justify-content: center; align-items: center;">
            <div style="background: white; border-radius: 10px; max-width: 500px; width: 90%; padding: 20px;">
                <div style="display: flex; justify-content: space-between;">
                    <h3>Оформление заказа</h3>
                    <button id="closeOrderModalBtn" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
                </div>
                <div id="orderModalBody">
                    <div class="product-summary" style="display: flex; gap: 15px; margin-bottom: 20px;">
                        <img id="orderProductImage" src="" style="width: 80px; height: 80px; object-fit: cover;">
                        <div>
                            <h4 id="orderProductName"></h4>
                            <div id="orderProductPrice"></div>
                            <div class="product-quantity" style="display: flex; gap: 10px; margin-top: 10px;">
                                <button class="qty-minus">-</button>
                                <input type="number" id="orderQuantity" value="1" min="1" max="99" style="width: 60px; text-align: center;">
                                <button class="qty-plus">+</button>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <h4>Способ получения</h4>
                        <label><input type="radio" name="delivery" value="pickup" checked> Самовывоз (бесплатно)</label><br>
                        <label><input type="radio" name="delivery" value="delivery"> Доставка (500 ₽)</label><br>
                        <label><input type="radio" name="delivery" value="installation"> Доставка и установка (1500 ₽)</label>
                    </div>
                    
                    <div id="deliveryAddress" style="display: none; margin-bottom: 20px;">
                        <h4>Адрес доставки</h4>
                        <textarea id="addressInput" rows="2" style="width: 100%;" placeholder="Введите адрес доставки..."></textarea>
                        <label><input type="checkbox" id="saveAddressCheckbox"> Сохранить адрес в профиле</label>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <h4>Дополнительные услуги</h4>
                        <label><input type="checkbox" id="serviceWarranty"> Расширенная гарантия (+500 ₽)</label><br>
                        <label><input type="checkbox" id="serviceAssembly"> Дополнительный монтаж (+1000 ₽)</label>
                    </div>
                    
                    <div style="margin-bottom: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px;">
                        <h4>Итого:</h4>
                        <div>Товар: <span id="summaryProduct">0 ₽</span></div>
                        <div>Доставка: <span id="summaryDelivery">0 ₽</span></div>
                        <div>Услуги: <span id="summaryServices">0 ₽</span></div>
                        <div style="font-size: 20px; font-weight: bold;">К оплате: <span id="summaryTotal">0 ₽</span></div>
                    </div>
                    
                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button id="cancelOrder" style="padding: 10px 20px; background: #f0f0f0; border: none; border-radius: 5px;">Отмена</button>
                        <button id="submitOrder" style="padding: 10px 20px; background: #27ae60; color: white; border: none; border-radius: 5px;">Добавить в корзину</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Привязываем обработчики
    document.getElementById('closeOrderModalBtn')?.addEventListener('click', closeOrderModal);
    document.getElementById('cancelOrder')?.addEventListener('click', closeOrderModal);
    document.getElementById('submitOrder')?.addEventListener('click', submitOrder);
    
    document.querySelector('.qty-minus')?.addEventListener('click', () => changeQuantity(-1));
    document.querySelector('.qty-plus')?.addEventListener('click', () => changeQuantity(1));
    document.getElementById('orderQuantity')?.addEventListener('input', updateOrderSummary);
    
    document.querySelectorAll('input[name="delivery"]').forEach(radio => {
        radio.addEventListener('change', () => {
            handleDeliveryChange();
            updateOrderSummary();
        });
    });
    
    document.getElementById('serviceWarranty')?.addEventListener('change', updateOrderSummary);
    document.getElementById('serviceAssembly')?.addEventListener('change', updateOrderSummary);
}

function fillOrderModal() {
    document.getElementById('orderProductName').textContent = currentProduct?.name || 'Ламинат';
    document.getElementById('orderProductPrice').textContent = formatPrice(currentProductPrice);
    
    const mainImage = document.getElementById('mainImage');
    if (mainImage?.src) {
        document.getElementById('orderProductImage').src = mainImage.src;
    }
}

function resetModalValues() {
    const quantityInput = document.getElementById('orderQuantity');
    if (quantityInput) quantityInput.value = 1;
    
    const pickupRadio = document.querySelector('input[name="delivery"][value="pickup"]');
    if (pickupRadio) pickupRadio.checked = true;
    
    const warrantyCheckbox = document.getElementById('serviceWarranty');
    if (warrantyCheckbox) warrantyCheckbox.checked = false;
    
    const assemblyCheckbox = document.getElementById('serviceAssembly');
    if (assemblyCheckbox) assemblyCheckbox.checked = false;
    
    const addressInput = document.getElementById('addressInput');
    if (addressInput) addressInput.value = '';
    
    const deliveryAddress = document.getElementById('deliveryAddress');
    if (deliveryAddress) deliveryAddress.style.display = 'none';
}

function setupOrderModalHandlers() {
    document.querySelector('.qty-minus')?.addEventListener('click', () => changeQuantity(-1));
    document.querySelector('.qty-plus')?.addEventListener('click', () => changeQuantity(1));
    document.getElementById('orderQuantity')?.addEventListener('input', () => {
        updateProductPriceDisplay();
        updateOrderSummary();
    });
    
    document.querySelectorAll('input[name="delivery"]').forEach(radio => {
        radio.addEventListener('change', () => {
            handleDeliveryChange();
            updateOrderSummary();
        });
    });
    
    document.getElementById('serviceWarranty')?.addEventListener('change', updateOrderSummary);
    document.getElementById('serviceAssembly')?.addEventListener('change', updateOrderSummary);
    
    document.getElementById('submitOrder')?.addEventListener('click', submitOrder);
    
    setTimeout(() => handleDeliveryChange(), 100);
}

function changeQuantity(delta) {
    const input = document.getElementById('orderQuantity');
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
    const quantity = parseInt(document.getElementById('orderQuantity')?.value) || 1;
    const total = currentProductPrice * quantity;
    const priceElement = document.getElementById('orderProductPrice');
    if (priceElement) priceElement.textContent = formatPrice(total);
}

function handleDeliveryChange() {
    const deliveryType = document.querySelector('input[name="delivery"]:checked')?.value;
    const addressContainer = document.getElementById('deliveryAddress');
    
    if (addressContainer) {
        addressContainer.style.display = (deliveryType === 'delivery' || deliveryType === 'installation') ? 'block' : 'none';
    }
}

function updateOrderSummary() {
    const quantity = parseInt(document.getElementById('orderQuantity')?.value) || 1;
    const productTotal = currentProductPrice * quantity;
    
    let deliveryCost = 0;
    const deliveryRadio = document.querySelector('input[name="delivery"]:checked');
    if (deliveryRadio) {
        if (deliveryRadio.value === 'delivery') deliveryCost = 500;
        if (deliveryRadio.value === 'installation') deliveryCost = 1500;
    }
    
    let servicesCost = 0;
    if (document.getElementById('serviceWarranty')?.checked) servicesCost += 500;
    if (document.getElementById('serviceAssembly')?.checked) servicesCost += 1000;
    
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

function closeOrderModal() {
    const modal = document.getElementById('orderModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

async function submitOrder() {
    console.log('📦 Отправка заказа (ламинат)...');
    
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
    
    // ============ СОХРАНЯЕМ АДРЕС (как в product.js) ============
    if (saveAddress && address) {
        try {
            const result = await window.apiClient.updateProfile({ address: address });
            if (result && result.address) {
                if (window.authManager.currentUser) window.authManager.currentUser.address = result.address;
                console.log('✅ Адрес сохранен в профиль:', result.address);
            } else {
                console.log('✅ Адрес сохранен (ответ не содержит address)');
            }
        } catch (error) {
            console.warn('⚠️ Не удалось сохранить адрес:', error);
            // Не прерываем добавление в корзину, если не удалось сохранить адрес
        }
    }
    // ============================================================
    
    const submitBtn = document.getElementById('submitLaminateOrder');
    if (submitBtn) {
        submitBtn.textContent = '🔄 Добавление...';
        submitBtn.disabled = true;
    }
    
    try {
        const cartItem = {
            id: currentProduct.id,
            name: currentProduct.name,
            price: currentProductPrice,
            quantity: qty,
            image: document.getElementById('orderProductImage')?.src || '',
            code: currentProduct.id.substring(0, 8),
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
        
        // Проверяем есть ли уже такой товар с такими же опциями
        const existingIndex = cart.findIndex(item => 
            item.id === currentProduct.id && 
            item.collection === 'laminate' &&
            item.delivery_type === deliveryType &&
            item.warranty_service === warranty &&
            item.assembly_service === assembly
        );
        
        if (existingIndex !== -1) {
            cart[existingIndex].quantity += qty;
        } else {
            cart.push(cartItem);
        }
        
        localStorage.setItem(cartKey, JSON.stringify(cart));
        
        // Обновляем счетчик корзины если есть
        if (window.cartManager) window.cartManager.updateCartCounter();
        
        closeOrderModal();
        alert('✅ Товар добавлен в корзину!');
        
    } catch (error) {
        console.error('Ошибка:', error);
        alert('❌ Ошибка добавления в корзину');
    } finally {
        if (submitBtn) {
            submitBtn.textContent = 'Добавить в корзину';
            submitBtn.disabled = false;
        }
    }
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

function closeOrderModal() {
    const modal = document.getElementById('orderModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// ============ МОДАЛЬНОЕ ОКНО ОТЗЫВА ============

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
    const productMain = document.querySelector('.product-main');
    if (productMain && !productMain.querySelector('.loading-container')) {
        productMain.innerHTML = `<div class="loading-container"><div class="spinner"></div><p>Загрузка информации о ламинате...</p></div>`;
    }
}

function hideLoading() {
    const loading = document.querySelector('.loading-container');
    if (loading) loading.remove();
}

function showError(message) {
    const productPage = document.querySelector('.product-page');
    if (productPage) {
        productPage.innerHTML = `<div class="error-container"><h2>Ошибка</h2><p>${message}</p><div class="error-actions"><a href="catalog.html" class="btn btn--primary">Вернуться в каталог</a><button onclick="location.reload()" class="btn btn--secondary">Обновить страницу</button></div></div>`;
    }
}