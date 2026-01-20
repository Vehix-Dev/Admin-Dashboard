"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { PERMISSIONS } from "@/lib/permissions"
import { Loader2, Plus, Shield, Trash2, Edit } from "lucide-react"
import { ConfirmModal } from "@/components/ui/confirm-modal"

interface Role {
    id: string
    name: string
    description?: string
    permissions: string[]
    isSystem?: boolean
}

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form State
    const [roleName, setRoleName] = useState("")
    const [roleDesc, setRoleDesc] = useState("")
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
    const [editingRole, setEditingRole] = useState<Role | null>(null)
    const [pendingDeleteRole, setPendingDeleteRole] = useState<Role | null>(null)

    const { toast } = useToast()

    const fetchRoles = async () => {
        try {
            setIsLoading(true)
            const res = await fetch('/api/admin/roles')
            if (res.ok) {
                const data = await res.json()
                setRoles(data)
            }
        } catch (error) {
            console.error("Failed to fetch roles", error)
            toast({
                title: "Error",
                description: "Failed to load roles",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchRoles()
    }, [])

    const handleOpenDialog = (role?: Role) => {
        if (role) {
            setEditingRole(role)
            setRoleName(role.name)
            setRoleDesc(role.description || "")
            setSelectedPermissions(role.permissions)
        } else {
            setEditingRole(null)
            setRoleName("")
            setRoleDesc("")
            setSelectedPermissions([])
        }
        setIsDialogOpen(true)
    }

    const handlePermissionToggle = (perm: string) => {
        setSelectedPermissions(prev =>
            prev.includes(perm)
                ? prev.filter(p => p !== perm)
                : [...prev, perm]
        )
    }

    const handleSubmit = async () => {
        if (!roleName) {
            toast({ title: "Error", description: "Role name is required", variant: "destructive" })
            return
        }

        setIsSubmitting(true)
        try {
            const url = editingRole
                ? `/api/admin/roles/${editingRole.id}`
                : '/api/admin/roles'

            const method = editingRole ? 'PUT' : 'POST'

            const body: any = {
                name: roleName,
                description: roleDesc,
                permissions: selectedPermissions
            }

            if (!editingRole) {
                // Generate ID for new role
                body.id = roleName.toUpperCase().replace(/\s+/g, '_')
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (!res.ok) throw new Error("Failed to save role")

            toast({
                title: "Success",
                description: `Role ${editingRole ? 'updated' : 'created'} successfully`
            })
            setIsDialogOpen(false)
            fetchRoles()
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save role",
                variant: "destructive"
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (role: Role) => {
        setPendingDeleteRole(role)
    }

    const confirmDelete = async () => {
        if (!pendingDeleteRole) return

        try {
            const res = await fetch(`/api/admin/roles/${pendingDeleteRole.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error("Failed to delete")

            toast({ title: "Success", description: "Role deleted" })
            setPendingDeleteRole(null)
            fetchRoles()
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete role", variant: "destructive" })
        }
    }

    // Group permissions by category for better UI
    const groupedPermissions = Object.entries(PERMISSIONS).reduce((acc, [key, value]) => {
        const category = key.split('_')[0]
        if (!acc[category]) acc[category] = []
        acc[category].push({ key, value })
        return acc
    }, {} as Record<string, { key: string, value: string }[]>)

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Roles Management</h1>
                    <p className="text-muted-foreground">Create and manage custom roles and their permissions.</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" /> Create Role
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {roles.map((role) => (
                        <Card key={role.id} className="relative group">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-primary" />
                                            {role.name}
                                        </CardTitle>
                                        <CardDescription className="mt-1">{role.description || "No description"}</CardDescription>
                                    </div>
                                    {!role.isSystem && (
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(role)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(role)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground">
                                    {role.permissions.length} permissions assigned
                                </div>
                                {role.isSystem && <div className="mt-2 inline-block px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">System Role</div>}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingRole ? "Edit Role" : "Create New Role"}</DialogTitle>
                        <DialogDescription>Define the role name and assign granular permissions.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label>Role Name</Label>
                            <Input value={roleName} onChange={e => setRoleName(e.target.value)} disabled={!!editingRole} placeholder="e.g. Content Moderator" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Description</Label>
                            <Textarea value={roleDesc} onChange={e => setRoleDesc(e.target.value)} placeholder="Describe what this role does..." />
                        </div>

                        <div className="space-y-4">
                            <Label>Permissions</Label>
                            <div className="grid grid-cols-2 gap-4 border p-4 rounded-md">
                                {Object.entries(groupedPermissions).map(([category, perms]) => (
                                    <div key={category} className="space-y-2">
                                        <h4 className="font-semibold capitalize border-b pb-1 mb-2">{category.toLowerCase()}</h4>
                                        {perms.map((perm) => (
                                            <div key={perm.value} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={perm.value}
                                                    checked={selectedPermissions.includes(perm.value)}
                                                    onCheckedChange={() => handlePermissionToggle(perm.value)}
                                                />
                                                <label htmlFor={perm.value} className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                                    {perm.key.replace(/_/g, ' ').toLowerCase()}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Role
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmModal
                isOpen={!!pendingDeleteRole}
                onClose={() => setPendingDeleteRole(null)}
                onConfirm={confirmDelete}
                title="Delete User Role"
                description="Are you sure you want to delete this custom role? This will remove these permissions from all users with this role."
            >
                {pendingDeleteRole && (
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Role Name:</span>
                            <span className="font-medium text-white">{pendingDeleteRole.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">ID:</span>
                            <span className="font-mono text-primary">{pendingDeleteRole.id}</span>
                        </div>
                    </div>
                )}
            </ConfirmModal>
        </div>
    )
}
