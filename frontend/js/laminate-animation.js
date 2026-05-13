// laminate-animation.js - Исправленная версия с правильным исчезновением ЗА экраном

class LaminateAnimation {
    constructor() {
        this.laminateData = [];
        this.leftCards = [];
        this.rightCards = [];
        this.container = null;
        this.speed = 2.0;
        this.cardSize = 180;
        this.cardSpacing = 300;
        this.edgeMargin = 5;
        this.maxCards = 6;
        this.animationId = null;
        this.isAnimating = false;
        
        // Цвета для демо
        this.woodColors = [
            '#D2B48C', '#DEB887', '#BC8F8F', '#A0522D',
            '#8B4513', '#654321', '#DAA520', '#F4A460'
        ];
        
        this.demoNames = [
            'Дуб золотой', 'Ясень светлый', 'Орех темный', 'Бук натуральный',
            'Сосна белая', 'Вишня красная', 'Венге черный', 'Мрамор белый'
        ];
        
        this.init();
    }

    async init() {
        console.log('🔄 Инициализация анимации ламината...');
        
        this.container = document.querySelector('.laminate-animation-container');
        if (!this.container) {
            console.error('❌ Контейнер не найден');
            return;
        }
        
        this.container.innerHTML = '';
        await this.loadData();
        this.createCards();
        this.startAnimation();
        
        window.addEventListener('resize', () => this.handleResize());
        
        console.log('✅ Анимация ламината запущена');
    }

    async loadData() {
        console.log('📥 Загрузка данных...');
        
        try {
            if (typeof PocketBase === 'undefined') {
                console.warn('⚠️ PocketBase не загружен, используем демо-данные');
                this.createDemoData();
                return;
            }
            
            const pb = new PocketBase('http://127.0.0.1:8090');
            pb.autoCancellation(false);
            
            try {
                const response = await pb.collection('laminate').getList(1, 20);
                
                if (response.items && response.items.length > 0) {
                    console.log(`✅ Получено ${response.items.length} записей`);
                    
                    this.laminateData = response.items.filter(item => {
                        return item && item.picture && Array.isArray(item.picture) && 
                               item.picture.length > 0 && item.picture[0] &&
                               typeof item.picture[0] === 'string' &&
                               item.picture[0].trim() !== '';
                    });
                    
                    console.log(`🖼️ Найдено ${this.laminateData.length} товаров с картинками`);
                    
                    if (this.laminateData.length === 0) {
                        console.log('⚠️ Нет товаров с картинками, используем все товары');
                        this.laminateData = response.items.slice(0, 10);
                    }
                    
                } else {
                    console.warn('⚠️ Нет данных в коллекции laminate');
                    this.createDemoData();
                }
                
            } catch (fetchError) {
                console.error('❌ Ошибка при запросе данных:', fetchError.message);
                this.createDemoData();
            }
            
        } catch (error) {
            console.error('❌ Общая ошибка загрузки:', error.message);
            this.createDemoData();
        }
    }

    createDemoData() {
        console.log('🎨 Создаем демо-данные...');
        
        this.laminateData = [];
        
        for (let i = 0; i < 8; i++) {
            this.laminateData.push({
                id: `demo${i + 1}`,
                name: this.demoNames[i] || `Ламинат ${i + 1}`,
                picture: [`laminate${i + 1}.jpg`],
                demoColor: this.woodColors[i % this.woodColors.length],
                isDemo: true
            });
        }
        
        console.log(`✅ Создано ${this.laminateData.length} демо-записей`);
    }

    createCards() {
        if (this.laminateData.length === 0) {
            console.error('❌ Нет данных для создания карточек');
            return;
        }
        
        this.leftCards = [];
        this.rightCards = [];
        
        console.log(`🎴 Создаем карточки из ${this.laminateData.length} товаров...`);
        
        // Левые карточки (движение ВНИЗ)
        for (let i = 0; i < this.maxCards; i++) {
            const productIndex = i % this.laminateData.length;
            const card = this.createCard(this.laminateData[productIndex], 'left', i);
            
            // Начальная позиция - начинаем ЗА верхним краем экрана
            const startPosition = -this.cardSize - (i * this.cardSpacing);
            
            this.leftCards.push({
                element: card,
                position: startPosition,
                productIndex: productIndex
            });
        }
        
        // Правые карточки (движение ВВЕРХ)
        for (let i = 0; i < this.maxCards; i++) {
            const productIndex = (i + this.maxCards) % this.laminateData.length;
            const card = this.createCard(this.laminateData[productIndex], 'right', i);
            
            // Начальная позиция - начинаем ЗА нижним краем экрана
            const startPosition = window.innerHeight + (i * this.cardSpacing);
            
            this.rightCards.push({
                element: card,
                position: startPosition,
                productIndex: productIndex
            });
        }
        
        console.log(`✅ Создано ${this.leftCards.length + this.rightCards.length} карточек`);
    }

