"use client"

import { useEffect, useState } from "react"
import { getRoadies, type Roadie, getAllThumbnails, type ThumbnailInfo, IMAGE_TYPES, getServiceRequests, type ServiceRequest } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Printer, FileText, ChevronDown, ChevronRight, User, Download } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface RoadieWithThumbnail extends Roadie {
    thumbnail?: string
    completedServices?: number
}

export default function RoadiesTotalServicesPage() {
    const [roadies, setRoadies] = useState<RoadieWithThumbnail[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [showAllRows, setShowAllRows] = useState(false)

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        totalEarnings: 0
    })

    useEffect(() => {
        async function fetchData() {
            try {
                const [data, thumbnailsRes, serviceRequests] = await Promise.all([
                    getRoadies(),
                    getAllThumbnails({ prefix: 'BS' }),
                    getServiceRequests()
                ])

                // Process thumbnails
                const thumbnailsByRoadie: Record<string, ThumbnailInfo[]> = {}
                thumbnailsRes.thumbnails.forEach(thumb => {
                    if (!thumbnailsByRoadie[thumb.external_id]) {
                        thumbnailsByRoadie[thumb.external_id] = []
                    }
                    thumbnailsByRoadie[thumb.external_id].push(thumb)
                })

                // Calculate completed services per roadie
                const completedServicesByRoadie: Record<number, number> = {}
                serviceRequests.forEach(req => {
                    if (req.rodie && req.status === 'COMPLETED') {
                        completedServicesByRoadie[req.rodie] = (completedServicesByRoadie[req.rodie] || 0) + 1
                    }
                })

                // Merge data
                const roadiesWithData = data.map(roadie => {
                    const roadieThumbnails = thumbnailsByRoadie[roadie.external_id] || []
                    const profileImage = roadieThumbnails.find(
                        img => img.image_type === IMAGE_TYPES.PROFILE && img.status === 'APPROVED'
                    )
                    return {
                        ...roadie,
                        thumbnail: profileImage?.thumbnail_url,
                        completedServices: completedServicesByRoadie[roadie.id] || 0
                    }
                })

                setRoadies(roadiesWithData)

                // Calculate stats
                const total = data.length
                const active = data.filter(r => r.is_approved).length
                const earnings = data.reduce((sum, r) => sum + parseFloat(r.wallet?.balance || "0"), 0)
                setStats({ total, active, totalEarnings: earnings })

            } catch (error) {
                console.error("Failed to fetch roadies data:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    const filteredRoadies = roadies.filter(roadie => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return (
            roadie.username.toLowerCase().includes(query) ||
            roadie.email.toLowerCase().includes(query) ||
            roadie.first_name.toLowerCase().includes(query) ||
            roadie.last_name.toLowerCase().includes(query) ||
            (roadie.phone && roadie.phone.includes(query))
        )
    })

    const displayedRoadies = showAllRows ? filteredRoadies : filteredRoadies.slice(0, 100)

    const formatCurrency = (amount: string | number | undefined) => {
        if (!amount) return "UGX 0"
        return new Intl.NumberFormat('en-UG', {
            style: 'currency',
            currency: 'UGX',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(typeof amount === 'string' ? parseFloat(amount) : amount)
    }

    const handlePrint = () => {
        window.print()
    }

    const handleExportCSV = () => {
        const headers = ["ID", "Name", "Email", "Phone", "Total Completed Services", "Balance"]
        const csvContent = [
            headers.join(","),
            ...filteredRoadies.map(r => [
                r.external_id || r.id,
                `"${r.first_name} ${r.last_name}"`,
                r.email,
                r.phone,
                r.completedServices || 0,
                r.wallet?.balance || 0
            ].join(","))
        ].join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", "roadies_services.csv")
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="space-y-6 print:p-0 print:space-y-0">
            <div className="print:hidden">
                <h1 className="text-2xl font-normal text-gray-800">Roadie Total Service</h1>
                <p className="text-sm text-gray-500">Home / Roadie Total Service</p>
            </div>

            {/* ROADIES Section with Stats */}
            <Collapsible defaultOpen className="border rounded-t-lg bg-white shadow-sm print:hidden">
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100">
                    <span>ROADIES</span>
                    <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="slow-accordion-content">
                    <div className="p-4 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <p className="text-sm text-blue-600 font-medium">Total Roadies</p>
                                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                <p className="text-sm text-green-600 font-medium">Active Roadies</p>
                                <p className="text-2xl font-bold text-green-900">{stats.active}</p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                                <p className="text-sm text-purple-600 font-medium">Total Wallet Holdings</p>
                                <p className="text-2xl font-bold text-purple-900">{formatCurrency(stats.totalEarnings)}</p>
                            </div>
                        </div>
                    </div>
                </CollapsibleContent>
            </Collapsible>

            {/* Search Section */}
            <Collapsible defaultOpen className="border-x border-b bg-white shadow-sm print:hidden">
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border-b">
                    <span>Search</span>
                    <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="slow-accordion-content">
                    <div className="p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by name, email, or phone..."
                                className="pl-10 max-w-md"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CollapsibleContent>
            </Collapsible>

            {/* Main Content Card */}
            <Card className="rounded-lg shadow border-t-4 border-t-purple-600 bg-white print:shadow-none print:border-none">
                <div className="p-4 border-b flex justify-between items-center print:hidden">
                    <h2 className="text-lg font-medium text-gray-800">Roadies Total Services</h2>
                </div>

                <div className="p-4 space-y-4">
                    {/* Action Bar */}
                    <div className="flex gap-2 print:hidden">
                        <Button
                            className="bg-[#9333ea] hover:bg-[#7e22ce] text-white"
                            onClick={() => setShowAllRows(!showAllRows)}
                        >
                            {showAllRows ? "Show 100 rows" : "Show All Rows"} <ChevronDown className="ml-2 h-3 w-3" />
                        </Button>
                        <Button
                            variant="secondary"
                            className="bg-[#9333ea] text-white hover:bg-[#7e22ce]"
                            onClick={handleExportCSV}
                        >
                            CSV
                        </Button>
                        <Button
                            variant="secondary"
                            className="bg-[#9333ea] text-white hover:bg-[#7e22ce]"
                            onClick={handlePrint}
                        >
                            Print
                        </Button>
                    </div>

                    {/* Data Table */}
                    <div className="border rounded-sm overflow-hidden text-left">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead className="w-[100px] font-bold text-gray-700">ID</TableHead>
                                    <TableHead className="font-bold text-gray-700">Roadie Detail</TableHead>
                                    <TableHead className="font-bold text-gray-700">#Completed Services</TableHead>
                                    <TableHead className="font-bold text-gray-700">Total Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                            Loading roadies data...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredRoadies.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                            No roadies found matching your search.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    displayedRoadies.map((roadie, index) => (
                                        <TableRow key={roadie.id} className={index % 2 === 0 ? "bg-gray-50/50" : "bg-white"}>
                                            <TableCell className="align-top py-4 text-gray-600">
                                                {roadie.external_id || roadie.id}
                                            </TableCell>
                                            <TableCell className="align-top py-4">
                                                <div className="flex gap-3">
                                                    <Avatar className="h-12 w-12 border-2 border-gray-200">
                                                        <AvatarImage src={roadie.thumbnail} />
                                                        <AvatarFallback><User className="h-6 w-6 text-gray-400" /></AvatarFallback>
                                                    </Avatar>
                                                    <div className="space-y-1">
                                                        <p className="font-medium text-[#c026d3] text-[15px]">
                                                            {roadie.first_name} {roadie.last_name}
                                                        </p>
                                                        <div className="text-xs text-gray-500 flex flex-col gap-0.5">
                                                            <div className="flex items-center gap-1">
                                                                <span className="opacity-70">✉</span> {roadie.email}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <span className="opacity-70">📱</span> {roadie.phone}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="align-top py-4 text-gray-600">
                                                {roadie.completedServices || 0}
                                            </TableCell>
                                            <TableCell className="align-top py-4">
                                                <div className="space-y-2">
                                                    <div className="text-sm">
                                                        <span className="text-gray-600">Cash: </span>
                                                        <span className="font-medium text-gray-900">
                                                            {formatCurrency(roadie.wallet?.balance)}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm font-bold text-gray-800">
                                                        Total: {formatCurrency(roadie.wallet?.balance)}
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex justify-between items-center text-sm text-gray-500 pt-2 print:hidden">
                        <div>Showing 1 to {displayedRoadies.length} of {filteredRoadies.length} entries</div>
                        <div className="flex gap-1">
                            <Button variant="outline" size="sm" disabled>Previous</Button>
                            <Button variant="outline" size="sm" className="bg-[#9333ea] text-white hover:bg-[#7e22ce]">1</Button>
                            <Button variant="outline" size="sm" disabled>Next</Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}
