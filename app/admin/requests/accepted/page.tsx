"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { DataTable } from "@/components/management/data-table"
import { EmptyState } from "@/components/dashboard/empty-state"
import {
    getServiceRequests,
    createServiceRequest,
    deleteServiceRequest,
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
    Plus,
    Search,
    X,
    Loader2,
    Filter,
    CalendarIcon,
    ExternalLink,
    CheckCircle,
    UserCheck
} from "lucide-react"
import { RequestFormModal } from "@/components/forms/request-form-modal"
import { debounce } from "lodash"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface RequestRow extends ServiceRequest {
    id: string
    rider_lat: string | number | null
    rider_lng: string | number | null
}

export default function AcceptedRequestsPage() {
    const router = useRouter()
    const [requests, setRequests] = useState<RequestRow[]>([])
    const [filteredRequests, setFilteredRequests] = useState<RequestRow[]>([])
    const [riders, setRiders] = useState<Rider[]>([])
    const [roadies, setRoadies] = useState<Roadie[]>([])
    const [services, setServices] = useState<Service[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSearching, setIsSearching] = useState(false)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [searchInput, setSearchInput] = useState("")

    // Filter states
    const [serviceTypeFilter, setServiceTypeFilter] = useState<string>("all")
    const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined)
    const [showFilters, setShowFilters] = useState(false)

    const { toast } = useToast()

    // Debounced search function
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
            const [requestsData, ridersData, roadiesData, servicesData] = await Promise.all([
                getServiceRequests(),
                getRiders(),
                getRoadies(),
                getServices()
            ])

            // Filter for accepted requests
            const acceptedRequests = requestsData.filter(req =>
                req.status === "ACCEPTED" || req.status === "accepted"
            )

            const requestsWithStringId = acceptedRequests.map((req) => ({
                ...req,
                id: String(req.id),
                rider_lat: req.rider_lat,
                rider_lng: req.rider_lng,
            }))
            setRequests(requestsWithStringId)
            setFilteredRequests(requestsWithStringId)
            setRiders(ridersData)
            setRoadies(roadiesData)
            setServices(servicesData)
        } catch (err) {
            console.error(" Data fetch error:", err)
            toast({
                title: "Error",
                description: "Failed to load data.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchAllData()
    }, [])

    // Apply all filters whenever any filter changes
    useEffect(() => {
        if (requests.length === 0) return

        let filtered = [...requests]

        // Apply text search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim()
            filtered = filtered.filter((request) => {
                const searchFields = [
                    request.id.toLowerCase(),
                    request.rider_username?.toLowerCase() || "",
                    request.rodie_username?.toLowerCase() || "",
                    request.service_type_name?.toLowerCase() || getServiceName(request).toLowerCase(),
                    request.service_type_details?.name?.toLowerCase() || "",
                    request.service_type_details?.code?.toLowerCase() || "",
                    request.status?.toLowerCase() || "",
                    formatLocation(request.rider_lat, request.rider_lng).toLowerCase(),
                ]
                return searchFields.some(field => field.includes(query))
            })
        }

        // Apply service type filter
        if (serviceTypeFilter !== "all") {
            filtered = filtered.filter(request => request.service_type.toString() === serviceTypeFilter)
        }

        // Apply date filter
        if (dateFilter) {
            const filterDate = format(dateFilter, 'yyyy-MM-dd')
            filtered = filtered.filter(request => {
                const requestDate = new Date(request.created_at)
                return format(requestDate, 'yyyy-MM-dd') === filterDate
            })
        }

        setFilteredRequests(filtered)
    }, [searchQuery, serviceTypeFilter, dateFilter, requests])

    const handleCreate = async (data: Partial<ServiceRequest>) => {
        try {
            const requestData = {
                service_type: Number(data.service_type) || 0,
                rider_lat: data.rider_lat?.toString() || "0",
                rider_lng: data.rider_lng?.toString() || "0",
                ...(data.rider && { rider: Number(data.rider) }),
                ...(data.rider_username && { rider_username: data.rider_username }),
                ...(data.rodie && { rodie: Number(data.rodie) }),
                ...(data.rodie_username && { rodie_username: data.rodie_username }),
                status: "ACCEPTED", // Default to accepted for this page
            }

            await createServiceRequest(requestData)
            toast({
                title: "Success",
                description: "Service request created successfully"
            })
            setIsFormOpen(false)
            fetchAllData()
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message || "Failed to create service request",
                variant: "destructive"
            })
        }
    }

    const handleDelete = async (request: RequestRow) => {
        try {
            await deleteServiceRequest(Number(request.id))
            toast({
                title: "Success",
                description: "Service request deleted successfully"
            })
            fetchAllData()
        } catch (err) {
            toast({
                title: "Error",
                description: "Failed to delete service request",
                variant: "destructive"
            })
        }
    }

    const handleEdit = (request: RequestRow) => {
        router.push(`/admin/requests/${request.id}`)
    }

    const handleIdClick = (id: string) => {
        router.push(`/admin/requests/${id}`)
    }

    const handleExport = () => {
        try {
            const headers = [
                'ID',
                'Rider ID',
                'Rider Username',
                'Roadie ID',
                'Roadie Username',
                'Service Type ID',
                'Service Type Name',
                'Service Code',
                'Status',
                'Latitude',
                'Longitude',
                'Created At',
                'Updated At'
            ]

            const csvData = filteredRequests.map(request => [
                request.id,
                request.rider,
                `"${request.rider_username || ''}"`,
                request.rodie || '',
                `"${request.rodie_username || ''}"`,
                request.service_type,
                `"${request.service_type_name || getServiceName(request)}"`,
                `"${request.service_type_details?.code || ''}"`,
                `"${getStatusLabel(request.status as ServiceStatus)}"`,
                request.rider_lat,
                request.rider_lng,
                `"${formatDateForExport(request.created_at)}"`,
                `"${formatDateForExport(request.updated_at)}"`
            ])

            const csvContent = [
                headers.join(','),
                ...csvData.map(row => row.join(','))
            ].join('\n')

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `accepted_requests_${format(new Date(), 'yyyy-MM-dd')}.csv`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

            toast({
                title: "Success",
                description: `${filteredRequests.length} accepted requests exported successfully`
            })
        } catch (err) {
            toast({
                title: "Error",
                description: "Failed to export accepted requests",
                variant: "destructive"
            })
        }
    }

    const formatDateForExport = (dateString: string) => {
        try {
            const date = new Date(dateString)
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            })
        } catch (error) {
            return dateString
        }
    }

    const formatLocation = (lat: string | number | null, lng: string | number | null): string => {
        if (lat == null || lng == null || lat === "" || lng === "") return "N/A"

        try {
            const latNum = typeof lat === 'string' ? parseFloat(lat) : lat
            const lngNum = typeof lng === 'string' ? parseFloat(lng) : lng

            if (isNaN(latNum) || isNaN(lngNum)) return "N/A"

            return `${latNum.toFixed(6)}, ${lngNum.toFixed(6)}`
        } catch (error) {
            return "Invalid"
        }
    }

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString)
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        } catch (error) {
            return dateString
        }
    }

    const getServiceDisplayName = (request: RequestRow): string => {
        return request.service_type_name || getServiceName(request)
    }

    const columns = [
        {
            header: "ID",
            accessor: "id" as const,
            cell: (value: string) => (
                <button
                    onClick={() => handleIdClick(value)}
                    className="text-primary hover:text-primary/80 font-medium hover:underline flex items-center gap-1 transition-colors group"
                    title="View details"
                >
                    #{value}
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            ),
        },
        {
            header: "Rider",
            accessor: "rider_username" as const,
            cell: (value: string | null) => (
                <span className={value ? "" : "text-muted-foreground italic"}>
                    {value || "Unassigned"}
                </span>
            ),
        },
        {
            header: "Roadie",
            accessor: "rodie_username" as const,
            cell: (value: string | null) => (
                <span className={value ? "" : "text-muted-foreground italic"}>
                    {value || "Unassigned"}
                </span>
            ),
        },
        {
            header: "Service",
            accessor: "service_type" as const,
            cell: (value: string | number, row: RequestRow) => {
                const serviceName = getServiceDisplayName(row)
                return (
                    <div className="flex flex-col">
                        <span className="font-medium">{serviceName}</span>
                        <span className="text-xs text-muted-foreground">
                            ID: {row.service_type}
                            {row.service_type_details?.code && ` | Code: ${row.service_type_details.code}`}
                        </span>
                    </div>
                )
            },
        },
        {
            header: "Status",
            accessor: "status" as const,
            cell: (value: string) => {
                return (
                    <Badge
                        variant="outline"
                        className="capitalize font-medium border-orange-500/20 bg-orange-500/10 text-orange-500"
                    >
                        <UserCheck className="h-3 w-3 mr-1" />
                        {getStatusLabel(value as ServiceStatus)}
                    </Badge>
                )
            },
        },
        {
            header: "Location",
            accessor: (request: RequestRow) => formatLocation(request.rider_lat, request.rider_lng),
        },
        {
            header: "Created",
            accessor: "created_at" as const,
            cell: (value: string) => formatDate(value),
        },
        {
            header: "Accepted At",
            accessor: "updated_at" as const,
            cell: (value: string) => formatDate(value),
        },
    ]

    // Statistics
    const totalRequests = requests.length
    const shownRequests = filteredRequests.length
    const searchActive = searchQuery.trim() !== ""
    const filtersActive = serviceTypeFilter !== "all" || dateFilter !== undefined

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <UserCheck className="h-8 w-8 text-orange-500" />
                        Accepted Requests
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        View all service requests that have been accepted by a roadie
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
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
                    <Button
                        onClick={() => setIsFormOpen(true)}
                        className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                    >
                        <Plus className="h-4 w-4" />
                        New Request
                    </Button>
                </div>
            </div>

            {/* Search and Filters Bar */}
            <div className="bg-card rounded-lg border shadow-sm p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-xl">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search accepted requests by ID, rider, roadie, service, or location..."
                                value={searchInput}
                                onChange={handleSearchChange}
                                className="pl-10 pr-20"
                                disabled={isLoading}
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                                {isSearching ? (
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span className="text-xs">Searching...</span>
                                    </div>
                                ) : searchInput ? (
                                    <button
                                        onClick={clearSearch}
                                        className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted"
                                        title="Clear search"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                            className="gap-2"
                        >
                            <Filter className="h-4 w-4" />
                            Filters
                            {(filtersActive || searchActive) && (
                                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                                    {(filtersActive ? 1 : 0) + (searchActive ? 1 : 0)}
                                </Badge>
                            )}
                        </Button>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <span className="font-medium">Total:</span>
                                <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                                    {totalRequests} accepted
                                </Badge>
                            </div>
                            {(searchActive || filtersActive) && (
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">Showing:</span>
                                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                                        {shownRequests} of {totalRequests}
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Service Type Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Service Type</label>
                            <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select service type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Services</SelectItem>
                                    {services.map(service => (
                                        <SelectItem key={service.id} value={service.id.toString()}>
                                            {service.name} ({service.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Accepted Date</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !dateFilter && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateFilter ? format(dateFilter, "PPP") : "Select date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={dateFilter}
                                        onSelect={setDateFilter}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Filter Actions */}
                        <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={clearFilters}
                                disabled={!filtersActive}
                            >
                                Clear Filters
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowFilters(false)}
                            >
                                Close Filters
                            </Button>
                        </div>
                    </div>
                )}

                {/* Search tips */}
                {searchActive && shownRequests === 0 && !isSearching && (
                    <div className="mt-3 text-sm text-muted-foreground">
                        No accepted requests found for "{searchQuery}". Try searching by:
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                            <li>Request ID</li>
                            <li>Rider username</li>
                            <li>Roadie username</li>
                            <li>Service name (e.g., BATTERY)</li>
                            <li>Service code</li>
                            <li>Location coordinates</li>
                        </ul>
                    </div>
                )}
            </div>

            <div className="bg-card rounded-lg border shadow-sm min-h-[400px]">
                {isLoading ? (
                    <div className="p-8 flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="text-muted-foreground">Loading accepted requests...</p>
                    </div>
                ) : isSearching ? (
                    <div className="p-8 flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-muted-foreground">Searching for "{searchInput}"...</p>
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="p-8">
                        {searchActive || filtersActive ? (
                            <EmptyState
                                title="No matching accepted requests"
                                description={
                                    searchActive
                                        ? `No accepted requests found matching "${searchQuery}"`
                                        : "No accepted requests match the current filters"
                                }
                                action={
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            clearSearch()
                                            clearFilters()
                                        }}
                                        className="gap-2"
                                    >
                                        Clear Search & Filters
                                    </Button>
                                }
                            />
                        ) : (
                            <EmptyState
                                title="No accepted requests yet"
                                description="No service requests have been accepted yet. Accepted requests will appear here."
                                icon={UserCheck}
                            />
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <div className="p-4 border-b bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="text-sm text-muted-foreground">
                                {searchActive || filtersActive ? (
                                    <>
                                        Showing <span className="font-semibold">{shownRequests}</span> accepted request{shownRequests !== 1 ? 's' : ''}
                                        <span className="mx-1">•</span>
                                        <span className="text-primary font-medium">
                                            {searchActive && `Search: "${searchQuery}"`}
                                            {searchActive && filtersActive && ' • '}
                                            {filtersActive && 'Filtered'}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        Showing all <span className="font-semibold">{shownRequests}</span> accepted request{shownRequests !== 1 ? 's' : ''}
                                    </>
                                )}
                            </div>
                            <div className="flex gap-2">
                                {(searchActive || filtersActive) && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            clearSearch()
                                            clearFilters()
                                        }}
                                        className="text-xs h-7"
                                    >
                                        Clear All
                                    </Button>
                                )}
                            </div>
                        </div>
                        <DataTable
                            data={filteredRequests}
                            columns={columns}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            deleteConfirmTitle="Delete Accepted Request"
                            deleteConfirmDescription="Are you sure you want to delete this active service request? This may disrupt the current service flow."
                            renderConfirmDetails={(request) => (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Request ID:</span>
                                        <span className="font-mono text-white">#{request.id}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Roadie:</span>
                                        <span className="text-white">{request.rodie_username}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Service:</span>
                                        <span className="font-medium text-primary">{getServiceDisplayName(request)}</span>
                                    </div>
                                </div>
                            )}
                            searchable={false}
                            pagination={{
                                pageSize: 10,
                                pageSizeOptions: [5, 10, 20, 50],
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <RequestFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={handleCreate}
                riders={riders}
                roadies={roadies}
                services={services}
                defaultStatus="ACCEPTED"
            />
        </div>
    )
}