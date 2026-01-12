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
  Shield,
  CheckCircle,
  XCircle,
  Wallet,
  Bell,
  Gift,
  Image,
  BarChart,
  Headphones,
  Globe
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
        dropdown: true,
        permission: PERMISSIONS.REQUESTS_VIEW,
        items: [
          { name: "All Requests", href: "/admin/requests", icon: List, permission: PERMISSIONS.REQUESTS_VIEW },
          { name: "Accepted", href: "/admin/requests/accepted", icon: UserCheck, permission: PERMISSIONS.REQUESTS_VIEW },
          { name: "Completed", href: "/admin/requests/completed", icon: CheckCircle, permission: PERMISSIONS.REQUESTS_VIEW },
          { name: "Cancelled", href: "/admin/requests/cancelled", icon: XCircle, permission: PERMISSIONS.REQUESTS_VIEW },
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
        dropdown: true,
        permission: PERMISSIONS.ROADIES_VIEW,
        items: [
          { name: "All Roadies", href: "/admin/roadies", icon: List, permission: PERMISSIONS.ROADIES_VIEW },
          { name: "Add New", href: "/admin/roadies/add", icon: Plus, permission: PERMISSIONS.ROADIES_ADD },
          { name: "Drivers Total Assists", href: "/admin/roadies/total-services", icon: BarChart, permission: PERMISSIONS.RODIE_SERVICES_VIEW },
        ]
      },
      {
        name: "Riders",
        href: "/admin/riders",
        icon: Users,
        dropdown: true,
        permission: PERMISSIONS.RIDERS_VIEW,
        items: [
          { name: "All Riders", href: "/admin/riders", icon: List, permission: PERMISSIONS.RIDERS_VIEW },
          { name: "Add New", href: "/admin/riders/add", icon: Plus, permission: PERMISSIONS.RIDERS_ADD },
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
        dropdown: true,
        permission: PERMISSIONS.ADMIN_USERS_VIEW,
        items: [
          { name: "All Admins", href: "/admin/users", icon: List, permission: PERMISSIONS.ADMIN_USERS_VIEW },
          { name: "Add New", href: "/admin/users/add", icon: Plus, permission: PERMISSIONS.ADMIN_USERS_ADD },
        ]
      },
      {
        name: "Moderation",
        href: "/admin/moderation/media",
        icon: CheckCircle,
        dropdown: true,
        permission: PERMISSIONS.MEDIA_VIEW,
        items: [
          { name: "Media", href: "/admin/moderation/media", icon: Image, permission: PERMISSIONS.MEDIA_VIEW },
        ]
      },
      {
        name: "Notifications",
        href: "/admin/notifications",
        icon: Bell,
        permission: PERMISSIONS.NOTIFICATIONS_VIEW,
      },
      {
        name: "Reports",
        href: "/admin/reports",
        icon: BarChart,
        permission: PERMISSIONS.REPORTS_VIEW,
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
        name: "Platform Settings",
        href: "/admin/settings",
        icon: Settings,
        permission: PERMISSIONS.SETTINGS_VIEW,
      },
      {
        name: "Landing Page",
        href: "/admin/settings/landing",
        icon: Globe,
        permission: PERMISSIONS.SETTINGS_VIEW,
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
  dropdown?: boolean
  items?: DropdownItem[]
  permission?: string
}

export function AdminSidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar, hasPermission } = useAuth()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [isHovering, setIsHovering] = useState(false)

  // Filter navigation items based on permissions
  const filteredNavigation = navigationItems.map(section => ({
    ...section,
    items: section.items.filter(item => {
      // If item has a permission, check it
      if (item.permission && !hasPermission(item.permission as any)) {
        return false
      }
      return true
    }).map(item => {
      // Also filter sub-items if they exist
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
  })).filter(section => section.items.length > 0) // Hide empty sections

  // Auto-open dropdown based on current path
  useEffect(() => {
    if (pathname.startsWith("/admin/requests")) {
      setOpenDropdown("service requests")
    } else if (pathname.startsWith("/admin/roadies")) {
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
    if (!sidebarOpen) {
      // When collapsed, clicking the item should navigate to main page
      const item = filteredNavigation
        .flatMap(section => section.items)
        .find(item => item.name.toLowerCase() === itemName.toLowerCase())

      if (item?.href) {
        window.location.href = item.href
      }
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
      return baseActive || item.items.some(subItem => pathname === subItem.href || pathname.startsWith(subItem.href))
    }
    return baseActive
  }

  const isDropdownItemActive = (href: string) => {
    return pathname === href || pathname.startsWith(href)
  }

  // Get dropdown item count
  const getDropdownItemCount = (itemName: string) => {
    const item = filteredNavigation
      .flatMap(section => section.items)
      .find(item => item.name.toLowerCase() === itemName.toLowerCase())

    return item?.items?.length || 0
  }

  // Get dropdown height
  const getDropdownHeight = (itemName: string) => {
    const itemCount = getDropdownItemCount(itemName)
    return itemCount * 36 // 36px per item (smaller)
  }

  // Handle mouse enter/leave for sidebar
  const handleSidebarMouseEnter = () => {
    setIsHovering(true)
  }

  const handleSidebarMouseLeave = () => {
    setIsHovering(false)
    setHoveredItem(null)
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 ease-in-out flex flex-col shadow-lg border-r border-sidebar-border/30",
        !sidebarOpen ? "w-19" : "w-64", // Made slightly smaller
        isHovering && !sidebarOpen ? "shadow-sidebar-primary/10" : ""
      )}
      onMouseEnter={handleSidebarMouseEnter}
      onMouseLeave={handleSidebarMouseLeave}
    >
      {/* Logo area - Simplified */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border/30 px-4 bg-sidebar">
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-sidebar-primary flex items-center justify-center">
              <Wrench className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-sidebar-foreground text-sm tracking-tight">ADMIN</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="text-sidebar-foreground hover:bg-sidebar-accent h-7 w-7 rounded-md transition-all duration-300"
          aria-label={!sidebarOpen ? "Expand sidebar" : "Collapse sidebar"}
        >
          {!sidebarOpen ? (
            <ChevronRight className="h-4 w-4 transition-transform duration-300" />
          ) : (
            <ChevronLeft className="h-4 w-4 transition-transform duration-300" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4">
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
                const isDropdownItem = item.dropdown
                const itemKey = item.name.toLowerCase()
                const isCurrentDropdownOpen = openDropdown === itemKey
                const dropdownItemHeight = getDropdownHeight(itemKey)
                const isHovered = hoveredItem === itemKey

                if (!sidebarOpen) {
                  // Collapsed view - show only icon with tooltip
                  return (
                    <div key={item.name} className="relative">
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center justify-center rounded-md px-2 py-2.5 text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-sidebar-primary text-white shadow-sm"
                            : "text-sidebar-foreground hover:bg-sidebar-accent",
                        )}
                        title={item.name}
                        onMouseEnter={() => setHoveredItem(itemKey)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        <Icon className="h-4.5 w-4.5 shrink-0" />

                        {/* Tooltip for collapsed view */}
                        {!isHovering && !sidebarOpen && (
                          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1.5 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                            {item.name}
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                          </div>
                        )}
                      </Link>
                    </div>
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
                          onMouseEnter={() => setHoveredItem(itemKey)}
                          onMouseLeave={() => setHoveredItem(null)}
                          className={cn(
                            "group flex items-center justify-between w-full gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-300 cursor-pointer",
                            isActive
                              ? "bg-sidebar-primary/10 text-sidebar-primary-foreground border-l-2 border-sidebar-primary"
                              : "text-sidebar-foreground hover:bg-sidebar-accent border-l-2 border-transparent",
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className={cn(
                              "h-4.5 w-4.5 shrink-0 transition-transform duration-300",
                              isCurrentDropdownOpen ? "scale-110" : "group-hover:scale-110"
                            )} />
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <ChevronDown className={cn(
                            "h-3.5 w-3.5 transition-all duration-500 ease-in-out",
                            isCurrentDropdownOpen
                              ? "rotate-180"
                              : ""
                          )} />
                        </div>

                        {/* Animated dropdown sub-items container */}
                        <div
                          className="overflow-hidden transition-all duration-600 ease-in-out"
                          style={{
                            height: isCurrentDropdownOpen ? `${dropdownItemHeight}px` : '0px',
                            opacity: isCurrentDropdownOpen ? 1 : 0,
                            transform: isCurrentDropdownOpen ? 'translateY(0)' : 'translateY(-5px)'
                          }}
                        >
                          <div className="ml-6 space-y-0.5 border-l border-sidebar-border/30 pl-2 pt-1">
                            {item.items && item.items.map((subItem, index) => {
                              const SubIcon = subItem.icon
                              const isSubActive = isDropdownItemActive(subItem.href)

                              return (
                                <Link
                                  key={subItem.href}
                                  href={subItem.href}
                                  onClick={() => handleSubItemClick(item.name)}
                                  className={cn(
                                    "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium transition-all duration-300 relative",
                                    "hover:translate-x-0.5",
                                    isSubActive
                                      ? "bg-sidebar-primary text-white shadow-sm"
                                      : "text-sidebar-foreground hover:bg-sidebar-accent",
                                  )}
                                  style={{
                                    animationDelay: isCurrentDropdownOpen ? `${index * 0.08}s` : '0s',
                                    animationFillMode: 'both'
                                  }}
                                >
                                  <SubIcon className={cn(
                                    "h-3.5 w-3.5 shrink-0 transition-all duration-300",
                                    isSubActive
                                      ? "scale-110"
                                      : "group-hover:scale-110"
                                  )} />
                                  <span className={cn(
                                    "transition-all duration-300 text-sm",
                                    isSubActive ? "font-medium" : ""
                                  )}>
                                    {subItem.name}
                                  </span>

                                  {/* Active indicator dot */}
                                  {isSubActive && (
                                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white animate-pulse"></div>
                                  )}
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
                        onMouseEnter={() => setHoveredItem(itemKey)}
                        onMouseLeave={() => setHoveredItem(null)}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-300",
                          isActive
                            ? "bg-sidebar-primary text-white shadow-sm"
                            : "text-sidebar-foreground hover:bg-sidebar-accent",
                        )}
                      >
                        <Icon className={cn(
                          "h-4.5 w-4.5 shrink-0 transition-transform duration-300",
                          isActive ? "scale-110" : "group-hover:scale-110"
                        )} />
                        <span className={cn(
                          "transition-all duration-300",
                          isActive ? "font-medium" : ""
                        )}>
                          {item.name}
                        </span>
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Status indicator - Simplified */}
      {sidebarOpen && (
        <div className="px-3 pb-3">
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

      {/* Add CSS animations */}
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
        
        /* Smooth transitions */
        .dropdown-transition {
          transition: height 600ms cubic-bezier(0.4, 0, 0.2, 1), 
                     opacity 300ms cubic-bezier(0.4, 0, 0.2, 1),
                     transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Scrollbar styling */
        ::-webkit-scrollbar {
          width: 3px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(var(--sidebar-primary), 0.2);
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(var(--sidebar-primary), 0.3);
        }
        
        /* Staggered animation for dropdown items */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.3s ease-out forwards;
        }
      `}</style>
    </aside>
  )
}