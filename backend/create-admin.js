/** @format */

/**
 * Скрипт для создания администратора
 * Запуск: node create-admin.js
 */

import pkg from "pg"
import bcrypt from "bcrypt"
import dotenv from "dotenv"
import readline from "readline"

dotenv.config()
const { Pool } = pkg

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
})

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
})

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve)
    })
}

async function createAdmin() {
    try {
        console.log("\n🔐 Создание администратора\n")

        // Проверяем существование таблицы
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'admins'
            )
        `)

        if (!tableCheck.rows[0].exists) {
            console.log("❌ Таблица admins не существует!")
            console.log("   Сначала выполните migration_v1.sql")
            process.exit(1)
        }

        // Запрашиваем данные
        const username = (await question("Логин (по умолчанию: admin): ")) || "admin"
        const password = (await question("Пароль (по умолчанию: admin123): ")) || "admin123"

        // Хешируем пароль
        const saltRounds = 10
        const passwordHash = await bcrypt.hash(password, saltRounds)

        // Создаём или обновляем админа
        const result = await pool.query(
            `INSERT INTO admins (username, password_hash) 
             VALUES ($1, $2)
             ON CONFLICT (username) 
             DO UPDATE SET password_hash = $2
             RETURNING id, username`,
            [username, passwordHash]
        )

        console.log("\n✅ Администратор создан!")
        console.log(`   Логин: ${result.rows[0].username}`)
        console.log(`   Пароль: ${password}`)
        console.log("\n🔗 Вход: http://localhost:5000/api/admin/login (POST)")
    } catch (error) {
        console.error("\n❌ Ошибка:", error.message)
    } finally {
        rl.close()
        await pool.end()
        process.exit(0)
    }
}

createAdmin()
