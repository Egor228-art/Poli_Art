// api/index.js - ПОЛНОСТЬЮ ИСПРАВЛЕННАЯ ВЕРСИЯ

import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-it';

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
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

function parsePrice(priceStr) {
    if (!priceStr) return 0;
    const cleanStr = priceStr.toString().replace(/[^\d]/g, '');
    const price = parseInt(cleanStr);
    return isNaN(price) ? 0 : price;
}

// ============ ОСНОВНОЙ ОБРАБОТЧИК ============
export default async function handler(req, res) {
    // CORS настройки
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;
    const params = Object.fromEntries(url.searchParams);
    
    try {
        // ============ ТОВАРЫ ============
        
        // GET /api/products/laminate
        if (path === '/api/products/laminate' && req.method === 'GET') {
            try {
                const result = await sql`SELECT * FROM laminate ORDER BY created_at DESC`;
                const products = result.rows.map(p => ({
                    ...p,
                    price: parsePrice(p.price),
                    price_display: `${parsePrice(p.price).toLocaleString()} ₽`
                }));
                return res.json({ items: products, totalItems: products.length });
            } catch (dbError) {
                console.error('Database error:', dbError);
                return res.status(500).json({ error: 'Ошибка базы данных', details: dbError.message });
            }
        }
        
        // GET /api/products/doors
        if (path === '/api/products/doors' && req.method === 'GET') {
            try {
                const result = await sql`SELECT * FROM doors ORDER BY created_at DESC`;
                const products = result.rows.map(p => ({
                    ...p,
                    price: parsePrice(p.price),
                    price_display: `${parsePrice(p.price).toLocaleString()} ₽`
                }));
                return res.json({ items: products, totalItems: products.length });
            } catch (dbError) {
                console.error('Database error:', dbError);
                return res.status(500).json({ error: 'Ошибка базы данных', details: dbError.message });
            }
        }
        
        // GET /api/products/doors/:id
        if (path.match(/^\/api\/products\/doors\/[^/]+$/) && req.method === 'GET') {
            const id = path.split('/').pop();
            const result = await sql`SELECT * FROM doors WHERE id = ${id}`;
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Товар не найден' });
            }
            const product = {
                ...result.rows[0],
                price: parsePrice(result.rows[0].price),
                price_display: `${parsePrice(result.rows[0].price).toLocaleString()} ₽`
            };
            return res.json(product);
        }
        
        // GET /api/products/laminate/:id
        if (path.match(/^\/api\/products\/laminate\/[^/]+$/) && req.method === 'GET') {
            const id = path.split('/').pop();
            const result = await sql`SELECT * FROM laminate WHERE id = ${id}`;
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Товар не найден' });
            }
            const product = {
                ...result.rows[0],
                price: parsePrice(result.rows[0].price),
                price_display: `${parsePrice(result.rows[0].price).toLocaleString()} ₽`
            };
            return res.json(product);
        }
        
        // ============ АВТОРИЗАЦИЯ ============
        
        // POST /api/auth/register
        if (path === '/api/auth/register' && req.method === 'POST') {
            const { email, password, name, phone, address } = req.body;
            
            if (!email || !password || !name) {
                return res.status(400).json({ error: 'Заполните обязательные поля' });
            }
            
            const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
            if (existing.rows.length > 0) {
                return res.status(400).json({ error: 'Email уже используется' });
            }
            
            const hashedPassword = await bcrypt.hash(password, 10);
            
            const result = await sql`
                INSERT INTO users (email, password_hash, name, phone, address, role)
                VALUES (${email}, ${hashedPassword}, ${name}, ${phone || null}, ${address || null}, 'user')
                RETURNING id, email, name, role, phone, address
            `;
            
            const user = result.rows[0];
            const token = generateToken(user);
            
            return res.json({ user, token });
        }
        
        // POST /api/auth/login
        if (path === '/api/auth/login' && req.method === 'POST') {
            const { email, password } = req.body;
            
            const result = await sql`SELECT * FROM users WHERE email = ${email}`;
            if (result.rows.length === 0) {
                return res.status(401).json({ error: 'Неверный email или пароль' });
            }
            
            const user = result.rows[0];
            const isValid = await bcrypt.compare(password, user.password_hash);
            
            if (!isValid) {
                return res.status(401).json({ error: 'Неверный email или пароль' });
            }
            
            delete user.password_hash;
            const token = generateToken(user);
            
            return res.json({ user, token });
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
            
            const result = await sql`SELECT id, email, name, role, phone, address FROM users WHERE id = ${decoded.id}`;
            if (result.rows.length === 0) {
                return res.status(401).json({ error: 'Пользователь не найден' });
            }
            
            return res.json(result.rows[0]);
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
            
            const orderNumber = `ORDER-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            
            const result = await sql`
                INSERT INTO orders (order_number, user_id, products, total_price, delivery_type, delivery_address, payment_method, customer_name, customer_phone, notes, status)
                VALUES (${orderNumber}, ${decoded.id}, ${JSON.stringify(products)}, ${total_price}, ${delivery_type}, ${delivery_address}, ${payment_method}, ${customer_name}, ${customer_phone}, ${notes}, 'ожидает')
                RETURNING *
            `;
            
            return res.json(result.rows[0]);
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
            
            const result = await sql`
                SELECT * FROM orders 
                WHERE user_id = ${decoded.id} 
                ORDER BY created_at DESC
            `;
            
            return res.json(result.rows);
        }
        
        // 404 - не найдено
        return res.status(404).json({ error: 'Endpoint не найден' });
        
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Внутренняя ошибка сервера', details: error.message });
    }
}