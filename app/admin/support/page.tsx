"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Loader2, Mail, Trash2, Reply } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface Inquiry {
    id: number
    name: string
    email: string
    subject: string
    message: string
    created_at: string
    is_replied: number
}

export default function SupportPage() {
    const [inquiries, setInquiries] = useState<Inquiry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { toast } = useToast()

    const fetchInquiries = async () => {
        setIsLoading(true)
        try {
            const res = await fetch("/api/inquiries")
            if (res.ok) {
                const data = await res.json()
                setInquiries(data)
            }
        } catch (error) {
            console.error("Failed to fetch inquiries", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchInquiries()
    }, [])

    const handleReply = (email: string, subject: string) => {
        window.location.href = `mailto:${email}?subject=Re: ${subject}`
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this message?")) return;

        try {
            const res = await fetch(`/api/inquiries?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setInquiries(prev => prev.filter(i => i.id !== id));
                toast({ title: "Deleted", description: "Message removed successfully" })
            }
        } catch (err) {
            toast({ title: "Error", description: "Could not delete message", variant: "destructive" })
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Support & Inquiries</h1>
                <p className="text-muted-foreground">Manage messages submitted via the contact form.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Messages</CardTitle>
                    <CardDescription>
                        You have {inquiries.length} total messages.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                    ) : inquiries.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Mail className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p>No messages yet.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {inquiries.map((inquiry) => (
                                    <TableRow key={inquiry.id}>
                                        <TableCell className="whitespace-nowrap w-[150px] text-xs text-gray-500">
                                            {format(new Date(inquiry.created_at), "MMM d, yyyy h:mm a")}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-sm">{inquiry.name}</div>
                                            <div className="text-xs text-gray-500">{inquiry.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-sm mb-1">{inquiry.subject || "No Subject"}</div>
                                            <p className="text-xs text-gray-600 line-clamp-2 max-w-md">{inquiry.message}</p>
                                        </TableCell>
                                        <TableCell className="w-[100px]">
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost" size="icon"
                                                    title="Reply"
                                                    onClick={() => handleReply(inquiry.email, inquiry.subject)}
                                                >
                                                    <Reply className="h-4 w-4 text-blue-600" />
                                                </Button>
                                                <Button
                                                    variant="ghost" size="icon"
                                                    title="Delete"
                                                    onClick={() => handleDelete(inquiry.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
