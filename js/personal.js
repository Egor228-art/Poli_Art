// js/personal.js - ПЕРЕПИСАННАЯ ВЕРСИЯ (без PocketBase)

class UserProfile {
    constructor() {
        this.currentUser = null;
        this.cart = [];
        this.orders = [];
        this.userReviews = [];
        this.reviewableProducts = [];
        this.originalUserData = {};
        
        this.init();
    }

    async init() {
        console.log('👤 Инициализация профиля пользователя...');
        
        // Ждем apiClient
        if (!window.apiClient) {
            setTimeout(() => this.init(), 500);
            return;
        }
        
        await this.checkAuth();
        
        if (!this.currentUser) {
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
            return;
        }
        
        await this.loadUserData();
        await this.loadCart();
        await this.loadOrders();
        await this.loadUserReviews();
        
        this.setupEventListeners();
    }

    async checkAuth() {
        try {
            this.currentUser = await window.apiClient.getCurrentUser();
            if (this.currentUser) {
                console.log('👤 Пользователь авторизован:', this.currentUser.email);
            }
        } catch (error) {
            console.log('🚪 Пользователь не авторизован');
            this.currentUser = null;
        }
    }

    getCartStorageKey() {
        if (!this.currentUser || !this.currentUser.id) {
            return 'guest_cart';
        }
        return `user_cart_${this.currentUser.id}`;
    }

    async loadUserData() {
        if (!this.currentUser) return;

        try {
            // Сохраняем оригинальные данные
            this.originalUserData = {
                name: this.currentUser.name || '',
                email: this.currentUser.email || '',
                phone: this.currentUser.phone || '',
                address: this.currentUser.address || ''
            };
            
            this.updateUserInfo();
            
        } catch (error) {
            console.error('❌ Ошибка загрузки данных пользователя:', error);
        }
    }

    updateUserInfo() {
        // Обновляем текстовую информацию
        document.getElementById('userName').textContent = this.currentUser.name || 'Пользователь';
        document.getElementById('userEmail').textContent = this.currentUser.email || 'Не указан';
        document.getElementById('userRole').textContent = this.currentUser.role === 'admin' ? 'Администратор' : 'Покупатель';
        
        // Форматируем телефон для отображения
        const rawPhone = this.currentUser.phone;
        let formattedPhone = 'Не указан';
        
        if (rawPhone) {
            const phoneStr = rawPhone.toString();
            if (phoneStr.length >= 10) {
                formattedPhone = `+7 (${phoneStr.substring(0, 3)}) ${phoneStr.substring(3, 6)}-${phoneStr.substring(6, 8)}-${phoneStr.substring(8, 10)}`;
            } else if (phoneStr.length > 0) {
                formattedPhone = `+7${phoneStr}`;
            }
        }
        
        const phoneElement = document.getElementById('userPhone');
        if (phoneElement) {
            phoneElement.textContent = formattedPhone;
        }
        
        this.populatePersonalForm();
        this.updateAvatar();
    }

    updateAvatar() {
        const avatarPlaceholder = document.querySelector('.avatar-placeholder');
        const initials = document.getElementById('avatarInitials');
        
        if (!avatarPlaceholder || !initials) return;
        
        // Показываем инициалы
        avatarPlaceholder.style.background = 'linear-gradient(135deg, #eabb66 0%, #e74c3c 100%)';
        avatarPlaceholder.style.backgroundSize = 'cover';
        initials.style.display = 'flex';
        
        const name = this.currentUser.name || 'Пользователь';
        const nameParts = name.split(' ').filter(p => p.length > 0);
        
        let initialsText = '👤';
        if (nameParts.length >= 2) {
            initialsText = (nameParts[0][0] + nameParts[1][0]).toUpperCase();
        } else if (nameParts.length === 1) {
            initialsText = nameParts[0].substring(0, 2).toUpperCase();
        }
        
        initials.textContent = initialsText;
        initials.style.color = 'white';
        initials.style.fontWeight = 'bold';
        initials.style.fontSize = '20px';
    }

    populatePersonalForm() {
        const name = this.currentUser.name || '';
        const nameParts = name.split(' ');
        
        document.getElementById('firstName').value = nameParts[0] || '';
        document.getElementById('lastName').value = nameParts.slice(1).join(' ') || '';
        document.getElementById('email').value = this.currentUser.email || '';
        
        // Форматируем телефон для отображения
        const rawPhone = this.currentUser.phone;
        let formattedPhone = '';
        
        if (rawPhone) {
            const phoneStr = rawPhone.toString();
            if (phoneStr.length === 10) {
                formattedPhone = `+7 (${phoneStr.substring(0, 3)}) ${phoneStr.substring(3, 6)}-${phoneStr.substring(6, 8)}-${phoneStr.substring(8, 10)}`;
            } else if (phoneStr.length > 0) {
                formattedPhone = `+7${phoneStr}`;
            }
        }
        
        document.getElementById('phone').value = formattedPhone;
        
        const addressField = document.getElementById('address');
        if (addressField) {
            addressField.value = this.currentUser.address || '';
        }
    }

    async loadCart() {
        try {
            const cartKey = this.getCartStorageKey();
            const cart = localStorage.getItem(cartKey);
            
            if (cart) {
                this.cart = JSON.parse(cart);
                console.log('🛒 Корзина загружена, товаров:', this.cart.length);
            } else {
                this.cart = [];
            }
            
            this.updateCartUI();
            
        } catch (error) {
            console.error('❌ Ошибка загрузки корзины:', error);
            this.cart = [];
            this.updateCartUI();
        }
    }

    saveCart() {
        const cartKey = this.getCartStorageKey();
        localStorage.setItem(cartKey, JSON.stringify(this.cart));
        console.log('🛒 Корзина сохранена, товаров:', this.cart.length);
        
        document.dispatchEvent(new CustomEvent('cartUpdated', {
            detail: { count: this.cart.length, userId: this.currentUser?.id }
        }));
    }

