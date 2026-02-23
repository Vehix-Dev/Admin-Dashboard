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
import { CommandCenter } from "@/components/global/command-center"
import { AdminMessenger } from "@/components/global/admin-messenger"

// Map routes to required permissions
const ROUTE_PERMISSIONS: Record<string, string> = {
  "/sys-admin/requests": PERMISSIONS.REQUESTS_VIEW,
  "/sys-admin/riders": PERMISSIONS.RIDERS_VIEW,
  "/sys-admin/roadies": PERMISSIONS.ROADIES_VIEW,
  "/sys-admin/services": PERMISSIONS.SERVICES_VIEW,
  "/sys-admin/wallet": PERMISSIONS.WALLET_VIEW,
  "/sys-admin/referrals": PERMISSIONS.REFERRALS_VIEW,
  "/sys-admin/users": PERMISSIONS.ADMIN_USERS_VIEW,
  "/sys-admin/moderation": PERMISSIONS.MEDIA_VIEW,
  "/sys-admin/notifications": PERMISSIONS.NOTIFICATIONS_VIEW,
  "/sys-admin/reports": PERMISSIONS.REPORTS_VIEW,
  "/sys-admin/support": PERMISSIONS.SUPPORT_VIEW,
  "/sys-admin/settings": PERMISSIONS.SETTINGS_VIEW,
  "/sys-admin/live-map": PERMISSIONS.MAP_VIEW,
  "/sys-admin/rodie-services": PERMISSIONS.RODIE_SERVICES_VIEW,
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isLoading: authLoading, user, sidebarOpen, hasPermission } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (authLoading || !user) return

    // Check authorization for current path
    const requiredPermission = Object.entries(ROUTE_PERMISSIONS).find(([path]) =>
      pathname === path || pathname.startsWith(path + '/')
    )?.[1]

    if (requiredPermission && !hasPermission(requiredPermission as any)) {
      // Allow access to dashboard and unauthorized page always
      if (pathname !== "/sys-admin" && pathname !== "/sys-admin/unauthorized") {
        router.push('/sys-admin/unauthorized')
      }
    }
  }, [authLoading, user, router, pathname, hasPermission])

  if (authLoading) {
    return <PageLoader message="Verifying credentials..." />
  }

  // If user is null, AuthGuard in RootLayout will handle redirect to /login
  if (!user) return null

  return (
    <div className="flex h-screen overflow-hidden">
      <TwoFactorWarning />
      <CommandCenter />
      <AdminMessenger />
      <AdminSidebar />
      <div
        className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? 'pl-64' : 'pl-19'
          }`}
      >
        <AdminHeader />
        <main className="flex-1 overflow-y-auto bg-transparent p-6 animate-in-fade">{children}</main>
      </div>
    </div>
  )
}
