/** @format */

import { useState, useEffect } from "react"
import styles from "./cookieConsent.module.css"

const COOKIE_CONSENT_KEY = "cookie_consent"

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Проверяем, дал ли пользователь согласие ранее
        const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
        if (!consent) {
            // Показываем баннер с небольшой задержкой для лучшего UX
            const timer = setTimeout(() => setIsVisible(true), 1000)
            return () => clearTimeout(timer)
        }
    }, [])

    const handleAccept = () => {
        localStorage.setItem(
            COOKIE_CONSENT_KEY,
            JSON.stringify({
                accepted: true,
                date: new Date().toISOString(),
            })
        )
        setIsVisible(false)
    }

    const handleDecline = () => {
        localStorage.setItem(
            COOKIE_CONSENT_KEY,
            JSON.stringify({
                accepted: false,
                date: new Date().toISOString(),
            })
        )
        setIsVisible(false)
    }

    if (!isVisible) return null

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.text}>
                    <span className={styles.icon}>🍪</span>
                    <p>
                        Мы используем файлы cookie для улучшения работы сайта и анализа трафика. Продолжая
                        использовать сайт, вы соглашаетесь с{" "}
                        <a href="/privacy" className={styles.link}>
                            политикой конфиденциальности
                        </a>
                        .
                    </p>
                </div>
                <div className={styles.actions}>
                    <button className={styles.declineBtn} onClick={handleDecline}>
                        Отклонить
                    </button>
                    <button className={styles.acceptBtn} onClick={handleAccept}>
                        Принять
                    </button>
                </div>
            </div>
        </div>
    )
}
