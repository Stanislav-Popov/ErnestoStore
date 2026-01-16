/** @format */

import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import pkg from "pg"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import multer from "multer"
import path from "path"
import { fileURLToPath } from "url"
import fs from "fs"
import sharp from "sharp"

dotenv.config()
const { Pool } = pkg

// Для ES модулей
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(cors())
app.use(express.json())

// Создаём папки для изображений
const uploadsDir = path.join(__dirname, "uploads")
const cacheDir = path.join(__dirname, "uploads", ".cache")

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
}
if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true })
}

// ========================================
// Оптимизация изображений (WebP, resize)
// ========================================

/**
 * Middleware для обработки изображений
 * Поддерживает параметры:
 * - w: ширина (100-2000)
 * - q: качество (1-100, по умолчанию 80)
 * - format: webp, jpeg, png (автоопределение по Accept header)
 */
async function imageProcessingMiddleware(req, res, next) {
    const requestedPath = req.path.replace(/^\/uploads/, "")
    const { w, q, format } = req.query

    // Если нет параметров оптимизации, передаём статике
    if (!w && !q && !format) {
        return next()
    }

    // Путь к оригинальному файлу
    const originalPath = path.join(uploadsDir, requestedPath)

    console.log("requestedPath:", requestedPath)
    console.log("originalPath:", originalPath)

    // Проверяем существование файла
    if (!fs.existsSync(originalPath)) {
        return res.status(404).json({ error: "Изображение не найдено" })
    }

    // Определяем выходной формат
    let outputFormat = format
    if (!outputFormat) {
        // Автоопределение по Accept header
        const acceptHeader = req.headers.accept || ""
        if (acceptHeader.includes("image/webp")) {
            outputFormat = "webp"
        } else {
            // Сохраняем оригинальный формат
            const ext = path.extname(requestedPath).toLowerCase()
            outputFormat = ext === ".png" ? "png" : "jpeg"
        }
    }

    // Параметры
    const width = w ? Math.min(Math.max(parseInt(w), 100), 2000) : null
    const quality = q ? Math.min(Math.max(parseInt(q), 1), 100) : 80

    // Генерируем имя кэш-файла
    const cacheKey = `${path.basename(requestedPath, path.extname(requestedPath))}_w${
        width || "orig"
    }_q${quality}.${outputFormat}`
    const cachePath = path.join(cacheDir, cacheKey)

    // Проверяем кэш
    if (fs.existsSync(cachePath)) {
        const stat = fs.statSync(cachePath)
        const originalStat = fs.statSync(originalPath)

        // Если кэш свежее оригинала - отдаём из кэша
        if (stat.mtime > originalStat.mtime) {
            res.set("Content-Type", `image/${outputFormat}`)
            res.set("Cache-Control", "public, max-age=31536000") // 1 год
            res.set("X-Image-Cache", "HIT")
            return res.sendFile(cachePath)
        }
    }

    try {
        // Обрабатываем изображение
        let pipeline = sharp(originalPath)

        // Ресайз если указана ширина
        if (width) {
            pipeline = pipeline.resize(width, null, {
                fit: "inside",
                withoutEnlargement: true,
            })
        }

        // Конвертируем в нужный формат
        if (outputFormat === "webp") {
            pipeline = pipeline.webp({ quality })
        } else if (outputFormat === "png") {
            pipeline = pipeline.png({ quality: Math.round(quality / 10) })
        } else {
            pipeline = pipeline.jpeg({ quality, mozjpeg: true })
        }

        // Сохраняем в кэш и отправляем
        const buffer = await pipeline.toBuffer()

        // Асинхронно сохраняем в кэш
        fs.writeFile(cachePath, buffer, (err) => {
            if (err) console.error("Ошибка записи кэша:", err)
        })

        res.set("Content-Type", `image/${outputFormat}`)
        res.set("Cache-Control", "public, max-age=31536000")
        res.set("X-Image-Cache", "MISS")
        res.send(buffer)
    } catch (error) {
        console.error("Ошибка обработки изображения:", error)
        // Fallback на оригинал
        next()
    }
}

// Применяем middleware для /uploads
app.use("/uploads", imageProcessingMiddleware)

// Статические файлы для загруженных изображений (fallback)
app.use(
    "/uploads",
    express.static(uploadsDir, {
        maxAge: "1y",
        etag: true,
        lastModified: true,
    })
)

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir)
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
        const ext = path.extname(file.originalname)
        cb(null, `product-${uniqueSuffix}${ext}`)
    },
})

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb(new Error("Недопустимый формат файла"))
        }
    },
})

// ========================================
// Функция оптимизации изображений при загрузке
// ========================================

/**
 * Оптимизирует загруженное изображение:
 * - Уменьшает размер если больше maxWidth
 * - Создаёт WebP версию
 * - Оптимизирует оригинал
 */
async function optimizeUploadedImage(filePath, options = {}) {
    const { maxWidth = 1600, quality = 85 } = options

    try {
        const ext = path.extname(filePath).toLowerCase()
        const baseName = path.basename(filePath, ext)
        const dir = path.dirname(filePath)

        // Получаем метаданные
        const metadata = await sharp(filePath).metadata()

        // Определяем нужно ли ресайзить
        const needsResize = metadata.width > maxWidth

        // Оптимизируем оригинал
        let pipeline = sharp(filePath)

        if (needsResize) {
            pipeline = pipeline.resize(maxWidth, null, {
                fit: "inside",
                withoutEnlargement: true,
            })
        }

        // Оптимизируем в зависимости от формата
        if (ext === ".png") {
            pipeline = pipeline.png({ quality: Math.round(quality / 10), compressionLevel: 9 })
        } else if (ext === ".webp") {
            pipeline = pipeline.webp({ quality })
        } else {
            // JPEG
            pipeline = pipeline.jpeg({ quality, mozjpeg: true })
        }

        // Сохраняем оптимизированный оригинал
        const tempPath = path.join(dir, `${baseName}_temp${ext}`)
        await pipeline.toFile(tempPath)

        // Заменяем оригинал
        fs.unlinkSync(filePath)
        fs.renameSync(tempPath, filePath)

        // Создаём WebP версию (если оригинал не WebP)
        if (ext !== ".webp") {
            const webpPath = path.join(dir, `${baseName}.webp`)

            let webpPipeline = sharp(filePath)
            if (needsResize) {
                webpPipeline = webpPipeline.resize(maxWidth, null, {
                    fit: "inside",
                    withoutEnlargement: true,
                })
            }

            await webpPipeline.webp({ quality }).toFile(webpPath)

            console.log(`✅ Создана WebP версия: ${webpPath}`)
        }

        console.log(`✅ Изображение оптимизировано: ${filePath}`)
        return true
    } catch (error) {
        console.error("Ошибка оптимизации изображения:", error)
        return false
    }
}

