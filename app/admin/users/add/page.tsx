"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createAdminUser, saveLocalPermissions } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { PermissionSelector } from "@/components/auth/permission-selector"

export default function AddAdminPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        username: "",
        password: "",
        confirmPassword: "",
        is_active: true,
        is_approved: true
    })
    const [permissions, setPermissions] = useState<string[]>([])

    const [errors, setErrors] = useState<Record<string, string>>({})

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

        if (!formData.password) {
            newErrors.password = "Password is required"
        } else if (formData.password.length < 8) {
            newErrors.password = "Password must be at least 8 characters"
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password"
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match"
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
            const newUser = await createAdminUser({
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                phone: formData.phone,
                username: formData.username,
                password: formData.password as string,
                // permissions: permissions // Don't send to Django
            })

            // Save permissions locally
            if (newUser && newUser.id) {
                await saveLocalPermissions(newUser.id, permissions)
            }

            toast({
                title: "Success",
                description: "Admin user created successfully",
            })

            // Redirect back to admin users list
            router.push("/admin/users")

        } catch (err: any) {
            console.error(" Create admin error:", err)

            // Handle specific error messages from API
            let errorMessage = "Failed to create admin user"
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
                        <h1 className="text-3xl font-bold text-gray-800">Add New Admin</h1>
                        <p className="text-gray-600 mt-2">
                            Create a new system administrator account
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

                        {/* Password */}
                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password *
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 ${errors.password ? "border-red-500" : "border-gray-300"
                                        }`}
                                    placeholder="Enter password (min 8 characters)"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-sm text-red-600">{errors.password}</p>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                Confirm Password *
                            </label>
                            <div className="relative">
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 ${errors.confirmPassword ? "border-red-500" : "border-gray-300"
                                        }`}
                                    placeholder="Confirm password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-sm text-red-600">{errors.confirmPassword}</p>
                            )}
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
                                Activate account immediately
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
                                Approve admin privileges
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
                            {isSubmitting ? "Creating..." : "Create Admin"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}