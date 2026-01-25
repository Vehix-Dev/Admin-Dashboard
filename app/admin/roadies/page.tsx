"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { DataTable } from "@/components/management/data-table"
import { EmptyState } from "@/components/dashboard/empty-state"
import { getRoadies, updateRoadie, deleteRoadie, type Roadie, getCombinedRealtimeLocations, type RodieLocation, getAllThumbnails, type ThumbnailInfo, IMAGE_TYPES } from "@/lib/api"
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
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [showFilters, setShowFilters] = useState(false)
  const [statusToggling, setStatusToggling] = useState<number[]>([])

  const { toast } = useToast()

  // Permission checks
  const canAdd = useCan(PERMISSIONS.ROADIES_ADD)
  const canChange = useCan(PERMISSIONS.ROADIES_CHANGE)
  const canDelete = useCan(PERMISSIONS.ROADIES_DELETE)
  const canApprove = useCan(PERMISSIONS.ROADIES_APPROVE)
  const canDisable = useCan(PERMISSIONS.ROADIES_DISABLE)

  // Approval implies Disable permission
  const hasDisablePermission = canDisable || canApprove

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
    setStartDate(undefined)
    setEndDate(undefined)
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
      console.error(" Roadies fetch error:", err)
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
    if (startDate || endDate) {
      filtered = filtered.filter(roadie => {
        const requestDate = new Date(roadie.created_at)
        const start = startDate ? startOfDay(startDate) : new Date(0)
        const end = endDate ? endOfDay(endDate) : new Date()
        return isWithinInterval(requestDate, { start, end })
      })
    }

    setFilteredRoadies(filtered)
  }, [searchQuery, statusFilter, startDate, endDate, roadies])

  const handleDelete = async (roadie: RoadieWithThumbnail) => {
    try {
      await deleteRoadie(roadie.id)

      const currentUser = await getAdminProfile()
      AuditService.log(
        "Delete Roadie",
        `Roadie: ${roadie.first_name} ${roadie.last_name} (${roadie.username})`,
        currentUser?.username || currentUser?.name || currentUser?.email || "Unknown",
        { roadieId: roadie.id, externalId: roadie.external_id }
      )
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

  const handleBulkDelete = async (selectedRoadies: RoadieWithThumbnail[]) => {
    try {
      await Promise.all(selectedRoadies.map(r => deleteRoadie(r.id)))

      const currentUser = await getAdminProfile()
      AuditService.log(
        "Bulk Delete Roadies",
        `Deleted ${selectedRoadies.length} roadies`,
        currentUser?.username || currentUser?.name || currentUser?.email || "Unknown",
        { count: selectedRoadies.length, roadieIds: selectedRoadies.map(r => r.id) }
      )

      toast({
        title: "Success",
        description: `${selectedRoadies.length} roadies deleted successfully`
      })
      fetchRoadies()
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete some roadies",
        variant: "destructive"
      })
      fetchRoadies()
    }
  }

  const handleStatusToggle = async (roadie: RoadieWithThumbnail) => {
    try {
      setStatusToggling(prev => [...prev, roadie.id])
      const newStatus = !roadie.is_approved
      await updateRoadie(roadie.id, { is_approved: newStatus })

      const currentUser = await getAdminProfile()
      AuditService.log(
        newStatus ? "Approve Roadie" : "Unapprove Roadie",
        `Roadie: ${roadie.first_name} ${roadie.last_name} (${roadie.username})`,
        currentUser?.username || currentUser?.name || currentUser?.email || "Unknown",
        { roadieId: roadie.id, externalId: roadie.external_id, newStatus }
      )

      if (newStatus) {
        try {
          await fetch('/api/admin/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: roadie.email,
              type: 'WELCOME_APPROVAL',
              data: {
                userName: roadie.first_name,
                role: 'Roadie'
              }
            })
          })
        } catch (e) {
          console.error("Failed to send welcome email", e)
        }
      }

      toast({
        title: "Success",
        description: `Roadie ${newStatus ? "approved" : "unapproved"} successfully`
      })
      fetchRoadies()
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update roadie status",
        variant: "destructive"
      })
    } finally {
      setStatusToggling(prev => prev.filter(id => id !== roadie.id))
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
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-mono text-xs">
              {getInitials(row.first_name, row.last_name)}
            </AvatarFallback>
          </Avatar>
          {canChange ? (
            <button
              onClick={() => handleIdClick(row)}
              className="text-primary hover:text-primary/80 font-mono font-medium hover:underline flex items-center gap-1 transition-colors group text-sm"
              title="Edit roadie"
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
      cell: (value: string, row: RoadieWithThumbnail) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground text-sm">{row.first_name} {row.last_name}</span>
          <span className="text-xs text-muted-foreground font-mono">@{row.username}</span>
        </div>
      )
    },
    {
      header: "Contact",
      accessor: "email" as const,
      cell: (value: string, row: RoadieWithThumbnail) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">{row.email}</span>
          <span className="text-xs text-muted-foreground font-mono">{row.phone}</span>
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
            balance < 0 ? "text-destructive" : "text-emerald-500"
          )}>
            {formatCurrency(value)}
          </span>
        )
      },
    },
    {
      header: "Device",
      accessor: "device_type" as const,
      cell: (value: string | null) => (
        <span className="text-xs text-muted-foreground font-mono">{value || "Unknown"}</span>
      ),
    },
    {
      header: "Online",
      accessor: (row: RoadieWithThumbnail) => row.is_online,
      cell: (value: boolean, row: RoadieWithThumbnail) => {
        const isOnline = value || onlineRoadies.has(row.id)
        return (
          <Badge variant={isOnline ? "default" : "outline"} className={isOnline ? "bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold uppercase" : "text-muted-foreground border-border text-[10px] font-bold uppercase"}>
            {isOnline ? "Online" : "Offline"}
          </Badge>
        )
      }
    },
    {
      header: "Status",
      accessor: (row: RoadieWithThumbnail) => row.is_approved,
      cell: (value: boolean, row: RoadieWithThumbnail) => (
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
                <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20 text-[10px] font-bold uppercase">Approved</Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-500/5 text-amber-600 border-amber-500/20 text-[10px] font-bold uppercase">Pending</Badge>
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

  // Statistics
  const totalRoadies = roadies.length
  const shownRoadies = filteredRoadies.length
  const searchActive = searchQuery.trim() !== ""
  const filtersActive = statusFilter !== "all" || startDate !== undefined || endDate !== undefined
  const activeRoadies = roadies.filter(r => r.is_approved).length
  const pendingRoadies = roadies.filter(r => !r.is_approved).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-mono">Roadies</h1>
          <p className="text-sm text-muted-foreground mt-1 text-mono">
            Manage roadside assistance providers and their status
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PermissionButton
            permissions={PERMISSIONS.ROADIES_ADD}
            onClick={() => router.push("/admin/roadies/add")}
            className="gap-2 bg-primary hover:bg-primary/90 text-white font-mono h-10"
          >
            <Plus className="h-4 w-4" />
            Add Roadie
          </PermissionButton>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Total Roadies</p>
              <p className="text-2xl font-bold mt-1 text-foreground">{totalRoadies}</p>
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
              <p className="text-2xl font-bold mt-1 text-emerald-500">{activeRoadies}</p>
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
              <p className="text-2xl font-bold mt-1 text-amber-500">{pendingRoadies}</p>
            </div>
            <div className="bg-amber-500/10 p-2.5 rounded-xl">
              <XCircle className="h-5 w-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters Bar */}
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
                <span className="text-foreground font-bold">{totalRoadies}</span>
              </div>
              {(searchActive || filtersActive) && (
                <>
                  <div className="w-px h-3 bg-border" />
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold uppercase opacity-50 text-primary">MATCHES:</span>
                    <span className="text-primary font-bold">{shownRoadies}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
            {/* Status Filter */}
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

            {/* Joined Date Range Filter */}
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

            {/* Filter Actions */}
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
        ) : filteredRoadies.length === 0 ? (
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
                description="No roadie records were found in the system."
                action={
                  canAdd ? (
                    <Button
                      onClick={() => router.push("/admin/roadies/add")}
                      className="gap-2 bg-primary text-white font-mono"
                    >
                      <Plus className="h-4 w-4" />
                      Add First Roadie
                    </Button>
                  ) : undefined
                }
              />
            )}
          </div>
        ) : (
          <DataTable
            data={filteredRoadies}
            columns={columns}
            onEdit={canChange ? handleEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
            onBulkDelete={canDelete ? handleBulkDelete : undefined}
            onExport={() => { }}
            deleteConfirmTitle="Delete Roadie"
            deleteConfirmDescription="Are you sure you want to delete this roadie account? This action cannot be undone."
            bulkDeleteConfirmTitle="Delete Multiple Roadies"
            bulkDeleteConfirmDescription="Are you sure you want to delete the selected roadie accounts? This action cannot be undone."
            renderConfirmDetails={(roadie) => (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium text-white">{roadie.first_name} {roadie.last_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Username:</span>
                  <span className="font-mono text-primary">@{roadie.username}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="text-white">{roadie.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="text-white">{roadie.phone}</span>
                </div>
              </div>
            )}
            initialSortColumn={6}
            initialSortDirection="desc"
          />
        )}
      </div>
    </div>
  )
}