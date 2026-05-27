class AuthStateManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        if (!window.apiClient) {
            setTimeout(() => this.init(), 500);
            return;
        }
        await this.checkAuth();
        this.updateUI();
    }

    async checkAuth() {
        try {
            this.currentUser = await window.apiClient.getCurrentUser();
            if (this.currentUser) {
                console.log('👤 Авторизован:', this.currentUser.email);
            } else {
                console.log('🚪 Не авторизован');
            }
        } catch (error) {
            this.currentUser = null;
        }
    }

    // ДОБАВЬ ЭТОТ МЕТОД:
    isAuthenticated() {
        return !!this.currentUser;
    }

    updateUI() {
        const headerActions = document.querySelector('.header__actions');
        if (!headerActions) return;

        if (this.currentUser) {
            const isAdmin = this.currentUser.role === 'admin';
            const adminBtn = isAdmin ? '<a href="admin.html" style="background:#e74c3c;color:white;padding:8px 15px;border-radius:8px;text-decoration:none;margin-right:10px">👑 Админка</a>' : '';
            
            headerActions.innerHTML = `
                <div class="user-profile">
                    ${adminBtn}
                    <a href="personal.html" class="user-name">${this.escapeHtml(this.currentUser.name || 'Пользователь')}</a>
                    <button class="btn btn--secondary" id="logoutBtn">Выйти</button>
                </div>
            `;
        } else {
            headerActions.innerHTML = `
                <div class="auth-buttons">
                    <a href="login.html" class="btn btn--secondary btn-auth">Войти</a>
                    <a href="register.html" class="btn btn--primary btn-auth">Регистрация</a>
                </div>
            `;
        }
    }

    async logout() {
        try {
            if (window.apiClient) {
                window.apiClient.setToken(null);
            }
            localStorage.removeItem('auth_token');
            this.currentUser = null;
            this.updateUI();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Ошибка выхода:', error);
            window.location.href = 'index.html';
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

let authManager = null;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        authManager = new AuthStateManager();
        window.authManager = authManager;
        console.log('✅ AuthStateManager инициализирован');
    }, 500);
});