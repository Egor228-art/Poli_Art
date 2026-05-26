// js/admin.js - Улучшенная админ-панель
let currentUser = null;
let currentPage = 'dashboard';

async function checkAdminAccess() {
    // Ждем загрузку apiClient и authManager
    await new Promise(resolve => {
        const check = setInterval(() => {
            if (window.apiClient && window.authManager) {
                clearInterval(check);
                resolve();
            }
        }, 100);
    });
    
    // Получаем пользователя
    try {
        currentUser = await window.apiClient.getCurrentUser();
    } catch(e) {
        console.error('Ошибка получения пользователя:', e);
        window.location.href = 'login.html?redirect=admin.html';
        return false;
    }
    
    if (!currentUser) {
        window.location.href = 'login.html?redirect=admin.html';
        return false;
    }
    
    // Проверяем роль через БД, а не через кэш
    try {
        const checkRole = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        const userData = await checkRole.json();
        
        if (userData.role !== 'admin') {
            document.body.innerHTML = '<div style="text-align:center; padding:100px;"><h1>⛔ Доступ запрещен</h1><p>У вас нет прав администратора</p><a href="index.html" class="btn btn--primary">На главную</a></div>';
            return false;
        }
        
        document.getElementById('adminUserName').textContent = userData.name || userData.email;
        return true;
    } catch(e) {
        window.location.href = 'login.html?redirect=admin.html';
        return false;
    }
}

async function loadPage(page) {
    currentPage = page;
    const titles = {
        dashboard: 'Дашборд', doors: 'Управление дверями', laminate: 'Управление ламинатом',
        orders: 'Заказы', reviews: 'Отзывы', users: 'Пользователи', measure: 'Заявки на замер'
    };
    document.getElementById('pageTitle').textContent = titles[page] || page;
    
    const content = document.getElementById('pageContent');
    content.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Загрузка...</p></div>';
    
    switch(page) {
        case 'dashboard': await loadDashboard(); break;
        case 'doors': await loadProductsList('doors'); break;
        case 'laminate': await loadProductsList('laminate'); break;
        case 'orders': await loadOrdersList(); break;
        case 'reviews': await loadReviewsList(); break;
        case 'users': await loadUsersList(); break;
        case 'measure': await loadMeasureRequests(); break;
    }
}

async function loadDashboard() {
    try {
        const [doors, laminate, orders, users] = await Promise.all([
            window.apiClient.getDoors(),
            window.apiClient.getLaminate(),
            window.apiClient.getOrders(),
            fetch('/api/admin/users').then(r => r.json()).catch(() => ({ items: [] }))
        ]);
        
        const doorsCount = doors.items?.length || 0;
        const laminateCount = laminate.items?.length || 0;
        const ordersCount = orders.length || 0;
        const usersCount = users.items?.length || 0;
        
        document.getElementById('pageContent').innerHTML = `
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-info"><h3>Двери</h3><div class="stat-number">${doorsCount}</div></div><div class="stat-icon">🚪</div></div>
                <div class="stat-card"><div class="stat-info"><h3>Ламинат</h3><div class="stat-number">${laminateCount}</div></div><div class="stat-icon">🪵</div></div>
                <div class="stat-card"><div class="stat-info"><h3>Заказы</h3><div class="stat-number">${ordersCount}</div></div><div class="stat-icon">📦</div></div>
                <div class="stat-card"><div class="stat-info"><h3>Пользователи</h3><div class="stat-number">${usersCount}</div></div><div class="stat-icon">👥</div></div>
            </div>
            <div class="section-card">
                <div class="section-title"><h2>Последние заказы</h2><button class="btn-add" onclick="loadPage('orders')">Все заказы →</button></div>
                ${ordersCount === 0 ? '<div class="no-data">Нет заказов</div>' : `
                    <table class="data-table"><thead><tr><th>№</th><th>Клиент</th><th>Сумма</th><th>Статус</th></tr></thead><tbody>
                        ${orders.slice(0, 5).map(o => `<tr><td>${o.order_number || o.id.slice(0,8)}</td><td>${o.customer_name || '-'}</td><td>${(o.total_price || 0).toLocaleString()} ₽</td><td><span class="status-badge status-processing">${o.status || 'ожидает'}</span></td></tr>`).join('')}
                    </tbody></table>
                `}
            </div>
        `;
    } catch(e) { console.error(e); }
}

