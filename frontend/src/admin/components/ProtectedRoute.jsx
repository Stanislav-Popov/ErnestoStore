/** @format */

import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function ProtectedRoute({ children }) {
    const { isAuthenticated, isLoading } = useAuth()
    const location = useLocation()

    if (isLoading) {
        return (
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
                background: "#f5f5f5"
            }}>
                <div style={{
                    textAlign: "center",
                    color: "#666"
                }}>
                    <div style={{
                        width: "40px",
                        height: "40px",
                        border: "3px solid #e0e0e0",
                        borderTopColor: "#1a1a2e",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                        margin: "0 auto 16px"
                    }} />
                    Загрузка...
                </div>
                <style>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        )
    }

    if (!isAuthenticated) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />
    }

    return children
}
