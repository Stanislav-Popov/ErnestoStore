/** @format */

import styles from "./button.module.css"

// variants: primary, secondary, tertiary
// sizes: small, medium, large

export default function Button({
    id,
    children,
    onClick,
    disabled = false,
    size = "medium",
    variant = "primary",
    type = "button",
    className = "",
}) {
    const classes = `${styles.button} ${styles[size] ?? ""} ${styles[variant] ?? ""} ${className}`.trim()

    return (
        <button key={id} type={type} onClick={onClick} disabled={disabled} className={classes}>
            {children}
        </button>
    )
}
