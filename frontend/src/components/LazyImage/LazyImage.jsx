/** @format */

import { useState, useRef, useEffect } from "react"
import styles from "./lazyImage.module.css"

/**
 * Компонент для ленивой загрузки изображений с плейсхолдером
 * @param {string} src - URL изображения
 * @param {string} alt - Альтернативный текст
 * @param {string} className - CSS классы
 * @param {string} placeholderColor - Цвет плейсхолдера
 * @param {Object} style - Дополнительные стили
 */
export default function LazyImage({
    src,
    alt = "",
    className = "",
    placeholderColor = "#f0f0f0",
    style = {},
    ...props
}) {
    const [isLoaded, setIsLoaded] = useState(false)
    const [isInView, setIsInView] = useState(false)
    const [hasError, setHasError] = useState(false)
    const imgRef = useRef(null)

    // Intersection Observer для определения видимости
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true)
                    observer.disconnect()
                }
            },
            {
                rootMargin: "100px", // Начинаем загрузку за 100px до появления в viewport
                threshold: 0.01,
            }
        )

        if (imgRef.current) {
            observer.observe(imgRef.current)
        }

        return () => observer.disconnect()
    }, [])

    // Сброс состояния при изменении src
    useEffect(() => {
        setIsLoaded(false)
        setHasError(false)
    }, [src])

    const handleLoad = () => {
        setIsLoaded(true)
    }

    const handleError = () => {
        setHasError(true)
        setIsLoaded(true)
    }

    return (
        <div
            ref={imgRef}
            className={`${styles.wrapper} ${className}`}
            style={{
                backgroundColor: placeholderColor,
                ...style,
            }}
        >
            {/* Скелетон-анимация пока изображение загружается */}
            {!isLoaded && (
                <div className={styles.skeleton} />
            )}

            {/* Само изображение */}
            {isInView && !hasError && (
                <img
                    src={src}
                    alt={alt}
                    className={`${styles.image} ${isLoaded ? styles.loaded : ""}`}
                    onLoad={handleLoad}
                    onError={handleError}
                    loading="lazy"
                    {...props}
                />
            )}

            {/* Плейсхолдер при ошибке загрузки */}
            {hasError && (
                <div className={styles.errorPlaceholder}>
                    <svg
                        viewBox="0 0 24 24"
                        width="48"
                        height="48"
                        fill="none"
                        stroke="#ccc"
                        strokeWidth="1.5"
                    >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" fill="#ccc" />
                        <path d="M21 15l-5-5L5 21" />
                    </svg>
                </div>
            )}
        </div>
    )
}

/**
 * Компонент для картинки товара с поддержкой разных размеров
 */
export function ProductImage({ src, alt, className = "", aspectRatio = "1/1" }) {
    // Формируем полный URL если это относительный путь к uploads
    const fullSrc = src?.startsWith("/uploads") 
        ? `http://localhost:5000${src}` 
        : src

    return (
        <LazyImage
            src={fullSrc || "/images/placeholder.jpg"}
            alt={alt}
            className={className}
            style={{ aspectRatio }}
        />
    )
}