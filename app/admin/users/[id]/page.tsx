"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { getAdminUserById, updateAdminUser, saveLocalPermissions, fetchLocalPermissions } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { PermissionSelector } from "@/components/auth/permission-selector"
import { PERMISSIONS } from "@/lib/permissions"

export default function EditAdminPage() {
    const router = useRouter()
    const params = useParams()
    const { toast } = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        username: "",
        is_active: true,
        is_approved: true
    })
    const [permissions, setPermissions] = useState<string[]>([])

    const [errors, setErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        const fetchAdminData = async () => {
            if (!params.id) return

            try {
                const adminId = parseInt(params.id as string)
                const adminData = await getAdminUserById(adminId)

                setFormData({
                    first_name: adminData.first_name,
                    last_name: adminData.last_name,
                    email: adminData.email,
                    phone: adminData.phone,
                    username: adminData.username,
                    is_active: adminData.is_active,
                    is_approved: adminData.is_approved
                })

                // Load local permissions
                const savedPerms = await fetchLocalPermissions(adminId)
                if (savedPerms && savedPerms.length > 0) {
                    setPermissions(savedPerms)
                } else {
                    // Start with ALL permissions (Default Allow)
                    // We only save if they change it
                    setPermissions(Object.values(PERMISSIONS))
                }
            } catch (err) {
                console.error(" Fetch admin error:", err)
                toast({
                    title: "Error",
                    description: "Failed to load admin user data",
                    variant: "destructive"
                })
                router.push("/admin/users")
            } finally {
                setIsLoading(false)
            }
        }

        fetchAdminData()
    }, [params.id, router, toast])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }))

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[name]
                return newErrors
            })
        }
    }

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.first_name.trim()) {
            newErrors.first_name = "First name is required"
        }

        if (!formData.last_name.trim()) {
            newErrors.last_name = "Last name is required"
        }

        if (!formData.email.trim()) {
            newErrors.email = "Email is required"
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Please enter a valid email address"
        }

        if (!formData.phone.trim()) {
            newErrors.phone = "Phone number is required"
        }

        if (!formData.username.trim()) {
            newErrors.username = "Username is required"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        setIsSubmitting(true)

        try {
            const adminId = parseInt(params.id as string)
            // Update user details (without permissions, as backend doesn't handle them)
            await updateAdminUser(adminId, {
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                phone: formData.phone,
                username: formData.username,
                is_active: formData.is_active,
                is_approved: formData.is_approved,
            })

            // Save permissions locally
            await saveLocalPermissions(adminId, permissions)

            toast({
                title: "Success",
                description: "Admin user updated successfully"
            })

            // Redirect back to admin users list
            router.push("/admin/users")

        } catch (err: any) {
            console.error("Update admin error:", err)

            // Handle specific error messages from API
            let errorMessage = "Failed to update admin user"
            if (err.message?.includes("username")) {
                errorMessage = "Username already exists"
            } else if (err.message?.includes("email")) {
                errorMessage = "Email already exists"
            }

            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive"
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="container mx-auto py-8 max-w-4xl">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="h-10 bg-gray-200 rounded"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <div className="mb-6">
                <Link href="/admin/users">
                    <Button variant="ghost" className="gap-2 mb-4">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Admin Users
                    </Button>
                </Link>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Edit Admin User</h1>
                        <p className="text-gray-600 mt-2">
                            Update admin user information
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
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.first_name ? "border-red-500" : "border-gray-300"
                                    }`}
                                placeholder="Enter first name"
                            />
                            {errors.first_name && (
                                <p className="text-sm text-red-600">{errors.first_name}</p>
                            )}
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
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.last_name ? "border-red-500" : "border-gray-300"
                                    }`}
                                placeholder="Enter last name"
                            />
                            {errors.last_name && (
                                <p className="text-sm text-red-600">{errors.last_name}</p>
                            )}
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
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? "border-red-500" : "border-gray-300"
                                    }`}
                                placeholder="Enter email address"
                            />
                            {errors.email && (
                                <p className="text-sm text-red-600">{errors.email}</p>
                            )}
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                Phone Number *
                            </label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phone ? "border-red-500" : "border-gray-300"
                                    }`}
                                placeholder="Enter phone number"
                            />
                            {errors.phone && (
                                <p className="text-sm text-red-600">{errors.phone}</p>
                            )}
                        </div>

                        {/* Username */}
                        <div className="space-y-2">
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                Username *
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                value={formData.username}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.username ? "border-red-500" : "border-gray-300"
                                    }`}
                                placeholder="Enter username"
                            />
                            {errors.username && (
                                <p className="text-sm text-red-600">{errors.username}</p>
                            )}
                        </div>

                        {/* External ID (read-only) */}
                        <div className="space-y-2">
                            <label htmlFor="external_id" className="block text-sm font-medium text-gray-700">
                                Admin ID
                            </label>
                            <input
                                id="external_id"
                                type="text"
                                value={params.id}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded-md text-gray-500"
                            />
                            <p className="text-xs text-gray-500">Admin ID cannot be changed</p>
                        </div>
                    </div>

                    {/* Permissions Selector */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Permissions
                        </label>
                        <PermissionSelector
                            selectedPermissions={permissions}
                            onChange={setPermissions}
                        />
                    </div>

                    {/* Status Options */}
                    <div className="space-y-4 pt-4 border-t">
                        <div className="flex items-center space-x-3">
                            <input
                                id="is_active"
                                name="is_active"
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={handleChange}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                                Account is active
                            </label>
                        </div>

                        <div className="flex items-center space-x-3">
                            <input
                                id="is_approved"
                                name="is_approved"
                                type="checkbox"
                                checked={formData.is_approved}
                                onChange={handleChange}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="is_approved" className="text-sm font-medium text-gray-700">
                                Admin is approved
                            </label>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-4 pt-6 border-t">
                        <Link href="/admin/users">
                            <Button type="button" variant="outline" disabled={isSubmitting}>
                                Cancel
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            className="gap-2 bg-blue-600 hover:bg-blue-700"
                            disabled={isSubmitting}
                        >
                            <Save className="h-4 w-4" />
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}