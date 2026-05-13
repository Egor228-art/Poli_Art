// config.js - Централизованная конфигурация
const CONFIG = {
    // PocketBase URL - берем из переменных окружения Vercel
    PB_URL: process.env.POCKETBASE_URL || 'http://127.0.0.1:8090',
    
    // Настройки сайта
    SITE_NAME: 'ПолиАрт',
    SITE_DOMAIN: process.env.VERCEL_URL || 'polyart.vercel.app',
    
    // Контактные данные
    CONTACTS: {
        phone: '+7 (8162) 55-55-55',
        email: 'info@polyart.ru',
        address: 'г. Великий Новгород, ул. Псковская, д. 29',
        workHours: 'Пн-Пт: 9:00-19:00, Сб-Вс: 10:00-17:00'
    },
    
    // Доставка
    DELIVERY: {
        freeThreshold: 15000,
        cityPrice: 500,
        suburbPrice: 800,
        regionPrice: 1000
    },
    
    // Фичи
    FEATURES: {
        enableReviews: true,
        enableConstructor: true,
        enableCart: true
    }
};

// Экспортируем для использования
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}