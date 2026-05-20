// scripts/import-data.js
// Запускать: node scripts/import-data.js

import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import fs from 'fs';

async function importData() {
    console.log('🔄 Начинаем импорт данных...');
    
    // 1. Обновляем пароль администратора
    const adminPassword = 'Admin123!';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    await sql`
        UPDATE users 
        SET password_hash = ${hashedPassword}
        WHERE email = 'admin@polyart.ru'
    `;
    console.log('✅ Пароль администратора обновлен');
    
    // 2. Импортируем двери (если есть файл)
    try {
        const doorsData = JSON.parse(fs.readFileSync('./data/doors.json', 'utf8'));
        for (const door of doorsData) {
            await sql`
                INSERT INTO doors (name, description, price, type, material, color, style, thickness, number_id, pictures)
                VALUES (${door.name}, ${door.description}, ${door.price}, ${door.type}, ${door.material}, ${door.color}, ${door.style}, ${door.thickness}, ${door.number_id}, ${door.pictures})
                ON CONFLICT (id) DO NOTHING
            `;
        }
        console.log(`✅ Импортировано ${doorsData.length} дверей`);
    } catch (e) {
        console.log('⚠️ Файл data/doors.json не найден, пропускаем');
    }
    
    // 3. Импортируем ламинат
    try {
        const laminateData = JSON.parse(fs.readFileSync('./data/laminate.json', 'utf8'));
        for (const item of laminateData) {
            await sql`
                INSERT INTO laminate (name, description, price, type, thickness, wear_class, color, type_room, size, pack_quantity, pack_area, pack_weight, lock_type, lifespan, pictures)
                VALUES (${item.name}, ${item.description}, ${item.price}, ${item.type}, ${item.thickness}, ${item.wear_class}, ${item.color}, ${item.type_room}, ${item.size}, ${item.pack_quantity}, ${item.pack_area}, ${item.pack_weight}, ${item.lock_type}, ${item.lifespan}, ${item.pictures})
            `;
        }
        console.log(`✅ Импортировано ${laminateData.length} товаров ламината`);
    } catch (e) {
        console.log('⚠️ Файл data/laminate.json не найден, пропускаем');
    }
    
    console.log('🎉 Импорт завершен!');
}

importData().catch(console.error);