import { Task, Campaign, List, Label } from '@/lib/types'
import { Dialog, DialogContent } from './ui/dialog'

interface TaskDetailDialogProps {
  task: Task
  tasks: Task[]
  setTasks: (updater: (tasks: Task[]) => Task[]) => void
  labels: Label[]
  setLabels: (updater: (labels: Label[]) => Label[]) => void
  lists: List[]
  campaigns: Campaign[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function TaskDetailDialog({
  task,
  open,
  onOpenChange,
}: TaskDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <h2 className="text-xl font-semibold">{task.title}</h2>
        <p className="text-muted-foreground">{task.description}</p>
      </DialogContent>
    </Dialog>
  )
}
