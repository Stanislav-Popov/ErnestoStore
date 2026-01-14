-- Схема базы данных для интернет-магазина одежды
-- PostgreSQL

-- Удаляем таблицы если существуют (для чистой установки)
DROP TABLE IF EXISTS product_sizes CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS sizes CASCADE;
DROP TABLE IF EXISTS brands CASCADE;
DROP TABLE IF EXISTS types CASCADE;
DROP TABLE IF EXISTS colors CASCADE;

-- ========================================
-- Справочные таблицы
-- ========================================

-- Бренды
CREATE TABLE brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Типы товаров (Футболка, Джинсы, Худи и т.д.)
CREATE TABLE types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Цвета
CREATE TABLE colors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    hex_code VARCHAR(7), -- например #FF0000
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Размеры
CREATE TABLE sizes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE,
    sort_order INT DEFAULT 0 -- для правильной сортировки (XS=1, S=2, M=3...)
);

-- ========================================
-- Основная таблица товаров
-- ========================================

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    description TEXT,
    brand_id INT REFERENCES brands(id) ON DELETE SET NULL,
    type_id INT REFERENCES types(id) ON DELETE SET NULL,
    color_id INT REFERENCES colors(id) ON DELETE SET NULL,
    sales INT DEFAULT 0 CHECK (sales >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Изображения товаров (один товар - много изображений)
CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Связь товаров и размеров (many-to-many)
CREATE TABLE product_sizes (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size_id INT NOT NULL REFERENCES sizes(id) ON DELETE CASCADE,
    stock INT DEFAULT 0 CHECK (stock >= 0), -- количество на складе
    UNIQUE(product_id, size_id)
);

-- ========================================
-- Индексы для оптимизации запросов
-- ========================================

CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_type ON products(type_id);
CREATE INDEX idx_products_color ON products(color_id);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_sales ON products(sales DESC);
CREATE INDEX idx_products_created ON products(created_at DESC);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE INDEX idx_product_sizes_product ON product_sizes(product_id);

-- ========================================
-- Триггер для автообновления updated_at
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Начальные данные
-- ========================================

-- Размеры
INSERT INTO sizes (name, sort_order) VALUES
    ('XS', 1), ('S', 2), ('M', 3), ('L', 4), ('XL', 5), ('XXL', 6),
    ('26', 10), ('28', 11), ('30', 12), ('32', 13), ('34', 14), ('36', 15),
    ('37', 16), ('38', 17), ('39', 18), ('40', 19), ('41', 20), ('42', 21),
    ('43', 22), ('44', 23), ('45', 24), ('46', 25), ('48', 26), ('50', 27),
    ('52', 28), ('54', 29), ('One Size', 100);

-- Бренды
INSERT INTO brands (name) VALUES
    ('Nike'), ('Adidas'), ('Puma'), ('Reebok'), ('The North Face'),
    ('Under Armour'), ('Columbia'), ('Lacoste'), ('New Balance'), ('Converse');

-- Типы товаров
INSERT INTO types (name) VALUES
    ('Футболка'), ('Джинсы'), ('Худи'), ('Кроссовки'), ('Куртка'),
    ('Свитшот'), ('Брюки'), ('Рубашка'), ('Платье'), ('Кеды'),
    ('Пальто'), ('Лонгслив'), ('Шорты'), ('Толстовка'), ('Юбка'),
    ('Обувь'), ('Кардиган'), ('Блейзер'), ('Леггинсы'), ('Сапоги'),
    ('Жилет'), ('Боди'), ('Плащ'), ('Аксессуар'), ('Комбинезон'),
    ('Туфли'), ('Топ'), ('Майка'), ('Пиджак'), ('Ботильоны'),
    ('Сандалии'), ('Пуховик'), ('Джемпер');

-- Цвета
INSERT INTO colors (name, hex_code) VALUES
    ('Черный', '#000000'),
    ('Белый', '#FFFFFF'),
    ('Синий', '#0000FF'),
    ('Серый', '#808080'),
    ('Зеленый', '#008000'),
    ('Розовый', '#FFC0CB'),
    ('Хаки', '#C3B091'),
    ('Красный', '#FF0000'),
    ('Бежевый', '#F5F5DC'),
    ('Желтый', '#FFFF00'),
    ('Темно-синий', '#000080'),
    ('Коричневый', '#8B4513'),
    ('Голубой', '#87CEEB');

-- ========================================
-- Представление для удобного получения товаров
-- ========================================

CREATE OR REPLACE VIEW products_view AS
SELECT 
    p.id,
    p.name,
    p.price,
    p.description,
    b.name AS brand,
    t.name AS type,
    c.name AS color,
    c.hex_code AS color_hex,
    p.sales,
    p.is_active,
    p.created_at AS date,
    p.updated_at,
    -- Главное изображение
    (SELECT image_url FROM product_images 
     WHERE product_id = p.id AND is_primary = TRUE 
     LIMIT 1) AS image,
    -- Все изображения как JSON массив
    (SELECT json_agg(image_url ORDER BY sort_order) 
     FROM product_images 
     WHERE product_id = p.id) AS images,
    -- Размеры как JSON массив
    (SELECT json_agg(s.name ORDER BY s.sort_order) 
     FROM product_sizes ps 
     JOIN sizes s ON ps.size_id = s.id 
     WHERE ps.product_id = p.id AND ps.stock > 0) AS sizes
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN types t ON p.type_id = t.id
LEFT JOIN colors c ON p.color_id = c.id;