"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

interface Transaction {
    id: number
    amount: string
    reason: string
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
                    router.push("/admin/wallet")
                    return
                }

                setWallet(walletData)
                setPlatformConfig(configData)

            } catch (err: any) {
                console.error("Failed to fetch data:", err)
                toast({
                    title: "Error",
                    description: "Failed to load wallet transaction data.",
                    variant: "destructive",
                })
                router.push("/admin/wallet")
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
        if (balance > 0) return "text-green-600"
        if (balance === 0) return "text-gray-600"
        if (balance < 0 && balance >= -10000) return "text-yellow-600"
        return "text-red-600"
    }

    const getTransactionType = (amount: number) => {
        return amount >= 0 ? "Credit" : "Debit"
    }

    const getTransactionTypeColor = (amount: number) => {
        return amount >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
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
        return role === 'RIDER' ? 'bg-blue-100 text-blue-800' :
            role === 'RODIE' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
    }

    const calculateStats = () => {
        if (!wallet) return null

        const transactions = wallet.transactions || []
        const totalCredits = transactions
            .filter(t => parseFloat(t.amount) >= 0)
            .reduce((sum, t) => sum + parseFloat(t.amount), 0)

        const totalDebits = transactions
            .filter(t => parseFloat(t.amount) < 0)
            .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0)

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
            creditCount: transactions.filter(t => parseFloat(t.amount) >= 0).length,
            debitCount: transactions.filter(t => parseFloat(t.amount) < 0).length,
        }
    }

    const stats = calculateStats()

    const exportToCSV = () => {
        if (!wallet || !wallet.transactions || wallet.transactions.length === 0) return

        const headers = ['ID', 'Date', 'Time', 'Description', 'Type', 'Amount (UGX)', 'Running Balance (UGX)']
        const csvData = wallet.transactions.map((t, index) => {
            const amount = parseFloat(t.amount)
            const date = new Date(t.created_at)
            const runningBalance = wallet.transactions
                .slice(0, index + 1)
                .reduce((sum, tx) => sum + parseFloat(tx.amount), 0)

            return [
                t.id,
                date.toLocaleDateString(),
                date.toLocaleTimeString(),
                `"${t.reason}"`,
                amount >= 0 ? 'Credit' : 'Debit',
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
                    <Button onClick={() => router.push("/admin/wallet")} className="gap-2">
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
                        onClick={() => router.push("/admin/wallet")}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Wallets
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Transaction Details</h1>
                        <p className="text-gray-600 mt-1">
                            Transaction history for {wallet.user_username}
                        </p>
                    </div>
                </div>
            </div>

            {/* Wallet Summary Card */}
            <Card className="bg-white border border-gray-200 shadow-sm">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* User Info */}
                        <div className="space-y-2">
                            <div className="text-sm text-gray-500 flex items-center gap-2">
                                <User className="h-4 w-4" />
                                User Information
                            </div>
                            <div className="space-y-1">
                                <div className="font-semibold text-lg">{wallet.user_username}</div>
                                <div className="flex items-center gap-2">
                                    <Badge className={getUserRoleColor()}>
                                        {getUserRoleLabel()}
                                    </Badge>
                                    <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                                        <ExternalLink className="h-3 w-3" />
                                        {wallet.user_external_id}
                                    </code>
                                </div>
                                <div className="text-sm text-gray-500">
                                    User ID: {wallet.user_id}
                                </div>
                            </div>
                        </div>

                        {/* Balance Info */}
                        <div className="space-y-2">
                            <div className="text-sm text-gray-500 flex items-center gap-2">
                                <WalletIcon className="h-4 w-4" />
                                Current Balance
                            </div>
                            <div className="space-y-1">
                                <div className={`text-2xl font-bold ${getBalanceColor(balance)}`}>
                                    {formatCurrency(wallet.balance)}
                                </div>
                                <div className="text-sm text-gray-500">
                                    Wallet ID: {wallet.id}
                                </div>
                            </div>
                        </div>

                        {/* Transaction Stats */}
                        <div className="space-y-2">
                            <div className="text-sm text-gray-500">Transaction Summary</div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Total Transactions:</span>
                                    <span className="font-semibold">{stats?.totalTransactions || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Credits:</span>
                                    <span className="font-semibold text-green-600">{stats?.creditCount || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Debits:</span>
                                    <span className="font-semibold text-red-600">{stats?.debitCount || 0}</span>
                                </div>
                            </div>
                        </div>

                        {/* Date Info */}
                        <div className="space-y-2">
                            <div className="text-sm text-gray-500">Wallet Dates</div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Created:</span>
                                    <span className="font-medium text-sm">
                                        {new Date(wallet.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Updated:</span>
                                    <span className="font-medium text-sm">
                                        {new Date(wallet.updated_at).toLocaleDateString()}
                                    </span>
                                </div>
                                {stats?.firstTransaction && (
                                    <div className="flex justify-between items-center">
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
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <div className="text-sm text-green-700 mb-1">Total Credits</div>
                                    <div className="text-2xl font-bold text-green-800">
                                        {formatCurrency(stats.totalCredits)}
                                    </div>
                                </div>
                                <div className="text-center p-4 bg-red-50 rounded-lg">
                                    <div className="text-sm text-red-700 mb-1">Total Debits</div>
                                    <div className="text-2xl font-bold text-red-800">
                                        {formatCurrency(stats.totalDebits)}
                                    </div>
                                </div>
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <div className="text-sm text-blue-700 mb-1">Net Change</div>
                                    <div className={`text-2xl font-bold ${stats.netChange >= 0 ? 'text-green-800' : 'text-red-800'}`}>
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
                <Card className="bg-red-50 border-red-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-semibold text-red-800">Balance Below Threshold</div>
                                <div className="text-sm text-red-600 mt-1">
                                    This user's balance ({formatCurrency(balance)}) is below the platform threshold of {formatCurrency(parseFloat(platformConfig.max_negative_balance) * -1)}.
                                    They cannot receive services until they top up.
                                </div>
                            </div>
                            <div className="text-sm">
                                <div className="text-red-800 font-medium">Service Fee: {formatCurrency(platformConfig.service_fee)}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Transactions Table */}
            <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Transaction History</CardTitle>
                            <CardDescription>
                                {wallet.transactions?.length || 0} transactions recorded
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
                    {!wallet.transactions || wallet.transactions.length === 0 ? (
                        <EmptyState
                            title="No transactions found"
                            description="This wallet has no recorded transactions yet."
                            compact={true}
                        />
                    ) : (
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead className="font-semibold">Transaction ID</TableHead>
                                        <TableHead className="font-semibold">Date & Time</TableHead>
                                        <TableHead className="font-semibold">Description</TableHead>
                                        <TableHead className="font-semibold">Type</TableHead>
                                        <TableHead className="font-semibold text-right">Amount</TableHead>
                                        <TableHead className="font-semibold text-right">Running Balance</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {wallet.transactions.map((transaction, index) => {
                                        const amount = parseFloat(transaction.amount)
                                        const isCredit = amount >= 0
                                        const transactionDate = new Date(transaction.created_at)

                                        // Calculate running balance
                                        const runningBalance = wallet.transactions
                                            .slice(0, index + 1)
                                            .reduce((sum, t) => sum + parseFloat(t.amount), 0)

                                        return (
                                            <TableRow key={transaction.id} className="hover:bg-gray-50">
                                                <TableCell>
                                                    <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                                                        TX{transaction.id.toString().padStart(4, '0')}
                                                    </code>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-3 w-3 text-gray-400" />
                                                            <span>{transactionDate.toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                                            <Clock className="h-3 w-3" />
                                                            <span>{transactionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{transaction.reason}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={getTransactionTypeColor(amount)}>
                                                        {getTransactionType(amount)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className={`font-bold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                                                        {isCredit ? '+' : ''}{formatCurrency(transaction.amount)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className={`font-medium ${runningBalance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
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
                <Card className="bg-gray-50 border-gray-200">
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="text-sm text-gray-600">
                                Showing {wallet.transactions.length} transactions for {wallet.user_username}
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