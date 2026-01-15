/** @format */

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import styles from "./ProductsPage.module.css"
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    EyeOutlined,
    HeartOutlined,
} from "@ant-design/icons"
import ProductModal from "../components/ProductModal"

const API_URL = "http://localhost:5000/api"

export default function ProductsPage() {
    const { token } = useAuth()
    const [products, setProducts] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    })

    // Модальное окно
    const [modalOpen, setModalOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)

    // Удаление
    const [deleteConfirm, setDeleteConfirm] = useState(null)

    useEffect(() => {
        fetchProducts()
    }, [pagination.page, search])

    const fetchProducts = async () => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
            })
            if (search) params.append("search", search)

            const response = await fetch(`${API_URL}/admin/products?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            })

            if (!response.ok) throw new Error("Ошибка загрузки")

            const data = await response.json()
            setProducts(data.products)
            setPagination((prev) => ({
                ...prev,
                total: data.pagination.total,
                totalPages: data.pagination.totalPages,
            }))
        } catch (err) {
            console.error("Ошибка:", err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSearch = (e) => {
        e.preventDefault()
        setPagination((prev) => ({ ...prev, page: 1 }))
        fetchProducts()
    }

    const handleCreate = () => {
        setEditingProduct(null)
        setModalOpen(true)
    }

    const handleEdit = async (productId) => {
        try {
            const response = await fetch(`${API_URL}/admin/products/${productId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            const product = await response.json()
            setEditingProduct(product)
            setModalOpen(true)
        } catch (err) {
            console.error("Ошибка загрузки товара:", err)
        }
    }

    const handleDelete = async (productId) => {
        try {
            await fetch(`${API_URL}/admin/products/${productId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            })
            setDeleteConfirm(null)
            fetchProducts()
        } catch (err) {
            console.error("Ошибка удаления:", err)
        }
    }

    const handleModalClose = (shouldRefresh) => {
        setModalOpen(false)
        setEditingProduct(null)
        if (shouldRefresh) {
            fetchProducts()
        }
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Товары</h1>
                <button className={styles.addBtn} onClick={handleCreate}>
                    <PlusOutlined /> Добавить товар
                </button>
            </div>

            {/* Поиск */}
            <form className={styles.searchForm} onSubmit={handleSearch}>
                <div className={styles.searchWrapper}>
                    <SearchOutlined className={styles.searchIcon} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Поиск по названию или бренду..."
                        className={styles.searchInput}
                    />
                </div>
            </form>

            {/* Таблица */}
            <div className={styles.tableWrapper}>
                {isLoading ? (
                    <div className={styles.loading}>Загрузка...</div>
                ) : products.length === 0 ? (
                    <div className={styles.empty}>Товары не найдены</div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Фото</th>
                                <th>Название</th>
                                <th>Бренд</th>
                                <th>Цена</th>
                                <th>Скидка</th>
                                <th>
                                    <EyeOutlined title="Просмотры" />
                                </th>
                                <th>
                                    <HeartOutlined title="Избранное" />
                                </th>
                                <th>Статус</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.id}>
                                    <td>
                                        <img
                                            src={
                                                product.image?.startsWith("/uploads")
                                                    ? `http://localhost:5000${product.image}`
                                                    : product.image || "/images/placeholder.jpg"
                                            }
                                            alt=""
                                            className={styles.productImage}
                                        />
                                    </td>
                                    <td className={styles.productName}>{product.name}</td>
                                    <td>{product.brand || "—"}</td>
                                    <td className={styles.price}>
                                        {product.price?.toLocaleString("ru-RU")} ₽
                                    </td>
                                    <td>
                                        {product.discount_percent > 0 ? (
                                            <span className={styles.discountBadge}>
                                                -{product.discount_percent}%
                                            </span>
                                        ) : (
                                            "—"
                                        )}
                                    </td>
                                    <td className={styles.statCell}>{product.views_count || 0}</td>
                                    <td className={styles.statCell}>{product.favorites_count || 0}</td>
                                    <td>
                                        <span
                                            className={`${styles.status} ${
                                                product.is_active ? styles.active : styles.inactive
                                            }`}>
                                            {product.is_active ? "Активен" : "Скрыт"}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button
                                                className={styles.actionBtn}
                                                onClick={() => handleEdit(product.id)}
                                                title="Редактировать">
                                                <EditOutlined />
                                            </button>
                                            <button
                                                className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                                onClick={() => setDeleteConfirm(product)}
                                                title="Удалить">
                                                <DeleteOutlined />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Пагинация */}
            {pagination.totalPages > 1 && (
                <div className={styles.pagination}>
                    <button
                        disabled={pagination.page === 1}
                        onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>
                        ←
                    </button>
                    <span>
                        {pagination.page} из {pagination.totalPages}
                    </span>
                    <button
                        disabled={pagination.page === pagination.totalPages}
                        onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>
                        →
                    </button>
                </div>
            )}

            {/* Модальное окно создания/редактирования */}
            {modalOpen && <ProductModal product={editingProduct} onClose={handleModalClose} token={token} />}

            {/* Подтверждение удаления */}
            {deleteConfirm && (
                <div className={styles.overlay} onClick={() => setDeleteConfirm(null)}>
                    <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
                        <h3>Удалить товар?</h3>
                        <p>«{deleteConfirm.name}» будет скрыт из каталога</p>
                        <div className={styles.confirmActions}>
                            <button className={styles.cancelBtn} onClick={() => setDeleteConfirm(null)}>
                                Отмена
                            </button>
                            <button
                                className={styles.confirmDeleteBtn}
                                onClick={() => handleDelete(deleteConfirm.id)}>
                                Удалить
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
