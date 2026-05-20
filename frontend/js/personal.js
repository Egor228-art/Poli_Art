// personal.js - Управление профилем пользователя (ОБНОВЛЕННЫЙ)

class UserProfile {
    constructor() {
        this.pb = null;
        this.currentUser = null;
        this.cart = [];
        this.orders = [];
        this.userReviews = [];
        this.reviewableProducts = [];
        this.originalUserData = {};
        this.userCartStorageKey = null; // Ключ для хранения корзины конкретного пользователя
        
        this.init();
    }

    // Добавьте метод для получения ключа корзины
    getCartStorageKey() {
        if (!this.currentUser || !this.currentUser.id) {
            return 'guest_cart';
        }
        return `user_cart_${this.currentUser.id}`;
    }

    init() {
        console.log('👤 Инициализация профиля пользователя...');
        
        // Инициализируем PocketBase
        if (typeof PocketBase !== 'undefined') {
            this.pb = new PocketBase('http://127.0.0.1:8090');
        } else {
            console.error('❌ PocketBase не загружен');
            return;
        }

        // Проверяем авторизацию
        this.checkAuth();
        
        // Загружаем данные
        this.loadUserData();
        this.loadCart();
        this.loadOrders();
        this.loadUserReviews();
        
        // Настраиваем обработчики
        this.setupEventListeners();
    }

    async checkAuth() {
        if (!this.pb.authStore.isValid) {
            console.log('🚪 Пользователь не авторизован, перенаправляем...');
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
            return;
        }
        
        this.currentUser = this.pb.authStore.model;
    }

    // ДОБАВЛЕНО: Метод расчета суммы корзины
    calculateCartTotal() {
        let total = 0;
        
        this.cart.forEach(item => {
            // Стоимость товара
            let itemTotal = (item.price || 0) * (item.quantity || 1);
            
            // Дополнительные услуги
            if (item.warranty_service) itemTotal += 500;
            if (item.assembly_service) itemTotal += 1000;
            
            // ВАЖНО: НЕ добавляем доставку для каждого товара!
            // Доставка считается ОДИН РАЗ для всего заказа
            total += itemTotal;
        });
        
        // Добавляем доставку ОДИН РАЗ для всего заказа
        const deliveryType = this.getDeliveryTypeForCart();
        if (deliveryType === 'delivery') {
            total += 500;
        } else if (deliveryType === 'installation') {
            total += 1500;
        }
        // 'pickup' - бесплатно, ничего не добавляем
        
        return total;
    }

    // ДОБАВЛЕНО: Генерация номера заказа
    generateOrderNumber() {
        const now = new Date();
        const dateStr = now.getFullYear().toString() + 
                       (now.getMonth() + 1).toString().padStart(2, '0') + 
                       now.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        return `ORDER-${dateStr}-${random}`;
    }

    async getReviewableProducts() {
        try {
            // Получаем заказы со статусом "оплачено" или "доставлено"
            const response = await this.pb.collection('orders').getList(1, 100, {
                filter: `user = "${this.currentUser.id}" && (status = "оплачено" || status = "доставлено" || status = "delivered" || status = "оплачен")`,
                sort: '-created',
            });

            const reviewableProducts = [];
            const seenProducts = new Set(); // Для избежания дубликатов
            
            if (response.items && response.items.length > 0) {
                response.items.forEach(order => {
                    try {
                        let products = [];
                        if (typeof order.products === 'string') {
                            products = JSON.parse(order.products) || [];
                        } else {
                            products = order.products || [];
                        }
                        
                        // Добавляем товары из заказа в список доступных для отзыва
                        products.forEach(product => {
                            // Проверяем, оставил ли пользователь уже отзыв на этот товар
                            const hasReviewed = this.userReviews.some(review => 
                                review.product_id === product.id || 
                                review.product === product.name ||
                                (review.product && review.product.id === product.id)
                            );
                            
                            // Создаем уникальный ключ для товара
                            const productKey = `${product.id}_${order.id}`;
                            
                            if (!hasReviewed && !seenProducts.has(productKey)) {
                                seenProducts.add(productKey);
                                
                                reviewableProducts.push({
                                    id: product.id,
                                    name: product.name || `Товар из заказа #${order.order_number}`,
                                    image: product.image || 'img/no-image.jpg',
                                    price: product.price || 0,
                                    quantity: product.quantity || 1,
                                    order_id: order.id,
                                    order_number: order.order_number,
                                    order_date: order.created,
                                    product_type: product.product_type || product.collection || 'unknown',
                                    // Добавляем больше информации о заказе
                                    order_status: order.status,
                                    payment_method: order.payment_method,
                                    delivery_address: order.delivery_address
                                });
                            }
                        });
                        
                    } catch (e) {
                        console.error('Ошибка парсинга товаров заказа:', e);
                    }
                });
            }
            
            console.log('Товары доступные для отзыва:', reviewableProducts.length);
            return reviewableProducts;
            
        } catch (error) {
            console.error('❌ Ошибка загрузки товаров для отзыва:', error);
            return [];
        }
    }

    // ОБНОВЛЕНО: Создание заказа из корзины
    async createOrder() {
        if (this.cart.length === 0) {
            this.showNotification('Корзина пуста', 'error');
            return;
        }
        
        // Получаем выбранный способ оплаты
        const paymentRadio = document.querySelector('input[name="paymentMethod"]:checked');
        let paymentMethod = 'наличные'; // По умолчанию

        if (paymentRadio) {
            if (paymentRadio.value === 'card') {
                paymentMethod = 'карта';
            } else if (paymentRadio.value === 'cash') {
                paymentMethod = 'наличные';
            }
        }

        console.log('💳 Выбран способ оплаты:', paymentMethod);
        
        // Обновляем способ оплаты для всех товаров в корзине
        this.cart.forEach(item => {
            item.payment_method = paymentMethod;
        });
        
        // Проверяем что у всех товаров есть адреса
        const itemsWithoutAddress = this.cart.filter(item => {
            // Для самовывоза адрес не требуется
            if (item.delivery_type === 'pickup') {
                return false; // Самовывоз - пропускаем проверку
            }
            // Для доставки и установки проверяем адрес
            return !item.delivery_address?.trim();
        });

        if (itemsWithoutAddress.length > 0) {
            this.showNotification(`У ${itemsWithoutAddress.length} товаров не указан адрес доставки`, 'error');
            return;
        }
        
        // ГРУППИРУЕМ ТОВАРЫ ПО АДРЕСАМ
        const groupedByAddress = {};
        
        this.cart.forEach(item => {
            const address = item.delivery_address.trim();
            if (!groupedByAddress[address]) {
                groupedByAddress[address] = [];
            }
            groupedByAddress[address].push(item);
        });
        
        const addressCount = Object.keys(groupedByAddress).length;
        const totalItems = this.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        
        // Подтверждение
        if (!confirm(`Оформить ${addressCount} заказа(ов) на ${totalItems} товар(ов)?\n\n${addressCount > 1 ? 'Товары будут разделены по адресам доставки.' : ''}`)) {
            return;
        }
        
        // Анимация кнопки
        const checkoutBtn = document.getElementById('checkoutBtn');
        const originalText = checkoutBtn ? checkoutBtn.innerHTML : '';
        if (checkoutBtn) {
            checkoutBtn.innerHTML = '<span>🔄 Оформление...</span>';
            checkoutBtn.disabled = true;
        }
        
        let successCount = 0;
        let errorCount = 0;
        
        try {
            // Для каждой группы адресов создаем отдельный заказ
            for (const [address, items] of Object.entries(groupedByAddress)) {
                try {
                    await this.createOrderForAddress(address, items);
                    successCount++;
                } catch (error) {
                    console.error(`❌ Ошибка создания заказа для адреса ${address}:`, error);
                    errorCount++;
                }
            }
            
            // ОЧИЩАЕМ КОРЗИНУ только если все заказы созданы
            if (errorCount === 0) {
                // 1. Очищаем массив в памяти
                this.cart = [];
                
                // 2. Удаляем корзину из localStorage с ПРАВИЛЬНЫМ ключом
                const cartKey = this.getCartStorageKey(); // ← user_cart_{id}
                localStorage.removeItem(cartKey);
                
                // 3. Также удаляем старый ключ для совместимости
                localStorage.removeItem('user_cart');
                
                // 4. Сохраняем пустую корзину (для синхронизации)
                this.saveCart();
                
                console.log('✅ Корзина полностью очищена. Ключ:', cartKey);
                
                // Обновляем UI
                this.updateCartUI();
                this.updateHeaderCartCounter();
            }
            
        } catch (error) {
            console.error('❌ Общая ошибка:', error);
            this.showNotification('Ошибка оформления заказов', 'error');
        } finally {
            // Восстанавливаем кнопку
            if (checkoutBtn) {
                checkoutBtn.innerHTML = originalText;
                checkoutBtn.disabled = false;
            }
        }
    }

