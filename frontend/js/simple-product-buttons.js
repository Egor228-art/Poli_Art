// simple-product-buttons.js - Простой обработчик кнопок
document.addEventListener('DOMContentLoaded', function() {
    console.log('🛒 Инициализация простого обработчика кнопок...');
    
    // 1. Обработчик для кнопки "Оформить заказ"
    const orderBtn = document.getElementById('orderBtn');
    if (orderBtn) {
        console.log('✅ Кнопка "Оформить заказ" найдена');
        
        orderBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🛒 Кнопка нажата!');
            
            // Проверяем авторизацию
            if (typeof authManager !== 'undefined' && authManager.isAuthenticated()) {
                console.log('✅ Пользователь авторизован, открываем модальное окно');
                openOrderModal();
            } else {
                console.log('🔒 Пользователь не авторизован, перенаправляем');
                window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
            }
        });
        
        // Добавляем стили для кнопки
        orderBtn.style.cursor = 'pointer';
        orderBtn.style.opacity = '1';
        
    } else {
        console.log('❌ Кнопка "Оформить заказ" не найдена, создаем...');
        createOrderButton();
    }
    
    // 2. Инициализируем модальное окно если оно есть
    initOrderModal();
});

function createOrderButton() {
    // Ищем контейнер для кнопки
    const possibleContainers = [
        '.product-actions',
        '.product-info',
        '.price-container',
        '.product-main',
        '.laminate-price',
        '.product-details'
    ];
    
    let container = null;
    for (const selector of possibleContainers) {
        container = document.querySelector(selector);
        if (container) break;
    }
    
    if (!container) {
        console.error('❌ Не найден контейнер для кнопки');
        return;
    }
    
    // Создаем кнопку
    const orderBtn = document.createElement('button');
    orderBtn.id = 'orderBtn';
    orderBtn.className = 'order-btn-simple';
    orderBtn.innerHTML = '<span>🛒 Оформить заказ</span>';
    
    // Стили для кнопки
    orderBtn.style.cssText = `
        background: linear-gradient(135deg, #eabb66, #e74c3c);
        border: none;
        color: white;
        padding: 15px 30px;
        border-radius: 10px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
        display: inline-block;
        margin: 20px 0;
    `;
    
    orderBtn.addEventListener('mouseover', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 5px 15px rgba(234, 187, 102, 0.3)';
    });
    
    orderBtn.addEventListener('mouseout', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = 'none';
    });
    
    orderBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🛒 Созданная кнопка нажата!');
        
        if (typeof authManager !== 'undefined' && authManager.isAuthenticated()) {
            openOrderModal();
        } else {
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
        }
    });
    
    // Добавляем кнопку в контейнер
    container.appendChild(orderBtn);
    console.log('✅ Кнопка создана и добавлена на страницу');
}

function initOrderModal() {
    // Обработчики для модального окна
    const closeBtn = document.getElementById('closeOrderModal');
    const cancelBtn = document.getElementById('cancelOrder');
    const modal = document.getElementById('orderModal');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            if (modal) modal.style.display = 'none';
            document.body.style.overflow = '';
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            if (modal) modal.style.display = 'none';
            document.body.style.overflow = '';
        });
    }
    
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    }
    
    // Обработчики для количества товара
    const qtyMinus = document.querySelector('.qty-minus');
    const qtyPlus = document.querySelector('.qty-plus');
    const qtyInput = document.getElementById('orderQuantity');
    
    if (qtyMinus) {
        qtyMinus.addEventListener('click', function() {
            if (qtyInput) {
                let value = parseInt(qtyInput.value) || 1;
                if (value > 1) {
                    qtyInput.value = value - 1;
                    updateOrderSummary();
                }
            }
        });
    }
    
    if (qtyPlus) {
        qtyPlus.addEventListener('click', function() {
            if (qtyInput) {
                let value = parseInt(qtyInput.value) || 1;
                if (value < 99) {
                    qtyInput.value = value + 1;
                    updateOrderSummary();
                }
            }
        });
    }
    
    if (qtyInput) {
        qtyInput.addEventListener('input', updateOrderSummary);
    }
    
    // Обработчики для доставки
    document.querySelectorAll('input[name="delivery"]').forEach(radio => {
        radio.addEventListener('change', function() {
            updateOrderSummary();
            
            // Показываем/скрываем поле адреса
            const addressContainer = document.getElementById('deliveryAddress');
            if (addressContainer) {
                addressContainer.style.display = 
                    (this.value === 'delivery' || this.value === 'installation') ? 'block' : 'none';
            }
        });
    });
    
    // Кнопка оформления заказа
    const submitBtn = document.getElementById('submitOrder');
    if (submitBtn) {
        submitBtn.addEventListener('click', function() {
            submitOrder();
        });
    }
}

