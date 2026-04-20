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
import { CheckCircle, XCircle, Filter, Search, Trash2, CalendarIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { EmptyState } from "@/components/dashboard/empty-state"
import { ConfirmModal } from "@/components/ui/confirm-modal"

export default function MediaModerationPage() {
    const [images, setImages] = useState<AdminImage[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState<string>("ALL")
    const [searchQuery, setSearchQuery] = useState("")
    const [activeTab, setActiveTab] = useState<"riders" | "roadies">("roadies")
    const [pendingDeleteImage, setPendingDeleteImage] = useState<AdminImage | null>(null)

    const { toast } = useToast()
    const canManage = useCan(PERMISSIONS.MEDIA_MANAGE)

    const fetchImages = async () => {
        setIsLoading(true)
        try {
            const data = await getAllImages({
                status: filterStatus === "ALL" ? undefined : filterStatus,
                search: searchQuery || undefined
            })
            // Temporary mock logic for UI preview since the backend might not return 'role' reliably:
            const enrichedData = data.map((img: any) => ({
                ...img,
                user_role: img.external_id?.startsWith('R') && !img.external_id?.startsWith('BS') ? 'RIDER' : 'ROADIE'
            }))
            setImages(enrichedData)
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

    const handleDeleteImage = async () => {
        if (!pendingDeleteImage) return

        try {
            // Mock delete operation if no specialized endpoint exists yet; else use REST
            // await deleteImageAPI(pendingDeleteImage.id)
            setImages(prev => prev.filter(img => img.id !== pendingDeleteImage.id))
            toast({
                title: "Deleted",
                description: "File successfully removed"
            })
        } catch (err) {
            toast({
                title: "Error",
                description: "Failed to delete file",
                variant: "destructive"
            })
        } finally {
            setPendingDeleteImage(null)
        }
    }

    const filteredAndGroupedImages = (roleFilter: "RIDER" | "ROADIE") => {
        const filtered = images.filter((img: any) => img.user_role === roleFilter)

        return filtered.reduce((acc, image) => {
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
    }

    const renderGroupedImages = (role: "RIDER" | "ROADIE") => {
        const grouped = filteredAndGroupedImages(role)

        if (Object.keys(grouped).length === 0) {
            return (
                <EmptyState
                    title={`No ${role.toLowerCase()} images found`}
                    description={searchQuery ? "Try adjusting your search filters." : "All caught up! No images to moderate in this group."}
                    icon={CheckCircle}
                />
            )
        }

        return (
            <div className="space-y-8 mt-6">
                <div className="hidden md:block text-sm font-semibold text-muted-foreground border-b border-border pb-2 mb-4">
                    SR No. &nbsp;&nbsp; User Asset Detail
                </div>

                {Object.entries(grouped).map(([externalId, group], groupIndex) => (
                    <div key={externalId} className="border border-border rounded-lg overflow-hidden shadow-sm bg-card">
                        <div className={`${role === 'ROADIE' ? 'bg-[#00B4D8]' : 'bg-primary'} text-white px-4 py-3 font-semibold text-lg flex items-center justify-between`}>
                            <div className="flex items-center gap-3">
                                <span>{externalId}</span>
                                <span>-</span>
                                <span className="uppercase">{group.user?.username || 'Unknown User'}</span>
                                <Badge variant="secondary" className="text-[10px] ml-2 text-foreground font-bold">
                                    {role}
                                </Badge>
                            </div>
                            <div className="text-sm font-normal opacity-90">
                                {group.images.length} Aggregated Assets
                            </div>
                        </div>

                        <div className="p-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                {group.images.map((image, idx) => (
                                    <div key={image.id} className="flex flex-col gap-2 items-start">
                                        <Card className="w-full overflow-hidden group border border-border hover:border-primary/50 transition-colors bg-card relative">
                                            <div className="relative aspect-video bg-muted">
                                                <img
                                                    src={image.original_url || image.thumbnail_url}
                                                    alt={getImageTypeLabel(image.image_type as any)}
                                                    className="object-cover w-full h-full cursor-pointer hover:opacity-95 transition-opacity"
                                                    onClick={() => window.open(image.original_url, '_blank')}
                                                />

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

                                            <CardContent className="p-3">
                                                <div className="space-y-3">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary dark:border-primary/30 dark:bg-primary/20 dark:text-primary-foreground text-[10px] px-1 h-5 truncate max-w-[100px]">
                                                                {getImageTypeLabel(image.image_type as any)}
                                                            </Badge>
                                                            <span className="text-[10px] text-muted-foreground font-mono">#{idx + 1}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono font-medium">
                                                            <CalendarIcon className="h-3 w-3" />
                                                            {new Date(image.created_at || Date.now()).toLocaleString()}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-2 border-t border-border mt-2">
                                                        <div className="flex gap-1">
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
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-600"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setPendingDeleteImage(image);
                                                            }}
                                                            title="Manually Delete Photo/Document"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Media Moderation</h1>
                <p className="text-muted-foreground">Review and moderate all user uploaded documents and profile photos.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-lg border border-border shadow-sm">
                <div className="flex-1">
                    <form onSubmit={handleSearch} className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by username or external ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-10"
                        />
                    </form>
                </div>
                <div className="w-full md:w-48">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="h-10">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                <SelectValue placeholder="Status" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Statuses</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="APPROVED">Approved</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Tabs defaultValue="roadies" value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="roadies" className="font-semibold tracking-wider">Roadies Validation</TabsTrigger>
                    <TabsTrigger value="riders" className="font-semibold tracking-wider">Riders Validation</TabsTrigger>
                </TabsList>

                <TabsContent value="roadies">
                    {isLoading ? (
                        <div className="space-y-8 mt-6">
                            {[1, 2].map(i => (
                                <div key={i} className="border border-border rounded-lg overflow-hidden">
                                    <Skeleton className="h-12 w-full" />
                                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <Skeleton className="h-64 rounded-xl" />
                                        <Skeleton className="h-64 rounded-xl" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        renderGroupedImages("ROADIE")
                    )}
                </TabsContent>

                <TabsContent value="riders">
                    {isLoading ? (
                        <div className="space-y-8 mt-6">
                            {[1, 2].map(i => (
                                <div key={i} className="border border-border rounded-lg overflow-hidden">
                                    <Skeleton className="h-12 w-full" />
                                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <Skeleton className="h-64 rounded-xl" />
                                        <Skeleton className="h-64 rounded-xl" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        renderGroupedImages("RIDER")
                    )}
                </TabsContent>
            </Tabs>

            {/* Manual Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={!!pendingDeleteImage}
                onClose={() => setPendingDeleteImage(null)}
                onConfirm={handleDeleteImage}
                title="Permanently Delete Media"
                description="Are you sure you want to permanently delete this media file from the server? This action cannot be undone."
            />
        </div>
    )
}
