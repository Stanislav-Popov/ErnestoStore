/** @format */
import CatalogProductCard from "../ProductCard/CatalogProductCard"
import styles from "./productList.module.css"

export default function ProductList({ currentProducts }) {
    return (
        <div className={styles.container}>
            {currentProducts.map((p) => (
                <CatalogProductCard key={p.id} product={p}/>
            ))}
        </div>
    )
}
