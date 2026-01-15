/** @format */

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import styles from "./searchInput.module.css"
import { CloseOutlined, SearchOutlined, LoadingOutlined } from "@ant-design/icons"
import { useDebounce } from "../../hooks/useDebounce"

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000"


// Хелпер для формирования полного URL изображения
const getImageUrl = (path) => {
    if (!path) return "/images/placeholder.jpg"
    if (path.startsWith("http")) return path
    if (path.startsWith("/uploads")) return `${SERVER_URL}${path}`
    return path
}

export default function SearchInput({
    placeholder = "Поиск...",
    onSearch,
    height = "32px",
    searchOnEnter = false,
    allProducts = [],
    showSuggestions = false,
    debounceDelay = 300,
}) {
    const [value, setValue] = useState("")
    const [isFocused, setIsFocused] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)
    const [isSearching, setIsSearching] = useState(false)
    const wrapperRef = useRef(null)
    const navigate = useNavigate()

    // Debounced значение для поиска
    const debouncedValue = useDebounce(value, debounceDelay)

    // Закрытие dropdown при клике снаружи
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Вызываем onSearch с debounced значением
    useEffect(() => {
        if (!searchOnEnter && debouncedValue !== undefined) {
            onSearch(debouncedValue)
            setIsSearching(false)
        }
    }, [debouncedValue, searchOnEnter, onSearch])

    // Рекомендации на основе ввода
    const suggestions = useMemo(() => {
        if (!showSuggestions || !debouncedValue.trim() || !allProducts.length) return []

        const query = debouncedValue.toLowerCase()
        const results = allProducts.filter((product) => {
            const nameMatch = product.name?.toLowerCase().includes(query)
            const brandMatch = product.brand?.toLowerCase().includes(query)
            const typeMatch = product.type?.toLowerCase().includes(query)
            return nameMatch || brandMatch || typeMatch
        })

        return results.slice(0, 5)
    }, [debouncedValue, allProducts, showSuggestions])

    const handleChange = (e) => {
        const newValue = e.target.value
        setValue(newValue)
        setShowDropdown(showSuggestions && newValue.trim().length > 0)

        if (!searchOnEnter) {
            setIsSearching(true)
        }
    }

    const handleClear = () => {
        setValue("")
        setShowDropdown(false)
        setIsSearching(false)
        onSearch("")
    }

    const handleSearchClick = () => {
        onSearch(value)
        setShowDropdown(false)
        setIsSearching(false)
    }

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            onSearch(value)
            setShowDropdown(false)
            setIsSearching(false)
        }
        if (e.key === "Escape") {
            setShowDropdown(false)
        }
    }

    const handleFocus = () => {
        setIsFocused(true)
        if (showSuggestions && value.trim().length > 0) {
            setShowDropdown(true)
        }
    }

    const handleBlur = () => {
        setIsFocused(false)
    }

    const handleProductClick = (productId) => {
        setShowDropdown(false)
        setValue("")
        navigate(`/product/${productId}`)
    }

    const handleShowAll = () => {
        onSearch(value)
        setShowDropdown(false)
    }

    return (
        <div className={styles.searchBox} ref={wrapperRef}>
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className={styles.searchInput}
                style={{ height: height }}
            />

            {value && !isSearching && (
                <button className={styles.clearButton} onClick={handleClear}>
                    <CloseOutlined className={styles.clearIcon} />
                </button>
            )}

            {isSearching && (
                <span className={styles.loadingIcon}>
                    <LoadingOutlined spin />
                </span>
            )}

            <button className={styles.searchButton} onClick={handleSearchClick}>
                <SearchOutlined className={styles.searchIcon} />
            </button>

            {/* Dropdown с рекомендациями */}
            {showDropdown && suggestions.length > 0 && (
                <div className={styles.dropdown}>
                    {suggestions.map((product) => {
                        const imageSrc = Array.isArray(product.images) ? product.images[0] : product.image

                        return (
                            <div
                                key={product.id}
                                className={styles.suggestionItem}
                                onMouseDown={() => handleProductClick(product.id)}>
                                <img
                                    src={getImageUrl(imageSrc)}
                                    alt={product.name}
                                    className={styles.suggestionImage}
                                    onError={(e) => {
                                        e.target.src = "/images/placeholder.jpg"
                                    }}
                                />
                                <div className={styles.suggestionInfo}>
                                    <p className={styles.suggestionName}>{product.name}</p>
                                    <p className={styles.suggestionPrice}>
                                        {product.final_price
                                            ? product.final_price.toLocaleString("ru-RU")
                                            : product.price?.toLocaleString("ru-RU")}{" "}
                                        ₽
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                    {suggestions.length >= 5 && (
                        <button className={styles.showAllBtn} onMouseDown={handleShowAll}>
                            Показать все результаты
                        </button>
                    )}
                </div>
            )}

            {/* Сообщение если ничего не найдено */}
            {showDropdown && debouncedValue.trim() && suggestions.length === 0 && !isSearching && (
                <div className={styles.dropdown}>
                    <div className={styles.noResults}>Ничего не найдено по запросу "{debouncedValue}"</div>
                </div>
            )}
        </div>
    )
}
