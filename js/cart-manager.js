// cart-manager.js - Менеджер корзины

// Проверяем, не объявлен ли уже CartManager
if (typeof CartManager === 'undefined') {
    class CartManager {
        constructor() {
            this.cart = [];
            this.init();
        }

        init() {
            console.log('🛒 Инициализация менеджера корзины...');
            this.loadCart();
        }

        getCartKey() {
            if (window.authManager && window.authManager.currentUser) {
                return `user_cart_${window.authManager.currentUser.id}`;
            }
            return 'guest_cart';
        }

        loadCart() {
            try {
                const cartKey = this.getCartKey();
                const cartData = localStorage.getItem(cartKey);
                
                if (cartData) {
                    this.cart = JSON.parse(cartData);
                    console.log(`🛒 Корзина загружена (${this.cart.length} товаров)`);
                } else {
                    this.cart = [];
                    console.log('🛒 Корзина пуста или не найдена');
                }
                
                this.updateCartCounter();
                return this.cart;
                
            } catch (error) {
                console.error('❌ Ошибка загрузки корзины:', error);
                this.cart = [];
                return this.cart;
            }
        }

        saveCart() {
            try {
                const cartKey = this.getCartKey();
                localStorage.setItem(cartKey, JSON.stringify(this.cart));
                console.log(`🛒 Корзина сохранена (${this.cart.length} товаров)`);
                this.updateCartCounter();
                return true;
                
            } catch (error) {
                console.error('❌ Ошибка сохранения корзины:', error);
                return false;
            }
        }

        addItem(productData) {
            try {
                // Проверяем, есть ли уже такой товар в корзине
                const existingIndex = this.cart.findIndex(item => 
                    item.id === productData.id && 
                    item.collection === productData.collection &&
                    item.delivery_type === productData.delivery_type
                );
                
                if (existingIndex !== -1) {
                    // Увеличиваем количество
                    this.cart[existingIndex].quantity += productData.quantity || 1;
                    console.log('Увеличено количество существующего товара');
                } else {
                    // Добавляем новый товар
                    this.cart.push({
                        ...productData,
                        cart_id: `${productData.collection}_${productData.id}_${Date.now()}`,
                        quantity: productData.quantity || 1,
                        added_at: new Date().toISOString()
                    });
                    console.log('Добавлен новый товар в корзину');
                }
                
                this.saveCart();
                return true;
                
            } catch (error) {
                console.error('❌ Ошибка добавления товара:', error);
                return false;
            }
        }

        removeItem(cartId) {
            try {
                const initialLength = this.cart.length;
                this.cart = this.cart.filter(item => item.cart_id !== cartId);
                
                if (this.cart.length < initialLength) {
                    this.saveCart();
                    console.log('Товар удален из корзины');
                    return true;
                }
                
                return false;
                
            } catch (error) {
                console.error('❌ Ошибка удаления товара:', error);
                return false;
            }
        }

        updateQuantity(cartId, quantity) {
            try {
                const item = this.cart.find(item => item.cart_id === cartId);
                if (item) {
                    item.quantity = Math.max(1, quantity);
                    this.saveCart();
                    console.log(`Количество обновлено: ${item.quantity}`);
                    return true;
                }
                return false;
                
            } catch (error) {
                console.error('❌ Ошибка обновления количества:', error);
                return false;
            }
        }

        clearCart() {
            try {
                const cartKey = this.getCartKey();
                this.cart = [];
                localStorage.removeItem(cartKey);
                this.updateCartCounter();
                console.log('🛒 Корзина очищена');
                return true;
                
            } catch (error) {
                console.error('❌ Ошибка очистки корзины:', error);
                return false;
            }
        }

        getCartCount() {
            return this.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        }

        getCartTotal() {
            return this.cart.reduce((sum, item) => {
                let itemTotal = (item.price || 0) * (item.quantity || 1);
                
                // Дополнительные услуги
                if (item.warranty_service) itemTotal += 500;
                if (item.assembly_service) itemTotal += 1000;
                
                return sum + itemTotal;
            }, 0);
        }

        updateCartCounter() {
            try {
                const count = this.getCartCount();
                
                // Обновляем счетчик в хедере
                const cartCounter = document.querySelector('.cart-counter');
                if (cartCounter) {
                    cartCounter.textContent = count;
                }
                
                // Обновляем счетчик в профиле если есть
                const cartBadge = document.getElementById('cartBadge');
                if (cartBadge) {
                    cartBadge.textContent = count;
                }
                
                const cartCount = document.getElementById('cartCount');
                if (cartCount) {
                    cartCount.textContent = count;
                }
                
                console.log(`🛒 Счетчик обновлен: ${count} товаров`);
                return count;
                
            } catch (error) {
                console.error('❌ Ошибка обновления счетчика:', error);
                return 0;
            }
        }
    }

    // Глобальный экземпляр
    let cartManager = null;

    document.addEventListener('DOMContentLoaded', () => {
        console.log('📦 Инициализация менеджера корзины...');
        cartManager = new CartManager();
        window.cartManager = cartManager;
        
        // Обновляем счетчик при изменении состояния аутентификации
        document.addEventListener('authStateChanged', () => {
            console.log('🔄 Обновление корзины после изменения авторизации...');
            cartManager.loadCart();
        });
    });

    // Глобальные функции для работы с корзиной
    window.addToCart = function(productData) {
        if (!cartManager) {
            console.error('❌ Менеджер корзины не инициализирован');
            return false;
        }
        
        return cartManager.addItem(productData);
    };

    window.removeFromCart = function(cartId) {
        if (!cartManager) {
            console.error('❌ Менеджер корзины не инициализирован');
            return false;
        }
        
        return cartManager.removeItem(cartId);
    };

    window.getCart = function() {
        if (!cartManager) {
            console.error('❌ Менеджер корзины не инициализирован');
            return [];
        }
        
        return cartManager.cart;
    };
}