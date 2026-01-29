"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { PageLoader } from "@/components/ui/page-loader"

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    const isLoginPage = pathname === "/login"

    useEffect(() => {
        if (isLoading) return

        if (!user && !isLoginPage) {
            router.push("/login")
        } else if (user && isLoginPage) {
            router.push("/admin")
        }
    }, [user, isLoading, isLoginPage, router])

    if (isLoading) {
        return <PageLoader message="Secure Authentication..." />
    }

    // Prevent flash of protected content during transition
    if (!user && !isLoginPage) {
        return <PageLoader message="Access verification required..." />
    }

    if (user && isLoginPage) {
        return <PageLoader message="Entering Command Center..." />
    }

    return <>{children}</>
}
