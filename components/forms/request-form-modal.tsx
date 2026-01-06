"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ServiceRequest, Rider, Roadie, Service } from "@/lib/api"

interface RequestFormModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: Partial<ServiceRequest>) => void
    riders: Rider[]
    roadies: Roadie[]
    services: Service[]
}

export function RequestFormModal({
    isOpen,
    onClose,
    onSubmit,
    riders = [],
    roadies = [],
    services = [],
}: RequestFormModalProps) {
    const [formData, setFormData] = useState<Partial<ServiceRequest>>({
        rider: 0,
        rodie: null,
        service_type: 0,
        status: "pending",
        rider_lat: 0,
        rider_lng: 0,
    })

    // Initialize form data when modal opens or data changes
    useEffect(() => {
        if (isOpen) {
            const defaultRider = riders.length > 0 ? riders[0].id : 0
            const defaultService = services.length > 0 ? services[0].id : 0

            setFormData({
                rider: defaultRider,
                rodie: null,
                service_type: defaultService,
                status: "pending",
                rider_lat: 0,
                rider_lng: 0,
            })
        }
    }, [isOpen, riders, services])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(formData)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New Service Request</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="rider">Rider *</Label>
                        <Select
                            value={formData.rider?.toString() || "0"}
                            onValueChange={(value) => setFormData({ ...formData, rider: parseInt(value) })}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a rider" />
                            </SelectTrigger>
                            <SelectContent>
                                {riders.length === 0 ? (
                                    <SelectItem value="0">No riders available</SelectItem>
                                ) : (
                                    riders.map((rider) => (
                                        <SelectItem key={rider.id} value={rider.id.toString()}>
                                            {rider.first_name} {rider.last_name} ({rider.username})
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        {riders.length === 0 && (
                            <p className="text-xs text-red-500">No riders available. Please create a rider first.</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="roadie">Roadie (Optional)</Label>
                        <Select
                            value={formData.rodie?.toString() || "none"}
                            onValueChange={(value) => setFormData({ ...formData, rodie: value === "none" ? null : parseInt(value) })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a roadie" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {roadies.length === 0 ? (
                                    <SelectItem value="0">No roadies available</SelectItem>
                                ) : (
                                    roadies.map((roadie) => (
                                        <SelectItem key={roadie.id} value={roadie.id.toString()}>
                                            {roadie.first_name} {roadie.last_name} ({roadie.username})
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="service">Service *</Label>
                        <Select
                            value={formData.service_type?.toString() || "0"}
                            onValueChange={(value) => setFormData({ ...formData, service_type: parseInt(value) })}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a service" />
                            </SelectTrigger>
                            <SelectContent>
                                {services.length === 0 ? (
                                    <SelectItem value="0">No services available</SelectItem>
                                ) : (
                                    services.map((service) => (
                                        <SelectItem key={service.id} value={service.id.toString()}>
                                            {service.name} ({service.code})
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        {services.length === 0 && (
                            <p className="text-xs text-red-500">No services available. Please create a service first.</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Status *</Label>
                        <Select
                            value={formData.status || "pending"}
                            onValueChange={(value) => setFormData({ ...formData, status: value })}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="accepted">Accepted</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="lat">Latitude *</Label>
                            <Input
                                id="lat"
                                type="number"
                                step="any"
                                value={formData.rider_lat || ""}
                                onChange={(e) => setFormData({ ...formData, rider_lat: parseFloat(e.target.value) || 0 })}
                                placeholder="0.0"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lng">Longitude *</Label>
                            <Input
                                id="lng"
                                type="number"
                                step="any"
                                value={formData.rider_lng || ""}
                                onChange={(e) => setFormData({ ...formData, rider_lng: parseFloat(e.target.value) || 0 })}
                                placeholder="0.0"
                                required
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={riders.length === 0 || services.length === 0}
                        >
                            Create Request
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}