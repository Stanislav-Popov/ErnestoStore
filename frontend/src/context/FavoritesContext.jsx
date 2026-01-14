/** @format */
// Файл: src/context/FavoritesContext.jsx

import { createContext, useState, useEffect, useContext, useRef, useCallback } from "react"
import { API_URL } from "../config/api"

export const FavoritesContext = createContext()

// Уникальный ID устройства для сохранения между сессиями
const getDeviceId = () => {
    let deviceId = localStorage.getItem("deviceId")
    if (!deviceId) {
        deviceId = "device_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now()
        localStorage.setItem("deviceId", deviceId)
    }
    return deviceId
}

export function FavoritesProvider({ children }) {
    const [favorites, setFavorites] = useState(() => {
        // Загружаем избранное из localStorage при инициализации
        try {
            const saved = localStorage.getItem("favorites")
            return saved ? JSON.parse(saved) : []
        } catch {
            return []
        }
    })

    // Ref для отслеживания уже отправленных запросов (защита от StrictMode)
    const pendingActionsRef = useRef(new Set())
    const deviceId = useRef(getDeviceId())

    // Сохраняем в localStorage при изменении
    useEffect(() => {
        localStorage.setItem("favorites", JSON.stringify(favorites))
    }, [favorites])

    // Отправка статистики на сервер с защитой от дублирования
    const trackFavorite = useCallback(async (productId, action) => {
        // Создаём уникальный ключ для этого действия
        const actionKey = `${productId}_${action}_${Date.now()}`

        // Проверяем, не выполняется ли уже это действие
        if (pendingActionsRef.current.has(`${productId}_${action}`)) {
            return
        }

        // Помечаем действие как выполняющееся
        pendingActionsRef.current.add(`${productId}_${action}`)

        try {
            await fetch(`${API_URL}/products/${productId}/favorite`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    action,
                    deviceId: deviceId.current,
                }),
            })
        } catch (err) {
            console.log("Ошибка записи избранного:", err)
        } finally {
            // Удаляем через небольшую задержку чтобы предотвратить повторные вызовы
            setTimeout(() => {
                pendingActionsRef.current.delete(`${productId}_${action}`)
            }, 500)
        }
    }, [])

    const addToFavorites = useCallback(
        (product) => {
            setFavorites((prev) => {
                if (prev.some((item) => item.id === product.id)) {
                    return prev
                }
                // Отправляем на сервер
                trackFavorite(product.id, "add")
                return [...prev, product]
            })
        },
        [trackFavorite]
    )

    const removeFromFavorites = useCallback(
        (productId) => {
            setFavorites((prev) => {
                const exists = prev.some((item) => item.id === productId)
                if (exists) {
                    // Отправляем на сервер
                    trackFavorite(productId, "remove")
                }
                return prev.filter((item) => item.id !== productId)
            })
        },
        [trackFavorite]
    )

    const toggleFavorite = useCallback(
        (product) => {
            const isCurrentlyFavorite = favorites.some((item) => item.id === product.id)
            if (isCurrentlyFavorite) {
                removeFromFavorites(product.id)
            } else {
                addToFavorites(product)
            }
        },
        [favorites, addToFavorites, removeFromFavorites]
    )

    const isFavorite = useCallback(
        (productId) => {
            return favorites.some((item) => item.id === productId)
        },
        [favorites]
    )

    const clearFavorites = useCallback(() => {
        // Отправляем remove для всех товаров
        favorites.forEach((item) => {
            trackFavorite(item.id, "remove")
        })
        setFavorites([])
    }, [favorites, trackFavorite])

    const favoritesCount = favorites.length

    return (
        <FavoritesContext.Provider
            value={{
                favorites,
                addToFavorites,
                removeFromFavorites,
                toggleFavorite,
                isFavorite,
                favoritesCount,
                clearFavorites,
            }}>
            {children}
        </FavoritesContext.Provider>
    )
}

export function useFavorites() {
    const context = useContext(FavoritesContext)
    if (!context) {
        throw new Error("useFavorites must be used within a FavoritesProvider")
    }
    return context
}
    