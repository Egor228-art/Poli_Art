// ============================================
// product.js - ПОЛНОСТЬЮ РАБОЧАЯ ВЕРСИЯ
// ============================================

let pb = null;
let currentProductData = null;
let currentProductPrice = 0;
let isLaminateMode = false;

window.pb = null;

(function() {
    console.log('Загрузка product.js...');
    
    // Инициализация PocketBase
    function initProductApp() {
        console.log('Инициализация приложения товара...');
        
        if (typeof PocketBase === 'undefined') {
            console.error('PocketBase не загружен!');
            showErrorMessage('Ошибка загрузки приложения');
            return;
        }
        
        try {
            pb = new PocketBase('http://127.0.0.1:8090');
            pb.autoCancellation(false);
            window.pb = pb;
            startProductPage();
        } catch (error) {
            console.error('Ошибка создания PocketBase:', error);
            showErrorMessage('Ошибка инициализации приложения');
        }
    }
    
    // Загрузка PocketBase
    function loadPocketBase() {
        console.log('Загрузка PocketBase SDK...');
        
        if (typeof PocketBase !== 'undefined') {
            console.log('PocketBase уже загружен');
            initProductApp();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/pocketbase/dist/pocketbase.umd.js';
        script.onload = function() {
            console.log('PocketBase успешно загружен');
            setTimeout(initProductApp, 100);
        };
        script.onerror = function() {
            console.error('Не удалось загрузить PocketBase SDK');
            showErrorMessage('Не удалось загрузить необходимые компоненты');
        };
        
        document.head.appendChild(script);
    }
    
    // Запуск при DOM готов
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadPocketBase);
    } else {
        loadPocketBase();
    }
    
    // ============ ОСНОВНАЯ СТРАНИЦА ТОВАРА ============
    
    async function startProductPage() {
        console.log('Начало загрузки страницы товара...');
        
        try {
            await initializeProductPage();
        } catch (error) {
            console.error('Критическая ошибка:', error);
            showErrorMessage('Произошла ошибка при загрузке страницы товара');
        }
    }
    
    async function initializeProductPage() {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        
        console.log('ID товара из URL:', productId);
        
        if (!productId) {
            showError('Товар не найден');
            return;
        }

        showLoadingState();
        
        try {
            console.log('Загрузка данных товара...');
            
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
                    isLaminateMode = true;
                    console.log('Товар загружен из коллекции laminate:', product);
                } catch (laminateError) {
                    throw new Error('Товар не найден ни в одной коллекции');
                }
            }

            if (!product) {
                throw new Error('Товар не найден в базе данных');
            }

            currentProductData = product;
            currentProductPrice = parseProductPrice(product.prise);
            
            fillProductPageData(product, collectionName === 'laminate');
            
            // Загружаем похожие товары
            loadSimilarProducts(product, collectionName).catch(error => {
                console.warn('Не удалось загрузить похожие товары:', error);
            });
            
            // ЗАГРУЖАЕМ ОТЗЫВЫ
            loadProductReviews(productId);
            
            console.log('Страница товара успешно загружена!');
            
        } catch (error) {
            console.error('Ошибка загрузки товара:', error);
            showError('Не удалось загрузить информацию о товаре');
        }
    }
    
    function fillProductPageData(product, isLaminate = false) {
        console.log('Заполнение данных товара...');
        
        createPageStructure();
        fillBasicInfo(product, isLaminate);
        setupProductGallery(product, isLaminate);
        fillDescriptionAndSpecs(product, isLaminate);
        initializeTabs();
        initOrderModal();
        hideLoadingState();
    }
    
    function createPageStructure() {
        console.log('Создание структуры страницы...');
        
        const productMain = document.querySelector('.product-main');
        if (!productMain) {
            console.error('Основной контейнер не найден');
            return;
        }
        
        let productMainInner = document.querySelector('.product-main__inner');
        
        if (!productMainInner) {
            console.log('Создание внутренней структуры...');
            
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
    
    function fillBasicInfo(product, isLaminate) {
        console.log('Заполнение основной информации...');
        
        const titleElement = document.querySelector('.product-title');
        const skuElement = document.querySelector('.product-sku');
        const productActions = document.querySelector('.product-actions');
        const productPrice = document.querySelector('.product-price');
        
        if (titleElement) {
            titleElement.textContent = product.name || 'Без названия';
        }
        
        if (skuElement) {
            const productId = product.id;
            const shortId = productId.substring(0, 8);
            skuElement.textContent = `Код товара: ${shortId}`;
            skuElement.dataset.fullId = productId;
        }
        
        if (productPrice) {
            let price = parseProductPrice(product.prise);
            
            if (price > 0) {
                productPrice.innerHTML = `<div class="price-current">${formatPrice(price)}</div>`;
            } else {
                productPrice.innerHTML = '<div class="price-on-request">Цена по запросу</div>';
            }
        }
        
        if (productActions) {
            productActions.innerHTML = `
                <button class="btn btn--primary" id="orderBtn">
                    <span>🛒 Оформить заказ</span>
                </button>
            `;
        }
    }
    
    function parseProductPrice(priceStr) {
        if (!priceStr) return 0;
        const cleanStr = priceStr.toString().replace(/[^\d]/g, '');
        const price = parseInt(cleanStr);
        return isNaN(price) ? 0 : price;
    }
    
    function formatPrice(price) {
        return price.toLocaleString('ru-RU') + ' ₽';
    }
    
    function setupProductGallery(product, isLaminate) {
        console.log('Настройка галереи...');
        
        const galleryThumbs = document.querySelector('.gallery-thumbs');
        const mainImage = document.getElementById('mainImage');
        
        if (!galleryThumbs || !mainImage) {
            console.error('Элементы галереи не найдены');
            return;
        }
        
        const collectionName = isLaminate ? 'laminate' : 'doors';
        
        if (!product.picture || !Array.isArray(product.picture) || product.picture.length === 0) {
            console.log('Нет изображений товара');
            mainImage.src = 'img/no-image.jpg';
            mainImage.alt = product.name || 'Нет изображения';
            galleryThumbs.innerHTML = '<p>Изображения отсутствуют</p>';
            return;
        }
        
        console.log('Количество изображений:', product.picture.length);
        
        const firstImageUrl = `http://127.0.0.1:8090/api/files/${collectionName}/${product.id}/${product.picture[0]}`;
        mainImage.src = firstImageUrl;
        mainImage.alt = product.name || 'Изображение товара';
        
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
                document.querySelectorAll('.thumb').forEach(thumb => {
                    thumb.classList.remove('active');
                });
                thumbElement.classList.add('active');
                mainImage.src = thumbUrl;
            });
            
            galleryThumbs.appendChild(thumbElement);
        });
        
        console.log('Галерея настроена');
    }
    
    function fillDescriptionAndSpecs(product, isLaminate) {
        console.log('Заполнение описания и характеристик...');
        
        const colorsHTML = getColorChipsHTML(product.color);
        
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
        
        const specsTable = document.querySelector('#specifications .specs-table');
        if (specsTable) {
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
        
        console.log('Описание и характеристики заполнены');
    }
    
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
        const lowerName = russianName.toString().toLowerCase().trim();
        
        const colorMap = {
            'белый': '#FFFFFF',
            'черный': '#000000',
            'чёрный': '#000000',
            'серый': '#808080',
            'серебристый': '#C0C0C0',
            'серебро': '#C0C0C0',
            'красный': '#FF0000',
            'бордовый': '#800000',
            'вишневый': '#911E42',
            'вишня': '#911E42',
            'коричневый': '#8B4513',
            'дуб': '#C19A6B',
            'дубовый': '#C19A6B',
            'орех': '#773F1A',
            'ореховый': '#773F1A',
            'ясень': '#F5EBDC',
            'бук': '#F5E1C8',
            'сосна': '#FFD39B',
            'венге': '#645452',
            'бежевый': '#F5F5DC',
            'зеленый': '#008000',
            'синий': '#0000FF',
            'голубой': '#87CEEB',
            'фиолетовый': '#800080',
            'золотой': '#FFD700',
            'бронза': '#CD7F32',
            'хром': '#A8A9AD',
            'сталь': '#B0B0B0'
        };
        
        if (colorMap[lowerName]) {
            return colorMap[lowerName];
        }
        
        for (const [colorName, hexValue] of Object.entries(colorMap)) {
            if (lowerName.includes(colorName) || colorName.includes(lowerName)) {
                return hexValue;
            }
        }
        
        return generateColorFromName(russianName);
    }
    
    function generateColorFromName(name) {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = (hash % 30) + 20;
        const saturation = (hash % 30) + 40;
        const lightness = (hash % 40) + 40;
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
    
    function getColorChipsHTML(colorData) {
        console.log('Данные цвета из БД:', colorData);
        
        if (!colorData) {
            return '';
        }
        
        let colors = [];
        
        if (typeof colorData === 'string') {
            if (colorData.startsWith('[') || colorData.startsWith('"')) {
                try {
                    const parsed = JSON.parse(colorData);
                    colors = Array.isArray(parsed) ? parsed : [parsed];
                } catch (e) {
                    colors = [colorData];
                }
            } else {
                colors = colorData.split(',').map(c => c.trim()).filter(c => c);
            }
        } else if (Array.isArray(colorData)) {
            colors = colorData;
        }
        
        colors = colors.filter(color => color && color.toString().trim());
        
        if (colors.length === 0) {
            return '';
        }
        
        console.log('Обработанные цвета:', colors);
        
        return colors.map(color => {
            const colorName = color.toString().trim();
            const hexColor = getColorHex(colorName);
            
            return `
                <div class="color-chip" title="${colorName}">
                    <div class="color-sample" style="background-color: ${hexColor};"></div>
                    <span class="color-name">${colorName}</span>
                </div>
            `;
        }).join('');
    }
    
    function initializeTabs() {
        console.log('Инициализация табов...');
        
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
        
        const firstTab = tabButtons[0];
        if (firstTab) {
            const firstTabId = firstTab.getAttribute('data-tab');
            firstTab.classList.add('active');
            
            const firstPane = document.getElementById(firstTabId);
            if (firstPane) {
                firstPane.classList.add('active');
            }
        }
    }
    
    // ============ ПОХОЖИЕ ТОВАРЫ ============
    
    async function loadSimilarProducts(currentProduct, collectionName) {
        console.log('Загрузка похожих товаров...');
        
        try {
            const response = await pb.collection(collectionName).getList(1, 200);
            
            if (!response.items || response.items.length === 0) {
                console.log('Нет товаров для отображения');
                hideSimilarProductsSection();
                return;
            }
            
            const allProducts = response.items.filter(item => item.id !== currentProduct.id);
            
            if (allProducts.length === 0) {
                console.log('Нет похожих товаров');
                hideSimilarProductsSection();
                return;
            }
            
            const similarProducts = findSimilarProductsByMaterial(currentProduct, allProducts, collectionName).slice(0, 4);
            
            console.log('Похожие товары найдены:', similarProducts.length);
            displaySimilarProducts(similarProducts, collectionName);
            
        } catch (error) {
            console.error('Ошибка загрузки похожих товаров:', error);
            hideSimilarProductsSection();
        }
    }
    
    function findSimilarProductsByMaterial(currentProduct, allProducts, collectionName) {
        const MIN_PRODUCTS = 4;
        const currentMaterial = getProductMaterial(currentProduct, collectionName);
        console.log('Материал текущего товара:', currentMaterial);
        
        if (!currentMaterial) {
            console.log('У текущего товара не указан материал, показываем случайные товары');
            return getRandomProducts(allProducts, MIN_PRODUCTS);
        }
        
        const productsByMaterial = {
            sameMaterial: [],
            similarMaterial: [],
            otherProducts: []
        };
        
        allProducts.forEach(product => {
            const productMaterial = getProductMaterial(product, collectionName);
            
            if (!productMaterial) {
                productsByMaterial.otherProducts.push(product);
                return;
            }
            
            if (isExactMaterialMatch(currentMaterial, productMaterial)) {
                productsByMaterial.sameMaterial.push(product);
            } else if (isSimilarMaterial(currentMaterial, productMaterial, collectionName)) {
                productsByMaterial.similarMaterial.push(product);
            } else {
                productsByMaterial.otherProducts.push(product);
            }
        });
        
        console.log('Распределение по материалам:', {
            sameMaterial: productsByMaterial.sameMaterial.length,
            similarMaterial: productsByMaterial.similarMaterial.length,
            otherProducts: productsByMaterial.otherProducts.length
        });
        
        let finalProducts = [];
        
        if (productsByMaterial.sameMaterial.length > 0) {
            finalProducts = [...finalProducts, ...productsByMaterial.sameMaterial];
        }
        
        if (finalProducts.length < MIN_PRODUCTS && productsByMaterial.similarMaterial.length > 0) {
            const neededCount = MIN_PRODUCTS - finalProducts.length;
            const similarToAdd = productsByMaterial.similarMaterial.slice(0, neededCount);
            finalProducts = [...finalProducts, ...similarToAdd];
        }
        
        if (finalProducts.length < MIN_PRODUCTS && productsByMaterial.otherProducts.length > 0) {
            const neededCount = MIN_PRODUCTS - finalProducts.length;
            const randomOther = getRandomProducts(productsByMaterial.otherProducts, neededCount);
            finalProducts = [...finalProducts, ...randomOther];
        }
        
        if (finalProducts.length < MIN_PRODUCTS) {
            return sortByMaterialSimilarity(currentProduct, allProducts, collectionName).slice(0, MIN_PRODUCTS);
        }
        
        return finalProducts;
    }
    
    function getProductMaterial(product, collectionName) {
        if (collectionName === 'laminate') {
            return product.type || null;
        } else {
            return product.material || null;
        }
    }
    
    function isExactMaterialMatch(material1, material2) {
        if (!material1 || !material2) return false;
        const m1 = material1.toString().toLowerCase().trim();
        const m2 = material2.toString().toLowerCase().trim();
        return m1 === m2;
    }
    
    function isSimilarMaterial(material1, material2, collectionName) {
        if (!material1 || !material2) return false;
        
        const m1 = material1.toString().toLowerCase().trim();
        const m2 = material2.toString().toLowerCase().trim();
        
        if (collectionName === 'laminate') {
            const laminateGroups = {
                'дуб': ['дуб', 'дубовый'],
                'ясень': ['ясень', 'ясеневый'],
                'орех': ['орех', 'ореховый'],
                'бук': ['бук', 'буковый'],
                'сосна': ['сосна', 'сосновый'],
                'экошпон': ['экошпон', 'эко шпон'],
                'пвх': ['пвх', 'пластик'],
                'мдф': ['мдф', 'mdf']
            };
            
            for (const [group, materials] of Object.entries(laminateGroups)) {
                const inGroup1 = materials.some(mat => m1.includes(mat) || mat.includes(m1));
                const inGroup2 = materials.some(mat => m2.includes(mat) || mat.includes(m2));
                if (inGroup1 && inGroup2) return true;
            }
            
            return m1.includes(m2) || m2.includes(m1);
        } else {
            const doorGroups = {
                'массив': ['массив', 'дерево'],
                'мдф': ['мдф', 'mdf'],
                'шпон': ['шпон', 'шпонированный'],
                'экошпон': ['экошпон', 'эко шпон'],
                'пвх': ['пвх', 'пластик'],
                'стекло': ['стекло', 'стеклянный'],
                'металл': ['металл', 'сталь', 'алюминий']
            };
            
            for (const [group, materials] of Object.entries(doorGroups)) {
                const inGroup1 = materials.some(mat => m1.includes(mat) || mat.includes(m1));
                const inGroup2 = materials.some(mat => m2.includes(mat) || mat.includes(m2));
                if (inGroup1 && inGroup2) return true;
            }
            
            return m1.includes(m2) || m2.includes(m1);
        }
    }
    
    function sortByMaterialSimilarity(currentProduct, products, collectionName) {
        const currentMaterial = getProductMaterial(currentProduct, collectionName);
        
        if (!currentMaterial) {
            return [...products].sort(() => Math.random() - 0.5);
        }
        
        const currentMaterialLower = currentMaterial.toString().toLowerCase().trim();
        
        return [...products].sort((a, b) => {
            const materialA = getProductMaterial(a, collectionName);
            const materialB = getProductMaterial(b, collectionName);
            
            const scoreA = calculateMaterialScore(currentMaterialLower, materialA, collectionName);
            const scoreB = calculateMaterialScore(currentMaterialLower, materialB, collectionName);
            
            if (scoreB !== scoreA) {
                return scoreB - scoreA;
            }
            
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
    
    function calculateMaterialScore(currentMaterial, productMaterial, collectionName) {
        if (!productMaterial) return 0;
        
        const productMaterialLower = productMaterial.toString().toLowerCase().trim();
        
        if (currentMaterial === productMaterialLower) {
            return 100;
        }
        
        if (currentMaterial.includes(productMaterialLower) || productMaterialLower.includes(currentMaterial)) {
            return 80;
        }
        
        if (isSimilarMaterial(currentMaterial, productMaterialLower, collectionName)) {
            return 60;
        }
        
        const currentWords = currentMaterial.split(/[\s,.-]+/).filter(w => w.length > 2);
        const productWords = productMaterialLower.split(/[\s,.-]+/).filter(w => w.length > 2);
        
        const commonWords = currentWords.filter(word => 
            productWords.some(pWord => pWord.includes(word) || word.includes(pWord))
        );
        
        if (commonWords.length > 0) {
            return 40 + (commonWords.length * 10);
        }
        
        return 10;
    }
    
    function getRandomProducts(products, count) {
        if (products.length <= count) {
            return [...products];
        }
        const shuffled = [...products].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }
    
    function displaySimilarProducts(products, collectionName) {
        const grid = document.getElementById('similarProductsGrid');
        const noResults = document.getElementById('noSimilarProducts');
        
        const loading = document.getElementById('similarLoading');
        if (loading) {
            loading.style.display = 'none';
        }
        
        if (!grid) return;
        
        grid.innerHTML = '';
        
        if (!products || products.length === 0) {
            if (grid) grid.style.display = 'none';
            if (noResults) noResults.style.display = 'block';
            return;
        }
        
        const productsToShow = products.slice(0, 4);
        
        productsToShow.forEach(product => {
            const productCard = createSimilarProductCard(product, collectionName);
            grid.appendChild(productCard);
        });
        
        if (noResults) noResults.style.display = 'none';
        
        console.log('Похожие товары отображены');
    }
    
    function createSimilarProductCard(product, collectionName) {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        const shortId = product.id.substring(0, 8);
        const productMaterial = getProductMaterial(product, collectionName);
        
        card.dataset.productId = product.id;
        card.dataset.productMaterial = productMaterial || '';
        
        let imageUrl = 'img/no-image.jpg';
        if (product.picture && product.picture.length > 0) {
            imageUrl = `http://127.0.0.1:8090/api/files/${collectionName}/${product.id}/${product.picture[0]}`;
        }
        
        const isLaminate = collectionName === 'laminate';
        const price = parseProductPrice(product.prise);
        const priceDisplay = price > 0 ? formatPrice(price) : 'Цена по запросу';
        const productPage = isLaminate ? 'laminate-product.html' : 'product.html';
        
        const description = product.description ? 
            (product.description.length > 80 ? 
                product.description.substring(0, 80) + '...' : 
                product.description) : 
            'Описание отсутствует';
        
        card.innerHTML = `
            <div class="product-image-container">
                <img src="${imageUrl}" 
                     alt="${escapeHtml(product.name || 'Товар')}" 
                     class="product-image"
                     loading="lazy"
                     onerror="this.src='img/no-image.jpg'"
                     onclick="window.location.href='${productPage}?id=${product.id}'">
            </div>
            <div class="product-info">
                <h3 class="product-title">${escapeHtml(product.name || 'Без названия')}</h3>
                <p class="product-description">${escapeHtml(description)}</p>            
                <div class="product-price">${priceDisplay}</div>
                <div class="product-actions">
                    <a href="${productPage}?id=${product.id}" class="btn-details">Подробнее</a>
                </div>
            </div>
        `;
        
        return card;
    }
    
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function hideSimilarProductsSection() {
        const section = document.querySelector('.recommended-products');
        if (section) {
            section.style.display = 'none';
        }
    }
    
    // ============ ОТЗЫВЫ - ПОЛНОСТЬЮ РАБОЧАЯ ВЕРСИЯ ============
    
    async function loadProductReviews(productId) {
        console.log('Загрузка отзывов для товара:', productId);
        
        try {
            // 1. Загружаем все отзывы из БД
            let allReviews = [];
            
            // Отзывы на двери
            try {
                const doorsReviews = await pb.collection('reviews').getList(1, 100, {
                    filter: `product = "${productId}"`,
                    sort: '-created'            });
                allReviews = [...allReviews, ...doorsReviews.items];
                console.log(`Загружено ${doorsReviews.items.length} отзывов из reviews`);
            } catch (e) {
                console.log('Нет отзывов в коллекции reviews');
            }
            
            // Отзывы на ламинат
            try {
                const laminateReviews = await pb.collection('reviews_laminate').getList(1, 100, {
                    filter: `product = "${productId}"`,
                    sort: '-created'
                });
                allReviews = [...allReviews, ...laminateReviews.items];
                console.log(`Загружено ${laminateReviews.items.length} отзывов из reviews_laminate`);
            } catch (e) {
                console.log('Нет отзывов в коллекции reviews_laminate');
            }
            
            // 2. Определяем состояние кнопки отзыва
            let canReview = false;
            let reviewStatus = 'not_available';
            let statusText = '🔒 Отзыв только для купивших товар';
            
            if (window.authManager && window.authManager.currentUser) {
                const userId = window.authManager.currentUser.id;
                const userName = window.authManager.currentUser.name;
                const userEmail = window.authManager.currentUser.email;
                
                console.log('Проверка для пользователя:', userName, 'ID:', userId);
                
                // Проверяем - оставлял ли уже отзыв?
                const hasReviewed = allReviews.some(review => 
                    review.author_name === userName || 
                    review.author_email === userEmail
                );
                
                if (hasReviewed) {
                    reviewStatus = 'already_reviewed';
                    statusText = '✓ Вы уже оставили отзыв';
                    console.log('Пользователь уже оставлял отзыв');
                } else {
                    // Проверяем - покупал ли товар?
                    const hasPurchased = await checkUserPurchasedProduct(productId, userId);
                    
                    if (hasPurchased) {
                        reviewStatus = 'can_review';
                        statusText = '✍️ Оставить отзыв';
                        canReview = true;
                        console.log('✅ Пользователь МОЖЕТ оставить отзыв');
                    } else {
                        reviewStatus = 'not_available';
                        statusText = 'Отзыв только для купивших товар';
                        console.log('❌ Пользователь НЕ покупал этот товар');
                    }
                }
            } else {
                statusText = 'Войдите, чтобы оставить отзыв';
                console.log('Пользователь не авторизован');
            }
            
            // 3. Отображаем отзывы
            displayProductReviews(allReviews, reviewStatus, statusText, canReview, productId);
            
        } catch (error) {
            console.error('Ошибка загрузки отзывов:', error);
            displayProductReviews([], 'not_available', '🔒 Отзыв временно недоступен', false, productId);
        }
    }
    
    async function checkUserPurchasedProduct(productId, userId) {
        console.log('🔍 ПРОВЕРКА ПОКУПКИ ТОВАРА:', productId, 'Пользователь:', userId);

        try {
            const response = await pb.collection('orders').getList(1, 100, {
                filter: `user = "${userId}"`,
                sort: '-created',
                requestKey: null
            });

            if (!response.items || response.items.length === 0) {
                console.log('❌ У пользователя нет заказов');
                return false;
            }

            console.log(`📦 Найдено заказов: ${response.items.length}`);

            const PAID_STATUSES = [
                'оплачено', 'доставлено', 'delivered', 'оплачен', 
                'выполнен', 'завершен', 'получен', 'paid', 'completed',
                'обработан', 'отправлен'
            ];

            for (const order of response.items) {
                console.log(`\n--- Проверка заказа #${order.order_number || order.id} ---`);
                console.log('Статус заказа:', order.status);
                console.log('Полные данные заказа:', JSON.stringify(order, null, 2));
                
                const status = (order.status || '').toLowerCase();
                const isPaid = PAID_STATUSES.some(s => status.includes(s.toLowerCase()));
                
                if (!isPaid) {
                    console.log(`❌ Заказ НЕ оплачен (статус: ${order.status})`);
                    continue;
                }
                
                console.log(`✅ Заказ ОПЛАЧЕН, статус: ${order.status}`);

                // ============= ИСПРАВЛЕНИЕ: СНАЧАЛА ПРОВЕРЯЕМ ПОЛЕ product =============
                if (order.product) {
                    const productField = order.product.toString().trim();
                    console.log(`🔍 Проверка поля product: "${productField}" === "${productId}"`);
                    
                    if (productField === productId.toString()) {
                        console.log('🎉 ТОВАР НАЙДЕН в поле product!');
                        return true;
                    }
                }

                // ============= ПОТОМ ПРОВЕРЯЕМ products (JSON массив) =============
                if (order.products) {
                    console.log('Проверка поля products:', order.products);
                    
                    let products = [];
                    
                    if (typeof order.products === 'string') {
                        try {
                            products = JSON.parse(order.products) || [];
                            console.log('Распарсили JSON, товаров:', products.length);
                        } catch (e) {
                            console.log('Не удалось распарсить JSON:', e.message);
                        }
                    } else if (Array.isArray(order.products)) {
                        products = order.products;
                        console.log('products уже массив, товаров:', products.length);
                    }
                    
                    if (products.length > 0) {
                        const foundInProducts = products.find(p => {
                            // Проверяем все возможные поля
                            const itemId = p.id || p.product_id || p.item_id || p.product;
                            if (!itemId) return false;
                            
                            const itemIdStr = itemId.toString().trim();
                            const productIdStr = productId.toString().trim();
                            
                            console.log(`   Сравниваем: товар в заказе "${itemIdStr}" с искомым "${productIdStr}"`);
                            
                            return itemIdStr === productIdStr;
                        });
                        
                        if (foundInProducts) {
                            console.log('🎉 ТОВАР НАЙДЕН в поле products!', foundInProducts);
                            return true;
                        }
                    }
                }
                
                // ============= ПРОВЕРЯЕМ ПОЛЕ items =============
                if (order.items) {
                    console.log('Проверка поля items:', order.items);
                    
                    let items = [];
                    
                    if (typeof order.items === 'string') {
                        try {
                            items = JSON.parse(order.items) || [];
                        } catch (e) {}
                    } else if (Array.isArray(order.items)) {
                        items = order.items;
                    }
                    
                    const foundInItems = items.find(item => {
                        const itemId = item.id || item.product_id;
                        return itemId && itemId.toString() === productId.toString();
                    });
                    
                    if (foundInItems) {
                        console.log('🎉 ТОВАР НАЙДЕН в поле items!');
                        return true;
                    }
                }
            }

            console.log('\n❌ ИТОГ: Товар НЕ НАЙДЕН ни в одном оплаченном заказе');
            return false;

        } catch (error) {
            console.error('❌ Ошибка проверки заказов:', error);
            return false;
        }
    }
    
    function displayProductReviews(reviews, reviewStatus, statusText, canReview, productId) {
        console.log('Отображение отзывов, статус:', reviewStatus, 'может оставить:', canReview);

        const reviewsList = document.querySelector('.reviews-list');
        if (!reviewsList) {
            console.error('Контейнер отзывов не найден');
            return;
        }

        const productName = document.querySelector('.product-title')?.textContent || 'Товар';
        let html = '';

        // ============ КНОПКА И СТАТУС ============
        html += `<div class="reviews-actions" style="margin-bottom: 30px; display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">`;
        
        if (canReview) {
            // Активная зеленая кнопка + плашка
            html += `
                <button class="btn btn--primary" id="addReviewBtn" 
                        onclick="window.openProductReviewModal('${productId}')"
                        style="background: linear-gradient(135deg, #e74c3c, #c0392b); border: none; padding: 12px 25px; display: flex; align-items: center; gap: 10px; border-radius: 8px; color: white; font-weight: 500; cursor: pointer; box-shadow: 0 4px 15px rgba(174, 39, 39, 0.3);">
                    <span style="font-size: 18px;">✍️</span>
                    <span>Оставить отзыв</span>
                </button>
                <span style="color: #27ae60; font-size: 14px; background: #e8f5e9; padding: 5px 12px; border-radius: 20px;">
                    ✓ Вы купили этот товар
                </span>
            `;
        } else {
            // Неактивная кнопка
            let icon = '🔒';
            if (statusText.includes('✓')) icon = '✓';
            if (statusText.includes('Войдите')) icon = '🔑';
            
            html += `
                <button class="btn" disabled 
                        style="background: #f0f0f0; color: #999; border: 1px solid #ddd; padding: 12px 25px; display: flex; align-items: center; gap: 10px; border-radius: 8px; font-weight: 500; cursor: not-allowed; opacity: 0.8;">
                    <span style="font-size: 18px;">${icon}</span>
                    <span>${statusText}</span>
                </button>
            `;
        }
        
        html += `</div>`;

        // ============ СУЩЕСТВУЮЩИЕ ОТЗЫВЫ ============
        const approvedReviews = reviews.filter(r => r.approved === true);

        if (approvedReviews.length === 0) {
            html += `
                <div class="no-reviews">
                    <div class="no-reviews__icon">💬</div>
                    <div class="no-reviews__text">Пока нет отзывов. Будьте первым!</div>
                </div>
            `;
        } else {
            html += `<h3 style="margin-bottom: 20px; font-size: 20px; color: #2c3e50;">Отзывы покупателей</h3>`;
            
            approvedReviews.forEach(review => {
                const date = new Date(review.created).toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                });

                const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

                html += `
                    <div style="background: white; padding: 25px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #eee; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <div>
                                <strong style="color: #2c3e50; font-size: 16px;">${review.author_name || 'Пользователь'}</strong>
                                <span style="color: #27ae60; font-size: 13px; margin-left: 10px; background: #e8f5e9; padding: 3px 10px; border-radius: 20px;">✓ покупатель</span>
                            </div>
                            <span style="color: #999; font-size: 13px;">${date}</span>
                        </div>
                        <div style="color: #ffc107; margin-bottom: 15px; font-size: 20px;">${stars}</div>
                        <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">${review.text}</p>
                        ${review.pros ? `<div style="color: #27ae60; font-size: 14px; margin-top: 10px; padding: 10px 15px; background: #e8f5e9; border-radius: 8px;">✅ Достоинства: ${review.pros}</div>` : ''}
                        ${review.cons ? `<div style="color: #e74c3c; font-size: 14px; margin-top: 10px; padding: 10px 15px; background: #ffebee; border-radius: 8px;">❌ Недостатки: ${review.cons}</div>` : ''}
                    </div>
                `;
            });
        }

        reviewsList.innerHTML = html;

        // Обновляем счетчик на вкладке
        const reviewsTabBtn = document.querySelector('[data-tab="reviews"]');
        if (reviewsTabBtn) {
            reviewsTabBtn.innerHTML = `Отзывы ${approvedReviews.length > 0 ? `(${approvedReviews.length})` : ''}`;
        }
    }
    
    // ============ МОДАЛЬНОЕ ОКНО ОТЗЫВА ============
    
    window.openProductReviewModal = function(productId) {
        console.log('Открытие модального окна отзыва для товара:', productId);
        
        const productName = document.querySelector('.product-title')?.textContent || 'Товар';
        
        // Проверяем, авторизован ли пользователь
        if (!window.authManager || !window.authManager.currentUser) {
            alert('Пожалуйста, авторизуйтесь, чтобы оставить отзыв');
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
            return;
        }
        
        const modalHTML = `
            <div class="modal-overlay" id="productReviewModal" style="display: flex; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 10000; align-items: center; justify-content: center; backdrop-filter: blur(5px);">
                <div class="modal" style="background: white; border-radius: 16px; padding: 30px; max-width: 550px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
                    <button onclick="closeProductReviewModal()" style="position: absolute; top: 20px; right: 20px; background: none; border: none; font-size: 28px; cursor: pointer; color: #999; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: all 0.3s;" 
                            onmouseover="this.style.background='#f5f5f5'; this.style.color='#e74c3c'" 
                            onmouseout="this.style.background='none'; this.style.color='#999'">&times;</button>
                    
                    <h2 style="margin-bottom: 20px; color: #2c3e50; font-size: 24px; font-weight: 600;">Оставить отзыв</h2>
                    
                    <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 15px 20px; border-radius: 12px; margin-bottom: 25px; border-left: 4px solid #e74c3c;">
                        <strong style="color: #2c3e50; font-size: 16px;">${productName}</strong>
                    </div>
                    
                    <form id="productReviewForm">
                        <input type="hidden" id="reviewProductId" value="${productId}">
                        <input type="hidden" id="reviewProductName" value="${productName}">
                        
                        <div style="margin-bottom: 25px;">
                            <label style="display: block; margin-bottom: 12px; font-weight: 600; color: #2c3e50; font-size: 15px;">Оценка товара</label>
                            <div style="display: flex; gap: 12px;" id="productRatingStars">
                                ${[1,2,3,4,5].map(i => 
                                    `<span onclick="setProductRating(${i})" style="font-size: 36px; cursor: pointer; color: #f1c40f; transition: all 0.2s;" 
                                          data-rating="${i}">☆</span>`
                                ).join('')}
                            </div>
                            <input type="hidden" id="productReviewRating" value="5">
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 10px; font-weight: 600; color: #2c3e50; font-size: 15px;">Ваш отзыв <span style="color: #e74c3c;">*</span></label>
                            <textarea id="productReviewText" rows="5" required
                                    style="width: 100%; padding: 15px; border: 2px solid #e0e0e0; border-radius: 12px; font-size: 15px; resize: vertical; transition: border-color 0.3s;"
                                    placeholder="Поделитесь впечатлениями о товаре..."
                                    onfocus="this.style.borderColor='#e74c3c'; this.style.outline='none'"
                                    onblur="this.style.borderColor='#e0e0e0'"></textarea>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 15px 20px; border-radius: 12px; margin-bottom: 25px; border: 1px solid #e0e0e0;">
                            <p style="margin: 0; color: #666; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 18px;">📝</span>
                                <span>Отзыв будет опубликован после проверки модератором (обычно в течение 24 часов)</span>
                            </p>
                        </div>
                        
                        <div style="display: flex; gap: 15px; justify-content: flex-end;">
                            <button type="button" onclick="closeProductReviewModal()" 
                                    style="padding: 14px 30px; background: white; border: 2px solid #e0e0e0; border-radius: 12px; color: #666; cursor: pointer; font-weight: 600; font-size: 15px; transition: all 0.3s;"
                                    onmouseover="this.style.background='#f5f5f5'; this.style.borderColor='#ccc'"
                                    onmouseout="this.style.background='white'; this.style.borderColor='#e0e0e0'">
                                Отмена
                            </button>
                            <button type="submit" 
                                    style="padding: 14px 30px; background: linear-gradient(135deg, #eabb66, #e74c3c); color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 15px; display: flex; align-items: center; gap: 10px; transition: all 0.3s; box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);"
                                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(174, 39, 39, 0.4)'"
                                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(174, 39, 39, 0.3)'">
                                <span style="font-size: 18px;">✍️</span>
                                <span>Отправить отзыв</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.body.style.overflow = 'hidden';
        
        // Добавляем обработчик отправки
        document.getElementById('productReviewForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitProductReview();
        });
        
        // Устанавливаем рейтинг по умолчанию 5
        setTimeout(() => {
            setProductRating(5);
        }, 100);
    };
    
    window.setProductRating = function(rating) {
        const stars = document.querySelectorAll('#productRatingStars span');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.textContent = '★';
                star.style.color = '#f1c40f';
            } else {
                star.textContent = '☆';
                star.style.color = '#bdc3c7';
            }
        });
        document.getElementById('productReviewRating').value = rating;
    };
    
    window.closeProductReviewModal = function() {
        const modal = document.getElementById('productReviewModal');
        if (modal) {
            modal.remove();
            document.body.style.overflow = '';
        }
    };
    
    async function submitProductReview() {
        const productId = document.getElementById('reviewProductId')?.value;
        const productName = document.getElementById('reviewProductName')?.value;
        const rating = parseInt(document.getElementById('productReviewRating')?.value || '5');
        const text = document.getElementById('productReviewText')?.value.trim();
        
        console.log('=== ОТПРАВКА ОТЗЫВА ===');
        console.log('Product ID:', productId);
        console.log('Product Name:', productName);
        console.log('Rating:', rating);
        console.log('Text:', text);
        
        if (!productId) {
            console.error('❌ Нет ID товара');
            alert('Ошибка: не указан товар');
            return;
        }
        
        if (!text) {
            alert('Пожалуйста, напишите отзыв');
            return;
        }
        
        if (!window.authManager || !window.authManager.currentUser) {
            alert('Необходимо авторизоваться');
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
            return;
        }
        
        // ИСПРАВЛЕНИЕ: Определяем коллекцию ТОЛЬКО по URL
        const isLaminate = window.location.href.includes('laminate-product.html');
        const collection = isLaminate ? 'reviews_laminate' : 'reviews';
        
        console.log('Коллекция для отзыва:', collection);
        
        // ИСПРАВЛЕНИЕ: Упрощаем данные до минимума
        const reviewData = {
            product: productId,  // Только ID, не объект
            product_name: productName || 'Товар',
            rating: rating,
            text: text,
            author_name: window.authManager.currentUser.name || 'Пользователь',
            author_email: window.authManager.currentUser.email || '',
            approved: false
        };
        
        // Добавляем pros/cons только если они есть в DOM
        const prosField = document.getElementById('reviewPros');
        const consField = document.getElementById('reviewCons');
        
        if (prosField) {
            const pros = prosField.value.trim();
            if (pros) reviewData.pros = pros;
        }
        
        if (consField) {
            const cons = consField.value.trim();
            if (cons) reviewData.cons = cons;
        }
        
        console.log('Отправка отзыва:', reviewData);
        
        try {
            const submitBtn = document.querySelector('#productReviewForm button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = '<span>⏳</span><span>Отправка...</span>';
                submitBtn.disabled = true;
            }
            
            // ИСПРАВЛЕНИЕ: Проверяем, что pb существует
            if (!pb) {
                console.error('❌ PocketBase не инициализирован');
                throw new Error('PocketBase не инициализирован');
            }
            
            // Отправляем отзыв
            const result = await pb.collection(collection).create(reviewData);
            console.log('✅ Отзыв успешно отправлен:', result);
            
            // Закрываем модальное окно
            if (typeof closeProductReviewModal === 'function') {
                closeProductReviewModal();
            }
            
            // Показываем уведомление
            showNotification('✓ Отзыв отправлен на модерацию!', 'success');
            
            // Перезагружаем отзывы через 2 секунды
            setTimeout(() => {
                if (typeof loadProductReviews === 'function') {
                    loadProductReviews(productId);
                }
            }, 2000);
            
        } catch (error) {
            console.error('❌ Ошибка отправки отзыва:', error);
            console.error('Детали ошибки:', error.data || error.message);
            alert('❌ Ошибка отправки отзыва: ' + (error.message || 'Попробуйте позже'));
        } finally {
            const submitBtn = document.querySelector('#productReviewForm button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = '<span>✍️</span><span>Отправить отзыв</span>';
                submitBtn.disabled = false;
            }
        }
    }
    
    // ============ МОДАЛЬНОЕ ОКНО ЗАКАЗА ============
    
    function initOrderModal() {
        console.log('Инициализация модального окна заказа...');
        
        document.getElementById('orderBtn')?.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Кнопка заказа нажата');
            openOrderModal();
        });
        
        setupModalCloseHandlers();
        console.log('Модальное окно заказа инициализировано');
    }
    
    function setupModalCloseHandlers() {
        document.getElementById('closeOrderModal')?.addEventListener('click', closeOrderModal);
        document.getElementById('cancelOrder')?.addEventListener('click', closeOrderModal);
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('orderModal')?.style.display === 'flex') {
                closeOrderModal();
            }
        });
    }
    
    function openOrderModal() {
        console.log('Открытие модального окна заказа...');
        
        const modal = document.getElementById('orderModal');
        if (!modal) {
            console.error('❌ Модальное окно не найдено');
            return;
        }
        
        fillOrderModal();
        resetModalValues();
        
        setTimeout(() => {
        const addressInput = document.getElementById('addressInput');
        if (addressInput && window.authManager?.currentUser?.address) {
            addressInput.value = window.authManager.currentUser.address;
            console.log('✅ Адрес подставлен (с задержкой)');
        }
    }, 200);
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
            setupOrderModalHandlers();
            updateOrderSummary();
        }, 50);
    }
    
    function fillOrderModal() {
        if (!currentProductData) return;
        
        document.getElementById('orderProductName').textContent = currentProductData.name || 'Товар';
        
        const priceElement = document.getElementById('orderProductPrice');
        if (priceElement) {
            priceElement.textContent = formatPrice(currentProductPrice);
        }
        
        const mainImage = document.querySelector('.gallery-main__image');
        const modalImage = document.getElementById('orderProductImage');
        if (mainImage && mainImage.src && modalImage) {
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
        setupQuantityHandlers();
        setupDeliveryHandlers();
        setupServicesHandlers();
        setupSubmitHandler();
    }
    
    function setupQuantityHandlers() {
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('qty-minus') || e.target.closest('.qty-minus')) {
                e.preventDefault();
                e.stopPropagation();
                
                let input = document.getElementById('orderQuantity');
                if (input) {
                    let value = parseInt(input.value) || 1;
                    if (value > 1) {
                        input.value = value - 1;
                        updateProductPriceDisplay();
                        updateOrderSummary();
                    }
                }
            }
            
            if (e.target.classList.contains('qty-plus') || e.target.closest('.qty-plus')) {
                e.preventDefault();
                e.stopPropagation();
                
                let input = document.getElementById('orderQuantity');
                if (input) {
                    let value = parseInt(input.value) || 1;
                    if (value < 99) {
                        input.value = value + 1;
                        updateProductPriceDisplay();
                        updateOrderSummary();
                    }
                }
            }
        });
        
        const quantityInput = document.getElementById('orderQuantity');
        if (quantityInput) {
            quantityInput.addEventListener('input', function() {
                let value = parseInt(this.value) || 1;
                if (value < 1) this.value = 1;
                if (value > 99) this.value = 99;
                updateProductPriceDisplay();
                updateOrderSummary();
            });
        }
    }
    
    function updateProductPriceDisplay() {
        if (!currentProductData || currentProductPrice === 0) return;
        
        const quantityInput = document.getElementById('orderQuantity');
        const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;
        const totalProductPrice = currentProductPrice * quantity;
        
        const modalPriceElement = document.getElementById('orderProductPrice');
        if (modalPriceElement) {
            modalPriceElement.textContent = formatPrice(totalProductPrice);
        }
    }
    
    function setupDeliveryHandlers() {
        const deliveryRadios = document.querySelectorAll('input[name="delivery"]');
        deliveryRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                handleDeliveryChange();
            });
        });
        
        setTimeout(() => {
            handleDeliveryChange();
        }, 100);
    }
    
    function handleDeliveryChange() {
        const deliveryType = document.querySelector('input[name="delivery"]:checked')?.value;
        const addressContainer = document.getElementById('deliveryAddress');
        
        if (!addressContainer) return;
        
        if (deliveryType === 'delivery' || deliveryType === 'installation') {
            addressContainer.style.display = 'block';
            const addressInput = addressContainer.querySelector('#addressInput');
            if (addressInput) addressInput.required = true;
        } else {
            addressContainer.style.display = 'none';
            const addressInput = addressContainer.querySelector('#addressInput');
            if (addressInput) {
                addressInput.required = false;
                addressInput.value = 'Самовывоз';
            }
        }
        
        updateOrderSummary();
    }
    
    function setupServicesHandlers() {
        document.getElementById('serviceWarranty')?.addEventListener('change', updateOrderSummary);
        document.getElementById('serviceAssembly')?.addEventListener('change', updateOrderSummary);
    }
    
    function setupSubmitHandler() {
        document.getElementById('submitOrder')?.addEventListener('click', submitOrder);
    }
    
    function updateOrderSummary() {
        if (!currentProductData || currentProductPrice === 0) return;
        
        const quantityInput = document.getElementById('orderQuantity');
        const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;
        const productTotal = currentProductPrice * quantity;
        
        let deliveryCost = 0;
        const deliveryRadio = document.querySelector('input[name="delivery"]:checked');
        if (deliveryRadio) {
            switch(deliveryRadio.value) {
                case 'delivery': deliveryCost = 500; break;
                case 'installation': deliveryCost = 1500; break;
            }
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
    
    function closeOrderModal() {
        const modal = document.getElementById('orderModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            console.log('Модальное окно закрыто');
        }
    }
    
    async function submitOrder() {    
        // Проверка авторизации
        if (typeof window.authManager === 'undefined' || !window.authManager.isAuthenticated?.()) {
            showNotification('Для оформления заказа необходимо войти в систему', 'error');
            setTimeout(() => {
                window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
            }, 1500);
            return;
        }
        
        // Получаем данные из формы
        const quantity = parseInt(document.getElementById('orderQuantity').value) || 1;
        const deliveryRadio = document.querySelector('input[name="delivery"]:checked');
        const deliveryType = deliveryRadio ? deliveryRadio.value : 'pickup';
        const address = document.getElementById('addressInput')?.value || '';
        const saveAddress = document.getElementById('saveAddressCheckbox')?.checked || false;
        const warranty = document.getElementById('serviceWarranty')?.checked || false;
        const assembly = document.getElementById('serviceAssembly')?.checked || false;
        
        // ========== ДОБАВЬТЕ СОХРАНЕНИЕ АДРЕСА ==========
        if (saveAddress && address.trim()) {
            await saveAddressToUserProfile(address);
        }

        if (saveAddress && address.trim()) {
            try {
                const userId = window.authManager.currentUser.id;
                const pb = new PocketBase('http://127.0.0.1:8090');
                
                await pb.collection('users').update(userId, {
                    address: address.trim()
                });
                
                console.log('✅ Адрес сохранён в профиль:', address);
                
                // Обновляем локальные данные
                window.authManager.currentUser.address = address;
                if (window.pb?.authStore?.model) {
                    window.pb.authStore.model.address = address;
                }
                
                showNotification('✅ Адрес сохранён в вашем профиле', 'success');
            } catch (error) {
                console.error('❌ Ошибка сохранения адреса:', error);
            }
        }
        // ===============================================

        // ========== СОХРАНЯЕМ АДРЕС В ПРОФИЛЬ ==========
        if (saveAddress && address.trim()) {            
            try {
                const userId = window.authManager.currentUser.id;
                const pb = new PocketBase('http://127.0.0.1:8090');
                
                // Обновляем адрес пользователя
                const updatedUser = await pb.collection('users').update(userId, {
                    address: address.trim()
                });
                
                console.log('✅ Адрес успешно сохранён в профиль:', updatedUser.address);
                
                // Обновляем локальные данные
                window.authManager.currentUser.address = address;
                if (window.pb) {
                    window.pb.authStore.model.address = address;
                }
                
                showNotification('✅ Адрес сохранён в вашем профиле', 'success');
                
            } catch (error) {
                console.error('❌ Ошибка сохранения адреса:', error);
                showNotification('❌ Не удалось сохранить адрес', 'error');
            }
        }
        // ===============================================
        
         // Проверка адреса для доставки
        if ((deliveryType === 'delivery' || deliveryType === 'installation') && !address.trim()) {
            showNotification('Пожалуйста, укажите адрес доставки', 'error');
            document.getElementById('addressInput')?.focus();
            return;
        }
        
        const submitBtn = document.getElementById('submitOrder');
        if (submitBtn) {
            submitBtn.innerHTML = '<span>🔄 Добавляю...</span>';
            submitBtn.disabled = true;
        }
        
        try {
            const cartItem = {
                id: currentProductData.id,
                name: currentProductData.name || 'Товар без названия',
                price: currentProductPrice,
                quantity: quantity,
                image: document.querySelector('.gallery-main__image')?.src || '',
                code: currentProductData.number_id || currentProductData.id.slice(0, 8),
                color: getFormattedColors(currentProductData.color) || '',
                delivery_type: deliveryType,
                delivery_address: address,
                warranty_service: warranty,
                assembly_service: assembly,
                payment_method: 'наличные',
                collection: isLaminateMode ? 'laminate' : 'doors',
                product_type: isLaminateMode ? 'laminate' : 'door',
                added_at: new Date().toISOString(),
                save_address: saveAddress
            };
            
            console.log('Товар для корзины:', cartItem);
            
            const userId = window.authManager?.currentUser?.id;
            const cartKey = userId ? `user_cart_${userId}` : 'guest_cart';
            
            let cart = JSON.parse(localStorage.getItem(cartKey)) || [];
            
            const existingIndex = cart.findIndex(item => {
                return item.id === currentProductData.id && 
                    item.collection === (isLaminateMode ? 'laminate' : 'doors') && 
                    item.delivery_type === deliveryType && 
                    item.warranty_service === warranty && 
                    item.assembly_service === assembly;
            });
            
            if (existingIndex !== -1) {
                cart[existingIndex].quantity += cartItem.quantity;
                console.log('Увеличено количество существующего товара');
            } else {
                cart.push(cartItem);
                console.log('Добавлен новый товар в корзину');
            }
            
            localStorage.setItem(cartKey, JSON.stringify(cart));
            console.log('Корзина сохранена с ключом:', cartKey);
            
            closeOrderModal();
            showNotification('✅ Товар добавлен в корзину!', 'success');
            
        } catch (error) {
            console.error('❌ Ошибка добавления в корзину:', error);
            showNotification('❌ Ошибка добавления в корзину', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.innerHTML = '<span>Оформить заказ</span>';
                submitBtn.disabled = false;
            }
        }
    }

    // Функция для сохранения адреса в профиль пользователя
    async function saveAddressToUserProfile(address) {
        if (!address || !address.trim()) {
            console.log('⚠️ Адрес пуст, не сохраняем');
            return false;
        }
        
        // Проверяем авторизацию
        let pb = null;
        let userId = null;
        
        if (window.pb && window.pb.authStore?.isValid) {
            pb = window.pb;
            userId = pb.authStore.model?.id;
        } else if (window.authManager?.currentUser?.id) {
            // Создаём экземпляр pb если нужно
            if (typeof PocketBase !== 'undefined') {
                pb = new PocketBase('http://127.0.0.1:8090');
                userId = window.authManager.currentUser.id;
            }
        }
        
        if (!pb || !userId) {
            console.log('⚠️ Пользователь не авторизован');
            return false;
        }
        
        try {
            await pb.collection('users').update(userId, {
                address: address.trim()
            });
            console.log('✅ Адрес сохранён в профиль:', address);
            
            // Обновляем локальные данные
            if (window.authManager?.currentUser) {
                window.authManager.currentUser.address = address;
            }
            if (window.pb?.authStore?.model) {
                window.pb.authStore.model.address = address;
            }
            
            return true;
        } catch (error) {
            console.error('❌ Ошибка сохранения адреса:', error);
            return false;
        }
    }
    
    // ============ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ============
    
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
    
    function hideLoadingState() {
        console.log('Скрыть состояние загрузки...');
        const loadingContainer = document.querySelector('.loading-container');
        if (loadingContainer) {
            loadingContainer.remove();
        }
    }
    
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
    
    function showErrorMessage(message) {
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    }
    
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
            color: white;
            border-radius: 8px;
            z-index: 10001;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease;
            font-weight: 500;
            max-width: 400px;
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 4000);
    }
    
    // ============ СТИЛИ ============
    
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
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        .color-chips {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            margin-top: 15px;
        }
        
        .color-chip {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
        }
        
        .color-sample {
            width: 50px;
            height: 50px;
            border-radius: 8px;
            border: 2px solid #e0e0e0;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .color-name {
            font-size: 12px;
            color: #666;
        }
        
        .thumb {
            cursor: pointer;
            border: 2px solid transparent;
            border-radius: 8px;
            overflow: hidden;
            transition: all 0.3s;
            width: 80px;
            height: 80px;
            margin-bottom: 10px;
        }
        
        .thumb.active {
            border-color: #e74c3c;
            transform: scale(1.05);
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
        }
        
        .tab-pane.active {
            display: block;
        }
        
        .btn--primary {
            background: linear-gradient(135deg, #e74c3c, #c0392b);
            color: white;
            border: none;
            transition: all 0.3s;
        }
        
        .btn--primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(231, 76, 60, 0.3);
        }
    `;
    document.head.appendChild(style);
    
    console.log('Product.js загружен и готов к работе!');
})();

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