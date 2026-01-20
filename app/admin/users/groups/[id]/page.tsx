"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { getAdminUsers, type AdminUser } from "@/lib/api"
import { Loader2, Save, ArrowLeft, UserPlus, X, Trash2, Plus } from "lucide-react"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface Role {
    id: string
    name: string
    description?: string
    permissions: string[]
}

interface Group {
    id: string
    name: string
    description?: string
    roleIds: string[]
    memberIds: string[]
}

export default function GroupDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const { toast } = useToast()
    const groupId = params.id as string

    const [group, setGroup] = useState<Group | null>(null)
    const [roles, setRoles] = useState<Role[]>([])
    const [users, setUsers] = useState<AdminUser[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    // Member Dialog
    const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false)
    const [memberSearch, setMemberSearch] = useState("")
    const [pendingRemoveUserId, setPendingRemoveUserId] = useState<string | null>(null)

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const [groupRes, rolesRes] = await Promise.all([
                fetch(`/api/admin/groups/${groupId}`),
                fetch('/api/admin/roles')
            ])

            if (!groupRes.ok) throw new Error("Failed to fetch group")
            const groupData = await groupRes.json()
            setGroup(groupData)

            if (rolesRes.ok) {
                const rolesData = await rolesRes.json()
                setRoles(rolesData)
            }

            // Fetch Users
            const usersData = await getAdminUsers()
            setUsers(usersData)

        } catch (error) {
            console.error("Failed to load data", error)
            toast({ title: "Error", description: "Failed to load group data", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (groupId) fetchData()
    }, [groupId])

    const handleRoleToggle = (roleId: string) => {
        if (!group) return
        const newRoleIds = group.roleIds.includes(roleId)
            ? group.roleIds.filter(id => id !== roleId)
            : [...group.roleIds, roleId]

        setGroup({ ...group, roleIds: newRoleIds })
    }

    const handleSaveRoles = async () => {
        if (!group) return
        setIsSaving(true)
        try {
            const res = await fetch(`/api/admin/groups/${groupId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roleIds: group.roleIds })
            })

            if (!res.ok) throw new Error("Failed to save roles")

            toast({ title: "Success", description: "Roles updated successfully" })
            fetchData() // Refresh to be sure
        } catch (error) {
            toast({ title: "Error", description: "Failed to save roles", variant: "destructive" })
        } finally {
            setIsSaving(false)
        }
    }

    const handleAddMember = async (userId: string) => {
        try {
            const res = await fetch(`/api/admin/groups/${groupId}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add', userId })
            })
            if (!res.ok) throw new Error("Failed to add member")

            toast({ title: "Success", description: "Member added" })
            setIsMemberDialogOpen(false)
            fetchData()
        } catch (error) {
            toast({ title: "Error", description: "Failed to add member", variant: "destructive" })
        }
    }

    const handleRemoveMember = (userId: string) => {
        setPendingRemoveUserId(userId)
    }

    const confirmRemoveMember = async () => {
        if (!pendingRemoveUserId) return
        try {
            const res = await fetch(`/api/admin/groups/${groupId}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'remove', userId: pendingRemoveUserId })
            })
            if (!res.ok) throw new Error("Failed to remove member")

            toast({ title: "Success", description: "Member removed" })
            setPendingRemoveUserId(null)
            fetchData()
        } catch (error) {
            toast({ title: "Error", description: "Failed to remove member", variant: "destructive" })
        }
    }

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>
    if (!group) return <div>Group not found</div>

    const groupMembers = users.filter(u => group.memberIds.includes(String(u.id)))
    const availableUsers = users.filter(u => !group.memberIds.includes(String(u.id)) && (
        u.first_name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
        u.last_name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(memberSearch.toLowerCase())
    ))

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{group.name}</h1>
                    <p className="text-muted-foreground">{group.description}</p>
                </div>
            </div>

            <Tabs defaultValue="members">
                <TabsList>
                    <TabsTrigger value="members">Members ({group.memberIds.length})</TabsTrigger>
                    <TabsTrigger value="roles">Roles & Permissions ({group.roleIds.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="members" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row justify-between items-center">
                            <CardTitle>Group Members</CardTitle>
                            <Button onClick={() => setIsMemberDialogOpen(true)}>
                                <UserPlus className="h-4 w-4 mr-2" /> Add Member
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {groupMembers.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">No members in this group</div>
                            ) : (
                                <div className="space-y-2">
                                    {groupMembers.map(user => (
                                        <div key={user.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                    {user.first_name?.[0]}{user.last_name?.[0]}
                                                </div>
                                                <div>
                                                    <div className="font-medium">{user.first_name} {user.last_name}</div>
                                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => handleRemoveMember(String(user.id))}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="roles" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row justify-between items-center">
                            <div>
                                <CardTitle>Assigned Roles</CardTitle>
                                <CardDescription>Roles grant permissions to all members of this group.</CardDescription>
                            </div>
                            <Button onClick={handleSaveRoles} disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Save className="mr-2 h-4 w-4" /> Save Changes
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                {roles.map(role => (
                                    <div key={role.id} className="flex items-start space-x-3 p-3 border rounded-md">
                                        <Checkbox
                                            id={role.id}
                                            checked={group.roleIds.includes(role.id)}
                                            onCheckedChange={() => handleRoleToggle(role.id)}
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                            <Label htmlFor={role.id} className="cursor-pointer font-medium">
                                                {role.name}
                                            </Label>
                                            <p className="text-xs text-muted-foreground">{role.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Member to Group</DialogTitle>
                        <DialogDescription>Search for a user to add.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <Input
                            placeholder="Search by name or email..."
                            value={memberSearch}
                            onChange={(e) => setMemberSearch(e.target.value)}
                        />

                        <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-md p-2">
                            {availableUsers.length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground p-4">No users found</p>
                            ) : (
                                availableUsers.map(user => (
                                    <div key={user.id} className="flex justify-between items-center p-2 hover:bg-muted rounded-md cursor-pointer" onClick={() => handleAddMember(String(user.id))}>
                                        <div>
                                            <div className="text-sm font-medium">{user.first_name} {user.last_name}</div>
                                            <div className="text-xs text-muted-foreground">{user.email}</div>
                                        </div>
                                        <Plus className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <ConfirmModal
                isOpen={!!pendingRemoveUserId}
                onClose={() => setPendingRemoveUserId(null)}
                onConfirm={confirmRemoveMember}
                title="Remove Member"
                description="Are you sure you want to remove this user from the group? They will lose all permissions granted by this group."
            >
                {pendingRemoveUserId && (() => {
                    const user = users.find(u => String(u.id) === pendingRemoveUserId)
                    return user ? (
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">User:</span>
                                <span className="font-medium text-white">{user.first_name} {user.last_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Group:</span>
                                <span className="text-primary">{group.name}</span>
                            </div>
                        </div>
                    ) : null
                })()}
            </ConfirmModal>
        </div>
    )
}
