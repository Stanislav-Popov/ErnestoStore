/** @format */

import { createContext, useState, useEffect, useMemo, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { API_URL } from "../config/api"

export const CatalogContext = createContext()
const PRODUCTSPERPAGE = 32

// Маппинг категорий на типы товаров
const categoryToTypes = {
    "Верхняя одежда": ["Куртка", "Пальто", "Пуховик", "Плащ"],
    Обувь: ["Кроссовки", "Кеды", "Сапоги", "Туфли", "Ботильоны", "Сандалии", "Обувь"],
    Рубашки: ["Рубашка"],
    Брюки: ["Брюки", "Джинсы"],
    Свитеры: ["Свитшот", "Худи", "Кардиган", "Джемпер", "Толстовка"],
    Футболки: ["Футболка", "Лонгслив", "Майка", "Топ"],
}

export function CatalogProvider({ children }) {
    const [searchParams, setSearchParams] = useSearchParams()
    const [allProducts, setAllProducts] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    // Данные фильтров из API
    const [filtersData, setFiltersData] = useState({
        sizes: [],
        sizesByCategory: [],
        brands: [],
        types: [],
        colors: [],
        priceRange: { min: 0, max: 100000 },
    })

    // Читаем начальные значения из URL
    const getInitialFilters = () => {
        const brands = searchParams.get("brands")?.split(",").filter(Boolean) || []
        const types = searchParams.get("types")?.split(",").filter(Boolean) || []
        const sizes = searchParams.get("sizes")?.split(",").filter(Boolean) || []
        const colors = searchParams.get("colors")?.split(",").filter(Boolean) || []
        const minPrice = searchParams.get("minPrice")
        const maxPrice = searchParams.get("maxPrice")
        const category = searchParams.get("category")

        // Если есть категория, добавляем соответствующие типы
        let finalTypes = types
        if (category && categoryToTypes[category]) {
            finalTypes = [...new Set([...types, ...categoryToTypes[category]])]
        }

        return {
            brands,
            types: finalTypes,
            sizes,
            colors,
            price: {
                min: minPrice ? Number(minPrice) : null,
                max: maxPrice ? Number(maxPrice) : null,
            },
        }
    }

    const [filters, setFilters] = useState(getInitialFilters)
    const [sortType, setSortType] = useState(searchParams.get("sort") || "new")
    const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1)
    const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")

    // Загрузка продуктов и фильтров из API
    useEffect(() => {
        setIsLoading(true)

        Promise.all([
            fetch(`${API_URL}/products?limit=1000`).then((res) => res.json()),
            fetch(`${API_URL}/filters`).then((res) => res.json()),
        ])
            .then(([productsData, filtersResponse]) => {
                setAllProducts(productsData.products || [])
                setFiltersData({
                    sizes: filtersResponse.sizes || [],
                    sizesByCategory: filtersResponse.sizesByCategory || [],
                    brands: filtersResponse.brands || [],
                    types: filtersResponse.types || [],
                    colors: filtersResponse.colors || [],
                    priceRange: filtersResponse.priceRange || { min: 0, max: 100000 },
                })
                setIsLoading(false)
            })
            .catch((err) => {
                console.error("Ошибка загрузки данных:", err)
                setIsLoading(false)
            })
    }, [])

    // Синхронизация фильтров с URL
    const updateURL = useCallback(() => {
        const params = new URLSearchParams()

        if (filters.brands.length > 0) {
            params.set("brands", filters.brands.join(","))
        }
        if (filters.types.length > 0) {
            params.set("types", filters.types.join(","))
        }
        if (filters.sizes.length > 0) {
            params.set("sizes", filters.sizes.join(","))
        }
        if (filters.colors.length > 0) {
            params.set("colors", filters.colors.join(","))
        }
        if (filters.price.min !== null) {
            params.set("minPrice", filters.price.min.toString())
        }
        if (filters.price.max !== null) {
            params.set("maxPrice", filters.price.max.toString())
        }
        if (sortType !== "new") {
            params.set("sort", sortType)
        }
        if (currentPage > 1) {
            params.set("page", currentPage.toString())
        }
        if (searchQuery) {
            params.set("search", searchQuery)
        }

        setSearchParams(params, { replace: true })
    }, [filters, sortType, currentPage, searchQuery, setSearchParams])

    // Обновляем URL при изменении фильтров
    useEffect(() => {
        updateURL()
    }, [updateURL])

    // Обработка URL параметров при первой загрузке
    useEffect(() => {
        const category = searchParams.get("category")
        const search = searchParams.get("search")

        if (category && categoryToTypes[category]) {
            setFilters((prev) => ({
                ...prev,
                types: categoryToTypes[category],
            }))
        }

        if (search) {
            setSearchQuery(search)
        }
    }, []) // Только при монтировании

    // Сортировка
    const sortedProducts = useMemo(() => {
        let sorted = [...allProducts]
        switch (sortType) {
            case "expensive":
                return sorted.sort((a, b) => (b.final_price || b.price) - (a.final_price || a.price))
            case "cheap":
                return sorted.sort((a, b) => (a.final_price || a.price) - (b.final_price || b.price))
            case "popular":
                return sorted.sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
            case "favorites":
                return sorted.sort((a, b) => (b.favorites_count || 0) - (a.favorites_count || 0))
            case "discount":
                return sorted.sort((a, b) => (b.discount_percent || 0) - (a.discount_percent || 0))
            case "new":
            default:
                return sorted.sort((a, b) => new Date(b.date) - new Date(a.date))
        }
    }, [sortType, allProducts])

    // Фильтрация
    const filteredProducts = useMemo(() => {
        return sortedProducts.filter((product) => {
            // Поиск по названию и описанию
            if (searchQuery) {
                const query = searchQuery.toLowerCase()
                const nameMatch = product.name?.toLowerCase().includes(query)
                const descMatch = product.description?.toLowerCase().includes(query)
                const brandMatch = product.brand?.toLowerCase().includes(query)
                const typeMatch = product.type?.toLowerCase().includes(query)
                const materialMatch = product.material?.toLowerCase().includes(query)

                if (!nameMatch && !descMatch && !brandMatch && !typeMatch && !materialMatch) {
                    return false
                }
            }

            if (filters.brands.length > 0 && !filters.brands.includes(product.brand)) {
                return false
            }

            if (filters.colors.length > 0 && !filters.colors.includes(product.color)) {
                return false
            }

            if (filters.types.length > 0 && !filters.types.includes(product.type)) {
                return false
            }

            if (filters.sizes.length > 0) {
                const productSizes = product.sizes || []
                if (!filters.sizes.some((size) => productSizes.includes(size))) {
                    return false
                }
            }

            // Цена с учётом скидки
            const productPrice = product.final_price || product.price
            if (filters.price.min !== null && productPrice < filters.price.min) {
                return false
            }

            if (filters.price.max !== null && productPrice > filters.price.max) {
                return false
            }

            return true
        })
    }, [sortedProducts, filters, searchQuery])

    const count = filteredProducts.length

    // Сброс страницы при изменении фильтров или поиска
    useEffect(() => {
        setCurrentPage(1)
    }, [filters, searchQuery, sortType])

    // Функция сброса фильтров
    const resetFilters = useCallback(() => {
        setFilters({
            brands: [],
            types: [],
            sizes: [],
            colors: [],
            price: { min: null, max: null },
        })
        setSearchQuery("")
        setSortType("new")
        setCurrentPage(1)
    }, [])

    return (
        <CatalogContext.Provider
            value={{
                products: filteredProducts,
                allProducts,
                count,
                sortType,
                setSortType,
                filters,
                setFilters,
                isLoading,
                // Размеры
                allSizes: filtersData.sizes,
                sizesByCategory: filtersData.sizesByCategory,
                // Остальные фильтры из API
                availableBrands: filtersData.brands,
                availableTypes: filtersData.types,
                availableColors: filtersData.colors,
                priceRange: filtersData.priceRange,
                // Пагинация
                currentPage,
                setCurrentPage,
                productsPerPage: PRODUCTSPERPAGE,
                // Поиск
                searchQuery,
                setSearchQuery,
                // Сброс
                resetFilters,
            }}>
            {children}
        </CatalogContext.Provider>
    )
}
