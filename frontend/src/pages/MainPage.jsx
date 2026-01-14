/** @format */
import HeroBlock from "../components/HeroBlock/HeroBlock"
import CategoriesBlock from "../components/CategoriesBlock/CategoriesBlock"
import NewArrivalsBlock from "../components/NewArrivalsBlock/NewArrivalsBlock"
import BestSellersBlock from "../components/BestSellersBlock/BestSellersBlock"
import { StoresMapSimple as StoresMap } from "../components/StoresMap/StoresMap"
import { CatalogProvider } from "../context/CatalogContext"
import { useSEO } from "../hooks/useSEO"

export default function MainPage() {
    useSEO({
        title: null, // Используем дефолтный заголовок
        description:
            "Интернет-магазин стильной мужской одежды Ernesto Khachatyryan. Футболки, худи, брюки, верхняя одежда собственного производства.",
        keywords: "мужская одежда, футболки, худи, брюки, верхняя одежда, интернет-магазин",
    })

    return (
        <CatalogProvider>
            <HeroBlock />
            <CategoriesBlock />
            <NewArrivalsBlock />
            <BestSellersBlock />
            <StoresMap />
        </CatalogProvider>
    )
}
