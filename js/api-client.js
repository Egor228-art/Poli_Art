// js/api-client.js
// Универсальный клиент для работы с API вместо прямых вызовов PocketBase

const API_BASE = '/api';

class APIClient {
    constructor() {
        this.token = localStorage.getItem('auth_token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('auth_token', token);
        } else {
            localStorage.removeItem('auth_token');
        }
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    async request(method, endpoint, data = null) {
        const url = `${API_BASE}${endpoint}`;
        const options = {
            method,
            headers: this.getHeaders()
        };
        
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(url, options);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || `Ошибка ${response.status}`);
            }
            
            return result;
        } catch (error) {
            console.error(`API Error [${method} ${endpoint}]:`, error);
            throw error;
        }
    }

    // ============ ТОВАРЫ ============
    
    async getDoors() {
        return this.request('GET', '/products/doors');
    }
    
    async getLaminate() {
        return this.request('GET', '/products/laminate');
    }
    
    async getProduct(collection, id) {
        return this.request('GET', `/products/${collection}/${id}`);
    }
    
    async searchProducts(collection, search, filters = {}) {
        return this.request('POST', '/products/search', { collection, search, filters });
    }
    
    // ============ АВТОРИЗАЦИЯ ============
    
    async register(userData) {
        const result = await this.request('POST', '/auth/register', userData);
        if (result.token) {
            this.setToken(result.token);
        }
        return result;
    }
    
    async login(email, password) {
        const result = await this.request('POST', '/auth/login', { email, password });
        if (result.token) {
            this.setToken(result.token);
        }
        return result;
    }
    
    async logout() {
        this.setToken(null);
    }
    
    async getCurrentUser() {
        if (!this.token) return null;
        try {
            return await this.request('GET', '/auth/me');
        } catch {
            return null;
        }
    }
    
    // ============ ЗАКАЗЫ ============
    
    async createOrder(orderData) {
        return this.request('POST', '/orders', orderData);
    }
    
    async getOrders() {
        return this.request('GET', '/orders');
    }
    
    // ============ ОТЗЫВЫ ============
    
    async getReviews(productId, isLaminate = false) {
        const endpoint = isLaminate ? `/reviews/laminate/${productId}` : `/reviews/${productId}`;
        return this.request('GET', endpoint);
    }
    
    async createReview(reviewData) {
        return this.request('POST', '/reviews', reviewData);
    }
    
    // ============ ЗАМЕРЫ ============
    
    async createMeasureRequest(data) {
        return this.request('POST', '/measure', data);
    }
    
    // ============ КОНТАКТЫ ============
    
    async sendContactMessage(data) {
        return this.request('POST', '/contacts', data);
    }
    
    // ============ КОНСТРУКТОР ============
    
    async calculateLaminate(length, width, wastePercent = 10) {
        return this.request('POST', '/constructor/calculate', { length, width, wastePercent });
    }
    
    // ============ АДМИН ============
    
    async createProduct(productData) {
        return this.request('POST', '/admin/product/create', productData);
    }
}

// Создаем глобальный экземпляр
window.apiClient = new APIClient();

// Функция для проверки авторизации (замена window.authManager)
window.authManager = {
    isAuthenticated: () => !!window.apiClient?.token,
    currentUser: null,
    
    async checkAuth() {
        try {
            const user = await window.apiClient.getCurrentUser();
            if (user) {
                this.currentUser = user;
                return true;
            }
        } catch (e) {
            this.currentUser = null;
        }
        return false;
    },
    
    async login(email, password) {
        const result = await window.apiClient.login(email, password);
        if (result.user) {
            this.currentUser = result.user;
        }
        return result;
    },
    
    async register(data) {
        const result = await window.apiClient.register(data);
        if (result.user) {
            this.currentUser = result.user;
        }
        return result;
    },
    
    logout() {
        window.apiClient.logout();
        this.currentUser = null;
    },
    
    showNotification(message, type) {
        // Существующая функция уведомлений
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            alert(message);
        }
    }
};

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
    await window.authManager.checkAuth();
    
    // Обновляем UI хедера если есть функция
    if (typeof window.updateHeaderAuth === 'function') {
        window.updateHeaderAuth();
    }
});

console.log('✅ API Client инициализирован');