// api/index.js - БЕЗ @vercel/blob
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-polyart-2024';

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

export default async function handler(req, res) {
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
        // ============ ТЕСТОВЫЙ ЭНДПОИНТ ============
        if (path === '/api/test') {
            return res.json({ 
                message: '✅ API работает!', 
                time: new Date().toISOString(),
                env: {
                    hasPostgresUrl: !!process.env.POSTGRES_URL,
                    nodeVersion: process.version
                }
            });
        }
        
        // ============ ТОВАРЫ ============
        
        if (path === '/api/products/laminate') {
            try {
                // Проверяем подключение к БД
                const testDb = await sql`SELECT NOW() as now`;
                console.log('БД подключена:', testDb.rows[0]);
                
                // Получаем ламинат
                const result = await sql`SELECT * FROM laminate LIMIT 50`;
                return res.json({ items: result.rows, totalItems: result.rows.length });
            } catch (error) {
                console.error('Ошибка:', error.message);
                // Возвращаем демо-данные если таблицы нет
                return res.json({ 
                    items: [
                        { id: '1', name: 'Дуб классический', price: 1200, type: '32', thickness: '8', color: ['Коричневый'], pictures: [] },
                        { id: '2', name: 'Ясень светлый', price: 1100, type: '32', thickness: '8', color: ['Бежевый'], pictures: [] },
                        { id: '3', name: 'Орех темный', price: 1300, type: '33', thickness: '10', color: ['Темный'], pictures: [] },
                        { id: '4', name: 'Венге', price: 1400, type: '33', thickness: '10', color: ['Черный'], pictures: [] },
                        { id: '5', name: 'Бук натуральный', price: 1250, type: '32', thickness: '8', color: ['Бежевый'], pictures: [] }
                    ], 
                    totalItems: 5,
                    isDemo: true 
                });
            }
        }
        
        if (path === '/api/products/doors') {
            try {
                const result = await sql`SELECT * FROM doors LIMIT 50`;
                return res.json({ items: result.rows, totalItems: result.rows.length });
            } catch (error) {
                return res.json({ 
                    items: [
                        { id: '1', name: 'Дверь классическая', price: 8000, type: 'Межкомнатная', material: 'МДФ', color: ['Белый'], pictures: [] },
                        { id: '2', name: 'Дверь входная', price: 15000, type: 'Входная', material: 'Металл', color: ['Коричневый'], pictures: [] },
                        { id: '3', name: 'Дверь с остеклением', price: 12000, type: 'Межкомнатная', material: 'Шпон', color: ['Орех'], pictures: [] }
                    ], 
                    totalItems: 3,
                    isDemo: true 
                });
            }
        }

        // GET /api/products/doors/:id
        if (path.match(/^\/api\/products\/doors\/[^/]+$/) && req.method === 'GET') {
            const id = path.split('/').pop();
            try {
                const result = await sql`SELECT * FROM doors WHERE id = ${id}`;
                if (result.rows.length === 0) {
                    return res.status(404).json({ error: 'Товар не найден' });
                }
                return res.json(result.rows[0]);
            } catch (error) {
                return res.status(500).json({ error: 'Ошибка получения товара' });
            }
        }

        // GET /api/products/laminate/:id
        if (path.match(/^\/api\/products\/laminate\/[^/]+$/) && req.method === 'GET') {
            const id = path.split('/').pop();
            try {
                const result = await sql`SELECT * FROM laminate WHERE id = ${id}`;
                if (result.rows.length === 0) {
                    return res.status(404).json({ error: 'Товар не найден' });
                }
                return res.json(result.rows[0]);
            } catch (error) {
                return res.status(500).json({ error: 'Ошибка получения товара' });
            }
        }

        // GET /api/reviews/:productId
        if (path.match(/^\/api\/reviews\/[^/]+$/) && req.method === 'GET') {
            const productId = path.split('/').pop();
            const urlParams = new URL(req.url, `http://${req.headers.host}`);
            const type = urlParams.searchParams.get('type');
            const table = type === 'laminate' ? 'reviews_laminate' : 'reviews';
            
            try {
                const result = await sql`SELECT * FROM ${sql(table)} WHERE product_id = ${productId} ORDER BY created_at DESC`;
                return res.json(result.rows);
            } catch (error) {
                return res.json([]);
            }
        }

        // PUT /api/user/profile
        if (path === '/api/user/profile' && req.method === 'PUT') {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({ error: 'Не авторизован' });
            }
            
            const token = authHeader.split(' ')[1];
            const decoded = verifyToken(token);
            
            if (!decoded) {
                return res.status(401).json({ error: 'Недействительный токен' });
            }
            
            const { name, phone, address } = req.body;
            
            // Строим запрос только с переданными полями
            const updates = [];
            if (name !== undefined) updates.push(sql`name = ${name}`);
            if (phone !== undefined) updates.push(sql`phone = ${phone}`);
            if (address !== undefined) updates.push(sql`address = ${address}`);
            
            if (updates.length === 0) {
                return res.status(400).json({ error: 'Нет данных для обновления' });
            }
            
            // Собираем запрос
            let query = sql`UPDATE users SET updated_at = NOW()`;
            for (const update of updates) {
                query = sql`${query}, ${update}`;
            }
            query = sql`${query} WHERE id = ${decoded.id} RETURNING id, email, name, role, phone, address`;
            
            const result = await query;
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Пользователь не найден' });
            }
            
            return res.json(result.rows[0]);
        }

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
            
            const { product_id, product_name, rating, text, isLaminate } = req.body;
            const table = isLaminate ? 'reviews_laminate' : 'reviews';
            
            try {
                const result = await sql`
                    INSERT INTO ${sql(table)} (product_id, product_name, rating, text, author_name, author_email, approved)
                    VALUES (${product_id}, ${product_name}, ${rating}, ${text}, ${decoded.name}, ${decoded.email}, false)
                    RETURNING *
                `;
                return res.json(result.rows[0]);
            } catch (error) {
                console.error('Review error:', error);
                return res.status(500).json({ error: 'Ошибка сохранения отзыва' });
            }
        }

        // POST /api/contacts
        if (path === '/api/contacts' && req.method === 'POST') {
            const { name, phone, email, message } = req.body;
            
            let userId = null;
            const authHeader = req.headers.authorization;
            if (authHeader) {
                const token = authHeader.split(' ')[1];
                const decoded = verifyToken(token);
                if (decoded) userId = decoded.id;
            }
            
            try {
                // Сохраняем сообщение в БД
                await sql`
                    INSERT INTO contact_messages (name, phone, email, message, user_id, is_read)
                    VALUES (${name}, ${phone || null}, ${email || null}, ${message}, ${userId}, false)
                `;
                
                // Здесь можно добавить отправку email через nodemailer или другой сервис
                
                return res.json({ success: true, message: 'Сообщение отправлено' });
            } catch (error) {
                console.error('Error saving contact:', error);
                return res.status(500).json({ error: 'Ошибка сохранения сообщения' });
            }
        }
        
        // ============ АВТОРИЗАЦИЯ ============
        
        if (path === '/api/auth/register' && req.method === 'POST') {
            const { email, password, name, phone, address } = req.body;
            
            if (!email || !password || !name) {
                return res.status(400).json({ error: 'Заполните обязательные поля' });
            }
            
            try {
                const hashedPassword = await bcrypt.hash(password, 10);
                
                const result = await sql`
                    INSERT INTO users (email, password_hash, name, phone, address, role)
                    VALUES (${email}, ${hashedPassword}, ${name}, ${phone || null}, ${address || null}, 'user')
                    RETURNING id, email, name, role, phone, address
                `;
                
                const user = result.rows[0];
                const token = generateToken(user);
                
                return res.json({ user, token });
            } catch (error) {
                if (error.message.includes('duplicate key')) {
                    return res.status(400).json({ error: 'Email уже используется' });
                }
                throw error;
            }
        }
        
        if (path === '/api/auth/login' && req.method === 'POST') {
            const { email, password } = req.body;
            
            try {
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
            } catch (error) {
                console.error('Login error:', error);
                return res.status(500).json({ error: 'Ошибка входа' });
            }
        }
        
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
            
            try {
                const result = await sql`SELECT id, email, name, role, phone, address FROM users WHERE id = ${decoded.id}`;
                if (result.rows.length === 0) {
                    return res.status(401).json({ error: 'Пользователь не найден' });
                }
                return res.json(result.rows[0]);
            } catch (error) {
                return res.status(500).json({ error: 'Ошибка получения данных' });
            }
        }
        
        // ============ ЗАКАЗЫ ============
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
    
    try {
        const result = await sql`
            SELECT * FROM orders 
            WHERE user_id = ${decoded.id} 
            ORDER BY created_at DESC
        `;
        return res.json(result.rows);
    } catch (error) {
        console.error('Error getting orders:', error);
        return res.json([]);
    }
}

