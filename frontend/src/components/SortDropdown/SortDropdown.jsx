/** @format */

import { useState, useRef, useEffect } from "react"
import styles from "./sortDropdown.module.css"
import {
    ArrowUpOutlined,
    ArrowDownOutlined,
    StarOutlined,
    FireOutlined,
    DownOutlined,
} from "@ant-design/icons"

const items = [
    { label: "Новое", value: "new", icon: <StarOutlined /> },
    { label: "Популярное", value: "popular", icon: <FireOutlined /> },
    { label: "Дороже", value: "expensive", icon: <ArrowUpOutlined /> },
    { label: "Дешевле", value: "cheap", icon: <ArrowDownOutlined /> },
]

export default function SortDropdown({ value, onChange }) {
    const [open, setOpen] = useState(false)
    const dropdownRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false)
            }
        }
        document.addEventListener("click", handleClickOutside)
        return () => document.removeEventListener("click", handleClickOutside)
    }, [])

    const selected = items.find((i) => i.value === value) || items[0]

    const handleSelect = (item) => {
        onChange?.(item.value)
        setOpen(false)
    }

    return (
        <div className={styles.dropdown} ref={dropdownRef}>
            <button className={styles.button} onClick={() => setOpen(!open)}>
                <span className={styles.icon}>{selected.icon}</span>
                <span>{selected.label}</span>
                <DownOutlined className={`${styles.arrow} ${open ? styles.arrowOpen : ""}`} />
            </button>

            {open && (
                <ul className={styles.menu}>
                    {items.map((item) => (
                        <li
                            key={item.value}
                            className={`${styles.menuItem} ${
                                item.value === selected.value ? styles.active : ""
                            }`}
                            onClick={() => handleSelect(item)}>
                            {item.icon}
                            <span>{item.label}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
