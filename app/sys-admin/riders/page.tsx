"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { DataTable } from "@/components/management/data-table"
import { EmptyState } from "@/components/dashboard/empty-state"
import { getRiders, updateRider, deleteRider, type Rider, getAllThumbnails, type ThumbnailInfo, IMAGE_TYPES, getServiceRequests, type ServiceRequest } from "@/lib/api"
import { AuditService } from "@/lib/audit"
import { getAdminProfile } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Plus,
  Search,
  X,
  Filter,
  CalendarIcon,
  Loader2,
  ExternalLink,
  Check,
  XCircle,
  Users,
  Image as ImageIcon,
  User,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { debounce } from "lodash"
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useCan, PermissionButton } from "@/components/auth/permission-guard"
import { PERMISSIONS } from "@/lib/permissions"
import { Card, CardContent } from "@/components/ui/card"

interface RiderWithThumbnail extends Rider {
  thumbnail?: string
  profileImage?: ThumbnailInfo
}

export default function RidersPage() {
  const router = useRouter()
  const [riders, setRiders] = useState<RiderWithThumbnail[]>([])
  const [filteredRiders, setFilteredRiders] = useState<RiderWithThumbnail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [activityFilter, setActivityFilter] = useState<string>("all")
  const [activeRiderIds, setActiveRiderIds] = useState<Set<number>>(new Set())
  const [activeRequestCount, setActiveRequestCount] = useState(0)
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [showFilters, setShowFilters] = useState(false)
  const [statusToggling, setStatusToggling] = useState<number[]>([])
  const { toast } = useToast()
  const canAdd = useCan(PERMISSIONS.RIDERS_ADD)
  const canChange = useCan(PERMISSIONS.RIDERS_CHANGE)
  const canDelete = useCan(PERMISSIONS.RIDERS_DELETE)
  const canApprove = useCan(PERMISSIONS.RIDERS_APPROVE)
  const canDisable = useCan(PERMISSIONS.RIDERS_DISABLE)
  const hasDisablePermission = canDisable || canApprove
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
    setStatusFilter("all")
    setActivityFilter("all")
    setStartDate(undefined)
    setEndDate(undefined)
  }

  const fetchRiders = async () => {
    setIsLoading(true)
    try {
      const [data, requests] = await Promise.all([
        getRiders(),
        getServiceRequests().catch(() => [] as ServiceRequest[]),
      ])
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const activeSet = new Set<number>()
      requests.forEach((req) => {
        if (!req.rider) return
        if (new Date(req.created_at) >= sevenDaysAgo) activeSet.add(req.rider)
      })
      setActiveRiderIds(activeSet)
      setActiveRequestCount(requests.filter(req => ["REQUESTED", "ACCEPTED", "EN_ROUTE", "STARTED"].includes((req.status || "").toUpperCase())).length)
      const ridersWithThumbnails = data as RiderWithThumbnail[]
      setRiders(ridersWithThumbnails)
      setFilteredRiders(ridersWithThumbnails)

      await loadRiderThumbnails(ridersWithThumbnails)
    } catch (err) {
      console.error(" Riders fetch error:", err)
      toast({
        title: "Error",
        description: "Failed to load riders data.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadRiderThumbnails = async (ridersList: RiderWithThumbnail[]) => {
    try {
      setIsLoadingThumbnails(true)

      const thumbnailsResponse = await getAllThumbnails({ prefix: 'R' })
      const thumbnailsByRider: Record<string, ThumbnailInfo[]> = {}
      thumbnailsResponse.thumbnails.forEach(thumb => {
        if (!thumbnailsByRider[thumb.external_id]) {
          thumbnailsByRider[thumb.external_id] = []
        }
        thumbnailsByRider[thumb.external_id].push(thumb)
      })

      const updatedRiders = ridersList.map(rider => {
        const riderThumbnails = thumbnailsByRider[rider.external_id] || []
        const profileImage = riderThumbnails.find(
          img => img.image_type === IMAGE_TYPES.PROFILE && img.status === 'APPROVED'
        )

        return {
          ...rider,
          thumbnail: profileImage?.thumbnail_url,
          profileImage
        }
      })

      setRiders(updatedRiders)
      setFilteredRiders(updatedRiders)
    } catch (err) {
      console.error("Failed to load rider thumbnails:", err)
    } finally {
      setIsLoadingThumbnails(false)
    }
  }

  useEffect(() => {
    fetchRiders()
  }, [])

  useEffect(() => {
    if (riders.length === 0) return

    let filtered = [...riders]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((rider) => {
        const searchFields = [
          rider.external_id?.toLowerCase() || "",
          rider.first_name?.toLowerCase() || "",
          rider.last_name?.toLowerCase() || "",
          rider.email?.toLowerCase() || "",
          rider.phone?.toLowerCase() || "",
          rider.username?.toLowerCase() || "",
          rider.nin?.toLowerCase() || "",
          rider.is_approved ? "active" : "pending",
        ]
        return searchFields.some(field => field.includes(query))
      })
    }

    if (statusFilter !== "all") {
      const isApproved = statusFilter === "approved"
      filtered = filtered.filter(rider => rider.is_approved === isApproved)
    }

    if (activityFilter !== "all") {
      filtered = filtered.filter((rider) => {
        const isActive = activeRiderIds.has(rider.id)
        if (activityFilter === "active") return isActive
        if (activityFilter === "inactive") return !isActive
        return true
      })
    }

    if (startDate || endDate) {
      filtered = filtered.filter(rider => {
        const requestDate = new Date(rider.created_at)
        const start = startDate ? startOfDay(startDate) : new Date(0)
        const end = endDate ? endOfDay(endDate) : new Date()
        return isWithinInterval(requestDate, { start, end })
      })
    }

    setFilteredRiders(filtered)
  }, [searchQuery, statusFilter, activityFilter, startDate, endDate, riders, activeRiderIds])

  const handleDelete = async (rider: RiderWithThumbnail) => {
    try {
      await deleteRider(rider.id)

      const currentUser = await getAdminProfile()
      AuditService.log(
        "Delete Rider",
        "Riders",
        `Rider: ${rider.first_name} ${rider.last_name} (${rider.username})`,
        currentUser?.username || currentUser?.name || currentUser?.email || "Unknown",
        { riderId: rider.id, externalId: rider.external_id }
      )

      toast({
        title: "Success",
        description: "Rider deleted successfully"
      })
      fetchRiders()
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete rider",
        variant: "destructive"
      })
    }
  }

  const handleBulkDelete = async (selectedRiders: RiderWithThumbnail[]) => {
    try {
      await Promise.all(selectedRiders.map(r => deleteRider(r.id)))

      const currentUser = await getAdminProfile()
      AuditService.log(
        "Bulk Delete Riders",
        "Riders",
        `Deleted ${selectedRiders.length} riders`,
        currentUser?.username || currentUser?.name || currentUser?.email || "Unknown",
        { count: selectedRiders.length, riderIds: selectedRiders.map(r => r.id) }
      )

      toast({
        title: "Success",
        description: `${selectedRiders.length} riders deleted successfully`
      })
      fetchRiders()
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete some riders",
        variant: "destructive"
      })
      fetchRiders()
    }
  }

  const handleStatusToggle = async (rider: RiderWithThumbnail) => {
    try {
      setStatusToggling(prev => [...prev, rider.id])
      const newStatus = !rider.is_approved
      await updateRider(rider.id, { is_approved: newStatus })

      const currentUser = await getAdminProfile()
      AuditService.log(
        newStatus ? "Approve Rider" : "Unapprove Rider",
        "Riders",
        `Rider: ${rider.first_name} ${rider.last_name} (${rider.username})`,
        currentUser?.username || currentUser?.name || currentUser?.email || "Unknown",
        { riderId: rider.id, externalId: rider.external_id, newStatus }
      )

      toast({
        title: "Success",
        description: `Rider ${newStatus ? "approved" : "unapproved"} successfully`
      })
      
      // Refresh the list to show updated status
      fetchRiders()
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update rider status",
        variant: "destructive"
      })
    } finally {
      setStatusToggling(prev => prev.filter(id => id !== rider.id))
    }
  }

  const handleEdit = (rider: RiderWithThumbnail) => {
    router.push(`/sys-admin/riders/${rider.id}/edit`)
  }

  const handleIdClick = (rider: RiderWithThumbnail) => {
    router.push(`/sys-admin/riders/${rider.id}/edit`)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch (error) {
      return dateString
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
  }

  const columns = [
    {
      header: "ID",
      accessor: "external_id" as const,
      cell: (value: string, row: RiderWithThumbnail) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-border/50">
            {row.thumbnail ? (
              <AvatarImage
                src={row.thumbnail}
                alt={`${row.first_name} ${row.last_name}`}
                className="object-cover"
              />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-mono text-xs">
              {getInitials(row.first_name, row.last_name)}
            </AvatarFallback>
          </Avatar>
          {canChange ? (
            <button
              onClick={() => handleIdClick(row)}
              className="text-primary hover:text-primary/80 font-mono font-medium hover:underline flex items-center gap-1 transition-colors group text-sm"
              title="Edit rider"
            >
              #{value || "N/A"}
              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ) : (
            <span className="font-mono font-medium text-foreground text-sm">#{value || "N/A"}</span>
          )}
        </div>
      )
    },
    {
      header: "Name",
      accessor: "first_name" as const,
      cell: (value: string, row: RiderWithThumbnail) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground text-sm">{row.first_name} {row.last_name}</span>
          <span className="text-xs text-muted-foreground font-mono">@{row.username}</span>
        </div>
      )
    },
    {
      header: "Contact",
      accessor: "email" as const,
      cell: (value: string, row: RiderWithThumbnail) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">{row.email}</span>
          <span className="text-xs text-muted-foreground font-mono">{row.phone}</span>
        </div>
      )
    },
    {
      header: "Device",
      accessor: "device_type" as const,
      cell: (value: string | null) => (
        <span className="text-xs text-muted-foreground font-mono">{value || "Unknown"}</span>
      ),
    },
    {
      header: "Activity",
      accessor: "is_online" as const,
      cell: (value: boolean, row: RiderWithThumbnail) => (
        <Badge variant={activeRiderIds.has(row.id) ? "default" : "outline"} className={activeRiderIds.has(row.id) ? "bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold uppercase" : "text-muted-foreground border-border text-[10px] font-bold uppercase"}>
          {activeRiderIds.has(row.id) ? "In Request" : "Idle"}
        </Badge>
      )
    },
    {
      header: "Status",
      accessor: (row: RiderWithThumbnail) => row.is_approved,
      cell: (value: boolean, row: RiderWithThumbnail) => (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Switch
              checked={value}
              onCheckedChange={() => handleStatusToggle(row)}
              disabled={
                statusToggling.includes(row.id) ||
                (value ? !hasDisablePermission : !canApprove)
              }
              className="data-[state=checked]:bg-green-600 scale-90"
            />
            {statusToggling.includes(row.id) && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            <div className="flex items-center gap-1">
              {value ? (
                <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20 text-[10px] font-bold uppercase">Activated</Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-500/5 text-amber-600 border-amber-500/20 text-[10px] font-bold uppercase">Deactivated</Badge>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            {!row.is_active && (
              <Badge variant="destructive" className="text-[9px] h-4 px-1 uppercase">Inactive</Badge>
            )}
            {row.is_deleted && (
              <Badge variant="destructive" className="text-[9px] h-4 px-1 uppercase bg-red-900">Deleted</Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "Created",
      accessor: "created_at" as const,
      cell: (value: string) => (
        <span className="text-xs text-muted-foreground font-mono">{formatDate(value)}</span>
      ),
    },
  ]

  const totalRiders = riders.length
  const shownRiders = filteredRiders.length
  const searchActive = searchQuery.trim() !== ""
  const filtersActive = statusFilter !== "all" || activityFilter !== "all" || startDate !== undefined || endDate !== undefined
  const activeRiders = riders.filter(r => activeRiderIds.has(r.id)).length
  const inactiveRiders = riders.filter(r => !activeRiderIds.has(r.id)).length
  const activatedRiders = riders.filter(r => r.is_approved).length
  const deactivatedRiders = riders.filter(r => !r.is_approved).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-mono">Riders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage Rider's Accounts
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PermissionButton
            permissions={PERMISSIONS.RIDERS_ADD}
            onClick={() => router.push("/sys-admin/riders/add")}
            className="gap-2 bg-primary hover:bg-primary/90 text-white font-mono h-10"
          >
            <Plus className="h-4 w-4" />
            Add Rider
          </PermissionButton>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
        {[
          { label: "Total Riders", value: totalRiders, color: "text-foreground" },
          { label: "Active Riders", value: activeRiders, color: "text-emerald-500" },
          { label: "Inactive Riders", value: inactiveRiders, color: "text-muted-foreground" },
          { label: "Activated Riders", value: activatedRiders, color: "text-blue-500" },
          { label: "Deactivated Riders", value: deactivatedRiders, color: "text-amber-500" },
          { label: "Active Requests", value: activeRequestCount, color: "text-purple-500" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/50 shadow-sm">
            <CardContent className="p-3">
              <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">{stat.label}</p>
              <p className={`text-xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-card rounded-lg border border-border shadow-sm p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by Rider ID, name, email, phone, or username..."
                value={searchInput}
                onChange={handleSearchChange}
                className="pl-10 pr-20 font-mono text-sm bg-background border-border"
                disabled={isLoading || isLoadingThumbnails}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                {isSearching ? (
                  <div className="flex items-center gap-1 text-muted-foreground animate-pulse">
                    <Loader2 className="h-4 w-4 animate-spin font-mono" />
                    <span className="text-[10px]">SEARCHING...</span>
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

          <div className="flex items-center gap-3">
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2 font-mono h-10"
            >
              <Filter className="h-4 w-4" />
              Filters
              {(filtersActive || searchActive) && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                  {(filtersActive ? 1 : 0) + (searchActive ? 1 : 0)}
                </Badge>
              )}
            </Button>

            <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono bg-muted/50 px-3 py-1.5 rounded-lg border border-border">
              <div className="flex items-center gap-1.5">
                <span className="font-bold uppercase opacity-50">Total:</span>
                <span className="text-foreground font-bold">{totalRiders}</span>
              </div>
              {(searchActive || filtersActive) && (
                <>
                  <div className="w-px h-3 bg-border" />
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold uppercase opacity-50 text-primary">MATCHES:</span>
                    <span className="text-primary font-bold">{shownRiders}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-background border-border font-mono text-xs h-10">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="font-mono text-xs">
                  <SelectItem value="all">ALL STATUSES</SelectItem>
                  <SelectItem value="approved">ACTIVATED ONLY</SelectItem>
                  <SelectItem value="pending">DEACTIVATED ONLY</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Activity</label>
              <Select value={activityFilter} onValueChange={setActivityFilter}>
                <SelectTrigger className="bg-background border-border font-mono text-xs h-10">
                  <SelectValue placeholder="Select activity" />
                </SelectTrigger>
                <SelectContent className="font-mono text-xs">
                  <SelectItem value="all">ALL ACTIVITY</SelectItem>
                  <SelectItem value="active">IN REQUEST</SelectItem>
                  <SelectItem value="inactive">IDLE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Joined From</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-mono text-xs h-10 border-border bg-background",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                    {startDate ? format(startDate, "MMM d, yyyy") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => setStartDate(date)}
                    initialFocus
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Joined To</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-mono text-xs h-10 border-border bg-background",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                    {endDate ? format(endDate, "MMM d, yyyy") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => setEndDate(date)}
                    initialFocus
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                disabled={!filtersActive}
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground h-10 w-full md:w-auto"
              >
                <X className="h-3 w-3 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-card rounded-lg border border-border shadow-sm min-h-[400px]">
        {isSearching ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-mono uppercase tracking-widest animate-pulse">Indexing Results...</p>
          </div>
        ) : filteredRiders.length === 0 ? (
          <div className="p-12 text-center">
            {searchActive || filtersActive ? (
              <EmptyState
                title="No Records Found"
                description="The current filter parameters yielded no matches in our database."
                action={
                  <Button
                    variant="outline"
                    onClick={() => {
                      clearSearch()
                      clearFilters()
                    }}
                    className="gap-2 font-mono"
                  >
                    Restore All Records
                  </Button>
                }
              />
            ) : (
              <EmptyState
                title="Database Empty"
                description="No customer records were found in the system."
                action={
                  canAdd ? (
                    <Button
                      onClick={() => router.push("/sys-admin/riders/add")}
                      className="gap-2 bg-primary text-white font-mono"
                    >
                      <Plus className="h-4 w-4" />
                      Add First Customer
                    </Button>
                  ) : undefined
                }
              />
            )}
          </div>
        ) : (
          <DataTable
            data={filteredRiders}
            columns={columns}
            onEdit={canChange ? handleEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
            onBulkDelete={canDelete ? handleBulkDelete : undefined}
            onExport={() => { }} // Now handled internally by DataTable
            deleteConfirmTitle="Delete Rider"
            deleteConfirmDescription="Are you sure you want to delete this rider account? This action cannot be undone."
            bulkDeleteConfirmTitle="Delete Multiple Riders"
            bulkDeleteConfirmDescription="Are you sure you want to delete the selected rider accounts? This action cannot be undone."
            renderConfirmDetails={(rider) => (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium text-white">{rider.first_name} {rider.last_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Username:</span>
                  <span className="font-mono text-primary">@{rider.username}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="text-white">{rider.email}</span>
                </div>
              </div>
            )}
            initialSortColumn={5}
            initialSortDirection="desc"
          />
        )}
      </div>
    </div>
  )
}
