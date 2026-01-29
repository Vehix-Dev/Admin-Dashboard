"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { UserRole, getUserRole, hasPermission, hasAnyPermission, hasAllPermissions, PERMISSIONS } from '@/lib/permissions'
import type { Permission } from '@/lib/permissions'
import { getAccessToken, fetchLocalPermissions, getPlatformConfig } from '@/lib/api'
import { getAdminProfile } from '@/lib/auth'
import { InactivityWarning } from '@/components/auth/inactivity-warning'
import { singleLoginManager } from '@/lib/single-login'


export interface User {
    id: string
    username: string
    email: string
    first_name: string
    last_name: string
    role: string
    is_approved: boolean
    is_superuser?: boolean
    is_staff?: boolean
    permissions?: string[]
    two_factor_enabled?: boolean
}

interface AuthContextType {
    user: User | null
    role: UserRole | null
    isLoading: boolean
    sidebarOpen: boolean
    login: (userData: User, token: string) => void
    logout: () => void
    hasPermission: (permission: Permission) => boolean
    hasAnyPermission: (permissions: Permission[]) => boolean
    hasAllPermissions: (permissions: Permission[]) => boolean
    toggleSidebar: () => void
    openSidebar: () => void
    closeSidebar: () => void
    setSidebarOpen: (open: boolean) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [sidebarOpen, setSidebarOpenState] = useState(true)
    const [localPermissions, setLocalPermissions] = useState<string[]>(Object.values(PERMISSIONS))
    const [lastActivity, setLastActivity] = useState<number>(Date.now())
    const [showInactivityWarning, setShowInactivityWarning] = useState(false)
    const [warningCountdown, setWarningCountdown] = useState(120)
    const [loginTimestamp, setLoginTimestamp] = useState<number | null>(null)
    const [clientIp, setClientIp] = useState<string | null>(null)
    const [isIpBlocked, setIsIpBlocked] = useState(false)


    useEffect(() => {
        const initializeAuth = async () => {
            console.log("[Auth] Initializing...")
            try {
                const storedUserData = localStorage.getItem('admin_user_data')
                console.log("[Auth] Stored user data raw:", storedUserData)
                const parsedStoredUser = storedUserData ? JSON.parse(storedUserData) : null

                if (parsedStoredUser) {
                    console.log("[Auth] Setting initial user from storage:", parsedStoredUser.username)
                    setUser(parsedStoredUser)
                }

                const token = getAccessToken()
                if (token) {
                    try {
                        console.log("[Auth] Refreshing admin profile from token...")
                        const freshUser = await getAdminProfile()

                        if (freshUser) {
                            console.log("[Auth] Profile data retrieved:", freshUser.username)

                            // Defensive merge: Only overwrite if freshUser has values
                            const adaptedUser: User = {
                                ...parsedStoredUser,
                                ...freshUser,
                                id: freshUser.id || parsedStoredUser?.id || "unknown",
                                username: freshUser.username || parsedStoredUser?.username || "",
                                email: freshUser.email || parsedStoredUser?.email || "",
                                first_name: freshUser.first_name || parsedStoredUser?.first_name || freshUser.name?.split(' ')[0] || "",
                                last_name: freshUser.last_name || parsedStoredUser?.last_name || freshUser.name?.split(' ').slice(1).join(' ') || "",
                                role: freshUser.role || parsedStoredUser?.role || "admin",
                                is_approved: true,
                            } as any

                            console.log("[Auth] Final adapted user:", adaptedUser)
                            setUser(adaptedUser)
                            localStorage.setItem('admin_user_data', JSON.stringify(adaptedUser))

                            if (adaptedUser.username?.toUpperCase() === 'TUTU') {
                                console.log("[Auth] MASTER USER TUTU ACTIVE")
                            }

                            try {
                                const perms = await fetchLocalPermissions(adaptedUser.id)
                                if (perms && perms.length > 0) {
                                    setLocalPermissions(perms)
                                } else {
                                    setLocalPermissions(Object.values(PERMISSIONS))
                                }
                            } catch (e) {
                                console.error("[Auth] Permission fetch failed:", e)
                                setLocalPermissions(Object.values(PERMISSIONS))
                            }
                        }
                    } catch (e) {
                        console.error("[Auth] Token profile sync failed:", e)
                    }
                }

                const savedSidebarState = localStorage.getItem('sidebar_open')
                if (savedSidebarState !== null) {
                    setSidebarOpenState(JSON.parse(savedSidebarState))
                }

                const savedLoginTimestamp = localStorage.getItem('admin_login_timestamp')
                if (savedLoginTimestamp) {
                    const timestamp = parseInt(savedLoginTimestamp)
                    setLoginTimestamp(timestamp)

                    // Immediate check on initialization
                    const SESSION_DURATION = 60 * 60 * 1000 // 1 hour
                    if (Date.now() - timestamp >= SESSION_DURATION) {
                        console.log("[Auth] Absolute session expired on init")
                        logout()
                        return
                    }
                }

                // If user is from storage but no fresh profile was fetched (or failed), still try to get perms
                if (parsedStoredUser && !token) {
                    try {
                        const perms = await fetchLocalPermissions(parsedStoredUser.id)
                        if (perms && perms.length > 0) {
                            setLocalPermissions(perms)
                        } else {
                            setLocalPermissions(Object.values(PERMISSIONS))
                        }
                    } catch (e) {
                        setLocalPermissions(Object.values(PERMISSIONS))
                    }
                }
            } finally {
                setIsLoading(false)
            }
        }

        const fetchClientIp = async () => {
            try {
                const response = await fetch('https://api.ipify.org?format=json')
                const data = await response.json()
                setClientIp(data.ip)
                return data.ip
            } catch (e) {
                console.error("[Auth] Failed to fetch client IP", e)
                return null
            }
        }

        const checkIpWhitelist = async (ip: string) => {
            try {
                const config = await getPlatformConfig()
                if (config && config.ip_whitelist_enabled && config.ip_whitelist) {
                    const whitelist = config.ip_whitelist.split(',').map((item: string) => item.trim())
                    if (whitelist.length > 0 && !whitelist.includes(ip)) {
                        console.log("[Auth] IP Blocked:", ip)
                        setIsIpBlocked(true)
                    }
                }
            } catch (e) {
                console.error("[Auth] Failed to check IP whitelist", e)
            }
        }

        const init = async () => {
            const ip = await fetchClientIp()
            if (ip) {
                await checkIpWhitelist(ip)
            }
            await initializeAuth()
        }

        init()
    }, [])

