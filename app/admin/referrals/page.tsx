"use client"

import { useEffect, useState } from "react"
import { DataTable, Column } from "@/components/management/data-table"
import { EmptyState } from "@/components/dashboard/empty-state"
import {
    getReferrals,
    deleteReferral,
    type Referral
} from "@/lib/api"
import { useCan } from "@/components/auth/permission-guard"
import { PERMISSIONS } from "@/lib/permissions"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Trash2, UserPlus, Gift, TrendingUp } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function ReferralsPage() {
    const [referrals, setReferrals] = useState<Referral[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { toast } = useToast()
    const canManage = useCan(PERMISSIONS.REFERRALS_MANAGE)

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
                    'PENDING': 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/30 dark:bg-yellow-900/20 dark:text-yellow-400',
                    'PAID': 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/30 dark:bg-green-900/20 dark:text-green-400',
                    'COMPLETED': 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/30 dark:bg-green-900/20 dark:text-green-400',
                    'REJECTED': 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400'
                }
                return (
                    <Badge variant="outline" className={`capitalize font-medium border-2 ${colors[value] || 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-800/20 dark:text-gray-400'}`}>
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
            cell: (_: any, row: Referral) => canManage ? (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(row)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            ) : null,
        },
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Referrals</h1>
                    <p className="text-muted-foreground mt-1">Track user referrals and rewards</p>
                </div>
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
                />
            )}
        </div>
    )
}
