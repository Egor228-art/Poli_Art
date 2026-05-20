// api/index.js - УПРОЩЕННАЯ ВЕРСИЯ (без Postgres, использует Blob)

import { put, get, del, list } from '@vercel/blob';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-it';

// Хранилище данных
let usersData = [];
let doorsData = [];
let laminateData = [];
let ordersData = [];
let reviewsData = [];

// Загрузка данных из Blob при старте
async function loadData() {
    try {
        const { blobs } = await list({ prefix: 'data/' });
        
        for (const blob of blobs) {
            const response = await fetch(blob.url);
            const data = await response.json();
            
            if (blob.pathname.includes('users')) usersData = data;
            if (blob.pathname.includes('doors')) doorsData = data;
            if (blob.pathname.includes('laminate')) laminateData = data;
            if (blob.pathname.includes('orders')) ordersData = data;
            if (blob.pathname.includes('reviews')) reviewsData = data;
        }
    } catch (error) {
        console.log('No existing data, using defaults');
        initDefaultData();
    }
}

// Инициализация данных по умолчанию
function initDefaultData() {
    laminateData = [
        { id: '1', name: 'Дуб золотой', price: 1200, type: '33', thickness: '8', wear_class: '33', color: ['Дуб', 'Золотистый'], type_room: ['Гостиная', 'Спальня'], pictures: [] },
        { id: '2', name: 'Ясень серый', price: 1500, type: '33', thickness: '12', wear_class: '33', color: ['Серый', 'Ясень'], type_room: ['Кухня', 'Коридор'], pictures: [] },
        { id: '3', name: 'Венге темный', price: 2000, type: '34', thickness: '12', wear_class: '34', color: ['Венге', 'Темный'], type_room: ['Гостиная', 'Офис'], pictures: [] }
    ];
    
    doorsData = [
        { id: '1', name: 'Дуб классический', price: 15000, type: 'Межкомнатная', material: 'Массив', color: ['Дуб', 'Орех'], style: 'Классика', pictures: [] },
        { id: '2', name: 'Сосна белая', price: 8900, type: 'Межкомнатная', material: 'Массив', color: ['Сосна', 'Белый'], style: 'Модерн', pictures: [] },
        { id: '3', name: 'Входная стальная', price: 35000, type: 'Входная', material: 'Металл', color: ['Черный', 'Серый'], style: 'Минимализм', pictures: [] }
    ];
    
    usersData = [];
}

// Сохранение данных в Blob
async function saveData(type, data) {
    await put(`data/${type}.json`, JSON.stringify(data, null, 2), {
        access: 'public',
        addRandomSuffix: false
    });
}

// ============ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ============
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}

function generateToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role || 'user' },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

