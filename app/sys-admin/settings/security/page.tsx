"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
    ShieldCheck,
    Save,
    Plus,
    Trash2,
    Globe,
    AlertTriangle,
    RefreshCw,
    Info
} from "lucide-react"
import {
    getPlatformConfig,
    updatePlatformConfig,
    type PlatformConfig
} from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

export default function SecuritySettingsPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [clientIp, setClientIp] = useState<string | null>(null)
    const [platformConfig, setPlatformConfig] = useState<PlatformConfig | null>(null)
    const [whitelistEnabled, setWhitelistEnabled] = useState(false)
    const [whitelistInput, setWhitelistInput] = useState("")
    const { toast } = useToast()

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setIsLoading(true)
        try {
            const [config, ipRes] = await Promise.all([
                getPlatformConfig(),
                fetch('https://api.ipify.org?format=json').then(res => res.json())
            ])

            setPlatformConfig(config)
            setWhitelistEnabled(!!config.ip_whitelist_enabled)
            setWhitelistInput(config.ip_whitelist || "")
            setClientIp(ipRes.ip)
        } catch (error) {
            console.error("Failed to load security settings:", error)
            toast({
                title: "Error",
                description: "Failed to load security settings",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const updated = await updatePlatformConfig({
                ip_whitelist_enabled: whitelistEnabled,
                ip_whitelist: whitelistInput
            })
            setPlatformConfig(updated)
            toast({
                title: "Settings Saved",
                description: "Security configuration has been updated successfully.",
            })
        } catch (error) {
            console.error("Save failed:", error)
            toast({
                title: "Save Failed",
                description: "An error occurred while saving security settings.",
                variant: "destructive",
            })
        } finally {
            setIsSaving(false)
        }
    }

    const addCurrentIp = () => {
        if (!clientIp) return
        const currentList = (whitelistInput || "").split(',').map(i => i.trim()).filter(Boolean)
        if (!currentList.includes(clientIp)) {
            const newList = [...currentList, clientIp].join(', ')
            setWhitelistInput(newList)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <RefreshCw className="h-8 w-8 mx-auto animate-spin text-primary" />
                    <p className="mt-2 text-muted-foreground">Loading security settings...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Security Settings</h1>
                <p className="text-muted-foreground mt-1">Manage system-level security and access controls</p>
            </div>

            <div className="grid gap-6">
                <Card className="border-border shadow-sm">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            <CardTitle>IP Whitelisting (Firewall)</CardTitle>
                        </div>
                        <CardDescription>
                            Restrict access to the admin dashboard based on unauthorized IP addresses.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Enable Whitelist Enforcement</Label>
                                <p className="text-sm text-muted-foreground">
                                    If enabled, only users with IPs in the list below will be able to see the admin panel.
                                </p>
                            </div>
                            <Switch
                                checked={whitelistEnabled}
                                onCheckedChange={setWhitelistEnabled}
                            />
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="whitelist">Authorized IP Addresses</Label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={addCurrentIp}
                                    className="h-8 text-xs gap-2"
                                >
                                    <Plus className="h-3 w-3" />
                                    Add Current IP
                                </Button>
                            </div>
                            <div className="space-y-2">
                                <textarea
                                    id="whitelist"
                                    className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="e.g. 192.168.1.1, 45.12.33.2"
                                    value={whitelistInput}
                                    onChange={(e) => setWhitelistInput(e.target.value)}
                                />
                                <p className="text-[12px] text-muted-foreground flex items-center gap-1.5">
                                    <Info className="h-3 w-3" />
                                    Separate IP addresses with commas. Supports both IPv4 and IPv6.
                                </p>
                            </div>
                        </div>

                        {whitelistEnabled && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-amber-800">
                                <AlertTriangle className="h-5 w-5 shrink-0" />
                                <div>
                                    <p className="font-semibold text-sm">Warning: Stealth Mode Active</p>
                                    <p className="text-xs mt-1 leading-relaxed">
                                        When enabled, anyone accessing from a non-whitelisted IP will see a generic "Maintenance" error.
                                        Ensure your current IP is added to avoid losing access.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-4">
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="gap-2"
                            >
                                {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Save Security Policy
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-50 border-slate-200">
                    <CardContent className="py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Globe className="h-5 w-5 text-slate-500" />
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Detected Client IP</p>
                                <p className="text-lg font-mono font-bold text-slate-800">{clientIp || 'Detecting...'}</p>
                            </div>
                        </div>
                        {clientIp && (
                            <Badge variant={(whitelistInput || "").includes(clientIp) ? "default" : "outline"} className="h-6">
                                {(whitelistInput || "").includes(clientIp) ? "Authorized" : "Unauthorized"}
                            </Badge>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
