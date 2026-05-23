"use client"

import { useMemo, useState } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from "date-fns"
import { ChevronLeft, ChevronRight, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { RoadieOnlineCalendarDay } from "@/lib/api"

interface Props {
  calendar: Record<string, RoadieOnlineCalendarDay>
}

export function OnlineActivityCalendar({ calendar }: Props) {
  const [month, setMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const days = useMemo(() => {
    const start = startOfMonth(month)
    const end = endOfMonth(month)
    return eachDayOfInterval({ start, end })
  }, [month])

  const selectedDay = selectedDate ? calendar[selectedDate] : null

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Online activity calendar</CardTitle>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium text-center mb-3">{format(month, "MMMM yyyy")}</p>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground mb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd")
              const entry = calendar[key]
              const hasActivity = !!entry && entry.total_seconds > 0
              const isSelected = selectedDate === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDate(key)}
                  className={cn(
                    "aspect-square rounded-md text-xs flex flex-col items-center justify-center border transition-colors",
                    !isSameMonth(day, month) && "opacity-30",
                    hasActivity
                      ? "bg-emerald-500/20 border-emerald-500/40 hover:bg-emerald-500/30"
                      : "bg-muted/30 border-transparent hover:bg-muted/50",
                    isSelected && "ring-2 ring-primary"
                  )}
                >
                  <span>{format(day, "d")}</span>
                  {hasActivity && (
                    <span className="text-[8px] text-emerald-700 font-medium truncate max-w-full px-0.5">
                      {entry.total_formatted}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {selectedDate ? format(new Date(selectedDate), "EEEE, MMM d, yyyy") : "Select a date"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedDay || selectedDay.sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {selectedDate
                ? "No online sessions recorded for this day."
                : "Click a highlighted date to see when this roadie was online."}
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium">
                Total online: <span className="text-emerald-600">{selectedDay.total_formatted}</span>
              </p>
              <div className="space-y-2 max-h-[360px] overflow-y-auto">
                {selectedDay.sessions.map((session) => (
                  <div key={session.id} className="p-3 rounded-lg border bg-muted/30 text-sm">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="flex items-center gap-1.5 font-medium">
                        {session.still_online ? (
                          <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        {session.duration_formatted}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {session.still_online ? "Still online" : "Went offline"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Online: {new Date(session.went_online_at).toLocaleString()}
                    </p>
                    {session.went_offline_at && (
                      <p className="text-xs text-muted-foreground">
                        Offline: {new Date(session.went_offline_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
