"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Map,
  Users,
  UserCheck,
  Wrench,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  List,
  Shield,
  CheckCircle,
  XCircle,
  Wallet,
  Bell,
  Gift,
  Image,
  BarChart,
  Headphones,
  Globe,
  Menu,
  Trash2,
  ArrowLeft,
  DollarSign,
  Mail,
  FileText,
  Clock,
  Activity
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { PERMISSIONS, type Permission } from "@/lib/permissions"

const navigationItems: Array<{ section: string; items: NavItem[] }> = [
  {
    section: "OPERATIONS",
    items: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD_VIEW },
      {
        name: "Service Requests",
        href: "/admin/requests",
        icon: Wrench,
        hasSubItems: true,
        permission: PERMISSIONS.REQUESTS_VIEW,
        items: [
          { name: "All Requests", href: "/admin/requests", icon: List, permission: PERMISSIONS.REQUESTS_VIEW },
          { name: "Accepted/On going", href: "/admin/requests/accepted", icon: UserCheck, permission: PERMISSIONS.REQUESTS_VIEW },
          { name: "Completed", href: "/admin/requests/completed", icon: CheckCircle, permission: PERMISSIONS.REQUESTS_VIEW },
          { name: "Cancelled", href: "/admin/requests/cancelled", icon: XCircle, permission: PERMISSIONS.REQUESTS_VIEW },
          { name: "Expired", href: "/admin/requests/expired", icon: Clock, permission: PERMISSIONS.REQUESTS_VIEW },
        ]
      },
      { name: "Live Map", href: "/admin/live-map", icon: Map, permission: PERMISSIONS.MAP_VIEW },
    ],
  },
  {
    section: "MANAGEMENT",
    items: [
      {
        name: "Roadies",
        href: "/admin/roadies",
        icon: UserCheck,
        hasSubItems: true,
        permission: PERMISSIONS.ROADIES_VIEW,
        items: [
          { name: "All Roadies", href: "/admin/roadies", icon: List, permission: PERMISSIONS.ROADIES_VIEW },
          { name: "Add New", href: "/admin/roadies/add", icon: Plus, permission: PERMISSIONS.ROADIES_ADD },
          { name: "Drivers Total Assists", href: "/admin/roadies/total-services", icon: BarChart, permission: PERMISSIONS.RODIE_SERVICES_VIEW },
          { name: "Deleted", href: "/admin/roadies/deleted", icon: Trash2, permission: PERMISSIONS.ROADIES_DELETE },
        ]
      },
      {
        name: "Riders",
        href: "/admin/riders",
        icon: Users,
        hasSubItems: true,
        permission: PERMISSIONS.RIDERS_VIEW,
        items: [
          { name: "All Riders", href: "/admin/riders", icon: List, permission: PERMISSIONS.RIDERS_VIEW },
          { name: "Add New", href: "/admin/riders/add", icon: Plus, permission: PERMISSIONS.RIDERS_ADD },
          { name: "Deleted", href: "/admin/riders/deleted", icon: Trash2, permission: PERMISSIONS.RIDERS_DELETE },
        ]
      },
      {
        name: "Services",
        href: "/admin/services",
        icon: Wrench,
        permission: PERMISSIONS.SERVICES_VIEW,
      },
      {
        name: "Wallets",
        href: "/admin/wallet",
        icon: Wallet,
        permission: PERMISSIONS.WALLET_VIEW,
      },
      {
        name: "Referrals",
        href: "/admin/referrals",
        icon: Gift,
        permission: PERMISSIONS.REFERRALS_VIEW,
      },
      {
        name: "Admin Users",
        href: "/admin/users",
        icon: Shield,
        hasSubItems: true,
        permission: PERMISSIONS.ADMIN_USERS_VIEW,
        items: [
          { name: "All Admins", href: "/admin/users", icon: List, permission: PERMISSIONS.ADMIN_USERS_VIEW },
          { name: "Add Admin", href: "/admin/users/add", icon: Plus, permission: PERMISSIONS.ADMIN_USERS_ADD },
          { name: "Roles", href: "/admin/users/roles", icon: Shield, permission: PERMISSIONS.ADMIN_USERS_VIEW },
          { name: "Groups", href: "/admin/users/groups", icon: Users, permission: PERMISSIONS.ADMIN_USERS_VIEW },
          { name: "Deleted Users", href: "/admin/users/deleted", icon: Trash2, permission: PERMISSIONS.ADMIN_USERS_VIEW },
          { name: "Audit Logs", href: "/admin/users/audit", icon: FileText, permission: PERMISSIONS.ADMIN_USERS_VIEW },
        ]
      },
      {
        name: "Moderation",
        href: "/admin/moderation/media",
        icon: CheckCircle,
        hasSubItems: true,
        permission: PERMISSIONS.MEDIA_VIEW,
        items: [
          { name: "Media", href: "/admin/moderation/media", icon: Image, permission: PERMISSIONS.MEDIA_VIEW },
        ]
      },
      {
        name: "Notifications",
        href: "/admin/notifications",
        icon: Bell,
        hasSubItems: true,
        permission: PERMISSIONS.NOTIFICATIONS_VIEW,
        items: [
          { name: "All Notifications", href: "/admin/notifications", icon: Bell, permission: PERMISSIONS.NOTIFICATIONS_VIEW },
          { name: "Send Email", href: "/admin/notifications/email", icon: Mail, permission: PERMISSIONS.EMAIL_SEND },
        ]
      },
      {
        name: "Reports",
        href: "/admin/reports",
        icon: BarChart,
        hasSubItems: true,
        permission: PERMISSIONS.REPORTS_VIEW,
        items: [
          { name: "Overview", href: "/admin/reports", icon: BarChart, permission: PERMISSIONS.REPORTS_VIEW },
          { name: "Financial Report", href: "/admin/reports/financial", icon: DollarSign, permission: PERMISSIONS.REPORTS_VIEW },
          { name: "User Analytics", href: "/admin/reports/users", icon: Users, permission: PERMISSIONS.REPORTS_VIEW },
          { name: "Service Performance", href: "/admin/reports/services", icon: Wrench, permission: PERMISSIONS.REPORTS_VIEW },
        ]
      },
      {
        name: "Support & Inquiries",
        href: "/admin/support",
        icon: Headphones,
        permission: PERMISSIONS.SUPPORT_VIEW,
      },
    ],
  },
  {
    section: "SETTINGS",
    items: [
      {
        name: "Settings",
        href: "/admin/settings",
        icon: Settings,
        hasSubItems: true,
        permission: PERMISSIONS.SETTINGS_VIEW,
        items: [
          { name: "Platform Settings", href: "/admin/settings", icon: Settings, permission: PERMISSIONS.SETTINGS_VIEW },
          { name: "Security Settings", href: "/admin/settings/security", icon: Shield, permission: PERMISSIONS.SETTINGS_VIEW },
          { name: "Firewall & Security", href: "/admin/security/firewall", icon: Shield, permission: PERMISSIONS.SETTINGS_VIEW },
          { name: "API Health", href: "/admin/system/health", icon: Activity, permission: PERMISSIONS.SETTINGS_VIEW },
          { name: "Landing Page", href: "/admin/settings/landing", icon: Globe, permission: PERMISSIONS.SETTINGS_VIEW },
        ]
      },
    ],
  },
]

