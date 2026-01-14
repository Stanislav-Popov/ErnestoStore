/** @format */
import styles from "./heroBlock.module.css"
import Button from "./../Button/Button"
import { useNavigate } from "react-router-dom"

export default function HeroBlock() {
    const navigate = useNavigate()

    return (
        <section className={styles.container}>
            {/* Левая часть */}
            <div className={styles.textBlock}>
                <h2>Ernesto Khachatyryan</h2>
                <h1>Одежда с характером</h1>
                <p className={styles.description}>Стиль, который не требует объяснений</p>
                <Button variant="tertiary" size="large" onClick={() => navigate("/catalog")}>
                    Перейти в каталог
                </Button>
            </div>

            {/* Правая часть — фото */}
            <div className={styles.imgBlock}>
                <img className={styles.img} src="./images/hero-image-v2.png" alt="Model" />
            </div>
        </section>
    )
}
