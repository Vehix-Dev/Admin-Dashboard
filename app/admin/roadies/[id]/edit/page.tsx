"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { getRoadieById, updateRoadie, type Roadie } from "@/lib/api"
import {
  getImagesByUser,
  type AdminImage,
  adminUploadForUser,
  adminBulkUploadForUser,
  IMAGE_TYPES,
  getImageTypeLabel,
  getStatusLabelForImage,
  updateImageStatus,
  bulkUpdateImageStatus,
  getServices,
  getRodieServices,
  createRodieService,
  deleteRodieService,
  type Service,
  type RodieService,
} from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  Image as ImageIcon,
  Upload,
  X,
  Eye,
  Download,
  Trash2,
  MoreVertical,
  Loader2,
  Filter,
  AlertCircle,
  Plus,
  TrendingUp,
  Wallet,
  Wrench,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PermissionGuard, PermissionButton, useCan } from "@/components/auth/permission-guard"
import { PERMISSIONS } from "@/lib/permissions"

export default function EditRoadiePage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [roadie, setRoadie] = useState<Roadie | null>(null)
  const [roadieImages, setRoadieImages] = useState<AdminImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingImages, setIsLoadingImages] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<AdminImage | null>(null)
  const [selectedImages, setSelectedImages] = useState<number[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Services State
  const [availableServices, setAvailableServices] = useState<Service[]>([])
  const [roadieAssignments, setRoadieAssignments] = useState<RodieService[]>([])
  const [selectedServiceToAdd, setSelectedServiceToAdd] = useState<string>("")
  const [addingService, setAddingService] = useState(false)
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

  // Permission checks
  const canChange = useCan(PERMISSIONS.ROADIES_CHANGE)
  const canDelete = useCan(PERMISSIONS.ROADIES_DELETE)
  const canApprove = useCan(PERMISSIONS.ROADIES_APPROVE)
  const canUpload = useCan(PERMISSIONS.ROADIES_CHANGE) // Upload falls under change permission

  useEffect(() => {
    const fetchRoadie = async () => {
      try {
        const data = await getRoadieById(Number(params.id))
        setRoadie(data)
        setFormData({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          username: data.username,
          nin: data.nin || "",
          is_approved: data.is_approved,
        })

        // Load roadie images
        await fetchRoadieImages(data.external_id)

        // Load services data
        await fetchServicesData(data.id)
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to load roadie",
          variant: "destructive",
        })
        router.push("/admin/roadies")
      } finally {
        setIsLoading(false)
      }
    }

    fetchRoadie()
  }, [params.id, router, toast])

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0
    }).format(Number(amount))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600 bg-green-50 border-green-200'
      case 'CANCELLED': return 'text-red-600 bg-red-50 border-red-200'
      case 'ACCEPTED': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const fetchRoadieImages = async (externalId: string) => {
    try {
      setIsLoadingImages(true)
      const response = await getImagesByUser(externalId)
      setRoadieImages(response.images || [])
    } catch (err) {
      console.error("Failed to load roadie images:", err)
      // Don't show error toast - images are optional
    } finally {
      setIsLoadingImages(false)
    }
  }

  const fetchServicesData = async (roadieId: number) => {
    try {
      const [allServices, allAssignments] = await Promise.all([
        getServices(),
        getRodieServices()
      ])

      setAvailableServices(allServices.filter(s => s.is_active))

      // Filter assignments for this roadie (assuming backend doesn't support filtering by param yet, or we fetch all)
      const myAssignments = allAssignments.filter(a => a.rodie === roadieId)
      setRoadieAssignments(myAssignments)
    } catch (err) {
      console.error("Failed to load services:", err)
    }
  }

  const handleAddService = async () => {
    if (!selectedServiceToAdd || !roadie) return
    setAddingService(true)
    try {
      await createRodieService({
        rodie: roadie.id,
        service: parseInt(selectedServiceToAdd)
      })
      toast({
        title: "Success",
        description: "Service assigned successfully",
      })
      setSelectedServiceToAdd("")
      await fetchServicesData(roadie.id)
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to assign service",
        variant: "destructive",
      })
    } finally {
      setAddingService(false)
    }
  }

  const handleRemoveService = async (assignmentId: number) => {
    if (!confirm("Are you sure you want to remove this service assignment?")) return
    try {
      await deleteRodieService(assignmentId)
      toast({
        title: "Success",
        description: "Service removed successfully",
      })
      if (roadie) await fetchServicesData(roadie.id)
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to remove service",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await updateRoadie(Number(params.id), formData)
      toast({
        title: "Success",
        description: "Roadie updated successfully",
      })
      router.push("/admin/roadies")
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update roadie",
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
      await adminUploadForUser(
        file,
        roadie!.external_id,
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
      await fetchRoadieImages(roadie!.external_id)

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
        roadie!.external_id,
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
      await fetchRoadieImages(roadie!.external_id)

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
      await fetchRoadieImages(roadie!.external_id)
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
      await bulkUpdateImageStatus(selectedImages, status)
      toast({
        title: "Success",
        description: `Updated ${selectedImages.length} images to ${status.toLowerCase()}`,
      })
      setSelectedImages([])
      await fetchRoadieImages(roadie!.external_id)
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update images status",
        variant: "destructive",
      })
    }
  }

  const getImageCountByType = (imageType: string) => {
    return roadieImages.filter(img => img.image_type === imageType).length
  }

  const getApprovedImageCountByType = (imageType: string) => {
    return roadieImages.filter(img => img.image_type === imageType && img.status === 'APPROVED').length
  }

  const handleSelectImage = (imageId: number) => {
    setSelectedImages(prev =>
      prev.includes(imageId)
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    )
  }

  const selectAllImages = () => {
    if (selectedImages.length === roadieImages.length) {
      setSelectedImages([])
    } else {
      setSelectedImages(roadieImages.map(img => img.id))
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
      <PermissionGuard permissions={PERMISSIONS.ROADIES_VIEW}>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96" />
        </div>
      </PermissionGuard>
    )
  }

  return (
    <PermissionGuard permissions={PERMISSIONS.ROADIES_VIEW}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/admin/roadies">
            <Button variant="ghost" className="gap-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100">
              <ArrowLeft className="h-4 w-4" />
              Back to Roadies
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            {roadie?.is_approved ? (
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
          {/* Left Column - Main Content with Tabs */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Edit Roadie</h1>
              <p className="text-gray-600 mt-1">Roadie ID: {roadie?.external_id}</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="performance">Stats</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="documents">Docs</TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Edit Roadie Information</CardTitle>
                    <CardDescription>
                      Update roadie details and approval status
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
                            disabled={!canChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Last Name</label>
                          <Input
                            value={formData.last_name}
                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                            required
                            disabled={!canChange}
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
                            disabled={!canChange}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Phone</label>
                          <Input
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            required
                            disabled={!canChange}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Username</label>
                        <Input
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          required
                          disabled={!canChange}
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
                          disabled={!canChange}
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
                          disabled={!canApprove}
                        />
                        <label htmlFor="is_approved" className="text-sm font-medium text-gray-700">
                          Approved
                        </label>
                        <span className="text-xs text-gray-500 ml-2">
                          {formData.is_approved ? "Roadie is active and can accept jobs" : "Roadie is pending approval"}
                        </span>
                      </div>

                      <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
                        <Link href="/admin/roadies">
                          <Button type="button" variant="outline" className="border-gray-300 bg-transparent hover:bg-gray-50">
                            Cancel
                          </Button>
                        </Link>
                        <PermissionButton
                          type="submit"
                          disabled={isSubmitting}
                          className="gap-2 bg-blue-600 hover:bg-blue-700"
                          permissions={PERMISSIONS.ROADIES_CHANGE}
                        >
                          {isSubmitting ? (
                            "Saving..."
                          ) : (
                            <>
                              <Check className="h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </PermissionButton>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="services" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Services Provided</CardTitle>
                    <CardDescription>
                      Manage the services this roadie is qualified to perform.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex gap-2 items-end">
                        <div className="flex-1 space-y-2">
                          <Label>Assign New Service</Label>
                          <Select value={selectedServiceToAdd} onValueChange={setSelectedServiceToAdd}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a service..." />
                            </SelectTrigger>
                            <SelectContent>
                              {availableServices
                                .filter(s => !roadieAssignments.some(ra => ra.service === s.id))
                                .map((service) => (
                                  <SelectItem key={service.id} value={String(service.id)}>
                                    {service.name} ({service.code})
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <PermissionButton
                          onClick={handleAddService}
                          disabled={!selectedServiceToAdd || addingService}
                          className="bg-blue-600 hover:bg-blue-700"
                          permissions={PERMISSIONS.ROADIES_CHANGE}
                        >
                          {addingService ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                          Add
                        </PermissionButton>
                      </div>

                      <div className="border rounded-md divide-y">
                        {roadieAssignments.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 text-sm">
                            No services assigned.
                          </div>
                        ) : (
                          roadieAssignments.map((assignment) => (
                            <div key={assignment.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  Service
                                </Badge>
                                <span className="font-medium text-gray-900">{assignment.service_display}</span>
                              </div>
                              {canChange && (
                                <Button variant="ghost" size="sm" onClick={() => handleRemoveService(assignment.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {roadie?.summary && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wrench className="h-5 w-5 text-blue-600" />
                        Service Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {roadie.summary.service_breakdown.map((service, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              <span className="text-sm font-medium">{service.service_type__name}</span>
                            </div>
                            <Badge variant="secondary">{service.count} jobs</Badge>
                          </div>
                        ))}
                        {roadie.summary.service_breakdown.length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">No service data yet.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="performance" className="space-y-6">
                {roadie?.summary && (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-purple-600" />
                          Performance Stats
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500">Total Jobs</p>
                            <p className="text-xl font-bold">{roadie.summary.stats.total_assignments}</p>
                          </div>
                          <div className="p-3 bg-green-50 rounded-lg">
                            <p className="text-xs text-green-600">Completion Rate</p>
                            <p className="text-xl font-bold text-green-700">{roadie.summary.stats.completion_rate}%</p>
                          </div>
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <p className="text-xs text-blue-600">Riders Served</p>
                            <p className="text-xl font-bold text-blue-700">{roadie.summary.stats.unique_riders_served}</p>
                          </div>
                          <div className="p-3 bg-yellow-50 rounded-lg">
                            <p className="text-xs text-yellow-600">Rating</p>
                            <p className="text-xl font-bold text-yellow-700">{roadie.summary.rating} ★</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {roadie?.wallet && (
                      <Card className="border-t-4 border-t-purple-600">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Wallet className="h-5 w-5 text-purple-600" />
                              Wallet Details
                            </div>
                            <Badge className={parseFloat(roadie.wallet.balance) < 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}>
                              Balance: {formatCurrency(roadie.wallet.balance)}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <h4 className="text-sm font-medium text-gray-500">Recent Transactions</h4>
                            <div className="space-y-2">
                              {roadie.wallet.transactions.slice(0, 5).map((tx) => (
                                <div key={tx.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                                  <div>
                                    <p className="font-medium text-gray-900">{tx.reason}</p>
                                    <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</p>
                                  </div>
                                  <span className={parseFloat(tx.amount) < 0 ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                                    {formatCurrency(tx.amount)}
                                  </span>
                                </div>
                              ))}
                              {roadie.wallet.transactions.length === 0 && (
                                <p className="text-sm text-gray-500 text-center py-2">No transactions found.</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-gray-600" />
                          Recent Activity
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-0 divide-y">
                          {roadie.summary.recent_assignments.map((assignment) => (
                            <div key={assignment.id} className="py-3 flex justify-between items-center first:pt-0 last:pb-0">
                              <div>
                                <p className="font-medium text-gray-900">{assignment.service_type__name}</p>
                                <p className="text-xs text-gray-500">
                                  Rider: <span className="font-semibold">{assignment.rider__username || 'Unknown'}</span> • {new Date(assignment.created_at).toLocaleString()}
                                </p>
                              </div>
                              <Badge variant="outline" className={getStatusColor(assignment.status)}>
                                {assignment.status}
                              </Badge>
                            </div>
                          ))}
                          {roadie.summary.recent_assignments.length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4">No recent activity.</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              <TabsContent value="documents" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Roadie Images</CardTitle>
                        <CardDescription>
                          Manage roadie's uploaded images and documents
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
                                Upload images for {roadie?.first_name} {roadie?.last_name} ({roadie?.external_id})
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
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              Approve Selected
                            </Button>
                            <Button
                              variant="outline"
                              className="gap-2"
                              onClick={() => handleBulkStatusUpdate('REJECTED')}
                            >
                              <XCircle className="h-4 w-4 text-red-600" />
                              Reject Selected
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingImages ? (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                          <Skeleton key={i} className="h-40 rounded-lg" />
                        ))}
                      </div>
                    ) : roadieImages.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <div className="bg-gray-50 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-3">
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No images uploaded</h3>
                        <p className="text-gray-500 mt-1">Upload images to get started</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={selectAllImages}
                              className="text-xs"
                            >
                              {selectedImages.length === roadieImages.length ? "Deselect All" : "Select All"}
                            </Button>
                            <span className="text-sm text-gray-500 flex items-center">
                              {selectedImages.length} selected
                            </span>
                          </div>
                          <div className="flex gap-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-500" /> {getApprovedImageCountByType(IMAGE_TYPES.PROFILE)}/{getImageCountByType(IMAGE_TYPES.PROFILE)} Profile
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-500" /> {getApprovedImageCountByType(IMAGE_TYPES.LICENSE)}/{getImageCountByType(IMAGE_TYPES.LICENSE)} License
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {roadieImages.map((image) => (
                            <div
                              key={image.id}
                              className={cn(
                                "group relative border rounded-lg overflow-hidden transition-all",
                                selectedImages.includes(image.id) ? "ring-2 ring-blue-500 border-transparent shadow-md" : "hover:border-gray-300"
                              )}
                            >
                              <div className="absolute top-2 left-2 z-10 flex gap-2">
                                <input
                                  type="checkbox"
                                  checked={selectedImages.includes(image.id)}
                                  onChange={() => handleSelectImage(image.id)}
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                              </div>

                              <div
                                className="aspect-video bg-gray-100 cursor-pointer relative"
                                onClick={() => {
                                  setSelectedImage(image)
                                  setImageDialogOpen(true)
                                }}
                              >
                                <img
                                  src={image.thumbnail_url || image.original_url}
                                  alt={image.image_type}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                  <Eye className="h-8 w-8 text-white drop-shadow-lg" />
                                </div>
                              </div>

                              <div className="p-3 bg-white">
                                <div className="flex items-center justify-between mb-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {getImageTypeLabel(image.image_type as any)}
                                  </Badge>
                                  <Badge variant="outline" className={getImageStatusColor(image.status)}>
                                    {image.status}
                                  </Badge>
                                </div>

                                {image.description && (
                                  <p className="text-xs text-gray-500 mb-2 truncate">
                                    {image.description}
                                  </p>
                                )}

                                <div className="flex items-center justify-end gap-1">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleImageStatusUpdate(image.id, 'APPROVED')}>
                                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                        Approve
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleImageStatusUpdate(image.id, 'REJECTED')}>
                                        <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                        Reject
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => window.open(image.original_url, '_blank')}>
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
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
            </Tabs>
          </div>

          {/* Right Column - Stats & Info */}
          <div className="space-y-6">
            {/* Roadie Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Roadie Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <div className="text-sm">
                      <div className="text-gray-500">Email</div>
                      <div className="font-medium">{roadie?.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div className="text-sm">
                      <div className="text-gray-500">Phone</div>
                      <div className="font-medium">{roadie?.phone}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div className="text-sm">
                      <div className="text-gray-500">Created</div>
                      <div className="font-medium">
                        {roadie?.created_at ? new Date(roadie.created_at).toLocaleDateString() : "-"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div className="text-sm">
                      <div className="text-gray-500">Last Updated</div>
                      <div className="font-medium">
                        {roadie?.updated_at ? new Date(roadie.updated_at).toLocaleDateString() : "-"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <div className="text-sm">
                      <div className="text-gray-500">Role</div>
                      <div className="font-medium">{roadie?.role}</div>
                    </div>
                  </div>
                  {roadie?.referral_code && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div className="text-sm">
                        <div className="text-gray-500">Referral Code</div>
                        <div className="font-medium font-mono">{roadie.referral_code}</div>
                      </div>
                    </div>
                  )}
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
                    <span className="font-bold">{roadieImages.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Approved</span>
                    <span className="font-bold text-green-600">
                      {roadieImages.filter(img => img.status === 'APPROVED').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pending</span>
                    <span className="font-bold text-yellow-600">
                      {roadieImages.filter(img => img.status === 'PENDING').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Rejected</span>
                    <span className="font-bold text-red-600">
                      {roadieImages.filter(img => img.status === 'REJECTED').length}
                    </span>
                  </div>
                  <Separator />
                  <PermissionButton
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => setUploadDialogOpen(true)}
                    permissions={PERMISSIONS.ROADIES_CHANGE}
                  >
                    <ImageIcon className="h-4 w-4" />
                    Upload New Images
                  </PermissionButton>
                </div>
              </CardContent>
            </Card>

            {/* Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <PermissionGuard permissions={PERMISSIONS.REQUESTS_VIEW}>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => window.open(`/admin/requests?search=${roadie?.username}`, '_blank')}
                  >
                    <Check className="h-4 w-4" />
                    View All Jobs
                  </Button>
                </PermissionGuard>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    const roadieData = JSON.stringify(roadie, null, 2);
                    const blob = new Blob([roadieData], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `roadie-${roadie?.external_id}-data.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="h-4 w-4" />
                  Export Roadie Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PermissionGuard>
  )
}