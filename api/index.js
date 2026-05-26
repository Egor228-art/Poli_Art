// api/index.js - ПОЛНОСТЬЮ ПЕРЕПИСАННЫЙ
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
    
    console.log(`${req.method} ${path}`);
    
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
        
        // GET /api/products/laminate
        if (path === '/api/products/laminate' && req.method === 'GET') {
            try {
                const result = await sql`SELECT * FROM laminate LIMIT 100`;
                return res.json({ items: result.rows, totalItems: result.rows.length });
            } catch (error) {
                console.error('Error loading laminate:', error);
                return res.json({ items: [], totalItems: 0 });
            }
        }
        
        // GET /api/products/doors
        if (path === '/api/products/doors' && req.method === 'GET') {
            try {
                const result = await sql`SELECT * FROM doors LIMIT 100`;
                return res.json({ items: result.rows, totalItems: result.rows.length });
            } catch (error) {
                console.error('Error loading doors:', error);
                return res.json({ items: [], totalItems: 0 });
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
        
        // ============ АВТОРИЗАЦИЯ ============
        
        // POST /api/auth/register
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
        
        // POST /api/auth/login
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
            
            const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            
            console.log('Creating order:', { 
                userId: decoded.id, 
                orderNumber, 
                productsCount: products?.length,
                totalPrice: total_price,
                deliveryType: delivery_type,
                address: delivery_address
            });
            
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
                
                console.log('Order created:', result.rows[0].id);
                return res.json(result.rows[0]);
            } catch (error) {
                console.error('Order creation error:', error);
                return res.status(500).json({ error: 'Ошибка создания заказа', details: error.message });
            }
        }
        
        // ============ ОБНОВЛЕНИЕ ПРОФИЛЯ ============
        
        // POST /api/user/avatar
        if (path === '/api/user/avatar' && req.method === 'POST') {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({ error: 'Не авторизован' });
            }
            
            const token = authHeader.split(' ')[1];
            const decoded = verifyToken(token);
            
            if (!decoded) {
                return res.status(401).json({ error: 'Недействительный токен' });
            }
            
            // Пока просто возвращаем успех (для аватара нужно настроить blob storage)
            return res.json({ success: true, message: 'Функционал аватара в разработке' });
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
            
            const { address } = req.body;
            
            try {
                const result = await sql`
                    UPDATE users 
                    SET address = ${address}, updated_at = NOW()
                    WHERE id = ${decoded.id}
                    RETURNING id, email, name, role, phone, address
                `;
                
                if (result.rows.length === 0) {
                    return res.status(404).json({ error: 'Пользователь не найден' });
                }
                
                return res.json(result.rows[0]);
            } catch (error) {
                console.error('Profile update error:', error);
                return res.status(500).json({ error: 'Ошибка обновления профиля' });
            }
        }
        
        // ============ ОТЗЫВЫ ============
        
        // GET /api/reviews/:productId
        if (path.match(/^\/api\/reviews\/[^/]+$/) && req.method === 'GET') {
            const productId = path.split('/').pop();
            const type = url.searchParams.get('type');
            const table = type === 'laminate' ? 'reviews_laminate' : 'reviews';
            
            try {
                const result = await sql`SELECT * FROM ${sql(table)} WHERE product_id = ${productId} ORDER BY created_at DESC`;
                return res.json(result.rows);
            } catch (error) {
                return res.json([]);
            }
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
        
        // ============ КОНТАКТЫ ============
        
        // POST /api/measure
        if (path === '/api/measure' && req.method === 'POST') {
            const { name, phone, address, comment } = req.body;
            
            let userId = null;
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader !== 'Bearer null') {
                const token = authHeader.split(' ')[1];
                const decoded = verifyToken(token);
                if (decoded) userId = decoded.id;
            }
            
            try {
                // Создаем таблицу если нет
                await sql`
                    CREATE TABLE IF NOT EXISTS measure_requests (
                        id SERIAL PRIMARY KEY,
                        user_id UUID,
                        name VARCHAR(255) NOT NULL,
                        phone VARCHAR(50) NOT NULL,
                        address TEXT,
                        comment TEXT,
                        status VARCHAR(50) DEFAULT 'новая',
                        created_at TIMESTAMP DEFAULT NOW()
                    )
                `;
                
                const result = await sql`
                    INSERT INTO measure_requests (user_id, name, phone, address, comment, status)
                    VALUES (${userId}, ${name}, ${phone}, ${address}, ${comment || null}, 'новая')
                    RETURNING id
                `;
                
                return res.json({ success: true, id: result.rows[0].id });
            } catch (error) {
                console.error('Error saving measure request:', error);
                return res.status(500).json({ error: 'Ошибка сохранения заявки' });
            }
        }

        // POST /api/measure
        if (path === '/api/measure' && req.method === 'POST') {
            const { name, phone, address, comment } = req.body;
            
            let userId = null;
            let userEmail = null;
            let userName = null;
            let userPhone = null;
            
            const authHeader = req.headers.authorization;
            if (authHeader) {
                const token = authHeader.split(' ')[1];
                const decoded = verifyToken(token);
                if (decoded) {
                    userId = decoded.id;
                    userEmail = decoded.email;
                    
                    // Получаем данные пользователя из БД
                    const userResult = await sql`SELECT name, phone FROM users WHERE id = ${decoded.id}`;
                    if (userResult.rows.length > 0) {
                        userName = userResult.rows[0].name;
                        userPhone = userResult.rows[0].phone;
                    }
                }
            }
            
            // Используем данные из формы или из профиля
            const finalName = name || userName;
            const finalPhone = phone || userPhone;
            const finalAddress = address || null;
            
            try {
                // Создаем таблицу если нет
                await sql`
                    CREATE TABLE IF NOT EXISTS measure_requests (
                        id SERIAL PRIMARY KEY,
                        user_id UUID,
                        name VARCHAR(255) NOT NULL,
                        phone VARCHAR(50) NOT NULL,
                        address TEXT,
                        comment TEXT,
                        status VARCHAR(50) DEFAULT 'новая',
                        created_at TIMESTAMP DEFAULT NOW()
                    )
                `;
                
                const result = await sql`
                    INSERT INTO measure_requests (user_id, name, phone, address, comment, status)
                    VALUES (${userId}, ${finalName}, ${finalPhone}, ${finalAddress}, ${comment || null}, 'новая')
                    RETURNING id
                `;
                
                return res.json({ success: true, id: result.rows[0].id });
            } catch (error) {
                console.error('Error saving measure request:', error);
                return res.status(500).json({ error: 'Ошибка сохранения заявки' });
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
                // Создаем таблицу если нет
                await sql`
                    CREATE TABLE IF NOT EXISTS contact_messages (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        phone VARCHAR(50),
                        email VARCHAR(255),
                        message TEXT,
                        user_id UUID,
                        is_read BOOLEAN DEFAULT FALSE,
                        created_at TIMESTAMP DEFAULT NOW()
                    )
                `;
                
                await sql`
                    INSERT INTO contact_messages (name, phone, email, message, user_id, is_read)
                    VALUES (${name}, ${phone || null}, ${email || null}, ${message}, ${userId}, false)
                `;
                
                return res.json({ success: true, message: 'Сообщение отправлено' });
            } catch (error) {
                console.error('Error saving contact:', error);
                return res.status(500).json({ error: 'Ошибка сохранения сообщения' });
            }
        }
        
        // ============ АДМИН ============
        
        // GET /api/admin/users
        if (path === '/api/admin/users' && req.method === 'GET') {
            const authHeader = req.headers.authorization;
            if (!authHeader) return res.status(401).json({ error: 'Не авторизован' });
            
            const token = authHeader.split(' ')[1];
            const decoded = verifyToken(token);
            
            if (!decoded) return res.status(401).json({ error: 'Недействительный токен' });
            if (decoded.role !== 'admin') return res.status(403).json({ error: 'Нет прав' });
            
            const result = await sql`SELECT id, email, name, phone, role, created_at FROM users ORDER BY created_at DESC`;
            return res.json({ items: result.rows });
        }

        // ============ АДМИН-ПАНЕЛЬ ============

