/** @format */

import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import styles from "./AdminLayout.module.css"
import {
    DashboardOutlined,
    ShoppingOutlined,
    TagsOutlined,
    LogoutOutlined,
    MenuOutlined,
    CloseOutlined,
} from "@ant-design/icons"
import { useState } from "react"

export default function AdminLayout() {
    const { admin, logout } = useAuth()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const handleLogout = () => {
        logout()
        navigate("/admin/login")
    }

    const menuItems = [
        { path: "/admin", icon: <DashboardOutlined />, label: "Дашборд", end: true },
        { path: "/admin/products", icon: <ShoppingOutlined />, label: "Товары" },
        { path: "/admin/references", icon: <TagsOutlined />, label: "Справочники" },
    ]

    return (
        <div className={styles.layout}>
            {/* Overlay для мобильного */}
            {sidebarOpen && (
                <div 
                    className={styles.overlay} 
                    onClick={() => setSidebarOpen(false)} 
                />
            )}

            {/* Сайдбар */}
            <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
                <div className={styles.sidebarHeader}>
                    <h2 className={styles.logo}>EK Admin</h2>
                    <button 
                        className={styles.closeBtn}
                        onClick={() => setSidebarOpen(false)}
                    >
                        <CloseOutlined />
                    </button>
                </div>

                <nav className={styles.nav}>
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            className={({ isActive }) =>
                                `${styles.navItem} ${isActive ? styles.navItemActive : ""}`
                            }
                            onClick={() => setSidebarOpen(false)}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            <span className={styles.navLabel}>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.adminInfo}>
                        <div className={styles.adminAvatar}>
                            {admin?.username?.charAt(0).toUpperCase()}
                        </div>
                        <span className={styles.adminName}>{admin?.username}</span>
                    </div>
                    <button className={styles.logoutBtn} onClick={handleLogout}>
                        <LogoutOutlined />
                        <span>Выйти</span>
                    </button>
                </div>
            </aside>

            {/* Основной контент */}
            <div className={styles.main}>
                <header className={styles.header}>
                    <button 
                        className={styles.menuBtn}
                        onClick={() => setSidebarOpen(true)}
                    >
                        <MenuOutlined />
                    </button>
                    <a href="/" className={styles.storeLink} target="_blank">
                        Открыть магазин ↗
                    </a>
                </header>

                <main className={styles.content}>
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
