// footer.js - ПОЛНОСТЬЮ ПЕРЕРАБОТАННЫЙ КОД
// Динамическая загрузка футера с универсальными модальными окнами

(function() {
    'use strict';

    // Глобальные переменные
    let pb = null;
    let currentUser = null;

    // Основная функция загрузки футера
    function loadFooter() {
        const footerContainer = document.querySelector('footer');
        
        if (!footerContainer) {
            console.error('Footer container not found');
            return;
        }

        // Автоматическое определение текущего года
        const currentYear = new Date().getFullYear();

        // HTML футера
        footerContainer.innerHTML = `
            <div class="container">
                <div class="footer__inner">
                    <div class="footer__col">
                        <div class="footer__logo">ПолиАрт</div>
                        <p class="footer__text">Продажа качественных дверей, ламината и комплектующих в Новгородской области</p>
                        <div class="footer__social">
                            <a href="#" class="social-link" data-social="vk"><img src="image/icon/VK.png" alt="VK"></a>
                            <a href="#" class="social-link" data-social="ok"><img src="image/icon/One.jpg" alt="Одноклассники"></a>
                            <a href="#" class="social-link" data-social="youtube"><img src="image/icon/Youtube.png" alt="YouTube"></a>
                        </div>
                    </div>
                    <div class="footer__col">
                        <h3 class="footer__title">Каталог</h3>
                        <ul class="footer__list">
                            <li><a href="catalog.html?type=interior">Межкомнатные двери</a></li>
                            <li><a href="catalog.html?type=entrance">Входные двери</a></li>
                            <li><a href="catalog.html?type=laminate">Ламинат</a></li>
                        </ul>
                    </div>
                    <div class="footer__col">
                        <h3 class="footer__title">Услуги</h3>
                        <ul class="footer__list">
                            <li><a href="#!" class="service-info-btn" data-service="delivery">Доставка</a></li>
                            <li><a href="#!" class="service-info-btn" data-service="installation">Установка</a></li>
                            <li><a href="#!" class="service-info-btn" data-service="warranty">Гарантия</a></li>
                            <li><a href="#!" class="free-measure-btn">Бесплатный замер</a></li>
                        </ul>
                    </div>
                    <div class="footer__col">
                        <h3 class="footer__title">Контакты</h3>
                        <div class="footer__contacts">
                            <div class="contact-item">
                                <span class="contact-label">Телефон:</span>
                                <a href="tel:+78162555555" class="contact-link">+7 (8162) 55-55-55</a>
                            </div>
                            <div class="contact-item">
                                <span class="contact-label">Адрес:</span>
                                <span class="contact-text" id="footerAddress">г. Великий Новгород, ул. Примерная, д. 123</span>
                            </div>
                            <div class="contact-item">
                                <span class="contact-label">Email:</span>
                                <a href="mailto:info@polyart.ru" class="contact-link">info@polyart.ru</a>
                            </div>
                            <div class="contact-item">
                                <span class="contact-label">Режим работы:</span>
                                <span class="contact-text">Пн-Пт: 9:00-19:00, Сб-Вс: 10:00-17:00</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="footer__bottom">
                    <div class="footer__copyright">© ${currentYear} ПолиАрт. Все права защищены.</div>
                    <div class="footer__links">
                        <a href="#" class="footer-link">Политика конфиденциальности</a>
                        <a href="#" class="footer-link">Пользовательское соглашение</a>
                    </div>
                </div>
            </div>

            <!-- Модальное окно заказа замера -->
            <div class="modal-overlay" id="measureModal" style="display: none;">
                <div class="modal modal--measure">
                    <button class="modal-close" id="closeMeasureModal">&times;</button>
                    <h2 class="modal-title">Заказать бесплатный замер</h2>
                    
                    <form id="measureForm" class="measure-form">
                        <div class="form-group">
                            <label for="measureName" class="form-label">
                                Ваше имя *
                                ${currentUser ? '<span class="auth-badge">из профиля</span>' : ''}
                            </label>
                            <input type="text" id="measureName" name="name" class="form-input" required 
                                placeholder="Введите ваше имя">
                            ${currentUser ? '<span class="field-note">Для изменения отредактируйте профиль</span>' : ''}
                        </div>
                        
                        <div class="form-group">
                            <label for="measurePhone" class="form-label">
                                Телефон *
                                ${currentUser ? '<span class="auth-badge">из профиля</span>' : ''}
                            </label>
                            <input type="tel" id="measurePhone" name="phone" class="form-input" required 
                                placeholder="+7 (___) ___-__-__"
                                data-phone-input>
                            ${currentUser ? '<span class="field-note">Для изменения отредактируйте профиль</span>' : ''}
                        </div>
                        
                        <div class="form-group">
                            <label for="measureAddress" class="form-label">Адрес для замера *</label>
                            <textarea id="measureAddress" name="address" class="form-textarea" required 
                                    placeholder="${currentUser ? 'Текущий адрес из профиля. Можно изменить для данного замера' : 'Введите полный адрес: город, улица, дом, квартира...'}" 
                                    rows="3"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="measureComment" class="form-label">Комментарий (необязательно)</label>
                            <textarea id="measureComment" name="comment" class="form-textarea" 
                                    placeholder="Дополнительная информация..." 
                                    rows="2"></textarea>
                        </div>
                        
                        <div class="form-checkbox" style="margin: 20px 0;">
                            <label class="checkbox-label">
                                <input type="checkbox" id="saveAddressCheckbox" name="save_address"
                                    ${currentUser && currentUser.address ? 'checked' : 'checked'}>
                                <span class="checkbox-text">
                                    ${currentUser && currentUser.address ? 'Обновить адрес в моём профиле' : 'Сохранить адрес в моём профиле'}
                                </span>
                            </label>
                        </div>
                        
                        <div class="form-actions">
                            <button style="border: none;" type="submit" class="btn btn--primary btn--full">
                                <span class="btn-text">Заказать замер</span>
                                <span class="btn-loader" style="display: none;">⏳ Отправка...</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Модальное окно Доставка -->
            <div class="modal-overlay" id="deliveryModal" style="display: none;">
                <div class="modal modal--service">
                    <button class="modal-close" id="closeDeliveryModal">&times;</button>
                    <h2 class="modal-title">Доставка</h2>
                    <div class="modal-content">
                        <div class="service-features">
                            <div class="service-feature">
                                <div class="feature-icon">🚚</div>
                                <div class="feature-content">
                                    <h3 class="feature-title">Бесплатная доставка</h3>
                                    <p class="feature-desc">При заказе от 15 000 ₽ в пределах Великого Новгорода</p>
                                </div>
                            </div>
                            <div class="service-feature">
                                <div class="feature-icon">⚡</div>
                                <div class="feature-content">
                                    <h3 class="feature-title">Быстрая доставка</h3>
                                    <p class="feature-desc">Доставка в день заказа при наличии товара на складе</p>
                                </div>
                            </div>
                            <div class="service-feature">
                                <div class="feature-icon">🏢</div>
                                <div class="feature-content">
                                    <h3 class="feature-title">Подъём на этаж</h3>
                                    <p class="feature-desc">Бесплатный подъём до квартиры при наличии лифта</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="service-pricing">
                            <h3>Стоимость доставки:</h3>
                            <ul>
                                <li>Великий Новгород (в пределах города) - <strong>500 руб.</strong></li>
                                <li>Пригород (до 30 км) - <strong>800 руб.</strong></li>
                                <li>Районы области - <strong>от 1000 руб.</strong></li>
                                <li>Самовывоз со склада - <strong>бесплатно</strong></li>
                            </ul>
                        </div>
                        
                        <div class="service-note">
                            <p><strong>Сроки доставки:</strong> Великий Новгород - 1-2 дня, Область - 3-5 дней</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Модальное окно Установка -->
            <div class="modal-overlay" id="installationModal" style="display: none;">
                <div class="modal modal--service">
                    <button class="modal-close" id="closeInstallationModal">&times;</button>
                    <h2 class="modal-title">Установка</h2>
                    <div class="modal-content">
                        <div class="service-features">
                            <div class="service-feature">
                                <div class="feature-icon">🔧</div>
                                <div class="feature-content">
                                    <h3 class="feature-title">Профессиональный монтаж</h3>
                                    <p class="feature-desc">Установка опытными специалистами с гарантией качества</p>
                                </div>
                            </div>
                            <div class="service-feature">
                                <div class="feature-icon">🗑️</div>
                                <div class="feature-content">
                                    <h3 class="feature-title">Вынос старой конструкции</h3>
                                    <p class="feature-desc">Бесплатный демонтаж и вынос старой двери или напольного покрытия</p>
                                </div>
                            </div>
                            <div class="service-feature">
                                <div class="feature-icon">🧹</div>
                                <div class="feature-content">
                                    <h3 class="feature-title">Уборка после работ</h3>
                                    <p class="feature-desc">После завершения работ убираем помещение</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="service-pricing">
                            <h3>Стоимость услуг установки:</h3>
                            <ul>
                                <li>Установка межкомнатной двери - <strong>от 1 500 ₽</strong></li>
                                <li>Установка входной двери - <strong>от 2 500 ₽</strong></li>
                                <li>Укладка ламината (за м²) - <strong>от 350 ₽</strong></li>
                                <li>Доставка + установка - <strong>от 1 500 ₽</strong></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Модальное окно Гарантия -->
            <div class="modal-overlay" id="warrantyModal" style="display: none;">
                <div class="modal modal--service">
                    <button class="modal-close" id="closeWarrantyModal">&times;</button>
                    <h2 class="modal-title">Гарантия</h2>
                    <div class="modal-content">
                        <div class="service-features">
                            <div class="service-feature">
                                <div class="feature-icon">🛡️</div>
                                <div class="feature-content">
                                    <h3 class="feature-title">Гарантия качества</h3>
                                    <p class="feature-desc">Предоставляем гарантию до 3 лет на все виды работ и материалы</p>
                                </div>
                            </div>
                            <div class="service-feature">
                                <div class="feature-icon">24/7</div>
                                <div class="feature-content">
                                    <h3 class="feature-title">Круглосуточная поддержка</h3>
                                    <p class="feature-desc">Всегда на связи для решения любых вопросов</p>
                                </div>
                            </div>
                            <div class="service-feature">
                                <div class="feature-icon">🔧</div>
                                <div class="feature-content">
                                    <h3 class="feature-title">Бесплатный выезд</h3>
                                    <p class="feature-desc">Бесплатный выезд мастера в течение 24 часов по гарантии</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="service-guarantee">
                            <h3>Сроки гарантии:</h3>
                            <ul>
                                <li>Гарантия на двери - <strong>до 5 лет</strong></li>
                                <li>Гарантия на ламинат - <strong>до 10 лет</strong></li>
                                <li>Гарантия на монтажные работы - <strong>3 года</strong></li>
                                <li>Расширенная гарантия - <strong>+500 ₽</strong> к стоимости заказа</li>
                            </ul>
                        </div>
                        
                        <div class="service-highlight">
                            <p><strong>Что входит в гарантийное обслуживание:</strong></p>
                            <ul>
                                <li>Бесплатный выезд мастера</li>
                                <li>Ремонт или замена неисправных элементов</li>
                                <li>Консультации по уходу и эксплуатации</li>
                                <li>Приоритетное обслуживание</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Инициализируем функционал
        initFooterFunctionality();
    }

    // Основная инициализация функционала футера
    function initFooterFunctionality() {
        console.log('🚀 Инициализация функционала футера...');
        
        // 1. Инициализируем PocketBase если нужно
        initPocketBase();
        
        // 2. Настраиваем обработчики кнопок
        setupFooterButtons();
        
        // 3. Инициализируем модальные окна
        initModals();
        
        // 4. Настраиваем адаптивность
        setupResponsive();

        checkDatabaseCollections()
        
        console.log('✅ Функционал футера инициализирован');
    }

    async function checkDatabaseCollections() {
        try {
            if (!pb || !pb.authStore.isValid) return;
            
            console.log('🔍 Проверка доступности таблицы orders...');
            
            // Правильный способ проверки - попробовать получить записи
            try {
                const result = await pb.collection('orders').getList(1, 1, {
                    requestKey: 'check-collection'
                });
                console.log('✅ Таблица orders доступна');
            } catch (error) {
                if (error.status === 404) {
                    console.warn('⚠️ Таблица orders не найдена. Создайте её в PocketBase Admin');
                } else {
                    console.warn('⚠️ Ошибка доступа к таблице orders:', error.message);
                }
            }
        } catch (error) {
            console.warn('⚠️ Ошибка проверки БД:', error.message);
        }
    }

    // Инициализация PocketBase
    function initPocketBase() {
        try {
            if (typeof PocketBase !== 'undefined') {
                pb = new PocketBase('http://127.0.0.1:8090');
                pb.autoCancellation(false);
                
                // УБЕРИТЕ beforeSend! Он вызывает ошибку
                
                // Проверяем авторизацию
                if (pb.authStore.isValid) {
                    currentUser = pb.authStore.model;
                    console.log('👤 Пользователь авторизован:', {
                        id: currentUser.id,
                        email: currentUser.email,
                        name: currentUser.name,
                        address: currentUser.address
                    });
                } else {
                    console.log('👤 Пользователь не авторизован');
                }
            } else {
                console.warn('⚠️ PocketBase не загружен');
            }
        } catch (error) {
            console.error('❌ Ошибка инициализации PocketBase:', error);
        }
    }

    window.populateMeasureForm = function() {
        if (!currentUser) return;
        
        const nameInput = document.getElementById('measureName');
        const phoneInput = document.getElementById('measurePhone');
        const addressInput = document.getElementById('measureAddress');
        const saveCheckbox = document.getElementById('saveAddressCheckbox');
        
        if (currentUser) {
            console.log('👤 Пользователь авторизован, настраиваем поля формы...');
            
            if (nameInput && currentUser.name) {
                nameInput.value = currentUser.name;
                nameInput.readOnly = true;
                nameInput.title = "Имя из профиля";
                nameInput.classList.add('readonly-field');
            }
            
            if (phoneInput && currentUser.phone) {
                phoneInput.value = formatPhoneForDisplay(currentUser.phone);
                phoneInput.readOnly = true;
                phoneInput.title = "Телефон из профиля";
                phoneInput.classList.add('readonly-field');
            }
            
            if (addressInput) {
                if (currentUser.address) {
                    addressInput.value = currentUser.address;
                }
                addressInput.readOnly = false;
                addressInput.placeholder = "Адрес для замера (можно изменить)";
                
                if (saveCheckbox) {
                    saveCheckbox.checked = true;
                    saveCheckbox.disabled = false;
                }
            }
        }
    };

    // Настройка кнопок футера
    function setupFooterButtons() {
        // Социальные сети
        document.querySelectorAll('.social-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const social = this.dataset.social;
                console.log('Социальная сеть:', social);
            });
        });
        
        // Кнопки каталога
        document.querySelectorAll('.footer__list a[href^="catalog.html"]').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = this.href;
            });
        });
        
        // Кнопки услуг
        document.querySelectorAll('.service-info-btn').forEach(btn => {
            // Удаляем старые обработчики
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            // Добавляем новый обработчик
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const service = this.dataset.service;
                openServiceModal(service);
            });
        });
        
        // Кнопка бесплатного замера - специальная обработка
        document.querySelectorAll('.free-measure-btn').forEach(btn => {
            // Проверяем, не на странице ли мы услуг
            const isServicesPage = window.location.pathname.includes('services.html');
            
            // Удаляем старые обработчики
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            // Добавляем новый обработчик
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('📞 Открытие модального окна замера из футера');
                
                // Если мы на странице услуг, убеждаемся что модальное окно существует
                if (isServicesPage) {
                    // Проверяем, загружено ли модальное окно
                    const modal = document.getElementById('measureModal');
                    if (!modal) {
                        console.warn('⚠️ Модальное окно не найдено, пробуем перезагрузить футер');
                        // Принудительно перезагружаем футер с модальными окнами
                        if (typeof loadFooter === 'function') {
                            loadFooter();
                        }
                    }
                }
                
                // Открываем модальное окно
                openMeasureModal();
            });
        });
    }

    // Инициализация всех модальных окон
    function initModals() {
        // 1. Инициализация модального окна замера
        initMeasureModal();
        
        // 2. Инициализация сервисных модальных окон
        initServiceModals();
        
        // 3. Глобальные обработчики закрытия
        setupGlobalModalHandlers();
    }

    // ============ МОДАЛЬНОЕ ОКНО ЗАМЕРА ============

    function initMeasureModal() {
        console.log('📐 Инициализация модального окна замера...');
        
        // Настройка маски телефона
        const phoneInput = document.getElementById('measurePhone');
        if (phoneInput && !phoneInput.readOnly) {
            phoneInput.addEventListener('input', formatPhoneNumber);
        }
        
        // Настройка отправки формы
        const measureForm = document.getElementById('measureForm');
        if (measureForm) {
            measureForm.addEventListener('submit', submitMeasureRequest);
        }
        
        // Настройка обработчика крестика
        const closeBtn = document.getElementById('closeMeasureModal');
        if (closeBtn) {
            // Удаляем старый обработчик если есть
            closeBtn.removeEventListener('click', closeMeasureModal);
            // Добавляем новый
            closeBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const modal = document.getElementById('measureModal');
                if (modal) {
                    modal.style.display = 'none';
                    document.body.style.overflow = '';
                }
            });
        }
        
        // Автозаполнение для авторизованных пользователей
        setTimeout(populateMeasureForm, 500);
        
        console.log('✅ Модальное окно замера инициализировано');
    }

    function populateMeasureForm() {
        if (!currentUser) return;
        
        const nameInput = document.getElementById('measureName');
        const phoneInput = document.getElementById('measurePhone');
        const addressInput = document.getElementById('measureAddress');
        const saveCheckbox = document.getElementById('saveAddressCheckbox');
        const formNotice = document.querySelector('.form-notice');
        
        if (currentUser) {
            console.log('👤 Пользователь авторизован, настраиваем поля формы...');
            
            // Заполняем данные
            if (nameInput && currentUser.name) {
                nameInput.value = currentUser.name;
                nameInput.readOnly = true;
                nameInput.title = "Имя из профиля";
                nameInput.classList.add('readonly-field');
            }
            
            if (phoneInput && currentUser.phone) {
                phoneInput.value = formatPhoneForDisplay(currentUser.phone);
                phoneInput.readOnly = true;
                phoneInput.title = "Телефон из профиля";
                phoneInput.classList.add('readonly-field');
            }
            
            if (addressInput) {
                if (currentUser.address) {
                    addressInput.value = currentUser.address;
                }
                addressInput.readOnly = false;
                addressInput.placeholder = "Адрес для замера (можно изменить)";
                
                // Настройка чекбокса
                if (saveCheckbox) {
                    saveCheckbox.checked = true;
                    saveCheckbox.disabled = false;
                    saveCheckbox.title = currentUser.address ? 
                        "Обновить адрес в вашем профиле" : 
                        "Сохранить адрес в вашем профиле";
                }
            }
            
            // Добавляем информацию о сохранении в БД
            if (formNotice) {
                const existingInfo = formNotice.querySelector('.db-info');
                if (!existingInfo) {
                    const dbInfo = document.createElement('p');
                    dbInfo.className = 'db-info';
                    dbInfo.style.cssText = `
                        font-size: 13px;
                        color: #27ae60;
                        margin-top: 10px;
                        padding: 8px;
                        background: #f1f8e9;
                        border-radius: 4px;
                        border-left: 3px solid #4caf50;
                    `;
                    dbInfo.innerHTML = `
                        <strong>ℹ️ Информация:</strong> Заявка будет сохранена в базу данных 
                        и появится в вашем личном кабинете в разделе "Заказы".
                    `;
                    formNotice.appendChild(dbInfo);
                }
            }
        }
    }

    function formatPhoneForDisplay(phone) {
        if (!phone) return '';
        
        const phoneStr = phone.toString();
        if (phoneStr.length >= 10) {
            return `+7 (${phoneStr.substring(0, 3)}) ${phoneStr.substring(3, 6)}-${phoneStr.substring(6, 8)}-${phoneStr.substring(8, 10)}`;
        }
        return `+7${phoneStr}`;
    }

    function formatPhoneNumber(event) {
        const input = event.target;
        let value = input.value.replace(/\D/g, '');
        
        if (value.startsWith('7') || value.startsWith('8')) {
            value = '7' + value.substring(1);
        } else if (value.startsWith('9')) {
            value = '7' + value;
        }
        
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
        
        input.value = formatted;
    }

    // Открытие модального окна замера
    window.openMeasureModal = function() {
        console.log('📞 Открытие модального окна замера...');
        
        const modal = document.getElementById('measureModal');
        if (!modal) {
            console.error('❌ Модальное окно замера не найдено');
            return;
        }
        
        // Сбрасываем форму
        const form = document.getElementById('measureForm');
        if (form) {
            form.reset();
        }
        
        // Автозаполняем и блокируем поля для авторизованных пользователей
        populateMeasureForm();
        
        // Показываем модальное окно
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Фокус на поле имени (если оно не заблокировано)
        setTimeout(() => {
            const nameInput = document.getElementById('measureName');
            const addressInput = document.getElementById('measureAddress');
            
            if (nameInput && !nameInput.readOnly) {
                nameInput.focus();
            } else if (addressInput) {
                addressInput.focus();
            }
        }, 100);
        
        console.log('✅ Модальное окно замера открыто');
    };

    // Закрытие модального окна замера
    window.closeMeasureModal = function() {
        const modal = document.getElementById('measureModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            console.log('✅ Модальное окно замера закрыто');
        }
    };

    async function submitMeasureRequest(event) {
        event.preventDefault();
        
        console.log('📤 Отправка заявки на замер...');
        
        // Получаем данные формы
        const name = document.getElementById('measureName').value.trim();
        const phone = document.getElementById('measurePhone').value.trim();
        const address = document.getElementById('measureAddress').value.trim();
        const comment = document.getElementById('measureComment').value.trim();
        const saveAddress = document.getElementById('saveAddressCheckbox')?.checked || false;
        
        // Валидация
        if (!name || !phone || !address) {
            showNotification('❌ Пожалуйста, заполните все обязательные поля', 'error');
            return;
        }
        
        // Преобразуем телефон в числовой формат
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length < 10) {
            showNotification('❌ Введите корректный номер телефона (минимум 10 цифр)', 'error');
            return;
        }
        
        // Показываем индикатор загрузки
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const btnText = submitBtn?.querySelector('.btn-text');
        const btnLoader = submitBtn?.querySelector('.btn-loader');
        
        if (submitBtn) {
            submitBtn.disabled = true;
            if (btnText) btnText.style.display = 'none';
            if (btnLoader) btnLoader.style.display = 'inline';
        }
        
        try {
            // 1. Сохраняем адрес в профиль пользователя если нужно
            if (saveAddress && currentUser && address) {
                try {
                    console.log('💾 Сохранение адреса в профиль пользователя...');
                    await pb.collection('users').update(currentUser.id, {
                        address: address
                    });
                    console.log('✅ Адрес сохранен в профиль пользователя');
                    currentUser.address = address;
                } catch (error) {
                    console.warn('⚠️ Не удалось сохранить адрес в профиль:', error.message);
                }
            }
            
            // 2. Сохраняем заявку в БД по вашей структуре
            console.log('💾 Сохранение заявки в таблицу orders...');
            
            // Генерируем номер заявки
            const now = new Date();
            const dateStr = now.getFullYear().toString() + 
                        (now.getMonth() + 1).toString().padStart(2, '0') + 
                        now.getDate().toString().padStart(2, '0');
            const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
            const orderNumber = `MEASURE-${dateStr}-${random}`;
            
            // Подготавливаем данные по вашей структуре
            const measureData = {
                user: currentUser ? currentUser.id : null,
                product: 'Бесплатный замер', // text
                product_name: 'Услуга замера помещения', // text
                quantity: 1, // number
                unit_price: 0, // number
                total_price: 0, // number
                delivery_type: 'самовывоз', // select (по умолчанию для замера)
                delivery_address: address, // text
                warranty_service: false, // bool
                assembly_service: false, // bool
                status: 'ожидает', // select
                payment_method: 'наличные', // select (по умолчанию для замера)
                order_number: orderNumber, // text
                notes: `Заявка на бесплатный замер. ${comment ? 'Комментарий: ' + comment : ''}`, // text
                created: new Date().toISOString(), // date
                updated: new Date().toISOString(), // date
                customer_name: name, // Добавляем как дополнительное поле
                customer_phone: cleanPhone // Добавляем как дополнительное поле
            };
            
            console.log('Данные для сохранения в orders:', measureData);
            
            // Сохраняем в таблицу orders
            const record = await pb.collection('orders').create(measureData);
            console.log('✅ Заявка сохранена в БД:', record.id, record.order_number);
            
            // Показываем успешное уведомление
            showNotification(`✅ Заявка на замер №${orderNumber} сохранена! Наш специалист свяжется с вами.`, 'success');
            
            // 3. Закрываем модалку и очищаем форму через 2 секунды
            setTimeout(() => {
                closeMeasureModal();
                
                // Очищаем только незаблокированные поля
                const form = document.getElementById('measureForm');
                if (form) {
                    const inputs = form.querySelectorAll('input, textarea');
                    inputs.forEach(input => {
                        // Очищаем только те поля, которые не readonly и не disabled
                        if (!input.readOnly && !input.disabled && input.type !== 'checkbox') {
                            input.value = '';
                        }
                    });
                    
                    // Сбрасываем чекбокс "Сохранить адрес"
                    const saveCheckbox = document.getElementById('saveAddressCheckbox');
                    if (saveCheckbox) {
                        saveCheckbox.checked = false;
                    }
                    
                    // Сбрасываем комментарий (он всегда редактируемый)
                    const commentField = document.getElementById('measureComment');
                    if (commentField) {
                        commentField.value = '';
                    }
                }
            }, 2000);
            
        } catch (error) {
            console.error('❌ Ошибка сохранения заявки:', error);
            
            // Детализируем ошибку
            let errorMessage = '❌ Ошибка при сохранении заявки. ';
            
            if (error.message.includes('422')) {
                errorMessage += 'Некорректные данные. Проверьте заполнение полей.';
            } else if (error.message.includes('403')) {
                errorMessage += 'Нет прав доступа к базе данных.';
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage += 'Нет подключения к серверу. Проверьте интернет.';
            } else {
                errorMessage += 'Попробуйте позже или позвоните нам.';
            }
            
            showNotification(errorMessage, 'error');
            
            // В случае ошибки БД, предлагаем альтернативу
            if (currentUser && pb.authStore.isValid) {
                setTimeout(() => {
                    if (confirm('Не удалось сохранить заявку. Хотите попробовать создать заявку через личный кабинет?')) {
                        closeMeasureModal();
                        // Можно перенаправить в личный кабинет
                        if (window.location.pathname.includes('personal.html')) {
                            window.location.reload();
                        } else {
                            window.location.href = 'personal.html';
                        }
                    }
                }, 1000);
            }
            
        } finally {
            // Восстанавливаем кнопку
            if (submitBtn) {
                submitBtn.disabled = false;
                if (btnText) btnText.style.display = 'inline';
                if (btnLoader) btnLoader.style.display = 'none';
            }
        }
    }

    // ============ СЕРВИСНЫЕ МОДАЛЬНЫЕ ОКНА ============

    function initServiceModals() {
        console.log('🛠️ Инициализация сервисных модальных окон...');
        
        // Настройка обработчиков закрытия для каждого модального окна
        const services = ['delivery', 'installation', 'warranty'];
        
        services.forEach(service => {
            const closeBtn = document.getElementById(`close${service.charAt(0).toUpperCase() + service.slice(1)}Modal`);
            if (closeBtn) {
                closeBtn.addEventListener('click', () => closeServiceModal(service));
            }
        });
        
        console.log('✅ Сервисные модальные окна инициализированы');
    }

    // Открытие сервисного модального окна
    window.openServiceModal = function(serviceType) {
        console.log(`🛠️ Открытие модального окна: ${serviceType}`);
        
        const modal = document.getElementById(`${serviceType}Modal`);
        if (!modal) {
            console.error(`❌ Модальное окно ${serviceType} не найдено`);
            return;
        }
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        console.log(`✅ Модальное окно ${serviceType} открыто`);
    };

    // Закрытие сервисного модального окна
    window.closeServiceModal = function(serviceType) {
        const modal = document.getElementById(`${serviceType}Modal`);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            console.log(`✅ Модальное окно ${serviceType} закрыто`);
        }
    };

    // ============ ГЛОБАЛЬНЫЕ ОБРАБОТЧИКИ ============

    function setupGlobalModalHandlers() {
        console.log('🔧 Настройка глобальных обработчиков модальных окон...');
        
        // Закрытие по клику на overlay
        document.addEventListener('click', function(e) {
            // Крестики закрытия
            if (e.target.classList.contains('modal-close') || 
                e.target.closest('.modal-close')) {
                e.preventDefault();
                e.stopPropagation();
                
                // Находим родительское модальное окно
                const modal = e.target.closest('.modal-overlay');
                if (modal) {
                    modal.style.display = 'none';
                    document.body.style.overflow = '';
                    console.log('✅ Модальное окно закрыто по крестику');
                }
                return;
            }
            
            // Закрытие по клику на overlay (тёмный фон)
            if (e.target.classList.contains('modal-overlay')) {
                const modal = e.target;
                modal.style.display = 'none';
                document.body.style.overflow = '';
                console.log('✅ Модальное окно закрыто по overlay');
            }
        });
        
        // Закрытие по ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const openModals = document.querySelectorAll('.modal-overlay[style*="display: flex"]');
                if (openModals.length > 0) {
                    openModals.forEach(modal => {
                        modal.style.display = 'none';
                        document.body.style.overflow = '';
                    });
                    console.log('✅ Модальные окна закрыты по ESC');
                }
            }
        });
        
        // Делегирование событий для всех крестиков
        document.addEventListener('click', function(e) {
            const closeBtn = e.target.closest('.modal-close');
            if (closeBtn) {
                const modal = closeBtn.closest('.modal-overlay');
                if (modal) {
                    modal.style.display = 'none';
                    document.body.style.overflow = '';
                    console.log('✅ Модальное окно закрыто');
                }
            }
        });
        
        console.log('✅ Глобальные обработчики настроены');
    }

    // ============ АДАПТИВНОСТЬ ============

    function setupResponsive() {
        // Аккордеон для мобильной версии
        if (window.innerWidth <= 768) {
            const footerTitles = document.querySelectorAll('.footer__title');
            
            footerTitles.forEach(title => {
                title.style.cursor = 'pointer';
                
                title.addEventListener('click', function() {
                    const content = this.nextElementSibling;
                    
                    if (content.style.maxHeight) {
                        content.style.maxHeight = null;
                        this.classList.remove('active');
                    } else {
                        content.style.maxHeight = content.scrollHeight + "px";
                        this.classList.add('active');
                    }
                });
            });
        }
        
        // Обработчик изменения размера окна
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                // На десктопе сбрасываем стили аккордеона
                document.querySelectorAll('.footer__list').forEach(list => {
                    list.style.maxHeight = '';
                });
                document.querySelectorAll('.footer__title').forEach(title => {
                    title.classList.remove('active');
                });
            }
        });
    }

    // ============ УТИЛИТЫ ============

    // Показ уведомлений
    function showNotification(message, type = 'info') {
        // Удаляем старые уведомления
        document.querySelectorAll('.footer-notification').forEach(el => el.remove());
        
        const notification = document.createElement('div');
        notification.className = `footer-notification footer-notification--${type}`;
        notification.innerHTML = message;
        
        // Стили уведомления
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10001;
            animation: slideIn 0.3s ease;
            font-weight: 500;
            max-width: 400px;
            font-size: 14px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            color: white;
        `;
        
        if (type === 'success') {
            notification.style.background = 'linear-gradient(135deg, #27ae60, #20c997)';
        } else if (type === 'error') {
            notification.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
        } else {
            notification.style.background = 'linear-gradient(135deg, #3498db, #2980b9)';
        }
        
        // Кнопка закрытия
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
        closeBtn.onclick = () => notification.remove();
        notification.appendChild(closeBtn);
        
        document.body.appendChild(notification);
        
        // Автоудаление
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
    }

    // Добавление CSS стилей
    function addStyles() {
        const styles = document.createElement('style');
        styles.textContent = `
            .db-info {
                animation: fadeIn 0.5s ease;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .success-badge {
                background: #4caf50;
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 11px;
                margin-left: 5px;
                font-weight: normal;
            }

            /* Стили для футера */
            .footer__inner {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 30px;
                margin-bottom: 40px;
            }
            
            .footer__col {
                margin-bottom: 20px;
            }
            
            .footer__logo {
                font-size: 24px;
                font-weight: bold;
                color: #e74c3c;
                margin-bottom: 15px;
            }
            
            .footer__text {
                color: rgba(255, 255, 255, 0.8);
                line-height: 1.6;
                margin-bottom: 20px;
            }
            
            .footer__social {
                display: flex;
                gap: 10px;
            }
            
            .social-link img {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                transition: transform 0.3s;
            }
            
            .social-link:hover img {
                transform: scale(1.1);
            }
            
            .footer__title {
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 15px;
                color: white;
            }
            
            .footer__list {
                list-style: none;
                padding: 0;
            }
            
            .footer__list li {
                margin-bottom: 10px;
            }
            
            .footer__list a {
                color: rgba(255, 255, 255, 0.8);
                text-decoration: none;
                transition: color 0.3s;
            }
            
            .footer__list a:hover {
                color: #c0392b;
            }
            
            .footer__contacts {
                color: rgba(255, 255, 255, 0.8);
            }
            
            .contact-item {
                margin-bottom: 10px;
                display: flex;
                align-items: flex-start;
            }
            
            .contact-label {
                font-weight: 500;
                margin-right: 5px;
                min-width: 100px;
            }
            
            .contact-link {
                color: rgba(255, 255, 255, 0.8);
                text-decoration: none;
            }
            
            .contact-link:hover {
                color: #c0392b;
            }
            
            .footer__bottom {
                border-top: 1px solid #eee;
                padding-top: 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 20px;
            }
            
            .footer__copyright {
                color: rgba(255, 255, 255, 0.8);
            }
            
            .footer__links {
                display: flex;
                gap: 20px;
            }
            
            .footer-link {
                color: rgba(255, 255, 255, 0.8);
                text-decoration: none;
                font-size: 14px;
            }
            
            .footer-link:hover {
                color: #c0392b;
            }
            
            /* Модальные окна */
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                z-index: 999999 !important;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            
            .modal {
                background: white;
                border-radius: 12px;
                max-width: 500px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                position: relative;
                z-index: 999999 !important;
                animation: modalAppear 0.3s ease;
            }
            
            .modal--measure {
                max-width: 500px;
            }
            
            .modal--service {
                max-width: 600px;
            }
            
            .modal-close {
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
                z-index: 1000001 !important;
            }
            
            .modal-close:hover {
                color: #333;
            }
            
            .modal-title {
                padding: 25px 25px 15px;
                margin: 0;
                color: #333;
                font-size: 22px;
                text-align: center;
            }
            
            .modal-content {
                padding: 0 25px 25px;
            }
            
            /* Форма замера */
            .measure-form {
                padding: 0 25px 25px;
            }
            
            .form-group {
                margin-bottom: 20px;
            }
            
            .form-label {
                display: block;
                margin-bottom: 8px;
                font-weight: 500;
                color: #333;
            }
            
            .form-input {
                width: 100%;
                padding: 12px 15px;
                border: 2px solid #ddd;
                border-radius: 6px;
                font-size: 16px;
                box-sizing: border-box;
                transition: border-color 0.3s;
            }
            
            .form-input:focus {
                border-color: #c0392b;
                outline: none;
            }
            
            .form-textarea {
                width: 100%;
                padding: 12px 15px;
                border: 2px solid #ddd;
                border-radius: 6px;
                font-size: 16px;
                min-height: 80px;
                resize: vertical;
                box-sizing: border-box;
                transition: border-color 0.3s;
            }
            
            .form-textarea:focus {
                border-color: #c0392b;
                outline: none;
            }
            
            .form-checkbox {
                margin: 20px 0;
            }
            
            .checkbox-label {
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                user-select: none;
            }
            
            .checkbox-text {
                color: #666;
            }
            
            .form-actions {
                margin: 25px 0 0;
            }
            
            .btn {
                padding: 14px 28px;
                border: none;
                border-radius: 6px;
                font-size: 16px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }
            
            .btn--primary {
                background: linear-gradient(135deg, #e74c3c, #c0392b);
                color: white;
            }
            
            .btn--primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(231, 76, 60, 0.3);
            }
            
            .btn--full {
                width: 100%;
            }
            
            .btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
            
            .btn-loader {
                display: none;
            }
            
            /* Сервисные модальные окна */
            .service-features {
                margin-bottom: 25px;
            }
            
            .service-feature {
                display: flex;
                align-items: flex-start;
                gap: 15px;
                margin-bottom: 20px;
                padding: 15px;
                background: #f9f9f9;
                border-radius: 8px;
                border-left: 4px solid #e74c3c;
            }
            
            .feature-icon {
                font-size: 24px;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            
            .feature-content {
                flex: 1;
            }
            
            .feature-title {
                margin: 0 0 5px 0;
                color: #333;
                font-size: 16px;
                font-weight: 600;
            }
            
            .feature-desc {
                margin: 0;
                color: #666;
                font-size: 14px;
                line-height: 1.4;
            }
            
            .service-pricing,
            .service-guarantee,
            .service-highlight {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 20px;
                border: 1px solid #eee;
            }
            
            .service-pricing h3,
            .service-guarantee h3,
            .service-highlight p {
                margin: 0 0 15px 0;
                color: #333;
                font-weight: 600;
            }
            
            .service-pricing ul,
            .service-guarantee ul,
            .service-highlight ul {
                margin: 0;
                padding-left: 20px;
                color: #666;
            }
            
            .service-pricing li,
            .service-guarantee li,
            .service-highlight li {
                margin-bottom: 8px;
            }
            
            .service-note {
                padding: 15px;
                background: #fff3cd;
                border-radius: 6px;
                border-left: 4px solid #ffc107;
                color: #856404;
                font-size: 14px;
            }
            
            /* Уведомления */
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
            
            @keyframes modalAppear {
                from {
                    opacity: 0;
                    transform: translateY(-20px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
            
            /* Адаптивность */
            @media (max-width: 768px) {
                .footer__inner {
                    grid-template-columns: 1fr;
                }
                
                .footer__col {
                    margin-bottom: 30px;
                }
                
                .footer__title {
                    position: relative;
                    padding-right: 25px;
                }
                
                .footer__title::after {
                    content: '▼';
                    position: absolute;
                    right: 0;
                    top: 0;
                    font-size: 12px;
                    transition: transform 0.3s;
                }
                
                .footer__title.active::after {
                    transform: rotate(180deg);
                }
                
                .footer__list {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.3s ease;
                }
                
                .modal {
                    width: 95%;
                }
                
                .service-feature {
                    flex-direction: column;
                    text-align: center;
                }
                
                .feature-icon {
                    margin: 0 auto;
                }
            }
            
            @media (max-width: 480px) {
                .footer__bottom {
                    flex-direction: column;
                    text-align: center;
                }
                
                .footer__links {
                    flex-direction: column;
                    gap: 10px;
                }
                
                .modal-title {
                    font-size: 20px;
                    padding: 20px 20px 10px;
                }
                
                .modal-content,
                .measure-form {
                    padding: 0 20px 20px;
                }
            }
            .readonly-field {
    background-color: #f5f5f5 !important;
    border-color: #ddd !important;
    color: #666 !important;
    cursor: not-allowed !important;
}

.readonly-field:focus {
    border-color: #ddd !important;
    box-shadow: none !important;
}

.auth-badge {
    display: inline-block;
    background: #e74c3c;
    color: white;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 10px;
    margin-left: 8px;
    vertical-align: middle;
}

.form-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
}
        `;
        
        document.head.appendChild(styles);
    }

    // ============ ИНИЦИАЛИЗАЦИЯ ============

    // Запуск при загрузке страницы
    document.addEventListener('DOMContentLoaded', function() {
        console.log('📄 Загрузка футера...');
        
        // Добавляем стили
        addStyles();
        
        // Загружаем футер
        loadFooter();
        
        // Делаем функции глобально доступными
        window.openMeasureModal = openMeasureModal;
        window.closeMeasureModal = closeMeasureModal;
        window.openServiceModal = openServiceModal;
        window.closeServiceModal = closeServiceModal;
        
        console.log('✅ Футер загружен');
    });

    // Экспортируем глобально для использования в других файлах
    window.footerManager = {
        openMeasureModal,
        closeMeasureModal,
        openServiceModal,
        closeServiceModal,
        showNotification
    };

})();