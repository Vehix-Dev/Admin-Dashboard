"use client"

import { useEffect, useState, useMemo } from "react"
import { createNotification, getRiders, getRoadies, Rider, Roadie } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Loader2, Send, History, Check, ChevronsUpDown, X } from "lucide-react"
import { useCan } from "@/components/auth/permission-guard"
import { PERMISSIONS } from "@/lib/permissions"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

export default function NotificationsPage() {
    const [loading, setLoading] = useState(false)
    const [creating, setCreating] = useState(false)
    const [riders, setRiders] = useState<Rider[]>([])
    const [roadies, setRoadies] = useState<Roadie[]>([])
    const [fetchingUsers, setFetchingUsers] = useState(false)
    const [audienceType, setAudienceType] = useState<"roadie" | "rider">("roadie")
    const [selectionMode, setSelectionMode] = useState<"manual" | "audience">("manual")
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
    const [title, setTitle] = useState("")
    const [url, setUrl] = useState("")
    const [message, setMessage] = useState("")
    const [open, setOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")

    const canManage = useCan(PERMISSIONS.NOTIFICATIONS_MANAGE)

    useEffect(() => {
        fetchUsers()
    }, [])

    async function fetchUsers() {
        try {
            setFetchingUsers(true)
            const [ridersData, roadiesData] = await Promise.all([
                getRiders(),
                getRoadies()
            ])
            setRiders(ridersData)
            setRoadies(roadiesData)
        } catch (err) {
            console.error("Failed to fetch users", err)
        } finally {
            setFetchingUsers(false)
        }
    }

    const currentSelectionOptions = useMemo(() => {
        if (audienceType === "roadie") {
            return roadies.map(r => ({ value: String(r.id), label: `${r.first_name} ${r.last_name} (${r.username})` }))
        }
        return riders.map(r => ({ value: String(r.id), label: `${r.first_name} ${r.last_name} (${r.username})` }))
    }, [audienceType, riders, roadies])

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return currentSelectionOptions
        return currentSelectionOptions.filter(opt => 
            opt.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [currentSelectionOptions, searchTerm])

    const selectedUsers = useMemo(() => {
        return currentSelectionOptions.filter(opt => selectedUserIds.has(opt.value))
    }, [selectedUserIds, currentSelectionOptions])

    const handleSelectUser = (userId: string) => {
        const newSelected = new Set(selectedUserIds)
        if (newSelected.has(userId)) {
            newSelected.delete(userId)
        } else {
            newSelected.add(userId)
        }
        setSelectedUserIds(newSelected)
    }

    const handleSelectAll = () => {
        if (selectedUserIds.size === currentSelectionOptions.length) {
            setSelectedUserIds(new Set())
        } else {
            setSelectedUserIds(new Set(currentSelectionOptions.map(opt => opt.value)))
        }
    }

    const handleRemoveUser = (userId: string) => {
        const newSelected = new Set(selectedUserIds)
        newSelected.delete(userId)
        setSelectedUserIds(newSelected)
    }

    async function sendNotificationToMultipleUsers() {
        const payload: any = {
            title,
            body: message,
            broadcast: false,
        }

        if (url) {
            payload.data = { url }
        }

        const errors: { userId: string; error: string }[] = []
        let successCount = 0

        // Send notification to each selected user one by one
        for (const userId of selectedUserIds) {
            try {
                const notificationPayload = {
                    ...payload,
                    user: parseInt(userId)
                }
                await createNotification(notificationPayload)
                successCount++
            } catch (err) {
                console.error(`Failed to send to user ${userId}:`, err)
                errors.push({ 
                    userId, 
                    error: err instanceof Error ? err.message : "Unknown error" 
                })
            }
        }

        if (errors.length > 0) {
            alert(`Sent to ${successCount} users. Failed to send to ${errors.length} users. Check console for details.`)
        } else {
            alert(`Successfully sent notification to ${successCount} users!`)
        }
    }

    async function sendNotificationToAudience() {
        const targetRole = audienceType === "roadie" ? "RODIE" : "RIDER"
        const payload: any = {
            title,
            body: message,
            target_role: targetRole,
            broadcast: false,
        }

        if (url) {
            payload.data = { url }
        }

        await createNotification(payload)
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        
        if (!title.trim() || !message.trim()) {
            alert("Please fill in both title and message")
            return
        }

        setCreating(true)

        try {
            if (selectionMode === "manual") {
                if (selectedUserIds.size === 0) {
                    alert("Please select at least one user")
                    setCreating(false)
                    return
                }
                // Send to multiple selected users
                await sendNotificationToMultipleUsers()
            } else {
                // Send to entire audience (all riders or all roadies)
                await sendNotificationToAudience()
                alert(`Notification sent to all ${audienceType === "roadie" ? "roadies" : "riders"}!`)
            }

            // Reset form
            setTitle("")
            setMessage("")
            setUrl("")
            setSelectedUserIds(new Set())
        } catch (err) {
            console.error("Failed to create notification", err)
            alert("Failed to send notification. Check console for details.")
        } finally {
            setCreating(false)
        }
    }

    if (!canManage) {
        return <div className="p-6">You do not have permission to view this page.</div>
    }

    return (
        <div className="space-y-6 p-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Send Notification</h1>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/sys-admin/notifications/history">
                        <History className="mr-2 h-4 w-4" />
                        View History
                    </Link>
                </Button>
            </div>

            <Card className="border-none shadow-none bg-transparent">
                <CardContent className="p-0">
                    <form onSubmit={handleCreate} className="space-y-10">
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Audience Info</h2>
                                <Separator className="mb-6" />
                            </div>

                            <RadioGroup
                                value={audienceType}
                                onValueChange={(val: any) => {
                                    setAudienceType(val)
                                    setSelectedUserIds(new Set())
                                }}
                                className="flex gap-8"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="roadie" id="roadie" />
                                    <Label htmlFor="roadie" className="font-normal cursor-pointer">Roadie</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="rider" id="rider" />
                                    <Label htmlFor="rider" className="font-normal cursor-pointer">Rider</Label>
                                </div>
                            </RadioGroup>

                            <RadioGroup
                                value={selectionMode}
                                onValueChange={(val: any) => {
                                    setSelectionMode(val)
                                    setSelectedUserIds(new Set())
                                }}
                                className="flex gap-8"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="manual" id="manual" />
                                    <Label htmlFor="manual" className="font-normal cursor-pointer">Manual Selection</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="audience" id="audience" />
                                    <Label htmlFor="audience" className="font-normal cursor-pointer">All {audienceType === "roadie" ? "Roadies" : "Riders"}</Label>
                                </div>
                            </RadioGroup>

                            {selectionMode === "manual" && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-medium">
                                            Select {audienceType === "roadie" ? "Roadies" : "Riders"} 
                                            {selectedUserIds.size > 0 && ` (${selectedUserIds.size} selected)`}
                                        </Label>
                                        {currentSelectionOptions.length > 0 && (
                                            <Button 
                                                type="button"
                                                variant="ghost" 
                                                size="sm"
                                                onClick={handleSelectAll}
                                                className="text-xs"
                                            >
                                                {selectedUserIds.size === currentSelectionOptions.length ? "Deselect All" : "Select All"}
                                            </Button>
                                        )}
                                    </div>
                                    
                                    <Popover open={open} onOpenChange={setOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={open}
                                                className="w-full justify-between font-normal"
                                                disabled={fetchingUsers}
                                            >
                                                {fetchingUsers ? "Loading users..." : "Search and select users..."}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                            <Command>
                                                <CommandInput 
                                                    placeholder={`Search ${audienceType === "roadie" ? "roadies" : "riders"}...`}
                                                    value={searchTerm}
                                                    onValueChange={setSearchTerm}
                                                />
                                                <CommandList>
                                                    <CommandEmpty>No {audienceType === "roadie" ? "roadie" : "rider"} found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {filteredOptions.map((option) => (
                                                            <CommandItem
                                                                key={option.value}
                                                                value={option.label}
                                                                onSelect={() => {
                                                                    handleSelectUser(option.value)
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        selectedUserIds.has(option.value) ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {option.label}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>

                                    {/* Selected users badges */}
                                    {selectedUsers.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-3 p-3 border rounded-md bg-muted/30">
                                            <span className="text-xs text-muted-foreground mr-1">Selected:</span>
                                            {selectedUsers.map((user) => (
                                                <Badge key={user.value} variant="secondary" className="gap-1">
                                                    {user.label}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveUser(user.value)}
                                                        className="ml-1 hover:text-destructive"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-6 pt-2">
                            <div>
                                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Notification Info</h2>
                                <Separator className="mb-6" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-sm font-medium">Title</Label>
                                <Input
                                    id="title"
                                    required
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="Enter Title"
                                    className="w-full"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="url" className="text-sm font-medium">URL</Label>
                                <Input
                                    id="url"
                                    value={url}
                                    onChange={e => setUrl(e.target.value)}
                                    placeholder="http://www.example.com"
                                    className="w-full"
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    Optional deep link opened when the recipient taps the notification. 
                                    Use HTTP/HTTPS for web pages or an app route supported by the mobile app.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message" className="text-sm font-medium">Message</Label>
                                <Textarea
                                    id="message"
                                    required
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    placeholder="Enter Message"
                                    className="min-h-[160px] w-full resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button 
                                type="submit" 
                                className="w-[200px]" 
                                disabled={creating}
                            >
                                {creating ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="mr-2 h-4 w-4" />
                                )}
                                {selectionMode === "manual" && selectedUserIds.size > 1 
                                    ? `Send to ${selectedUserIds.size} Users` 
                                    : "Send Notification"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}