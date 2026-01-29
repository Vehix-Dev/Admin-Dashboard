"use client"

import { User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"

import { useAuth } from "@/contexts/auth-context"

export function AdminHeader() {
  const { user, logout } = useAuth()

  return (
    <header className="glass-header z-30 flex h-16 items-center justify-between px-6">

      {/* Left: Logo / Brand */}
      <div className="flex items-center gap-3">
        <div className="p-1 rounded-lg">
          <img
            src="/logo.png"
            alt="Vehix Logo"
            className="h-8 w-auto object-contain"
          />
        </div>
        <span className="hidden sm:inline text-lg font-black text-foreground tracking-tight">
          VEHIX <span className="text-primary uppercase">Ops</span>
        </span>
      </div>

      {/* Right: Admin dropdown */}
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="gap-2 text-foreground hover:bg-muted font-medium transition-smooth"
            >
              <Avatar className="h-8 w-8 border border-border">
                <AvatarFallback className="bg-muted text-muted-foreground">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm">
                {user ? (
                  user.first_name || user.last_name
                    ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                    : user.username || "System Admin"
                ) : "System Admin"}
              </span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/admin/my-account" className="flex items-center gap-2 cursor-pointer">
                <User className="h-4 w-4" />
                My Profile & Security
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={logout}
              className="gap-2 text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
