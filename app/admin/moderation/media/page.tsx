"use client"

import { useEffect, useState } from "react"
import {
    getAllImages,
    updateImageStatus,
    getImageTypeLabel,
    getStatusColorForImage,
    type AdminImage
} from "@/lib/api"
import { useCan } from "@/components/auth/permission-guard"
import { PERMISSIONS } from "@/lib/permissions"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Filter, Search } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { EmptyState } from "@/components/dashboard/empty-state"

export default function MediaModerationPage() {
    const [images, setImages] = useState<AdminImage[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState<string>("ALL")
    const [searchQuery, setSearchQuery] = useState("")
    const { toast } = useToast()
    const canManage = useCan(PERMISSIONS.MEDIA_MANAGE)

    const fetchImages = async () => {
        setIsLoading(true)
        try {
            const data = await getAllImages({
                status: filterStatus === "ALL" ? undefined : filterStatus,
                search: searchQuery || undefined
            })
            setImages(data)
        } catch (err) {
            console.error(" Images fetch error:", err)
            toast({
                title: "Error",
                description: "Failed to load images.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchImages()
    }, [filterStatus])

    // Handle search with debounce in real implementation, simplified here
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        fetchImages()
    }

    const handleUpdateStatus = async (image: AdminImage, status: 'APPROVED' | 'REJECTED') => {
        try {
            await updateImageStatus(image.id, status)
            toast({
                title: "Success",
                description: `Image ${status.toLowerCase()} successfully`
            })
            // Remove from list if filtering by pending, or update locally
            setImages(prev => prev.map(img =>
                img.id === image.id ? { ...img, status } : img
            ).filter(img => filterStatus === "ALL" || filterStatus === img.status))
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message || "Failed to update status",
                variant: "destructive"
            })
        }
    }

    // Group images by user
    const groupedImages = images.reduce((acc, image) => {
        const key = image.external_id
        if (!acc[key]) {
            acc[key] = {
                user: image.user_info || image.user_details || { username: 'Unknown', role: 'Unknown', email: '', phone: '', is_approved: false, created_at: '' },
                images: []
            }
        }
        acc[key].images.push(image)
        return acc
    }, {} as Record<string, { user: any, images: AdminImage[] }>)

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Media Moderation</h1>
                    <p className="text-muted-foreground mt-1">Review and moderate all user uploads</p>
                </div>
                <div className="flex gap-2">
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-lg border border-border">
                <div className="flex-1">
                    <form onSubmit={handleSearch} className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by username or external ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </form>
                </div>
                <div className="w-full md:w-48">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger>
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                <SelectValue placeholder="Status" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Status</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="APPROVED">Approved</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Grouped Gallery */}
            {isLoading ? (
                <div className="space-y-8">
                    {[1, 2].map(i => (
                        <div key={i} className="border border-border rounded-lg overflow-hidden">
                            <div className="h-10 bg-muted animate-pulse" />
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <Skeleton className="h-64 rounded-xl" />
                                <Skeleton className="h-64 rounded-xl" />
                                <Skeleton className="h-64 rounded-xl" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : images.length === 0 ? (
                <EmptyState
                    title="No images found"
                    description={searchQuery ? "Try adjusting your search filters." : "All caught up! No images to moderate."}
                    icon={CheckCircle}
                />
            ) : (
                <div className="space-y-8">
                    {/* Main Table Header Style for Legend/Context if needed, though mostly visual per user request */}
                    <div className="hidden md:block text-sm font-semibold text-muted-foreground border-b border-border pb-2 mb-4">
                        SR No. &nbsp;&nbsp; User Asset Detail
                    </div>

                    {Object.entries(groupedImages).map(([externalId, group], groupIndex) => (
                        <div key={externalId} className="border border-border rounded-lg overflow-hidden shadow-sm bg-card">
                            {/* User Header - Cyan/Blue Bar */}
                            <div className="bg-[#00B4D8] text-white px-4 py-3 font-semibold text-lg flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span>{externalId}</span>
                                    <span>-</span>
                                    <span className="uppercase">{group.user?.username || 'Unknown User'}</span>
                                </div>
                                <div className="text-sm font-normal opacity-90">
                                    {group.images.length} Aggregated Assets
                                </div>
                            </div>

                            {/* Images Grid for User */}
                            <div className="p-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {group.images.map((image, idx) => (
                                        <div key={image.id} className="flex flex-col gap-2 items-start">
                                            {/* Serial Number */}
                                            {/* <div className="font-bold text-gray-400 text-xs">
                                                {idx + 1}
                                            </div> */}

                                            {/* Image Card */}
                                            <Card className="w-full overflow-hidden group border border-border hover:border-primary/50 transition-colors bg-card">
                                                <div className="relative aspect-video bg-muted">
                                                    {/* Image */}
                                                    <img
                                                        src={image.original_url || image.thumbnail_url}
                                                        alt={getImageTypeLabel(image.image_type as any)}
                                                        className="object-cover w-full h-full cursor-pointer hover:opacity-95 transition-opacity"
                                                        onClick={() => window.open(image.original_url, '_blank')}
                                                    />

                                                    {/* Status Badge Overlay */}
                                                    <div className="absolute top-2 right-2">
                                                        <Badge className={`
                                                            text-[10px] px-1.5 h-5
                                                            ${image.status === 'APPROVED' ? 'bg-green-500 hover:bg-green-600' :
                                                                image.status === 'REJECTED' ? 'bg-red-500 hover:bg-red-600' :
                                                                    'bg-amber-500 hover:bg-amber-600'}
                                                        `}>
                                                            {image.status}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <CardContent className="p-2">
                                                    <div className="space-y-2">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary dark:border-primary/30 dark:bg-primary/20 dark:text-primary-foreground text-[10px] px-1 h-5 truncate max-w-[100px]">
                                                                    {getImageTypeLabel(image.image_type as any)}
                                                                </Badge>
                                                                <span className="text-[10px] text-muted-foreground font-mono">#{idx + 1}</span>
                                                            </div>
                                                            {/* <p className="text-[10px] text-gray-400 truncate">
                                                                {new Date(image.created_at).toLocaleDateString()}
                                                            </p> */}
                                                        </div>

                                                        {/* Action Buttons */}
                                                        <div className="flex gap-1 pt-1">
                                                            <Button
                                                                size="icon"
                                                                className="h-7 w-7 bg-green-600 hover:bg-green-700 disabled:opacity-50"
                                                                onClick={() => handleUpdateStatus(image, 'APPROVED')}
                                                                disabled={image.status === 'APPROVED' || !canManage}
                                                                title={canManage ? "Approve" : "No permission to moderate"}
                                                            >
                                                                <CheckCircle className="h-3 w-3" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="destructive"
                                                                className="h-7 w-7 bg-red-600 hover:bg-red-700 disabled:opacity-50"
                                                                onClick={() => handleUpdateStatus(image, 'REJECTED')}
                                                                disabled={image.status === 'REJECTED' || !canManage}
                                                                title={canManage ? "Reject" : "No permission to moderate"}
                                                            >
                                                                <XCircle className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )
            }
        </div >
    )
}

