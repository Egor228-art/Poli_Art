// js/catalog.js - ПЕРЕПИСАННАЯ ВЕРСИЯ (без PocketBase)

const ITEMS_PER_PAGE = 6;
let currentPage = 1;
let allDoors = [];
let allLaminate = [];
let currentProducts = [];
let isLaminateMode = false;
let displayedProducts = [];

// Элементы DOM
const productsGrid = document.getElementById('products-grid');
const pagination = document.getElementById('pagination');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const applyFiltersBtn = document.getElementById('apply-filters');
const resetFiltersBtn = document.getElementById('reset-filters');
const mobileFiltersBtn = document.getElementById('mobile-filters-btn');
const filtersPanel = document.getElementById('filters-panel');
const toggleBtn = document.getElementById('toggleBtn');
const priceMinInput = document.getElementById('price-min');
const priceMaxInput = document.getElementById('price-max');

// Фильтры
let selectedFilters = {
    search: '',
    priceMin: null,
    priceMax: null,
    doorTypes: [],
    doorMaterials: [],
    doorColors: [],
    doorStyles: [],
    laminateTypes: [],
    laminateThickness: [],
    laminateColors: [],
    laminateRooms: []
};

let urlParamsApplied = false;

// Инициализация
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Инициализация каталога...');
    
    try {
        showLoading();
        await loadInitialData();
        setupEventListeners();
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        showErrorMessage('Ошибка загрузки каталога');
    }
});

// Загрузка уникальных цветов для фильтрации
async function loadColorOptions() {
    try {
        // Получаем цвета из дверей
        const doorsResult = await window.apiClient.getDoors();
        const doorsColors = new Set();
        doorsResult.items?.forEach(product => {
            if (product.color) {
                if (Array.isArray(product.color)) {
                    product.color.forEach(c => {
                        if (c && typeof c === 'string') doorsColors.add(c.trim());
                    });
                } else if (typeof product.color === 'string') {
                    // Если строка в формате JSON массива
                    try {
                        const parsed = JSON.parse(product.color);
                        if (Array.isArray(parsed)) {
                            parsed.forEach(c => doorsColors.add(c.trim()));
                        } else {
                            doorsColors.add(product.color.trim());
                        }
                    } catch (e) {
                        doorsColors.add(product.color.trim());
                    }
                }
            }
        });
        
        // Получаем цвета из ламината
        const laminateResult = await window.apiClient.getLaminate();
        const laminateColors = new Set();
        laminateResult.items?.forEach(product => {
            if (product.color) {
                if (Array.isArray(product.color)) {
                    product.color.forEach(c => {
                        if (c && typeof c === 'string') laminateColors.add(c.trim());
                    });
                } else if (typeof product.color === 'string') {
                    try {
                        const parsed = JSON.parse(product.color);
                        if (Array.isArray(parsed)) {
                            parsed.forEach(c => laminateColors.add(c.trim()));
                        } else {
                            laminateColors.add(product.color.trim());
                        }
                    } catch (e) {
                        laminateColors.add(product.color.trim());
                    }
                }
            }
        });
        
        console.log('Загружены цвета дверей:', Array.from(doorsColors));
        console.log('Загружены цвета ламината:', Array.from(laminateColors));
        
        return {
            doors: Array.from(doorsColors),
            laminate: Array.from(laminateColors)
        };
    } catch (error) {
        console.error('Ошибка загрузки цветов:', error);
        return { doors: [], laminate: [] };
    }
}

