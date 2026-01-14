-- ========================================
-- Миграция v1: Добавление полей для админки
-- ========================================

-- 1. Добавляем недостающие поля в products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100);

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0 CHECK (views_count >= 0);

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS favorites_count INTEGER DEFAULT 0 CHECK (favorites_count >= 0);

-- 2. Создаём таблицу админов
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- 3. Админ создаётся через скрипт create-admin.js
-- (там пароль хешируется правильно)

-- 4. Триггер для автоудаления пустых справочников
-- Функция удаления неиспользуемых брендов
CREATE OR REPLACE FUNCTION cleanup_unused_brands()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM brands 
    WHERE id = OLD.brand_id 
    AND NOT EXISTS (SELECT 1 FROM products WHERE brand_id = OLD.brand_id);
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Функция удаления неиспользуемых типов
CREATE OR REPLACE FUNCTION cleanup_unused_types()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM types 
    WHERE id = OLD.type_id 
    AND NOT EXISTS (SELECT 1 FROM products WHERE type_id = OLD.type_id);
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Функция удаления неиспользуемых цветов
CREATE OR REPLACE FUNCTION cleanup_unused_colors()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM colors 
    WHERE id = OLD.color_id 
    AND NOT EXISTS (SELECT 1 FROM products WHERE color_id = OLD.color_id);
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Удаляем старые триггеры если есть
DROP TRIGGER IF EXISTS trigger_cleanup_brands ON products;
DROP TRIGGER IF EXISTS trigger_cleanup_types ON products;
DROP TRIGGER IF EXISTS trigger_cleanup_colors ON products;

-- Создаём триггеры
CREATE TRIGGER trigger_cleanup_brands
    AFTER DELETE ON products
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_unused_brands();

CREATE TRIGGER trigger_cleanup_types
    AFTER DELETE ON products
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_unused_types();

CREATE TRIGGER trigger_cleanup_colors
    AFTER DELETE ON products
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_unused_colors();

-- 5. Обновляем VIEW для товаров (добавляем новые поля)
CREATE OR REPLACE VIEW products_view AS
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
    b.name AS brand,
    t.name AS type,
    c.name AS color,
    c.hex_code AS color_hex,
    p.sales,
    p.views_count,
    p.favorites_count,
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

-- 6. Проверка
SELECT 'Миграция выполнена успешно!' AS status;
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('discount_percent', 'views_count', 'favorites_count');