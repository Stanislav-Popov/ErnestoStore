/** @format */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import styles from "./LoginPage.module.css"

export default function LoginPage() {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        const result = await login(username, password)

        if (result.success) {
            navigate("/admin")
        } else {
            setError(result.error)
        }

        setIsLoading(false)
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Админ-панель</h1>
                    <p className={styles.subtitle}>Войдите для управления магазином</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && <div className={styles.error}>{error}</div>}

                    <div className={styles.field}>
                        <label className={styles.label}>Логин</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={styles.input}
                            placeholder="admin"
                            required
                            autoFocus
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Пароль</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={styles.input}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.button}
                        disabled={isLoading}>
                        {isLoading ? "Вход..." : "Войти"}
                    </button>
                </form>

                <div className={styles.footer}>
                    <a href="/" className={styles.backLink}>
                        ← Вернуться в магазин
                    </a>
                </div>
            </div>
        </div>
    )
}
