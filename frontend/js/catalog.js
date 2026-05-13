// PocketBase URL
const PB_URL = 'http://127.0.0.1:8090';

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
    // Общие фильтры
    priceMin: null,
    priceMax: null,
    // Фильтры для дверей
    doorTypes: [],
    doorMaterials: [],
    doorColors: [],
    doorStyles: [],
    // Фильтры для ламината
    laminateTypes: [],
    laminateThickness: [],
    laminateColors: [],
    laminateRooms: []
};

// Флаги
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

// Загрузка начальных данных
async function loadInitialData() {
    console.log('Начало загрузки данных...');
    
    // ПАРСИМ ПАРАМЕТРЫ URL ПЕРВЫМ ДЕЛОМ
    await parseUrlParams();
    
    // ЗАГРУЖАЕМ ДАННЫЕ В ЗАВИСИМОСТИ ОТ РЕЖИМА
    if (isLaminateMode) {
        // Режим ламината - загружаем ламинат
        console.log('Загрузка данных для ламината...');
        await loadLaminate();
        currentProducts = allLaminate;
    } else {
        // Режим дверей - загружаем двери
        console.log('Загрузка данных для дверей...');
        await loadDoors();
        currentProducts = allDoors;
    }
    
    console.log(`✅ Данные загружены. Товаров: ${currentProducts.length}`);
    
    // Обновляем UI
    updateToggleButtonState();
    updateFilterUI();
    
    // Рендерим товары
    currentPage = 1;
    renderAllProducts();
}