    updateCartUI() {
        const cartItemsContainer = document.getElementById('cartItems');
        const cartSummary = document.getElementById('cartSummary');
        const cartCount = document.getElementById('cartCount');
        const cartBadge = document.getElementById('cartBadge');
        const totalItems = document.getElementById('totalItems');
        const totalPrice = document.getElementById('totalPrice');
        const finalPrice = document.getElementById('finalPrice');
        
        if (this.cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="cart-empty">
                    <div class="empty-icon">🛒</div>
                    <h3>Корзина пуста</h3>
                    <p>Добавьте товары из каталога</p>
                    <a href="catalog.html" class="btn btn--primary">Перейти в каталог</a>
                </div>
            `;
            cartSummary.style.display = 'none';
            if (cartCount) cartCount.textContent = '0';
            if (cartBadge) cartBadge.textContent = '0';
            return;
        }

        let total = 0;
        let itemCount = 0;

        const cartHTML = this.cart.map((item, index) => {
            let itemTotal = (item.price || 0) * (item.quantity || 1);
            let servicesText = [];
            
            if (item.warranty_service) {
                itemTotal += 500;
                servicesText.push('Гарантия +500 ₽');
            }
            if (item.assembly_service) {
                itemTotal += 1000;
                servicesText.push('Монтаж +1 000 ₽');
            }
            
            let deliveryText = '';
            if (item.delivery_type === 'delivery') {
                deliveryText = 'Доставка: 500 ₽';
            } else if (item.delivery_type === 'installation') {
                deliveryText = 'Доставка и монтаж: 1 500 ₽';
            } else {
                deliveryText = 'Самовывоз';
            }
            
            let addressText = item.delivery_address || 'Не указан';
            let addressBadge = addressText !== 'Не указан' ? 
                `<span class="address-badge" title="${this.escapeHtml(addressText)}">📍 Адрес указан</span>` : 
                `<span class="address-badge warning">⚠️ Нужен адрес</span>`;
            
            total += itemTotal;
            itemCount += (item.quantity || 1);
            
            return `
                <div class="cart-item" data-index="${index}">
                    <div class="cart-item__image">
                        <img src="${item.image || '/image/no-image.jpg'}" alt="${this.escapeHtml(item.name || 'Товар')}" onerror="this.src='/image/no-image.jpg'">
                    </div>
                    <div class="cart-item__info">
                        <h3 class="cart-item__title">${this.escapeHtml(item.name || 'Товар без названия')}</h3>
                        <div class="cart-item__details">
                            <span>Артикул: ${item.code || 'N/A'}</span>
                            ${addressBadge}
                            ${item.color ? `<span> • Цвет: ${this.escapeHtml(item.color)}</span>` : ''}
                            ${servicesText.length > 0 ? `<div class="cart-services"><small>${servicesText.join(', ')}</small></div>` : ''}
                            <div class="cart-delivery"><small>${deliveryText}</small></div>
                        </div>
                        <button class="btn-change-address" onclick="userProfile.changeAddress(${index})">✏️ Изменить адрес</button>
                        <div class="cart-item__quantity">
                            <button class="quantity-btn" onclick="userProfile.decreaseQuantity(${index})">-</button>
                            <span class="quantity-value">${item.quantity || 1}</span>
                            <button class="quantity-btn" onclick="userProfile.increaseQuantity(${index})">+</button>
                        </div>
                    </div>
                    <div class="cart-item__price">${itemTotal.toLocaleString()} ₽</div>
                    <div class="cart-item__actions">
                        <button class="cart-item__remove" onclick="userProfile.removeFromCart(${index})">✕ Удалить</button>
                    </div>
                </div>
            `;
        }).join('');

        cartItemsContainer.innerHTML = cartHTML;
        
        const deliveryType = this.getDeliveryTypeForCart();
        let deliveryCost = 0;
        let deliveryText = '';

        if (deliveryType === 'delivery') {
            deliveryCost = 500;
            deliveryText = '500 ₽';
        } else if (deliveryType === 'installation') {
            deliveryCost = 1500;
            deliveryText = '1 500 ₽';
        } else {
            deliveryText = 'Бесплатно';
        }

        const finalTotal = total + deliveryCost;
        
        if (totalItems) totalItems.textContent = itemCount;
        if (totalPrice) totalPrice.textContent = total.toLocaleString() + ' ₽';
        
        const deliveryCostElement = document.getElementById('deliveryCost');
        if (deliveryCostElement) {
            deliveryCostElement.textContent = deliveryText;
        }
        
        if (finalPrice) finalPrice.textContent = finalTotal.toLocaleString() + ' ₽';
        
        if (cartCount) cartCount.textContent = itemCount;
        if (cartBadge) cartBadge.textContent = itemCount;
        
        this.updateHeaderCartCounter();
        if (cartSummary) cartSummary.style.display = 'block';
    }

    getDeliveryTypeForCart() {
        let deliveryType = 'pickup';
        
        this.cart.forEach(item => {
            if (item.delivery_type === 'installation') {
                deliveryType = 'installation';
            } else if (item.delivery_type === 'delivery' && deliveryType !== 'installation') {
                deliveryType = 'delivery';
            }
        });
        
        return deliveryType;
    }

    updateHeaderCartCounter() {
        const cartCount = this.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        
        const headerCounter = document.querySelector('.cart-counter, .header-cart-count');
        if (headerCounter) {
            headerCounter.textContent = cartCount;
        }
        
        const cartBadge = document.getElementById('cartBadge');
        if (cartBadge) cartBadge.textContent = cartCount;
    }

    increaseQuantity(index) {
        if (this.cart[index]) {
            this.cart[index].quantity = (this.cart[index].quantity || 1) + 1;
            this.saveCart();
            this.updateCartUI();
        }
    }

    decreaseQuantity(index) {
        if (this.cart[index] && (this.cart[index].quantity || 1) > 1) {
            this.cart[index].quantity = (this.cart[index].quantity || 1) - 1;
            this.saveCart();
            this.updateCartUI();
        } else if (this.cart[index] && (this.cart[index].quantity || 1) === 1) {
            this.removeFromCart(index);
        }
    }

    removeFromCart(index) {
        if (confirm('Удалить товар из корзины?')) {
            this.cart.splice(index, 1);
            this.saveCart();
            this.updateCartUI();
        }
    }

    changeAddress(index) {
        const item = this.cart[index];
        if (!item) return;
        
        const newAddress = prompt('Введите новый адрес доставки для этого товара:', item.delivery_address || '');
        
        if (newAddress !== null) {
            item.delivery_address = newAddress.trim();
            this.saveCart();
            this.updateCartUI();
            this.showNotification('Адрес обновлен', 'success');
        }
    }

    async createOrder() {
        if (this.cart.length === 0) {
            this.showNotification('Корзина пуста', 'error');
            return;
        }
        
        // Проверяем способ оплаты
        const paymentRadio = document.querySelector('input[name="paymentMethod"]:checked');
        let paymentMethod = 'наличные';
        if (paymentRadio && paymentRadio.value === 'card') {
            paymentMethod = 'карта';
        }
        
        // Обновляем способ оплаты для всех товаров
        this.cart.forEach(item => {
            item.payment_method = paymentMethod;
        });
        
        // Проверяем адреса
        const itemsWithoutAddress = this.cart.filter(item => {
            if (item.delivery_type === 'pickup') return false;
            return !item.delivery_address?.trim();
        });

        if (itemsWithoutAddress.length > 0) {
            this.showNotification(`У ${itemsWithoutAddress.length} товаров не указан адрес доставки`, 'error');
            return;
        }
        
        // Группируем по адресам
        const groupedByAddress = {};
        this.cart.forEach(item => {
            const address = item.delivery_address.trim();
            if (!groupedByAddress[address]) groupedByAddress[address] = [];
            groupedByAddress[address].push(item);
        });
        
        const totalItems = this.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        
        if (!confirm(`Оформить заказ на ${totalItems} товар(ов)?`)) {
            return;
        }
        
        const checkoutBtn = document.getElementById('checkoutBtn');
        const originalText = checkoutBtn?.innerHTML || '';
        if (checkoutBtn) {
            checkoutBtn.innerHTML = '🔄 Оформление...';
            checkoutBtn.disabled = true;
        }
        
        let successCount = 0;
        let errorCount = 0;
        
        try {
            for (const [address, items] of Object.entries(groupedByAddress)) {
                try {
                    await this.createOrderForAddress(address, items);
                    successCount++;
                } catch (error) {
                    console.error(`Ошибка создания заказа для адреса ${address}:`, error);
                    errorCount++;
                }
            }
            
            if (errorCount === 0) {
                this.cart = [];
                const cartKey = this.getCartStorageKey();
                localStorage.removeItem(cartKey);
                this.saveCart();
                this.updateCartUI();
                this.showNotification(`✅ Заказ успешно оформлен!`, 'success');
            } else {
                this.showNotification(`⚠️ Оформлено ${successCount} из ${successCount + errorCount} заказов`, 'warning');
            }
            
        } catch (error) {
            console.error('Ошибка оформления заказа:', error);
            this.showNotification('❌ Ошибка оформления заказа', 'error');
        } finally {
            if (checkoutBtn) {
                checkoutBtn.innerHTML = originalText;
                checkoutBtn.disabled = false;
            }
        }
    }

    async createOrderForAddress(address, items) {
        const validatedCart = items.map(item => ({
            id: item.id || '',
            name: item.name || 'Товар без названия',
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 1,
            image: item.image || '',
            code: item.code || 'N/A',
            color: item.color || '',
            delivery_type: item.delivery_type || 'pickup',
            warranty_service: Boolean(item.warranty_service),
            assembly_service: Boolean(item.assembly_service),
            collection: item.collection || 'unknown'
        }));
        
        let totalAmount = 0;
        let deliveryType = 'pickup';
        
        items.forEach(item => {
            let itemTotal = (item.price || 0) * (item.quantity || 1);
            if (item.warranty_service) itemTotal += 500;
            if (item.assembly_service) itemTotal += 1000;
            totalAmount += itemTotal;
            
            if (item.delivery_type === 'installation') {
                deliveryType = 'installation';
            } else if (item.delivery_type === 'delivery' && deliveryType !== 'installation') {
                deliveryType = 'delivery';
            }
        });
        
        if (deliveryType === 'delivery') totalAmount += 500;
        if (deliveryType === 'installation') totalAmount += 1500;
        
        let deliveryTypeForDB = 'самовывоз';
        if (deliveryType === 'delivery') deliveryTypeForDB = 'доставка';
        if (deliveryType === 'installation') deliveryTypeForDB = 'установка';
        
        let paymentMethodForDB = 'наличные';
        const rawPaymentMethod = items[0]?.payment_method;
        if (rawPaymentMethod === 'card' || rawPaymentMethod === 'карта') {
            paymentMethodForDB = 'карта';
        }
        
        const orderData = {
            products: validatedCart,
            total_price: totalAmount,
            delivery_type: deliveryTypeForDB,
            delivery_address: address,
            payment_method: paymentMethodForDB,
            customer_name: this.currentUser.name,
            customer_phone: this.currentUser.phone || '',
            customer_email: this.currentUser.email,
            notes: `Заказ оформлен из корзины. ${items.length} товар(ов)`
        };
        
        console.log('Создание заказа:', orderData);
        
        const order = await window.apiClient.createOrder(orderData);
        console.log('✅ Заказ создан:', order);
        
        // Сохраняем адрес в профиль
        const itemsToSaveAddress = items.filter(item => item.save_address);
        if (itemsToSaveAddress.length > 0 && address) {
            try {
                await this.updateUserAddress(address);
            } catch (error) {
                console.warn('Не удалось сохранить адрес в профиль:', error);
            }
        }
        
        // Сохраняем в localStorage для отзывов
        const key = `paid_products_${this.currentUser.id}`;
        let paidProducts = JSON.parse(localStorage.getItem(key)) || [];
        items.forEach(item => {
            if (!paidProducts.includes(item.id)) {
                paidProducts.push(item.id);
            }
        });
        localStorage.setItem(key, JSON.stringify(paidProducts));
        
        return order;
    }

    async updateUserAddress(address) {
        if (!address || !this.currentUser) return false;
        
        try {
            const result = await window.apiClient.request('PUT', '/user/profile', {
                address: address
            });
            
            if (result && result.address) {
                this.currentUser.address = result.address;
                // Также обновляем в localStorage
                const cartKey = this.getCartStorageKey();
                const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
                cart.forEach(item => {
                    if (item.save_address) {
                        item.delivery_address = address;
                    }
                });
                localStorage.setItem(cartKey, JSON.stringify(cart));
                
                console.log('✅ Адрес сохранен в профиль:', result.address);
                return true;
            }
        } catch (error) {
            console.error('❌ Ошибка сохранения адреса:', error);
        }
        return false;
    }

    async loadOrders() {
        try {
            const orders = await window.apiClient.getOrders();
            console.log('✅ Загружено заказов:', orders.length);
            this.orders = orders;
            this.updateOrdersUI();
            
            const ordersCount = document.getElementById('ordersCount');
            if (ordersCount) ordersCount.textContent = orders.length.toString();
            
        } catch (error) {
            console.error('❌ Ошибка загрузки заказов:', error);
            this.orders = [];
            this.updateOrdersUI();
        }
    }

    updateOrdersUI() {
        const ordersContainer = document.getElementById('ordersContainer');
        if (!ordersContainer) return;
        
        if (this.orders.length === 0) {
            ordersContainer.innerHTML = `...`;
            return;
        }

        const ordersHTML = this.orders.map(order => {
            const date = new Date(order.created_at).toLocaleDateString('ru-RU');
            const statusText = this.getOrderStatusText(order.status);
            const statusClass = this.getOrderStatusClass(order.status);
            
            // Разрешаем отзыв только для доставленных заказов И если отзыв ещё не оставлен
            const canReview = (order.status === 'доставлен' || order.status === 'delivered');
            
            let products = [];
            if (typeof order.products === 'string') {
                try { products = JSON.parse(order.products); } catch(e) {}
            } else if (Array.isArray(order.products)) {
                products = order.products;
            }
            
            return `
                <div class="order-card">
                    <div class="order-header">
                        <div>
                            <div class="order-id">Заказ #${order.order_number || order.id.slice(0, 8)}</div>
                            <div class="order-date">${date}</div>
                        </div>
                        <div class="order-status ${statusClass}">${statusText}</div>
                    </div>
                    
                    <div class="order-customer">
                        <div><strong>Доставка:</strong> ${order.delivery_type || 'самовывоз'}</div>
                        <div><strong>Адрес:</strong> ${order.delivery_address || 'Не указан'}</div>
                        <div><strong>Оплата:</strong> ${order.payment_method === 'карта' ? 'Картой' : 'Наличные'}</div>
                    </div>
                    
                    ${products.length > 0 ? `
                        <div class="order-products">
                            <h4>Товары в заказе:</h4>
                            ${products.map((product, idx) => {
                                // ПРОВЕРКА: оставлял ли уже отзыв на этот товар
                                const hasReviewed = this.userReviews.some(review => 
                                    review.product_id === product.id
                                );
                                const productType = product.collection === 'laminate' ? 'laminate' : 'doors';
                                const productPage = productType === 'laminate' ? 'laminate-product.html' : 'product.html';
                                
                                return `
                                    <div class="order-product">
                                        <div>
                                            <span>${this.escapeHtml(product.name || 'Товар ' + (idx + 1))}</span>
                                            <span class="product-quantity">${product.quantity || 1} шт.</span>
                                            <a href="${productPage}?id=${product.id}" class="product-link" target="_blank">🔗</a>
                                        </div>
                                        <div class="product-price">${((product.price || 0) * (product.quantity || 1)).toLocaleString()} ₽</div>
                                        <div class="order-product-actions">
                                            ${canReview && !hasReviewed ? `
                                                <button class="btn-review-small" onclick="userProfile.openReviewForProduct('${product.id}', '${this.escapeHtml(product.name || 'Товар')}', '${productType}')">
                                                    ✍️ Оставить отзыв
                                                </button>
                                            ` : ''}
                                            ${hasReviewed ? `<span class="reviewed-badge">✓ Отзыв оставлен</span>` : ''}
                                            ${!canReview && order.status !== 'доставлен' ? `<span class="review-disabled-badge">🔒 Отзыв после доставки</span>` : ''}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    ` : ''}
                    
                    <div class="order-total">Итого: ${(order.total_price || 0).toLocaleString()} ₽</div>
                </div>
            `;
        }).join('');

        ordersContainer.innerHTML = ordersHTML;
    }

