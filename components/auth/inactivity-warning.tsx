"use client"

import { useEffect, useState } from "react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Clock, LogOut } from "lucide-react"

interface InactivityWarningProps {
    open: boolean
    remainingSeconds: number
    onStayLoggedIn: () => void
    onLogout: () => void
}

export function InactivityWarning({
    open,
    remainingSeconds,
    onStayLoggedIn,
    onLogout,
}: InactivityWarningProps) {
    const [countdown, setCountdown] = useState(remainingSeconds)

    useEffect(() => {
        setCountdown(remainingSeconds)
    }, [remainingSeconds])

    useEffect(() => {
        if (!open) return

        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval)
                    onLogout()
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [open, onLogout])

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    return (
        <AlertDialog open={open}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                            <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400 animate-pulse" />
                        </div>
                        <AlertDialogTitle className="text-xl">Session Timeout Warning</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-base space-y-3">
                        <p>
                            You've been inactive for a while. For security reasons, you'll be automatically logged out in:
                        </p>
                        <div className="flex items-center justify-center py-4">
                            <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 tabular-nums">
                                {formatTime(countdown)}
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Click "Stay Logged In" to continue your session, or you'll be logged out automatically.
                        </p>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2 sm:gap-0">
                    <AlertDialogCancel onClick={onLogout} className="gap-2">
                        <LogOut className="h-4 w-4" />
                        Logout Now
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={onStayLoggedIn} className="gap-2">
                        <Clock className="h-4 w-4" />
                        Stay Logged In
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
