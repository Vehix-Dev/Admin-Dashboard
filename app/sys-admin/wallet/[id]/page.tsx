"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/dashboard/empty-state"
import {
    getWallets,
    getWalletById,
    getPlatformConfig,
    type PlatformConfig
} from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, ExternalLink, DollarSign, Calendar, Clock, User, Wallet as WalletIcon, FileDown, Printer } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as DatePicker } from "@/components/ui/calendar"
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns"

interface Transaction {
    id: number | string
    type?: string
    amount: string
    reason: string
    status?: string
    reference?: string
    created_at: string
}

interface WalletWithUser {
    id: number
    user_id: number
    user_external_id: string | null
    user_username: string
    balance: string
    transactions: Transaction[]
    created_at: string
    updated_at: string
}

export default function WalletDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const [wallet, setWallet] = useState<WalletWithUser | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [platformConfig, setPlatformConfig] = useState<PlatformConfig | null>(null)
    const [startDate, setStartDate] = useState<Date | undefined>(undefined)
    const [endDate, setEndDate] = useState<Date | undefined>(undefined)
    const { toast } = useToast()

    const walletId = params.id as string

    useEffect(() => {
        if (!walletId) return

        const fetchData = async () => {
            setIsLoading(true)
            try {
                // Try to get specific wallet
                let walletData: WalletWithUser
                try {
                    walletData = await getWalletById(parseInt(walletId)) as unknown as WalletWithUser
                } catch (err) {
                    // If specific wallet fetch fails, try to find it in all wallets
                    console.log("Fetching specific wallet failed, trying all wallets...")
                    const allWallets = await getWallets() as unknown as WalletWithUser[]
                    const foundWallet = allWallets.find(w => w.id === parseInt(walletId))

                    if (!foundWallet) {
                        throw new Error("Wallet not found")
                    }
                    walletData = foundWallet
                }

                const configData = await getPlatformConfig()

                // Filter to only show if it's a Rider or Roadie
                const externalId = walletData.user_external_id
                if (!externalId || (!externalId.startsWith('R') && !externalId.startsWith('BS'))) {
                    toast({
                        title: "Access Denied",
                        description: "This wallet is not accessible",
                        variant: "destructive",
                    })
                    router.push("/sys-admin/wallet")
                    return
                }

                // Filter transactions to only show completed ones
                walletData.transactions = (walletData.transactions || []).filter((t: any) => t.status === 'completed')

                setWallet(walletData)
                setPlatformConfig(configData)

            } catch (err: any) {
                console.error("Failed to fetch data:", err)
                toast({
                    title: "Error",
                    description: "Failed to load wallet transaction data.",
                    variant: "destructive",
                })
                router.push("/sys-admin/wallet")
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [walletId, router, toast])

    const formatCurrency = (amount: number | string) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
        return new Intl.NumberFormat('en-UG', {
            style: 'currency',
            currency: 'UGX',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(numAmount)
    }

    const getBalanceColor = (balance: number) => {
        if (balance > 0) return "text-emerald-500"
        if (balance === 0) return "text-muted-foreground"
        if (balance < 0 && balance >= -10000) return "text-amber-500"
        return "text-destructive"
    }

    const getTransactionType = (transaction: Transaction, amount: number) => {
        if (transaction.type === "DEPOSIT") return "Deposit"
        if (transaction.type === "WITHDRAWAL") return "Withdrawal"
        if ((transaction.reason || "").toLowerCase().includes("service fee")) return "Service Fee Deduction"
        return amount >= 0 ? "Credit" : "Debit"
    }

    const getTransactionTypeColor = (transaction: Transaction, amount: number) => {
        return transaction.type === "DEPOSIT" || amount >= 0
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
            : "border-destructive/20 bg-destructive/10 text-destructive"
    }

    const getSignedAmount = (transaction: Transaction) => {
        const amount = parseFloat(transaction.amount)
        if (transaction.type === "WITHDRAWAL" && amount > 0) return -amount
        return amount
    }

    const getUserRole = () => {
        if (!wallet?.user_external_id) return 'UNKNOWN'
        if (wallet.user_external_id.startsWith('R')) return 'RIDER'
        if (wallet.user_external_id.startsWith('BS')) return 'RODIE'
        return 'UNKNOWN'
    }

    const getUserRoleLabel = () => {
        const role = getUserRole()
        return role === 'RIDER' ? 'Rider' : role === 'RODIE' ? 'Roadie' : 'User'
    }

    const getUserRoleColor = () => {
        const role = getUserRole()
        return role === 'RIDER' ? 'border-primary/20 bg-primary/10 text-primary' :
            role === 'RODIE' ? 'border-purple-500/20 bg-purple-500/10 text-purple-500' :
                'border-border bg-muted/30 text-muted-foreground'
    }

    const calculateStats = () => {
        if (!wallet) return null

        const transactions = getFilteredTransactions()
        const totalCredits = transactions
            .filter(t => getSignedAmount(t) >= 0)
            .reduce((sum, t) => sum + getSignedAmount(t), 0)

        const totalDebits = transactions
            .filter(t => getSignedAmount(t) < 0)
            .reduce((sum, t) => sum + Math.abs(getSignedAmount(t)), 0)

        const firstTransaction = transactions.length > 0
            ? new Date(transactions[transactions.length - 1].created_at)
            : null

        const lastTransaction = transactions.length > 0
            ? new Date(transactions[0].created_at)
            : null

        return {
            totalTransactions: transactions.length,
            totalCredits,
            totalDebits,
            netChange: totalCredits - totalDebits,
            firstTransaction,
            lastTransaction,
            creditCount: transactions.filter(t => getSignedAmount(t) >= 0).length,
            debitCount: transactions.filter(t => getSignedAmount(t) < 0).length,
        }
    }

    const getFilteredTransactions = () => {
        const transactions = wallet?.transactions || []
        if (!startDate && !endDate) return transactions
        return transactions.filter((transaction) => {
            const transactionDate = new Date(transaction.created_at)
            const start = startDate ? startOfDay(startDate) : new Date(0)
            const end = endDate ? endOfDay(endDate) : new Date()
            return isWithinInterval(transactionDate, { start, end })
        })
    }

    const filteredTransactions = getFilteredTransactions()
    const stats = calculateStats()

    const exportToCSV = () => {
        if (!wallet || filteredTransactions.length === 0) return

        const headers = ['ID', 'Date', 'Time', 'Description', 'Type', 'Amount (UGX)', 'Running Balance (UGX)']
        const csvData = filteredTransactions.map((t, index) => {
            const amount = getSignedAmount(t)
            const date = new Date(t.created_at)
            const runningBalance = filteredTransactions
                .slice(0, index + 1)
                .reduce((sum, tx) => sum + parseFloat(tx.amount), 0)

            return [
                t.id,
                date.toLocaleDateString(),
                date.toLocaleTimeString(),
                `"${t.reason}"`,
                getTransactionType(t, amount),
                amount,
                runningBalance
            ]
        })

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `transactions_${wallet.user_username}_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        toast({
            title: "Success",
            description: "Transactions exported successfully",
        })
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded" />
                    <Skeleton className="h-8 w-48" />
                </div>
                <Skeleton className="h-96 w-full rounded" />
            </div>
        )
    }

    if (!wallet) {
        return (
            <EmptyState
                title="Wallet not found"
                description="The requested wallet could not be found."
                action={
                    <Button onClick={() => router.push("/sys-admin/wallet")} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Wallets
                    </Button>
                }
            />
        )
    }

    const balance = parseFloat(wallet.balance)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push("/sys-admin/wallet")}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Wallets
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Transaction Details</h1>
                        <p className="text-muted-foreground mt-1">
                            Transaction history for {wallet.user_username}
                        </p>
                    </div>
                </div>
            </div>

            {/* Wallet Summary Card */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* User Info */}
                        <div className="space-y-2">
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <User className="h-4 w-4" />
                                User Information
                            </div>
                            <div className="space-y-1">
                                <div className="font-semibold text-lg text-foreground">{wallet.user_username}</div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={cn("font-medium", getUserRoleColor())}>
                                        {getUserRoleLabel()}
                                    </Badge>
                                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded flex items-center gap-1 text-foreground border">
                                        <ExternalLink className="h-3 w-3" />
                                        {wallet.user_external_id}
                                    </code>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    User ID: {wallet.user_id}
                                </div>
                            </div>
                        </div>

                        {/* Balance Info */}
                        <div className="space-y-2">
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <WalletIcon className="h-4 w-4" />
                                Current Balance
                            </div>
                            <div className="space-y-1">
                                <div className={`text-2xl font-bold ${getBalanceColor(balance)}`}>
                                    {formatCurrency(wallet.balance)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Wallet ID: {wallet.id}
                                </div>
                            </div>
                        </div>

                        {/* Transaction Stats */}
                        <div className="space-y-2">
                            <div className="text-sm text-muted-foreground">Transaction Summary</div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-foreground">
                                    <span className="text-sm">Total Transactions:</span>
                                    <span className="font-semibold">{stats?.totalTransactions || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-foreground">Credits:</span>
                                    <span className="font-semibold text-emerald-500">{stats?.creditCount || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-foreground">Debits:</span>
                                    <span className="font-semibold text-destructive">{stats?.debitCount || 0}</span>
                                </div>
                            </div>
                        </div>

                        {/* Date Info */}
                        <div className="space-y-2">
                            <div className="text-sm text-muted-foreground">Wallet Dates</div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-foreground">
                                    <span className="text-sm">Created:</span>
                                    <span className="font-medium text-sm">
                                        {wallet.created_at ? new Date(wallet.created_at).toLocaleDateString() : "N/A"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-foreground">
                                    <span className="text-sm">Updated:</span>
                                    <span className="font-medium text-sm">
                                        {wallet.updated_at ? new Date(wallet.updated_at).toLocaleDateString() : "N/A"}
                                    </span>
                                </div>
                                {stats?.firstTransaction && (
                                    <div className="flex justify-between items-center text-foreground">
                                        <span className="text-sm">First TX:</span>
                                        <span className="font-medium text-sm">
                                            {stats.firstTransaction.toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    {stats && stats.totalTransactions > 0 && (
                        <>
                            <Separator className="my-4" />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                    <div className="text-sm text-emerald-500 mb-1">Total Credits</div>
                                    <div className="text-2xl font-bold text-emerald-600">
                                        {formatCurrency(stats.totalCredits)}
                                    </div>
                                </div>
                                <div className="text-center p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                                    <div className="text-sm text-destructive mb-1">Total Debits</div>
                                    <div className="text-2xl font-bold text-destructive">
                                        {formatCurrency(stats.totalDebits)}
                                    </div>
                                </div>
                                <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                                    <div className="text-sm text-primary mb-1">Net Change</div>
                                    <div className={`text-2xl font-bold ${stats.netChange >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                                        {stats.netChange >= 0 ? '+' : ''}{formatCurrency(stats.netChange)}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Platform Config Warning */}
            {platformConfig && balance < -parseFloat(platformConfig.max_negative_balance) && (
                <Card className="border-destructive/20 bg-destructive/10">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-semibold text-destructive">Balance Below Threshold</div>
                                <div className="text-sm text-destructive/80 mt-1">
                                    This user's balance ({formatCurrency(balance)}) is below the platform threshold of {formatCurrency(parseFloat(platformConfig.max_negative_balance) * -1)}.
                                    They cannot receive services until they top up.
                                </div>
                            </div>
                            <div className="text-sm">
                                <div className="text-destructive font-medium">Service Fee: {formatCurrency(platformConfig.service_fee)}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Transactions Table */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Transaction History</CardTitle>
                            <CardDescription className="text-muted-foreground">
                                {filteredTransactions.length} transactions shown
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            {wallet.transactions && wallet.transactions.length > 0 && (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.print()}
                                        className="gap-2"
                                    >
                                        <Printer className="h-4 w-4" />
                                        Print
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={exportToCSV}
                                        className="gap-2"
                                    >
                                        <FileDown className="h-4 w-4" />
                                        Export CSV
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 grid gap-4 md:grid-cols-3">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="justify-start text-left">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {startDate ? format(startDate, "MMM d, yyyy") : "Start date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <DatePicker mode="single" selected={startDate} onSelect={setStartDate} />
                            </PopoverContent>
                        </Popover>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="justify-start text-left">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {endDate ? format(endDate, "MMM d, yyyy") : "End date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <DatePicker mode="single" selected={endDate} onSelect={setEndDate} />
                            </PopoverContent>
                        </Popover>
                        <Button variant="ghost" onClick={() => { setStartDate(undefined); setEndDate(undefined) }}>
                            Clear Date Range
                        </Button>
                    </div>

                    {filteredTransactions.length === 0 ? (
                        <EmptyState
                            title="No transactions found"
                            description="No transactions match the selected date range."
                        />
                    ) : (
                        <div className="border border-border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50 border-b border-border">
                                        <TableHead className="font-semibold text-foreground">Transaction ID</TableHead>
                                        <TableHead className="font-semibold text-foreground">Date & Time</TableHead>
                                        <TableHead className="font-semibold text-foreground">Description</TableHead>
                                        <TableHead className="font-semibold text-foreground">Type</TableHead>
                                        <TableHead className="font-semibold text-foreground text-right">Amount</TableHead>
                                        <TableHead className="font-semibold text-foreground text-right">Running Balance</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTransactions.map((transaction, index) => {
                                        const amount = getSignedAmount(transaction)
                                        const isCredit = amount >= 0
                                        const transactionDate = new Date(transaction.created_at)

                                        // Calculate running balance
                                        const runningBalance = filteredTransactions
                                            .slice(0, index + 1)
                                            .reduce((sum, t) => sum + getSignedAmount(t), 0)

                                        return (
                                            <TableRow key={transaction.id} className="hover:bg-muted/30 border-b border-border transition-colors">
                                                <TableCell>
                                                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded text-foreground border">
                                                        {String(transaction.reference || transaction.id).replace(/^transaction_/, "TX").replace(/^payment_/, "PAY")}
                                                    </code>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-foreground">
                                                            <Calendar className="h-3 w-3 text-muted-foreground" />
                                                            <span>{transactionDate.toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <Clock className="h-3 w-3" />
                                                            <span>{transactionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium text-foreground">{transaction.reason}</div>
                                                    {transaction.status && <div className="text-xs text-muted-foreground">{transaction.status}</div>}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={cn("font-medium", getTransactionTypeColor(transaction, amount))}>
                                                        {getTransactionType(transaction, amount)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className={`font-bold ${isCredit ? 'text-emerald-500' : 'text-destructive'}`}>
                                                        {isCredit ? '+' : ''}{formatCurrency(transaction.amount)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className={`font-medium ${runningBalance >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                                                        {formatCurrency(runningBalance)}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Export/Print Options */}
            {wallet.transactions && wallet.transactions.length > 0 && (
                <Card className="bg-muted/30 border-border">
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="text-sm text-muted-foreground">
                                Showing {filteredTransactions.length} transactions for {wallet.user_username}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.print()}
                                >
                                    Print Transactions
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={exportToCSV}
                                >
                                    Export to CSV
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