    openReviewForProduct(productId, productName, productType) {
        const self = this;
        const productIdValue = productId;
        const productNameValue = productName;
        const productTypeValue = productType;
        
        const modalHTML = `
            <div id="reviewModalWindow" style="position: fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.7); z-index:100000; display:flex; align-items:center; justify-content:center;">
                <div style="background:white; border-radius:20px; padding:30px; max-width:550px; width:90%; max-height:90vh; overflow-y:auto;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
                        <h2 style="margin:0; color:#2c3e50;">Оставить отзыв</h2>
                        <button onclick="closeReviewModalWindow()" style="background:none; border:none; font-size:28px; cursor:pointer; color:#999;">&times;</button>
                    </div>
                    
                    <div style="background:#f8f9fa; padding:15px; border-radius:12px; margin-bottom:20px;">
                        <strong>${this.escapeHtml(productNameValue)}</strong>
                    </div>
                    
                    <input type="hidden" id="reviewProductId" value="${productIdValue}">
                    <input type="hidden" id="reviewProductType" value="${productTypeValue}">
                    
                    <div style="margin-bottom:20px;">
                        <label style="display:block; margin-bottom:10px; font-weight:600;">Ваша оценка *</label>
                        <div style="display:flex; gap:15px;" id="ratingStarsSelector">
                            ${[1,2,3,4,5].map(i => `<span onclick="setRatingValue(${i})" data-rating="${i}" style="font-size:36px; cursor:pointer; color:#ddd;">☆</span>`).join('')}
                        </div>
                        <input type="hidden" id="reviewRatingValue" value="5">
                    </div>
                    
                    <div style="margin-bottom:20px;">
                        <label style="display:block; margin-bottom:10px; font-weight:600;">Достоинства</label>
                        <textarea id="reviewProsValue" rows="2" style="width:100%; padding:12px; border:2px solid #e0e0e0; border-radius:10px; resize:vertical;" placeholder="Что вам понравилось?"></textarea>
                    </div>
                    
                    <div style="margin-bottom:20px;">
                        <label style="display:block; margin-bottom:10px; font-weight:600;">Недостатки</label>
                        <textarea id="reviewConsValue" rows="2" style="width:100%; padding:12px; border:2px solid #e0e0e0; border-radius:10px; resize:vertical;" placeholder="Что можно улучшить?"></textarea>
                    </div>
                    
                    <div style="margin-bottom:20px;">
                        <label style="display:block; margin-bottom:10px; font-weight:600;">Ваш отзыв *</label>
                        <textarea id="reviewTextValue" rows="5" style="width:100%; padding:12px; border:2px solid #e0e0e0; border-radius:10px; resize:vertical;" placeholder="Поделитесь впечатлениями о товаре..." required></textarea>
                    </div>
                    
                    <div style="background:#e8f5e9; padding:15px; border-radius:12px; margin-bottom:25px;">
                        <p style="margin:0; font-size:14px; color:#2e7d32;">📝 Отзыв будет опубликован после проверки модератором</p>
                    </div>
                    
                    <div style="display:flex; gap:15px; justify-content:flex-end;">
                        <button type="button" onclick="closeReviewModalWindow()" style="padding:12px 24px; background:#f0f0f0; border:none; border-radius:10px; cursor:pointer;">Отмена</button>
                        <button id="submitReviewBtn" style="padding:12px 24px; background:#27ae60; color:white; border:none; border-radius:10px; cursor:pointer;">✍️ Отправить отзыв</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.body.style.overflow = 'hidden';
        
        window.setRatingValue = (rating) => {
            const stars = document.querySelectorAll('#ratingStarsSelector span');
            stars.forEach((star, index) => {
                if (index < rating) {
                    star.textContent = '★';
                    star.style.color = '#f1c40f';
                } else {
                    star.textContent = '☆';
                    star.style.color = '#ddd';
                }
            });
            document.getElementById('reviewRatingValue').value = rating;
        };
        window.setRatingValue(5);
        
        window.closeReviewModalWindow = () => {
            const modal = document.getElementById('reviewModalWindow');
            if (modal) {
                modal.remove();
                document.body.style.overflow = '';
            }
        };
        
        document.getElementById('submitReviewBtn').addEventListener('click', async () => {
            const productId = document.getElementById('reviewProductId').value;
            const productType = document.getElementById('reviewProductType').value;
            const rating = parseInt(document.getElementById('reviewRatingValue').value);
            const pros = document.getElementById('reviewProsValue').value.trim();
            const cons = document.getElementById('reviewConsValue').value.trim();
            const text = document.getElementById('reviewTextValue').value.trim();
            
            if (!text) {
                alert('Напишите отзыв');
                return;
            }
            
            const submitBtn = document.getElementById('submitReviewBtn');
            submitBtn.textContent = '⏳ Отправка...';
            submitBtn.disabled = true;
            
            try {
                await window.apiClient.createReview({
                    product_id: productId,
                    product_name: productNameValue,
                    rating: rating,
                    text: text,
                    pros: pros,
                    cons: cons,
                    isLaminate: productType === 'laminate'
                });
                
                alert('✅ Отзыв отправлен на модерацию!');
                window.closeReviewModalWindow();
                
                // Перезагружаем отзывы и заказы (кнопка пропадёт)
                await this.loadUserReviews();
                await this.loadOrders();
                
            } catch (error) {
                console.error('Ошибка:', error);
                alert('❌ Ошибка отправки отзыва');
                submitBtn.textContent = '✍️ Отправить отзыв';
                submitBtn.disabled = false;
            }
        });
    }

    getOrderStatusText(status) {
        const statuses = {
            'ожидает': 'Ожидает обработки',
            'обрабатывается': 'В обработке',
            'отправлен': 'Отправлен',
            'доставлен': 'Доставлен',
            'отменен': 'Отменен'
        };
        return statuses[status] || status;
    }

    getOrderStatusClass(status) {
        const classes = {
            'ожидает': 'status-waiting',
            'обрабатывается': 'status-processing',
            'отправлен': 'status-shipped',
            'доставлен': 'status-delivered',
            'отменен': 'status-cancelled'
        };
        return classes[status] || 'status-default';
    }

    async loadUserReviews() {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                this.userReviews = [];
                this.updateReviewsUI();
                return;
            }
            
            const response = await fetch('/api/user/reviews', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                this.userReviews = await response.json();
            } else {
                this.userReviews = [];
            }
            
            this.updateReviewsUI();
        } catch (error) {
            console.error('❌ Ошибка загрузки отзывов:', error);
            this.userReviews = [];
            this.updateReviewsUI();
        }
    }

    updateReviewsUI() {
        const reviewsContainer = document.getElementById('userReviews');
        const reviewsCount = document.getElementById('reviewsCount');
        
        if (!reviewsContainer) return;
        
        let html = '';
        
        if (this.userReviews.length === 0) {
            html = `
                <div class="reviews-empty">
                    <div class="empty-icon">⭐</div>
                    <h3>Отзывов пока нет</h3>
                    <p>Оставьте отзыв на товар из доставленного заказа</p>
                </div>
            `;
        } else {
            html = `<div class="reviews-list">`;
            html += this.userReviews.map(review => {
                const date = new Date(review.created_at).toLocaleDateString('ru-RU');
                const ratingStars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
                const statusClass = review.approved ? 'status-approved' : 'status-pending';
                const statusText = review.approved ? '✓ Одобрен' : '⏳ На проверке';
                const productType = review.product_type === 'laminate' ? 'laminate' : 'door';
                const productPage = productType === 'laminate' ? 'laminate-product.html' : 'product.html';
                
                return `
                    <div class="review-item">
                        <div class="review-header">
                            <div>
                                <div class="review-product">${this.escapeHtml(review.product_name || 'Товар')}</div>
                                <div class="review-date">${date}</div>
                            </div>
                            <div class="review-rating" title="${review.rating} из 5">${ratingStars}</div>
                        </div>
                        ${review.pros ? `<div class="review-pros"><strong>👍 Достоинства:</strong> ${this.escapeHtml(review.pros)}</div>` : ''}
                        ${review.cons ? `<div class="review-cons"><strong>👎 Недостатки:</strong> ${this.escapeHtml(review.cons)}</div>` : ''}
                        <div class="review-text">${this.escapeHtml(review.text)}</div>
                        <div class="review-status ${statusClass}">${statusText}</div>
                        ${review.approved ? `
                            <div class="review-link">
                                <a href="${productPage}?id=${review.product_id}#reviews" class="btn-review-link">🔗 Посмотреть отзыв на сайте</a>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');
            html += `</div>`;
        }
        
        reviewsContainer.innerHTML = html;
        if (reviewsCount) reviewsCount.textContent = this.userReviews.length.toString();
    }

    openReviewModal() {
        // Получаем список товаров, которые пользователь покупал
        this.getPurchasedProducts().then(products => {
            if (products.length === 0) {
                alert('У вас нет оплаченных заказов. Чтобы оставить отзыв, необходимо купить товар.');
                return;
            }
            
            // Создаём модальное окно с выбором товара
            const modalHTML = `
                <div id="reviewModalWindow" style="position: fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.7); z-index:100000; display:flex; align-items:center; justify-content:center;">
                    <div style="background:white; border-radius:20px; padding:30px; max-width:550px; width:90%; max-height:90vh; overflow-y:auto;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
                            <h2 style="margin:0; color:#2c3e50;">Оставить отзыв</h2>
                            <button onclick="closeReviewModalWindow()" style="background:none; border:none; font-size:28px; cursor:pointer; color:#999;">&times;</button>
                        </div>
                        
                        <div style="margin-bottom:20px;">
                            <label style="display:block; margin-bottom:10px; font-weight:600;">Выберите товар *</label>
                            <select id="reviewProductSelect" style="width:100%; padding:12px; border:2px solid #e0e0e0; border-radius:10px;">
                                <option value="">-- Выберите товар --</option>
                                ${products.map(p => `<option value="${p.id}" data-type="${p.type}">${this.escapeHtml(p.name)}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div style="margin-bottom:20px;">
                            <label style="display:block; margin-bottom:10px; font-weight:600;">Ваша оценка *</label>
                            <div style="display:flex; gap:15px;" id="ratingStarsSelector">
                                ${[1,2,3,4,5].map(i => `<span onclick="setRatingValue(${i})" data-rating="${i}" style="font-size:36px; cursor:pointer; color:#ddd;">☆</span>`).join('')}
                            </div>
                            <input type="hidden" id="reviewRatingValue" value="5">
                        </div>
                        
                        <div style="margin-bottom:20px;">
                            <label style="display:block; margin-bottom:10px; font-weight:600;">Достоинства</label>
                            <textarea id="reviewProsValue" rows="2" style="width:100%; padding:12px; border:2px solid #e0e0e0; border-radius:10px; resize:vertical;" placeholder="Что вам понравилось?"></textarea>
                        </div>
                        
                        <div style="margin-bottom:20px;">
                            <label style="display:block; margin-bottom:10px; font-weight:600;">Недостатки</label>
                            <textarea id="reviewConsValue" rows="2" style="width:100%; padding:12px; border:2px solid #e0e0e0; border-radius:10px; resize:vertical;" placeholder="Что можно улучшить?"></textarea>
                        </div>
                        
                        <div style="margin-bottom:20px;">
                            <label style="display:block; margin-bottom:10px; font-weight:600;">Ваш отзыв *</label>
                            <textarea id="reviewTextValue" rows="5" style="width:100%; padding:12px; border:2px solid #e0e0e0; border-radius:10px; resize:vertical;" placeholder="Поделитесь впечатлениями о товаре..." required></textarea>
                        </div>
                        
                        <div style="background:#e8f5e9; padding:15px; border-radius:12px; margin-bottom:25px;">
                            <p style="margin:0; font-size:14px; color:#2e7d32;">📝 Отзыв будет опубликован после проверки модератором</p>
                        </div>
                        
                        <div style="display:flex; gap:15px; justify-content:flex-end;">
                            <button type="button" onclick="closeReviewModalWindow()" style="padding:12px 24px; background:#f0f0f0; border:none; border-radius:10px; cursor:pointer;">Отмена</button>
                            <button id="submitReviewBtn" style="padding:12px 24px; background:#27ae60; color:white; border:none; border-radius:10px; cursor:pointer;">✍️ Отправить отзыв</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            document.body.style.overflow = 'hidden';
            
            window.setRatingValue = (rating) => {
                const stars = document.querySelectorAll('#ratingStarsSelector span');
                stars.forEach((star, index) => {
                    if (index < rating) {
                        star.textContent = '★';
                        star.style.color = '#f1c40f';
                    } else {
                        star.textContent = '☆';
                        star.style.color = '#ddd';
                    }
                });
                document.getElementById('reviewRatingValue').value = rating;
            };
            window.setRatingValue(5);
            
            window.closeReviewModalWindow = () => {
                const modal = document.getElementById('reviewModalWindow');
                if (modal) {
                    modal.remove();
                    document.body.style.overflow = '';
                }
            };
            
            document.getElementById('submitReviewBtn').addEventListener('click', async () => {
                const productId = document.getElementById('reviewProductSelect').value;
                const productName = document.getElementById('reviewProductSelect').selectedOptions[0]?.text;
                const productType = document.getElementById('reviewProductSelect').selectedOptions[0]?.dataset.type;
                const rating = parseInt(document.getElementById('reviewRatingValue').value);
                const pros = document.getElementById('reviewProsValue').value.trim();
                const cons = document.getElementById('reviewConsValue').value.trim();
                const text = document.getElementById('reviewTextValue').value.trim();
                
                if (!productId) {
                    alert('Выберите товар');
                    return;
                }
                if (!text) {
                    alert('Напишите отзыв');
                    return;
                }
                
                try {
                    await window.apiClient.createReview({
                        product_id: productId,
                        product_name: productName,
                        rating: rating,
                        text: text,
                        pros: pros,
                        cons: cons,
                        isLaminate: productType === 'laminate'
                    });
                    
                    alert('✅ Отзыв отправлен на модерацию!');
                    window.closeReviewModalWindow();
                    await this.loadUserReviews();
                    await this.loadOrders();
                    
                } catch (error) {
                    console.error('Ошибка:', error);
                    alert('❌ Ошибка отправки отзыва');
                }
            });
        });
    }

    async getPurchasedProducts() {
        try {
            if (!this.currentUser) return [];
            
            const orders = await window.apiClient.getOrders();
            const purchasedProducts = [];
            const seen = new Set();
            
            const PAID_STATUSES = ['оплачено', 'доставлено', 'delivered', 'оплачен', 'выполнен', 'доставлен'];
            
            for (const order of orders) {
                const status = (order.status || '').toLowerCase();
                const isPaid = PAID_STATUSES.some(s => status.includes(s.toLowerCase()));
                if (!isPaid) continue;
                
                let products = [];
                if (typeof order.products === 'string') {
                    try { products = JSON.parse(order.products); } catch(e) {}
                } else if (Array.isArray(order.products)) {
                    products = order.products;
                }
                
                for (const p of products) {
                    const productId = p.id || p.product_id || p.item_id || p.product;
                    if (productId && !seen.has(productId)) {
                        seen.add(productId);
                        purchasedProducts.push({
                            id: productId,
                            name: p.name || 'Товар',
                            type: p.collection === 'laminate' ? 'laminate' : 'doors'
                        });
                    }
                }
            }
            
            return purchasedProducts;
        } catch (error) {
            console.error('Ошибка получения купленных товаров:', error);
            return [];
        }
    }

    setupReviewModalListeners() {
        document.getElementById('closeReviewModal')?.addEventListener('click', () => this.closeReviewModal());
        document.getElementById('cancelReview')?.addEventListener('click', () => this.closeReviewModal());
        
        const stars = document.querySelectorAll('.rating-stars .star');
        stars.forEach(star => {
            star.addEventListener('click', (e) => {
                const rating = parseInt(e.target.dataset.rating);
                this.setRating(rating);
            });
        });
        
        document.getElementById('reviewForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitReview();
        });
    }

    setRating(rating) {
        const stars = document.querySelectorAll('.rating-stars .star');
        const ratingInput = document.getElementById('reviewRating');
        
        stars.forEach((star, index) => {
            if (index < rating) {
                star.textContent = '★';
                star.style.color = '#f1c40f';
            } else {
                star.textContent = '☆';
                star.style.color = '#bdc3c7';
            }
        });
        
        if (ratingInput) ratingInput.value = rating;
    }

    async submitReview() {
        const form = document.getElementById('reviewForm');
        const formData = new FormData(form);
        
        const reviewData = {
            product_id: formData.get('reviewProductId'),
            product_name: formData.get('reviewProductName'),
            rating: parseInt(formData.get('rating')),
            text: formData.get('text'),
            isLaminate: formData.get('reviewProductType') === 'laminate'
        };
        
        try {
            await window.apiClient.createReview(reviewData);
            
            this.closeReviewModal();
            this.showNotification('✅ Отзыв отправлен на модерацию!', 'success');
            
            setTimeout(() => {
                this.loadUserReviews();
                this.loadOrders();
            }, 2000);
            
        } catch (error) {
            console.error('❌ Ошибка отправки отзыва:', error);
            this.showNotification('❌ Ошибка отправки отзыва', 'error');
        }
    }

    closeReviewModal() {
        const modal = document.getElementById('reviewModal');
        if (modal) {
            modal.remove();
            document.body.style.overflow = '';
        }
    }

    async updatePersonalInfo() {
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim();
        const phoneInput = document.getElementById('phone').value.trim();
        const address = document.getElementById('address').value.trim();
        
        let fullName = firstName;
        if (lastName) fullName += ' ' + lastName;
        
        let phoneNumber = null;
        if (phoneInput && phoneInput.trim() !== '') {
            phoneNumber = phoneInput.replace(/\D/g, '');
            if (phoneNumber.startsWith('8')) phoneNumber = '7' + phoneNumber.substring(1);
            if (phoneNumber.startsWith('7') && phoneNumber.length === 11) phoneNumber = phoneNumber.substring(1);
            phoneNumber = parseInt(phoneNumber, 10);
            if (isNaN(phoneNumber) || phoneNumber.toString().length < 10) {
                this.showNotification('Некорректный номер телефона', 'error');
                return;
            }
        }
        
        try {
            // Обновляем через API
            const updateData = {};
            if (fullName !== this.currentUser.name) updateData.name = fullName;
            if (email !== this.currentUser.email) updateData.email = email;
            if (phoneNumber !== this.currentUser.phone) updateData.phone = phoneNumber;
            if (address !== this.currentUser.address) updateData.address = address;
            
            if (Object.keys(updateData).length > 0) {
                const result = await window.apiClient.updateProfile(updateData);
                this.currentUser = { ...this.currentUser, ...result };
                console.log('✅ Данные обновлены:', result);
            }
            
            this.updateUserInfo();
            this.showNotification('Данные успешно обновлены', 'success');
            
        } catch (error) {
            console.error('❌ Ошибка обновления данных:', error);
            this.showNotification('Ошибка обновления данных', 'error');
        }
    }

    async uploadAvatar(file) {
        if (!file) return;
        
        // Проверка типа файла
        if (!file.type.startsWith('image/')) {
            this.showNotification('Пожалуйста, выберите изображение', 'error');
            return;
        }
        
        // Проверка размера (максимум 2MB)
        if (file.size > 2 * 1024 * 1024) {
            this.showNotification('Файл слишком большой (максимум 2MB)', 'error');
            return;
        }
        
        const formData = new FormData();
        formData.append('avatar', file);
        
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/user/avatar', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            if (response.ok) {
                const result = await response.json();
                this.showNotification('Аватар успешно обновлен!', 'success');
                
                // Обновляем отображение аватара
                this.updateAvatarDisplay(result.avatar);
            } else {
                this.showNotification('Ошибка загрузки аватара', 'error');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            this.showNotification('Ошибка загрузки аватара', 'error');
        }
    }

    updateAvatarDisplay(avatarBase64) {
        const avatarPlaceholder = document.querySelector('.avatar-placeholder');
        const initials = document.getElementById('avatarInitials');
        
        if (avatarPlaceholder) {
            if (avatarBase64) {
                avatarPlaceholder.style.backgroundImage = `url(data:image/jpeg;base64,${avatarBase64})`;
                avatarPlaceholder.style.backgroundSize = 'cover';
                avatarPlaceholder.style.backgroundPosition = 'center';
                if (initials) initials.style.display = 'none';
            } else {
                // Сброс на инициалы
                avatarPlaceholder.style.backgroundImage = 'linear-gradient(135deg, #eabb66 0%, #e74c3c 100%)';
                if (initials) {
                    initials.style.display = 'flex';
                    initials.textContent = this.getUserInitials(this.currentUser?.name || 'Пользователь');
                }
            }
        }
    }

    getUserInitials(name) {
        if (!name) return '👤';
        const parts = name.split(' ').filter(p => p.length > 0);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    async changePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (newPassword !== confirmPassword) {
            this.showNotification('Пароли не совпадают', 'error');
            return;
        }
        
        if (newPassword.length < 6) {
            this.showNotification('Пароль должен быть не менее 6 символов', 'error');
            return;
        }
        
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/user/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: currentPassword,
                    newPassword: newPassword
                })
            });
            
            if (response.ok) {
                this.showNotification('Пароль успешно изменен!', 'success');
                document.getElementById('securityForm').reset();
                document.querySelector('.password-strength').className = 'password-strength weak';
                document.getElementById('passwordMatch').innerHTML = '';
            } else {
                const error = await response.json();
                this.showNotification(error.error || 'Ошибка смены пароля', 'error');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            this.showNotification('Ошибка смены пароля', 'error');
        }
    }

    checkPasswordStrength(password) {
        const strengthBar = document.querySelector('.strength-bar');
        const strengthText = document.querySelector('.strength-text span');
        
        let strength = 0;
        let text = 'слабый';
        let className = 'weak';
        
        if (password.length >= 8) strength += 1;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
        if (/\d/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;
        
        if (strength >= 4) { text = 'отличный'; className = 'strong'; }
        else if (strength >= 3) { text = 'хороший'; className = 'medium'; }
        else if (strength >= 2) { text = 'средний'; className = 'medium'; }
        
        const container = document.querySelector('.password-strength');
        if (container) {
            container.className = `password-strength ${className}`;
        }
        if (strengthText) strengthText.textContent = text;
    }

    checkPasswordMatch() {
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const matchElement = document.getElementById('passwordMatch');
        
        if (!matchElement) return;
        
        if (!newPassword || !confirmPassword) {
            matchElement.innerHTML = '';
            return;
        }
        
        if (newPassword === confirmPassword) {
            matchElement.innerHTML = '✓ Пароли совпадают';
            matchElement.className = 'password-match match';
        } else {
            matchElement.innerHTML = '✗ Пароли не совпадают';
            matchElement.className = 'password-match mismatch';
        }
    }

    switchTab(tabName) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabName + 'Tab');
        });
        
        if (tabName === 'cart') {
            this.updateCartUI();
        }
    }

    logout() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            if (window.apiClient) {
                window.apiClient.setToken(null);
            }
            if (window.authManager) {
                window.authManager.currentUser = null;
            }
            window.location.href = 'index.html';
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `auth-notification auth-notification--${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    setupEventListeners() {
        // Навигация по вкладкам
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });
        
        // Личные данные
        const personalForm = document.getElementById('personalForm');
        if (personalForm) {
            personalForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updatePersonalInfo();
            });
        }
        
        document.getElementById('cancelPersonal')?.addEventListener('click', () => {
            this.populatePersonalForm();
        });
        
        // Безопасность
        const securityForm = document.getElementById('securityForm');
        if (securityForm) {
            securityForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.changePassword();
            });
        }
        
