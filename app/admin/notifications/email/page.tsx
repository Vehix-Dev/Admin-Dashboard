"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useCan } from "@/components/auth/permission-guard"
import { PERMISSIONS } from "@/lib/permissions"
import { useToast } from "@/hooks/use-toast"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
    Loader2,
    Send,
    Users,
    AlertCircle,
    CheckCircle2,
    Wallet,
    Info,
    Megaphone,
    FileCheck,
    PartyPopper,
    Wrench,
    Sparkles,
    Bold,
    Italic,
    List,
    Link,
    Smile,
    Type,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Image as ImageIcon,
    Palette,
    Quote,
    Code,
    Eye,
    EyeOff,
    Paperclip,
    Heading,
    ListOrdered,
    ListTodo,
    Minus,
    Highlighter,
    Undo,
    Redo,
    Strikethrough,
    Underline,
    Link2,
    Type as TypeIcon,
    ImagePlus,
    Table,
    MoreHorizontal,
    ChevronDown,
    Check,
    X,
    Save,
    FileText,
    Calendar,
    Clock,
    Globe,
    Mail,
    Phone,
    MapPin,
    User
} from "lucide-react"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
// API Imports
import { getAdminUsers, getRiders, getRoadies, getWallets } from "@/lib/api"
import ProtectedRoute from "@/components/auth/protected-route"
import { QUICK_MESSAGES } from "@/lib/quick-messages"

// Professional Editors - Choose one or both
import dynamic from 'next/dynamic'
import 'react-quill/dist/quill.snow.css'

// Dynamically import react-quill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), {
    ssr: false,
    loading: () => <div className="h-[200px] w-full bg-muted animate-pulse rounded-lg"></div>
})

type RecipientType = "INDIVIDUAL" | "GROUP"
type GroupType = "ALL_RIDERS" | "ALL_ROADIES" | "ALL_ADMINS"
type TemplateType = "PROMOTION" | "WALLET_UPDATE" | "GENERAL" | "WELCOME" | "SERVICE_COMPLETED" | "ACCOUNT_APPROVED"

interface Recipient {
    label: string
    value: string // email
    role: string
    id: number
    balance?: string
}

// Emoji data
const EMOJI_CATEGORIES = {
    "Smileys & People": ["😊", "😂", "🥰", "😎", "👍", "👏", "🙌", "👋", "🤝", "🙏"],
    "Objects": ["📧", "📱", "💻", "💰", "🎁", "🏆", "⭐", "🎯", "🔔", "📌"],
    "Symbols": ["✅", "❌", "⚠️", "❗", "❓", "💡", "🔥", "✨", "🎉", "🚀"],
    "Travel & Places": ["📍", "🏠", "🏢", "🚗", "🚲", "✈️", "🌍", "🗺️", "🛣️", "⛽"],
    "Flags": ["🇺🇬", "🇺🇸", "🇬🇧", "🇨🇦", "🇦🇺", "🇩🇪", "🇫🇷", "🇯🇵", "🇰🇷", "🇮🇳"]
}

// Professional Quill toolbar modules
const modules = {
    toolbar: {
        container: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'list': 'check' }],
            [{ 'script': 'sub' }, { 'script': 'super' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'direction': 'rtl' }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'font': [] }],
            [{ 'align': [] }],
            ['link', 'image', 'video', 'formula'],
            ['clean'],
            ['code-block', 'blockquote']
        ],
        handlers: {
            // Custom handlers can be added here
        }
    },
    clipboard: {
        matchVisual: false,
    }
}

const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'video',
    'color', 'background', 'align',
    'code-block', 'script', 'formula'
]

