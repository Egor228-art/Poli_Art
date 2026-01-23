// product.js - ПОЛНЫЙ УПРОЩЕННЫЙ КОД (замените весь предыдущий файл)
(function() {
    console.log('Загрузка product.js...');
    
    // Функция для запуска приложения после загрузки PocketBase
    function initProductApp() {
        console.log('Инициализация приложения товара...');
        
        if (typeof PocketBase === 'undefined') {
            console.error('PocketBase все еще не загружен!');
            showErrorMessage('Ошибка загрузки приложения');
            return;
        }
        
        try {
            // Создаем экземпляр PocketBase
            const pb = new PocketBase('http://127.0.0.1:8090');
            pb.autoCancellation(false);
            
            // Запускаем приложение
            startProductPage(pb);
        } catch (error) {
            console.error('Ошибка создания PocketBase:', error);
            showErrorMessage('Ошибка инициализации приложения');
        }
    }
    
    // Функция для загрузки PocketBase
    function loadPocketBase() {
        console.log('Загрузка PocketBase SDK...');
        
        // Проверяем, может PocketBase уже загружен
        if (typeof PocketBase !== 'undefined') {
            console.log('PocketBase уже загружен');
            initProductApp();
            return;
        }
        
        // Загружаем PocketBase
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/pocketbase/dist/pocketbase.umd.js';
        script.onload = function() {
            console.log('PocketBase успешно загружен');
            // Даем время на инициализацию
            setTimeout(initProductApp, 100);
        };
        script.onerror = function() {
            console.error('Не удалось загрузить PocketBase SDK');
            showErrorMessage('Не удалось загрузить необходимые компоненты. Пожалуйста, обновите страницу.');
        };
        
        document.head.appendChild(script);
    }
    
    // Запускаем когда DOM готов
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadPocketBase);
    } else {
        loadPocketBase();
    }
    
    // ФУНКЦИИ ПРИЛОЖЕНИЯ
    
    async function startProductPage(pb) {
        console.log('Начало загрузки страницы товара...');
        
        try {
            await initializeProductPage(pb);
        } catch (error) {
            console.error('Критическая ошибка:', error);
            showErrorMessage('Произошла ошибка при загрузке страницы товара');
        }
    }
    
    async function initializeProductPage(pb) {
        // Получаем ID товара из URL
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        
        console.log('ID товара из URL:', productId);
        
        if (!productId) {
            showError('Товар не найден');
            return;
        }

        // Показываем состояние загрузки
        showLoadingState();
        
        try {
            console.log('Загрузка данных товара...');
            
            // Загружаем товар
            let product = null;
            let collectionName = 'doors';
            
            try {
                product = await pb.collection('doors').getOne(productId);
                console.log('Товар загружен из коллекции doors');
            } catch (doorsError) {
                console.log('Не найден в doors, пробуем laminate...');
                try {
                    product = await pb.collection('laminate').getOne(productId);
                    collectionName = 'laminate';
                    console.log('Товар загружен из коллекции laminate');
                } catch (laminateError) {
                    throw new Error('Товар не найден ни в одной коллекции');
                }
            }

            if (!product) {
                throw new Error('Товар не найден в базе данных');
            }

            // Заполняем страницу данными
            console.log('Заполнение страницы данными...');
            fillProductPageData(product, collectionName === 'laminate', pb);
            
            // Загружаем похожие товары
            console.log('Загрузка похожих товаров...');
            try {
                await loadSimilarProducts(product, collectionName, pb);
                console.log('Похожие товары загружены');
            } catch (error) {
                console.warn('Не удалось загрузить похожие товары:', error);
                hideSimilarProductsSection();
            }
            
            // Загружаем отзывы
            console.log('Загрузка отзывов...');
            loadProductReviews(productId, pb).catch(error => {
                console.warn('Не удалось загрузить отзывы:', error);
            });
            
            console.log('Страница товара успешно загружена!');
            
        } catch (error) {
            console.error('Ошибка загрузки товара:', error);
            showError('Не удалось загрузить информацию о товаре');
        }
    }
const pb = new PocketBase('http://127.0.0.1:8090');

// Отключаем автоотмену запросов
pb.autoCancellation(false);

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Начало загрузки страницы товара...');
    
    try {
        await initializeProductPage();
    } catch (error) {
        console.error('Критическая ошибка:', error);
        showErrorMessage('Произошла ошибка при загрузке страницы товара');
    }
});

// Основная функция инициализации
async function initializeProductPage() {
    // Получаем ID товара из URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    console.log('ID товара из URL:', productId);
    
    if (!productId) {
        showError('Товар не найден');
        return;
    }

    // Показываем состояние загрузки
    showLoadingState();
    
    try {
        console.log('Загрузка данных товара...');
        
        // Загружаем товар (пробуем сначала doors, потом laminate)
        let product = null;
        let collectionName = 'doors';
        
        try {
            product = await pb.collection('doors').getOne(productId);
            console.log('Товар загружен из коллекции doors:', product);
        } catch (doorsError) {
            console.log('Не найден в doors, пробуем laminate...');
            try {
                product = await pb.collection('laminate').getOne(productId);
                collectionName = 'laminate';
                console.log('Товар загружен из коллекции laminate:', product);
            } catch (laminateError) {
                throw new Error('Товар не найден ни в одной коллекции');
            }
        }

        if (!product) {
            throw new Error('Товар не найден в базе данных');
        }

        // Заполняем страницу данными
        console.log('Заполнение страницы данными...');
        fillProductPageData(product, collectionName === 'laminate');
        
        // Загружаем похожие товары (в фоновом режиме)
        console.log('Загрузка похожих товаров...');
        loadSimilarProducts(product, collectionName).catch(error => {
            console.warn('Не удалось загрузить похожие товары:', error);
        });
        
        // Загружаем отзывы (в фоновом режиме)
        console.log('Загрузка отзывов...');
        loadProductReviews(productId).catch(error => {
            console.warn('Не удалось загрузить отзывы:', error);
        });
        
        console.log('Страница товара успешно загружена!');
        
    } catch (error) {
        console.error('Ошибка загрузки товара:', error);
        showError('Не удалось загрузить информацию о товаре');
    }
}

// Заполнение страницы данными товара
function fillProductPageData(product, isLaminate = false) {
    console.log('Заполнение данных товара...');
    
    // 1. Создаем структуру страницы если её нет
    createPageStructure();
    
    // 2. Основная информация
    fillBasicInfo(product, isLaminate);
    
    // 3. Галерея изображений
    setupProductGallery(product, isLaminate);
    
    // 4. Описание и характеристики
    fillDescriptionAndSpecs(product, isLaminate);
    
    // 6. Инициализация табов
    initializeTabs();
    
    // 7. Скрываем индикатор загрузки
    hideLoadingState();
}

//Создание всей структуры страницы
function createPageStructure() {
    console.log('Создание структуры страницы...');
    
    const productMain = document.querySelector('.product-main');
    if (!productMain) {
        console.error('Основной контейнер не найден');
        return;
    }
    
    // Проверяем есть ли уже внутренняя структура
    let productMainInner = document.querySelector('.product-main__inner');
    
    if (!productMainInner) {
        console.log('Создание внутренней структуры...');
        
        productMainInner = document.createElement('div');
        productMainInner.className = 'product-main__inner';
        
        const container = productMain.querySelector('.container');
        if (container) {
            container.innerHTML = ''; // Очищаем контейнер
            container.appendChild(productMainInner);
        } else {
            // Создаем контейнер если его нет
            const newContainer = document.createElement('div');
            newContainer.className = 'container';
            newContainer.appendChild(productMainInner);
            productMain.appendChild(newContainer);
        }
    }
    
    // ИСПРАВЛЕННАЯ СТРУКТУРА: Используем существующие стили из product.css
    productMainInner.innerHTML = `
        <div class="product-gallery-section">
            <div class="product-gallery" id="productGallery">
                <div class="gallery-thumbs" id="galleryThumbs">
                    <!-- Миниатюры загрузятся динамически -->
                </div>
                <div class="gallery-main">
                    <img src="" alt="" class="gallery-main__image" id="mainImage">
                </div>
            </div>
        </div>
        
        <div class="product-info-section">
            <h1 class="product-title" id="productTitle">Загрузка...</h1>
            <div class="product-sku" id="productSku">Код: ---</div>
            
            <div class="product-price-block">
                <div class="product-price" id="productPrice">
                    <span class="price-current">--- ₽</span>
                </div>
            </div>

            <div class="product-actions" id="productActions">
                <!-- Кнопки загрузятся динамически -->
            </div>

            <div class="product-features" id="productFeatures">
                <div class="feature">
                    <div class="feature-icon"><img src="image/icon/thuislevering.png" alt="Грузовик"></div>
                    <div class="feature-text">Бесплатная доставка по Новгороду</div>
                </div>
                <div class="feature">
                    <div class="feature-icon"><img src="image/icon/flash.png" alt="Молния"></div>
                    <div class="feature-text">Установка за 1 день</div>
                </div>
                <div class="feature">
                    <div class="feature-icon"><img src="image/icon/shield.png" alt="Щит"></div>
                    <div class="feature-text">Гарантия 3 года</div>
                </div>
            </div>
        </div>
    `;
    
    console.log('Структура страницы создана');
}

