"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import type { Service } from "@/lib/api"

interface ServiceFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Partial<Service>) => Promise<void>
  initialData?: Service
}

export function ServiceFormModal({ isOpen, onClose, onSubmit, initialData }: ServiceFormModalProps) {
  const [formData, setFormData] = useState({
    code: "",
    is_active: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.code,
        is_active: initialData.is_active,
      })
    } else {
      setFormData({
        code: "",
        is_active: true,
      })
    }
  }, [initialData, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Service" : "Add Service"}</DialogTitle>
          <DialogDescription>{initialData ? "Update service information" : "Create a new service"}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Service Code</label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g., TIRE_CHANGE, JUMP_START"
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Active</label>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : initialData ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
