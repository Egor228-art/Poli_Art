// contacts.js - Обработка формы обратной связи на странице контактов (с отладкой)

(function() {
    'use strict';

    let pb = null;
    let currentUser = null;
    let isInitialized = false;
    const DEBUG = true; // Включить отладку

    // Инициализация при загрузке страницы
    function initContactsPage() {
        if (DEBUG) console.log('📞 Инициализация страницы контактов...');
        
        if (isInitialized) {
            if (DEBUG) console.log('⚠️ Страница контактов уже инициализирована');
            return;
        }
        
        // Инициализируем PocketBase
        initPocketBase();
        
        // Настраиваем форму обратной связи
        initFeedbackForm();
        
        isInitialized = true;
        if (DEBUG) console.log('✅ Страница контактов инициализирована');
    }

    // Инициализация PocketBase
    function initPocketBase() {
        try {
            if (typeof PocketBase !== 'undefined') {
                pb = new PocketBase('http://127.0.0.1:8090');
                pb.autoCancellation(false);
                
                // Проверяем авторизацию
                if (pb.authStore.isValid) {
                    currentUser = pb.authStore.model;
                    if (DEBUG) console.log('👤 Пользователь авторизован:', {
                        email: currentUser.email,
                        name: currentUser.name
                    });
                } else {
                    if (DEBUG) console.log('👤 Пользователь не авторизован');
                }
            }
        } catch (error) {
            console.warn('⚠️ Не удалось инициализировать PocketBase:', error);
        }
    }

    // Инициализация формы обратной связи
    function initFeedbackForm() {
        if (DEBUG) console.log('📝 Инициализация формы обратной связи...');
        
        const form = document.getElementById('feedback-form');
        if (!form) {
            console.error('❌ Форма обратной связи не найдена');
            return;
        }
        
        // Получаем элементы формы
        const nameInput = document.getElementById('name');
        const phoneInput = document.getElementById('phone');
        const emailInput = document.getElementById('email');
        const messageInput = document.getElementById('message');
        const submitBtn = form.querySelector('.submit-btn');
        
        if (!nameInput || !phoneInput || !emailInput || !messageInput) {
            console.error('❌ Не все поля формы найдены');
            return;
        }
        
        // 1. Заполняем форму данными из профиля если пользователь авторизован
        populateFormWithUserData();
        
        // 2. Настраиваем маску телефона
        setupPhoneMask(phoneInput);
        
        // 3. Настраиваем валидацию
        setupFormValidation(form, nameInput, phoneInput, emailInput);
        
        // 4. Настраиваем отправку формы
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            await submitFeedbackForm(e);
        });
        
        // 5. Добавляем подсказки для авторизованных пользователей
        addUserInfoHints();
        
        if (DEBUG) console.log('✅ Форма обратной связи инициализирована');
    }

    // Настройка маски телефона
    function setupPhoneMask(phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = this.value.replace(/\D/g, '');
            
            if (value.length > 0) {
                if (value.length > 10) value = value.substring(0, 10);
                
                let formatted = '';
                if (value.length >= 3) {
                    formatted = '(' + value.substring(0, 3);
                    if (value.length > 3) {
                        formatted += ') ' + value.substring(3, 6);
                        if (value.length > 6) {
                            formatted += '-' + value.substring(6, 8);
                            if (value.length > 8) {
                                formatted += '-' + value.substring(8, 10);
                            }
                        }
                    }
                } else {
                    formatted = value;
                }
                
                this.value = formatted;
            }
        });
    }

    // Заполнение формы данными пользователя
    function populateFormWithUserData() {
        if (!currentUser) return;
        
        const nameInput = document.getElementById('name');
        const phoneInput = document.getElementById('phone');
        const emailInput = document.getElementById('email');
        
        if (DEBUG) console.log('👤 Заполнение формы данными пользователя...');
        
        // Имя
        if (nameInput && currentUser.name) {
            nameInput.value = currentUser.name;
            nameInput.readOnly = true;
            nameInput.classList.add('readonly-field');
        }
        
        // Телефон
        if (phoneInput && currentUser.phone) {
            const phoneStr = currentUser.phone.toString();
            if (phoneStr.length >= 10) {
                const formattedPhone = '(' + phoneStr.substring(0, 3) + ') ' + 
                                      phoneStr.substring(3, 6) + '-' + 
                                      phoneStr.substring(6, 8) + '-' + 
                                      phoneStr.substring(8, 10);
                phoneInput.value = formattedPhone;
                phoneInput.readOnly = true;
                phoneInput.classList.add('readonly-field');
            }
        }
        
        // Email
        if (emailInput && currentUser.email) {
            emailInput.value = currentUser.email;
            emailInput.readOnly = true;
            emailInput.classList.add('readonly-field');
        }
    }

    // Настройка валидации формы
    function setupFormValidation(form, nameInput, phoneInput, emailInput) {
        // Валидация имени (только если не заблокировано)
        if (!nameInput.readOnly) {
            nameInput.addEventListener('blur', function() {
                validateNameField(this);
            });
        }
        
        // Валидация телефона (только если не заблокировано)
        if (!phoneInput.readOnly) {
            phoneInput.addEventListener('blur', function() {
                validatePhoneField(this);
            });
        }
        
        // Валидация email (всегда)
        emailInput.addEventListener('blur', function() {
            validateEmailField(this);
        });
    }

    function validateNameField(input) {
        const name = input.value.trim();
        const errorElement = document.getElementById('name-error');
        if (name.length < 2) {
            errorElement.textContent = 'Имя должно содержать не менее 2 символов';
            input.classList.add('error');
            return false;
        } else {
            errorElement.textContent = '';
            input.classList.remove('error');
            return true;
        }
    }

    function validatePhoneField(input) {
        const phone = input.value.trim();
        const errorElement = document.getElementById('phone-error');
        const phoneRegex = /^\(\d{3}\) \d{3}-\d{2}-\d{2}$/;
        
        if (!phoneRegex.test(phone)) {
            errorElement.textContent = 'Введите корректный номер телефона';
            input.classList.add('error');
            return false;
        } else {
            errorElement.textContent = '';
            input.classList.remove('error');
            return true;
        }
    }

    function validateEmailField(input) {
        const email = input.value.trim();
        const errorElement = document.getElementById('email-error');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!email) {
            errorElement.textContent = 'Поле email обязательно для заполнения';
            input.classList.add('error');
            return false;
        } else if (!emailRegex.test(email)) {
            errorElement.textContent = 'Введите корректный email';
            input.classList.add('error');
            return false;
        } else {
            errorElement.textContent = '';
            input.classList.remove('error');
            return true;
        }
    }

    // Отправка формы обратной связи
    async function submitFeedbackForm(event) {
        event.preventDefault();
        
        console.log('📤 Отправка формы...');
        
        const nameInput = document.getElementById('name');
        const phoneInput = document.getElementById('phone');
        const emailInput = document.getElementById('email');
        const messageInput = document.getElementById('message');
        const submitBtn = document.querySelector('.submit-btn');
        
        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        const email = emailInput.value.trim();
        const message = messageInput.value.trim();
        
        if (!name || !phone || !email) {
            alert('Заполните все обязательные поля');
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Отправка...';
        
        try {
            if (!pb) {
                if (typeof PocketBase !== 'undefined') {
                    pb = new PocketBase('http://127.0.0.1:8090');
                }
            }
            
            // Только текстовые поля, никаких relation
            const contactsData = {
                name: name,
                phone: phone,
                email: email,
                message: message || ''
            };
            
            console.log('📤 Данные:', contactsData);
            
            const result = await pb.collection('contacts').create(contactsData);
            console.log('✅ Сохранено, ID:', result.id);
            
            alert('✅ Сообщение отправлено!');
            document.getElementById('feedback-form').reset();
            
        } catch (error) {
            console.error('❌ Ошибка:', error);
            alert('Ошибка отправки: ' + (error.message || 'Позвоните нам'));
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Отправить';
        }
    }

    function initMap() {
        // Проверяем, загрузился ли API Яндекс.Карт
        if (typeof ymaps === 'undefined') {
            console.log('⏳ Ожидание загрузки Яндекс.Карт...');
            setTimeout(initMap, 500);
            return;
        }
        
        ymaps.ready(function() {
            try {
                const map = new ymaps.Map('map', {
                    center: [58.508485, 31.233645], // Координаты
                    zoom: 21,
                    controls: ['zoomControl', 'fullscreenControl']
                });
                
                // Добавляем метку
                const placemark = new ymaps.Placemark([58.508485, 31.233645], {
                    hintContent: 'ПолиАрт',
                    balloonContent: '<strong>ПолиАрт</strong><br>ул. Псковская, д. 29<br>г. Великий Новгород'
                }, {
                    preset: 'islands#redIcon',
                    iconColor: '#e74c3c'
                });
                
                map.geoObjects.add(placemark);
                console.log('✅ Карта успешно загружена');
                
            } catch (error) {
                console.error('❌ Ошибка загрузки карты:', error);
                document.getElementById('map').innerHTML = '<p style="text-align:center; padding:50px;">Карта временно недоступна</p>';
            }
        });
    }

    // Вызовите initMap() после загрузки страницы
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initMap, 1000);
    });

    // Альтернативный метод отправки
    async function tryAlternativeEmailSending(name, phone, email, message) {
        if (DEBUG) console.log('🔄 Пробуем альтернативный метод отправки...');
        
        try {
            // Пробуем другой endpoint FormSubmit
            const altResponse = await fetch('https://formsubmit.co/ajax/your@email.com', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    _subject: `Форма обратной связи от ${name}`,
                    name: name,
                    phone: phone,
                    email: email,
                    message: message,
                    timestamp: new Date().toISOString()
                })
            });
            
            if (altResponse.ok) {
                if (DEBUG) console.log('✅ Альтернативная отправка успешна');
                showSuccessMessage('✅ Сообщение отправлено (альтернативным методом)!');
                return;
            }
        } catch (altError) {
            console.warn('❌ Альтернативный метод тоже не сработал:', altError);
        }
        
        // Если оба метода не сработали, показываем ошибку
        showErrorMessage();
        
        // Предлагаем открыть почтовый клиент
        setTimeout(() => {
            if (confirm('Не удалось отправить сообщение. Хотите открыть почтовый клиент для отправки вручную?')) {
                const mailtoLink = `mailto:swustinowegor@gmail.com?subject=Обратная связь от ${encodeURIComponent(name)}&body=Имя: ${encodeURIComponent(name)}%0D%0AТелефон: ${encodeURIComponent(phone)}%0D%0AEmail: ${encodeURIComponent(email)}%0D%0AСообщение: ${encodeURIComponent(message || 'Не указано')}%0D%0A%0D%0AОтправлено со страницы контактов сайта ПолиАрт`;
                window.location.href = mailtoLink;
            }
        }, 1000);
    }

    // Валидация перед отправкой
    function validateFormBeforeSubmit(nameInput, phoneInput, emailInput) {
        let isValid = true;
        
        // Проверка имени
        if (!nameInput.readOnly && !validateNameField(nameInput)) {
            isValid = false;
        }
        
        // Проверка телефона
        if (!phoneInput.readOnly && !validatePhoneField(phoneInput)) {
            isValid = false;
        }
        
        // Проверка email (всегда)
        if (!validateEmailField(emailInput)) {
            isValid = false;
        }
        
        return isValid;
    }

    // Показать сообщение об успехе
    function showSuccessMessage(text) {
        const successMessage = document.getElementById('success-message');
        if (successMessage) {
            successMessage.textContent = text;
            successMessage.style.display = 'block';
            successMessage.style.background = '#d4edda';
            successMessage.style.color = '#155724';
            successMessage.style.border = '1px solid #c3e6cb';
            successMessage.style.padding = '15px';
            successMessage.style.borderRadius = '5px';
            successMessage.style.margin = '15px 0';
            successMessage.style.textAlign = 'center';
            successMessage.style.fontWeight = 'bold';
            
            // Автоматически скрыть через 5 секунд
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 5000);
        } else {
            // Если элемента нет, показываем alert
            alert(text);
        }
    }

    // Показать сообщение об ошибке
    function showErrorMessage() {
        const errorMessage = '❌ Не удалось отправить сообщение. Пожалуйста, попробуйте позже или позвоните нам.';
        
        const successMessage = document.getElementById('success-message');
        if (successMessage) {
            successMessage.textContent = errorMessage;
            successMessage.style.display = 'block';
            successMessage.style.background = '#f8d7da';
            successMessage.style.color = '#721c24';
            successMessage.style.border = '1px solid #f5c6cb';
            successMessage.style.padding = '15px';
            successMessage.style.borderRadius = '5px';
            successMessage.style.margin = '15px 0';
            successMessage.style.textAlign = 'center';
            successMessage.style.fontWeight = 'bold';
        } else {
            alert(errorMessage);
        }
    }

    // Очистка формы
    function clearForm(nameInput, phoneInput, emailInput, messageInput) {
        // Очищаем только незаблокированные поля
        if (!nameInput.readOnly) nameInput.value = '';
        if (!phoneInput.readOnly) phoneInput.value = '';
        if (!emailInput.readOnly) emailInput.value = '';
        messageInput.value = '';
        
        // Снимаем классы ошибок
        [nameInput, phoneInput, emailInput].forEach(input => {
            input.classList.remove('error');
        });
        
        // Очищаем сообщения об ошибках
        ['name-error', 'phone-error', 'email-error'].forEach(id => {
            const errorEl = document.getElementById(id);
            if (errorEl) errorEl.textContent = '';
        });
    }

    // Добавление подсказок для пользователя
    function addUserInfoHints() {
        if (!currentUser) return;
        
        const form = document.getElementById('feedback-form');
        const formHeader = form.querySelector('h2');
        
        if (formHeader) {
            const userHint = document.createElement('div');
            userHint.className = 'user-hint';
            userHint.innerHTML = `
                <strong>👤 Вы авторизованы как ${currentUser.name || currentUser.email}</strong>
                <p>Данные заполнены автоматически из вашего профиля</p>
            `;
            
            formHeader.insertAdjacentElement('afterend', userHint);
        }
    }

    // Добавление стилей
    function addContactsStyles() {
        if (document.querySelector('#contacts-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'contacts-styles';
        styles.textContent = `
            .readonly-field {
                background-color: #f8f9fa !important;
                border-color: #dee2e6 !important;
                color: #6c757d !important;
                cursor: not-allowed !important;
            }
            
            .user-hint {
                background: #e8f4fd;
                padding: 12px 15px;
                border-radius: 8px;
                margin: 15px 0;
                font-size: 14px;
                color: #0066cc;
                border-left: 4px solid #3498db;
            }
            
            .user-hint strong {
                display: block;
                margin-bottom: 5px;
            }
            
            .user-hint p {
                margin: 0;
                font-size: 13px;
                opacity: 0.8;
            }
            
            #success-message {
                transition: all 0.3s ease;
            }
            
            /* Анимация появления */
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .user-hint, #success-message {
                animation: fadeIn 0.3s ease;
            }
            
            /* Стиль для кнопки при загрузке */
            .submit-btn:disabled {
                opacity: 0.7;
                cursor: not-allowed;
            }
            
            /* Отладка - рамка для визуализации */
            .debug-border {
                border: 2px solid #ff0000 !important;
            }
        `;
        
        document.head.appendChild(styles);
    }

    // Функция для тестирования отправки
    window.testEmailSending = async function() {
        if (DEBUG) console.log('🧪 Тестирование отправки email...');
        
        const testData = {
            _subject: 'Тестовое письмо от contacts.js',
            _template: 'table',
            'Тест': 'Тестовое сообщение',
            'Время': new Date().toLocaleString('ru-RU'),
            'Страница': 'Контакты'
        };
        
        try {
            const response = await fetch('https://formsubmit.co/ajax/swustinowegor@gmail.com', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(testData)
            });
            
            console.log('Тест отправки:', {
                status: response.status,
                ok: response.ok,
                headers: response.headers
            });
            
            const result = await response.json();
            console.log('Тест результат:', result);
            
            alert(`Тест отправки: ${response.ok ? 'УСПЕХ' : 'ОШИБКА'}\nСтатус: ${response.status}\nОтвет: ${JSON.stringify(result)}`);
            
        } catch (error) {
            console.error('Тест ошибка:', error);
            alert(`Тест ошибка: ${error.message}`);
        }
    };

    // Инициализация при загрузке
    document.addEventListener('DOMContentLoaded', function() {
        if (DEBUG) console.log('📄 DOM загружен, инициализируем контакты...');
        
        // Добавляем стили
        addContactsStyles();
        
        // Ждем немного перед инициализацией
        setTimeout(() => {
            initContactsPage();
            
            // Добавляем кнопку тестирования в режиме отладки
            if (DEBUG && window.location.hostname === 'localhost') {
                const testBtn = document.createElement('button');
                testBtn.textContent = '🧪 Тест отправки';
                testBtn.style.cssText = `
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    padding: 10px 15px;
                    background: #3498db;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    z-index: 10000;
                    font-size: 12px;
                `;
                testBtn.onclick = window.testEmailSending;
                document.body.appendChild(testBtn);
                
                console.log('✅ Кнопка тестирования добавлена');
            }
        }, 1000);
    });

})();