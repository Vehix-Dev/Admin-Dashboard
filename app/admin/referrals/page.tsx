"use client"

import { useEffect, useState } from "react"
import { DataTable, Column } from "@/components/management/data-table"
import { EmptyState } from "@/components/dashboard/empty-state"
import {
    getReferrals,
    deleteReferral,
    type Referral
} from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { RefreshCw, Trash2, UserPlus, Gift, TrendingUp } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function ReferralsPage() {
    const [referrals, setReferrals] = useState<Referral[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { toast } = useToast()

    const fetchReferrals = async () => {
        setIsLoading(true)
        try {
            const data = await getReferrals()
            setReferrals(data)
        } catch (err) {
            console.error("[v0] Referrals fetch error:", err)
            toast({
                title: "Error",
                description: "Failed to load referrals data.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchReferrals()
    }, [])

    const handleDelete = async (referral: Referral) => {
        if (!confirm(`Are you sure you want to delete this referral?`)) return
        try {
            await deleteReferral(referral.id)
            toast({
                title: "Success",
                description: "Referral deleted successfully"
            })
            fetchReferrals()
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message || "Failed to delete referral",
                variant: "destructive"
            })
        }
    }

    // Stats
    const totalReferrals = referrals.length
    const totalPaid = referrals
        .filter(r => r.status === 'PAID' || r.status === 'COMPLETED')
        .reduce((acc, curr) => acc + parseFloat(curr.reward_amount || '0'), 0)
    const pendingCount = referrals.filter(r => r.status === 'PENDING').length

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-UG', {
            style: 'currency',
            currency: 'UGX',
            minimumFractionDigits: 0
        }).format(amount)
    }

    const columns: Column<Referral>[] = [
        {
            header: "Referrer",
            accessor: "referrer_username",
            cell: (value: string) => <span className="font-medium">{value}</span>
        },
        {
            header: "Referee",
            accessor: "referee_username",
            cell: (value: string) => <span className="font-medium">{value}</span>
        },
        {
            header: "Reward",
            accessor: "reward_amount",
            cell: (value: string) => formatCurrency(parseFloat(value || '0'))
        },
        {
            header: "Status",
            accessor: "status",
            cell: (value: string) => {
                const colors: Record<string, string> = {
                    'PENDING': 'bg-yellow-100 text-yellow-800',
                    'PAID': 'bg-green-100 text-green-800',
                    'COMPLETED': 'bg-green-100 text-green-800',
                    'REJECTED': 'bg-red-100 text-red-800'
                }
                return (
                    <Badge variant="secondary" className={colors[value] || 'bg-gray-100'}>
                        {value}
                    </Badge>
                )
            }
        },
        {
            header: "Date",
            accessor: "created_at",
            cell: (value: string) => new Date(value).toLocaleDateString()
        },
        {
            header: "Actions",
            accessor: "id",
            cell: (_: any, row: Referral) => (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(row)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            ),
        },
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Referrals</h1>
                    <p className="text-gray-600 mt-1">Track user referrals and rewards</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchReferrals}
                    className="gap-2 border-gray-300"
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalReferrals}</div>
                        <p className="text-xs text-muted-foreground">All time referrals</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
                        <Gift className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
                        <p className="text-xs text-muted-foreground">Rewards distributed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Rewards</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingCount}</div>
                        <p className="text-xs text-muted-foreground">Referrals awaiting payout</p>
                    </CardContent>
                </Card>
            </div>

            {isLoading ? (
                <Skeleton className="h-96 rounded" />
            ) : referrals.length === 0 ? (
                <EmptyState
                    title="No referrals found"
                    description="When users invite others, referrals will appear here."
                    icon={UserPlus}
                />
            ) : (
                <DataTable
                    data={referrals}
                    columns={columns}
                    searchable={true}
                    searchPlaceholder="Search by username..."
                    itemsPerPage={10}
                />
            )}
        </div>
    )
}
