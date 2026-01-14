/** @format */

import styles from "./../styles/productPage.module.css"
import { useEffect, useState, useContext, useRef } from "react"
import { useParams } from "react-router-dom"
import { API_URL, getImageUrl } from "../config/api"
import CatalogProductCard from "./../components/ProductCard/CatalogProductCard"
import Breadcrumbs from "./../components/Breadcrumbs/Breadcrumbs"
import { HeartOutlined, HeartFilled } from "@ant-design/icons"
import { FavoritesContext } from "../context/FavoritesContext"
import { ProductPageSkeleton } from "../components/Skeleton/Skeleton"
import { useSEO } from "../hooks/useSEO"
import { ProductMainImage, ThumbnailImage } from "../components/OptimizedImage/OptimizedImage"

export default function ProductPage() {
    const { id } = useParams()
    const [product, setProduct] = useState(null)
    const [related, setRelated] = useState([])
    const [selectedImage, setSelectedImage] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [imageKey, setImageKey] = useState(0) // Ключ для принудительного обновления изображения
    const { isFavorite, toggleFavorite } = useContext(FavoritesContext)

    // Ref для отслеживания, был ли уже записан просмотр для этого товара
    const viewRecordedRef = useRef(new Set())

    const isProductFavorite = product ? isFavorite(product.id) : false

    // SEO
    useSEO({
        title: product?.name,
        description: product?.description || `${product?.name} в каталоге Ernesto Khachatyryan`,
        keywords: `${product?.name}, ${product?.brand}, ${product?.type}, мужская одежда`,
        image: product?.images?.[0] ? getImageUrl(product.images[0]) : undefined,
    })

    // Сброс состояния при смене ID товара
    useEffect(() => {
        setProduct(null)
        setSelectedImage(null)
        setRelated([])
        setIsLoading(true)
        setImageKey((prev) => prev + 1) // Увеличиваем ключ для сброса изображения
    }, [id])

    // Загрузка товара через API
    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) return

            try {
                const response = await fetch(`${API_URL}/products/${id}`)
                if (!response.ok) throw new Error("Товар не найден")

                const data = await response.json()

                // Добавляем массив images если его нет
                const productWithImages = {
                    ...data,
                    images: data.images || (data.image ? [data.image] : []),
                }

                // Устанавливаем продукт
                setProduct(productWithImages)

                // Устанавливаем главное изображение
                const mainImage = productWithImages.images?.[0] || productWithImages.image
                setSelectedImage(mainImage)
            } catch (error) {
                console.error("Ошибка загрузки товара:", error)
                setProduct(null)
            } finally {
                setIsLoading(false)
            }
        }

        fetchProduct()
    }, [id])

    // Записываем просмотр только один раз при загрузке товара
    useEffect(() => {
        const recordView = async () => {
            // Проверяем, не был ли уже записан просмотр для этого товара в этой сессии
            if (viewRecordedRef.current.has(id)) {
                return
            }

            // Также проверяем sessionStorage для защиты от перезагрузки
            const viewedKey = `viewed_${id}`
            if (sessionStorage.getItem(viewedKey)) {
                viewRecordedRef.current.add(id)
                return
            }

            // Получаем deviceId из localStorage
            let deviceId = localStorage.getItem("deviceId")
            if (!deviceId) {
                deviceId = "device_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now()
                localStorage.setItem("deviceId", deviceId)
            }

            try {
                await fetch(`${API_URL}/products/${id}/view`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ deviceId }),
                })
                viewRecordedRef.current.add(id)
                sessionStorage.setItem(viewedKey, "true")
            } catch (error) {
                console.error("Ошибка записи просмотра:", error)
            }
        }

        if (id && product) {
            recordView()
        }
    }, [id, product])

    // Загрузка похожих товаров
    useEffect(() => {
        const fetchRelated = async () => {
            try {
                const response = await fetch(`${API_URL}/products/${id}/related?limit=4`)
                if (response.ok) {
                    const data = await response.json()
                    setRelated(data)
                }
            } catch (error) {
                console.error("Ошибка загрузки похожих товаров:", error)
            }
        }

        if (id && product) {
            fetchRelated()
        }
    }, [id, product])

    const handleFavoriteClick = () => {
        if (product) {
            toggleFavorite(product)
        }
    }

    const handleImageSelect = (img) => {
        setSelectedImage(img)
        setImageKey((prev) => prev + 1) // Принудительно обновляем изображение
    }

    if (isLoading) {
        return <ProductPageSkeleton />
    }

    if (!product) {
        return <div className={styles.loading}>Товар не найден</div>
    }

    // Определяем какое изображение показывать
    const displayImage = selectedImage || product.images?.[0] || product.image

    return (
        <div className={styles.wrapper}>
            <div className={styles.breadcrumbsWrapper}>
                <Breadcrumbs productName={product.name} />
            </div>

            <div className={styles.mainSection}>
                {/* Левая колонка - галерея */}
                <div className={styles.gallery}>
                    {product.images && product.images.length > 1 && (
                        <div className={styles.thumbs}>
                            {product.images.map((img, index) => (
                                <div
                                    key={index}
                                    className={`${styles.thumbWrapper} ${
                                        selectedImage === img ? styles.activeThumb : ""
                                    }`}
                                    onClick={() => handleImageSelect(img)}>
                                    <ThumbnailImage
                                        src={img}
                                        alt={`${product.name} - изображение ${index + 1}`}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    <div className={styles.mainImage}>
                        {displayImage && (
                            <ProductMainImage
                                key={`${imageKey}-${displayImage}`}
                                src={displayImage}
                                alt={product.name}
                            />
                        )}
                    </div>
                </div>

                {/* Правая колонка - информация */}
                <div className={styles.info}>
                    <div className={styles.titleRow}>
                        <h1 className={styles.title}>{product.name}</h1>
                        <button
                            className={`${styles.favoriteBtn} ${
                                isProductFavorite ? styles.favoriteBtnActive : ""
                            }`}
                            onClick={handleFavoriteClick}
                            aria-label={isProductFavorite ? "Удалить из избранного" : "Добавить в избранное"}>
                            {isProductFavorite ? (
                                <HeartFilled className={styles.heartIcon} />
                            ) : (
                                <HeartOutlined className={styles.heartIcon} />
                            )}
                        </button>
                    </div>

                    {/* Цена со скидкой */}
                    {product.discount_percent > 0 ? (
                        <div className={styles.priceBlock}>
                            <p className={styles.price}>{product.final_price?.toLocaleString("ru-RU")} ₽</p>
                            <p className={styles.oldPrice}>{product.price?.toLocaleString("ru-RU")} ₽</p>
                            <span className={styles.discount}>-{product.discount_percent}%</span>
                        </div>
                    ) : (
                        <p className={styles.price}>{product.price?.toLocaleString("ru-RU")} ₽</p>
                    )}

                    {/* Размеры - только те что есть у товара, без кнопок */}
                    {product.sizes && product.sizes.length > 0 && (
                        <div className={styles.sizes}>
                            <p className={styles.sizesLabel}>Доступные размеры:</p>
                            <div className={styles.sizeList}>
                                {product.sizes.map((size) => (
                                    <span key={size} className={styles.sizeChip}>
                                        {size}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Характеристики товара */}
                    <div className={styles.description}>
                        {product.color && (
                            <p>
                                <strong>Цвет: </strong>
                                {product.color}
                            </p>
                        )}
                        {product.brand && (
                            <p>
                                <strong>Бренд: </strong>
                                {product.brand}
                            </p>
                        )}
                        {product.material && (
                            <p>
                                <strong>Материал: </strong>
                                {product.material}
                            </p>
                        )}
                        {product.description && <p className={styles.descText}>{product.description}</p>}
                    </div>
                </div>
            </div>

            {/* Блок "Смотреть также" */}
            {related.length > 0 && (
                <div className={styles.relatedBlock}>
                    <h2 className={styles.relatedTitle}>Смотреть также</h2>
                    <div className={styles.relatedGrid}>
                        {related.map((item) => (
                            <CatalogProductCard key={item.id} product={item} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