interface DropdownItem {
  name: string
  href: string
  icon: any
  permission?: string
}

interface NavItem {
  name: string
  href: string
  icon: any
  hasSubItems?: boolean
  items?: DropdownItem[]
  permission?: string
}

export function AdminSidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar, hasPermission } = useAuth()
  const [activePanel, setActivePanel] = useState<string | null>(null)
  const [secondarySidebarItem, setSecondarySidebarItem] = useState<string | null>(null)

  // Filter navigation items based on permissions
  const filteredNavigation = navigationItems.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (item.permission && !hasPermission(item.permission as any)) {
        return false
      }
      return true
    }).map(item => {
      if (item.items) {
        return {
          ...item,
          items: item.items.filter(subItem => {
            if (subItem.permission && !hasPermission(subItem.permission as any)) {
              return false
            }
            return true
          })
        }
      }
      return item
    })
  })).filter(section => section.items.length > 0)

  const isItemActive = (item: NavItem) => {
    const baseActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
    if (item.hasSubItems && item.items) {
      return baseActive || item.items.some(subItem => pathname === subItem.href || pathname.startsWith(subItem.href))
    }
    return baseActive
  }

  const isDropdownItemActive = (href: string) => {
    return pathname === href || pathname.startsWith(href)
  }

  const handleNavigateToPanel = (itemName: string) => {
    setActivePanel(itemName.toLowerCase())
  }

  const handleBack = () => {
    setActivePanel(null)
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col shadow-2xl bg-sidebar border-r border-sidebar-border rounded-none",
        !sidebarOpen ? "w-19" : "w-64",
      )}
    >
      {/* Logo area */}
      <div className="flex h-16 items-center justify-between border-b border-border/30 px-4 shrink-0 bg-sidebar-accent/10">
        {sidebarOpen && (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 relative flex items-center justify-center">
              <img src="/logo.png" alt="Vehix Logo" className="h-full w-auto object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-foreground text-sm tracking-tight leading-none">
                VEHIX <span className="text-primary">OPS</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em]">Management</span>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="text-sidebar-foreground hover:bg-sidebar-accent h-7 w-7 rounded-md transition-all duration-300"
          aria-label={!sidebarOpen ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu className="h-4 w-4 transition-transform duration-300" />
        </Button>
      </div>

      {/* Navigation - Slide Container */}
      <div className="flex-1 overflow-hidden relative">
        {/* Main Panel */}
        <div
          className={cn(
            "absolute inset-0 transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
            activePanel && sidebarOpen ? "-translate-x-full" : "translate-x-0"
          )}
        >
          <nav className="h-full overflow-y-auto overflow-x-hidden p-3 space-y-4">
            {filteredNavigation.map((section) => (
              <div key={section.section} className="space-y-2">
                {sidebarOpen && (
                  <h3 className="px-2 py-1 text-xs font-bold text-sidebar-foreground/50 uppercase tracking-wider">
                    {section.section}
                  </h3>
                )}
                <div className="space-y-1">
                  {(section.items as NavItem[]).map((item) => {
                    const isActive = isItemActive(item)
                    const Icon = item.icon
                    const itemKey = item.name.toLowerCase()

                    if (!sidebarOpen) {
                      // Collapsed view
                      return (
                        <div key={item.name} className="relative">
                          {item.hasSubItems ? (
                            <div
                              className={cn(
                                "flex items-center justify-center rounded-md px-2 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer relative group",
                                isActive
                                  ? "bg-sidebar-primary text-white shadow-sm"
                                  : "text-sidebar-foreground hover:bg-sidebar-accent",
                              )}
                              onClick={() => setSecondarySidebarItem(secondarySidebarItem === itemKey ? null : itemKey)}
                            >
                              <Icon className="h-4.5 w-4.5 shrink-0" />
                              <ChevronRight className="absolute right-0.5 bottom-0.5 h-2.5 w-2.5 opacity-60" />
                            </div>
                          ) : (
                            <Link
                              href={item.href}
                              className={cn(
                                "flex items-center justify-center rounded-md px-2 py-2.5 text-sm font-medium transition-all duration-200",
                                isActive
                                  ? "bg-sidebar-primary text-white shadow-sm"
                                  : "text-sidebar-foreground hover:bg-sidebar-accent",
                              )}
                              title={item.name}
                            >
                              <Icon className="h-4.5 w-4.5 shrink-0" />
                            </Link>
                          )}
                        </div>
                      )
                    }

                    // Expanded view
                    return (
                      <div key={item.name}>
                        {item.hasSubItems ? (
                          <div
                            onClick={() => handleNavigateToPanel(item.name)}
                            className={cn(
                              "group flex items-center justify-between w-full gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer",
                              isActive
                                ? "bg-sidebar-primary/10 text-sidebar-primary-foreground border-l-2 border-sidebar-primary"
                                : "text-sidebar-foreground hover:bg-sidebar-accent border-l-2 border-transparent",
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon className="h-4.5 w-4.5 shrink-0" />
                              <span className="font-medium">{item.name}</span>
                            </div>
                            <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                          </div>
                        ) : (
                          <Link
                            href={item.href}
                            className={cn(
                              "group flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-300",
                              isActive
                                ? "bg-sidebar-primary text-white shadow-sm"
                                : "text-sidebar-foreground hover:bg-sidebar-accent",
                            )}
                          >
                            <Icon className="h-4.5 w-4.5 shrink-0" />
                            <span>{item.name}</span>
                          </Link>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Sub Panel */}
        {sidebarOpen && (
          <div
            className={cn(
              "absolute inset-0 bg-sidebar transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
              activePanel ? "translate-x-0" : "translate-x-full"
            )}
          >
            {activePanel && (
              <div className="h-full overflow-y-auto overflow-x-hidden p-3 space-y-4">
                {/* Back Button */}
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent rounded-md transition-all duration-200 w-full"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>

                {/* Panel Title */}
                {filteredNavigation
                  .flatMap(section => section.items)
                  .filter(item => item.name.toLowerCase() === activePanel)
                  .map(item => (
                    <div key={item.name} className="space-y-3">
                      <div className="px-3 py-2 border-b border-sidebar-border/30">
                        <div className="flex items-center gap-2.5">
                          <item.icon className="h-5 w-5 text-sidebar-primary" />
                          <h3 className="text-sm font-bold text-sidebar-foreground uppercase tracking-wider">
                            {item.name}
                          </h3>
                        </div>
                      </div>

                      {/* Sub Items */}
                      <div className="space-y-1">
                        {item.items?.map((subItem) => {
                          const SubIcon = subItem.icon
                          const isSubActive = isDropdownItemActive(subItem.href)
                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              className={cn(
                                "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                isSubActive
                                  ? "bg-sidebar-primary text-white shadow-sm"
                                  : "text-sidebar-foreground hover:bg-sidebar-accent",
                              )}
                            >
                              <SubIcon className="h-4 w-4 shrink-0" />
                              <span>{subItem.name}</span>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Secondary Sidebar for Collapsed Dropdown Items */}
      {!sidebarOpen && secondarySidebarItem && (
        <div
          className="fixed left-[76px] top-0 h-screen w-56 bg-sidebar border-r border-sidebar-border/30 shadow-2xl z-50 animate-in slide-in-from-left-2 duration-200"
          onMouseLeave={() => setSecondarySidebarItem(null)}
        >
          <div className="p-4">
            {filteredNavigation
              .flatMap(section => section.items)
              .filter(item => item.name.toLowerCase() === secondarySidebarItem)
              .map(item => (
                <div key={item.name} className="space-y-2">
                  <h3 className="text-xs font-bold text-sidebar-foreground/70 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <item.icon className="h-3.5 w-3.5" />
                    {item.name}
                  </h3>
                  <div className="space-y-1">
                    {item.items?.map((subItem) => {
                      const SubIcon = subItem.icon
                      const isSubActive = isDropdownItemActive(subItem.href)
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          onClick={() => setSecondarySidebarItem(null)}
                          className={cn(
                            "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                            isSubActive
                              ? "bg-sidebar-primary text-white shadow-sm"
                              : "text-sidebar-foreground hover:bg-sidebar-accent",
                          )}
                        >
                          <SubIcon className="h-4 w-4 shrink-0" />
                          <span>{subItem.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Status indicator */}
      {sidebarOpen && !activePanel && (
        <div className="px-3 pb-3 shrink-0">
          <div className="bg-sidebar-accent/10 rounded-md p-2 border border-sidebar-border/20">
            <div className="flex items-center justify-between text-xs">
              <span className="text-sidebar-foreground/60">System</span>
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-green-500 font-medium text-xs">Online</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}