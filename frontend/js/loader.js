// Логика интерактивной загрузочной страницы
document.addEventListener('DOMContentLoaded', function() {
    // Элементы
    const loaderPage = document.getElementById('loaderPage');
    const mainContent = document.getElementById('mainContent');
    const lampContainer = document.querySelector('.lamp-container');
    const lampBulb = document.getElementById('lampBulb');
    const lampLight = document.getElementById('lampLight');
    const door = document.getElementById('door');
    const doorWrapper = document.getElementById('doorWrapper');
    const doorBacklight = document.getElementById('doorBacklight');
    
    // Создаём сложный свет за дверью
    function createComplexBacklight() {
        // Очищаем существующий контент
        doorBacklight.innerHTML = '';
        
        // Создаём слои
        const veil = document.createElement('div');
        veil.className = 'backlight-veil';
        doorBacklight.appendChild(veil);
        
        // Создаём 6 лучей
        for (let i = 0; i < 6; i++) {
            const ray = document.createElement('div');
            ray.className = 'backlight-ray';
            doorBacklight.appendChild(ray);
        }
        
        // Создаём ядро света
        const core = document.createElement('div');
        core.className = 'backlight-core';
        doorBacklight.appendChild(core);
    }
    
    // Создаём овал света на полу
    let floorLight = document.querySelector('.floor-light');
    if (!floorLight) {
        floorLight = document.createElement('div');
        floorLight.className = 'floor-light';
        loaderPage.appendChild(floorLight);
    }
    
    // Создаём слой для засветки экрана
    let screenFlash = document.getElementById('screenFlash');
    if (!screenFlash) {
        screenFlash = document.createElement('div');
        screenFlash.className = 'screen-flash';
        screenFlash.id = 'screenFlash';
        loaderPage.appendChild(screenFlash);
    }
    
    // Инициализируем сложный свет
    createComplexBacklight();
    
    // Таймер бездействия
    let idleTimer;
    let isIdle = false;
    
    // Состояния
    let isDoorOpen = false;
    let isTransitioning = false;
    
    // Сброс таймера бездействия
    function resetIdleTimer() {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(triggerIdleFlicker, 20000); // 20 секунд бездействия
    }
    
    // Мерцание лампы при бездействии
    function triggerIdleFlicker() {
        if (isTransitioning) return;
        
        isIdle = true;
        
        // Мерцание 3 раза
        let flickerCount = 0;
        const flickerInterval = setInterval(() => {
            lampBulb.classList.toggle('bulb-flicker');
            flickerCount++;
            
            if (flickerCount >= 6) { // 3 вкл/выкл
                clearInterval(flickerInterval);
                lampBulb.classList.remove('bulb-flicker');
                isIdle = false;
                resetIdleTimer();
            }
        }, 200);
    }
    
    // Открытие двери при наведении
    function openDoor() {
        if (isDoorOpen || isTransitioning) return;
        
        isDoorOpen = true;
        door.classList.add('open');
        
        // Показываем сложный белый свет за дверью
        setTimeout(() => {
            doorBacklight.classList.add('visible');
        }, -1000);

        if (isDoorOpen || isTransitioning) return;
        
        // ОБНОВЛЯЕМ ПОДСКАЗКУ
        if (loaderHint) {
            loaderHint.innerHTML = '<p>Подсказка: Нажмите на дверь чтобы попасть на сайт.</p>';
            loaderHint.style.animation = 'fadeInHint 0.5s ease forwards'; // Быстрое появление
        }
    }
    
    // Закрытие двери
    function closeDoor() {
        if (!isDoorOpen || isTransitioning) return;
        
        isDoorOpen = false;
        door.classList.remove('open');
        doorBacklight.classList.remove('visible');

        if (!isDoorOpen || isTransitioning) return;
    
        // ВОЗВРАЩАЕМ ПОДСКАЗКУ
        if (loaderHint) {
            loaderHint.innerHTML = '<p>Подсказка: Нажмите на дверь чтобы попасть на сайт.</p>';
            loaderHint.style.animation = 'fadeInHint 0.5s ease forwards';
        }
    }
    
    // Увеличение двери и переход на сайт
    function enterThroughDoor() {
        if (isTransitioning || !isDoorOpen) return;
        
        isTransitioning = true;

        // ПРЯЧЕМ ПОДСКАЗКУ ПРИ ПЕРЕХОДЕ
        if (loaderHint) {
            loaderHint.style.opacity = '0';
            loaderHint.style.transition = 'opacity 0.3s ease';
        }
        
        // Сохраняем состояние до перехода
        localStorage.setItem('polyartLoaderSeen', 'true');
        localStorage.setItem('polyartTransitioning', 'true');
        
        // Скрываем лампу и её свет
        if (lampContainer) {
            lampContainer.classList.add('hidden');
        }
        
        // Отключаем все события на время перехода
        doorWrapper.style.pointerEvents = 'none';
        if (lampBulb) lampBulb.style.pointerEvents = 'none';
        
        // Убираем видимое мерцание
        doorBacklight.classList.remove('visible');
        
        // ЗАПУСКАЕМ АНИМАЦИЮ СВЕТА ПЕРВОЙ (быстрая - 2 секунды)
        doorBacklight.classList.add('backlight-expand');
        
        // ЗАПУСКАЕМ АНИМАЦИЮ ДВЕРИ ПОЗЖЕ (медленная - 3 секунды)
        setTimeout(() => {
            doorWrapper.classList.add('door-enlarging');
        }); // Задержка 300ms чтобы свет начал расширяться первым
        
        // Активируем полную засветку экрана после расширения света
        setTimeout(() => {
            if (screenFlash) {
                screenFlash.style.animation = 'screenFlash 2s ease-in-out';
                screenFlash.style.opacity = '1';
            }
        }, 1500); // Через 1.5 секунды (когда свет уже расширился)
        
        // Переход на основную страницу через 2.5 секунды
        setTimeout(() => {
            // Плавно скрываем загрузчик
            loaderPage.style.opacity = '0';
            loaderPage.style.transition = 'opacity 0.5s ease';
            
            setTimeout(() => {
                if (loaderPage) loaderPage.style.display = 'none';
                
                // Показываем основную страницу
                if (mainContent) {
                    mainContent.style.display = 'block';
                    mainContent.classList.add('main-content-visible');
                }
                
                // Убираем флаг перехода
                localStorage.removeItem('polyartTransitioning');
            }, 500);
        }, 2500);
    }
    
    // Инициализация
    function initLoader() {
        // Проверяем, не идёт ли переход
        const isTransitioningStorage = localStorage.getItem('polyartTransitioning');
        const hasSeenLoader = localStorage.getItem('polyartLoaderSeen');
        const loaderHint = document.getElementById('loaderHint');
        
        // Если прерванный переход - сразу показываем основную страницу
        if (isTransitioningStorage) {
            if (loaderPage) loaderPage.style.display = 'none';
            if (mainContent) {
                mainContent.style.display = 'block';
                mainContent.style.opacity = '1';
            }
            localStorage.removeItem('polyartTransitioning');
            return;
        }
        
        // Если уже видели загрузчик - сразу показываем основную страницу
        if (hasSeenLoader) {
            if (loaderPage) loaderPage.style.display = 'none';
            if (mainContent) {
                mainContent.style.display = 'block';
                mainContent.style.opacity = '1';
            }
            return;
        }
        
        // Наведение на дверь - открываем
        if (doorWrapper) {
            doorWrapper.addEventListener('mouseenter', function(e) {
                e.stopPropagation();
                resetIdleTimer();
                openDoor();
            });
            
            // Уход с двери - закрываем
            doorWrapper.addEventListener('mouseleave', function(e) {
                e.stopPropagation();
                setTimeout(() => {
                    if (!doorWrapper.matches(':hover')) {
                        closeDoor();
                    }
                }, 300);
            });
            
            // Клик на дверь - переход
            doorWrapper.addEventListener('click', function(e) {
                e.stopPropagation();
                resetIdleTimer();
                enterThroughDoor();
            });

            setTimeout(() => {
                if (loaderHint && !isDoorOpen && !isTransitioning) {
                    loaderHint.style.animation = 'fadeInHint 1s ease forwards';
                }
            }, 3000);
        }
        
        // Отслеживание активности пользователя
        const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
        activityEvents.forEach(event => {
            document.addEventListener(event, resetIdleTimer, { passive: true });
        });
        
        // Запускаем таймер бездействия
        resetIdleTimer();
    }
    
    // Обработка прерывания перехода
    window.addEventListener('beforeunload', function() {
        const isTransitioningStorage = localStorage.getItem('polyartTransitioning');
        if (isTransitioningStorage) {
            localStorage.removeItem('polyartTransitioning');
        }
    });
    
    // Запускаем загрузчик
    if (loaderPage && loaderPage.style.display !== 'none') {
        initLoader();
    }
});

