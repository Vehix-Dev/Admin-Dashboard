// /contexts/auth-context.tsx
"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { UserRole, getUserRole, hasPermission, hasAnyPermission, hasAllPermissions, PERMISSIONS } from '@/lib/permissions'
import type { Permission } from '@/lib/permissions'
import { getAccessToken, fetchLocalPermissions } from '@/lib/api'
import { getAdminProfile } from '@/lib/auth'
import { InactivityWarning } from '@/components/auth/inactivity-warning'


interface User {
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

    // Inactivity tracking
    const [lastActivity, setLastActivity] = useState<number>(Date.now())
    const [showInactivityWarning, setShowInactivityWarning] = useState(false)
    const [warningCountdown, setWarningCountdown] = useState(120) // 2 minutes in seconds


    // Initialize auth from localStorage on mount
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Try to get fresh profile from API using token
                const token = getAccessToken()
                if (token) {
                    try {
                        console.log("[Auth] Fetching fresh admin profile...")
                        const freshUser = await getAdminProfile()

                        // Use fresh user data if available
                        if (freshUser) {
                            console.log("[Auth] Fresh profile loaded:", freshUser.username)
                            // Adapt AdminUser to User interface if needed or just cast
                            const adaptedUser: User = {
                                ...freshUser,
                                // ensure required fields exist
                                username: freshUser.username || "",
                                first_name: freshUser.name.split(' ')[0],
                                last_name: freshUser.name.split(' ').slice(1).join(' '),
                                is_approved: true, // assume true if we got profile
                            } as any

                            setUser(adaptedUser)
                            localStorage.setItem('admin_user_data', JSON.stringify(adaptedUser))

                            // Check for TUTU immediately for logging
                            if (adaptedUser.username?.toUpperCase() === 'TUTU') {
                                console.log("[Auth] MASTER USER DETECTED: TUTU - Granting Full Access")
                            }

                            // Fetch permissions with fresh ID
                            try {
                                console.log("[Auth] Fetching permissions for user", adaptedUser.id)
                                const perms = await fetchLocalPermissions(adaptedUser.id)

                                if (perms && perms.length > 0) {
                                    console.log("[Auth] Fetched permissions count:", perms.length)
                                    setLocalPermissions(perms)
                                } else {
                                    console.log("[Auth] No permissions found, defaulting to ALL")
                                    setLocalPermissions(Object.values(PERMISSIONS))
                                }
                            } catch (e) {
                                console.error("[Auth] Failed to load permissions", e)
                                setLocalPermissions(Object.values(PERMISSIONS))
                            }
                            // Load sidebar preference
                            const savedSidebarState = localStorage.getItem('sidebar_open')
                            if (savedSidebarState !== null) {
                                setSidebarOpenState(JSON.parse(savedSidebarState))
                            }
                            return // Exit successfully
                        }
                    } catch (e) {
                        console.error("[Auth] Failed to fetch fresh profile, falling back to local storage", e)
                    }
                }

                // FALLBACK: Old logic if API fails or no token
                const storedUser = localStorage.getItem('admin_user_data')
                if (storedUser && token) {
                    const userData = JSON.parse(storedUser)
                    setUser(userData)

                    try {
                        const perms = await fetchLocalPermissions(userData.id)
                        if (perms && perms.length > 0) {
                            setLocalPermissions(perms)
                        } else {
                            setLocalPermissions(Object.values(PERMISSIONS))
                        }
                    } catch (e) {
                        setLocalPermissions(Object.values(PERMISSIONS))
                    }
                }

                // Load sidebar preference
                const savedSidebarState = localStorage.getItem('sidebar_open')
                if (savedSidebarState !== null) {
                    setSidebarOpenState(JSON.parse(savedSidebarState))
                }
            } catch (error) {
                console.error('Failed to initialize auth:', error)
            } finally {
                setIsLoading(false)
            }
        }

        initializeAuth()
    }, [])

    // Save sidebar preference when it changes
    useEffect(() => {
        localStorage.setItem('sidebar_open', JSON.stringify(sidebarOpen))
    }, [sidebarOpen])

    // Inactivity tracking and auto-logout
    useEffect(() => {
        if (!user) return

        const INACTIVITY_TIMEOUT = 2 * 60 * 1000 // 2 minutes in milliseconds (for testing)
        const WARNING_TIME = 30 * 1000 // 30 seconds before logout (for testing)

        // Reset activity timer 
        const resetActivity = () => {
            setLastActivity(Date.now())
            setShowInactivityWarning(false)
            setWarningCountdown(120)
        }

        // Activity event listeners
        const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click']
        events.forEach(event => {
            window.addEventListener(event, resetActivity)
        })

        // Check inactivity every 10 seconds
        const checkInterval = setInterval(() => {
            const now = Date.now()
            const timeSinceActivity = now - lastActivity

            // Show warning 2 minutes before logout
            if (timeSinceActivity >= INACTIVITY_TIMEOUT - WARNING_TIME && !showInactivityWarning) {
                setShowInactivityWarning(true)
                const remainingSeconds = Math.floor((INACTIVITY_TIMEOUT - timeSinceActivity) / 1000)
                setWarningCountdown(remainingSeconds)
            }

            // Auto-logout after 1 hour
            if (timeSinceActivity >= INACTIVITY_TIMEOUT) {
                logout()
            }
        }, 10000) // Check every 10 seconds

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, resetActivity)
            })
            clearInterval(checkInterval)
        }
    }, [user, lastActivity, showInactivityWarning])


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
        setUser(userData)
        localStorage.setItem('admin_user_data', JSON.stringify(userData))
        localStorage.setItem('admin_access_token', token)

        // Fetch permissions
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
        window.location.href = '/login'
    }

    const role = user ? getUserRole(user) : null
    // Permission Checks
    const checkHasPermission = (permission: Permission): boolean => {
        if (!user) return false
        // Superuser or Master User TUTU always has access
        if (user.is_superuser || (user.username && user.username.toUpperCase() === 'TUTU')) return true

        // Check local permissions list
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
            {children}
            <InactivityWarning
                open={showInactivityWarning}
                remainingSeconds={warningCountdown}
                onStayLoggedIn={handleStayLoggedIn}
                onLogout={logout}
            />
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