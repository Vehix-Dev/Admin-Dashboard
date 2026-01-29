"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

export function TwoFactorWarning() {
    const { user } = useAuth()
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        if (!user?.username) {
            setIsVisible(false)
            return
        }

        const check2FAStatus = async () => {
            try {
                // Fetch fresh status from the specific endpoint
                const response = await fetch(`/api/auth/2fa/status?username=${user.username}`)
                if (response.ok) {
                    const data = await response.json()

                    // Show warning if 2FA is explicitly disabled (false)
                    if (data.enabled === false) {
                        setIsVisible(true)

                        // Auto-hide after 10 seconds
                        const timer = setTimeout(() => {
                            setIsVisible(false)
                        }, 10000)

                        return () => clearTimeout(timer)
                    } else {
                        setIsVisible(false)
                    }
                }
            } catch (error) {
                console.error("Failed to check 2FA status for warning:", error)
            }
        }

        check2FAStatus()
    }, [user?.username])

    // Re-check periodically or on window focus could be added here if needed
    // For now, we rely on the initial check when the component mounts/user changes

    if (!isVisible) return null

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="w-full max-w-lg mx-4"
                    >
                        <div className="bg-destructive text-destructive-foreground p-8 rounded-xl shadow-2xl flex flex-col items-center text-center gap-6 border-2 border-red-600/20 relative overflow-hidden">
                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-black/10 rounded-full blur-2xl" />

                            <div className="p-4 bg-white/10 rounded-full ring-4 ring-white/5">
                                <AlertTriangle className="h-12 w-12" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-bold text-2xl tracking-tight">Security Warning</h3>
                                <p className="text-base opacity-90 leading-relaxed">
                                    Your account will be deactivated if 2FA is not enabled. Please enable Two-Factor Authentication immediately to secure your account.
                                </p>
                            </div>

                            <div className="w-full h-1 bg-black/10 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-white/50"
                                    initial={{ width: "100%" }}
                                    animate={{ width: "0%" }}
                                    transition={{ duration: 10, ease: "linear" }}
                                />
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-4 right-4 text-destructive-foreground hover:bg-white/10"
                                onClick={() => setIsVisible(false)}
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