function openOrderModal() {
    const modal = document.getElementById('orderModal');
    if (!modal) {
        console.error('❌ Модальное окно не найдено');
        alert('Функция оформления заказа временно недоступна');
        return;
    }
    
    console.log('✅ Открываем модальное окно');
    
    // Заполняем информацию о товаре
    fillOrderModalInfo();
    
    // Показываем модальное окно
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Обновляем стоимость
    updateOrderSummary();
}

function fillOrderModalInfo() {
    // Получаем данные со страницы
    const productName = document.querySelector('h1, .product-title, .product-name')?.textContent || 'Товар';
    const productPriceText = document.querySelector('.product-price, .laminate-price, .price')?.textContent || '0 ₽';
    const productImage = document.querySelector('img.product-image, img.main-image, .gallery-main img')?.src || '';
    
    // Извлекаем цену из текста
    const priceMatch = productPriceText.match(/[\d\s]+/);
    const price = priceMatch ? parseFloat(priceMatch[0].replace(/\s/g, '')) : 0;
    
    // Заполняем поля
    const nameEl = document.getElementById('orderProductName');
    const priceEl = document.getElementById('orderProductPrice');
    const imageEl = document.getElementById('orderProductImage');
    
    if (nameEl) nameEl.textContent = productName;
    if (priceEl) priceEl.textContent = price.toLocaleString() + ' ₽';
    if (imageEl && productImage) imageEl.src = productImage;
}

function updateOrderSummary() {
    try {
        // Количество
        const qtyInput = document.getElementById('orderQuantity');
        const quantity = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
        
        // Цена товара
        const priceText = document.getElementById('orderProductPrice')?.textContent || '0 ₽';
        const price = parseFloat(priceText.replace(/[^\d]/g, '')) || 0;
        
        // Стоимость товара
        const productTotal = price * quantity;
        
        // Доставка
        const deliveryRadio = document.querySelector('input[name="delivery"]:checked');
        const deliveryType = deliveryRadio ? deliveryRadio.value : 'pickup';
        let deliveryCost = 0;
        
        if (deliveryType === 'delivery') deliveryCost = 500;
        if (deliveryType === 'installation') deliveryCost = 1500;
        
        // Дополнительные услуги
        let servicesCost = 0;
        const warranty = document.getElementById('serviceWarranty');
        const assembly = document.getElementById('serviceAssembly');
        
        if (warranty?.checked) servicesCost += 500;
        if (assembly?.checked) servicesCost += 1000;
        
        // Итого
        const total = productTotal + deliveryCost + servicesCost;
        
        // Обновляем отображение
        const productEl = document.getElementById('summaryProduct');
        const deliveryEl = document.getElementById('summaryDelivery');
        const servicesEl = document.getElementById('summaryServices');
        const totalEl = document.getElementById('summaryTotal');
        
        if (productEl) productEl.textContent = productTotal.toLocaleString() + ' ₽';
        if (deliveryEl) deliveryEl.textContent = deliveryCost === 0 ? 'Бесплатно' : deliveryCost.toLocaleString() + ' ₽';
        if (servicesEl) servicesEl.textContent = servicesCost === 0 ? '—' : servicesCost.toLocaleString() + ' ₽';
        if (totalEl) totalEl.textContent = total.toLocaleString() + ' ₽';
        
    } catch (error) {
        console.error('❌ Ошибка обновления стоимости:', error);
    }
}

function submitOrder() {
    if (!window.authManager || !window.authManager.isAuthenticated()) {
        alert('Пожалуйста, войдите в систему');
        window.location.href = 'login.html';
        return;
    }
    
    const user = window.authManager.currentUser;
    
    // Проверяем адрес для доставки
    const deliveryType = document.querySelector('input[name="delivery"]:checked')?.value;
    if ((deliveryType === 'delivery' || deliveryType === 'installation') && 
        (!user.address || user.address.trim() === '')) {
        
        if (confirm('Для доставки требуется указать адрес. Перейти в профиль для заполнения?')) {
            window.location.href = 'personal.html';
        }
        return;
    }
    
    alert('Заказ оформлен! В ближайшее время с вами свяжется менеджер.');
    
    // Закрываем модальное окно
    const modal = document.getElementById('orderModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}