// Заполнение основной информации
function fillBasicInfo(product, isLaminate) {
    console.log('Заполнение основной информации...');
    
    // Используем элементы которые мы создали
    const titleElement = document.querySelector('.product-title');
    const skuElement = document.querySelector('.product-sku');
    const quickSpecs = document.querySelector('.product-quick-specs');
    const productActions = document.querySelector('.product-actions');
    const productPrice = document.querySelector('.product-price');
    
    // Название товара
    if (titleElement) {
        titleElement.textContent = product.name || 'Без названия';
    }
    
    // Артикул (используем ID из БД)
    if (skuElement) {
        // Используем ID товара из БД (первые 8 символов для читаемости)
        const productId = product.id;
        const shortId = productId.substring(0, 8); // Берём первые 8 символов ID
        skuElement.textContent = `Код товара: ${shortId}`;
        // Добавляем полный ID в data-атрибут если нужно
        skuElement.dataset.fullId = productId;
    }
    
    // Цена
    if (productPrice) {
        let price = parseProductPrice(product.prise);
        
        if (price > 0) {
            productPrice.innerHTML = `<div class="price-current">${formatPrice(price)}</div>`;
        } else {
            productPrice.innerHTML = '<div class="price-on-request">Цена по запросу</div>';
        }
    }
    
    // Быстрые характеристики
    if (quickSpecs) {
        let specsHTML = '';
        
        if (isLaminate) {
            specsHTML = `
                <div class="spec">
                    <span class="spec-name">Тип:</span>
                    <span class="spec-value">${product.type || 'Не указан'}</span>
                </div>
                <div class="spec">
                    <span class="spec-name">Толщина:</span>
                    <span class="spec-value">${product.thickness || 'Не указана'}</span>
                </div>
                <div class="spec">
                    <span class="spec-name">Класс:</span>
                    <span class="spec-value">${product.wear_class || 'Не указан'}</span>
                </div>
            `;
        } else {
            specsHTML = `
                <div class="spec">
                    <span class="spec-name">Тип:</span>
                    <span class="spec-value">${product.type || 'Не указан'}</span>
                </div>
                <div class="spec">
                    <span class="spec-name">Материал:</span>
                    <span class="spec-value">${product.material || 'Не указан'}</span>
                </div>
                <div class="spec">
                    <span class="spec-name">Стиль:</span>
                    <span class="spec-value">${product.style || 'Не указан'}</span>
                </div>
            `;
        }
        
        quickSpecs.innerHTML = specsHTML;
    }
    
    // КНОПКИ ДЕЙСТВИЙ
    if (productActions) {
        productActions.innerHTML = `
            <div class="product-actions">
                <button class="btn btn--primary" id="orderBtn">
                    <span>🛒 Оформить заказ</span>
                </button>
            </div>
        `;
        
        // Обработчики для кнопок
        const measureBtn = productActions.querySelector('.open-measure-modal');
        const calculatorBtn = productActions.querySelector('.open-calculator');
        
        if (measureBtn) {
            measureBtn.addEventListener('click', openMeasureModal);
        }
        
        if (calculatorBtn) {
            calculatorBtn.addEventListener('click', () => {
                if (isLaminate) {
                    window.location.href = `laminate-constructor.html?product_id=${product.id}`;
                } else {
                    alert('Функция калькулятора для дверей скоро будет доступна!');
                }
            });
        }
    }
}

// Обновление цены товара
function updateProductPrice(product) {
    const priceContainer = document.querySelector('.product-price');
    if (!priceContainer) return;
    
    let price = parseProductPrice(product.prise);
    
    if (price > 0) {
        priceContainer.innerHTML = `
            <div class="price-current">${formatPrice(price)}</div>
        `;
    } else {
        priceContainer.innerHTML = '<div class="price-on-request">Цена по запросу</div>';
    }
}

// Парсинг цены из строки
function parseProductPrice(priceStr) {
    if (!priceStr) return 0;
    
    // Удаляем все символы кроме цифр
    const cleanStr = priceStr.toString().replace(/[^\d]/g, '');
    
    const price = parseInt(cleanStr);
    return isNaN(price) ? 0 : price;
}

// Форматирование цены
function formatPrice(price) {
    return price.toLocaleString('ru-RU') + ' ₽';
}

// Заполнение быстрых характеристик
function fillQuickSpecs(product, isLaminate) {
    const quickSpecs = document.querySelector('.product-quick-specs');
    if (!quickSpecs) return;
    
    let specsHTML = '';
    
    if (isLaminate) {
        specsHTML = `
            <div class="spec">
                <span class="spec-name">Тип:</span>
                <span class="spec-value">${product.type || 'Не указан'}</span>
            </div>
            <div class="spec">
                <span class="spec-name">Толщина:</span>
                <span class="spec-value">${product.thickness || 'Не указана'}</span>
            </div>
            <div class="spec">
                <span class="spec-name">Класс:</span>
                <span class="spec-value">${product.wear_class || 'Не указан'}</span>
            </div>
        `;
    } else {
        specsHTML = `
            <div class="spec">
                <span class="spec-name">Тип:</span>
                <span class="spec-value">${product.type || 'Не указан'}</span>
            </div>
            <div class="spec">
                <span class="spec-name">Материал:</span>
                <span class="spec-value">${product.material || 'Не указан'}</span>
            </div>
            <div class="spec">
                <span class="spec-name">Стиль:</span>
                <span class="spec-value">${product.style || 'Не указан'}</span>
            </div>
        `;
    }
    
    quickSpecs.innerHTML = specsHTML;
}

// Настройка галереи изображений
function setupProductGallery(product, isLaminate) {
    console.log('Настройка галереи...');
    
    // Теперь элементы точно должны быть, так как мы их создали
    const galleryThumbs = document.querySelector('.gallery-thumbs');
    const mainImage = document.getElementById('mainImage');
    
    if (!galleryThumbs || !mainImage) {
        console.error('Элементы галереи все еще не найдены');
        return;
    }
    
    // Определяем коллекцию для URL изображений
    const collectionName = isLaminate ? 'laminate' : 'doors';
    
    // Проверяем наличие изображений
    if (!product.picture || !Array.isArray(product.picture) || product.picture.length === 0) {
        console.log('Нет изображений товара');
        
        mainImage.src = 'img/no-image.jpg';
        mainImage.alt = product.name || 'Нет изображения';
        galleryThumbs.innerHTML = '<p>Изображения отсутствуют</p>';
        return;
    }
    
    console.log('Количество изображений:', product.picture.length);
    
    // Отображаем первое изображение как основное
    const firstImageUrl = `http://127.0.0.1:8090/api/files/${collectionName}/${product.id}/${product.picture[0]}`;
    mainImage.src = firstImageUrl;
    mainImage.alt = product.name || 'Изображение товара';
    
    // Создаем миниатюры
    galleryThumbs.innerHTML = '';
    
    product.picture.forEach((imageName, index) => {
        const thumbUrl = `http://127.0.0.1:8090/api/files/${collectionName}/${product.id}/${imageName}`;
        
        const thumbElement = document.createElement('div');
        thumbElement.className = `thumb ${index === 0 ? 'active' : ''}`;
        
        thumbElement.innerHTML = `
            <img src="${thumbUrl}" 
                 alt="${product.name || 'Товар'} - изображение ${index + 1}"
                 loading="lazy"
                 onerror="this.src='img/no-image.jpg'">
        `;
        
        thumbElement.addEventListener('click', () => {
            // Обновляем активную миниатюру
            document.querySelectorAll('.thumb').forEach(thumb => {
                thumb.classList.remove('active');
            });
            thumbElement.classList.add('active');
            
            // Обновляем основное изображение
            mainImage.src = thumbUrl;
        });
        
        galleryThumbs.appendChild(thumbElement);
    });
    
    console.log('Галерея настроена');
}

//Создание элементов галереи если их нет
function createGalleryElements() {
    console.log('Создание элементов галереи...');
    
    const productGallery = document.querySelector('.product-gallery');
    if (!productGallery) {
        console.error('Контейнер галереи не найден');
        return;
    }
    
    productGallery.innerHTML = `
        <div class="gallery-main">
            <img src="" alt="" class="gallery-main__image" id="mainImage">
        </div>
        <div class="gallery-thumbs">
            <!-- Миниатюры загрузятся динамически -->
        </div>
    `;
}

//Открытие модального окна замерщика
function openMeasureModal() {
    console.log('Открытие модального окна замерщика...');
    
    const modalOverlay = document.getElementById('modalOverlay');
    const measureModal = document.getElementById('measureModal');
    
    if (!modalOverlay || !measureModal) {
        // Создаем модальное окно если его нет
        createMeasureModal();
        return;
    }
    
    modalOverlay.style.display = 'block';
    measureModal.style.display = 'block';
    
    // Автозаполнение текущей даты
    const dateInput = measureModal.querySelector('input[type="date"]');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        dateInput.value = today;
    }
    
    // Фокус на первое поле
    const nameInput = measureModal.querySelector('input[name="name"]');
    if (nameInput) {
        nameInput.focus();
    }
}

