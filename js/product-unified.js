// product-unified.js - Единая страница товара для ВСЕХ товаров

const PB_URL = 'http://127.0.0.1:8090';

// Получаем параметры из URL
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        id: params.get('id'),
        type: params.get('type') || 'door' // door или laminate
    };
}

// Основная функция загрузки товара
async function loadProduct() {
    console.log('🚀 Загрузка товара...');
    
    const { id, type } = getUrlParams();
    
    if (!id) {
        showError('ID товара не указан');
        return;
    }
    
    try {
        // Определяем коллекцию
        const collection = type === 'laminate' ? 'laminate' : 'doors';
        
        console.log(`📦 Загрузка из коллекции: ${collection}, ID: ${id}`);
        
        // Загружаем товар
        const response = await fetch(`${PB_URL}/api/collections/${collection}/records/${id}`);
        
        if (!response.ok) {
            throw new Error(`Ошибка ${response.status}: Товар не найден`);
        }
        
        const product = await response.json();
        
        // Сохраняем глобальные данные для отзывов
        window.currentProductId = id;
        window.currentProductType = type;
        
        // Отображаем товар
        renderProduct(product, type);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки:', error);
        showError(`Ошибка загрузки товара: ${error.message}`);
    }
}

// Отображение товара
function renderProduct(product, type) {
    const container = document.getElementById('productContainer');
    if (!container) return;
    
    const isLaminate = type === 'laminate';
    
    // Форматирование цены
    const formattedPrice = formatPrice(product.prise);
    
    // Получение изображения
    const imageUrl = getImageUrl(product, isLaminate ? 'laminate' : 'doors');
    
    // Характеристики
    const specs = getSpecs(product, isLaminate);
    
    container.innerHTML = `
        <div class="product-gallery">
            <div class="main-image">
                <img src="${imageUrl}" 
                     alt="${product.name || (isLaminate ? 'Ламинат' : 'Дверь')}" 
                     onerror="this.onerror=null; this.src='image/no-image.jpg';">
            </div>
        </div>
        
        <div class="product-info">
            <div class="product-badge ${isLaminate ? 'laminate-badge' : 'door-badge'}">
                ${isLaminate ? 'ЛАМИНАТ' : 'ДВЕРЬ'}
            </div>
            
            <h1 class="product-title">${product.name || (isLaminate ? 'Ламинат' : 'Дверь')}</h1>
            
            <div class="product-rating">
                <div class="stars">★★★★★</div>
                <span class="rating-count">(0 отзывов)</span>
            </div>
            
            <div class="product-price-block">
                <div class="current-price">${formattedPrice}</div>
                <div class="price-per">${isLaminate ? 'за м²' : 'за шт'}</div>
            </div>
            
            <div class="product-actions">
                <button class="btn btn-primary" onclick="addToCart()">
                    <span>🛒</span> В корзину
                </button>
                
                ${isLaminate ? `
                    <button class="btn btn-secondary" onclick="goToConstructor('${product.id}', '${escapeHtml(product.name || '')}')">
                        <span>📐</span> В конструктор
                    </button>
                ` : ''}
                
                <button class="btn btn-outline" onclick="showMeasureModal()">
                    <span>📏</span> Вызвать замерщика
                </button>
            </div>
            
            <div class="quick-specs">
                ${specs.map(spec => `
                    <div class="quick-spec">
                        <span class="spec-label">${spec.label}:</span>
                        <span class="spec-value">${spec.value}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    // Заполняем вкладки
    fillTabs(product, isLaminate);
}

// Получение характеристик
function getSpecs(product, isLaminate) {
    const specs = [];
    
    if (isLaminate) {
        if (product.type) specs.push({ label: 'Класс', value: product.type });
        if (product.thickness) specs.push({ label: 'Толщина', value: product.thickness });
        if (product.color) {
            const color = Array.isArray(product.color) ? product.color.join(', ') : product.color;
            specs.push({ label: 'Цвет', value: color });
        }
    } else {
        if (product.type) specs.push({ label: 'Тип', value: product.type });
        if (product.material) specs.push({ label: 'Материал', value: product.material });
        if (product.color) {
            const color = Array.isArray(product.color) ? product.color.join(', ') : product.color;
            specs.push({ label: 'Цвет', value: color });
        }
    }
    
    return specs;
}

