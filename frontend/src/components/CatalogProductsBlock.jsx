/** @format */
import styles from "./../styles/catalogProductsBlock.module.css"
import { useContext } from "react"
import ProductList from "./ProductList/ProductList"
import Pagination from "./Pagination/Pagination"
import { CatalogContext } from "../context/CatalogContext"
import { ProductGridSkeleton } from "./Skeleton/Skeleton"
import { useInfiniteScroll, useIsMobile } from "../hooks/useInfiniteScroll"
import { LoadingOutlined } from "@ant-design/icons"

export default function CatalogProductsBlock() {
    const { products, currentPage, setCurrentPage, productsPerPage, isLoading } = useContext(CatalogContext)
    const isMobile = useIsMobile(768)

    // Бесконечная прокрутка для мобильных
    const {
        displayedItems,
        hasMore,
        loadMore,
        isLoading: isLoadingMore,
        loadMoreRef,
    } = useInfiniteScroll({
        items: products,
        itemsPerPage: 12,
        threshold: 400,
        enabled: isMobile,
    })

    // Для десктопа используем пагинацию
    const indexOfLast = currentPage * productsPerPage
    const indexOfFirst = indexOfLast - productsPerPage
    const paginatedProducts = products.slice(indexOfFirst, indexOfLast)
    const totalPages = Math.ceil(products.length / productsPerPage)

    // Выбираем какие товары показывать
    const currentProducts = isMobile ? displayedItems : paginatedProducts

    // Показываем скелетон при первичной загрузке
    if (isLoading) {
        return (
            <div className={styles.catalogWrapper}>
                <ProductGridSkeleton count={8} />
            </div>
        )
    }

    // Показываем сообщение если товаров не найдено
    if (products.length === 0) {
        return (
            <div className={styles.catalogWrapper}>
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <svg
                            viewBox="0 0 64 64"
                            width="64"
                            height="64"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2">
                            <circle cx="32" cy="32" r="28" />
                            <path d="M20 26h24M20 38h16" strokeLinecap="round" />
                        </svg>
                    </div>
                    <p>Товары не найдены</p>
                    <span>Попробуйте изменить параметры поиска или фильтры</span>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.catalogWrapper}>
            {/* Счётчик товаров */}
            <div className={styles.resultsInfo}>
                {isMobile ? (
                    <span>
                        Показано {displayedItems.length} из {products.length}
                    </span>
                ) : (
                    <span>
                        {indexOfFirst + 1}–{Math.min(indexOfLast, products.length)} из {products.length}
                    </span>
                )}
            </div>

            {/* Список товаров */}
            <ProductList currentProducts={currentProducts} />

            {/* Для мобильных - бесконечная прокрутка */}
            {isMobile && (
                <>
                    {/* Триггер для загрузки */}
                    <div ref={loadMoreRef} className={styles.loadMoreTrigger} />

                    {/* Индикатор загрузки */}
                    {isLoadingMore && (
                        <div className={styles.loadingMore}>
                            <LoadingOutlined spin />
                            <span>Загрузка...</span>
                        </div>
                    )}

                    {/* Кнопка "Загрузить ещё" как fallback */}
                    {hasMore && !isLoadingMore && (
                        <button className={styles.loadMoreBtn} onClick={loadMore}>
                            Показать ещё
                        </button>
                    )}

                    {/* Сообщение о конце списка */}
                    {!hasMore && products.length > 12 && (
                        <div className={styles.endMessage}>Вы просмотрели все товары</div>
                    )}
                </>
            )}

            {/* Для десктопа - пагинация */}
            {!isMobile && totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    setCurrentPage={setCurrentPage}
                />
            )}
        </div>
    )
}
