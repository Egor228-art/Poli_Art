// api/index.js
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
        
        // GET /api/products/doors
        if (path === '/api/products/doors' && req.method === 'GET') {
            let query = sql`SELECT * FROM doors`;
            const result = await query;
            
            const products = result.rows.map(p => ({
                ...p,
                price: parsePrice(p.price),
                price_display: `${parsePrice(p.price).toLocaleString()} ₽`
            }));
            
            return res.json({ items: products, totalItems: products.length });
        }
        
        // GET /api/products/laminate
        if (path === '/api/products/laminate' && req.method === 'GET') {
            let query = sql`SELECT * FROM laminate`;
            const result = await query;
            
            const products = result.rows.map(p => ({
                ...p,
                price: parsePrice(p.price),
                price_display: `${parsePrice(p.price).toLocaleString()} ₽`
            }));
            
            return res.json({ items: products, totalItems: products.length });
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
        
        // POST /api/products/search (поиск с фильтрацией)
        if (path === '/api/products/search' && req.method === 'POST') {
            const { collection, search, filters } = req.body;
            const table = collection === 'laminate' ? 'laminate' : 'doors';
            
            let query = sql`SELECT * FROM ${sql(table)} WHERE 1=1`;
            
            if (search) {
                query = sql`${query} AND (name ILIKE ${`%${search}%`} OR description ILIKE ${`%${search}%`})`;
            }
            
            if (filters) {
                if (filters.priceMin) {
                    query = sql`${query} AND price >= ${filters.priceMin}`;
                }
                if (filters.priceMax) {
                    query = sql`${query} AND price <= ${filters.priceMax}`;
                }
                if (collection === 'doors' && filters.doorTypes?.length) {
                    query = sql`${query} AND type = ANY(${filters.doorTypes})`;
                }
                if (collection === 'laminate' && filters.laminateTypes?.length) {
                    query = sql`${query} AND type = ANY(${filters.laminateTypes})`;
                }
                if (collection === 'laminate' && filters.laminateThickness?.length) {
                    query = sql`${query} AND thickness = ANY(${filters.laminateThickness})`;
                }
            }
            
            const result = await query;
            return res.json({ items: result.rows, totalItems: result.rows.length });
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
        
        // ============ ОТЗЫВЫ ============
        
        // GET /api/reviews/:productId
        if (path.match(/^\/api\/reviews\/[^/]+$/) && req.method === 'GET') {
            const productId = path.split('/').pop();
            
            const result = await sql`
                SELECT * FROM reviews 
                WHERE product_id = ${productId} AND approved = true 
                ORDER BY created_at DESC
            `;
            
            return res.json(result.rows);
        }
        
        // GET /api/reviews/laminate/:productId
        if (path.match(/^\/api\/reviews\/laminate\/[^/]+$/) && req.method === 'GET') {
            const productId = path.split('/').pop();
            
            const result = await sql`
                SELECT * FROM reviews_laminate 
                WHERE product_id = ${productId} AND approved = true 
                ORDER BY created_at DESC
            `;
            
            return res.json(result.rows);
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
            
            const { product_id, product_name, rating, text, pros, cons, isLaminate } = req.body;
            
            const table = isLaminate ? 'reviews_laminate' : 'reviews';
            
            const result = await sql`
                INSERT INTO ${sql(table)} (product_id, product_name, rating, text, pros, cons, author_name, author_email, approved)
                VALUES (${product_id}, ${product_name}, ${rating}, ${text}, ${pros || null}, ${cons || null}, ${decoded.name}, ${decoded.email}, false)
                RETURNING *
            `;
            
            return res.json(result.rows[0]);
        }
        
        // ============ ЗАМЕРЫ ============
        
        // POST /api/measure
        if (path === '/api/measure' && req.method === 'POST') {
            const { name, phone, address, room_type, desired_date, comments, product_id, product_name, product_type } = req.body;
            
            let userId = null;
            const authHeader = req.headers.authorization;
            
            if (authHeader) {
                const token = authHeader.split(' ')[1];
                const decoded = verifyToken(token);
                if (decoded) {
                    userId = decoded.id;
                }
            }
            
            const result = await sql`
                INSERT INTO measure_requests (user_id, name, phone, address, room_type, desired_date, comments, product_id, product_name, product_type, status)
                VALUES (${userId}, ${name}, ${phone}, ${address}, ${room_type || null}, ${desired_date || null}, ${comments || null}, ${product_id || null}, ${product_name || null}, ${product_type || null}, 'новая')
                RETURNING *
            `;
            
            return res.json({ success: true, id: result.rows[0].id });
        }
        
        // ============ КОНТАКТЫ ============
        
        // POST /api/contacts
        if (path === '/api/contacts' && req.method === 'POST') {
            const { name, phone, email, message } = req.body;
            
            let userId = null;
            const authHeader = req.headers.authorization;
            
            if (authHeader) {
                const token = authHeader.split(' ')[1];
                const decoded = verifyToken(token);
                if (decoded) {
                    userId = decoded.id;
                }
            }
            
            const result = await sql`
                INSERT INTO contact_messages (name, phone, email, message, user_id, is_read)
                VALUES (${name}, ${phone || null}, ${email || null}, ${message}, ${userId}, false)
                RETURNING id
            `;
            
            return res.json({ success: true, id: result.rows[0].id });
        }
        
        // ============ АДМИН-ПАНЕЛЬ ============
        
        // POST /api/admin/product/create
        if (path === '/api/admin/product/create' && req.method === 'POST') {
            const authHeader = req.headers.authorization;
            if (!authHeader) return res.status(401).json({ error: 'Не авторизован' });
            
            const token = authHeader.split(' ')[1];
            const decoded = verifyToken(token);
            
            if (!decoded || decoded.role !== 'admin') {
                return res.status(403).json({ error: 'Нет прав' });
            }
            
            const { collection, name, description, price, type, material, color, thickness, pictures } = req.body;
            const table = collection === 'laminate' ? 'laminate' : 'doors';
            
            const result = await sql`
                INSERT INTO ${sql(table)} (name, description, price, type, material, color, thickness, pictures)
                VALUES (${name}, ${description || null}, ${price}, ${type || null}, ${material || null}, ${color || null}, ${thickness || null}, ${pictures || null})
                RETURNING *
            `;
            
            return res.json(result.rows[0]);
        }
        
        // ============ КОНСТРУКТОР ЛАМИНАТА ============
        
        // POST /api/constructor/calculate
        if (path === '/api/constructor/calculate' && req.method === 'POST') {
            const { length, width, wastePercent = 10 } = req.body;
            
            const area = length * width;
            const waste = area * (wastePercent / 100);
            const totalArea = area + waste;
            const packArea = 2.2;
            const packsNeeded = Math.ceil(totalArea / packArea);
            
            return res.json({
                area: area,
                waste: waste,
                totalArea: totalArea,
                packsNeeded: packsNeeded,
                boardsNeeded: Math.ceil(totalArea / 0.24)
            });
        }
        
        // 404 - не найдено
        return res.status(404).json({ error: 'Endpoint не найден' });
        
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Внутренняя ошибка сервера', details: error.message });
    }
}

