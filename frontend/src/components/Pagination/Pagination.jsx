/** @format */
import styles from "./pagination.module.css"

export default function Pagination({ currentPage, totalPages, setCurrentPage }) {
    const PAGESTOSHOW = 3 // Сколько страниц отображается до ...

    let startPage = Math.max(1, currentPage - Math.floor(PAGESTOSHOW / 2))
    let endPage = startPage + PAGESTOSHOW - 1

    if (endPage > totalPages) {
        endPage = totalPages
        startPage = Math.max(1, endPage - PAGESTOSHOW + 1)
    }

    const pagesNumbers = []
    for (let i = startPage; i <= endPage; i++) {
        pagesNumbers.push(i)
    }

    return (
        <div className={styles.pagination}>
            <button
                className={styles.pageButton}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}>
                ←
            </button>

            {startPage > 1 && (
                <>
                    <button className={styles.pageButton} onClick={() => setCurrentPage(1)}>
                        1
                    </button>
                    {startPage > 2 && <span className={styles.ellipsis}>...</span>}
                </>
            )}

            {pagesNumbers.map((num) => (
                <button
                    key={num}
                    onClick={() => setCurrentPage(num)}
                    className={`${styles.pageButton} ${num === currentPage ? styles.active : ""}`}>
                    {num}
                </button>
            ))}

            {endPage < totalPages && (
                <>
                    {endPage < totalPages - 1 && <span className={styles.ellipsis}>…</span>}
                    <button className={styles.pageButton} onClick={() => setCurrentPage(totalPages)}>
                        {totalPages}
                    </button>
                </>
            )}

            <button
                className={styles.pageButton}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}>
                →
            </button>
        </div>
    )
}