/**
 * Middleware для оптимизации после загрузки
 */
async function optimizeAfterUpload(req, res, next) {
    if (!req.files && !req.file) {
        return next()
    }

    const files = req.files || [req.file]

    // Оптимизируем асинхронно (не блокируем ответ)
    Promise.all(files.map((file) => optimizeUploadedImage(file.path))).catch((err) =>
        console.error("Ошибка пакетной оптимизации:", err)
    )

    next()
}

// ========================================
// Подключение к базе данных
// ========================================

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 5000,
})

pool.connect()
    .then(() => console.log("✅ Подключено к PostgreSQL"))
    .catch((err) => console.error("❌ Ошибка подключения:", err))

// JWT секрет
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

// ========================================
// Middleware: проверка авторизации
// ========================================

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Требуется авторизация" })
    }

    const token = authHeader.split(" ")[1]

    try {
        const decoded = jwt.verify(token, JWT_SECRET)
        req.admin = decoded
        next()
    } catch (error) {
        return res.status(401).json({ error: "Недействительный токен" })
    }
}

// ========================================
// API: Авторизация
// ========================================

// Вход
app.post("/api/admin/login", async (req, res) => {
    try {
        const { username, password } = req.body

        if (!username || !password) {
            return res.status(400).json({ error: "Введите логин и пароль" })
        }

        const result = await pool.query(
            "SELECT id, username, password_hash FROM admins WHERE username = $1",
            [username]
        )

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Неверный логин или пароль" })
        }

        const admin = result.rows[0]
        const validPassword = await bcrypt.compare(password, admin.password_hash)

        if (!validPassword) {
            return res.status(401).json({ error: "Неверный логин или пароль" })
        }

        // Обновляем last_login
        await pool.query("UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = $1", [admin.id])

        // Создаём токен
        const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: "24h" })

        res.json({
            token,
            admin: { id: admin.id, username: admin.username },
        })
    } catch (error) {
        console.error("Ошибка входа:", error)
        res.status(500).json({ error: "Ошибка сервера" })
    }
})

// Проверка токена
app.get("/api/admin/me", authMiddleware, (req, res) => {
    res.json({ admin: req.admin })
})

// ========================================
// API: Загрузка файлов
// ========================================

app.post("/api/admin/upload", authMiddleware, upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Файл не загружен" })
        }

        const url = `/uploads/${req.file.filename}`

        // Асинхронно оптимизируем изображение (не блокируем ответ)
        optimizeUploadedImage(req.file.path).catch((err) => console.error("Ошибка оптимизации:", err))

        res.json({ url, filename: req.file.filename })
    } catch (error) {
        console.error("Ошибка загрузки файла:", error)
        res.status(500).json({ error: "Ошибка загрузки файла" })
    }
})

// Множественная загрузка изображений
app.post("/api/admin/upload-multiple", authMiddleware, upload.array("images", 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "Файлы не загружены" })
        }

        const urls = req.files.map((file) => `/uploads/${file.filename}`)

        // Асинхронно оптимизируем все изображения
        Promise.all(req.files.map((file) => optimizeUploadedImage(file.path))).catch((err) =>
            console.error("Ошибка пакетной оптимизации:", err)
        )

        res.json({ urls, count: req.files.length })
    } catch (error) {
        console.error("Ошибка загрузки файлов:", error)
        res.status(500).json({ error: "Ошибка загрузки файлов" })
    }
})

// Очистка кэша изображений
app.delete("/api/admin/image-cache", authMiddleware, async (req, res) => {
    try {
        const files = fs.readdirSync(cacheDir)
        let deletedCount = 0

        for (const file of files) {
            const filePath = path.join(cacheDir, file)
            if (fs.statSync(filePath).isFile()) {
                fs.unlinkSync(filePath)
                deletedCount++
            }
        }

        res.json({
            success: true,
            message: `Удалено ${deletedCount} файлов из кэша`,
            deletedCount,
        })
    } catch (error) {
        console.error("Ошибка очистки кэша:", error)
        res.status(500).json({ error: "Ошибка очистки кэша" })
    }
})

// Статистика кэша изображений
app.get("/api/admin/image-cache/stats", authMiddleware, async (req, res) => {
    try {
        const files = fs.readdirSync(cacheDir)
        let totalSize = 0
        let fileCount = 0

        for (const file of files) {
            const filePath = path.join(cacheDir, file)
            const stat = fs.statSync(filePath)
            if (stat.isFile()) {
                totalSize += stat.size
                fileCount++
            }
        }

        res.json({
            fileCount,
            totalSize,
            totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        })
    } catch (error) {
        console.error("Ошибка получения статистики кэша:", error)
        res.status(500).json({ error: "Ошибка получения статистики" })
    }
})

// ========================================
// API: Публичные эндпоинты (товары)
// ========================================

