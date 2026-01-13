"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/dashboard/empty-state"
import {
    getWallets,
    getPlatformConfig,
    updatePlatformConfig,
    PlatformConfig
} from "@/lib/api"
import { useCan } from "@/components/auth/permission-guard"
import { PERMISSIONS } from "@/lib/permissions"
import { useToast } from "@/hooks/use-toast"
import { TrendingUp, TrendingDown, DollarSign, Eye, ExternalLink, Wallet as WalletIcon, User, Users, ArrowRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Updated Wallet interface to match new API response
interface WalletWithUser {
    id: number
    user_id: number
    user_external_id: string | null
    user_username: string
    balance: string
    transactions: Array<{
        id: number
        amount: string
        reason: string
        created_at: string
    }>
    created_at: string
    updated_at: string
}

export default function WalletsPage() {
    const router = useRouter()
    const [wallets, setWallets] = useState<WalletWithUser[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [platformConfig, setPlatformConfig] = useState<PlatformConfig | null>(null)
    const { toast } = useToast()
    const canView = useCan(PERMISSIONS.WALLET_VIEW)

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const walletsData = await getWallets() as unknown as WalletWithUser[]
            const configData = await getPlatformConfig()

            // Filter wallets to only show Riders (R prefix) and Roadies (BS prefix)
            const filteredWallets = walletsData.filter(wallet => {
                const externalId = wallet.user_external_id
                return externalId && (externalId.startsWith('R') || externalId.startsWith('BS'))
            })

            setWallets(filteredWallets)
            setPlatformConfig(configData)

        } catch (err: any) {
            console.error("Failed to fetch data:", err)
            toast({
                title: "Error",
                description: "Failed to load wallet data.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    // Filter wallets based on search query
    const filteredWallets = wallets.filter(wallet => {
        const searchLower = searchQuery.toLowerCase()
        return (
            wallet.user_username.toLowerCase().includes(searchLower) ||
            (wallet.user_external_id && wallet.user_external_id.toLowerCase().includes(searchLower)) ||
            wallet.user_id.toString().includes(searchLower)
        )
    })

    // Separate wallets by type
    const riderWallets = wallets.filter(w => w.user_external_id?.startsWith('R'))
    const roadieWallets = wallets.filter(w => w.user_external_id?.startsWith('BS'))

    // Calculate statistics
    const calculateStats = () => {
        if (wallets.length === 0) {
            return {
                totalWallets: 0,
                totalBalance: 0,
                averageBalance: 0,
                positiveBalanceCount: 0,
                negativeBalanceCount: 0,
                zeroBalanceCount: 0,
                totalRiders: 0,
                totalRoadies: 0,
                totalTransactions: 0,
            }
        }

        const totalBalance = wallets.reduce((sum, wallet) => {
            return sum + parseFloat(wallet.balance)
        }, 0)

        const positiveBalanceCount = wallets.filter(wallet =>
            parseFloat(wallet.balance) > 0
        ).length

        const negativeBalanceCount = wallets.filter(wallet =>
            parseFloat(wallet.balance) < 0
        ).length

        const zeroBalanceCount = wallets.filter(wallet =>
            parseFloat(wallet.balance) === 0
        ).length

        const totalTransactions = wallets.reduce((sum, wallet) => {
            return sum + (wallet.transactions?.length || 0)
        }, 0)

        return {
            totalWallets: wallets.length,
            totalBalance,
            averageBalance: wallets.length > 0 ? totalBalance / wallets.length : 0,
            positiveBalanceCount,
            negativeBalanceCount,
            zeroBalanceCount,
            totalRiders: riderWallets.length,
            totalRoadies: roadieWallets.length,
            totalTransactions,
        }
    }

    const stats = calculateStats()

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

    const getBalanceBadge = (balance: number) => {
        if (balance > 0) {
            return <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-400">Positive</Badge>
        } else if (balance === 0) {
            return <Badge variant="outline" className="border-border bg-muted text-muted-foreground">Zero</Badge>
        } else if (balance < 0 && balance >= -10000) {
            return <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-400">Warning</Badge>
        } else {
            return <Badge variant="outline" className="border-destructive/20 bg-destructive/10 text-destructive dark:border-destructive/30 dark:bg-destructive/20 dark:text-red-400">Critical</Badge>
        }
    }

    const getUserRole = (wallet: WalletWithUser) => {
        if (wallet.user_external_id?.startsWith('R')) return 'RIDER'
        if (wallet.user_external_id?.startsWith('BS')) return 'RODIE'
        return 'UNKNOWN'
    }

    const getUserRoleLabel = (wallet: WalletWithUser) => {
        const role = getUserRole(wallet)
        return role === 'RIDER' ? 'Rider' : role === 'RODIE' ? 'Roadie' : 'User'
    }

    const getUserRoleColor = (wallet: WalletWithUser) => {
        const role = getUserRole(wallet)
        return role === 'RIDER' ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-400' :
            role === 'RODIE' ? 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/30 dark:bg-purple-900/20 dark:text-purple-400' :
                'border-border bg-muted text-muted-foreground'
    }

    const getTransactionCount = (wallet: WalletWithUser) => {
        return wallet.transactions?.length || 0
    }

    const handleViewDetails = (walletId: number) => {
        router.push(`/admin/wallet/${walletId}`)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Wallets Management</h1>
                    <p className="text-muted-foreground mt-2">
                        View Rider and Roadie wallet balances
                    </p>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-card border-border shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <WalletIcon className="h-4 w-4" />
                            Total Wallets
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">
                            {isLoading ? <Skeleton className="h-8 w-16" /> : stats.totalWallets}
                        </div>
                        <CardDescription className="text-xs text-muted-foreground mt-1">
                            {stats.totalRiders} riders, {stats.totalRoadies} roadies
                        </CardDescription>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Total Balance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-bold ${stats.totalBalance >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                            {isLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(stats.totalBalance)}
                        </div>
                        <CardDescription className="text-xs text-muted-foreground mt-1">
                            Combined wallet value
                        </CardDescription>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Positive Wallets
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-500">
                            {isLoading ? <Skeleton className="h-8 w-12" /> : stats.positiveBalanceCount}
                        </div>
                        <CardDescription className="text-xs text-muted-foreground mt-1">
                            {stats.totalWallets > 0 ? `${((stats.positiveBalanceCount / stats.totalWallets) * 100).toFixed(1)}% of wallets` : 'No wallets'}
                        </CardDescription>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <TrendingDown className="h-4 w-4" />
                            Negative Wallets
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-destructive">
                            {isLoading ? <Skeleton className="h-8 w-12" /> : stats.negativeBalanceCount}
                        </div>
                        <CardDescription className="text-xs text-muted-foreground mt-1">
                            {stats.totalWallets > 0 ? `${((stats.negativeBalanceCount / stats.totalWallets) * 100).toFixed(1)}% of wallets` : 'No wallets'}
                        </CardDescription>
                    </CardContent>
                </Card>
            </div>

            {/* Platform Config Info */}
            {platformConfig && (
                <Card className="bg-primary/10 border-primary/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-primary">Platform Configuration</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-primary/70 font-medium">Max Negative Balance: </span>
                                <span className="font-bold text-primary">{formatCurrency(platformConfig.max_negative_balance)}</span>
                            </div>
                            <div>
                                <span className="text-primary/70 font-medium">Service Fee: </span>
                                <span className="font-bold text-primary">{formatCurrency(platformConfig.service_fee)}</span>
                            </div>
                        </div>
                        <p className="text-xs text-primary/70 mt-2">
                            Users with balance below {formatCurrency(parseFloat(platformConfig.max_negative_balance) * -1)} cannot receive services
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Role Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-card border-border shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Rider Wallets
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-500">
                            {isLoading ? <Skeleton className="h-7 w-12" /> : stats.totalRiders}
                        </div>
                        <CardDescription className="text-xs text-muted-foreground mt-1">
                            Total balance: {formatCurrency(riderWallets.reduce((sum, w) => sum + parseFloat(w.balance), 0))}
                        </CardDescription>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Roadie Wallets
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-500">
                            {isLoading ? <Skeleton className="h-7 w-12" /> : stats.totalRoadies}
                        </div>
                        <CardDescription className="text-xs text-muted-foreground mt-1">
                            Total balance: {formatCurrency(roadieWallets.reduce((sum, w) => sum + parseFloat(w.balance), 0))}
                        </CardDescription>
                    </CardContent>
                </Card>
            </div>

            {/* Main Table */}
            <Card className="bg-card border-border shadow-sm">
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-foreground">User Wallets</CardTitle>
                            <CardDescription className="text-muted-foreground">
                                View Rider and Roadie wallet balances
                            </CardDescription>
                        </div>
                        <div className="w-full md:w-64">
                            <Input
                                placeholder="Search by username or external ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-background"
                                disabled={isLoading || wallets.length === 0}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : filteredWallets.length === 0 ? (
                        <EmptyState
                            title={searchQuery ? "No wallets match your search" : "No wallet data available"}
                            description={
                                searchQuery
                                    ? "Try a different search term"
                                    : "No rider or roadie wallets found"
                            }
                        />
                    ) : (
                        <>
                            <div className="border border-border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50 border-b border-border">
                                            <TableHead className="font-semibold text-foreground">User</TableHead>
                                            <TableHead className="font-semibold text-foreground">External ID</TableHead>
                                            <TableHead className="font-semibold text-foreground">Role</TableHead>
                                            <TableHead className="font-semibold text-foreground">Wallet Balance</TableHead>
                                            <TableHead className="font-semibold text-foreground">Status</TableHead>
                                            <TableHead className="font-semibold text-foreground">Transactions</TableHead>
                                            <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredWallets.map((wallet) => {
                                            const balance = parseFloat(wallet.balance)
                                            const transactionCount = getTransactionCount(wallet)
                                            const roleColor = getUserRoleColor(wallet)
                                            const roleLabel = getUserRoleLabel(wallet)

                                            return (
                                                <TableRow key={wallet.id} className="hover:bg-muted/30 border-b border-border transition-colors">
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            <div className="font-medium text-foreground">
                                                                {wallet.user_username}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                ID: {wallet.user_id}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                                            <code className="text-sm font-mono bg-muted px-2 py-1 rounded text-foreground">
                                                                {wallet.user_external_id}
                                                            </code>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={`${roleColor} capitalize font-medium border-2`}>
                                                            {roleLabel.toLowerCase()}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            <div className={`text-lg font-bold ${getBalanceColor(balance)}`}>
                                                                {formatCurrency(wallet.balance)}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getBalanceBadge(balance)}
                                                        {platformConfig && balance < -parseFloat(platformConfig.max_negative_balance) && (
                                                            <div className="text-xs text-destructive mt-1 font-medium">
                                                                Below threshold
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm">
                                                            {transactionCount > 0 ? (
                                                                <div className="space-y-1">
                                                                    <div className="text-foreground">{transactionCount} transaction{transactionCount !== 1 ? 's' : ''}</div>
                                                                    {transactionCount > 0 && (
                                                                        <div className="text-xs text-muted-foreground">
                                                                            Last: {new Date(wallet.transactions[0].created_at).toLocaleDateString()}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="text-xs text-muted-foreground">No transactions</div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="gap-2"
                                                            onClick={() => handleViewDetails(wallet.id)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                            View Details
                                                            <ArrowRight className="h-3 w-3 ml-1" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            {!isLoading && filteredWallets.length > 0 && (
                                <div className="flex flex-col md:flex-row items-center justify-between mt-4 text-sm text-muted-foreground gap-2">
                                    <div>
                                        Showing {filteredWallets.length} of {wallets.length} wallets
                                        {searchQuery && ` matching "${searchQuery}"`}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                            <span>Positive Balance</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                            <span>Warning ({platformConfig ? `>-${formatCurrency(platformConfig.max_negative_balance)}` : '>-10,000'})</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-destructive"></div>
                                            <span>Critical ({platformConfig ? `<-${formatCurrency(platformConfig.max_negative_balance)}` : '<-10,000'})</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}