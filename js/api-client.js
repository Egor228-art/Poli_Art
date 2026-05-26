// js/api-client.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
class APIClient {
    constructor() {
        this.token = null;
        this.loadToken();
    }

    loadToken() {
        try {
            this.token = localStorage.getItem('auth_token');
        } catch (e) {
            this.token = null;
        }
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
        const headers = { 'Content-Type': 'application/json' };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    async request(method, endpoint, data = null) {
        const url = `/api${endpoint}`;
        const options = { 
            method, 
            headers: this.getHeaders() 
        };
        
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(url, options);
            
            // Для 401 не пытаемся парсить JSON
            if (response.status === 401) {
                throw new Error('Не авторизован');
            }
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || `Ошибка ${response.status}`);
            }
            return result;
        } catch (error) {
            console.error(`API Error [${method} ${endpoint}]:`, error.message);
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
    
    // ============ АВТОРИЗАЦИЯ ============
    async register(data) { 
        return this.request('POST', '/auth/register', data); 
    }
    
    async login(email, password) { 
        const result = await this.request('POST', '/auth/login', { email, password });
        if (result.token) {
            this.setToken(result.token);
        }
        return result;
    }
    
    async getCurrentUser() { 
        try {
            return await this.request('GET', '/auth/me');
        } catch (error) {
            if (error.message === 'Не авторизован') {
                return null;
            }
            throw error;
        }
    }
    
    async logout() { 
        this.setToken(null); 
    }

    async updateProfile(data) {
        return this.request('PUT', '/user/profile', data);
    }
    
    // ============ ЗАКАЗЫ ============
    async getOrders() { 
        return this.request('GET', '/orders'); 
    }
    
    async createOrder(data) { 
        return this.request('POST', '/orders', data); 
    }
    
    // ============ ОТЗЫВЫ ============
    async getReviews(productId, isLaminate) { 
        const type = isLaminate ? 'laminate' : 'doors';
        return this.request('GET', `/reviews/${productId}?type=${type}`); 
    }
    
    async createReview(data) { 
        return this.request('POST', '/reviews', data); 
    }
    
    // ============ КОНТАКТЫ ============
    async sendContactMessage(data) { 
        return this.request('POST', '/contacts', data); 
    }
}

// Создаем глобальный экземпляр
window.apiClient = new APIClient();
console.log('✅ API Client инициализирован');