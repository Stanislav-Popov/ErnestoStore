/** @format */

import { useState, useEffect, useRef } from "react"
import styles from "./ProductModal.module.css"
import { CloseOutlined, DeleteOutlined, UploadOutlined, StarOutlined, StarFilled } from "@ant-design/icons"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000"

// Хелпер для формирования полного URL изображения
const getFullImageUrl = (path) => {
    if (!path) return null
    if (path.startsWith("http")) return path
    if (path.startsWith("/uploads")) return `${SERVER_URL}${path}`
    return path
}

// Размеры по категориям
const SIZE_CATEGORIES = {
    letter: {
        label: "Буквенные (XS-XXL)",
        sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    },
    eu: {
        label: "Российские (44-58)",
        sizes: ["44", "46", "48", "50", "52", "54", "56", "58"],
    },
    jeans: {
        label: "Джинсы (26-38)",
        sizes: ["26", "28", "29", "30", "31", "32", "33", "34", "36", "38"],
    },
    shoes: {
        label: "Обувь (35-47)",
        sizes: ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47"],
    },
    universal: {
        label: "Универсальный",
        sizes: ["One Size"],
    },
}

export default function ProductModal({ product, onClose, token }) {
    const isEditing = !!product
    const fileInputRef = useRef(null)

    const [formData, setFormData] = useState({
        name: "",
        price: "",
        description: "",
        material: "",
        brand: "",
        type: "",
        color: "",
        discount_percent: 0,
        is_active: true,
        sizes: [],
        images: [],
    })

    // Для отображения превью загруженных изображений
    const [imagePreviews, setImagePreviews] = useState([])
    const [uploadingImages, setUploadingImages] = useState(false)

    const [references, setReferences] = useState({
        brands: [],
        types: [],
        colors: [],
    })

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    // Загрузка справочников
    useEffect(() => {
        fetchReferences()
    }, [])

    // Заполнение формы при редактировании
    useEffect(() => {
        if (product) {
            const images = product.images || []
            setFormData({
                name: product.name || "",
                price: product.price || "",
                description: product.description || "",
                material: product.material || "",
                brand: product.brand || "",
                type: product.type || "",
                color: product.color || "",
                discount_percent: product.discount_percent || 0,
                is_active: product.is_active !== false,
                sizes: product.sizes || [],
                images: images,
            })
            // Устанавливаем превью существующих изображений с полными URL
            if (images.length > 0) {
                setImagePreviews(
                    images.map((url, index) => ({
                        url: getFullImageUrl(url),
                        originalUrl: url,
                        isExisting: true,
                        isPrimary: index === 0,
                    }))
                )
            }
        }
    }, [product])

    const fetchReferences = async () => {
        try {
            const response = await fetch(`${API_URL}/admin/references`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            const data = await response.json()
            setReferences({
                brands: data.brands || [],
                types: data.types || [],
                colors: data.colors || [],
            })
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

    const handleSizeToggle = (size) => {
        setFormData((prev) => ({
            ...prev,
            sizes: prev.sizes.includes(size) ? prev.sizes.filter((s) => s !== size) : [...prev.sizes, size],
        }))
    }

    // Обработка выбора файлов
    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files)
        if (files.length === 0) return

        setUploadingImages(true)
        setError("")

        try {
            const newPreviews = []
            const newUrls = []

            for (const file of files) {
                // Проверка типа файла
                if (!file.type.startsWith("image/")) {
                    continue
                }

                // Создаём FormData для загрузки
                const formDataUpload = new FormData()
                formDataUpload.append("image", file)

                // Загружаем на сервер
                const response = await fetch(`${API_URL}/admin/upload`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formDataUpload,
                })

                if (!response.ok) {
                    throw new Error("Ошибка загрузки изображения")
                }

                const data = await response.json()
                newUrls.push(data.url)
                newPreviews.push({
                    url: getFullImageUrl(data.url),
                    originalUrl: data.url,
                    isExisting: false,
                    isPrimary: false,
                })
            }

            // Если это первые изображения, первое будет главным
            const isFirstImages = formData.images.length === 0
            if (isFirstImages && newPreviews.length > 0) {
                newPreviews[0].isPrimary = true
            }

            setFormData((prev) => ({
                ...prev,
                images: [...prev.images, ...newUrls],
            }))
            setImagePreviews((prev) => [...prev, ...newPreviews])
        } catch (err) {
            console.error("Ошибка загрузки:", err)
            setError("Ошибка загрузки изображений. Проверьте размер файлов.")
        } finally {
            setUploadingImages(false)
            // Сбрасываем input
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }

    // Удаление изображения
    const removeImage = (index) => {
        const wasPrimary = imagePreviews[index]?.isPrimary

        setFormData((prev) => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }))

        setImagePreviews((prev) => {
            const newPreviews = prev.filter((_, i) => i !== index)
            // Если удалили главное, делаем первое оставшееся главным
            if (wasPrimary && newPreviews.length > 0) {
                newPreviews[0].isPrimary = true
            }
            return newPreviews
        })
    }

    // Сделать изображение главным
    const setAsPrimary = (index) => {
        setImagePreviews((prev) => {
            const newPreviews = prev.map((p, i) => ({
                ...p,
                isPrimary: i === index,
            }))
            return newPreviews
        })

        // Перемещаем изображение в начало массива
        setFormData((prev) => {
            const newImages = [...prev.images]
            const [removed] = newImages.splice(index, 1)
            newImages.unshift(removed)
            return { ...prev, images: newImages }
        })

        setImagePreviews((prev) => {
            const newPreviews = [...prev]
            const [removed] = newPreviews.splice(index, 1)
            removed.isPrimary = true
            newPreviews.forEach((p) => (p.isPrimary = false))
            removed.isPrimary = true
            newPreviews.unshift(removed)
            return newPreviews
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        // Валидация
        if (!formData.name.trim()) {
            setError("Введите название товара")
            setIsLoading(false)
            return
        }

        if (!formData.price || formData.price <= 0) {
            setError("Введите корректную цену")
            setIsLoading(false)
            return
        }

        try {
            const payload = {
                name: formData.name.trim(),
                price: Number(formData.price),
                description: formData.description.trim(),
                material: formData.material.trim() || null,
                brand: formData.brand.trim() || null,
                type: formData.type.trim() || null,
                color: formData.color.trim() || null,
                discount_percent: Number(formData.discount_percent) || 0,
                is_active: formData.is_active,
                sizes: formData.sizes,
                images: formData.images.filter((img) => img && img.trim()),
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
                const data = await response.json()
                throw new Error(data.error || "Ошибка сохранения")
            }

            onClose(true) // Закрыть и обновить список
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
                                placeholder="Футболка Oversize"
                                required
                            />
                        </div>

                        <div className={styles.field}>
                            <label>Цена *</label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                placeholder="2490"
                                min="0"
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label>Бренд</label>
                            <input
                                type="text"
                                name="brand"
                                value={formData.brand}
                                onChange={handleChange}
                                list="brands-list"
                                placeholder="Nike"
                            />
                            <datalist id="brands-list">
                                {references.brands.map((b) => (
                                    <option key={b.id} value={b.name} />
                                ))}
                            </datalist>
                        </div>

                        <div className={styles.field}>
                            <label>Тип</label>
                            <input
                                type="text"
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                list="types-list"
                                placeholder="Футболка"
                            />
                            <datalist id="types-list">
                                {references.types.map((t) => (
                                    <option key={t.id} value={t.name} />
                                ))}
                            </datalist>
                        </div>

                        <div className={styles.field}>
                            <label>Цвет</label>
                            <input
                                type="text"
                                name="color"
                                value={formData.color}
                                onChange={handleChange}
                                list="colors-list"
                                placeholder="Черный"
                            />
                            <datalist id="colors-list">
                                {references.colors.map((c) => (
                                    <option key={c.id} value={c.name} />
                                ))}
                            </datalist>
                        </div>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label>Скидка (%)</label>
                            <input
                                type="number"
                                name="discount_percent"
                                value={formData.discount_percent}
                                onChange={handleChange}
                                min="0"
                                max="100"
                                placeholder="0"
                            />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    checked={formData.is_active}
                                    onChange={handleChange}
                                />
                                <span>Активен (виден в каталоге)</span>
                            </label>
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label>Описание</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Описание товара..."
                            rows={3}
                        />
                    </div>

                    <div className={styles.field}>
                        <label>Материал</label>
                        <input
                            type="text"
                            name="material"
                            value={formData.material}
                            onChange={handleChange}
                            placeholder="100% хлопок"
                        />
                    </div>

                    <div className={styles.field}>
                        <label>Размеры</label>
                        <div className={styles.sizeCategoriesGrid}>
                            {Object.entries(SIZE_CATEGORIES).map(([key, category]) => (
                                <div key={key} className={styles.sizeCategory}>
                                    <span className={styles.sizeCategoryLabel}>{category.label}</span>
                                    <div className={styles.sizesGrid}>
                                        {category.sizes.map((size) => (
                                            <button
                                                key={size}
                                                type="button"
                                                className={`${styles.sizeBtn} ${
                                                    formData.sizes.includes(size) ? styles.sizeActive : ""
                                                }`}
                                                onClick={() => handleSizeToggle(size)}>
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label>Изображения</label>

                        {/* Превью загруженных изображений */}
                        {imagePreviews.length > 0 && (
                            <div className={styles.imagePreviewGrid}>
                                {imagePreviews.map((preview, index) => (
                                    <div
                                        key={index}
                                        className={`${styles.imagePreviewItem} ${
                                            preview.isPrimary ? styles.primaryImage : ""
                                        }`}>
                                        <img
                                            src={preview.url}
                                            alt={`Изображение ${index + 1}`}
                                            onError={(e) => {
                                                e.target.src = "/images/placeholder.jpg"
                                            }}
                                        />
                                        <div className={styles.imageActions}>
                                            {!preview.isPrimary && (
                                                <button
                                                    type="button"
                                                    className={styles.setPrimaryBtn}
                                                    onClick={() => setAsPrimary(index)}
                                                    title="Сделать главным">
                                                    <StarOutlined />
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                className={styles.removeImageBtn}
                                                onClick={() => removeImage(index)}
                                                title="Удалить">
                                                <DeleteOutlined />
                                            </button>
                                        </div>
                                        {preview.isPrimary && (
                                            <span className={styles.primaryBadge}>
                                                <StarFilled /> Главное
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Кнопка загрузки */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileSelect}
                            style={{ display: "none" }}
                            id="image-upload"
                        />
                        <button
                            type="button"
                            className={styles.uploadBtn}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingImages}>
                            <UploadOutlined />
                            {uploadingImages ? "Загрузка..." : "Загрузить изображения"}
                        </button>
                        <p className={styles.uploadHint}>
                            Поддерживаются форматы: JPG, PNG, WebP. Максимум 5MB на файл. Нажмите ★ чтобы
                            сделать изображение главным.
                        </p>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" className={styles.cancelBtn} onClick={() => onClose(false)}>
                            Отмена
                        </button>
                        <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                            {isLoading ? "Сохранение..." : isEditing ? "Сохранить" : "Создать"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
