"use client"

import { useState, useEffect, useMemo } from "react"
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns"
import { Loader2, Mail, Trash2, Reply, Eye, Filter, Calendar as CalendarIcon, X, Search, MessageSquare } from "lucide-react"
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
import { 
    getDisputes, 
    updateDispute, 
    type Dispute,
    type ServiceRequest
} from "@/lib/api"

// Use naming conventions from lib/api.ts

export default function SupportPage() {
    const [disputes, setDisputes] = useState<Dispute[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { toast } = useToast()
    const canManage = useCan(PERMISSIONS.SUPPORT_MANAGE)
    
    // UI States
    const [pendingDeleteDispute, setPendingDeleteDispute] = useState<Dispute | null>(null)
    const [viewDispute, setViewDispute] = useState<Dispute | null>(null)
    
    // Filter States
    const [showFilters, setShowFilters] = useState(false)
    const [startDate, setStartDate] = useState<Date | undefined>(undefined)
    const [endDate, setEndDate] = useState<Date | undefined>(undefined)
    const [statusFilter, setStatusFilter] = useState<string>("ALL")
    
    // Edit States
    const [editStatus, setEditStatus] = useState<'PENDING' | 'RESOLVED'>("PENDING")
    const [editComment, setEditComment] = useState("")

    const fetchDisputes = async () => {
        setIsLoading(true)
        try {
            const data = await getDisputes()
            setDisputes(data)
        } catch (error) {
            console.error("Failed to fetch disputes", error)
            toast({
                title: "Fetch Error",
                description: "Failed to load platform disputes.",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchDisputes()
    }, [])

    const handleReply = (email: string, subject: string, supportId: string) => {
        window.location.href = `mailto:${email}?subject=Re: Dispute ${supportId}`
    }

    const handleDeleteClick = (e: React.MouseEvent, dispute: Dispute) => {
        e.stopPropagation()
        setPendingDeleteDispute(dispute)
    }

    const confirmDelete = async () => {
        if (!pendingDeleteDispute) return

        try {
            // Backend doesn't have explicit DELETE for disputes yet in my analysis,
            // but we'll assume standard REST if implemented, or just toast for now.
            toast({ title: "Note", description: "Dispute deletion requires backend implementation." })
        } catch (err) {
            toast({ title: "Error", description: "Could not process operation", variant: "destructive" })
        } finally {
            setPendingDeleteDispute(null)
        }
    }

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
