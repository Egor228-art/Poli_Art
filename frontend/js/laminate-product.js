// laminate-product.js - отдельный файл для страницы товара ламината

const PB_URL = 'http://127.0.0.1:8090';
let currentProduct = null;
let pb = null;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Инициализация страницы товара ламината...');
    
    try {
        // Инициализируем PocketBase
        if (typeof PocketBase !== 'undefined') {
            pb = new PocketBase(PB_URL);
        } else {
            console.error('PocketBase не загружен');
            showErrorMessage('Ошибка загрузки данных');
            return;
        }
        
        // Получаем ID товара из URL
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        
        if (!productId) {
            showErrorMessage('Товар не найден');
            return;
        }
        
        console.log('Загрузка товара ламината с ID:', productId);
        
        // Загружаем данные товара
        await loadProductData(productId);
        
        // Инициализируем остальные компоненты
        setupTabs();
        setupModal();
        
        // Загружаем похожие товары
        setTimeout(() => loadSimilarProducts(productId), 500);
        
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        showErrorMessage('Ошибка загрузки страницы товара');
    }
});

// Загрузка данных товара
async function loadProductData(productId) {
    try {
        const product = await pb.collection('laminate').getOne(productId, {
            expand: 'reviews(product)'
        });
        
        currentProduct = product;
        console.log('Товар загружен:', product);
        
        // Сохраняем ID для отзывов
        window.currentProductId = productId;
        
        // Отображаем данные товара
        renderProductData(product);
        
    } catch (error) {
        console.error('Ошибка загрузки товара:', error);
        showErrorMessage('Товар не найден');
    }
}

