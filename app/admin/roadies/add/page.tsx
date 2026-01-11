"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createRoadie, adminUploadForUser, IMAGE_TYPES } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Save, Upload, X } from "lucide-react"
import Link from "next/link"

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
            console.error("[v0] Create roadie error:", err)
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
                        <h1 className="text-3xl font-bold text-gray-800">Add New Roadie</h1>
                        <p className="text-gray-600 mt-2">
                            Fill in the provider details below
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
                            Activate Roadie immediately
                        </label>
                    </div>

                    {/* Image Uploads Section */}
                    <div className="pt-6 border-t">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Documents & Images</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Profile Picture */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                                <div className="flex items-center gap-4">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(IMAGE_TYPES.PROFILE, e)}
                                    />
                                </div>
                                {imageFiles[IMAGE_TYPES.PROFILE] && (
                                    <p className="text-xs text-green-600 mt-1">Selected: {imageFiles[IMAGE_TYPES.PROFILE]?.name}</p>
                                )}
                            </div>

                            {/* NIN Front */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
                                <label className="block text-sm font-medium text-gray-700 mb-2">NIN Front</label>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(IMAGE_TYPES.NIN_FRONT, e)}
                                />
                                {imageFiles[IMAGE_TYPES.NIN_FRONT] && (
                                    <p className="text-xs text-green-600 mt-1">Selected: {imageFiles[IMAGE_TYPES.NIN_FRONT]?.name}</p>
                                )}
                            </div>

                            {/* NIN Back */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
                                <label className="block text-sm font-medium text-gray-700 mb-2">NIN Back</label>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(IMAGE_TYPES.NIN_BACK, e)}
                                />
                                {imageFiles[IMAGE_TYPES.NIN_BACK] && (
                                    <p className="text-xs text-green-600 mt-1">Selected: {imageFiles[IMAGE_TYPES.NIN_BACK]?.name}</p>
                                )}
                            </div>

                            {/* License */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Driver License</label>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(IMAGE_TYPES.LICENSE, e)}
                                />
                                {imageFiles[IMAGE_TYPES.LICENSE] && (
                                    <p className="text-xs text-green-600 mt-1">Selected: {imageFiles[IMAGE_TYPES.LICENSE]?.name}</p>
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
                            className="gap-2 bg-green-600 hover:bg-green-700"
                            disabled={isSubmitting}
                        >
                            <Save className="h-4 w-4" />
                            {isSubmitting ? "Creating..." : "Create Provider"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}