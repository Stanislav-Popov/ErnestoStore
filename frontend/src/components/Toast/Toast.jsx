/** @format */

import { createContext, useContext, useState, useCallback } from "react"
import styles from "./toast.module.css"
import { CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined, CloseOutlined } from "@ant-design/icons"

const ToastContext = createContext()

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const addToast = useCallback((message, type = "info", duration = 3000) => {
        const id = Date.now() + Math.random()
        
        setToasts((prev) => [...prev, { id, message, type }])

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id)
            }, duration)
        }

        return id
    }, [])

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, [])

    const success = useCallback((message, duration) => addToast(message, "success", duration), [addToast])
    const error = useCallback((message, duration) => addToast(message, "error", duration), [addToast])
    const info = useCallback((message, duration) => addToast(message, "info", duration), [addToast])

    return (
        <ToastContext.Provider value={{ addToast, removeToast, success, error, info }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    )
}

function ToastContainer({ toasts, removeToast }) {
    if (toasts.length === 0) return null

    return (
        <div className={styles.container}>
            {toasts.map((toast) => (
                <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    )
}

function Toast({ toast, onClose }) {
    const icons = {
        success: <CheckCircleOutlined />,
        error: <CloseCircleOutlined />,
        info: <InfoCircleOutlined />,
    }

    return (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
            <span className={styles.icon}>{icons[toast.type]}</span>
            <span className={styles.message}>{toast.message}</span>
            <button className={styles.closeBtn} onClick={onClose}>
                <CloseOutlined />
            </button>
        </div>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error("useToast must be used within ToastProvider")
    }
    return context
}

export default ToastProvider