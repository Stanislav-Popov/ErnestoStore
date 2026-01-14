/** @format */

import { useState, useContext, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { CatalogContext } from "../../context/CatalogContext"
import styles from "./catalogSidebar.module.css"
import FilterSection from "./../FilterSection/FilterSection"
import SearchInput from "../SearchInput/SearchInput"
import Button from "../Button/Button"
import MobileFilterDrawer from "../MobileFilterDrawer/MobileFilterDrawer"
import { FilterOutlined } from "@ant-design/icons"
import { useIsMobile } from "../../hooks/useInfiniteScroll"

/**
 * Формирует "справочник" опций для фильтров на основе имеющихся товаров.
 */
function generateFiltersData(products, allSizes, sizesByCategory) {
    const brands = [...new Set(products.map((p) => p.brand))].filter(Boolean)
    const colors = [...new Set(products.map((p) => p.color))].filter(Boolean)
    const types = [...new Set(products.map((p) => p.type))].filter(Boolean)

    const availableSizes = Array.from(new Set(products.flatMap((p) => p.sizes || [])))

    return {
        brands,
        colors,
        types,
        sizes: {
            all: allSizes,
            available: availableSizes,
            byCategory: sizesByCategory,
        },
    }
}

export default function CatalogSidebar() {
    const { allProducts, isLoading, allSizes, sizesByCategory, setFilters, setCurrentPage, setSearchQuery } =
        useContext(CatalogContext)

    const navigate = useNavigate()
    const isMobile = useIsMobile(768)

    const [brandSearch, setBrandSearch] = useState("")
    const [resetKey, setResetKey] = useState(0)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [localFilters, setLocalFilters] = useState({
        brands: [],
        colors: [],
        types: [],
        sizes: [],
        price: {
            min: null,
            max: null,
        },
    })

    const filtersData = generateFiltersData(allProducts, allSizes, sizesByCategory)

    // Подсчёт активных фильтров
    const activeFiltersCount = useMemo(() => {
        let count = 0
        if (localFilters.brands.length > 0) count += localFilters.brands.length
        if (localFilters.colors.length > 0) count += localFilters.colors.length
        if (localFilters.types.length > 0) count += localFilters.types.length
        if (localFilters.sizes.length > 0) count += localFilters.sizes.length
        if (localFilters.price.min !== null) count++
        if (localFilters.price.max !== null) count++
        return count
    }, [localFilters])

    // Предварительный подсчёт товаров на основе localFilters
    const previewCount = useMemo(() => {
        return allProducts.filter((product) => {
            // Фильтр по брендам
            if (localFilters.brands.length > 0 && !localFilters.brands.includes(product.brand)) {
                return false
            }
            // Фильтр по цветам
            if (localFilters.colors.length > 0 && !localFilters.colors.includes(product.color)) {
                return false
            }
            // Фильтр по типам
            if (localFilters.types.length > 0 && !localFilters.types.includes(product.type)) {
                return false
            }
            // Фильтр по размерам
            if (localFilters.sizes.length > 0) {
                const productSizes = product.sizes || []
                if (!localFilters.sizes.some((size) => productSizes.includes(size))) {
                    return false
                }
            }
            // Фильтр по цене
            const productPrice = product.final_price || product.price
            if (localFilters.price.min !== null && productPrice < localFilters.price.min) {
                return false
            }
            if (localFilters.price.max !== null && productPrice > localFilters.price.max) {
                return false
            }
            return true
        }).length
    }, [allProducts, localFilters])

    const toggleFilter = (category, value, checked) => {
        setLocalFilters((prev) => {
            const current = prev[category] || []
            return {
                ...prev,
                [category]: checked ? [...current, value] : current.filter((v) => v !== value),
            }
        })
    }

    const searchedBrands = useMemo(() => {
        return filtersData.brands.filter((brand) =>
            brand.toLowerCase().includes(brandSearch.toLocaleLowerCase())
        )
    }, [filtersData.brands, brandSearch])

    const displayBrands = useMemo(() => {
        const searchedSet = new Set(searchedBrands)
        const selectedButHidden = (localFilters.brands || []).filter((brand) => !searchedSet.has(brand))
        return [...searchedBrands, ...selectedButHidden]
    }, [searchedBrands, localFilters.brands])

    const handleApply = () => {
        setFilters(localFilters)
        setCurrentPage(1)
        setDrawerOpen(false)
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    const handleReset = () => {
        const resetState = {
            brands: [],
            colors: [],
            types: [],
            sizes: [],
            price: { min: null, max: null },
        }
        setLocalFilters(resetState)
        setFilters(resetState)
        setBrandSearch("")
        setResetKey((prev) => prev + 1)
        setCurrentPage(1)
        setSearchQuery("")
        navigate("/catalog", { replace: true })
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    // Рендер размеров по категориям
    const renderSizesSection = () => {
        // Если есть группировка по категориям - используем её
        if (filtersData.sizes.byCategory && filtersData.sizes.byCategory.length > 0) {
            return filtersData.sizes.byCategory.map((group) => (
                <div key={group.category} className={styles.sizeGroup}>
                    <span className={styles.sizeGroupLabel}>{group.label}</span>
                    <div className={styles.sizeButtons}>
                        {group.sizes.map((size) => {
                            const isAvailable = filtersData.sizes.available.includes(size)
                            const isSelected = localFilters.sizes.includes(size)
                            return (
                                <button
                                    key={size}
                                    type="button"
                                    className={`${styles.sizeBtn} ${isSelected ? styles.sizeBtnActive : ""} ${
                                        !isAvailable ? styles.sizeBtnDisabled : ""
                                    }`}
                                    disabled={!isAvailable}
                                    onClick={() => toggleFilter("sizes", size, !isSelected)}>
                                    {size}
                                </button>
                            )
                        })}
                    </div>
                </div>
            ))
        }

        // Fallback на простой список
        return (
            <ul className={styles.checkboxList}>
                {filtersData.sizes.all.map((size) => {
                    const isAvailable = filtersData.sizes.available.includes(size)
                    const isSelected = localFilters.sizes.includes(size)
                    return (
                        <li key={size}>
                            <label
                                className={`${styles.checkboxLabel} ${!isAvailable ? styles.disabled : ""}`}>
                                <input
                                    type="checkbox"
                                    disabled={!isAvailable}
                                    checked={isSelected}
                                    onChange={(e) => toggleFilter("sizes", size, e.target.checked)}
                                />
                                <span>{size}</span>
                            </label>
                        </li>
                    )
                })}
            </ul>
        )
    }

    // Контент фильтров (используется и в сайдбаре, и в drawer)
    const filtersContent = (
        <>
            <FilterSection title="Цена" resetKey={resetKey} defaultOpen>
                <div className={styles.priceInputs}>
                    <label className={styles.priceLabel}>
                        От
                        <input
                            type="number"
                            min="0"
                            value={localFilters.price.min ?? ""}
                            onChange={(e) => {
                                setLocalFilters((prev) => ({
                                    ...prev,
                                    price: {
                                        ...prev.price,
                                        min: e.target.value ? Number(e.target.value) : null,
                                    },
                                }))
                            }}
                            className={styles.priceInput}
                            placeholder="0"
                        />
                    </label>

                    <label className={styles.priceLabel}>
                        До
                        <input
                            type="number"
                            min="0"
                            value={localFilters.price.max ?? ""}
                            onChange={(e) => {
                                setLocalFilters((prev) => ({
                                    ...prev,
                                    price: {
                                        ...prev.price,
                                        max: e.target.value ? Number(e.target.value) : null,
                                    },
                                }))
                            }}
                            className={styles.priceInput}
                            placeholder="∞"
                        />
                    </label>
                </div>
            </FilterSection>

            <FilterSection title="Размер" resetKey={resetKey}>
                {renderSizesSection()}
            </FilterSection>

            <FilterSection title="Бренд" resetKey={resetKey}>
                <div className={styles.searchInputBox}>
                    <SearchInput key={resetKey} placeholder="Поиск бренда ..." onSearch={setBrandSearch} />
                </div>
                <ul className={styles.checkboxList}>
                    {displayBrands.map((brand) => {
                        const isSelected = localFilters.brands.includes(brand)
                        const isHiddenBySearch = !searchedBrands.includes(brand)

                        return (
                            <li key={brand}>
                                <label
                                    className={`${styles.checkboxLabel} ${
                                        isHiddenBySearch ? styles.hiddenItem : ""
                                    }`}>
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => toggleFilter("brands", brand, e.target.checked)}
                                    />
                                    <span>{brand}</span>
                                </label>
                            </li>
                        )
                    })}
                    {searchedBrands.length === 0 && <li className={styles.noResult}>Ничего не найдено</li>}
                </ul>
            </FilterSection>

            <FilterSection title="Тип" resetKey={resetKey}>
                <ul className={styles.checkboxList}>
                    {filtersData.types.map((type) => {
                        const isSelected = localFilters.types.includes(type)

                        return (
                            <li key={type}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => toggleFilter("types", type, e.target.checked)}
                                    />
                                    <span>{type}</span>
                                </label>
                            </li>
                        )
                    })}
                </ul>
            </FilterSection>

            <FilterSection title="Цвет" resetKey={resetKey}>
                <ul className={styles.checkboxList}>
                    {filtersData.colors.map((color) => {
                        const isSelected = localFilters.colors.includes(color)

                        return (
                            <li key={color}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => toggleFilter("colors", color, e.target.checked)}
                                    />
                                    <span>{color}</span>
                                </label>
                            </li>
                        )
                    })}
                </ul>
            </FilterSection>
        </>
    )

    // Подсчёт склонения слова "товар"
    const getProductWord = (n) => {
        const mod10 = n % 10
        const mod100 = n % 100
        if (mod100 >= 11 && mod100 <= 19) return "товаров"
        if (mod10 === 1) return "товар"
        if (mod10 >= 2 && mod10 <= 4) return "товара"
        return "товаров"
    }

    const filterActions = (
        <div className={styles.filterActions}>
            <Button variant="secondary" onClick={handleReset}>
                Сбросить всё
            </Button>
            <Button onClick={handleApply}>
                Показать {previewCount} {getProductWord(previewCount)}
            </Button>
        </div>
    )

    if (isLoading) {
        return (
            <aside className={styles.sidebar}>
                <p>Загрузка фильтров ...</p>
            </aside>
        )
    }

    // Мобильная версия - показываем кнопку + drawer
    if (isMobile) {
        return (
            <>
                {/* Кнопка открытия фильтров */}
                <button className={styles.mobileFilterBtn} onClick={() => setDrawerOpen(true)}>
                    <FilterOutlined />
                    <span>Фильтры</span>
                    {activeFiltersCount > 0 && (
                        <span className={styles.filterBadge}>{activeFiltersCount}</span>
                    )}
                </button>

                {/* Drawer с фильтрами */}
                <MobileFilterDrawer
                    isOpen={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    title={`Фильтры ${activeFiltersCount > 0 ? `(${activeFiltersCount})` : ""}`}
                    footer={filterActions}>
                    {filtersContent}
                </MobileFilterDrawer>
            </>
        )
    }

    // Desktop версия - обычный сайдбар
    return (
        <aside className={styles.sidebar}>
            <div className={styles.filtersContent}>
                {filtersContent}
                {filterActions}
            </div>
        </aside>
    )
}