        document.getElementById('newPassword')?.addEventListener('input', (e) => {
            this.checkPasswordStrength(e.target.value);
        });
        
        document.getElementById('confirmPassword')?.addEventListener('input', () => {
            this.checkPasswordMatch();
        });
        
        // Переключение видимости пароля
        document.querySelectorAll('.password-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const targetId = e.target.closest('.password-toggle').dataset.target;
                const input = document.getElementById(targetId);
                if (input) {
                    input.type = input.type === 'password' ? 'text' : 'password';
                    e.target.textContent = input.type === 'password' ? '👁️' : '🙈';
                }
            });
        });
        
        // Оформление заказа
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                this.createOrder();
            });
        }
        
        // Выход
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Глобальный экземпляр
let userProfile = null;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        userProfile = new UserProfile();
        window.userProfile = userProfile;
    }, 500);
});

// Добавь в конец файла personal.js
document.addEventListener('DOMContentLoaded', function() {
    const avatarInput = document.getElementById('avatarInput');
    if (avatarInput) {
        avatarInput.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            console.log('📸 Загрузка аватара:', file.name);
            
            const formData = new FormData();
            formData.append('avatar', file);
            
            try {
                const token = localStorage.getItem('auth_token');
                if (!token) {
                    console.error('❌ Не авторизован');
                    return;
                }
                
                // Сначала показываем локальный превью
                const reader = new FileReader();
                reader.onload = function(evt) {
                    const avatarPlaceholder = document.querySelector('.avatar-placeholder');
                    if (avatarPlaceholder) {
                        avatarPlaceholder.style.backgroundImage = `url(${evt.target.result})`;
                        avatarPlaceholder.style.backgroundSize = 'cover';
                        avatarPlaceholder.style.backgroundPosition = 'center';
                        const initials = document.getElementById('avatarInitials');
                        if (initials) initials.style.display = 'none';
                    }
                };
                reader.readAsDataURL(file);
                
                // TODO: Отправить на сервер (пока просто имитируем)
                // const response = await fetch('/api/user/avatar', {
                //     method: 'POST',
                //     headers: { 'Authorization': `Bearer ${token}` },
                //     body: formData
                // });
                
                setTimeout(() => {
                    console.log('✅ Аватар обновлен локально');
                }, 500);
                
            } catch (error) {
                console.error('❌ Ошибка:', error);
            }
        });
    }
});