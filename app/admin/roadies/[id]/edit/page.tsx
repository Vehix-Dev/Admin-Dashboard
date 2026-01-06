"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { getRoadieById, updateRoadie, type Roadie } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Check } from "lucide-react"
import Link from "next/link"

export default function EditRoadiePage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [roadie, setRoadie] = useState<Roadie | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    username: "",
    nin: "",
    is_approved: false,
  })

  useEffect(() => {
    const fetchRoadie = async () => {
      try {
        const data = await getRoadieById(Number(params.id))
        setRoadie(data)
        setFormData({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          username: data.username,
          nin: data.nin || "",
          is_approved: data.is_approved,
        })
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to load roadie",
          variant: "destructive",
        })
        router.push("/admin/roadies")
      } finally {
        setIsLoading(false)
      }
    }

    fetchRoadie()
  }, [params.id, router, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await updateRoadie(Number(params.id), formData)
      toast({
        title: "Success",
        description: "Roadie updated successfully",
      })
      router.push("/admin/roadies")
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update roadie",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/roadies">
        <Button variant="ghost" className="gap-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100">
          <ArrowLeft className="h-4 w-4" />
          Back to Roadies
        </Button>
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-800">Edit Roadie</h1>
        <p className="text-gray-600 mt-1">{roadie?.external_id}</p>
      </div>

      <div className="bg-white border border-gray-200 rounded p-6 shadow-sm max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">First Name</label>
              <Input
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Last Name</label>
              <Input
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Phone</label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Username</label>
            <Input
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              NIN (National Identification Number)
              <span className="text-xs text-gray-500 ml-1">Required</span>
            </label>
            <Input
              value={formData.nin}
              onChange={(e) => setFormData({ ...formData, nin: e.target.value })}
              placeholder="e.g., AB1234567890C"
              className="font-mono"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              National Identification Number - this should be a valid government-issued ID
            </p>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200">
            <input
              type="checkbox"
              id="is_approved"
              checked={formData.is_approved}
              onChange={(e) => setFormData({ ...formData, is_approved: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="is_approved" className="text-sm font-medium text-gray-700">
              Approved
            </label>
            <span className="text-xs text-gray-500 ml-2">
              {formData.is_approved ? "Roadie is active and can accept jobs" : "Roadie is pending approval"}
            </span>
          </div>

          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <h3 className="text-sm font-medium text-blue-800 mb-1">Roadie Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Roadie ID:</span>
                <span className="ml-2 font-mono">{roadie?.external_id}</span>
              </div>
              <div>
                <span className="text-gray-600">Role:</span>
                <span className="ml-2">{roadie?.role}</span>
              </div>
              <div>
                <span className="text-gray-600">Referral Code:</span>
                <span className="ml-2 font-mono">{roadie?.referral_code || "None"}</span>
              </div>
              <div>
                <span className="text-gray-600">Created:</span>
                <span className="ml-2">{roadie?.created_at ? new Date(roadie.created_at).toLocaleDateString() : "-"}</span>
              </div>
              <div>
                <span className="text-gray-600">Last Updated:</span>
                <span className="ml-2">{roadie?.updated_at ? new Date(roadie.updated_at).toLocaleDateString() : "-"}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
            <Link href="/admin/roadies">
              <Button type="button" variant="outline" className="border-gray-300 bg-transparent hover:bg-gray-50">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting} className="gap-2 bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? (
                "Saving..."
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}