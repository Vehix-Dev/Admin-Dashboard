import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShieldAlert, Home, ArrowLeft } from "lucide-react"

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full text-center space-y-8 p-10 bg-white rounded-2xl shadow-xl border border-gray-100">
                <div className="flex justify-center">
                    <div className="h-24 w-24 rounded-full bg-red-50 flex items-center justify-center">
                        <ShieldAlert className="h-12 w-12 text-red-500" />
                    </div>
                </div>

                <div className="space-y-3">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Access Denied</h1>
                    <p className="text-gray-500 text-lg">
                        Sorry, you don't have the required permissions to access this page.
                    </p>
                </div>

                <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center">
                    <Button variant="outline" asChild className="gap-2">
                        <Link href="javascript:history.back()">
                            <ArrowLeft className="h-4 w-4" />
                            Go Back
                        </Link>
                    </Button>
                    <Button asChild className="gap-2 bg-blue-600 hover:bg-blue-700">
                        <Link href="/admin">
                            <Home className="h-4 w-4" />
                            Dashboard
                        </Link>
                    </Button>
                </div>

                <div className="pt-8 border-t border-gray-100">
                    <p className="text-sm text-gray-400">
                        If you believe this is an error, please contact your system administrator.
                    </p>
                </div>
            </div>
        </div>
    )
}
