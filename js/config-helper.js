// js/config-helper.js
const APP_CONFIG = (function() {
    let config = {
        PB_URL: 'http://127.0.0.1:8090', // default
        SITE_URL: window.location.origin
    };
    
    async function load() {
        try {
            const response = await fetch('/config.json');
            if (response.ok) {
                const data = await response.json();
                config = { ...config, ...data };
            }
        } catch (e) {
            console.log('Используем конфиг по умолчанию');
        }
        return config;
    }
    
    function get() {
        return config;
    }
    
    return { load, get };
})();

// Загружаем конфиг при старте
window.__APP_CONFIG__ = APP_CONFIG;

// Автоматическая загрузка
APP_CONFIG.load().then(cfg => {
    window.__APP_CONFIG__ = cfg;
    console.log('Конфиг загружен:', cfg.PB_URL);
});