/** @format */

import { useEffect } from "react"

const DEFAULT_TITLE = "Ernesto Khachatyryan — Интернет-магазин мужской одежды"
const DEFAULT_DESCRIPTION = "Стильная мужская одежда собственного производства. Футболки, худи, брюки, верхняя одежда и аксессуары."

/**
 * Хук для управления SEO мета-тегами страницы
 * @param {Object} options - Параметры SEO
 * @param {string} options.title - Заголовок страницы
 * @param {string} options.description - Описание страницы
 * @param {string} options.keywords - Ключевые слова
 * @param {string} options.image - URL изображения для соцсетей
 * @param {string} options.url - Канонический URL
 */
export function useSEO({
    title,
    description = DEFAULT_DESCRIPTION,
    keywords,
    image,
    url,
} = {}) {
    useEffect(() => {
        // Устанавливаем title
        const fullTitle = title 
            ? `${title} | Ernesto Khachatyryan` 
            : DEFAULT_TITLE
        document.title = fullTitle

        // Функция для установки или обновления мета-тега
        const setMetaTag = (name, content, isProperty = false) => {
            if (!content) return

            const attribute = isProperty ? "property" : "name"
            let meta = document.querySelector(`meta[${attribute}="${name}"]`)
            
            if (!meta) {
                meta = document.createElement("meta")
                meta.setAttribute(attribute, name)
                document.head.appendChild(meta)
            }
            
            meta.setAttribute("content", content)
        }

        // Основные мета-теги
        setMetaTag("description", description)
        if (keywords) {
            setMetaTag("keywords", keywords)
        }

        // Open Graph теги
        setMetaTag("og:title", fullTitle, true)
        setMetaTag("og:description", description, true)
        setMetaTag("og:type", "website", true)
        if (image) {
            setMetaTag("og:image", image, true)
        }
        if (url) {
            setMetaTag("og:url", url, true)
        }

        // Twitter Card теги
        setMetaTag("twitter:card", "summary_large_image")
        setMetaTag("twitter:title", fullTitle)
        setMetaTag("twitter:description", description)
        if (image) {
            setMetaTag("twitter:image", image)
        }

        // Канонический URL
        if (url) {
            let canonical = document.querySelector('link[rel="canonical"]')
            if (!canonical) {
                canonical = document.createElement("link")
                canonical.setAttribute("rel", "canonical")
                document.head.appendChild(canonical)
            }
            canonical.setAttribute("href", url)
        }

        // Очистка при размонтировании
        return () => {
            document.title = DEFAULT_TITLE
        }
    }, [title, description, keywords, image, url])
}

export default useSEO