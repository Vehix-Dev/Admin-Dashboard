"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Save, Settings, DollarSign, CreditCard, Clock, Info, ShieldAlert, RefreshCw } from "lucide-react"
import {
  getPlatformConfig,
  updatePlatformConfig,
  type PlatformConfig
} from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function SettingsPage() {
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig | null>(null)
  const { toast } = useToast()

  // Form state for platform config
  const [maxNegativeBalance, setMaxNegativeBalance] = useState("")
  const [serviceFee, setServiceFee] = useState("")
  const [trialDays, setTrialDays] = useState("")

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      // Load platform configuration
      const config = await getPlatformConfig()
      setPlatformConfig(config)
      setMaxNegativeBalance(config.max_negative_balance)
      setServiceFee(config.service_fee)
      setTrialDays(String(config.trial_days || 0))

    } catch (error) {
      console.error("Failed to load settings:", error)
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "File size must be less than 5MB",
          variant: "destructive",
        })
        return
      }
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Error",
          description: "Please select an image file",
          variant: "destructive",
        })
        return
      }
      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleLogoUpload = async () => {
    if (!logoFile) return

    setIsUploading(true)
    try {
      // Save to localStorage for demo (since no logo upload API was provided)
      const reader = new FileReader()
      reader.onload = (e) => {
        localStorage.setItem("vehix_logo", e.target?.result as string)
        localStorage.setItem("vehix_logo_name", logoFile.name)
        toast({
          title: "Success",
          description: "Logo uploaded successfully",
        })
        setLogoFile(null)
        setLogoPreview(null)
      }
      reader.readAsDataURL(logoFile)
    } catch (err) {
      console.error("Logo upload failed:", err)
      toast({
        title: "Error",
        description: "Failed to upload logo",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSavePlatformConfig = async () => {
    try {
      const updatedConfig = await updatePlatformConfig({
        max_negative_balance: maxNegativeBalance,
        service_fee: serviceFee,
        trial_days: parseInt(trialDays || "0")
      })

      setPlatformConfig(updatedConfig)
      toast({
        title: "Success",
        description: "Platform configuration updated",
      })
    } catch (error) {
      console.error("Failed to update platform config:", error)
      toast({
        title: "Error",
        description: "Failed to update platform configuration",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Settings className="h-8 w-8 mx-auto animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage system configuration and platform rules</p>
      </div>

      <div className="max-w-2xl">

        {/* Platform Configuration Card */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Platform Configuration</CardTitle>
            <CardDescription className="text-muted-foreground">
              Configure platform-wide settings and fees
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxNegativeBalance">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Max Negative Balance
                  </div>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">UGX</span>
                  <Input
                    id="maxNegativeBalance"
                    type="number"
                    step="0.01"
                    min="0"
                    value={maxNegativeBalance}
                    onChange={(e) => setMaxNegativeBalance(e.target.value)}
                    className="pl-12"
                    placeholder="50000.00"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Maximum allowed negative wallet balance. Users with balance below -{maxNegativeBalance} cannot receive services.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceFee">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Service Fee
                  </div>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">UGX</span>
                  <Input
                    id="serviceFee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={serviceFee}
                    onChange={(e) => setServiceFee(e.target.value)}
                    className="pl-12"
                    placeholder="30000.00"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Fixed fee charged to Roadies when a service is completed.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trialDays">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Trial Period (Days)
                  </div>
                </Label>
                <Input
                  id="trialDays"
                  type="number"
                  min="0"
                  value={trialDays}
                  onChange={(e) => setTrialDays(e.target.value)}
                  placeholder="14"
                />
                <p className="text-sm text-muted-foreground">
                  Number of days new roadies can use the platform for free before service fees apply.
                </p>
              </div>
            </div>

            <Separator />

            <div className="bg-muted/50 p-4 rounded border border-border">
              <h4 className="font-medium text-foreground mb-2">Current Configuration</h4>
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Max Negative Balance:</span>
                  <span className="font-medium ml-2 text-foreground">UGX {platformConfig?.max_negative_balance}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Service Fee:</span>
                  <span className="font-medium ml-2 text-foreground">UGX {platformConfig?.service_fee}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Trial Period:</span>
                  <span className="font-medium ml-2 text-foreground">{platformConfig?.trial_days || 0} Days</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span className="font-medium ml-2 text-foreground">
                    {platformConfig?.updated_at ? new Date(platformConfig.updated_at).toLocaleString() : 'Never'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSavePlatformConfig}
                className="gap-2 bg-primary hover:bg-primary/90"
              >
                <Save className="h-4 w-4" />
                Save Platform Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}