"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createRider, adminUploadForUser, IMAGE_TYPES } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { PERMISSIONS } from "@/lib/permissions"

export default function AddRiderPage() {
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

    const [profileImage, setProfileImage] = useState<File | null>(null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }))
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setProfileImage(e.target.files[0])
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
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

            const newRider = await createRider(formData)

            // Upload Profile Image if selected
            if (profileImage) {
                try {
                    await adminUploadForUser(
                        profileImage,
                        newRider.external_id,
                        IMAGE_TYPES.PROFILE,
                        'Initial profile picture',
                        true
                    )
                } catch (uploadErr) {
                    console.error("Failed to upload profile image:", uploadErr)
                    toast({
                        title: "Warning",
                        description: "Rider created but profile picture upload failed.",
                        variant: "destructive"
                    })
                }
            }

            toast({
                title: "Success",
                description: "Rider created successfully"
            })

            // Redirect back to riders list
            router.push("/admin/riders")

        } catch (err) {
            console.error(" Create rider error:", err)
            toast({
                title: "Error",
                description: "Failed to create rider",
                variant: "destructive"
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <PermissionGuard permissions={PERMISSIONS.RIDERS_ADD}>
            <div className="container mx-auto py-8 max-w-4xl">
                <div className="mb-6">
                    <Link href="/admin/riders">
                        <Button variant="ghost" className="gap-2 mb-4">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Riders
                        </Button>
                    </Link>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Add New Rider</h1>
                            <p className="text-muted-foreground mt-2">
                                Fill in the rider details below
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
                                Activate rider immediately
                            </label>
                        </div>

                        {/* Profile Image Upload Section (Restricted to only Profile Picture) */}
                        <div className="pt-6 border-t">
                            <h3 className="text-lg font-medium text-foreground mb-4">Profile Image</h3>
                            <p className="text-sm text-muted-foreground mb-4">Only profile picture upload is allowed for riders during creation.</p>

                            <div className="bg-muted/30 p-4 rounded-lg border border-dashed max-w-md">
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Profile Picture</label>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="bg-background"
                                />
                                {profileImage && (
                                    <p className="text-xs text-emerald-500 mt-1 font-medium">Selected: {profileImage.name}</p>
                                )}
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end gap-4 pt-6 border-t">
                            <Link href="/admin/riders">
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
                                {isSubmitting ? "Creating..." : "Create Rider"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </PermissionGuard>
    )
}
