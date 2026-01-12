"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { PageLoader } from "@/components/ui/page-loader"

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    const [isAuthorized, setIsAuthorized] = useState(false)

    useEffect(() => {
        if (isLoading) return

        const isLoginPage = pathname === "/login"

        if (!user && !isLoginPage) {
            router.push("/login")
        } else if (user && isLoginPage) {
            router.push("/admin")
        } else {
            setIsAuthorized(true)
        }
    }, [user, isLoading, pathname, router])

    if (isLoading || (!isAuthorized && pathname !== "/login")) {
        return <PageLoader message="Authenticating..." />
    }

    return <>{children}</>
}
