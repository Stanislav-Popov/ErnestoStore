/** @format */
import { Link } from "react-router-dom"
import styles from "./footer.module.css"

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.top}>
                <div className={styles.column}>
                    <h2 className={styles.logo}>Ernesto Khachatyryan</h2>
                    <p className={styles.desc}>Стильная мужская одежда собственного производства</p>
                </div>

                <div className={styles.column}>
                    <h3 className={styles.title}>Навигация</h3>
                    <div>
                        <Link to="/">Главная</Link>
                        <Link to="/catalog">Каталог</Link>
                        <Link to="/about">О нас</Link>
                    </div>
                </div>

                <div className={styles.column}>
                    <h3 className={styles.title}>Мы в соц сетях</h3>
                    <div>
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                            Instagram
                        </a>
                        <a href="https://telegram.org" target="_blank" rel="noopener noreferrer">
                            Telegram
                        </a>
                    </div>
                </div>

                <div className={styles.column}>
                    <h3 className={styles.title}>Контакты</h3>
                    <div>
                        <a href="tel:+77777777777">+7 (777) 777-77-77</a>
                        <a href="mailto:info@example.com">info@example.com</a>
                    </div>
                </div>
            </div>

            <div className={styles.bottom}>
                © {new Date().getFullYear()} Ernesto Khachatyryan — Все права защищены
            </div>
        </footer>
    )
}