// ========== ФУНКЦИИ ДЛЯ ТЕСТИРОВАНИЯ ИЗ КОНСОЛИ ==========

// Полный сброс и показ загрузчика
function testLoader() {
    localStorage.removeItem('polyartLoaderSeen');
    localStorage.removeItem('polyartTransitioning');
    location.reload();
}

// Быстрый показ загрузчика без перезагрузки
function showLoader() {
    const loaderPage = document.getElementById('loaderPage');
    const mainContent = document.getElementById('mainContent');
    
    if (loaderPage && mainContent) {
        // Прячем основную страницу
        mainContent.style.display = 'none';
        
        // Показываем и сбрасываем загрузчик
        loaderPage.style.display = 'block';
        loaderPage.style.opacity = '1';
        
        // Сбрасываем состояние
        const door = document.getElementById('door');
        const doorBacklight = document.getElementById('doorBacklight');
        const doorWrapper = document.getElementById('doorWrapper');
        const lampContainer = document.querySelector('.lamp-container');
        
        if (door) door.classList.remove('open');
        if (doorBacklight) {
            doorBacklight.classList.remove('visible', 'backlight-expand');
            doorBacklight.style.opacity = '0';
        }
        if (doorWrapper) {
            doorWrapper.classList.remove('door-enlarging');
            doorWrapper.style.pointerEvents = 'auto';
            doorWrapper.style.transform = 'translateX(-50%) scale(1)';
            doorWrapper.style.opacity = '1';
        }
        if (lampContainer) lampContainer.classList.remove('hidden');
        
        // Пересоздаём сложный свет
        const doorBacklightElement = document.getElementById('doorBacklight');
        if (doorBacklightElement) {
            doorBacklightElement.innerHTML = '';
            const veil = document.createElement('div');
            veil.className = 'backlight-veil';
            doorBacklightElement.appendChild(veil);
            
            for (let i = 0; i < 6; i++) {
                const ray = document.createElement('div');
                ray.className = 'backlight-ray';
                doorBacklightElement.appendChild(ray);
            }
            
            const core = document.createElement('div');
            core.className = 'backlight-core';
            doorBacklightElement.appendChild(core);
        }
        
        console.log('✅ Загрузчик активирован!');
    }
}