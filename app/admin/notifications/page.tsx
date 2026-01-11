"use client"

import { useEffect, useState } from "react"
import { getNotifications, createNotification, deleteNotification, AdminNotification } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Trash2, Send, Plus, UsersIcon } from "lucide-react"

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<AdminNotification[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)

    // Form State
    const [title, setTitle] = useState("")
    const [body, setBody] = useState("")
    const [targetType, setTargetType] = useState<"user" | "role" | "broadcast">("broadcast")
    const [targetId, setTargetId] = useState("")
    const [targetRole, setTargetRole] = useState<"RIDER" | "RODIE">("RIDER")

    useEffect(() => {
        fetchNotifications()
    }, [])

    async function fetchNotifications() {
        try {
            setLoading(true)
            const data = await getNotifications()
            setNotifications(data)
        } catch (err) {
            console.error("Failed to fetch notifications", err)
        } finally {
            setLoading(false)
        }
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        setCreating(true)

        try {
            const payload: any = {
                title,
                body,
                broadcast: targetType === "broadcast",
            }

            if (targetType === "role") {
                payload.target_role = targetRole
            } else if (targetType === "user" && targetId) {
                payload.user = parseInt(targetId)
            }

            await createNotification(payload)

            // Reset form
            setTitle("")
            setBody("")
            setDraggingOpen(false) // Close modal/form if implemented as such, here just refresh
            fetchNotifications()
        } catch (err) {
            console.error("Failed to create notification", err)
        } finally {
            setCreating(false)
        }
    }

    async function handleDelete(id: number) {
        if (!confirm("Are you sure you want to delete this notification?")) return
        try {
            await deleteNotification(id)
            setNotifications(prev => prev.filter(n => n.id !== id))
        } catch (err) {
            console.error("Failed to delete notification", err)
        }
    }

    // Placeholder for "New Notification" dialog or inline form
    const [isFormOpen, setFormOpen] = useState(false)
    const [draggingOpen, setDraggingOpen] = useState(false) // Using this name for consistency with pattern if needed, but simple boolean is fine

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                    <p className="text-muted-foreground">
                        View and send system-wide or targeted notifications.
                    </p>
                </div>
                <Button onClick={() => setFormOpen(!isFormOpen)}>
                    {isFormOpen ? "Cancel" : "New Notification"}
                </Button>
            </div>

            {isFormOpen && (
                <Card className="max-w-xl animate-in fade-in slide-in-from-top-4">
                    <CardHeader>
                        <CardTitle>Send Notification</CardTitle>
                        <CardDescription>Send a message to users' devices.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input
                                    required
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="Notification Title"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Body (Optional)</Label>
                                <Textarea
                                    value={body}
                                    onChange={e => setBody(e.target.value)}
                                    placeholder="Notification message body..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Target Audience</Label>
                                <div className="flex flex-wrap gap-4">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="target_broadcast"
                                            checked={targetType === "broadcast"}
                                            onCheckedChange={() => setTargetType("broadcast")}
                                        />
                                        <label htmlFor="target_broadcast" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Broadcast (Everyone)
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="target_role"
                                            checked={targetType === "role"}
                                            onCheckedChange={() => setTargetType("role")}
                                        />
                                        <label htmlFor="target_role" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            By Role
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="target_user"
                                            checked={targetType === "user"}
                                            onCheckedChange={() => setTargetType("user")}
                                        />
                                        <label htmlFor="target_user" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Specific User
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {targetType === "role" && (
                                <div className="space-y-2">
                                    <Label>Select Role</Label>
                                    <Select value={targetRole} onValueChange={(val: any) => setTargetRole(val)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="RIDER">Rider</SelectItem>
                                            <SelectItem value="RODIE">Roadie</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {targetType === "user" && (
                                <div className="space-y-2">
                                    <Label>User ID</Label>
                                    <Input
                                        required
                                        type="number"
                                        value={targetId}
                                        onChange={e => setTargetId(e.target.value)}
                                        placeholder="Enter User ID"
                                    />
                                </div>
                            )}

                            <Button type="submit" className="w-full" disabled={creating}>
                                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                Send Notification
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>History</CardTitle>
                    <CardDescription>
                        Past notifications sent from the admin panel.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Target</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : notifications.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No notifications found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                notifications.map((notification) => (
                                    <TableRow key={notification.id}>
                                        <TableCell>{notification.id}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{notification.title}</div>
                                            <div className="text-xs text-muted-foreground truncate max-w-[300px]">{notification.body}</div>
                                        </TableCell>
                                        <TableCell>
                                            {notification.broadcast && <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">Broadcast</span>}
                                            {notification.target_role && <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">Role: {notification.target_role}</span>}
                                            {notification.user && <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-muted text-muted-foreground hover:bg-muted/80">User: {notification.user}</span>}
                                        </TableCell>
                                        <TableCell>{new Date(notification.created_at).toLocaleString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(notification.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