    createCard(product, side, index) {
        const card = document.createElement('div');
        card.className = `laminate-card ${side}-card`;
        card.dataset.productId = product.id;
        card.dataset.productName = product.name;
        
        const rotation = (Math.random() * 6 - 3);
        const tilt = (Math.random() * 4 - 2);
        
        const { background, isImage } = this.getCardBackground(product);
        
        // Начальная позиция ЗА пределами экрана
        const startPosition = side === 'left' 
            ? -this.cardSize - (index * this.cardSpacing) // ЗА верхним краем
            : window.innerHeight + (index * this.cardSpacing); // ЗА нижним краем
        
        // Убираем все плавные переходы для позиции
        card.style.cssText = `
            position: absolute;
            width: ${this.cardSize}px;
            height: ${this.cardSize}px;
            ${side === 'left' ? 'left' : 'right'}: ${this.edgeMargin}px;
            top: ${startPosition}px;
            background: ${background};
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
            z-index: 1;
            cursor: pointer;
            overflow: hidden;
            opacity: 0.9;
            filter: blur(0.5px);
        `;
        
        if (isImage) {
            card.addEventListener('error', () => {
                console.warn(`❌ Ошибка загрузки изображения для ${product.name}`);
                const color = this.getProductColor(product);
                card.style.background = this.createColorBackground(color);
                card.querySelector('.card-pattern')?.remove();
            }, true);
        }
        
        if (!isImage) {
            const pattern = document.createElement('div');
            pattern.className = 'card-pattern';
            pattern.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: 
                    linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%),
                    linear-gradient(-45deg, transparent 30%, rgba(0,0,0,0.05) 50%, transparent 70%);
                background-size: 100px 100px, 80px 80px;
                opacity: 0.4;
                pointer-events: none;
            `;
            card.appendChild(pattern);
        }
        
        const info = document.createElement('div');
        info.className = 'card-info';
        info.innerHTML = `
            <div class="card-name">${product.name}</div>
            ${!isImage ? '<div class="card-hint">(цветной образец)</div>' : ''}
        `;
        info.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 12px 8px;
            background: linear-gradient(to top, rgba(0,0,0,0.85), transparent);
            color: white;
            font-size: 13px;
            font-weight: 500;
            text-align: center;
            pointer-events: none;
        `;
        
        card.appendChild(info);
        
        card.addEventListener('mouseenter', () => {
            card.style.zIndex = '100';
            card.style.boxShadow = '0 15px 35px rgba(0,0,0,0.25)';
            card.style.filter = 'blur(0px) brightness(1.1)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.zIndex = '1';
            card.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
            card.style.filter = 'blur(0.5px) brightness(1)';
        });
        
        this.container.appendChild(card);
        
        return card;
    }

    getCardBackground(product) {
        if (product.isDemo || product.demoColor) {
            const color = product.demoColor || this.getProductColor(product);
            return {
                background: this.createColorBackground(color),
                isImage: false
            };
        }
        
        try {
            if (product.picture && product.picture[0] && product.id) {
                const imageName = product.picture[0];
                const imageUrl = `http://127.0.0.1:8090/api/files/laminate/${product.id}/${imageName}`;
                
                return {
                    background: `url("${imageUrl}") center/cover no-repeat, #f8f9fa`,
                    isImage: true
                };
            }
        } catch (error) {
            console.warn(`⚠️ Ошибка создания URL для ${product.name}:`, error.message);
        }
        
        const color = this.getProductColor(product);
        return {
            background: this.createColorBackground(color),
            isImage: false
        };
    }

    getProductColor(product) {
        if (product.color && typeof product.color === 'string' && product.color.startsWith('#')) {
            return product.color;
        }
        
        if (product.demoColor) {
            return product.demoColor;
        }
        
        const name = product.name || '';
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        return this.woodColors[Math.abs(hash) % this.woodColors.length];
    }