// Получить все товары
app.get("/api/products", async (req, res) => {
    try {
        const {
            brands,
            types,
            colors,
            sizes,
            minPrice,
            maxPrice,
            search,
            sort = "new",
            page = 1,
            limit = 32,
            hasDiscount,
        } = req.query

        let query = `
            SELECT 
                p.id,
                p.name,
                p.price,
                p.discount_percent,
                CASE 
                    WHEN p.discount_percent > 0 
                    THEN ROUND(p.price * (100 - p.discount_percent) / 100, 2)
                    ELSE p.price 
                END AS final_price,
                p.description,
                p.material,
                b.name AS brand,
                t.name AS type,
                c.name AS color,
                p.views_count,
                p.favorites_count,
                p.created_at AS date,
                (SELECT image_url FROM product_images 
                 WHERE product_id = p.id AND is_primary = TRUE 
                 LIMIT 1) AS image,
                (SELECT json_agg(image_url ORDER BY sort_order) 
                 FROM product_images WHERE product_id = p.id) AS images,
                (SELECT json_agg(s.name ORDER BY s.sort_order) 
                 FROM product_sizes ps 
                 JOIN sizes s ON ps.size_id = s.id 
                 WHERE ps.product_id = p.id AND ps.stock > 0) AS sizes
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN types t ON p.type_id = t.id
            LEFT JOIN colors c ON p.color_id = c.id
            WHERE p.is_active = TRUE
        `
        const params = []
        let paramIndex = 1

        // Фильтры
        if (brands) {
            query += ` AND b.name = ANY($${paramIndex})`
            params.push(brands.split(","))
            paramIndex++
        }

        if (types) {
            query += ` AND t.name = ANY($${paramIndex})`
            params.push(types.split(","))
            paramIndex++
        }

        if (colors) {
            query += ` AND c.name = ANY($${paramIndex})`
            params.push(colors.split(","))
            paramIndex++
        }

        if (sizes) {
            query += ` AND EXISTS (
                SELECT 1 FROM product_sizes ps
                JOIN sizes s ON ps.size_id = s.id
                WHERE ps.product_id = p.id AND ps.stock > 0 AND s.name = ANY($${paramIndex})
            )`
            params.push(sizes.split(","))
            paramIndex++
        }

        if (minPrice) {
            query += ` AND p.price >= $${paramIndex}`
            params.push(Number(minPrice))
            paramIndex++
        }

        if (maxPrice) {
            query += ` AND p.price <= $${paramIndex}`
            params.push(Number(maxPrice))
            paramIndex++
        }

        if (search) {
            query += ` AND (
                p.name ILIKE $${paramIndex} OR 
                p.description ILIKE $${paramIndex} OR
                b.name ILIKE $${paramIndex} OR
                t.name ILIKE $${paramIndex}
            )`
            params.push(`%${search}%`)
            paramIndex++
        }

        if (hasDiscount === "true") {
            query += ` AND p.discount_percent > 0`
        }

        // Сортировка
        switch (sort) {
            case "expensive":
                query += " ORDER BY p.price DESC"
                break
            case "cheap":
                query += " ORDER BY p.price ASC"
                break
            case "popular":
                query += " ORDER BY COALESCE(p.views_count, 0) DESC, p.created_at DESC"
                break
            case "favorites":
                query += " ORDER BY p.favorites_count DESC, p.created_at DESC"
                break
            case "discount":
                query += " ORDER BY p.discount_percent DESC"
                break
            case "new":
            default:
                query += " ORDER BY p.created_at DESC"
        }

        // Подсчёт общего количества
        const countQuery = query
            .replace(/SELECT[\s\S]*?FROM products/, "SELECT COUNT(*) FROM products")
            .replace(/ORDER BY[\s\S]*$/, "")

        const countResult = await pool.query(countQuery, params)
        const totalCount = parseInt(countResult.rows[0].count)

        // Пагинация
        const offset = (Number(page) - 1) * Number(limit)
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
        params.push(Number(limit), offset)

        const result = await pool.query(query, params)

        res.json({
            products: result.rows,
            pagination: {
                total: totalCount,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(totalCount / Number(limit)),
            },
        })
    } catch (error) {
        console.error("Ошибка получения товаров:", error)
        res.status(500).json({ error: "Ошибка сервера" })
    }
})

