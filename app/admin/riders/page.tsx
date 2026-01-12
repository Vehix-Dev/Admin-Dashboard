"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { DataTable } from "@/components/management/data-table"
import { EmptyState } from "@/components/dashboard/empty-state"
import { getRiders, updateRider, deleteRider, type Rider } from "@/lib/api"
import { getAllThumbnails, type ThumbnailInfo, IMAGE_TYPES } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Plus,
  RefreshCw,
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
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useCan, PermissionButton } from "@/components/auth/permission-guard"
import { PERMISSIONS } from "@/lib/permissions"

// Extended Rider interface with thumbnail
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

  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined)
  const [toDate, setToDate] = useState<Date | undefined>(undefined)
  const [showFilters, setShowFilters] = useState(false)

  const { toast } = useToast()

  // Permission checks
  const canAdd = useCan(PERMISSIONS.RIDERS_ADD)
  const canChange = useCan(PERMISSIONS.RIDERS_CHANGE)
  const canDelete = useCan(PERMISSIONS.RIDERS_DELETE)
  const canApprove = useCan(PERMISSIONS.RIDERS_APPROVE)

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

  const fetchRiders = async () => {
    setIsLoading(true)
    try {
      const data = await getRiders()
      const ridersWithThumbnails = data as RiderWithThumbnail[]
      setRiders(ridersWithThumbnails)
      setFilteredRiders(ridersWithThumbnails)

      // Load thumbnails for all riders
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

      // Get all thumbnails for riders (with R prefix)
      const thumbnailsResponse = await getAllThumbnails({ prefix: 'R' })

      // Group thumbnails by external_id
      const thumbnailsByRider: Record<string, ThumbnailInfo[]> = {}
      thumbnailsResponse.thumbnails.forEach(thumb => {
        if (!thumbnailsByRider[thumb.external_id]) {
          thumbnailsByRider[thumb.external_id] = []
        }
        thumbnailsByRider[thumb.external_id].push(thumb)
      })

      // Update riders with their thumbnails
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
      // Don't show error toast - thumbnails are optional
    } finally {
      setIsLoadingThumbnails(false)
    }
  }

  useEffect(() => {
    fetchRiders()
  }, [])

  // Apply all filters
  useEffect(() => {
    if (riders.length === 0) return

    let filtered = [...riders]

    // Apply text search
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

    // Apply status filter
    if (statusFilter !== "all") {
      const isApproved = statusFilter === "approved"
      filtered = filtered.filter(rider => rider.is_approved === isApproved)
    }

    // Apply date range filter
    if (fromDate || toDate) {
      filtered = filtered.filter(rider => {
        const createdDate = new Date(rider.created_at)

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

    setFilteredRiders(filtered)
  }, [searchQuery, statusFilter, fromDate, toDate, riders])

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
          <Avatar className="h-10 w-10 border-2 border-gray-200">
            {row.thumbnail ? (
              <AvatarImage
                src={row.thumbnail}
                alt={`${row.first_name} ${row.last_name}`}
                className="object-cover"
              />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-50 text-blue-700">
              {getInitials(row.first_name, row.last_name)}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={() => handleIdClick(row)}
            className="text-blue-600 hover:text-blue-800 font-medium hover:underline flex items-center gap-1 transition-colors group"
            title="Edit rider"
          >
            {value || "N/A"}
            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      )
    },
    {
      header: "Name",
      accessor: "first_name" as const,
      cell: (value: string, row: RiderWithThumbnail) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.first_name} {row.last_name}</span>
          <span className="text-xs text-gray-500">@{row.username}</span>
        </div>
      )
    },
    {
      header: "Contact",
      accessor: "email" as const,
      cell: (value: string, row: RiderWithThumbnail) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.email}</span>
          <span className="text-xs text-gray-500">{row.phone}</span>
        </div>
      )
    },
    {
      header: "NIN",
      accessor: "nin" as const,
      cell: (value: string) => (
        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
          {value || "N/A"}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: (row: RiderWithThumbnail) => row.is_approved,
      cell: (value: boolean, row: RiderWithThumbnail) => (
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
  const totalRiders = riders.length
  const shownRiders = filteredRiders.length
  const searchActive = searchQuery.trim() !== ""
  const filtersActive = statusFilter !== "all" || fromDate !== undefined || toDate !== undefined
  const activeRiders = riders.filter(r => r.is_approved).length
  const pendingRiders = riders.filter(r => !r.is_approved).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Customers</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage rider customers and their status
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRiders}
            className="gap-2 border-gray-300 bg-white hover:bg-gray-50"
            disabled={isLoading || isLoadingThumbnails}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading || isLoadingThumbnails ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <PermissionButton
            permissions={PERMISSIONS.RIDERS_ADD}
            onClick={() => router.push("/admin/riders/add")}
            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </PermissionButton>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold mt-1">{totalRiders}</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold mt-1 text-green-600">{activeRiders}</p>
            </div>
            <div className="bg-green-100 p-2 rounded-full">
              <Check className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Approval</p>
              <p className="text-2xl font-bold mt-1 text-yellow-600">{pendingRiders}</p>
            </div>
            <div className="bg-yellow-100 p-2 rounded-full">
              <XCircle className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-lg border shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search customers by name, email, phone, username, NIN, or status..."
                value={searchInput}
                onChange={handleSearchChange}
                className="pl-10 pr-20"
                disabled={isLoading || isLoadingThumbnails}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                {isSearching ? (
                  <div className="flex items-center gap-1 text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs">Searching...</span>
                  </div>
                ) : searchInput ? (
                  <button
                    onClick={clearSearch}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
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

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="font-medium">Total:</span>
                <Badge variant="outline" className="bg-gray-50">
                  {totalRiders}
                </Badge>
              </div>
              {(searchActive || filtersActive) && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Showing:</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {shownRiders} of {totalRiders}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="approved">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Active Only
                    </div>
                  </SelectItem>
                  <SelectItem value="pending">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-yellow-600" />
                      Pending Only
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* From Date Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">From Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
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
              <label className="text-sm font-medium text-gray-700">To Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
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
        {searchActive && shownRiders === 0 && !isSearching && (
          <div className="mt-3 text-sm text-gray-500">
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

      <div className="bg-white rounded-lg border shadow-sm min-h-[400px]">
        {isLoading || isLoadingThumbnails ? (
          <div className="p-8 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <p className="text-gray-600">Loading customers...</p>
          </div>
        ) : isSearching ? (
          <div className="p-8 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-gray-600">Searching for "{searchInput}"...</p>
          </div>
        ) : filteredRiders.length === 0 ? (
          <div className="p-8">
            {searchActive || filtersActive ? (
              <EmptyState
                title="No matching customers found"
                description={
                  searchActive
                    ? `No customers found matching "${searchQuery}"`
                    : "No customers match the current filters"
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
                title="No customers found"
                description="No customers have been added yet. Add your first customer to get started."
                action={
                  canAdd ? (
                    <Button
                      onClick={() => router.push("/admin/riders/add")}
                      className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Plus className="h-4 w-4" />
                      Add Customer
                    </Button>
                  ) : undefined
                }
              />
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="p-4 border-b bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-sm text-gray-600">
                {searchActive || filtersActive ? (
                  <>
                    Showing <span className="font-semibold">{shownRiders}</span> customer{shownRiders !== 1 ? 's' : ''}
                    <span className="mx-1">•</span>
                    <span className="text-blue-600">
                      {searchActive && `Search: "${searchQuery}"`}
                      {searchActive && filtersActive && ' • '}
                      {filtersActive && 'Filtered'}
                    </span>
                  </>
                ) : (
                  <>
                    Showing all <span className="font-semibold">{shownRiders}</span> customer{shownRiders !== 1 ? 's' : ''}
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
              data={filteredRiders}
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