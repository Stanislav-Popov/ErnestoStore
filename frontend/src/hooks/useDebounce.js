/** @format */

import { useState, useEffect, useCallback, useRef } from "react"

/**
 * Хук для debounce значения
 * @param {any} value - Значение для debounce
 * @param {number} delay - Задержка в миллисекундах
 * @returns {any} - Debounced значение
 */
export function useDebounce(value, delay = 300) {
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(timer)
        }
    }, [value, delay])

    return debouncedValue
}

/**
 * Хук для debounce callback функции
 * @param {Function} callback - Функция для debounce
 * @param {number} delay - Задержка в миллисекундах
 * @returns {Function} - Debounced функция
 */
export function useDebouncedCallback(callback, delay = 300) {
    const timeoutRef = useRef(null)

    const debouncedCallback = useCallback(
        (...args) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }

            timeoutRef.current = setTimeout(() => {
                callback(...args)
            }, delay)
        },
        [callback, delay]
    )

    // Очистка при размонтировании
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    return debouncedCallback
}

/**
 * Хук для throttle callback функции
 * @param {Function} callback - Функция для throttle
 * @param {number} delay - Минимальный интервал между вызовами
 * @returns {Function} - Throttled функция
 */
export function useThrottledCallback(callback, delay = 300) {
    const lastCallRef = useRef(0)
    const timeoutRef = useRef(null)

    const throttledCallback = useCallback(
        (...args) => {
            const now = Date.now()
            const timeSinceLastCall = now - lastCallRef.current

            if (timeSinceLastCall >= delay) {
                lastCallRef.current = now
                callback(...args)
            } else {
                // Планируем вызов на конец интервала
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current)
                }
                timeoutRef.current = setTimeout(() => {
                    lastCallRef.current = Date.now()
                    callback(...args)
                }, delay - timeSinceLastCall)
            }
        },
        [callback, delay]
    )

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    return throttledCallback
}

export default useDebounce