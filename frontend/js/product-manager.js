// product-manager.js - Управление кнопками на страницах товаров
class ProductManager {
    constructor() {
        this.currentProduct = null;
        this.init();
    }
    
    init() {
        console.log('📦 Инициализация ProductManager...');
        this.detectProductType();
        this.setupEventListeners();
        this.setupOrderModal();
    }
    
    detectProductType() {
        // Определяем тип товара по URL или другим признакам
        const url = window.location.href;
        this.isLaminate = url.includes('laminate') || 
                         url.includes('laminate-product.html') ||
                         (typeof window.isLaminateProduct !== 'undefined' && window.isLaminateProduct);
        
        console.log('📋 Тип товара:', this.isLaminate ? 'Ламинат' : 'Двери');
        
        // Загружаем данные товара
        this.loadProductData();
    }
    
    loadProductData() {
        // Получаем ID товара из URL
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        
        if (productId) {
            // Можно загрузить данные товара через PocketBase
            window.currentProductId = productId;
            this.currentProduct = {
                id: productId,
                name: document.querySelector('.product-title, h1')?.textContent || 'Товар',
                price: this.getProductPrice(),
                image: this.getProductImage()
            };
        }
    }
    
    getProductPrice() {
        // Пробуем найти цену на странице
        const priceElement = document.querySelector('.product-price, .price, [class*="price"], .laminate-price');
        if (priceElement) {
            const text = priceElement.textContent || '';
            const match = text.match(/(\d[\d\s]*)/);
            if (match) {
                return parseFloat(match[1].replace(/\s/g, ''));
            }
        }
        return 0;
    }
    
    getProductImage() {
        // Пробуем найти основное изображение
        const imgElement = document.querySelector('.gallery-main__image, .product-image, .main-image');
        return imgElement ? imgElement.src : '';
    }
    
