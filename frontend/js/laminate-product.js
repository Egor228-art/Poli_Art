// laminate-product.js - обновленный файл для страницы товара ламината

(function() {
    console.log('Загрузка laminate-product.js...');
    
    let pb = null;
    let currentProduct = null;
    let allSimilarProducts = [];
    let displayedSimilarCount = 0;
    const SIMILAR_PER_PAGE = 4;
    
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
        
        // Показываем состояние загрузки
        showLoadingState();
        
        try {
            // Загружаем товар ламината
            currentProduct = await pb.collection('laminate').getOne(productId);
            
            if (!currentProduct) {
                throw new Error('Товар не найден в базе данных');
            }
            
            // Сохраняем ID для отзывов
            window.currentProductId = productId;
            window.currentProduct = currentProduct;
            
            // Заполняем страницу данными
            fillLaminatePageData(currentProduct);
            
            // Загружаем похожие товары
            await loadSimilarLaminateProducts(currentProduct);
            
            // Инициализируем табы
            initializeTabs();
            
            // Инициализируем модальные окна
            initializeModals();
            
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
    
    // НОВАЯ СТРУКТУРА для ламината
    productMainInner.innerHTML = `
        <div class="product-content-wrapper">
            <div class="product-gallery-section">
                <div class="product-gallery" id="laminateGallery">
                    <div class="gallery-thumbs" id="laminateThumbs">
                        <!-- Миниатюры загрузятся динамически -->
                    </div>
                    <div style="box-shadow: 0 0 0;" class="gallery-main">
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
                    <!-- Кнопки загрузятся динамически -->
                </div>
                <div class="product-colors" id="laminateColors">
                    <!-- Цвета загрузятся динамически -->
                </div>
            </div>
        </div>
        <div class="product-info-tabel">
            <div class="left-side">
                <div class="product-quick-specs" id="laminateQuickSpecs">
                    <!-- Характеристики загрузятся динамически -->
                </div>
            </div>
            <div class="right-side">
                <div class="product-features laminate-features">
                    <div class="feature laminate-feature">
                        <div class="feature-icon"><img src="image/icon/shield.png" alt="Щит"></div>
                        <div class="feature-text">Класс износостойкости AC4/AC5</div>
                    </div>
                    <div class="feature laminate-feature">
                        <div class="feature-icon"><img src="image/icon/Moisture_resistance.png" alt="Влагостойкость"></div>
                        <div class="feature-text">Влагостойкий до 72 часов</div>
                    </div>
                    <div class="feature laminate-feature">
                        <div class="feature-icon"><img src="image/icon/assurance.png" alt="Гарантия"></div>
                        <div class="feature-text">Гарантия 25 лет</div>
                    </div>
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
        const titleElement = document.getElementById('laminateTitle') || document.querySelector('.product-title');
        const skuElement = document.getElementById('laminateSku') || document.querySelector('.product-sku');
        const quickSpecs = document.getElementById('laminateQuickSpecs') || document.querySelector('.product-quick-specs');
        const productActions = document.getElementById('laminateActions') || document.querySelector('.product-actions');
        const productPrice = document.getElementById('laminatePrice') || document.querySelector('.laminate-price');
        const laminateFeatures = document.getElementById('laminateFeatures');
        
        // Название товара
        if (titleElement) {
            titleElement.textContent = product.name || 'Ламинат без названия';
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
                featuresHTML += `<div class="laminate-feature-tag">${product.type}</div>`;
            }
            if (product.thickness) {
                featuresHTML += `<div class="laminate-feature-tag">${product.thickness} мм</div>`;
            }
            if (product.wear_class) {
                featuresHTML += `<div class="laminate-feature-tag">Класс ${product.wear_class}</div>`;
            }
            
            laminateFeatures.innerHTML = featuresHTML;
        }
        
        // Быстрые характеристики
        if (quickSpecs) {
            let specsHTML = '';
            
            specsHTML = `
                <div class="spec">
                    <span class="spec-name">Тип:</span>
                    <span class="spec-value">${product.type || 'Не указан'}</span>
                </div>
                <div class="spec">
                    <span class="spec-name">Толщина:</span>
                    <span class="spec-value">${product.thickness || 'Не указана'} мм</span>
                </div>
                <div class="spec">
                    <span class="spec-name">Класс:</span>
                    <span class="spec-value">${product.wear_class || 'Не указан'}</span>
                </div>
                <div class="spec">
                    <span class="spec-name">Размер:</span>
                    <span class="spec-value">${product.size || 'Не указан'}</span>
                </div>
            `;
            
            quickSpecs.innerHTML = specsHTML;
        }
        
        // КНОПКИ ДЕЙСТВИЙ для ламината
        if (productActions) {
            productActions.innerHTML = `
                <button class="btn btn--primary open-constructor-modal" id="openConstructorBtn">
                    <span class="btn-icon">🧮</span>
                    Рассчитать стоимость
                </button>
                <button class="btn btn--accent open-measure-modal">
                    <span class="btn-icon">📏</span>
                    Вызвать замерщика
                </button>
                <button class="btn btn--secondary" id="addToCartBtn">
                    <span class="btn-icon">🛒</span>
                    В корзину
                </button>
            `;
            
            // Обработчики для кнопок
            const constructorBtn = productActions.querySelector('.open-constructor-modal');
            const measureBtn = productActions.querySelector('.open-measure-modal');
            const cartBtn = productActions.querySelector('#addToCartBtn');
            
            if (constructorBtn) {
                constructorBtn.addEventListener('click', () => {
                    window.location.href = `laminate-constructor.html?product_id=${product.id}&product_name=${encodeURIComponent(product.name || '')}`;
                });
            }
            
            if (measureBtn) {
                measureBtn.addEventListener('click', openLaminateMeasureModal);
            }
            
            if (cartBtn) {
                cartBtn.addEventListener('click', () => {
                    addLaminateToCart(product);
                });
            }
        }
    }
    
    // Настройка галереи изображений ламината
    function setupLaminateGallery(product) {
        console.log('Настройка галереи ламината...');
        
        const galleryThumbs = document.getElementById('laminateThumbs') || document.querySelector('.gallery-thumbs');
        const mainImage = document.getElementById('mainLaminateImage') || document.getElementById('mainImage');
        
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
        
        // 1. ОБНОВЛЯЕМ ВКЛАДКУ "ОПИСАНИЕ"
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
        
        // 2. ОБНОВЛЯЕМ ВКЛАДКУ "ХАРАКТЕРИСТИКИ"
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
            // Деревянные текстуры
            'дуб': '#D2B48C',
            'дуб светлый': '#E8D0A9',
            'дуб беленый': '#F5EBDC',
            'дуб темный': '#8B4513',
            'дуб золотой': '#DAA520',
            'дуб серый': '#A9A9A9',
            'орех': '#773F1A',
            'орех светлый': '#C19A6B',
            'орех темный': '#5C4033',
            'ясень': '#F5EBDC',
            'ясень светлый': '#F8F4E6',
            'ясень серый': '#D3D3D3',
            'ясень темный': '#B8860B',
            'бук': '#DEB887',
            'бук светлый': '#F5DEB3',
            'бук темный': '#CD853F',
            'венге': '#3C2F23',
            'венге светлый': '#654321',
            'мерабу': '#8B4513',
            'акация': '#DAA520',
            'кедр': '#8B4513',
            'сосна': '#FFD39B',
            'сосна светлая': '#FFEBCD',
            'сосна темная': '#D2691E',
            
            // Современные цвета
            'белый': '#FFFFFF',
            'черный': '#000000',
            'серый': '#808080',
            'серый светлый': '#D3D3D3',
            'серый темный': '#696969',
            'бежевый': '#F5F5DC',
            'коричневый': '#8B4513',
            'коричневый светлый': '#D2B48C',
            'коричневый темный': '#654321',
            
            // Специальные коллекции
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
        
        // Генерируем коричневые/бежевые оттенки
        const hue = (hash % 30) + 25; // 25-55 - коричневые оттенки
        const saturation = (hash % 40) + 40; // 40-80% насыщенность
        const lightness = (hash % 30) + 50; // 50-80% светлота
        
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
    
    // Инициализация табов (общая функция)
    function initializeTabs() {
        console.log('Инициализация табов ламината...');
        
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
    }
    
    // Загрузка похожих товаров ламината
    async function loadSimilarLaminateProducts(currentProduct) {
        console.log('Загрузка похожих товаров ламината...');
        
        try {
            // Скрываем сообщение об отсутствии товаров
            document.getElementById('noSimilarProducts').style.display = 'none';
            
            // Загружаем все товары ламината
            const response = await pb.collection('laminate').getList(1, 200);
            
            if (!response.items || response.items.length === 0) {
                console.log('Нет товаров ламината для отображения');
                document.getElementById('similarLoading').style.display = 'none';
                document.getElementById('noSimilarProducts').style.display = 'block';
                return;
            }
            
            // Исключаем текущий товар
            const allProducts = response.items.filter(item => item.id !== currentProduct.id);
            
            if (allProducts.length === 0) {
                console.log('Нет похожих товаров ламината');
                document.getElementById('similarLoading').style.display = 'none';
                document.getElementById('noSimilarProducts').style.display = 'block';
                return;
            }
            
            // Находим похожие товары и берем только 4
            const similarProducts = findSimilarLaminateProducts(currentProduct, allProducts)
                .slice(0, 4); // Только 4 товара
            
            console.log('Похожие товары ламината найдены:', similarProducts.length);
            
            // Отображаем похожие товары
            renderSimilarLaminateProducts(similarProducts);
            
        } catch (error) {
            console.error('Ошибка загрузки похожих товаров ламината:', error);
            document.getElementById('similarLoading').style.display = 'none';
            document.getElementById('noSimilarProducts').style.display = 'block';
        }
    }

    function renderSimilarLaminateProducts(products) {
    const grid = document.getElementById('similarProductsGrid');
    const loading = document.getElementById('similarLoading');
    const noResults = document.getElementById('noSimilarProducts');
    
    if (!grid) return;
    
    loading.style.display = 'none';
    
    // Удаляем старую кнопку если есть
    const oldBtn = document.getElementById('loadMoreSimilarLaminate');
    if (oldBtn) oldBtn.remove();
    
    // Очищаем сетку
    grid.innerHTML = '';
    
    if (!products || products.length === 0) {
        noResults.style.display = 'block';
        return;
    }
    
    // Добавляем только 4 товара
    const productsToShow = products.slice(0, 4);
    
    // Добавляем товары в сетку
    productsToShow.forEach(product => {
        const productCard = createSimilarLaminateCard(product);
        grid.appendChild(productCard);
    });
    
    // Скрываем сообщение об отсутствии товаров
    noResults.style.display = 'none';
}
    
    // Поиск похожих товаров ламината
    function findSimilarLaminateProducts(currentProduct, allProducts) {
        // Приоритеты для поиска:
        // 1. Такой же тип
        // 2. Такой же класс износостойкости
        // 3. Похожая толщина
        // 4. Похожие цвета
        
        const currentType = currentProduct.type?.toLowerCase() || '';
        const currentClass = currentProduct.wear_class?.toLowerCase() || '';
        const currentThickness = parseInt(currentProduct.thickness) || 0;
        
        // Сортируем товары по похожести
        const scoredProducts = allProducts.map(product => {
            let score = 0;
            
            // Тип (высший приоритет)
            const productType = product.type?.toLowerCase() || '';
            if (currentType && productType && currentType === productType) {
                score += 100;
            } else if (currentType && productType && productType.includes(currentType)) {
                score += 50;
            }
            
            // Класс износостойкости
            const productClass = product.wear_class?.toLowerCase() || '';
            if (currentClass && productClass && currentClass === productClass) {
                score += 80;
            }
            
            // Толщина (±1 мм)
            const productThickness = parseInt(product.thickness) || 0;
            if (currentThickness && productThickness && Math.abs(currentThickness - productThickness) <= 1) {
                score += 60;
            } else if (currentThickness && productThickness && Math.abs(currentThickness - productThickness) <= 2) {
                score += 30;
            }
            
            // Цена (близкая цена)
            const currentPrice = parseLaminatePrice(currentProduct.prise);
            const productPrice = parseLaminatePrice(product.prise);
            if (currentPrice > 0 && productPrice > 0) {
                const priceDiff = Math.abs(currentPrice - productPrice) / currentPrice;
                if (priceDiff <= 0.2) score += 40;
                else if (priceDiff <= 0.4) score += 20;
            }
            
            return { product, score };
        });
        
        // Сортируем по убыванию оценки
        scoredProducts.sort((a, b) => b.score - a.score);
        
        // Берем первые 8 товаров (или меньше)
        const topProducts = scoredProducts
            .filter(item => item.score > 0)
            .slice(0, 8)
            .map(item => item.product);
        
        // Если не нашли достаточно похожих, добавляем случайные
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
        
        // Получаем короткий ID
        const shortId = product.id.substring(0, 8);
        
        // URL изображения
        let imageUrl = 'img/no-image.jpg';
        if (product.picture && product.picture.length > 0 && product.picture[0]) {
            try {
                const fileName = product.picture[0];
                imageUrl = `http://127.0.0.1:8090/api/files/laminate/${product.id}/${fileName}`;
            } catch (error) {
                console.warn('Ошибка загрузки изображения ламината:', error);
            }
        }
        
        // Цена
        const price = parseLaminatePrice(product.prise);
        const priceDisplay = price > 0 ? formatPrice(price) : 'Цена по запросу';
        
        // Описание (обрезаем до 60 символов)
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
                    <button class="btn-constructor" onclick="window.openLaminateConstructor('${product.id}', '${escapeHtml(product.name || '')}')">
                        В конструктор
                    </button>
                </div>
            </div>
        `;
        
        return card;
    }
    
    // Парсинг цены ламината
    function parseLaminatePrice(priceStr) {
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
    
    // Экранирование HTML
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Добавление ламината в корзину
    function addLaminateToCart(product) {
        try {
            let cart = JSON.parse(localStorage.getItem('laminate_cart')) || [];
            
            // Проверяем есть ли уже такой товар в корзине
            const existingItemIndex = cart.findIndex(item => item.id === product.id);
            
            if (existingItemIndex > -1) {
                cart[existingItemIndex].quantity += 1;
            } else {
                cart.push({
                    id: product.id,
                    name: product.name,
                    price: product.prise,
                    picture: product.picture?.[0] || '',
                    type: 'laminate',
                    thickness: product.thickness,
                    wear_class: product.wear_class,
                    quantity: 1,
                    unit: 'м²'
                });
            }
            
            localStorage.setItem('laminate_cart', JSON.stringify(cart));
            
            // Показываем уведомление
            showNotification('Ламинат добавлен в корзину!', 'success');
            
            // Обновляем счетчик корзины
            updateCartCounter();
            
        } catch (error) {
            console.error('Ошибка добавления в корзину:', error);
            showNotification('Ошибка добавления в корзину', 'error');
        }
    }
    
    // Обновление счетчика корзины
    function updateCartCounter() {
        const cartCounter = document.querySelector('.cart-counter');
        if (cartCounter) {
            try {
                const laminateCart = JSON.parse(localStorage.getItem('laminate_cart')) || [];
                const doorsCart = JSON.parse(localStorage.getItem('cart')) || [];
                
                const totalItems = laminateCart.reduce((sum, item) => sum + item.quantity, 0) +
                                  doorsCart.reduce((sum, item) => sum + item.quantity, 0);
                
                cartCounter.textContent = totalItems;
                cartCounter.style.display = totalItems > 0 ? 'flex' : 'none';
            } catch (error) {
                console.error('Ошибка обновления счетчика корзины:', error);
            }
        }
    }
    
    // Показать уведомление
    function showNotification(message, type = 'info') {
        // Удаляем старые уведомления
        document.querySelectorAll('.laminate-notification').forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `laminate-notification laminate-notification--${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 10px;
            background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
            color: white;
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideInNotification 0.3s ease;
            font-weight: 500;
            max-width: 300px;
        `;
        
        document.body.appendChild(notification);
        
        // Автоудаление через 3 секунды
        setTimeout(() => {
            notification.style.animation = 'slideOutNotification 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // Инициализация модальных окон для ламината
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
        
        // Показываем модальное окно
        modalOverlay.style.display = 'flex';
        
        // Автозаполнение даты
        const dateInput = document.getElementById('desiredDate');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.min = today;
            dateInput.value = today;
        }
        
        // Обработка формы
        const form = document.getElementById('laminateMeasureForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(form);
                const data = Object.fromEntries(formData);
                
                try {
                    // Добавляем информацию о товаре
                    if (currentProduct) {
                        data.product_id = currentProduct.id;
                        data.product_name = currentProduct.name;
                        data.product_type = 'laminate';
                    }
                    
                    // Отправляем заявку
                    await pb.collection('measure_requests').create(data);
                    
                    // Закрываем модальное окно
                    modalOverlay.style.display = 'none';
                    
                    // Показываем уведомление
                    showNotification('Заявка отправлена! Мы свяжемся с вами в ближайшее время.', 'success');
                    
                    // Сбрасываем форму
                    form.reset();
                    
                } catch (error) {
                    console.error('Ошибка отправки заявки:', error);
                    showNotification('Ошибка отправки заявки. Попробуйте позже.', 'error');
                }
            });
        }
        
        // Кнопка отмены
        const cancelBtn = document.getElementById('cancelMeasure');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                modalOverlay.style.display = 'none';
            });
        }
    }
    
    // Глобальная функция для открытия конструктора
    window.openLaminateConstructor = function(productId, productName) {
        window.location.href = `laminate-constructor.html?product_id=${productId}&product_name=${encodeURIComponent(productName)}`;
    };
    
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
    
    // Запускаем когда DOM готов
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadPocketBase);
    } else {
        loadPocketBase();
    }
    
    // Добавляем CSS стили для анимаций
    const styleElement = document.createElement('style');
    styleElement.textContent = `
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
        
        @keyframes slideOutNotification {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .laminate-feature-tag {
            display: inline-block;
            padding: 4px 12px;
            border-width: 3px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            margin-right: 8px;
            outline: 1.5px solid black;
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
    `;
    document.head.appendChild(styleElement);
    
    console.log('Laminate-product.js загружен и готов к работе!');
})();


// В класс ProductPage добавьте эти методы:

class ProductPage {
    // ... существующий код ...
    
    setupEventListeners() {
        // ... существующие обработчики ...
        
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