// GET /api/admin/users
if (path === '/api/admin/users' && req.method === 'GET') {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Не авторизован' });
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) return res.status(401).json({ error: 'Недействительный токен' });
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Нет прав' });
    
    const result = await sql`SELECT id, email, name, phone, role, created_at FROM users ORDER BY created_at DESC`;
    return res.json({ items: result.rows });
}

// PUT /api/admin/user/role
if (path === '/api/admin/user/role' && req.method === 'PUT') {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Не авторизован' });
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) return res.status(401).json({ error: 'Недействительный токен' });
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Нет прав' });
    
    const { id, role } = req.body;
    await sql`UPDATE users SET role = ${role} WHERE id = ${id}`;
    return res.json({ success: true });
}

// DELETE /api/admin/user/delete
if (path === '/api/admin/user/delete' && req.method === 'DELETE') {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Не авторизован' });
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) return res.status(401).json({ error: 'Недействительный токен' });
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Нет прав' });
    
    const { id } = req.body;
    await sql`DELETE FROM users WHERE id = ${id}`;
    return res.json({ success: true });
}

// PUT /api/admin/order/status
if (path === '/api/admin/order/status' && req.method === 'PUT') {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Не авторизован' });
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) return res.status(401).json({ error: 'Недействительный токен' });
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Нет прав' });
    
    const { id, status } = req.body;
    await sql`UPDATE orders SET status = ${status}, updated_at = NOW() WHERE id = ${id}`;
    return res.json({ success: true });
}

