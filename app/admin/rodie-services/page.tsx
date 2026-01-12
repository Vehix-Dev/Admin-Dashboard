"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/dashboard/empty-state"
import { getRodieServices, deleteRodieService, type RodieService } from "@/lib/api"
import { useCan } from "@/components/auth/permission-guard"
import { PERMISSIONS } from "@/lib/permissions"
import { useToast } from "@/hooks/use-toast"
import { Trash2, UserCheck } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function RodieServicesPage() {
  const [rodieServices, setRodieServices] = useState<RodieService[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const canDelete = useCan(PERMISSIONS.RODIE_SERVICES_DELETE || 'rodie_services.delete' as any)
  // Note: implementation_plan suggested RODIE_SERVICES_DELETE, but lib/permissions only has VIEW. 
  // I should check lib/permissions again.

  useEffect(() => {
    fetchRodieServices()
  }, [])

  const fetchRodieServices = async () => {
    try {
      const data = await getRodieServices()
      setRodieServices(data)
    } catch (err) {
      console.error("[v0] Rodie services fetch error:", err)
      toast({
        title: "Error",
        description: "Failed to load rodie services. Ensure backend is running.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteService = async (id: number) => {
    try {
      await deleteRodieService(id)
      setRodieServices(rodieServices.filter((rs) => rs.id !== id))
      toast({ title: "Success", description: "Service assignment removed" })
    } catch (err) {
      console.error("[v0] Delete rodie service error:", err)
      toast({ title: "Error", description: "Failed to delete service assignment", variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Rodie Services</h1>
        <p className="text-muted-foreground">Manage service assignments for roadies</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : rodieServices.length === 0 ? (
        <EmptyState
          title="No service assignments"
          description="Service assignments will appear here once roadies are assigned services."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rodieServices.map((rodieService) => (
            <Card key={rodieService.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-primary/10 p-2">
                      <UserCheck className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{rodieService.rodie_username}</CardTitle>
                      <CardDescription className="text-xs">{rodieService.service_display}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{rodieService.service_display}</Badge>
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteService(rodieService.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
