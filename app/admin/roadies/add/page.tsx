"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createRoadie, adminUploadForUser, IMAGE_TYPES } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Save, Upload, X } from "lucide-react"
import Link from "next/link"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { PERMISSIONS } from "@/lib/permissions"

export default function AddRoadiePage() {
    const router = useRouter()
    const { toast } = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        username: "",
        nin: "",
        is_approved: true
    })

    const [imageFiles, setImageFiles] = useState<{ [key: string]: File | null }>({
        [IMAGE_TYPES.PROFILE]: null,
        [IMAGE_TYPES.NIN_FRONT]: null,
        [IMAGE_TYPES.NIN_BACK]: null,
        [IMAGE_TYPES.LICENSE]: null,
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target

        let finalValue = type === "checkbox" ? checked : value

        // Capitalize NIN
        if (name === "nin") {
            finalValue = (value as string).toUpperCase()
        }

        setFormData(prev => ({
            ...prev,
            [name]: finalValue
        }))
    }

    const handleFileChange = (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFiles(prev => ({
                ...prev,
                [type]: e.target.files![0]
            }))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            // NIN Validation
            if (formData.nin.length !== 14) {
                toast({
                    title: "Validation Error",
                    description: "NIN must be exactly 14 characters long.",
                    variant: "destructive"
                })
                setIsSubmitting(false)
                return
            }

            // Basic validation
            if (!formData.first_name || !formData.last_name || !formData.email) {
                toast({
                    title: "Error",
                    description: "Please fill in required fields",
                    variant: "destructive"
                })
                setIsSubmitting(false)
                return
            }

            const newRoadie = await createRoadie(formData)

            // Upload Images if any
            const uploadPromises = Object.entries(imageFiles).map(async ([type, file]) => {
                if (file) {
                    try {
                        await adminUploadForUser(
                            file,
                            newRoadie.external_id,
                            type,
                            `Initial ${type} upload`,
                            true // Auto approve uploaded docs by admin
                        )
                    } catch (uploadErr) {
                        console.error(`Failed to upload ${type}:`, uploadErr)
                        // Don't fail the whole process if one image fails, but log it
                    }
                }
            })

            await Promise.all(uploadPromises)

            toast({
                title: "Success",
                description: "Provider created and documents uploaded successfully"
            })

            // Redirect back to roadies list
            router.push("/admin/roadies")

        } catch (err) {
            console.error(" Create roadie error:", err)
            toast({
                title: "Error",
                description: "Failed to create provider",
                variant: "destructive"
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <PermissionGuard permissions={PERMISSIONS.ROADIES_ADD}>
            <div className="container mx-auto py-8 max-w-4xl">
                <div className="mb-6">
                    <Link href="/admin/roadies">
                        <Button variant="ghost" className="gap-2 mb-4">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Providers
                        </Button>
                    </Link>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Add New Provider</h1>
                            <p className="text-muted-foreground mt-2">
                                Fill in the provider details below
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-lg shadow-sm border p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* First Name */}
                            <div className="space-y-2">
                                <label htmlFor="first_name" className="text-sm font-medium text-foreground">
                                    First Name *
                                </label>
                                <Input
                                    id="first_name"
                                    name="first_name"
                                    type="text"
                                    required
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    placeholder="Enter first name"
                                />
                            </div>

                            {/* Last Name */}
                            <div className="space-y-2">
                                <label htmlFor="last_name" className="text-sm font-medium text-foreground">
                                    Last Name *
                                </label>
                                <Input
                                    id="last_name"
                                    name="last_name"
                                    type="text"
                                    required
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    placeholder="Enter last name"
                                />
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium text-foreground">
                                    Email *
                                </label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter email address"
                                />
                            </div>

                            {/* Phone */}
                            <div className="space-y-2">
                                <label htmlFor="phone" className="text-sm font-medium text-foreground">
                                    Phone Number
                                </label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="Enter phone number"
                                />
                            </div>

                            {/* Username */}
                            <div className="space-y-2">
                                <label htmlFor="username" className="text-sm font-medium text-foreground">
                                    Username
                                </label>
                                <Input
                                    id="username"
                                    name="username"
                                    type="text"
                                    value={formData.username}
                                    onChange={handleChange}
                                    placeholder="Enter username"
                                />
                            </div>

                            {/* NIN */}
                            <div className="space-y-2">
                                <label htmlFor="nin" className="text-sm font-medium text-foreground">
                                    National ID (NIN)
                                </label>
                                <Input
                                    id="nin"
                                    name="nin"
                                    type="text"
                                    value={formData.nin}
                                    onChange={handleChange}
                                    placeholder="Enter national ID"
                                />
                            </div>
                        </div>

                        {/* Status */}
                        <div className="flex items-center space-x-3 pt-4">
                            <input
                                id="is_approved"
                                name="is_approved"
                                type="checkbox"
                                checked={formData.is_approved}
                                onChange={handleChange}
                                className="h-4 w-4 text-primary border-border rounded focus:ring-primary"
                            />
                            <label htmlFor="is_approved" className="text-sm font-medium text-muted-foreground">
                                Activate Roadie immediately
                            </label>
                        </div>

                        {/* Image Uploads Section */}
                        <div className="pt-6 border-t">
                            <h3 className="text-lg font-medium text-foreground mb-4">Documents & Images</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Profile Picture */}
                                <div className="bg-muted/30 p-4 rounded-lg border border-dashed text-center">
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">Profile Picture</label>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(IMAGE_TYPES.PROFILE, e)}
                                        className="bg-background"
                                    />
                                    {imageFiles[IMAGE_TYPES.PROFILE] && (
                                        <p className="text-xs text-emerald-500 mt-1 font-medium">Selected: {imageFiles[IMAGE_TYPES.PROFILE]?.name}</p>
                                    )}
                                </div>

                                {/* NIN Front */}
                                <div className="bg-muted/30 p-4 rounded-lg border border-dashed text-center">
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">NIN Front</label>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(IMAGE_TYPES.NIN_FRONT, e)}
                                        className="bg-background"
                                    />
                                    {imageFiles[IMAGE_TYPES.NIN_FRONT] && (
                                        <p className="text-xs text-emerald-500 mt-1 font-medium">Selected: {imageFiles[IMAGE_TYPES.NIN_FRONT]?.name}</p>
                                    )}
                                </div>

                                {/* NIN Back */}
                                <div className="bg-muted/30 p-4 rounded-lg border border-dashed text-center">
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">NIN Back</label>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(IMAGE_TYPES.NIN_BACK, e)}
                                        className="bg-background"
                                    />
                                    {imageFiles[IMAGE_TYPES.NIN_BACK] && (
                                        <p className="text-xs text-emerald-500 mt-1 font-medium">Selected: {imageFiles[IMAGE_TYPES.NIN_BACK]?.name}</p>
                                    )}
                                </div>

                                {/* License */}
                                <div className="bg-muted/30 p-4 rounded-lg border border-dashed text-center">
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">Driver License</label>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(IMAGE_TYPES.LICENSE, e)}
                                        className="bg-background"
                                    />
                                    {imageFiles[IMAGE_TYPES.LICENSE] && (
                                        <p className="text-xs text-emerald-500 mt-1 font-medium">Selected: {imageFiles[IMAGE_TYPES.LICENSE]?.name}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end gap-4 pt-6 border-t">
                            <Link href="/admin/roadies">
                                <Button type="button" variant="outline" disabled={isSubmitting}>
                                    Cancel
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                disabled={isSubmitting}
                            >
                                <Save className="h-4 w-4" />
                                {isSubmitting ? "Creating..." : "Create Provider"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </PermissionGuard>
    )
}
