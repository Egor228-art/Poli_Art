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
        // ============ ТЕСТ ============
        if (path === '/api/test') {
            return res.json({ message: 'API работает' });
        }
        
        // ============ ТОВАРЫ ============
        if (path === '/api/products/doors' && req.method === 'GET') {
            const result = await sql`SELECT * FROM doors ORDER BY created_at DESC`;
            return res.json({ items: result.rows });
        }
        
        if (path === '/api/products/laminate' && req.method === 'GET') {
            const result = await sql`SELECT * FROM laminate ORDER BY created_at DESC`;
            return res.json({ items: result.rows });
        }
        
        const doorsIdMatch = path.match(/^\/api\/products\/doors\/([^/]+)$/);
        if (doorsIdMatch && req.method === 'GET') {
            const id = doorsIdMatch[1];
            const result = await sql`SELECT * FROM doors WHERE id = ${id}`;
            if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
            return res.json(result.rows[0]);
        }
        
        const laminateIdMatch = path.match(/^\/api\/products\/laminate\/([^/]+)$/);
        if (laminateIdMatch && req.method === 'GET') {
            const id = laminateIdMatch[1];
            const result = await sql`SELECT * FROM laminate WHERE id = ${id}`;
            if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
            return res.json(result.rows[0]);
        }
        
        // ============ АВТОРИЗАЦИЯ ============
        if (path === '/api/auth/register' && req.method === 'POST') {
            const { email, password, name, phone, address } = req.body;
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
        
        if (path === '/api/auth/me' && req.method === 'GET') {
            const authHeader = req.headers.authorization;
            if (!authHeader) return res.status(401).json({ error: 'No token' });
            const token = authHeader.split(' ')[1];
            const decoded = verifyToken(token);
            if (!decoded) return res.status(401).json({ error: 'Invalid token' });
            const result = await sql`SELECT id, email, name, role, phone, address FROM users WHERE id = ${decoded.id}`;
            if (result.rows.length === 0) return res.status(401).json({ error: 'User not found' });
            return res.json(result.rows[0]);
        }
        
        // ============ ПРОФИЛЬ ============
        if (path === '/api/user/profile' && req.method === 'PUT') {
            const authHeader = req.headers.authorization;
            if (!authHeader) return res.status(401).json({ error: 'No token' });
            const token = authHeader.split(' ')[1];
            const decoded = verifyToken(token);
            if (!decoded) return res.status(401).json({ error: 'Invalid token' });
            const { address } = req.body;
            const result = await sql`
                UPDATE users SET address = ${address}
                WHERE id = ${decoded.id}
                RETURNING id, email, name, role, phone, address
            `;
            return res.json(result.rows[0]);
        }
        
        // ============ ЗАКАЗЫ ============
        if (path === '/api/orders' && req.method === 'GET') {
            const authHeader = req.headers.authorization;
            if (!authHeader) return res.status(401).json({ error: 'No token' });
            const token = authHeader.split(' ')[1];
            const decoded = verifyToken(token);
            if (!decoded) return res.status(401).json({ error: 'Invalid token' });
            const result = await sql`SELECT * FROM orders WHERE user_id = ${decoded.id} ORDER BY created_at DESC`;
            return res.json(result.rows);
        }
        
        if (path === '/api/orders' && req.method === 'POST') {
            const authHeader = req.headers.authorization;
            if (!authHeader) return res.status(401).json({ error: 'No token' });
            const token = authHeader.split(' ')[1];
            const decoded = verifyToken(token);
            if (!decoded) return res.status(401).json({ error: 'Invalid token' });
            const { products, total_price, delivery_type, delivery_address, payment_method, customer_name, customer_phone } = req.body;
            const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            const result = await sql`
                INSERT INTO orders (order_number, user_id, products, total_price, delivery_type, delivery_address, payment_method, customer_name, customer_phone, customer_email, status)
                VALUES (${orderNumber}, ${decoded.id}, ${JSON.stringify(products)}, ${total_price}, ${delivery_type}, ${delivery_address}, ${payment_method}, ${customer_name}, ${customer_phone}, ${decoded.email}, 'ожидает')
                RETURNING *
            `;
            return res.json(result.rows[0]);
        }
        
        // ============ ОТЗЫВЫ (ИСПРАВЛЕННЫЕ) ============
        
        // GET /api/reviews/:productId
        const reviewsMatch = path.match(/^\/api\/reviews\/([^?]+)/);
        if (reviewsMatch && req.method === 'GET') {
            const productId = reviewsMatch[1];
            const type = url.searchParams.get('type');
            
            if (type === 'laminate') {
                const result = await sql`SELECT * FROM reviews_laminate WHERE product_id = ${productId} ORDER BY created_at DESC`;
                return res.json(result.rows);
            } else {
                const result = await sql`SELECT * FROM reviews WHERE product_id = ${productId} ORDER BY created_at DESC`;
                return res.json(result.rows);
            }
        }
        
        // POST /api/reviews
        if (path === '/api/reviews' && req.method === 'POST') {
            const authHeader = req.headers.authorization;
            if (!authHeader) return res.status(401).json({ error: 'No token' });
            const token = authHeader.split(' ')[1];
            const decoded = verifyToken(token);
            if (!decoded) return res.status(401).json({ error: 'Invalid token' });
            
            const { product_id, product_name, rating, text, pros, cons, isLaminate } = req.body;
            
            // Получаем имя пользователя из БД (на случай если в токене нет)
            const userResult = await sql`SELECT name, email FROM users WHERE id = ${decoded.id}`;
            const userName = userResult.rows[0]?.name || decoded.name || 'Пользователь';
            const userEmail = userResult.rows[0]?.email || decoded.email;
            
            if (isLaminate) {
                await sql`
                    INSERT INTO reviews_laminate (product_id, product_name, rating, text, pros, cons, author_name, author_email, approved)
                    VALUES (${product_id}, ${product_name}, ${rating}, ${text}, ${pros || null}, ${cons || null}, ${userName}, ${userEmail}, false)
                `;
            } else {
                await sql`
                    INSERT INTO reviews (product_id, product_name, rating, text, pros, cons, author_name, author_email, approved)
                    VALUES (${product_id}, ${product_name}, ${rating}, ${text}, ${pros || null}, ${cons || null}, ${userName}, ${userEmail}, false)
                `;
            }
            return res.json({ success: true });
        }
        
        // ============ ЗАМЕРЫ ============
        if (path === '/api/measure' && req.method === 'POST') {
            const { name, phone, address, comment } = req.body;
            await sql`
                INSERT INTO measure_requests (name, phone, address, comment)
                VALUES (${name}, ${phone}, ${address}, ${comment})
            `;
            return res.json({ success: true });
        }
        
        // ============ АДМИНКА ============
        
        if (path === '/api/admin/users' && req.method === 'GET') {
            const result = await sql`SELECT id, email, name, phone, role, created_at FROM users ORDER BY created_at DESC`;
            return res.json({ items: result.rows });
        }
        
        if (path === '/api/admin/user/role' && req.method === 'PUT') {
            const { id, role } = req.body;
            await sql`UPDATE users SET role = ${role} WHERE id = ${id}`;
            return res.json({ success: true });
        }
        
        if (path === '/api/admin/user/delete' && req.method === 'DELETE') {
            const { id } = req.body;
            await sql`DELETE FROM users WHERE id = ${id}`;
            return res.json({ success: true });
        }
        
        if (path === '/api/admin/measure' && req.method === 'GET') {
            const result = await sql`SELECT * FROM measure_requests ORDER BY created_at DESC`;
            return res.json({ items: result.rows });
        }
        
        if (path === '/api/admin/measure/status' && req.method === 'PUT') {
            const { id, status } = req.body;
            await sql`UPDATE measure_requests SET status = ${status} WHERE id = ${id}`;
            return res.json({ success: true });
        }
        
        if (path === '/api/admin/measure/delete' && req.method === 'DELETE') {
            const { id } = req.body;
            await sql`DELETE FROM measure_requests WHERE id = ${id}`;
            return res.json({ success: true });
        }
        
        // ИСПРАВЛЕННЫЕ АДМИН-ЭНДПОИНТЫ ДЛЯ ОТЗЫВОВ
        if (path === '/api/admin/reviews/doors' && req.method === 'GET') {
            const result = await sql`SELECT * FROM reviews ORDER BY created_at DESC`;
            return res.json({ items: result.rows });
        }
        
        if (path === '/api/admin/reviews/laminate' && req.method === 'GET') {
            const result = await sql`SELECT * FROM reviews_laminate ORDER BY created_at DESC`;
            return res.json({ items: result.rows });
        }
        
        if (path === '/api/admin/review/approve' && req.method === 'PUT') {
            const { id, type } = req.body;
            const numericId = parseInt(id);
            if (isNaN(numericId)) {
                return res.status(400).json({ error: 'Invalid id' });
            }
            
            if (type === 'laminate') {
                await sql`UPDATE reviews_laminate SET approved = true WHERE id = ${numericId}`;
            } else {
                await sql`UPDATE reviews SET approved = true WHERE id = ${numericId}`;
            }
            return res.json({ success: true });
        }
        
        if (path === '/api/admin/review/delete' && req.method === 'DELETE') {
            const { id, type } = req.body;
            if (type === 'laminate') {
                await sql`DELETE FROM reviews_laminate WHERE id = ${id}`;
            } else {
                await sql`DELETE FROM reviews WHERE id = ${id}`;
            }
            return res.json({ success: true });
        }
        
        if (path === '/api/admin/order/status' && req.method === 'PUT') {
            const { id, status } = req.body;
            await sql`UPDATE orders SET status = ${status} WHERE id = ${id}`;
            return res.json({ success: true });
        }
        
        if (path === '/api/admin/product/create' && req.method === 'POST') {
            const { collection, name, description, price, type, material, color, style, thickness, wear_class, pictures } = req.body;
            
            if (collection === 'laminate') {
                await sql`
                    INSERT INTO laminate (name, description, price, type, thickness, wear_class, color, pictures)
                    VALUES (${name}, ${description}, ${price}, ${type}, ${thickness}, ${wear_class}, ${color}, ${pictures})
                `;
            } else {
                await sql`
                    INSERT INTO doors (name, description, price, type, material, style, color, pictures)
                    VALUES (${name}, ${description}, ${price}, ${type}, ${material}, ${style}, ${color}, ${pictures})
                `;
            }
            return res.json({ success: true });
        }
        
        if (path === '/api/admin/product/update' && req.method === 'PUT') {
            const { collection, id, name, description, price, type, material, color, style, thickness, wear_class, pictures } = req.body;
            
            if (collection === 'laminate') {
                await sql`
                    UPDATE laminate 
                    SET name = ${name}, description = ${description}, price = ${price}, 
                        type = ${type}, thickness = ${thickness}, wear_class = ${wear_class}, 
                        color = ${color}, pictures = ${pictures}
                    WHERE id = ${id}
                `;
            } else {
                await sql`
                    UPDATE doors 
                    SET name = ${name}, description = ${description}, price = ${price}, 
                        type = ${type}, material = ${material}, style = ${style}, 
                        color = ${color}, pictures = ${pictures}
                    WHERE id = ${id}
                `;
            }
            return res.json({ success: true });
        }
        
        if (path === '/api/admin/product/delete' && req.method === 'DELETE') {
            const { collection, id } = req.body;
            if (collection === 'laminate') {
                await sql`DELETE FROM laminate WHERE id = ${id}`;
            } else {
                await sql`DELETE FROM doors WHERE id = ${id}`;
            }
            return res.json({ success: true });
        }
        
        const productGetMatch = path.match(/^\/api\/admin\/product\/(doors|laminate)\/([^/]+)$/);
        if (productGetMatch && req.method === 'GET') {
            const collection = productGetMatch[1];
            const id = productGetMatch[2];
            
            if (collection === 'laminate') {
                const result = await sql`SELECT * FROM laminate WHERE id = ${id}`;
                if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
                return res.json(result.rows[0]);
            } else {
                const result = await sql`SELECT * FROM doors WHERE id = ${id}`;
                if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
                return res.json(result.rows[0]);
            }
        }
        
        // 404
        return res.status(404).json({ error: 'Endpoint not found' });
        
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: error.message });
    }
}