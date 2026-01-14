/** @format */
import MainPage from "./pages/MainPage"
import CatalogPage from "./pages/CatalogPage"
import ProductPage from "./pages/ProductPage"
import AboutPage from "./pages/AboutPage"
import FavoritesPage from "./pages/FavoritesPage"
import PrivacyPage from "./pages/PrivacyPage"
import NotFoundPage from "./pages/NotFoundPage"
import AppHeader from "./components/AppHeader"
import Footer from "./components/Footer/Footer"
import CookieConsent from "./components/CookieConsent/CookieConsent"
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"
import { FavoritesProvider } from "./context/FavoritesСontext"

// Admin imports
import { AuthProvider } from "./admin/context/AuthContext"
import ProtectedRoute from "./admin/components/ProtectedRoute"
import AdminLayout from "./admin/components/AdminLayout"
import LoginPage from "./admin/pages/LoginPage"
import DashboardPage from "./admin/pages/DashboardPage"
import ProductsPage from "./admin/pages/ProductsPage"
import ReferencesPage from "./admin/pages/ReferencesPage"

// Компонент для условного отображения хедера и футера
function Layout({ children }) {
    const location = useLocation()
    const isAdminRoute = location.pathname.startsWith("/admin")

    return (
        <>
            {!isAdminRoute && <AppHeader />}
            <main style={{ minHeight: isAdminRoute ? "100vh" : "calc(100vh - 80px - 200px)" }}>
                {children}
            </main>
            {!isAdminRoute && <Footer />}
            {!isAdminRoute && <CookieConsent />}
        </>
    )
}

function AppRoutes() {
    return (
        <Layout>
            <Routes>
                {/* Public routes */}
                <Route path="/" element={<MainPage />} />
                <Route path="/catalog" element={<CatalogPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/product/:id" element={<ProductPage />} />

                {/* Admin routes */}
                <Route path="/admin/login" element={<LoginPage />} />
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute>
                            <AdminLayout />
                        </ProtectedRoute>
                    }>
                    <Route index element={<DashboardPage />} />
                    <Route path="products" element={<ProductsPage />} />
                    <Route path="references" element={<ReferencesPage />} />
                </Route>

                {/* 404 - должен быть последним */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </Layout>
    )
}

function App() {
    return (
        <FavoritesProvider>
            <AuthProvider>
                <BrowserRouter>
                    <AppRoutes />
                </BrowserRouter>
            </AuthProvider>
        </FavoritesProvider>
    )
}

export default App
