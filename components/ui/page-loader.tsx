"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PageLoaderProps {
    message?: string
    className?: string
    fullScreen?: boolean
}

export function PageLoader({
    message = "Loading...",
    className,
    fullScreen = true
}: PageLoaderProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center gap-4",
                fullScreen ? "min-h-screen" : "min-h-[400px]",
                className
            )}
        >
            <div className="relative">
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />

                {/* Spinning loader */}
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>

            {/* Loading message */}
            <div className="space-y-2 text-center">
                <p className="text-lg font-medium text-foreground animate-pulse">
                    {message}
                </p>
                <div className="flex gap-1 justify-center">
                    <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
            </div>
        </div>
    )
}
