"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
    Calculator,
    Calendar,
    CreditCard,
    Settings,
    Smile,
    User,
    Search,
    Wrench,
    Users,
    UserCheck,
    Map as MapIcon,
    Shield,
    Wallet,
    BarChart,
    LogOut,
    Bell,
    Headphones,
    Globe
} from "lucide-react"

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command"
import { useAuth } from "@/contexts/auth-context"
import { logoutAdmin } from "@/lib/auth"

export function CommandCenter() {
    const [open, setOpen] = React.useState(false)
    const router = useRouter()
    const { user } = useAuth()

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    const runCommand = React.useCallback((command: () => void) => {
        setOpen(false)
        command()
    }, [])

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList className="glass-card border-none">
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Operations">
                    <CommandItem onSelect={() => runCommand(() => router.push("/admin"))}>
                        <BarChart className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/admin/requests"))}>
                        <Wrench className="mr-2 h-4 w-4" />
                        <span>Service Requests</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/admin/live-map"))}>
                        <MapIcon className="mr-2 h-4 w-4" />
                        <span>Live Map</span>
                    </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Management">
                    <CommandItem onSelect={() => runCommand(() => router.push("/admin/roadies"))}>
                        <UserCheck className="mr-2 h-4 w-4" />
                        <span>Roadies (Providers)</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/admin/riders"))}>
                        <Users className="mr-2 h-4 w-4" />
                        <span>Riders (Customers)</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/admin/wallet"))}>
                        <Wallet className="mr-2 h-4 w-4" />
                        <span>Wallets & Transactions</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/admin/users"))}>
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Users</span>
                    </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="System">
                    <CommandItem onSelect={() => runCommand(() => router.push("/admin/settings"))}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Platform Settings</span>
                        <CommandShortcut>⌘S</CommandShortcut>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/admin/reports"))}>
                        <BarChart className="mr-2 h-4 w-4" />
                        <span>Advanced Reports</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => logoutAdmin())}>
                        <LogOut className="mr-2 h-4 w-4 text-destructive" />
                        <span className="text-destructive">Log Out</span>
                        <CommandShortcut>⌘Q</CommandShortcut>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    )
}
