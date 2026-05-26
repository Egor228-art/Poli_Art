// js/product.js - ПЕРЕПИСАННАЯ ВЕРСИЯ (без PocketBase)

let currentProduct = null;
let currentProductPrice = 0;
let currentProductId = null;
let isLaminateMode = false;

// Инициализация
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Инициализация страницы товара...');
    
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
    console.log('Загрузка товара:', currentProductId);
    
    showLoading();
    
    try {
        if (!window.apiClient) {
            throw new Error('API клиент не инициализирован');
        }
        
        // Пробуем загрузить из дверей
        try {
            currentProduct = await window.apiClient.getProduct('doors', currentProductId);
            isLaminateMode = false;
            console.log('Товар загружен из коллекции doors');
        } catch (doorsError) {
            // Если не нашли в дверях, пробуем в ламинате
            try {
                currentProduct = await window.apiClient.getProduct('laminate', currentProductId);
                isLaminateMode = true;
                console.log('Товар загружен из коллекции laminate');
            } catch (laminateError) {
                throw new Error('Товар не найден');
            }
        }
        
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
        console.error('Ошибка загрузки товара:', error);
        showError('Не удалось загрузить информацию о товаре');
    } finally {
        hideLoading();
    }
}

// Рендеринг страницы товара
function renderProductPage() {
    console.log('Рендеринг страницы товара...');
    
    // Создаем структуру если её нет
    createPageStructure();
    
    // Заполняем основную информацию
    fillBasicInfo();
    
    // Настраиваем галерею
    setupGallery();
    
    // Заполняем характеристики
    fillSpecifications();
    
    // Заполняем описание
    fillDescription();
    
    // Инициализируем табы
    initTabs();
    
    // Инициализируем модальное окно заказа
    initOrderModal();
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
        </div>
        <div class="product-info-section">
            <h1 class="product-title" id="productTitle">${escapeHtml(currentProduct.name || 'Загрузка...')}</h1>
            <div class="product-sku" id="productSku">Код: ${currentProduct.id?.substring(0, 8) || '---'}</div>
            
            <div class="product-price-block">
                <div class="product-price" id="productPrice">
                    <span class="price-current">${formatPrice(currentProductPrice)}</span>
                </div>
            </div>

            <div class="product-actions" id="productActions">
                <button class="btn btn--primary" id="orderBtn">🛒 Оформить заказ</button>
                ${isLaminateMode ? '<button class="btn btn--secondary" id="constructorBtn">🧮 В конструктор</button>' : ''}
            </div>

            <div class="product-features" id="productFeatures">
                <div class="feature"><div class="feature-icon"><img src="/image/icon/thuislevering.png" alt="Грузовик"></div><div class="feature-text">Бесплатная доставка по Новгороду</div></div>
                <div class="feature"><div class="feature-icon"><img src="/image/icon/flash.png" alt="Молния"></div><div class="feature-text">Установка за 1 день</div></div>
                <div class="feature"><div class="feature-icon"><img src="/image/icon/shield.png" alt="Щит"></div><div class="feature-text">Гарантия 3 года</div></div>
            </div>
        </div>
    `;
    
    // Обработчики кнопок
    document.getElementById('orderBtn')?.addEventListener('click', openOrderModal);
    if (isLaminateMode) {
        document.getElementById('constructorBtn')?.addEventListener('click', () => {
            window.location.href = `laminate-constructor.html?product_id=${currentProduct.id}&product_name=${encodeURIComponent(currentProduct.name)}`;
        });
    }
}

// Заполнение основной информации
function fillBasicInfo() {
    const titleEl = document.getElementById('productTitle');
    const skuEl = document.getElementById('productSku');
    const priceEl = document.getElementById('productPrice');
    
    if (titleEl) titleEl.textContent = currentProduct.name || 'Без названия';
    if (skuEl) skuEl.textContent = `Код: ${currentProduct.id?.substring(0, 8) || '---'}`;
    if (priceEl) {
        if (currentProductPrice > 0) {
            priceEl.innerHTML = `<span class="price-current">${formatPrice(currentProductPrice)}</span>`;
        } else {
            priceEl.innerHTML = '<div class="price-on-request">Цена по запросу</div>';
        }
    }
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
    mainImage.alt = currentProduct.name || 'Изображение товара';
    
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
    const specsTable = document.querySelector('#specifications .specs-table');
    if (!specsTable) return;
    
    let specsHTML = '';
    
    if (isLaminateMode) {
        specsHTML = `
            <div class="spec-row"><div class="spec-name">Название</div><div class="spec-value">${escapeHtml(currentProduct.name || 'Не указано')}</div></div>
            ${currentProduct.type ? `<div class="spec-row"><div class="spec-name">Класс</div><div class="spec-value">${escapeHtml(currentProduct.type)}</div></div>` : ''}
            ${currentProduct.thickness ? `<div class="spec-row"><div class="spec-name">Толщина</div><div class="spec-value">${escapeHtml(currentProduct.thickness)} мм</div></div>` : ''}
            ${currentProduct.wear_class ? `<div class="spec-row"><div class="spec-name">Класс износостойкости</div><div class="spec-value">${escapeHtml(currentProduct.wear_class)}</div></div>` : ''}
            ${currentProduct.color ? `<div class="spec-row"><div class="spec-name">Цвета</div><div class="spec-value">${getFormattedColors(currentProduct.color)}</div></div>` : ''}
            ${currentProduct.number_id ? `<div class="spec-row"><div class="spec-name">Артикул</div><div class="spec-value">${escapeHtml(currentProduct.number_id)}</div></div>` : ''}
        `;
    } else {
        specsHTML = `
            <div class="spec-row"><div class="spec-name">Название</div><div class="spec-value">${escapeHtml(currentProduct.name || 'Не указано')}</div></div>
            ${currentProduct.type ? `<div class="spec-row"><div class="spec-name">Тип двери</div><div class="spec-value">${escapeHtml(currentProduct.type)}</div></div>` : ''}
            ${currentProduct.material ? `<div class="spec-row"><div class="spec-name">Материал</div><div class="spec-value">${escapeHtml(currentProduct.material)}</div></div>` : ''}
            ${currentProduct.style ? `<div class="spec-row"><div class="spec-name">Стиль</div><div class="spec-value">${escapeHtml(currentProduct.style)}</div></div>` : ''}
            ${currentProduct.color ? `<div class="spec-row"><div class="spec-name">Цвета</div><div class="spec-value">${getFormattedColors(currentProduct.color)}</div></div>` : ''}
            ${currentProduct.number_id ? `<div class="spec-row"><div class="spec-name">Артикул</div><div class="spec-value">${escapeHtml(currentProduct.number_id)}</div></div>` : ''}
        `;
    }
    
    specsTable.innerHTML = specsHTML;
}

// Заполнение описания
function fillDescription() {
    const descriptionTab = document.getElementById('description');
    if (!descriptionTab) return;
    
    let descriptionHTML = `
        <h2>${escapeHtml(currentProduct.name || 'Описание товара')}</h2>
        <div class="product-description-content">
            ${currentProduct.description ? `<div class="description-text">${currentProduct.description.replace(/\r\n/g, '<br>').replace(/\n/g, '<br>')}</div>` : '<p>Описание отсутствует</p>'}
    `;
    
    const colorsHTML = getColorChipsHTML(currentProduct.color);
    if (colorsHTML) {
        descriptionHTML += `<div class="colors-section"><h3>Доступные цвета:</h3><div class="color-chips">${colorsHTML}</div></div>`;
    }
    
    descriptionHTML += `</div>`;
    descriptionTab.innerHTML = descriptionHTML;
}

// Получение цветов для отображения
function getFormattedColors(colorData) {
    if (!colorData) return 'Не указан';
    
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
    return colors.length > 0 ? colors.join(', ') : 'Не указан';
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
        const hexColor = getColorHex(color);
        return `<div class="color-chip" title="${escapeHtml(color)}"><div class="color-sample" style="background-color: ${hexColor};"></div><span class="color-name">${escapeHtml(color)}</span></div>`;
    }).join('');
}

function getColorHex(colorName) {
    const colorMap = {
        'белый': '#FFFFFF', 'черный': '#000000', 'чёрный': '#000000',
        'серый': '#808080', 'коричневый': '#8B4513', 'дуб': '#C19A6B',
        'орех': '#773F1A', 'ясень': '#F5EBDC', 'бук': '#F5E1C8',
        'венге': '#645452', 'бежевый': '#F5F5DC', 'золотой': '#FFD700'
    };
    
    const lowerName = colorName.toString().toLowerCase().trim();
    if (colorMap[lowerName]) return colorMap[lowerName];
    
    for (const [name, hex] of Object.entries(colorMap)) {
        if (lowerName.includes(name) || name.includes(lowerName)) return hex;
    }
    
    let hash = 0;
    for (let i = 0; i < colorName.length; i++) hash = colorName.charCodeAt(i) + ((hash << 5) - hash);
    return `hsl(${(hash % 30) + 20}, ${(hash % 30) + 40}%, ${(hash % 40) + 40}%)`;
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
    
    // Активируем первую вкладку
    const firstTab = tabButtons[0];
    if (firstTab) {
        firstTab.classList.add('active');
        const firstPane = document.getElementById(firstTab.getAttribute('data-tab'));
        if (firstPane) firstPane.classList.add('active');
    }
}

// Загрузка отзывов
async function loadReviews() {
    const reviewsList = document.querySelector('.reviews-list');
    if (!reviewsList) return;
    
    try {
        const reviews = await window.apiClient.getReviews(currentProductId, isLaminateMode);
        
        let html = '';
        
        // Проверяем может ли пользователь оставить отзыв
        let canReview = false;
        let statusText = '🔒 Отзыв только для купивших товар';
        
        if (window.authManager?.isAuthenticated()) {
            // Проверяем покупал ли товар
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
                    `<button class="btn btn--primary" onclick="window.openReviewModal('${currentProductId}', ${isLaminateMode})" style="background: #27ae60;">✍️ ${statusText}</button>` :
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
        
        // Обновляем счетчик на вкладке
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
        let allProducts = [];
        if (isLaminateMode) {
            const result = await window.apiClient.getLaminate();
            allProducts = result.items || [];
        } else {
            const result = await window.apiClient.getDoors();
            allProducts = result.items || [];
        }
        
        const otherProducts = allProducts.filter(p => p.id !== currentProductId);
        
        if (otherProducts.length === 0) {
            if (loading) loading.style.display = 'none';
            if (noResults) noResults.style.display = 'block';
            return;
        }
        
        // Перемешиваем и берем 4
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
    const productPage = isLaminateMode ? 'laminate-product.html' : 'product.html';
    
    card.innerHTML = `
        <div class="product-image-container">
            <img src="${imageUrl}" alt="${escapeHtml(product.name)}" class="product-image" loading="lazy" onerror="this.src='/image/no-image.jpg'" onclick="window.location.href='${productPage}?id=${product.id}'">
        </div>
        <div class="product-info">
            <h3 class="product-title">${escapeHtml(product.name)}</h3>
            <div class="product-price">${priceDisplay}</div>
            <div class="product-actions">
                <a href="${productPage}?id=${product.id}" class="btn-details">Подробнее</a>
            </div>
        </div>
    `;
    
    return card;
}

// ============ МОДАЛЬНОЕ ОКНО ЗАКАЗА ============

function initOrderModal() {
    const orderBtn = document.getElementById('orderBtn');
    if (orderBtn) {
        orderBtn.addEventListener('click', openOrderModal);
    }
    
    // Обработчики закрытия
    document.getElementById('closeOrderModal')?.addEventListener('click', closeOrderModal);
    document.getElementById('cancelOrder')?.addEventListener('click', closeOrderModal);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.getElementById('orderModal')?.style.display === 'flex') {
            closeOrderModal();
        }
    });
}

function openOrderModal() {
    const modal = document.getElementById('orderModal');
    if (!modal) return;
    
    fillOrderModal();
    resetModalValues();
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    setupOrderModalHandlers();
    updateOrderSummary();
}

function fillOrderModal() {
    document.getElementById('orderProductName').textContent = currentProduct.name || 'Товар';
    document.getElementById('orderProductPrice').textContent = formatPrice(currentProductPrice);
    
    const mainImage = document.getElementById('mainImage');
    const modalImage = document.getElementById('orderProductImage');
    if (mainImage?.src && modalImage) {
        modalImage.src = mainImage.src;
    }
}

function resetModalValues() {
    const quantityInput = document.getElementById('orderQuantity');
    if (quantityInput) quantityInput.value = 1;
    
    const pickupRadio = document.querySelector('input[name="delivery"][value="pickup"]');
    if (pickupRadio) pickupRadio.checked = true;
    
    document.getElementById('serviceWarranty').checked = false;
    document.getElementById('serviceAssembly').checked = false;
    
    const addressInput = document.getElementById('addressInput');
    if (addressInput) addressInput.value = '';
    
    const deliveryAddress = document.getElementById('deliveryAddress');
    if (deliveryAddress) deliveryAddress.style.display = 'none';
}

function setupOrderModalHandlers() {
    // Количество
    document.querySelector('.qty-minus')?.addEventListener('click', () => changeQuantity(-1));
    document.querySelector('.qty-plus')?.addEventListener('click', () => changeQuantity(1));
    document.getElementById('orderQuantity')?.addEventListener('input', () => {
        updateProductPriceDisplay();
        updateOrderSummary();
    });
    
    // Доставка
    document.querySelectorAll('input[name="delivery"]').forEach(radio => {
        radio.addEventListener('change', () => {
            handleDeliveryChange();
            updateOrderSummary();
        });
    });
    
    // Услуги
    document.getElementById('serviceWarranty')?.addEventListener('change', updateOrderSummary);
    document.getElementById('serviceAssembly')?.addEventListener('change', updateOrderSummary);
    
    // Отправка
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
    document.getElementById('orderProductPrice').textContent = formatPrice(total);
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
    
    document.getElementById('summaryProduct').textContent = formatPrice(productTotal);
    document.getElementById('summaryDelivery').textContent = deliveryCost === 0 ? 'Бесплатно' : formatPrice(deliveryCost);
    document.getElementById('summaryServices').textContent = servicesCost === 0 ? '—' : formatPrice(servicesCost);
    document.getElementById('summaryTotal').textContent = formatPrice(totalCost);
}

async function submitOrder() {
    if (!window.authManager || !window.authManager.currentUser) {
        alert('Для оформления заказа необходимо войти в систему');
        window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
        return;
    }
    
    const quantity = parseInt(document.getElementById('orderQuantity')?.value) || 1;
    const deliveryType = document.querySelector('input[name="delivery"]:checked')?.value || 'pickup';
    const address = document.getElementById('addressInput')?.value || '';
    const saveAddress = document.getElementById('saveAddressCheckbox')?.checked || false;
    const warranty = document.getElementById('serviceWarranty')?.checked || false;
    const assembly = document.getElementById('serviceAssembly')?.checked || false;
    
    if ((deliveryType === 'delivery' || deliveryType === 'installation') && !address.trim()) {
        alert('Пожалуйста, укажите адрес доставки');
        return;
    }
    
    const submitBtn = document.getElementById('submitOrder');
    if (submitBtn) {
        submitBtn.innerHTML = '🔄 Добавление...';
        submitBtn.disabled = true;
    }
    
    try {
        const cartItem = {
            id: currentProduct.id,
            name: currentProduct.name,
            price: currentProductPrice,
            quantity: quantity,
            image: document.getElementById('mainImage')?.src || '',
            code: currentProduct.id.substring(0, 8),
            color: getFormattedColors(currentProduct.color),
            delivery_type: deliveryType,
            delivery_address: address,
            warranty_service: warranty,
            assembly_service: assembly,
            payment_method: 'наличные',
            collection: isLaminateMode ? 'laminate' : 'doors',
            added_at: new Date().toISOString(),
            save_address: saveAddress
        };
        
        const userId = window.authManager.currentUser?.id;
        const cartKey = userId ? `user_cart_${userId}` : 'guest_cart';
        
        let cart = JSON.parse(localStorage.getItem(cartKey)) || [];
        
        const existingIndex = cart.findIndex(item => 
            item.id === currentProduct.id && 
            item.collection === (isLaminateMode ? 'laminate' : 'doors') &&
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
        
        closeOrderModal();
        alert('✅ Товар добавлен в корзину!');
        
        // Обновляем счетчик
        if (window.cartManager) window.cartManager.updateCartCounter();
        
    } catch (error) {
        console.error('Ошибка:', error);
        alert('❌ Ошибка добавления в корзину');
    } finally {
        if (submitBtn) {
            submitBtn.innerHTML = 'Оформить заказ';
            submitBtn.disabled = false;
        }
    }
}

function closeOrderModal() {
    const modal = document.getElementById('orderModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
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
    const productMain = document.querySelector('.product-main');
    if (productMain && !productMain.querySelector('.loading-container')) {
        productMain.innerHTML = `<div class="loading-container"><div class="spinner"></div><p>Загрузка информации о товаре...</p></div>`;
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

// Глобальная функция для открытия модального окна отзыва
window.openReviewModal = function(productId, isLaminate) {
    const modalHTML = `
        <div id="productReviewModal" style="position: fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.6); z-index:10000; display:flex; align-items:center; justify-content:center;">
            <div style="background:white; border-radius:16px; padding:30px; max-width:500px; width:90%;">
                <div style="display:flex; justify-content:space-between; margin-bottom:20px;">
                    <h2>Оставить отзыв</h2>
                    <button onclick="this.closest('#productReviewModal').remove()" style="font-size:24px; background:none; border:none; cursor:pointer;">&times;</button>
                </div>
                <div style="background:#f8f9fa; padding:15px; border-radius:8px; margin-bottom:20px;">
                    <strong>${escapeHtml(currentProduct?.name || 'Товар')}</strong>
                </div>
                <form id="reviewForm">
                    <div style="margin-bottom:20px;">
                        <label>Оценка</label>
                        <div style="display:flex; gap:10px;" id="ratingStars">
                            ${[1,2,3,4,5].map(i => `<span onclick="setRating(${i})" style="font-size:30px; cursor:pointer;">☆</span>`).join('')}
                        </div>
                        <input type="hidden" id="reviewRating" value="5">
                    </div>
                    <div style="margin-bottom:20px;">
                        <label>Отзыв *</label>
                        <textarea id="reviewText" rows="4" style="width:100%; padding:12px; border:2px solid #ddd; border-radius:8px;"></textarea>
                    </div>
                    <div style="display:flex; gap:10px; justify-content:flex-end;">
                        <button type="button" onclick="this.closest('#productReviewModal').remove()" style="padding:12px 24px; background:#f0f0f0; border:none; border-radius:8px;">Отмена</button>
                        <button type="submit" style="padding:12px 24px; background:#27ae60; color:white; border:none; border-radius:8px;">Отправить</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
    
    window.setRating = function(rating) {
        const stars = document.querySelectorAll('#ratingStars span');
        stars.forEach((star, i) => {
            star.textContent = i < rating ? '★' : '☆';
        });
        document.getElementById('reviewRating').value = rating;
    };
    window.setRating(5);
    
    document.getElementById('reviewForm').addEventListener('submit', async (e) => {
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
                isLaminate: isLaminate
            });
            
            alert('✅ Отзыв отправлен на модерацию!');
            document.getElementById('productReviewModal')?.remove();
            document.body.style.overflow = '';
            
            setTimeout(() => loadReviews(), 2000);
            
        } catch (error) {
            console.error('Ошибка:', error);
            alert('❌ Ошибка отправки отзыва');
        }
    });
};