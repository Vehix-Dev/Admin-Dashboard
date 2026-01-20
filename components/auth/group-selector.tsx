"use client"

import { useState, useEffect } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface Group {
    id: string
    name: string
    description?: string
}

interface GroupSelectorProps {
    selectedGroupIds: string[]
    onChange: (groupIds: string[]) => void
}

export function GroupSelector({ selectedGroupIds, onChange }: GroupSelectorProps) {
    const [groups, setGroups] = useState<Group[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const res = await fetch('/api/admin/groups')
                if (res.ok) {
                    const data = await res.json()
                    setGroups(data)
                }
            } catch (error) {
                console.error("Failed to load groups", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchGroups()
    }, [])

    const handleToggle = (groupId: string) => {
        if (selectedGroupIds.includes(groupId)) {
            onChange(selectedGroupIds.filter(id => id !== groupId))
        } else {
            onChange([...selectedGroupIds, groupId])
        }
    }

    if (isLoading) return <div className="p-4"><Loader2 className="animate-spin h-5 w-5" /></div>

    return (
        <Card>
            <CardHeader>
                <CardTitle>Assign Groups</CardTitle>
                <CardDescription>Assigning a user to a group grants them all roles and permissions associated with that group.</CardDescription>
            </CardHeader>
            <CardContent>
                {groups.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No groups available. Create groups first.</p>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {groups.map(group => (
                            <div key={group.id} className="flex items-start space-x-3 p-3 border rounded-md hover:bg-muted/50 transition-colors">
                                <Checkbox
                                    id={group.id}
                                    checked={selectedGroupIds.includes(group.id)}
                                    onCheckedChange={() => handleToggle(group.id)}
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <Label htmlFor={group.id} className="cursor-pointer font-medium">
                                        {group.name}
                                    </Label>
                                    <p className="text-xs text-muted-foreground">{group.description || "No description"}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
