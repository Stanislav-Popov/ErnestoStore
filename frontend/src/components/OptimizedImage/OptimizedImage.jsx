/** @format */

import { useState, useRef, useEffect, memo } from "react"
import { SERVER_URL } from "../../config/api"
import styles from "./optimizedImage.module.css"

/**
 * Формирует полный URL изображения
 */
const getFullUrl = (src) => {
    if (!src) return null
    if (src.startsWith("http")) return src
    if (src.startsWith("/uploads")) return `${SERVER_URL}${src}`
    return src
}

/**
 * Добавляет параметры оптимизации к URL
 */
const getOptimizedUrl = (src, { width, quality = 80, format } = {}) => {
    const fullUrl = getFullUrl(src)
    if (!fullUrl) return null

    // Для внешних URL не добавляем параметры
    if (!fullUrl.includes(SERVER_URL)) return fullUrl

    const params = new URLSearchParams()
    if (width) params.set("w", width.toString())
    if (quality && quality !== 80) params.set("q", quality.toString())
    if (format) params.set("format", format)

    const queryString = params.toString()
    return queryString ? `${fullUrl}?${queryString}` : fullUrl
}

/**
 * Генерирует srcset для разных размеров
 */
const generateSrcSet = (src, sizes = [320, 480, 640, 768, 1024, 1280]) => {
    const fullUrl = getFullUrl(src)
    if (!fullUrl || !fullUrl.includes(SERVER_URL)) return ""

    return sizes.map((size) => `${fullUrl}?w=${size} ${size}w`).join(", ")
}

/**
 * Оптимизированный компонент изображения
 *
 * @param {string} src - URL изображения
 * @param {string} alt - Альтернативный текст
 * @param {string} className - CSS классы
 * @param {string} sizes - Атрибут sizes для srcset
 * @param {string} aspectRatio - Соотношение сторон (например "1/1", "4/3")
 * @param {boolean} priority - Загружать сразу без lazy loading
 * @param {string} objectFit - CSS object-fit (cover, contain, etc)
 * @param {number} width - Желаемая ширина для оптимизации
 * @param {number} quality - Качество (1-100, по умолчанию 80)
 * @param {function} onLoad - Callback при загрузке
 * @param {function} onError - Callback при ошибке
 */
function OptimizedImage({
    src,
    alt = "",
    className = "",
    sizes = "(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw",
    aspectRatio = "1/1",
    priority = false,
    objectFit = "cover",
    width,
    quality = 80,
    onLoad,
    onError,
    ...props
}) {
    const [isLoaded, setIsLoaded] = useState(false)
    const [hasError, setHasError] = useState(false)
    const [isInView, setIsInView] = useState(priority)
    const containerRef = useRef(null)

    const fullSrc = getFullUrl(src)
    const optimizedSrc = getOptimizedUrl(src, { width, quality })
    const srcSet = generateSrcSet(src)

    // URL для WebP версии
    const webpSrcSet = srcSet ? srcSet.replace(/(\?w=\d+)/g, "$1&format=webp") : ""

    // Intersection Observer для lazy loading
    useEffect(() => {
        if (priority) {
            setIsInView(true)
            return
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true)
                    observer.disconnect()
                }
            },
            {
                rootMargin: "200px",
                threshold: 0.01,
            }
        )

        if (containerRef.current) {
            observer.observe(containerRef.current)
        }

        return () => observer.disconnect()
    }, [priority])

    // Сброс состояния при смене src
    useEffect(() => {
        setIsLoaded(false)
        setHasError(false)
    }, [src])

    const handleLoad = (e) => {
        setIsLoaded(true)
        onLoad?.(e)
    }

    const handleError = (e) => {
        setHasError(true)
        setIsLoaded(true)
        onError?.(e)
    }

    return (
        <div ref={containerRef} className={`${styles.container} ${className}`} style={{ aspectRatio }}>
            {/* Skeleton placeholder */}
            {!isLoaded && !hasError && <div className={styles.skeleton} />}

            {/* Основное изображение */}
            {isInView && !hasError && (
                <picture>
                    {/* WebP версия */}
                    {webpSrcSet && <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />}

                    {/* Fallback на оригинальный формат */}
                    {srcSet && <source srcSet={srcSet} sizes={sizes} />}

                    <img
                        src={optimizedSrc || "/images/placeholder.jpg"}
                        alt={alt}
                        className={`${styles.image} ${isLoaded ? styles.loaded : ""}`}
                        style={{ objectFit }}
                        onLoad={handleLoad}
                        onError={handleError}
                        loading={priority ? "eager" : "lazy"}
                        decoding="async"
                        {...props}
                    />
                </picture>
            )}

            {/* Placeholder при ошибке */}
            {hasError && (
                <div className={styles.errorPlaceholder}>
                    <svg
                        viewBox="0 0 24 24"
                        width="40"
                        height="40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                        <path d="M21 15l-5-5L5 21" />
                    </svg>
                </div>
            )}
        </div>
    )
}

export default memo(OptimizedImage)

/**
 * Вариант для карточки товара
 */
export const ProductCardImage = memo(function ProductCardImage({ src, alt, className }) {
    return (
        <OptimizedImage
            src={src}
            alt={alt}
            className={className}
            aspectRatio="1/1"
            sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, (max-width: 1200px) 25vw, 20vw"
            width={400}
            quality={80}
        />
    )
})

/**
 * Вариант для главного изображения товара
 */
export const ProductMainImage = memo(function ProductMainImage({ src, alt, className }) {
    return (
        <OptimizedImage
            src={src}
            alt={alt}
            className={className}
            aspectRatio="3/4"
            sizes="(max-width: 768px) 100vw, 50vw"
            width={800}
            quality={85}
            priority
        />
    )
})

/**
 * Вариант для миниатюры
 */
export const ThumbnailImage = memo(function ThumbnailImage({ src, alt, className, onClick }) {
    return (
        <OptimizedImage
            src={src}
            alt={alt}
            className={className}
            aspectRatio="1/1"
            sizes="100px"
            width={100}
            quality={75}
            onClick={onClick}
        />
    )
})
