// laminate-product.js - ПОЛНЫЙ ИСПРАВЛЕННЫЙ КОД для страницы товара ламината

(function() {
    console.log('Загрузка laminate-product.js...');
    
    let pb = null;
    let currentProduct = null;
    let currentProductPrice = 0;
    let isLaminateMode = true; // Флаг что это ламинат
    
    // Функция для запуска приложения после загрузки PocketBase
    function initLaminateApp() {
        console.log('Инициализация приложения товара ламината...');
        
        if (typeof PocketBase === 'undefined') {
            console.error('PocketBase все еще не загружен!');
            showErrorMessage('Ошибка загрузки приложения');
            return;
        }
        
        try {
            // Создаем экземпляр PocketBase
            pb = new PocketBase('http://127.0.0.1:8090');
            pb.autoCancellation(false);
            
            // Запускаем приложение
            startLaminatePage();
        } catch (error) {
            console.error('Ошибка создания PocketBase:', error);
            showErrorMessage('Ошибка инициализации приложения');
        }
    }
    
    // Основная функция
    async function startLaminatePage() {
        // Получаем ID товара из URL
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        
        console.log('ID товара ламината из URL:', productId);
        
        if (!productId) {
            showError('Товар не найден');
            return;
        }
        
        // Сделаем pb глобальным
        if (window.pb) {
            console.log('✅ PocketBase уже глобальный');
        } else if (typeof PocketBase !== 'undefined') {
            try {
                window.pb = new PocketBase('http://127.0.0.1:8090');
                window.pb.autoCancellation(false);
                console.log('✅ PocketBase создан и сохранен глобально');
            } catch (error) {
                console.error('Ошибка создания PocketBase:', error);
            }
        }
        
        // Показываем состояние загрузки
        showLoadingState();
        
        try {
            // Загружаем товар ламината
            currentProduct = await window.pb.collection('laminate').getOne(productId);
            
            if (!currentProduct) {
                throw new Error('Товар не найден в базе данных');
            }
            
            // Сохраняем ID для отзывов
            window.currentProductId = productId;
            window.currentProduct = currentProduct;
            
            // Сохраняем цену
            currentProductPrice = parseLaminatePrice(currentProduct.prise);
            
            // Заполняем страницу данными
            fillLaminatePageData(currentProduct);
            
            // Загружаем похожие товары (в фоновом режиме)
            loadSimilarLaminateProducts(currentProduct).catch(error => {
                console.warn('Не удалось загрузить похожие товары:', error);
            });
            
            // Инициализируем табы
            initializeTabs();
            
            // Инициализируем модальные окна
            initializeModals();
            
            // Инициализируем модальное окно заказа
            initOrderModal();
            
            console.log('Страница товара ламината успешно загружена!');
            
        } catch (error) {
            console.error('Ошибка загрузки товара ламината:', error);
            showError('Не удалось загрузить информацию о товаре');
        }
    }
    
    // Заполнение страницы данными ламината
    function fillLaminatePageData(product) {
        console.log('Заполнение данных товара ламината...');
        
        // 1. Создаем структуру страницы если её нет
        createLaminatePageStructure();
        
        // 2. Основная информация
        fillLaminateBasicInfo(product);
        
        // 3. Галерея изображений
        setupLaminateGallery(product);
        
        // 4. Описание и характеристики
        fillLaminateDescriptionAndSpecs(product);
        
        // 5. Скрываем индикатор загрузки
        hideLoadingState();
    }
    
    // Создание всей структуры страницы ламината
    function createLaminatePageStructure() {
        console.log('Создание структуры страницы ламината...');
        
        const productMain = document.querySelector('.product-main');
        if (!productMain) {
            console.error('Основной контейнер не найден');
            return;
        }
        
        // Проверяем есть ли уже внутренняя структура
        let productMainInner = document.querySelector('.product-main__inner');
        
        if (!productMainInner) {
            console.log('Создание внутренней структуры ламината...');
            
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
        
        // Структура для ламината
        productMainInner.innerHTML = `
            <div class="product-content-wrapper">
                <div class="product-gallery-section">
                    <div class="product-gallery" id="laminateGallery">
                        <div class="gallery-thumbs" id="laminateThumbs">
                            <!-- Миниатюры загрузятся динамически -->
                        </div>
                        <div class="gallery-main">
                            <img src="" alt="" class="gallery-main__image" id="mainLaminateImage">
                        </div>
                    </div>
                </div>
            </div>
            <div class="product-info-section">
                <div class="product-info-card">
                    <h1 class="product-title" id="laminateTitle">Загрузка...</h1>
                    <div class="product-sku" id="laminateSku">Код: ---</div>
                    
                    <div class="laminate-features-tags" id="laminateFeatures">
                        <!-- Теги особенностей -->
                    </div>
                    
                    <div class="product-price-block">
                        <div class="laminate-price" id="laminatePrice">
                            <span class="price-current">--- ₽</span>
                            <span class="price-unit">за м²</span>
                        </div>
                    </div>

                    <div class="product-actions" id="laminateActions">
                        <button class="btn btn--primary" id="orderBtn">
                            <span>🛒 Оформить заказ</span>
                        </button>
                        <button class="btn btn--secondary" id="constructorBtn">
                            <span>🧮 В конструктор</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        console.log('Структура страницы ламината создана');
    }
    
    // Заполнение основной информации ламината
    function fillLaminateBasicInfo(product) {
        console.log('Заполнение основной информации ламината...');
        
        // Используем элементы которые мы создали
        const titleElement = document.getElementById('laminateTitle');
        const skuElement = document.getElementById('laminateSku');
        const productActions = document.getElementById('laminateActions');
        const productPrice = document.getElementById('laminatePrice');
        const laminateFeatures = document.getElementById('laminateFeatures');
        
        // Название товара
        if (titleElement) {
            titleElement.textContent = product.name || 'Ламинат без названия';
        }
        
        // Артикул
        if (skuElement) {
            const productId = product.id;
            const shortId = productId.substring(0, 8);
            skuElement.textContent = `Код товара: ${shortId}`;
            skuElement.dataset.fullId = productId;
        }
        
        // Цена
        if (productPrice) {
            let price = parseLaminatePrice(product.prise);
            
            if (price > 0) {
                productPrice.innerHTML = `
                    <div class="price-current">${formatPrice(price)}</div>
                    <div class="price-unit">за м²</div>
                `;
            } else {
                productPrice.innerHTML = '<div class="price-on-request">Цена по запросу</div>';
            }
        }
        
        // Особенности ламината
        if (laminateFeatures) {
            let featuresHTML = '';
            
            if (product.type) {
                featuresHTML += `<span class="laminate-feature-tag">${product.type}</span>`;
            }
            if (product.thickness) {
                featuresHTML += `<span class="laminate-feature-tag">${product.thickness} мм</span>`;
            }
            if (product.wear_class) {
                featuresHTML += `<span class="laminate-feature-tag">Класс ${product.wear_class}</span>`;
            }
            
            laminateFeatures.innerHTML = featuresHTML;
        }
        
        // Кнопки действий
        if (productActions) {
            productActions.innerHTML = `
                <button class="btn btn--primary" id="orderBtn">
                    <span>🛒 Оформить заказ</span>
                </button>
                <button class="btn btn--secondary" id="constructorBtn">
                    <span>🧮 В конструктор</span>
                </button>
            `;
            
            // Обработчики для кнопок
            const constructorBtn = document.getElementById('constructorBtn');
            const orderBtn = document.getElementById('orderBtn');
            
            if (constructorBtn) {
                constructorBtn.addEventListener('click', () => {
                    window.location.href = `laminate-constructor.html?product_id=${product.id}&product_name=${encodeURIComponent(product.name || '')}`;
                });
            }
            
            if (orderBtn) {
                orderBtn.addEventListener('click', openOrderModal);
            }
        }
    }
    
    // Настройка галереи изображений ламината
    function setupLaminateGallery(product) {
        console.log('Настройка галереи ламината...');
        
        const galleryThumbs = document.getElementById('laminateThumbs');
        const mainImage = document.getElementById('mainLaminateImage');
        
        if (!galleryThumbs || !mainImage) {
            console.error('Элементы галереи не найдены');
            return;
        }
        
        // Проверяем наличие изображений
        if (!product.picture || !Array.isArray(product.picture) || product.picture.length === 0) {
            console.log('Нет изображений товара ламината');
            
            mainImage.src = 'img/no-image.jpg';
            mainImage.alt = product.name || 'Нет изображения';
            galleryThumbs.innerHTML = '<p>Изображения отсутствуют</p>';
            return;
        }
        
        console.log('Количество изображений ламината:', product.picture.length);
        
        // Отображаем первое изображение как основное
        const firstImageUrl = `http://127.0.0.1:8090/api/files/laminate/${product.id}/${product.picture[0]}`;
        mainImage.src = firstImageUrl;
        mainImage.alt = product.name || 'Изображение ламината';
        
        // Создаем миниатюры
        galleryThumbs.innerHTML = '';
        
        product.picture.forEach((imageName, index) => {
            const thumbUrl = `http://127.0.0.1:8090/api/files/laminate/${product.id}/${imageName}`;
            
            const thumbElement = document.createElement('div');
            thumbElement.className = `thumb ${index === 0 ? 'active' : ''}`;
            
            thumbElement.innerHTML = `
                <img src="${thumbUrl}" 
                     alt="${product.name || 'Ламинат'} - изображение ${index + 1}"
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
        
        console.log('Галерея ламината настроена');
    }
    
    // Заполнение описания и характеристик ламината
    function fillLaminateDescriptionAndSpecs(product) {
        console.log('Заполнение описания и характеристик ламината...');
        
        // 1. Вкладка "ОПИСАНИЕ"
        const descriptionTab = document.getElementById('description');
        if (descriptionTab) {
            let descriptionContent = `
                <h2>${product.name || 'Ламинат'}</h2>
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
            if (product.color) {
                const colorsHTML = getLaminateColorChipsHTML(product.color);
                if (colorsHTML) {
                    descriptionContent += `
                        <div class="colors-section">
                            <h3>Доступные цвета и текстуры:</h3>
                            <div class="color-chips laminate-colors">
                                ${colorsHTML}
                            </div>
                        </div>
                    `;
                }
            }
            
            descriptionContent += `</div>`;
            descriptionTab.innerHTML = descriptionContent;
        }
        
        // 2. Вкладка "ХАРАКТЕРИСТИКИ"
        const specsGrid = document.querySelector('#specifications .laminate-specs-grid');
        if (specsGrid) {
            let specsHTML = '';
            
            // Технические характеристики
            const technicalSpecs = [
                { name: 'Толщина доски', value: product.thickness ? `${product.thickness} мм` : 'Не указана' },
                { name: 'Класс износостойкости', value: product.wear_class || 'Не указан' },
                { name: 'Влагостойкость', value: getMoistureResistance(product.thickness) },
                { name: 'Размер доски', value: product.size || 'Не указан' },
                { name: 'Количество в упаковке', value: product.pack_quantity || 'Не указано' },
                { name: 'Площадь в упаковке', value: product.pack_area ? `${product.pack_area} м²` : 'Не указано' },
                { name: 'Вес упаковки', value: product.pack_weight ? `${product.pack_weight} кг` : 'Не указано' },
                { name: 'Тип замка', value: product.lock_type || 'Click' },
                { name: 'Срок службы', value: product.lifespan || '15-25 лет' }
            ];
            
            specsHTML = technicalSpecs.map(spec => `
                <div class="laminate-spec-item">
                    <h4>${spec.name}</h4>
                    <p>${spec.value}</p>
                </div>
            `).join('');
            
            specsGrid.innerHTML = specsHTML;
        }
    }
    
    // Получение влагостойкости на основе толщины
    function getMoistureResistance(thickness) {
        if (!thickness) return 'Не указана';
        
        const thickNum = parseInt(thickness);
        if (isNaN(thickNum)) return 'Не указана';
        
        if (thickNum >= 12) return 'Высокая (до 72 часов)';
        if (thickNum >= 10) return 'Средняя (до 48 часов)';
        return 'Базовая (до 24 часов)';
    }
    
    // Создание цветовых чипов для ламината
    function getLaminateColorChipsHTML(colorData) {
        if (!colorData) return '';
        
        let colors = [];
        
        // Обрабатываем разные форматы данных
        if (typeof colorData === 'string') {
            try {
                const parsed = JSON.parse(colorData);
                colors = Array.isArray(parsed) ? parsed : [parsed];
            } catch (e) {
                colors = colorData.split(',').map(c => c.trim()).filter(c => c);
            }
        } else if (Array.isArray(colorData)) {
            colors = colorData;
        }
        
        colors = colors.filter(color => color && color.toString().trim());
        
        if (colors.length === 0) return '';
        
        return colors.map(color => {
            const colorName = color.toString().trim();
            const hexColor = getLaminateColorHex(colorName);
            
            return `
                <div class="color-chip laminate-color-chip" title="${colorName}">
                    <div class="color-sample" style="background-color: ${hexColor};"></div>
                    <span class="color-name">${colorName}</span>
                </div>
            `;
        }).join('');
    }
    
    // Цветовая карта для ламината
    function getLaminateColorHex(colorName) {
        const colorMap = {
            'дуб': '#D2B48C',
            'дуб светлый': '#E8D0A9',
            'дуб беленый': '#F5EBDC',
            'дуб темный': '#8B4513',
            'орех': '#773F1A',
            'ясень': '#F5EBDC',
            'ясень светлый': '#F8F4E6',
            'ясень серый': '#D3D3D3',
            'ясень темный': '#B8860B',
            'бук': '#DEB887',
            'бук светлый': '#F5DEB3',
            'бук темный': '#CD853F',
            'венге': '#3C2F23',
            'венге светлый': '#654321',
            'белый': '#FFFFFF',
            'черный': '#000000',
            'серый': '#808080',
            'серый светлый': '#D3D3D3',
            'серый темный': '#696969',
            'бежевый': '#F5F5DC',
            'коричневый': '#8B4513',
            'коричневый светлый': '#D2B48C',
            'коричневый темный': '#654321',
            'под камень': '#C0C0C0',
            'под мрамор': '#E5E4E2',
            'под бетон': '#A9A9A9',
            'под металл': '#B0B0B0'
        };
        
        const normalized = colorName.toLowerCase().trim();
        
        // Поиск точного совпадения
        if (colorMap[normalized]) {
            return colorMap[normalized];
        }
        
        // Поиск частичного совпадения
        for (const [colorNameKey, hexValue] of Object.entries(colorMap)) {
            if (normalized.includes(colorNameKey) || colorNameKey.includes(normalized)) {
                return hexValue;
            }
        }
        
        // Генерация случайного цвета для дерева
        return generateWoodColor(colorName);
    }
    
    // Генерация цвета дерева
    function generateWoodColor(name) {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const hue = (hash % 30) + 25;
        const saturation = (hash % 40) + 40;
        const lightness = (hash % 30) + 50;
        
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
    
    // Инициализация табов
    function initializeTabs() {
        console.log('Инициализация табов ламината...');
        
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');
        
        if (tabButtons.length === 0 || tabPanes.length === 0) {
            console.error('Табы не найдены в DOM');
            return;
        }
        
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                
                tabButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                tabPanes.forEach(pane => pane.classList.remove('active'));
                const activePane = document.getElementById(tabId);
                if (activePane) {
                    activePane.classList.add('active');
                }
            });
        });
    }
    
    // Загрузка похожих товаров ламината
    async function loadSimilarLaminateProducts(currentProduct) {
        console.log('Загрузка похожих товаров ламината...');
        
        try {
            // Загружаем все товары ламината
            const response = await pb.collection('laminate').getList(1, 200);
            
            if (!response.items || response.items.length === 0) {
                console.log('Нет товаров ламината для отображения');
                hideSimilarProductsSection();
                return;
            }
            
            // Исключаем текущий товар
            const allProducts = response.items.filter(item => item.id !== currentProduct.id);
            
            if (allProducts.length === 0) {
                console.log('Нет похожих товаров ламината');
                hideSimilarProductsSection();
                return;
            }
            
            // Находим похожие товары и берем только 4
            const similarProducts = findSimilarLaminateProducts(currentProduct, allProducts)
                .slice(0, 4);
            
            console.log('Похожие товары ламината найдены:', similarProducts.length);
            renderSimilarLaminateProducts(similarProducts);
            
        } catch (error) {
            console.error('Ошибка загрузки похожих товаров ламината:', error);
            hideSimilarProductsSection();
        }
    }

    function renderSimilarLaminateProducts(products) {
        const grid = document.getElementById('similarProductsGrid');
        const loading = document.getElementById('similarLoading');
        const noResults = document.getElementById('noSimilarProducts');
        
        if (!grid) return;
        
        loading.style.display = 'none';
        
        grid.innerHTML = '';
        
        if (!products || products.length === 0) {
            noResults.style.display = 'block';
            return;
        }
        
        // Добавляем только 4 товара
        const productsToShow = products.slice(0, 4);
        
        productsToShow.forEach(product => {
            const productCard = createSimilarLaminateCard(product);
            grid.appendChild(productCard);
        });
        
        noResults.style.display = 'none';
    }
    
    // Поиск похожих товаров ламината
    function findSimilarLaminateProducts(currentProduct, allProducts) {
        const currentType = currentProduct.type?.toLowerCase() || '';
        const currentClass = currentProduct.wear_class?.toLowerCase() || '';
        const currentThickness = parseInt(currentProduct.thickness) || 0;
        
        const scoredProducts = allProducts.map(product => {
            let score = 0;
            
            const productType = product.type?.toLowerCase() || '';
            if (currentType && productType && currentType === productType) {
                score += 100;
            } else if (currentType && productType && productType.includes(currentType)) {
                score += 50;
            }
            
            const productClass = product.wear_class?.toLowerCase() || '';
            if (currentClass && productClass && currentClass === productClass) {
                score += 80;
            }
            
            const productThickness = parseInt(product.thickness) || 0;
            if (currentThickness && productThickness && Math.abs(currentThickness - productThickness) <= 1) {
                score += 60;
            } else if (currentThickness && productThickness && Math.abs(currentThickness - productThickness) <= 2) {
                score += 30;
            }
            
            const currentPrice = parseLaminatePrice(currentProduct.prise);
            const productPrice = parseLaminatePrice(product.prise);
            if (currentPrice > 0 && productPrice > 0) {
                const priceDiff = Math.abs(currentPrice - productPrice) / currentPrice;
                if (priceDiff <= 0.2) score += 40;
                else if (priceDiff <= 0.4) score += 20;
            }
            
            return { product, score };
        });
        
        scoredProducts.sort((a, b) => b.score - a.score);
        
        const topProducts = scoredProducts
            .filter(item => item.score > 0)
            .slice(0, 8)
            .map(item => item.product);
        
        if (topProducts.length < 4) {
            const randomProducts = allProducts
                .filter(p => !topProducts.includes(p))
                .sort(() => Math.random() - 0.5)
                .slice(0, 4 - topProducts.length);
            
            return [...topProducts, ...randomProducts];
        }
        
        return topProducts;
    }
    
    // Создание карточки похожего ламината
    function createSimilarLaminateCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card similar-card';
        card.dataset.productId = product.id;
        
        const shortId = product.id.substring(0, 8);
        
        let imageUrl = 'img/no-image.jpg';
        if (product.picture && product.picture.length > 0 && product.picture[0]) {
            try {
                const fileName = product.picture[0];
                imageUrl = `http://127.0.0.1:8090/api/files/laminate/${product.id}/${fileName}`;
            } catch (error) {
                console.warn('Ошибка загрузки изображения ламината:', error);
            }
        }
        
        const price = parseLaminatePrice(product.prise);
        const priceDisplay = price > 0 ? formatPrice(price) : 'Цена по запросу';
        
        const description = product.description ? 
            (product.description.length > 60 ? 
                product.description.substring(0, 60) + '...' : 
                product.description) : 
            'Ламинат высокого качества';
        
        card.innerHTML = `
            <div class="product-image-container">
                <img src="${imageUrl}" 
                    alt="${escapeHtml(product.name || 'Ламинат')}" 
                    class="product-image"
                    loading="lazy"
                    onerror="this.src='img/no-image.jpg'"
                    onclick="window.location.href='laminate-product.html?id=${product.id}'">
            </div>
            <div class="product-info">
                <h3 class="product-title">${escapeHtml(product.name || 'Ламинат без названия')}</h3>
                                
                <div class="product-meta">
                    ${product.type ? `<span class="product-type">${product.type}</span>` : ''}
                    ${product.thickness ? `<span class="product-thickness">${product.thickness} мм</span>` : ''}
                    ${product.wear_class ? `<span class="product-class">${product.wear_class} класс</span>` : ''}
                </div>
                
                <p class="product-description">${escapeHtml(description)}</p>
                
                <div class="laminate-price">${priceDisplay} <span class="price-unit">за м²</span></div>
                
                <div class="product-actions">
                    <a href="laminate-product.html?id=${product.id}" class="btn-details">Подробнее</a>
                </div>
            </div>
        `;
        
        return card;
    }
    
    // Парсинг цены ламината
    function parseLaminatePrice(priceStr) {
        if (!priceStr) return 0;
        
        const cleanStr = priceStr.toString().replace(/[^\d]/g, '');
        const price = parseInt(cleanStr);
        return isNaN(price) ? 0 : price;
    }
    
    // Форматирование цены
    function formatPrice(price) {
        return price.toLocaleString('ru-RU') + ' ₽';
    }
    
    // Экранирование HTML
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // ============ МОДАЛЬНОЕ ОКНО ЗАКАЗА ДЛЯ ЛАМИНАТА ============
    
    // Инициализация модального окна заказа
    function initOrderModal() {
        console.log('Инициализация модального окна заказа для ламината...');
        
        // Кнопка "Оформить заказ" на странице
        document.getElementById('orderBtn')?.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Кнопка заказа ламината нажата');
            openOrderModal();
        });
        
        console.log('Модальное окно заказа ламината инициализировано');
    }
    
    // Настройка закрытия модального окна
    function setupModalCloseHandlers() {
        console.log('Настройка обработчиков закрытия модального окна ламината...');
        
        // 1. Кнопка закрытия (крестик)
        const closeBtn = document.getElementById('closeLaminateOrderModal');
        if (closeBtn) {
            console.log('Найден closeLaminateOrderModal');
            closeBtn.addEventListener('click', function(e) {
                console.log('Кнопка закрытия нажата');
                e.preventDefault();
                e.stopPropagation();
                closeOrderModal();
            });
        } else {
            console.error('❌ closeLaminateOrderModal не найден');
        }
        
        // 2. Кнопка "Отмена"
        const cancelBtn = document.getElementById('cancelLaminateOrder');
        if (cancelBtn) {
            console.log('Найден cancelLaminateOrder');
            cancelBtn.addEventListener('click', function(e) {
                console.log('Кнопка Отмена нажата');
                e.preventDefault();
                e.stopPropagation();
                closeOrderModal();
            });
        } else {
            console.error('❌ cancelLaminateOrder не найден');
        }
        
        // 3. Кнопка "Оформить заказ"
        const submitBtn = document.getElementById('submitLaminateOrder');
        if (submitBtn) {
            console.log('Найден submitLaminateOrder');
            // Удаляем старый обработчик если есть
            submitBtn.removeEventListener('click', submitLaminateOrder);
            // Добавляем новый
            submitBtn.addEventListener('click', function(e) {
                console.log('Кнопка Оформить заказ нажата');
                e.preventDefault();
                e.stopPropagation();
                submitLaminateOrder();
            });
        } else {
            console.error('❌ submitLaminateOrder не найден');
        }
        
        // 4. Закрытие по клику на overlay
        const modalOverlay = document.querySelector('#laminateOrderModal .modal-overlay');
        if (modalOverlay) {
            console.log('Найден overlay');
            modalOverlay.addEventListener('click', function(e) {
                if (e.target === modalOverlay) {
                    console.log('Клик по overlay');
                    closeOrderModal();
                }
            });
        } else {
            console.error('❌ overlay не найден');
        }
        
        // 5. Закрытие по Escape
        document.addEventListener('keydown', function(e) {
            const modal = document.getElementById('laminateOrderModal');
            if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
                console.log('Закрытие по Escape');
                closeOrderModal();
            }
        });
        
        console.log('Обработчики закрытия настроены');
    }
    
    function initLaminateModalHandlers() {
        console.log('Инициализация обработчиков модального окна ламината...');
        
        // 1. Кнопка закрытия
        const closeBtn = document.getElementById('closeLaminateOrderModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', function(e) {
                e.preventDefault();
                closeOrderModal();
            });
        }
        
        // 2. Кнопка Отмена
        const cancelBtn = document.getElementById('cancelLaminateOrder');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function(e) {
                e.preventDefault();
                closeOrderModal();
            });
        }
        
        // 3. Кнопка Оформить заказ
        const submitBtn = document.getElementById('submitLaminateOrder');
        if (submitBtn) {
            submitBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                submitLaminateOrder();
            });
        }
        
        // 4. Overlay
        const overlay = document.querySelector('#laminateOrderModal');
        if (overlay) {
            overlay.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeOrderModal();
                }
            });
        }
    }

    // Открытие модального окна
    function openOrderModal() {
        console.log('Открытие модального окна заказа ламината...');
        
        if (!currentProduct) {
            console.error('Данные товара ламината не загружены');
            showNotification('Ошибка загрузки товара', 'error');
            return;
        }
        
        const modal = document.getElementById('laminateOrderModal');
        if (!modal) {
            console.error('Модальное окно не найдено');
            return;
        }
        
        // Заполняем данные
        fillLaminateOrderModal();
        
        // Сбрасываем значения
        resetModalValues();
        
        // ========== ДОБАВЬТЕ ЭТОТ БЛОК ==========
        // ПОДТЯГИВАЕМ АДРЕС ИЗ ПРОФИЛЯ ПОЛЬЗОВАТЕЛЯ
        const addressInput = document.getElementById('laminateAddressInput');
        if (addressInput) {
            // Проверяем через глобальный authManager
            if (window.authManager && window.authManager.currentUser) {
                const userAddress = window.authManager.currentUser.address;
                if (userAddress) {
                    addressInput.value = userAddress;
                    console.log('✅ Адрес из профиля (authManager) подставлен:', userAddress);
                }
            }
            // Альтернативный вариант через pb
            else if (window.pb && window.pb.authStore && window.pb.authStore.model) {
                const userAddress = window.pb.authStore.model.address;
                if (userAddress) {
                    addressInput.value = userAddress;
                    console.log('✅ Адрес из профиля (pb) подставлен:', userAddress);
                }
            }
            // Если пользователь авторизован через userProfile
            else if (window.userProfile && window.userProfile.currentUser) {
                const userAddress = window.userProfile.currentUser.address;
                if (userAddress) {
                    addressInput.value = userAddress;
                    console.log('✅ Адрес из профиля (userProfile) подставлен:', userAddress);
                }
            }
        }
        // =======================================
        
        // Показываем модальное окно
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Инициализируем обработчики
        initLaminateModalHandlers();
        setupOrderModalHandlers();
        
        // Обновляем итоговую стоимость
        updateOrderSummary();
        
        console.log('Модальное окно заказа ламината открыто');
    }
    
    // Настройка обработчиков в модальном окне
    function setupOrderModalHandlers() {
        console.log('Настройка обработчиков модального окна...');
        
        // 1. Количество
        setupQuantityHandlers();
        
        // 2. Доставка (с правильными ID)
        setupDeliveryHandlers();
        
        // 3. Услуги
        setupServicesHandlers();
        
        // 4. Оплата
        //setupPaymentHandlers();
        
        // 5. Отправка
        setupSubmitHandler();
    }

    /* функция для обработки способа оплаты
    function setupPaymentHandlers() {
        // Пробуем разные варианты
        let paymentRadios = document.querySelectorAll('input[name="laminatePayment"]');
        
        if (paymentRadios.length === 0) {
            paymentRadios = document.querySelectorAll('input[name="payment"]');
            console.log('Пробуем name="payment":', paymentRadios.length);
        }
        
        if (paymentRadios.length > 0) {
            const paymentName = paymentRadios[0].name;
            
            window.handlePaymentChange = function() {
                const paymentType = document.querySelector(`input[name="${paymentName}"]:checked`)?.value;
                const paymentDetails = document.getElementById('laminatePaymentDetails');
                
                if (!paymentDetails) return;
                
                if (paymentType === 'card') {
                    paymentDetails.style.display = 'block';
                } else {
                    paymentDetails.style.display = 'none';
                }
            };
            
            paymentRadios.forEach(radio => {
                radio.addEventListener('change', window.handlePaymentChange);
            });
            
            setTimeout(window.handlePaymentChange, 100);
        }
    }

    function handlePaymentChange() {
        const paymentType = document.querySelector('input[name="laminatePayment"]:checked')?.value;
        const paymentDetails = document.getElementById('laminatePaymentDetails');
        
        if (!paymentDetails) return;
        
        // Показываем/скрываем поля карты
        if (paymentType === 'card') {
            paymentDetails.style.display = 'block';
        } else {
            paymentDetails.style.display = 'none';
        }
    }*/
    
    // Обработчики количества товара
    function setupQuantityHandlers() {
        const minusBtn = document.querySelector('.qty-minus');
        const plusBtn = document.querySelector('.qty-plus');
        const quantityInput = document.getElementById('laminateOrderQuantity');
        
        if (!minusBtn || !plusBtn || !quantityInput) {
            console.error('Элементы количества не найдены');
            return;
        }
        
        // Удаляем старые обработчики через клонирование
        const newMinus = minusBtn.cloneNode(true);
        const newPlus = plusBtn.cloneNode(true);
        const newInput = quantityInput.cloneNode(true);
        
        minusBtn.parentNode.replaceChild(newMinus, minusBtn);
        plusBtn.parentNode.replaceChild(newPlus, plusBtn);
        quantityInput.parentNode.replaceChild(newInput, quantityInput);
        
        const freshMinus = document.querySelector('.qty-minus');
        const freshPlus = document.querySelector('.qty-plus');
        const freshInput = document.getElementById('laminateOrderQuantity');
        
        let isProcessing = false;
        
        // Обработчик для кнопки минус
        freshMinus.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            
            if (isProcessing) return;
            isProcessing = true;
            
            let value = parseInt(freshInput.value) || 1;
            if (value > 1) {
                value--;
                freshInput.value = value;
                updateProductPriceDisplay();
                updateOrderSummary();
            }
            
            setTimeout(() => {
                isProcessing = false;
            }, 100);
        });
        
        // Обработчик для кнопки плюс
        freshPlus.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            
            if (isProcessing) return;
            isProcessing = true;
            
            let value = parseInt(freshInput.value) || 1;
            if (value < 99) {
                value++;
                freshInput.value = value;
                updateProductPriceDisplay();
                updateOrderSummary();
            }
            
            setTimeout(() => {
                isProcessing = false;
            }, 100);
        });
        
        // Обработчик ввода с клавиатуры
        freshInput.addEventListener('input', function() {
            let value = parseInt(this.value) || 1;
            if (value < 1) this.value = 1;
            if (value > 99) this.value = 99;
            
            updateProductPriceDisplay();
            updateOrderSummary();
        });
        
        console.log('Обработчики количества ламината настроены');
    }
    
    // Обработчики доставки
    function setupDeliveryHandlers() {
        const deliveryRadios = document.querySelectorAll('input[name="laminateDelivery"]');
        
        console.log('✅ Найдено радио кнопок доставки:', deliveryRadios.length);
        console.log('Имя радио кнопок:', deliveryRadios[0]?.name);
        
        deliveryRadios.forEach(radio => {
            // Удаляем старые обработчики
            radio.removeEventListener('change', handleDeliveryChange);
            // Добавляем новые
            radio.addEventListener('change', function() {
                console.log('Изменен тип доставки на:', this.value);
                handleDeliveryChange();
            });
        });
        
        // Вызываем сразу для инициализации
        setTimeout(() => {
            console.log('Инициализация handleDeliveryChange');
            handleDeliveryChange();
        }, 100);
    }

    // Глобальные функции для модального окна
    function handleDeliveryChange() {
        console.log('handleDeliveryChange вызван');
        
        const deliveryType = document.querySelector('input[name="laminateDelivery"]:checked')?.value;
        const addressContainer = document.getElementById('laminateDeliveryAddress');
        
        console.log('Тип доставки:', deliveryType);
        console.log('Адрес контейнер:', addressContainer);
        
        if (!addressContainer) {
            console.error('❌ Контейнер адреса не найден');
            return;
        }
        
        // Показываем/скрываем поле адреса для ДОСТАВКИ и УСТАНОВКИ
        if (deliveryType === 'delivery' || deliveryType === 'installation') {
            console.log('✅ Адрес должен быть показан');
            addressContainer.style.display = 'block';
            addressContainer.style.marginTop = '15px';
            addressContainer.style.padding = '15px';
            addressContainer.style.background = '#f8f9fa';
            addressContainer.style.borderRadius = '10px';
        } else {
            console.log('✅ Адрес должен быть скрыт');
            addressContainer.style.display = 'none';
        }
        
        // Вызываем updateOrderSummary если она определена
        if (typeof updateOrderSummary === 'function') {
            updateOrderSummary();
        }
    }

