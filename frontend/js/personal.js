// profile.js - Управление профилем пользователя

class UserProfile {
    constructor() {
        this.pb = null;
        this.currentUser = null;
        this.cart = [];
        this.orders = [];
        this.userReviews = [];
        this.originalUserData = {};
        
        this.init();
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

    async checkAddressBeforeOrder(orderType = 'single', productData = null) {
        // Проверяем, есть ли у пользователя адрес
        if (!this.currentUser.address || this.currentUser.address.trim() === '') {
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
                        window.productPage?.submitOrderFromProduct(productData);
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
        
        // Получаем телефон из базы данных и форматируем для отображения
        const rawPhone = this.currentUser.phone;
        let formattedPhone = '';
        
        if (rawPhone) {
            // Преобразуем число в строку
            const phoneStr = rawPhone.toString();
            
            // Форматируем как +7 (XXX) XXX-XX-XX если длина 10
            if (phoneStr.length === 10) {
                formattedPhone = `+7 (${phoneStr.substring(0, 3)}) ${phoneStr.substring(3, 6)}-${phoneStr.substring(6, 8)}-${phoneStr.substring(8, 10)}`;
            } else if (phoneStr.length > 0) {
                // Просто добавляем +7 если номер нестандартный
                formattedPhone = `+7${phoneStr}`;
            }
        }
        
        document.getElementById('phone').value = formattedPhone;
        
        // Используем правильное поле для адреса
        document.getElementById('address').value = this.currentUser.address || '';
    }

    async loadCart() {
        try {
            const cart = localStorage.getItem('user_cart');
            if (cart) {
                this.cart = JSON.parse(cart);
                this.updateCartUI();
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки корзины:', error);
            this.cart = [];
        }
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
            cartCount.textContent = '0';
            cartBadge.textContent = '0';
            return;
        }

        // Подсчитываем общую стоимость
        let total = 0;
        let itemCount = 0;

        // Генерируем HTML для товаров в корзине
        const cartHTML = this.cart.map(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            itemCount += item.quantity;
            
            return `
                <div class="cart-item" data-product-id="${item.id}">
                    <div class="cart-item__image">
                        <img src="${item.image}" alt="${item.name}">
                    </div>
                    <div class="cart-item__info">
                        <h3 class="cart-item__title">${item.name}</h3>
                        <div class="cart-item__details">
                            <span>Артикул: ${item.code || 'N/A'}</span>
                            <span> • Цвет: ${item.color || 'Не указан'}</span>
                        </div>
                        <div class="cart-item__quantity">
                            <button class="quantity-btn" onclick="userProfile.decreaseQuantity('${item.id}')">-</button>
                            <span class="quantity-value">${item.quantity}</span>
                            <button class="quantity-btn" onclick="userProfile.increaseQuantity('${item.id}')">+</button>
                        </div>
                    </div>
                    <div class="cart-item__price">${itemTotal.toLocaleString()} ₽</div>
                    <div class="cart-item__actions">
                        <button class="cart-item__remove" onclick="userProfile.removeFromCart('${item.id}')">
                            Удалить
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        cartItemsContainer.innerHTML = cartHTML;
        
        // Обновляем суммарную информацию
        totalItems.textContent = itemCount;
        totalPrice.textContent = total.toLocaleString() + ' ₽';
        finalPrice.textContent = total.toLocaleString() + ' ₽';
        
        // Обновляем счетчики
        cartCount.textContent = itemCount;
        cartBadge.textContent = itemCount;
        
        // Показываем блок с итогами
        cartSummary.style.display = 'block';
    }

    increaseQuantity(productId) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            item.quantity += 1;
            this.saveCart();
            this.updateCartUI();
        }
    }

    decreaseQuantity(productId) {
        const item = this.cart.find(item => item.id === productId);
        if (item && item.quantity > 1) {
            item.quantity -= 1;
            this.saveCart();
            this.updateCartUI();
        } else if (item && item.quantity === 1) {
            this.removeFromCart(productId);
        }
    }

    removeFromCart(productId) {
        if (confirm('Удалить товар из корзины?')) {
            this.cart = this.cart.filter(item => item.id !== productId);
            this.saveCart();
            this.updateCartUI();
        }
    }

    saveCart() {
        localStorage.setItem('user_cart', JSON.stringify(this.cart));
    }

    async loadOrders() {
        try {
            // Показываем индикатор загрузки
            this.showLoading('orders');
            
            // Проверяем, есть ли у пользователя заказы
            const response = await this.pb.collection('orders').getList(1, 50, {
                filter: `user = "${this.currentUser.id}"`,
                sort: '-created',
                // Не используем expand чтобы избежать 403
            });
            
            console.log('✅ Загружено заказов:', response.items.length);
            this.orders = response.items || [];
            this.updateOrdersUI();
            
        } catch (error) {
            console.error('❌ Ошибка загрузки заказов:', error);
            
            if (error.status === 403) {
                console.log('ℹ️ 403 ошибка, проверяем права в PocketBase');
                // Показываем пустой список заказов
                this.orders = [];
                this.updateOrdersUI();
                
                // Показываем сообщение пользователю
                this.showNotification('Заказы временно недоступны. Пожалуйста, попробуйте позже.', 'warning');
            } else if (error.status === 404) {
                console.log('ℹ️ Таблица заказов не найдена');
                this.orders = [];
                this.updateOrdersUI();
            } else {
                this.showNotification('Ошибка загрузки заказов', 'error');
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
            
            return `
                <div class="order-card">
                    <div class="order-header">
                        <div>
                            <div class="order-id">Заказ #${order.id.slice(0, 8)}</div>
                            <div class="order-date">${date}</div>
                        </div>
                        <div class="order-status ${statusClass}">${statusText}</div>
                    </div>
                    
                    <div class="order-customer">
                        <div><strong>Доставка:</strong> ${this.getDeliveryTypeText(order.delivery_type)}</div>
                        <div><strong>Адрес:</strong> ${order.delivery_address || 'Не указан'}</div>
                        ${order.warranty_service ? '<div><strong>⚠️ Расширенная гарантия</strong></div>' : ''}
                        ${order.assembly_service ? '<div><strong>🔧 Установка</strong></div>' : ''}
                    </div>
                    
                    ${products.length > 0 ? `
                        <div class="order-products">
                            ${products.map(product => `
                                <div class="order-product">
                                    <span>${product.name || 'Товар'}</span>
                                    <span>${product.quantity || 1} шт. × ${product.price || 0} ₽</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    <div class="order-total">Итого: ${order.total_price?.toLocaleString() || order.unit_price || '0'} ₽</div>
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
            'processing': 'В обработке',
            'shipped': 'Отправлен',
            'delivered': 'Доставлен',
            'cancelled': 'Отменен'
        };
        return statuses[status] || status;
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
            this.updateReviewsUI();
            
        } catch (error) {
            console.error('❌ Ошибка загрузки отзывов:', error);
            this.userReviews = [];
        }
    }

    updateReviewsUI() {
        const reviewsContainer = document.getElementById('userReviews');
        const reviewsCount = document.getElementById('reviewsCount');
        
        if (this.userReviews.length === 0) {
            reviewsContainer.innerHTML = `
                <div class="reviews-empty">
                    <div class="empty-icon">⭐</div>
                    <h3>Отзывов пока нет</h3>
                    <p>Оставьте свой первый отзыв на товар!</p>
                </div>
            `;
            reviewsCount.textContent = '0';
            return;
        }

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

        reviewsContainer.innerHTML = reviewsHTML;
        reviewsCount.textContent = this.userReviews.length.toString();
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

        // Оформление заказа
        document.getElementById('checkoutBtn')?.addEventListener('click', () => {
            this.createOrder();
        });

        // Выход из системы
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Модальное окно аватара
        document.getElementById('closeAvatarModal')?.addEventListener('click', () => {
            this.closeAvatarModal();
        });

        document.getElementById('cancelAvatar')?.addEventListener('click', () => {
            this.closeAvatarModal();
        });

        document.getElementById('saveAvatar')?.addEventListener('click', () => {
            this.saveAvatar();
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
        const address = document.getElementById('address').value.trim();

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
            
            // Если начинается с +7 или 7, убираем код страны для сохранения
            if (phoneNumber.startsWith('7')) {
                phoneNumber = phoneNumber.substring(1); // Убираем первую 7
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
            email: email,
            address: address
        };
        
        // Добавляем телефон только если он изменился и валиден
        if (phoneNumber) {
            newData.phone = phoneNumber;
        } else if (phoneInput === '') {
            // Если поле телефона очищено, устанавливаем null
            newData.phone = null;
        }

        // Проверяем, есть ли изменения
        const hasChanges = Object.keys(newData).some(key => {
            const originalValue = this.originalUserData[key];
            const newValue = newData[key];
            
            // Специальная обработка для телефона (может быть число в original)
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
            
            // Обновляем локальные данные
            this.currentUser = updatedUser;
            this.originalUserData = {
                name: updatedUser.name || '',
                email: updatedUser.email || '',
                phone: updatedUser.phone || '',
                address: updatedUser.address || ''
            };
            
            // Обновляем UI (переформатируем телефон)
            this.updateUserInfo();
            
            // Показываем уведомление
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

    async createOrder() {
        if (this.cart.length === 0) {
            this.showNotification('Корзина пуста', 'error');
            return;
        }
        
        // Проверяем адрес перед оформлением заказа
        const hasAddress = await this.checkAddressBeforeOrder('profile');
        if (!hasAddress) return;
        
        // Подсчитываем общую стоимость
        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        try {
            // Создаем заказ с Relation на пользователя
            const orderData = {
                user: this.currentUser.id, // ← это Relation!
                products: JSON.stringify(this.cart), // Сохраняем как JSON
                total_price: total,
                status: 'pending',
                delivery_type: 'delivery',
                delivery_address: this.currentUser.address,
                warranty_service: false,
                assembly_service: false,
                order_date: new Date().toISOString().split('T')[0]
            };
            
            // Создаем заказ
            const order = await this.pb.collection('orders').create(orderData);
            
            // Очищаем корзину
            this.cart = [];
            this.saveCart();
            this.updateCartUI();
            
            // Показываем уведомление
            this.showNotification(`Заказ успешно оформлен! Номер заказа: #${order.id.slice(0, 8)}`, 'success');
            
            // Обновляем список заказов
            setTimeout(() => {
                this.loadOrders();
                this.switchTab('orders');
            }, 1000);
            
        } catch (error) {
            console.error('❌ Ошибка создания заказа:', error);
            this.showNotification('Ошибка создания заказа', 'error');
        }
    }

    logout() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            this.pb.authStore.clear();
            window.location.href = 'index.html';
        }
    }

    showNotification(message, type = 'info') {
        // Используем существующую систему уведомлений или создаем свою
        if (window.authManager && window.authManager.showNotification) {
            window.authManager.showNotification(message, type);
        } else {
            // Простая реализация
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
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

class ProductPage  {
    async submitOrderFromProduct(productData = null) {
        // Используем переданные данные или текущий товар
        const data = productData || this.productData;
        
        // Проверяем авторизацию
        if (!window.authManager || !window.authManager.isAuthenticated()) {
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
            return;
        }
        
        // Проверяем адрес пользователя
        const user = window.authManager.currentUser;
        if (!user.address || user.address.trim() === '') {
            // Показываем модальное окно для ввода адреса
            if (window.userProfile) {
                window.userProfile.showAddressModal('product', data);
            } else {
                alert('Пожалуйста, укажите адрес доставки в вашем профиле');
                window.location.href = 'profile.html';
            }
            return;
        }
        
        // Получаем данные из модального окна
        const quantity = parseInt(document.getElementById('orderQuantity').value) || 1;
        const deliveryType = document.querySelector('input[name="delivery"]:checked').value;
        const warranty = document.getElementById('serviceWarranty').checked;
        const assembly = document.getElementById('serviceAssembly').checked;
        
        try {
            // Рассчитываем стоимость
            const unitPrice = data.price || 0;
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
            
            // Создаем данные заказа
            const orderData = {
                user: user.id,
                product: data.id,
                product_name: data.name,
                quantity: quantity,
                unit_price: unitPrice,
                total_price: totalCost,
                delivery_type: deliveryType,
                delivery_address: user.address,
                warranty_service: warranty,
                assembly_service: assembly,
                status: 'pending',
                customer_name: user.name,
                customer_phone: user.phone,
                customer_email: user.email
            };
            
            // Отправляем заказ в базу данных
            const order = await this.pb.collection('orders').create(orderData);
            
            // Закрываем модальное окно
            this.closeOrderModal();
            
            // Показываем уведомление
            this.showNotification(`Заказ оформлен! Номер: #${order.id.slice(0, 8)}`, 'success');
            
            // Перенаправляем в профиль
            setTimeout(() => {
                window.location.href = 'profile.html#orders';
            }, 2000);
            
        } catch (error) {
            console.error('❌ Ошибка оформления заказа:', error);
            this.showNotification('Ошибка оформления заказа', 'error');
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

document.getElementById('submitOrder')?.addEventListener('click', async () => {
    const orderType = document.querySelector('input[name="orderType"]:checked').value;
    
    if (orderType === 'multiple') {
        // Для нескольких товаров перенаправляем в корзину
        window.location.href = 'profile.html#cart';
        return;
    }
    
    // Для одного товара
    await this.submitOrderFromProduct();
});

// В конец personal.js добавьте
window.testAvatar = async function() {
    if (!window.userProfile) {
        alert('Профиль не загружен');
        return;
    }
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('avatar', file);
        
        try {
            const response = await fetch(
                `http://127.0.0.1:8090/api/collections/users/records/${window.userProfile.currentUser.id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': window.userProfile.pb.authStore.token
                    },
                    body: formData
                }
            );
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Тест успешен!', result);
                alert('Аватар загружен! Закройте и откройте профиль для обновления.');
                
                // Обновляем данные
                window.userProfile.loadUserData();
            } else {
                alert('Ошибка: ' + response.status);
            }
        } catch (error) {
            console.error('❌ Ошибка:', error);
            alert('Ошибка: ' + error.message);
        }
    };
    
    fileInput.click();
};