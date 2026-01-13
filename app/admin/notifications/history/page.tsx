"use client"

import { useEffect, useState } from "react"
import { getNotifications, deleteNotification, AdminNotification } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Trash2, ArrowLeft } from "lucide-react"
import { useCan } from "@/components/auth/permission-guard"
import { PERMISSIONS } from "@/lib/permissions"
import Link from "next/link"

export default function NotificationHistoryPage() {
    const [notifications, setNotifications] = useState<AdminNotification[]>([])
    const [loading, setLoading] = useState(true)
    const canManage = useCan(PERMISSIONS.NOTIFICATIONS_MANAGE)

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

    async function handleDelete(id: number) {
        if (!confirm("Are you sure you want to delete this notification?")) return
        try {
            await deleteNotification(id)
            setNotifications(prev => prev.filter(n => n.id !== id))
        } catch (err) {
            console.error("Failed to delete notification", err)
        }
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/admin/notifications">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Notification History</h1>
                    </div>
                    <p className="text-muted-foreground ml-10">
                        View past notifications sent from the admin panel.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Sent Notifications</CardTitle>
                    <CardDescription>
                        A list of all notifications sent across the platform.
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
                                            {canManage && (
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(notification.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            )}
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