//Создание модального окна
function createMeasureModal() {
    console.log('Создание модального окна...');
    
    // Создаем overlay
    let modalOverlay = document.getElementById('modalOverlay');
    if (!modalOverlay) {
        modalOverlay = document.createElement('div');
        modalOverlay.id = 'modalOverlay';
        modalOverlay.className = 'modal-overlay';
        modalOverlay.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        document.body.appendChild(modalOverlay);
    }
    
    // Создаем модальное окно
    let measureModal = document.getElementById('measureModal');
    if (!measureModal) {
        measureModal = document.createElement('div');
        measureModal.id = 'measureModal';
        measureModal.className = 'modal';
        measureModal.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 10px;
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
        `;
        
        measureModal.innerHTML = `
            <button class="modal-close" id="modalClose" style="
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
            ">&times;</button>
            
            <h2 style="margin-top: 0; margin-bottom: 20px; color: #2c3e50;">Вызвать замерщика</h2>
            
            <form class="measure-form" style="display: flex; flex-direction: column; gap: 15px;">
                <div style="display: flex; flex-direction: column; gap: 5px;">
                    <label for="measure-name" style="font-weight: 500; color: #333;">Ваше имя *</label>
                    <input type="text" id="measure-name" name="name" required 
                           style="padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 5px;">
                    <label for="measure-phone" style="font-weight: 500; color: #333;">Телефон *</label>
                    <input type="tel" id="measure-phone" name="phone" required 
                           placeholder="+7 (___) ___-__-__"
                           style="padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 5px;">
                    <label for="measure-address" style="font-weight: 500; color: #333;">Адрес *</label>
                    <input type="text" id="measure-address" name="address" required 
                           placeholder="Улица, дом, квартира"
                           style="padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 5px;">
                    <label for="measure-date" style="font-weight: 500; color: #333;">Желаемая дата замера</label>
                    <input type="date" id="measure-date" name="date" 
                           style="padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 5px;">
                    <label for="measure-message" style="font-weight: 500; color: #333;">Комментарий</label>
                    <textarea id="measure-message" name="message" rows="3" 
                              placeholder="Дополнительная информация..."
                              style="padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; resize: vertical;"></textarea>
                </div>
                
                <button type="submit" style="
                    background: #e74c3c;
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 6px;
                    font-size: 16px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.3s;
                    margin-top: 10px;
                ">
                    Отправить заявку
                </button>
                
                <p style="font-size: 12px; color: #666; margin-top: 10px;">
                    * Обязательные для заполнения поля
                </p>
            </form>
        `;
        
        modalOverlay.appendChild(measureModal);
        
        // Настраиваем обработчики для нового модального окна
        setupModalHandlers();
    }
    
    // Показываем модальное окно
    modalOverlay.style.display = 'flex';
    measureModal.style.display = 'block';
}

// НОВАЯ ФУНКЦИЯ: настройка обработчиков модального окна
function setupModalHandlers() {
    const modalOverlay = document.getElementById('modalOverlay');
    const measureModal = document.getElementById('measureModal');
    const modalClose = document.getElementById('modalClose');
    const measureForm = measureModal?.querySelector('.measure-form');
    
    // Закрытие по кнопке
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            modalOverlay.style.display = 'none';
            measureModal.style.display = 'none';
        });
    }
    
    // Закрытие по клику на overlay
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.style.display = 'none';
                measureModal.style.display = 'none';
            }
        });
    }
    
    // Закрытие по Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.style.display === 'flex') {
            modalOverlay.style.display = 'none';
            measureModal.style.display = 'none';
        }
    });
    
    // Обработка формы
    if (measureForm) {
        measureForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(measureForm);
            const data = Object.fromEntries(formData);
            
            try {
                // Добавляем информацию о товаре
                const productId = new URLSearchParams(window.location.search).get('id');
                if (productId) {
                    data.product = productId;
                    data.product_page = window.location.href;
                }
                
                // Отправляем данные
                await pb.collection('measure_requests').create(data);
                
                // Показываем сообщение об успехе
                alert('✅ Ваша заявка принята! Мы свяжемся с вами в ближайшее время для уточнения деталей.');
                
                // Закрываем модальное окно
                modalOverlay.style.display = 'none';
                measureModal.style.display = 'none';
                
                // Сбрасываем форму
                measureForm.reset();
                
            } catch (error) {
                console.error('Ошибка отправки заявки:', error);
                alert('❌ Произошла ошибка при отправке заявки. Пожалуйста, попробуйте позже или свяжитесь с нами по телефону.');
            }
        });
    }
}

// Функция для проверки, темный ли цвет
function isColorDark(hexColor) {
    // Конвертируем HEX в RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Формула для определения яркости
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Возвращаем true если цвет темный
    return brightness < 128;
}

// Обновленная функция fillDescriptionAndSpecs
function fillDescriptionAndSpecs(product, isLaminate) {
    console.log('Заполнение описания и характеристик...');
    console.log('Данные товара:', {
        name: product.name,
        color: product.color,
        type: typeof product.color
    });
    
    // Получаем HTML для цветовых чипов
    const colorsHTML = getColorChipsHTML(product.color);
    console.log('Сгенерированный HTML цветов:', colorsHTML);
    
    // 1. ОБНОВЛЯЕМ ВКЛАДКУ "ОПИСАНИЕ"
    const descriptionTab = document.getElementById('description');
    if (descriptionTab) {
        let descriptionContent = `
            <h2>${product.name || 'Описание товара'}</h2>
            <div class="product-description-content">
        `;
        
        if (product.description) {
            descriptionContent += `
                <div class="description-text">
                    ${product.description.replace(/\r\n/g, '<br>').replace(/\n/g, '<br>')}
                </div>
            `;
        } else {
            descriptionContent += '<p>Описание отсутствует</p>';
        }
        
        // Добавляем секцию с цветами если они есть
        if (colorsHTML) {
            descriptionContent += `
                <div class="colors-section">
                    <h3>Доступные цвета:</h3>
                    <div class="color-chips">
                        ${colorsHTML}
                    </div>
                </div>
            `;
        }
        
        descriptionContent += `</div>`;
        descriptionTab.innerHTML = descriptionContent;
    }
    
    // 2. ОБНОВЛЯЕМ ВКЛАДКУ "ХАРАКТЕРИСТИКИ"
    const specsTable = document.querySelector('#specifications .specs-table');
    if (specsTable) {
        // Получаем текстовое представление цветов
        const colorsText = getFormattedColors(product.color);
        
        let specsHTML = '';
        
        if (isLaminate) {
            specsHTML = `
                <div class="spec-row">
                    <div class="spec-name">Название</div>
                    <div class="spec-value">${product.name || 'Не указано'}</div>
                </div>
                ${product.type ? `
                <div class="spec-row">
                    <div class="spec-name">Тип</div>
                    <div class="spec-value">${product.type}</div>
                </div>
                ` : ''}
                ${product.thickness ? `
                <div class="spec-row">
                    <div class="spec-name">Толщина</div>
                    <div class="spec-value">${product.thickness}</div>
                </div>
                ` : ''}
                ${product.wear_class ? `
                <div class="spec-row">
                    <div class="spec-name">Класс износостойкости</div>
                    <div class="spec-value">${product.wear_class}</div>
                </div>
                ` : ''}
                ${colorsText !== 'Не указан' ? `
                <div class="spec-row">
                    <div class="spec-name">Цвета</div>
                    <div class="spec-value">${colorsText}</div>
                </div>
                ` : ''}
                ${product.number_id ? `
                <div class="spec-row">
                    <div class="spec-name">Артикул</div>
                    <div class="spec-value">${product.number_id}</div>
                </div>
                ` : ''}
            `;
        } else {
            specsHTML = `
                <div class="spec-row">
                    <div class="spec-name">Название</div>
                    <div class="spec-value">${product.name || 'Не указано'}</div>
                </div>
                ${product.type ? `
                <div class="spec-row">
                    <div class="spec-name">Тип двери</div>
                    <div class="spec-value">${product.type}</div>
                </div>
                ` : ''}
                ${product.material ? `
                <div class="spec-row">
                    <div class="spec-name">Материал</div>
                    <div class="spec-value">${product.material}</div>
                </div>
                ` : ''}
                ${product.style ? `
                <div class="spec-row">
                    <div class="spec-name">Стиль</div>
                    <div class="spec-value">${product.style}</div>
                </div>
                ` : ''}
                ${colorsText !== 'Не указан' ? `
                <div class="spec-row">
                    <div class="spec-name">Цвета</div>
                    <div class="spec-value">${colorsText}</div>
                </div>
                ` : ''}
                ${product.number_id ? `
                <div class="spec-row">
                    <div class="spec-name">Артикул</div>
                    <div class="spec-value">${product.number_id}</div>
                </div>
                ` : ''}
            `;
        }
        
        specsTable.innerHTML = specsHTML;
    }
    
    // 3. ОБНОВЛЯЕМ ВКЛАДКУ "ОТЗЫВЫ" (если есть отзывы)
    // Этот код уже должен быть в loadProductReviews
    
    console.log('Описание и характеристики заполнены');
}

// Функция для отображения цветов в текстовом виде
function getFormattedColors(colorData) {
    if (!colorData) return 'Не указан';
    
    let colors = [];
    
    if (typeof colorData === 'string') {
        try {
            const parsed = JSON.parse(colorData);
            if (Array.isArray(parsed)) {
                colors = parsed;
            } else {
                colors = [colorData];
            }
        } catch (e) {
            colors = [colorData];
        }
    } else if (Array.isArray(colorData)) {
        colors = colorData;
    }
    
    colors = colors.filter(c => c);
    return colors.length > 0 ? colors.join(', ') : 'Не указан';
}

function getColorHex(russianName) {
    // Приводим к нижнему регистру и убираем пробелы
    const lowerName = russianName.toString().toLowerCase().trim();
    
    // Карта соответствия русских названий цветов HEX кодам
    const colorMap = {
        // Основные цвета
        'белый': '#FFFFFF',
        'черный': '#000000',
        'серый': '#808080',
        'серебристый': '#C0C0C0',
        'серебро': '#C0C0C0',
        
        // Красные оттенки
        'красный': '#FF0000',
        'красное': '#FF0000',
        'бордовый': '#800000',
        'бордо': '#800000',
        'вишневый': '#911E42',
        'вишня': '#911E42',
        
        // Коричневые оттенки (дерево)
        'коричневый': '#8B4513',
        'коричневое': '#8B4513',
        'дуб': '#C19A6B',
        'дубовый': '#C19A6B',
        'дуб беленый': '#E8DCC6',
        'дуб мореный': '#4A3728',
        'орех': '#773F1A',
        'ореховый': '#773F1A',
        'ясень': '#F5EBDC',
        'ясеневый': '#F5EBDC',
        'бук': '#F5E1C8',
        'сосна': '#FFD39B',
        'сосновый': '#FFD39B',
        'венге': '#645452',
        
        // Бежевые оттенки
        'бежевый': '#F5F5DC',
        'бежевое': '#F5F5DC',
        
        // Зеленые оттенки
        'зеленый': '#008000',
        'зеленое': '#008000',
        'оливковый': '#808000',
        
        // Синие оттенки
        'синий': '#0000FF',
        'синее': '#0000FF',
        'голубой': '#87CEEB',
        'голубое': '#87CEEB',
        'темно-синий': '#00008B',
        
        // Фиолетовые
        'фиолетовый': '#800080',
        'фиолетовое': '#800080',
        
        // Металлические
        'золотой': '#FFD700',
        'золото': '#FFD700',
        'бронза': '#CD7F32',
        'бронзовый': '#CD7F32',
        'хром': '#A8A9AD',
        'хромированный': '#A8A9AD',
        'сталь': '#B0B0B0',
        'стальной': '#B0B0B0',
        'никель': '#727272',
        
        // Каменные
        'мрамор': '#E5E4E2',
        'мраморный': '#E5E4E2',
        'гранит': '#696969',
        'гранитный': '#696969'
    };
    
    // Ищем точное совпадение
    if (colorMap[lowerName]) {
        return colorMap[lowerName];
    }
    
    // Если точного совпадения нет, ищем частичное
    for (const [colorName, hexValue] of Object.entries(colorMap)) {
        if (lowerName.includes(colorName) || colorName.includes(lowerName)) {
            return hexValue;
        }
    }
    
    // Если цвет не найден, генерируем случайный но контрастный
    console.log(`Цвет "${russianName}" не найден в карте, генерируем...`);
    return generateColorFromName(russianName);
}

// Функция для генерации цвета из имени (если цвет не найден в карте)
function generateColorFromName(name) {
    // Создаем хеш из строки для детерминированного цвета
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Генерируем цвет в теплой палитре (коричневые, бежевые оттенки)
    // что подходит для дверей и ламината
    const hue = (hash % 30) + 20; // 20-50 - оранжево-коричневые оттенки
    const saturation = (hash % 30) + 40; // 40-70% насыщенность
    const lightness = (hash % 40) + 40; // 40-80% светлота
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Упрощенная функция для создания цветовых чипов
function getColorChipsHTML(colorData) {
    console.log('Данные цвета из БД:', colorData);
    
    if (!colorData) {
        return '';
    }
    
    let colors = [];
    
    // Обрабатываем разные форматы данных
    if (typeof colorData === 'string') {
        // Проверяем, не JSON ли это
        if (colorData.startsWith('[') || colorData.startsWith('"')) {
            try {
                const parsed = JSON.parse(colorData);
                colors = Array.isArray(parsed) ? parsed : [parsed];
            } catch (e) {
                colors = [colorData];
            }
        } else {
            // Разделяем строку по запятым если их несколько
            colors = colorData.split(',').map(c => c.trim()).filter(c => c);
        }
    } else if (Array.isArray(colorData)) {
        colors = colorData;
    }
    
    // Фильтруем пустые значения
    colors = colors.filter(color => color && color.toString().trim());
    
    if (colors.length === 0) {
        return '';
    }
    
    console.log('Обработанные цвета:', colors);
    
    // Создаем HTML
    return colors.map(color => {
        const colorName = color.toString().trim();
        const hexColor = getColorHex(colorName);
        
        // Определяем, темный ли цвет для выбора цвета текста
        const isDarkColor = isColorDark(hexColor);
        const textColor = isDarkColor ? '#FFFFFF' : '#000000';
        
        return `
            <div class="color-chip" title="${colorName}">
                <div class="color-sample" style="background-color: ${hexColor};"></div>
                <span class="color-name">${colorName}</span>
            </div>
        `;
    }).join('');
}

// Инициализация табов
function initializeTabs() {
    console.log('Инициализация табов...');
    
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    if (tabButtons.length === 0 || tabPanes.length === 0) {
        console.error('Табы не найдены в DOM');
        return;
    }
    
    // Устанавливаем обработчики кликов
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Убираем активный класс у всех кнопок
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // Добавляем активный класс текущей кнопке
            this.classList.add('active');
            
            // Скрываем все панели
            tabPanes.forEach(pane => pane.classList.remove('active'));
            // Показываем нужную панель
            const activePane = document.getElementById(tabId);
            if (activePane) {
                activePane.classList.add('active');
            }
        });
    });
    
    // Активируем первую вкладку
    const firstTab = tabButtons[0];
    if (firstTab) {
        const firstTabId = firstTab.getAttribute('data-tab');
        firstTab.classList.add('active');
        
        const firstPane = document.getElementById(firstTabId);
        if (firstPane) {
            firstPane.classList.add('active');
        }
    }
    
    // КНОПКА "НАПИСАТЬ ОТЗЫВ" - ДОБАВЛЯЕМ
    const writeReviewBtn = document.querySelector('.open-review-modal');
    if (writeReviewBtn) {
        writeReviewBtn.addEventListener('click', () => {
            alert('Функция написания отзывов скоро будет доступна!');
            // Можно добавить модальное окно для отзывов
        });
    }
    
    console.log('Табы инициализированы');
}

// Загрузка похожих товаров с приоритетом по материалу
async function loadSimilarProducts(currentProduct, collectionName) {
    console.log('Загрузка похожих товаров...');
    
    try {
        // Загружаем ВСЕ товары из коллекции для фильтрации
        const response = await pb.collection(collectionName).getList(1, 200);
        
        if (!response.items || response.items.length === 0) {
            console.log('Нет товаров для отображения');
            hideSimilarProductsSection();
            return;
        }
        
        // Исключаем текущий товар
        const allProducts = response.items.filter(item => item.id !== currentProduct.id);
        
        if (allProducts.length === 0) {
            console.log('Нет похожих товаров');
            hideSimilarProductsSection();
            return;
        }
        
        // Вычисляем похожесть и берем только 4 товара
        const similarProducts = findSimilarProductsByMaterial(currentProduct, allProducts, collectionName)
            .slice(0, 4); // Берем только 4 товара
        
        console.log('Похожие товары найдены:', similarProducts.length);
        displaySimilarProducts(similarProducts, collectionName);
        
    } catch (error) {
        console.error('Ошибка загрузки похожих товаров:', error);
        hideSimilarProductsSection();
    }
}

// Функция для поиска похожих товаров по материалу
function findSimilarProductsByMaterial(currentProduct, allProducts, collectionName) {
    // Устанавливаем минимальное количество товаров для отображения
    const MIN_PRODUCTS = 4;
    
    // Определяем материал текущего товара
    const currentMaterial = getProductMaterial(currentProduct, collectionName);
    console.log('Материал текущего товара:', currentMaterial);
    
    if (!currentMaterial) {
        // Если материал не указан, возвращаем случайные товары
        console.log('У текущего товара не указан материал, показываем случайные товары');
        return getRandomProducts(allProducts, MIN_PRODUCTS);
    }
    
    // Разделяем товары по группам
    const productsByMaterial = {
        sameMaterial: [],    // Товары с точно таким же материалом
        similarMaterial: [], // Товары с похожим материалом
        otherProducts: []    // Все остальные товары
    };
    
    // Классифицируем товары
    allProducts.forEach(product => {
        const productMaterial = getProductMaterial(product, collectionName);
        
        if (!productMaterial) {
            productsByMaterial.otherProducts.push(product);
            return;
        }
        
        // Проверяем точное совпадение материала
        if (isExactMaterialMatch(currentMaterial, productMaterial)) {
            productsByMaterial.sameMaterial.push(product);
        }
        // Проверяем похожий материал
        else if (isSimilarMaterial(currentMaterial, productMaterial, collectionName)) {
            productsByMaterial.similarMaterial.push(product);
        }
        else {
            productsByMaterial.otherProducts.push(product);
        }
    });
    
    console.log('Распределение по материалам:', {
        sameMaterial: productsByMaterial.sameMaterial.length,
        similarMaterial: productsByMaterial.similarMaterial.length,
        otherProducts: productsByMaterial.otherProducts.length
    });
    
    // Собираем финальный список товаров
    let finalProducts = [];
    
    // 1. Добавляем товары с точно таким же материалом
    if (productsByMaterial.sameMaterial.length > 0) {
        finalProducts = [...finalProducts, ...productsByMaterial.sameMaterial];
    }
    
    // 2. Если нужно больше товаров, добавляем с похожим материалом
    if (finalProducts.length < MIN_PRODUCTS && productsByMaterial.similarMaterial.length > 0) {
        const neededCount = MIN_PRODUCTS - finalProducts.length;
        const similarToAdd = productsByMaterial.similarMaterial.slice(0, neededCount);
        finalProducts = [...finalProducts, ...similarToAdd];
    }
    
    // 3. Если все еще нужно больше товаров, добавляем случайные из других
    if (finalProducts.length < MIN_PRODUCTS && productsByMaterial.otherProducts.length > 0) {
        const neededCount = MIN_PRODUCTS - finalProducts.length;
        const randomOther = getRandomProducts(productsByMaterial.otherProducts, neededCount);
        finalProducts = [...finalProducts, ...randomOther];
    }
    
    // 4. Если не набрали достаточно товаров, показываем все что есть
    if (finalProducts.length < MIN_PRODUCTS) {
        // Возвращаем все товары с сортировкой по схожести
        return sortByMaterialSimilarity(currentProduct, allProducts, collectionName)
            .slice(0, MIN_PRODUCTS);
    }
    
    return finalProducts;
}

// Получение случайных товаров
function getRandomProducts(products, count) {
    if (products.length <= count) {
        return [...products];
    }
    
    // Создаем копию массива и перемешиваем
    const shuffled = [...products].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

// Сортировка товаров по схожести материала
function sortByMaterialSimilarity(currentProduct, products, collectionName) {
    const currentMaterial = getProductMaterial(currentProduct, collectionName);
    
    if (!currentMaterial) {
        // Если материал не указан, возвращаем случайный порядок
        return [...products].sort(() => Math.random() - 0.5);
    }
    
    const currentMaterialLower = currentMaterial.toString().toLowerCase().trim();
    
    return [...products].sort((a, b) => {
        const materialA = getProductMaterial(a, collectionName);
        const materialB = getProductMaterial(b, collectionName);
        
        const scoreA = calculateMaterialScore(currentMaterialLower, materialA, collectionName);
        const scoreB = calculateMaterialScore(currentMaterialLower, materialB, collectionName);
        
        // Сначала сортируем по оценке (убывание)
        if (scoreB !== scoreA) {
            return scoreB - scoreA;
        }
        
        // При одинаковой оценке сортируем по цене (близость к текущей цене)
        const priceA = parseProductPrice(a.prise);
        const priceB = parseProductPrice(b.prise);
        const currentPrice = parseProductPrice(currentProduct.prise);
        
        if (currentPrice > 0) {
            const diffA = Math.abs(priceA - currentPrice);
            const diffB = Math.abs(priceB - currentPrice);
            return diffA - diffB;
        }
        
        return 0;
    });
}

// Расчет оценки схожести материала
function calculateMaterialScore(currentMaterial, productMaterial, collectionName) {
    if (!productMaterial) return 0;
    
    const productMaterialLower = productMaterial.toString().toLowerCase().trim();
    
    // 1. Точное совпадение - высший балл
    if (currentMaterial === productMaterialLower) {
        return 100;
    }
    
    // 2. Частичное совпадение (текущий материал содержит материал товара или наоборот)
    if (currentMaterial.includes(productMaterialLower) || productMaterialLower.includes(currentMaterial)) {
        return 80;
    }
    
    // 3. Принадлежность к одной группе материалов
    if (isSimilarMaterial(currentMaterial, productMaterialLower, collectionName)) {
        return 60;
    }
    
    // 4. Есть общие слова в названии материала
    const currentWords = currentMaterial.split(/[\s,.-]+/).filter(w => w.length > 2);
    const productWords = productMaterialLower.split(/[\s,.-]+/).filter(w => w.length > 2);
    
    const commonWords = currentWords.filter(word => 
        productWords.some(pWord => pWord.includes(word) || word.includes(pWord))
    );
    
    if (commonWords.length > 0) {
        return 40 + (commonWords.length * 10);
    }
    
    // 5. Минимальная оценка для товаров с указанным материалом
    return 10;
}

// Получение материала товара
function getProductMaterial(product, collectionName) {
    if (collectionName === 'laminate') {
        // Для ламината используем "type" как аналог материала
        return product.type || null;
    } else {
        // Для дверей используем поле "material"
        return product.material || null;
    }
}

// Проверка точного совпадения материала
function isExactMaterialMatch(material1, material2) {
    if (!material1 || !material2) return false;
    
    // Приводим к нижнему регистру и удаляем лишние пробелы
    const m1 = material1.toString().toLowerCase().trim();
    const m2 = material2.toString().toLowerCase().trim();
    
    // Точное совпадение
    return m1 === m2;
}

// Проверка похожести материала
function isSimilarMaterial(material1, material2, collectionName) {
    if (!material1 || !material2) return false;
    
    const m1 = material1.toString().toLowerCase().trim();
    const m2 = material2.toString().toLowerCase().trim();
    
    if (collectionName === 'laminate') {
        // Для ламината: группируем по типам
        const laminateGroups = {
            'дуб': ['дуб', 'древесина дуба', 'дубовый', 'под дуб'],
            'ясень': ['ясень', 'древесина ясеня', 'ясеневый'],
            'орех': ['орех', 'древесина ореха', 'ореховый'],
            'бук': ['бук', 'древесина бука', 'буковый'],
            'сосна': ['сосна', 'древесина сосны', 'сосновый'],
            'кедр': ['кедр', 'древесина кедра', 'кедровый'],
            'лиственница': ['лиственница', 'древесина лиственницы'],
            'вишня': ['вишня', 'древесина вишни', 'вишневый'],
            'красное дерево': ['красное дерево', 'краснодеревщик', 'махагони'],
            'экошпон': ['экошпон', 'эко шпон', 'ecoshpon'],
            'пвх': ['пвх', 'пластик', 'пластиковый'],
            'мдф': ['мдф', 'mdf', 'древесноволокнистая плита'],
            'ламинат': ['ламинат', 'ламинированный', 'laminat']
        };
        
        // Проверяем принадлежность к одной группе
        for (const [group, materials] of Object.entries(laminateGroups)) {
            const inGroup1 = materials.some(mat => m1.includes(mat) || mat.includes(m1));
            const inGroup2 = materials.some(mat => m2.includes(mat) || mat.includes(m2));
            
            if (inGroup1 && inGroup2) {
                return true;
            }
        }
        
        // Проверяем частичное совпадение
        return m1.includes(m2) || m2.includes(m1);
        
    } else {
        // Для дверей: группируем по материалам
        const doorGroups = {
            'массив': ['массив', 'массив дерева', 'цельное дерево', 'древесина'],
            'мдф': ['мдф', 'mdf', 'древесноволокнистая плита'],
            'шпон': ['шпон', 'натуральный шпон', 'шпонированный'],
            'экошпон': ['экошпон', 'эко шпон', 'ecoshpon'],
            'пвх': ['пвх', 'пластик', 'пластиковый'],
            'стекло': ['стекло', 'стеклянный', 'витраж'],
            'металл': ['металл', 'металлический', 'сталь', 'алюминий'],
            'комбинированный': ['комбинированный', 'комбинация', 'сочетание']
        };
        
        // Проверяем принадлежность к одной группе
        for (const [group, materials] of Object.entries(doorGroups)) {
            const inGroup1 = materials.some(mat => m1.includes(mat) || mat.includes(m1));
            const inGroup2 = materials.some(mat => m2.includes(mat) || mat.includes(m2));
            
            if (inGroup1 && inGroup2) {
                return true;
            }
        }
        
        // Проверяем частичное совпадение
        return m1.includes(m2) || m2.includes(m1);
    }
}

// Функция для скрытия/показа загрузчика
function toggleSimilarProductsLoader(show) {
    const loader = document.getElementById('similarLoading');
    const grid = document.getElementById('similarProductsGrid');
    const noResults = document.getElementById('noSimilarProducts');
    const loadMoreBtn = document.getElementById('loadMoreSimilar');
    
    if (loader) loader.style.display = show ? 'block' : 'none';
    if (grid) grid.style.display = show ? 'none' : 'grid';
    if (noResults) noResults.style.display = 'none';
    if (loadMoreBtn) loadMoreBtn.style.display = 'none';
}

// Глобальные переменные для загрузки больше товаров
let allSimilarProducts = [];
let displayedSimilarCount = 0;
const SIMILAR_PER_PAGE = 4;

// Обновленная функция displaySimilarProducts
function displaySimilarProducts(products, collectionName, reset = true) {
    const grid = document.getElementById('similarProductsGrid');
    const noResults = document.getElementById('noSimilarProducts');
    const loadMoreBtn = document.getElementById('loadMoreSimilar');
    
    // Удаляем кнопку "Показать еще" если она есть
    if (loadMoreBtn) {
        loadMoreBtn.remove();
    }
    
    if (reset) {
        grid.innerHTML = '';
    }
    
    toggleSimilarProductsLoader(false);
    
    if (!products || products.length === 0) {
        if (grid) grid.style.display = 'none';
        if (noResults) noResults.style.display = 'block';
        return;
    }
    
    // Добавляем только до 4 товаров
    const productsToShow = products.slice(0, 4);
    
    // Добавляем товары в сетку
    productsToShow.forEach(product => {
        const productCard = createSimilarProductCard(product, collectionName);
        grid.appendChild(productCard);
    });
    
    // Скрываем сообщение об отсутствии товаров
    if (noResults) noResults.style.display = 'none';
}

// Обновленная функция createSimilarProductCard с выделением материала
function createSimilarProductCard(product, collectionName) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // Получаем короткий ID
    const shortId = product.id.substring(0, 8);
    
    // Получаем материал товара
    const productMaterial = getProductMaterial(product, collectionName);
    
    // Добавляем data атрибуты с информацией о материале
    card.dataset.productId = product.id;
    card.dataset.productMaterial = productMaterial || '';
    card.dataset.productType = product.type || '';
    card.dataset.productColor = JSON.stringify(product.color || []);
    card.dataset.productStyle = product.style || '';
    card.dataset.productPrice = parseProductPrice(product.prise);
    
    // URL изображения
    let imageUrl = 'img/no-image.jpg';
    if (product.picture && product.picture.length > 0) {
        imageUrl = `http://127.0.0.1:8090/api/files/${collectionName}/${product.id}/${product.picture[0]}`;
    }
    
    // Определяем класс для контейнера изображения
    const isLaminate = collectionName === 'laminate';
    const imageContainerClass = isLaminate ? 'laminate-image-container' : 'door-image-container';
    const imageClass = isLaminate ? 'laminate-image' : 'door-image';
    
    // Цена
    const price = parseProductPrice(product.prise);
    const priceDisplay = price > 0 ? formatPrice(price) : 'Цена по запросу';
    
    // URL страницы товара
    const productPage = collectionName === 'laminate' ? 'laminate-product.html' : 'product.html';
    
    // Описание (обрезаем до 80 символов)
    const description = product.description ? 
        (product.description.length > 80 ? 
            product.description.substring(0, 80) + '...' : 
            product.description) : 
        'Описание отсутствует';
    
    // Кнопка конструктора только для ламината
    const constructorButton = collectionName === 'laminate' ? 
        `<button class="btn-constructor" onclick="addToConstructor('${product.id}', '${escapeHtml(product.name || '')}', '${escapeHtml(getFirstColor(product.color))}')">
            В конструктор
        </button>` : '';
    
    // Формируем характеристики с выделением материала
    let specsHTML = '';
    
    // 1. Материал (выделяем жирным если есть)
    if (productMaterial) {
        specsHTML += `<div class="product-spec highlight-material">${productMaterial}</div>`;
    }
    
    // 2. Дополнительные характеристики
    if (isLaminate) {
        if (product.thickness) {
            specsHTML += `<div class="product-spec">${product.thickness}</div>`;
        }
        if (product.wear_class) {
            specsHTML += `<div class="product-spec">${product.wear_class} класс</div>`;
        }
    } else {
        if (product.type) {
            specsHTML += `<div class="product-spec">${product.type}</div>`;
        }
        if (product.style) {
            specsHTML += `<div class="product-spec">${product.style}</div>`;
        }
    }
    
    card.innerHTML = `
        <div class="product-image-container ${imageContainerClass}">
            <img src="${imageUrl}" 
                 alt="${escapeHtml(product.name || 'Товар')}" 
                 class="product-image ${imageClass}"
                 loading="lazy"
                 onerror="this.src='img/no-image.jpg'"
                 onclick="window.location.href='${productPage}?id=${product.id}'">
        </div>
        <div class="product-info">
            <h3 class="product-title">${escapeHtml(product.name || 'Без названия')}</h3>
            <p class="product-description">${escapeHtml(description)}</p>            
            <div class="product-price ${isLaminate ? 'laminate-price' : 'door-price'}">${priceDisplay}</div>
            <div class="product-actions">
                <a href="${productPage}?id=${product.id}" class="btn-details">Подробнее</a>
                ${constructorButton}
            </div>
        </div>
    `;
    
    return card;
}