// ============ СОЗДАНИЕ ЗАКАЗА ============
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
    
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    try {
        const result = await sql`
            INSERT INTO orders (
                order_number, user_id, products, total_price, 
                delivery_type, delivery_address, payment_method, 
                customer_name, customer_phone, customer_email, notes, status
            ) VALUES (
                ${orderNumber}, ${decoded.id}, ${JSON.stringify(products || [])}, ${total_price}, 
                ${delivery_type || 'pickup'}, ${delivery_address || null}, ${payment_method || 'наличные'}, 
                ${customer_name || decoded.name}, ${customer_phone || null}, ${decoded.email}, ${notes || null}, 'ожидает'
            )
            RETURNING *
        `;
        
        return res.json(result.rows[0]);
    } catch (error) {
        console.error('Order creation error:', error);
        return res.status(500).json({ error: 'Ошибка создания заказа', details: error.message });
    }
}

// ============ ОБНОВЛЕНИЕ ПРОФИЛЯ ============
if (path === '/api/user/profile' && req.method === 'PUT') {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Не авторизован' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
        return res.status(401).json({ error: 'Недействительный токен' });
    }
    
    const { name, phone, address } = req.body;
    
    try {
        let query = sql`UPDATE users SET updated_at = NOW()`;
        
        if (name !== undefined) {
            query = sql`${query}, name = ${name}`;
        }
        if (phone !== undefined) {
            query = sql`${query}, phone = ${phone}`;
        }
        if (address !== undefined) {
            query = sql`${query}, address = ${address}`;
        }
        
        query = sql`${query} WHERE id = ${decoded.id} RETURNING id, email, name, role, phone, address`;
        
        const result = await query;
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        return res.json(result.rows[0]);
    } catch (error) {
        console.error('Profile update error:', error);
        return res.status(500).json({ error: 'Ошибка обновления профиля', details: error.message });
    }
}


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
            
            // Генерируем номер заказа
            const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            
            console.log('Создание заказа:', { 
                user_id: decoded.id, 
                orderNumber, 
                products: products?.length,
                total_price 
            });
            
            try {
                // Проверяем, что products - это массив
                const productsJson = JSON.stringify(products || []);
                
                const result = await sql`
                    INSERT INTO orders (
                        order_number, user_id, products, total_price, 
                        delivery_type, delivery_address, payment_method, 
                        customer_name, customer_phone, notes, status, created_at
                    ) VALUES (
                        ${orderNumber}, ${decoded.id}, ${productsJson}, ${total_price}, 
                        ${delivery_type || 'pickup'}, ${delivery_address || null}, ${payment_method || 'наличные'}, 
                        ${customer_name || decoded.name}, ${customer_phone || null}, ${notes || null}, 'ожидает', NOW()
                    )
                    RETURNING *
                `;
                
                console.log('✅ Заказ создан:', result.rows[0].id);
                return res.json(result.rows[0]);
                
            } catch (error) {
                console.error('Order creation error:', error);
                return res.status(500).json({ error: 'Ошибка создания заказа', details: error.message });
            }
        }
        
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
            
            try {
                const result = await sql`
                    INSERT INTO orders (order_number, user_id, products, total_price, delivery_type, delivery_address, payment_method, customer_name, customer_phone, notes, status)
                    VALUES (${orderNumber}, ${decoded.id}, ${JSON.stringify(products)}, ${total_price}, ${delivery_type}, ${delivery_address}, ${payment_method}, ${customer_name}, ${customer_phone}, ${notes}, 'ожидает')
                    RETURNING *
                `;
                return res.json(result.rows[0]);
            } catch (error) {
                console.error('Order creation error:', error);
                return res.status(500).json({ error: 'Ошибка создания заказа' });
            }
        }
        
        // 404
        return res.status(404).json({ error: 'Endpoint не найден' });
        
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Внутренняя ошибка сервера', details: error.message });
    }
}