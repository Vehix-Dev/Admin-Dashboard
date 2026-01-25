// components/forms/service-form-modal.tsx
import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Service } from "@/lib/api"
import { ImageIcon, Upload, X, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ServiceFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Partial<Service> & { image?: File }) => Promise<void>
  initialData?: Service
}

export function ServiceFormModal({ isOpen, onClose, onSubmit, initialData }: ServiceFormModalProps) {
  const [formData, setFormData] = useState<{
    name: string
    code: string
    fixed_price: string
    is_active: boolean
    image?: File
    existingImage?: string
  }>({
    name: "",
    code: "",
    fixed_price: "",
    is_active: true,
  })

  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        code: initialData.code || "",
        fixed_price: initialData.fixed_price || "",
        is_active: initialData.is_active ?? true,
        existingImage: initialData.image,
      })
      if (initialData.image) {
        setImagePreview(initialData.image)
      }
    } else {
      setFormData({
        name: "",
        code: "",
        fixed_price: "",
        is_active: true,
      })
      setImagePreview(null)
    }
  }, [initialData])

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "Image size must be less than 5MB",
          variant: "destructive",
        })
        return
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please upload an image file",
          variant: "destructive",
        })
        return
      }

      handleChange('image', file)
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)
    }
  }

  const removeImage = () => {
    handleChange('image', undefined)
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const submitData: any = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        is_active: formData.is_active,
      }

      if (formData.fixed_price.trim()) {
        submitData.fixed_price = formData.fixed_price.trim()
      }

      if (formData.image) {
        submitData.image = formData.image
      }

      await onSubmit(submitData)

      if (!initialData) {
        setFormData({
          name: "",
          code: "",
          fixed_price: "",
          is_active: true,
        })
        setImagePreview(null)
      }

      onClose()
    } catch (error) {
      console.error("Form submission error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const generateCode = () => {
    if (!formData.name) return
    const code = formData.name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 4)
    handleChange('code', code)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono">
            {initialData ? "Edit Service" : "Create New Service"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Update service details and image"
              : "Add a new roadside assistance service category"
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="basic" className="font-mono text-xs">BASIC INFO</TabsTrigger>
              <TabsTrigger value="image" className="font-mono text-xs">IMAGE</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-mono uppercase tracking-wider">
                  Service Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Battery Jumpstart"
                  required
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="code" className="text-xs font-mono uppercase tracking-wider">
                    Service Code *
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={generateCode}
                    className="text-[10px] h-6 px-2"
                    disabled={!formData.name}
                  >
                    GENERATE
                  </Button>
                </div>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                  placeholder="e.g., EV"
                  required
                  className="font-mono uppercase"
                  maxLength={10}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fixed_price" className="text-xs font-mono uppercase tracking-wider">
                  Fixed Price (UGX)
                </Label>
                <Input
                  id="fixed_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.fixed_price}
                  onChange={(e) => handleChange('fixed_price', e.target.value)}
                  placeholder="e.g., 2000.00"
                  className="font-mono"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <Label htmlFor="is_active" className="text-xs font-mono uppercase tracking-wider">
                  Active Status
                </Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleChange('is_active', checked)}
                  className="scale-90"
                />
              </div>
            </TabsContent>

            <TabsContent value="image" className="space-y-4">
              <div className="space-y-4">
                <Label className="text-xs font-mono uppercase tracking-wider">
                  Service Image
                </Label>

                {imagePreview || formData.existingImage ? (
                  <div className="space-y-3">
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-dashed border-border bg-muted">
                      <img
                        src={imagePreview || formData.existingImage}
                        alt="Service preview"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={removeImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      {formData.existingImage && !formData.image ? "Current service image" : "New image selected"}
                    </p>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Upload Service Image</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG up to 5MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2 gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Select Image
                      </Button>
                    </div>
                  </div>
                )}

                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Recommended size: 400x400px</p>
                  <p>• Supports: PNG, JPG, JPEG</p>
                  <p>• Max file size: 5MB</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Separator className="my-6" />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.name.trim() || !formData.code.trim()}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {initialData ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  {initialData ? "Update Service" : "Create Service"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}