// Добавляем CSS стили для выделения материала
const materialStyles = `
    .product-spec {
        background: #f0f0f0;
        color: #666;
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
    }
    
    .highlight-material {
        background: linear-gradient(135deg, #eabb66 0%, #e74c3c 100%) !important;
        color: white !important;
        font-weight: 600 !important;
        box-shadow: 0 2px 4px rgba(231, 76, 60, 0.3);
    }
    
    .load-more-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        width: 100%;
        padding: 15px;
        background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        margin: 20px auto 0;
        max-width: 300px;
    }
    
    .load-more-btn:hover {
        background: linear-gradient(135deg, #c0392b 0%, #a93226 100%);
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
    }
    
    .load-more-btn:active {
        transform: translateY(0);
    }
    
    .load-more-count {
        background: white;
        color: #e74c3c;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 700;
    }
    
    .material-info {
        font-size: 12px;
        color: #666;
        margin-top: 5px;
        padding-left: 10px;
        border-left: 3px solid #e74c3c;
    }
`;

// Добавляем обновленные стили
const styleElement = document.querySelector('style');
if (styleElement) {
    styleElement.textContent += materialStyles;
}

// Скрытие секции похожих товаров
function hideSimilarProductsSection() {
    const section = document.querySelector('.recommended-products');
    if (section) {
        section.style.display = 'none';
    }
}

