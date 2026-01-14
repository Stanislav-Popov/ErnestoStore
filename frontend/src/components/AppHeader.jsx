/** @format */

import { useState, useEffect } from "react"
import styles from "../styles/appHeader.module.css"
import SearchInput from "./SearchInput/SearchInput"
import SearchModal from "./SearchModal/SearchModal"
import { NavLink, useNavigate, useLocation } from "react-router-dom"
import { SearchOutlined, HeartOutlined, HeartFilled, MenuOutlined, CloseOutlined } from "@ant-design/icons"
import { useFavorites } from "../context/FavoritesContext"
import { API_URL } from "../config/api"

export default function AppHeader() {
    const navigate = useNavigate()
    const location = useLocation()
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [allProducts, setAllProducts] = useState([])
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
    const { favoritesCount } = useFavorites()

    // Загрузка продуктов из API для поиска
    useEffect(() => {
        fetch(`${API_URL}/products?limit=1000`)
            .then((res) => res.json())
            .then((data) => {
                setAllProducts(data.products || [])
            })
            .catch((err) => console.error("Ошибка загрузки продуктов:", err))
    }, [])

    // Отслеживание размера экрана
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768)
            if (window.innerWidth > 768) {
                setIsMobileMenuOpen(false)
            }
        }
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    // Закрываем мобильное меню при смене роута
    useEffect(() => {
        setIsMobileMenuOpen(false)
    }, [location.pathname])

    // Блокируем скролл при открытом меню
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = ""
        }
        return () => {
            document.body.style.overflow = ""
        }
    }, [isMobileMenuOpen])

    function handleSearch(value) {
        if (value.trim()) {
            navigate(`/catalog?search=${encodeURIComponent(value.trim())}`)
        }
    }

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen)
    }

    return (
        <>
            <header className={styles.headerStyle}>
                <div className={styles.logoSearchBlock}>
                    <NavLink className={styles.logo} to="/">
                        Ernesto Khachatyryan
                    </NavLink>

                    {/* Десктоп поиск */}
                    {!isMobile && (
                        <div className={styles.searchWrapper}>
                            <SearchInput
                                placeholder="Поиск товаров..."
                                onSearch={handleSearch}
                                height="40px"
                                searchOnEnter={true}
                                allProducts={allProducts}
                                showSuggestions={true}
                            />
                        </div>
                    )}
                </div>

                <div className={styles.rightBlock}>
                    {/* Мобильная кнопка поиска */}
                    {isMobile && (
                        <button
                            className={styles.iconButton}
                            onClick={() => setIsSearchModalOpen(true)}
                            aria-label="Открыть поиск">
                            <SearchOutlined className={styles.iconButtonIcon} />
                        </button>
                    )}

                    {/* Избранное */}
                    <NavLink
                        to="/favorites"
                        className={({ isActive }) =>
                            `${styles.iconButton} ${isActive ? styles.iconButtonActive : ""}`
                        }
                        aria-label="Избранное">
                        {favoritesCount > 0 ? (
                            <HeartFilled className={styles.iconButtonIcon} />
                        ) : (
                            <HeartOutlined className={styles.iconButtonIcon} />
                        )}
                        {favoritesCount > 0 && <span className={styles.badge}>{favoritesCount}</span>}
                    </NavLink>

                    {/* Десктоп навигация */}
                    <nav className={styles.navButtonsBlock}>
                        <NavLink
                            className={({ isActive }) =>
                                isActive ? `${styles.navButton} ${styles.active}` : styles.navButton
                            }
                            to="/catalog">
                            Каталог
                        </NavLink>
                        <NavLink
                            className={({ isActive }) =>
                                isActive ? `${styles.navButton} ${styles.active}` : styles.navButton
                            }
                            to="/about">
                            О нас
                        </NavLink>
                    </nav>

                    {/* Burger кнопка для мобильных */}
                    {isMobile && (
                        <button
                            className={styles.burgerButton}
                            onClick={toggleMobileMenu}
                            aria-label={isMobileMenuOpen ? "Закрыть меню" : "Открыть меню"}>
                            {isMobileMenuOpen ? (
                                <CloseOutlined className={styles.burgerIcon} />
                            ) : (
                                <MenuOutlined className={styles.burgerIcon} />
                            )}
                        </button>
                    )}
                </div>
            </header>

            {/* Мобильное меню overlay */}
            {isMobileMenuOpen && (
                <div className={styles.mobileMenuOverlay} onClick={() => setIsMobileMenuOpen(false)} />
            )}

            {/* Мобильное меню */}
            <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.mobileMenuOpen : ""}`}>
                <nav className={styles.mobileNav}>
                    <NavLink
                        to="/"
                        className={({ isActive }) =>
                            `${styles.mobileMenuItem} ${isActive ? styles.mobileMenuItemActive : ""}`
                        }>
                        Главная
                    </NavLink>
                    <NavLink
                        to="/catalog"
                        className={({ isActive }) =>
                            `${styles.mobileMenuItem} ${isActive ? styles.mobileMenuItemActive : ""}`
                        }>
                        Каталог
                    </NavLink>
                    <NavLink
                        to="/favorites"
                        className={({ isActive }) =>
                            `${styles.mobileMenuItem} ${isActive ? styles.mobileMenuItemActive : ""}`
                        }>
                        Избранное
                        {favoritesCount > 0 && (
                            <span className={styles.mobileMenuBadge}>{favoritesCount}</span>
                        )}
                    </NavLink>
                    <NavLink
                        to="/about"
                        className={({ isActive }) =>
                            `${styles.mobileMenuItem} ${isActive ? styles.mobileMenuItemActive : ""}`
                        }>
                        О нас
                    </NavLink>
                </nav>
            </div>

            {/* Модальное окно поиска */}
            <SearchModal
                isOpen={isSearchModalOpen}
                onClose={() => setIsSearchModalOpen(false)}
                allProducts={allProducts}
            />
        </>
    )
}