export default function SendEmailPage() {
    // State
    const [recipients, setRecipients] = useState<Recipient[]>([])
    const [isLoadingData, setIsLoadingData] = useState(true)
    const [isSending, setIsSending] = useState(false)
    const [showPreview, setShowPreview] = useState(false)
    const [activeTab, setActiveTab] = useState<"compose" | "preview">("compose")
    const [editorMode, setEditorMode] = useState<"rich" | "html">("rich")

    // Form State
    const [recipientType, setRecipientType] = useState<RecipientType>("INDIVIDUAL")
    const [selectedGroup, setSelectedGroup] = useState<GroupType>("ALL_RIDERS")
    const [selectedUser, setSelectedUser] = useState<Recipient | null>(null)
    const [templateType, setTemplateType] = useState<TemplateType>("GENERAL")
    const [openCombobox, setOpenCombobox] = useState(false)

    // Form Fields
    const [subject, setSubject] = useState("")
    const [formData, setFormData] = useState({
        title: "",
        body: "",
        imageUrl: "",
        ctaText: "",
        ctaLink: "",
        amount: "",
        description: "",
        transactionType: "CREDIT",
        serviceName: "",
        serviceId: "",
    })

    // Editor ref
    const quillRef = useRef<any>(null)

    const { toast } = useToast()

    // Handle HTML input changes
    const handleHtmlChange = (value: string) => {
        setFormData(prev => ({ ...prev, body: value }))
    }

    // Insert template variables - FIXED VERSION
    const insertTemplateVariable = (variable: string) => {
        // Get the actual value for the variable
        let value = ""

        switch (variable) {
            case "{{user_name}}":
                value = selectedUser?.label.split(' ')[0] || "Customer"
                break
            case "{{user_email}}":
                value = selectedUser?.value || "user@example.com"
                break
            case "{{user_role}}":
                value = selectedUser?.role || "User"
                break
            case "{{date}}":
                value = new Date().toLocaleDateString()
                break
            case "{{time}}":
                value = new Date().toLocaleTimeString()
                break
            case "{{company}}":
                value = process.env.NEXT_PUBLIC_APP_NAME || "Your Company"
                break
            case "{{support_email}}":
                value = "support@example.com"
                break
            case "{{phone}}":
                value = "+1 (555) 123-4567"
                break
            case "{{address}}":
                value = "123 Main St, City, Country"
                break
            case "{{balance}}":
                value = selectedUser?.balance ? `UGX ${parseFloat(selectedUser.balance).toLocaleString()}` : "UGX 0.00"
                break
            case "{{amount}}":
                value = formData.amount ? `UGX ${parseFloat(formData.amount).toLocaleString()}` : "UGX 0.00"
                break
            case "{{service_name}}":
                value = formData.serviceName || "Service"
                break
            case "{{service_id}}":
                value = formData.serviceId || "12345"
                break
            default:
                value = variable // Fallback to the variable itself
        }

        // Insert the value into the editor
        if (quillRef.current) {
            const editor = quillRef.current.getEditor()
            const range = editor.getSelection()
            if (range) {
                editor.insertText(range.index, value)
            } else {
                editor.insertText(editor.getLength(), value)
            }
        } else {
            // Fallback for HTML mode
            setFormData(prev => ({ ...prev, body: prev.body + value }))
        }
    }

    // Insert emoji at cursor position
    const insertEmoji = (emoji: string) => {
        if (quillRef.current) {
            const editor = quillRef.current.getEditor()
            const range = editor.getSelection()
            if (range) {
                editor.insertText(range.index, emoji)
            } else {
                editor.insertText(editor.getLength(), emoji)
            }
        } else {
            setFormData(prev => ({ ...prev, body: prev.body + emoji }))
        }
    }

    // Formatting functions for rich text
    const applyFormatting = (format: string, value?: any) => {
        if (!quillRef.current) return

        const editor = quillRef.current.getEditor()
        const range = editor.getSelection()

        if (!range) {
            toast({
                title: "No text selected",
                description: "Please select some text to format",
                variant: "destructive"
            })
            return
        }

        switch (format) {
            case 'bold':
                editor.format('bold', !editor.getFormat(range).bold)
                break
            case 'italic':
                editor.format('italic', !editor.getFormat(range).italic)
                break
            case 'underline':
                editor.format('underline', !editor.getFormat(range).underline)
                break
            case 'link':
                const url = prompt('Enter URL:', 'https://')
                if (url) {
                    editor.format('link', url)
                }
                break
            case 'heading':
                editor.format('header', value)
                break
            case 'color':
                editor.format('color', value || '#000000')
                break
            case 'align':
                editor.format('align', value)
                break
            case 'list':
                editor.format('list', value)
                break
        }
    }

    // Insert image
    const insertImage = () => {
        const imageUrl = prompt('Enter image URL:', 'https://')
        if (imageUrl) {
            if (quillRef.current) {
                const editor = quillRef.current.getEditor()
                const range = editor.getSelection()
                if (range) {
                    editor.insertEmbed(range.index, 'image', imageUrl)
                }
            } else {
                setFormData(prev => ({ ...prev, body: prev.body + `<img src="${imageUrl}" alt="Image" />` }))
            }
        }
    }

    // Insert table
    const insertTable = () => {
        if (quillRef.current) {
            const editor = quillRef.current.getEditor()
            editor.insertText(editor.getLength(), '\n')
            // Quill doesn't have built-in table support, we'd need quill-table module
            toast({
                title: "Table Insert",
                description: "For advanced table support, consider adding the quill-table module",
            })
        }
    }

    // Fetch Data
    useEffect(() => {
        const loadData = async () => {
            try {
                const [admins, riders, roadies, wallets] = await Promise.all([
                    getAdminUsers(),
                    getRiders(),
                    getRoadies(),
                    getWallets()
                ])

                const formattedRecipients: Recipient[] = []

                admins.forEach(u => formattedRecipients.push({
                    label: `${u.first_name} ${u.last_name} (${u.username})`,
                    value: u.email,
                    role: 'Admin',
                    id: u.id
                }))

                riders.forEach(u => {
                    const wallet = wallets.find(w => w.id === u.wallet?.id)
                    formattedRecipients.push({
                        label: `${u.first_name} ${u.last_name} (${u.username})`,
                        value: u.email,
                        role: 'Rider',
                        id: u.id,
                        balance: wallet?.balance || u.wallet?.balance
                    })
                })

                roadies.forEach(u => {
                    formattedRecipients.push({
                        label: `${u.first_name} ${u.last_name} (${u.username})`,
                        value: u.email,
                        role: 'Roadie',
                        id: u.id,
                        balance: u.wallet?.balance
                    })
                })

                setRecipients(formattedRecipients)
            } catch (error) {
                console.error("Failed to load recipients", error)
                toast({
                    title: "Error",
                    description: "Failed to load user list.",
                    variant: "destructive"
                })
            } finally {
                setIsLoadingData(false)
            }
        }
        loadData()
    }, [])

    const calculateNewBalance = () => {
        const current = parseFloat(selectedUser?.balance || "0")
        const amount = parseFloat(formData.amount || "0")
        if (isNaN(amount) || isNaN(current)) return "0.00"
        const newVal = formData.transactionType === 'CREDIT' ? current + amount : current - amount
        return newVal.toFixed(2)
    }

    // Handle Send
    const handleSend = async () => {
        if (templateType === "WALLET_UPDATE" && recipientType === "GROUP") {
            toast({
                title: "Validation Error",
                description: "Wallet updates can only be sent to individual users.",
                variant: "destructive"
            })
            return
        }

        if (recipientType === "INDIVIDUAL" && !selectedUser) {
            toast({
                title: "Validation Error",
                description: "Please select a recipient.",
                variant: "destructive"
            })
            return
        }

        setIsSending(true)

        try {
            // Determine recipients
            let toAddresses: string | string[] = []
            if (recipientType === "INDIVIDUAL") {
                toAddresses = selectedUser!.value
            } else {
                // Group logic
                switch (selectedGroup) {
                    case "ALL_RIDERS":
                        toAddresses = recipients.filter(r => r.role === 'Rider').map(r => r.value)
                        break
                    case "ALL_ROADIES":
                        toAddresses = recipients.filter(r => r.role === 'Roadie').map(r => r.value)
                        break
                    case "ALL_ADMINS":
                        toAddresses = recipients.filter(r => r.role === 'Admin').map(r => r.value)
                        break
                }
            }

            if (Array.isArray(toAddresses) && toAddresses.length === 0) {
                throw new Error("No recipients found for the selected group.")
            }

            // Prepare Data Payload
            let dataPayload: any = {}
            const userName = selectedUser?.label.split(' ')[0] || 'User';

            switch (templateType) {
                case "PROMOTION":
                    dataPayload = {
                        title: formData.title,
                        body: formData.body,
                        imageUrl: formData.imageUrl,
                        ctaText: formData.ctaText,
                        ctaLink: formData.ctaLink
                    }
                    break;
                case "WALLET_UPDATE":
                    dataPayload = {
                        userName: userName,
                        amount: parseFloat(formData.amount || "0").toLocaleString(),
                        newBalance: calculateNewBalance(),
                        transactionType: formData.transactionType,
                        description: formData.description,
                        date: new Date().toLocaleDateString()
                    }
                    break;
                case "WELCOME":
                    dataPayload = {
                        userName: userName,
                        role: selectedUser?.role || 'User',
                        loginUrl: process.env.NEXT_PUBLIC_APP_URL || '#'
                    }
                    break;
                case "SERVICE_COMPLETED":
                    dataPayload = {
                        userName: userName,
                        serviceName: formData.serviceName,
                        serviceId: formData.serviceId,
                        completedDate: new Date().toLocaleDateString()
                    }
                    break;
                case "ACCOUNT_APPROVED":
                    dataPayload = {
                        userName: userName,
                        role: selectedUser?.role || 'Partner'
                    }
                    break;
                default: // GENERAL
                    dataPayload = {
                        title: formData.title,
                        body: formData.body
                    }
            }


            const response = await fetch('/api/admin/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: toAddresses,
                    subject: subject,
                    type: templateType,
                    data: dataPayload
                })
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || "Failed to send email")
            }

            toast({
                title: "Email Sent Successfully",
                description: `Sent to ${Array.isArray(toAddresses) ? `${toAddresses.length} recipients` : toAddresses}`,
                duration: 5000
            })

            // Reset form on success
            setSubject("")
            setFormData({
                title: "",
                body: "",
                imageUrl: "",
                ctaText: "",
                ctaLink: "",
                amount: "",
                description: "",
                transactionType: "CREDIT",
                serviceName: "",
                serviceId: "",
            })
            setSelectedUser(null)

        } catch (error: any) {
            toast({
                title: "Sending Failed",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            setIsSending(false)
        }
    }

    // Save as draft
    const handleSaveDraft = () => {
        const draft = {
            subject,
            formData,
            recipientType,
            selectedGroup,
            selectedUser,
            templateType,
            timestamp: new Date().toISOString()
        }

        localStorage.setItem('email_draft', JSON.stringify(draft))

        toast({
            title: "Draft Saved",
            description: "Your email has been saved as a draft.",
            duration: 3000
        })
    }

    // Load draft
    const handleLoadDraft = () => {
        const draftJson = localStorage.getItem('email_draft')
        if (draftJson) {
            try {
                const draft = JSON.parse(draftJson)
                setSubject(draft.subject || "")
                setFormData(draft.formData || {
                    title: "",
                    body: "",
                    imageUrl: "",
                    ctaText: "",
                    ctaLink: "",
                    amount: "",
                    description: "",
                    transactionType: "CREDIT",
                    serviceName: "",
                    serviceId: "",
                })
                setRecipientType(draft.recipientType || "INDIVIDUAL")
                setSelectedGroup(draft.selectedGroup || "ALL_RIDERS")
                setSelectedUser(draft.selectedUser || null)
                setTemplateType(draft.templateType || "GENERAL")

                toast({
                    title: "Draft Loaded",
                    description: "Your draft has been loaded successfully.",
                    duration: 3000
                })
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to load draft.",
                    variant: "destructive"
                })
            }
        } else {
            toast({
                title: "No Draft Found",
                description: "No saved draft was found.",
                variant: "destructive"
            })
        }
    }

    // Clear draft
    const handleClearDraft = () => {
        localStorage.removeItem('email_draft')
        toast({
            title: "Draft Cleared",
            description: "The saved draft has been cleared.",
            duration: 3000
        })
    }

    // Professional Editor Toolbar Component
    const ProfessionalEditorToolbar = () => (
        <div className="border rounded-t-lg bg-background p-2 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1">
                    {/* Text Formatting */}
                    <div className="flex items-center gap-1">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 px-2">
                                    <Heading className="h-4 w-4 mr-1" />
                                    Headings
                                    <ChevronDown className="h-3 w-3 ml-1" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-2">
                                <div className="grid gap-1">
                                    <Button variant="ghost" size="sm" className="justify-start" onClick={() => applyFormatting('heading', 1)}>
                                        <Heading className="h-4 w-4 mr-2" />
                                        Heading 1
                                    </Button>
                                    <Button variant="ghost" size="sm" className="justify-start" onClick={() => applyFormatting('heading', 2)}>
                                        <Heading className="h-4 w-4 mr-2 text-sm" />
                                        Heading 2
                                    </Button>
                                    <Button variant="ghost" size="sm" className="justify-start" onClick={() => applyFormatting('heading', 3)}>
                                        <Heading className="h-4 w-4 mr-2 text-xs" />
                                        Heading 3
                                    </Button>
                                    <Separator className="my-1" />
                                    <Button variant="ghost" size="sm" className="justify-start" onClick={() => applyFormatting('heading', false)}>
                                        <TypeIcon className="h-4 w-4 mr-2" />
                                        Normal Text
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>

                        <Separator orientation="vertical" className="h-6" />

                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => applyFormatting('bold')}
                            title="Bold"
                        >
                            <Bold className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => applyFormatting('italic')}
                            title="Italic"
                        >
                            <Italic className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => applyFormatting('underline')}
                            title="Underline"
                        >
                            <Underline className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => applyFormatting('link')}
                            title="Insert Link"
                        >
                            <Link2 className="h-4 w-4" />
                        </Button>
                    </div>

                    <Separator orientation="vertical" className="h-6" />

                    {/* Lists & Alignment */}
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => applyFormatting('list', 'bullet')}
                            title="Bullet List"
                        >
                            <ListTodo className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => applyFormatting('list', 'ordered')}
                            title="Numbered List"
                        >
                            <ListOrdered className="h-4 w-4" />
                        </Button>
                    </div>

                    <Separator orientation="vertical" className="h-6" />

                    {/* Alignment */}
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => applyFormatting('align', 'left')}
                            title="Align Left"
                        >
                            <AlignLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => applyFormatting('align', 'center')}
                            title="Align Center"
                        >
                            <AlignCenter className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => applyFormatting('align', 'right')}
                            title="Align Right"
                        >
                            <AlignRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <Separator orientation="vertical" className="h-6" />

                    {/* Media */}
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={insertImage}
                            title="Insert Image"
                        >
                            <ImagePlus className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={insertTable}
                            title="Insert Table"
                        >
                            <Table className="h-4 w-4" />
                        </Button>
                    </div>

                    <Separator orientation="vertical" className="h-6" />

                    {/* Special Characters */}
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => applyFormatting('format', 'blockquote')}
                            title="Quote"
                        >
                            <Quote className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => applyFormatting('format', 'code-block')}
                            title="Code Block"
                        >
                            <Code className="h-4 w-4" />
                        </Button>
                    </div>

                    <Separator orientation="vertical" className="h-6" />

                    {/* Emojis */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 px-2">
                                <Smile className="h-4 w-4 mr-1" />
                                Emoji
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-3 max-h-[300px] overflow-y-auto">
                            {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                                <div key={category} className="mb-4 last:mb-0">
                                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">{category}</h4>
                                    <div className="grid grid-cols-10 gap-1">
                                        {emojis.map((emoji, idx) => (
                                            <button
                                                key={`${category}-${idx}`}
                                                className="text-xl hover:bg-muted p-1.5 rounded transition-colors"
                                                onClick={() => insertEmoji(emoji)}
                                                title={emoji}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </PopoverContent>
                    </Popover>

                    <Separator orientation="vertical" className="h-6" />

                    {/* Template Variables */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 px-2">
                                <User className="h-4 w-4 mr-1" />
                                Variables
                                <ChevronDown className="h-3 w-3 ml-1" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-3">
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-muted-foreground">Insert Template Variables</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant="outline" size="sm" onClick={() => insertTemplateVariable("{{user_name}}")}>
                                        User Name
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => insertTemplateVariable("{{user_email}}")}>
                                        User Email
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => insertTemplateVariable("{{date}}")}>
                                        <Calendar className="h-3 w-3 mr-1" />
                                        Date
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => insertTemplateVariable("{{time}}")}>
                                        <Clock className="h-3 w-3 mr-1" />
                                        Time
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => insertTemplateVariable("{{balance}}")}>
                                        Balance
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => insertTemplateVariable("{{amount}}")}>
                                        Amount
                                    </Button>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Editor Mode Toggle */}
                <div className="flex items-center gap-2">
                    <Button
                        variant={editorMode === "rich" ? "default" : "ghost"}
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => setEditorMode("rich")}
                    >
                        <TypeIcon className="h-4 w-4 mr-1" />
                        Rich Text
                    </Button>
                    <Button
                        variant={editorMode === "html" ? "default" : "ghost"}
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => setEditorMode("html")}
                    >
                        <Code className="h-4 w-4 mr-1" />
                        HTML
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => setShowPreview(!showPreview)}
                    >
                        {showPreview ? (
                            <>
                                <EyeOff className="h-4 w-4 mr-1" />
                                Hide Preview
                            </>
                        ) : (
                            <>
                                <Eye className="h-4 w-4 mr-1" />
                                Preview
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Editor Mode Indicator */}
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <div>
                    {editorMode === "rich" ? (
                        <span className="flex items-center gap-1">
                            <Check className="h-3 w-3 text-green-500" />
                            Rich Text Editor Active
                        </span>
                    ) : (
                        <span className="flex items-center gap-1">
                            <Code className="h-3 w-3 text-blue-500" />
                            HTML Editor Active
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span>Word Count: {formData.body.split(/\s+/).filter(word => word.length > 0).length}</span>
                    <span>Characters: {formData.body.length}</span>
                </div>
            </div>
        </div>
    )

    return (
        <ProtectedRoute requiredPermissions={PERMISSIONS.EMAIL_SEND}>
            <div className="max-w-6xl mx-auto space-y-6 pb-20">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Professional Email Campaign</h2>
                        <p className="text-muted-foreground mt-2">Send professional emails, promotions, and notifications to users.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleLoadDraft}>
                            <Save className="h-4 w-4 mr-2" />
                            Load Draft
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleClearDraft}>
                            <X className="h-4 w-4 mr-2" />
                            Clear Draft
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Recipient Selection */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Users className="h-5 w-5 text-primary" />
                                    Select Recipients
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Send To</Label>
                                        <Select
                                            value={recipientType}
                                            onValueChange={(v: RecipientType) => setRecipientType(v)}
                                        >
                                            <SelectTrigger className="mt-1.5">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="INDIVIDUAL">Individual User</SelectItem>
                                                <SelectItem value="GROUP">User Group</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Recipient</Label>
                                        {recipientType === "INDIVIDUAL" ? (
                                            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" role="combobox" aria-expanded={openCombobox} className="w-full justify-between mt-1.5 font-normal">
                                                        {selectedUser ? selectedUser.label : (isLoadingData ? "Loading users..." : "Select user...")}
                                                        <Users className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[400px] p-0">
                                                    <Command>
                                                        <CommandInput placeholder="Search user..." />
                                                        <CommandList>
                                                            <CommandEmpty>No user found.</CommandEmpty>
                                                            <CommandGroup className="max-h-[300px] overflow-auto">
                                                                {recipients.map((recipient) => (
                                                                    <CommandItem
                                                                        key={`${recipient.role}-${recipient.id}`}
                                                                        value={recipient.label}
                                                                        onSelect={() => {
                                                                            setSelectedUser(recipient)
                                                                            setOpenCombobox(false)
                                                                        }}
                                                                    >
                                                                        <CheckCircle2
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                selectedUser?.value === recipient.value ? "opacity-100" : "opacity-0"
                                                                            )}
                                                                        />
                                                                        <div className="flex flex-col">
                                                                            <span>{recipient.label}</span>
                                                                            <span className="text-xs text-muted-foreground">
                                                                                {recipient.value} • {recipient.role} •
                                                                                Balance: {recipient.balance ? `UGX ${parseFloat(recipient.balance).toLocaleString()}` : "N/A"}
                                                                            </span>
                                                                        </div>
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        ) : (
                                            <Select value={selectedGroup} onValueChange={(v: GroupType) => setSelectedGroup(v)}>
                                                <SelectTrigger className="mt-1.5">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ALL_RIDERS">
                                                        <div className="flex items-center gap-2">
                                                            <Users className="h-4 w-4" />
                                                            <span>All Riders ({recipients.filter(r => r.role === 'Rider').length})</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="ALL_ROADIES">
                                                        <div className="flex items-center gap-2">
                                                            <Users className="h-4 w-4" />
                                                            <span>All Roadies ({recipients.filter(r => r.role === 'Roadie').length})</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="ALL_ADMINS">
                                                        <div className="flex items-center gap-2">
                                                            <Users className="h-4 w-4" />
                                                            <span>All Admins ({recipients.filter(r => r.role === 'Admin').length})</span>
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>
                                </div>

                                {/* Recipient Stats */}
                                <div className="bg-muted/50 p-3 rounded-md">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Selected Recipients:</span>
                                        <span className="font-bold">
                                            {recipientType === "INDIVIDUAL"
                                                ? "1 recipient"
                                                : `${recipients.filter(r => {
                                                    if (selectedGroup === "ALL_RIDERS") return r.role === 'Rider'
                                                    if (selectedGroup === "ALL_ROADIES") return r.role === 'Roadie'
                                                    if (selectedGroup === "ALL_ADMINS") return r.role === 'Admin'
                                                    return false
                                                }).length} recipients`
                                            }
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Email Content */}
                        <Tabs value={templateType} onValueChange={(v) => setTemplateType(v as TemplateType)} className="w-full">
                            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-4 h-auto p-1 gap-1">
                                <TabsTrigger value="GENERAL" className="text-xs py-2">
                                    <Megaphone className="h-3 w-3 mr-1" />
                                    General
                                </TabsTrigger>
                                <TabsTrigger value="PROMOTION" className="text-xs py-2">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    Promotion
                                </TabsTrigger>
                                <TabsTrigger value="WALLET_UPDATE" className="text-xs py-2">
                                    <Wallet className="h-3 w-3 mr-1" />
                                    Wallet
                                </TabsTrigger>
                                <TabsTrigger value="WELCOME" className="text-xs py-2">
                                    <PartyPopper className="h-3 w-3 mr-1" />
                                    Welcome
                                </TabsTrigger>
                                <TabsTrigger value="SERVICE_COMPLETED" className="text-xs py-2">
                                    <Wrench className="h-3 w-3 mr-1" />
                                    Service
                                </TabsTrigger>
                                <TabsTrigger value="ACCOUNT_APPROVED" className="text-xs py-2">
                                    <FileCheck className="h-3 w-3 mr-1" />
                                    Approval
                                </TabsTrigger>
                            </TabsList>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {templateType === "GENERAL" && <Megaphone className="h-5 w-5 text-muted-foreground" />}
                                            {templateType === "PROMOTION" && <Sparkles className="h-5 w-5 text-blue-500" />}
                                            {templateType === "WALLET_UPDATE" && <Wallet className="h-5 w-5 text-green-500" />}
                                            {templateType === "WELCOME" && <PartyPopper className="h-5 w-5 text-purple-500" />}
                                            {templateType === "SERVICE_COMPLETED" && <Wrench className="h-5 w-5 text-orange-500" />}
                                            {templateType === "ACCOUNT_APPROVED" && <FileCheck className="h-5 w-5 text-green-600" />}
                                            <CardTitle>Compose {templateType.replace(/_/g, ' ')} Email</CardTitle>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={handleSaveDraft}>
                                            <Save className="h-4 w-4 mr-2" />
                                            Save Draft
                                        </Button>
                                    </div>
                                    <CardDescription>
                                        Create professional email content using our advanced editor.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="subject" className="flex items-center gap-2">
                                            <TypeIcon className="h-4 w-4" />
                                            Subject Line
                                        </Label>
                                        <Input
                                            id="subject"
                                            placeholder="Enter compelling subject line..."
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            className="text-lg font-medium"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Keep it under 60 characters for best results. Current: {subject.length}
                                        </p>
                                    </div>

                                    {templateType === "GENERAL" && (
                                        <>
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2">
                                                    <Sparkles className="h-4 w-4 text-amber-500" />
                                                    Quick Message Templates
                                                </Label>
                                                <Select onValueChange={(val) => setFormData(prev => ({ ...prev, body: val }))}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Choose a professional template..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.entries(QUICK_MESSAGES).map(([category, messages]) => (
                                                            <div key={category}>
                                                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                                                                    {category}
                                                                </div>
                                                                {messages.map((msg, idx) => (
                                                                    <SelectItem key={`${category}-${idx}`} value={msg} className="text-sm">
                                                                        {msg.length > 60 ? msg.substring(0, 60) + "..." : msg}
                                                                    </SelectItem>
                                                                ))}
                                                            </div>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="gen-title">Email Title</Label>
                                                <Input
                                                    id="gen-title"
                                                    placeholder="Main heading for your email"
                                                    value={formData.title}
                                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4" />
                                                        Email Body
                                                    </Label>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <span>Professional Rich Text Editor</span>
                                                    </div>
                                                </div>

                                                <ProfessionalEditorToolbar />

                                                <div className="border rounded-b-lg overflow-hidden">
                                                    {showPreview ? (
                                                        <div
                                                            className="p-4 min-h-[300px] bg-white dark:bg-gray-900 prose prose-sm max-w-none"
                                                            dangerouslySetInnerHTML={{ __html: formData.body }}
                                                        />
                                                    ) : editorMode === "rich" ? (
                                                        <ReactQuill
                                                            ref={quillRef}
                                                            theme="snow"
                                                            value={formData.body}
                                                            onChange={handleHtmlChange}
                                                            modules={modules}
                                                            formats={formats}
                                                            className="min-h-[300px]"
                                                            placeholder="Write your professional email content here..."
                                                        />
                                                    ) : (
                                                        <Textarea
                                                            value={formData.body}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                                                            className="min-h-[300px] font-mono text-sm"
                                                            placeholder="Write HTML content here..."
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {templateType === "PROMOTION" && (
                                        <>
                                            <div className="space-y-2">
                                                <Label htmlFor="promo-title">Headline</Label>
                                                <Input
                                                    id="promo-title"
                                                    placeholder="Catchy Headline for Promotion"
                                                    value={formData.title}
                                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="promo-img">Hero Image URL</Label>
                                                <Input
                                                    id="promo-img"
                                                    placeholder="https://example.com/promotion-image.jpg"
                                                    value={formData.imageUrl}
                                                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Promotion Details</Label>
                                                <ProfessionalEditorToolbar />
                                                <div className="border rounded-b-lg overflow-hidden">
                                                    <ReactQuill
                                                        ref={quillRef}
                                                        theme="snow"
                                                        value={formData.body}
                                                        onChange={handleHtmlChange}
                                                        modules={modules}
                                                        formats={formats}
                                                        className="min-h-[200px]"
                                                        placeholder="Describe your promotion with rich formatting..."
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="promo-cta-text">Call-to-Action Button Text</Label>
                                                    <Input
                                                        id="promo-cta-text"
                                                        placeholder="e.g., Claim Offer Now"
                                                        value={formData.ctaText}
                                                        onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="promo-cta-link">Call-to-Action Link</Label>
                                                    <Input
                                                        id="promo-cta-link"
                                                        placeholder="https://example.com/offer"
                                                        value={formData.ctaLink}
                                                        onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {templateType === "WALLET_UPDATE" && (
                                        <>
                                            <Alert>
                                                <Wallet className="h-4 w-4" />
                                                <AlertTitle>User Balance Information</AlertTitle>
                                                <AlertDescription className="font-mono text-lg font-bold">
                                                    {selectedUser?.balance ? `UGX ${parseFloat(selectedUser.balance).toLocaleString()}` : "UGX 0.00"}
                                                </AlertDescription>
                                            </Alert>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Transaction Type</Label>
                                                    <Select
                                                        value={formData.transactionType}
                                                        onValueChange={(v) => setFormData({ ...formData, transactionType: v })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="CREDIT">Credit (Add Funds)</SelectItem>
                                                            <SelectItem value="DEBIT">Debit (Deduct Funds)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="amount">Amount (UGX)</Label>
                                                    <Input
                                                        id="amount"
                                                        placeholder="0.00"
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={formData.amount}
                                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="p-4 bg-muted rounded-md border">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm font-medium">Balance Calculation:</span>
                                                    <span className="text-lg font-bold">UGX {parseFloat(calculateNewBalance()).toLocaleString()}</span>
                                                </div>
                                                <div className="text-sm text-muted-foreground space-y-1">
                                                    <div className="flex justify-between">
                                                        <span>Current Balance:</span>
                                                        <span>UGX {selectedUser?.balance ? parseFloat(selectedUser.balance).toLocaleString() : "0.00"}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>{formData.transactionType === 'CREDIT' ? 'Credit (+)' : 'Debit (-)'}:</span>
                                                        <span>UGX {formData.amount ? parseFloat(formData.amount).toLocaleString() : "0.00"}</span>
                                                    </div>
                                                    <Separator />
                                                    <div className="flex justify-between font-bold">
                                                        <span>New Balance:</span>
                                                        <span>UGX {parseFloat(calculateNewBalance()).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Transaction Description</Label>
                                                <ProfessionalEditorToolbar />
                                                <div className="border rounded-b-lg overflow-hidden">
                                                    <ReactQuill
                                                        ref={quillRef}
                                                        theme="snow"
                                                        value={formData.description}
                                                        onChange={(value) => setFormData(prev => ({ ...prev, description: value || '' }))}
                                                        modules={modules}
                                                        formats={formats}
                                                        className="min-h-[150px]"
                                                        placeholder="Reason for transaction..."
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {templateType === "SERVICE_COMPLETED" && (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="svc-name">Service Name</Label>
                                                    <Input
                                                        id="svc-name"
                                                        placeholder="e.g., Tire Replacement"
                                                        value={formData.serviceName}
                                                        onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="svc-id">Service ID</Label>
                                                    <Input
                                                        id="svc-id"
                                                        placeholder="e.g., SVC-12345"
                                                        value={formData.serviceId}
                                                        onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Completion Message</Label>
                                                <ProfessionalEditorToolbar />
                                                <div className="border rounded-b-lg overflow-hidden">
                                                    <ReactQuill
                                                        ref={quillRef}
                                                        theme="snow"
                                                        value={formData.body}
                                                        onChange={(value) => setFormData(prev => ({ ...prev, body: value || '' }))}
                                                        modules={modules}
                                                        formats={formats}
                                                        className="min-h-[200px]"
                                                        placeholder="Add a professional completion message..."
                                                    />
                                                </div>
                                            </div>
                                            <Alert>
                                                <Info className="h-4 w-4" />
                                                <AlertTitle>Service Completion Notification</AlertTitle>
                                                <AlertDescription>
                                                    This email officially notifies the user that their service request has been completed successfully.
                                                </AlertDescription>
                                            </Alert>
                                        </>
                                    )}

                                    {templateType === "WELCOME" && (
                                        <>
                                            <Alert className="bg-purple-50 border-purple-200 dark:bg-purple-950/20">
                                                <PartyPopper className="h-4 w-4 text-purple-600" />
                                                <AlertTitle className="text-purple-800 dark:text-purple-300">Welcome Email Template</AlertTitle>
                                                <AlertDescription className="text-purple-700 dark:text-purple-400">
                                                    Sends a professional welcome message to the user, customized for their role ({selectedUser?.role || 'User'}).
                                                </AlertDescription>
                                            </Alert>
                                            <div className="space-y-2">
                                                <Label>Custom Welcome Message</Label>
                                                <ProfessionalEditorToolbar />
                                                <div className="border rounded-b-lg overflow-hidden">
                                                    <ReactQuill
                                                        ref={quillRef}
                                                        theme="snow"
                                                        value={formData.body}
                                                        onChange={(value) => setFormData(prev => ({ ...prev, body: value || '' }))}
                                                        modules={modules}
                                                        formats={formats}
                                                        className="min-h-[200px]"
                                                        placeholder="Add a personalized welcome message..."
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {templateType === "ACCOUNT_APPROVED" && (
                                        <>
                                            <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20">
                                                <FileCheck className="h-4 w-4 text-green-600" />
                                                <AlertTitle className="text-green-800 dark:text-green-300">Account Approval Notification</AlertTitle>
                                                <AlertDescription className="text-green-700 dark:text-green-400">
                                                    Notifies the user that their account has been approved and they can now access all platform features.
                                                </AlertDescription>
                                            </Alert>
                                            <div className="space-y-2">
                                                <Label>Approval Message</Label>
                                                <ProfessionalEditorToolbar />
                                                <div className="border rounded-b-lg overflow-hidden">
                                                    <ReactQuill
                                                        ref={quillRef}
                                                        theme="snow"
                                                        value={formData.body}
                                                        onChange={(value) => setFormData(prev => ({ ...prev, body: value || '' }))}
                                                        modules={modules}
                                                        formats={formats}
                                                        className="min-h-[200px]"
                                                        placeholder="Add approval details and next steps..."
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                </CardContent>
                                <CardFooter className="flex justify-between border-t p-6 bg-muted/50">
                                    <div className="space-x-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                const win = window.open()
                                                if (win) {
                                                    win.document.write(`
                                                        <!DOCTYPE html>
                                                        <html>
                                                            <head>
                                                                <title>Professional Email Preview</title>
                                                                <meta name="viewport" content="width=device-width, initial-scale=1">
                                                                <style>
                                                                    * {
                                                                        margin: 0;
                                                                        padding: 0;
                                                                        box-sizing: border-box;
                                                                    }
                                                                    body {
                                                                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                                                                        padding: 20px;
                                                                        line-height: 1.6;
                                                                        color: #333;
                                                                        background: #f5f5f5;
                                                                    }
                                                                    .email-container {
                                                                        max-width: 600px;
                                                                        margin: 0 auto;
                                                                        background: white;
                                                                        border-radius: 12px;
                                                                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                                                                        overflow: hidden;
                                                                    }
                                                                    .email-header {
                                                                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                                                        color: white;
                                                                        padding: 30px;
                                                                        text-align: center;
                                                                    }
                                                                    .email-logo {
                                                                        font-size: 24px;
                                                                        font-weight: bold;
                                                                        margin-bottom: 10px;
                                                                    }
                                                                    .email-subject {
                                                                        font-size: 20px;
                                                                        font-weight: bold;
                                                                        margin-bottom: 15px;
                                                                        color: white;
                                                                    }
                                                                    .email-content {
                                                                        padding: 40px;
                                                                    }
                                                                    .email-title {
                                                                        font-size: 24px;
                                                                        font-weight: bold;
                                                                        color: #333;
                                                                        margin-bottom: 20px;
                                                                    }
                                                                    .email-body {
                                                                        font-size: 16px;
                                                                        line-height: 1.8;
                                                                        color: #444;
                                                                    }
                                                                    .email-cta {
                                                                        margin: 30px 0;
                                                                        text-align: center;
                                                                    }
                                                                    .cta-button {
                                                                        display: inline-block;
                                                                        background: #0070f3;
                                                                        color: white;
                                                                        padding: 12px 30px;
                                                                        border-radius: 6px;
                                                                        text-decoration: none;
                                                                        font-weight: 600;
                                                                    }
                                                                    .email-footer {
                                                                        margin-top: 40px;
                                                                        padding-top: 20px;
                                                                        border-top: 1px solid #e5e5e5;
                                                                        color: #666;
                                                                        font-size: 14px;
                                                                        text-align: center;
                                                                    }
                                                                    .preview-notice {
                                                                        text-align: center;
                                                                        margin-top: 20px;
                                                                        color: #666;
                                                                        font-size: 14px;
                                                                    }
                                                                </style>
                                                            </head>
                                                            <body>
                                                                <div class="email-container">
                                                                    <div class="email-header">
                                                                        <div class="email-logo">${process.env.NEXT_PUBLIC_APP_NAME || 'Your Company'}</div>
                                                                        <div class="email-subject">${subject || 'Email Subject'}</div>
                                                                    </div>
                                                                    <div class="email-content">
                                                                        ${formData.title ? `<h1 class="email-title">${formData.title}</h1>` : ''}
                                                                        <div class="email-body">
                                                                            ${formData.body || 'Your email content will appear here...'}
                                                                        </div>
                                                                        ${formData.ctaText && formData.ctaLink ? `
                                                                            <div class="email-cta">
                                                                                <a href="${formData.ctaLink}" class="cta-button">${formData.ctaText}</a>
                                                                            </div>
                                                                        ` : ''}
                                                                        <div class="email-footer">
                                                                            <p>This email was sent to you as part of our service.</p>
                                                                            <p>© ${new Date().getFullYear()} ${process.env.NEXT_PUBLIC_APP_NAME || 'Your Company'}. All rights reserved.</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div class="preview-notice">
                                                                    This is a preview. Actual email may vary.
                                                                </div>
                                                            </body>
                                                        </html>
                                                    `)
                                                }
                                            }}
                                        >
                                            <Eye className="mr-2 h-4 w-4" />
                                            Preview Email
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, body: '', title: '' }))
                                                toast({
                                                    description: "Content cleared",
                                                    duration: 2000
                                                })
                                            }}
                                        >
                                            Clear All
                                        </Button>
                                    </div>
                                    <div className="space-x-2">
                                        <Button variant="outline" onClick={handleSaveDraft}>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Draft
                                        </Button>
                                        <Button onClick={handleSend} disabled={isSending} size="lg">
                                            {isSending ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="mr-2 h-4 w-4" />
                                                    Send Email
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        </Tabs>
                    </div>

                    {/* Sidebar / Professional Tools */}
                    <div className="space-y-6">
                        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium flex items-center gap-2 text-primary">
                                    <Megaphone className="h-4 w-4" />
                                    Professional Email Tips
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-3">
                                <div className="flex items-start gap-2">
                                    <div className="bg-primary/10 p-1 rounded">
                                        <TypeIcon className="h-3 w-3 text-primary" />
                                    </div>
                                    <p><strong>Subject Lines:</strong> Keep under 60 characters, include action words.</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="bg-primary/10 p-1 rounded">
                                        <ImageIcon className="h-3 w-3 text-primary" />
                                    </div>
                                    <p><strong>Images:</strong> Use high-quality, relevant images (max 600px width).</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="bg-primary/10 p-1 rounded">
                                        <Link2 className="h-3 w-3 text-primary" />
                                    </div>
                                    <p><strong>CTAs:</strong> One primary call-to-action per email.</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="bg-primary/10 p-1 rounded">
                                        <Bold className="h-3 w-3 text-primary" />
                                    </div>
                                    <p><strong>Formatting:</strong> Use bold and headings for key points.</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="bg-primary/10 p-1 rounded">
                                        <Eye className="h-3 w-3 text-primary" />
                                    </div>
                                    <p><strong>Mobile:</strong> Preview on mobile - 65% of emails are opened on phones.</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="bg-primary/10 p-1 rounded">
                                        <User className="h-3 w-3 text-primary" />
                                    </div>
                                    <p><strong>Personalization:</strong> Use variables like {{ user_name }} for better engagement.</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Palette className="h-4 w-4" />
                                    Template Variables
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-auto py-2 justify-start"
                                            onClick={() => insertTemplateVariable("{{user_name}}")}
                                        >
                                            <div className="text-left">
                                                <div className="font-medium">User Name</div>
                                                <div className="text-xs text-muted-foreground truncate">{{ user_name }}</div>
                                            </div>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-auto py-2 justify-start"
                                            onClick={() => insertTemplateVariable("{{user_email}}")}
                                        >
                                            <div className="text-left">
                                                <div className="font-medium">User Email</div>
                                                <div className="text-xs text-muted-foreground truncate">{{ user_email }}</div>
                                            </div>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-auto py-2 justify-start"
                                            onClick={() => insertTemplateVariable("{{date}}")}
                                        >
                                            <div className="text-left">
                                                <div className="font-medium">Today's Date</div>
                                                <div className="text-xs text-muted-foreground truncate">{{ date }}</div>
                                            </div>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-auto py-2 justify-start"
                                            onClick={() => insertTemplateVariable("{{balance}}")}
                                        >
                                            <div className="text-left">
                                                <div className="font-medium">Balance</div>
                                                <div className="text-xs text-muted-foreground truncate">{{ balance }}</div>
                                            </div>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-auto py-2 justify-start"
                                            onClick={() => insertTemplateVariable("{{company}}")}
                                        >
                                            <div className="text-left">
                                                <div className="font-medium">Company</div>
                                                <div className="text-xs text-muted-foreground truncate">{{ company }}</div>
                                            </div>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-auto py-2 justify-start"
                                            onClick={() => insertTemplateVariable("{{support_email}}")}
                                        >
                                            <div className="text-left">
                                                <div className="font-medium">Support Email</div>
                                                <div className="text-xs text-muted-foreground truncate">{{ support_email }}</div>
                                            </div>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-emerald-500/5 border-emerald-500/20">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium flex items-center gap-2 text-emerald-600">
                                    <Smile className="h-4 w-4" />
                                    Recommended Emojis
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-5 gap-2">
                                    {["🎉", "🚀", "✅", "⭐", "💰", "📧", "👋", "🎯", "🔥", "✨", "📢", "💡", "🏆", "🎁", "🔔"].map((emoji) => (
                                        <button
                                            key={emoji}
                                            className="text-xl hover:bg-muted p-2 rounded-lg transition-all hover:scale-110"
                                            onClick={() => insertEmoji(emoji)}
                                            title={`Insert ${emoji}`}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Email Stats
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm">Subject Length:</span>
                                        <span className={cn(
                                            "font-medium",
                                            subject.length > 60 ? "text-red-500" : "text-green-500"
                                        )}>
                                            {subject.length}/60 chars
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm">Body Words:</span>
                                        <span className="font-medium">
                                            {formData.body.split(/\s+/).filter(word => word.length > 0).length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm">Body Characters:</span>
                                        <span className="font-medium">{formData.body.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm">Estimated Read Time:</span>
                                        <span className="font-medium">
                                            {Math.ceil(formData.body.split(/\s+/).filter(word => word.length > 0).length / 200)} min
                                        </span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between font-medium">
                                        <span>Recipients:</span>
                                        <span>
                                            {recipientType === "INDIVIDUAL"
                                                ? "1"
                                                : recipients.filter(r => {
                                                    if (selectedGroup === "ALL_RIDERS") return r.role === 'Rider'
                                                    if (selectedGroup === "ALL_ROADIES") return r.role === 'Roadie'
                                                    if (selectedGroup === "ALL_ADMINS") return r.role === 'Admin'
                                                    return false
                                                }).length
                                            }
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {templateType === "WALLET_UPDATE" && (
                            <Card className="border-yellow-500/50 bg-yellow-500/10">
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-yellow-500">
                                        <AlertCircle className="h-4 w-4" />
                                        Important Notice
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-yellow-600/90 dark:text-yellow-500/90 space-y-2">
                                    <p>This email <strong>only notifies</strong> the user about the balance change.</p>
                                    <p><strong>To actually update the balance</strong>, use the Wallet Management system.</p>
                                    <p className="mt-2 font-medium">Best Practice:</p>
                                    <ol className="list-decimal pl-4 space-y-1">
                                        <li>Update balance in Wallet Management</li>
                                        <li>Then send this notification email</li>
                                        <li>Keep amounts consistent between systems</li>
                                    </ol>
                                </CardContent>
                            </Card>
                        )}

                        {/* Schedule Email (Future Feature) */}
                        <Card className="border-dashed">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Schedule Email
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <p className="text-sm text-muted-foreground">
                                        Schedule emails for optimal delivery times.
                                    </p>
                                    <Alert className="bg-blue-50 border-blue-200">
                                        <Info className="h-4 w-4 text-blue-500" />
                                        <AlertTitle className="text-blue-800">Coming Soon</AlertTitle>
                                        <AlertDescription className="text-blue-700 text-sm">
                                            Email scheduling feature will be available in the next update.
                                        </AlertDescription>
                                    </Alert>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    )
}