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

      const tokens = { access: loginResponse.access, refresh: loginResponse.refresh };

      if (is2faEnabled) {
        // 2FA is enabled.
        // IMPORTANT: Remove tokens from storage to prevent auto-login on refresh before 2FA check
        removeAuthTokens();

        setPendingUser(user);
        setPendingTokens(tokens);
        setShowTwoFactor(true);
        willShowTwoFactor = true;
        setIsLoading(false); // Stop loading spinner for 2FA input
      } else {
        // 2FA disabled, proceed with login
        completeLogin(user, tokens);
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

  const completeLogin = (user: any, tokens: { access: string }) => {
    const adaptedUser: User = {
      ...user,
      first_name: user.first_name || user.name?.split(' ')[0] || "",
      last_name: user.last_name || user.name?.split(' ').slice(1).join(' ') || "",
      is_approved: true
    } as any

    // Set user in single login manager and broadcast login
    singleLoginManager.setUser(adaptedUser.id)
    singleLoginManager.broadcastLogin(adaptedUser.id)

    authLogin(adaptedUser as any, tokens.access)

    toast({
      title: "Login successful",
      description: `Welcome back, ${user.name}!`,
    })
    router.push("/admin")
  }

  if (isCheckingConnection) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-black p-4">
        <Card className="w-full max-w-md backdrop-blur-sm bg-white/10 border-white/20 shadow-2xl">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/20"></div>
                <Loader2 className="h-12 w-12 animate-spin text-white" />
              </div>
              <p className="text-lg font-medium text-white">Checking server connection...</p>
              <p className="text-sm text-white/70">Please wait while we connect to the backend</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* Background with faded logo */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900/30 to-purple-900/20"
          style={{
            backgroundImage: `url('/vehix-logo.jpg')`,
            backgroundSize: '50%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.1,
            filter: 'blur(8px)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-blue-900/40 to-purple-900/30" />
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-white/10 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${10 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      <Card className="relative z-10 w-full max-w-md overflow-hidden backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
        {/* Card accent gradient */}
        <div className="absolute top-0 h-1 w-full bg-gradient-to-r from-primary via-accent to-secondary" />

        <CardHeader className="space-y-4 text-center pb-8">
          <div className="relative">
            <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 blur-xl" />
            <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-2">
              <img
                src="/vehix-logo.jpg"
                alt="Vehix logo"
                className="h-full w-full rounded-xl object-cover"
              />
            </div>
          </div>

          <div className="space-y-2">
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">
              Vehix Admin
            </CardTitle>
            <CardDescription className="text-white/80">
              {showTwoFactor ? "Two-Factor Authentication" : "Secure Access to Administration Panel"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {connectionError && (
            <Alert
              variant="destructive"
              className="border-red-500/30 bg-red-500/10 backdrop-blur-sm"
            >
              <AlertCircle className="h-5 w-5 text-red-400" />
              <AlertDescription className="text-red-300">
                {connectionError}
              </AlertDescription>
            </Alert>
          )}

          {!showTwoFactor ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-white/90">
                    <UserIcon className="mr-2 inline h-4 w-4" />
                    Username
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 blur-sm" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="admin@vehix.com"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      disabled={isLoading || !!connectionError}
                      autoComplete="username"
                      className="relative border-white/30 bg-white/5 text-white placeholder:text-white/50 focus:border-primary focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-white/90">
                    <Lock className="mr-2 inline h-4 w-4" />
                    Password
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-accent/10 to-secondary/10 blur-sm" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading || !!connectionError}
                      autoComplete="current-password"
                      className="relative border-white/30 bg-white/5 text-white placeholder:text-white/50 focus:border-accent focus:ring-2 focus:ring-accent/30"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="group relative w-full overflow-hidden bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/35 disabled:opacity-50 disabled:cursor-not-allowed h-12 text-base font-semibold"
                disabled={isLoading || !!connectionError}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
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
                  <Label htmlFor="2fa" className="text-sm font-medium text-white/90">
                    <ShieldCheck className="mr-2 inline h-4 w-4" />
                    Authentication Code
                  </Label>
                  <p className="text-xs text-white/60">
                    Please enter the 6-digit code from your authenticator app.
                  </p>
                  <div className="relative">
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 blur-sm" />
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
                      className="relative border-white/30 bg-white/5 text-white placeholder:text-white/50 focus:border-primary focus:ring-2 focus:ring-primary/30 text-center text-3xl tracking-[0.5em] h-16 font-mono"
                    />
                  </div>
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
                  className="group relative w-full overflow-hidden bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/35 disabled:opacity-50 disabled:cursor-not-allowed h-12 text-base font-semibold"
                  disabled={isLoading || twoFactorCode.length !== 6}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
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
                  className="text-white/60 hover:text-white"
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
            <div className="mt-8 rounded-xl border border-red-500/20 bg-gradient-to-br from-red-900/10 to-red-900/5 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <Server className="h-5 w-5 text-red-400" />
                <p className="text-lg font-semibold text-red-300">Troubleshooting Tips</p>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-red-200/80">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-red-400" />
                  Ensure Django backend is running:{" "}
                  <code className="ml-1 rounded bg-red-900/30 px-2 py-0.5 font-mono text-xs">python manage.py runserver</code>
                </li>
                <li className="flex items-start gap-2 text-sm text-red-200/80">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-red-400" />
                  Check server accessibility at:{" "}
                  <code className="ml-1 rounded bg-red-900/30 px-2 py-0.5 font-mono text-xs">http://localhost:8000</code>
                </li>
                <li className="flex items-start gap-2 text-sm text-red-200/80">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-red-400" />
                  Verify CORS configuration in Django settings
                </li>
                <li className="flex items-start gap-2 text-sm text-red-200/80">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-red-400" />
                  Check browser console for detailed error messages
                </li>
              </ul>
            </div>
          )}

        </CardContent>
      </Card>

      {/* Footer */}
      <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-center">
        <p className="text-sm text-white/50">
          © 2026 Vehix Admin Portal • All Rights Reserved
        </p>
      </div>
    </div >
  )
}