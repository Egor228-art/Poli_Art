-- schema.sql для Vercel Postgres
-- Выполнить через Vercel Storage → Data → Query

-- УДАЛЯЕМ СТАРЫЕ ТАБЛИЦЫ (если есть)
DROP TABLE IF EXISTS contact_messages CASCADE;
DROP TABLE IF EXISTS measure_requests CASCADE;
DROP TABLE IF EXISTS reviews_laminate CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS laminate CASCADE;
DROP TABLE IF EXISTS doors CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ПОЛЬЗОВАТЕЛИ
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ДВЕРИ
CREATE TABLE doors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    type VARCHAR(100),
    material VARCHAR(100),
    color TEXT[],
    style VARCHAR(100),
    thickness VARCHAR(50),
    number_id VARCHAR(100),
    pictures TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ЛАМИНАТ
CREATE TABLE laminate (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    type VARCHAR(100),
    thickness VARCHAR(50),
    wear_class VARCHAR(50),
    color TEXT[],
    type_room TEXT[],
    size VARCHAR(100),
    pack_quantity INTEGER,
    pack_area DECIMAL(10,2),
    pack_weight DECIMAL(10,2),
    lock_type VARCHAR(50),
    lifespan VARCHAR(100),
    pictures TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ЗАКАЗЫ
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    products JSONB NOT NULL,
    total_price INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'ожидает',
    delivery_type VARCHAR(50),
    delivery_address TEXT,
    payment_method VARCHAR(50),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ОТЗЫВЫ НА ДВЕРИ
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    product_name VARCHAR(255),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    text TEXT NOT NULL,
    pros TEXT,
    cons TEXT,
    author_name VARCHAR(255),
    author_email VARCHAR(255),
    approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ОТЗЫВЫ НА ЛАМИНАТ
CREATE TABLE reviews_laminate (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    product_name VARCHAR(255),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    text TEXT NOT NULL,
    pros TEXT,
    cons TEXT,
    author_name VARCHAR(255),
    author_email VARCHAR(255),
    approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ЗАЯВКИ НА ЗАМЕР
CREATE TABLE measure_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    room_type VARCHAR(100),
    desired_date DATE,
    comments TEXT,
    product_id UUID,
    product_name VARCHAR(255),
    product_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'новая',
    created_at TIMESTAMP DEFAULT NOW()
);

-- СООБЩЕНИЯ ИЗ КОНТАКТОВ
CREATE TABLE contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    message TEXT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ИНДЕКСЫ
CREATE INDEX idx_doors_type ON doors(type);
CREATE INDEX idx_doors_price ON doors(price);
CREATE INDEX idx_laminate_type ON laminate(type);
CREATE INDEX idx_laminate_price ON laminate(price);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_approved ON reviews(approved);
CREATE INDEX idx_reviews_laminate_product_id ON reviews_laminate(product_id);

-- АДМИН ПО УМОЛЧАНИЮ (пароль: Admin123!)
-- Пароль будет захеширован скриптом, пока вставляем заглушку
INSERT INTO users (id, email, name, role, password_hash) 
VALUES (gen_random_uuid(), 'admin@polyart.ru', 'Администратор', 'admin', '$2a$10$dummyHashForAdmin')
ON CONFLICT (email) DO NOTHING;