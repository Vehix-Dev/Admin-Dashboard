"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { DataTable } from "@/components/management/data-table"
import { EmptyState } from "@/components/dashboard/empty-state"
import {
  getServices,
  createService,
  updateService,
  deleteService,
  type Service,
  getServiceById
} from "@/lib/api"
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
  FileDown,
  Users,
  Tag,
  Clock,
  Check,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { debounce } from "lodash"
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns"
import { cn } from "@/lib/utils"
import { useCan, PermissionButton } from "@/components/auth/permission-guard"
import { PERMISSIONS } from "@/lib/permissions"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ServiceFormModal } from "@/components/forms/service-form-modal"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)

  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [showFilters, setShowFilters] = useState(false)

  const { toast } = useToast()

  // Permission checks
  const canAdd = useCan(PERMISSIONS.SERVICES_ADD)
  const canChange = useCan(PERMISSIONS.SERVICES_CHANGE)
  const canDelete = useCan(PERMISSIONS.SERVICES_DELETE)

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

  const fetchServices = async () => {
    setIsLoading(true)
    try {
      const data = await getServices()
      setServices(data)
      setFilteredServices(data)
    } catch (err) {
      console.error(" Services fetch error:", err)
      toast({
        title: "Error",
        description: "Failed to load services data.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

  // Apply all filters
  useEffect(() => {
    if (services.length === 0) return

    let filtered = [...services]

    // Apply text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((service) => {
        const searchFields = [
          service.name?.toLowerCase() || "",
          service.code?.toLowerCase() || "",
        ]
        return searchFields.some(field => field.includes(query))
      })
    }

    // Apply status filter
    if (statusFilter !== "all") {
      const isActive = statusFilter === "active"
      filtered = filtered.filter(service => service.is_active === isActive)
    }

    // Apply date range filter
    if (startDate || endDate) {
      filtered = filtered.filter(service => {
        const serviceDate = new Date(service.created_at)
        const start = startDate ? startOfDay(startDate) : new Date(0)
        const end = endDate ? endOfDay(endDate) : new Date()
        return isWithinInterval(serviceDate, { start, end })
      })
    }

    setFilteredServices(filtered)
  }, [searchQuery, statusFilter, startDate, endDate, services])

  const handleCreate = async (data: Partial<Service>) => {
    try {
      const serviceData = {
        name: data.name || "",
        code: data.code || "",
        is_active: data.is_active !== undefined ? data.is_active : true,
      }

      await createService(serviceData)
      toast({
        title: "Success",
        description: "Service created successfully"
      })
      setIsFormOpen(false)
      fetchServices()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to create service",
        variant: "destructive"
      })
    }
  }

  const handleEdit = async (data: Partial<Service>) => {
    if (!editingService) return

    try {
      await updateService(editingService.id, data)
      toast({
        title: "Success",
        description: "Service updated successfully"
      })
      setEditingService(null)
      fetchServices()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update service",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (service: Service) => {
    if (!confirm(`Are you sure you want to delete ${service.name}?`)) return
    try {
      await deleteService(service.id)
      toast({
        title: "Success",
        description: "Service deleted successfully"
      })
      fetchServices()
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive"
      })
    }
  }

  const handleStatusToggle = async (service: Service) => {
    try {
      await updateService(service.id, { is_active: !service.is_active })
      toast({
        title: "Success",
        description: `Service ${!service.is_active ? "activated" : "deactivated"} successfully`
      })
      fetchServices()
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update service status",
        variant: "destructive"
      })
    }
  }

  const handleEditClick = async (service: Service) => {
    try {
      const fullService = await getServiceById(service.id)
      setEditingService(fullService)
    } catch (err) {
      setEditingService(service)
    }
  }

  const handleExport = () => {
    try {
      const headers = ['ID', 'Name', 'Code', 'Status', 'Roadies Offering', 'Created At']
      const csvData = services.map(service => [
        service.id,
        `"${service.name}"`,
        service.code,
        service.is_active ? 'Active' : 'Inactive',
        service.rodie_count || 0,
        new Date(service.created_at).toLocaleDateString()
      ])

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `services_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: "Services exported successfully"
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to export services",
        variant: "destructive"
      })
    }
  }

  const getInitials = (name: string) => {
    return name?.charAt(0).toUpperCase() || 'S'
  }

  const columns = [
    {
      header: "Service Details",
      accessor: "name" as const,
      cell: (value: string, row: Service) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg">
            {getInitials(value || row.code)}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-foreground text-sm">{value || "Unnamed Service"}</span>
            <span className="text-xs text-muted-foreground font-mono">CODE: {row.code}</span>
          </div>
        </div>
      )
    },
    {
      header: "Coverage",
      accessor: (row: Service) => row.rodie_count || 0,
      cell: (value: number) => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 text-sm text-foreground font-medium cursor-help">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{value} roadies</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Roadies offering this service</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    },
    {
      header: "Status",
      accessor: (row: Service) => row.is_active,
      cell: (value: boolean, row: Service) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={value}
            onCheckedChange={() => handleStatusToggle(row)}
            disabled={!canChange}
            className="data-[state=checked]:bg-green-600 scale-90"
          />
          <div className="flex items-center gap-1">
            {value ? (
              <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20 text-[10px] font-bold uppercase">Active</Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-500/5 text-amber-600 border-amber-500/20 text-[10px] font-bold uppercase">Inactive</Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "Created",
      accessor: "created_at" as const,
      cell: (value: string) => (
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-mono">
            {new Date(value).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </span>
        </div>
      ),
    },
  ]

  // Statistics
  const stats = {
    total: services.length,
    active: services.filter(s => s.is_active).length,
    inactive: services.filter(s => !s.is_active).length,
    totalRoadies: services.reduce((sum, service) => sum + (service.rodie_count || 0), 0)
  }

  const totalServices = filteredServices.length
  const shownServices = filteredServices.length
  const searchActive = searchQuery.trim() !== ""
  const filtersActive = statusFilter !== "all" || startDate !== undefined || endDate !== undefined

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-mono">Services</h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">
            Manage roadside assistance categories and roadie coverage
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-2 font-mono h-10 border-border"
            disabled={services.length === 0}
          >
            <FileDown className="h-4 w-4" />
            Export CSV
          </Button>
          <PermissionButton
            permissions={PERMISSIONS.SERVICES_ADD}
            onClick={() => setIsFormOpen(true)}
            className="gap-2 bg-primary hover:bg-primary/90 text-white font-mono h-10"
          >
            <Plus className="h-4 w-4" />
            Add Service
          </PermissionButton>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Total Services</p>
              <p className="text-2xl font-bold mt-1 text-foreground">{stats.total}</p>
            </div>
            <div className="bg-primary/10 p-2.5 rounded-xl">
              <Tag className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Active</p>
              <p className="text-2xl font-bold mt-1 text-emerald-500">{stats.active}</p>
            </div>
            <div className="bg-emerald-500/10 p-2.5 rounded-xl">
              <Check className="h-5 w-5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Total Coverage</p>
              <p className="text-2xl font-bold mt-1 text-blue-500">{stats.totalRoadies}</p>
            </div>
            <div className="bg-blue-500/10 p-2.5 rounded-xl">
              <Users className="h-5 w-5 text-blue-500" />
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
                placeholder="Search by name or service code..."
                value={searchInput}
                onChange={handleSearchChange}
                className="pl-10 pr-20 font-mono text-sm bg-background border-border"
                disabled={isLoading}
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
                <span className="text-foreground font-bold">{totalServices}</span>
              </div>
              {(searchActive || filtersActive) && (
                <>
                  <div className="w-px h-3 bg-border" />
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold uppercase opacity-50 text-primary">MATCHES:</span>
                    <span className="text-primary font-bold">{shownServices}</span>
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
                  <SelectItem value="active">ACTIVE ONLY</SelectItem>
                  <SelectItem value="inactive">INACTIVE ONLY</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Created From</label>
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
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Created To</label>
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
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground font-mono uppercase tracking-widest animate-pulse">Synchronizing Data...</p>
          </div>
        ) : isSearching ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-mono uppercase tracking-widest animate-pulse">Indexing Results...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState
              title={searchActive || filtersActive ? "No Records Found" : "Database Empty"}
              description={searchActive || filtersActive ? "The current filter parameters yielded no matches in our database." : "No service records were found in the system."}
              action={
                searchActive || filtersActive ? (
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
                ) : (
                  canAdd ? (
                    <Button
                      onClick={() => setIsFormOpen(true)}
                      className="gap-2 bg-primary text-white font-mono"
                    >
                      <Plus className="h-4 w-4" />
                      Add First Service
                    </Button>
                  ) : undefined
                )
              }
            />
          </div>
        ) : (
          <DataTable
            data={filteredServices}
            columns={columns}
            onEdit={canChange ? handleEditClick : undefined}
            onDelete={canDelete ? handleDelete : undefined}
            initialSortColumn={3}
            initialSortDirection="desc"
          />
        )}
      </div>

      {/* Create Modal */}
      <ServiceFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreate}
      />

      {/* Edit Modal */}
      <ServiceFormModal
        isOpen={!!editingService}
        onClose={() => setEditingService(null)}
        onSubmit={handleEdit}
        initialData={editingService || undefined}
      />
    </div>
  )
}