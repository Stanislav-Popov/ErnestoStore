/** @format */

/**
 * Скрипт для импорта товаров из data.json в PostgreSQL
 *
 * Запуск: npm run import
 *
 * ВАЖНО: Укажи правильный путь к data.json в переменной DATA_PATH ниже
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import pkg from "pg"
import dotenv from "dotenv"

dotenv.config()
const { Pool } = pkg

// ⚠️ УКАЖИ ПУТЬ К СВОЕМУ data.json
// Варианты:
// - "../frontend/public/data.json" (если frontend рядом с backend)
// - "./data.json" (если скопировал data.json в папку backend)
const DATA_PATH = "../frontend/data.json"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
})

async function importData() {
    const client = await pool.connect()

    try {
        // Путь к data.json
        const dataPath = path.resolve(__dirname, DATA_PATH)

        console.log("📂 Ищу файл:", dataPath)

        if (!fs.existsSync(dataPath)) {
            console.error("❌ Файл не найден!")
            console.log("\n💡 Варианты решения:")
            console.log("   1. Скопируй data.json в папку backend")
            console.log("   2. Измени DATA_PATH в import-data.js")
            console.log("\n   Текущий путь:", DATA_PATH)
            process.exit(1)
        }

        console.log("📖 Читаю data.json...")
        const rawData = fs.readFileSync(dataPath, "utf8")
        const products = JSON.parse(rawData)

        console.log(`📦 Найдено ${products.length} товаров\n`)

        await client.query("BEGIN")

        let imported = 0
        let skipped = 0

        for (const product of products) {
            process.stdout.write(`  → ${product.name.padEnd(30)}`)

            // Получаем или создаём бренд
            let brandId = null
            if (product.brand) {
                const brandResult = await client.query(
                    `INSERT INTO brands (name) 
                     VALUES ($1) 
                     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name 
                     RETURNING id`,
                    [product.brand]
                )
                brandId = brandResult.rows[0].id
            }

            // Получаем или создаём тип
            let typeId = null
            if (product.type) {
                const typeResult = await client.query(
                    `INSERT INTO types (name) 
                     VALUES ($1) 
                     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name 
                     RETURNING id`,
                    [product.type]
                )
                typeId = typeResult.rows[0].id
            }

            // Получаем или создаём цвет
            let colorId = null
            if (product.color) {
                const colorResult = await client.query(
                    `INSERT INTO colors (name) 
                     VALUES ($1) 
                     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name 
                     RETURNING id`,
                    [product.color]
                )
                colorId = colorResult.rows[0].id
            }

            // Проверяем, существует ли товар
            const existingProduct = await client.query("SELECT id FROM products WHERE name = $1", [
                product.name,
            ])

            if (existingProduct.rows.length > 0) {
                console.log("⚠️  уже существует")
                skipped++
                continue
            }

            // Создаём товар
            const productResult = await client.query(
                `INSERT INTO products (name, price, description, brand_id, type_id, color_id, sales, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING id`,
                [
                    product.name,
                    product.price,
                    product.description,
                    brandId,
                    typeId,
                    colorId,
                    product.sales || 0,
                    product.date || new Date(),
                ]
            )

            const productId = productResult.rows[0].id

            // Добавляем изображения
            const images = product.images || [product.image]
            for (let i = 0; i < images.length; i++) {
                await client.query(
                    `INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
                     VALUES ($1, $2, $3, $4)`,
                    [productId, images[i], i === 0, i]
                )
            }

            // Добавляем размеры
            if (product.sizes && product.sizes.length > 0) {
                for (const sizeName of product.sizes) {
                    // Убедимся, что размер существует
                    await client.query(
                        `INSERT INTO sizes (name, sort_order) 
                         VALUES ($1, $2) 
                         ON CONFLICT (name) DO NOTHING`,
                        [sizeName, getSortOrder(sizeName)]
                    )

                    // Получаем ID размера
                    const sizeResult = await client.query("SELECT id FROM sizes WHERE name = $1", [sizeName])

                    if (sizeResult.rows.length > 0) {
                        await client.query(
                            `INSERT INTO product_sizes (product_id, size_id, stock)
                             VALUES ($1, $2, 10)
                             ON CONFLICT DO NOTHING`,
                            [productId, sizeResult.rows[0].id]
                        )
                    }
                }
            }

            console.log("✅")
            imported++
        }

        await client.query("COMMIT")

        console.log("\n" + "=".repeat(50))
        console.log("✅ Импорт завершён!")
        console.log(`   Импортировано: ${imported}`)
        console.log(`   Пропущено: ${skipped}`)

        // Показываем статистику
        const stats = await client.query(`
            SELECT 
                (SELECT COUNT(*) FROM products WHERE is_active = TRUE) as products,
                (SELECT COUNT(*) FROM brands) as brands,
                (SELECT COUNT(*) FROM types) as types,
                (SELECT COUNT(*) FROM colors) as colors
        `)

        console.log("\n📊 В базе данных:")
        console.log(`   Товаров: ${stats.rows[0].products}`)
        console.log(`   Брендов: ${stats.rows[0].brands}`)
        console.log(`   Типов: ${stats.rows[0].types}`)
        console.log(`   Цветов: ${stats.rows[0].colors}`)
    } catch (error) {
        await client.query("ROLLBACK")
        console.error("\n❌ Ошибка импорта:", error.message)

        if (error.code === "ECONNREFUSED") {
            console.log("\n💡 PostgreSQL не запущен или неверные настройки в .env")
        }
        if (error.code === "3D000") {
            console.log("\n💡 База данных не существует. Создай её:")
            console.log('   psql -U postgres -c "CREATE DATABASE ernesto_db;"')
        }
        if (error.code === "42P01") {
            console.log("\n💡 Таблицы не созданы. Выполни schema.sql:")
            console.log("   psql -U postgres -d ernesto_db -f database/schema.sql")
        }

        throw error
    } finally {
        client.release()
        await pool.end()
    }
}

// Определение порядка сортировки размеров
function getSortOrder(size) {
    const sizeOrder = {
        XS: 1,
        S: 2,
        M: 3,
        L: 4,
        XL: 5,
        XXL: 6,
        "One Size": 100,
    }

    if (sizeOrder[size]) return sizeOrder[size]

    const numSize = parseInt(size)
    if (!isNaN(numSize)) return numSize + 10

    return 50
}

// Запуск
importData()
    .then(() => {
        console.log("\n🎉 Готово! Можешь запускать сервер: npm run dev")
        process.exit(0)
    })
    .catch(() => process.exit(1))
123456789