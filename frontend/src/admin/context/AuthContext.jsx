/** @format */

import { createContext, useState, useEffect, useContext } from "react"
import { API_URL } from "../../config/api"

const AuthContext = createContext()

export function AuthProvider({ children }) {
    const [admin, setAdmin] = useState(null)
    const [token, setToken] = useState(() => localStorage.getItem("adminToken"))
    const [isLoading, setIsLoading] = useState(true)

    // Проверяем токен при загрузке
    useEffect(() => {
        if (token) {
            verifyToken()
        } else {
            setIsLoading(false)
        }
    }, [])

    const verifyToken = async () => {
        try {
            const response = await fetch(`${API_URL}/admin/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (response.ok) {
                const data = await response.json()
                setAdmin(data.admin)
            } else {
                // Токен невалидный
                logout()
            }
        } catch (error) {
            console.error("Ошибка проверки токена:", error)
            logout()
        } finally {
            setIsLoading(false)
        }
    }

    const login = async (username, password) => {
        try {
            const response = await fetch(`${API_URL}/admin/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Ошибка входа")
            }

            localStorage.setItem("adminToken", data.token)
            setToken(data.token)
            setAdmin(data.admin)

            return { success: true }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    const logout = () => {
        localStorage.removeItem("adminToken")
        setToken(null)
        setAdmin(null)
    }

    const isAuthenticated = !!admin

    return (
        <AuthContext.Provider
            value={{
                admin,
                token,
                isLoading,
                isAuthenticated,
                login,
                logout,
            }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider")
    }
    return context
}