// Вспомогательная функция для получения первого цвета
function getFirstColor(colorData) {
    if (!colorData) return '';
    
    if (Array.isArray(colorData)) {
        return colorData.length > 0 ? colorData[0] : '';
    } else if (typeof colorData === 'string') {
        return colorData;
    }
    
    return '';
}

// Функция для экранирования HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Глобальная функция для добавления в конструктор
window.addToConstructor = function(productId, productName, color) {
    console.log(`Добавление в конструктор: ${productId} - ${productName}`, color);
    
    // Используем относительный путь
    const url = 'laminate-constructor.html';
    
    // Создаем параметры URL
    const params = new URLSearchParams();
    params.append('product_id', productId);
    
    if (productName) {
        params.append('product_name', encodeURIComponent(productName));
    }
    
    // Добавляем цвет если он есть
    if (color && typeof color === 'string' && color.trim()) {
        params.append('color', encodeURIComponent(color.trim()));
    }
    
    // Сохраняем данные в sessionStorage для конструктора
    try {
        const productData = {
            id: productId,
            name: productName,
            selectedColor: color || '',
            collection: 'laminate'
        };
        sessionStorage.setItem('constructor_product', JSON.stringify(productData));
        console.log('Данные сохранены в sessionStorage:', productData);
    } catch (e) {
        console.error('Ошибка сохранения в sessionStorage:', e);
    }
    
    // Формируем полный URL
    const fullUrl = `${url}?${params.toString()}`;
    console.log('Переход на страницу конструктора:', fullUrl);
    
    // Переходим на страницу конструктора
    window.location.href = fullUrl;
};

