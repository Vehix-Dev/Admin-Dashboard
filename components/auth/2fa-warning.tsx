"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Shield, X } from "lucide-react"

export function TwoFAWarning() {
    const router = useRouter()
    const pathname = usePathname()
    const [isVisible, setIsVisible] = useState(false)
    const [isDismissed, setIsDismissed] = useState(false)

    useEffect(() => {
        // Check if 2FA is enabled
        const userData = localStorage.getItem('admin_user_data')
        if (!userData) return

        const user = JSON.parse(userData)

        // Skip check on my-account page and login page
        if (pathname === '/sys-admin/my-account' || pathname === '/login') {
            setIsVisible(false)
            return
        }

        // Show warning if 2FA is not enabled
        if (user.two_factor_enabled === false || user.two_factor_enabled === undefined) {
            setIsVisible(true)
            setIsDismissed(false)
        } else {
            setIsVisible(false)
        }
    }, [pathname])

    const handleEnable2FA = () => {
        router.push('/sys-admin/my-account')
    }

    const handleDismiss = () => {
        setIsDismissed(true)
        // Auto-show again after 5 seconds
        setTimeout(() => {
            setIsDismissed(false)
        }, 5000)
    }

    if (!isVisible || isDismissed) return null

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white p-4 shadow-lg animate-in slide-in-from-top">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <AlertTriangle className="h-6 w-6 animate-pulse" />
                    <div>
                        <p className="font-bold text-lg">
                            Security Alert: 2FA Required
                        </p>
                        <p className="text-sm text-red-100">
                            Your account will be deactivated if you don't enable Two-Factor Authentication. 
                            You must enable 2FA to continue using the system.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleEnable2FA}
                        className="bg-white text-red-600 hover:bg-red-50 font-bold"
                    >
                        <Shield className="h-4 w-4 mr-2" />
                        Enable 2FA Now
                    </Button>
                    <Button
                        onClick={handleDismiss}
                        variant="ghost"
                        className="text-white hover:bg-red-700"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
