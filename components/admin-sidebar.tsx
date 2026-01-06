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
  ChevronDown,
  Plus,
  List,
  Shield
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { PERMISSIONS, Permission } from "@/lib/permissions"
import { useAuth } from "@/contexts/auth-context"

const navigationItems: Array<{ section: string; items: NavItem[] }> = [
  {
    section: "OPERATIONS",
    items: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard, permissions: [PERMISSIONS.DASHBOARD_VIEW] },
      { name: "Service Requests", href: "/admin/requests", icon: Wrench, permissions: [PERMISSIONS.REQUESTS_VIEW] },
      { name: "Live Map", href: "/admin/live-map", icon: Map, permissions: [PERMISSIONS.MAP_VIEW] },
    ],
  },
  {
    section: "MANAGEMENT",
    items: [
      {
        name: "Roadies",
        href: "/admin/roadies",
        icon: UserCheck,
        dropdown: true,
        permissions: [PERMISSIONS.ROADIES_VIEW],
        items: [
          { name: "List", href: "/admin/roadies", icon: List },
          { name: "Add New", href: "/admin/roadies/add", icon: Plus, permissions: [PERMISSIONS.ROADIES_ADD] },
        ]
      },
      {
        name: "Riders",
        href: "/admin/riders",
        icon: Users,
        dropdown: true,
        permissions: [PERMISSIONS.RIDERS_VIEW],
        items: [
          { name: "List", href: "/admin/riders", icon: List },
          { name: "Add New", href: "/admin/riders/add", icon: Plus, permissions: [PERMISSIONS.RIDERS_ADD] },
        ]
      },
      { name: "Services", href: "/admin/services", icon: Wrench, permissions: [PERMISSIONS.SERVICES_VIEW] },
      {
        name: "Admin Users",
        href: "/admin/users",
        icon: Shield,
        dropdown: true,
        permissions: [PERMISSIONS.ADMIN_USERS_VIEW],
        items: [
          { name: "List", href: "/admin/users", icon: List },
          { name: "Add New", href: "/admin/users/add", icon: Plus, permissions: [PERMISSIONS.ADMIN_USERS_ADD] },
        ]
      },
    ],
  },
]

interface DropdownItem {
  name: string
  href: string
  icon: any
  permissions?: Permission[]
}

interface NavItem {
  name: string
  href: string
  icon: any
  dropdown?: boolean
  items?: DropdownItem[]
  permissions?: Permission[]
}

