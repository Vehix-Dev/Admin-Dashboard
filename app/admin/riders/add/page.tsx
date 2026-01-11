"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createRider, adminUploadForUser, IMAGE_TYPES } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

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
                        variant: "warning"
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
            console.error("[v0] Create rider error:", err)
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
                        <h1 className="text-3xl font-bold text-gray-800">Add New Rider</h1>
                        <p className="text-gray-600 mt-2">
                            Fill in the rider details below
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* First Name */}
                        <div className="space-y-2">
                            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                                First Name *
                            </label>
                            <input
                                id="first_name"
                                name="first_name"
                                type="text"
                                required
                                value={formData.first_name}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter first name"
                            />
                        </div>

                        {/* Last Name */}
                        <div className="space-y-2">
                            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                                Last Name *
                            </label>
                            <input
                                id="last_name"
                                name="last_name"
                                type="text"
                                required
                                value={formData.last_name}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter last name"
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email *
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter email address"
                            />
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                Phone Number
                            </label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter phone number"
                            />
                        </div>

                        {/* Username */}
                        <div className="space-y-2">
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                Username
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                value={formData.username}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter username"
                            />
                        </div>

                        {/* NIN */}
                        <div className="space-y-2">
                            <label htmlFor="nin" className="block text-sm font-medium text-gray-700">
                                National ID (NIN)
                            </label>
                            <input
                                id="nin"
                                name="nin"
                                type="text"
                                value={formData.nin}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="is_approved" className="text-sm font-medium text-gray-700">
                            Activate rider immediately
                        </label>
                    </div>

                    {/* Profile Image Upload Section (Restricted to only Profile Picture) */}
                    <div className="pt-6 border-t">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Image</h3>
                        <p className="text-sm text-gray-500 mb-4">Only profile picture upload is allowed for riders during creation.</p>

                        <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300 max-w-md">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                            {profileImage && (
                                <p className="text-xs text-green-600 mt-1">Selected: {profileImage.name}</p>
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
                            className="gap-2 bg-green-600 hover:bg-green-700"
                            disabled={isSubmitting}
                        >
                            <Save className="h-4 w-4" />
                            {isSubmitting ? "Creating..." : "Create Rider"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}