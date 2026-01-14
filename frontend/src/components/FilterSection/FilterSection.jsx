/** @format */

import { useState, useRef, useEffect } from "react"
import styles from "./filterSection.module.css"
import { DownOutlined } from "@ant-design/icons"

export default function FilterSection({ title, children, defaultOpen = false, resetKey }) {
    const [open, setOpen] = useState(defaultOpen)
    const [height, setHeight] = useState("0px")
    const contentRef = useRef(null)

    useEffect(() => {
        if (contentRef.current) {
            setHeight(open ? `${contentRef.current.scrollHeight}px` : "0px")
        }
    }, [open])

    useEffect(() => {
        setOpen(defaultOpen)
    }, [resetKey, defaultOpen])

    return (
        <div className={!open ? styles.border : ""}>
            <button className={styles.sectionHeader} onClick={() => setOpen((prev) => !prev)}>
                <span>{title}</span>
                <DownOutlined className={`${styles.arrow} ${open ? styles.arrowOpen : ""}`} />
            </button>

            <div
                ref={contentRef}
                className={`${styles.animatedWrapper} ${open ? styles.open : ""}`}
                style={{ maxHeight: height }}>
                <div className={styles.sectionContent}>{children}</div>
            </div>
        </div>
    )
}
