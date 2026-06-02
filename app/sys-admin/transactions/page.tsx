"use client"

import { useEffect, useState } from "react"
import { DataTable, Column } from "@/components/management/data-table"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import ProtectedRoute from "@/components/auth/protected-route"
import { PERMISSIONS } from "@/lib/permissions"
import { format } from "date-fns"
import { ArrowLeft, CreditCard, Search, Loader2, Activity, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { getWallets, type Wallet, type WalletTransaction } from "@/lib/api"
import { Badge } from "@/components/ui/badge"

interface TransactionWithWalletInfo extends WalletTransaction {
  walletId: number
  userId: number
  userUsername?: string
  userExternalId?: string
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionWithWalletInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [totalAmount, setTotalAmount] = useState(0)
  const [transactionCount, setTransactionCount] = useState(0)
  const { toast } = useToast()

  const fetchTransactions = async () => {
    setIsLoading(true)
    try {
      const wallets = await getWallets()

      // Flatten transactions from all wallets
      const allTransactions: TransactionWithWalletInfo[] = []
      let total = 0

      wallets.forEach((wallet: Wallet) => {
        if (wallet.transactions && wallet.transactions.length > 0) {
          wallet.transactions.forEach((transaction: WalletTransaction) => {
            allTransactions.push({
              ...transaction,
              walletId: wallet.id,
              userId: wallet.user || wallet.user_id || 0,
              userUsername: wallet.user_username,
              userExternalId: wallet.user_external_id,
            })

            // Calculate total
            try {
              const amount = parseFloat(String(transaction.amount))
              total += isNaN(amount) ? 0 : amount
            } catch {
              // Skip invalid amounts
            }
          })
        }
      })

      // Sort by created_at descending (newest first)
      allTransactions.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      setTransactions(allTransactions)
      setTransactionCount(allTransactions.length)
      setTotalAmount(total)
    } catch (error) {
      console.error("Error fetching transactions:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load transactions",
        variant: "destructive",
      })
      setTransactions([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  // Filter transactions based on search
  const filteredTransactions = transactions.filter((transaction) => {
    const searchLower = search.toLowerCase()
    return (
      transaction.reason?.toLowerCase().includes(searchLower) ||
      transaction.userUsername?.toLowerCase().includes(searchLower) ||
      transaction.userExternalId?.toLowerCase().includes(searchLower) ||
      transaction.amount?.toString().includes(searchLower) ||
      transaction.id?.toString().includes(searchLower)
    )
  })

  const getReasonBadgeColor = (reason: string) => {
    const lowerReason = reason?.toLowerCase() || ""

    if (
      lowerReason.includes("credit") ||
      lowerReason.includes("deposit") ||
      lowerReason.includes("refund") ||
      lowerReason.includes("bonus")
    ) {
      return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/20"
    }

    if (
      lowerReason.includes("debit") ||
      lowerReason.includes("withdrawal") ||
      lowerReason.includes("fee") ||
      lowerReason.includes("charge")
    ) {
      return "bg-red-500/10 text-red-700 border-red-500/20 hover:bg-red-500/20"
    }

    return "bg-blue-500/10 text-blue-700 border-blue-500/20 hover:bg-blue-500/20"
  }

  const getAmountIcon = (amount: string) => {
    try {
      const num = parseFloat(String(amount))
      return num >= 0 ? (
        <TrendingUp className="h-4 w-4 text-emerald-500" />
      ) : (
        <TrendingDown className="h-4 w-4 text-red-500" />
      )
    } catch {
      return <DollarSign className="h-4 w-4 text-muted-foreground" />
    }
  }

  const formatAmount = (amount: string) => {
    try {
      const num = parseFloat(String(amount))
      const formatted = num.toFixed(2)
      const isPositive = num >= 0
      return (
        <span className={isPositive ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}>
          {isPositive ? "+" : ""}{formatted}
        </span>
      )
    } catch {
      return <span className="text-muted-foreground">{amount}</span>
    }
  }

  const columns: Column<TransactionWithWalletInfo>[] = [
    {
      header: "Date & Time",
      accessor: "created_at",
      cell: (value: string) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{format(new Date(value), "MMM d, yyyy")}</span>
          <span className="text-xs text-muted-foreground">{format(new Date(value), "HH:mm:ss")}</span>
        </div>
      ),
    },
    {
      header: "Transaction ID",
      accessor: "id",
      cell: (value: number) => (
        <span className="font-mono text-sm text-muted-foreground">#{value}</span>
      ),
    },
    {
      header: "User",
      accessor: "userUsername",
      cell: (value: string, row: TransactionWithWalletInfo) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{value || "Unknown"}</span>
          <span className="text-xs text-muted-foreground">{row.userExternalId || `ID: ${row.userId}`}</span>
        </div>
      ),
    },
    {
      header: "Reason",
      accessor: "reason",
      cell: (value: string) => (
        <Badge className={`capitalize ${getReasonBadgeColor(value)}`}>
          {value || "Unknown"}
        </Badge>
      ),
    },
    {
      header: "Amount",
      accessor: "amount",
      cell: (value: string, row: TransactionWithWalletInfo) => (
        <div className="flex items-center gap-2">
          {getAmountIcon(value)}
          {formatAmount(value)}
        </div>
      ),
    },
    {
      header: "Wallet",
      accessor: "walletId",
      cell: (value: number) => (
        <span className="font-mono text-xs text-muted-foreground">Wallet #{value}</span>
      ),
    },
  ]

  return (
    <ProtectedRoute requiredPermissions={PERMISSIONS.TRANSACTIONS_VIEW}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <CreditCard className="h-8 w-8 text-primary" />
              </div>
              Transactions
            </h1>
            <p className="text-muted-foreground mt-2">
              System transaction history — {transactionCount.toLocaleString()} transaction{transactionCount !== 1 ? "s" : ""}
            </p>
          </div>
          <Link href="/sys-admin">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold">{transactionCount.toLocaleString()}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">{totalAmount.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-emerald-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Average Transaction</p>
                  <p className="text-2xl font-bold">
                    {transactionCount > 0 ? (totalAmount / transactionCount).toFixed(2) : "0.00"}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Card */}
        <Card>
          <CardContent className="p-4">
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">SEARCH</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, reason, amount, or transaction ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading transactions...</span>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <EmptyState
            title={search ? "No matching transactions" : "No transactions found"}
            description={
              search
                ? "Try adjusting your search criteria"
                : "Wallet transactions will appear here"
            }
            icon={Activity}
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <DataTable data={filteredTransactions} columns={columns} />
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  )
}
