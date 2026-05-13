// auth.js - С правильной ролью 'users'

class AuthManager {
    constructor() {
        this.pb = null;
        this.init();
    }

    async init() {
        // Проверяем, что PocketBase загружен
        if (typeof PocketBase !== 'undefined') {
            try {
                this.pb = new PocketBase('http://127.0.0.1:8090');
                this.pb.autoCancellation(false);
                console.log('✅ PocketBase инициализирован');
            } catch (error) {
                console.error('❌ Ошибка создания PocketBase:', error);
            }
        } else {
            console.error('❌ PocketBase не загружен');
            this.loadPocketBase();
            return;
        }
        
        this.initForms();
        this.checkAuth();
    }

    loadPocketBase() {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/pocketbase/dist/pocketbase.umd.js';
        script.onload = () => {
            this.pb = new PocketBase('http://127.0.0.1:8090');
            this.pb.autoCancellation(false);
            this.initForms();
            this.checkAuth();
        };
        script.onerror = () => {
            console.error('Не удалось загрузить PocketBase SDK');
        };
        document.head.appendChild(script);
    }

    initForms() {
        // Форма регистрации
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            this.setupPhoneInput(registerForm);
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
        
        // Форма входа
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }

    setupPhoneInput(form) {
        const phoneInput = form.querySelector('input[name="phone"]');
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
        
        console.log('📝 Данные формы:', data);
        
        // Базовая валидация
        const errors = this.validateForm(data);
        if (errors.length > 0) {
            this.showMessage(errors.join(', '), 'error');
            return;
        }
        
        // Индикатор загрузки
        const button = form.querySelector('button[type="submit"]');
        const originalText = button.textContent;
        button.textContent = 'Регистрация...';
        button.disabled = true;
        
        try {
            if (!this.pb) {
                throw new Error('PocketBase не инициализирован');
            }
            
            // Преобразуем телефон в числовой формат (убираем все нецифровые символы)
            let phoneNumber = null;
            if (data.phone && data.phone.trim() !== '') {
                // Убираем форматирование, оставляем только цифры
                phoneNumber = data.phone.replace(/\D/g, '');
                
                // Если начинается с +7 или 7, убираем код страны для сохранения
                if (phoneNumber.startsWith('7')) {
                    phoneNumber = phoneNumber.substring(1); // Убираем первую 7
                }
                
                // Преобразуем в число
                phoneNumber = parseInt(phoneNumber, 10);
                
                console.log('📱 Номер телефона для сохранения (число):', phoneNumber);
                
                // Проверка на валидность номера
                if (isNaN(phoneNumber) || phoneNumber.toString().length < 10) {
                    throw new Error('Некорректный номер телефона');
                }
            }
            
            // Подготовка данных для PocketBase
            const userData = {
                email: data.email.trim(),
                emailVisibility: true,
                password: data.password,
                passwordConfirm: data.confirmPassword,
                name: data.name.trim(),
                roles: 'users' // ← ПРАВИЛЬНАЯ РОЛЬ: 'users' а не 'user'
            };
            
            // Добавляем телефон как ЧИСЛО если он заполнен
            if (phoneNumber) {
                userData.phone = phoneNumber;
                console.log('📱 Телефон (число) для сохранения:', phoneNumber);
            }
            
            // Проверяем и форматируем адрес если нужно
            const address = data.address ? data.address.trim() : '';
            if (address) {
                userData.address = address;
            }
            
            console.log('📤 Отправляемые данные:', userData);
            
            // Регистрация
            const response = await this.pb.collection('users').create(userData);
            console.log('✅ Успешная регистрация:', response);
            
            // Автовход
            await this.pb.collection('users').authWithPassword(
                userData.email, 
                userData.password
            );
            
            this.showMessage('✅ Регистрация успешна! Добро пожаловать!', 'success');
            
            // Перенаправление
            setTimeout(() => {
                // Если есть параметр redirect в URL
                const urlParams = new URLSearchParams(window.location.search);
                const redirect = urlParams.get('redirect');
                
                if (redirect) {
                    window.location.href = redirect;
                } else {
                    window.location.href = 'personal.html'; // Или index.html
                }
            }, 2000);
            
        } catch (error) {
            console.error('❌ Ошибка регистрации:', error);
            
            // ПОДРОБНАЯ ОТЛАДКА
            console.log('🔍 Полный объект ошибки:', JSON.stringify(error, null, 2));
            
            if (error.data) {
                console.log('🔍 error.data:', error.data);
                console.log('🔍 error.data.data:', error.data.data);
                console.log('🔍 error.data.message:', error.data.message);
            }
            
            let errorMessage = 'Ошибка регистрации';
            
            if (error.data && error.data.data) {
                const errors = error.data.data;
                console.log('🔍 Детали ошибки:', errors);
                
                if (Object.keys(errors).length === 0) {
                    // Если объект ошибок пуст, проверяем message
                    if (error.data.message) {
                        errorMessage = error.data.message;
                    } else {
                        // Проверяем общие валидации
                        if (data.email.includes('@gmail.com') && data.email === 'gmail@gmail.com') {
                            errorMessage = 'Email должен быть реальным адресом';
                        }
                    }
                }
                
                if (errors.email) {
                    errorMessage = 'Email уже используется или некорректный';
                } else if (errors.password) {
                    errorMessage = 'Пароль слишком простой (минимум 6 символов)';
                } else if (errors.roles) {
                    errorMessage = `Ошибка роли: ${errors.roles.message || 'Используйте значение users'}`;
                } else if (errors.name) {
                    errorMessage = 'Некорректное имя';
                } else if (errors.phone) {
                    errorMessage = `Ошибка телефона: ${errors.phone.message || 'Некорректный формат телефона (должен быть числом)'}`;
                } else {
                    // Показываем первую ошибку
                    const firstError = Object.values(errors)[0];
                    errorMessage = firstError?.message || 'Проверьте введенные данные';
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            this.showMessage(`❌ ${errorMessage}`, 'error');
            
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
        
        console.log('🔑 Вход:', data);
        
        const button = form.querySelector('button[type="submit"]');
        const originalText = button.textContent;
        button.textContent = 'Вход...';
        button.disabled = true;
        
        try {
            if (!this.pb) {
                throw new Error('PocketBase не инициализирован');
            }
            
            const authResult = await this.pb.collection('users').authWithPassword(
                data.email.trim(),
                data.password
            );
            
            console.log('✅ Успешный вход, роль:', authResult.record?.roles);
            this.showMessage('✅ Вход выполнен успешно!', 'success');
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
            
        } catch (error) {
            console.error('❌ Ошибка входа:', error);
            this.showMessage('❌ Неверный email или пароль', 'error');
            
        } finally {
            button.textContent = originalText;
            button.disabled = false;
        }
    }

    validateForm(data) {
        const errors = [];
        
        // Email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            errors.push('Некорректный email');
        }
        
        // Имя
        if (!data.name || data.name.trim().length < 2) {
            errors.push('Имя должно быть не менее 2 символов');
        }
        
        // Пароль
        if (!data.password || data.password.length < 6) {
            errors.push('Пароль должен быть не менее 6 символов');
        }
        
        // Подтверждение пароля
        if (data.password !== data.confirmPassword) {
            errors.push('Пароли не совпадают');
        }
        
        return errors;
    }

    async checkAuth() {
        try {
            if (this.pb && this.pb.authStore.isValid) {
                const user = this.pb.authStore.model;
                console.log('👤 Пользователь авторизован:', user?.name, 'Роль:', user?.roles);
                return true;
            }
        } catch (error) {
            console.log('🔒 Пользователь не авторизован:', error.message);
        }
        return false;
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
            background: ${type === 'success' ? '#28a745' : '#e74c3c'};
            color: white;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            font-weight: 500;
            max-width: 400px;
            word-break: break-word;
        `;
        
        document.body.appendChild(messageEl);
        
        // Добавляем кнопку закрытия
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = `
            position: absolute;
            top: 5px;
            right: 5px;
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        closeBtn.onclick = () => messageEl.remove();
        messageEl.appendChild(closeBtn);
        
        // Автоудаление через 5 секунд
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (messageEl.parentNode) {
                        messageEl.remove();
                    }
                }, 300);
            }
        }, 5000);
        
        // Добавляем стили анимации
        if (!document.querySelector('#auth-animations')) {
            const style = document.createElement('style');
            style.id = 'auth-animations';
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
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Небольшая задержка для загрузки PocketBase
    setTimeout(() => {
        window.authManager = new AuthManager();
    }, 500);
});