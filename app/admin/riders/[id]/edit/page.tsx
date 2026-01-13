"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  getRiderById,
  updateRider,
  type Rider,
  getRiderCompletionRate,
  getRiderTotalRequests,
  getRiderActiveRequests,
  getRiderStatusBreakdown,
} from "@/lib/api"
import {
  getImagesByUser,
  type AdminImage,
  adminUploadForUser,
  adminBulkUploadForUser,
  getAllThumbnails,
  IMAGE_TYPES,
  getImageTypeLabel,
  getStatusLabelForImage,
  replaceImage,
  updateImageStatus,
  bulkUpdateImageStatus,
} from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Check,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Activity,
  Image as ImageIcon,
  Upload,
  X,
  Eye,
  Download,
  Trash2,
  Plus,
  Loader2,
  Filter,
  MoreVertical,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"

export default function EditRiderPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [rider, setRider] = useState<Rider | null>(null)
  const [riderImages, setRiderImages] = useState<AdminImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingImages, setIsLoadingImages] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<AdminImage | null>(null)
  const [selectedImages, setSelectedImages] = useState<number[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    username: "",
    nin: "",
    is_approved: false,
  })
  const [uploadForm, setUploadForm] = useState({
    imageType: IMAGE_TYPES.PROFILE,
    description: "",
    autoApprove: true,
  })

  useEffect(() => {
    const fetchRider = async () => {
      try {
        const data = await getRiderById(Number(params.id))
        setRider(data)
        setFormData({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          username: data.username,
          nin: data.nin || "",
          is_approved: data.is_approved,
        })

        // Load rider images
        await fetchRiderImages(data.external_id)
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to load rider",
          variant: "destructive",
        })
        router.push("/admin/riders")
      } finally {
        setIsLoading(false)
      }
    }

    fetchRider()
  }, [params.id, router, toast])

  const fetchRiderImages = async (externalId: string) => {
    try {
      setIsLoadingImages(true)
      const response = await getImagesByUser(externalId)
      setRiderImages(response.images || [])
    } catch (err) {
      console.error("Failed to load rider images:", err)
      // Don't show error toast - images are optional
    } finally {
      setIsLoadingImages(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await updateRider(Number(params.id), formData)
      toast({
        title: "Success",
        description: "Rider updated successfully",
      })
      router.push("/admin/riders")
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update rider",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const fileInput = form.querySelector<HTMLInputElement>('input[type="file"]')

    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      toast({
        title: "Error",
        description: "Please select an image to upload",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const file = fileInput.files[0]
      const image = await adminUploadForUser(
        file,
        rider!.external_id,
        uploadForm.imageType,
        uploadForm.description,
        uploadForm.autoApprove
      )

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + 10
        })
      }, 100)

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      })

      // Refresh images
      await fetchRiderImages(rider!.external_id)

      // Reset form and close dialog
      setTimeout(() => {
        setUploadDialogOpen(false)
        setUploadForm({
          imageType: IMAGE_TYPES.PROFILE,
          description: "",
          autoApprove: true,
        })
        setUploadProgress(0)
        if (fileInput) fileInput.value = ""
        clearInterval(interval)
      }, 500)
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleBulkUpload = async (files: FileList) => {
    if (!files || files.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const fileArray = Array.from(files)
      const result = await adminBulkUploadForUser(
        fileArray,
        rider!.external_id,
        uploadForm.imageType,
        uploadForm.description,
        uploadForm.autoApprove
      )

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + 10
        })
      }, 100)

      toast({
        title: "Success",
        description: `Uploaded ${result.count} images successfully`,
      })

      // Refresh images
      await fetchRiderImages(rider!.external_id)

      // Reset form and close dialog
      setTimeout(() => {
        setUploadDialogOpen(false)
        setUploadForm({
          imageType: IMAGE_TYPES.PROFILE,
          description: "",
          autoApprove: true,
        })
        setUploadProgress(0)
        clearInterval(interval)
      }, 500)
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to upload images",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleImageStatusUpdate = async (imageId: number, status: 'APPROVED' | 'REJECTED' | 'PENDING') => {
    try {
      await updateImageStatus(imageId, status)
      toast({
        title: "Success",
        description: `Image ${status.toLowerCase()} successfully`,
      })
      await fetchRiderImages(rider!.external_id)
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update image status",
        variant: "destructive",
      })
    }
  }

  const handleBulkStatusUpdate = async (status: 'APPROVED' | 'REJECTED' | 'PENDING') => {
    if (selectedImages.length === 0) {
      toast({
        title: "Warning",
        description: "Please select images to update",
        variant: "default",
      })
      return
    }

    try {
      await bulkUpdateStatusView(selectedImages, status)
      toast({
        title: "Success",
        description: `Updated ${selectedImages.length} images to ${status.toLowerCase()}`,
      })
      setSelectedImages([])
      await fetchRiderImages(rider!.external_id)
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update images status",
        variant: "destructive",
      })
    }
  }

  const handleImageReplace = async (imageId: number, file: File) => {
    try {
      await replaceImage(imageId, file)
      toast({
        title: "Success",
        description: "Image replaced successfully",
      })
      await fetchRiderImages(rider!.external_id)
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to replace image",
        variant: "destructive",
      })
    }
  }

  const getImageCountByType = (imageType: string) => {
    return riderImages.filter(img => img.image_type === imageType).length
  }

  const getApprovedImageCountByType = (imageType: string) => {
    return riderImages.filter(img => img.image_type === imageType && img.status === 'APPROVED').length
  }

  const handleSelectImage = (imageId: number) => {
    setSelectedImages(prev =>
      prev.includes(imageId)
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    )
  }

  const selectAllImages = () => {
    if (selectedImages.length === riderImages.length) {
      setSelectedImages([])
    } else {
      setSelectedImages(riderImages.map(img => img.id))
    }
  }

  const bulkUpdateStatusView = async (imageIds: number[], status: string) => {
    // This would call your bulk update API
    return bulkUpdateStatusView(imageIds, status)
  }

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'REQUESTED': return 'bg-blue-100 text-blue-800'
      case 'ACCEPTED': return 'bg-orange-100 text-orange-800'
      case 'EN_ROUTE': return 'bg-purple-100 text-purple-800'
      case 'STARTED': return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getImageStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  const statusBreakdown = getRiderStatusBreakdown(rider!)
  const totalRequests = getRiderTotalRequests(rider!)
  const activeRequests = getRiderActiveRequests(rider!)
  const completionRate = getRiderCompletionRate(rider!)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/riders">
          <Button variant="ghost" className="gap-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100">
            <ArrowLeft className="h-4 w-4" />
            Back to Riders
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          {rider?.is_approved ? (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
              <CheckCircle className="h-3 w-3 mr-1" />
              Active
            </Badge>
          ) : (
            <Badge variant="outline" className="text-yellow-600 border-yellow-200">
              <XCircle className="h-3 w-3 mr-1" />
              Pending Approval
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Edit Rider</h1>
            <p className="text-gray-600 mt-1">Rider ID: {rider?.external_id}</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Edit Rider Information</CardTitle>
                  <CardDescription>
                    Update rider details and approval status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">First Name</label>
                        <Input
                          value={formData.first_name}
                          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Last Name</label>
                        <Input
                          value={formData.last_name}
                          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Phone</label>
                        <Input
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Username</label>
                      <Input
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        NIN (National Identification Number)
                        <span className="text-xs text-gray-500 ml-1">Required</span>
                      </label>
                      <Input
                        value={formData.nin}
                        onChange={(e) => setFormData({ ...formData, nin: e.target.value })}
                        placeholder="e.g., AB1234567890C"
                        className="font-mono"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        National Identification Number - this should be a valid government-issued ID
                      </p>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200">
                      <input
                        type="checkbox"
                        id="is_approved"
                        checked={formData.is_approved}
                        onChange={(e) => setFormData({ ...formData, is_approved: e.target.checked })}
                        className="rounded"
                      />
                      <label htmlFor="is_approved" className="text-sm font-medium text-gray-700">
                        Approved
                      </label>
                      <span className="text-xs text-gray-500 ml-2">
                        {formData.is_approved ? "Rider is active and can use the platform" : "Rider is pending approval"}
                      </span>
                    </div>

                    <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
                      <Link href="/admin/riders">
                        <Button type="button" variant="outline" className="border-gray-300 bg-transparent hover:bg-gray-50">
                          Cancel
                        </Button>
                      </Link>
                      <Button type="submit" disabled={isSubmitting} className="gap-2 bg-blue-600 hover:bg-blue-700">
                        {isSubmitting ? (
                          "Saving..."
                        ) : (
                          <>
                            <Check className="h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="images" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Rider Images</CardTitle>
                      <CardDescription>
                        Manage rider's uploaded images and documents
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="gap-2 bg-green-600 hover:bg-green-700">
                            <Upload className="h-4 w-4" />
                            Upload Images
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Upload Images</DialogTitle>
                            <DialogDescription>
                              Upload images for {rider?.first_name} {rider?.last_name} ({rider?.external_id})
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleImageUpload} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="imageType">Image Type</Label>
                              <Select
                                value={uploadForm.imageType}
                                onValueChange={(value) => setUploadForm({ ...uploadForm, imageType: value as any })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select image type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.values(IMAGE_TYPES).map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {getImageTypeLabel(type)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="description">Description (Optional)</Label>
                              <Input
                                id="description"
                                value={uploadForm.description}
                                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                                placeholder="Brief description of the image"
                              />
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200">
                              <input
                                type="checkbox"
                                id="autoApprove"
                                checked={uploadForm.autoApprove}
                                onChange={(e) => setUploadForm({ ...uploadForm, autoApprove: e.target.checked })}
                                className="rounded"
                              />
                              <label htmlFor="autoApprove" className="text-sm font-medium text-gray-700">
                                Auto Approve
                              </label>
                              <span className="text-xs text-gray-500 ml-2">
                                Automatically approve uploaded images
                              </span>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="image">Image File</Label>
                              <Input
                                id="image"
                                type="file"
                                accept="image/*"
                                className="cursor-pointer"
                                required
                              />
                              <p className="text-xs text-gray-500">
                                Supported formats: JPG, PNG, JPEG (Max: 5MB)
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="bulkUpload">Bulk Upload (Optional)</Label>
                              <Input
                                id="bulkUpload"
                                type="file"
                                accept="image/*"
                                multiple
                                className="cursor-pointer"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files.length > 0) {
                                    handleBulkUpload(e.target.files)
                                  }
                                }}
                              />
                              <p className="text-xs text-gray-500">
                                Select multiple images to upload at once
                              </p>
                            </div>

                            {isUploading && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span>Uploading...</span>
                                  <span>{uploadProgress}%</span>
                                </div>
                                <Progress value={uploadProgress} className="h-2" />
                              </div>
                            )}

                            <DialogFooter>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setUploadDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button type="submit" disabled={isUploading}>
                                {isUploading ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  "Upload"
                                )}
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>

                      {selectedImages.length > 0 && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => handleBulkStatusUpdate('APPROVED')}
                          >
                            <Check className="h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => handleBulkStatusUpdate('REJECTED')}
                          >
                            <X className="h-4 w-4" />
                            Reject
                          </Button>
                          <Button
                            variant="outline"
                            className="gap-2 text-red-600 hover:text-red-700"
                            onClick={() => setSelectedImages([])}
                          >
                            <X className="h-4 w-4" />
                            Clear
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingImages ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : riderImages.length === 0 ? (
                    <div className="text-center py-12">
                      <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Images Found</h3>
                      <p className="text-gray-500 mb-6">This rider hasn't uploaded any images yet.</p>
                      <Button
                        onClick={() => setUploadDialogOpen(true)}
                        className="gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Upload First Image
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Image Type Summary */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {Object.values(IMAGE_TYPES).map((type) => (
                          <div
                            key={type}
                            className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-center hover:bg-gray-100 cursor-pointer transition-colors"
                            onClick={() => setActiveTab(type.toLowerCase())}
                          >
                            <div className="text-lg font-bold text-gray-900">
                              {getImageCountByType(type)}
                            </div>
                            <div className="text-xs text-gray-600 truncate">
                              {getImageTypeLabel(type)}
                            </div>
                            <div className="text-xs text-green-600 mt-1">
                              {getApprovedImageCountByType(type)} approved
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Image Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {riderImages.map((image) => (
                          <div
                            key={image.id}
                            className={cn(
                              "relative group rounded-lg border overflow-hidden cursor-pointer transition-all hover:shadow-md",
                              selectedImages.includes(image.id)
                                ? "ring-2 ring-blue-500 border-blue-500"
                                : "border-gray-200 hover:border-gray-300"
                            )}
                            onClick={() => handleSelectImage(image.id)}
                          >
                            {/* Selection Checkbox */}
                            <div className="absolute top-2 left-2 z-10">
                              <input
                                type="checkbox"
                                checked={selectedImages.includes(image.id)}
                                onChange={() => handleSelectImage(image.id)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>

                            {/* Image Thumbnail */}
                            <div className="aspect-square bg-gray-100 relative">
                              <img
                                src={image.thumbnail_url || image.original_url || ''}
                                alt={getImageTypeLabel(image.image_type as any)}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjOTk5Ij5JbWFnZSBFcnJvcjwvdGV4dD48L3N2Zz4='
                                }}
                              />

                              {/* Status Badge */}
                              <Badge
                                className={cn(
                                  "absolute top-2 right-2",
                                  getImageStatusColor(image.status)
                                )}
                              >
                                {getStatusLabelForImage(image.status)}
                              </Badge>

                              {/* Hover Actions */}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="gap-1"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedImage(image)
                                    setImageDialogOpen(true)
                                  }}
                                >
                                  <Eye className="h-3 w-3" />
                                  View
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      className="gap-1"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreVertical className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        window.open(image.original_url, '_blank')
                                      }}
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Original
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        if (image.status === 'APPROVED') {
                                          handleImageStatusUpdate(image.id, 'REJECTED')
                                        } else {
                                          handleImageStatusUpdate(image.id, 'APPROVED')
                                        }
                                      }}
                                    >
                                      {image.status === 'APPROVED' ? (
                                        <>
                                          <X className="h-4 w-4 mr-2" />
                                          Reject
                                        </>
                                      ) : (
                                        <>
                                          <Check className="h-4 w-4 mr-2" />
                                          Approve
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600">
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>

                            {/* Image Info */}
                            <div className="p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium truncate">
                                  {getImageTypeLabel(image.image_type as any)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(image.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              {image.description && (
                                <p className="text-xs text-gray-600 truncate" title={image.description}>
                                  {image.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Bulk Selection Info */}
                      {selectedImages.length > 0 && (
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-200">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedImages.length === riderImages.length}
                              onChange={selectAllImages}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-blue-700">
                              {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 h-7 text-xs"
                              onClick={() => handleBulkStatusUpdate('APPROVED')}
                            >
                              <Check className="h-3 w-3" />
                              Approve All
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 h-7 text-xs"
                              onClick={() => handleBulkStatusUpdate('REJECTED')}
                            >
                              <X className="h-3 w-3" />
                              Reject All
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Image Detail Dialog */}
              <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                  {selectedImage && (
                    <>
                      <DialogHeader>
                        <DialogTitle>
                          {getImageTypeLabel(selectedImage.image_type as any)}
                        </DialogTitle>
                        <DialogDescription>
                          {selectedImage.description || "No description provided"}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={selectedImage.original_url || selectedImage.thumbnail_url || ''}
                            alt={getImageTypeLabel(selectedImage.image_type as any)}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium text-gray-500">Status</div>
                            <Badge className={getImageStatusColor(selectedImage.status)}>
                              {getStatusLabelForImage(selectedImage.status)}
                            </Badge>
                          </div>
                          <div>
                            <div className="font-medium text-gray-500">Uploaded</div>
                            <div>{new Date(selectedImage.created_at).toLocaleDateString()}</div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-500">File Size</div>
                            <div>{(selectedImage.file_size / 1024 / 1024).toFixed(2)} MB</div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-500">Dimensions</div>
                            <div>{selectedImage.width} × {selectedImage.height}</div>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => window.open(selectedImage.original_url, '_blank')}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download Original
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              if (selectedImage.status === 'APPROVED') {
                                handleImageStatusUpdate(selectedImage.id, 'REJECTED')
                              } else {
                                handleImageStatusUpdate(selectedImage.id, 'APPROVED')
                              }
                              setImageDialogOpen(false)
                            }}
                          >
                            {selectedImage.status === 'APPROVED' ? (
                              <>
                                <X className="h-4 w-4 mr-2" />
                                Reject Image
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Approve Image
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="statistics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Service Statistics</CardTitle>
                  <CardDescription>
                    Detailed breakdown of rider's service requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {rider?.summary ? (
                    <div className="space-y-6">
                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                          <div className="text-2xl font-bold text-blue-700">{totalRequests}</div>
                          <div className="text-sm text-blue-600">Total Requests</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                          <div className="text-2xl font-bold text-green-700">{rider.summary.stats.completed_requests}</div>
                          <div className="text-sm text-green-600">Completed</div>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                          <div className="text-2xl font-bold text-yellow-700">{activeRequests}</div>
                          <div className="text-sm text-yellow-600">Active</div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                          <div className="text-2xl font-bold text-purple-700">{completionRate}%</div>
                          <div className="text-sm text-purple-600">Completion Rate</div>
                        </div>
                      </div>

                      {/* Status Breakdown */}
                      <div className="space-y-3">
                        <h3 className="font-medium text-gray-700">Status Breakdown</h3>
                        <div className="space-y-2">
                          {Object.entries(statusBreakdown).map(([status, count]) => (
                            <div key={status} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`h-3 w-3 rounded-full ${getStatusColor(status).replace('bg-', 'bg-').replace(' text-', ' ').split(' ')[0]}`} />
                                <span className="text-sm capitalize">{status.toLowerCase().replace('_', ' ')}</span>
                              </div>
                              <span className="font-medium">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Service Type Breakdown */}
                      {rider.summary.service_breakdown.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="font-medium text-gray-700">Service Types Used</h3>
                          <div className="space-y-2">
                            {rider.summary.service_breakdown.map((service) => (
                              <div key={service.service_type__name} className="flex items-center justify-between">
                                <span className="text-sm">{service.service_type__name}</span>
                                <Badge variant="outline" className="font-normal">
                                  {service.count} requests
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recent Requests */}
                      {rider.summary.recent_requests.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="font-medium text-gray-700">Recent Requests</h3>
                          <div className="space-y-3">
                            {rider.summary.recent_requests.map((request) => (
                              <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                                <div className="space-y-1">
                                  <div className="text-sm font-medium">Request #{request.id}</div>
                                  <div className="text-xs text-gray-500">{request.service_type__name}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className={getStatusColor(request.status)}>
                                    {request.status}
                                  </Badge>
                                  <div className="text-xs text-gray-500">
                                    {new Date(request.created_at).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No service statistics available for this rider
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Stats & Info */}
        <div className="space-y-6">
          {/* Rider Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Rider Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div className="text-sm">
                    <div className="text-gray-500">Email</div>
                    <div className="font-medium">{rider?.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div className="text-sm">
                    <div className="text-gray-500">Phone</div>
                    <div className="font-medium">{rider?.phone}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div className="text-sm">
                    <div className="text-gray-500">Created</div>
                    <div className="font-medium">
                      {rider?.created_at ? new Date(rider.created_at).toLocaleDateString() : "-"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div className="text-sm">
                    <div className="text-gray-500">Last Updated</div>
                    <div className="font-medium">
                      {rider?.updated_at ? new Date(rider.updated_at).toLocaleDateString() : "-"}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Requests</span>
                  <span className="font-bold">{totalRequests}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Requests</span>
                  <span className="font-bold text-yellow-600">{activeRequests}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completion Rate</span>
                  <span className="font-bold text-green-600">{completionRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  {rider?.is_approved ? (
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  ) : (
                    <Badge variant="outline" className="text-yellow-600">Pending</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Image Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Image Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Images</span>
                  <span className="font-bold">{riderImages.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Approved</span>
                  <span className="font-bold text-green-600">
                    {riderImages.filter(img => img.status === 'APPROVED').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pending</span>
                  <span className="font-bold text-yellow-600">
                    {riderImages.filter(img => img.status === 'PENDING').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Rejected</span>
                  <span className="font-bold text-red-600">
                    {riderImages.filter(img => img.status === 'REJECTED').length}
                  </span>
                </div>
                <Separator />
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setActiveTab("images")}
                >
                  <ImageIcon className="h-4 w-4" />
                  Manage Images
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rider?.summary?.recent_requests && rider.summary.recent_requests.length > 0 ? (
                <div className="space-y-3">
                  {rider.summary.recent_requests.slice(0, 3).map((request) => (
                    <div key={request.id} className="flex items-start gap-3">
                      <div className="mt-1">
                        <div className={`h-2 w-2 rounded-full ${getStatusColor(request.status).replace('bg-', 'bg-').replace(' text-', ' ').split(' ')[0]}`} />
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="text-sm font-medium">Request #{request.id}</div>
                        <div className="text-xs text-gray-500">
                          {request.service_type__name} • {new Date(request.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No recent activity
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => window.open(`/admin/requests?search=${rider?.username}`, '_blank')}
              >
                View All Requests
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => {
                  const riderData = JSON.stringify(rider, null, 2);
                  const blob = new Blob([riderData], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `rider-${rider?.external_id}-data.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Check className="h-4 w-4" />
                Export Rider Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}