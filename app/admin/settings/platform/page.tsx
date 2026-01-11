"use client"

import { useEffect, useState } from "react"
import { getPlatformConfig, updatePlatformConfig, PlatformConfig } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Save, AlertCircle, CheckCircle } from "lucide-react"

export default function PlatformConfigPage() {
    const [config, setConfig] = useState<PlatformConfig | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        max_negative_balance: "",
        service_fee: "",
    })

    useEffect(() => {
        fetchConfig()
    }, [])

    async function fetchConfig() {
        try {
            setLoading(true)
            const data = await getPlatformConfig()
            setConfig(data)
            setFormData({
                max_negative_balance: data.max_negative_balance,
                service_fee: data.service_fee,
            })
        } catch (err: any) {
            setError(err.message || "Failed to load platform configuration")
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError(null)
        setSuccess(null)

        try {
            const updated = await updatePlatformConfig({
                max_negative_balance: formData.max_negative_balance,
                service_fee: formData.service_fee,
            })
            setConfig(updated)
            setSuccess("Configuration updated successfully")
        } catch (err: any) {
            setError(err.message || "Failed to update configuration")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Platform Configuration</h1>
                <p className="text-muted-foreground">
                    Manage system-wide settings for wallets and services.
                </p>
            </div>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Financial Settings</CardTitle>
                    <CardDescription>
                        Configure limits and fees for the platform.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <Alert className="mb-6 border-green-500 text-green-700">
                            <CheckCircle className="h-4 w-4" />
                            <AlertTitle>Success</AlertTitle>
                            <AlertDescription>{success}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="grid w-full items-center gap-1.5">
                                <Label htmlFor="max_negative_balance">Max Negative Balance</Label>
                                <div className="flex items-center space-x-2">
                                    <span className="text-lg font-bold text-muted-foreground">-</span>
                                    <Input
                                        type="number"
                                        id="max_negative_balance"
                                        name="max_negative_balance"
                                        step="0.01"
                                        placeholder="50.00"
                                        value={formData.max_negative_balance}
                                        onChange={handleChange}
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    The maximum active debt a user can have before being blocked from service requests.
                                    (e.g., specificying 50.00 means a balance limit of -50.00)
                                </p>
                            </div>

                            <div className="grid w-full items-center gap-1.5">
                                <Label htmlFor="service_fee">Service Fee</Label>
                                <Input
                                    type="number"
                                    id="service_fee"
                                    name="service_fee"
                                    step="0.01"
                                    placeholder="30.00"
                                    value={formData.service_fee}
                                    onChange={handleChange}
                                />
                                <p className="text-sm text-muted-foreground">
                                    Fixed fee charged to Roadies when a service is completed.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={saving}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