// Получить один товар
app.get("/api/products/:id", async (req, res) => {
    try {
        const { id } = req.params

        const result = await pool.query(
            `SELECT 
                p.id, p.name, p.price, p.discount_percent,
                CASE 
                    WHEN p.discount_percent > 0 
                    THEN ROUND(p.price * (100 - p.discount_percent) / 100, 2)
                    ELSE p.price 
                END AS final_price,
                p.description,
                b.name AS brand,
                t.name AS type,
                c.name AS color,
                c.hex_code AS color_hex,
                p.views_count,
                p.favorites_count,
                p.material,
                p.created_at AS date,
                (SELECT json_agg(image_url ORDER BY sort_order) 
                 FROM product_images WHERE product_id = p.id) AS images,
                (SELECT json_agg(s.name ORDER BY s.sort_order) 
                 FROM product_sizes ps 
                 JOIN sizes s ON ps.size_id = s.id 
                 WHERE ps.product_id = p.id AND ps.stock > 0) AS sizes
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN types t ON p.type_id = t.id
            LEFT JOIN colors c ON p.color_id = c.id
            WHERE p.id = $1 AND p.is_active = TRUE`,
            [id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Товар не найден" })
        }

        res.json(result.rows[0])
    } catch (error) {
        console.error("Ошибка получения товара:", error)
        res.status(500).json({ error: "Ошибка сервера" })
    }
})

// Похожие товары
app.get("/api/products/:id/related", async (req, res) => {
    try {
        const { id } = req.params
        const { limit = 4 } = req.query

        const productResult = await pool.query("SELECT type_id FROM products WHERE id = $1", [id])

        if (productResult.rows.length === 0) {
            return res.status(404).json({ error: "Товар не найден" })
        }

        const result = await pool.query(
            `SELECT 
                p.id, p.name, p.price, p.discount_percent,
                CASE 
                    WHEN p.discount_percent > 0 
                    THEN ROUND(p.price * (100 - p.discount_percent) / 100, 2)
                    ELSE p.price 
                END AS final_price,
                b.name AS brand, t.name AS type, c.name AS color,
                (SELECT image_url FROM product_images 
                 WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) AS image,
                (SELECT json_agg(s.name ORDER BY s.sort_order) 
                 FROM product_sizes ps JOIN sizes s ON ps.size_id = s.id 
                 WHERE ps.product_id = p.id AND ps.stock > 0) AS sizes
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN types t ON p.type_id = t.id
            LEFT JOIN colors c ON p.color_id = c.id
            WHERE p.id != $1 AND p.is_active = TRUE AND p.type_id = $2
            ORDER BY p.views_count DESC
            LIMIT $3`,
            [id, productResult.rows[0].type_id, Number(limit)]
        )

        res.json(result.rows)
    } catch (error) {
        console.error("Ошибка получения похожих товаров:", error)
        res.status(500).json({ error: "Ошибка сервера" })
    }
})

// Записать просмотр (с защитой от дублей)
app.post("/api/products/:id/view", async (req, res) => {
    try {
        const { id } = req.params
        const { deviceId } = req.body
        const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress

        // Проверяем, был ли уже просмотр от этого устройства сегодня
        const existingView = await pool.query(
            `SELECT id FROM product_views 
             WHERE product_id = $1 
             AND (device_id = $2 OR ($2 IS NULL AND ip_address = $3))
             AND viewed_date = CURRENT_DATE`,
            [id, deviceId, ip]
        )

        if (existingView.rows.length > 0) {
            // Просмотр уже записан сегодня
            return res.json({ success: true, duplicate: true })
        }

        // Записываем просмотр в таблицу отслеживания
        await pool.query(
            `INSERT INTO product_views (product_id, device_id, ip_address, viewed_date) 
             VALUES ($1, $2, $3, CURRENT_DATE)`,
            [id, deviceId, ip]
        )

        // Увеличиваем счётчик
        await pool.query("UPDATE products SET views_count = views_count + 1 WHERE id = $1", [id])

        res.json({ success: true, duplicate: false })
    } catch (error) {
        // Если ошибка из-за дубликата (UNIQUE constraint), просто игнорируем
        if (error.code === "23505") {
            return res.json({ success: true, duplicate: true })
        }
        console.error("Ошибка записи просмотра:", error)
        res.status(500).json({ error: "Ошибка сервера" })
    }
})

// Записать добавление/удаление из избранного (с защитой от дублей)
app.post("/api/products/:id/favorite", async (req, res) => {
    try {
        const { id } = req.params
        const { action, deviceId } = req.body

        if (!deviceId) {
            // Fallback для старых клиентов без deviceId
            if (action === "add") {
                await pool.query("UPDATE products SET favorites_count = favorites_count + 1 WHERE id = $1", [
                    id,
                ])
            } else if (action === "remove") {
                await pool.query(
                    "UPDATE products SET favorites_count = GREATEST(favorites_count - 1, 0) WHERE id = $1",
                    [id]
                )
            }
            return res.json({ success: true })
        }

        if (action === "add") {
            // Проверяем, не добавлено ли уже в избранное
            const existing = await pool.query(
                `SELECT id, is_active FROM product_favorites 
                 WHERE product_id = $1 AND device_id = $2`,
                [id, deviceId]
            )

            if (existing.rows.length > 0) {
                if (existing.rows[0].is_active) {
                    // Уже в избранном
                    return res.json({ success: true, duplicate: true })
                }
                // Реактивируем
                await pool.query(
                    `UPDATE product_favorites 
                     SET is_active = true, updated_at = CURRENT_TIMESTAMP 
                     WHERE product_id = $1 AND device_id = $2`,
                    [id, deviceId]
                )
            } else {
                // Добавляем новую запись
                await pool.query(
                    `INSERT INTO product_favorites (product_id, device_id) 
                     VALUES ($1, $2)`,
                    [id, deviceId]
                )
            }

            // Увеличиваем счётчик
            await pool.query("UPDATE products SET favorites_count = favorites_count + 1 WHERE id = $1", [id])
        } else if (action === "remove") {
            // Проверяем, есть ли в избранном
            const existing = await pool.query(
                `SELECT id, is_active FROM product_favorites 
                 WHERE product_id = $1 AND device_id = $2`,
                [id, deviceId]
            )

            if (existing.rows.length === 0 || !existing.rows[0].is_active) {
                // Не было в избранном
                return res.json({ success: true, duplicate: true })
            }

            // Деактивируем
            await pool.query(
                `UPDATE product_favorites 
                 SET is_active = false, updated_at = CURRENT_TIMESTAMP 
                 WHERE product_id = $1 AND device_id = $2`,
                [id, deviceId]
            )

            // Уменьшаем счётчик
            await pool.query(
                "UPDATE products SET favorites_count = GREATEST(favorites_count - 1, 0) WHERE id = $1",
                [id]
            )
        }

        res.json({ success: true, duplicate: false })
    } catch (error) {
        console.error("Ошибка записи избранного:", error)
        res.status(500).json({ error: "Ошибка сервера" })
    }
})

// Получить избранное пользователя по deviceId
app.get("/api/favorites/:deviceId", async (req, res) => {
    try {
        const { deviceId } = req.params

        const result = await pool.query(
            `SELECT p.*, 
                    b.name as brand, 
                    t.name as type, 
                    c.name as color,
                    ROUND(p.price * (1 - p.discount_percent / 100.0)) as final_price
             FROM products p
             LEFT JOIN brands b ON p.brand_id = b.id
             LEFT JOIN types t ON p.type_id = t.id
             LEFT JOIN colors c ON p.color_id = c.id
             INNER JOIN product_favorites pf ON p.id = pf.product_id
             WHERE pf.device_id = $1 AND pf.is_active = true
             ORDER BY pf.created_at DESC`,
            [deviceId]
        )

        res.json(result.rows)
    } catch (error) {
        console.error("Ошибка получения избранного:", error)
        res.status(500).json({ error: "Ошибка сервера" })
    }
})

// Справочники (публичные)
app.get("/api/filters", async (req, res) => {
    try {
        const [brands, types, colors, sizes, priceRange] = await Promise.all([
            pool.query(`SELECT DISTINCT b.name FROM products p 
                        JOIN brands b ON p.brand_id = b.id 
                        WHERE p.is_active = TRUE ORDER BY b.name`),
            pool.query(`SELECT DISTINCT t.name FROM products p 
                        JOIN types t ON p.type_id = t.id 
                        WHERE p.is_active = TRUE ORDER BY t.name`),
            pool.query(`SELECT DISTINCT c.name, c.hex_code FROM products p 
                        JOIN colors c ON p.color_id = c.id 
                        WHERE p.is_active = TRUE ORDER BY c.name`),
            pool.query(`SELECT DISTINCT s.name, s.sort_order, COALESCE(s.category, 'other') as category
                        FROM product_sizes ps
                        JOIN sizes s ON ps.size_id = s.id
                        JOIN products p ON ps.product_id = p.id
                        WHERE p.is_active = TRUE AND ps.stock > 0
                        ORDER BY s.sort_order`),
            pool.query(`SELECT MIN(price) as min, MAX(price) as max 
                        FROM products WHERE is_active = TRUE`),
        ])

        // Группируем размеры по категориям
        const sizesByCategory = {
            letter: [], // XS, S, M, L, XL, XXL
            eu: [], // 44, 46, 48, 50, 52, 54
            jeans: [], // 26, 28, 30, 32, 34
            shoes: [], // 37, 38, 39, 40, 41, 42, 43, 44, 45
            universal: [], // One Size
            other: [],
        }

        sizes.rows.forEach((size) => {
            const category = size.category || "other"
            if (sizesByCategory[category]) {
                sizesByCategory[category].push(size.name)
            } else {
                sizesByCategory.other.push(size.name)
            }
        })

        // Определяем названия категорий на русском
        const categoryLabels = {
            letter: "Буквенные (XS-XXL)",
            eu: "Российские (44-58)",
            jeans: "Джинсы (26-38)",
            shoes: "Обувь (35-47)",
            universal: "Универсальный",
        }

        res.json({
            brands: brands.rows.map((r) => r.name),
            types: types.rows.map((r) => r.name),
            colors: colors.rows,
            // Плоский список всех размеров (для обратной совместимости)
            sizes: sizes.rows.map((r) => r.name),
            // Размеры по категориям
            sizesByCategory: Object.entries(sizesByCategory)
                .filter(([_, values]) => values.length > 0)
                .map(([category, values]) => ({
                    category,
                    label: categoryLabels[category] || category,
                    sizes: values,
                })),
            priceRange: {
                min: parseFloat(priceRange.rows[0]?.min) || 0,
                max: parseFloat(priceRange.rows[0]?.max) || 100000,
            },
        })
    } catch (error) {
        console.error("Ошибка получения фильтров:", error)
        res.status(500).json({ error: "Ошибка сервера" })
    }
})

// ========================================
// API: Админка (защищённые эндпоинты)
// ========================================

// Статистика для дашборда
app.get("/api/admin/stats", authMiddleware, async (req, res) => {
    try {
        const [totals, topViewed, topFavorites, recentProducts, discountedProducts] = await Promise.all([
            // Общая статистика
            pool.query(`
                SELECT 
                    (SELECT COUNT(*) FROM products WHERE is_active = TRUE) as products,
                    (SELECT COUNT(*) FROM brands) as brands,
                    (SELECT COUNT(*) FROM types) as types,
                    (SELECT COUNT(*) FROM colors) as colors,
                    (SELECT COUNT(*) FROM products WHERE is_active = TRUE AND discount_percent > 0) as with_discount,
                    (SELECT COALESCE(SUM(views_count), 0) FROM products) as total_views,
                    (SELECT COALESCE(SUM(favorites_count), 0) FROM products) as total_favorites
            `),
            // Топ по просмотрам
            pool.query(`
                SELECT p.id, p.name, COALESCE(p.views_count, 0) as views_count, 
                       COALESCE(
                           (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = TRUE LIMIT 1),
                           (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1)
                       ) as image
                FROM products p 
                WHERE p.is_active = TRUE AND COALESCE(p.views_count, 0) > 0
                ORDER BY p.views_count DESC NULLS LAST LIMIT 10
            `),
            // Топ по избранному
            pool.query(`
                SELECT p.id, p.name, COALESCE(p.favorites_count, 0) as favorites_count,
                       COALESCE(
                           (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = TRUE LIMIT 1),
                           (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1)
                       ) as image
                FROM products p 
                WHERE p.is_active = TRUE AND COALESCE(p.favorites_count, 0) > 0
                ORDER BY p.favorites_count DESC NULLS LAST LIMIT 10
            `),
            // Последние добавленные
            pool.query(`
                SELECT p.id, p.name, p.price, p.created_at,
                       (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary LIMIT 1) as image
                FROM products p 
                WHERE p.is_active = TRUE 
                ORDER BY p.created_at DESC LIMIT 5
            `),
            // Товары со скидками
            pool.query(`
                SELECT p.id, p.name, p.price, p.discount_percent,
                       ROUND(p.price * (100 - p.discount_percent) / 100, 2) as final_price,
                       (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary LIMIT 1) as image
                FROM products p 
                WHERE p.is_active = TRUE AND p.discount_percent > 0
                ORDER BY p.discount_percent DESC LIMIT 10
            `),
        ])

        res.json({
            totals: totals.rows[0],
            topViewed: topViewed.rows,
            topFavorites: topFavorites.rows,
            recentProducts: recentProducts.rows,
            discountedProducts: discountedProducts.rows,
        })
    } catch (error) {
        console.error("Ошибка получения статистики:", error)
        res.status(500).json({ error: "Ошибка сервера" })
    }
})

// Справочники для админки (с количеством товаров)
app.get("/api/admin/references", authMiddleware, async (req, res) => {
    try {
        const [brands, types, colors] = await Promise.all([
            pool.query(`
                SELECT b.id, b.name, COUNT(p.id) as products_count
                FROM brands b
                LEFT JOIN products p ON p.brand_id = b.id AND p.is_active = TRUE
                GROUP BY b.id, b.name
                ORDER BY b.name
            `),
            pool.query(`
                SELECT t.id, t.name, COUNT(p.id) as products_count
                FROM types t
                LEFT JOIN products p ON p.type_id = t.id AND p.is_active = TRUE
                GROUP BY t.id, t.name
                ORDER BY t.name
            `),
            pool.query(`
                SELECT c.id, c.name, c.hex_code, COUNT(p.id) as products_count
                FROM colors c
                LEFT JOIN products p ON p.color_id = c.id AND p.is_active = TRUE
                GROUP BY c.id, c.name, c.hex_code
                ORDER BY c.name
            `),
        ])

        res.json({
            brands: brands.rows,
            types: types.rows,
            colors: colors.rows,
        })
    } catch (error) {
        console.error("Ошибка получения справочников:", error)
        res.status(500).json({ error: "Ошибка сервера" })
    }
})

// Список товаров для админки (с дополнительной инфой)
app.get("/api/admin/products", authMiddleware, async (req, res) => {
    try {
        const { search, page = 1, limit = 20 } = req.query

        let query = `
            SELECT 
                p.id, p.name, p.price, p.discount_percent,
                p.views_count, p.favorites_count,
                p.is_active, p.created_at,
                b.name AS brand, t.name AS type, c.name AS color,
                (SELECT image_url FROM product_images 
                 WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) AS image
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN types t ON p.type_id = t.id
            LEFT JOIN colors c ON p.color_id = c.id
        `
        const params = []
        let paramIndex = 1

        if (search) {
            query += ` WHERE (p.name ILIKE $${paramIndex} OR b.name ILIKE $${paramIndex})`
            params.push(`%${search}%`)
            paramIndex++
        }

        query += " ORDER BY p.created_at DESC"

        // Подсчёт общего количества (исправленный запрос)
        let countQuery = `
            SELECT COUNT(*) FROM products p
            LEFT JOIN brands b ON p.brand_id = b.id
        `
        if (search) {
            countQuery += ` WHERE (p.name ILIKE $1 OR b.name ILIKE $1)`
        }

        const countResult = await pool.query(countQuery, search ? [`%${search}%`] : [])
        const total = parseInt(countResult.rows[0].count)

        // Пагинация
        const offset = (Number(page) - 1) * Number(limit)
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
        params.push(Number(limit), offset)

        const result = await pool.query(query, params)

        res.json({
            products: result.rows,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        })
    } catch (error) {
        console.error("Ошибка получения товаров:", error)
        res.status(500).json({ error: "Ошибка сервера" })
    }
})

// Создать товар
app.post("/api/admin/products", authMiddleware, async (req, res) => {
    const client = await pool.connect()
    try {
        await client.query("BEGIN")

        const {
            name,
            price,
            description,
            brand,
            type,
            color,
            material,
            sizes,
            images,
            discount_percent = 0,
        } = req.body

        // Валидация
        if (!name || !price) {
            return res.status(400).json({ error: "Название и цена обязательны" })
        }

        // Бренд
        let brandId = null
        if (brand) {
            const brandResult = await client.query(
                `INSERT INTO brands (name) VALUES ($1) 
                 ON CONFLICT (name) DO UPDATE SET name = $1 
                 RETURNING id`,
                [brand]
            )
            brandId = brandResult.rows[0].id
        }

        // Тип
        let typeId = null
        if (type) {
            const typeResult = await client.query(
                `INSERT INTO types (name) VALUES ($1) 
                 ON CONFLICT (name) DO UPDATE SET name = $1 
                 RETURNING id`,
                [type]
            )
            typeId = typeResult.rows[0].id
        }

        // Цвет
        let colorId = null
        if (color) {
            const colorResult = await client.query(
                `INSERT INTO colors (name) VALUES ($1) 
                 ON CONFLICT (name) DO UPDATE SET name = $1 
                 RETURNING id`,
                [color]
            )
            colorId = colorResult.rows[0].id
        }

        // Товар
        const productResult = await client.query(
            `INSERT INTO products (name, price, description, brand_id, type_id, color_id, material, discount_percent)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id`,
            [name, price, description, brandId, typeId, colorId, material || null, discount_percent]
        )
        const productId = productResult.rows[0].id

        // Изображения
        if (images && images.length > 0) {
            for (let i = 0; i < images.length; i++) {
                await client.query(
                    `INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
                     VALUES ($1, $2, $3, $4)`,
                    [productId, images[i], i === 0, i]
                )
            }
        }

        // Размеры
        if (sizes && sizes.length > 0) {
            for (const sizeName of sizes) {
                // Создаём размер если нет
                await client.query(
                    `INSERT INTO sizes (name, sort_order) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                    [sizeName, getSizeOrder(sizeName)]
                )

                const sizeResult = await client.query("SELECT id FROM sizes WHERE name = $1", [sizeName])

                if (sizeResult.rows.length > 0) {
                    await client.query(
                        `INSERT INTO product_sizes (product_id, size_id, stock) VALUES ($1, $2, 10)`,
                        [productId, sizeResult.rows[0].id]
                    )
                }
            }
        }

        await client.query("COMMIT")
        res.status(201).json({ id: productId, message: "Товар создан" })
    } catch (error) {
        await client.query("ROLLBACK")
        console.error("Ошибка создания товара:", error)
        res.status(500).json({ error: "Ошибка сервера" })
    } finally {
        client.release()
    }
})

// Обновить товар
app.put("/api/admin/products/:id", authMiddleware, async (req, res) => {
    const client = await pool.connect()
    try {
        await client.query("BEGIN")

        const { id } = req.params
        const {
            name,
            price,
            description,
            brand,
            type,
            color,
            material,
            sizes,
            images,
            discount_percent,
            is_active,
        } = req.body

        // Бренд
        let brandId = null
        if (brand) {
            const brandResult = await client.query(
                `INSERT INTO brands (name) VALUES ($1) 
                 ON CONFLICT (name) DO UPDATE SET name = $1 
                 RETURNING id`,
                [brand]
            )
            brandId = brandResult.rows[0].id
        }

        // Тип
        let typeId = null
        if (type) {
            const typeResult = await client.query(
                `INSERT INTO types (name) VALUES ($1) 
                 ON CONFLICT (name) DO UPDATE SET name = $1 
                 RETURNING id`,
                [type]
            )
            typeId = typeResult.rows[0].id
        }

        // Цвет
        let colorId = null
        if (color) {
            const colorResult = await client.query(
                `INSERT INTO colors (name) VALUES ($1) 
                 ON CONFLICT (name) DO UPDATE SET name = $1 
                 RETURNING id`,
                [color]
            )
            colorId = colorResult.rows[0].id
        }

        // Обновляем товар
        await client.query(
            `UPDATE products SET 
                name = COALESCE($1, name),
                price = COALESCE($2, price),
                description = COALESCE($3, description),
                brand_id = COALESCE($4, brand_id),
                type_id = COALESCE($5, type_id),
                color_id = COALESCE($6, color_id),
                material = $7,
                discount_percent = COALESCE($8, discount_percent),
                is_active = COALESCE($9, is_active)
             WHERE id = $10`,
            [
                name,
                price,
                description,
                brandId,
                typeId,
                colorId,
                material || null,
                discount_percent,
                is_active,
                id,
            ]
        )

        // Изображения
        if (images) {
            await client.query("DELETE FROM product_images WHERE product_id = $1", [id])
            for (let i = 0; i < images.length; i++) {
                await client.query(
                    `INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
                     VALUES ($1, $2, $3, $4)`,
                    [id, images[i], i === 0, i]
                )
            }
        }

        // Размеры
        if (sizes) {
            await client.query("DELETE FROM product_sizes WHERE product_id = $1", [id])
            for (const sizeName of sizes) {
                await client.query(
                    `INSERT INTO sizes (name, sort_order) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                    [sizeName, getSizeOrder(sizeName)]
                )

                const sizeResult = await client.query("SELECT id FROM sizes WHERE name = $1", [sizeName])

                if (sizeResult.rows.length > 0) {
                    await client.query(
                        `INSERT INTO product_sizes (product_id, size_id, stock) VALUES ($1, $2, 10)`,
                        [id, sizeResult.rows[0].id]
                    )
                }
            }
        }

        await client.query("COMMIT")
        res.json({ message: "Товар обновлён" })
    } catch (error) {
        await client.query("ROLLBACK")
        console.error("Ошибка обновления товара:", error)
        res.status(500).json({ error: "Ошибка сервера" })
    } finally {
        client.release()
    }
})

// Удалить товар (мягкое удаление)
app.delete("/api/admin/products/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params
        const { permanent } = req.query

        if (permanent === "true") {
            // Жёсткое удаление
            await pool.query("DELETE FROM products WHERE id = $1", [id])
            res.json({ message: "Товар удалён навсегда" })
        } else {
            // Мягкое удаление
            await pool.query("UPDATE products SET is_active = FALSE WHERE id = $1", [id])
            res.json({ message: "Товар скрыт" })
        }
    } catch (error) {
        console.error("Ошибка удаления товара:", error)
        res.status(500).json({ error: "Ошибка сервера" })
    }
})

