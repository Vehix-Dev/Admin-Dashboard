"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { generate2FA, enable2FA, get2FAStatus, GenerateResponse } from "@/lib/2fa-client"
import { resetAdminUserPassword } from "@/lib/api"
import { setAccessToken, clearAccessToken } from "@/lib/api"
import { Loader2, CheckCircle, Smartphone, Lock, KeyRound, AlertTriangle } from "lucide-react"

export default function MyAccountPage() {
    const { user } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()
    const { toast } = useToast()
    const [is2FAEnabled, setIs2FAEnabled] = useState(false)
    const [loading, setLoading] = useState(true)
    const [setupData, setSetupData] = useState<GenerateResponse | null>(null)
    const [verificationCode, setVerificationCode] = useState("")
    const [verifying, setVerifying] = useState(false)
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [force2FA, setForce2FA] = useState(false)

    useEffect(() => {
        // Check if user is forced to enable 2FA
        const force2FAParam = searchParams.get('force_2fa')
        if (force2FAParam === 'true') {
            setForce2FA(true)
            // Check for pending tokens
            const pendingTokens = localStorage.getItem('pending_2fa_tokens')
            const pendingUser = localStorage.getItem('pending_2fa_user')
            if (pendingTokens && pendingUser) {
                console.log("Found pending tokens and user from forced 2FA redirect")
            }
        }

        console.log("MyAccountPage: User changed", user);
        if (user) {
            checkStatus()
        } else {
            setLoading(false)
        }
    }, [user, searchParams])

    const checkStatus = async () => {
        if (!user) return;

        const username = user.username || (user as any).email;
        if (!username) {
            console.error("MyAccountPage: No username or email found for user", user);
            setLoading(false);
            return;
        }

        setLoading(true)
        try {
            console.log("MyAccountPage: Checking 2FA status for", username);
            const status = await get2FAStatus(username)
            console.log("MyAccountPage: 2FA Status result", status);
            setIs2FAEnabled(!!status.enabled)
        } catch (error) {
            console.error("MyAccountPage: Failed to check 2FA status", error)
            toast({
                title: "Security Status Error",
                description: "Could not retrieve 2FA status. High security features may be unavailable.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleStartSetup = async () => {
        console.log("handleStartSetup: Clicked. User status", user);
        if (!user) {
            toast({
                title: "Error",
                description: "User session not found. Please log in again.",
                variant: "destructive",
            })
            return
        }

        const username = user.username || (user as any).email;
        if (!username) {
            console.error("handleStartSetup: No identifier found for user", user);
            return;
        }

        setLoading(true)
        try {
            console.log("handleStartSetup: Requesting 2FA generation for", username);
            const data = await generate2FA(username)
            console.log("handleStartSetup: Data received", data);
            setSetupData(data)
        } catch (error) {
            console.error("handleStartSetup: Error", error);
            toast({
                title: "Error",
                description: "Failed to generate 2FA secret",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleEnable = async (e?: React.FormEvent, code?: string) => {
        if (e) e.preventDefault();
        const finalCode = code || verificationCode;
        if (!user || !setupData || finalCode.length !== 6) return

        setVerifying(true)
        console.log("MyAccountPage: Enabling 2FA for", user.username, "with code", finalCode);
        try {
            const result = await enable2FA(user.username || (user as any).email, finalCode)
            console.log("MyAccountPage: Enable result", result);
            if (result.success) {
                setIs2FAEnabled(true)
                setSetupData(null)
                setVerificationCode("")

                // If forced 2FA setup, restore tokens and clear dismissals
                if (force2FA) {
                    const pendingTokens = localStorage.getItem('pending_2fa_tokens')
                    const pendingUser = localStorage.getItem('pending_2fa_user')
                    if (pendingTokens && pendingUser) {
                        const tokens = JSON.parse(pendingTokens)
                        setAccessToken(tokens.access)
                        localStorage.setItem('admin_refresh_token', tokens.refresh)
                        localStorage.setItem('pending_2fa_tokens', '')
                        localStorage.setItem('pending_2fa_user', '')
                        // Clear dismissals since 2FA is now enabled
                        const dismissalsKey = `2fa_dismissals_${user.username}`
                        localStorage.removeItem(dismissalsKey)
                        setForce2FA(false)
                        router.push('/sys-admin')
                    }
                }

                toast({
                    title: "Success",
                    description: "Two-Factor Authentication has been enabled",
                })
            } else {
                toast({
                    title: "Invalid Code",
                    description: "The code you entered is incorrect. Please check your authenticator app and try again.",
                    variant: "destructive",
                })
                setVerificationCode(""); // Clear it
            }
        } catch (error) {
            console.error("MyAccountPage: Enable 2FA Error", error);
            toast({
                title: "Error",
                description: "Failed to enable 2FA. Please try again later.",
                variant: "destructive",
            })
        } finally {
            setVerifying(false)
        }
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !newPassword) return

        if (newPassword !== confirmPassword) {
            toast({
                title: "Error",
                description: "Passwords do not match",
                variant: "destructive",
            })
            return
        }

        if (newPassword.length < 8) {
            toast({
                title: "Error",
                description: "Password must be at least 8 characters long",
                variant: "destructive",
            })
            return
        }

        setIsChangingPassword(true)
        try {
            await resetAdminUserPassword(Number(user.id), newPassword)
            toast({
                title: "Success",
                description: "Password has been changed successfully",
            })
            setNewPassword("")
            setConfirmPassword("")
        } catch (error: any) {
            console.error("Failed to change password:", error)
            toast({
                title: "Error",
                description: error.message || "Failed to change password",
                variant: "destructive",
            })
        } finally {
            setIsChangingPassword(false)
        }
    }

    if (!user) return null

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold">My Account</h1>

            {force2FA && !is2FAEnabled && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-red-900">2FA Required to Continue</p>
                        <p className="text-sm text-red-700 mt-1">
                            You have dismissed the 2FA warning 3 times. You must enable Two-Factor Authentication to continue using the system.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>Your account details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input value={`${user.first_name} ${user.last_name}`} readOnly />
                        </div>
                        <div className="space-y-2">
                            <Label>Username</Label>
                            <Input value={user.username} readOnly />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={user.email} readOnly />
                        </div>
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Input value={user.role} readOnly />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Security</CardTitle>
                        <CardDescription>Manage your account security</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="space-y-1">
                                <p className="font-medium">Two-Factor Authentication</p>
                                <p className="text-sm text-muted-foreground">
                                    {is2FAEnabled
                                        ? "Your account is secured with 2FA"
                                        : "Add an extra layer of security"}
                                </p>
                            </div>
                            {loading ? (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-xs">Checking...</span>
                                </div>
                            ) : is2FAEnabled ? (
                                <div className="flex items-center text-green-600">
                                    <CheckCircle className="mr-2 h-5 w-5" />
                                    <span>Enabled</span>
                                </div>
                            ) : (
                                !setupData && (
                                    <Button onClick={handleStartSetup}>Enable 2FA</Button>
                                )
                            )}
                        </div>

                        {setupData && !is2FAEnabled && (
                            <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
                                <div className="space-y-2">
                                    <p className="font-medium flex items-center">
                                        <Smartphone className="mr-2 h-4 w-4" />
                                        Scan QR Code
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Use Google Authenticator or any compatible app to scan this QR code.
                                    </p>
                                </div>

                                <div className="flex justify-center bg-white p-4 rounded-md w-fit mx-auto">
                                    <img src={setupData.qrCode} alt="2FA QR Code" className="w-48 h-48" />
                                </div>

                                <div className="space-y-2">
                                    <Label>Verify Code</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={verificationCode}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                                                setVerificationCode(val);
                                                if (val.length === 6) {
                                                    handleEnable(undefined, val);
                                                }
                                            }}
                                            placeholder="000 000"
                                            maxLength={6}
                                            disabled={verifying}
                                            className="text-center text-2xl tracking-widest font-mono h-12"
                                        />
                                    </div>
                                    {verifying && (
                                        <div className="flex items-center justify-center gap-2 text-primary animate-pulse py-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span className="text-sm">Verifying...</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5" />
                            Change Password
                        </CardTitle>
                        <CardDescription>Update your account password</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isChangingPassword || !newPassword || !confirmPassword}
                            >
                                {isChangingPassword ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating Password...
                                    </>
                                ) : (
                                    <>
                                        <KeyRound className="mr-2 h-4 w-4" />
                                        Update Password
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