// DELETE /api/admin/order/delete
if (path === '/api/admin/order/delete' && req.method === 'DELETE') {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Не авторизован' });
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) return res.status(401).json({ error: 'Недействительный токен' });
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Нет прав' });
    
    const { id } = req.body;
    await sql`DELETE FROM orders WHERE id = ${id}`;
    return res.json({ success: true });
}

// GET /api/admin/reviews/doors
if (path === '/api/admin/reviews/doors' && req.method === 'GET') {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Не авторизован' });
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) return res.status(401).json({ error: 'Недействительный токен' });
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Нет прав' });
    
    const result = await sql`SELECT *, 'doors' as product_type FROM reviews ORDER BY created_at DESC`;
    return res.json({ items: result.rows });
}

// GET /api/admin/reviews/laminate
if (path === '/api/admin/reviews/laminate' && req.method === 'GET') {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Не авторизован' });
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) return res.status(401).json({ error: 'Недействительный токен' });
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Нет прав' });
    
    const result = await sql`SELECT *, 'laminate' as product_type FROM reviews_laminate ORDER BY created_at DESC`;
    return res.json({ items: result.rows });
}

// PUT /api/admin/review/approve
if (path === '/api/admin/review/approve' && req.method === 'PUT') {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Не авторизован' });
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) return res.status(401).json({ error: 'Недействительный токен' });
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Нет прав' });
    
    const { id, type } = req.body;
    const table = type === 'laminate' ? 'reviews_laminate' : 'reviews';
    await sql`UPDATE ${sql(table)} SET approved = true WHERE id = ${id}`;
    return res.json({ success: true });
}

// DELETE /api/admin/review/delete
if (path === '/api/admin/review/delete' && req.method === 'DELETE') {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Не авторизован' });
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) return res.status(401).json({ error: 'Недействительный токен' });
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Нет прав' });
    
    const { id, type } = req.body;
    const table = type === 'laminate' ? 'reviews_laminate' : 'reviews';
    await sql`DELETE FROM ${sql(table)} WHERE id = ${id}`;
    return res.json({ success: true });
}

