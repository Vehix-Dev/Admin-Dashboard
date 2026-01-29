"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { loginAdmin, getAdminProfile, removeAuthTokens, setAuthToken, setRefreshToken } from "@/lib/auth"
import { checkBackendConnection } from "@/lib/api"
import { Loader2, AlertCircle, Lock, User as UserIcon, Server, ShieldCheck } from "lucide-react"
import { useAuth, type User } from "@/contexts/auth-context"
import { get2FAStatus, verify2FA } from "@/lib/2fa-client"
import { singleLoginManager } from "@/lib/single-login"

export default function LoginPage() {
  const { login: authLogin } = useAuth()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingConnection, setIsCheckingConnection] = useState(true)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  // 2FA States
  const [showTwoFactor, setShowTwoFactor] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState("")
  const [pendingUser, setPendingUser] = useState<any>(null)
  const [pendingTokens, setPendingTokens] = useState<{ access: string, refresh: string } | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionInvalid = searchParams.get("message") === "session_invalid"
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
    let willShowTwoFactor = false

    try {
      const loginResponse = await loginAdmin(username, password)

      const user = loginResponse.user ? {
        ...loginResponse.user,
        id: String(loginResponse.user.id),
        name: `${loginResponse.user.first_name} ${loginResponse.user.last_name}`,
      } : await getAdminProfile()

      if (!user) {
        throw new Error("Failed to get user profile")
      }

      // Check 2FA Status - Security critical: fail securely
      let is2faEnabled = false;
      try {
        const status = await get2FAStatus(user.username || username);
        is2faEnabled = status.enabled;
      } catch (err) {
        console.error("2FA Check failed:", err);
        // Security: On status check failure, require 2FA to be safe
        is2faEnabled = true;
      }

      // Update user object with correct 2FA status
      const updatedUser = { ...user, two_factor_enabled: is2faEnabled };

      const tokens = { access: loginResponse.access, refresh: loginResponse.refresh };

      if (is2faEnabled) {
        // 2FA is enabled.
        // IMPORTANT: Remove tokens from storage to prevent auto-login on refresh before 2FA check
        removeAuthTokens();

        setPendingUser(updatedUser);
        setPendingTokens(tokens);
        setShowTwoFactor(true);
        willShowTwoFactor = true;
        setIsLoading(false); // Stop loading spinner for 2FA input
      } else {
        // 2FA disabled, proceed with login
        completeLogin(updatedUser, tokens);
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
      if (!willShowTwoFactor) {
        setIsLoading(false)
      }
    }
  }

  const handleTwoFactorVerify = async (e?: React.FormEvent, code?: string) => {
    if (e) e.preventDefault();
    const finalCode = code || twoFactorCode;
    if (finalCode.length !== 6 || isVerifying) return;

    setIsVerifying(true);

    try {
      const usernameToVerify = pendingUser?.username || username;
      const result = await verify2FA(usernameToVerify, finalCode);

      if (result.valid) {
        if (pendingUser && pendingTokens) {
          setAuthToken(pendingTokens.access);
          setRefreshToken(pendingTokens.refresh);
          completeLogin(pendingUser, pendingTokens);
        } else {
          throw new Error("Session lost. Please try logging in again.");
        }
      } else {
        toast({
          title: "Invalid Code",
          description: "The authentication code is invalid. Please try again.",
          variant: "destructive",
        });
        setTwoFactorCode(""); // Clear wrong code
      }

    } catch (error) {
      console.error("LoginPage: 2FA Error:", error);
      toast({
        title: "Verification Failed",
        description: "An error occurred during verification",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  }

  const completeLogin = async (user: any, tokens: { access: string }) => {
    const adaptedUser: User = {
      ...user,
      first_name: user.first_name || user.name?.split(' ')[0] || "",
      last_name: user.last_name || user.name?.split(' ').slice(1).join(' ') || "",
      is_approved: true
    } as any

    // Set user in single login manager and broadcast login
    singleLoginManager.setUser(adaptedUser.id)
    singleLoginManager.broadcastLogin(adaptedUser.id)

    await authLogin(adaptedUser as any, tokens.access)

    toast({
      title: "Login successful",
      description: `Welcome back, ${user.name}!`,
    })
  }

  if (isCheckingConnection) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md elevation-4 border-border">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <img src="/logo.png" alt="Logo" className="h-12 w-auto animate-pulse" />
                <Loader2 className="absolute -top-2 -right-2 h-6 w-6 animate-spin text-primary" />
              </div>
              <p className="text-lg font-medium text-foreground">Checking server connection...</p>
              <p className="text-sm text-muted-foreground">Please wait while we connect to the backend</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {/* Clean Mantis-style background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background to-background-soft" />

      <Card className="relative z-10 w-full max-w-md elevation-8 border-border animate-fadeIn">
        {/* Mantis-style top accent bar */}
        <div className="absolute top-0 h-1 w-full bg-primary" />

        <CardHeader className="space-y-6 text-center pb-6 pt-8">
          {/* Clean logo container */}
          <div className="mx-auto flex h-24 w-auto items-center justify-center p-2">
            <img
              src="/logo.png"
              alt="Vehix Logo"
              className="h-full w-auto object-contain"
            />
          </div>

          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold text-foreground">
              Vehix Admin
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {showTwoFactor ? "Two-Factor Authentication" : "Secure Access to Administration Panel"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {sessionInvalid && (
            <Alert
              className="border-amber-500/50 bg-amber-500/10"
            >
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-500">Security Alert</p>
                <AlertDescription className="text-amber-200/80">
                  This session is no longer valid because another device has logged in.
                  For your protection, we recommend <b>changing your password</b> immediately after logging back in.
                </AlertDescription>
              </div>
            </Alert>
          )}

          {connectionError && (
            <Alert
              variant="destructive"
              className="border-destructive/50 bg-destructive/10"
            >
              <AlertCircle className="h-5 w-5" />
              <AlertDescription>
                {connectionError}
              </AlertDescription>
            </Alert>
          )}

          {!showTwoFactor ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-foreground flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="admin@vehix.com"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={isLoading || !!connectionError}
                    autoComplete="username"
                    className="transition-fast"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading || !!connectionError}
                    autoComplete="current-password"
                    className="transition-fast"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-medium transition-smooth elevation-2 hover:elevation-4"
                disabled={isLoading || !!connectionError}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Lock className="mr-2 h-5 w-5" />
                )}
                Sign In
              </Button>
            </form>
          ) : (
            <form onSubmit={handleTwoFactorVerify} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="2fa" className="text-sm font-medium text-foreground flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    Authentication Code
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Please enter the 6-digit code from your authenticator app.
                  </p>
                  <Input
                    id="2fa"
                    type="text"
                    placeholder="000 000"
                    value={twoFactorCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                      setTwoFactorCode(val);
                    }}
                    required
                    autoFocus
                    maxLength={6}
                    disabled={isVerifying}
                    className="text-center text-3xl tracking-[0.5em] h-16 font-mono transition-fast"
                  />
                  {isVerifying && (
                    <div className="flex justify-center mt-2">
                      <div className="flex items-center gap-2 text-primary text-sm animate-pulse">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verifying...
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full h-11 text-base font-medium transition-smooth elevation-2 hover:elevation-4"
                  disabled={isLoading || twoFactorCode.length !== 6}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <ShieldCheck className="mr-2 h-5 w-5" />
                  )}
                  Verify Code
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowTwoFactor(false);
                    setPendingUser(null);
                    setPendingTokens(null);
                    // Ensure tokens are cleared
                    removeAuthTokens();
                  }}
                >
                  Back to Login
                </Button>
              </div>
            </form>
          )}

          {connectionError && (
            <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Server className="h-5 w-5 text-destructive" />
                <p className="font-semibold text-destructive">Troubleshooting Tips</p>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
                  Ensure Django backend is running:{" "}
                  <code className="ml-1 rounded bg-muted px-2 py-0.5 font-mono text-xs">python manage.py runserver</code>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
                  Check server accessibility at:{" "}
                  <code className="ml-1 rounded bg-muted px-2 py-0.5 font-mono text-xs">http://localhost:8000</code>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
                  Verify CORS configuration in Django settings
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
                  Check browser console for detailed error messages
                </li>
              </ul>
            </div>
          )}

        </CardContent>
      </Card>

      {/* Clean footer */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
        <p className="text-sm text-muted-foreground">
          © 2026 Vehix Admin Portal • All Rights Reserved
        </p>
      </div>
    </div>
  )
}