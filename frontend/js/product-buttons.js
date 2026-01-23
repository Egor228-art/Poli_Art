// product-buttons.js - Простой обработчик кнопок на страницах товаров
document.addEventListener('DOMContentLoaded', function() {
    console.log('🛒 Инициализация кнопок товара...');
    
    // Проверяем, находимся ли мы на странице товара
    const isProductPage = window.location.pathname.includes('product.html') || 
                         window.location.pathname.includes('laminate-product.html');
    
    if (!isProductPage) return;
    
    // Инициализируем кнопки
    initProductButtons();
});

function initProductButtons() {
    // Кнопка "Оформить заказ"
    const orderBtn = document.getElementById('orderBtn');
    if (orderBtn) {
        orderBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🛒 Кнопка "Оформить заказ" нажата');
            openOrderModal();
        });
    } else {
        // Если кнопки нет, создаем её
        createOrderButton();
    }
    
    // Кнопка "Конструктор" для ламината
    const constructorBtn = document.querySelector('.btn-constructor');
    if (constructorBtn) {
        constructorBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🧮 Кнопка "Конструктор" нажата');
            openConstructor();
        });
    }
}

function createOrderButton() {
    // Ищем место для кнопки (рядом с ценой или действиями)
    const priceContainer = document.querySelector('.product-price, .laminate-price, .price-container');
    const actionsContainer = document.querySelector('.product-actions, .actions-container');
    
    const container = actionsContainer || priceContainer || document.querySelector('.product-main');
    
    if (!container) return;
    
    // Создаем кнопку
    const orderBtn = document.createElement('button');
    orderBtn.id = 'orderBtn';
    orderBtn.className = 'btn btn--primary';
    orderBtn.innerHTML = '<span>🛒 Оформить заказ</span>';
    orderBtn.style.marginTop = '20px';
    
    orderBtn.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('🛒 Кнопка "Оформить заказ" нажата');
        openOrderModal();
    });
    
    // Добавляем кнопку на страницу
    container.appendChild(orderBtn);
}

function openOrderModal() {
    // Проверяем авторизацию
    if (!window.authManager || !window.authManager.isAuthenticated()) {
        console.log('🔒 Пользователь не авторизован, перенаправляем на вход');
        window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
        return;
    }
    
    console.log('✅ Пользователь авторизован, открываем модальное окно');
    
    // Показываем модальное окно
    const modal = document.getElementById('orderModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Заполняем информацию о товаре
        fillOrderModalInfo();
        
        // Обновляем стоимость
        updateOrderSummary();
    } else {
        console.error('❌ Модальное окно заказа не найдено');
        alert('Модальное окно заказа не найдено. Пожалуйста, сообщите администратору.');
    }
}

function fillOrderModalInfo() {
    // Получаем информацию о товаре со страницы
    const productName = document.querySelector('.product-title, h1')?.textContent || 'Товар';
    const productPrice = document.querySelector('.product-price, .laminate-price, .price')?.textContent || '0 ₽';
    const productImage = document.querySelector('.gallery-main__image, .product-image')?.src || '';
    
    // Заполняем поля в модальном окне
    const nameElement = document.getElementById('orderProductName');
    const priceElement = document.getElementById('orderProductPrice');
    const imageElement = document.getElementById('orderProductImage');
    
    if (nameElement) nameElement.textContent = productName;
    if (priceElement) priceElement.textContent = productPrice;
    if (imageElement && productImage) imageElement.src = productImage;
}

function updateOrderSummary() {
    // Получаем количество
    const quantityInput = document.getElementById('orderQuantity');
    const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;
    
    // Получаем цену товара
    const priceText = document.getElementById('orderProductPrice')?.textContent || '0';
    const price = parseFloat(priceText.replace(/[^\d]/g, '')) || 0;
    
    // Рассчитываем стоимость товара
    const productTotal = price * quantity;
    
    // Получаем стоимость доставки
    const deliveryRadio = document.querySelector('input[name="delivery"]:checked');
    const deliveryType = deliveryRadio ? deliveryRadio.value : 'pickup';
    let deliveryCost = 0;
    
    if (deliveryType === 'delivery') {
        deliveryCost = 500;
    } else if (deliveryType === 'installation') {
        deliveryCost = 1500;
    }
    
    // Рассчитываем итоговую стоимость
    const total = productTotal + deliveryCost;
    
    // Обновляем отображение
    const productElement = document.getElementById('summaryProduct');
    const deliveryElement = document.getElementById('summaryDelivery');
    const totalElement = document.getElementById('summaryTotal');
    
    if (productElement) productElement.textContent = productTotal.toLocaleString() + ' ₽';
    if (deliveryElement) {
        deliveryElement.textContent = deliveryCost === 0 ? 'Бесплатно' : deliveryCost.toLocaleString() + ' ₽';
    }
    if (totalElement) totalElement.textContent = total.toLocaleString() + ' ₽';
}

function openConstructor() {
    console.log('🧮 Открытие конструктора ламината');
    // Здесь можно добавить логику открытия конструктора
    alert('Конструктор ламината будет доступен в ближайшее время!');
}

// Обработчики для модального окна (если оно есть на странице)
document.addEventListener('DOMContentLoaded', function() {
    // Кнопки закрытия модального окна
    const closeBtn = document.getElementById('closeOrderModal');
    const cancelBtn = document.getElementById('cancelOrder');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeOrderModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeOrderModal);
    }
    
    // Закрытие по клику на оверлей
    const modal = document.getElementById('orderModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeOrderModal();
            }
        });
    }
    
    // Обработчики для количества товара
    const qtyMinus = document.querySelector('.qty-minus');
    const qtyPlus = document.querySelector('.qty-plus');
    const qtyInput = document.getElementById('orderQuantity');
    
    if (qtyMinus) {
        qtyMinus.addEventListener('click', function() {
            changeQuantity(-1);
        });
    }
    
    if (qtyPlus) {
        qtyPlus.addEventListener('click', function() {
            changeQuantity(1);
        });
    }
    
    if (qtyInput) {
        qtyInput.addEventListener('input', updateOrderSummary);
    }
    
    // Обработчики для доставки
    const deliveryRadios = document.querySelectorAll('input[name="delivery"]');
    deliveryRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            updateOrderSummary();
            
            // Показываем/скрываем поле адреса
            const addressContainer = document.getElementById('deliveryAddress');
            if (addressContainer) {
                if (this.value === 'delivery' || this.value === 'installation') {
                    addressContainer.style.display = 'block';
                } else {
                    addressContainer.style.display = 'none';
                }
            }
        });
    });
    
    // Кнопка оформления заказа в модальном окне
    const submitBtn = document.getElementById('submitOrder');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitOrder);
    }
});

function closeOrderModal() {
    const modal = document.getElementById('orderModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function changeQuantity(delta) {
    const input = document.getElementById('orderQuantity');
    if (!input) return;
    
    let value = parseInt(input.value) || 1;
    value += delta;
    
    if (value < 1) value = 1;
    if (value > 99) value = 99;
    
    input.value = value;
    updateOrderSummary();
}

function submitOrder() {
    console.log('📦 Оформление заказа...');
    // Здесь будет логика оформления заказа
    alert('Функция оформления заказа будет реализована в ближайшее время!');
}