// Скрытие секции похожих товаров
function hideSimilarProductsSection() {
    const section = document.querySelector('.recommended-products');
    if (section) {
        section.style.display = 'none';
    }
}

// Загрузка отзывов
async function loadProductReviews(productId) {
    console.log('Загрузка отзывов...');
    
    try {
        // Пробуем загрузить отзывы
        const response = await fetch(
            `http://127.0.0.1:8090/api/collections/reviews/records?perPage=10`
        );
        
        if (!response.ok) {
            console.log('Не удалось загрузить отзывы через API');
            return;
        }
        
        const result = await response.json();
        
        if (!result.items || !Array.isArray(result.items)) {
            console.log('Нет отзывов');
            return;
        }
        
        // Фильтруем отзывы для этого товара
        const productReviews = result.items.filter(review => {
            const reviewProductId = review.product;
            return reviewProductId === productId || 
                   (reviewProductId && typeof reviewProductId === 'object' && reviewProductId.id === productId);
        });
        
        console.log('Отзывы найдены:', productReviews.length);
        displayProductReviews(productReviews);
        
    } catch (error) {
        console.error('Ошибка загрузки отзывов:', error);
    }
}

// Отображение отзывов
function displayProductReviews(reviews) {
    console.log('Отображение отзывов...');
    
    const reviewsList = document.querySelector('.reviews-list');
    const ratingCount = document.querySelector('.rating-count');
    const ratingValue = document.querySelector('.rating-value');
    const reviewsTabBtn = document.querySelector('[data-tab="reviews"]');
    
    if (!reviewsList) {
        console.error('Контейнер отзывов не найден');
        return;
    }
    
    if (!reviews || reviews.length === 0) {
        reviewsList.innerHTML = '<p class="no-reviews">Пока нет отзывов. Будьте первым!</p>';
        
        if (ratingCount) ratingCount.textContent = 'на основе 0 отзывов';
        if (ratingValue) ratingValue.textContent = '0.0';
        if (reviewsTabBtn) reviewsTabBtn.textContent = 'Отзывы (0)';
        
        return;
    }
    
    // Рассчитываем средний рейтинг
    const averageRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length;
    
    if (ratingCount) ratingCount.textContent = `на основе ${reviews.length} отзывов`;
    if (ratingValue) ratingValue.textContent = averageRating.toFixed(1);
    if (reviewsTabBtn) reviewsTabBtn.textContent = `Отзывы (${reviews.length})`;
    
    // Отображаем отзывы
    let reviewsHTML = '';
    
    reviews.forEach(review => {
        const date = new Date(review.created);
        const formattedDate = date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        // Генерируем звезды рейтинга
        let starsHTML = '';
        const rating = review.rating || 0;
        
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                starsHTML += '<span class="star filled">★</span>';
            } else {
                starsHTML += '<span class="star">☆</span>';
            }
        }
        
        reviewsHTML += `
            <div class="review">
                <div class="review-header">
                    <div class="review-author">${review.author_name || 'Анонимный пользователь'}</div>
                    <div class="review-date">${formattedDate}</div>
                </div>
                <div class="review-rating">
                    <div class="stars">${starsHTML}</div>
                </div>
                <div class="review-text">${review.text || ''}</div>
            </div>
        `;
    });
    
    reviewsList.innerHTML = reviewsHTML;
    console.log('Отзывы отображены');
}