// ============ ОСНОВНОЙ ОБРАБОТЧИК ============
export default async function handler(req, res) {
    // Загружаем данные при первом запросе
    if (laminateData.length === 0 && doorsData.length === 0) {
        await loadData();
    }
    
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;
    
    try {
        // ============ ТОВАРЫ ============
        
        // GET /api/products/laminate
        if (path === '/api/products/laminate' && req.method === 'GET') {
            return res.json({ items: laminateData, totalItems: laminateData.length });
        }
        
        // GET /api/products/doors
        if (path === '/api/products/doors' && req.method === 'GET') {
            return res.json({ items: doorsData, totalItems: doorsData.length });
        }
        
        // GET /api/products/laminate/:id
        if (path.match(/^\/api\/products\/laminate\/[^/]+$/) && req.method === 'GET') {
            const id = path.split('/').pop();
            const product = laminateData.find(p => p.id === id);
            if (!product) return res.status(404).json({ error: 'Товар не найден' });
            return res.json(product);
        }
        
        // GET /api/products/doors/:id
        if (path.match(/^\/api\/products\/doors\/[^/]+$/) && req.method === 'GET') {
            const id = path.split('/').pop();
            const product = doorsData.find(p => p.id === id);
            if (!product) return res.status(404).json({ error: 'Товар не найден' });
            return res.json(product);
        }
        
        // ============ АВТОРИЗАЦИЯ ============
        
        // POST /api/auth/register
        if (path === '/api/auth/register' && req.method === 'POST') {
            const { email, password, name, phone, address } = req.body;
            
            if (!email || !password || !name) {
                return res.status(400).json({ error: 'Заполните обязательные поля' });
            }
            
            const existing = usersData.find(u => u.email === email);
            if (existing) {
                return res.status(400).json({ error: 'Email уже используется' });
            }
            
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = {
                id: Date.now().toString(),
                email,
                password_hash: hashedPassword,
                name,
                phone: phone || null,
                address: address || null,
                role: 'user',
                created_at: new Date().toISOString()
            };
            
            usersData.push(newUser);
            await saveData('users', usersData);
            
            const { password_hash, ...user } = newUser;
            const token = generateToken(user);
            
            return res.json({ user, token });
        }
        
        // POST /api/auth/login
        if (path === '/api/auth/login' && req.method === 'POST') {
            const { email, password } = req.body;
            
            const user = usersData.find(u => u.email === email);
            if (!user) {
                return res.status(401).json({ error: 'Неверный email или пароль' });
            }
            
            const isValid = await bcrypt.compare(password, user.password_hash);
            if (!isValid) {
                return res.status(401).json({ error: 'Неверный email или пароль' });
            }
            
            const { password_hash, ...userData } = user;
            const token = generateToken(userData);
            
            return res.json({ user: userData, token });
        }
        
        // GET /api/auth/me
        if (path === '/api/auth/me' && req.method === 'GET') {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({ error: 'Не авторизован' });
            }
            
            const token = authHeader.split(' ')[1];
            const decoded = verifyToken(token);
            
            if (!decoded) {
                return res.status(401).json({ error: 'Недействительный токен' });
            }
            
            const user = usersData.find(u => u.id === decoded.id);
            if (!user) {
                return res.status(401).json({ error: 'Пользователь не найден' });
            }
            
            const { password_hash, ...userData } = user;
            return res.json(userData);
        }
        
        // ============ ЗАКАЗЫ ============
        
        // POST /api/orders
        if (path === '/api/orders' && req.method === 'POST') {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({ error: 'Не авторизован' });
            }
            
            const token = authHeader.split(' ')[1];
            const decoded = verifyToken(token);
            
            if (!decoded) {
                return res.status(401).json({ error: 'Недействительный токен' });
            }
            
            const { products, total_price, delivery_type, delivery_address, payment_method, customer_name, customer_phone, notes } = req.body;
            
            const newOrder = {
                id: Date.now().toString(),
                order_number: `ORDER-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                user_id: decoded.id,
                products,
                total_price,
                status: 'ожидает',
                delivery_type: delivery_type || 'pickup',
                delivery_address: delivery_address || '',
                payment_method: payment_method || 'наличные',
                customer_name: customer_name || decoded.name,
                customer_phone: customer_phone || '',
                notes: notes || '',
                created_at: new Date().toISOString()
            };
            
            ordersData.push(newOrder);
            await saveData('orders', ordersData);
            
            return res.json(newOrder);
        }
        
        // GET /api/orders
        if (path === '/api/orders' && req.method === 'GET') {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({ error: 'Не авторизован' });
            }
            
            const token = authHeader.split(' ')[1];
            const decoded = verifyToken(token);
            
            if (!decoded) {
                return res.status(401).json({ error: 'Недействительный токен' });
            }
            
            const userOrders = ordersData.filter(o => o.user_id === decoded.id);
            return res.json(userOrders);
        }
        
        // ============ ОТЗЫВЫ ============
        
        // POST /api/reviews
        if (path === '/api/reviews' && req.method === 'POST') {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({ error: 'Не авторизован' });
            }
            
            const token = authHeader.split(' ')[1];
            const decoded = verifyToken(token);
            
            if (!decoded) {
                return res.status(401).json({ error: 'Недействительный токен' });
            }
            
            const { product_id, product_name, rating, text, pros, cons, isLaminate } = req.body;
            
            const newReview = {
                id: Date.now().toString(),
                product_id,
                product_name,
                rating,
                text,
                pros: pros || '',
                cons: cons || '',
                author_name: decoded.name,
                author_email: decoded.email,
                approved: false,
                product_type: isLaminate ? 'laminate' : 'doors',
                created_at: new Date().toISOString()
            };
            
            reviewsData.push(newReview);
            await saveData('reviews', reviewsData);
            
            return res.json(newReview);
        }
        
        // GET /api/reviews/:productId
        if (path.match(/^\/api\/reviews\/[^/]+$/) && req.method === 'GET') {
            const productId = path.split('/').pop();
            const productReviews = reviewsData.filter(r => r.product_id === productId && r.approved === true);
            return res.json(productReviews);
        }
        
        // GET /api/reviews/laminate/:productId
        if (path.match(/^\/api\/reviews\/laminate\/[^/]+$/) && req.method === 'GET') {
            const productId = path.split('/').pop();
            const productReviews = reviewsData.filter(r => r.product_id === productId && r.product_type === 'laminate' && r.approved === true);
            return res.json(productReviews);
        }
        
        // 404
        return res.status(404).json({ error: 'Endpoint не найден' });
        
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Внутренняя ошибка сервера', details: error.message });
    }
}