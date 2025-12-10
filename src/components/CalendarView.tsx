import { Campaign, Task, Label, List, FilterState } from '@/lib/types'

interface CalendarViewProps {
  campaigns: Campaign[]
  tasks: Task[]
  setTasks: (updater: (tasks: Task[]) => Task[]) => void
  labels: Label[]
  setLabels: (updater: (labels: Label[]) => Label[]) => void
  lists: List[]
  activeCampaignId: string | null
  filters: FilterState
}

export default function CalendarView({}: CalendarViewProps) {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Calendar View
        </h3>
        <p className="text-muted-foreground">
          Calendar view coming soon
        </p>
      </div>
    </div>
  )
}