    async createOrderForAddress(address, items) {
        // Преобразуем товары для сохранения в БД
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
            product_type: item.collection || 'unknown'
        }));
        
        // Рассчитываем общую стоимость для этой группы
        let totalAmount = 0;
        let deliveryType = 'pickup';
        
        items.forEach(item => {
            // Стоимость товара
            let itemTotal = (item.price || 0) * (item.quantity || 1);
            
            // Дополнительные услуги
            if (item.warranty_service) itemTotal += 500;
            if (item.assembly_service) itemTotal += 1000;
            
            totalAmount += itemTotal;
            
            // Определяем тип доставки (берем самый "дорогой" из группы)
            if (item.delivery_type === 'installation') {
                deliveryType = 'installation';
            } else if (item.delivery_type === 'delivery' && deliveryType !== 'installation') {
                deliveryType = 'delivery';
            }
        });
        
        // Добавляем стоимость доставки
        if (deliveryType === 'delivery') {
            totalAmount += 500;
        } else if (deliveryType === 'installation') {
            totalAmount += 1500;
        }
        
        // Определяем тип доставки для БД
        let deliveryTypeForDB = 'самовывоз';
        if (deliveryType === 'delivery') deliveryTypeForDB = 'доставка';
        if (deliveryType === 'installation') deliveryTypeForDB = 'установка';
        
        // Первый товар для связи
        const firstItem = items[0];
        
        // ============ ИСПРАВЛЕНИЕ: ПРАВИЛЬНО ОПРЕДЕЛЯЕМ СПОСОБ ОПЛАТЫ ============
        let paymentMethodForDB = 'наличные'; // По умолчанию
        
        // Проверяем значение payment_method у первого товара
        const rawPaymentMethod = items[0]?.payment_method;
        
        if (rawPaymentMethod === 'card' || rawPaymentMethod === 'карта' || rawPaymentMethod === 'Карта') {
            paymentMethodForDB = 'карта';
        } else if (rawPaymentMethod === 'cash' || rawPaymentMethod === 'наличные' || rawPaymentMethod === 'Наличные') {
            paymentMethodForDB = 'наличные';
        }
        
        // Также проверяем радио-кнопку на странице, если заказ оформляется сейчас
        if (!rawPaymentMethod) {
            const paymentRadio = document.querySelector('input[name="paymentMethod"]:checked');
            if (paymentRadio) {
                if (paymentRadio.value === 'card') {
                    paymentMethodForDB = 'карта';
                } else if (paymentRadio.value === 'cash') {
                    paymentMethodForDB = 'наличные';
                }
            }
        }
        
        console.log(`💳 Способ оплаты для БД: "${paymentMethodForDB}" (из значения: ${rawPaymentMethod || 'не указано'})`);
        
        // СОЗДАЕМ ЗАКАЗ В БД
        const orderData = {
            user: this.currentUser.id,
            products: JSON.stringify(validatedCart),
            product: firstItem.id,
            product_name: items.length > 1 ? 
                `${firstItem.name} и еще ${items.length - 1} товар(ов)` : 
                firstItem.name,
            total_price: totalAmount,
            status: 'ожидает',
            delivery_type: deliveryTypeForDB,
            delivery_address: address,
            payment_method: paymentMethodForDB, // ИСПРАВЛЕНО: теперь всегда 'карта' или 'наличные'
            order_number: this.generateOrderNumber(),
            order_date: new Date().toISOString().split('T')[0],
            customer_name: this.currentUser.name,
            customer_email: this.currentUser.email,
            customer_phone: this.currentUser.phone || '',
            notes: `Заказ оформлен из корзины. ${items.length} товар(ов)`
        };
        
        console.log(`Создаем заказ для адреса ${address}:`, orderData);
        
        const order = await this.pb.collection('orders').create(orderData);
        console.log(`✅ Заказ создан: ${order.order_number} для адреса ${address}, оплата: ${order.payment_method}`);
        
        // Сохраняем адрес в профиль если нужно
        const itemsToSaveAddress = items.filter(item => item.save_address);
        if (itemsToSaveAddress.length > 0) {
            try {
                await this.pb.collection('users').update(this.currentUser.id, {
                    address: address
                });
                console.log(`✅ Адрес сохранен в профиль: ${address}`);
            } catch (error) {
                console.warn('⚠️ Не удалось сохранить адрес в профиль:', error);
            }
        }

        try {
            const userId = this.currentUser.id;
            const key = `paid_products_${userId}`;
            let paidProducts = JSON.parse(localStorage.getItem(key)) || [];
            
            // Добавляем каждый товар из заказа в список оплаченных
            items.forEach(item => {
                if (!paidProducts.includes(item.id)) {
                    paidProducts.push(item.id);
                    console.log(`✅ Товар ${item.id} добавлен в список оплаченных`);
                }
            });
            
            localStorage.setItem(key, JSON.stringify(paidProducts));
            console.log('✅ Список оплаченных товаров сохранен в localStorage');
            
        } catch (e) {
            console.error('Ошибка сохранения в localStorage:', e);
        }
        
        return order;
    }

    // Также обновите getDeliveryTypeForCart для правильного преобразования
    getDeliveryTypeForCart() {
        // Берем самый "дорогой" тип доставки из всех товаров
        let deliveryType = 'pickup';
        
        this.cart.forEach(item => {
            if (item.delivery_type === 'installation') {
                deliveryType = 'installation'; // Установка - самый дорогой
            } else if (item.delivery_type === 'delivery' && deliveryType !== 'installation') {
                deliveryType = 'delivery'; // Доставка - средний
            }
            // 'pickup' - самый дешевый, остается если нет других
        });
        
        return deliveryType;
    }

    // ДОБАВЛЕНО: Обновление счетчика в хедере
    updateHeaderCartCounter() {
        const cartCount = this.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        
        // Обновляем в профиле
        document.getElementById('cartCount').textContent = cartCount;
        document.getElementById('cartBadge').textContent = cartCount;
        
        // Обновляем в хедере (если есть)
        const headerCounter = document.querySelector('.header-cart-count');
        if (headerCounter) {
            headerCounter.textContent = cartCount;
        }
    }

    async checkAddressBeforeOrder(orderType = 'single', productData = null) {
        // Если это самовывоз - адрес не нужен
        const deliveryType = document.querySelector('input[name="delivery"]:checked')?.value;
        
        if (deliveryType === 'pickup') {
            console.log('✅ Самовывоз - проверка адреса не требуется');
            return true; // Разрешаем оформление без адреса
        }
        
        // Проверяем, есть ли у пользователя адрес
        const addressInput = document.getElementById('address');
        const userAddress = addressInput ? addressInput.value.trim() : this.currentUser.address || '';
        
        if (!userAddress) {
            // Показываем модальное окно с просьбой указать адрес
            this.showAddressModal(orderType, productData);
            return false;
        }
        return true;
    }

    showAddressModal(orderType, productData = null) {
        // Создаем модальное окно для ввода адреса
        const modalHTML = `
            <div class="modal-overlay" id="addressModal" style="display: flex;">
                <div class="modal modal--address">
                    <button class="modal-close" id="closeAddressModal">&times;</button>
                    <h2>Укажите адрес доставки</h2>
                    
                    <div class="modal-content">
                        <div class="address-alert">
                            <div class="alert-icon">📍</div>
                            <div class="alert-text">
                                <h3>Адрес не указан</h3>
                                <p>Для оформления заказа необходимо указать адрес доставки</p>
                            </div>
                        </div>
                        
                        <form id="addressForm" class="address-form">
                            <div class="form-group">
                                <label for="modalAddress">Адрес доставки *</label>
                                <textarea id="modalAddress" name="address" 
                                        placeholder="Введите полный адрес: город, улица, дом, квартира..." 
                                        rows="3" required></textarea>
                            </div>
                            
                            <div class="form-actions">
                                <button type="button" class="btn btn--secondary" id="cancelAddress">
                                    Позже
                                </button>
                                <button type="submit" class="btn btn--primary">
                                    Сохранить и продолжить
                                </button>
                            </div>
                        </form>
                        
                        <div class="address-note">
                            <p><strong>Примечание:</strong> Адрес будет сохранен в вашем профиле для будущих заказов</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Добавляем модальное окно на страницу
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Настраиваем обработчики
        this.setupAddressModalListeners(orderType, productData);
    }

    setupAddressModalListeners(orderType, productData) {
        // Закрытие модального окна
        document.getElementById('closeAddressModal')?.addEventListener('click', () => {
            this.closeAddressModal();
        });
        
        document.getElementById('cancelAddress')?.addEventListener('click', () => {
            this.closeAddressModal();
            this.showNotification('Заказ не оформлен. Укажите адрес в профиле', 'warning');
        });
        
        // Сохранение адреса
        document.getElementById('addressForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const address = document.getElementById('modalAddress').value.trim();
            
            if (!address) {
                this.showNotification('Пожалуйста, введите адрес', 'error');
                return;
            }
            
            try {
                // Сохраняем адрес
                await this.pb.collection('users').update(this.currentUser.id, {
                    address: address
                });
                
                // Обновляем данные пользователя
                this.currentUser.address = address;
                this.originalUserData.address = address;
                
                // Обновляем поле в форме
                const addressField = document.getElementById('address');
                if (addressField) {
                    addressField.value = address;
                }
                
                // Закрываем модальное окно
                this.closeAddressModal();
                
                this.showNotification('Адрес сохранен!', 'success');
                
                // Продолжаем оформление заказа
                setTimeout(() => {
                    if (orderType === 'profile') {
                        // Если заказ из профиля
                        this.createOrder();
                    } else if (orderType === 'product') {
                        // Если заказ со страницы товара
                        if (window.productPage?.submitOrderFromProduct) {
                            window.productPage.submitOrderFromProduct(productData);
                        }
                    }
                }, 1000);
                
            } catch (error) {
                console.error('❌ Ошибка сохранения адреса:', error);
                this.showNotification('Ошибка сохранения адреса', 'error');
            }
        });
    }

    async checkFileAccess() {
        try {
            // Проверяем доступ к файлам
            const testUrl = this.pb.files.getUrl(this.currentUser, this.currentUser.avatar);
            const response = await fetch(testUrl, { method: 'HEAD' });
            
            if (response.ok) {
                console.log('✅ Доступ к файлам разрешен');
                return true;
            } else {
                console.log('⚠️ Ограничен доступ к файлам');
                return false;
            }
        } catch (error) {
            console.log('⚠️ Не удалось проверить доступ к файлам:', error.message);
            return false;
        }
    }

    closeAddressModal() {
        const modal = document.getElementById('addressModal');
        if (modal) {
            modal.remove();
        }
        document.body.style.overflow = '';
    }

    async loadUserData() {
        if (!this.currentUser) return;

        try {
            // Получаем расширенные данные пользователя
            const user = await this.pb.collection('users').getOne(this.currentUser.id);
            
            console.log('👤 Данные пользователя из БД:', {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                phoneType: typeof user.phone,
                address: user.address,
                avatar: user.avatar,
                roles: user.roles
            });
            
            this.currentUser = user;
            
            // Сохраняем оригинальные данные для сравнения
            this.originalUserData = {
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || ''
            };
            
            // Обновляем UI
            this.updateUserInfo();
            
        } catch (error) {
            console.error('❌ Ошибка загрузки данных пользователя:', error);
        }
    }

    updateUserInfo() {
        // Обновляем аватар
        this.updateAvatar();
        
        // Обновляем текстовую информацию
        document.getElementById('userName').textContent = this.currentUser.name || 'Пользователь';
        document.getElementById('userEmail').textContent = this.currentUser.email || 'Не указан';
        document.getElementById('userRole').textContent = this.currentUser.roles === 'admin' ? 'Администратор' : 'Покупатель';
        
        // Форматируем телефон для отображения
        const rawPhone = this.currentUser.phone;
        let formattedPhone = 'Не указан';
        
        if (rawPhone) {
            const phoneStr = rawPhone.toString();
            if (phoneStr.length >= 10) {
                // Форматируем как +7 (XXX) XXX-XX-XX
                formattedPhone = `+7 (${phoneStr.substring(0, 3)}) ${phoneStr.substring(3, 6)}-${phoneStr.substring(6, 8)}-${phoneStr.substring(8, 10)}`;
            } else {
                // Если длина нестандартная, показываем как есть
                formattedPhone = `+7${phoneStr}`;
            }
        }
        
        // Обновляем телефон в информации профиля (если есть элемент)
        const phoneElement = document.getElementById('userPhone');
        if (phoneElement) {
            phoneElement.textContent = formattedPhone;
        }
        
        // Обновляем форму личных данных
        this.populatePersonalForm();
        
        // Обновляем инициалы в аватаре
        const name = this.currentUser.name || '';
        const initials = name.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2);
        document.getElementById('avatarInitials').textContent = initials || 'И';
    }

    updateAvatar() {
        const avatarPlaceholder = document.querySelector('.avatar-placeholder');
        const initials = document.getElementById('avatarInitials');
        
        if (!avatarPlaceholder || !initials) return;
        
        // Всегда показываем инициалы по умолчанию
        this.showAvatarInitials();
        
        // Если есть аватар в БД - пробуем загрузить
        const avatarUrl = this.currentUser.avatar;
        if (avatarUrl && avatarUrl !== '' && avatarUrl !== 'null') {
            console.log('📸 Загружаем аватар из БД:', avatarUrl);
            
            // Генерируем URL
            const avatarFullUrl = `http://127.0.0.1:8090/api/files/users/${this.currentUser.id}/${avatarUrl}`;
            
            // Пробуем загрузить
            const img = new Image();
            img.onload = () => {
                avatarPlaceholder.style.backgroundImage = `url(${avatarFullUrl})`;
                avatarPlaceholder.style.backgroundSize = 'cover';
                avatarPlaceholder.style.backgroundPosition = 'center';
                initials.style.display = 'none';
            };
            img.onerror = () => {
                // Если не загрузилось, оставляем инициалы
                console.log('⚠️ Аватар не загрузился');
            };
            img.src = avatarFullUrl;
        }
    }

    loadAvatarImage(avatarUrl) {
        const avatarPlaceholder = document.querySelector('.avatar-placeholder');
        const initials = document.getElementById('avatarInitials');
        
        const img = new Image();
        
        img.onload = () => {
            console.log('✅ Аватар загружен успешно');
            avatarPlaceholder.style.backgroundImage = `url(${avatarUrl}?t=${Date.now()})`;
            avatarPlaceholder.style.backgroundSize = 'cover';
            avatarPlaceholder.style.backgroundPosition = 'center';
            
            // Скрываем инициалы
            if (initials) {
                initials.style.display = 'none';
            }
        };
        
        img.onerror = (error) => {
            console.log('⚠️ Не удалось загрузить аватар, показываем инициалы');
            this.showAvatarInitials();
        };
        
        // Добавляем таймаут
        setTimeout(() => {
            if (!img.complete) {
                console.log('⏱️ Таймаут загрузки аватара');
            }
        }, 3000);
        
        img.src = avatarUrl;
    }

    showAvatarInitials() {
        const avatarPlaceholder = document.querySelector('.avatar-placeholder');
        const initials = document.getElementById('avatarInitials');
        
        if (!avatarPlaceholder || !initials) return;
        
        // Градиентный фон
        avatarPlaceholder.style.backgroundImage = 'linear-gradient(135deg, #eabb66 0%, #e74c3c 100%)';
        avatarPlaceholder.style.backgroundSize = 'cover';
        
        // Показываем инициалы
        initials.style.display = 'flex';
        
        const name = this.currentUser.name || 'Пользователь';
        const nameParts = name.split(' ').filter(p => p.length > 0);
        
        let initialsText = 'И';
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
        
        // ========== ВАЖНО: Правильно загружаем адрес ==========
        const addressField = document.getElementById('address');
        if (addressField) {
            const userAddress = this.currentUser.address || '';
            addressField.value = userAddress;
            console.log('📝 Загружен адрес в форму:', userAddress);
        }
    }

    openOrderModal() {
        console.log('Открытие модального окна заказа...');
        
        const modal = document.getElementById('orderModal');
        if (!modal) {
            console.error('❌ Модальное окно не найдено');
            return;
        }
        
        fillOrderModal();
        resetModalValues();
        
        // ========== ДОБАВЬТЕ ЭТОТ БЛОК ==========
        // Подтягиваем адрес из профиля
        const addressInput = document.getElementById('addressInput');
        if (addressInput) {
            if (window.authManager && window.authManager.currentUser) {
                const userAddress = window.authManager.currentUser.address;
                if (userAddress) {
                    addressInput.value = userAddress;
                    console.log('✅ Адрес из профиля подставлен:', userAddress);
                }
            }
        }
        // =======================================
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
            setupOrderModalHandlers();
            updateOrderSummary();
        }, 50);
    }

    async loadCart() {
        try {
            // Получаем ключ корзины для текущего пользователя
            const cartKey = this.getCartStorageKey();
            console.log('Загрузка корзины, ключ:', cartKey);
            
            const cart = localStorage.getItem(cartKey);
            
            if (cart) {
                let parsedCart = JSON.parse(cart);
                this.cart = parsedCart;
                console.log('🛒 Корзина загружена, товаров:', this.cart.length);
            } else {
                this.cart = [];
                console.log('🛒 Корзина пуста');
            }
            
            this.updateCartUI();
            
        } catch (error) {
            console.error('❌ Ошибка загрузки корзины:', error);
            this.cart = [];
            this.updateCartUI();
        }
    }

    determineProductType(productId, productName) {
        // Пытаемся определить тип по ID
        if (!productId && !productName) return 'door';
        
        // Проверяем по названию
        if (productName) {
            const name = productName.toLowerCase();
            if (name.includes('ламинат') || name.includes('clix') || name.includes('strong') || name.includes('cxs')) {
                return 'laminate';
            }
        }
        
        // Проверяем по формату ID (все ID ламината в вашей БД)
        // Это пример - подставьте реальные ID ламината из вашей БД
        const laminateIds = [
            '1km8b7yspdh1ior',
            'brr1r58weohe8lo', 
            'rjz4oq68gc8wqy2',
            'ncqz1uvd14a0s1o',
            'pbrc0j0pu3ac96q',
            'dxg0037jlacjd4t'
        ];
        
        if (productId && laminateIds.includes(productId.toString())) {
            return 'laminate';
        }
        
        return 'door';
    }

    // ОБНОВЛЕННАЯ ФУНКЦИЯ: Отображение корзины
    updateCartUI() {
        const cartItemsContainer = document.getElementById('cartItems');
        const cartSummary = document.getElementById('cartSummary');
        const cartCount = document.getElementById('cartCount');
        const cartBadge = document.getElementById('cartBadge');
        const totalItems = document.getElementById('totalItems');
        const totalPrice = document.getElementById('totalPrice');
        const finalPrice = document.getElementById('finalPrice');
        
        // ПРОСТАЯ ПРОВЕРКА - если корзина пуста
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
            cartCount.textContent = '0';
            cartBadge.textContent = '0';
            return;
        }

        // Подсчитываем общую стоимость
        let total = 0;
        let itemCount = 0;

        // Генерируем HTML для товаров в корзине
        const cartHTML = this.cart.map((item, index) => {
            // Рассчитываем стоимость товара
            let itemTotal = (item.price || 0) * (item.quantity || 1);
            let servicesText = [];
            
            // Дополнительные услуги
            if (item.warranty_service) {
                itemTotal += 500;
                servicesText.push('Гарантия +500 ₽');
            }
            if (item.assembly_service) {
                itemTotal += 1000;
                servicesText.push('Монтаж +1 000 ₽');
            }
            
            // Информация о доставке
            let deliveryText = '';
            if (item.delivery_type === 'delivery') {
                deliveryText = 'Доставка: 500 ₽';
            } else if (item.delivery_type === 'installation') {
                deliveryText = 'Доставка и монтаж: 1 500 ₽';
            } else {
                deliveryText = 'Самовывоз';
            }
            
            // АДРЕС ДОСТАВКИ ДЛЯ ЭТОГО ТОВАРА
            let addressText = item.delivery_address || 'Не указан';
            let addressBadge = addressText !== 'Не указан' ? 
                `<span class="address-badge" title="${addressText}">📍 Адрес указан</span>` : 
                `<span class="address-badge warning">⚠️ Нужен адрес</span>`;
            
            total += itemTotal;
            itemCount += (item.quantity || 1);
            
            return `
                <div class="cart-item" data-index="${index}">
                    <div class="cart-item__image">
                        <img src="${item.image || 'img/no-image.jpg'}" alt="${item.name || 'Товар'}" 
                            onerror="this.src='img/no-image.jpg'">
                    </div>
                    <div class="cart-item__info">
                        <h3 class="cart-item__title">${item.name || 'Товар без названия'}</h3>
                        <div class="cart-item__details">
                            <span>Артикул: ${item.code || 'N/A'}</span>
                            ${addressBadge}
                            ${item.color ? `<span> • Цвет: ${item.color}</span>` : ''}
                            ${servicesText.length > 0 ? `<div class="cart-services"><small>${servicesText.join(', ')}</small></div>` : ''}
                            <div class="cart-delivery"><small>${deliveryText}</small></div>
                        </div>
                        <button class="btn-change-address" onclick="userProfile.changeAddress(${index})" 
                                style="margin-top: 5px; font-size: 12px;">
                            ✏️ Изменить адрес
                        </button>
                        <div class="cart-item__quantity">
                            <button class="quantity-btn" onclick="userProfile.decreaseQuantity(${index})">-</button>
                            <span class="quantity-value">${item.quantity || 1}</span>
                            <button class="quantity-btn" onclick="userProfile.increaseQuantity(${index})">+</button>
                        </div>
                    </div>
                    <div class="cart-item__price">${itemTotal.toLocaleString()} ₽</div>
                    <div class="cart-item__actions">
                        <button class="cart-item__remove" onclick="userProfile.removeFromCart(${index})">
                            ✕ Удалить
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        cartItemsContainer.innerHTML = cartHTML;
        
        // Рассчитываем итоговую стоимость с доставкой
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
        
        // Обновляем суммарную информацию
        totalItems.textContent = itemCount;
        totalPrice.textContent = total.toLocaleString() + ' ₽';
        
        const deliveryCostElement = document.getElementById('deliveryCost');
        if (deliveryCostElement) {
            deliveryCostElement.textContent = deliveryText;
        }
        
        finalPrice.textContent = finalTotal.toLocaleString() + ' ₽';
        
        // Обновляем счетчики
        cartCount.textContent = itemCount;
        cartBadge.textContent = itemCount;
        
        this.updateHeaderCartCounter();
        cartSummary.style.display = 'block';
    }

    // ОБНОВЛЕННЫЕ МЕТОДЫ: Работа с корзиной по индексу
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
            // Получаем cart_id для отладки
            const cartId = this.cart[index]?.cart_id;
            console.log(`Удаляем товар с cart_id: ${cartId}`);
            
            this.cart.splice(index, 1);
            this.saveCart();
            this.updateCartUI();
        }
    }

    saveCart() {
        const cartKey = this.getCartStorageKey();
        localStorage.setItem(cartKey, JSON.stringify(this.cart));
        console.log('🛒 Корзина сохранена для пользователя:', this.currentUser?.email, 'Ключ:', cartKey, 'Товаров:', this.cart.length);
        
        // Отправляем событие обновления корзины
        document.dispatchEvent(new CustomEvent('cartUpdated', {
            detail: { count: this.cart.length, userId: this.currentUser?.id }
        }));
    }

    async loadOrders() {
        try {
            this.showLoading('orders');
            
            const response = await this.pb.collection('orders').getList(1, 50, {
                filter: `user = "${this.currentUser.id}"`,
                sort: '-created',
            });
            
            console.log('✅ Загружено заказов:', response.items.length);
            this.orders = response.items || [];
            this.updateOrdersUI();
            
        } catch (error) {
            console.error('❌ Ошибка загрузки заказов:', error);
            this.orders = [];
            this.updateOrdersUI();
            
            if (error.status === 403) {
                console.log('Нет прав доступа к заказам');
            }
        } finally {
            this.hideLoading('orders');
        }
    }

    showLoading(section) {
        const container = document.getElementById(section + 'Container') || 
                        document.getElementById(section + 'Tab');
        
        if (container) {
            const loadingHTML = `
                <div class="loading-overlay">
                    <div class="spinner"></div>
                    <p>Загрузка...</p>
                </div>
            `;
            
            const existing = container.querySelector('.loading-overlay');
            if (!existing) {
                container.insertAdjacentHTML('beforeend', loadingHTML);
            }
        }
    }

    hideLoading(section) {
        const container = document.getElementById(section + 'Container') || 
                        document.getElementById(section + 'Tab');
        
        if (container) {
            const loading = container.querySelector('.loading-overlay');
            if (loading) {
                loading.remove();
            }
        }
    }

    updateOrdersUI() {
        const ordersContainer = document.getElementById('ordersContainer');
        const ordersCount = document.getElementById('ordersCount');
        
        if (this.orders.length === 0) {
            ordersContainer.innerHTML = `
                <div class="orders-empty">
                    <div class="empty-icon">📦</div>
                    <h3>Заказов пока нет</h3>
                    <p>Совершите свой первый заказ!</p>
                </div>
            `;
            ordersCount.textContent = '0';
            return;
        }

        const ordersHTML = this.orders.map(order => {
            const date = new Date(order.created).toLocaleDateString('ru-RU');
            const statusText = this.getOrderStatusText(order.status);
            const statusClass = this.getOrderStatusClass(order.status);
            
            // Определяем, можно ли оставить отзыв для этого заказа
            const canReview = order.status === 'оплачено' || order.status === 'доставлено' || order.status === 'delivered';
            
            // Парсим товары из JSON
            let products = [];
            try {
                if (typeof order.products === 'string') {
                    products = JSON.parse(order.products) || [];
                } else {
                    products = order.products || [];
                }
            } catch (e) {
                console.error('Ошибка парсинга товаров:', e);
                products = [];
            }
            
            // Если products пустой, но есть order.product - создаем товар из него
            if (products.length === 0 && order.product) {
                products = [{
                    id: order.product,
                    name: order.product_name || 'Товар',
                    quantity: 1,
                    price: order.total_price,
                    // Определяем тип товара по ID или названию
                    collection: this.determineProductType(order.product, order.product_name)
                }];
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
                        <div><strong>Доставка:</strong> ${this.getDeliveryTypeText(order.delivery_type)}</div>
                        <div><strong>Адрес:</strong> ${order.delivery_address || 'Не указан'}</div>
                        <div><strong>Оплата:</strong> ${order.payment_method === 'карта' ? 'Картой' : 'Наличные'}</div>
                    </div>
                    
                    ${products.length > 0 ? `
                        <div class="order-products">
                            <h4>Товары в заказе:</h4>
                            ${products.map((product, idx) => {
                                // Проверяем, оставил ли пользователь уже отзыв на этот товар
                                const hasReviewed = this.userReviews.some(review => 
                                    review.product_id === product.id || 
                                    review.product === product.name ||
                                    (review.product && review.product.toString() === product.id.toString())
                                );
                                
                                // Определяем страницу товара в зависимости от типа
                                const productType = product.collection || product.product_type || this.determineProductType(product.id, product.name);
                                const productPage = productType === 'laminate' ? 'laminate-product.html' : 'product.html';
                                
                                return `
                                    <div class="order-product">
                                        <div>
                                            <span>${product.name || 'Товар ' + (idx + 1)}</span>
                                            <span class="product-quantity">${product.quantity || 1} шт.</span>
                                        </div>
                                        <div class="product-price">${(product.price || 0).toLocaleString()} ₽</div>
                                        ${canReview && !hasReviewed ? `
                                            <a href="${productPage}?id=${product.id}#reviews" class="btn-review-small">
                                                ✍️ Оставить отзыв
                                            </a>
                                        ` : ''}
                                        ${hasReviewed ? `
                                            <span class="reviewed-badge">✓ Отзыв оставлен</span>
                                        ` : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    ` : ''}
                    
                    <div class="order-total">Итого: ${order.total_price?.toLocaleString() || '0'} ₽</div>
                </div>
            `;
        }).join('');

        ordersContainer.innerHTML = ordersHTML;
        ordersCount.textContent = this.orders.length.toString();
    }

    getDeliveryTypeText(type) {
        const types = {
            'pickup': 'Самовывоз',
            'delivery': 'Доставка',
            'installation': 'Доставка и установка'
        };
        return types[type] || type;
    }

    getOrderStatusText(status) {
        const statuses = {
            'pending': 'Ожидает оплаты',
            'ожидает': 'Ожидает обработки',
            'processing': 'В обработке',
            'shipped': 'Отправлен',
            'delivered': 'Доставлен',
            'cancelled': 'Отменен'
        };
        return statuses[status] || status;
    }

    getOrderStatusClass(status) {
        const classes = {
            'pending': 'status-waiting',
            'ожидает': 'status-waiting',
            'processing': 'status-processing',
            'shipped': 'status-shipped',
            'delivered': 'status-delivered',
            'cancelled': 'status-cancelled'
        };
        return classes[status] || 'status-default';
    }

    async loadUserReviews() {
        try {
            // Загружаем отзывы на двери
            const doorsReviews = await this.pb.collection('reviews').getList(1, 50, {
                filter: `author_name = "${this.currentUser.name || this.currentUser.username}"`,
                sort: '-created'
            });

            // Загружаем отзывы на ламинат
            const laminateReviews = await this.pb.collection('reviews_laminate').getList(1, 50, {
                filter: `author_name = "${this.currentUser.name || this.currentUser.username}"`,
                sort: '-created'
            });

            this.userReviews = [...doorsReviews.items, ...laminateReviews.items];
            
            // Загружаем товары, доступные для отзыва
            this.reviewableProducts = await this.getReviewableProducts();
            
            this.updateReviewsUI();
            
        } catch (error) {
            console.error('❌ Ошибка загрузки отзывов:', error);
            this.userReviews = [];
            this.reviewableProducts = [];
        }
    }

    updateReviewsUI() {
        const reviewsContainer = document.getElementById('userReviews');
        const reviewsCount = document.getElementById('reviewsCount');
        
        // Сначала показываем доступные товары для отзыва
        let html = '';
        
        if (this.reviewableProducts && this.reviewableProducts.length > 0) {
            html += `
                <div class="reviewable-products-section">
                    <h3 style="margin-bottom: 20px; color: #2c3e50;">Товары для отзыва</h3>
                    <p style="margin-bottom: 20px; color: #7f8c8d; font-size: 14px;">
                        Вы можете оставить отзыв на товары из оплаченных заказов
                    </p>
                    <div class="reviewable-products-grid">
            `;
            
            this.reviewableProducts.forEach(product => {
                html += `
                    <div class="reviewable-product-card">
                        <div class="product-image">
                            <img src="${product.image || 'img/no-image.jpg'}" 
                                alt="${product.name}" 
                                onerror="this.src='img/no-image.jpg'">
                        </div>
                        <div class="product-info">
                            <h4>${product.name}</h4>
                            <div class="product-details">
                                <span class="order-info">Заказ #${product.order_number}</span>
                                <span class="product-price">${product.price?.toLocaleString() || '0'} ₽</span>
                            </div>
                            <button class="btn btn--primary btn--small" 
                                    onclick="userProfile.openReviewModal('${product.id}', '${product.name.replace(/'/g, "\\'")}', '${product.product_type}')">
                                Оставить отзыв
                            </button>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            `;
        }
        
        // Затем показываем уже оставленные отзывы
        if (this.userReviews.length === 0 && (!this.reviewableProducts || this.reviewableProducts.length === 0)) {
            html += `
                <div class="reviews-empty">
                    <div class="empty-icon">⭐</div>
                    <h3>Отзывов пока нет</h3>
                    <p>Оплатите заказ, чтобы оставить отзыв</p>
                    ${this.orders.length > 0 ? 
                        '<a href="#orders" class="btn btn--primary" onclick="userProfile.switchTab(\'orders\')">Перейти к заказам</a>' : 
                        '<p>У вас пока нет заказов</p>'
                    }
                </div>
            `;
        } else if (this.userReviews.length > 0) {
            html += `
                <h3 style="margin-bottom: 20px; color: #2c3e50;">Ваши отзывы</h3>
            `;
            
            const reviewsHTML = this.userReviews.map(review => {
                const date = new Date(review.created).toLocaleDateString('ru-RU');
                const ratingStars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
                const statusClass = review.approved ? 'status-approved' : 'status-pending';
                const statusText = review.approved ? 'Одобрен' : 'На модерации';
                
                return `
                    <div class="review-item">
                        <div class="review-header">
                            <div>
                                <div class="review-product">${review.product || 'Товар'}</div>
                                <div class="review-date">${date}</div>
                            </div>
                            <div class="review-rating" title="${review.rating} из 5">
                                ${ratingStars}
                            </div>
                        </div>
                        <div class="review-text">${review.text}</div>
                        <div class="review-status ${statusClass}">${statusText}</div>
                    </div>
                `;
            }).join('');
            
            html += reviewsHTML;
        }
        
        reviewsContainer.innerHTML = html;
        reviewsCount.textContent = this.userReviews.length.toString();
    }

    openReviewModal(productId, productName, productType = 'door') {
        // Создаем модальное окно для отзыва
        const modalHTML = `
            <div class="modal-overlay" id="reviewModal" style="display: flex;">
                <div class="modal modal--review">
                    <button class="modal-close" id="closeReviewModal">&times;</button>
                    <h2>Оставить отзыв</h2>
                    
                    <div class="modal-content">
                        <div class="product-info-review">
                            <h3>${productName}</h3>
                            <p>Пожалуйста, оцените товар и оставьте отзыв</p>
                        </div>
                        
                        <form id="reviewForm" class="review-form">
                            <input type="hidden" id="reviewProductId" value="${productId}">
                            <input type="hidden" id="reviewProductName" value="${productName}">
                            <input type="hidden" id="reviewProductType" value="${productType}">
                            
                            <div class="form-group">
                                <label>Оценка *</label>
                                <div class="rating-stars" id="ratingStars">
                                    <span class="star" data-rating="1">☆</span>
                                    <span class="star" data-rating="2">☆</span>
                                    <span class="star" data-rating="3">☆</span>
                                    <span class="star" data-rating="4">☆</span>
                                    <span class="star" data-rating="5">☆</span>
                                </div>
                                <input type="hidden" id="reviewRating" name="rating" value="5" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="reviewText">Отзыв *</label>
                                <textarea id="reviewText" name="text" rows="5" 
                                        placeholder="Поделитесь вашим мнением о товаре..." 
                                        required></textarea>
                                <div class="char-count"><span id="charCount">0</span>/500 символов</div>
                            </div>
                            
                            <div class="form-group">
                                <label for="reviewPros">Достоинства</label>
                                <textarea id="reviewPros" name="pros" rows="2" 
                                        placeholder="Что вам понравилось в товаре..."></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="reviewCons">Недостатки</label>
                                <textarea id="reviewCons" name="cons" rows="2" 
                                        placeholder="Что можно улучшить..."></textarea>
                            </div>
                            
                            <div class="form-actions">
                                <button type="button" class="btn btn--secondary" id="cancelReview">
                                    Отмена
                                </button>
                                <button type="submit" class="btn btn--primary">
                                    Отправить отзыв
                                </button>
                            </div>
                        </form>
                        
                        <div class="review-note">
                            <p><strong>Примечание:</strong> Все отзывы проходят модерацию. Отзыв будет опубликован после проверки администратором.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Добавляем модальное окно на страницу
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Настраиваем обработчики
        this.setupReviewModalListeners();
        
        // Инициализируем счетчик символов
        this.initReviewCharCounter();
    }

    // ДОБАВЛЕНО: Настройка обработчиков модального окна отзыва
    setupReviewModalListeners() {
        const modal = document.getElementById('reviewModal');
        
        // Закрытие модального окна
        document.getElementById('closeReviewModal')?.addEventListener('click', () => {
            this.closeReviewModal();
        });
        
        document.getElementById('cancelReview')?.addEventListener('click', () => {
            this.closeReviewModal();
        });
        
        // Обработка звезд рейтинга
        const stars = document.querySelectorAll('.rating-stars .star');
        stars.forEach(star => {
            star.addEventListener('click', (e) => {
                const rating = parseInt(e.target.dataset.rating);
                this.setRating(rating);
            });
        });
        
        // Сохранение отзыва
        document.getElementById('reviewForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitReview();
        });
    }

    // ДОБАВЛЕНО: Установка рейтинга
    setRating(rating) {
        const stars = document.querySelectorAll('.rating-stars .star');
        const ratingInput = document.getElementById('reviewRating');
        
        // Обновляем звезды
        stars.forEach((star, index) => {
            if (index < rating) {
                star.textContent = '★';
                star.style.color = '#f1c40f';
            } else {
                star.textContent = '☆';
                star.style.color = '#bdc3c7';
            }
        });
        
        // Обновляем скрытое поле
        ratingInput.value = rating;
    }

    // ДОБАВЛЕНО: Инициализация счетчика символов
    initReviewCharCounter() {
        const textarea = document.getElementById('reviewText');
        const charCount = document.getElementById('charCount');
        
        textarea.addEventListener('input', () => {
            const length = textarea.value.length;
            charCount.textContent = length;
            
            if (length > 500) {
                textarea.value = textarea.value.substring(0, 500);
                charCount.textContent = 500;
            }
            
            // Изменяем цвет при приближении к лимиту
            if (length > 450) {
                charCount.style.color = '#e74c3c';
            } else if (length > 400) {
                charCount.style.color = '#f39c12';
            } else {
                charCount.style.color = '#27ae60';
            }
        });
    }

    // ДОБАВЛЕНО: Отправка отзыва
    async submitReview() {
        const form = document.getElementById('reviewForm');
        const formData = new FormData(form);
        
        const reviewData = {
            product_id: formData.get('reviewProductId'),
            product: formData.get('reviewProductName'),
            product_type: formData.get('reviewProductType'),
            rating: parseInt(formData.get('rating')),
            text: formData.get('text'),
            pros: formData.get('pros') || '',
            cons: formData.get('cons') || '',
            author_name: this.currentUser.name,
            author_email: this.currentUser.email,
            approved: false, // По умолчанию не одобрен
            created: new Date().toISOString()
        };
        
        console.log('Отправка отзыва:', reviewData);
        
        try {
            // Определяем коллекцию в зависимости от типа товара
            const collection = reviewData.product_type === 'laminate' ? 'reviews_laminate' : 'reviews';
            
            // Отправляем отзыв в PocketBase
            const response = await this.pb.collection(collection).create(reviewData);
            console.log('✅ Отзыв отправлен:', response);
            
            // Обновляем список отзывов
            await this.loadUserReviews();
            
            // Закрываем модальное окно
            this.closeReviewModal();
            
            // Показываем уведомление
            this.showNotification('✅ Отзыв отправлен на модерацию!', 'success');
            
        } catch (error) {
            console.error('❌ Ошибка отправки отзыва:', error);
            this.showNotification('❌ Ошибка отправки отзыва', 'error');
        }
    }

    // ДОБАВЛЕНО: Закрытие модального окна отзыва
    closeReviewModal() {
        const modal = document.getElementById('reviewModal');
        if (modal) {
            modal.remove();
        }
        document.body.style.overflow = '';
    }

    setupEventListeners() {
        // Навигация по вкладкам
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });

        document.getElementById('avatarInput').addEventListener('change', (e) => {
            this.handleAvatarUpload(e.target.files[0]);
        });

        // Личные данные
        document.getElementById('personalForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updatePersonalInfo();
        });

        document.getElementById('cancelPersonal').addEventListener('click', () => {
            this.populatePersonalForm();
        });

        // Безопасность
        document.getElementById('securityForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.changePassword();
        });

        document.getElementById('newPassword').addEventListener('input', (e) => {
            this.checkPasswordStrength(e.target.value);
        });

        document.getElementById('confirmPassword').addEventListener('input', (e) => {
            this.checkPasswordMatch();
        });

        // Переключение видимости пароля
        document.querySelectorAll('.password-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const targetId = e.target.closest('.password-toggle').dataset.target;
                const input = document.getElementById(targetId);
                if (input.type === 'password') {
                    input.type = 'text';
                    e.target.textContent = '🙈';
                } else {
                    input.type = 'password';
                    e.target.textContent = '👁️';
                }
            });
        });

        // Оформление заказа из корзины - ИСПРАВЛЕННЫЙ ОБРАБОТЧИК
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                this.createOrder();
            });
        }

        // Выход из системы
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });
    }

    switchTab(tabName) {
        // Обновляем активные кнопки
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Показываем соответствующий контент
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabName + 'Tab');
        });

        // Если переключились на корзину, обновляем её
        if (tabName === 'cart') {
            this.updateCartUI();
        }
    }

    async updatePersonalInfo() {
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim();
        const phoneInput = document.getElementById('phone').value.trim();
        const address = document.getElementById('address').value.trim(); // Убедитесь, что это правильный ID

        // Собираем полное имя
        let fullName = firstName;
        if (lastName) {
            fullName += ' ' + lastName;
        }
        
        // Преобразуем телефон в числовой формат для сохранения
        let phoneNumber = null;
        if (phoneInput && phoneInput.trim() !== '') {
            // Убираем форматирование, оставляем только цифры
            phoneNumber = phoneInput.replace(/\D/g, '');
            
            // Если начинается с 7 или 8, обрабатываем
            if (phoneNumber.startsWith('8')) {
                phoneNumber = '7' + phoneNumber.substring(1);
            }
            if (phoneNumber.startsWith('7') && phoneNumber.length === 11) {
                phoneNumber = phoneNumber.substring(1);
            }
            
            // Преобразуем в число
            phoneNumber = parseInt(phoneNumber, 10);
            
            // Проверка на валидность номера
            if (isNaN(phoneNumber) || phoneNumber.toString().length < 10) {
                this.showNotification('Некорректный номер телефона', 'error');
                return;
            }
        }

        // Создаем объект с данными для обновления
        const newData = {
            name: fullName,
            email: email
        };
        
        // Добавляем адрес ТОЛЬКО если он изменился или есть значение
        if (address !== undefined) {
            newData.address = address || '';
            console.log('📝 Сохраняем адрес:', address);
        }
        
        // Добавляем телефон только если он заполнен
        if (phoneNumber) {
            newData.phone = phoneNumber;
        } else if (phoneInput === '') {
            newData.phone = null;
        }

        console.log('📤 Отправляемые данные для обновления:', newData);

        // Проверяем, есть ли изменения
        const hasChanges = Object.keys(newData).some(key => {
            const originalValue = this.originalUserData[key];
            const newValue = newData[key];
            
            if (key === 'phone') {
                const originalPhone = this.currentUser.phone;
                return originalPhone !== newData.phone;
            }
            
            return originalValue !== newValue;
        });

        if (!hasChanges) {
            this.showNotification('Нет изменений для сохранения', 'info');
            return;
        }

        try {
            // Проверяем email на уникальность если он изменился
            if (email !== this.originalUserData.email) {
                const existingUser = await this.pb.collection('users').getList(1, 1, {
                    filter: `email = "${email}" && id != "${this.currentUser.id}"`
                });
                
                if (existingUser.totalItems > 0) {
                    throw new Error('Этот email уже используется другим пользователем');
                }
            }

            // Обновляем данные пользователя
            const updatedUser = await this.pb.collection('users').update(this.currentUser.id, newData);
            
            console.log('✅ Данные обновлены:', updatedUser);
            
            // Обновляем локальные данные
            this.currentUser = updatedUser;
            this.originalUserData = {
                name: updatedUser.name || '',
                email: updatedUser.email || '',
                phone: updatedUser.phone || '',
                address: updatedUser.address || ''
            };
            
            // Обновляем UI
            this.updateUserInfo();
            
            // Обновляем форму (показываем сохранённые данные)
            this.populatePersonalForm();
            
            this.showNotification('Данные успешно обновлены', 'success');
            
        } catch (error) {
            console.error('❌ Ошибка обновления данных:', error);
            this.showNotification(error.message || 'Ошибка обновления данных', 'error');
        }
    }

    async changePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Проверяем совпадение паролей
        if (newPassword !== confirmPassword) {
            this.showNotification('Пароли не совпадают', 'error');
            return;
        }

        // Проверяем надежность пароля
        if (newPassword.length < 8) {
            this.showNotification('Пароль должен быть не менее 8 символов', 'error');
            return;
        }

        try {
            // Изменяем пароль
            await this.pb.collection('users').update(this.currentUser.id, {
                oldPassword: currentPassword,
                password: newPassword,
                passwordConfirm: confirmPassword
            });
            
            // Очищаем форму
            document.getElementById('securityForm').reset();
            document.querySelector('.password-strength').classList.remove('weak', 'medium', 'strong');
            document.getElementById('passwordMatch').innerHTML = '';
            
            // Показываем уведомление
            this.showNotification('Пароль успешно изменен', 'success');
            
        } catch (error) {
            console.error('❌ Ошибка изменения пароля:', error);
            this.showNotification('Неверный текущий пароль', 'error');
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
        
        if (strength >= 4) {
            text = 'отличный';
            className = 'strong';
        } else if (strength >= 3) {
            text = 'хороший';
            className = 'medium';
        } else if (strength >= 2) {
            text = 'средний';
            className = 'medium';
        }
        
        document.querySelector('.password-strength').className = `password-strength ${className}`;
        strengthText.textContent = text;
    }

    checkPasswordMatch() {
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const matchElement = document.getElementById('passwordMatch');
        
        if (!newPassword || !confirmPassword) {
            matchElement.innerHTML = '';
            matchElement.className = 'password-match';
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

    logout() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            // Очищаем localStorage при выходе (опционально - можно оставить)
            // const userId = this.currentUser?.id;
            // if (userId) {
            //     localStorage.removeItem(`paid_products_${userId}`);
            // }
            
            this.pb.authStore.clear();
            window.location.href = 'index.html';
        }
    }

    showNotification(message, type = 'info') {
        // Проверяем, есть ли уже уведомление
        const existingNotification = document.querySelector('.auth-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
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
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 3000);
    }
    
    changeAddress(index) {
        const item = this.cart[index];
        if (!item) return;
        
        const newAddress = prompt('Введите новый адрес доставки для этого товара:', 
                                item.delivery_address || '');
        
        if (newAddress !== null) {
            item.delivery_address = newAddress.trim();
            this.saveCart();
            this.updateCartUI();
            this.showNotification('Адрес обновлен', 'success');
        }
    }
}

