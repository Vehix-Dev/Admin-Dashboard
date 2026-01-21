"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { getAdminUserById, updateAdminUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { GroupSelector } from "@/components/auth/group-selector"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useCan } from "@/components/auth/permission-guard"
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
    const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
    // const [authUserId, setAuthUserId] = useState<string | null>(null) 

    // Permissions
    const canDisable = useCan(PERMISSIONS.ADMIN_USERS_DISABLE)
    const canApprove = useCan(PERMISSIONS.ADMIN_USERS_APPROVE)

    // Approval implies Disable permission
    const hasDisablePermission = canDisable || canApprove

    const [errors, setErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        const fetchAdminData = async () => {
            if (!params.id) return
            const userId = params.id as string

            try {
                const adminId = parseInt(userId)
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

                // Load User Groups
                const groupRes = await fetch(`/api/admin/users/${userId}/groups`)
                if (groupRes.ok) {
                    const groupData = await groupRes.json()
                    setSelectedGroupIds(groupData.groupIds || [])
                }

                // setAuthUserId(userId)

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

        // Username is typically read-only or critical, but we validate if editable
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

            // 1. Update User Profile (Django)
            await updateAdminUser(adminId, {
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                phone: formData.phone,
                // username: formData.username, // Username updates might be restricted
                is_active: formData.is_active,
                is_approved: formData.is_approved
            })

            // 2. Update User Groups (JSON DB)
            const groupsRes = await fetch(`/api/admin/users/${params.id}/groups`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ groupIds: selectedGroupIds })
            })

            if (!groupsRes.ok) throw new Error("Failed to save groups")

            toast({
                title: "Success",
                description: "Admin user updated successfully"
            })

            router.push("/admin/users")
        } catch (err: any) {
            console.error("Update error:", err)
            toast({
                title: "Error",
                description: err.message || "Failed to update admin user",
                variant: "destructive"
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto py-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin/users">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Users
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold tracking-tight">Edit Admin User</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="first_name">First Name</Label>
                                <Input
                                    id="first_name"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    className={errors.first_name ? "border-red-500" : ""}
                                />
                                {errors.first_name && <p className="text-xs text-red-500">{errors.first_name}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name">Last Name</Label>
                                <Input
                                    id="last_name"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    className={errors.last_name ? "border-red-500" : ""}
                                />
                                {errors.last_name && <p className="text-xs text-red-500">{errors.last_name}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={errors.email ? "border-red-500" : ""}
                                />
                                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                name="username"
                                value={formData.username}
                                disabled // Typically prevent username changes
                                className="bg-gray-100"
                            />
                        </div>

                        <div className="flex justify-between items-center py-2 border-t mt-4">
                            <div className="space-y-0.5">
                                <Label className="text-base">Active Status</Label>
                                <p className="text-sm text-muted-foreground">User can log in to the system</p>
                            </div>
                            <Switch
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                                disabled={!hasDisablePermission}
                            />
                        </div>

                        <div className="flex justify-between items-center py-2 border-t">
                            <div className="space-y-0.5">
                                <Label className="text-base">Approval Status</Label>
                                <p className="text-sm text-muted-foreground">User has been approved by an administrator</p>
                            </div>
                            <Switch
                                checked={formData.is_approved}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_approved: checked }))}
                                disabled={!canApprove}
                            />
                        </div>
                    </CardContent>
                </Card>

                <GroupSelector
                    selectedGroupIds={selectedGroupIds}
                    onChange={setSelectedGroupIds}
                />

                <div className="flex justify-end pt-4">
                    <Button type="submit" size="lg" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}