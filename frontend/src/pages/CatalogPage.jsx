/** @format */
import CatalogContent from "../components/CatalogContent"
import { CatalogProvider } from "../context/CatalogContext"
import styles from "./../styles/catalogPage.module.css"
import CatalogSidebar from "./../components/CatalogSidebar/CatalogSidebar"
import Breadcrumbs from "./../components/Breadcrumbs/Breadcrumbs"
import { useSEO } from "../hooks/useSEO"

export default function CatalogPage() {
    useSEO({
        title: "Каталог",
        description:
            "Каталог мужской одежды Ernesto Khachatyryan. Широкий выбор футболок, худи, брюк и верхней одежды.",
        keywords: "каталог одежды, мужская одежда, футболки, худи, брюки",
    })

    return (
        <CatalogProvider>
            <div className={styles.layout}>
                <div className={styles.breadcrumbsWrapper}>
                    <Breadcrumbs />
                </div>

                {/* Мобильная кнопка фильтров (отображается внутри CatalogSidebar) */}
                <div className={styles.mobileFiltersWrapper}>
                    <CatalogSidebar />
                </div>

                <div className={styles.main}>
                    {/* Desktop сайдбар */}
                    <div className={styles.desktopSidebar}>
                        <CatalogSidebar />
                    </div>
                    <CatalogContent className={styles.content} />
                </div>
            </div>
        </CatalogProvider>
    )
}
