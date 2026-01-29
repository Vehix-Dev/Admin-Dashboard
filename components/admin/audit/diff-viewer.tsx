"use client"

import { useState } from "react"
import { Eye, ChevronRight, Hash, HashIcon } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

const formatValue = (val: any) => {
    if (val === undefined || val === null) return <span className="opacity-30 italic">null</span>;
    if (typeof val === 'object') {
        try {
            return JSON.stringify(val, null, 2);
        } catch (e) {
            return String(val);
        }
    }
    return String(val);
};

export function DiffViewer({ oldVal, newVal }: { oldVal: any; newVal: any }) {
    if (!oldVal && !newVal) return <span className="text-muted-foreground italic">No data</span>

    // Simple diff logic
    const keys = Array.from(new Set([...Object.keys(oldVal || {}), ...Object.keys(newVal || {})]))

    return (
        <Dialog>
            <DialogTrigger asChild>
                <button className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase hover:bg-primary hover:text-white transition-all">
                    <Eye className="h-3 w-3" />
                    Detail Diff
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-xl glass-card border-primary/20 bg-background/95">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase tracking-tighter">Forensic Data Diff</DialogTitle>
                </DialogHeader>
                <div className="mt-4 space-y-2 overflow-y-auto max-h-[400px] pr-2">
                    {keys.map((key) => {
                        const ov = oldVal?.[key]
                        const nv = newVal?.[key]
                        const hasChanged = JSON.stringify(ov) !== JSON.stringify(nv)

                        return (
                            <div key={key} className={cn("p-3 rounded-xl border text-xs", hasChanged ? "bg-amber-500/5 border-amber-500/20" : "bg-muted/30 border-border/40")}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-mono font-black uppercase tracking-widest text-[#F05A28]">{key}</span>
                                    {hasChanged && <span className="text-[9px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded">MODIFIED</span>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Previous</span>
                                        <div className="bg-red-500/10 p-2 rounded border border-red-500/10 font-mono text-[10px] min-h-[32px] whitespace-pre-wrap break-all">
                                            {formatValue(ov)}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">New Value</span>
                                        <div className="bg-emerald-500/10 p-2 rounded border border-emerald-500/10 font-mono text-[10px] min-h-[32px] whitespace-pre-wrap break-all">
                                            {formatValue(nv)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </DialogContent>
        </Dialog>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