    setupEventListeners() {
        // Кнопка "Оформить заказ" для дверей
        const orderBtn = document.getElementById('orderBtn');
        if (orderBtn) {
            orderBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openOrderModal();
            });
        }
        
        // Кнопка конструктора для ламината
        const constructorBtn = document.querySelector('.btn-constructor, [onclick*="constructor"]');
        if (constructorBtn) {
            // Убираем inline onclick и добавляем обработчик
            constructorBtn.removeAttribute('onclick');
            constructorBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openConstructor();
            });
        }
    }
    
    setupOrderModal() {
        // Обработчики для модального окна заказа
        const closeBtn = document.getElementById('closeOrderModal');
        const cancelBtn = document.getElementById('cancelOrder');
        const submitBtn = document.getElementById('submitOrder');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeOrderModal());
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeOrderModal());
        }
        
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submitOrder());
        }
        
        // Обработчики для количества
        const qtyMinus = document.querySelector('.qty-minus');
        const qtyPlus = document.querySelector('.qty-plus');
        const qtyInput = document.getElementById('orderQuantity');
        
        if (qtyMinus) {
            qtyMinus.addEventListener('click', () => this.changeQuantity(-1));
        }
        
        if (qtyPlus) {
            qtyPlus.addEventListener('click', () => this.changeQuantity(1));
        }
        
        if (qtyInput) {
            qtyInput.addEventListener('input', () => this.updateOrderSummary());
        }
        
        // Обработчики для доставки
        document.querySelectorAll('input[name="delivery"]').forEach(radio => {
            radio.addEventListener('change', () => this.handleDeliveryChange());
        });
        
        // Закрытие по клику на оверлей
        const modal = document.getElementById('orderModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeOrderModal();
                }
            });
        }
    }
    
    openOrderModal() {
        if (!window.authManager || !window.authManager.isAuthenticated()) {
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
            return;
        }
        
        const modal = document.getElementById('orderModal');
        if (!modal) {
            console.error('❌ Модальное окно заказа не найдено');
            return;
        }
        
        // Заполняем информацию о товаре
        this.fillOrderModal();
        
        // Сбрасываем значения по умолчанию
        document.getElementById('orderQuantity').value = 1;
        document.querySelector('input[name="delivery"][value="pickup"]').checked = true;
        document.getElementById('serviceWarranty')?.checked = false;
        document.getElementById('serviceAssembly')?.checked = false;
        
        // Скрываем поле адреса
        const addressContainer = document.getElementById('deliveryAddress');
        if (addressContainer) {
            addressContainer.style.display = 'none';
        }
        
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
        // Заполняем информацией о товаре
        document.getElementById('orderProductName').textContent = this.currentProduct?.name || 'Товар';
        document.getElementById('orderProductPrice').textContent = 
            (this.currentProduct?.price || 0).toLocaleString() + ' ₽';
        
        // Загружаем изображение
        if (this.currentProduct?.image) {
            document.getElementById('orderProductImage').src = this.currentProduct.image;
        }
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
        const deliveryType = document.querySelector('input[name="delivery"]:checked')?.value;
        const addressContainer = document.getElementById('deliveryAddress');
        
        if (addressContainer) {
            if (deliveryType === 'delivery' || deliveryType === 'installation') {
                addressContainer.style.display = 'block';
            } else {
                addressContainer.style.display = 'none';
            }
        }
        
        this.updateOrderSummary();
    }
    
    updateOrderSummary() {
        const quantity = parseInt(document.getElementById('orderQuantity')?.value) || 1;
        const price = this.currentProduct?.price || 0;
        const productTotal = price * quantity;
        
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
        const warranty = document.getElementById('serviceWarranty');
        const assembly = document.getElementById('serviceAssembly');
        
        if (warranty?.checked) servicesCost += 500;
        if (assembly?.checked) servicesCost += 1000;
        
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
        if (!this.currentProduct) {
            this.showNotification('Товар не найден', 'error');
            return;
        }
        
        if (!window.authManager || !window.authManager.currentUser) {
            this.showNotification('Войдите в систему', 'error');
            return;
        }
        
        // Проверяем адрес пользователя
        const user = window.authManager.currentUser;
        const address = user.address || user.adress;
        const deliveryType = document.querySelector('input[name="delivery"]:checked')?.value;
        
        // Проверяем адрес для доставки
        if ((deliveryType === 'delivery' || deliveryType === 'installation') && 
            (!address || address.trim() === '')) {
            // Показываем модальное окно для ввода адреса
            if (window.userProfile) {
                window.userProfile.showAddressModal('product', this.currentProduct);
            } else {
                this.showNotification('Укажите адрес в профиле', 'error');
                window.location.href = 'personal.html';
            }
            return;
        }
        
        const quantity = parseInt(document.getElementById('orderQuantity')?.value) || 1;
        const warranty = document.getElementById('serviceWarranty')?.checked || false;
        const assembly = document.getElementById('serviceAssembly')?.checked || false;
        
        try {
            // Рассчитываем стоимость
            const unitPrice = this.currentProduct.price || 0;
            const productTotal = unitPrice * quantity;
            
            // Стоимость доставки
            let deliveryCost = 0;
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
            if (warranty) servicesCost += 500;
            if (assembly) servicesCost += 1000;
            
            const totalCost = productTotal + deliveryCost + servicesCost;
            
            // Данные заказа
            const orderData = {
                user: user.id,
                product: this.currentProduct.id,
                product_name: this.currentProduct.name,
                quantity: quantity,
                unit_price: unitPrice,
                total_price: totalCost,
                delivery_type: deliveryType || 'pickup',
                delivery_address: address || '',
                warranty_service: warranty,
                assembly_service: assembly,
                status: 'pending'
            };
            
            // Отправляем заказ
            const pb = new PocketBase('http://127.0.0.1:8090');
            const order = await pb.collection('orders').create(orderData);
            
            // Закрываем модальное окно
            this.closeOrderModal();
            
            // Показываем уведомление
            this.showNotification(`Заказ оформлен! Номер: #${order.id.slice(0, 8)}`, 'success');
            
            // Перенаправляем в профиль
            setTimeout(() => {
                window.location.href = 'personal.html#orders';
            }, 2000);
            
        } catch (error) {
            console.error('❌ Ошибка оформления заказа:', error);
            this.showNotification('Ошибка оформления заказа', 'error');
        }
    }
    
    openConstructor() {
        // Открываем конструктор для ламината
        alert('Конструктор ламината будет реализован позже');
        // window.location.href = 'constructor.html';
    }
    
    showNotification(message, type = 'info') {
        if (window.authManager?.showNotification) {
            window.authManager.showNotification(message, type);
        } else {
            // Простое уведомление
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
                color: white;
                border-radius: 10px;
                z-index: 10000;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            `;
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => notification.remove(), 3000);
        }
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    window.productManager = new ProductManager();
});