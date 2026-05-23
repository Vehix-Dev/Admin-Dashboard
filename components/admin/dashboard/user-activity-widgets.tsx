"use client"

import Link from "next/link"
import { Users, UserCheck, ArrowUpRight, CheckCircle, Clock, Award } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function TopCustomers({ riders }: { riders: any[] }) {
    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    }

    return (
        <div className="glass-card p-6 h-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-foreground">Elite Customers</h3>
                <span className="text-xs text-muted-foreground uppercase tracking-widest">Global Ranking</span>
            </div>
            <div className="space-y-4">
                {riders.slice(0, 5).map((rider, index) => (
                    <Link key={rider.id} href={`/sys-admin/riders/${rider.id}/edit`} className="block">
                        <div className="flex items-center justify-between p-3 border border-border/40 rounded-xl hover:bg-muted/50 transition-all cursor-pointer group hover:border-primary/20">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Avatar className="h-10 w-10 border-2 border-border/50 group-hover:border-primary/40 transition-colors">
                                        {rider.profileImage && <AvatarImage src={rider.profileImage} className="object-cover" />}
                                        <AvatarFallback className="bg-muted text-muted-foreground text-xs font-bold">
                                            {getInitials(rider.firstName, rider.lastName)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-foreground text-background text-[10px] font-bold rounded-full ring-2 ring-background">
                                        {index + 1}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                        {rider.firstName} {rider.lastName}
                                    </p>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase">
                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                        <span>{rider.completedRequests} Orders</span>
                                    </div>
                                </div>
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </div>
                    </Link>
                ))}
            </div>
            <Link href="/sys-admin/riders">
                <Button variant="ghost" size="sm" className="w-full mt-6 h-10 border border-border/40 hover:bg-muted font-bold text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
                    Explorer All
                </Button>
            </Link>
        </div>
    )
}

export function TopProviders({ roadies }: { roadies: any[] }) {
    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    }

    return (
        <div className="glass-card p-6 h-full border-t-4 border-t-emerald-500/50">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-foreground">Top Providers</h3>
                <Award className="h-5 w-5 text-amber-500" />
            </div>
            <div className="space-y-4">
                {roadies.slice(0, 5).map((roadie, index) => (
                    <Link key={roadie.id} href={`/sys-admin/roadies/${roadie.id}/edit`} className="block">
                        <div className="flex items-center justify-between p-3 border border-border/40 rounded-xl hover:bg-muted/50 transition-all cursor-pointer group hover:border-emerald-500/20">
                            <div className="flex items-center gap-3">
                                <Avatar className={cn("h-11 w-11 border-2 transition-transform group-hover:scale-105",
                                    index === 0 ? "border-amber-400" : index === 1 ? "border-slate-300" : "border-emerald-500/30")}>
                                    {roadie.profileImage && <AvatarImage src={roadie.profileImage} className="object-cover" />}
                                    <AvatarFallback className="bg-emerald-50 text-emerald-700 font-bold text-xs">
                                        {getInitials(roadie.firstName, roadie.lastName)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-foreground truncate group-hover:text-emerald-500 transition-colors">
                                        {roadie.firstName} {roadie.lastName}
                                    </p>
                                    <p className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 w-fit px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                        {roadie.completedRequests} Requests
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">{roadie.is_approved ? "Active" : "Waitlist"}</span>
                                <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 mt-1" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}

export function RecentActivity({ feed }: { feed: { id: string; message: string; timestamp: string; timeAgo: string; requestId?: number }[] }) {
    return (
        <div className="glass-card p-6 h-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-foreground">Recent Activity</h3>
                    <p className="text-xs text-muted-foreground">Latest platform events</p>
                </div>
                <Clock className="h-5 w-5 text-primary animate-pulse" />
            </div>
            <div className="space-y-3 max-h-[420px] overflow-y-auto">
                {feed.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
                ) : (
                    feed.map((item) => (
                        <div
                            key={item.id}
                            className="p-3 border border-border/40 rounded-xl hover:bg-muted/40 transition-colors"
                        >
                            <p className="text-sm text-foreground leading-snug">&ldquo;{item.message}&rdquo;</p>
                            <p className="text-xs text-muted-foreground mt-1.5">{item.timeAgo}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
