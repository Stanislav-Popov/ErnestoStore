/** @format */

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import styles from "./ReferencesPage.module.css"
import {
    TagOutlined,
    AppstoreOutlined,
    BgColorsOutlined,
    PlusOutlined,
    DeleteOutlined,
    EditOutlined,
    CheckOutlined,
    CloseOutlined,
} from "@ant-design/icons"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

export default function ReferencesPage() {
    const { token } = useAuth()
    const [references, setReferences] = useState({
        brands: [],
        types: [],
        colors: [],
    })
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("brands")

    // Для создания/редактирования
    const [newItem, setNewItem] = useState("")
    const [editingId, setEditingId] = useState(null)
    const [editingValue, setEditingValue] = useState("")

    useEffect(() => {
        fetchReferences()
    }, [])

    const fetchReferences = async () => {
        setIsLoading(true)
        try {
            const response = await fetch(`${API_URL}/admin/references`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            const data = await response.json()
            setReferences(data)
        } catch (err) {
            console.error("Ошибка загрузки:", err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreate = async () => {
        if (!newItem.trim()) return

        try {
            const endpoint = activeTab === "brands" ? "brands" : activeTab === "types" ? "types" : "colors"

            await fetch(`${API_URL}/admin/${endpoint}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name: newItem.trim() }),
            })

            setNewItem("")
            fetchReferences()
        } catch (err) {
            console.error("Ошибка создания:", err)
        }
    }

    const handleUpdate = async (id) => {
        if (!editingValue.trim()) return

        try {
            const endpoint = activeTab === "brands" ? "brands" : activeTab === "types" ? "types" : "colors"

            await fetch(`${API_URL}/admin/${endpoint}/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name: editingValue.trim() }),
            })

            setEditingId(null)
            setEditingValue("")
            fetchReferences()
        } catch (err) {
            console.error("Ошибка обновления:", err)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm("Удалить? Элемент будет удалён, если не используется в товарах.")) return

        try {
            const endpoint = activeTab === "brands" ? "brands" : activeTab === "types" ? "types" : "colors"

            await fetch(`${API_URL}/admin/${endpoint}/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            })

            fetchReferences()
        } catch (err) {
            console.error("Ошибка удаления:", err)
        }
    }

    const startEditing = (item) => {
        setEditingId(item.id)
        setEditingValue(item.name)
    }

    const cancelEditing = () => {
        setEditingId(null)
        setEditingValue("")
    }

    const tabs = [
        { key: "brands", label: "Бренды", icon: <TagOutlined />, count: references.brands?.length || 0 },
        { key: "types", label: "Типы", icon: <AppstoreOutlined />, count: references.types?.length || 0 },
        { key: "colors", label: "Цвета", icon: <BgColorsOutlined />, count: references.colors?.length || 0 },
    ]

    const currentItems = references[activeTab] || []

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>Справочники</h1>

            {/* Табы */}
            <div className={styles.tabs}>
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ""}`}
                        onClick={() => setActiveTab(tab.key)}>
                        {tab.icon}
                        <span>{tab.label}</span>
                        <span className={styles.tabCount}>{tab.count}</span>
                    </button>
                ))}
            </div>

            {/* Содержимое */}
            <div className={styles.content}>
                {/* Форма добавления */}
                <div className={styles.addForm}>
                    <input
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                        placeholder={`Новый ${
                            activeTab === "brands" ? "бренд" : activeTab === "types" ? "тип" : "цвет"
                        }...`}
                        className={styles.addInput}
                    />
                    <button className={styles.addBtn} onClick={handleCreate} disabled={!newItem.trim()}>
                        <PlusOutlined /> Добавить
                    </button>
                </div>

                {/* Список */}
                {isLoading ? (
                    <div className={styles.loading}>Загрузка...</div>
                ) : currentItems.length === 0 ? (
                    <div className={styles.empty}>Пусто</div>
                ) : (
                    <div className={styles.list}>
                        {currentItems.map((item) => (
                            <div key={item.id} className={styles.item}>
                                {editingId === item.id ? (
                                    <>
                                        <input
                                            type="text"
                                            value={editingValue}
                                            onChange={(e) => setEditingValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleUpdate(item.id)
                                                if (e.key === "Escape") cancelEditing()
                                            }}
                                            className={styles.editInput}
                                            autoFocus
                                        />
                                        <div className={styles.itemActions}>
                                            <button
                                                className={styles.saveBtn}
                                                onClick={() => handleUpdate(item.id)}>
                                                <CheckOutlined />
                                            </button>
                                            <button className={styles.cancelBtn} onClick={cancelEditing}>
                                                <CloseOutlined />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className={styles.itemInfo}>
                                            {activeTab === "colors" && item.hex_code && (
                                                <span
                                                    className={styles.colorDot}
                                                    style={{ background: item.hex_code }}
                                                />
                                            )}
                                            <span className={styles.itemName}>{item.name}</span>
                                            <span className={styles.itemCount}>
                                                {item.products_count || 0} товаров
                                            </span>
                                        </div>
                                        <div className={styles.itemActions}>
                                            <button
                                                className={styles.editBtn}
                                                onClick={() => startEditing(item)}>
                                                <EditOutlined />
                                            </button>
                                            <button
                                                className={styles.deleteBtn}
                                                onClick={() => handleDelete(item.id)}
                                                disabled={item.products_count > 0}>
                                                <DeleteOutlined />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
