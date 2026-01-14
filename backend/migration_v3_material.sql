-- Миграция v3: Добавление материала и исправления
-- Выполнить: psql -U postgres -d ernesto_db -f migration_v3_material.sql

-- ========================================
-- 1. Добавляем поле материал в products
-- ========================================

-- Проверяем, существует ли уже поле material
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'material'
    ) THEN
        ALTER TABLE products ADD COLUMN material VARCHAR(255);
        RAISE NOTICE 'Добавлено поле material';
    ELSE
        RAISE NOTICE 'Поле material уже существует';
    END IF;
END $$;

-- ========================================
-- 2. Добавляем поля views_count и favorites_count если их нет
-- ========================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'views_count'
    ) THEN
        ALTER TABLE products ADD COLUMN views_count INT DEFAULT 0;
        RAISE NOTICE 'Добавлено поле views_count';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'favorites_count'
    ) THEN
        ALTER TABLE products ADD COLUMN favorites_count INT DEFAULT 0;
        RAISE NOTICE 'Добавлено поле favorites_count';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'discount_percent'
    ) THEN
        ALTER TABLE products ADD COLUMN discount_percent INT DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100);
        RAISE NOTICE 'Добавлено поле discount_percent';
    END IF;
END $$;

-- ========================================
-- 3. Индексы для оптимизации
-- ========================================

CREATE INDEX IF NOT EXISTS idx_products_views ON products(views_count DESC);
CREATE INDEX IF NOT EXISTS idx_products_favorites ON products(favorites_count DESC);
CREATE INDEX IF NOT EXISTS idx_products_discount ON products(discount_percent DESC);

-- ========================================
-- 4. Добавляем категорию размера (для группировки в фильтрах)
-- ========================================

-- Добавляем поле category в sizes если его нет
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sizes' AND column_name = 'category'
    ) THEN
        ALTER TABLE sizes ADD COLUMN category VARCHAR(50) DEFAULT 'letter';
        RAISE NOTICE 'Добавлено поле category в sizes';
    END IF;
END $$;

-- Обновляем категории размеров
UPDATE sizes SET category = 'letter' WHERE name IN ('XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL');
UPDATE sizes SET category = 'eu' WHERE name IN ('44', '46', '48', '50', '52', '54', '56', '58');
UPDATE sizes SET category = 'jeans' WHERE name IN ('26', '28', '29', '30', '31', '32', '33', '34', '36', '38');
UPDATE sizes SET category = 'shoes' WHERE name IN ('35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47');
UPDATE sizes SET category = 'universal' WHERE name = 'One Size';

-- Добавляем недостающие размеры для одежды (EU)
INSERT INTO sizes (name, sort_order, category) VALUES
    ('44', 30, 'eu'),
    ('46', 31, 'eu'),
    ('48', 32, 'eu'),
    ('50', 33, 'eu'),
    ('52', 34, 'eu'),
    ('54', 35, 'eu'),
    ('56', 36, 'eu'),
    ('58', 37, 'eu')
ON CONFLICT (name) DO UPDATE SET category = EXCLUDED.category;

-- ========================================
-- 5. Обновляем views_count на основе sales (для начальных данных)
-- ========================================

-- Копируем sales в views_count если views_count пустой
UPDATE products 
SET views_count = COALESCE(sales, 0) * 10 + FLOOR(RANDOM() * 100)
WHERE views_count = 0 OR views_count IS NULL;

-- ========================================
-- 6. Обновляем представление products_view
-- ========================================

-- Сначала удаляем старое представление
DROP VIEW IF EXISTS products_view;

-- Создаём новое представление
CREATE VIEW products_view AS
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
    c.hex_code AS color_hex,
    p.views_count,
    p.favorites_count,
    p.sales,
    p.is_active,
    p.created_at AS date,
    p.updated_at,
    (SELECT image_url FROM product_images 
     WHERE product_id = p.id AND is_primary = TRUE 
     LIMIT 1) AS image,
    (SELECT json_agg(image_url ORDER BY sort_order) 
     FROM product_images 
     WHERE product_id = p.id) AS images,
    (SELECT json_agg(s.name ORDER BY s.sort_order) 
     FROM product_sizes ps 
     JOIN sizes s ON ps.size_id = s.id 
     WHERE ps.product_id = p.id AND ps.stock > 0) AS sizes
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN types t ON p.type_id = t.id
LEFT JOIN colors c ON p.color_id = c.id;

-- ========================================
-- 7. Примеры материалов (можно обновить вручную)
-- ========================================

-- UPDATE products SET material = '100% хлопок' WHERE type_id IN (SELECT id FROM types WHERE name = 'Футболка');
-- UPDATE products SET material = '80% хлопок, 20% полиэстер' WHERE type_id IN (SELECT id FROM types WHERE name IN ('Худи', 'Свитшот'));
-- UPDATE products SET material = '98% хлопок, 2% эластан' WHERE type_id IN (SELECT id FROM types WHERE name = 'Джинсы');

-- Выводим сообщение об успехе
DO $$
BEGIN
    RAISE NOTICE 'Миграция v3 выполнена успешно!';
END $$;