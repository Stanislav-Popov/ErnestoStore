/** @format */
import CatalogUnderHeader from "./../components/CatalogUnderHeader"
import CatalogProductsBlock from "./../components/CatalogProductsBlock"
import styles from "./../styles/catalogContent.module.css"

export default function CatalogContent() {
    return (
        <div className={styles.content}>
            <CatalogUnderHeader />
            <CatalogProductsBlock />
        </div>
    )
}