async function loadProductsList(collection) {
    try {
        const result = await window.apiClient[collection === 'doors' ? 'getDoors' : 'getLaminate']();
        const products = result.items || [];
        const isLaminate = collection === 'laminate';
        
        document.getElementById('pageContent').innerHTML = `
            <div class="section-card">
                <div class="section-title"><h2>${isLaminate ? 'Ламинат' : 'Двери'}</h2><button class="btn-add" onclick="openAddProductModal('${collection}')">➕ Добавить товар</button></div>
                ${products.length === 0 ? '<div class="no-data">Нет товаров</div>' : `
                    <table class="data-table"><thead><tr><th>Изображение</th><th>Название</th><th>Цена</th><th>Тип</th><th>Действия</th></tr></thead><tbody>
                        ${products.map(p => `
                            <tr>
                                <td><img src="${(p.pictures || p.picture)?.[0] || '/image/no-image.jpg'}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;" onerror="this.src='/image/no-image.jpg'"></td>
                                <td>${escapeHtml(p.name || '-')}</td>
                                <td>${parsePrice(p.price || p.prise).toLocaleString()} ₽</td>
                                <td>${isLaminate ? (p.type || '-') : (p.type || '-')}</td>
                                <td class="action-btns"><button class="action-btn action-edit" onclick="openEditProductModal('${collection}', '${p.id}')">✏️</button><button class="action-btn action-delete" onclick="deleteProduct('${collection}', '${p.id}')">🗑️</button></td>
                            </tr>
                        `).join('')}
                    </tbody></table>
                `}
            </div>
        `;
    } catch(e) { console.error(e); }
}

async function loadOrdersList() {
    try {
        const orders = await window.apiClient.getOrders();
        document.getElementById('pageContent').innerHTML = `
            <div class="section-card">
                <div class="section-title"><h2>Все заказы</h2></div>
                ${orders.length === 0 ? '<div class="no-data">Нет заказов</div>' : `
                    <table class="data-table"><thead><tr><th>№</th><th>Клиент</th><th>Телефон</th><th>Сумма</th><th>Статус</th><th>Доставка</th><th>Дата</th><th>Действия</th></tr></thead><tbody>
                        ${orders.map(o => `
                            <tr>
                                <td>${o.order_number || o.id.slice(0,8)}</td>
                                <td>${escapeHtml(o.customer_name || '-')}</td>
                                <td>${o.customer_phone || '-'}</td>
                                <td>${(o.total_price || 0).toLocaleString()} ₽</td>
                                <td><select onchange="updateOrderStatus('${o.id}', this.value)" style="padding:5px; border-radius:4px;"><option value="ожидает" ${o.status === 'ожидает' ? 'selected' : ''}>Ожидает</option><option value="обрабатывается" ${o.status === 'обрабатывается' ? 'selected' : ''}>Обрабатывается</option><option value="отправлен" ${o.status === 'отправлен' ? 'selected' : ''}>Отправлен</option><option value="доставлен" ${o.status === 'доставлен' ? 'selected' : ''}>Доставлен</option><option value="отменен" ${o.status === 'отменен' ? 'selected' : ''}>Отменен</option></select></td>
                                <td>${o.delivery_type || 'самовывоз'}</td>
                                <td>${new Date(o.created_at).toLocaleDateString()}</td>
                                <td><button class="action-btn action-delete" onclick="deleteOrder('${o.id}')">🗑️</button></td>
                            </tr>
                        `).join('')}
                    </tbody></table>
                `}
            </div>
        `;
    } catch(e) { console.error(e); }
}

async function loadUsersList() {
    try {
        const response = await fetch('/api/admin/users');
        const result = await response.json();
        const users = result.items || [];
        
        document.getElementById('pageContent').innerHTML = `
            <div class="section-card">
                <div class="section-title"><h2>Пользователи</h2></div>
                ${users.length === 0 ? '<div class="no-data">Нет пользователей</div>' : `
                    <table class="data-table"><thead><tr><th>Имя</th><th>Email</th><th>Телефон</th><th>Роль</th><th>Дата</th><th>Действия</th></tr></thead><tbody>
                        ${users.map(u => `
                            <tr>
                                <td>${escapeHtml(u.name || '-')}</td>
                                <td>${escapeHtml(u.email)}</td>
                                <td>${u.phone || '-'}</td>
                                <td><select onchange="updateUserRole('${u.id}', this.value)"><option value="user" ${u.role === 'user' ? 'selected' : ''}>Пользователь</option><option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Администратор</option></select></td>
                                <td>${new Date(u.created_at).toLocaleDateString()}</td>
                                <td><button class="action-btn action-delete" onclick="deleteUser('${u.id}')">🗑️</button></td>
                            </tr>
                        `).join('')}
                    </tbody></table>
                `}
            </div>
        `;
    } catch(e) { console.error(e); }
}

