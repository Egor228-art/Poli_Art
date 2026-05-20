// cart-manager.js - ИСПРАВЛЕННАЯ ВЕРСИЯ

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
                this.cart = cartData ? JSON.parse(cartData) : [];
                console.log(`🛒 Корзина загружена (${this.cart.length} товаров)`);
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
                const existingIndex = this.cart.findIndex(item => 
                    item.id === productData.id && 
                    item.collection === productData.collection &&
                    item.delivery_type === productData.delivery_type
                );
                
                if (existingIndex !== -1) {
                    this.cart[existingIndex].quantity += productData.quantity || 1;
                } else {
                    this.cart.push({
                        ...productData,
                        cart_id: `${productData.collection}_${productData.id}_${Date.now()}`,
                        quantity: productData.quantity || 1,
                        added_at: new Date().toISOString()
                    });
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
                if (item.warranty_service) itemTotal += 500;
                if (item.assembly_service) itemTotal += 1000;
                return sum + itemTotal;
            }, 0);
        }

        updateCartCounter() {
            try {
                const count = this.getCartCount();
                const cartCounter = document.querySelector('.cart-counter');
                if (cartCounter) cartCounter.textContent = count;
                const cartBadge = document.getElementById('cartBadge');
                if (cartBadge) cartBadge.textContent = count;
                const cartCount = document.getElementById('cartCount');
                if (cartCount) cartCount.textContent = count;
                return count;
            } catch (error) {
                console.error('❌ Ошибка обновления счетчика:', error);
                return 0;
            }
        }
    }

    let cartManager = null;

    document.addEventListener('DOMContentLoaded', () => {
        console.log('📦 Инициализация менеджера корзины...');
        cartManager = new CartManager();
        window.cartManager = cartManager;
        
        document.addEventListener('authStateChanged', () => {
            cartManager.loadCart();
        });
    });

    window.addToCart = function(productData) {
        return cartManager ? cartManager.addItem(productData) : false;
    };

    window.removeFromCart = function(cartId) {
        return cartManager ? cartManager.removeItem(cartId) : false;
    };

    window.getCart = function() {
        return cartManager ? cartManager.cart : [];
    };
}