// Показать состояние загрузки
function showLoadingState() {
    console.log('Показать состояние загрузки...');
    
    const productMain = document.querySelector('.product-main');
    if (productMain) {
        productMain.innerHTML = `
            <div class="loading-container">
                <div class="spinner"></div>
                <p>Загрузка информации о товаре...</p>
            </div>
        `;
    }
}

// Скрыть состояние загрузки
function hideLoadingState() {
    console.log('Скрыть состояние загрузки...');
    
    const loadingContainer = document.querySelector('.loading-container');
    if (loadingContainer) {
        loadingContainer.remove();
    }
}

// Показать сообщение об ошибке
function showError(message) {
    console.error('Показать ошибку:', message);
    
    const productPage = document.querySelector('.product-page');
    if (productPage) {
        productPage.innerHTML = `
            <div class="error-container">
                <h2>Ошибка</h2>
                <p>${message}</p>
                <div class="error-actions">
                    <a href="catalog.html" class="btn btn--primary">Вернуться в каталог</a>
                    <button onclick="location.reload()" class="btn btn--secondary">Обновить страницу</button>
                </div>
            </div>
        `;
    }
}

// Показать сообщение об ошибке (уведомление)
function showErrorMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f44336;
        color: white;
        padding: 15px 20px;
        border-radius: 4px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Инициализация модальных окон и обработчиков
function initializeModals() {
    console.log('Инициализация модальных окон...');
    
    // Кнопка вызова замерщика
    const measureButtons = document.querySelectorAll('.open-measure-modal');
    measureButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = document.getElementById('measureModal');
            if (modal) {
                modal.style.display = 'flex';
                
                // Автозаполнение даты
                const dateInput = modal.querySelector('input[type="date"]');
                if (dateInput) {
                    const today = new Date().toISOString().split('T')[0];
                    dateInput.min = today;
                    dateInput.value = today;
                }
            }
        });
    });
    
    // Закрытие модальных окон
    const modalCloseButtons = document.querySelectorAll('.modal-close, .modal-overlay');
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = document.getElementById('measureModal');
            const overlay = document.getElementById('modalOverlay');
            
            if (modal) modal.style.display = 'none';
            if (overlay) overlay.style.display = 'none';
        });
    });
    
    // Форма вызова замерщика
    const measureForm = document.querySelector('.measure-form');
    if (measureForm) {
        measureForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(measureForm);
            const data = Object.fromEntries(formData);
            
            try {
                // Отправляем заявку
                await pb.collection('measure_requests').create(data);
                
                alert('Ваша заявка принята! Мы свяжемся с вами в ближайшее время.');
                
                // Закрываем модальное окно
                const modal = document.getElementById('measureModal');
                const overlay = document.getElementById('modalOverlay');
                
                if (modal) modal.style.display = 'none';
                if (overlay) overlay.style.display = 'none';
                
                // Сбрасываем форму
                measureForm.reset();
                
            } catch (error) {
                console.error('Ошибка отправки заявки:', error);
                alert('Произошла ошибка при отправке заявки. Пожалуйста, попробуйте позже.');
            }
        });
    }
}

// Инициализация всего при загрузке страницы
setTimeout(() => {
    initializeModals();
}, 1000);

// Добавляем CSS стили
const style = document.createElement('style');
style.textContent = `
    .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 400px;
        text-align: center;
    }
    
    .spinner {
        width: 50px;
        height: 50px;
        border: 5px solid #f3f3f3;
        border-top: 5px solid #e74c3c;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 20px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .error-container {
        text-align: center;
        padding: 100px 20px;
        max-width: 600px;
        margin: 0 auto;
    }
    
    .error-container h2 {
        color: #e74c3c;
        margin-bottom: 20px;
    }
    
    .error-container p {
        color: #666;
        margin-bottom: 30px;
        font-size: 18px;
    }
    
    .error-actions {
        display: flex;
        gap: 15px;
        justify-content: center;
        flex-wrap: wrap;
    }
    
    .color-chips {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-top: 10px;
    }
    
    .color-chip {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
    }
    
    .color-sample {
        width: 40px;
        height: 40px;
        border-radius: 4px;
        border: 1px solid #ddd;
        background: #f5f5f5;
    }
    
    .color-name {
        font-size: 12px;
        color: #666;
    }
    
    .description-text {
        line-height: 1.6;
        color: #333;
        margin-bottom: 20px;
    }
    
    .review {
        background: white;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 20px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.08);
    }
    
    .review-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        flex-wrap: wrap;
        gap: 10px;
    }
    
    .review-author {
        font-weight: 500;
        color: #2c3e50;
    }
    
    .review-date {
        color: #666;
        font-size: 14px;
    }
    
    .review-rating {
        margin-bottom: 15px;
    }
    
    .stars {
        display: flex;
        gap: 2px;
    }
    
    .star {
        color: #ddd;
        font-size: 20px;
    }
    
    .star.filled {
        color: #ffc107;
    }
    
    .review-text {
        color: #666;
        line-height: 1.6;
    }
    
    .no-reviews {
        text-align: center;
        padding: 40px 20px;
        color: #666;
        font-style: italic;
    }
    
    .no-reviews {
        text-align: center;
        padding: 40px 20px;
        color: #666;
        font-style: italic;
    }
    
    .price-on-request {
        color: #666;
        font-style: italic;
        font-size: 18px;
    }
    
    .btn--outline {
        background: transparent;
        border: 2px solid #e74c3c;
        color: #e74c3c;
        padding: 8px 20px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s;
        display: inline-block;
        text-align: center;
        text-decoration: none;
        font-weight: 500;
        width: 100%;
    }
    
    .btn--outline:hover {
        background: #e74c3c;
        color: white;
    }
    
    .thumb {
        cursor: pointer;
        border: 2px solid transparent;
        border-radius: 4px;
        overflow: hidden;
        transition: border-color 0.3s;
        width: 80px;
        height: 80px;
    }
    
    .thumb.active {
        border-color: #e74c3c;
    }
    
    .thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .tab-btn {
        padding: 12px 20px;
        background: none;
        border: none;
        border-bottom: 3px solid transparent;
        cursor: pointer;
        font-size: 16px;
        color: #666;
        transition: all 0.3s;
    }
    
    .tab-btn.active {
        color: #e74c3c;
        border-bottom-color: #e74c3c;
        font-weight: 500;
    }
    
    .tab-pane {
        display: none;
        padding: 20px 0;
        opacity: 0;
        transform: translateY(10px);
        transition: opacity 0.3s, transform 0.3s;
    }
    
    .tab-pane.active {
        display: block;
        opacity: 1;
        transform: translateY(0);
    }
    
    .tabs-nav {
        display: flex;
        border-bottom: 1px solid #eee;
        margin-bottom: 20px;
        flex-wrap: wrap;
    }
    
    .tabs-content {
        min-height: 200px;
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

.btn-icon {
    filter: invert(1);
    margin-right: 8px;
    font-size: 18px;
}
.btn-icon img {
    width: 40px;
    height: 40px;
}

.product-actions {
    display: flex;
    gap: 15px;
    margin: 25px 0;
    flex-wrap: wrap;
}

.product-actions .btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 14px 24px;
    font-size: 16px;
    font-weight: 500;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
    min-width: 200px;
}

.product-actions .btn--primary {
    background: linear-gradient(135deg, #eabb66 0%, #e74c3c 100%);
    color: white;
    border: none;
}

.product-actions .btn--primary:hover {
    background: linear-gradient(135deg, #deb262ff 0%, #d74636ff 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}

.product-actions .btn--secondary {
    background: transparent;
    color: #e74c3c;
    border: 2px solid #e74c3c;
}

.product-actions .btn--secondary:hover {
    background: #e74c3c;
    color: white;
    transform: translateY(-2px);
}

// Стили для галереи
.product-gallery {
    margin-bottom: 30px;
}

.gallery-main {
    height: 640px;
    width: 400px;
    margin-bottom: 15px;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 3px 15px rgba(0,0,0,0.1);
    background: #f8f9fa;
    min-height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.gallery-main__image {
    width: 100%;
    height: auto;
    max-height: 640px;
    object-fit: contain;
    display: block;
}

.gallery-thumbs {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: center;
}

.thumb {
    width: 80px;
    height: 80px;
    border: 2px solid transparent;
    border-radius: 6px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s;
    background: #f8f9fa;
}

.thumb:hover {
    border-color: #ddd;
    transform: translateY(-2px);
}

.thumb.active {
    border-color: #e74c3c;
    box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
}

.thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
    
    @media (max-width: 768px) {
        .product-main__inner {
            grid-template-columns: 1fr;
            gap: 20px;
        }
        
        .gallery-thumbs {
            justify-content: center;
        }
        
        .thumb {
            width: 60px;
            height: 60px;
        }
        
        .error-actions {
            flex-direction: column;
            align-items: center;
        }
        
        .error-actions .btn {
            width: 100%;
            max-width: 300px;
        }
        
        .tabs-nav {
            flex-direction: column;
        }
        
        .tab-btn {
            text-align: left;
            border-bottom: none;
            border-left: 3px solid transparent;
        }
        
        .tab-btn.active {
            border-left-color: #e74c3c;
            border-bottom: none;
        }

        .product-actions {
            flex-direction: column;
        }
        
        .product-actions .btn {
            width: 100%;
            min-width: auto;
        }
        
        .gallery-main {
            min-height: 300px;
        }
        
        .gallery-main__image {
            max-height: 400px;
        }
        
        .thumb {
            width: 60px;
            height: 60px;
        }
    }
`;
document.head.appendChild(style);