async function loadMeasureRequests() {
    try {
        const response = await fetch('/api/admin/measure');
        const result = await response.json();
        const requests = result.items || [];
        
        document.getElementById('pageContent').innerHTML = `
            <div class="section-card">
                <div class="section-title"><h2>Заявки на замер</h2></div>
                ${requests.length === 0 ? '<div class="no-data">Нет заявок</div>' : `
                    <table class="data-table"><thead><tr><th>Клиент</th><th>Телефон</th><th>Адрес</th><th>Статус</th><th>Дата</th><th>Действия</th></tr></thead><tbody>
                        ${requests.map(r => `
                            <tr>
                                <td>${escapeHtml(r.name)}</td>
                                <td>${r.phone}</td>
                                <td>${escapeHtml(r.address?.substring(0, 50) || '')}${r.address?.length > 50 ? '...' : ''}</td>
                                <td><select onchange="updateMeasureStatus('${r.id}', this.value)"><option value="новая" ${r.status === 'новая' ? 'selected' : ''}>Новая</option><option value="в обработке" ${r.status === 'в обработке' ? 'selected' : ''}>В обработке</option><option value="выполнена" ${r.status === 'выполнена' ? 'selected' : ''}>Выполнена</option><option value="отменена" ${r.status === 'отменена' ? 'selected' : ''}>Отменена</option></select></td>
                                <td>${new Date(r.created_at).toLocaleDateString()}</td>
                                <td><button class="action-btn action-delete" onclick="deleteMeasureRequest('${r.id}')">🗑️</button></td>
                            </tr>
                        `).join('')}
                    </tbody></table>
                `}
            </div>
        `;
    } catch(e) { console.error(e); }
}

async function loadReviewsList() {
    try {
        const [doorsReviews, laminateReviews] = await Promise.all([
            fetch('/api/admin/reviews/doors').then(r => r.json()).catch(() => ({ items: [] })),
            fetch('/api/admin/reviews/laminate').then(r => r.json()).catch(() => ({ items: [] }))
        ]);
        const allReviews = [...(doorsReviews.items || []), ...(laminateReviews.items || [])];
        
        document.getElementById('pageContent').innerHTML = `
            <div class="section-card">
                <div class="section-title"><h2>Все отзывы</h2></div>
                ${allReviews.length === 0 ? '<div class="no-data">Нет отзывов</div>' : `
                    <table class="data-table"><thead><tr><th>Товар</th><th>Автор</th><th>Рейтинг</th><th>Отзыв</th><th>Статус</th><th>Дата</th><th>Действия</th></tr></thead><tbody>
                        ${allReviews.map(r => `
                            <tr>
                                <td>${escapeHtml(r.product_name || r.product_id?.slice(0,8) || '-')}</td>
                                <td>${escapeHtml(r.author_name || '-')}</td>
                                <td>${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</td>
                                <td style="max-width:250px;">${escapeHtml(r.text?.substring(0, 60) || '')}${r.text?.length > 60 ? '...' : ''}</td>
                                <td><span class="status-badge ${r.approved ? 'status-delivered' : 'status-new'}">${r.approved ? 'Одобрен' : 'На модерации'}</span></td>
                                <td>${new Date(r.created_at).toLocaleDateString()}</td>
                                <td class="action-btns">${!r.approved ? `<button class="action-btn action-approve" onclick="approveReview('${r.id}', '${r.product_type || 'doors'}')">✓</button>` : ''}<button class="action-btn action-delete" onclick="deleteReview('${r.id}', '${r.product_type || 'doors'}')">🗑️</button></td>
                            </tr>
                        `).join('')}
                    </tbody></table>
                `}
            </div>
        `;
    } catch(e) { console.error(e); }
}

// CRUD операции
async function deleteProduct(collection, id) {
    if (!confirm('Удалить товар?')) return;
    await fetch('/api/admin/product/delete', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }, body: JSON.stringify({ collection, id }) });
    loadPage(collection);
}

