/** @format */
// Этот файл должен быть в папке: src/components/CatalogUnderHeader.jsx

import { useContext, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import styles from "../styles/catalogUnderHeader.module.css"
import SortDropdown from "./SortDropdown/SortDropdown"
import { CatalogContext } from "../context/CatalogContext"
import { CloseOutlined, FilterOutlined } from "@ant-design/icons"

export default function CatalogUnderHeader() {
    const { count, sortType, setSortType, searchQuery, setSearchQuery, filters, setFilters } =
        useContext(CatalogContext)
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()

    const category = searchParams.get("category")

    // Подсчёт активных фильтров
    const activeFiltersCount = useMemo(() => {
        let filterCount = 0
        if (filters.brands.length > 0) filterCount += filters.brands.length
        if (filters.colors.length > 0) filterCount += filters.colors.length
        if (filters.types.length > 0) filterCount += filters.types.length
        if (filters.sizes.length > 0) filterCount += filters.sizes.length
        if (filters.price.min !== null) filterCount++
        if (filters.price.max !== null) filterCount++
        return filterCount
    }, [filters])

    const handleClearSearch = () => {
        setSearchQuery("")
        navigate("/catalog")
    }

    const handleClearCategory = () => {
        setFilters((prev) => ({
            ...prev,
            types: [],
        }))
        navigate("/catalog")
    }

    const handleClearAllFilters = () => {
        setFilters({
            brands: [],
            colors: [],
            types: [],
            sizes: [],
            price: { min: null, max: null },
        })
        setSearchQuery("")
        navigate("/catalog")
    }

    return (
        <div className={styles.underHeaderStyle}>
            <div className={styles.leftBlock}>
                <div className={styles.countBlock}>
                    <p>
                        Найдено товаров: <b>{count}</b>
                    </p>
                </div>

                {/* Показываем активные фильтры */}
                {(searchQuery || category || activeFiltersCount > 0) && (
                    <div className={styles.activeFilters}>
                        {searchQuery && (
                            <span className={styles.filterTag}>
                                Поиск: "{searchQuery}"
                                <button onClick={handleClearSearch} className={styles.clearTag}>
                                    <CloseOutlined />
                                </button>
                            </span>
                        )}
                        {category && (
                            <span className={styles.filterTag}>
                                Категория: {category}
                                <button onClick={handleClearCategory} className={styles.clearTag}>
                                    <CloseOutlined />
                                </button>
                            </span>
                        )}
                        {activeFiltersCount > 0 && (
                            <span className={styles.filterTag}>
                                <FilterOutlined />
                                Фильтры: {activeFiltersCount}
                                <button onClick={handleClearAllFilters} className={styles.clearTag}>
                                    <CloseOutlined />
                                </button>
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className={styles.sortBlock}>
                <SortDropdown value={sortType} onChange={setSortType} />
            </div>
        </div>
    )
}
