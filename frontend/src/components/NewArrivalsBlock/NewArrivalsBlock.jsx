/** @format */
import { useContext } from "react"
import { CatalogContext } from "../../context/CatalogContext"
import CatalogProductCard from "../ProductCard/CatalogProductCard"
import { ProductGridSkeleton } from "../Skeleton/Skeleton"
import styles from "./newArrivalsBlock.module.css"

export default function NewArrivalsBlock() {
    const { allProducts, isLoading } = useContext(CatalogContext)

    // Локальная сортировка - не влияем на глобальный sortType
    const newArrivals = allProducts
        .slice()
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 4)

    return (
        <section className={styles.container}>
            <h2 className={styles.title}>Новые поступления</h2>
            {isLoading ? (
                <ProductGridSkeleton count={4} />
            ) : (
                <div className={styles.grid}>
                    {newArrivals.map((item) => (
                        <CatalogProductCard key={item.id} product={item} />
                    ))}
                </div>
            )}
        </section>
    )
}
