"use client"

import React from "react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { AlertTriangle, RotateCcw, Trash2, X } from "lucide-react"

interface ConfirmModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    description: string
    mode?: "delete" | "restore" | "default"
    confirmText?: string
    cancelText?: string
    children?: React.ReactNode
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    mode = "delete",
    confirmText,
    cancelText = "Cancel",
    children,
}: ConfirmModalProps) {
    const isDelete = mode === "delete"
    const isRestore = mode === "restore"

    const finalConfirmText = confirmText || (isDelete ? "Delete" : isRestore ? "Restore" : "Confirm")

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-none bg-transparent shadow-2xl">
                <div className={cn(
                    "relative overflow-hidden rounded-2xl border border-white/10",
                    "bg-slate-950/80 backend-blur-xl backdrop-blur-md",
                    "before:content-[''] before:absolute before:inset-0 before:z-[-1]",
                    isDelete ? "before:bg-red-500/5" : isRestore ? "before:bg-emerald-500/5" : "before:bg-blue-500/5"
                )}>
                    {/* Animated background accent */}
                    <div className={cn(
                        "absolute -top-24 -right-24 w-48 h-48 blur-3xl rounded-full opacity-20",
                        isDelete ? "bg-red-500" : isRestore ? "bg-emerald-500" : "bg-blue-500"
                    )} />

                    <div className="p-6 relative z-10">
                        <AlertDialogHeader className="space-y-4">
                            <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center mb-2 mx-auto sm:mx-0",
                                isDelete ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                                    isRestore ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                        "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                            )}>
                                {isDelete ? <Trash2 className="w-6 h-6" /> :
                                    isRestore ? <RotateCcw className="w-6 h-6" /> :
                                        <AlertTriangle className="w-6 h-6" />}
                            </div>

                            <div className="space-y-1 text-center sm:text-left">
                                <AlertDialogTitle className="text-xl font-bold text-white tracking-tight">
                                    {title}
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-400 text-sm leading-relaxed">
                                    {description}
                                </AlertDialogDescription>
                            </div>
                        </AlertDialogHeader>

                        {children && (
                            <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
                                {children}
                            </div>
                        )}

                        <AlertDialogFooter className="mt-8 flex-col sm:flex-row gap-3">
                            <AlertDialogCancel
                                onClick={(e) => {
                                    e.preventDefault()
                                    onClose()
                                }}
                                className="flex-1 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white hover:text-white transition-all duration-200"
                            >
                                {cancelText}
                            </AlertDialogCancel>

                            <AlertDialogAction
                                onClick={(e) => {
                                    e.preventDefault()
                                    onConfirm()
                                }}
                                className={cn(
                                    "flex-1 rounded-xl font-semibold shadow-lg transition-all duration-200 active:scale-95",
                                    isDelete ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white border-none" :
                                        isRestore ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-none" :
                                            "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-none"
                                )}
                            >
                                {finalConfirmText}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </div>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    )
}
