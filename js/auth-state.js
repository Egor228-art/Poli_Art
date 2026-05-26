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
            // Кнопка админки только для админов
            let adminButtonHtml = '';
            if (this.currentUser.role === 'admin') {
                adminButtonHtml = '<a href="admin.html" class="admin-link" style="background: #e74c3c; color: white; padding: 8px 15px; border-radius: 8px; text-decoration: none; margin-right: 10px; font-size: 14px;">👑 Админка</a>';
            }
            
            headerActions.innerHTML = `
                <div class="user-profile">
                    ${adminButtonHtml}
                    <a href="personal.html" class="user-name">${this.escapeHtml(this.currentUser.name || 'Пользователь')}</a>
                    <button class="btn btn--secondary" id="logoutBtn">Выйти</button>
                </div>
            `;
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) logoutBtn.addEventListener('click', () => this.logout());
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
        await window.apiClient.logout();
        this.currentUser = null;
        this.updateUI();
        window.location.href = 'index.html';
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