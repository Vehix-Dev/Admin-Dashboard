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
import { Loader2, Send, History, Check, ChevronsUpDown } from "lucide-react"
import { useCan } from "@/components/auth/permission-guard"
import { PERMISSIONS } from "@/lib/permissions"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"

export default function NotificationsPage() {
    const [loading, setLoading] = useState(false)
    const [creating, setCreating] = useState(false)

    // Data for selection
    const [riders, setRiders] = useState<Rider[]>([])
    const [roadies, setRoadies] = useState<Roadie[]>([])
    const [fetchingUsers, setFetchingUsers] = useState(false)

    // Form State
    const [audienceType, setAudienceType] = useState<"driver" | "user">("driver")
    const [selectionMode, setSelectionMode] = useState<"manual" | "audience">("manual")
    const [deliveryType, setDeliveryType] = useState<"single" | "broadcast">("single")
    const [selectedUserId, setSelectedUserId] = useState<string>("")
    const [title, setTitle] = useState("")
    const [url, setUrl] = useState("")
    const [message, setMessage] = useState("")

    // Combobox state
    const [open, setOpen] = useState(false)

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
        if (audienceType === "driver") {
            return roadies.map(r => ({ value: String(r.id), label: `${r.first_name} ${r.last_name} (${r.username})` }))
        }
        return riders.map(r => ({ value: String(r.id), label: `${r.first_name} ${r.last_name} (${r.username})` }))
    }, [audienceType, riders, roadies])

    const selectedLabel = useMemo(() => {
        const found = currentSelectionOptions.find(opt => opt.value === selectedUserId)
        return found ? found.label : `Select ${audienceType === "driver" ? "Drivers" : "Users"}`
    }, [selectedUserId, currentSelectionOptions, audienceType])

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        setCreating(true)

        try {
            const payload: any = {
                title,
                body: message,
                broadcast: deliveryType === "broadcast",
            }

            if (url) {
                payload.data = { url }
            }

            if (deliveryType === "single") {
                if (selectionMode === "manual" && selectedUserId) {
                    payload.user = parseInt(selectedUserId)
                } else if (selectionMode === "audience") {
                    payload.target_role = audienceType === "driver" ? "RODIE" : "RIDER"
                }
            } else {
                payload.broadcast = true
            }

            await createNotification(payload)

            // Reset form
            setTitle("")
            setMessage("")
            setUrl("")
            setSelectedUserId("")

            alert("Notification sent successfully!")
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
                    <h1 className="text-3xl font-bold tracking-tight">Send Notification</h1>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/admin/notifications/history">
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
                                    setSelectedUserId("")
                                }}
                                className="flex gap-8"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="driver" id="driver" />
                                    <Label htmlFor="driver" className="font-normal cursor-pointer">Driver</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="user" id="user" />
                                    <Label htmlFor="user" className="font-normal cursor-pointer">User</Label>
                                </div>
                            </RadioGroup>

                            <RadioGroup
                                value={selectionMode}
                                onValueChange={(val: any) => setSelectionMode(val)}
                                className="flex gap-8"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="manual" id="manual" />
                                    <Label htmlFor="manual" className="font-normal cursor-pointer">Manual Selection</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="audience" id="audience" />
                                    <Label htmlFor="audience" className="font-normal cursor-pointer">Audience</Label>
                                </div>
                            </RadioGroup>

                            <RadioGroup
                                value={deliveryType}
                                onValueChange={(val: any) => setDeliveryType(val)}
                                className="flex gap-8 items-center"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="single" id="single" />
                                    <Label htmlFor="single" className="font-normal cursor-pointer text-sm">Single</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="broadcast" id="broadcast" />
                                    <Label htmlFor="broadcast" className="font-normal cursor-pointer text-sm">Broadcast</Label>
                                    <span className="text-[10px] text-red-500 italic ml-2">
                                        - *The broadcast notification will only be sent as a notification and will not be saved on the notification page.
                                    </span>
                                </div>
                            </RadioGroup>

                            {selectionMode === "manual" && (
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium">Select {audienceType === "driver" ? "Drivers" : "Users"}</Label>
                                    <Popover open={open} onOpenChange={setOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={open}
                                                className="w-full justify-between font-normal"
                                                disabled={fetchingUsers}
                                            >
                                                {fetchingUsers ? "Loading users..." : selectedLabel}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder={`Search ${audienceType === "driver" ? "drivers" : "users"}...`} />
                                                <CommandList>
                                                    <CommandEmpty>No {audienceType === "driver" ? "driver" : "user"} found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {currentSelectionOptions.map((option) => (
                                                            <CommandItem
                                                                key={option.value}
                                                                value={option.label}
                                                                onSelect={() => {
                                                                    setSelectedUserId(option.value === selectedUserId ? "" : option.value)
                                                                    setOpen(false)
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        selectedUserId === option.value ? "opacity-100" : "opacity-0"
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
                                <p className="text-[10px] text-muted-foreground">URL requires HTTP/HTTPS protocol</p>
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
                            <Button type="submit" className="w-[200px]" disabled={creating}>
                                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                Send Notification
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