async function updateOrderStatus(id, status) {
    await fetch('/api/admin/order/status', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }, body: JSON.stringify({ id, status }) });
}

async function deleteOrder(id) {
    if (!confirm('Удалить заказ?')) return;
    await fetch('/api/admin/order/delete', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }, body: JSON.stringify({ id }) });
    loadPage('orders');
}

async function updateUserRole(id, role) {
    await fetch('/api/admin/user/role', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }, body: JSON.stringify({ id, role }) });
}

async function deleteUser(id) {
    if (!confirm('Удалить пользователя?')) return;
    await fetch('/api/admin/user/delete', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }, body: JSON.stringify({ id }) });
    loadPage('users');
}

async function updateMeasureStatus(id, status) {
    await fetch('/api/admin/measure/status', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }, body: JSON.stringify({ id, status }) });
}

async function deleteMeasureRequest(id) {
    if (!confirm('Удалить заявку?')) return;
    await fetch('/api/admin/measure/delete', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }, body: JSON.stringify({ id }) });
    loadPage('measure');
}

async function approveReview(id, type) {
    await fetch('/api/admin/review/approve', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }, body: JSON.stringify({ id, type }) });
    loadPage('reviews');
}

async function deleteReview(id, type) {
    if (!confirm('Удалить отзыв?')) return;
    await fetch('/api/admin/review/delete', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }, body: JSON.stringify({ id, type }) });
    loadPage('reviews');
}

// Модальное окно для товаров
function openAddProductModal(collection) {
    const isLaminate = collection === 'laminate';
    document.getElementById('modalTitle').textContent = isLaminate ? 'Добавить ламинат' : 'Добавить дверь';
    document.getElementById('modalFormFields').innerHTML = `
        <input type="hidden" id="productCollection" value="${collection}">
        <div class="form-group"><label>Название *</label><input type="text" id="productName" required></div>
        <div class="form-group"><label>Описание</label><textarea id="productDescription" rows="3"></textarea></div>
        <div class="form-row"><div class="form-group"><label>Цена (₽) *</label><input type="number" id="productPrice" required></div>
        ${isLaminate ? '<div class="form-group"><label>Класс</label><input type="text" id="productType"></div>' : '<div class="form-group"><label>Тип</label><select id="productType"><option value="Межкомнатная">Межкомнатная</option><option value="Входная">Входная</option></select></div>'}</div>
        ${isLaminate ? '<div class="form-row"><div class="form-group"><label>Толщина (мм)</label><input type="text" id="productThickness"></div><div class="form-group"><label>Класс износостойкости</label><input type="text" id="productWearClass"></div></div>' : '<div class="form-row"><div class="form-group"><label>Материал</label><input type="text" id="productMaterial"></div><div class="form-group"><label>Стиль</label><input type="text" id="productStyle"></div></div>'}
        <div class="form-group"><label>Цвета (через запятую)</label><input type="text" id="productColors"></div>
        <div class="form-group"><label>Ссылки на изображения (по одной на строку)</label><textarea id="productImages" rows="2"></textarea></div>
    `;
    document.getElementById('adminModal').style.display = 'flex';
    document.getElementById('adminForm').onsubmit = async (e) => { e.preventDefault(); await createProduct(collection); };
}

async function createProduct(collection) {
    const data = {
        collection,
        name: document.getElementById('productName').value,
        description: document.getElementById('productDescription').value,
        price: parseInt(document.getElementById('productPrice').value) || 0,
        type: document.getElementById('productType')?.value,
        color: document.getElementById('productColors')?.value.split(',').map(c => c.trim()).filter(c => c),
        pictures: document.getElementById('productImages')?.value.split('\n').filter(u => u.trim())
    };
    if (collection === 'laminate') {
        data.thickness = document.getElementById('productThickness')?.value;
        data.wear_class = document.getElementById('productWearClass')?.value;
    } else {
        data.material = document.getElementById('productMaterial')?.value;
        data.style = document.getElementById('productStyle')?.value;
    }
    await fetch('/api/admin/product/create', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }, body: JSON.stringify(data) });
    closeModal();
    loadPage(collection);
}

function closeModal() {
    document.getElementById('adminModal').style.display = 'none';
}

