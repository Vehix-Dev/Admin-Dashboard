import { AlertCircle, LucideIcon } from "lucide-react"

interface EmptyStateProps {
  title: string
  description: string
  action?: React.ReactNode
  icon?: LucideIcon
}

export function EmptyState({ title, description, action, icon: Icon }: EmptyStateProps) {
  const DisplayIcon = Icon || AlertCircle
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card p-12 text-center">
      <div className="rounded-full bg-muted p-3">
        <DisplayIcon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
