/** @format */

import { useContext } from "react"
import { Link } from "react-router-dom"
import { FavoritesContext } from "../context/FavoritesContext"
import CatalogProductCard from "../components/ProductCard/CatalogProductCard"
import Breadcrumbs from "../components/Breadcrumbs/Breadcrumbs"
import styles from "../styles/favoritesPage.module.css"
import { HeartOutlined } from "@ant-design/icons"
import { useSEO } from "../hooks/useSEO"

export default function FavoritesPage() {
    const { favorites } = useContext(FavoritesContext)

    useSEO({
        title: "Избранное",
        description: "Ваши избранные товары в интернет-магазине Ernesto Khachatyryan",
    })

    return (
        <div className={styles.wrapper}>
            <div className={styles.container}>
                <Breadcrumbs />

                <h1 className={styles.title}>
                    <HeartOutlined className={styles.titleIcon} />
                    Избранное
                    {favorites.length > 0 && <span className={styles.count}>({favorites.length})</span>}
                </h1>

                {favorites.length === 0 ? (
                    <div className={styles.emptyState}>
                        <HeartOutlined className={styles.emptyIcon} />
                        <h2>В избранном пока ничего нет</h2>
                        <p>Добавляйте товары в избранное, чтобы не потерять их</p>
                        <Link to="/catalog" className={styles.catalogLink}>
                            Перейти в каталог
                        </Link>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {favorites.map((product) => (
                            <CatalogProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
