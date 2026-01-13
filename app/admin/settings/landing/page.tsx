"use client"

import { useState, useEffect, useCallback } from "react"
import { Save, Loader2, Globe, Mail, Plus, Trash2, Edit, MoveUp, MoveDown, Image as ImageIcon, Video, Type, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useCan, PermissionButton } from "@/components/auth/permission-guard"
import { PERMISSIONS } from "@/lib/permissions"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

type SectionType = "hero" | "features" | "text_image" | "banner"

interface LandingSection {
    id?: number
    type: SectionType
    title: string
    content: string
    image_url: string
    video_url: string
    order_index: number
    style_config: any
}

const DEFAULT_SECTION: LandingSection = {
    type: 'text_image',
    title: '',
    content: '',
    image_url: '',
    video_url: '',
    order_index: 0,
    style_config: {}
}

export default function LandingSettingsPage() {
    // 1. Hooks - Call all hooks unconditionally at the top
    const [settings, setSettings] = useState<Record<string, string>>({})
    const [sections, setSections] = useState<LandingSection[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [activeTab, setActiveTab] = useState("sections")

    // Editor State
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [currentSection, setCurrentSection] = useState<LandingSection>(DEFAULT_SECTION)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadTarget, setUploadTarget] = useState<string | null>(null) // 'section' or setting key

    const { toast } = useToast()
    const canChange = useCan(PERMISSIONS.SETTINGS_CHANGE)

    // 2. Effects and Callbacks
    const loadData = useCallback(async () => {
        setIsLoading(true)
        try {
            // Parallel fetch
            const [settingsRes, sectionsRes] = await Promise.all([
                fetch("/api/settings/landing", { cache: "no-store" }),
                fetch("/api/settings/landing/sections", { cache: "no-store" })
            ])

            if (settingsRes.ok) setSettings(await settingsRes.json())
            if (sectionsRes.ok) setSections(await sectionsRes.json())
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load data",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }, [toast]) // toast as dependency

    useEffect(() => {
        loadData()
    }, [loadData]) // loadData as dependency

    // 3. Helper Functions
    const handleSettingsChange = (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }))
    }

    const handleSaveSettings = async () => {
        setIsSaving(true)
        try {
            const response = await fetch("/api/settings/landing", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(settings)
            })

            if (response.ok) {
                toast({
                    title: "Saved",
                    description: "Settings updated successfully."
                })
            } else {
                throw new Error("Failed to save settings")
            }
        } catch (e) {
            toast({
                title: "Error",
                description: "Failed to save settings.",
                variant: "destructive"
            })
        } finally {
            setIsSaving(false)
        }
    }

    // Section Management
    const openAddSection = () => {
        setCurrentSection({
            ...DEFAULT_SECTION,
            order_index: sections.length
        })
        setIsDialogOpen(true)
    }

    const openEditSection = (section: LandingSection) => {
        setCurrentSection({ ...section })
        setIsDialogOpen(true)
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0] || !uploadTarget) return
        setIsUploading(true)
        const formData = new FormData()
        formData.append('file', e.target.files[0])

        try {
            const res = await fetch("/api/upload", {
                method: 'POST',
                body: formData
            })

            if (res.ok) {
                const data = await res.json()

                if (uploadTarget === 'section') {
                    setCurrentSection(prev => ({
                        ...prev,
                        image_url: data.url
                    }))
                } else if (uploadTarget === 'section_video') {
                    setCurrentSection(prev => ({
                        ...prev,
                        video_url: data.url
                    }))
                } else {
                    // It's a setting key (e.g., 'hero_video', 'rider_image')
                    setSettings(prev => ({
                        ...prev,
                        [uploadTarget]: data.url
                    }))
                }

                toast({
                    title: "Uploaded",
                    description: "File uploaded successfully."
                })
            } else {
                throw new Error("Upload failed")
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Upload failed.",
                variant: "destructive"
            })
        } finally {
            setIsUploading(false)
            setUploadTarget(null)
            // Reset input value to allow re-uploading same file if needed
            e.target.value = ''
        }
    }

    const triggerUpload = (target: string) => {
        setUploadTarget(target)
        document.getElementById('global-upload')?.click()
    }

    const handleSaveSection = async () => {
        // Validation
        if (!currentSection.title.trim()) {
            toast({
                title: "Required",
                description: "Title is required.",
                variant: "destructive"
            })
            return
        }

        try {
            const method = currentSection.id ? "PUT" : "POST"
            const res = await fetch("/api/settings/landing/sections", {
                method,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(currentSection)
            })

            if (res.ok) {
                toast({
                    title: "Success",
                    description: "Section saved successfully."
                })
                setIsDialogOpen(false)
                // Reload sections to get updated data
                loadData()
            } else {
                throw new Error("Failed to save section")
            }
        } catch (e) {
            toast({
                title: "Error",
                description: "Failed to save section.",
                variant: "destructive"
            })
        }
    }

    const handleDeleteSection = async (id: number) => {
        if (!confirm("Are you sure you want to delete this section?")) return

        try {
            const res = await fetch(`/api/settings/landing/sections?id=${id}`, {
                method: "DELETE"
            })

            if (res.ok) {
                setSections(prev => prev.filter(s => s.id !== id))
                toast({
                    title: "Deleted",
                    description: "Section removed successfully."
                })
            } else {
                throw new Error("Failed to delete section")
            }
        } catch (e) {
            toast({
                title: "Error",
                description: "Failed to delete section.",
                variant: "destructive"
            })
        }
    }

    const handleMoveSection = async (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return
        if (direction === 'down' && index === sections.length - 1) return

        const newSections = [...sections]
        const swapIndex = direction === 'up' ? index - 1 : index + 1

        // Swap sections
        const temp = newSections[index]
        newSections[index] = newSections[swapIndex]
        newSections[swapIndex] = temp

        // Update order indices
        newSections.forEach((section, idx) => {
            section.order_index = idx
        })

        setSections(newSections)

        // Save new order for all sections
        try {
            const updatePromises = newSections.map(section =>
                fetch("/api/settings/landing/sections", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(section)
                })
            )

            await Promise.all(updatePromises)
            toast({
                title: "Reordered",
                description: "Section order updated."
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save new order.",
                variant: "destructive"
            })
            // Reload original order on error
            loadData()
        }
    }

    // 4. Rendering
    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
                <span className="ml-3 text-lg font-medium">Loading Editor...</span>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-6xl pb-20">
            {/* Hidden Input for Global Uploads (reused) */}
            <input
                type="file"
                id="global-upload"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
            />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Landing Page CMS</h1>
                    <p className="text-muted-foreground">
                        Manage content, design, and system settings.
                    </p>
                </div>
                <PermissionButton
                    permissions={PERMISSIONS.SETTINGS_CHANGE}
                    onClick={handleSaveSettings}
                    disabled={isSaving || isUploading}
                    className="gap-2"
                >
                    {isSaving ? (
                        <Loader2 className="animate-spin h-4 w-4" />
                    ) : (
                        <Save className="h-4 w-4" />
                    )}
                    Save Config
                </PermissionButton>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="sections">Content Sections</TabsTrigger>
                    <TabsTrigger value="roles">Role Cards</TabsTrigger>
                    <TabsTrigger value="theme">Design & Theme</TabsTrigger>
                    <TabsTrigger value="smtp">Email & SMTP</TabsTrigger>
                </TabsList>

                {/* --- SECTIONS TAB --- */}
                <TabsContent value="sections" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Page Sections</CardTitle>
                                <CardDescription>
                                    Drag and drop support coming soon. Use arrows to reorder.
                                </CardDescription>
                            </div>
                            <PermissionButton
                                permissions={PERMISSIONS.SETTINGS_CHANGE}
                                size="sm"
                                onClick={openAddSection}
                                disabled={isUploading}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Section
                            </PermissionButton>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {sections.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-border rounded-lg text-muted-foreground">
                                    No sections yet. Add one to get started!
                                </div>
                            ) : (
                                sections
                                    .sort((a, b) => a.order_index - b.order_index)
                                    .map((section, index) => (
                                        <div
                                            key={section.id || index}
                                            className="flex items-center justify-between p-4 border border-border rounded-lg bg-card shadow-sm group hover:border-primary/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="bg-muted p-2 rounded text-muted-foreground">
                                                    {section.type === 'hero' && <Globe className="h-5 w-5" />}
                                                    {section.type === 'text_image' && <ImageIcon className="h-5 w-5" />}
                                                    {section.type === 'banner' && <Video className="h-5 w-5" />}
                                                    {section.type === 'features' && <Type className="h-5 w-5" />}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-sm">{section.title}</h4>
                                                    <p className="text-xs text-muted-foreground uppercase">{section.type}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleMoveSection(index, 'up')}
                                                    disabled={index === 0 || isUploading}
                                                >
                                                    <MoveUp className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleMoveSection(index, 'down')}
                                                    disabled={index === sections.length - 1 || isUploading}
                                                >
                                                    <MoveDown className="h-4 w-4" />
                                                </Button>
                                                <div className="h-4 w-px bg-border mx-2"></div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEditSection(section)}
                                                    disabled={isUploading}
                                                >
                                                    <Edit className="h-4 w-4 text-primary" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => section.id && handleDeleteSection(section.id)}
                                                    disabled={isUploading}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- ROLE CARDS TAB --- */}
                <TabsContent value="roles" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Role Selection Cards</CardTitle>
                            <CardDescription>
                                Customize the cards for Riders and Roadies.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-8">
                            {/* Rider Card Config */}
                            <div className="space-y-4 border p-4 rounded-lg">
                                <h3 className="font-bold flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                    Rider Card
                                </h3>

                                <div className="space-y-2">
                                    <Label>Custom Link URL</Label>
                                    <Input
                                        value={settings.rider_link || "/admin/riders/add?role=rider"}
                                        onChange={e => handleSettingsChange("rider_link", e.target.value)}
                                        disabled={isUploading}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Default: /admin/riders/add?role=rider
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Card Image</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={settings.rider_image || ""}
                                            readOnly
                                            placeholder="Upload an image..."
                                            disabled={isUploading}
                                        />
                                        <Button
                                            variant="secondary"
                                            onClick={() => triggerUpload('rider_image')}
                                            disabled={isUploading}
                                        >
                                            <Upload className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    {settings.rider_image && (
                                        <img
                                            src={settings.rider_image}
                                            alt="Rider Card Preview"
                                            className="h-32 w-full object-cover rounded border border-border"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Roadie Card Config */}
                            <div className="space-y-4 border p-4 rounded-lg">
                                <h3 className="font-bold flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    Roadie Card
                                </h3>

                                <div className="space-y-2">
                                    <Label>Custom Link URL</Label>
                                    <Input
                                        value={settings.roadie_link || "/admin/roadies/add?role=roadie"}
                                        onChange={e => handleSettingsChange("roadie_link", e.target.value)}
                                        disabled={isUploading}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Default: /admin/roadies/add?role=roadie
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Card Image</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={settings.roadie_image || ""}
                                            readOnly
                                            placeholder="Upload an image..."
                                            disabled={isUploading}
                                        />
                                        <Button
                                            variant="secondary"
                                            onClick={() => triggerUpload('roadie_image')}
                                            disabled={isUploading}
                                        >
                                            <Upload className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    {settings.roadie_image && (
                                        <img
                                            src={settings.roadie_image}
                                            alt="Roadie Card Preview"
                                            className="h-32 w-full object-cover rounded border border-border"
                                        />
                                    )}
                                </div>
                            </div>
                        </CardContent>
                        <div className="p-6 pt-0 flex justify-end">
                            <Button
                                onClick={handleSaveSettings}
                                disabled={isSaving || isUploading}
                                className="gap-2"
                            >
                                {isSaving ? (
                                    <Loader2 className="animate-spin h-4 w-4" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Save Role Changes
                            </Button>
                        </div>
                    </Card>
                </TabsContent>

                {/* --- THEME TAB --- */}
                <TabsContent value="theme" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Theme & Backgrounds</CardTitle>
                            <CardDescription>
                                Customize the global appearance.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Colors */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label>Primary Color</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="color"
                                            className="w-12 h-12 p-1 cursor-pointer"
                                            value={settings.theme_primary || "#2563eb"}
                                            onChange={e => handleSettingsChange("theme_primary", e.target.value)}
                                            disabled={isUploading}
                                        />
                                        <Input
                                            value={settings.theme_primary || "#2563eb"}
                                            onChange={e => handleSettingsChange("theme_primary", e.target.value)}
                                            disabled={isUploading}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Secondary Color</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="color"
                                            className="w-12 h-12 p-1 cursor-pointer"
                                            value={settings.theme_secondary || "#9333ea"}
                                            onChange={e => handleSettingsChange("theme_secondary", e.target.value)}
                                            disabled={isUploading}
                                        />
                                        <Input
                                            value={settings.theme_secondary || "#9333ea"}
                                            onChange={e => handleSettingsChange("theme_secondary", e.target.value)}
                                            disabled={isUploading}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Page Background</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="color"
                                            className="w-12 h-12 p-1 cursor-pointer"
                                            value={settings.theme_background || "#ffffff"}
                                            onChange={e => handleSettingsChange("theme_background", e.target.value)}
                                            disabled={isUploading}
                                        />
                                        <Input
                                            value={settings.theme_background || "#ffffff"}
                                            onChange={e => handleSettingsChange("theme_background", e.target.value)}
                                            disabled={isUploading}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2 pt-4 border-t">
                                {/* Hero Image */}
                                <div className="space-y-2">
                                    <Label>Hero Animation / Image</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={settings.hero_image_url || ""}
                                            onChange={e => handleSettingsChange("hero_image_url", e.target.value)}
                                            placeholder="https://example.com/animation.gif"
                                            disabled={isUploading}
                                        />
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => triggerUpload('hero_image_url')}
                                            disabled={isUploading}
                                        >
                                            <Upload className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Displayed in the floaty box on Welcome screen.
                                    </p>
                                </div>

                                {/* Background Video */}
                                <div className="space-y-2">
                                    <Label>Background Video (Welcome Screen)</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={settings.hero_video_background || ""}
                                            onChange={e => handleSettingsChange("hero_video_background", e.target.value)}
                                            placeholder="Upload .mp4 for background..."
                                            disabled={isUploading}
                                        />
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => triggerUpload('hero_video_background')}
                                            disabled={isUploading}
                                        >
                                            <Video className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        This video will play in loop behind the Welcome screen.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                        <div className="p-6 pt-0 flex justify-end">
                            <Button
                                onClick={handleSaveSettings}
                                disabled={isSaving || isUploading}
                                className="gap-2"
                            >
                                {isSaving ? (
                                    <Loader2 className="animate-spin h-4 w-4" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Save Theme Changes
                            </Button>
                        </div>
                    </Card>
                </TabsContent>

                {/* --- SMTP TAB --- */}
                <TabsContent value="smtp" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Email Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Contact Email</Label>
                                <Input
                                    value={settings.contact_email || ""}
                                    onChange={e => handleSettingsChange("contact_email", e.target.value)}
                                    disabled={isUploading}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Host</Label>
                                    <Input
                                        value={settings.smtp_host || ""}
                                        onChange={e => handleSettingsChange("smtp_host", e.target.value)}
                                        disabled={isUploading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Port</Label>
                                    <Input
                                        value={settings.smtp_port || ""}
                                        onChange={e => handleSettingsChange("smtp_port", e.target.value)}
                                        disabled={isUploading}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>User</Label>
                                <Input
                                    value={settings.smtp_user || ""}
                                    onChange={e => handleSettingsChange("smtp_user", e.target.value)}
                                    disabled={isUploading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Password</Label>
                                <Input
                                    type="password"
                                    value={settings.smtp_pass || ""}
                                    onChange={e => handleSettingsChange("smtp_pass", e.target.value)}
                                    disabled={isUploading}
                                />
                            </div>
                        </CardContent>
                        <div className="p-6 pt-0 flex justify-end">
                            <Button
                                onClick={handleSaveSettings}
                                disabled={isSaving || isUploading}
                                className="gap-2"
                            >
                                {isSaving ? (
                                    <Loader2 className="animate-spin h-4 w-4" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Save Email Settings
                            </Button>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* --- ADD/EDIT MODAL --- */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {currentSection.id ? "Edit Section" : "Add New Section"}
                        </DialogTitle>
                        <DialogDescription>
                            Configure the content block for the landing page.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Section Type</Label>
                                <Select
                                    value={currentSection.type}
                                    onValueChange={(val: SectionType) =>
                                        setCurrentSection({ ...currentSection, type: val })
                                    }
                                    disabled={isUploading}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="hero">Hero Header</SelectItem>
                                        <SelectItem value="text_image">Text + Image</SelectItem>
                                        <SelectItem value="features">Features Grid</SelectItem>
                                        <SelectItem value="banner">Full Banner</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Section Title *</Label>
                                <Input
                                    value={currentSection.title}
                                    onChange={e => setCurrentSection({
                                        ...currentSection,
                                        title: e.target.value
                                    })}
                                    placeholder="e.g. Our Mission"
                                    disabled={isUploading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Text Content</Label>
                            <Textarea
                                className="min-h-[100px]"
                                value={currentSection.content}
                                onChange={e => setCurrentSection({
                                    ...currentSection,
                                    content: e.target.value
                                })}
                                placeholder="Enter description, body text, or feature points..."
                                disabled={isUploading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Image (Upload or URL)</Label>
                            <div className="flex gap-2 items-center">
                                <Input
                                    value={currentSection.image_url || ""}
                                    onChange={e => setCurrentSection({
                                        ...currentSection,
                                        image_url: e.target.value
                                    })}
                                    placeholder="https://..."
                                    className="flex-1"
                                    disabled={isUploading}
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    type="button"
                                    onClick={() => triggerUpload('section')}
                                    disabled={isUploading}
                                >
                                    <Upload className="h-4 w-4" />
                                </Button>
                            </div>
                            {currentSection.image_url && (
                                <div className="relative w-full h-32 bg-gray-100 rounded overflow-hidden">
                                    <img
                                        src={currentSection.image_url}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                        </div>

                        {/* For all types, but specifically relevant for Banner */}
                        <div className="space-y-2">
                            <Label>Video URL (Optional)</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={currentSection.video_url || ""}
                                    onChange={e => setCurrentSection({
                                        ...currentSection,
                                        video_url: e.target.value
                                    })}
                                    placeholder="https://... or Upload .mp4"
                                    className="flex-1"
                                    disabled={isUploading}
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    type="button"
                                    onClick={() => triggerUpload('section_video')}
                                    disabled={isUploading}
                                >
                                    <Video className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                If set, will attempt to play in the section.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                            disabled={isUploading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveSection}
                            disabled={isUploading || !currentSection.title.trim()}
                        >
                            Save Section
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}