console.log('Product.js загружен и готов к работе!');
})(); // Немедленно вызываемая функция

// Временная заглушка для отладки
console.log('Product.js загружен, ожидаем PocketBase...');



class ProductPage {
    setupEventListeners() {
        // Кнопка "Заказать" или "Оформить заказ" на странице товара
        document.addEventListener('click', (e) => {
            if (e.target.closest('#orderBtn') || 
                e.target.closest('[data-action="order"]') ||
                e.target.closest('.btn-order')) {
                e.preventDefault();
                this.openOrderModal();
            }
        });
        
        // Модальное окно заказа
        this.setupOrderModalListeners();
    }
    
    setupOrderModalListeners() {
        // Закрытие модального окна
        document.getElementById('closeOrderModal')?.addEventListener('click', () => {
            this.closeOrderModal();
        });
        
        document.getElementById('cancelOrder')?.addEventListener('click', () => {
            this.closeOrderModal();
        });
        
        document.querySelector('#orderModal .modal-overlay')?.addEventListener('click', (e) => {
            if (e.target === document.querySelector('#orderModal .modal-overlay')) {
                this.closeOrderModal();
            }
        });
        
        // Количество товара
        document.querySelector('.qty-minus')?.addEventListener('click', () => {
            this.changeQuantity(-1);
        });
        
        document.querySelector('.qty-plus')?.addEventListener('click', () => {
            this.changeQuantity(1);
        });
        
        document.getElementById('orderQuantity')?.addEventListener('input', (e) => {
            this.updateOrderSummary();
        });
        
        // Доставка
        document.querySelectorAll('input[name="delivery"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.handleDeliveryChange();
            });
        });
        
        // Дополнительные услуги
        document.getElementById('serviceWarranty')?.addEventListener('change', () => {
            this.updateOrderSummary();
        });
        
        document.getElementById('serviceAssembly')?.addEventListener('change', () => {
            this.updateOrderSummary();
        });
        
        // Переключение типа заказа
        document.querySelectorAll('input[name="orderType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.handleOrderTypeChange(e.target.value);
            });
        });
        
        // Оформление заказа
        document.getElementById('submitOrder')?.addEventListener('click', () => {
            this.submitOrder();
        });
    }
    
    openOrderModal() {
        if (!window.authManager || !window.authManager.isAuthenticated()) {
            // Перенаправляем на страницу входа
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
            return;
        }
        
        const modal = document.getElementById('orderModal');
        if (!modal) return;
        
        // Заполняем информацию о товаре
        this.fillOrderModal();
        
        // Сбрасываем значения по умолчанию
        document.getElementById('orderQuantity').value = 1;
        document.querySelector('input[name="delivery"][value="pickup"]').checked = true;
        document.getElementById('serviceWarranty').checked = false;
        document.getElementById('serviceAssembly').checked = false;
        document.getElementById('addressInput').value = '';
        document.getElementById('deliveryAddress').style.display = 'none';
        
        // Показываем модальное окно
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Обновляем итоговую стоимость
        this.updateOrderSummary();
    }
    
    closeOrderModal() {
        const modal = document.getElementById('orderModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }
    
    fillOrderModal() {
        // Заполняем информацией о текущем товаре
        document.getElementById('orderProductName').textContent = this.productData.name || 'Товар';
        document.getElementById('orderProductPrice').textContent = this.getProductPrice() + ' ₽';
        
        // Загружаем изображение
        const image = this.getProductImage();
        if (image) {
            document.getElementById('orderProductImage').src = image;
        }
    }
    
    getProductPrice() {
        // Возвращает цену товара
        return this.productData.price || 0;
    }
    
    getProductImage() {
        // Возвращает URL изображения товара
        if (this.productData.images && this.productData.images.length > 0) {
            return this.pb.files.getUrl(this.productData, this.productData.images[0]);
        }
        return '';
    }
    
    changeQuantity(delta) {
        const input = document.getElementById('orderQuantity');
        let value = parseInt(input.value) || 1;
        value += delta;
        
        if (value < 1) value = 1;
        if (value > 99) value = 99;
        
        input.value = value;
        this.updateOrderSummary();
    }
    
    handleDeliveryChange() {
        const deliveryType = document.querySelector('input[name="delivery"]:checked').value;
        const addressContainer = document.getElementById('deliveryAddress');
        
        // Показываем/скрываем поле адреса
        if (deliveryType === 'delivery' || deliveryType === 'installation') {
            addressContainer.style.display = 'block';
        } else {
            addressContainer.style.display = 'none';
        }
        
        this.updateOrderSummary();
    }
    
    handleOrderTypeChange(type) {
        // Обновляем UI в зависимости от типа заказа
        const productInfo = document.querySelector('.order-product-info');
        const switchLabels = document.querySelectorAll('.switch-label');
        
        switchLabels.forEach(label => {
            label.classList.toggle('active', label.dataset.type === type);
        });
        
        if (type === 'multiple') {
            // Для нескольких товаров показываем другую форму
            productInfo.innerHTML = `
                <div class="multiple-products">
                    <h3>Выберите товары</h3>
                    <p>Добавьте несколько товаров из каталога</p>
                    <a href="catalog.html" class="btn btn--primary">Перейти в каталог</a>
                </div>
            `;
        } else {
            // Для одного товара показываем информацию о текущем товаре
            this.fillOrderModal();
        }
        
        this.updateOrderSummary();
    }
    
    updateOrderSummary() {
        const quantity = parseInt(document.getElementById('orderQuantity').value) || 1;
        const productPrice = this.getProductPrice();
        const productTotal = productPrice * quantity;
        
        // Стоимость доставки
        let deliveryCost = 0;
        const deliveryType = document.querySelector('input[name="delivery"]:checked')?.value;
        
        switch(deliveryType) {
            case 'delivery':
                deliveryCost = 500;
                break;
            case 'installation':
                deliveryCost = 1500;
                break;
            default:
                deliveryCost = 0;
        }
        
        // Дополнительные услуги
        let servicesCost = 0;
        if (document.getElementById('serviceWarranty')?.checked) servicesCost += 500;
        if (document.getElementById('serviceAssembly')?.checked) servicesCost += 1000;
        
        // Общая стоимость
        const totalCost = productTotal + deliveryCost + servicesCost;
        
        // Обновляем отображение
        document.getElementById('summaryProduct').textContent = productTotal.toLocaleString() + ' ₽';
        document.getElementById('summaryDelivery').textContent = 
            deliveryCost === 0 ? 'Бесплатно' : deliveryCost.toLocaleString() + ' ₽';
        document.getElementById('summaryServices').textContent = 
            servicesCost === 0 ? '—' : servicesCost.toLocaleString() + ' ₽';
        document.getElementById('summaryTotal').textContent = totalCost.toLocaleString() + ' ₽';
    }
    
    async submitOrder() {
        const orderType = document.querySelector('input[name="orderType"]:checked').value;
        
        if (orderType === 'multiple') {
            // Для нескольких товаров перенаправляем в корзину
            window.location.href = 'profile.html#cart';
            return;
        }
        
        // Для одного товара создаем заказ
        const quantity = parseInt(document.getElementById('orderQuantity').value) || 1;
        const deliveryType = document.querySelector('input[name="delivery"]:checked').value;
        const address = document.getElementById('addressInput').value;
        const warranty = document.getElementById('serviceWarranty').checked;
        const assembly = document.getElementById('serviceAssembly').checked;
        
        // Проверяем адрес для доставки
        if ((deliveryType === 'delivery' || deliveryType === 'installation') && !address.trim()) {
            alert('Пожалуйста, укажите адрес доставки');
            return;
        }
        
        try {
            // Создаем данные заказа
            const orderData = {
                product: this.productData.id,
                product_name: this.productData.name,
                quantity: quantity,
                unit_price: this.getProductPrice(),
                delivery_type: deliveryType,
                delivery_address: address,
                warranty_service: warranty,
                assembly_service: assembly,
                status: 'pending',
                user: window.authManager.currentUser.id
            };
            
            // Отправляем заказ в базу данных
            const order = await this.pb.collection('orders').create(orderData);
            
            // Закрываем модальное окно
            this.closeOrderModal();
            
            // Показываем уведомление
            this.showNotification(`Заказ оформлен! Номер заказа: #${order.id.slice(0, 8)}`, 'success');
            
            // Перенаправляем в профиль на вкладку заказов
            setTimeout(() => {
                window.location.href = 'profile.html#orders';
            }, 2000);
            
        } catch (error) {
            console.error('❌ Ошибка оформления заказа:', error);
            this.showNotification('Ошибка оформления заказа', 'error');
        }
    }
    
    showNotification(message, type = 'info') {
        if (window.authManager && window.authManager.showNotification) {
            window.authManager.showNotification(message, type);
        } else {
            alert(message);
        }
    }
}