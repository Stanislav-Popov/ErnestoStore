/** @format */

import { useState, useEffect } from "react"
import { API_URL, getImageUrl } from "../../config/api"
import styles from "./ProductModal.module.css"
import { CloseOutlined, PlusOutlined, DeleteOutlined, LoadingOutlined } from "@ant-design/icons"

export default function ProductModal({ product, onClose, token }) {
    const isEditing = Boolean(product)

    const [formData, setFormData] = useState({
        name: "",
        price: "",
        discount_percent: "0",
        description: "",
        material: "",
        brand_id: "",
        type_id: "",
        color_id: "",
        is_active: true,
    })

    const [images, setImages] = useState([])
    const [sizes, setSizes] = useState([])
    const [references, setReferences] = useState({ brands: [], types: [], colors: [], sizes: [] })
    const [isLoading, setIsLoading] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState(null)

    // Загрузка справочников
    useEffect(() => {
        fetchReferences()
    }, [])

    // Заполнение формы при редактировании
    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || "",
                price: product.price || "",
                discount_percent: product.discount_percent || "0",
                description: product.description || "",
                material: product.material || "",
                brand_id: product.brand_id || "",
                type_id: product.type_id || "",
                color_id: product.color_id || "",
                is_active: product.is_active !== false,
            })
            setImages(product.images || [])
            setSizes(product.product_sizes || [])
        }
    }, [product])

    const fetchReferences = async () => {
        try {
            const response = await fetch(`${API_URL}/admin/references`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            const data = await response.json()
            setReferences(data)
        } catch (err) {
            console.error("Ошибка загрузки справочников:", err)
        }
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }))
    }

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files)
        if (files.length === 0) return

        setIsUploading(true)
        try {
            for (const file of files) {
                const formData = new FormData()
                formData.append("image", file)

                const response = await fetch(`${API_URL}/admin/upload`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                })

                if (!response.ok) throw new Error("Ошибка загрузки")

                const data = await response.json()
                setImages((prev) => [...prev, data.url])
            }
        } catch (err) {
            setError("Ошибка загрузки изображения")
        } finally {
            setIsUploading(false)
        }
    }

    const handleRemoveImage = (index) => {
        setImages((prev) => prev.filter((_, i) => i !== index))
    }

    const handleSizeChange = (sizeId, stock) => {
        setSizes((prev) => {
            const existing = prev.find((s) => s.size_id === sizeId)
            if (existing) {
                if (stock === "" || stock === "0") {
                    return prev.filter((s) => s.size_id !== sizeId)
                }
                return prev.map((s) => (s.size_id === sizeId ? { ...s, stock: parseInt(stock) } : s))
            } else if (stock && stock !== "0") {
                return [...prev, { size_id: sizeId, stock: parseInt(stock) }]
            }
            return prev
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                discount_percent: parseInt(formData.discount_percent) || 0,
                brand_id: formData.brand_id || null,
                type_id: formData.type_id || null,
                color_id: formData.color_id || null,
                images,
                sizes,
            }

            const url = isEditing ? `${API_URL}/admin/products/${product.id}` : `${API_URL}/admin/products`

            const response = await fetch(url, {
                method: isEditing ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Ошибка сохранения")
            }

            onClose(true)
        } catch (err) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className={styles.overlay} onClick={() => onClose(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>{isEditing ? "Редактирование товара" : "Новый товар"}</h2>
                    <button className={styles.closeBtn} onClick={() => onClose(false)}>
                        <CloseOutlined />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && <div className={styles.error}>{error}</div>}

                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label>Название *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label>Цена *</label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Скидка %</label>
                            <input
                                type="number"
                                name="discount_percent"
                                value={formData.discount_percent}
                                onChange={handleChange}
                                min="0"
                                max="100"
                            />
                        </div>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label>Бренд</label>
                            <select name="brand_id" value={formData.brand_id} onChange={handleChange}>
                                <option value="">— Выберите —</option>
                                {references.brands?.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label>Тип</label>
                            <select name="type_id" value={formData.type_id} onChange={handleChange}>
                                <option value="">— Выберите —</option>
                                {references.types?.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label>Цвет</label>
                            <select name="color_id" value={formData.color_id} onChange={handleChange}>
                                <option value="">— Выберите —</option>
                                {references.colors?.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label>Материал</label>
                        <input
                            type="text"
                            name="material"
                            value={formData.material}
                            onChange={handleChange}
                            placeholder="Например: 100% хлопок"
                        />
                    </div>

                    <div className={styles.field}>
                        <label>Описание</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                        />
                    </div>

                    <div className={styles.field}>
                        <label>Изображения</label>
                        <div className={styles.imagesGrid}>
                            {images.map((img, index) => (
                                <div key={index} className={styles.imageItem}>
                                    <img src={getImageUrl(img)} alt="" />
                                    <button
                                        type="button"
                                        className={styles.removeImageBtn}
                                        onClick={() => handleRemoveImage(index)}>
                                        <DeleteOutlined />
                                    </button>
                                    {index === 0 && <span className={styles.mainBadge}>Главное</span>}
                                </div>
                            ))}
                            <label className={styles.uploadBtn}>
                                {isUploading ? <LoadingOutlined spin /> : <PlusOutlined />}
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                    disabled={isUploading}
                                />
                            </label>
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label>Размеры и наличие</label>
                        <div className={styles.sizesGrid}>
                            {references.sizes?.map((size) => {
                                const currentSize = sizes.find((s) => s.size_id === size.id)
                                return (
                                    <div key={size.id} className={styles.sizeItem}>
                                        <span className={styles.sizeName}>{size.name}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            value={currentSize?.stock || ""}
                                            onChange={(e) => handleSizeChange(size.id, e.target.value)}
                                        />
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                name="is_active"
                                checked={formData.is_active}
                                onChange={handleChange}
                            />
                            Активен (отображается в каталоге)
                        </label>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" className={styles.cancelBtn} onClick={() => onClose(false)}>
                            Отмена
                        </button>
                        <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                            {isLoading ? <LoadingOutlined spin /> : isEditing ? "Сохранить" : "Создать"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
