/** @format */

import styles from "./skeleton.module.css"

// Базовый скелетон
export function Skeleton({ width, height, borderRadius = "4px", className = "" }) {
    return (
        <div
            className={`${styles.skeleton} ${className}`}
            style={{
                width: width || "100%",
                height: height || "20px",
                borderRadius,
            }}
        />
    )
}

// Скелетон для карточки товара
export function ProductCardSkeleton() {
    return (
        <div className={styles.productCard}>
            <Skeleton height="250px" borderRadius="10px" className={styles.image} />
            <div className={styles.info}>
                <Skeleton height="16px" width="80%" />
                <Skeleton height="20px" width="40%" />
            </div>
        </div>
    )
}

// Скелетон для списка товаров
export function ProductGridSkeleton({ count = 8 }) {
    return (
        <div className={styles.productGrid}>
            {Array.from({ length: count }).map((_, index) => (
                <ProductCardSkeleton key={index} />
            ))}
        </div>
    )
}

// Скелетон для страницы товара
export function ProductPageSkeleton() {
    return (
        <div className={styles.productPage}>
            <Skeleton height="20px" width="300px" className={styles.breadcrumbs} />
            <div className={styles.mainSection}>
                <div className={styles.gallery}>
                    <div className={styles.thumbs}>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} width="90px" height="90px" borderRadius="6px" />
                        ))}
                    </div>
                    <Skeleton width="500px" height="600px" borderRadius="8px" />
                </div>
                <div className={styles.productInfo}>
                    <Skeleton height="32px" width="80%" />
                    <Skeleton height="28px" width="30%" />
                    <div className={styles.sizes}>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} width="48px" height="40px" borderRadius="6px" />
                        ))}
                    </div>
                    <Skeleton height="50px" width="200px" borderRadius="8px" />
                    <Skeleton height="100px" width="100%" />
                </div>
            </div>
        </div>
    )
}

// Скелетон для сайдбара фильтров
export function FilterSidebarSkeleton() {
    return (
        <div className={styles.filterSidebar}>
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={styles.filterSection}>
                    <Skeleton height="20px" width="100px" />
                    <div className={styles.filterOptions}>
                        {Array.from({ length: 5 }).map((_, j) => (
                            <Skeleton key={j} height="24px" width="80%" />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

// Скелетон для таблицы админки
export function TableSkeleton({ rows = 5, columns = 6 }) {
    return (
        <div className={styles.table}>
            <div className={styles.tableHeader}>
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={i} height="20px" />
                ))}
            </div>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className={styles.tableRow}>
                    {Array.from({ length: columns }).map((_, j) => (
                        <Skeleton key={j} height="16px" />
                    ))}
                </div>
            ))}
        </div>
    )
}

export default Skeleton