// Обновление UI фильтров цветов
async function updateColorFilters() {
    const colors = await loadColorOptions();
    const currentColors = isLaminateMode ? colors.laminate : colors.doors;
    
    const colorContainer = document.querySelector('.filter-section:has(.color-options) .color-options');
    if (!colorContainer) return;
    
    if (!currentColors || currentColors.length === 0) {
        colorContainer.innerHTML = '<div class="no-colors">Нет доступных цветов</div>';
        return;
    }
    
    // Маппинг цветов для отображения (цвет фона)
    const colorBackgroundMap = {
        'белый': '#FFFFFF', 'белая': '#FFFFFF', 'white': '#FFFFFF',
        'черный': '#000000', 'черная': '#000000', 'чёрный': '#000000', 'чёрная': '#000000', 'black': '#000000',
        'серый': '#808080', 'серая': '#808080', 'gray': '#808080', 'grey': '#808080',
        'коричневый': '#8B4513', 'коричневая': '#8B4513', 'brown': '#8B4513',
        'бежевый': '#F5DEB3', 'бежевая': '#F5DEB3', 'beige': '#F5DEB3',
        'дуб': '#C19A6B', 'темный дуб': '#654321', 'светлый дуб': '#D2B48C',
        'орех': '#773F1A', 'ясень': '#E8D0A9', 'бук': '#DEB887',
        'венге': '#3C2F23', 'золотистый': '#FFD700', 'красный': '#FF0000',
        'синий': '#0000FF', 'зеленый': '#008000', 'розовый': '#FFC0CB'
    };
    
    // Генерируем HTML для цветов
    let colorsHtml = '';
    currentColors.forEach(color => {
        const colorName = typeof color === 'string' ? color : (color.name || String(color));
        const normalizedName = colorName.toLowerCase().trim();
        
        // Определяем цвет фона
        let bgColor = colorBackgroundMap[normalizedName];
        if (!bgColor) {
            // Пробуем найти частичное совпадение
            for (const [key, value] of Object.entries(colorBackgroundMap)) {
                if (normalizedName.includes(key) || key.includes(normalizedName)) {
                    bgColor = value;
                    break;
                }
            }
        }
        if (!bgColor) {
            // Генерируем цвет из названия
            let hash = 0;
            for (let i = 0; i < colorName.length; i++) {
                hash = colorName.charCodeAt(i) + ((hash << 5) - hash);
            }
            bgColor = `hsl(${(hash % 30) + 20}, ${(hash % 30) + 40}%, ${(hash % 40) + 40}%)`;
        }
        
        colorsHtml += `
            <div class="color-option" style="background-color: ${bgColor}; border: ${bgColor === '#FFFFFF' ? '1px solid #ccc' : 'none'};" data-color="${escapeHtml(colorName)}" title="${escapeHtml(colorName)}">
                <span class="color-name-tooltip">${escapeHtml(colorName)}</span>
                <div class="color-checkmark" style="display: none;">✓</div>
            </div>
        `;
    });
    
    colorContainer.innerHTML = colorsHtml;
    
    // Переинициализируем обработчики
    document.querySelectorAll('.color-option').forEach(option => {
        // Удаляем старый обработчик и создаем новый
        const newOption = option.cloneNode(true);
        option.parentNode.replaceChild(newOption, option);
        
        newOption.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Переключаем класс selected
            this.classList.toggle('selected');
            
            // Добавляем/убираем галочку
            let checkmark = this.querySelector('.color-checkmark');
            if (this.classList.contains('selected')) {
                if (!checkmark) {
                    checkmark = document.createElement('div');
                    checkmark.className = 'color-checkmark';
                    checkmark.innerHTML = '✓';
                    this.appendChild(checkmark);
                }
                checkmark.style.display = 'flex';
            } else {
                if (checkmark) checkmark.style.display = 'none';
            }
            
            // Обновляем фильтры и применяем
            updateFiltersFromUI();
            applyFilters();
        });
    });
}

