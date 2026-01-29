"use client"

import { useState, useEffect } from "react"
import { Shield, ShieldAlert, ShieldCheck, Globe, Trash2, Plus, Search, AlertCircle, Lock, Unlock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface BlockedIP {
    id: string
    ip: string
    reason: string
    blockedAt: string
    lastAttempt: string
    attempts: number
    country: string
}

export default function SecurityFirewallPage() {
    const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([])
    const [newIP, setNewIP] = useState("")
    const [newReason, setNewReason] = useState("")
    const [search, setSearch] = useState("")
    const { toast } = useToast()

    useEffect(() => {
        // Simulated initial data
        setBlockedIPs([
            { id: '1', ip: '192.168.1.45', reason: 'Brute force attempt on admin login', blockedAt: '2026-01-28T14:30:00Z', lastAttempt: '2026-01-29T10:15:00Z', attempts: 54, country: 'Russia' },
            { id: '2', ip: '45.12.34.122', reason: 'Suspicious API scraping behavior', blockedAt: '2026-01-27T09:12:00Z', lastAttempt: '2026-01-29T08:12:00Z', attempts: 1210, country: 'Unknown' },
            { id: '3', ip: '103.4.5.6', reason: 'Repeated 2FA failures', blockedAt: '2026-01-29T16:05:00Z', lastAttempt: '2026-01-29T16:05:00Z', attempts: 12, country: 'India' },
        ])
    }, [])

    const blockIP = () => {
        if (!newIP) return
        const newEntry: BlockedIP = {
            id: Date.now().toString(),
            ip: newIP,
            reason: newReason || 'Manually added by admin',
            blockedAt: new Date().toISOString(),
            lastAttempt: '-',
            attempts: 0,
            country: 'Local'
        }
        setBlockedIPs([newEntry, ...blockedIPs])
        setNewIP("")
        setNewReason("")
        toast({ title: "IP Blocked", description: `${newIP} has been added to the blacklist.` })
    }

    const unblockIP = (id: string, ip: string) => {
        setBlockedIPs(blockedIPs.filter(item => item.id !== id))
        toast({ title: "Access Restored", description: `${ip} has been removed from the blacklist.` })
    }

    const filtered = blockedIPs.filter(item =>
        item.ip.includes(search) || item.reason.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-8 animate-in-fade pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tighter flex items-center gap-3">
                        <Lock className="h-8 w-8 text-destructive" />
                        Security <span className="text-destructive">Firewall</span>
                    </h1>
                    <p className="text-muted-foreground font-medium mt-1">Manage IP blacklists and proactive threat prevention.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="px-3 py-1 border-destructive/20 text-destructive bg-destructive/5 font-bold">
                        {blockedIPs.length} IPs Restricted
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Statistics */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-card p-6 border-destructive/10">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-destructive mb-4">Threat Summary</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-4 border-b border-border/40">
                                <div className="flex items-center gap-2">
                                    <ShieldAlert className="h-4 w-4 text-destructive" />
                                    <span className="text-xs font-semibold text-muted-foreground">Total Incursions</span>
                                </div>
                                <span className="text-lg font-black">{blockedIPs.reduce((a, b) => a + b.attempts, 0)}</span>
                            </div>
                            <div className="flex justify-between items-center pb-4 border-b border-border/40">
                                <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-blue-500" />
                                    <span className="text-xs font-semibold text-muted-foreground">Countries Blocked</span>
                                </div>
                                <span className="text-lg font-black">12</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                    <span className="text-xs font-semibold text-muted-foreground">System Health</span>
                                </div>
                                <span className="text-lg font-black text-emerald-500">OPTIMAL</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 border-primary/10">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">Add Restriction</h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground">IPv4 / IPv6 Address</label>
                                <Input value={newIP} onChange={(e) => setNewIP(e.target.value)} placeholder="0.0.0.0" className="glass-card bg-background/50 border-none h-10 font-mono text-sm" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground">Reason for restriction</label>
                                <Input value={newReason} onChange={(e) => setNewReason(e.target.value)} placeholder="Optional note..." className="glass-card bg-background/50 border-none h-10 text-sm" />
                            </div>
                            <Button onClick={blockIP} className="w-full bg-destructive hover:bg-destructive/90 text-white font-bold uppercase tracking-widest h-11 shadow-lg shadow-destructive/20">
                                Block Forever
                            </Button>
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card overflow-hidden">
                        <div className="p-4 border-b border-border/40 bg-muted/20 flex flex-col md:flex-row justify-between gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Filter addresses or reasons..."
                                    className="w-full bg-transparent border-none focus:outline-none text-sm pl-10 h-8 font-medium"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-muted/10 border-b border-border/40">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Address</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Reason</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Last Attempt</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/20">
                                    {filtered.map((item) => (
                                        <tr key={item.id} className="hover:bg-muted/20 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black font-mono text-destructive">{item.ip}</span>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <Globe className="h-3 w-3 text-muted-foreground/40" />
                                                        <span className="text-[10px] text-muted-foreground font-bold uppercase">{item.country}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-start gap-2 max-w-xs">
                                                    <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                                                    <span className="text-xs text-foreground font-medium">{item.reason}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold">{new Date(item.blockedAt).toLocaleDateString()}</span>
                                                    <span className="text-[10px] text-muted-foreground">{item.attempts} blocks avoided</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => unblockIP(item.id, item.ip)}
                                                    className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 font-black h-9 px-4 rounded-xl"
                                                >
                                                    <Unlock className="h-3.5 w-3.5 mr-2" />
                                                    RESTORE
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {filtered.length === 0 && (
                            <div className="p-20 text-center">
                                <ShieldCheck className="h-12 w-12 mx-auto text-emerald-500/20 mb-4" />
                                <h4 className="text-sm font-bold text-muted-foreground">Clear Skies</h4>
                                <p className="text-xs text-muted-foreground/60 mt-1">Found no restrictions matching your criteria.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
