import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  subtitle?: string
}

export function StatsCard({ title, value, icon: Icon, change, changeType = "neutral", subtitle }: StatsCardProps) {
  return (
    <Card className="relative overflow-hidden p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-primary/5" />

      <div className="relative flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
          </div>

          <div className="space-y-1">
            <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>

          {change && (
            <div className="flex items-center gap-1">
              {changeType === "positive" && <TrendingUp className="h-3.5 w-3.5 text-green-600" />}
              {changeType === "negative" && <TrendingDown className="h-3.5 w-3.5 text-red-600" />}
              <p
                className={`text-xs font-semibold ${
                  changeType === "positive"
                    ? "text-green-600"
                    : changeType === "negative"
                      ? "text-red-600"
                      : "text-muted-foreground"
                }`}
              >
                {change}
              </p>
              <span className="text-xs text-muted-foreground">vs last period</span>
            </div>
          )}
        </div>

        <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-3 shadow-sm">
          <Icon className="h-6 w-6 text-primary" strokeWidth={2.5} />
        </div>
      </div>
    </Card>
  )
}