// Создаем глобальный экземпляр
let userProfile = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 Загружаем профиль пользователя...');
    userProfile = new UserProfile();
    
    // Экспортируем для глобального использования
    window.userProfile = userProfile;
});

// Вспомогательные функции для корзины
window.addToCartFromProduct = async function(productData) {
    try {
        // Проверяем авторизацию
        if (!window.authManager || !window.authManager.isAuthenticated()) {
            // Если не авторизован, сохраняем в гостевую корзину
            const guestCart = JSON.parse(localStorage.getItem('guest_cart')) || [];
            productData.cart_id = `${productData.collection}_${productData.id}_${Date.now()}`;
            guestCart.push(productData);
            localStorage.setItem('guest_cart', JSON.stringify(guestCart));
            
            // Предлагаем авторизоваться
            if (confirm('Товар добавлен в корзину. Хотите войти в систему для сохранения корзины?')) {
                window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
            }
            return true;
        }
        
        // Загружаем корзину для текущего пользователя
        if (!window.userProfile) {
            console.error('Профиль пользователя не инициализирован');
            return false;
        }
        
        // Добавляем товар в корзину профиля
        productData.cart_id = `${productData.collection}_${productData.id}_${Date.now()}`;
        productData.product_type = productData.collection === 'laminate' ? 'laminate' : 'door';
        
        // Проверяем, есть ли уже такой товар
        const existingIndex = window.userProfile.cart.findIndex(item => 
            item.cart_id && item.cart_id.startsWith(productData.collection + '_') && 
            item.id === productData.id &&
            item.delivery_type === productData.delivery_type &&
            item.warranty_service === productData.warranty_service &&
            item.assembly_service === productData.assembly_service
        );
        
        if (existingIndex !== -1) {
            // Увеличиваем количество
            window.userProfile.cart[existingIndex].quantity = 
                (window.userProfile.cart[existingIndex].quantity || 1) + (productData.quantity || 1);
        } else {
            // Добавляем новый товар
            window.userProfile.cart.push(productData);
        }
        
        // Сохраняем корзину
        window.userProfile.saveCart();
        window.userProfile.updateCartUI();
        
        console.log('Товар добавлен в корзину пользователя:', productData);
        
        this.showNotification('Товар добавлен в корзину', 'success');
        return true;
        
    } catch (error) {
        console.error('Ошибка добавления в корзину:', error);
        this.showNotification('Ошибка добавления в корзину', 'error');
        return false;
    }
};

