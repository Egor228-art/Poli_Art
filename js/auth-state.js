// js/auth-state.js - ПЕРЕПИСАННАЯ ВЕРСИЯ (без PocketBase)

class AuthStateManager {
    constructor() {
        this.currentUser = null;
        this.userElementId = 'user-info-header';
        this.isProfilePage = window.location.pathname.includes('personal.html');
        
        this.init();
    }

    async init() {
        console.log('🔐 Инициализация менеджера аутентификации...');
        
        // Ждем загрузки apiClient
        if (!window.apiClient) {
            console.log('⏳ Ждем загрузки apiClient...');
            setTimeout(() => this.init(), 500);
            return;
        }
        
        await this.checkAuthState();
        this.setupAuthListeners();
        this.updateUI();
    }

    async checkAuthState() {
        try {
            const user = await window.apiClient.getCurrentUser();
            
            if (user) {
                this.currentUser = user;
                console.log('👤 Пользователь авторизован:', this.currentUser.email);
                this.saveToLocalStorage();
            } else {
                this.currentUser = null;
                console.log('🚪 Пользователь не авторизован');
                this.clearLocalStorage();
            }
            
            // Обновляем глобальный объект для совместимости
            window.authManager = {
                currentUser: this.currentUser,
                isAuthenticated: () => !!this.currentUser,
                getUser: () => this.currentUser,
                logout: () => this.logout(),
                checkAuth: () => this.checkAuthState(),
                showNotification: (msg, type) => this.showNotification(msg, type)
            };
            
        } catch (error) {
            console.error('❌ Ошибка проверки состояния аутентификации:', error);
            this.currentUser = null;
            this.loadFromLocalStorage();
        }
    }

    updateUI() {
        if (this.isProfilePage) {
            const userContainer = document.getElementById(this.userElementId);
            if (userContainer) {
                this.renderProfileUserInfo(userContainer);
            }
            return;
        }
        
        const headerUser = document.querySelector('.header-user-info')?.parentElement ||
                          document.querySelector('[id*="user"], [class*="user-info"]') ||
                          document.querySelector('.header__actions');
        
        if (headerUser) {
            if (this.currentUser) {
                this.renderHeaderUserInfo(headerUser);
            } else {
                this.renderGuestButtons(headerUser);
            }
        }
    }

    renderProfileUserInfo(container) {
        const user = this.currentUser;
        if (!user) return;
        
        const firstName = user.name || 'Пользователь';
        const email = user.email || '';
        const initials = this.getUserInitials(firstName);
        
        container.innerHTML = `
            <div class="header-user-info">
                <a href="personal.html" class="user-profile-link">
                    <div class="user-avatar">${initials}</div>
                    <div class="user-details">
                        <div class="user-name">${escapeHtml(firstName)}</div>
                        <div class="user-email" title="${escapeHtml(email)}">${escapeHtml(email)}</div>
                    </div>
                </a>
                <button class="logout-btn" id="logout-button">
                    <span>Выйти</span>
                    <span class="logout-btn-icon">🚪</span>
                </button>
            </div>
        `;
        
        document.getElementById('logout-button')?.addEventListener('click', () => this.logout());
    }

    renderHeaderUserInfo(container) {
        const user = this.currentUser;
        if (!user) return;
        
        const firstName = user.name || 'Пользователь';
        const email = user.email || '';
        const initials = this.getUserInitials(firstName);
        
        container.innerHTML = `
            <div class="header-user-info">
                <a href="personal.html" class="user-profile-link">
                    <div class="user-avatar">${initials}</div>
                    <div class="user-details">
                        <div class="user-name">${escapeHtml(firstName)}</div>
                        <div class="user-email" title="${escapeHtml(email)}">${escapeHtml(email)}</div>
                    </div>
                </a>
                <button class="logout-btn" id="logout-button">
                    <span>Выйти</span>
                    <span class="logout-btn-icon">🚪</span>
                </button>
            </div>
        `;
        
        document.getElementById('logout-button')?.addEventListener('click', () => this.logout());
    }

    renderGuestButtons(container) {
        container.innerHTML = `
            <div class="auth-buttons">
                <a href="login.html" class="btn btn--secondary btn-auth">Войти</a>
                <a href="register.html" class="btn btn--primary btn-auth">Регистрация</a>
            </div>
        `;
    }

    getUserInitials(name) {
        if (!name) return '👤';
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    async logout() {
        try {
            if (window.apiClient) {
                window.apiClient.setToken(null);
            }
            
            this.currentUser = null;
            this.clearLocalStorage();
            
            this.showNotification('Вы успешно вышли из системы', 'success');
            
            setTimeout(() => {
                this.updateUI();
                if (window.location.pathname.includes('personal.html') || 
                    window.location.pathname.includes('profile')) {
                    window.location.href = '/index.html';
                }
            }, 1500);
            
        } catch (error) {
            console.error('❌ Ошибка выхода:', error);
            this.showNotification('Ошибка при выходе из системы', 'error');
        }
    }

    saveToLocalStorage() {
        if (this.currentUser) {
            localStorage.setItem('polyart_auth', JSON.stringify({
                user: this.currentUser,
                timestamp: Date.now()
            }));
        }
    }

    loadFromLocalStorage() {
        try {
            const stored = localStorage.getItem('polyart_auth');
            if (stored) {
                const data = JSON.parse(stored);
                if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
                    this.currentUser = data.user;
                    this.updateUI();
                } else {
                    this.clearLocalStorage();
                }
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки из localStorage:', error);
        }
    }

    clearLocalStorage() {
        localStorage.removeItem('polyart_auth');
    }

    setupAuthListeners() {
        // Слушаем изменения токена в apiClient
        const originalSetToken = window.apiClient?.setToken;
        if (originalSetToken) {
            window.apiClient.setToken = (token) => {
                originalSetToken.call(window.apiClient, token);
                this.checkAuthState();
            };
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
            padding: 15px 20px;
            border-radius: 8px;
            background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            font-weight: 500;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    getUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return !!this.currentUser;
    }
}

// Глобальный экземпляр
let authManager = null;

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 Загружаем состояние аутентификации...');
    
    // Ждем apiClient
    const waitForApiClient = setInterval(() => {
        if (window.apiClient) {
            clearInterval(waitForApiClient);
            authManager = new AuthStateManager();
            window.authManager = authManager;
            console.log('✅ AuthStateManager инициализирован');
        }
    }, 100);
    
    setTimeout(() => clearInterval(waitForApiClient), 10000);
});

// Глобальные функции для совместимости
window.checkAuth = () => authManager?.checkAuthState();
window.getCurrentUser = () => authManager?.getUser();
window.isUserAuthenticated = () => authManager?.isAuthenticated();

// Стили для уведомлений
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}