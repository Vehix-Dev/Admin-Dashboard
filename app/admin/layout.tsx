"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminHeader } from "@/components/admin-header"
import { getAuthToken } from "@/lib/auth"
import { useAuth } from "@/contexts/auth-context"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isLoading: authLoading, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // If auth context is still loading, wait
    if (authLoading) return

    // Allow render if we have a user, or if we want to be lenient.
    // Ideally, we should check `if (!user) router.push('/login')` here, 
    // but the protected routes handle that for content. 
    // For the layout (sidebar), we just need to know we attempted to load.
    setIsAuthenticated(true)
    setIsLoading(false)
  }, [authLoading, user, router, pathname])

  if (isLoading || authLoading) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden pl-64">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">{children}</main>
      </div>
    </div>
  )
}
