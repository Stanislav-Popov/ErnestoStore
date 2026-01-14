/** @format */

import { useNavigate } from "react-router-dom"
import styles from "./categoriesBlock.module.css"

export default function CategoriesBlock() {
    const navigate = useNavigate()

    const categories = [
        { title: "Верхняя одежда", icon: "coat", param: "Верхняя одежда" },
        { title: "Обувь", icon: "shoes", param: "Обувь" },
        { title: "Рубашки", icon: "shirt", param: "Рубашки" },
        { title: "Брюки", icon: "pants", param: "Брюки" },
        { title: "Свитеры", icon: "sweater", param: "Свитеры" },
        { title: "Футболки", icon: "tshirt", param: "Футболки" },
    ]

    const handleCategoryClick = (category) => {
        navigate(`/catalog?category=${encodeURIComponent(category.param)}`)
    }

    return (
        <section className={styles.container}>
            <h2 className={styles.categoriesTitle}>Поиск по категориям</h2>

            <div className={styles.categoriesGrid}>
                {categories.map((category, index) => (
                    <div
                        key={index}
                        className={styles.categoryCard}
                        onClick={() => handleCategoryClick(category)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                handleCategoryClick(category)
                            }
                        }}>
                        <div className={styles.iconWrapper}>
                            <img
                                src={`/icons/${category.icon}.svg`}
                                alt={category.title}
                                className={styles.icon}
                            />
                        </div>
                        <p className={styles.categoryName}>{category.title}</p>
                    </div>
                ))}
            </div>
        </section>
    )
}
