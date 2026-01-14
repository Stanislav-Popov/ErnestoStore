/** @format */
import { useContext } from "react"
import { CatalogContext } from "../../context/CatalogContext"
import CatalogProductCard from "../ProductCard/CatalogProductCard"
import { ProductGridSkeleton } from "../Skeleton/Skeleton"
import styles from "./bestSellersBlock.module.css"

export default function BestSellersBlock() {
    const { allProducts, isLoading } = useContext(CatalogContext)

    // Локальная сортировка по популярности (views_count)
    const bestSellers = allProducts
        .slice()
        .sort((a, b) => {
            // Сначала по просмотрам
            const viewsDiff = (b.views_count || 0) - (a.views_count || 0)
            if (viewsDiff !== 0) return viewsDiff
            // Затем по продажам как fallback
            return (b.sales || 0) - (a.sales || 0)
        })
        .slice(0, 4)

    return (
        <section className={styles.container}>
            <h2 className={styles.title}>Хиты продаж</h2>
            {isLoading ? (
                <ProductGridSkeleton count={4} />
            ) : (
                <div className={styles.grid}>
                    {bestSellers.map((item) => (
                        <CatalogProductCard key={item.id} product={item} />
                    ))}
                </div>
            )}
        </section>
    )
}
