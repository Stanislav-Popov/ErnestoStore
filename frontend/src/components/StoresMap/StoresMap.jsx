/** @format */

import { useEffect, useRef, useState } from "react"
import styles from "./storesMap.module.css"
import { EnvironmentOutlined, PhoneOutlined, ClockCircleOutlined } from "@ant-design/icons"

// Данные магазинов
const STORES = [
    {
        id: 1,
        city: "Георгиевск",
        address: "ул. Мира, 1",
        fullAddress: "Россия, Ставропольский край, Георгиевск, ул. Мира, 1",
        phone: "+7 (928) 123-45-67",
        hours: "10:00 – 20:00",
        coordinates: [44.1483, 43.4697], // [широта, долгота]
    },
    {
        id: 3,
        city: "Пятигорск",
        address: "ул. Кирова, 25",
        fullAddress: "Россия, Ставропольский край, Пятигорск, ул. Кирова, 25",
        phone: "+7 (928) 111-22-33",
        hours: "10:00 – 21:00",
        coordinates: [44.0411, 43.059],
    },
]

// Центр карты (между магазинами)
const MAP_CENTER = [44.1, 43.3]
const MAP_ZOOM = 10

export default function StoresMap() {
    const mapRef = useRef(null)
    const mapInstanceRef = useRef(null)
    const [activeStore, setActiveStore] = useState(null)
    const [mapLoaded, setMapLoaded] = useState(false)

    // Загружаем Яндекс.Карты API
    useEffect(() => {
        // Проверяем, загружен ли уже API
        if (window.ymaps) {
            initMap()
            return
        }

        // Загружаем скрипт
        const script = document.createElement("script")
        script.src = "https://api-maps.yandex.ru/2.1/?apikey=ваш-api-ключ&lang=ru_RU"
        script.async = true
        script.onload = () => {
            window.ymaps.ready(initMap)
        }
        document.head.appendChild(script)

        return () => {
            // Cleanup
            if (mapInstanceRef.current) {
                mapInstanceRef.current.destroy()
            }
        }
    }, [])

    const initMap = () => {
        if (!mapRef.current || mapInstanceRef.current) return

        const map = new window.ymaps.Map(mapRef.current, {
            center: MAP_CENTER,
            zoom: MAP_ZOOM,
            controls: ["zoomControl", "fullscreenControl"],
        })

        // Добавляем метки магазинов
        STORES.forEach((store) => {
            const placemark = new window.ymaps.Placemark(
                store.coordinates,
                {
                    balloonContentHeader: `<strong>ERNESTO</strong>`,
                    balloonContentBody: `
                        <div style="padding: 8px 0;">
                            <p style="margin: 0 0 8px; font-weight: 500;">${store.fullAddress}</p>
                            <p style="margin: 0 0 4px; color: #666;">📞 ${store.phone}</p>
                            <p style="margin: 0; color: #666;">🕐 ${store.hours}</p>
                        </div>
                    `,
                    hintContent: store.city + ", " + store.address,
                },
                {
                    preset: "islands#blackShoppingIcon",
                    iconColor: "#1a1a2e",
                }
            )

            placemark.events.add("click", () => {
                setActiveStore(store.id)
            })

            map.geoObjects.add(placemark)
        })

        // Устанавливаем границы карты по всем меткам
        map.setBounds(map.geoObjects.getBounds(), {
            checkZoomRange: true,
            zoomMargin: 50,
        })

        mapInstanceRef.current = map
        setMapLoaded(true)
    }

    const handleStoreClick = (store) => {
        setActiveStore(store.id)

        if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter(store.coordinates, 15, {
                duration: 500,
            })
        }
    }

    return (
        <section className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Наши магазины</h2>
                <p className={styles.subtitle}>Посетите наши магазины в Ставропольском крае</p>
            </div>

            <div className={styles.content}>
                {/* Список магазинов */}
                <div className={styles.storesList}>
                    {STORES.map((store) => (
                        <div
                            key={store.id}
                            className={`${styles.storeCard} ${activeStore === store.id ? styles.active : ""}`}
                            onClick={() => handleStoreClick(store)}>
                            <h3 className={styles.storeCity}>{store.city}</h3>

                            <div className={styles.storeInfo}>
                                <div className={styles.infoRow}>
                                    <EnvironmentOutlined className={styles.icon} />
                                    <span>{store.address}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <PhoneOutlined className={styles.icon} />
                                    <a href={`tel:${store.phone.replace(/\D/g, "")}`}>{store.phone}</a>
                                </div>
                                <div className={styles.infoRow}>
                                    <ClockCircleOutlined className={styles.icon} />
                                    <span>{store.hours}</span>
                                </div>
                            </div>

                            <a
                                href={`https://yandex.ru/maps/?text=${encodeURIComponent(store.fullAddress)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.routeBtn}
                                onClick={(e) => e.stopPropagation()}>
                                Построить маршрут
                            </a>
                        </div>
                    ))}
                </div>

                {/* Карта */}
                <div className={styles.mapWrapper}>
                    <div ref={mapRef} className={styles.map} />

                    {!mapLoaded && (
                        <div className={styles.mapPlaceholder}>
                            <div className={styles.mapLoader}>Загрузка карты...</div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}

/**
 * Альтернативная версия без Яндекс.Карт API (только iframe)
 * Используйте если не хотите регистрировать API ключ
 */
export function StoresMapSimple() {
    return (
        <section className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Наши магазины</h2>
                <p className={styles.subtitle}>Посетите наши магазины в Ставропольском крае</p>
            </div>

            <div className={styles.content}>
                {/* Список магазинов */}
                <div className={styles.storesList}>
                    {STORES.map((store) => (
                        <div key={store.id} className={styles.storeCard}>
                            <h3 className={styles.storeCity}>{store.city}</h3>

                            <div className={styles.storeInfo}>
                                <div className={styles.infoRow}>
                                    <EnvironmentOutlined className={styles.icon} />
                                    <span>{store.address}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <PhoneOutlined className={styles.icon} />
                                    <a href={`tel:${store.phone.replace(/\D/g, "")}`}>{store.phone}</a>
                                </div>
                                <div className={styles.infoRow}>
                                    <ClockCircleOutlined className={styles.icon} />
                                    <span>{store.hours}</span>
                                </div>
                            </div>

                            <a
                                href={`https://yandex.ru/maps/?text=${encodeURIComponent(store.fullAddress)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.routeBtn}>
                                Построить маршрут
                            </a>
                        </div>
                    ))}
                </div>

                {/* Карта через iframe */}
                <div className={styles.mapWrapper}>
                    <iframe
                        src="https://yandex.ru/map-widget/v1/?um=constructor%3Aернесто&amp;source=constructor&amp;ll=43.300000%2C44.100000&amp;z=10"
                        className={styles.mapIframe}
                        frameBorder="0"
                        allowFullScreen
                        title="Карта магазинов"
                    />
                </div>
            </div>
        </section>
    )
}
