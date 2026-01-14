/** @format */

import { Link } from "react-router-dom"
import styles from "../styles/notFoundPage.module.css"
import { useEffect } from "react"

export default function NotFoundPage() {
    useEffect(() => {
        document.title = "Страница не найдена | Ernesto Khachatyryan"
    }, [])

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <h1 className={styles.code}>404</h1>
                <h2 className={styles.title}>Страница не найдена</h2>
                <p className={styles.description}>
                    К сожалению, запрашиваемая страница не существует или была удалена.
                </p>
                <div className={styles.actions}>
                    <Link to="/" className={styles.homeBtn}>
                        На главную
                    </Link>
                    <Link to="/catalog" className={styles.catalogBtn}>
                        В каталог
                    </Link>
                </div>
            </div>
            <div className={styles.decoration}>
                <svg viewBox="0 0 200 200" className={styles.svg}>
                    <circle cx="100" cy="100" r="80" fill="none" stroke="#f0f0f0" strokeWidth="20" />
                    <path
                        d="M60 60 L140 140 M140 60 L60 140"
                        stroke="#e0e0e0"
                        strokeWidth="15"
                        strokeLinecap="round"
                    />
                </svg>
            </div>
        </div>
    )
}
