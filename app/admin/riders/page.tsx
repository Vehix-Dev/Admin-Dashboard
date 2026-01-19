"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { DataTable } from "@/components/management/data-table"
import { EmptyState } from "@/components/dashboard/empty-state"
import { getRiders, updateRider, deleteRider, type Rider, getAllThumbnails, type ThumbnailInfo, IMAGE_TYPES } from "@/lib/api"
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
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [showFilters, setShowFilters] = useState(false)
  const { toast } = useToast()

  const canAdd = useCan(PERMISSIONS.RIDERS_ADD)
  const canChange = useCan(PERMISSIONS.RIDERS_CHANGE)
  const canDelete = useCan(PERMISSIONS.RIDERS_DELETE)
  const canApprove = useCan(PERMISSIONS.RIDERS_APPROVE)

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
    setStartDate(undefined)
    setEndDate(undefined)
  }

  const fetchRiders = async () => {
    setIsLoading(true)
    try {
      const data = await getRiders()
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

    if (startDate || endDate) {
      filtered = filtered.filter(rider => {
        const requestDate = new Date(rider.created_at)
        const start = startDate ? startOfDay(startDate) : new Date(0)
        const end = endDate ? endOfDay(endDate) : new Date()
        return isWithinInterval(requestDate, { start, end })
      })
    }

    setFilteredRiders(filtered)
  }, [searchQuery, statusFilter, startDate, endDate, riders])

  const handleDelete = async (rider: RiderWithThumbnail) => {
    if (!confirm(`Are you sure you want to delete ${rider.first_name} ${rider.last_name}?`)) return
    try {
      await deleteRider(rider.id)
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

  const handleStatusToggle = async (rider: RiderWithThumbnail) => {
    try {
      await updateRider(rider.id, { is_approved: !rider.is_approved })
      toast({
        title: "Success",
        description: `Rider ${!rider.is_approved ? "approved" : "unapproved"} successfully`
      })
      fetchRiders()
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update rider status",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (rider: RiderWithThumbnail) => {
    router.push(`/admin/riders/${rider.id}/edit`)
  }

  const handleIdClick = (rider: RiderWithThumbnail) => {
    router.push(`/admin/riders/${rider.id}/edit`)
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
      header: "NIN",
      accessor: "nin" as const,
      cell: (value: string) => (
        <span className="font-mono text-[10px] bg-muted px-2 py-0.5 rounded border border-border/50 text-foreground tracking-tighter">
          {value || "N/A"}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: (row: RiderWithThumbnail) => row.is_approved,
      cell: (value: boolean, row: RiderWithThumbnail) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={value}
            onCheckedChange={() => handleStatusToggle(row)}
            disabled={!canApprove}
            className="data-[state=checked]:bg-green-600 scale-90"
          />
          <div className="flex items-center gap-1">
            {value ? (
              <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20 text-[10px] font-bold uppercase">Active</Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-500/5 text-amber-600 border-amber-500/20 text-[10px] font-bold uppercase">Pending</Badge>
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
  const filtersActive = statusFilter !== "all" || startDate !== undefined || endDate !== undefined
  const activeRiders = riders.filter(r => r.is_approved).length
  const pendingRiders = riders.filter(r => !r.is_approved).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-mono">Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage rider accounts and system access
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PermissionButton
            permissions={PERMISSIONS.RIDERS_ADD}
            onClick={() => router.push("/admin/riders/add")}
            className="gap-2 bg-primary hover:bg-primary/90 text-white font-mono h-10"
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </PermissionButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Total Customers</p>
              <p className="text-2xl font-bold mt-1 text-foreground">{totalRiders}</p>
            </div>
            <div className="bg-primary/10 p-2.5 rounded-xl">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Active</p>
              <p className="text-2xl font-bold mt-1 text-emerald-500">{activeRiders}</p>
            </div>
            <div className="bg-emerald-500/10 p-2.5 rounded-xl">
              <Check className="h-5 w-5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Pending Approval</p>
              <p className="text-2xl font-bold mt-1 text-amber-500">{pendingRiders}</p>
            </div>
            <div className="bg-amber-500/10 p-2.5 rounded-xl">
              <XCircle className="h-5 w-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card rounded-lg border border-border shadow-sm p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, email, phone, username, NIN..."
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
                  <SelectItem value="approved">ACTIVE ONLY</SelectItem>
                  <SelectItem value="pending">PENDING ONLY</SelectItem>
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
                    onSelect={setStartDate}
                    initialFocus
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
                    onSelect={setEndDate}
                    initialFocus
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
        {isLoading || isLoadingThumbnails ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground font-mono uppercase tracking-widest animate-pulse">Synchronizing Data...</p>
          </div>
        ) : isSearching ? (
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
                      onClick={() => router.push("/admin/riders/add")}
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
            initialSortColumn={5}
            initialSortDirection="desc"
          />
        )}
      </div>
    </div>
  )
}