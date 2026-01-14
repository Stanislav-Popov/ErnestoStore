/** @format */
import { useContext, memo } from "react"
import styles from "./catalogProductCard.module.css"
import { useNavigate } from "react-router-dom"
import { HeartOutlined, HeartFilled } from "@ant-design/icons"
import { FavoritesContext } from "../../context/FavoritesContext"
import { ProductCardImage } from "../OptimizedImage/OptimizedImage"

// Мемоизированный компонент карточки товара
function CatalogProductCard({ product }) {
    const navigate = useNavigate()
    const { isFavorite, toggleFavorite } = useContext(FavoritesContext)
    const imageSrc = Array.isArray(product.images) ? product.images[0] : product.image
    const isProductFavorite = isFavorite(product.id)

    const handleClick = () => {
        window.scrollTo({ top: 0, behavior: "smooth" })
        navigate(`/product/${product.id}`)
    }

    const handleFavoriteClick = (e) => {
        e.stopPropagation()
        toggleFavorite(product)
    }

    // Отображение цены со скидкой
    const renderPrice = () => {
        if (product.discount_percent > 0 && product.final_price) {
            return (
                <div className={styles.priceContainer}>
                    <span className={styles.price}>{product.final_price.toLocaleString("ru-RU")} ₽</span>
                    <span className={styles.oldPrice}>{product.price.toLocaleString("ru-RU")} ₽</span>
                </div>
            )
        }
        return <p className={styles.price}>{product.price?.toLocaleString("ru-RU")} ₽</p>
    }

    return (
        <article className={styles.card} onClick={handleClick}>
            <div className={styles.imageWrapper}>
                <ProductCardImage src={imageSrc} alt={product.name} className={styles.image} />

                {/* Бейдж скидки */}
                {product.discount_percent > 0 && (
                    <span className={styles.discountBadge}>-{product.discount_percent}%</span>
                )}

                {/* Кнопка избранного */}
                <button
                    className={`${styles.favoriteButton} ${isProductFavorite ? styles.favoriteActive : ""}`}
                    onClick={handleFavoriteClick}
                    aria-label={isProductFavorite ? "Удалить из избранного" : "Добавить в избранное"}>
                    {isProductFavorite ? (
                        <HeartFilled className={styles.heartIcon} />
                    ) : (
                        <HeartOutlined className={styles.heartIcon} />
                    )}
                </button>
            </div>

            <div className={styles.info}>
                <h3 className={styles.name}>{product.name}</h3>
                {renderPrice()}
            </div>
        </article>
    )
}

// Мемоизируем для предотвращения лишних ре-рендеров
export default memo(CatalogProductCard)