function parsePrice(price) {
    if (!price) return 0;
    const num = parseInt(price.toString().replace(/[^\d]/g, ''));
    return isNaN(num) ? 0 : num;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
    const hasAccess = await checkAdminAccess();
    if (!hasAccess) return;
    
    document.querySelectorAll('.admin-nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.admin-nav a').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            loadPage(link.dataset.page);
        });
    });
    
    document.getElementById('closeModalBtn')?.addEventListener('click', closeModal);
    document.getElementById('cancelModalBtn')?.addEventListener('click', closeModal);
    document.getElementById('logoutAdminBtn')?.addEventListener('click', () => { window.apiClient?.setToken(null); window.location.href = 'index.html'; });
    
    await loadPage('dashboard');

    // Добавь эти функции в admin.js

function openEditProductModal(collection, id) {
    console.log('Редактирование товара:', collection, id);
    // Загружаем данные товара и заполняем форму
    fetch(`/api/admin/product/${collection}/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    })
    .then(res => res.json())
    .then(product => {
        const isLaminate = collection === 'laminate';
        document.getElementById('modalTitle').textContent = isLaminate ? 'Редактировать ламинат' : 'Редактировать дверь';
        document.getElementById('modalFormFields').innerHTML = `
            <input type="hidden" id="productCollection" value="${collection}">
            <input type="hidden" id="productEditId" value="${product.id}">
            <div class="form-group"><label>Название *</label><input type="text" id="productName" value="${escapeHtml(product.name || '')}" required></div>
            <div class="form-group"><label>Описание</label><textarea id="productDescription" rows="3">${escapeHtml(product.description || '')}</textarea></div>
            <div class="form-row"><div class="form-group"><label>Цена (₽) *</label><input type="number" id="productPrice" value="${product.price || 0}" required></div>
            ${isLaminate ? '<div class="form-group"><label>Класс</label><input type="text" id="productType" value="' + escapeHtml(product.type || '') + '"></div>' : '<div class="form-group"><label>Тип</label><select id="productType"><option value="Межкомнатная"' + (product.type === 'Межкомнатная' ? ' selected' : '') + '>Межкомнатная</option><option value="Входная"' + (product.type === 'Входная' ? ' selected' : '') + '>Входная</option></select></div>'}</div>
            ${isLaminate ? '<div class="form-row"><div class="form-group"><label>Толщина (мм)</label><input type="text" id="productThickness" value="' + escapeHtml(product.thickness || '') + '"></div><div class="form-group"><label>Класс износостойкости</label><input type="text" id="productWearClass" value="' + escapeHtml(product.wear_class || '') + '"></div></div>' : '<div class="form-row"><div class="form-group"><label>Материал</label><input type="text" id="productMaterial" value="' + escapeHtml(product.material || '') + '"></div><div class="form-group"><label>Стиль</label><input type="text" id="productStyle" value="' + escapeHtml(product.style || '') + '"></div></div>'}
            <div class="form-group"><label>Цвета (через запятую)</label><input type="text" id="productColors" value="${Array.isArray(product.color) ? product.color.join(', ') : (product.color || '')}"></div>
            <div class="form-group"><label>Ссылки на изображения (по одной на строку)</label><textarea id="productImages" rows="2">${Array.isArray(product.pictures || product.picture) ? (product.pictures || product.picture).join('\n') : ''}</textarea></div>
        `;
        document.getElementById('adminModal').style.display = 'flex';
        document.getElementById('adminForm').onsubmit = async (e) => { 
            e.preventDefault(); 
            await updateProduct(collection, product.id); 
        };
    })
    .catch(err => console.error('Ошибка загрузки товара:', err));
}

async function updateProduct(collection, id) {
    const data = {
        collection, id,
        name: document.getElementById('productName').value,
        description: document.getElementById('productDescription').value,
        price: parseInt(document.getElementById('productPrice').value) || 0,
        type: document.getElementById('productType')?.value,
        color: document.getElementById('productColors')?.value.split(',').map(c => c.trim()).filter(c => c),
        pictures: document.getElementById('productImages')?.value.split('\n').filter(u => u.trim())
    };
    if (collection === 'laminate') {
        data.thickness = document.getElementById('productThickness')?.value;
        data.wear_class = document.getElementById('productWearClass')?.value;
    } else {
        data.material = document.getElementById('productMaterial')?.value;
        data.style = document.getElementById('productStyle')?.value;
    }
    await fetch('/api/admin/product/update', { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }, 
        body: JSON.stringify(data) 
    });
    closeModal();
    loadPage(collection);
}
});