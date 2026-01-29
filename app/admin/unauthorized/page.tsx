import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShieldAlert, Home, ArrowLeft } from "lucide-react"

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="max-w-md w-full text-center space-y-8 p-10 bg-card rounded-2xl shadow-xl border border-border">
                <div className="flex justify-center">
                    <div className="h-24 w-24 rounded-full bg-destructive/10 flex items-center justify-center">
                        <ShieldAlert className="h-12 w-12 text-destructive" />
                    </div>
                </div>

                <div className="space-y-3">
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Access Denied</h1>
                    <p className="text-muted-foreground text-lg">
                        Sorry, you don't have the required permissions to access this page.
                    </p>
                </div>

                <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center">
                    <Button variant="outline" asChild className="gap-2">
                        <Link href="/admin">
                            <ArrowLeft className="h-4 w-4" />
                            Go Back
                        </Link>
                    </Button>
                    <Button asChild className="gap-2 bg-primary hover:bg-primary/90">
                        <Link href="/admin">
                            <Home className="h-4 w-4" />
                            Dashboard
                        </Link>
                    </Button>
                </div>

                <div className="pt-8 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                        If you believe this is an error, please contact your system administrator.
                    </p>
                </div>
            </div>
        </div>
    )
}