// Парсинг параметров URL
async function parseUrlParams(force = false) {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    
    console.log('Парсинг параметров URL:', { type, currentMode: isLaminateMode ? 'ламинат' : 'двери' });
    
    // ИСПРАВЛЕНИЕ: Не сбрасываем режим, если он уже установлен переключателем
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

// Загрузка дверей
async function loadDoors() {
    try {
        console.log('Загрузка дверей...');
        
        const response = await fetch(`${PB_URL}/api/collections/doors/records?perPage=200`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        allDoors = result.items || [];
        console.log('✅ Двери загружены:', allDoors.length, 'записей');
        
    } catch (error) {
        console.error('❌ Ошибка загрузки дверей:', error);
        allDoors = [];
        throw error;
    }
}

// Загрузка ламината
async function loadLaminate() {
    try {
        console.log('Загрузка ламината...');
        
        const response = await fetch(`${PB_URL}/api/collections/laminate/records?perPage=200`);
        
        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            throw new Error(`Нет доступа к коллекции ламината (код: ${response.status})`);
        }
        
        const result = await response.json();
        allLaminate = result.items || [];
        console.log('✅ Ламинат загружен:', allLaminate.length, 'записей');
        
        // Логируем данные первого продукта для отладки
        if (allLaminate.length > 0) {
            console.log('Пример данных ламината:', {
                id: allLaminate[0].id,
                name: allLaminate[0].name,
                color: allLaminate[0].color,
                picture: allLaminate[0].picture,
                hasPicture: !!allLaminate[0].picture
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
        
        // Переключаем режим
        isLaminateMode = !isLaminateMode;
        
        console.log(`Переключено на: ${isLaminateMode ? 'Ламинат' : 'Двери'}`);
        
        // Загружаем данные для нового режима, если ещё не загружены
        if (isLaminateMode && allLaminate.length === 0) {
            await loadLaminate();
            currentProducts = allLaminate;
        } else if (!isLaminateMode && allDoors.length === 0) {
            await loadDoors();
            currentProducts = allDoors;
        } else {
            currentProducts = isLaminateMode ? allLaminate : allDoors;
        }
        
        // Обновляем UI
        updateToggleButtonState();
        updateFilterUI();
        
        // Сбрасываем фильтры
        resetAllFilters();
        
        console.log(`Товаров доступно: ${currentProducts.length}`);
        
        // Рендерим товары
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
        // Показываем фильтры для ламината
        filterPanel.innerHTML = `
            <div class="filter-section">
                <h3 class="filter-title">Класс ламината</h3>
                <div class="filter-options">
                    <label class="filter-option">
                        <input type="checkbox" name="laminate-type" value="31"> 31 класс
                    </label>
                    <label class="filter-option">
                        <input type="checkbox" name="laminate-type" value="32"> 32 класс
                    </label>
                    <label class="filter-option">
                        <input type="checkbox" name="laminate-type" value="33"> 33 класс
                    </label>
                    <label class="filter-option">
                        <input type="checkbox" name="laminate-type" value="34"> 34 класс
                    </label>
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
                    <label class="filter-option">
                        <input type="checkbox" name="laminate-thickness" value="7"> 7 мм
                    </label>
                    <label class="filter-option">
                        <input type="checkbox" name="laminate-thickness" value="8"> 8 мм
                    </label>
                    <label class="filter-option">
                        <input type="checkbox" name="laminate-thickness" value="10"> 10 мм
                    </label>
                    <label class="filter-option">
                        <input type="checkbox" name="laminate-thickness" value="12"> 12 мм
                    </label>
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
                    <label class="filter-option">
                        <input type="checkbox" name="laminate-room" value="гостиная"> Гостиная
                    </label>
                    <label class="filter-option">
                        <input type="checkbox" name="laminate-room" value="спальня"> Спальня
                    </label>
                    <label class="filter-option">
                        <input type="checkbox" name="laminate-room" value="кухня"> Кухня
                    </label>
                    <label class="filter-option">
                        <input type="checkbox" name="laminate-room" value="коридор"> Коридор
                    </label>
                    <label class="filter-option">
                        <input type="checkbox" name="laminate-room" value="офис"> Офис
                    </label>
                </div>
            </div>
            <div class="filter-actions">
                <button class="btn btn-primary" id="apply-filters">Применить</button>
                <button class="btn btn-secondary" id="reset-filters">Сбросить</button>
            </div>
        `;
        
        // Устанавливаем чекбоксы если есть фильтры из URL
        setTimeout(() => {
            if (urlParamsApplied) {
                console.log('Установка UI фильтров для ламината из URL');
                // Здесь можно установить начальные значения фильтров
            }
        }, 100);
        
    } else {
        // Показываем фильтры для дверей
        filterPanel.innerHTML = `
            <div class="filter-section">
                <h3 class="filter-title">Тип двери</h3>
                <div class="filter-options">
                    <label class="filter-option">
                        <input type="checkbox" name="door-type" value="Межкомнатная"> Межкомнатная
                    </label>
                    <label class="filter-option">
                        <input type="checkbox" name="door-type" value="Входная"> Входная
                    </label>
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
                    <label class="filter-option">
                        <input type="checkbox" name="door-material" value="Массив"> Массив
                    </label>
                    <label class="filter-option">
                        <input type="checkbox" name="door-material" value="МДФ"> МДФ
                    </label>
                    <label class="filter-option">
                        <input type="checkbox" name="door-material" value="Шпон"> Шпон
                    </label>
                    <label class="filter-option">
                        <input type="checkbox" name="door-material" value="Экошпон"> Экошпон
                    </label>
                    <label class="filter-option">
                        <input type="checkbox" name="door-material" value="ПВХ"> ПВХ
                    </label>
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
                    <label class="filter-option">
                        <input type="checkbox" name="door-style" value="Классика"> Классика
                    </label>
                    <label class="filter-option">
                        <input type="checkbox" name="door-style" value="Модерн"> Модерн
                    </label>
                    <label class="filter-option">
                        <input type="checkbox" name="door-style" value="Лофт"> Лофт
                    </label>
                    <label class="filter-option">
                        <input type="checkbox" name="door-style" value="Минимализм"> Минимализм
                    </label>
                </div>
            </div>
            <div class="filter-actions">
                <button class="btn btn-primary" id="apply-filters">Применить</button>
                <button class="btn btn-secondary" id="reset-filters">Сбросить</button>
            </div>
        `;
        
        // Устанавливаем чекбоксы из URL параметров
        setTimeout(() => {
            if (urlParamsApplied) {
                console.log('Установка UI фильтров для дверей из URL:', selectedFilters.doorTypes);
                
                // Устанавливаем тип двери из URL
                selectedFilters.doorTypes.forEach(doorType => {
                    document.querySelectorAll(`input[name="door-type"][value="${doorType}"]`).forEach(cb => {
                        cb.checked = true;
                    });
                });
            }
        }, 100);
    }
    
    // Переинициализация обработчиков для новых элементов фильтров
    reinitializeFilterListeners();
}

// Переинициализация обработчиков фильтров
function reinitializeFilterListeners() {
    // Обработчики для цветовых опций
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
    
    // Кнопки фильтров
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
    
    // Если есть поисковый запрос из URL, применяем его
    const params = new URLSearchParams(window.location.search);
    const search = params.get('search');
    if (search && searchInput) {
        searchInput.value = search;
        selectedFilters.search = search;
    } else if (searchInput) {
        selectedFilters.search = '';
    }
    
    // Применяем фильтры
    applyFilters();
}

// Обновление фильтров из UI
function updateFiltersFromUI() {
    // Сбрасываем предыдущие фильтры
    selectedFilters.priceMin = null;
    selectedFilters.priceMax = null;
    
    if (isLaminateMode) {
        // Фильтры для ламината
        selectedFilters.laminateTypes = [];
        selectedFilters.laminateThickness = [];
        selectedFilters.laminateColors = [];
        selectedFilters.laminateRooms = [];
        
        // Класс ламината - ищем число в строке
        document.querySelectorAll('input[name="laminate-type"]:checked').forEach(cb => {
            selectedFilters.laminateTypes.push(cb.value);
        });
        
        // Толщина - берем значение как есть
        document.querySelectorAll('input[name="laminate-thickness"]:checked').forEach(cb => {
            selectedFilters.laminateThickness.push(cb.value); // "8" вместо "8 мм"
        });
        
        // Цвета - используем полное название цвета
        document.querySelectorAll('.color-option.selected').forEach(option => {
            const colorMap = {
                'brown': 'Коричневый',
                'beige': 'Бежевый',
                'gray': 'Серый',
                'white': 'Белый',
                'black': 'Чёрный',
                'dark-brown': 'Темный дуб'
            };
            if (colorMap[option.dataset.color]) {
                selectedFilters.laminateColors.push(colorMap[option.dataset.color]);
            }
        });
        
        // Помещение - берем значение как есть
        document.querySelectorAll('input[name="laminate-room"]:checked').forEach(cb => {
            selectedFilters.laminateRooms.push(cb.value);
        });
        
    } else {
        // Фильтры для дверей
        selectedFilters.doorTypes = [];
        selectedFilters.doorMaterials = [];
        selectedFilters.doorColors = [];
        selectedFilters.doorStyles = [];
        
        // Тип двери
        document.querySelectorAll('input[name="door-type"]:checked').forEach(cb => {
            selectedFilters.doorTypes.push(cb.value);
        });
        
        // Материал
        document.querySelectorAll('input[name="door-material"]:checked').forEach(cb => {
            selectedFilters.doorMaterials.push(cb.value);
        });
        
        // Цвета
        document.querySelectorAll('.color-option.selected').forEach(option => {
            const colorMap = {
                'brown': 'Коричневый',
                'beige': 'Бежевый',
                'gray': 'Серый',
                'white': 'Белый',
                'black': 'Чёрный'
            };
            if (colorMap[option.dataset.color]) {
                selectedFilters.doorColors.push(colorMap[option.dataset.color]);
            }
        });
        
        // Стиль
        document.querySelectorAll('input[name="door-style"]:checked').forEach(cb => {
            selectedFilters.doorStyles.push(cb.value);
        });
    }
    
    // Цена
    const priceMin = document.getElementById('price-min');
    const priceMax = document.getElementById('price-max');
    
    if (priceMin && priceMin.value) {
        selectedFilters.priceMin = parseInt(priceMin.value);
    }
    if (priceMax && priceMax.value) {
        selectedFilters.priceMax = parseInt(priceMax.value);
    }
}

// Применение фильтров
function applyFilters() {
    try {
        if (currentPage === 1) showLoading();
        
        if (!currentProducts || currentProducts.length === 0) {
            renderProducts([]);
            return;
        }
        
        const filteredProducts = currentProducts.filter(product => {
            debugFilters(product);
            // Фильтр по поиску
            if (selectedFilters.search) {
                const searchLower = selectedFilters.search.toLowerCase();
                const nameMatch = product.name?.toLowerCase().includes(searchLower) || false;
                const descMatch = product.description?.toLowerCase().includes(searchLower) || false;
                if (!nameMatch && !descMatch) return false;
            }
            
            // Фильтр по цене
            const productPrice = parsePrice(product.prise || '0');
            
            if (selectedFilters.priceMin !== null && productPrice < selectedFilters.priceMin) {
                return false;
            }
            
            if (selectedFilters.priceMax !== null && productPrice > selectedFilters.priceMax) {
                return false;
            }
            
            if (isLaminateMode) {
                // Фильтры для ламината
                if (selectedFilters.laminateTypes.length > 0 && product.type) {
                    const productType = product.type.toLowerCase();
                    const hasType = selectedFilters.laminateTypes.some(type => 
                        productType.includes(type.toLowerCase())
                    );
                    if (!hasType) return false;
                }
                
                // Фильтр по толщине
                if (selectedFilters.laminateThickness.length > 0) {
                    if (!product.thickness) return false;
                    
                    const productThickness = product.thickness.toString();
                    const hasThickness = selectedFilters.laminateThickness.some(thickness => 
                        productThickness === thickness || 
                        productThickness.includes(thickness) ||
                        thickness.includes(productThickness)
                    );
                    if (!hasThickness) return false;
                }
                
                // Фильтр по цвету - обрабатываем как МАССИВ
                if (selectedFilters.laminateColors.length > 0) {
                    if (!product.color || !Array.isArray(product.color)) return false;
                    
                    const productColors = product.color; // Это массив
                    const hasColor = selectedFilters.laminateColors.some(filterColor => {
                        // Ищем совпадение любого цвета в массиве
                        return productColors.some(productColor => 
                            productColor && 
                            typeof productColor === 'string' &&
                            productColor.toLowerCase().includes(filterColor.toLowerCase())
                        );
                    });
                    if (!hasColor) return false;
                }
                
                // Фильтр по помещению - обрабатываем как МАССИВ
                if (selectedFilters.laminateRooms.length > 0) {
                    if (!product.type_room || !Array.isArray(product.type_room)) return false;
                    
                    const productRooms = product.type_room; // Это массив
                    const hasRoom = selectedFilters.laminateRooms.some(room => {
                        // Ищем совпадение любого помещения в массиве
                        return productRooms.some(productRoom => 
                            productRoom && 
                            typeof productRoom === 'string' &&
                            productRoom.toLowerCase().includes(room.toLowerCase())
                        );
                    });
                    if (!hasRoom) return false;
                }
                
            } else {
                // Фильтры для дверей
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
                    if (Array.isArray(product.color)) {
                        productColors = product.color.map(c => c.toLowerCase());
                    } else if (typeof product.color === 'string') {
                        productColors = [product.color.toLowerCase()];
                    }
                    
                    const hasColor = selectedFilters.doorColors.some(color => 
                        productColors.some(productColor => 
                            productColor.includes(color.toLowerCase())
                        )
                    );
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
    }
}

// Сброс всех фильтров
function resetAllFilters() {
    selectedFilters = {
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
    
    // Сброс UI
    if (searchInput) searchInput.value = '';
    
    // Сброс чекбоксов
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    
    // Сброс цветов
    document.querySelectorAll('.color-option').forEach(co => {
        co.classList.remove('selected');
        const checkmark = co.querySelector('.color-checkmark');
        if (checkmark) checkmark.remove();
    });
    
    // Сброс полей цены
    const priceMin = document.getElementById('price-min');
    const priceMax = document.getElementById('price-max');
    if (priceMin) priceMin.value = '';
    if (priceMax) priceMax.value = '';
}

// Отображение всех продуктов
function renderAllProducts() {
    currentPage = 1;
    
    // Если есть поисковый запрос из URL, применяем его
    const params = new URLSearchParams(window.location.search);
    const search = params.get('search');
    if (search && searchInput) {
        searchInput.value = search;
        selectedFilters.search = search;
    } else {
        selectedFilters.search = '';
    }
    
    // Применяем фильтры (а не рендерим все)
    applyFilters();
}

// Постраничный рендеринг
function renderProductsPaginated() {
    if (!currentProducts || currentProducts.length === 0) {
        renderProducts([]);
        renderLoadMoreButton(0);
        return;
    }
    
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    displayedProducts = currentProducts.slice(0, endIndex);
    
    renderProducts(displayedProducts);
    renderLoadMoreButton(currentProducts.length);
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
    
    // ВАЖНО: Определяем коллекцию на основе режима, а не на основе продукта
    const collectionName = isLaminateMode ? 'laminate' : 'doors';
    
    // Изображение - убираем onerror с заглушкой
    let imageUrl = '';
    
    if (product.picture && product.picture.length > 0 && product.picture[0]) {
        try {
            const fileName = product.picture[0];
            imageUrl = `${PB_URL}/api/files/${collectionName}/${product.id}/${fileName}`;
            console.log(`Загружаем изображение (${collectionName}):`, imageUrl);
        } catch (error) {
            console.warn('Ошибка загрузки изображения:', error);
        }
    }
    
    // Цена
    let formattedPrice = 'Цена по запросу';
    
    if (product.prise) {
        formattedPrice = product.prise;
        
        if (!formattedPrice.includes('₽') && !formattedPrice.includes('руб')) {
            const match = formattedPrice.match(/(\d[\d\s]*[\d.,]?\d*)/);
            if (match) {
                const numberStr = match[1].replace(/\s/g, '').replace(',', '.');
                const price = parseFloat(numberStr);
                if (!isNaN(price)) {
                    formattedPrice = price.toLocaleString('ru-RU') + ' ₽';
                }
            }
        }
    }
    
    // Характеристики
    const characteristics = [];
    
    if (isLaminateMode) {
        if (product.type) characteristics.push(product.type);
        if (product.thickness) characteristics.push(product.thickness + ' мм');
        if (product.wear_class) characteristics.push(product.wear_class + ' класс');
    } else {
        if (product.type) characteristics.push(product.type);
        if (product.material) characteristics.push(product.material);
    }
    
    // Ссылка на продукт
    let productLink;
    if (isLaminateMode) {
        productLink = `laminate-product.html?id=${product.id}`;
    } else {
        productLink = `product.html?id=${product.id}`;
    }
    
    // Кнопка конструктора только для ламината
    const constructorButton = isLaminateMode ? 
    `<button class="btn-constructor" onclick="window.addToConstructor('${product.id}', '${escapeHtml(product.name || '')}')">
        В конструктор
    </button>` : '';
    
    card.innerHTML = `
        <div class="product-image-container ${isLaminateMode ? 'laminate-image-container' : 'door-image-container'}">
            <img src="${imageUrl}" alt="${escapeHtml(product.name || 'Без названия')}" 
                 class="product-image ${isLaminateMode ? 'laminate-image' : 'door-image'}"
                 onclick="window.location.href='${productLink}'">
        </div>
        <div class="product-info">
            <h3 class="product-title">${escapeHtml(product.name || 'Без названия')}</h3>
            <div class="product-meta" style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;">
                ${characteristics.map(char => `<span class="product-badge">${char}</span>`).join('')}
            </div>
            <p class="product-description">${escapeHtml(product.description ? 
                (product.description.length > 80 ? 
                    product.description.substring(0, 80) + '...' : 
                    product.description) : 
                'Описание отсутствует')}</p>
            
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
            pagination.innerHTML = `
                <div class="all-loaded">
                    Показано ${totalFiltered} из ${totalFiltered} товаров
                </div>
            `;
        }
        return;
    }
    
    const loadMoreBtn = document.createElement('button');
    loadMoreBtn.className = 'load-more-btn';
    loadMoreBtn.innerHTML = `
        <span>Загрузить еще</span>
        <span class="load-more-count">(${Math.min(ITEMS_PER_PAGE, totalFiltered - displayedProducts.length)})</span>
    `;
    
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
    // Динамический поиск
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            performSearch();
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
    
    // Кнопка поиска
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            performSearch();
        });
    }
    
    // Мобильные фильтры
    if (mobileFiltersBtn && filtersPanel) {
        mobileFiltersBtn.addEventListener('click', () => {
            filtersPanel.classList.toggle('active');
        });
    }
    
    // Переключатель двери/ламинат
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleMode);
    }
}

// Вспомогательные функции
function parsePrice(priceStr) {
    if (!priceStr) return 0;
    const match = priceStr.match(/(\d[\d\s]*[\d.,]?\d*)/);
    if (match) {
        const numberStr = match[1].replace(/\s/g, '').replace(',', '.');
        const price = parseFloat(numberStr);
        return isNaN(price) ? 0 : Math.round(price);
    }
    return 0;
}

function showLoading() {
    productsGrid.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Загрузка товаров...</p>
        </div>
    `;
}

function showErrorMessage(message) {
    productsGrid.innerHTML = `
        <div class="error-message">
            <h3>⚠️ Ошибка</h3>
            <p>${message || 'Произошла ошибка при загрузке данных'}</p>
            <button onclick="location.reload()" class="btn btn-primary">
                Обновить страницу
            </button>
        </div>
    `;
}

function escapeHtml(text) {
    if (!text) return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    
    // Для использования в data-атрибутах также экранируем кавычки
    const escaped = div.innerHTML
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/`/g, '&#96;');
    
    return escaped;
}

// Рендеринг продуктов
function renderProducts(products) {
    if (!products || products.length === 0) {
        productsGrid.innerHTML = `
            <div class="no-results">
                <h3>😕 Товары не найдены</h3>
                <p>${selectedFilters.search ? 'Попробуйте другой поисковый запрос' : 
                    isLaminateMode ? 'Попробуйте изменить параметры фильтрации' : 'Попробуйте изменить параметры фильтрации'}</p>
            </div>
        `;
        return;
    }
    
    productsGrid.innerHTML = '';
    
    products.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
    
    // После рендеринга добавляем обработчики для кнопок конструктора
    addConstructorButtonListeners();
}

function addConstructorButtonListeners() {
    const constructorButtons = document.querySelectorAll('.btn-constructor');
    
    constructorButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const productId = this.getAttribute('data-product-id');
            const productName = this.getAttribute('data-product-name');
            const productColor = this.getAttribute('data-product-color');
            
            console.log('Клик по кнопке конструктора:', {
                productId,
                productName,
                productColor
            });
            
            if (isLaminateMode) {
                window.addToConstructor(productId, productName, productColor);
            } else {
                alert('Конструктор доступен только для ламината');
            }
        });
    });
}

// Глобальные функции
window.showProductDetails = function(productId) {
    const productPage = isLaminateMode ? 'laminate-product.html' : 'product.html';
    window.location.href = `${productPage}?id=${productId}`;
};

// Глобальные функции - ДОБАВЛЕНА НОВАЯ ФУНКЦИЯ
window.addToConstructor = function(productId, productName, color) {
    if (isLaminateMode) {
        console.log(`Переход в конструктор: ${productId} - ${productName} - Цвет: ${color}`);
        
        // Находим полный объект продукта
        const product = currentProducts.find(p => p.id === productId);
        
        // Получаем массив цветов из продукта
        let colorsArray = [];
        if (product && product.color) {
            if (Array.isArray(product.color)) {
                colorsArray = product.color;
            } else if (typeof product.color === 'string') {
                colorsArray = [product.color];
            }
        }
        
        // Берем переданный цвет или первый из массива
        const selectedColor = color || (colorsArray.length > 0 ? colorsArray[0] : '');
        
        // Создаем объект с данными продукта
        const productData = {
            id: productId,
            name: productName || '',
            colors: colorsArray, // Сохраняем весь массив цветов
            selectedColor: selectedColor,
            productData: product // Сохраняем полный объект для отладки
        };
        
        // Сохраняем в sessionStorage
        try {
            sessionStorage.setItem('constructor_product', JSON.stringify(productData));
            console.log('Данные сохранены в sessionStorage:', productData);
        } catch (e) {
            console.error('Ошибка сохранения в sessionStorage:', e);
        }
        
        // Формируем URL с параметрами
        const url = new URL('laminate-constructor.html', window.location.origin);
        url.searchParams.append('product_id', productId);
        
        if (productName) {
            url.searchParams.append('product_name', encodeURIComponent(productName));
        }
        
        if (selectedColor) {
            url.searchParams.append('color', encodeURIComponent(selectedColor));
        }
        
        // Добавляем все цвета как параметр
        if (colorsArray.length > 0) {
            url.searchParams.append('all_colors', encodeURIComponent(JSON.stringify(colorsArray)));
        }
        
        console.log('Переход на конструктор:', url.toString());
        window.location.href = url.toString();
        
    } else {
        alert('Конструктор доступен только для ламината');
    }
};

// Обновляем старую функцию
window.addToConstructor = function(productId, productName, colors) {
    // Определяем цвет для передачи
    let colorToPass = '';
    
    if (colors) {
        if (Array.isArray(colors) && colors.length > 0) {
            colorToPass = colors[0]; // Берем первый цвет из массива
        } else if (typeof colors === 'string' && colors) {
            colorToPass = colors;
        }
    }
    
    window.addToConstructorWithColor(productId, productName, colorToPass);
};

window.resetAllFilters = resetAllFilters;
window.applyFilters = applyFilters;
window.toggleMode = toggleMode;
window.loadMoreProducts = function() {
    currentPage++;
    applyFilters();
};

function debugFilters(product) {
    if (isLaminateMode) {
        console.log('Отладка фильтров ламината:');
        console.log('Товар:', {
            name: product.name,
            type: product.type,
            thickness: product.thickness,
            color: product.color,
            type_room: product.type_room,
            price: product.prise
        });
        console.log('Фильтры:', {
            types: selectedFilters.laminateTypes,
            thickness: selectedFilters.laminateThickness,
            colors: selectedFilters.laminateColors,
            rooms: selectedFilters.laminateRooms
        });
    }
}

// Глобальная функция для добавления в конструктор с цветом
window.addToConstructorWithColor = function(productId, productName, color) {
    if (isLaminateMode) {
        console.log(`Добавление в конструктор: ${productId} - ${productName} с цветом:`, color);
        
        // Сохраняем данные в sessionStorage для конструктора
        try {
            const productData = {
                id: productId,
                name: productName,
                selectedColor: color || '',
                // Добавляем информацию о коллекции
                collection: 'laminate',
                // Сохраняем полный объект продукта если нужно
                productData: currentProducts.find(p => p.id === productId)
            };
            sessionStorage.setItem('constructor_product', JSON.stringify(productData));
            console.log('Данные сохранены в sessionStorage:', productData);
            
            // Переходим на страницу конструктора с параметрами
            const url = new URL('laminate-constructor.html', window.location.origin);
            url.searchParams.append('product_id', productId);
            if (productName) {
                url.searchParams.append('product_name', encodeURIComponent(productName));
            }
            if (color) {
                url.searchParams.append('color', encodeURIComponent(color));
            }
            
            console.log('Переход на конструктор:', url.toString());
            window.location.href = url.toString();
            
        } catch (e) {
            console.error('Ошибка сохранения в sessionStorage:', e);
            // Резервный вариант
            alert('Ошибка при переходе в конструктор. Пожалуйста, попробуйте еще раз.');
        }
        
    } else {
        alert('Конструктор доступен только для ламината');
    }
};

// Глобальная функция для добавления в конструктор с цветом
window.addToConstructor = function(productId, productName, color) {
    if (isLaminateMode) {
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
        
    } else {
        alert('Конструктор доступен только для ламината');
    }
};

window.addToConstructor = function(productId, productName) {
    if (isLaminateMode) {
        console.log(`Переход в конструктор: ${productId} - ${productName}`);
        
        // Просто передаем ID и имя, цвет выберется в конструкторе
        const url = `laminate-constructor.html?product_id=${productId}&product_name=${encodeURIComponent(productName)}`;
        console.log('URL конструктора:', url);
        window.location.href = url;
        
    } else {
        alert('Конструктор доступен только для ламината');
    }
};