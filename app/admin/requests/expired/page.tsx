"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { DataTable } from "@/components/management/data-table"
import { EmptyState } from "@/components/dashboard/empty-state"
import {
    getServiceRequests,
    type ServiceRequest,
    getRiders,
    getRoadies,
    getServices,
    type Rider,
    type Roadie,
    type Service,
    getServiceName,
    getStatusLabel,
    getStatusColor as getStatusColorHelper,
    type ServiceStatus,
    SERVICE_STATUSES
} from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    FileDown,
    Search,
    X,
    Loader2,
    Filter,
    CalendarIcon,
    ExternalLink,
    Clock
} from "lucide-react"
import { debounce } from "lodash"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface RequestRow extends Omit<ServiceRequest, 'id'> {
    id: string
}

export default function ExpiredRequestsPage() {
    const router = useRouter()
    const [requests, setRequests] = useState<RequestRow[]>([])
    const [filteredRequests, setFilteredRequests] = useState<RequestRow[]>([])
    const [services, setServices] = useState<Service[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSearching, setIsSearching] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [searchInput, setSearchInput] = useState("")

    // Filter states
    const [serviceTypeFilter, setServiceTypeFilter] = useState<string>("all")
    const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined)
    const [showFilters, setShowFilters] = useState(false)

    const { toast } = useToast()

    const debouncedSearch = useCallback(
        debounce((query: string) => {
            if (query !== searchQuery) {
                setIsSearching(true)
                setTimeout(() => {
                    setSearchQuery(query)
                    setIsSearching(false)
                }, 150)
            }
        }, 300),
        [searchQuery]
    )

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchInput(value)
        if (value.trim()) {
            setIsSearching(true)
        }
        debouncedSearch(value)
    }

    const clearSearch = () => {
        setSearchInput("")
        setSearchQuery("")
        setIsSearching(false)
    }

    const clearFilters = () => {
        setServiceTypeFilter("all")
        setDateFilter(undefined)
    }

    const fetchAllData = async () => {
        setIsLoading(true)
        try {
            const [requestsData, servicesData] = await Promise.all([
                getServiceRequests(),
                getServices()
            ])

            // Filter for expired requests
            const expiredRequests = requestsData.filter(req =>
                req.status === "EXPIRED" || req.status === "expired"
            )

            const requestsWithStringId = expiredRequests.map((req) => ({
                ...req,
                id: String(req.id),
                rider_lat: req.rider_lat,
                rider_lng: req.rider_lng,
            }))
            setRequests(requestsWithStringId)
            setFilteredRequests(requestsWithStringId)
            setServices(servicesData)
        } catch (err) {
            console.error("Data fetch error:", err)
            toast({
                title: "Error",
                description: "Failed to load expired requests.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchAllData()
    }, [])

    useEffect(() => {
        if (requests.length === 0) {
            setFilteredRequests([])
            return
        }

        let filtered = [...requests]

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim()
            filtered = filtered.filter((request) => {
                const searchFields = [
                    request.id.toLowerCase(),
                    request.rider_username?.toLowerCase() || "",
                    request.rodie_username?.toLowerCase() || "",
                    request.service_type_name?.toLowerCase() || getServiceName(request as any).toLowerCase(),
                    request.status?.toLowerCase() || "",
                    formatLocation(request.rider_lat, request.rider_lng).toLowerCase(),
                ]
                return searchFields.some(field => field.includes(query))
            })
        }

        if (serviceTypeFilter !== "all") {
            filtered = filtered.filter(request => request.service_type.toString() === serviceTypeFilter)
        }

        if (dateFilter) {
            const filterDate = format(dateFilter, 'yyyy-MM-dd')
            filtered = filtered.filter(request => {
                const requestDate = new Date(request.created_at)
                return format(requestDate, 'yyyy-MM-dd') === filterDate
            })
        }

        setFilteredRequests(filtered)
    }, [searchQuery, serviceTypeFilter, dateFilter, requests])

    const handleIdClick = (id: string) => {
        router.push(`/admin/requests/${id}`)
    }

    const handleExport = () => {
        try {
            const headers = ['ID', 'Rider', 'Roadie', 'Service', 'Status', 'CreatedAt']
            const csvData = filteredRequests.map(request => [
                request.id,
                `"${request.rider_username || ''}"`,
                `"${request.rodie_username || ''}"`,
                `"${request.service_type_name || getServiceName(request as any)}"`,
                `"${getStatusLabel(request.status as ServiceStatus)}"`,
                `"${formatDate(request.created_at)}"`
            ])

            const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n')
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `expired_requests_${format(new Date(), 'yyyy-MM-dd')}.csv`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

            toast({ title: "Success", description: "Expired requests exported successfully" })
        } catch (err) {
            toast({ title: "Error", description: "Failed to export requests", variant: "destructive" })
        }
    }

    const formatLocation = (lat: any, lng: any): string => {
        if (!lat || !lng) return "N/A"
        return `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`
    }

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), "MMM d, yyyy HH:mm")
        } catch {
            return dateString
        }
    }

    const getServiceDisplayName = (row: RequestRow): string => {
        return row.service_type_name || getServiceName(row as any)
    }

    const columns = [
        {
            header: "ID",
            accessor: "id" as const,
            cell: (value: string) => (
                <button
                    onClick={() => handleIdClick(value)}
                    className="text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
                >
                    #{value}
                    <ExternalLink className="h-3 w-3" />
                </button>
            ),
        },
        {
            header: "Rider",
            accessor: "rider_username" as const,
            cell: (value: string | null) => value || "Unassigned",
        },
        {
            header: "Roadie",
            accessor: "rodie_username" as const,
            cell: (value: string | null) => value || "Unassigned",
        },
        {
            header: "Service",
            accessor: "service_type" as const,
            cell: (value: any, row: RequestRow) => (
                <div className="flex flex-col">
                    <span className="font-medium">{getServiceDisplayName(row)}</span>
                    <span className="text-xs text-muted-foreground">{row.service_type_details?.code}</span>
                </div>
            ),
        },
        {
            header: "Status",
            accessor: "status" as const,
            cell: (value: string) => (
                <Badge variant="outline" className="border-gray-500/20 bg-gray-500/10 text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {getStatusLabel(value as ServiceStatus)}
                </Badge>
            ),
        },
        {
            header: "Expired At",
            accessor: "updated_at" as const,
            cell: (value: string) => formatDate(value),
        },
        {
            header: "Created",
            accessor: "created_at" as const,
            cell: (value: string) => formatDate(value),
        }
    ]

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Clock className="h-8 w-8 text-muted-foreground" />
                        Expired Requests
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Requests that were not accepted by any Roadie within the time limit
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    className="gap-2"
                    disabled={filteredRequests.length === 0}
                >
                    <FileDown className="h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            <div className="bg-card rounded-lg border shadow-sm p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-xl">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search expired requests..."
                            value={searchInput}
                            onChange={handleSearchChange}
                            className="pl-10"
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
                        {(serviceTypeFilter !== "all" || dateFilter) && (
                            <Badge variant="secondary" className="ml-1 px-1 min-w-4 text-[10px]">!</Badge>
                        )}
                    </Button>
                </div>

                {showFilters && (
                    <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium">Service Type</label>
                            <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Services" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Services</SelectItem>
                                    {services.map(s => (
                                        <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium">Date</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left text-xs">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateFilter ? format(dateFilter, "PPP") : "Select date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={dateFilter} onSelect={setDateFilter} />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={clearFilters}>Clear</Button>
                            <Button variant="outline" size="sm" onClick={() => setShowFilters(false)}>Close</Button>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-card rounded-lg border shadow-sm">
                {isLoading ? (
                    <div className="p-12 flex flex-col items-center justify-center space-y-3">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Loading expired requests...</span>
                    </div>
                ) : (
                    <DataTable
                        data={filteredRequests}
                        columns={columns}
                        pageSize={15}
                    />
                )}
            </div>
        </div>
    )
}