// Сделайте функцию глобальной
window.handleDeliveryChange = handleDeliveryChange;
    
    // Обработчики дополнительных услуг
    function setupServicesHandlers() {
        document.getElementById('laminateServiceWarranty')?.addEventListener('change', updateOrderSummary);
        document.getElementById('laminateServiceAssembly')?.addEventListener('change', updateOrderSummary);
    }
    
    // Обработчик отправки формы
    function setupSubmitHandler() {
        const submitBtn = document.getElementById('submitLaminateOrder');
        if (!submitBtn) return;
        
        // Удаляем все старые обработчики
        const newSubmitBtn = submitBtn.cloneNode(true);
        submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
        
        // Добавляем новый обработчик
        document.getElementById('submitLaminateOrder').addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            console.log('Оформление заказа ламината...');
            submitLaminateOrder();
        });
    }
        
    // Заполнение модального окна данными ламината
    function fillLaminateOrderModal() {
        if (!currentProduct) return;
        
        console.log('Заполнение модального окна данными ламината:', currentProduct);
        
        // Название товара
        const productName = currentProduct.name || 'Ламинат';
        document.getElementById('orderProductName').textContent = productName;
        
        // Цена товара
        const priceElement = document.getElementById('orderProductPrice');
        if (priceElement) {
            priceElement.textContent = formatPrice(currentProductPrice);
        }
        
        // Изображение
        const mainImage = document.getElementById('mainLaminateImage');
        const modalImage = document.getElementById('orderProductImage');
        if (mainImage && mainImage.src && modalImage) {
            modalImage.src = mainImage.src;
            modalImage.alt = productName;
        }
    }
    
    // Сброс значений в модальном окне
    function resetModalValues() {
        const quantityInput = document.getElementById('laminateOrderQuantity');
        if (quantityInput) quantityInput.value = 1;
        
        document.getElementById('laminateServiceWarranty').checked = false;
        document.getElementById('laminateServiceAssembly').checked = false;
        
        const addressInput = document.getElementById('laminateAddressInput');
        if (addressInput) addressInput.value = '';
        
        const deliveryAddress = document.getElementById('deliveryAddress');
        if (deliveryAddress) deliveryAddress.style.display = 'none';
    }
    
    // Обновление цены при изменении количества
    function updateProductPriceDisplay() {
        if (!currentProduct || currentProductPrice === 0) return;
        
        const quantityInput = document.getElementById('laminateOrderQuantity');
        const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;
        
        const totalProductPrice = currentProductPrice * quantity;
        
        // Обновляем цену в модальном окне
        const modalPriceElement = document.getElementById('orderProductPrice');
        if (modalPriceElement) {
            modalPriceElement.textContent = formatPrice(totalProductPrice);
            
            modalPriceElement.style.animation = 'none';
            setTimeout(() => {
                modalPriceElement.style.animation = 'priceChange 0.5s ease';
            }, 10);
        }
    }
    
    // Расчёт общей стоимости
    function updateOrderSummary() {
        console.log('Обновление итоговой стоимости ламината...');
        
        if (!currentProduct || currentProductPrice === 0) {
            console.error('Цена ламината не определена');
            return;
        }
        
        // Получаем количество
        const quantityInput = document.getElementById('laminateOrderQuantity');
        const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;
        
        // Стоимость товара
        const productTotal = currentProductPrice * quantity;
        
        // Стоимость доставки
        let deliveryCost = 0;
        const deliveryRadio = document.querySelector('input[name="laminateDelivery"]:checked');
        if (deliveryRadio) {
            switch(deliveryRadio.value) {
                case 'laminateDelivery':
                    deliveryCost = 500;
                    break;
                case 'installation':
                    deliveryCost = 1500;
                    break;
            }
        }
        
        // Дополнительные услуги
        let servicesCost = 0;
        const warrantyCheckbox = document.getElementById('laminateServiceWarranty');
        const assemblyCheckbox = document.getElementById('laminateServiceAssembly');
        
        if (warrantyCheckbox && warrantyCheckbox.checked) {
            servicesCost += 500;
        }
        
        if (assemblyCheckbox && assemblyCheckbox.checked) {
            servicesCost += 1000;
        }
        
        // Общая стоимость
        const totalCost = productTotal + deliveryCost + servicesCost;
        
        console.log('Итоговый расчет ламината:', {
            productTotal: productTotal,
            deliveryCost: deliveryCost,
            servicesCost: servicesCost,
            totalCost: totalCost
        });
        
        // Обновляем отображение
        updateSummaryDisplay(productTotal, deliveryCost, servicesCost, totalCost);
    }
    
    // Обновление отображения итогов
    function updateSummaryDisplay(productTotal, deliveryCost, servicesCost, totalCost) {
        // Товар
        const productElement = document.getElementById('summaryProduct');
        if (productElement) {
            productElement.textContent = formatPrice(productTotal);
        }
        
        // Доставка
        const deliveryElement = document.getElementById('summaryDelivery');
        if (deliveryElement) {
            deliveryElement.textContent = deliveryCost === 0 ? 'Бесплатно' : formatPrice(deliveryCost);
        }
        
        // Услуги
        const servicesElement = document.getElementById('summaryServices');
        if (servicesElement) {
            servicesElement.textContent = servicesCost === 0 ? '—' : formatPrice(servicesCost);
        }
        
        // Итого
        const totalElement = document.getElementById('summaryTotal');
        if (totalElement) {
            totalElement.textContent = formatPrice(totalCost);
            
            totalElement.style.animation = 'none';
            setTimeout(() => {
                totalElement.style.animation = 'pricePulse 0.4s ease';
            }, 10);
        }
    }
    
    // Закрытие модального окна
    function closeOrderModal() {
        const modal = document.getElementById('laminateOrderModal'); // ИЗМЕНИТЬ
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            console.log('Модальное окно ламината закрыто');
        }
    }
    
    // Отправка заказа ламината
