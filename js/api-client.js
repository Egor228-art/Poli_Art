// js/api-client.js
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
        const headers = { 'Content-Type': 'application/json' };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    async request(method, endpoint, data = null) {
        const url = `/api${endpoint}`;
        const options = { method, headers: this.getHeaders() };
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

    // Товары
    async getDoors() { return this.request('GET', '/products/doors'); }
    async getLaminate() { return this.request('GET', '/products/laminate'); }
    async getProduct(collection, id) { return this.request('GET', `/products/${collection}/${id}`); }
    
    // Авторизация
    async register(data) { return this.request('POST', '/auth/register', data); }
    async login(email, password) { return this.request('POST', '/auth/login', { email, password }); }
    async getCurrentUser() { return this.request('GET', '/auth/me').catch(() => null); }
    
    // Заказы
    async getOrders() { return this.request('GET', '/orders'); }
    async createOrder(data) { return this.request('POST', '/orders', data); }
    
    // Отзывы
    async getReviews(productId, isLaminate) { return this.request('GET', `/reviews/${productId}?type=${isLaminate ? 'laminate' : 'doors'}`); }
    async createReview(data) { return this.request('POST', '/reviews', data); }
    
    // Контакты
    async sendContactMessage(data) { return this.request('POST', '/contacts', data); }
}

window.apiClient = new APIClient();
console.log('✅ API Client инициализирован');