"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { DataTable } from "@/components/management/data-table"
import { EmptyState } from "@/components/dashboard/empty-state"
import { getRoadies, updateRoadie, deleteRoadie, type Roadie, getCombinedRealtimeLocations, type RodieLocation } from "@/lib/api"
import { getAllThumbnails, type ThumbnailInfo, IMAGE_TYPES, getStatusLabelForImage, getImageTypeLabel, getStatusColorForImage } from "@/lib/api"
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
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { debounce } from "lodash"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useCan, PermissionButton } from "@/components/auth/permission-guard"
import { PERMISSIONS } from "@/lib/permissions"

// Extended Roadie interface with thumbnail
interface RoadieWithThumbnail extends Roadie {
  thumbnail?: string
  profileImage?: ThumbnailInfo
}

export default function RoadiesPage() {
  const router = useRouter()
  const [roadies, setRoadies] = useState<RoadieWithThumbnail[]>([])
  const [filteredRoadies, setFilteredRoadies] = useState<RoadieWithThumbnail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [onlineRoadies, setOnlineRoadies] = useState<Set<number>>(new Set())

  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined)
  const [toDate, setToDate] = useState<Date | undefined>(undefined)
  const [showFilters, setShowFilters] = useState(false)

  const { toast } = useToast()

  // Permission checks
  const canAdd = useCan(PERMISSIONS.ROADIES_ADD)
  const canChange = useCan(PERMISSIONS.ROADIES_CHANGE)
  const canDelete = useCan(PERMISSIONS.ROADIES_DELETE)
  const canApprove = useCan(PERMISSIONS.ROADIES_APPROVE)

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
    setStatusFilter("all")
    setFromDate(undefined)
    setToDate(undefined)
  }

  const fetchRoadies = async () => {
    setIsLoading(true)
    try {
      const [data, realtimeData] = await Promise.all([
        getRoadies(),
        getCombinedRealtimeLocations()
      ])

      const roadiesWithThumbnails = data as RoadieWithThumbnail[]
      setRoadies(roadiesWithThumbnails)
      setFilteredRoadies(roadiesWithThumbnails)

      // Process online roadies
      const onlineSet = new Set<number>()
      realtimeData.rodies.forEach(r => onlineSet.add(r.rodie_id))
      setOnlineRoadies(onlineSet)

      // Load thumbnails for all roadies
      await loadRoadieThumbnails(roadiesWithThumbnails)
    } catch (err) {
      console.error("[v0] Roadies fetch error:", err)
      toast({
        title: "Error",
        description: "Failed to load roadies data.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadRoadieThumbnails = async (roadiesList: RoadieWithThumbnail[]) => {
    try {
      setIsLoadingThumbnails(true)

      // Get all thumbnails for roadies (with BS prefix)
      const thumbnailsResponse = await getAllThumbnails({ prefix: 'BS' })

      // Group thumbnails by external_id
      const thumbnailsByRoadie: Record<string, ThumbnailInfo[]> = {}
      thumbnailsResponse.thumbnails.forEach(thumb => {
        if (!thumbnailsByRoadie[thumb.external_id]) {
          thumbnailsByRoadie[thumb.external_id] = []
        }
        thumbnailsByRoadie[thumb.external_id].push(thumb)
      })

      // Update roadies with their thumbnails
      const updatedRoadies = roadiesList.map(roadie => {
        const roadieThumbnails = thumbnailsByRoadie[roadie.external_id] || []
        const profileImage = roadieThumbnails.find(
          img => img.image_type === IMAGE_TYPES.PROFILE && img.status === 'APPROVED'
        )

        return {
          ...roadie,
          thumbnail: profileImage?.thumbnail_url,
          profileImage
        }
      })

      setRoadies(updatedRoadies)
      setFilteredRoadies(updatedRoadies)
    } catch (err) {
      console.error("Failed to load roadie thumbnails:", err)
      // Don't show error toast - thumbnails are optional
    } finally {
      setIsLoadingThumbnails(false)
    }
  }

  useEffect(() => {
    fetchRoadies()
  }, [])

  // Apply all filters
  useEffect(() => {
    if (roadies.length === 0) return

    let filtered = [...roadies]

    // Apply text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((roadie) => {
        const searchFields = [
          roadie.external_id?.toLowerCase() || "",
          roadie.first_name?.toLowerCase() || "",
          roadie.last_name?.toLowerCase() || "",
          roadie.email?.toLowerCase() || "",
          roadie.phone?.toLowerCase() || "",
          roadie.username?.toLowerCase() || "",
          roadie.nin?.toLowerCase() || "",
          roadie.is_approved ? "active" : "pending",
        ]
        return searchFields.some(field => field.includes(query))
      })
    }

    // Apply status filter
    if (statusFilter !== "all") {
      const isApproved = statusFilter === "approved"
      filtered = filtered.filter(roadie => roadie.is_approved === isApproved)
    }

    // Apply date range filter
    if (fromDate || toDate) {
      filtered = filtered.filter(roadie => {
        const createdDate = new Date(roadie.created_at)

        if (fromDate && toDate) {
          return createdDate >= fromDate && createdDate <= toDate
        } else if (fromDate) {
          return createdDate >= fromDate
        } else if (toDate) {
          return createdDate <= toDate
        }
        return true
      })
    }

    setFilteredRoadies(filtered)
  }, [searchQuery, statusFilter, fromDate, toDate, roadies])

  const handleDelete = async (roadie: RoadieWithThumbnail) => {
    if (!confirm(`Are you sure you want to delete ${roadie.first_name} ${roadie.last_name}?`)) return
    try {
      await deleteRoadie(roadie.id)
      toast({
        title: "Success",
        description: "Roadie deleted successfully"
      })
      fetchRoadies()
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete roadie",
        variant: "destructive"
      })
    }
  }

  const handleStatusToggle = async (roadie: RoadieWithThumbnail) => {
    try {
      await updateRoadie(roadie.id, { is_approved: !roadie.is_approved })
      toast({
        title: "Success",
        description: `Roadie ${!roadie.is_approved ? "approved" : "unapproved"} successfully`
      })
      fetchRoadies()
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update roadie status",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (roadie: RoadieWithThumbnail) => {
    router.push(`/admin/roadies/${roadie.id}/edit`)
  }

  const handleIdClick = (roadie: RoadieWithThumbnail) => {
    router.push(`/admin/roadies/${roadie.id}/edit`)
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

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0
    }).format(Number(amount))
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
  }

  const columns = [
    {
      header: "ID",
      accessor: "external_id" as const,
      cell: (value: string, row: RoadieWithThumbnail) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-border/50">
            {row.thumbnail ? (
              <AvatarImage
                src={row.thumbnail}
                alt={`${row.first_name} ${row.last_name}`}
                className="object-cover"
              />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
              {getInitials(row.first_name, row.last_name)}
            </AvatarFallback>
          </Avatar>
          {canChange ? (
            <button
              onClick={() => handleIdClick(row)}
              className="text-primary hover:text-primary/80 font-medium hover:underline flex items-center gap-1 transition-colors group"
              title="Edit roadie"
            >
              {value || "N/A"}
              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ) : (
            <span className="font-medium text-foreground">{value || "N/A"}</span>
          )}
        </div>
      )
    },
    {
      header: "Name",
      accessor: "first_name" as const,
      cell: (value: string, row: RoadieWithThumbnail) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{row.first_name} {row.last_name}</span>
          <span className="text-xs text-muted-foreground">@{row.username}</span>
        </div>
      )
    },
    {
      header: "Contact",
      accessor: "email" as const,
      cell: (value: string, row: RoadieWithThumbnail) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{row.email}</span>
          <span className="text-xs text-muted-foreground">{row.phone}</span>
        </div>
      )
    },
    {
      header: "Wallet Balance",
      accessor: (row: RoadieWithThumbnail) => row.wallet?.balance || "0",
      cell: (value: string, row: RoadieWithThumbnail) => {
        const balance = parseFloat(value || "0")
        return (
          <span className={cn(
            "font-mono text-sm font-semibold",
            balance < 0 ? "text-red-600" : "text-green-600"
          )}>
            {formatCurrency(value)}
          </span>
        )
      },
    },
    {
      header: "Online",
      accessor: (row: RoadieWithThumbnail) => onlineRoadies.has(row.id),
      cell: (value: any, row: RoadieWithThumbnail) => {
        const isOnline = onlineRoadies.has(row.id)
        return (
          <Badge variant={isOnline ? "default" : "outline"} className={isOnline ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "text-muted-foreground border-border"}>
            {isOnline ? "Online" : "Offline"}
          </Badge>
        )
      }
    },
    {
      header: "Status",
      accessor: (row: RoadieWithThumbnail) => row.is_approved,
      cell: (value: boolean, row: RoadieWithThumbnail) => (
        <div className="flex items-center gap-3">
          <Switch
            checked={value}
            onCheckedChange={() => handleStatusToggle(row)}
            disabled={!canApprove}
            className="data-[state=checked]:bg-green-600"
          />
          <div className="flex items-center gap-1">
            {value ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-green-700 font-medium">Active</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-yellow-700 font-medium">Pending</span>
              </>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "Created",
      accessor: "created_at" as const,
      cell: (value: string) => formatDate(value),
    },
  ]

  // Statistics
  const totalRoadies = roadies.length
  const shownRoadies = filteredRoadies.length
  const searchActive = searchQuery.trim() !== ""
  const filtersActive = statusFilter !== "all" || fromDate !== undefined || toDate !== undefined
  const activeRoadies = roadies.filter(r => r.is_approved).length
  const pendingRoadies = roadies.filter(r => !r.is_approved).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Roadies</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage roadie providers and their status
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PermissionButton
            permissions={PERMISSIONS.ROADIES_ADD}
            onClick={() => router.push("/admin/roadies/add")}
            className="gap-2 bg-primary hover:bg-primary/90 text-white"
          >
            <Plus className="h-4 w-4" />
            Add Roadie
          </PermissionButton>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Roadies</p>
              <p className="text-2xl font-bold mt-1 text-foreground">{totalRoadies}</p>
            </div>
            <div className="bg-primary/10 p-2 rounded-full">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold mt-1 text-emerald-500">{activeRoadies}</p>
            </div>
            <div className="bg-emerald-500/10 p-2 rounded-full">
              <Check className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Approval</p>
              <p className="text-2xl font-bold mt-1 text-amber-500">{pendingRoadies}</p>
            </div>
            <div className="bg-amber-500/10 p-2 rounded-full">
              <XCircle className="h-5 w-5 text-amber-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-card rounded-lg border border-border shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search roadies by name, email, phone, username, NIN, or status..."
                value={searchInput}
                onChange={handleSearchChange}
                className="pl-10 pr-20"
                disabled={isLoading || isLoadingThumbnails}
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
                <Badge variant="outline" className="bg-muted border-border">
                  {totalRoadies}
                </Badge>
              </div>
              {(searchActive || filtersActive) && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Showing:</span>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    {shownRoadies} of {totalRoadies}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-card border-border">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="approved">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500" />
                      Active Only
                    </div>
                  </SelectItem>
                  <SelectItem value="pending">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-amber-500" />
                      Pending Only
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* From Date Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">From Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-card border-border",
                      !fromDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fromDate ? format(fromDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={fromDate}
                    onSelect={setFromDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* To Date Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">To Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-card border-border",
                      !toDate && "text-muted-foreground"
                    )}
                    disabled={!fromDate}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {toDate ? format(toDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={toDate}
                    onSelect={setToDate}
                    initialFocus
                    disabled={(date) => fromDate ? date < fromDate : false}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Filter Actions */}
            <div className="md:col-span-3 flex justify-end gap-2 pt-2">
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
        {searchActive && shownRoadies === 0 && !isSearching && (
          <div className="mt-3 text-sm text-muted-foreground">
            No results found for "{searchQuery}". Try searching by:
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Name (first or last)</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Username</li>
              <li>NIN number</li>
              <li>Status (active or pending)</li>
            </ul>
          </div>
        )}
      </div>

      <div className="bg-card rounded-lg border border-border shadow-sm min-h-[400px]">
        {isLoading || isLoadingThumbnails ? (
          <div className="p-8 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading roadies...</p>
          </div>
        ) : isSearching ? (
          <div className="p-8 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Searching for "{searchInput}"...</p>
          </div>
        ) : filteredRoadies.length === 0 ? (
          <div className="p-8">
            {searchActive || filtersActive ? (
              <EmptyState
                title="No matching roadies found"
                description={
                  searchActive
                    ? `No roadies found matching "${searchQuery}"`
                    : "No roadies match the current filters"
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
                title="No roadies found"
                description="No roadies have been added yet. Add your first roadie to get started."
                action={
                  canAdd ? (
                    <Button
                      onClick={() => router.push("/admin/roadies/add")}
                      className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Plus className="h-4 w-4" />
                      Add Roadie
                    </Button>
                  ) : undefined
                }
              />
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="p-4 border-b border-border bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                {searchActive || filtersActive ? (
                  <>
                    Showing <span className="font-semibold text-foreground">{shownRoadies}</span> roadie{shownRoadies !== 1 ? 's' : ''}
                    <span className="mx-1">•</span>
                    <span className="text-primary">
                      {searchActive && `Search: "${searchQuery}"`}
                      {searchActive && filtersActive && ' • '}
                      {filtersActive && 'Filtered'}
                    </span>
                  </>
                ) : (
                  <>
                    Showing all <span className="font-semibold text-foreground">{shownRoadies}</span> roadie{shownRoadies !== 1 ? 's' : ''}
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
              data={filteredRoadies}
              columns={columns}
              onEdit={canChange ? handleEdit : undefined}
              onDelete={canDelete ? handleDelete : undefined}
            />
          </div>
        )}
      </div>
    </div>
  )
}