/** @format */

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import styles from "./DashboardPage.module.css"
import {
    ShoppingOutlined,
    TagOutlined,
    BgColorsOutlined,
    EyeOutlined,
    HeartOutlined,
    PercentageOutlined,
} from "@ant-design/icons"

const API_URL = "http://localhost:5000/api"
const SERVER_URL = "http://localhost:5000"

// Хелпер для формирования полного URL изображения
const getImageUrl = (path) => {
    if (!path) return "/images/placeholder.jpg"
    if (path.startsWith("http")) return path
    if (path.startsWith("/uploads")) return `${SERVER_URL}${path}`
    return path
}

export default function DashboardPage() {
    const { token } = useAuth()
    const [stats, setStats] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            const response = await fetch(`${API_URL}/admin/stats`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) throw new Error("Ошибка загрузки")

            const data = await response.json()
            setStats(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return <div className={styles.loading}>Загрузка...</div>
    }

    if (error) {
        return <div className={styles.error}>Ошибка: {error}</div>
    }

    return (
        <div className={styles.dashboard}>
            <h1 className={styles.title}>Дашборд</h1>

            {/* Карточки статистики */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: "#e3f2fd" }}>
                        <ShoppingOutlined style={{ color: "#1976d2" }} />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{stats?.totals?.products || 0}</span>
                        <span className={styles.statLabel}>Товаров</span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: "#f3e5f5" }}>
                        <TagOutlined style={{ color: "#7b1fa2" }} />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{stats?.totals?.brands || 0}</span>
                        <span className={styles.statLabel}>Брендов</span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: "#e8f5e9" }}>
                        <BgColorsOutlined style={{ color: "#388e3c" }} />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{stats?.totals?.types || 0}</span>
                        <span className={styles.statLabel}>Типов</span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: "#fff3e0" }}>
                        <PercentageOutlined style={{ color: "#f57c00" }} />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{stats?.totals?.with_discount || 0}</span>
                        <span className={styles.statLabel}>Со скидкой</span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: "#e0f7fa" }}>
                        <EyeOutlined style={{ color: "#0097a7" }} />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{stats?.totals?.total_views || 0}</span>
                        <span className={styles.statLabel}>Просмотров</span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: "#fce4ec" }}>
                        <HeartOutlined style={{ color: "#c2185b" }} />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{stats?.totals?.total_favorites || 0}</span>
                        <span className={styles.statLabel}>В избранном</span>
                    </div>
                </div>
            </div>

            {/* Топ товаров */}
            <div className={styles.tables}>
                {/* Топ по просмотрам */}
                <div className={styles.tableCard}>
                    <h3 className={styles.tableTitle}>
                        <EyeOutlined /> Топ-10 по просмотрам
                    </h3>
                    <div className={styles.tableContent}>
                        {stats?.topViewed?.length > 0 ? (
                            <table className={styles.table}>
                                <tbody>
                                    {stats.topViewed.map((item, index) => (
                                        <tr key={item.id}>
                                            <td className={styles.tdRank}>{index + 1}</td>
                                            <td className={styles.tdImage}>
                                                <img src={getImageUrl(item.image)} alt="" />
                                            </td>
                                            <td className={styles.tdName}>{item.name}</td>
                                            <td className={styles.tdValue}>{item.views_count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className={styles.empty}>Нет данных</p>
                        )}
                    </div>
                </div>

                {/* Топ по избранному */}
                <div className={styles.tableCard}>
                    <h3 className={styles.tableTitle}>
                        <HeartOutlined /> Топ-10 по избранному
                    </h3>
                    <div className={styles.tableContent}>
                        {stats?.topFavorites?.length > 0 ? (
                            <table className={styles.table}>
                                <tbody>
                                    {stats.topFavorites.map((item, index) => (
                                        <tr key={item.id}>
                                            <td className={styles.tdRank}>{index + 1}</td>
                                            <td className={styles.tdImage}>
                                                <img src={getImageUrl(item.image)} alt="" />
                                            </td>
                                            <td className={styles.tdName}>{item.name}</td>
                                            <td className={styles.tdValue}>{item.favorites_count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className={styles.empty}>Нет данных</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Последние товары */}
            <div className={styles.tableCard}>
                <h3 className={styles.tableTitle}>
                    <ShoppingOutlined /> Последние добавленные
                </h3>
                <div className={styles.tableContent}>
                    {stats?.recentProducts?.length > 0 ? (
                        <table className={styles.table}>
                            <tbody>
                                {stats.recentProducts.map((item) => (
                                    <tr key={item.id}>
                                        <td className={styles.tdImage}>
                                            <img src={getImageUrl(item.image)} alt="" />
                                        </td>
                                        <td className={styles.tdName}>{item.name}</td>
                                        <td className={styles.tdPrice}>
                                            {item.price?.toLocaleString("ru-RU")} ₽
                                        </td>
                                        <td className={styles.tdDate}>
                                            {new Date(item.created_at).toLocaleDateString("ru-RU")}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className={styles.empty}>Нет данных</p>
                    )}
                </div>
            </div>
        </div>
    )
}
