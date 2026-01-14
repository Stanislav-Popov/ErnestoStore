/** @format */

import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import styles from "./mobileFilterDrawer.module.css"
import { CloseOutlined } from "@ant-design/icons"
import { useBodyScrollLock } from "../../hooks/useInfiniteScroll"

/**
 * Drawer для мобильных фильтров
 * 
 * @param {boolean} isOpen - Открыт ли drawer
 * @param {function} onClose - Callback закрытия
 * @param {string} title - Заголовок
 * @param {ReactNode} children - Содержимое
 * @param {ReactNode} footer - Футер с кнопками
 */
export default function MobileFilterDrawer({
    isOpen,
    onClose,
    title = "Фильтры",
    children,
    footer,
}) {
    const drawerRef = useRef(null)

    // Блокируем скролл body когда drawer открыт
    useBodyScrollLock(isOpen)

    // Закрытие по Escape
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape") {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener("keydown", handleEscape)
        }

        return () => document.removeEventListener("keydown", handleEscape)
    }, [isOpen, onClose])

    // Закрытие по клику на overlay
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    // Обработка свайпа для закрытия
    useEffect(() => {
        if (!isOpen || !drawerRef.current) return

        let startY = 0
        let startX = 0
        const drawer = drawerRef.current

        const handleTouchStart = (e) => {
            startY = e.touches[0].clientY
            startX = e.touches[0].clientX
        }

        const handleTouchEnd = (e) => {
            const endY = e.changedTouches[0].clientY
            const endX = e.changedTouches[0].clientX
            const diffY = endY - startY
            const diffX = Math.abs(endX - startX)

            // Свайп вниз (>100px) и не горизонтальный
            if (diffY > 100 && diffX < 50) {
                onClose()
            }
        }

        drawer.addEventListener("touchstart", handleTouchStart)
        drawer.addEventListener("touchend", handleTouchEnd)

        return () => {
            drawer.removeEventListener("touchstart", handleTouchStart)
            drawer.removeEventListener("touchend", handleTouchEnd)
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    return createPortal(
        <div className={styles.overlay} onClick={handleOverlayClick}>
            <div 
                ref={drawerRef}
                className={`${styles.drawer} ${isOpen ? styles.open : ""}`}
            >
                {/* Индикатор свайпа */}
                <div className={styles.swipeIndicator}>
                    <div className={styles.swipeBar} />
                </div>

                {/* Header */}
                <div className={styles.header}>
                    <h2 className={styles.title}>{title}</h2>
                    <button 
                        className={styles.closeBtn} 
                        onClick={onClose}
                        aria-label="Закрыть"
                    >
                        <CloseOutlined />
                    </button>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className={styles.footer}>
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    )
}