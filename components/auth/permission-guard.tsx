"use client"

import { ReactNode } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Permission } from '@/lib/permissions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface PermissionGuardProps {
    children: ReactNode
    permissions: Permission | Permission[]
    fallback?: ReactNode
    requireAll?: boolean
}

export function PermissionGuard({
    children,
    permissions,
    fallback,
    requireAll = false
}: PermissionGuardProps) {
    const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = useAuth()

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        )
    }

    const permissionArray = Array.isArray(permissions) ? permissions : [permissions]

    let hasAccess = false
    if (requireAll) {
        hasAccess = hasAllPermissions(permissionArray)
    } else {
        hasAccess = hasAnyPermission(permissionArray)
    }

    if (!hasAccess) {
        if (fallback) {
            return <>{fallback}</>
        }

        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    You don't have permission to access this content.
                </AlertDescription>
            </Alert>
        )
    }

    return <>{children}</>
}

// Hooks for conditional rendering
export function useCan(permissions: Permission | Permission[], requireAll = false) {
    const { hasAnyPermission, hasAllPermissions } = useAuth()
    const permissionArray = Array.isArray(permissions) ? permissions : [permissions]

    if (requireAll) {
        return hasAllPermissions(permissionArray)
    }
    return hasAnyPermission(permissionArray)
}

// Button with permission check
import { Button, ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PermissionButtonProps extends ButtonProps {
    children?: ReactNode
    permissions: Permission | Permission[]
    requireAll?: boolean
    className?: string
}

export function PermissionButton({
    children,
    permissions,
    requireAll = false,
    className,
    ...props
}: PermissionButtonProps) {
    const can = useCan(permissions, requireAll)

    if (!can) return null

    return (
        <Button className={cn(className)} {...props}>
            {children}
        </Button>
    )
}

// Link with permission check
import Link from 'next/link'

interface PermissionLinkProps {
    children: ReactNode
    href: string
    permissions: Permission | Permission[]
    requireAll?: boolean
    className?: string
}

export function PermissionLink({
    children,
    href,
    permissions,
    requireAll = false,
    className
}: PermissionLinkProps) {
    const can = useCan(permissions, requireAll)

    if (!can) return null

    return (
        <Link href={href} className={className}>
            {children}
        </Link>
    )
}