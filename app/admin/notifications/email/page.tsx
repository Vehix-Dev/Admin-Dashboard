"use client"

import { useState, useEffect } from "react"
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
    User,
    AlertCircle,
    CheckCircle2,
    Wallet,
    Info,
    Megaphone,
    FileCheck,
    PartyPopper,
    Wrench,
    Sparkles
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
import { cn } from "@/lib/utils"
// API Imports
import { getAdminUsers, getRiders, getRoadies, getWallets } from "@/lib/api"
import ProtectedRoute from "@/components/auth/protected-route"
import { QUICK_MESSAGES } from "@/lib/quick-messages"

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

export default function SendEmailPage() {
    // State
    const [recipients, setRecipients] = useState<Recipient[]>([])
    const [isLoadingData, setIsLoadingData] = useState(true)
    const [isSending, setIsSending] = useState(false)

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

    const { toast } = useToast()

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
                        loginUrl: process.env.NEXT_PUBLIC_APP_URL || '#' // Could pass from env
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
            })

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

    return (
        <ProtectedRoute requiredPermissions={PERMISSIONS.EMAIL_SEND}>
            <div className="max-w-4xl mx-auto space-y-6 pb-20">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Email Notifications</h2>
                    <p className="text-muted-foreground mt-2">Send direct emails, promotions, and wallet updates to users.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
                    <div className="space-y-6">
                        {/* Recipient Selection */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Users className="h-5 w-5 text-primary" />
                                    Select Recipients
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
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

                                    <div className="flex-[2]">
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
                                                                            <span className="text-xs text-muted-foreground">{recipient.value} • {recipient.role}</span>
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
                                                    <SelectItem value="ALL_RIDERS">All Riders</SelectItem>
                                                    <SelectItem value="ALL_ROADIES">All Roadies</SelectItem>
                                                    <SelectItem value="ALL_ADMINS">All Admins</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Email Content */}
                        <Tabs value={templateType} onValueChange={(v) => setTemplateType(v as TemplateType)} className="w-full">
                            <TabsList className="grid w-full grid-cols-3 mb-4 h-auto p-1 gap-1">
                                <TabsTrigger value="GENERAL">General</TabsTrigger>
                                <TabsTrigger value="PROMOTION">Promotion</TabsTrigger>
                                <TabsTrigger value="WALLET_UPDATE">Wallet</TabsTrigger>
                                <TabsTrigger value="WELCOME">Welcome</TabsTrigger>
                                <TabsTrigger value="SERVICE_COMPLETED">Service</TabsTrigger>
                                <TabsTrigger value="ACCOUNT_APPROVED">Approval</TabsTrigger>
                            </TabsList>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        {templateType === "GENERAL" && <Megaphone className="h-5 w-5 text-muted-foreground" />}
                                        {templateType === "PROMOTION" && <Megaphone className="h-5 w-5 text-blue-500" />}
                                        {templateType === "WALLET_UPDATE" && <Wallet className="h-5 w-5 text-green-500" />}
                                        {templateType === "WELCOME" && <PartyPopper className="h-5 w-5 text-purple-500" />}
                                        {templateType === "SERVICE_COMPLETED" && <Wrench className="h-5 w-5 text-orange-500" />}
                                        {templateType === "ACCOUNT_APPROVED" && <FileCheck className="h-5 w-5 text-green-600" />}
                                        <CardTitle>Compose {templateType.replace(/_/g, ' ')}</CardTitle>
                                    </div>
                                    <CardDescription>
                                        Customize the contents of your email notification.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="subject">Subject Line</Label>
                                        <Input
                                            id="subject"
                                            placeholder="Enter email subject..."
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                        />
                                    </div>

                                    {templateType === "GENERAL" && (
                                        <>
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2">
                                                    <Sparkles className="h-4 w-4 text-amber-500" />
                                                    Quick Message Library
                                                </Label>
                                                <Select onValueChange={(val) => setFormData(prev => ({ ...prev, body: val }))}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Choose a pre-written message..." />
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
                                                <Label htmlFor="gen-title">Title</Label>
                                                <Input
                                                    id="gen-title"
                                                    value={formData.title}
                                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="gen-body">Message Body</Label>
                                                <Textarea
                                                    id="gen-body"
                                                    className="min-h-[200px]"
                                                    value={formData.body}
                                                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                                />
                                            </div>
                                        </>
                                    )}

                                    {templateType === "PROMOTION" && (
                                        <>
                                            <div className="space-y-2">
                                                <Label htmlFor="promo-title">Headline</Label>
                                                <Input
                                                    id="promo-title"
                                                    placeholder="Catchy Headline"
                                                    value={formData.title}
                                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="promo-img">Image URL</Label>
                                                <Input
                                                    id="promo-img"
                                                    placeholder="https://example.com/image.jpg"
                                                    value={formData.imageUrl}
                                                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="promo-body">Details</Label>
                                                <Textarea
                                                    id="promo-body"
                                                    value={formData.body}
                                                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="promo-cta-text">Button Text</Label>
                                                    <Input
                                                        id="promo-cta-text"
                                                        value={formData.ctaText}
                                                        onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="promo-cta-link">Button Link</Label>
                                                    <Input
                                                        id="promo-cta-link"
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
                                                <AlertTitle>Current User Balance</AlertTitle>
                                                <AlertDescription className="font-mono text-lg font-bold">
                                                    {selectedUser?.balance ? `UGX ${parseFloat(selectedUser.balance).toLocaleString()}` : "UGX 0.00"}
                                                </AlertDescription>
                                            </Alert>

                                            <div className="grid grid-cols-2 gap-4">
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
                                                            <SelectItem value="CREDIT">Credit (Add)</SelectItem>
                                                            <SelectItem value="DEBIT">Debit (Subtract)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="amount">Amount</Label>
                                                    <Input
                                                        id="amount"
                                                        placeholder="0.00"
                                                        type="number"
                                                        value={formData.amount}
                                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="p-3 bg-muted rounded-md flex justify-between items-center">
                                                <span className="text-sm font-medium">New Balance (Est.):</span>
                                                <span className="text-lg font-bold">UGX {parseFloat(calculateNewBalance()).toLocaleString()}</span>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="wallet-desc">Description</Label>
                                                <Input
                                                    id="wallet-desc"
                                                    placeholder="Reason for adjustment..."
                                                    value={formData.description}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                />
                                            </div>
                                        </>
                                    )}

                                    {templateType === "SERVICE_COMPLETED" && (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="svc-name">Service Name</Label>
                                                    <Input
                                                        id="svc-name"
                                                        placeholder="e.g. Tire Change"
                                                        value={formData.serviceName}
                                                        onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="svc-id">Service ID</Label>
                                                    <Input
                                                        id="svc-id"
                                                        placeholder="e.g. 12345"
                                                        value={formData.serviceId}
                                                        onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <Alert>
                                                <Info className="h-4 w-4" />
                                                <AlertTitle>Note</AlertTitle>
                                                <AlertDescription>
                                                    This email will confirm to the user that their request has been marked as completed.
                                                </AlertDescription>
                                            </Alert>
                                        </>
                                    )}

                                    {templateType === "WELCOME" && (
                                        <Alert className="bg-purple-50 border-purple-200">
                                            <PartyPopper className="h-4 w-4 text-purple-600" />
                                            <AlertTitle className="text-purple-800">Welcome Email</AlertTitle>
                                            <AlertDescription className="text-purple-700">
                                                Sends a standardized welcome message to the user, customized for their role ({selectedUser?.role || 'User'}).
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {templateType === "ACCOUNT_APPROVED" && (
                                        <Alert className="bg-green-50 border-green-200">
                                            <FileCheck className="h-4 w-4 text-green-600" />
                                            <AlertTitle className="text-green-800">Approval Notification</AlertTitle>
                                            <AlertDescription className="text-green-700">
                                                Notifies the user that their account has been approved and they can now access the platform.
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                </CardContent>
                                <CardFooter className="flex justify-between border-t p-6">
                                    <Button variant="outline" onClick={() => toast({ description: "Preview not implemented yet" })}>
                                        Preview Email
                                    </Button>
                                    <Button onClick={handleSend} disabled={isSending}>
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
                                </CardFooter>
                            </Card>
                        </Tabs>
                    </div>

                    {/* Sidebar / Tips */}
                    <div className="space-y-6">
                        <Card className="bg-muted/50">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Megaphone className="h-4 w-4" />
                                    Tips for Better Emails
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground space-y-2">
                                <p>• Keep subject lines short and punchy.</p>
                                <p>• Use high-quality images for promotions.</p>
                                <p>• Always include a clear Call to Action (CTA).</p>
                                <p>• Double check amount numbers before sending.</p>
                            </CardContent>
                        </Card>

                        {templateType === "WALLET_UPDATE" && (
                            <Card className="border-yellow-500/50 bg-yellow-500/10">
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-yellow-500">
                                        <AlertCircle className="h-4 w-4" />
                                        Visual Verification Only
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-yellow-600/90 dark:text-yellow-500/90">
                                    <p className="mb-2">We estimate the new balance based on the current balance in the database.</p>
                                    <strong>This email does NOT update the balance.</strong> Use the Wallet Management page to perform the actual transaction.
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    )
}