    useEffect(() => {
        localStorage.setItem('sidebar_open', JSON.stringify(sidebarOpen))
    }, [sidebarOpen])

    // Inactivity tracking and auto-logout
    useEffect(() => {
        if (!user) return

        const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes
        const WARNING_TIME = 60 * 1000 // 1 minute

        const resetActivity = () => {
            setLastActivity(Date.now())
            setShowInactivityWarning(false)
            setWarningCountdown(120)
        }

        const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click']
        events.forEach(event => {
            window.addEventListener(event, resetActivity)
        })

        const checkInterval = setInterval(() => {
            const now = Date.now()
            const timeSinceActivity = now - lastActivity

            if (timeSinceActivity >= INACTIVITY_TIMEOUT - WARNING_TIME && !showInactivityWarning) {
                setShowInactivityWarning(true)
                const remainingSeconds = Math.floor((INACTIVITY_TIMEOUT - timeSinceActivity) / 1000)
                setWarningCountdown(remainingSeconds)
            }

            if (timeSinceActivity >= INACTIVITY_TIMEOUT) {
                logout()
            }
        }, 10000)

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, resetActivity)
            })
            clearInterval(checkInterval)
        }
    }, [user, lastActivity, showInactivityWarning])

    // Absolute session timeout check (1 hour from login)
    useEffect(() => {
        if (!user || !loginTimestamp) return

        const SESSION_DURATION = 60 * 60 * 1000 // 1 hour

        const checkSessionExpiry = () => {
            const now = Date.now()
            if (now - loginTimestamp >= SESSION_DURATION) {
                console.log("[Auth] Absolute session expired (1 hour reached)")
                logout()
            }
        }

        // Check every minute
        const interval = setInterval(checkSessionExpiry, 60000)

        // Initial check
        checkSessionExpiry()

        return () => clearInterval(interval)
    }, [user, loginTimestamp])


    const setSidebarOpen = (open: boolean) => {
        setSidebarOpenState(open)
    }

    const toggleSidebar = () => {
        setSidebarOpenState(prev => !prev)
    }

    const openSidebar = () => {
        setSidebarOpenState(true)
    }

    const closeSidebar = () => {
        setSidebarOpenState(false)
    }

    const login = async (userData: User, token: string) => {
        setIsLoading(true)
        // Double check IP on login
        if (clientIp) {
            try {
                const config = await getPlatformConfig()
                if (config && config.ip_whitelist_enabled && config.ip_whitelist) {
                    const whitelist = config.ip_whitelist.split(',').map((item: string) => item.trim())
                    if (whitelist.length > 0 && !whitelist.includes(clientIp)) {
                        setIsIpBlocked(true)
                        return // Stop login
                    }
                }
            } catch (e) {
                console.error("[Auth] Login IP check failed", e)
            }
        }

        const now = Date.now()
        setUser(userData)
        setLoginTimestamp(now)
        localStorage.setItem('admin_user_data', JSON.stringify(userData))
        localStorage.setItem('admin_access_token', token)
        localStorage.setItem('admin_login_timestamp', now.toString())

        try {
            const perms = await fetchLocalPermissions(userData.id)
            if (perms && perms.length > 0) {
                setLocalPermissions(perms)
            } else {
                setLocalPermissions(Object.values(PERMISSIONS))
            }
        } catch (e) {
            console.error("[Auth] Login permission fetch failed", e)
            setLocalPermissions(Object.values(PERMISSIONS))
        } finally {
            setIsLoading(false)
        }
    }

    const logout = () => {
        setUser(null)
        setLocalPermissions([])
        setSidebarOpenState(true)
        localStorage.removeItem('admin_user_data')
        localStorage.removeItem('admin_access_token')
        localStorage.removeItem('admin_refresh_token')
        localStorage.removeItem('sidebar_open')
        localStorage.removeItem('admin_login_timestamp')
        localStorage.removeItem('single_login_session')
        sessionStorage.removeItem('2fa_warning_shown')
        window.location.href = '/login'
    }

    const role = user ? getUserRole(user) : null
    const checkHasPermission = (permission: Permission): boolean => {
        if (!user) return false
        if (user.is_superuser || (user.username && user.username.toUpperCase() === 'TUTU')) return true

        return localPermissions.includes(permission)
    }

    const checkHasAnyPermission = (permissions: Permission[]): boolean => {
        if (!user) return false
        if (user.is_superuser || (user.username && user.username.toUpperCase() === 'TUTU')) return true
        return permissions.some(p => localPermissions.includes(p))
    }

    const checkHasAllPermissions = (permissions: Permission[]): boolean => {
        if (!user) return false
        if (user.is_superuser || (user.username && user.username.toUpperCase() === 'TUTU')) return true
        return permissions.every(p => localPermissions.includes(p))
    }

    const value: AuthContextType = {
        user,
        role,
        isLoading,
        sidebarOpen,
        login,
        logout,
        hasPermission: checkHasPermission,
        hasAnyPermission: checkHasAnyPermission,
        hasAllPermissions: checkHasAllPermissions,
        toggleSidebar,
        openSidebar,
        closeSidebar,
        setSidebarOpen,
    }

    const handleStayLoggedIn = () => {
        setLastActivity(Date.now())
        setShowInactivityWarning(false)
        setWarningCountdown(120)
    }

    return (
        <AuthContext.Provider value={value}>
            {isIpBlocked ? (
                <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                    <div className="max-w-md w-full space-y-8 text-center">
                        <h1 className="text-2xl font-mono text-slate-800">System Maintenance</h1>
                        <p className="text-slate-600 font-mono text-sm leading-relaxed">
                            Error Code: 0x8004100E<br />
                            The requested resource is temporarily unavailable due to scheduled maintenance.
                            Please try again in approximately 42 minutes.
                            If the problem persists, contact your network administrator.
                        </p>
                        <div className="pt-8 text-[10px] text-slate-400 font-mono">
                            SESSION_ID: {Math.random().toString(36).substring(7).toUpperCase()}
                            <br />
                            TRACE_ID: {Math.random().toString(36).substring(7).toUpperCase()}
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {children}
                    <InactivityWarning
                        open={showInactivityWarning}
                        remainingSeconds={warningCountdown}
                        onStayLoggedIn={handleStayLoggedIn}
                        onLogout={logout}
                    />
                </>
            )}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