async function submitLaminateOrder() {
    console.log('Отправка заказа ламината...');
    
    // Блокируем повторные нажатия
    const submitBtn = document.getElementById('submitLaminateOrder');
    if (submitBtn?.getAttribute('data-processing') === 'true') {
        return;
    }
    
    if (submitBtn) {
        submitBtn.setAttribute('data-processing', 'true');
        submitBtn.innerHTML = '<span>🔄 Добавление...</span>';
        submitBtn.disabled = true;
    }
    
    try {
        // Собираем данные
        const quantityInput = document.getElementById('laminateOrderQuantity');
        const quantity = parseInt(quantityInput.value) || 1;
        const deliveryType = document.querySelector('input[name="laminateDelivery"]:checked')?.value;
        const address = document.getElementById('laminateAddressInput')?.value || '';
        const warranty = document.getElementById('laminateServiceWarranty')?.checked || false;
        const assembly = document.getElementById('laminateServiceAssembly')?.checked || false;
        
        // ИСПРАВЛЕНИЕ 2: Правильно определяем способ оплаты
        const paymentRadio = document.querySelector('input[name="laminatePayment"]:checked');
        let paymentMethod = 'наличные'; // По умолчанию
        
        if (paymentRadio) {
            if (paymentRadio.value === 'card') {
                paymentMethod = 'карта';
            } else if (paymentRadio.value === 'cash') {
                paymentMethod = 'наличные';
            }
        }
        
        console.log('Способ оплаты:', paymentMethod);
        
        const saveAddress = document.getElementById('saveLaminateAddress')?.checked || false;
        
        // Проверяем адрес для доставки
        if ((deliveryType === 'delivery' || deliveryType === 'installation') && !address.trim()) {
            showNotification('Пожалуйста, укажите адрес доставки', 'error');
            return;
        }
        
        // Сохраняем адрес в профиле если выбран чекбокс
        if (saveAddress && address.trim() && window.pb?.authStore.isValid) {
            try {
                const userId = window.pb.authStore.model?.id;
                const updateData = { address: address };
                await window.pb.collection('users').update(userId, updateData);
                console.log('✅ Адрес сохранен в профиль');
            } catch (error) {
                console.warn('Не удалось сохранить адрес:', error);
            }
        }
        
        // Создаем объект для корзины
        const cartItem = {
            id: currentProduct.id,
            name: currentProduct.name || 'Ламинат без названия',
            price: currentProductPrice,
            quantity: quantity,
            image: document.getElementById('mainLaminateImage')?.src || '',
            code: currentProduct.id.substring(0, 8),
            color: getFormattedColors(currentProduct.color),
            delivery_type: deliveryType,
            delivery_address: address,
            warranty_service: warranty,
            assembly_service: assembly,
            payment_method: paymentMethod, // ИСПРАВЛЕНО: теперь 'карта' или 'наличные'
            collection: 'laminate',
            product_type: 'laminate',
            thickness: currentProduct.thickness,
            wear_class: currentProduct.wear_class,
            added_at: new Date().toISOString(),
            save_address: saveAddress,
            cart_id: `laminate_${currentProduct.id}_${Date.now()}` // Уникальный ID для корзины
        };
        
        console.log('Товар для корзины:', cartItem);
        
        // ИСПРАВЛЕНИЕ 1: Правильный ключ корзины для personal.js
        let cartKey = 'guest_cart'; // По умолчанию для гостя
        
        // Если пользователь авторизован - используем ключ с его ID
        if (window.pb?.authStore?.isValid && window.pb.authStore.model?.id) {
            const userId = window.pb.authStore.model.id;
            cartKey = `user_cart_${userId}`;
            console.log('Пользователь авторизован, ключ корзины:', cartKey);
        } else {
            console.log('Гость, ключ корзины:', cartKey);
        }
        
        // Получаем текущую корзину
        let cart = JSON.parse(localStorage.getItem(cartKey)) || [];
        
        // Проверяем, есть ли уже такой товар в корзине
        const existingIndex = cart.findIndex(item => 
            item.id === currentProduct.id &&
            item.collection === 'laminate' &&
            item.delivery_type === deliveryType &&
            item.warranty_service === warranty &&
            item.assembly_service === assembly
        );
        
        if (existingIndex !== -1) {
            // Если товар уже есть - увеличиваем количество
            cart[existingIndex].quantity += quantity;
            console.log('✅ Количество ламината увеличено:', cart[existingIndex].quantity);
        } else {
            // Если товара нет - добавляем новый
            cart.push(cartItem);
            console.log('✅ Ламинат добавлен в корзину');
        }
        
        // Сохраняем корзину
        localStorage.setItem(cartKey, JSON.stringify(cart));
        console.log('✅ Корзина сохранена, ключ:', cartKey, 'товаров:', cart.length);
        
        // ИСПРАВЛЕНИЕ: Также сохраняем в старый ключ для совместимости
        // personal.js использует `user_cart_${userId}`, а не 'user_cart'
        // НО! Также обновляем глобальную корзину если есть userProfile
        if (window.userProfile) {
            console.log('🔄 Обновляем userProfile.cart');
            await window.userProfile.loadCart(); // Перезагружаем корзину
        }
        
        // Закрываем модальное окно
        closeOrderModal();
        
        // Показываем уведомление
        showNotification('✅ Товар добавлен в корзину!', 'success');
        
        // Обновляем счетчик корзины в хедере
        updateCartCounter();
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
        showNotification('❌ Ошибка добавления в корзину', 'error');
    } finally {
        // Восстанавливаем кнопку
        if (submitBtn) {
            submitBtn.removeAttribute('data-processing');
            submitBtn.innerHTML = '<span>Добавить в корзину</span>';
            submitBtn.disabled = false;
        }
    }
}