    createColorBackground(color) {
        return `
            linear-gradient(135deg, ${this.darkenColor(color, 20)} 0%, ${color} 50%, ${this.lightenColor(color, 20)} 100%)
        `;
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    startAnimation() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        console.log('▶️ Запуск анимации...');
        
        const animate = () => {
            if (!this.isAnimating) return;
            
            const viewportHeight = window.innerHeight;
            
            // ЛЕВЫЕ карточки: ДВИЖЕНИЕ ВНИЗ
            this.leftCards.forEach((cardData, index) => {
                if (!cardData.element) return;
                
                const card = cardData.element;
                
                // Просто двигаем карточку вниз
                cardData.position += this.speed;
                
                // Проверяем, вышла ли карточка ЗА нижний край экрана
                // + 100px чтобы точно скрылась полностью
                if (cardData.position > viewportHeight + 100) {
                    // Перемещаем карточку НАД экраном (ЗА верхним краем)
                    // -this.cardSpacing чтобы появилась с небольшим запасом
                    cardData.position = -this.cardSize - this.cardSpacing;
                    
                    // Берем следующий товар
                    cardData.productIndex = (cardData.productIndex + 1) % this.laminateData.length;
                    const product = this.laminateData[cardData.productIndex];
                    
                    // Сразу обновляем карточку (но она еще не видна)
                    this.updateCard(card, product);
                }
                
                // Устанавливаем новую позицию БЕЗ анимации
                card.style.transition = 'none'; // Убираем плавность для позиции
                card.style.top = `${cardData.position}px`;
                
                // Прозрачность: 100% в центре, 0% у краев
                const centerOpacity = this.calculateOpacity(cardData.position, viewportHeight, 'left');
                card.style.opacity = centerOpacity;
                
                // Размытие: 0 в центре, больше у краев
                const blurAmount = this.calculateBlur(cardData.position, viewportHeight);
                card.style.filter = `blur(${blurAmount}px)`;
                
                // Восстанавливаем transition для hover эффектов
                setTimeout(() => {
                }, 10);
            });
            
            // ПРАВЫЕ карточки: ДВИЖЕНИЕ ВВЕРХ
            this.rightCards.forEach((cardData, index) => {
                if (!cardData.element) return;
                
                const card = cardData.element;
                
                // Двигаем карточку вверх
                cardData.position -= this.speed;
                
                // Проверяем, вышла ли карточка ЗА верхний край экрана
                if (cardData.position < -this.cardSize - 100) {
                    // Перемещаем карточку ПОД экраном (ЗА нижним краем)
                    cardData.position = viewportHeight + this.cardSize + this.cardSpacing;
                    
                    // Берем следующий товар
                    cardData.productIndex = (cardData.productIndex + 1) % this.laminateData.length;
                    const product = this.laminateData[cardData.productIndex];
                    
                    // Обновляем карточку
                    this.updateCard(card, product);
                }
                
                // Устанавливаем новую позицию
                card.style.transition = 'none';
                card.style.top = `${cardData.position}px`;
                
                // Прозрачность
                const centerOpacity = this.calculateOpacity(cardData.position, viewportHeight, 'right');
                card.style.opacity = centerOpacity;
                
                // Размытие
                const blurAmount = this.calculateBlur(cardData.position, viewportHeight);
                card.style.filter = `blur(${blurAmount}px)`;
                
                setTimeout(() => {
                }, 10);
            });
            
            this.animationId = requestAnimationFrame(animate);
        };
        
        animate();
    }

    calculateOpacity(position, viewportHeight, side) {
      
    }

    calculateBlur(position, viewportHeight) {
    }

    updateCard(card, product) {
        if (!card || !product) return;
        
        const { background, isImage } = this.getCardBackground(product);
        
        // Сохраняем текущий transition
        const currentTransition = card.style.transition;
        
        // Мгновенно обновляем фон без анимации
        card.style.transition = 'none';
        card.style.background = background;
        card.dataset.productName = product.name;
        
        // Обновляем текст
        const info = card.querySelector('.card-info');
        if (info) {
            const nameElement = info.querySelector('.card-name');
            const hintElement = info.querySelector('.card-hint');
            
            if (nameElement) {
                nameElement.textContent = product.name;
            }
            
            if (!isImage && !hintElement) {
                const hint = document.createElement('div');
                hint.className = 'card-hint';
                hint.textContent = '(цветной образец)';
                hint.style.cssText = 'font-size: 10px; opacity: 0.8; margin-top: 2px;';
                info.appendChild(hint);
            } else if (isImage && hintElement) {
                hintElement.remove();
            }
        }
        
        // Текстура для цветных карточек
        if (!isImage && !card.querySelector('.card-pattern')) {
            const pattern = document.createElement('div');
            pattern.className = 'card-pattern';
            pattern.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: 
                    linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%),
                    linear-gradient(-45deg, transparent 30%, rgba(0,0,0,0.05) 50%, transparent 70%);
                background-size: 100px 100px, 80px 80px;
                opacity: 0.4;
                pointer-events: none;
            `;
            card.appendChild(pattern);
        } else if (isImage) {
            card.querySelector('.card-pattern')?.remove();
        }
        
        // Восстанавливаем transition
        setTimeout(() => {
            card.style.transition = currentTransition;
        }, 10);
    }

    handleResize() {
        // При ресайзе корректируем позиции правых карточек
        setTimeout(() => {
            this.rightCards.forEach(cardData => {
                if (cardData.element) {
                    cardData.element.style.right = `${this.edgeMargin}px`;
                }
            });
        }, 100);
    }

    stop() {
        this.isAnimating = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        console.log('⏹️ Анимация остановлена');
    }

    destroy() {
        this.stop();
        
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        this.leftCards = [];
        this.rightCards = [];
        
        console.log('🗑️ Анимация уничтожена');
    }
}

// Глобальное управление
let currentAnimation = null;

function startLaminateAnimation() {
    if (currentAnimation) {
        currentAnimation.destroy();
    }
    
    setTimeout(() => {
        try {
            currentAnimation = new LaminateAnimation();
            window.laminateAnimation = currentAnimation;
        } catch (error) {
            console.error('❌ Ошибка запуска анимации:', error);
        }
    }, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 Страница загружена, запускаем анимацию...');
    startLaminateAnimation();
});

window.startLaminateAnimation = startLaminateAnimation;
window.stopLaminateAnimation = () => {
    if (currentAnimation) {
        currentAnimation.stop();
    }
};