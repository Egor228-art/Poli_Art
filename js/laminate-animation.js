// laminate-animation.js - ИСПРАВЛЕННАЯ ВЕРСИЯ (без PocketBase)

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
        
        this.woodColors = ['#D2B48C', '#DEB887', '#BC8F8F', '#A0522D', '#8B4513', '#654321', '#DAA520', '#F4A460'];
        this.demoNames = ['Дуб золотой', 'Ясень светлый', 'Орех темный', 'Бук натуральный', 'Сосна белая', 'Вишня красная', 'Венге черный', 'Мрамор белый'];
        
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
            // Используем apiClient вместо прямого PocketBase
            if (!window.apiClient) {
                console.warn('⚠️ apiClient не загружен, используем демо-данные');
                this.createDemoData();
                return;
            }
            
            const result = await window.apiClient.getLaminate();
            const products = result.items || [];
            
            if (products.length > 0) {
                this.laminateData = products.filter(item => {
                    return item && (item.pictures || item.picture) && 
                           (item.pictures?.length > 0 || item.picture?.length > 0);
                });
                
                if (this.laminateData.length === 0) {
                    this.laminateData = products.slice(0, 10);
                }
                console.log(`✅ Получено ${this.laminateData.length} товаров с картинками`);
            } else {
                this.createDemoData();
            }
            
        } catch (error) {
            console.error('❌ Ошибка загрузки данных:', error);
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
        
        for (let i = 0; i < this.maxCards; i++) {
            const productIndex = i % this.laminateData.length;
            const card = this.createCard(this.laminateData[productIndex], 'left', i);
            const startPosition = -this.cardSize - (i * this.cardSpacing);
            this.leftCards.push({ element: card, position: startPosition, productIndex: productIndex });
        }
        
        for (let i = 0; i < this.maxCards; i++) {
            const productIndex = (i + this.maxCards) % this.laminateData.length;
            const card = this.createCard(this.laminateData[productIndex], 'right', i);
            const startPosition = window.innerHeight + (i * this.cardSpacing);
            this.rightCards.push({ element: card, position: startPosition, productIndex: productIndex });
        }
        
        console.log(`✅ Создано ${this.leftCards.length + this.rightCards.length} карточек`);
    }

    createCard(product, side, index) {
        const card = document.createElement('div');
        card.className = `laminate-card ${side}-card`;
        card.dataset.productId = product.id;
        card.dataset.productName = product.name;
        
        const { background, isImage } = this.getCardBackground(product);
        
        card.style.cssText = `
            position: absolute;
            width: ${this.cardSize}px;
            height: ${this.cardSize}px;
            ${side === 'left' ? 'left' : 'right'}: ${this.edgeMargin}px;
            top: ${side === 'left' ? -this.cardSize - (index * this.cardSpacing) : window.innerHeight + (index * this.cardSpacing)}px;
            background: ${background};
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
            z-index: 1;
            cursor: pointer;
            overflow: hidden;
            opacity: 0.9;
            transition: all 0.3s ease;
        `;
        
        if (!isImage) {
            const pattern = document.createElement('div');
            pattern.className = 'card-pattern';
            pattern.style.cssText = `
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%),
                            linear-gradient(-45deg, transparent 30%, rgba(0,0,0,0.05) 50%, transparent 70%);
                background-size: 100px 100px, 80px 80px;
                opacity: 0.4;
                pointer-events: none;
            `;
            card.appendChild(pattern);
        }
        
        const info = document.createElement('div');
        info.className = 'card-info';
        info.innerHTML = `<div class="card-name">${product.name}</div>${!isImage ? '<div class="card-hint">(цветной образец)</div>' : ''}`;
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
        });
        card.addEventListener('mouseleave', () => {
            card.style.zIndex = '1';
            card.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
        });
        
        this.container.appendChild(card);
        return card;
    }

    getCardBackground(product) {
        if (product.isDemo || product.demoColor) {
            const color = product.demoColor || this.getProductColor(product);
            return { background: this.createColorBackground(color), isImage: false };
        }
        
        try {
            const imageUrl = (product.pictures || product.picture)?.[0];
            if (imageUrl && imageUrl.startsWith('http')) {
                return { background: `url("${imageUrl}") center/cover no-repeat, #f8f9fa`, isImage: true };
            }
        } catch (error) {}
        
        const color = this.getProductColor(product);
        return { background: this.createColorBackground(color), isImage: false };
    }

    getProductColor(product) {
        if (product.demoColor) return product.demoColor;
        if (product.color && typeof product.color === 'string' && product.color.startsWith('#')) return product.color;
        
        const name = product.name || '';
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return this.woodColors[Math.abs(hash) % this.woodColors.length];
    }

    createColorBackground(color) {
        return `linear-gradient(135deg, ${this.darkenColor(color, 20)} 0%, ${color} 50%, ${this.lightenColor(color, 20)} 100%)`;
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
            
            this.leftCards.forEach((cardData) => {
                if (!cardData.element) return;
                cardData.position += this.speed;
                
                if (cardData.position > viewportHeight + 100) {
                    cardData.position = -this.cardSize - this.cardSpacing;
                    cardData.productIndex = (cardData.productIndex + 1) % this.laminateData.length;
                    this.updateCard(cardData.element, this.laminateData[cardData.productIndex]);
                }
                
                cardData.element.style.transition = 'none';
                cardData.element.style.top = `${cardData.position}px`;
                cardData.element.style.opacity = this.calculateOpacity(cardData.position, viewportHeight);
                setTimeout(() => {}, 10);
            });
            
            this.rightCards.forEach((cardData) => {
                if (!cardData.element) return;
                cardData.position -= this.speed;
                
                if (cardData.position < -this.cardSize - 100) {
                    cardData.position = viewportHeight + this.cardSize + this.cardSpacing;
                    cardData.productIndex = (cardData.productIndex + 1) % this.laminateData.length;
                    this.updateCard(cardData.element, this.laminateData[cardData.productIndex]);
                }
                
                cardData.element.style.transition = 'none';
                cardData.element.style.top = `${cardData.position}px`;
                cardData.element.style.opacity = this.calculateOpacity(cardData.position, viewportHeight);
                setTimeout(() => {}, 10);
            });
            
            this.animationId = requestAnimationFrame(animate);
        };
        
        animate();
    }

    calculateOpacity(position, viewportHeight) {
        const center = viewportHeight / 2;
        const distance = Math.abs(position + this.cardSize / 2 - center);
        const maxDistance = viewportHeight / 2 + this.cardSize;
        return Math.max(0, 1 - distance / maxDistance * 1.5);
    }

    updateCard(card, product) {
        if (!card || !product) return;
        
        const { background, isImage } = this.getCardBackground(product);
        card.style.transition = 'none';
        card.style.background = background;
        card.dataset.productName = product.name;
        
        const info = card.querySelector('.card-info');
        if (info) {
            const nameElement = info.querySelector('.card-name');
            if (nameElement) nameElement.textContent = product.name;
            
            let hintElement = info.querySelector('.card-hint');
            if (!isImage && !hintElement) {
                hintElement = document.createElement('div');
                hintElement.className = 'card-hint';
                hintElement.textContent = '(цветной образец)';
                hintElement.style.cssText = 'font-size: 10px; opacity: 0.8; margin-top: 2px;';
                info.appendChild(hintElement);
            } else if (isImage && hintElement) {
                hintElement.remove();
            }
        }
        
        setTimeout(() => { card.style.transition = ''; }, 10);
    }

    handleResize() {
        setTimeout(() => {
            this.rightCards.forEach(cardData => {
                if (cardData.element) cardData.element.style.right = `${this.edgeMargin}px`;
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
        if (this.container) this.container.innerHTML = '';
        this.leftCards = [];
        this.rightCards = [];
        console.log('🗑️ Анимация уничтожена');
    }
}

let currentAnimation = null;

function startLaminateAnimation() {
    if (currentAnimation) currentAnimation.destroy();
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
window.stopLaminateAnimation = () => { if (currentAnimation) currentAnimation.stop(); };