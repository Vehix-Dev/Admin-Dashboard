"use client"

import { useEffect, useState, Suspense } from "react"
import { usePathname, useSearchParams } from "next/navigation"

function ProgressBarContent() {
    const [isLoading, setIsLoading] = useState(false)
    const pathname = usePathname()
    const searchParams = useSearchParams()

    useEffect(() => {
        setIsLoading(true)
        const timeout = setTimeout(() => setIsLoading(false), 1000)
        return () => clearTimeout(timeout)
    }, [pathname, searchParams])

    if (!isLoading) return null

    return <div className="top-progress-bar" />
}

export function TopProgressBar() {
    return (
        <Suspense fallback={null}>
            <ProgressBarContent />
        </Suspense>
    )
}
