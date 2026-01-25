"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminHeader } from "@/components/admin-header"
import { getAuthToken } from "@/lib/auth"
import { useAuth } from "@/contexts/auth-context"
import { PageLoader } from "@/components/ui/page-loader"
import { PERMISSIONS } from "@/lib/permissions"
import { TwoFactorWarning } from "@/components/auth/two-factor-warning"

// Map routes to required permissions
const ROUTE_PERMISSIONS: Record<string, string> = {
  "/admin/requests": PERMISSIONS.REQUESTS_VIEW,
  "/admin/riders": PERMISSIONS.RIDERS_VIEW,
  "/admin/roadies": PERMISSIONS.ROADIES_VIEW,
  "/admin/services": PERMISSIONS.SERVICES_VIEW,
  "/admin/wallet": PERMISSIONS.WALLET_VIEW,
  "/admin/referrals": PERMISSIONS.REFERRALS_VIEW,
  "/admin/users": PERMISSIONS.ADMIN_USERS_VIEW,
  "/admin/moderation": PERMISSIONS.MEDIA_VIEW,
  "/admin/notifications": PERMISSIONS.NOTIFICATIONS_VIEW,
  "/admin/reports": PERMISSIONS.REPORTS_VIEW,
  "/admin/support": PERMISSIONS.SUPPORT_VIEW,
  "/admin/settings": PERMISSIONS.SETTINGS_VIEW,
  "/admin/live-map": PERMISSIONS.MAP_VIEW,
  "/admin/rodie-services": PERMISSIONS.RODIE_SERVICES_VIEW,
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isLoading: authLoading, user, sidebarOpen, hasPermission } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // If auth context is still loading, wait
    if (authLoading) return

    // Check for valid token
    const token = getAuthToken()

    if (!token || !user) {
      // Redirect to login if not authenticated
      router.push('/login')
      return
    }

    setIsAuthenticated(true)

    // Check authorization for current path
    const requiredPermission = Object.entries(ROUTE_PERMISSIONS).find(([path]) =>
      pathname === path || pathname.startsWith(path + '/')
    )?.[1]

    if (requiredPermission && !hasPermission(requiredPermission as any)) {
      // Allow access to dashboard and unauthorized page always
      if (pathname !== "/admin" && pathname !== "/admin/unauthorized") {
        router.push('/admin/unauthorized')
        return
      }
    }

    setIsAuthorized(true)
    setIsLoading(false)
  }, [authLoading, user, router, pathname, hasPermission])

  if (isLoading || authLoading || !isAuthenticated || !isAuthorized) {
    return <PageLoader message="Verifying access..." />
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <TwoFactorWarning />
      <AdminSidebar />
      <div
        className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? 'pl-64' : 'pl-19'
          }`}
      >
        <AdminHeader />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">{children}</main>
      </div>
    </div>
  )
}
