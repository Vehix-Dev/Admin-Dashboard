// /components/auth/protected-route.tsx
"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Loader2 } from 'lucide-react'
import { PERMISSIONS, Permission } from '@/lib/permissions'

interface ProtectedRouteProps {
    children: React.ReactNode
    requiredPermissions?: Permission | Permission[]
    requireAll?: boolean
    redirectTo?: string
}

export default function ProtectedRoute({
    children,
    requiredPermissions,
    requireAll = false,
    redirectTo = '/login'
}: ProtectedRouteProps) {
    const { user, isLoading, hasAnyPermission, hasAllPermissions } = useAuth()
    const router = useRouter()

    useEffect(() => {
        // Enable auto-redirect for unauthenticated users
        if (!isLoading && !user) {
            router.push(redirectTo)
            return
        }

        if (!isLoading && user && requiredPermissions) {
            const permissionArray = Array.isArray(requiredPermissions)
                ? requiredPermissions
                : [requiredPermissions]

            let hasAccess = false
            if (requireAll) {
                hasAccess = hasAllPermissions(permissionArray)
            } else {
                hasAccess = hasAnyPermission(permissionArray)
            }

            if (!hasAccess) {
                router.push('/admin/unauthorized')
            }
        }
    }, [user, isLoading, router, requiredPermissions, requireAll, redirectTo, hasAnyPermission, hasAllPermissions])

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        // Show loading while redirecting
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground">Redirecting to login...</p>
                </div>
            </div>
        )
    }

    // Check permissions if required
    if (requiredPermissions) {
        const permissionArray = Array.isArray(requiredPermissions)
            ? requiredPermissions
            : [requiredPermissions]

        let hasAccess = false
        if (requireAll) {
            hasAccess = hasAllPermissions(permissionArray)
        } else {
            hasAccess = hasAnyPermission(permissionArray)
        }

        if (!hasAccess) {
            return (
                <div className="flex min-h-screen items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
                        <p className="text-muted-foreground">
                            You don't have permission to access this page.
                        </p>
                    </div>
                </div>
            )
        }
    }

    return <>{children}</>
}