// js/auth.js - ПЕРЕПИСАННАЯ ВЕРСИЯ (страницы login.html и register.html)

class AuthPage {
    constructor() {
        this.pb = null;
        this.init();
    }

    async init() {
        console.log('🔐 Инициализация страницы авторизации...');
        
        // Ждем apiClient
        if (!window.apiClient) {
            console.log('⏳ Ждем загрузки apiClient...');
            setTimeout(() => this.init(), 500);
            return;
        }
        
        this.initForms();
        this.setupPhoneMask();
    }

    initForms() {
        // Форма регистрации
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
        
        // Форма входа
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }

    setupPhoneMask() {
        const phoneInput = document.querySelector('input[name="phone"]');
        if (!phoneInput) return;

        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.length > 0) {
                let formatted = '+7';
                if (value.length > 1) {
                    formatted += ' (' + value.substring(1, 4);
                }
                if (value.length >= 4) {
                    formatted += ') ' + value.substring(4, 7);
                }
                if (value.length >= 7) {
                    formatted += '-' + value.substring(7, 9);
                }
                if (value.length >= 9) {
                    formatted += '-' + value.substring(9, 11);
                }
                e.target.value = formatted;
            }
        });
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        console.log('📝 Данные формы регистрации:', { email: data.email, name: data.name });
        
        const errors = this.validateRegisterForm(data);
        if (errors.length > 0) {
            this.showMessage(errors.join(', '), 'error');
            return;
        }
        
        const button = form.querySelector('button[type="submit"]');
        const originalText = button.textContent;
        button.textContent = 'Регистрация...';
        button.disabled = true;
        
        try {
            // Преобразуем телефон в числовой формат
            let phoneNumber = null;
            if (data.phone && data.phone.trim() !== '') {
                phoneNumber = data.phone.replace(/\D/g, '');
                if (phoneNumber.startsWith('8')) {
                    phoneNumber = '7' + phoneNumber.substring(1);
                }
                if (phoneNumber.startsWith('7') && phoneNumber.length === 11) {
                    phoneNumber = phoneNumber.substring(1);
                }
                phoneNumber = parseInt(phoneNumber, 10);
            }
            
            const result = await window.apiClient.register({
                email: data.email.trim(),
                password: data.password,
                name: data.name.trim(),
                phone: phoneNumber,
                address: data.address || ''
            });
            
            console.log('✅ Успешная регистрация:', result);
            
            this.showMessage('✅ Регистрация успешна! Добро пожаловать!', 'success');
            
            setTimeout(() => {
                const urlParams = new URLSearchParams(window.location.search);
                const redirect = urlParams.get('redirect');
                window.location.href = redirect || 'personal.html';
            }, 2000);
            
        } catch (error) {
            console.error('❌ Ошибка регистрации:', error);
            this.showMessage(`❌ ${error.message || 'Ошибка регистрации'}`, 'error');
            
        } finally {
            button.textContent = originalText;
            button.disabled = false;
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        console.log('🔑 Вход:', data.email);
        
        const button = form.querySelector('button[type="submit"]');
        const originalText = button.textContent;
        button.textContent = 'Вход...';
        button.disabled = true;
        
        try {
            const result = await window.apiClient.login(data.email.trim(), data.password);
            
            console.log('✅ Успешный вход:', result);
            
            this.showMessage('✅ Вход выполнен успешно!', 'success');
            
            setTimeout(() => {
                const urlParams = new URLSearchParams(window.location.search);
                const redirect = urlParams.get('redirect');
                window.location.href = redirect || 'index.html';
            }, 1500);
            
        } catch (error) {
            console.error('❌ Ошибка входа:', error);
            this.showMessage('❌ Неверный email или пароль', 'error');
            
        } finally {
            button.textContent = originalText;
            button.disabled = false;
        }
    }

    validateRegisterForm(data) {
        const errors = [];
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            errors.push('Некорректный email');
        }
        
        if (!data.name || data.name.trim().length < 2) {
            errors.push('Имя должно быть не менее 2 символов');
        }
        
        if (!data.password || data.password.length < 6) {
            errors.push('Пароль должен быть не менее 6 символов');
        }
        
        if (data.password !== data.confirmPassword) {
            errors.push('Пароли не совпадают');
        }
        
        return errors;
    }

    showMessage(message, type = 'info') {
        // Удаляем старые сообщения
        document.querySelectorAll('.auth-message').forEach(msg => msg.remove());
        
        const messageEl = document.createElement('div');
        messageEl.className = `auth-message auth-message--${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
            color: white;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            font-weight: 500;
            max-width: 400px;
        `;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => messageEl.remove(), 300);
        }, 5000);
    }
}

// Инициализация
let authPage = null;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        authPage = new AuthPage();
    }, 500);
});