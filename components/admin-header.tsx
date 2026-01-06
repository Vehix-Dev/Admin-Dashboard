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

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-sky-500 px-6 shadow-sm">

      {/* Left: Logo / Brand */}
      <div className="flex items-center gap-3">
        <img
          src="/vehix-logo.jpg"
          alt="Vehix logo"
          className="h-8 w-auto"
        />
        <span className="hidden sm:inline text-lg font-semibold text-white">
          Vehix Admin Panel
        </span>
      </div>

      {/* Right: Admin dropdown */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="gap-2 text-white hover:bg-white/20"
            >
              <Avatar className="h-8 w-8 bg-white/30">
                <AvatarFallback className="bg-white/30 text-white">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm font-medium">
                System Admin
              </span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                localStorage.removeItem("admin_token")
                window.location.href = "/login"
              }}
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