// Получить один товар для редактирования
app.get("/api/admin/products/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params

        const result = await pool.query(
            `SELECT 
                p.*,
                b.name AS brand,
                t.name AS type,
                c.name AS color,
                (SELECT json_agg(image_url ORDER BY sort_order) 
                 FROM product_images WHERE product_id = p.id) AS images,
                (SELECT json_agg(s.name ORDER BY s.sort_order) 
                 FROM product_sizes ps 
                 JOIN sizes s ON ps.size_id = s.id 
                 WHERE ps.product_id = p.id) AS sizes
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN types t ON p.type_id = t.id
            LEFT JOIN colors c ON p.color_id = c.id
            WHERE p.id = $1`,
            [id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Товар не найден" })
        }

        res.json(result.rows[0])
    } catch (error) {
        console.error("Ошибка получения товара:", error)
        res.status(500).json({ error: "Ошибка сервера" })
    }
})

// ========================================
// API: CRUD для справочников
// ========================================

// --- БРЕНДЫ ---

// Создать бренд
app.post("/api/admin/brands", authMiddleware, async (req, res) => {
    try {
        const { name } = req.body
        if (!name?.trim()) {
            return res.status(400).json({ error: "Название обязательно" })
        }

        const result = await pool.query(
            `INSERT INTO brands (name) VALUES ($1) 
             ON CONFLICT (name) DO UPDATE SET name = $1
             RETURNING id, name`,
            [name.trim()]
        )

        res.status(201).json(result.rows[0])
    } catch (error) {
        console.error("Ошибка создания бренда:", error)
        res.status(500).json({ error: "Ошибка сервера" })
    }
})

