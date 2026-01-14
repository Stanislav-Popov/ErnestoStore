/** @format */

import { useState, useEffect, useRef, useCallback } from "react"

/**
 * Хук для бесконечной прокрутки
 *
 * @param {Object} options - Настройки
 * @param {Array} options.items - Все элементы
 * @param {number} options.itemsPerPage - Количество элементов на страницу
 * @param {number} options.threshold - Расстояние до конца для подгрузки (в пикселях)
 * @param {boolean} options.enabled - Включена ли бесконечная прокрутка
 * @returns {Object} - { displayedItems, hasMore, loadMore, reset, isLoading, loadMoreRef }
 */
export function useInfiniteScroll({ items = [], itemsPerPage = 12, threshold = 300, enabled = true }) {
    const [displayCount, setDisplayCount] = useState(itemsPerPage)
    const [isLoading, setIsLoading] = useState(false)
    const loadMoreRef = useRef(null)
    const observerRef = useRef(null)

    // Отображаемые элементы
    const displayedItems = items.slice(0, displayCount)
    const hasMore = displayCount < items.length

    // Сброс при изменении items
    useEffect(() => {
        setDisplayCount(itemsPerPage)
    }, [items, itemsPerPage])

    // Загрузить ещё
    const loadMore = useCallback(() => {
        if (isLoading || !hasMore) return

        setIsLoading(true)

        // Имитация небольшой задержки для плавности
        setTimeout(() => {
            setDisplayCount((prev) => Math.min(prev + itemsPerPage, items.length))
            setIsLoading(false)
        }, 100)
    }, [isLoading, hasMore, itemsPerPage, items.length])

    // Сброс
    const reset = useCallback(() => {
        setDisplayCount(itemsPerPage)
    }, [itemsPerPage])

    // Intersection Observer для автоматической подгрузки
    useEffect(() => {
        if (!enabled) return

        const currentRef = loadMoreRef.current

        observerRef.current = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && hasMore && !isLoading) {
                    loadMore()
                }
            },
            {
                rootMargin: `${threshold}px`,
                threshold: 0.1,
            }
        )

        if (currentRef) {
            observerRef.current.observe(currentRef)
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect()
            }
        }
    }, [enabled, hasMore, isLoading, loadMore, threshold])

    return {
        displayedItems,
        hasMore,
        loadMore,
        reset,
        isLoading,
        loadMoreRef,
        totalCount: items.length,
        displayedCount: displayedItems.length,
    }
}

/**
 * Хук для определения мобильного устройства
 */
export function useIsMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= breakpoint)
        }

        // Проверяем сразу
        checkMobile()

        // Слушаем изменения размера
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, [breakpoint])

    return isMobile
}

/**
 * Хук для блокировки скролла body (для модалок/drawer)
 */
export function useBodyScrollLock(isLocked) {
    useEffect(() => {
        if (isLocked) {
            const scrollY = window.scrollY
            document.body.style.position = "fixed"
            document.body.style.top = `-${scrollY}px`
            document.body.style.width = "100%"
            document.body.style.overflow = "hidden"

            return () => {
                document.body.style.position = ""
                document.body.style.top = ""
                document.body.style.width = ""
                document.body.style.overflow = ""
                window.scrollTo(0, scrollY)
            }
        }
    }, [isLocked])
}

export default useInfiniteScroll
