"use client"

import { useState, useEffect, useMemo } from "react"
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns"
import { Loader2, Trash2, Reply, Eye, Filter, Calendar as CalendarIcon, X, Search, MessageSquare, Copy } from "lucide-react"
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
import { useCan } from "@/components/auth/permission-guard"
import { PERMISSIONS } from "@/lib/permissions"
import { useToast } from "@/hooks/use-toast"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface SupportTicket {
    id: number
    support_id: string
    user: number
    user_name: string
    user_email: string
    user_phone: string
    user_type: "RIDER" | "RODIE"
    subject: string
    message: string
    status: "PENDING" | "ONGOING" | "RESOLVED"
    internal_comments: string | null
    created_at: string
    updated_at: string
    resolved_at: string | null
}

interface Dispute {
    id: number
    raised_by: number
    raised_by_username?: string
    request: number
    reason: string
    status: "PENDING" | "RESOLVED"
    created_at: string
}

export default function SupportPage() {
    const [tickets, setTickets] = useState<SupportTicket[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { toast } = useToast()
    const canManage = useCan(PERMISSIONS.SUPPORT_MANAGE)
    
    // UI States
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
    const [editingComment, setEditingComment] = useState("")
    const [showCommentForm, setShowCommentForm] = useState(false)
    const [pendingDelete, setPendingDelete] = useState<SupportTicket | null>(null)
    
    // Filter States
    const [showFilters, setShowFilters] = useState(false)
    const [startDate, setStartDate] = useState<Date | undefined>(undefined)
    const [endDate, setEndDate] = useState<Date | undefined>(undefined)
    const [statusFilter, setStatusFilter] = useState<string>("ALL")
    const [userTypeFilter, setUserTypeFilter] = useState<string>("ALL")
    const [searchTerm, setSearchTerm] = useState("")

    const fetchTickets = async () => {
        setIsLoading(true)
        try {
            // Call API to fetch support tickets
            const response = await fetch("/api/auth/admin/support-tickets/", {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
                }
            })
            if (response.ok) {
                const data = await response.json()
                setTickets(Array.isArray(data) ? data : data.results || [])
            }
        } catch (error) {
            console.error("Failed to fetch tickets", error)
            toast({
                title: "Fetch Error",
                description: "Failed to load support tickets.",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchTickets()
    }, [])

    const filteredTickets = tickets.filter(ticket => {
        // Status filter
        if (statusFilter !== "ALL" && ticket.status !== statusFilter) {
            return false
        }

        // User type filter
        if (userTypeFilter !== "ALL" && ticket.user_type !== userTypeFilter) {
            return false
        }

        // Date range filter
        if (startDate && endDate) {
            const ticketDate = new Date(ticket.created_at)
            if (!isWithinInterval(ticketDate, {
                start: startOfDay(startDate),
                end: endOfDay(endDate)
            })) {
                return false
            }
        }

        // Search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase()
            return (
                ticket.support_id.toLowerCase().includes(search) ||
                ticket.user_name.toLowerCase().includes(search) ||
                ticket.user_email.toLowerCase().includes(search) ||
                ticket.message.toLowerCase().includes(search)
            )
        }

        return true
    })

    const handleStatusChange = async (ticket: SupportTicket, newStatus: string) => {
        try {
            const response = await fetch(`/api/auth/admin/support-tickets/${ticket.id}/update_status/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
                },
                body: JSON.stringify({ status: newStatus })
            })
            if (response.ok) {
                const updated = await response.json()
                setTickets(tickets.map(t => t.id === ticket.id ? updated : t))
                if (selectedTicket?.id === ticket.id) {
                    setSelectedTicket(updated)
                }
                toast({ title: "Updated", description: "Ticket status updated successfully." })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" })
        }
    }

    const handleAddComment = async (ticket: SupportTicket) => {
        if (!editingComment.trim()) return

        try {
            const response = await fetch(`/api/auth/admin/support-tickets/${ticket.id}/add_comment/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
                },
                body: JSON.stringify({ comment: editingComment })
            })
            if (response.ok) {
                const updated = await response.json()
                setTickets(tickets.map(t => t.id === ticket.id ? updated : t))
                setSelectedTicket(updated)
                setEditingComment("")
                setShowCommentForm(false)
                toast({ title: "Success", description: "Comment added successfully." })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to add comment", variant: "destructive" })
        }
    }

    const handleDelete = async () => {
        if (!pendingDelete) return

        try {
            const response = await fetch(`/api/auth/admin/support-tickets/${pendingDelete.id}/`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
                }
            })
            if (response.ok) {
                setTickets(tickets.filter(t => t.id !== pendingDelete.id))
                if (selectedTicket?.id === pendingDelete.id) {
                    setSelectedTicket(null)
                }
                toast({ title: "Deleted", description: "Ticket deleted successfully." })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete ticket", variant: "destructive" })
        } finally {
            setPendingDelete(null)
        }
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            "PENDING": "bg-yellow-100 text-yellow-800",
            "ONGOING": "bg-blue-100 text-blue-800",
            "RESOLVED": "bg-green-100 text-green-800",
        }
        return colors[status] || "bg-gray-100 text-gray-800"
    }

    const getUserTypeColor = (type: string) => {
        return type === "RIDER" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Support & Inquiries</h1>
                    <p className="text-gray-500">Manage support messages from Riders and Roadies</p>
                </div>
            </div>

            {/* Search and Filter Bar */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-2 flex-wrap">
                        <div className="flex-1 min-w-64">
                            <Input
                                placeholder="Search by Support ID, name, email, or message..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                            className="gap-2"
                        >
                            <Filter className="h-4 w-4" />
                            Filters
                        </Button>
                    </div>

                    {showFilters && (
                        <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label>Status</Label>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">All Statuses</SelectItem>
                                            <SelectItem value="PENDING">Pending</SelectItem>
                                            <SelectItem value="ONGOING">Ongoing</SelectItem>
                                            <SelectItem value="RESOLVED">Resolved</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>User Type</Label>
                                    <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">All Users</SelectItem>
                                            <SelectItem value="RIDER">Riders</SelectItem>
                                            <SelectItem value="RODIE">Roadies</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Date Range</Label>
                                    <div className="flex gap-2">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" size="sm" className="w-full">
                                                    <CalendarIcon className="h-4 w-4 mr-1" />
                                                    {startDate ? format(startDate, "MMM d") : "From"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={startDate}
                                                    onSelect={setStartDate}
                                                    disabled={(date) =>
                                                        endDate ? date > endDate : false
                                                    }
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" size="sm" className="w-full">
                                                    <CalendarIcon className="h-4 w-4 mr-1" />
                                                    {endDate ? format(endDate, "MMM d") : "To"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={endDate}
                                                    onSelect={setEndDate}
                                                    disabled={(date) =>
                                                        startDate ? date < startDate : false
                                                    }
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 justify-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setStartDate(undefined)
                                        setEndDate(undefined)
                                        setStatusFilter("ALL")
                                        setUserTypeFilter("ALL")
                                    }}
                                >
                                    Clear Filters
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Tickets Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Tickets ({filteredTickets.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="text-center py-12">
                            <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                            <p className="text-gray-500">No support tickets found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Support ID</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTickets.map((ticket) => (
                                        <TableRow
                                            key={ticket.id}
                                            className="cursor-pointer hover:bg-gray-50"
                                            onClick={() => setSelectedTicket(ticket)}
                                        >
                                            <TableCell className="font-mono text-sm">{ticket.support_id}</TableCell>
                                            <TableCell className="text-sm">
                                                {format(new Date(ticket.created_at), "MMM d, yyyy HH:mm")}
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <div className="font-medium">{ticket.user_name}</div>
                                                    <div className="text-xs text-gray-500">{ticket.user_email}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getUserTypeColor(ticket.user_type)}>
                                                    {ticket.user_type === "RIDER" ? "Rider" : "Roadie"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getStatusColor(ticket.status)}>
                                                    {ticket.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setSelectedTicket(ticket)
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Ticket Details Dialog */}
            <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    {selectedTicket && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <DialogTitle>{selectedTicket.support_id}</DialogTitle>
                                        <DialogDescription>
                                            {format(new Date(selectedTicket.created_at), "PPP p")}
                                        </DialogDescription>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            navigator.clipboard.writeText(selectedTicket.support_id)
                                            toast({ title: "Copied", description: "Support ID copied to clipboard" })
                                        }}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </DialogHeader>

                            <div className="space-y-6">
                                {/* User Information */}
                                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <Label className="text-xs text-gray-600">Name</Label>
                                        <p className="font-medium">{selectedTicket.user_name}</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-gray-600">Type</Label>
                                        <Badge className={getUserTypeColor(selectedTicket.user_type)}>
                                            {selectedTicket.user_type === "RIDER" ? "Rider" : "Roadie"}
                                        </Badge>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-gray-600">Email</Label>
                                        <p className="text-sm text-blue-600 cursor-pointer" onClick={() => {
                                            window.location.href = `mailto:${selectedTicket.user_email}`
                                        }}>
                                            {selectedTicket.user_email}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-gray-600">Phone</Label>
                                        <p className="text-sm">{selectedTicket.user_phone}</p>
                                    </div>
                                </div>

                                {/* Status and Subject */}
                                <div className="space-y-3">
                                    <div>
                                        <Label>Subject</Label>
                                        <p className="text-sm font-medium">{selectedTicket.subject}</p>
                                    </div>

                                    <div>
                                        <Label>Status</Label>
                                        {canManage ? (
                                            <Select
                                                value={selectedTicket.status}
                                                onValueChange={(newStatus) =>
                                                    handleStatusChange(selectedTicket, newStatus)
                                                }
                                            >
                                                <SelectTrigger className="w-32">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="PENDING">Pending</SelectItem>
                                                    <SelectItem value="ONGOING">Ongoing</SelectItem>
                                                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Badge className={getStatusColor(selectedTicket.status)}>
                                                {selectedTicket.status}
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Message */}
                                <div>
                                    <Label>Message</Label>
                                    <div className="p-4 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                                        {selectedTicket.message}
                                    </div>
                                </div>

                                {/* Internal Comments */}
                                <div>
                                    <Label>Internal Comments</Label>
                                    {selectedTicket.internal_comments ? (
                                        <div className="p-4 bg-blue-50 rounded-lg text-sm whitespace-pre-wrap break-words max-h-40 overflow-y-auto font-mono text-xs">
                                            {selectedTicket.internal_comments}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No comments yet</p>
                                    )}
                                </div>

                                {/* Add Comment */}
                                {canManage && (
                                    <div>
                                        {!showCommentForm ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowCommentForm(true)}
                                            >
                                                Add Comment
                                            </Button>
                                        ) : (
                                            <div className="space-y-2">
                                                <Textarea
                                                    placeholder="Add internal comment..."
                                                    value={editingComment}
                                                    onChange={(e) => setEditingComment(e.target.value)}
                                                    className="min-h-20"
                                                />
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleAddComment(selectedTicket)}
                                                    >
                                                        Save Comment
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setShowCommentForm(false)
                                                            setEditingComment("")
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <DialogFooter>
                                {canManage && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => {
                                            setPendingDelete(selectedTicket)
                                            setSelectedTicket(null)
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Ticket
                                    </Button>
                                )}
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <ConfirmModal
                isOpen={!!pendingDelete}
                title="Delete Support Ticket"
                description={`Are you sure you want to delete ticket ${pendingDelete?.support_id}? This action cannot be undone.`}
                onConfirm={handleDelete}
                onCancel={() => setPendingDelete(null)}
            />
            <DisputesSection />
        </div>
    )
}

function DisputesSection() {
    const { toast } = useToast()
    const [disputes, setDisputes] = useState<Dispute[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [viewDispute, setViewDispute] = useState<Dispute | null>(null)
    const [editStatus, setEditStatus] = useState<string>("PENDING")
    const [editComment, setEditComment] = useState("")
    const [pendingDeleteDispute, setPendingDeleteDispute] = useState<Dispute | null>(null)
    const [showFilters, setShowFilters] = useState(false)
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [startDate, setStartDate] = useState<Date | undefined>(undefined)
    const [endDate, setEndDate] = useState<Date | undefined>(undefined)

    const fetchDisputes = async () => {
        setIsLoading(true)
        try {
            const response = await fetch("/api/auth/admin/disputes/", {
                headers: { "Authorization": `Bearer ${localStorage.getItem("access_token")}` }
            })
            if (response.ok) {
                const data = await response.json()
                setDisputes(Array.isArray(data) ? data : data.results || [])
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch disputes.", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    const updateDispute = async (id: number, data: Partial<Dispute>) => {
        const response = await fetch(`/api/auth/admin/disputes/${id}/`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
            },
            body: JSON.stringify(data)
        })
        if (!response.ok) throw new Error("Failed to update dispute")
        return response.json()
    }

    const confirmDelete = async () => {
        if (!pendingDeleteDispute) return
        try {
            await fetch(`/api/auth/admin/disputes/${pendingDeleteDispute.id}/`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${localStorage.getItem("access_token")}` }
            })
            setDisputes(prev => prev.filter(d => d.id !== pendingDeleteDispute.id))
            toast({ title: "Deleted", description: "Dispute deleted successfully." })
        } catch (err) {
            toast({ title: "Error", description: "Failed to delete dispute.", variant: "destructive" })
        } finally {
            setPendingDeleteDispute(null)
        }
    }

    useEffect(() => { fetchDisputes() }, [])

    const openViewModal = (dispute: Dispute) => {
        setViewDispute(dispute)
        setEditStatus(dispute.status)
        setEditComment("") // disputes don't have internal comments yet in backend
    }

    const saveUpdates = async () => {
        if (!viewDispute) return
        
        try {
            await updateDispute(viewDispute.id, { status: editStatus })
            toast({ title: "Updated", description: "Dispute status synchronized with backend." })
            fetchDisputes()
            setViewDispute(null)
        } catch (err) {
            toast({ title: "Error", description: "Failed to update dispute status", variant: "destructive" })
        }
    }

    const clearFilters = () => {
        setStartDate(undefined)
        setEndDate(undefined)
        setStatusFilter("ALL")
    }

    const filteredDisputes = useMemo(() => {
        return disputes.filter(r => {
            // Date Filter
            const reqDate = new Date(r.created_at)
            const st = startDate ? startOfDay(startDate) : new Date(0)
            const en = endDate ? endOfDay(endDate) : new Date()
            if (!isWithinInterval(reqDate, { start: st, end: en })) return false
            
            // Status Filter
            if (statusFilter !== "ALL" && r.status !== statusFilter) return false
            
            return true
        })
    }, [disputes, startDate, endDate, statusFilter])

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'RESOLVED': return <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">Resolved</Badge>
            case 'PENDING': 
            default: return <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-700">Pending</Badge>
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Support, Inquiries & Feedback</h1>
                    <p className="text-muted-foreground">Manage messages submitted via the Feedback/Inquiries form.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant={showFilters ? "default" : "outline"}
                        onClick={() => setShowFilters(!showFilters)}
                        className="gap-2"
                    >
                        <Filter className="h-4 w-4" />
                        {showFilters ? "Hide Filters" : "Filter Messages"}
                    </Button>
                </div>
            </div>

            {showFilters && (
                <Card className="border-primary/20 bg-primary/5 transition-all">
                    <CardContent className="p-4 flex flex-wrap items-end gap-6">
                        <div className="space-y-2 flex-1 min-w-[150px] max-w-[200px]">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Status</label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="bg-card">
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Statuses</SelectItem>
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Start Date</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-[140px] justify-start text-left font-normal h-10 border-border bg-card",
                                            !startDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                                        {startDate ? format(startDate, "MMM d, yyyy") : "Date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">End Date</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-[140px] justify-start text-left font-normal h-10 border-border bg-card",
                                            !endDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                                        {endDate ? format(endDate, "MMM d, yyyy") : "Date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="text-muted-foreground hover:text-foreground h-10 px-4"
                            >
                                <X className="h-4 w-4 mr-2" />
                                Clear All
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Dispute Management</CardTitle>
                    <CardDescription>
                        {filteredDisputes.length} active disputes requiring attention.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[120px] pl-6">Dispute ID</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Raised By</TableHead>
                                    <TableHead>Associated Request</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="px-6 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDisputes.map((dispute) => (
                                    <TableRow 
                                        key={dispute.id} 
                                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => openViewModal(dispute)}
                                    >
                                        <TableCell className="pl-6 font-mono text-xs font-semibold text-primary">
                                            {`DIS-${String(dispute.id).padStart(4, '0')}`}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                                            {format(new Date(dispute.created_at), "MMM d, yyyy")}
                                            <div className="text-[10px] opacity-70">{format(new Date(dispute.created_at), "h:mm a")}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-sm text-foreground">
                                                {dispute.raised_by_username || `User #${dispute.raised_by}`}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-medium text-[10px]">
                                                Request #{dispute.request}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{dispute.reason}</p>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(dispute.status)}
                                        </TableCell>
                                        <TableCell className="pr-6 text-right">
                                            <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                                                <Button
                                                    variant="ghost" size="icon"
                                                    title="View"
                                                    onClick={() => openViewModal(dispute)}
                                                >
                                                    <Eye className="h-4 w-4 text-foreground/70 group-hover:text-foreground" />
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

            {/* Detailed View Modal */}
            <Dialog open={!!viewDispute} onOpenChange={(open) => !open && setViewDispute(null)}>
                <DialogContent className="sm:max-w-[700px]">
                    {viewDispute && (
                        <>
                            <DialogHeader className="pb-4 border-b">
                                <div className="flex items-center justify-between pr-8">
                                    <div className="flex items-center gap-3">
                                        <DialogTitle className="text-xl">Dispute Details</DialogTitle>
                                        <Badge variant="outline" className="font-mono bg-primary/5 text-primary border-primary/20">
                                            {`DIS-${String(viewDispute.id).padStart(4, '0')}`}
                                        </Badge>
                                    </div>
                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                        <CalendarIcon className="h-4 w-4" />
                                        {format(new Date(viewDispute.created_at), "MMM d, yyyy - h:mm a")}
                                    </div>
                                </div>
                            </DialogHeader>
                            
                            <div className="grid grid-cols-3 gap-6 py-4">
                                {/* Left Column: Client Details */}
                                <div className="col-span-1 border-r pr-6 space-y-6">
                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Context</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <Label className="text-[10px] text-muted-foreground mb-1 block">Raised By</Label>
                                                <div className="font-medium text-sm">{viewDispute.raised_by_username || `User #${viewDispute.raised_by}`}</div>
                                            </div>
                                            <div>
                                                <Label className="text-[10px] text-muted-foreground mb-1 block">Request ID</Label>
                                                <div className="text-sm font-mono text-primary">#{viewDispute.request}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Message & Actions */}
                                <div className="col-span-2 space-y-6">
                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Dispute Reason</h4>
                                        <div className="bg-muted/30 p-4 rounded-md border border-border">
                                            <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                                                {viewDispute.reason}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-xs font-semibold mb-2 block">Resolution Status</Label>
                                            <Select value={editStatus} onValueChange={(val: any) => setEditStatus(val)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="PENDING">Pending</SelectItem>
                                                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="border-t pt-4 sm:justify-end items-center">
                                <div className="space-x-2">
                                    <Button variant="secondary" onClick={() => setViewDispute(null)}>Cancel</Button>
                                    <Button onClick={saveUpdates}>Sync with Backend</Button>
                                </div>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <ConfirmModal
                isOpen={!!pendingDeleteDispute}
                onClose={() => setPendingDeleteDispute(null)}
                onConfirm={confirmDelete}
                title="Delete Dispute"
                description="Are you sure you want to delete this dispute record? This action cannot be undone."
            />
        </div>
    )
}
