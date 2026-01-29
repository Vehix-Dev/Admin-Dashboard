"use client"

export interface WidgetConfig {
    id: string
    title: string
    visible: boolean
    order: number
    size: 'small' | 'medium' | 'large' | 'full'
}

export const DEFAULT_WIDGETS: WidgetConfig[] = [
    { id: 'stats-overview', title: 'Stats Overview', visible: true, order: 0, size: 'full' },
    { id: 'request-trends', title: 'Request Trends', visible: true, order: 1, size: 'medium' },
    { id: 'status-pie', title: 'Status Distribution', visible: true, order: 2, size: 'medium' },
    { id: 'top-customers', title: 'Top Customers', visible: true, order: 3, size: 'medium' },
    { id: 'top-providers', title: 'Top Providers', visible: true, order: 4, size: 'medium' },
    { id: 'recent-requests', title: 'Recent Activity', visible: true, order: 5, size: 'medium' },
    { id: 'popular-services', title: 'Popular Services', visible: true, order: 6, size: 'large' },
    { id: 'platform-health', title: 'Platform Health', visible: true, order: 7, size: 'medium' },
    { id: 'user-growth', title: 'User Growth', visible: true, order: 8, size: 'full' },
]

export const getDashboardConfig = (): WidgetConfig[] => {
    if (typeof window === 'undefined') return DEFAULT_WIDGETS
    const saved = localStorage.getItem('dashboard_config')
    if (!saved) return DEFAULT_WIDGETS
    try {
        return JSON.parse(saved)
    } catch {
        return DEFAULT_WIDGETS
    }
}

export const saveDashboardConfig = (config: WidgetConfig[]) => {
    if (typeof window === 'undefined') return
    localStorage.setItem('dashboard_config', JSON.stringify(config))
}