// Отображение данных товара
function renderProductData(product) {
    const container = document.querySelector('.product-main__inner');
    if (!container) return;
    
    // Форматируем цену
    let formattedPrice = product.prise || 'Цена по запросу';
    if (product.prise && !product.prise.includes('₽') && !product.prise.includes('руб')) {
        const match = product.prise.match(/(\d[\d\s]*[\d.,]?\d*)/);
        if (match) {
            const numberStr = match[1].replace(/\s/g, '').replace(',', '.');
            const price = parseFloat(numberStr);
            if (!isNaN(price)) {
                formattedPrice = price.toLocaleString('ru-RU') + ' ₽';
            }
        }
    }
    
    // Получаем URL изображения
    let imageUrl = 'img/no-image.jpg';
    if (product.picture && product.picture.length > 0 && product.picture[0]) {
        try {
            const fileName = product.picture[0];
            imageUrl = `${PB_URL}/api/files/laminate/${product.id}/${fileName}`;
        } catch (error) {
            console.warn('Ошибка загрузки изображения:', error);
        }
    }
    
    // Получаем цвета
    let colorsHTML = '';
    if (product.color) {
        let colors = [];
        if (Array.isArray(product.color)) {
            colors = product.color;
        } else if (typeof product.color === 'string') {
            colors = [product.color];
        }
        
        colorsHTML = `
            <div class="product-colors">
                <h4>Доступные цвета:</h4>
                <div class="color-chips">
                    ${colors.map(color => `
                        <span class="color-chip" style="background-color: ${getColorHex(color)}" title="${color}">
                            ${color}
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    container.innerHTML = `
        <div class="product-gallery">
            <div class="main-image">
                <img style="width: 600px; height: 600px" src="${imageUrl}" alt="${escapeHtml(product.name)}" 
                     id="mainProductImage" onerror="this.src='img/no-image.jpg'">
            </div>
            ${product.picture && product.picture.length > 1 ? `
                <div class="thumbnails" id="thumbnails">
                    ${product.picture.map((img, index) => `
                        <img style="width: 100px; height: 100px" src="${PB_URL}/api/files/laminate/${product.id}/${img}" 
                             alt="${escapeHtml(product.name)} - фото ${index + 1}"
                             class="thumbnail ${index === 0 ? 'active' : ''}"
                             data-index="${index}"
                             onerror="this.src='img/no-image.jpg'">
                    `).join('')}
                </div>
            ` : ''}
        </div>
        
        <div class="product-info">
            <h1 class="product-title">${escapeHtml(product.name || 'Без названия')}</h1>
            <div class="product-meta">
                ${product.type ? `<span class="product-type">${product.type}</span>` : ''}
                ${product.thickness ? `<span class="product-thickness">Толщина: ${product.thickness}</span>` : ''}
            </div>
            
            <div class="product-price">${formattedPrice}</div>
            
            ${colorsHTML}
            
            <div class="product-actions">
                <button class="btn btn--primary" id="addToConstructor">
                    <span>➕ В конструктор</span>
                </button>
                <button class="btn btn--secondary" id="addToCart">
                    <span>🛒 В корзину</span>
                </button>
                <button class="btn btn--accent" id="callMeasurer">
                    <span>📏 Вызвать замерщика</span>
                </button>
            </div>
            
            <div class="product-features">
                ${product.material ? `<div><strong>Материал:</strong> ${product.material}</div>` : ''}
                ${product.type_room ? `<div><strong>Для помещения:</strong> ${product.type_room}</div>` : ''}
                ${product.description ? `<div><strong>Описание:</strong> ${product.description}</div>` : ''}
            </div>
        </div>
    `;
    
    // Добавляем обработчики
    setupProductListeners(product);
    
    // Обновляем описание и характеристики
    updateDescriptionAndSpecs(product);
}

// Обновление описания и характеристик
function updateDescriptionAndSpecs(product) {
    // Описание
    const descriptionTab = document.getElementById('description');
    if (descriptionTab) {
        descriptionTab.innerHTML = `
            <div class="product-description-content">
                ${product.description ? `<p>${escapeHtml(product.description)}</p>` : '<p>Описание отсутствует</p>'}
                
                ${product.features ? `
                    <h3>Особенности:</h3>
                    <ul>
                        ${product.features.split('\n').map(feature => `<li>${escapeHtml(feature.trim())}</li>`).filter(li => li !== '<li></li>').join('')}
                    </ul>
                ` : ''}
            </div>
        `;
    }
    
    // Характеристики
    const specsTab = document.getElementById('specifications');
    if (specsTab) {
        const specs = [];
        
        if (product.type) specs.push({ name: 'Тип', value: product.type });
        if (product.material) specs.push({ name: 'Материал', value: product.material });
        if (product.thickness) specs.push({ name: 'Толщина', value: product.thickness });
        if (product.color) {
            let colorValue = '';
            if (Array.isArray(product.color)) {
                colorValue = product.color.join(', ');
            } else if (typeof product.color === 'string') {
                colorValue = product.color;
            }
            if (colorValue) specs.push({ name: 'Цвет', value: colorValue });
        }
        if (product.type_room) {
            let roomValue = '';
            if (Array.isArray(product.type_room)) {
                roomValue = product.type_room.join(', ');
            } else if (typeof product.type_room === 'string') {
                roomValue = product.type_room;
            }
            if (roomValue) specs.push({ name: 'Рекомендуемое помещение', value: roomValue });
        }
        if (product.size) specs.push({ name: 'Размер', value: product.size });
        if (product.weight) specs.push({ name: 'Вес', value: product.weight });
        if (product.warranty) specs.push({ name: 'Гарантия', value: product.warranty });
        
        const specsTable = specsTab.querySelector('.specs-table');
        if (specsTable) {
            specsTable.innerHTML = specs.length > 0 ? `
                <table>
                    <tbody>
                        ${specs.map(spec => `
                            <tr>
                                <td><strong>${spec.name}:</strong></td>
                                <td>${escapeHtml(spec.value)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<p>Характеристики отсутствуют</p>';
        }
    }
}

// Настройка обработчиков для товара
function setupProductListeners(product) {
    // Миниатюры изображений
    const thumbnails = document.querySelectorAll('.thumbnail');
    const mainImage = document.getElementById('mainProductImage');
    
    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', function() {
            thumbnails.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            mainImage.src = this.src;
        });
    });
    
    // Кнопка конструктора
    const constructorBtn = document.getElementById('addToConstructor');
    if (constructorBtn) {
        constructorBtn.addEventListener('click', function() {
            // Получаем первый цвет для передачи в конструктор
            let firstColor = '';
            if (product.color) {
                if (Array.isArray(product.color) && product.color.length > 0) {
                    firstColor = product.color[0];
                } else if (typeof product.color === 'string') {
                    firstColor = product.color;
                }
            }
            
            // Переходим на конструктор
            window.location.href = `laminate-constructor.html?product_id=${product.id}&product_name=${encodeURIComponent(product.name || '')}&color=${encodeURIComponent(firstColor)}`;
        });
    }
    
    // Кнопка корзины
    const cartBtn = document.getElementById('addToCart');
    if (cartBtn) {
        cartBtn.addEventListener('click', function() {
            addToCart(product);
        });
    }
    
    // Кнопка замерщика
    const measurerBtn = document.getElementById('callMeasurer');
    if (measurerBtn) {
        measurerBtn.addEventListener('click', function() {
            showMeasureModal(product);
        });
    }
}

