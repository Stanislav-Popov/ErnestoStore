/** @format */

import { useSEO } from "../hooks/useSEO"
import Breadcrumbs from "../components/Breadcrumbs/Breadcrumbs"
import styles from "../styles/aboutPage.module.css"

export default function AboutPage() {
    useSEO({
        title: "О нас",
        description:
            "Ernesto Khachatyryan — бренд стильной мужской одежды собственного производства. Узнайте больше о нашей истории и ценностях.",
        keywords: "о нас, Ernesto Khachatyryan, мужская одежда, бренд",
    })

    return (
        <div className={styles.wrapper}>
            <div className={styles.container}>
                <Breadcrumbs />

                <h1 className={styles.title}>О нас</h1>

                <section className={styles.section}>
                    <h2>Наша история</h2>
                    <p>
                        Ernesto Khachatyryan — это бренд стильной мужской одежды, созданный с любовью к
                        качеству и вниманием к деталям. Мы верим, что каждый мужчина заслуживает выглядеть
                        стильно и чувствовать себя уверенно.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>Наши ценности</h2>
                    <div className={styles.values}>
                        <div className={styles.valueCard}>
                            <h3>Качество</h3>
                            <p>
                                Используем только качественные материалы и тщательно контролируем каждый этап
                                производства.
                            </p>
                        </div>
                        <div className={styles.valueCard}>
                            <h3>Стиль</h3>
                            <p>
                                Создаём современную одежду, которая подчёркивает индивидуальность каждого
                                клиента.
                            </p>
                        </div>
                        <div className={styles.valueCard}>
                            <h3>Комфорт</h3>
                            <p>Наша одежда не только красивая, но и удобная для повседневной жизни.</p>
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2>Контакты</h2>
                    <div className={styles.contacts}>
                        <p>
                            <strong>Телефон:</strong> +7 (777) 777-77-77
                        </p>
                        <p>
                            <strong>Email:</strong> info@example.com
                        </p>
                        <p>
                            <strong>Instagram:</strong> @ernestokhachatyryan
                        </p>
                    </div>
                </section>
            </div>
        </div>
    )
}
