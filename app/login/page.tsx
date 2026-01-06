"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { loginAdmin, getAdminProfile } from "@/lib/auth" 
import { checkBackendConnection } from "@/lib/api" 
import { Loader2, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingConnection, setIsCheckingConnection] = useState(true)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const checkConnection = async () => {
      setIsCheckingConnection(true)
      try {
        const isConnected = await checkBackendConnection()
        if (!isConnected) {
          setConnectionError(`Cannot connect to backend server. Please ensure the server is running.`)
        }
      } catch (error) {
        setConnectionError(`Network error: ${error instanceof Error ? error.message : "Cannot connect to server"}`)
      }
      setIsCheckingConnection(false)
    }

    checkConnection()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (connectionError) {
      toast({
        title: "Connection Error",
        description: connectionError,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await loginAdmin(username, password)
      const user = await getAdminProfile()

      if (user) {
        toast({
          title: "Login successful",
          description: `Welcome back, ${user.name}!`,
        })
        router.push("/admin")
      } else {
        throw new Error("Failed to get user profile")
      }
    } catch (error) {
      console.error("Login error:", error)
      let errorMessage = "Invalid username or password. Please try again."

      if (error instanceof Error) {
        if (error.message.includes("Network error") || error.message.includes("fetch")) {
          errorMessage = "Cannot connect to the server. Please check if the backend is running."
        } else if (error.message.includes("Invalid credentials")) {
          errorMessage = "Invalid username or password."
        } else if (error.message.includes("not an admin")) {
          errorMessage = "User does not have admin privileges."
        } else {
          errorMessage = error.message
        }
      }

      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingConnection) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Checking server connection...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <img src="/vehix-logo.jpg" alt="Vehix logo" className="mx-auto h-20 w-auto" />
          <CardTitle className="text-3xl font-bold text-secondary">Vehix Admin</CardTitle>
          <CardDescription>Enter your credentials to access the admin panel</CardDescription>
        </CardHeader>
        <CardContent>
          {connectionError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {connectionError}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading || !!connectionError}
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading || !!connectionError}
                autoComplete="current-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !!connectionError}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>

          {!connectionError && (
            <div className="mt-6 rounded-lg border border-accent/20 bg-accent/5 p-4">

            </div>
          )}

          {connectionError && (
            <div className="mt-6 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-sm font-medium text-destructive">Troubleshooting Tips:</p>
              <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
                <li>Ensure Django backend is running: <code className="font-mono">python manage.py runserver</code></li>
                <li>Check if the server is accessible at: <code className="font-mono">http://localhost:8000</code></li>
                <li>Verify CORS is configured in Django settings</li>
                <li>Check browser console for detailed error messages</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}