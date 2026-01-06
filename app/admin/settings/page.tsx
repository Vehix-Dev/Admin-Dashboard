"use client"

import type React from "react"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Upload, Save } from "lucide-react"

export default function SettingsPage() {
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 2MB",
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

  const handleUpload = async () => {
    if (!logoFile) return

    setIsUploading(true)
    try {
      // In a real app, upload to your backend
      // For now, save to localStorage for demo
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
      toast({
        title: "Error",
        description: "Failed to upload logo",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-600 mt-1">Manage system configuration</p>
      </div>

      <div className="bg-white border border-gray-200 rounded p-6 shadow-sm max-w-2xl">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Branding</h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Vehix Logo (for system & login page)</label>
            <div className="flex gap-4">
              <div className="flex-1 border-2 border-dashed border-gray-300 rounded p-6 text-center">
                {logoPreview ? (
                  <div className="space-y-3">
                    <img
                      src={logoPreview || "/placeholder.svg"}
                      alt="Logo preview"
                      className="h-20 mx-auto object-contain"
                    />
                    <p className="text-sm text-gray-600">{logoFile?.name}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-gray-400" />
                    <p className="text-sm text-gray-600">Drag and drop or click to select</p>
                    <p className="text-xs text-gray-500">Max 2MB, PNG/JPG/SVG</p>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" id="logo-input" />
                <label htmlFor="logo-input" className="cursor-pointer">
                  {logoPreview && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2 border-gray-300 bg-transparent hover:bg-gray-50"
                    >
                      Change Logo
                    </Button>
                  )}
                </label>
              </div>
            </div>
          </div>

          {logoPreview && (
            <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setLogoFile(null)
                  setLogoPreview(null)
                }}
                className="border-gray-300 bg-transparent hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={isUploading} className="gap-2 bg-blue-600 hover:bg-blue-700">
                {isUploading ? (
                  "Uploading..."
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Upload Logo
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