// Сделайте функцию глобальной
window.submitLaminateOrder = submitLaminateOrder;

    // Функция для получения форматированных цветов
    function getFormattedColors(colorData) {
        if (!colorData) return '';
        
        let colors = [];
        
        if (typeof colorData === 'string') {
            try {
                const parsed = JSON.parse(colorData);
                colors = Array.isArray(parsed) ? parsed : [parsed];
            } catch (e) {
                colors = colorData.split(',').map(c => c.trim()).filter(c => c);
            }
        } else if (Array.isArray(colorData)) {
            colors = colorData;
        }
        
        colors = colors.filter(c => c);
        return colors.length > 0 ? colors.join(', ') : '';
    }
    
    // Обновление счетчика корзины
    function updateCartCounter() {
        try {
            const cart = JSON.parse(localStorage.getItem('user_cart')) || [];
            // Считаем только товары в корзине, не те что уже оформлены как заказы
            const cartItems = cart.filter(item => !item.is_saved_to_db);
            const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
            
            // Обновляем счетчик в хедере если есть
            const cartCounter = document.querySelector('.cart-counter');
            if (cartCounter) {
                cartCounter.textContent = totalItems;
            }
            
            // Также обновляем в хедере страницы
            const headerCartCounter = document.querySelector('.header-cart-count');
            if (headerCartCounter) {
                headerCartCounter.textContent = totalItems;
            }
            
            console.log('Счетчик корзины обновлен:', totalItems);
        } catch (error) {
            console.error('Ошибка обновления счетчика корзины:', error);
        }
    }
    
    // Показать уведомление
    function showNotification(message, type = 'info') {
        // Удаляем старые уведомления
        document.querySelectorAll('.laminate-notification').forEach(el => el.remove());
        
        const notification = document.createElement('div');
        notification.className = `laminate-notification laminate-notification--${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 120px;
            right: 20px;
            padding: 16px 24px;
            border-radius: 12px;
            z-index: 10001;
            animation: slideIn 0.3s ease;
            font-weight: 600;
            max-width: 350px;
            font-size: 14px;
            backdrop-filter: blur(10px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            color: white;
        `;
        
        if (type === 'success') {
            notification.style.background = 'linear-gradient(135deg, #27ae60, #20c997)';
        } else {
            notification.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 4000);
    }
    
    // Инициализация других модальных окон
    function initializeModals() {
        // Обработчик для модального окна замерщика
        const measureButtons = document.querySelectorAll('.open-measure-modal');
        measureButtons.forEach(button => {
            button.addEventListener('click', openLaminateMeasureModal);
        });
        
        // Закрытие модальных окон
        const modalOverlay = document.getElementById('modalOverlay');
        const modalClose = document.getElementById('modalClose');
        
        if (modalClose && modalOverlay) {
            modalClose.addEventListener('click', () => {
                modalOverlay.style.display = 'none';
            });
            
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    modalOverlay.style.display = 'none';
                }
            });
        }
        
        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modalOverlay && modalOverlay.style.display !== 'none') {
                modalOverlay.style.display = 'none';
            }
        });
    }
    
    // Открытие модального окна замерщика для ламината
    function openLaminateMeasureModal() {
        const modalOverlay = document.getElementById('modalOverlay');
        const measureModal = document.getElementById('measureModal');
        
        if (!modalOverlay || !measureModal) {
            console.error('Модальное окно не найдено');
            return;
        }
        
        measureModal.innerHTML = `
            <button class="modal-close" id="modalClose">&times;</button>
            <h2>Вызвать замерщика для ламината</h2>
            
            <form class="measure-form" id="laminateMeasureForm">
                <div class="form-group">
                    <label for="customerName">Ваше имя *</label>
                    <input type="text" id="customerName" name="name" required>
                </div>
                
                <div class="form-group">
                    <label for="customerPhone">Телефон *</label>
                    <input type="tel" id="customerPhone" name="phone" required placeholder="+7 (___) ___-__-__">
                </div>
                
                <div class="form-group">
                    <label for="customerAddress">Адрес для замера *</label>
                    <input type="text" id="customerAddress" name="address" required placeholder="Улица, дом, квартира">
                </div>
                
                <div class="form-group">
                    <label for="roomType">Тип помещения</label>
                    <select id="roomType" name="room_type">
                        <option value="">Выберите тип помещения</option>
                        <option value="квартира">Квартира</option>
                        <option value="дом">Частный дом</option>
                        <option value="офис">Офис</option>
                        <option value="магазин">Магазин</option>
                        <option value="другое">Другое</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="desiredDate">Желаемая дата замера</label>
                    <input type="date" id="desiredDate" name="desired_date">
                </div>
                
                <div class="form-group">
                    <label for="comments">Дополнительная информация</label>
                    <textarea id="comments" name="comments" rows="3" placeholder="Размеры помещения, особенности и т.д."></textarea>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" id="cancelMeasure">Отмена</button>
                    <button type="submit" class="btn btn-primary">Отправить заявку</button>
                </div>
            </form>
        `;
        
        modalOverlay.style.display = 'flex';
        
        const dateInput = document.getElementById('desiredDate');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.min = today;
            dateInput.value = today;
        }
        
        const form = document.getElementById('laminateMeasureForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(form);
                const data = Object.fromEntries(formData);
                
                try {
                    if (currentProduct) {
                        data.product_id = currentProduct.id;
                        data.product_name = currentProduct.name;
                        data.product_type = 'laminate';
                    }
                    
                    await pb.collection('measure_requests').create(data);
                    
                    modalOverlay.style.display = 'none';
                    showNotification('Заявка отправлена! Мы свяжемся с вами в ближайшее время.', 'success');
                    form.reset();
                    
                } catch (error) {
                    console.error('Ошибка отправки заявки:', error);
                    showNotification('Ошибка отправки заявки. Попробуйте позже.', 'error');
                }
            });
        }
        
        const cancelBtn = document.getElementById('cancelMeasure');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                modalOverlay.style.display = 'none';
            });
        }
    }
    
    // Скрытие секции похожих товаров
    function hideSimilarProductsSection() {
        const section = document.querySelector('.recommended-products');
        if (section) {
            section.style.display = 'none';
        }
    }
    
    // Функции состояния загрузки
    function showLoadingState() {
        const productMain = document.querySelector('.product-main');
        if (productMain) {
            productMain.innerHTML = `
                <div class="loading-container">
                    <div class="spinner"></div>
                    <p>Загрузка информации о ламинате...</p>
                </div>
            `;
        }
    }
    
    function hideLoadingState() {
        const loadingContainer = document.querySelector('.loading-container');
        if (loadingContainer) {
            loadingContainer.remove();
        }
    }
    
    function showError(message) {
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
    
    // Глобальная функция для открытия конструктора
    window.openLaminateConstructor = function(productId, productName) {
        window.location.href = `laminate-constructor.html?product_id=${productId}&product_name=${encodeURIComponent(productName)}`;
    };
    
    // Загрузка PocketBase и запуск приложения
    function loadPocketBase() {
        console.log('Загрузка PocketBase SDK для ламината...');
        
        if (typeof PocketBase !== 'undefined') {
            console.log('PocketBase уже загружен');
            initLaminateApp();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/pocketbase/dist/pocketbase.umd.js';
        script.onload = function() {
            console.log('PocketBase успешно загружен для ламината');
            setTimeout(initLaminateApp, 100);
        };
        script.onerror = function() {
            console.error('Не удалось загрузить PocketBase SDK');
            showErrorMessage('Не удалось загрузить необходимые компоненты. Пожалуйста, обновите страницу.');
        };
        
        document.head.appendChild(script);
    }
    
    // Добавляем CSS стили для анимаций
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        @keyframes priceChange {
            0% { transform: scale(1); color: #e74c3c; }
            50% { transform: scale(1.05); color: #c0392b; }
            100% { transform: scale(1); color: #e74c3c; }
        }
        
        @keyframes pricePulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.03); }
            100% { transform: scale(1); }
        }
        
        .laminate-feature-tag {
            display: inline-block;
            padding: 4px 12px;
            border: 1px solid #ddd;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            margin-right: 8px;
            margin-bottom: 8px;
            background: #f8f9fa;
        }
        
        .product-meta {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin: 10px 0;
        }
        
        .product-meta span {
            padding: 4px 10px;
            background: #f8f9fa;
            border-radius: 6px;
            font-size: 13px;
            color: #666;
        }
        
        .laminate-colors .color-chip {
            margin: 5px;
        }
        
        .laminate-color-chip .color-sample {
            width: 50px;
            height: 50px;
            border-radius: 6px;
            border: 2px solid white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .similar-card {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            border: 1px solid #e0e0e0;
        }
        
        .similar-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .laminate-notification {
            animation: slideInNotification 0.3s ease;
        }
        
        @keyframes slideInNotification {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(styleElement);
    
    // Запускаем когда DOM готов
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadPocketBase);
    } else {
        loadPocketBase();
    }
    
    console.log('Laminate-product.js загружен и готов к работе!');
})();

function debugCart() {
    const cart = JSON.parse(localStorage.getItem('user_cart')) || [];
    console.log('=== ДЕБАГ КОРЗИНЫ ===');
    console.log('Всего товаров:', cart.length);
    
    cart.forEach((item, index) => {
        console.log(`${index + 1}. ${item.name || 'Без имени'} (${item.collection || 'нет типа'}) - ${item.quantity} шт.`);
        console.log('   ID:', item.id, 'Тип:', item.collection, 'Доставка:', item.delivery_type);
    });
}

if (window.location.hash === '#reviews') {
    console.log('📝 Открываем вкладку с отзывами');
    
    // Активируем вкладку с отзывами
    const reviewsTab = document.querySelector('[data-tab="reviews"]');
    if (reviewsTab) {
        setTimeout(() => {
            reviewsTab.click();
            
            // Скроллим к отзывам
            const reviewsSection = document.getElementById('reviews');
            if (reviewsSection) {
                reviewsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 1000); // Ждем загрузки страницы
    }
}