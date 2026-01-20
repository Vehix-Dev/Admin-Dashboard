"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, Users, Trash2, Edit, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { ConfirmModal } from "@/components/ui/confirm-modal"

interface Group {
    id: string
    name: string
    description?: string
    memberCount: number
}

export default function GroupsPage() {
    const [groups, setGroups] = useState<Group[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form State
    const [groupName, setGroupName] = useState("")
    const [groupDesc, setGroupDesc] = useState("")
    const [editingGroup, setEditingGroup] = useState<Group | null>(null)
    const [pendingDeleteGroup, setPendingDeleteGroup] = useState<Group | null>(null)

    const { toast } = useToast()
    const router = useRouter()

    const fetchGroups = async () => {
        try {
            setIsLoading(true)
            const res = await fetch('/api/admin/groups')
            if (res.ok) {
                const data = await res.json()
                setGroups(data)
            }
        } catch (error) {
            console.error("Failed to fetch groups", error)
            toast({
                title: "Error",
                description: "Failed to load groups",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchGroups()
    }, [])

    const handleOpenDialog = (group?: Group) => {
        if (group) {
            setEditingGroup(group)
            setGroupName(group.name)
            setGroupDesc(group.description || "")
        } else {
            setEditingGroup(null)
            setGroupName("")
            setGroupDesc("")
        }
        setIsDialogOpen(true)
    }

    const handleSubmit = async () => {
        if (!groupName) {
            toast({ title: "Error", description: "Group name is required", variant: "destructive" })
            return
        }

        setIsSubmitting(true)
        try {
            const url = editingGroup
                ? `/api/admin/groups/${editingGroup.id}`
                : '/api/admin/groups'

            const method = editingGroup ? 'PUT' : 'POST'

            const body = {
                name: groupName,
                description: groupDesc
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (!res.ok) throw new Error("Failed to save group")

            toast({
                title: "Success",
                description: `Group ${editingGroup ? 'updated' : 'created'} successfully`
            })
            setIsDialogOpen(false)
            fetchGroups()
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save group",
                variant: "destructive"
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteClick = (e: React.MouseEvent, group: Group) => {
        e.stopPropagation()
        setPendingDeleteGroup(group)
    }

    const confirmDelete = async () => {
        if (!pendingDeleteGroup) return

        try {
            const res = await fetch(`/api/admin/groups/${pendingDeleteGroup.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error("Failed to delete")

            toast({ title: "Success", description: "Group deleted" })
            setPendingDeleteGroup(null)
            fetchGroups()
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete group", variant: "destructive" })
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Groups Management</h1>
                    <p className="text-muted-foreground">Organize users into groups to manage permissions efficiently.</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" /> Create Group
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {groups.map((group) => (
                        <Card
                            key={group.id}
                            className="relative group cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => router.push(`/admin/users/groups/${group.id}`)}
                        >
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-primary" />
                                            {group.name}
                                        </CardTitle>
                                        <CardDescription className="mt-1">{group.description || "No description"}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-center text-sm text-muted-foreground">
                                    <span>{group.memberCount} members</span>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleOpenDialog(group); }}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={(e) => handleDeleteClick(e, group)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                        <ChevronRight className="h-4 w-4" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingGroup ? "Edit Group" : "Create New Group"}</DialogTitle>
                        <DialogDescription>Define the group name and description.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label>Group Name</Label>
                            <Input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="e.g. Sales Team" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Description</Label>
                            <Textarea value={groupDesc} onChange={e => setGroupDesc(e.target.value)} placeholder="Describe this group..." />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Group
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmModal
                isOpen={!!pendingDeleteGroup}
                onClose={() => setPendingDeleteGroup(null)}
                onConfirm={confirmDelete}
                title="Delete User Group"
                description="Are you sure you want to delete this user group? Members will remain in the system but will no longer be associated with this group."
            >
                {pendingDeleteGroup && (
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Group Name:</span>
                            <span className="font-medium text-white">{pendingDeleteGroup.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Members:</span>
                            <span className="text-white">{pendingDeleteGroup.memberCount} members</span>
                        </div>
                    </div>
                )}
            </ConfirmModal>
        </div>
    )
}