// Загрузка похожих товаров
async function loadSimilarProducts(currentProductId) {
    try {
        const similarProducts = await pb.collection('laminate').getList(1, 4, {
            filter: `id != "${currentProductId}"`,
            sort: 'random'
        });
        
        renderSimilarProducts(similarProducts.items);
        
    } catch (error) {
        console.error('Ошибка загрузки похожих товаров:', error);
        document.getElementById('similarLoading').style.display = 'none';
        document.getElementById('noSimilarProducts').style.display = 'block';
    }
}

// Отображение похожих товаров
function renderSimilarProducts(products) {
    const grid = document.getElementById('similarProductsGrid');
    const loading = document.getElementById('similarLoading');
    
    if (!grid) return;
    
    loading.style.display = 'none';
    
    if (!products || products.length === 0) {
        document.getElementById('noSimilarProducts').style.display = 'block';
        return;
    }
    
    products.forEach(product => {
        const card = createSimilarProductCard(product);
        grid.appendChild(card);
    });
}

// Создание карточки похожего товара
function createSimilarProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card similar-card';
    
    // Изображение
    let imageUrl = 'img/no-image.jpg';
    if (product.picture && product.picture.length > 0 && product.picture[0]) {
        try {
            const fileName = product.picture[0];
            imageUrl = `${PB_URL}/api/files/laminate/${product.id}/${fileName}`;
        } catch (error) {
            console.warn('Ошибка загрузки изображения:', error);
        }
    }
    
    // Цена
    let formattedPrice = product.prise || 'Цена по запросу';
    if (product.prise && !product.prise.includes('₽') && !product.prise.includes('руб')) {
        const match = product.prise.match(/(\d[\d\s]*[\d.,]?\d*)/);
        if (match) {
            const numberStr = match[1].replace(/\s/g, '').replace(',', '.');
            const price = parseFloat(numberStr);
            if (!isNaN(price)) {
                formattedPrice = price.toLocaleString('ru-RU') + ' ₽';
            }
        }
    }
    
    card.innerHTML = `
        <div class="product-image-container">
            <img src="${imageUrl}" alt="${escapeHtml(product.name || 'Без названия')}" 
                 class="product-image"
                 onerror="this.onerror=null; this.src='img/no-image.jpg';"
                 onclick="window.location.href='laminate-product.html?id=${product.id}'">
        </div>
        <div class="product-info">
            <h3 class="product-title">${escapeHtml(product.name || 'Без названия')}</h3>
            <p class="product-description">${escapeHtml(product.description ? 
                (product.description.length > 60 ? 
                    product.description.substring(0, 60) + '...' : 
                    product.description) : 
                'Описание отсутствует')}</p>
            
            <div class="product-price">${formattedPrice}</div>
            <div class="product-actions">
                <a href="laminate-product.html?id=${product.id}" class="btn-details">Подробнее</a>
                <button class="btn-constructor" onclick="addSimilarToConstructor('${product.id}', '${escapeHtml(product.name || '')}')">
                    В конструктор
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// Настройка вкладок
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            // Убираем активные классы
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            
            // Добавляем активные классы
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Настройка модального окна
function setupModal() {
    const modalOverlay = document.getElementById('modalOverlay');
    const modalClose = document.getElementById('modalClose');
    const measureModal = document.getElementById('measureModal');
    
    if (modalClose && modalOverlay) {
        modalClose.addEventListener('click', function() {
            modalOverlay.style.display = 'none';
        });
        
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                modalOverlay.style.display = 'none';
            }
        });
    }
}

// Показать модальное окно замерщика
function showMeasureModal(product) {
    const modalOverlay = document.getElementById('modalOverlay');
    const measureModal = document.getElementById('measureModal');
    
    if (!modalOverlay || !measureModal) {
        alert('Вызов замерщика для: ' + (product.name || 'товара'));
        return;
    }
    
    measureModal.innerHTML = `
        <button class="modal-close" id="modalClose">&times;</button>
        <h2>Вызвать замерщика</h2>
        <div class="modal-body">
            <p><strong>Товар:</strong> ${escapeHtml(product.name || '')}</p>
            <form id="measureForm">
                <div class="form-group">
                    <label for="customerName">Ваше имя:</label>
                    <input type="text" id="customerName" required>
                </div>
                <div class="form-group">
                    <label for="customerPhone">Телефон:</label>
                    <input type="tel" id="customerPhone" required>
                </div>
                <div class="form-group">
                    <label for="customerAddress">Адрес:</label>
                    <textarea id="customerAddress" rows="3" required></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Отправить заявку</button>
            </form>
        </div>
    `;
    
    modalOverlay.style.display = 'flex';
    
    // Настройка формы
    const form = document.getElementById('measureForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Заявка на замер отправлена! Мы свяжемся с вами в ближайшее время.');
            modalOverlay.style.display = 'none';
        });
    }
    
    // Настройка кнопки закрытия
    const closeBtn = measureModal.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            modalOverlay.style.display = 'none';
        });
    }
}

// Добавление в корзину
function addToCart(product) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.prise,
            picture: product.picture ? product.picture[0] : null,
            type: 'laminate',
            quantity: 1
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    
    alert('Товар добавлен в корзину!');
    
    // Обновляем счетчик корзины если есть
    updateCartCounter();
}

// Обновление счетчика корзины
function updateCartCounter() {
    const cartCounter = document.querySelector('.cart-counter');
    if (cartCounter) {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCounter.textContent = totalItems;
        cartCounter.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

// Глобальная функция для добавления в конструктор
window.addSimilarToConstructor = function(productId, productName) {
    window.location.href = `laminate-constructor.html?product_id=${productId}&product_name=${encodeURIComponent(productName)}`;
};

// Вспомогательные функции
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getColorHex(colorName) {
    const colorMap = {
        'коричневый': '#8B4513',
        'бежевый': '#F5DEB3',
        'серый': '#808080',
        'белый': '#FFFFFF',
        'чёрный': '#000000',
        'черный': '#000000',
        'золотистый': '#FFD700',
        'серебристый': '#C0C0C0',
        'дуб': '#D2B48C',
        'дуб светлый': '#E8D0A9',
        'дуб темный': '#8B4513',
        'темный дуб': '#654321',
        'орех': '#A0522D',
        'ясень': '#DEB887',
        'ясень светлый': '#F0E68C',
        'ясень темный': '#CD853F',
        'бук': '#F5DEB3',
        'венге': '#3C2F23',
        'вишня': '#DE3163',
        'махагон': '#C04000',
        'мербау': '#8B0000'
    };
    
    if (!colorName || typeof colorName !== 'string') {
        return '#8B4513';
    }
    
    const normalized = colorName.toLowerCase().trim();
    
    if (colorMap[normalized]) {
        return colorMap[normalized];
    }
    
    for (const [key, value] of Object.entries(colorMap)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return value;
        }
    }
    
    return '#8B4513';
}

function showErrorMessage(message) {
    const container = document.querySelector('.product-main__inner');
    if (container) {
        container.innerHTML = `
            <div class="error-message">
                <h3>⚠️ Ошибка</h3>
                <p>${message}</p>
                <button onclick="window.location.href='catalog.html'" class="btn btn-primary">
                    Вернуться в каталог
                </button>
            </div>
        `;
    }
}