// Обновить бренд
app.put("/api/admin/brands/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params
        const { name } = req.body

        if (!name?.trim()) {
            return res.status(400).json({ error: "Название обязательно" })
        }

        const result = await pool.query(`UPDATE brands SET name = $1 WHERE id = $2 RETURNING id, name`, [
            name.trim(),
            id,
        ])

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Бренд не найден" })
        }

        res.json(result.rows[0])
    } catch (error) {
        console.error("Ошибка обновления бренда:", error)
        res.status(500).json({ error: "Ошибка сервера" })
    }
})

// Удалить бренд
app.delete("/api/admin/brands/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params

        // Проверяем, используется ли
        const check = await pool.query(
            "SELECT COUNT(*) FROM products WHERE brand_id = $1 AND is_active = TRUE",
            [id]
        )

        if (parseInt(check.rows[0].count) > 0) {
            return res.status(400).json({
                error: "Нельзя удалить: бренд используется в товарах",
            })
        }

        await pool.query("DELETE FROM brands WHERE id = $1", [id])
        res.json({ message: "Бренд удалён" })
    } catch (error) {
        console.error("Ошибка удаления бренда:", error)
        res.status(500).json({ error: "Ошибка сервера" })
    }
})

// --- ТИПЫ ---

// Создать тип
app.post("/api/admin/types", authMiddleware, async (req, res) => {
    try {
        const { name } = req.body
        if (!name?.trim()) {
            return res.status(400).json({ error: "Название обязательно" })
        }

        const result = await pool.query(
            `INSERT INTO types (name) VALUES ($1) 
             ON CONFLICT (name) DO UPDATE SET name = $1
             RETURNING id, name`,
            [name.trim()]
        )

        res.status(201).json(result.rows[0])
    } catch (error) {
        console.error("Ошибка создания типа:", error)
        res.status(500).json({ error: "Ошибка сервера" })
    }
})

