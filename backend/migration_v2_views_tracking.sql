-- Миграция v2: таблицы для отслеживания просмотров и избранного
-- Файл: migration_v2_views_tracking.sql

-- Таблица для отслеживания уникальных просмотров
CREATE TABLE IF NOT EXISTS product_views (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    device_id VARCHAR(100),
    ip_address VARCHAR(45),
    session_id VARCHAR(100),
    viewed_date DATE DEFAULT CURRENT_DATE,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Уникальный индекс для предотвращения дублей (один просмотр от устройства в день)
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_views_unique 
ON product_views(product_id, device_id, viewed_date);

-- Таблица для отслеживания избранного
CREATE TABLE IF NOT EXISTS product_favorites (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    device_id VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Уникальный индекс для избранного
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_favorites_unique 
ON product_favorites(product_id, device_id);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_product_views_product_id ON product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_device_id ON product_views(device_id);
CREATE INDEX IF NOT EXISTS idx_product_views_date ON product_views(viewed_date);

CREATE INDEX IF NOT EXISTS idx_product_favorites_product_id ON product_favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_product_favorites_device_id ON product_favorites(device_id);
CREATE INDEX IF NOT EXISTS idx_product_favorites_active ON product_favorites(is_active);

-- Индексы для products (только если столбцы существуют)
CREATE INDEX IF NOT EXISTS idx_products_views_count ON products(views_count DESC);
CREATE INDEX IF NOT EXISTS idx_products_favorites_count ON products(favorites_count DESC);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);