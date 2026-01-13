// auth-state.js - Управление состоянием аутентификации

class AuthStateManager {
    constructor() {
        this.currentUser = null;
        this.userElementId = 'user-info-header';
        this.init();
    }

    init() {
        console.log('🔐 Инициализация менеджера аутентификации...');
        
        // Проверяем наличие PocketBase
        if (typeof PocketBase === 'undefined') {
            console.warn('⚠️ PocketBase не загружен, проверка состояния невозможна');
            this.loadFromLocalStorage();
            return;
        }
        
        this.pb = new PocketBase('http://127.0.0.1:8090');
        this.checkAuthState();
        
        // Слушаем изменения состояния
        this.setupAuthListeners();
        
        // Обработчик для кнопки выхода (будет добавлена динамически)
        document.addEventListener('click', (e) => {
            if (e.target.closest('#logout-button')) {
                e.preventDefault();
                this.logout();
            }
        });
    }

    async checkAuthState() {
        try {
            // Проверяем аутентификацию через PocketBase
            const isAuthenticated = this.pb.authStore.isValid;
            
            if (isAuthenticated) {
                this.currentUser = this.pb.authStore.model;
                console.log('✅ Пользователь авторизован:', this.currentUser);
                this.saveToLocalStorage();
            } else {
                this.currentUser = null;
                console.log('🚪 Пользователь не авторизован');
                this.clearLocalStorage();
            }
            
            this.updateUI();
            
        } catch (error) {
            console.error('❌ Ошибка проверки состояния аутентификации:', error);
            this.loadFromLocalStorage();
        }
    }

    updateUI() {
        const userContainer = document.getElementById(this.userElementId);
        if (!userContainer) {
            console.warn('⚠️ Контейнер для пользователя не найден');
            return;
        }
        
        // Очищаем контейнер
        userContainer.innerHTML = '';
        
        if (this.currentUser) {
            // Пользователь авторизован
            this.renderUserInfo(userContainer);
        } else {
            // Пользователь не авторизован - показываем кнопки входа
            this.renderGuestButtons(userContainer);
        }
    }

    renderUserInfo(container) {
        const user = this.currentUser;
        const firstName = user.name || user.username || 'Пользователь';
        const email = user.email || '';
        const initials = this.getUserInitials(firstName);
        
        const userInfoHTML = `
            <div class="header-user-info">
                <a href="profile.html" class="user-profile-link">
                    <div class="user-avatar" title="${firstName}">
                        ${initials}
                        ${user.role === 'admin' ? '<div class="user-role-badge">A</div>' : ''}
                        <div class="user-status-indicator"></div>
                    </div>
                    <div class="user-details">
                        <div class="user-name">${firstName}</div>
                        <div class="user-email" title="${email}">${email}</div>
                    </div>
                </a>
                <button class="logout-btn" id="logout-button">
                    <span>Выйти</span>
                    <span class="logout-btn-icon">🚪</span>
                </button>
            </div>
        `;
        
        container.innerHTML = userInfoHTML;
    }

    renderGuestButtons(container) {
        const guestButtonsHTML = `
            <div class="auth-buttons">
                <a href="login.html" class="btn btn--secondary btn-auth">Войти</a>
                <a href="register.html" class="btn btn--primary btn-auth">Регистрация</a>
            </div>
        `;
        
        container.innerHTML = guestButtonsHTML;
    }

    getUserInitials(name) {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    async logout() {
        try {
            if (this.pb) {
                this.pb.authStore.clear();
            }
            
            this.currentUser = null;
            this.clearLocalStorage();
            
            // Показываем уведомление
            this.showNotification('Вы успешно вышли из системы', 'success');
            
            // Обновляем UI
            setTimeout(() => {
                this.updateUI();
                // Если мы на странице, требующей авторизации, перенаправляем
                if (window.location.pathname.includes('profile') || 
                    window.location.pathname.includes('dashboard')) {
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
            localStorage.setItem('pb_auth', JSON.stringify({
                user: this.currentUser,
                timestamp: Date.now()
            }));
        }
    }

    loadFromLocalStorage() {
        try {
            const stored = localStorage.getItem('pb_auth');
            if (stored) {
                const data = JSON.parse(stored);
                // Проверяем, не устарели ли данные (24 часа)
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
        localStorage.removeItem('pb_auth');
    }

    setupAuthListeners() {
        if (!this.pb) return;
        
        // Слушаем изменения в authStore
        this.pb.authStore.onChange(() => {
            console.log('🔄 Изменение состояния аутентификации');
            this.checkAuthState();
        }, true);
    }

    showNotification(message, type = 'info') {
        // Удаляем старые уведомления
        const oldNotifications = document.querySelectorAll('.auth-notification');
        oldNotifications.forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `auth-notification auth-notification--${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 10px;
            background: ${type === 'success' ? 'linear-gradient(135deg, #28a745, #20c997)' : 
                         type === 'error' ? 'linear-gradient(135deg, #e74c3c, #c0392b)' :
                         'linear-gradient(135deg, #17a2b8, #138496)'};
            color: white;
            font-weight: 500;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
            animation: slideInRight 0.3s ease;
            max-width: 350px;
            z-index: 10000;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Автоматическое скрытие через 5 секунд
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    getUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }
}

// Глобальный экземпляр
let authManager = null;

// Инициализируем при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 Загружаем состояние аутентификации...');
    authManager = new AuthStateManager();
    
    // Экспортируем для использования
    window.authManager = authManager;
});

// Функции для глобального использования
window.checkAuth = () => {
    if (authManager) {
        authManager.checkAuthState();
    }
};

window.getCurrentUser = () => {
    return authManager ? authManager.getUser() : null;
};

window.isUserAuthenticated = () => {
    return authManager ? authManager.isAuthenticated() : false;
};

// Синхронизация между вкладками
window.addEventListener('storage', (e) => {
    if (e.key === 'pb_auth' && authManager) {
        console.log('🔄 Синхронизация состояния аутентификации между вкладками');
        authManager.checkAuthState();
    }
});