// Обновить тип
app.put("/api/admin/types/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params
        const { name } = req.body

        if (!name?.trim()) {
            return res.status(400).json({ error: "Название обязательно" })
        }

        const result = await pool.query(`UPDATE types SET name = $1 WHERE id = $2 RETURNING id, name`, [
            name.trim(),
            id,
        ])

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Тип не найден" })
        }

        res.json(result.rows[0])
    } catch (error) {
        console.error("Ошибка обновления типа:", error)
        res.status(500).json({ error: "Ошибка сервера" })
    }
})

// Удалить тип
app.delete("/api/admin/types/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params

        const check = await pool.query(
            "SELECT COUNT(*) FROM products WHERE type_id = $1 AND is_active = TRUE",
            [id]
        )

        if (parseInt(check.rows[0].count) > 0) {
            return res.status(400).json({
                error: "Нельзя удалить: тип используется в товарах",
            })
        }

        await pool.query("DELETE FROM types WHERE id = $1", [id])
        res.json({ message: "Тип удалён" })
    } catch (error) {
        console.error("Ошибка удаления типа:", error)
        res.status(500).json({ error: "Ошибка сервера" })
    }
})

// --- ЦВЕТА ---

// Создать цвет
app.post("/api/admin/colors", authMiddleware, async (req, res) => {
    try {
        const { name, hex_code } = req.body
        if (!name?.trim()) {
            return res.status(400).json({ error: "Название обязательно" })
        }

        const result = await pool.query(
            `INSERT INTO colors (name, hex_code) VALUES ($1, $2) 
             ON CONFLICT (name) DO UPDATE SET hex_code = $2
             RETURNING id, name, hex_code`,
            [name.trim(), hex_code || null]
        )

        res.status(201).json(result.rows[0])
    } catch (error) {
        console.error("Ошибка создания цвета:", error)
        res.status(500).json({ error: "Ошибка сервера" })
    }
})