// Заполнение вкладок
function fillTabs(product, isLaminate) {
    // Описание
    const descriptionTab = document.getElementById('description');
    if (descriptionTab) {
        descriptionTab.innerHTML = product.description ? 
            `<p>${product.description}</p>` : 
            `<p class="no-data">Описание отсутствует</p>`;
    }
    
    // Характеристики
    const specsTab = document.getElementById('specifications');
    if (specsTab) {
        const detailedSpecs = getDetailedSpecs(product, isLaminate);
        specsTab.innerHTML = `
            <div class="specs-table">
                ${detailedSpecs.map(spec => `
                    <div class="spec-row">
                        <div class="spec-label">${spec.label}:</div>
                        <div class="spec-value">${spec.value}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Доставка
    const deliveryTab = document.getElementById('delivery');
    if (deliveryTab) {
        deliveryTab.innerHTML = getDeliveryContent(isLaminate);
    }
}

// Подробные характеристики
function getDetailedSpecs(product, isLaminate) {
    const specs = [];
    
    // Общие поля
    specs.push({ label: 'Название', value: product.name || 'Не указано' });
    
    if (isLaminate) {
        // Ламинат
        if (product.type) specs.push({ label: 'Класс ламината', value: product.type });
        if (product.thickness) specs.push({ label: 'Толщина', value: product.thickness });
        if (product.color) {
            const color = Array.isArray(product.color) ? product.color.join(', ') : product.color;
            specs.push({ label: 'Цвет', value: color });
        }
        if (product.type_room) {
            const rooms = Array.isArray(product.type_room) ? product.type_room.join(', ') : product.type_room;
            specs.push({ label: 'Помещение', value: rooms });
        }
        if (product.material) specs.push({ label: 'Материал', value: product.material });
    } else {
        // Двери
        if (product.type) specs.push({ label: 'Тип двери', value: product.type });
        if (product.material) specs.push({ label: 'Материал', value: product.material });
        if (product.color) {
            const color = Array.isArray(product.color) ? product.color.join(', ') : product.color;
            specs.push({ label: 'Цвет', value: color });
        }
        if (product.style) specs.push({ label: 'Стиль', value: product.style });
        if (product.thickness) specs.push({ label: 'Толщина', value: product.thickness });
    }
    
    if (product.number_id) specs.push({ label: 'Артикул', value: product.number_id });
    
    return specs;
}

// Контент доставки
function getDeliveryContent(isLaminate) {
    if (isLaminate) {
        return `
            <h2>Доставка и установка ламината</h2>
            <div class="delivery-options">
                <div class="delivery-option">
                    <div class="box-line">
                        <img src="image/icon/thuislevering.png" alt="Грузовик">
                        <h3>Бесплатная доставка</h3>
                    </div>
                    <p>При заказе от 50 м² в пределах Великого Новгорода</p>
                </div>
                <div class="delivery-option">
                    <div class="box-line">
                        <img src="image/icon/flash.png" alt="Молния">
                        <h3>Быстрая укладка</h3>
                    </div>
                    <p>Монтаж ламината опытными специалистами</p>
                </div>
                <div class="delivery-option">
                    <div class="box-line">
                        <img src="image/icon/installation.png" alt="Гаечный ключ">
                        <h3>Расчет материалов</h3>
                    </div>
                    <p>Бесплатный расчет необходимого количества</p>
                </div>
            </div>
        `;
    } else {
        return `
            <h2>Доставка и установка дверей</h2>
            <div class="delivery-options">
                <div class="delivery-option">
                    <div class="box-line">
                        <img src="image/icon/thuislevering.png" alt="Грузовик">
                        <h3>Бесплатная доставка</h3>
                    </div>
                    <p>При заказе от 15 000 ₽ в пределах Великого Новгорода</p>
                </div>
                <div class="delivery-option">
                    <div class="box-line">
                        <img src="image/icon/flash.png" alt="Молния">
                        <h3>Быстрая установка</h3>
                    </div>
                    <p>Монтаж двери опытными специалистами за 1-2 часа</p>
                </div>
                <div class="delivery-option">
                    <div class="box-line">
                        <img src="image/icon/installation.png" alt="Гаечный ключ">
                        <h3>Вынос старой двери</h3>
                    </div>
                    <p>Бесплатный демонтаж и вынос старой конструкции</p>
                </div>
            </div>
        `;
    }
}

// Вспомогательные функции
function formatPrice(priceStr) {
    if (!priceStr) return 'Цена по запросу';
    if (priceStr.includes('Цена') || priceStr.includes('запрос')) return priceStr;
    
    const match = priceStr.match(/(\d[\d\s]*[\d.,]?\d*)/);
    if (match) {
        const numberStr = match[1].replace(/\s/g, '').replace(',', '.');
        const price = parseFloat(numberStr);
        if (!isNaN(price)) {
            return price.toLocaleString('ru-RU') + ' ₽';
        }
    }
    return priceStr;
}

function getImageUrl(product, collection) {
    if (product.picture && product.picture.length > 0 && product.picture[0]) {
        return `${PB_URL}/api/files/${collection}/${product.id}/${product.picture[0]}`;
    }
    return 'image/no-image.jpg';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
}

function showError(message) {
    const container = document.getElementById('productContainer');
    if (container) {
        container.innerHTML = `
            <div class="error-message">
                <h3>⚠️ Ошибка</h3>
                <p>${message}</p>
                <a href="catalog.html" class="btn btn-primary">Вернуться в каталог</a>
            </div>
        `;
    }
}

// Глобальные функции
window.addToCart = function() {
    alert('Товар добавлен в корзину');
};

window.goToConstructor = function(productId, productName) {
    console.log('Переход в конструктор:', productId, productName);
    
    // Сохраняем данные
    sessionStorage.setItem('constructor_product', JSON.stringify({
        id: productId,
        name: productName,
        type: 'laminate',
        timestamp: Date.now()
    }));
    
    // Переходим
    window.location.href = 'laminate-constructor.html';
};

window.showMeasureModal = function() {
    const modal = document.getElementById('modalOverlay');
    if (modal) {
        modal.style.display = 'flex';
    }
};

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Загрузка страницы товара...');
    loadProduct();
});