// Функция для обновления корзины после добавления товара
window.updateCartAfterAdd = function() {
    if (window.userProfile) {
        window.userProfile.loadCart();
    }
};

// Функция для отображения уведомления
window.showNotification = function(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `cart-notification cart-notification--${type}`;
    notification.innerHTML = `
        <div class="cart-notification__content">
            <span class="cart-notification__message">${message}</span>
            <button class="cart-notification__close">&times;</button>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
        color: white;
        padding: 0;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        max-width: 400px;
        transform: translateX(120%);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Анимация появления
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Кнопка закрытия
    const closeBtn = notification.querySelector('.cart-notification__close');
    closeBtn.addEventListener('click', function() {
        notification.style.transform = 'translateX(120%)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Автоматическое закрытие через 5 секунд
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(120%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
};

async function checkPocketBaseValues() {
    try {
        const pb = new PocketBase('http://127.0.0.1:8090');
        
        // Пробуем получить схему коллекции через API
        const response = await fetch('http://127.0.0.1:8090/api/collections/orders');
        const collectionInfo = await response.json();
        
        console.log('Информация о коллекции orders:', collectionInfo);
        
        // Ищем поле delivery_type в схеме
        if (collectionInfo.schema) {
            const deliveryField = collectionInfo.schema.find(field => field.name === 'delivery_type');
            if (deliveryField && deliveryField.options && deliveryField.options.values) {
                console.log('Допустимые значения для delivery_type:', deliveryField.options.values);
            }
        }
        
        // Пробуем создать тестовый заказ с разными значениями
        console.log('\nПробуем разные значения для полей:');
        
        const testValues = [
            { delivery_type: 'самовывоз', status: 'ожидает', payment_method: 'наличные' },
            { delivery_type: 'доставка', status: 'ожидает', payment_method: 'карта' },
            { delivery_type: 'установка', status: 'обрабатывается', payment_method: 'наличные' },
            { delivery_type: 'pickup', status: 'pending', payment_method: 'cash' }
        ];
        
        for (let i = 0; i < testValues.length; i++) {
            const testData = {
                user: 'test_user_id',
                products: '[]',
                total_price: 1000,
                ...testValues[i],
                delivery_address: 'Тестовый адрес',
                order_number: `TEST-${Date.now()}-${i}`
            };
            
            console.log(`\nТест ${i + 1} с данными:`, testData);
            
            try {
                const result = await pb.collection('orders').create(testData);
                console.log('✅ Успешно! Правильные значения:', testValues[i]);
                // Удаляем тестовый заказ
                await pb.collection('orders').delete(result.id);
                break;
            } catch (err) {
                console.log('❌ Ошибка:', err.data?.data || err.message);
            }
        }
        
    } catch (error) {
        console.error('Ошибка проверки:', error);
    }
}