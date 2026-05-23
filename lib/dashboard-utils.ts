const ACTIVE_STATUSES = ["REQUESTED", "ACCEPTED", "EN_ROUTE", "STARTED"]

export function isToday(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

export function formatTimeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 45) return "Just now"
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? "" : "s"} ago`
}

export interface ActivityFeedItem {
  id: string
  message: string
  timestamp: string
  sortTime: number
}

export function buildActivityFeed(requests: Array<Record<string, unknown>>): ActivityFeedItem[] {
  const items: ActivityFeedItem[] = []

  for (const r of requests) {
    const service = (r.service_type_name as string) || "Service"
    const roadieName =
      (r.rodie_username as string) ||
      [r.rodie_first_name, r.rodie_last_name].filter(Boolean).join(" ") ||
      "Roadie"
    const status = String(r.status || "").toUpperCase()
    const createdAt = r.created_at as string
    const updatedAt = (r.updated_at as string) || createdAt
    const completedAt = (r.completed_at as string) || updatedAt

    if (createdAt) {
      items.push({
        id: `created-${r.id}`,
        message: `New ${service} request created`,
        timestamp: createdAt,
        sortTime: new Date(createdAt).getTime(),
      })
    }

    if (status === "ACCEPTED" || status === "EN_ROUTE" || status === "STARTED") {
      items.push({
        id: `accepted-${r.id}`,
        message: `${service} accepted by Roadie ${roadieName}`,
        timestamp: (r.accepted_at as string) || updatedAt,
        sortTime: new Date((r.accepted_at as string) || updatedAt).getTime(),
      })
    }

    if (status === "COMPLETED") {
      items.push({
        id: `completed-${r.id}`,
        message: `${service} completed by Roadie ${roadieName}`,
        timestamp: completedAt,
        sortTime: new Date(completedAt).getTime(),
      })
    }

    if (status === "CANCELLED") {
      items.push({
        id: `cancelled-${r.id}`,
        message: `${service} job cancelled`,
        timestamp: updatedAt,
        sortTime: new Date(updatedAt).getTime(),
      })
    }

    if (status === "EXPIRED") {
      items.push({
        id: `expired-${r.id}`,
        message: `${service} request expired`,
        timestamp: updatedAt,
        sortTime: new Date(updatedAt).getTime(),
      })
    }
  }

  return items
    .sort((a, b) => b.sortTime - a.sortTime)
    .slice(0, 20)
}

export { ACTIVE_STATUSES }