// ============ АДМИН-ПАНЕЛЬ (ДОБАВИТЬ В API/INDEX.JS) ============

// GET /api/admin/users
if (path === '/api/admin/users' && req.method === 'GET') {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Не авторизован' });
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Нет прав' });
    }
    
    const result = await sql`SELECT id, email, name, phone, role, created_at FROM users ORDER BY created_at DESC`;
    return res.json({ items: result.rows });
}

// PUT /api/admin/user/role
if (path === '/api/admin/user/role' && req.method === 'PUT') {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Не авторизован' });
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Нет прав' });
    }
    
    const { id, role } = req.body;
    await sql`UPDATE users SET role = ${role}, updated_at = NOW() WHERE id = ${id}`;
    return res.json({ success: true });
}

// DELETE /api/admin/user/delete
if (path === '/api/admin/user/delete' && req.method === 'DELETE') {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Не авторизован' });
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Нет прав' });
    }
    
    const { id } = req.body;
    await sql`DELETE FROM users WHERE id = ${id}`;
    return res.json({ success: true });
}

// GET /api/admin/reviews/doors
if (path === '/api/admin/reviews/doors' && req.method === 'GET') {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Не авторизован' });
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Нет прав' });
    }
    
    const result = await sql`SELECT *, 'doors' as product_type FROM reviews ORDER BY created_at DESC`;
    return res.json({ items: result.rows });
}