// GET /api/admin/measure
if (path === '/api/admin/measure' && req.method === 'GET') {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Не авторизован' });
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) return res.status(401).json({ error: 'Недействительный токен' });
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Нет прав' });
    
    const result = await sql`SELECT * FROM measure_requests ORDER BY created_at DESC`;
    return res.json({ items: result.rows });
}

// PUT /api/admin/measure/status
if (path === '/api/admin/measure/status' && req.method === 'PUT') {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Не авторизован' });
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) return res.status(401).json({ error: 'Недействительный токен' });
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Нет прав' });
    
    const { id, status } = req.body;
    await sql`UPDATE measure_requests SET status = ${status} WHERE id = ${id}`;
    return res.json({ success: true });
}

// DELETE /api/admin/measure/delete
if (path === '/api/admin/measure/delete' && req.method === 'DELETE') {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Не авторизован' });
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) return res.status(401).json({ error: 'Недействительный токен' });
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Нет прав' });
    
    const { id } = req.body;
    await sql`DELETE FROM measure_requests WHERE id = ${id}`;
    return res.json({ success: true });
}

// PUT /api/admin/product/update
if (path === '/api/admin/product/update' && req.method === 'PUT') {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Не авторизован' });
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) return res.status(401).json({ error: 'Недействительный токен' });
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Нет прав' });
    
    const { collection, id, name, description, price, type, material, color, style, thickness, wear_class, pictures } = req.body;
    const table = collection === 'laminate' ? 'laminate' : 'doors';
    
    await sql`
        UPDATE ${sql(table)} 
        SET name = ${name}, description = ${description}, price = ${price}, 
            type = ${type}, material = ${material}, color = ${color}, 
            style = ${style}, thickness = ${thickness}, wear_class = ${wear_class}, 
            pictures = ${pictures}, updated_at = NOW()
        WHERE id = ${id}
    `;
    return res.json({ success: true });
}

// POST /api/admin/product/create
if (path === '/api/admin/product/create' && req.method === 'POST') {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Не авторизован' });
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Нет прав' });
    }
    
    const { collection, name, description, price, type, material, color, style, thickness, wear_class, pictures } = req.body;
    const table = collection === 'laminate' ? 'laminate' : 'doors';
    
    const result = await sql`
        INSERT INTO ${sql(table)} (name, description, price, type, material, color, style, thickness, wear_class, pictures, created_at)
        VALUES (${name}, ${description}, ${price}, ${type}, ${material}, ${color}, ${style}, ${thickness}, ${wear_class}, ${pictures}, NOW())
        RETURNING id
    `;
    return res.json({ success: true, id: result.rows[0].id });
}

// DELETE /api/admin/product/delete
if (path === '/api/admin/product/delete' && req.method === 'DELETE') {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Не авторизован' });
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) return res.status(401).json({ error: 'Недействительный токен' });
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Нет прав' });
    
    const { collection, id } = req.body;
    const table = collection === 'laminate' ? 'laminate' : 'doors';
    await sql`DELETE FROM ${sql(table)} WHERE id = ${id}`;
    return res.json({ success: true });
}

// GET /api/admin/product/:collection/:id (для редактирования)
if (path.match(/^\/api\/admin\/product\/[^/]+\/[^/]+$/) && req.method === 'GET') {
    const parts = path.split('/');
    const collection = parts[3];
    const id = parts[4];
    
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Не авторизован' });
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) return res.status(401).json({ error: 'Недействительный токен' });
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Нет прав' });
    
    const table = collection === 'laminate' ? 'laminate' : 'doors';
    const result = await sql`SELECT * FROM ${sql(table)} WHERE id = ${id}`;
    
    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Товар не найден' });
    }
    
    return res.json(result.rows[0]);
}
        
        // 404
        return res.status(404).json({ error: 'Endpoint не найден' });
        
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Внутренняя ошибка сервера', details: error.message });
    }
}