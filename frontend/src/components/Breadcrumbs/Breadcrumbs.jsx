/** @format */
// Этот файл должен быть в папке: src/components/Breadcrumbs/Breadcrumbs.jsx

import { Link, useLocation } from "react-router-dom"
import styles from "./breadcrumbs.module.css"
import { RightOutlined } from "@ant-design/icons"

const routeNames = {
    "": "Главная",
    catalog: "Каталог",
    product: "Товар",
    about: "О нас",
    favorites: "Избранное",
}

export default function Breadcrumbs({ productName = null }) {
    const location = useLocation()
    const pathnames = location.pathname.split("/").filter((x) => x)

    // Не показываем на главной странице
    if (pathnames.length === 0) {
        return null
    }

    const breadcrumbs = [{ name: "Главная", path: "/" }]

    // Если это страница товара, добавляем каталог
    if (pathnames[0] === "product" && productName) {
        breadcrumbs.push({
            name: "Каталог",
            path: "/catalog",
            isLast: false,
        })
        breadcrumbs.push({
            name: productName,
            path: location.pathname,
            isLast: true,
        })
    } else {
        let currentPath = ""
        pathnames.forEach((segment, index) => {
            currentPath += `/${segment}`

            // Если это ID товара (число), используем название товара
            if (!isNaN(segment) && productName) {
                breadcrumbs.push({
                    name: productName,
                    path: currentPath,
                    isLast: true,
                })
            } else if (segment === "product") {
                // Пропускаем "product" в хлебных крошках
                return
            } else if (routeNames[segment]) {
                const isLastSegment = index === pathnames.length - 1
                breadcrumbs.push({
                    name: routeNames[segment],
                    path: currentPath,
                    isLast: isLastSegment && !productName,
                })
            }
        })
    }

    return (
        <nav className={styles.breadcrumbs} aria-label="Навигация">
            {breadcrumbs.map((crumb, index) => (
                <span key={crumb.path} className={styles.crumbWrapper}>
                    {index > 0 && <RightOutlined className={styles.separator} />}
                    {crumb.isLast ? (
                        <span className={styles.currentCrumb}>{crumb.name}</span>
                    ) : (
                        <Link to={crumb.path} className={styles.crumbLink}>
                            {crumb.name}
                        </Link>
                    )}
                </span>
            ))}
        </nav>
    )
}