export function AdminSidebar() {
  const pathname = usePathname()
  const { hasAnyPermission } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [dropdownHeight, setDropdownHeight] = useState<Record<string, number>>({
    roadies: 72, // 2 items * 36px
    riders: 72,  // 2 items * 36px
    "admin users": 72, // 2 items * 36px
  })

  // No permission filtering - Show all items as requested
  const filteredNavigationItems = navigationItems.map(section => {
    // Show all items
    const visibleItems = section.items.map(item => {
      // If it's a dropdown, show all sub-items
      if (item.dropdown && item.items) {
        // No filtering on sub-items
        return item
      }
      return item
    })

    return { ...section, items: visibleItems }
  })

  // Auto-open dropdown based on current path
  useEffect(() => {
    if (pathname.startsWith("/admin/roadies")) {
      setOpenDropdown("roadies")
    } else if (pathname.startsWith("/admin/riders")) {
      setOpenDropdown("riders")
    } else if (pathname.startsWith("/admin/users")) {
      setOpenDropdown("admin users")
    } else {
      setOpenDropdown(null)
    }
  }, [pathname])

  const handleDropdownToggle = (itemName: string) => {
    if (collapsed) {
      // When collapsed, clicking the item should navigate to main page
      return
    }

    if (openDropdown === itemName.toLowerCase()) {
      // Close the dropdown with smooth animation
      setOpenDropdown(null)
    } else {
      // Open the new dropdown
      setOpenDropdown(itemName.toLowerCase())
    }
  }

  const handleSubItemClick = (itemName: string) => {
    // Keep the dropdown open when clicking sub-items
    setOpenDropdown(itemName.toLowerCase())
  }

  const isItemActive = (item: NavItem) => {
    const baseActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
    if (item.dropdown && item.items) {
      return baseActive || item.items.some(subItem => pathname === subItem.href)
    }
    return baseActive
  }

  const isDropdownItemActive = (href: string) => {
    return pathname === href
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo area */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border/30 px-4 bg-sidebar">
        {!collapsed && <span className="font-bold text-sidebar-foreground text-sm">MENU</span>}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent h-8 w-8"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {filteredNavigationItems.map((section) => (
          <div key={section.section}>
            {!collapsed && (
              <h3 className="px-2 py-1.5 text-xs font-bold text-sidebar-foreground/50 uppercase tracking-wider">
                {section.section}
              </h3>
            )}
            <div className="space-y-1">
              {(section.items as NavItem[]).map((item) => {
                const isActive = isItemActive(item)
                const Icon = item.icon
                const isDropdownItem = item.dropdown
                const itemKey = item.name.toLowerCase()
                const isCurrentDropdownOpen = openDropdown === itemKey
                const dropdownItemHeight = dropdownHeight[itemKey as keyof typeof dropdownHeight] || 72

                if (collapsed) {
                  // Collapsed view - show only icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center justify-center rounded px-3 py-2 text-sm font-medium transition-all",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                          : "text-sidebar-foreground hover:bg-sidebar-accent",
                      )}
                      title={item.name}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                    </Link>
                  )
                }

                // Expanded view
                return (
                  <div key={item.name} className="space-y-0">
                    {isDropdownItem ? (
                      <>
                        {/* Main dropdown item - clickable to toggle dropdown */}
                        <div
                          onClick={() => handleDropdownToggle(item.name)}
                          className={cn(
                            "flex items-center justify-between w-full gap-3 rounded px-3 py-2 text-sm font-medium transition-all cursor-pointer",
                            isActive
                              ? "bg-sidebar-primary/20 text-sidebar-primary-foreground"
                              : "text-sidebar-foreground hover:bg-sidebar-accent",
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5 shrink-0" />
                            <span>{item.name}</span>
                          </div>
                          <ChevronDown className={cn(
                            "h-4 w-4 transition-all duration-300",
                            isCurrentDropdownOpen ? "rotate-180" : ""
                          )} />
                        </div>

                        {/* Animated dropdown sub-items container */}
                        <div
                          className="overflow-hidden transition-all duration-500 ease-in-out"
                          style={{
                            height: isCurrentDropdownOpen ? `${dropdownItemHeight}px` : '0px',
                            opacity: isCurrentDropdownOpen ? 1 : 0
                          }}
                        >
                          <div className="ml-6 space-y-1 border-l border-sidebar-border/30 pl-2 pt-1">
                            {item.items && item.items.map((subItem) => {
                              const SubIcon = subItem.icon
                              const isSubActive = isDropdownItemActive(subItem.href)

                              return (
                                <Link
                                  key={subItem.href}
                                  href={subItem.href}
                                  onClick={() => handleSubItemClick(item.name)}
                                  className={cn(
                                    "flex items-center gap-3 rounded px-3 py-1.5 text-sm font-medium transition-all transform",
                                    "hover:translate-x-1 duration-200",
                                    isSubActive
                                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                                      : "text-sidebar-foreground hover:bg-sidebar-accent",
                                  )}
                                  style={{
                                    animation: isCurrentDropdownOpen
                                      ? 'slideIn 0.3s ease-out forwards'
                                      : 'none'
                                  }}
                                >
                                  <SubIcon className="h-4 w-4 shrink-0" />
                                  <span>{subItem.name}</span>
                                </Link>
                              )
                            })}
                          </div>
                        </div>
                      </>
                    ) : (
                      // Regular non-dropdown item
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition-all",
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                            : "text-sidebar-foreground hover:bg-sidebar-accent",
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
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

      {/* Settings at bottom */}
      <div className="border-t border-sidebar-border/30 p-3 space-y-1">
        <Link
          href="/admin/settings"
          className={cn(
            "flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition-all",
            pathname === "/admin/settings"
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
              : "text-sidebar-foreground hover:bg-sidebar-accent",
          )}
        >
          <Settings className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>

      {/* Add CSS animation for slide-in effect */}
      <style jsx global>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        /* Smooth transitions for dropdown */
        .dropdown-transition {
          transition: height 500ms cubic-bezier(0.4, 0, 0.2, 1), 
                     opacity 300ms cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </aside>
  )
}