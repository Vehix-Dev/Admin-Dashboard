"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable, Column } from "@/components/management/data-table"
import { EmptyState } from "@/components/dashboard/empty-state"
import {
  getWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  type WithdrawalRequest
} from "@/lib/api"
import { useCan } from "@/components/auth/permission-guard"
import { PERMISSIONS } from "@/lib/permissions"
import { useToast } from "@/hooks/use-toast"
import {
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar as CalendarIcon,
  AlertCircle,
  ArrowRight
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function WithdrawalsPage() {
  const router = useRouter()
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("PENDING")
  const { toast } = useToast()
  const canView = useCan(PERMISSIONS.WITHDRAWALS_VIEW)
  const canManage = useCan(PERMISSIONS.WITHDRAWALS_MANAGE)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const data = await getWithdrawals(statusFilter)
      setWithdrawals(data)
    } catch (error) {
      console.error("Failed to fetch withdrawals:", error)
      toast({
        title: "Error",
        description: "Failed to load withdrawal requests",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (canView) {
      fetchData()
    }
  }, [statusFilter, canView])

  const handleApprove = async (id: number) => {
    try {
      await approveWithdrawal(id)
      toast({
        title: "Success",
        description: "Withdrawal approved successfully"
      })
      fetchData()
    } catch (error) {
      console.error("Failed to approve withdrawal:", error)
      toast({
        title: "Error",
        description: "Failed to approve withdrawal",
        variant: "destructive"
      })
    }
  }

  const handleReject = async (id: number, reason?: string) => {
    try {
      await rejectWithdrawal(id, reason)
      toast({
        title: "Success",
        description: "Withdrawal rejected and refunded"
      })
      fetchData()
    } catch (error) {
      console.error("Failed to reject withdrawal:", error)
      toast({
        title: "Error",
        description: "Failed to reject withdrawal",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      PENDING: "default",
      COMPLETED: "secondary",
      FAILED: "destructive",
      CANCELLED: "outline"
    }
    return (
      <Badge variant={variants[status] || "default"}>
        {status}
      </Badge>
    )
  }

  const columns: Column<WithdrawalRequest>[] = [
    {
      header: "User",
      accessor: "user_details",
      cell: (value, row) => {
        const profilePhoto = row.user_details?.profile_photo
        console.log('Profile photo for', row.user_details?.username, ':', profilePhoto)
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profilePhoto || undefined} />
              <AvatarFallback>
                {row.user_details?.username?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{row.user_details?.username || "Unknown"}</div>
              <div className="text-xs text-muted-foreground">{row.user_details?.external_id || "N/A"}</div>
            </div>
          </div>
        )
      }
    },
    {
      header: "Role",
      accessor: "user_details",
      cell: (value, row) => (
        <Badge variant="outline">{row.user_details?.role || "Unknown"}</Badge>
      )
    },
    {
      header: "Amount",
      accessor: "amount",
      cell: (value, row) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold">UGX {parseFloat(row.amount).toLocaleString()}</span>
        </div>
      )
    },
    {
      header: "Date",
      accessor: "created_at",
      cell: (value, row) => (
        <div className="flex items-center gap-2 text-sm">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          {format(new Date(row.created_at), "MMM dd, yyyy HH:mm")}
        </div>
      )
    },
    {
      header: "Status",
      accessor: "status",
      cell: (value, row) => getStatusBadge(row.status)
    },
    {
      header: "Reference",
      accessor: "reference",
      cell: (value, row) => (
        <span className="text-xs font-mono text-muted-foreground">{row.reference}</span>
      )
    },
    {
      header: "Actions",
      accessor: "id",
      cell: (value, row) => (
        <div className="flex items-center gap-2">
          {row.status === "PENDING" && canManage && (
            <>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="default" className="h-8">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Approve Withdrawal</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to approve this withdrawal of {parseFloat(row.amount).toLocaleString()} from {row.user_details?.username}?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleApprove(row.id)}>
                      Approve
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive" className="h-8">
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reject Withdrawal</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to reject this withdrawal? The amount will be refunded to the user's wallet.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleReject(row.id)}>
                      Reject
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
          {row.status !== "PENDING" && (
            <span className="text-xs text-muted-foreground">
              {row.status === "COMPLETED" ? "Processed" : "Closed"}
            </span>
          )}
        </div>
      )
    }
  ]

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Access Denied</h3>
          <p className="text-muted-foreground">You don't have permission to view withdrawals</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Withdrawals</h1>
            <p className="text-muted-foreground">Manage user withdrawal requests</p>
          </div>
        </div>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Withdrawals</h1>
          <p className="text-muted-foreground">Manage user withdrawal requests</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={statusFilter === "PENDING" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("PENDING")}
          >
            <Clock className="h-4 w-4 mr-2" />
            Pending
          </Button>
          <Button
            variant={statusFilter === "COMPLETED" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("COMPLETED")}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Completed
          </Button>
          <Button
            variant={statusFilter === "" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("")}
          >
            All
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {withdrawals.filter(w => w.status === "PENDING").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {withdrawals.filter(w => w.status === "COMPLETED" && 
                new Date(w.updated_at).toDateString() === new Date().toDateString()
              ).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pending Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              UGX {withdrawals
                .filter(w => w.status === "PENDING")
                .reduce((sum, w) => sum + parseFloat(w.amount), 0)
                .toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {withdrawals.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No withdrawal requests"
          description={statusFilter === "PENDING" ? "No pending withdrawal requests found" : "No withdrawal requests found"}
        />
      ) : (
        <DataTable
          data={withdrawals}
          columns={columns}
        />
      )}
    </div>
  )
}