function getColorHex(colorName) {
    const colorMap = {
        'белый': '#FFFFFF', 'черный': '#000000', 'чёрный': '#000000',
        'серый': '#808080', 'коричневый': '#8B4513', 'дуб': '#C19A6B',
        'орех': '#773F1A', 'ясень': '#F5EBDC', 'бук': '#F5E1C8',
        'венге': '#645452', 'бежевый': '#F5F5DC', 'золотой': '#FFD700',
        'темный дуб': '#654321', 'красный': '#FF0000', 'синий': '#0000FF',
        'зеленый': '#008000'
    };
    
    const lowerName = colorName.toString().toLowerCase().trim();
    if (colorMap[lowerName]) return colorMap[lowerName];
    
    // Генерация цвета из названия
    let hash = 0;
    for (let i = 0; i < colorName.length; i++) {
        hash = colorName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${(hash % 30) + 20}, ${(hash % 30) + 40}%, ${(hash % 40) + 40}%)`;
}

// Загрузка начальных данных через API
async function loadInitialData() {
    console.log('Начало загрузки данных...');
    
    await parseUrlParams();
    
    if (isLaminateMode) {
        console.log('Загрузка ламината...');
        await loadLaminate();
        currentProducts = allLaminate;
    } else {
        console.log('Загрузка дверей...');
        await loadDoors();
        currentProducts = allDoors;
    }
    
    console.log(`✅ Данные загружено. Товаров: ${currentProducts.length}`);
    
    updateToggleButtonState();
    updateFilterUI();
    await updateColorFilters();
    
    currentPage = 1;
    renderAllProducts();
}

// Парсинг параметров URL
async function parseUrlParams(force = false) {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    
    console.log('Парсинг параметров URL:', { type, currentMode: isLaminateMode ? 'ламинат' : 'двери' });
    
    if (force || !urlParamsApplied) {
        if (type === 'laminate') {
            console.log('Установлен режим: Ламинат');
            isLaminateMode = true;
            urlParamsApplied = true;
        } else if (type === 'interior') {
            console.log('Установлен фильтр: Межкомнатные двери');
            isLaminateMode = false;
            selectedFilters.doorTypes = ['Межкомнатная'];
            urlParamsApplied = true;
        } else if (type === 'entrance') {
            console.log('Установлен фильтр: Входные двери');
            isLaminateMode = false;
            selectedFilters.doorTypes = ['Входная'];
            urlParamsApplied = true;
        } else if (!type && !urlParamsApplied) {
            console.log('Параметры URL не заданы, режим по умолчанию: Двери');
            isLaminateMode = false;
        }
    }
}

// Загрузка дверей через API
async function loadDoors() {
    try {
        console.log('Загрузка дверей через API...');
        
        if (!window.apiClient) {
            console.error('API клиент не инициализирован');
            throw new Error('API клиент не найден');
        }
        
        const result = await window.apiClient.getDoors();
        allDoors = result.items || [];
        console.log('✅ Двери загружены:', allDoors.length);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки дверей:', error);
        allDoors = [];
        throw error;
    }
}

// Загрузка ламината через API
async function loadLaminate() {
    try {
        console.log('Загрузка ламината через API...');
        
        if (!window.apiClient) {
            console.error('API клиент не инициализирован');
            throw new Error('API клиент не найден');
        }
        
        const result = await window.apiClient.getLaminate();
        allLaminate = result.items || [];
        console.log('✅ Ламинат загружен:', allLaminate.length);
        
        if (allLaminate.length > 0) {
            console.log('Пример данных ламината:', {
                id: allLaminate[0].id,
                name: allLaminate[0].name,
                color: allLaminate[0].color,
                hasPicture: !!(allLaminate[0].pictures && allLaminate[0].pictures[0])
            });
        }
        
    } catch (error) {
        console.error('❌ Ошибка загрузки ламината:', error);
        allLaminate = [];
        throw error;
    }
}

// Переключение режима
async function toggleMode() {
    try {
        showLoading();
        
        isLaminateMode = !isLaminateMode;
        
        console.log(`Переключено на: ${isLaminateMode ? 'Ламинат' : 'Двери'}`);
        
        if (isLaminateMode && allLaminate.length === 0) {
            await loadLaminate();
            currentProducts = allLaminate;
        } else if (!isLaminateMode && allDoors.length === 0) {
            await loadDoors();
            currentProducts = allDoors;
        } else {
            currentProducts = isLaminateMode ? allLaminate : allDoors;
        }
        
        updateToggleButtonState();
        updateFilterUI();
        resetAllFilters();
        
        console.log(`Товаров доступно: ${currentProducts.length}`);
        
        currentPage = 1;
        applyFilters();
        
    } catch (error) {
        console.error('❌ Ошибка переключения режима:', error);
        showErrorMessage('Ошибка при переключении режима');
    }
}

// Обновление состояния кнопки
function updateToggleButtonState() {
    if (toggleBtn) {
        if (isLaminateMode) {
            toggleBtn.classList.add('active');
        } else {
            toggleBtn.classList.remove('active');
        }
    }
}

// Обновление UI фильтров
function updateFilterUI() {
    const filterPanel = document.getElementById('filters-panel');
    if (!filterPanel) return;
    
    if (isLaminateMode) {
        filterPanel.innerHTML = `
            <div class="filter-section">
                <h3 class="filter-title">Класс ламината</h3>
                <div class="filter-options">
                    <label class="filter-option"><input type="checkbox" name="laminate-type" value="31"> 31 класс</label>
                    <label class="filter-option"><input type="checkbox" name="laminate-type" value="32"> 32 класс</label>
                    <label class="filter-option"><input type="checkbox" name="laminate-type" value="33"> 33 класс</label>
                    <label class="filter-option"><input type="checkbox" name="laminate-type" value="34"> 34 класс</label>
                </div>
            </div>
            <div class="filter-section">
                <h3 class="filter-title">Цена</h3>
                <div class="price-filter">
                    <input type="number" id="price-min" placeholder="От" min="0" step="100">
                    <span>-</span>
                    <input type="number" id="price-max" placeholder="До" min="0" step="100">
                </div>
            </div>
            <div class="filter-section">
                <h3 class="filter-title">Толщина</h3>
                <div class="filter-options">
                    <label class="filter-option"><input type="checkbox" name="laminate-thickness" value="7"> 7 мм</label>
                    <label class="filter-option"><input type="checkbox"name="laminate-thickness" value="8"> 8 мм</label>
                    <label class="filter-option"><input type="checkbox" name="laminate-thickness" value="10"> 10 мм</label>
                    <label class="filter-option"><input type="checkbox" name="laminate-thickness" value="12"> 12 мм</label>
                </div>
            </div>
            <div class="filter-section">
                <h3 class="filter-title">Цвет</h3>
                <div class="color-options">
                    <div class="color-option" style="background-color: #8B4513;" data-color="brown" title="Коричневый"></div>
                    <div class="color-option" style="background-color: #F5DEB3;" data-color="beige" title="Бежевый"></div>
                    <div class="color-option" style="background-color: #808080;" data-color="gray" title="Серый"></div>
                    <div class="color-option" style="background-color: #FFFFFF; border: 1px solid #ccc;" data-color="white" title="Белый"></div>
                    <div class="color-option" style="background-color: #000000;" data-color="black" title="Чёрный"></div>
                    <div class="color-option" style="background-color: #654321;" data-color="dark-brown" title="Темный дуб"></div>
                </div>
            </div>
            <div class="filter-section">
                <h3 class="filter-title">Помещение</h3>
                <div class="filter-options">
                    <label class="filter-option"><input type="checkbox" name="laminate-room" value="гостиная"> Гостиная</label>
                    <label class="filter-option"><input type="checkbox" name="laminate-room" value="спальня"> Спальня</label>
                    <label class="filter-option"><input type="checkbox" name="laminate-room" value="кухня"> Кухня</label>
                    <label class="filter-option"><input type="checkbox" name="laminate-room" value="коридор"> Коридор</label>
                    <label class="filter-option"><input type="checkbox" name="laminate-room" value="офис"> Офис</label>
                </div>
            </div>
            <div class="filter-actions">
                <button class="btn btn-primary" id="apply-filters">Применить</button>
                <button class="btn btn-secondary" id="reset-filters">Сбросить</button>
            </div>
        `;
    } else {
        filterPanel.innerHTML = `
            <div class="filter-section">
                <h3 class="filter-title">Тип двери</h3>
                <div class="filter-options">
                    <label class="filter-option"><input type="checkbox" name="door-type" value="Межкомнатная"> Межкомнатная</label>
                    <label class="filter-option"><input type="checkbox" name="door-type" value="Входная"> Входная</label>
                </div>
            </div>
            <div class="filter-section">
                <h3 class="filter-title">Цена</h3>
                <div class="price-filter">
                    <input type="number" id="price-min" placeholder="От" min="0" step="100">
                    <span>-</span>
                    <input type="number" id="price-max" placeholder="До" min="0" step="100">
                </div>
            </div>
            <div class="filter-section">
                <h3 class="filter-title">Материал</h3>
                <div class="filter-options">
                    <label class="filter-option"><input type="checkbox" name="door-material" value="Массив"> Массив</label>
                    <label class="filter-option"><input type="checkbox" name="door-material" value="МДФ"> МДФ</label>
                    <label class="filter-option"><input type="checkbox" name="door-material" value="Шпон"> Шпон</label>
                    <label class="filter-option"><input type="checkbox" name="door-material" value="Экошпон"> Экошпон</label>
                    <label class="filter-option"><input type="checkbox" name="door-material" value="ПВХ"> ПВХ</label>
                </div>
            </div>
            <div class="filter-section">
                <h3 class="filter-title">Цвет</h3>
                <div class="color-options">
                    <div class="color-option" style="background-color: #8B4513;" data-color="brown" title="Коричневый"></div>
                    <div class="color-option" style="background-color: #F5DEB3;" data-color="beige" title="Бежевый"></div>
                    <div class="color-option" style="background-color: #808080;" data-color="gray" title="Серый"></div>
                    <div class="color-option" style="background-color: #FFFFFF; border: 1px solid #ccc;" data-color="white" title="Белый"></div>
                    <div class="color-option" style="background-color: #000000;" data-color="black" title="Чёрный"></div>
                </div>
            </div>
            <div class="filter-section">
                <h3 class="filter-title">Стиль</h3>
                <div class="filter-options">
                    <label class="filter-option"><input type="checkbox" name="door-style" value="Классика"> Классика</label>
                    <label class="filter-option"><input type="checkbox" name="door-style" value="Модерн"> Модерн</label>
                    <label class="filter-option"><input type="checkbox" name="door-style" value="Лофт"> Лофт</label>
                    <label class="filter-option"><input type="checkbox" name="door-style" value="Минимализм"> Минимализм</label>
                </div>
            </div>
            <div class="filter-actions">
                <button class="btn btn-primary" id="apply-filters">Применить</button>
                <button class="btn btn-secondary" id="reset-filters">Сбросить</button>
            </div>
        `;
    }
    
    setTimeout(() => {
        if (urlParamsApplied && !isLaminateMode) {
            console.log('Установка UI фильтров для дверей из URL:', selectedFilters.doorTypes);
            selectedFilters.doorTypes.forEach(doorType => {
                document.querySelectorAll(`input[name="door-type"][value="${doorType}"]`).forEach(cb => {
                    cb.checked = true;
                });
            });
        }
    }, 100);
    
    reinitializeFilterListeners();
}

// Переинициализация обработчиков фильтров
function reinitializeFilterListeners() {
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', function() {
            this.classList.toggle('selected');
            if (this.classList.contains('selected')) {
                if (!this.querySelector('.color-checkmark')) {
                    const checkmark = document.createElement('div');
                    checkmark.className = 'color-checkmark';
                    checkmark.innerHTML = '✓';
                    this.appendChild(checkmark);
                }
            } else {
                const checkmark = this.querySelector('.color-checkmark');
                if (checkmark) checkmark.remove();
            }
        });
    });
    
    const applyBtn = document.getElementById('apply-filters');
    const resetBtn = document.getElementById('reset-filters');
    
    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            currentPage = 1;
            updateFiltersFromUI();
            applyFilters();
        });
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            currentPage = 1;
            resetAllFilters();
            applyFilters();
        });
    }
}

// Отображение всех продуктов
function renderAllProducts() {
    currentPage = 1;
    
    const params = new URLSearchParams(window.location.search);
    const search = params.get('search');
    if (search && searchInput) {
        searchInput.value = search;
        selectedFilters.search = search;
    } else if (searchInput) {
        selectedFilters.search = '';
    }
    
    applyFilters();
}

// Обновление фильтров из UI
function updateFiltersFromUI() {
    selectedFilters.priceMin = null;
    selectedFilters.priceMax = null;
    
    if (isLaminateMode) {
        selectedFilters.laminateTypes = [];
        selectedFilters.laminateThickness = [];
        selectedFilters.laminateColors = [];
        selectedFilters.laminateRooms = [];
        
        document.querySelectorAll('input[name="laminate-type"]:checked').forEach(cb => {
            selectedFilters.laminateTypes.push(cb.value);
        });
        
        document.querySelectorAll('input[name="laminate-thickness"]:checked').forEach(cb => {
            selectedFilters.laminateThickness.push(cb.value);
        });
        
        document.querySelectorAll('.color-option.selected').forEach(option => {
            const colorName = option.dataset.color;
            if (colorName && !selectedFilters.doorColors.includes(colorName)) {
                selectedFilters.doorColors.push(colorName);
            }
        });

        document.querySelectorAll('.color-option.selected').forEach(option => {
            const colorName = option.dataset.color;
            if (colorName && !selectedFilters.laminateColors.includes(colorName)) {
                selectedFilters.laminateColors.push(colorName);
            }
        });
        
        document.querySelectorAll('input[name="laminate-room"]:checked').forEach(cb => {
            selectedFilters.laminateRooms.push(cb.value);
        });
        
    } else {
        selectedFilters.doorTypes = [];
        selectedFilters.doorMaterials = [];
        selectedFilters.doorColors = [];
        selectedFilters.doorStyles = [];
        
        document.querySelectorAll('input[name="door-type"]:checked').forEach(cb => {
            selectedFilters.doorTypes.push(cb.value);
        });
        
        document.querySelectorAll('input[name="door-material"]:checked').forEach(cb => {
            selectedFilters.doorMaterials.push(cb.value);
        });
        
        document.querySelectorAll('input[name="door-style"]:checked').forEach(cb => {
            selectedFilters.doorStyles.push(cb.value);
        });
    }
    
    const priceMin = document.getElementById('price-min');
    const priceMax = document.getElementById('price-max');
    
    if (priceMin && priceMin.value) {
        selectedFilters.priceMin = parseInt(priceMin.value);
    }
    if (priceMax && priceMax.value) {
        selectedFilters.priceMax = parseInt(priceMax.value);
    }
}

// Применение фильтров (локальная фильтрация)
function applyFilters() {
    try {
        showLoading();
        
        if (!currentProducts || currentProducts.length === 0) {
            renderProducts([]);
            return;
        }
        
        const filteredProducts = currentProducts.filter(product => {
            if (selectedFilters.search) {
                const searchLower = selectedFilters.search.toLowerCase();
                const nameMatch = product.name?.toLowerCase().includes(searchLower) || false;
                const descMatch = product.description?.toLowerCase().includes(searchLower) || false;
                if (!nameMatch && !descMatch) return false;
            }
            
            const productPrice = parsePrice(product.price || product.prise || '0');
            
            if (selectedFilters.priceMin !== null && productPrice < selectedFilters.priceMin) return false;
            if (selectedFilters.priceMax !== null && productPrice > selectedFilters.priceMax) return false;
            
            if (isLaminateMode) {
                if (selectedFilters.laminateTypes.length > 0 && product.type) {
                    const productType = product.type.toLowerCase();
                    const hasType = selectedFilters.laminateTypes.some(type => 
                        productType.includes(type.toLowerCase())
                    );
                    if (!hasType) return false;
                }
                
                if (selectedFilters.laminateThickness.length > 0) {
                    if (!product.thickness) return false;
                    const productThickness = product.thickness.toString();
                    const hasThickness = selectedFilters.laminateThickness.some(thickness => 
                        productThickness === thickness || productThickness.includes(thickness) || thickness.includes(productThickness)
                    );
                    if (!hasThickness) return false;
                }
                
                if (selectedFilters.laminateColors.length > 0 && product.color) {
                    let productColors = [];
                    
                    if (Array.isArray(product.color)) {
                        productColors = product.color.map(c => c.toString().toLowerCase().trim());
                    } else if (typeof product.color === 'string') {
                        try {
                            const parsed = JSON.parse(product.color);
                            if (Array.isArray(parsed)) {
                                productColors = parsed.map(c => c.toString().toLowerCase().trim());
                            } else {
                                productColors = [product.color.toLowerCase().trim()];
                            }
                        } catch (e) {
                            productColors = [product.color.toLowerCase().trim()];
                        }
                    }
                    
                    const hasColor = selectedFilters.laminateColors.some(filterColor => {
                        const filterLower = filterColor.toLowerCase().trim();
                        return productColors.some(productColor => 
                            productColor === filterLower || 
                            productColor.includes(filterLower) || 
                            filterLower.includes(productColor)
                        );
                    });
                    
                    if (!hasColor) return false;
                }
                
                if (selectedFilters.laminateRooms.length > 0) {
                    if (!product.type_room || !Array.isArray(product.type_room)) return false;
                    const productRooms = product.type_room;
                    const hasRoom = selectedFilters.laminateRooms.some(room =>
                        productRooms.some(productRoom =>
                            productRoom && typeof productRoom === 'string' &&
                            productRoom.toLowerCase().includes(room.toLowerCase())
                        )
                    );
                    if (!hasRoom) return false;
                }
                
            } else {
                if (selectedFilters.doorTypes.length > 0 && product.type) {
                    const productType = product.type.toLowerCase();
                    const hasType = selectedFilters.doorTypes.some(type => 
                        productType.includes(type.toLowerCase())
                    );
                    if (!hasType) return false;
                }
                
                if (selectedFilters.doorMaterials.length > 0 && product.material) {
                    const productMaterial = product.material.toLowerCase();
                    const hasMaterial = selectedFilters.doorMaterials.some(material => 
                        productMaterial.includes(material.toLowerCase())
                    );
                    if (!hasMaterial) return false;
                }
                
                if (selectedFilters.doorColors.length > 0 && product.color) {
                    let productColors = [];
                    
                    // Парсим цвета товара (могут быть в разных форматах)
                    if (Array.isArray(product.color)) {
                        productColors = product.color.map(c => c.toString().toLowerCase().trim());
                    } else if (typeof product.color === 'string') {
                        try {
                            const parsed = JSON.parse(product.color);
                            if (Array.isArray(parsed)) {
                                productColors = parsed.map(c => c.toString().toLowerCase().trim());
                            } else {
                                productColors = [product.color.toLowerCase().trim()];
                            }
                        } catch (e) {
                            productColors = [product.color.toLowerCase().trim()];
                        }
                    }
                    
                    // Проверяем, есть ли хоть один выбранный цвет в массиве цветов товара
                    const hasColor = selectedFilters.doorColors.some(filterColor => {
                        const filterLower = filterColor.toLowerCase().trim();
                        return productColors.some(productColor => 
                            productColor === filterLower || 
                            productColor.includes(filterLower) || 
                            filterLower.includes(productColor)
                        );
                    });
                    
                    if (!hasColor) return false;
                }
                
                if (selectedFilters.doorStyles.length > 0 && product.style) {
                    const productStyle = product.style?.toLowerCase() || '';
                    const hasStyle = selectedFilters.doorStyles.some(style => 
                        productStyle.includes(style.toLowerCase())
                    );
                    if (!hasStyle) return false;
                }
            }
            
            return true;
        });
        
        console.log('Отфильтровано товаров:', filteredProducts.length);
        
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        displayedProducts = filteredProducts.slice(0, endIndex);
        
        renderProducts(displayedProducts);
        renderLoadMoreButton(filteredProducts.length);
        
    } catch (filterError) {
        console.error('Ошибка фильтрации:', filterError);
        renderProducts(currentProducts.slice(0, currentPage * ITEMS_PER_PAGE));
        renderLoadMoreButton(currentProducts.length);
    } finally {
        hideLoading();
    }
}

// Сброс всех фильтров
function resetAllFilters() {
    selectedFilters = {
        search: '',
        priceMin: null, priceMax: null,
        doorTypes: [], doorMaterials: [], doorColors: [], doorStyles: [],
        laminateTypes: [], laminateThickness: [], laminateColors: [], laminateRooms: []
    };
    
    if (searchInput) searchInput.value = '';
    
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    
    document.querySelectorAll('.color-option').forEach(co => {
        co.classList.remove('selected');
        const checkmark = co.querySelector('.color-checkmark');
        if (checkmark) checkmark.remove();
    });
    
    const priceMin = document.getElementById('price-min');
    const priceMax = document.getElementById('price-max');
    if (priceMin) priceMin.value = '';
    if (priceMax) priceMax.value = '';
}

// Поиск
function performSearch() {
    selectedFilters.search = searchInput ? searchInput.value.trim() : '';
    currentPage = 1;
    applyFilters();
}

// Создание карточки товара
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-product-id', product.id);
    
    const collectionName = isLaminateMode ? 'laminate' : 'doors';
    
    let imageUrl = '';
    if (product.pictures && product.pictures.length > 0 && product.pictures[0]) {
        imageUrl = product.pictures[0];
    } else if (product.picture && product.picture.length > 0 && product.picture[0]) {
        imageUrl = product.picture[0];
    } else {
        imageUrl = '/image/no-image.jpg';
    }
    
    let formattedPrice = 'Цена по запросу';
    const priceValue = product.price || product.prise;
    if (priceValue) {
        const priceNum = parsePrice(priceValue);
        if (priceNum > 0) {
            formattedPrice = priceNum.toLocaleString('ru-RU') + ' ₽';
        }
    }
    
    const characteristics = [];
    if (isLaminateMode) {
        if (product.type) characteristics.push(product.type);
        if (product.thickness) characteristics.push(product.thickness + ' мм');
        if (product.wear_class) characteristics.push(product.wear_class + ' класс');
    } else {
        if (product.type) characteristics.push(product.type);
        if (product.material) characteristics.push(product.material);
    }
    
    let productLink;
    if (isLaminateMode) {
        productLink = `laminate-product.html?id=${product.id}`;
    } else {
        productLink = `product.html?id=${product.id}`;
    }
    
    const constructorButton = isLaminateMode ? 
        `<button class="btn-constructor" onclick="window.addToConstructor('${product.id}', '${escapeHtml(product.name || '')}')">В конструктор</button>` : '';
    
    card.innerHTML = `
        <div class="product-image-container ${isLaminateMode ? 'laminate-image-container' : 'door-image-container'}">
            <img src="${imageUrl}" alt="${escapeHtml(product.name || 'Без названия')}" 
                 class="product-image ${isLaminateMode ? 'laminate-image' : 'door-image'}"
                 onclick="window.location.href='${productLink}'"
                 onerror="this.src='/image/no-image.jpg'">
        </div>
        <div class="product-info">
            <h3 class="product-title">${escapeHtml(product.name || 'Без названия')}</h3>
            <div class="product-meta" style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;">
                ${characteristics.map(char => `<span class="product-badge">${char}</span>`).join('')}
            </div>
            <p class="product-description">${escapeHtml(product.description ? (product.description.length > 80 ? product.description.substring(0, 80) + '...' : product.description) : 'Описание отсутствует')}</p>
            <div class="product-price ${isLaminateMode ? 'laminate-price' : 'door-price'}">${formattedPrice}</div>
            <div class="product-actions">
                <a href="${productLink}" class="btn-details">Подробнее</a>
                ${constructorButton}
            </div>
        </div>
    `;
    
    return card;
}

// Кнопка "Загрузить еще"
function renderLoadMoreButton(totalFiltered) {
    pagination.innerHTML = '';
    
    if (displayedProducts.length >= totalFiltered) {
        if (totalFiltered > 0) {
            pagination.innerHTML = `<div class="all-loaded">Показано ${totalFiltered} из ${totalFiltered} товаров</div>`;
        }
        return;
    }
    
    const loadMoreBtn = document.createElement('button');
    loadMoreBtn.className = 'load-more-btn';
    loadMoreBtn.innerHTML = `<span>Загрузить еще</span><span class="load-more-count">(${Math.min(ITEMS_PER_PAGE, totalFiltered - displayedProducts.length)})</span>`;
    loadMoreBtn.addEventListener('click', () => {
        currentPage++;
        applyFilters();
    });
    
    pagination.appendChild(loadMoreBtn);
    
    const counter = document.createElement('div');
    counter.className = 'items-counter';
    counter.textContent = `Показано ${displayedProducts.length} из ${totalFiltered} товаров`;
    pagination.appendChild(counter);
}

// Настройка обработчиков
function setupEventListeners() {
    if (searchInput) {
        searchInput.addEventListener('input', () => performSearch());
        searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') performSearch(); });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', () => performSearch());
    }
    
    if (mobileFiltersBtn && filtersPanel) {
        mobileFiltersBtn.addEventListener('click', () => filtersPanel.classList.toggle('active'));
    }
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleMode);
    }
}

// Вспомогательные функции
function parsePrice(priceStr) {
    if (!priceStr) return 0;
    const match = priceStr.toString().match(/(\d[\d\s]*[\d.,]?\d*)/);
    if (match) {
        const numberStr = match[1].replace(/\s/g, '').replace(',', '.');
        const price = parseFloat(numberStr);
        return isNaN(price) ? 0 : Math.round(price);
    }
    return 0;
}

function showLoading() {
    if (productsGrid) {
        productsGrid.innerHTML = `<div class="loading"><div class="spinner"></div><p>Загрузка товаров...</p></div>`;
    }
}

function hideLoading() {
    // Очищается при рендере
}

function showErrorMessage(message) {
    if (productsGrid) {
        productsGrid.innerHTML = `<div class="error-message"><h3>⚠️ Ошибка</h3><p>${message || 'Произошла ошибка при загрузке данных'}</p><button onclick="location.reload()" class="btn btn-primary">Обновить страницу</button></div>`;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Рендеринг продуктов
function renderProducts(products) {
    if (!products || products.length === 0) {
        productsGrid.innerHTML = `<div class="no-results"><h3>😕 Товары не найдены</h3><p>${selectedFilters.search ? 'Попробуйте другой поисковый запрос' : 'Попробуйте изменить параметры фильтрации'}</p></div>`;
        return;
    }
    
    productsGrid.innerHTML = '';
    products.forEach(product => {
        productsGrid.appendChild(createProductCard(product));
    });
    
    addConstructorButtonListeners();
}

function addConstructorButtonListeners() {
    document.querySelectorAll('.btn-constructor').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const productId = this.closest('.product-card')?.dataset.productId;
            const productName = this.closest('.product-card')?.querySelector('.product-title')?.textContent;
            if (productId && isLaminateMode) {
                window.addToConstructor(productId, productName);
            }
        });
    });
}

// Глобальные функции
window.addToConstructor = function(productId, productName) {
    if (isLaminateMode) {
        window.location.href = `laminate-constructor.html?product_id=${productId}&product_name=${encodeURIComponent(productName || '')}`;
    } else {
        alert('Конструктор доступен только для ламината');
    }
};

window.resetAllFilters = resetAllFilters;
window.applyFilters = applyFilters;
window.toggleMode = toggleMode;