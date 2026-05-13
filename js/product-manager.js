// product-manager.js - ОБНОВЛЕННАЯ ВЕРСИЯ:

// УПРОЩЕННЫЙ product-manager.js - ТОЛЬКО ДЛЯ МОДАЛЬНОГО ОКНА
document.addEventListener('DOMContentLoaded', function() {
    console.log('📦 Инициализация Product Manager...');
    
    // Простая функция для открытия модального окна
    function openProductOrderModal() {
        console.log('Открытие модального окна заказа...');
        
        const modal = document.getElementById('orderModal');
        if (!modal) {
            console.error('❌ Модальное окно заказа не найдено');
            return;
        }
        
        // Проверяем авторизацию
        if (window.authManager && !window.authManager.isAuthenticated?.()) {
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
            return;
        }
        
        // Заполняем информацию о товаре
        fillOrderModalInfo();
        
        // Показываем модальное окно
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Инициализируем обработчики
        setTimeout(() => {
            initOrderModalHandlers();
            updateOrderSummary();
        }, 100);
    }
    
    function closeProductOrderModal() {
        const modal = document.getElementById('orderModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }
    
    function fillOrderModalInfo() {
        // Получаем данные товара со страницы
        const productName = document.querySelector('.product-title')?.textContent || 'Товар';
        const productPrice = document.querySelector('.product-price .price-current')?.textContent || '0 ₽';
        const productImage = document.querySelector('.gallery-main__image')?.src || '';
        
        // Заполняем модальное окно
        document.getElementById('orderProductName').textContent = productName;
        document.getElementById('orderProductPrice').textContent = productPrice;
        
        if (productImage) {
            document.getElementById('orderProductImage').src = productImage;
        }
    }
    
    function initOrderModalHandlers() {
        // Закрытие
        document.getElementById('closeOrderModal')?.addEventListener('click', closeProductOrderModal);
        document.getElementById('cancelOrder')?.addEventListener('click', closeProductOrderModal);
        
        // Кнопки количества
        document.querySelector('.qty-minus')?.addEventListener('click', function() {
            changeQuantity(-1);
        });
        
        document.querySelector('.qty-plus')?.addEventListener('click', function() {
            changeQuantity(1);
        });
        
        document.getElementById('orderQuantity')?.addEventListener('input', updateOrderSummary);
        
        // Доставка
        document.querySelectorAll('input[name="delivery"]').forEach(radio => {
            radio.addEventListener('change', function() {
                handleDeliveryChange();
                updateOrderSummary();
            });
        });
        
        // Услуги
        document.getElementById('serviceWarranty')?.addEventListener('change', updateOrderSummary);
        document.getElementById('serviceAssembly')?.addEventListener('change', updateOrderSummary);
        
        // Отправка заказа
        document.getElementById('submitOrder')?.addEventListener('click', submitProductOrder);
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
    
    function handleDeliveryChange() {
        const deliveryType = document.querySelector('input[name="delivery"]:checked')?.value;
        const addressContainer = document.getElementById('deliveryAddress');
        
        if (addressContainer) {
            if (deliveryType === 'delivery' || deliveryType === 'installation') {
                addressContainer.style.display = 'block';
            } else {
                addressContainer.style.display = 'none';
            }
        }
    }
    
    function updateOrderSummary() {
        const quantity = parseInt(document.getElementById('orderQuantity')?.value) || 1;
        const priceElement = document.getElementById('orderProductPrice');
        const priceText = priceElement?.textContent || '0';
        const price = parseInt(priceText.replace(/[^\d]/g, '')) || 0;
        
        const productTotal = price * quantity;
        
        // Доставка
        let deliveryCost = 0;
        const deliveryType = document.querySelector('input[name="delivery"]:checked')?.value;
        
        if (deliveryType === 'delivery') deliveryCost = 500;
        if (deliveryType === 'installation') deliveryCost = 1500;
        
        // Услуги
        let servicesCost = 0;
        if (document.getElementById('serviceWarranty')?.checked) servicesCost += 500;
        if (document.getElementById('serviceAssembly')?.checked) servicesCost += 1000;
        
        const totalCost = productTotal + deliveryCost + servicesCost;
        
        // Обновляем отображение
        if (document.getElementById('summaryProduct')) {
            document.getElementById('summaryProduct').textContent = productTotal.toLocaleString() + ' ₽';
        }
        
        if (document.getElementById('summaryDelivery')) {
            document.getElementById('summaryDelivery').textContent = 
                deliveryCost === 0 ? 'Бесплатно' : deliveryCost.toLocaleString() + ' ₽';
        }
        
        if (document.getElementById('summaryServices')) {
            document.getElementById('summaryServices').textContent = 
                servicesCost === 0 ? '—' : servicesCost.toLocaleString() + ' ₽';
        }
        
        if (document.getElementById('summaryTotal')) {
            document.getElementById('summaryTotal').textContent = totalCost.toLocaleString() + ' ₽';
        }
    }
    
    function submitProductOrder() {
        console.log('Отправка заказа...');
        
        // Здесь будет логика отправки заказа
        alert('Заказ оформлен! Функциональность будет реализована позже.');
        closeProductOrderModal();
    }
    
    // Назначаем обработчик кнопке заказа
    const orderBtn = document.getElementById('orderBtn');
    if (orderBtn) {
        // Удаляем старый обработчик
        const newBtn = orderBtn.cloneNode(true);
        orderBtn.parentNode.replaceChild(newBtn, orderBtn);
        
        // Добавляем новый
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openProductOrderModal();
        });
        
        console.log('✅ Обработчик кнопки заказа установлен');
    }
    
    // Создаем глобальные функции
    window.openProductOrderModal = openProductOrderModal;
    window.closeProductOrderModal = closeProductOrderModal;
});