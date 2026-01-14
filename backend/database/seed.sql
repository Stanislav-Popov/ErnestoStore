-- Скрипт импорта товаров из data.json
-- Запускать ПОСЛЕ schema.sql

-- ========================================
-- Импорт товаров
-- ========================================

-- Товар 1: Футболка Oversize
INSERT INTO products (name, price, description, brand_id, type_id, color_id, sales, created_at)
VALUES ('Футболка Oversize', 2490, 'Мягкий хлопок, свободный крой',
    (SELECT id FROM brands WHERE name = 'Nike'),
    (SELECT id FROM types WHERE name = 'Футболка'),
    (SELECT id FROM colors WHERE name = 'Черный'),
    324, '2024-01-15');

INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
VALUES (currval('products_id_seq'), '/images/placeholder.jpg', TRUE, 0);

INSERT INTO product_sizes (product_id, size_id, stock)
SELECT currval('products_id_seq'), id, 10 FROM sizes WHERE name IN ('S', 'M', 'L', 'XL');

-- Товар 2: Джинсы Slim Fit
INSERT INTO products (name, price, description, brand_id, type_id, color_id, sales, created_at)
VALUES ('Джинсы Slim Fit', 4990, 'Классические джинсы из плотного денима',
    (SELECT id FROM brands WHERE name = 'Adidas'),
    (SELECT id FROM types WHERE name = 'Джинсы'),
    (SELECT id FROM colors WHERE name = 'Синий'),
    567, '2024-01-14');

INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
VALUES (currval('products_id_seq'), '/images/placeholder.jpg', TRUE, 0);

INSERT INTO product_sizes (product_id, size_id, stock)
SELECT currval('products_id_seq'), id, 10 FROM sizes WHERE name IN ('28', '30', '32', '34', '36');

-- Товар 3: Худи с капюшоном
INSERT INTO products (name, price, description, brand_id, type_id, color_id, sales, created_at)
VALUES ('Худи с капюшоном', 3990, 'Теплый худи для повседневной носки',
    (SELECT id FROM brands WHERE name = 'Puma'),
    (SELECT id FROM types WHERE name = 'Худи'),
    (SELECT id FROM colors WHERE name = 'Серый'),
    189, '2025-01-13');

INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
VALUES (currval('products_id_seq'), '/images/placeholder.jpg', TRUE, 0);

INSERT INTO product_sizes (product_id, size_id, stock)
SELECT currval('products_id_seq'), id, 10 FROM sizes WHERE name IN ('M', 'L', 'XL', 'XXL');

-- Товар 4: Кроссовки Classic
INSERT INTO products (name, price, description, brand_id, type_id, color_id, sales, created_at)
VALUES ('Кроссовки Classic', 5990, 'Удобные кроссовки для города',
    (SELECT id FROM brands WHERE name = 'Reebok'),
    (SELECT id FROM types WHERE name = 'Кроссовки'),
    (SELECT id FROM colors WHERE name = 'Белый'),
    743, '2024-01-12');

INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
VALUES (currval('products_id_seq'), '/images/placeholder.jpg', TRUE, 0);

INSERT INTO product_sizes (product_id, size_id, stock)
SELECT currval('products_id_seq'), id, 10 FROM sizes WHERE name IN ('38', '39', '40', '41', '42', '43');

-- Товар 5: Куртка ветровка
INSERT INTO products (name, price, description, brand_id, type_id, color_id, sales, created_at)
VALUES ('Куртка ветровка', 7990, 'Защита от ветра и дождя',
    (SELECT id FROM brands WHERE name = 'The North Face'),
    (SELECT id FROM types WHERE name = 'Куртка'),
    (SELECT id FROM colors WHERE name = 'Зеленый'),
    421, '2024-01-11');

INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
VALUES (currval('products_id_seq'), '/images/placeholder.jpg', TRUE, 0);

INSERT INTO product_sizes (product_id, size_id, stock)
SELECT currval('products_id_seq'), id, 10 FROM sizes WHERE name IN ('S', 'M', 'L', 'XL');

-- Товар 6: Свитшот Oversize
INSERT INTO products (name, price, description, brand_id, type_id, color_id, sales, created_at)
VALUES ('Свитшот Oversize', 3490, 'Мягкий и уютный свитшот',
    (SELECT id FROM brands WHERE name = 'Under Armour'),
    (SELECT id FROM types WHERE name = 'Свитшот'),
    (SELECT id FROM colors WHERE name = 'Розовый'),
    298, '2024-01-10');

INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
VALUES (currval('products_id_seq'), '/images/placeholder.jpg', TRUE, 0);

INSERT INTO product_sizes (product_id, size_id, stock)
SELECT currval('products_id_seq'), id, 10 FROM sizes WHERE name IN ('S', 'M', 'L', 'XL');

-- Товар 7: Брюки карго
INSERT INTO products (name, price, description, brand_id, type_id, color_id, sales, created_at)
VALUES ('Брюки карго', 4590, 'Функциональные брюки с карманами',
    (SELECT id FROM brands WHERE name = 'Columbia'),
    (SELECT id FROM types WHERE name = 'Брюки'),
    (SELECT id FROM colors WHERE name = 'Хаки'),
    512, '2024-01-09');

INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
VALUES (currval('products_id_seq'), '/images/placeholder.jpg', TRUE, 0);

INSERT INTO product_sizes (product_id, size_id, stock)
SELECT currval('products_id_seq'), id, 10 FROM sizes WHERE name IN ('46', '48', '50', '52', '54');

-- Товар 8: Рубашка Oxford
INSERT INTO products (name, price, description, brand_id, type_id, color_id, sales, created_at)
VALUES ('Рубашка Oxford', 3290, 'Классическая рубашка из оксфорда',
    (SELECT id FROM brands WHERE name = 'Lacoste'),
    (SELECT id FROM types WHERE name = 'Рубашка'),
    (SELECT id FROM colors WHERE name = 'Белый'),
    376, '2024-01-08');

INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
VALUES (currval('products_id_seq'), '/images/placeholder.jpg', TRUE, 0);

INSERT INTO product_sizes (product_id, size_id, stock)
SELECT currval('products_id_seq'), id, 10 FROM sizes WHERE name IN ('38', '40', '42', '44', '46');

-- Товар 9: Платье миди
INSERT INTO products (name, price, description, brand_id, type_id, color_id, sales, created_at)
VALUES ('Платье миди', 4290, 'Элегантное платье до колена',
    (SELECT id FROM brands WHERE name = 'New Balance'),
    (SELECT id FROM types WHERE name = 'Платье'),
    (SELECT id FROM colors WHERE name = 'Красный'),
    234, '2025-01-07');

INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
VALUES (currval('products_id_seq'), '/images/placeholder.jpg', TRUE, 0);

INSERT INTO product_sizes (product_id, size_id, stock)
SELECT currval('products_id_seq'), id, 10 FROM sizes WHERE name IN ('S', 'M', 'L');

-- Товар 10: Кеды Canvas
INSERT INTO products (name, price, description, brand_id, type_id, color_id, sales, created_at)
VALUES ('Кеды Canvas', 2790, 'Легкие кеды из хлопка',
    (SELECT id FROM brands WHERE name = 'Converse'),
    (SELECT id FROM types WHERE name = 'Кеды'),
    (SELECT id FROM colors WHERE name = 'Черный'),
    687, '2024-01-06');

INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
VALUES (currval('products_id_seq'), '/images/placeholder.jpg', TRUE, 0);

INSERT INTO product_sizes (product_id, size_id, stock)
SELECT currval('products_id_seq'), id, 10 FROM sizes WHERE name IN ('36', '37', '38', '39', '40', '41');

-- Товар 11: Пальто шерстяное
INSERT INTO products (name, price, description, brand_id, type_id, color_id, sales, created_at)
VALUES ('Пальто шерстяное', 8990, 'Теплое пальто на осень-зиму',
    (SELECT id FROM brands WHERE name = 'The North Face'),
    (SELECT id FROM types WHERE name = 'Пальто'),
    (SELECT id FROM colors WHERE name = 'Бежевый'),
    156, '2024-01-05');

INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
VALUES (currval('products_id_seq'), '/images/placeholder.jpg', TRUE, 0);

INSERT INTO product_sizes (product_id, size_id, stock)
SELECT currval('products_id_seq'), id, 10 FROM sizes WHERE name IN ('42', '44', '46', '48', '50');

-- Товар 12: Лонгслив Basic
INSERT INTO products (name, price, description, brand_id, type_id, color_id, sales, created_at)
VALUES ('Лонгслив Basic', 1990, 'Базовый лонгслив на каждый день',
    (SELECT id FROM brands WHERE name = 'Nike'),
    (SELECT id FROM types WHERE name = 'Лонгслив'),
    (SELECT id FROM colors WHERE name = 'Белый'),
    845, '2024-01-04');

INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
VALUES (currval('products_id_seq'), '/images/placeholder.jpg', TRUE, 0);

INSERT INTO product_sizes (product_id, size_id, stock)
SELECT currval('products_id_seq'), id, 10 FROM sizes WHERE name IN ('S', 'M', 'L', 'XL');

-- Товар 13: Шорты джинсовые
INSERT INTO products (name, price, description, brand_id, type_id, color_id, sales, created_at)
VALUES ('Шорты джинсовые', 2990, 'Укороченные джинсы для лета',
    (SELECT id FROM brands WHERE name = 'Adidas'),
    (SELECT id FROM types WHERE name = 'Шорты'),
    (SELECT id FROM colors WHERE name = 'Синий'),
    123, '2024-01-03');

INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
VALUES (currval('products_id_seq'), '/images/placeholder.jpg', TRUE, 0);

INSERT INTO product_sizes (product_id, size_id, stock)
SELECT currval('products_id_seq'), id, 10 FROM sizes WHERE name IN ('L');

-- Товар 14: Толстовка с принтом
INSERT INTO products (name, price, description, brand_id, type_id, color_id, sales, created_at)
VALUES ('Толстовка с принтом', 3790, 'Толстовка с уникальным дизайном',
    (SELECT id FROM brands WHERE name = 'Puma'),
    (SELECT id FROM types WHERE name = 'Толстовка'),
    (SELECT id FROM colors WHERE name = 'Желтый'),
    478, '2024-01-02');

INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
VALUES (currval('products_id_seq'), '/images/placeholder.jpg', TRUE, 0);

INSERT INTO product_sizes (product_id, size_id, stock)
SELECT currval('products_id_seq'), id, 10 FROM sizes WHERE name IN ('M', 'L', 'XL', 'XXL');

-- Товар 15: Бомбер
INSERT INTO products (name, price, description, brand_id, type_id, color_id, sales, created_at)
VALUES ('Бомбер', 5490, 'Стильная куртка-бомбер',
    (SELECT id FROM brands WHERE name = 'Reebok'),
    (SELECT id FROM types WHERE name = 'Куртка'),
    (SELECT id FROM colors WHERE name = 'Черный'),
    389, '2024-01-01');

INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
VALUES (currval('products_id_seq'), '/images/placeholder.jpg', TRUE, 0);

INSERT INTO product_sizes (product_id, size_id, stock)
SELECT currval('products_id_seq'), id, 10 FROM sizes WHERE name IN ('S', 'M', 'L', 'XL');

-- Товар 16: Юбка карандаш
INSERT INTO products (name, price, description, brand_id, type_id, color_id, sales, created_at)
VALUES ('Юбка карандаш', 3190, 'Классическая юбка для офиса',
    (SELECT id FROM brands WHERE name = 'Under Armour'),
    (SELECT id FROM types WHERE name = 'Юбка'),
    (SELECT id FROM colors WHERE name = 'Темно-синий'),
    267, '2023-12-31');

INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
VALUES (currval('products_id_seq'), '/images/placeholder.jpg', TRUE, 0);

INSERT INTO product_sizes (product_id, size_id, stock)
SELECT currval('products_id_seq'), id, 10 FROM sizes WHERE name IN ('40', '42', '44', '46', '48');

-- Товар 17: Сланцы пляжные
INSERT INTO products (name, price, description, brand_id, type_id, color_id, sales, created_at)
VALUES ('Сланцы пляжные', 990, 'Легкие сланцы для отдыха',
    (SELECT id FROM brands WHERE name = 'Columbia'),
    (SELECT id FROM types WHERE name = 'Обувь'),
    (SELECT id FROM colors WHERE name = 'Синий'),
    912, '2023-12-30');

INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
VALUES (currval('products_id_seq'), '/images/placeholder.jpg', TRUE, 0);

INSERT INTO product_sizes (product_id, size_id, stock)
SELECT currval('products_id_seq'), id, 10 FROM sizes WHERE name IN ('39', '40', '41', '42', '43', '44');

-- Товар 18: Кардиган вязаный
INSERT INTO products (name, price, description, brand_id, type_id, color_id, sales, created_at)
VALUES ('Кардиган вязаный', 4690, 'Уютный кардиган ручной вязки',
    (SELECT id FROM brands WHERE name = 'Lacoste'),
    (SELECT id FROM types WHERE name = 'Кардиган'),
    (SELECT id FROM colors WHERE name = 'Коричневый'),
    198, '2023-12-29');

INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
VALUES (currval('products_id_seq'), '/images/placeholder.jpg', TRUE, 0);

INSERT INTO product_sizes (product_id, size_id, stock)
SELECT currval('products_id_seq'), id, 10 FROM sizes WHERE name IN ('S', 'M', 'L', 'XL');

-- Товар 19: Блейзер классический
INSERT INTO products (name, price, description, brand_id, type_id, color_id, sales, created_at)
VALUES ('Блейзер классический', 6590, 'Деловой блейзер для формальных мероприятий',
    (SELECT id FROM brands WHERE name = 'New Balance'),
    (SELECT id FROM types WHERE name = 'Блейзер'),
    (SELECT id FROM colors WHERE name = 'Черный'),
    145, '2023-12-28');

INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
VALUES (currval('products_id_seq'), '/images/placeholder.jpg', TRUE, 0);

INSERT INTO product_sizes (product_id, size_id, stock)
SELECT currval('products_id_seq'), id, 10 FROM sizes WHERE name IN ('46', '48', '50', '52', '54');

-- Товар 20: Футболка Polo
INSERT INTO products (name, price, description, brand_id, type_id, color_id, sales, created_at)
VALUES ('Футболка Polo', 2890, 'Полированная футболка с воротником',
    (SELECT id FROM brands WHERE name = 'Converse'),
    (SELECT id FROM types WHERE name = 'Футболка'),
    (SELECT id FROM colors WHERE name = 'Темно-синий'),
    534, '2023-12-27');

INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
VALUES (currval('products_id_seq'), '/images/placeholder.jpg', TRUE, 0);

INSERT INTO product_sizes (product_id, size_id, stock)
SELECT currval('products_id_seq'), id, 10 FROM sizes WHERE name IN ('S', 'M', 'L', 'XL', 'XXL');

-- Проверка импорта
SELECT COUNT(*) as total_products FROM products;
SELECT * FROM products_view LIMIT 5;