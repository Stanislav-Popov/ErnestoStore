/** @format */
// Этот файл должен быть в папке: src/components/SearchModal/SearchModal.jsx

import { useState, useEffect, useRef, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import styles from "./searchModal.module.css"
import { CloseOutlined, SearchOutlined, ClockCircleOutlined, FireOutlined } from "@ant-design/icons"

export default function SearchModal({ isOpen, onClose, allProducts = [] }) {
    const [value, setValue] = useState("")
    const [recentSearches, setRecentSearches] = useState(() => {
        try {
            const saved = localStorage.getItem("recentSearches")
            return saved ? JSON.parse(saved) : []
        } catch {
            return []
        }
    })
    const inputRef = useRef(null)
    const navigate = useNavigate()

    // Фокус на input при открытии
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [isOpen])

    // Блокировка скролла body при открытии
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = ""
        }
        return () => {
            document.body.style.overflow = ""
        }
    }, [isOpen])

    // Рекомендации на основе ввода
    const suggestions = useMemo(() => {
        if (!value.trim() || !allProducts.length) return []

        const query = value.toLowerCase()
        const results = allProducts.filter((product) => {
            const nameMatch = product.name.toLowerCase().includes(query)
            const brandMatch = product.brand?.toLowerCase().includes(query)
            const typeMatch = product.type?.toLowerCase().includes(query)
            return nameMatch || brandMatch || typeMatch
        })

        return results.slice(0, 6)
    }, [value, allProducts])

    // Популярные запросы
    const popularSearches = ["Nike", "Куртка", "Кроссовки", "Худи", "Джинсы"]

    const handleSearch = (searchValue) => {
        const trimmed = searchValue.trim()
        if (!trimmed) return

        // Сохраняем в историю
        setRecentSearches((prev) => {
            const filtered = prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())
            const updated = [trimmed, ...filtered].slice(0, 5)
            localStorage.setItem("recentSearches", JSON.stringify(updated))
            return updated
        })

        navigate(`/catalog?search=${encodeURIComponent(trimmed)}`)
        onClose()
        setValue("")
    }

    const handleProductClick = (productId) => {
        onClose()
        setValue("")
        navigate(`/product/${productId}`)
    }

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleSearch(value)
        }
        if (e.key === "Escape") {
            onClose()
        }
    }

    const clearRecentSearches = () => {
        setRecentSearches([])
        localStorage.removeItem("recentSearches")
    }

    if (!isOpen) return null

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Шапка с поиском */}
                <div className={styles.header}>
                    <div className={styles.searchWrapper}>
                        <SearchOutlined className={styles.searchIcon} />
                        <input
                            ref={inputRef}
                            type="text"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Поиск товаров..."
                            className={styles.input}
                        />
                        {value && (
                            <button className={styles.clearInput} onClick={() => setValue("")}>
                                <CloseOutlined />
                            </button>
                        )}
                    </div>
                    <button className={styles.closeButton} onClick={onClose}>
                        Отмена
                    </button>
                </div>

                {/* Контент */}
                <div className={styles.content}>
                    {/* Результаты поиска */}
                    {value.trim() && suggestions.length > 0 && (
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>Товары</h3>
                            <div className={styles.productList}>
                                {suggestions.map((product) => (
                                    <div
                                        key={product.id}
                                        className={styles.productItem}
                                        onClick={() => handleProductClick(product.id)}>
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className={styles.productImage}
                                        />
                                        <div className={styles.productInfo}>
                                            <p className={styles.productName}>{product.name}</p>
                                            <p className={styles.productPrice}>
                                                {product.price.toLocaleString("ru-RU")} ₽
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {suggestions.length >= 6 && (
                                <button className={styles.showAllButton} onClick={() => handleSearch(value)}>
                                    Показать все результаты
                                </button>
                            )}
                        </div>
                    )}

                    {/* Нет результатов */}
                    {value.trim() && suggestions.length === 0 && (
                        <div className={styles.noResults}>
                            <p>Ничего не найдено по запросу "{value}"</p>
                            <span>Попробуйте изменить запрос</span>
                        </div>
                    )}

                    {/* Когда поле пустое */}
                    {!value.trim() && (
                        <>
                            {/* Недавние поиски */}
                            {recentSearches.length > 0 && (
                                <div className={styles.section}>
                                    <div className={styles.sectionHeader}>
                                        <h3 className={styles.sectionTitle}>
                                            <ClockCircleOutlined /> Недавние
                                        </h3>
                                        <button className={styles.clearButton} onClick={clearRecentSearches}>
                                            Очистить
                                        </button>
                                    </div>
                                    <div className={styles.tagList}>
                                        {recentSearches.map((search, index) => (
                                            <button
                                                key={index}
                                                className={styles.tag}
                                                onClick={() => handleSearch(search)}>
                                                {search}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Популярные запросы */}
                            <div className={styles.section}>
                                <h3 className={styles.sectionTitle}>
                                    <FireOutlined /> Популярное
                                </h3>
                                <div className={styles.tagList}>
                                    {popularSearches.map((search, index) => (
                                        <button
                                            key={index}
                                            className={styles.tag}
                                            onClick={() => handleSearch(search)}>
                                            {search}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