// Обновить цвет
app.put("/api/admin/colors/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params
        const { name, hex_code } = req.body

        if (!name?.trim()) {
            return res.status(400).json({ error: "Название обязательно" })
        }

        const result = await pool.query(
            `UPDATE colors SET name = $1, hex_code = COALESCE($2, hex_code) 
             WHERE id = $3 RETURNING id, name, hex_code`,
            [name.trim(), hex_code, id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Цвет не найден" })
        }

        res.json(result.rows[0])
    } catch (error) {
        console.error("Ошибка обновления цвета:", error)
        res.status(500).json({ error: "Ошибка сервера" })
    }
})

// Удалить цвет
app.delete("/api/admin/colors/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params

        const check = await pool.query(
            "SELECT COUNT(*) FROM products WHERE color_id = $1 AND is_active = TRUE",
            [id]
        )

        if (parseInt(check.rows[0].count) > 0) {
            return res.status(400).json({
                error: "Нельзя удалить: цвет используется в товарах",
            })
        }

        await pool.query("DELETE FROM colors WHERE id = $1", [id])
        res.json({ message: "Цвет удалён" })
    } catch (error) {
        console.error("Ошибка удаления цвета:", error)
        res.status(500).json({ error: "Ошибка сервера" })
    }
})

// ========================================
// Вспомогательные функции
// ========================================

function getSizeOrder(size) {
    const order = { XS: 1, S: 2, M: 3, L: 4, XL: 5, XXL: 6, "One Size": 100 }
    if (order[size]) return order[size]
    const num = parseInt(size)
    if (!isNaN(num)) return num + 10
    return 50
}

// ========================================
// Запуск сервера
// ========================================

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`)
    console.log(`📁 API: http://localhost:${PORT}/api`)
    console.log(`🔐 Админка: http://localhost:${PORT}/api/admin`)
})