// GET /api/admin/reviews/laminate
if (path === '/api/admin/reviews/laminate' && req.method === 'GET') {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Не авторизован' });
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Нет прав' });
    }
    
    const result = await sql`SELECT *, 'laminate' as product_type FROM reviews_laminate ORDER BY created_at DESC`;
    return res.json({ items: result.rows });
}

// PUT /api/admin/review/approve
if (path === '/api/admin/review/approve' && req.method === 'PUT') {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Не авторизован' });
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Нет прав' });
    }
    
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
    
    if (!decoded || decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Нет прав' });
    }
    
    const { id, type } = req.body;
    const table = type === 'laminate' ? 'reviews_laminate' : 'reviews';
    await sql`DELETE FROM ${sql(table)} WHERE id = ${id}`;
    return res.json({ success: true });
}

// PUT /api/admin/order/status
if (path === '/api/admin/order/status' && req.method === 'PUT') {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Не авторизован' });
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Нет прав' });
    }
    
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
    
    if (!decoded || decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Нет прав' });
    }
    
    const { id } = req.body;
    await sql`DELETE FROM orders WHERE id = ${id}`;
    return res.json({ success: true });
}

// GET /api/admin/measure
if (path === '/api/admin/measure' && req.method === 'GET') {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Не авторизован' });
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Нет прав' });
    }
    
    const result = await sql`SELECT * FROM measure_requests ORDER BY created_at DESC`;
    return res.json({ items: result.rows });
}

// PUT /api/admin/measure/status
if (path === '/api/admin/measure/status' && req.method === 'PUT') {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Не авторизован' });
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Нет прав' });
    }
    
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
    
    if (!decoded || decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Нет прав' });
    }
    
    const { id } = req.body;
    await sql`DELETE FROM measure_requests WHERE id = ${id}`;
    return res.json({ success: true });
}

// PUT /api/admin/product/update (добавить в существующий блок админа)
if (path === '/api/admin/product/update' && req.method === 'PUT') {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Не авторизован' });
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Нет прав' });
    }
    
    const { collection, id, name, description, price, type, material, color, style, thickness, wear_class, pictures } = req.body;
    const table = collection === 'laminate' ? 'laminate' : 'doors';
    
    await sql`
        UPDATE ${sql(table)} 
        SET name = ${name}, description = ${description}, price = ${price}, type = ${type},
            material = ${material || null}, color = ${color || null}, style = ${style || null},
            thickness = ${thickness || null}, wear_class = ${wear_class || null}, 
            pictures = ${pictures || null}, updated_at = NOW()
        WHERE id = ${id}
    `;
    return res.json({ success: true });
}

// DELETE /api/admin/product/delete
if (path === '/api/admin/product/delete' && req.method === 'DELETE') {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Не авторизован' });
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Нет прав' });
    }
    
    const { collection, id } = req.body;
    const table = collection === 'laminate' ? 'laminate' : 'doors';
    await sql`DELETE FROM ${sql(table)} WHERE id = ${id}`;
    return res.json({ success: true });
}