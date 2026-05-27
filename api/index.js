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
        // ============ ПУБЛИЧНЫЕ ЭНДПОИНТЫ ============
        
        // Тест
        if (path === '/api/test') {
            return res.json({ message: 'API работает', time: new Date().toISOString() });
        }
        
        // Товары
        if (path === '/api/products/laminate' && req.method === 'GET') {
            const result = await sql`SELECT * FROM laminate ORDER BY created_at DESC`;
            return res.json({ items: result.rows });
        }
        
        if (path === '/api/products/doors' && req.method === 'GET') {
            const result = await sql`SELECT * FROM doors ORDER BY created_at DESC`;
            return res.json({ items: result.rows });
        }
        
        // Товар по ID
        const laminateMatch = path.match(/^\/api\/products\/laminate\/([^/]+)$/);
        if (laminateMatch && req.method === 'GET') {
            const id = laminateMatch[1];
            const result = await sql`SELECT * FROM laminate WHERE id = ${id}`;
            if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
            return res.json(result.rows[0]);
        }
        
        const doorsMatch = path.match(/^\/api\/products\/doors\/([^/]+)$/);
        if (doorsMatch && req.method === 'GET') {
            const id = doorsMatch[1];
            const result = await sql`SELECT * FROM doors WHERE id = ${id}`;
            if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
            return res.json(result.rows[0]);
        }
        
        // Auth
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
        
        // Профиль
        if (path === '/api/user/profile' && req.method === 'PUT') {
            const authHeader = req.headers.authorization;
            if (!authHeader) return res.status(401).json({ error: 'No token' });
            const token = authHeader.split(' ')[1];
            const decoded = verifyToken(token);
            if (!decoded) return res.status(401).json({ error: 'Invalid token' });
            const { address } = req.body;
            const result = await sql`
                UPDATE users SET address = ${address}, updated_at = NOW()
                WHERE id = ${decoded.id}
                RETURNING id, email, name, role, phone, address
            `;
            return res.json(result.rows[0]);
        }
        
        // Заказы
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
        
        // Отзывы
        const reviewsMatch = path.match(/^\/api\/reviews\/([^?]+)/);
        if (reviewsMatch && req.method === 'GET') {
            const productId = reviewsMatch[1];
            const type = url.searchParams.get('type');
            const table = type === 'laminate' ? 'reviews_laminate' : 'reviews';
            const result = await sql`SELECT * FROM ${sql(table)} WHERE product_id = ${productId} ORDER BY created_at DESC`;
            return res.json(result.rows);
        }
        
        if (path === '/api/reviews' && req.method === 'POST') {
            const authHeader = req.headers.authorization;
            if (!authHeader) return res.status(401).json({ error: 'No token' });
            const token = authHeader.split(' ')[1];
            const decoded = verifyToken(token);
            if (!decoded) return res.status(401).json({ error: 'Invalid token' });
            const { product_id, product_name, rating, text, isLaminate } = req.body;
            const table = isLaminate ? 'reviews_laminate' : 'reviews';
            const result = await sql`
                INSERT INTO ${sql(table)} (product_id, product_name, rating, text, author_name, author_email, approved)
                VALUES (${product_id}, ${product_name}, ${rating}, ${text}, ${decoded.name}, ${decoded.email}, false)
                RETURNING *
            `;
            return res.json(result.rows[0]);
        }
        
        // Контакты
        if (path === '/api/contacts' && req.method === 'POST') {
            const { name, phone, email, message } = req.body;
            await sql`
                INSERT INTO contact_messages (name, phone, email, message, created_at)
                VALUES (${name}, ${phone}, ${email}, ${message}, NOW())
            `;
            return res.json({ success: true });
        }
        
        // Замеры
        if (path === '/api/measure' && req.method === 'POST') {
            const { name, phone, address, comment } = req.body;
            let userId = null;
            const authHeader = req.headers.authorization;
            if (authHeader) {
                const token = authHeader.split(' ')[1];
                const decoded = verifyToken(token);
                if (decoded) userId = decoded.id;
            }
            await sql`
                INSERT INTO measure_requests (user_id, name, phone, address, comment, created_at)
                VALUES (${userId}, ${name}, ${phone}, ${address}, ${comment}, NOW())
            `;
            return res.json({ success: true });
        }
        
        // ============ АДМИН ЭНДПОИНТЫ ============
        
        async function isAdmin(authHeader) {
            if (!authHeader) return false;
            const token = authHeader.split(' ')[1];
            const decoded = verifyToken(token);
            if (!decoded) return false;
            const user = await sql`SELECT role FROM users WHERE id = ${decoded.id}`;
            return user.rows[0]?.role === 'admin';
        }
        
        // GET /api/admin/users
        if (path === '/api/admin/users' && req.method === 'GET') {
            if (!(await isAdmin(req.headers.authorization))) {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const result = await sql`SELECT id, email, name, phone, role, created_at FROM users ORDER BY created_at DESC`;
            return res.json({ items: result.rows });
        }
        
        // PUT /api/admin/user/role
        if (path === '/api/admin/user/role' && req.method === 'PUT') {
            if (!(await isAdmin(req.headers.authorization))) {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const { id, role } = req.body;
            await sql`UPDATE users SET role = ${role} WHERE id = ${id}`;
            return res.json({ success: true });
        }
        
        // PUT /api/admin/order/status
        if (path === '/api/admin/order/status' && req.method === 'PUT') {
            if (!(await isAdmin(req.headers.authorization))) {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const { id, status } = req.body;
            await sql`UPDATE orders SET status = ${status} WHERE id = ${id}`;
            return res.json({ success: true });
        }
        
        // GET /api/admin/reviews/doors
        if (path === '/api/admin/reviews/doors' && req.method === 'GET') {
            if (!(await isAdmin(req.headers.authorization))) {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const result = await sql`SELECT *, 'doors' as product_type FROM reviews ORDER BY created_at DESC`;
            return res.json({ items: result.rows });
        }
        
        // GET /api/admin/reviews/laminate
        if (path === '/api/admin/reviews/laminate' && req.method === 'GET') {
            if (!(await isAdmin(req.headers.authorization))) {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const result = await sql`SELECT *, 'laminate' as product_type FROM reviews_laminate ORDER BY created_at DESC`;
            return res.json({ items: result.rows });
        }
        
        // PUT /api/admin/review/approve
        if (path === '/api/admin/review/approve' && req.method === 'PUT') {
            if (!(await isAdmin(req.headers.authorization))) {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const { id, type } = req.body;
            const table = type === 'laminate' ? 'reviews_laminate' : 'reviews';
            await sql`UPDATE ${sql(table)} SET approved = true WHERE id = ${id}`;
            return res.json({ success: true });
        }
        
        // DELETE /api/admin/review/delete
        if (path === '/api/admin/review/delete' && req.method === 'DELETE') {
            if (!(await isAdmin(req.headers.authorization))) {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const { id, type } = req.body;
            const table = type === 'laminate' ? 'reviews_laminate' : 'reviews';
            await sql`DELETE FROM ${sql(table)} WHERE id = ${id}`;
            return res.json({ success: true });
        }
        
        // GET /api/admin/measure
        if (path === '/api/admin/measure' && req.method === 'GET') {
            if (!(await isAdmin(req.headers.authorization))) {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const result = await sql`SELECT * FROM measure_requests ORDER BY created_at DESC`;
            return res.json({ items: result.rows });
        }
        
        // PUT /api/admin/measure/status
        if (path === '/api/admin/measure/status' && req.method === 'PUT') {
            if (!(await isAdmin(req.headers.authorization))) {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const { id, status } = req.body;
            await sql`UPDATE measure_requests SET status = ${status} WHERE id = ${id}`;
            return res.json({ success: true });
        }
        
        // DELETE /api/admin/measure/delete
        if (path === '/api/admin/measure/delete' && req.method === 'DELETE') {
            if (!(await isAdmin(req.headers.authorization))) {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const { id } = req.body;
            await sql`DELETE FROM measure_requests WHERE id = ${id}`;
            return res.json({ success: true });
        }
        
        // PUT /api/admin/product/update
        if (path === '/api/admin/product/update' && req.method === 'PUT') {
            if (!(await isAdmin(req.headers.authorization))) {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const { collection, id, name, description, price, type, material, color, style, thickness, wear_class, pictures } = req.body;
            const table = collection === 'laminate' ? 'laminate' : 'doors';
            await sql`
                UPDATE ${sql(table)} 
                SET name = ${name}, description = ${description}, price = ${price}, 
                    type = ${type}, material = ${material}, color = ${color}, 
                    style = ${style}, thickness = ${thickness}, wear_class = ${wear_class}, 
                    pictures = ${pictures}
                WHERE id = ${id}
            `;
            return res.json({ success: true });
        }
        
        // POST /api/admin/product/create
        if (path === '/api/admin/product/create' && req.method === 'POST') {
            if (!(await isAdmin(req.headers.authorization))) {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const { collection, name, description, price, type, material, color, style, thickness, wear_class, pictures } = req.body;
            const table = collection === 'laminate' ? 'laminate' : 'doors';
            await sql`
                INSERT INTO ${sql(table)} (name, description, price, type, material, color, style, thickness, wear_class, pictures, created_at)
                VALUES (${name}, ${description}, ${price}, ${type}, ${material}, ${color}, ${style}, ${thickness}, ${wear_class}, ${pictures}, NOW())
            `;
            return res.json({ success: true });
        }
        
        // DELETE /api/admin/product/delete
        if (path === '/api/admin/product/delete' && req.method === 'DELETE') {
            if (!(await isAdmin(req.headers.authorization))) {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const { collection, id } = req.body;
            const table = collection === 'laminate' ? 'laminate' : 'doors';
            await sql`DELETE FROM ${sql(table)} WHERE id = ${id}`;
            return res.json({ success: true });
        }
        
        // GET /api/admin/product/:collection/:id
        const adminProductMatch = path.match(/^\/api\/admin\/product\/([^/]+)\/([^/]+)$/);
        if (adminProductMatch && req.method === 'GET') {
            if (!(await isAdmin(req.headers.authorization))) {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const collection = adminProductMatch[1];
            const id = adminProductMatch[2];
            const table = collection === 'laminate' ? 'laminate' : 'doors';
            const result = await sql`SELECT * FROM ${sql(table)} WHERE id = ${id}`;
            if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
            return res.json(result.rows[0]);
        }
        
        // 404
        return res.status(404).json({ error: 'Endpoint not found' });
        
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}