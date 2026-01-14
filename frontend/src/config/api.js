/** @format */

// Конфигурация API
// На продакшене используется переменная окружения VITE_API_URL
// Локально — http://localhost:5000/api

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

// URL сервера без /api (для изображений и загрузки файлов)
export const SERVER_URL = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace("/api", "")
    : "http://localhost:5000"

/**
 * Хелпер для формирования полного URL изображения
 * @param {string} path - путь к изображению
 * @returns {string} полный URL
 */
export const getImageUrl = (path) => {
    if (!path) return "/images/placeholder.jpg"
    if (path.startsWith("http")) return path
    if (path.startsWith("/uploads")) return `${SERVER_URL}${path}`
    return path
}

/**
 * Хелпер для запросов к API
 * @param {string} endpoint - эндпоинт (например "/products")
 * @param {Object} options - опции fetch
 * @returns {Promise<any>} ответ в JSON
 */
export async function fetchAPI(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
        ...options,
    })

    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
    }

    return response.json()
}
