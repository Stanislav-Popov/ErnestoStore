/** @format */

// Конфигурация API
// Измени API_URL если бэкенд на другом адресе

export const API_URL = "http://localhost:5000/api"

// Хелпер для запросов
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