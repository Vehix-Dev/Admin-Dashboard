"use client"

import { useState, useEffect } from "react"
import { PERMISSIONS, Permission } from "@/lib/permissions"
import { Checkbox } from "@/components/ui/checkbox"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

interface PermissionSelectorProps {
    selectedPermissions: string[]
    onChange: (permissions: string[]) => void
    disabled?: boolean
}

export function PermissionSelector({ selectedPermissions, onChange, disabled = false }: PermissionSelectorProps) {
    // Group permissions by category (assumes permissions are like 'category.action')
    // e.g., 'admin_users.view' -> Category: admin_users
    const permissionsByCategory = Object.entries(PERMISSIONS).reduce((acc, [key, value]) => {
        const parts = value.split('.')
        const category = parts[0].replace(/_/g, ' ').toUpperCase()

        if (!acc[category]) {
            acc[category] = []
        }
        acc[category].push({ key, value })
        return acc
    }, {} as Record<string, { key: string; value: string }[]>)

    const handlePermissionChange = (permission: string, checked: boolean) => {
        if (checked) {
            onChange([...selectedPermissions, permission])
        } else {
            onChange(selectedPermissions.filter(p => p !== permission))
        }
    }

    const handleCategoryToggle = (categoryPermissions: { value: string }[], checked: boolean) => {
        const categoryPermissionValues = categoryPermissions.map(p => p.value)

        if (checked) {
            // Add all missing permissions from this category
            const newPermissions = [...selectedPermissions]
            categoryPermissionValues.forEach(p => {
                if (!newPermissions.includes(p)) {
                    newPermissions.push(p)
                }
            })
            onChange(newPermissions)
        } else {
            // Remove all permissions from this category
            onChange(selectedPermissions.filter(p => !categoryPermissionValues.includes(p)))
        }
    }

    const isCategoryFullySelected = (categoryPermissions: { value: string }[]) => {
        return categoryPermissions.every(p => selectedPermissions.includes(p.value))
    }

    const isCategoryPartiallySelected = (categoryPermissions: { value: string }[]) => {
        const someSelected = categoryPermissions.some(p => selectedPermissions.includes(p.value))
        const allSelected = categoryPermissions.every(p => selectedPermissions.includes(p.value))
        return someSelected && !allSelected
    }

    return (
        <div className="space-y-4 border rounded-md p-4 bg-background">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-base">User Permissions</h3>
                <Badge variant="outline">{selectedPermissions.length} selected</Badge>
            </div>

            <Accordion type="multiple" defaultValue={Object.keys(permissionsByCategory)} className="w-full">
                {Object.entries(permissionsByCategory).map(([category, items]) => (
                    <AccordionItem key={category} value={category} className="border-none">
                        <div className="flex items-center pr-2">
                            <div className="flex items-center space-x-2 pl-2 py-3">
                                <Checkbox
                                    id={`cat-${category}`}
                                    checked={isCategoryFullySelected(items) || (isCategoryPartiallySelected(items) ? "indeterminate" : false)}
                                    onCheckedChange={(checked) => handleCategoryToggle(items, checked as boolean)}
                                    disabled={disabled}
                                />
                            </div>
                            <AccordionTrigger className="hover:no-underline py-3 pl-2 h-auto flex-1">
                                <span className="font-semibold text-sm">{category}</span>
                            </AccordionTrigger>
                        </div>
                        <AccordionContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 pl-6">
                                {items.map((item) => (
                                    <div key={item.value} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={item.value}
                                            checked={selectedPermissions.includes(item.value)}
                                            onCheckedChange={(checked) => handlePermissionChange(item.value, checked as boolean)}
                                            disabled={disabled}
                                        />
                                        <Label
                                            htmlFor={item.value}
                                            className="text-sm cursor-pointer font-normal text-muted-foreground"
                                        >
                                            {item.value.split('.').slice(1).join(' ')}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    )
}
