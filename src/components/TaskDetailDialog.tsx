import { useState } from 'react'
import { Task, Campaign, List, Label } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label as UILabel } from './ui/label'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { toast } from 'sonner'
import { Target, Trash } from '@phosphor-icons/react'

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
  tasks,
  setTasks,
  campaigns,
  lists,
  open,
  onOpenChange,
}: TaskDetailDialogProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const [selectedCampaignId, setSelectedCampaignId] = useState(task.campaignId)
  const [selectedListId, setSelectedListId] = useState(task.listId)

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId)
  const availableLists = lists.filter(l => l.campaignId === selectedCampaignId)

  const handleSave = () => {
    if (!title.trim()) {
      toast.error('Task title cannot be empty')
      return
    }

    setTasks(currentTasks =>
      currentTasks.map(t =>
        t.id === task.id
          ? {
              ...t,
              title: title.trim(),
              description: description.trim(),
              campaignId: selectedCampaignId,
              listId: selectedListId,
            }
          : t
      )
    )
    toast.success('Task updated')
    onOpenChange(false)
  }

  const handleDelete = () => {
    if (confirm('Delete this task?')) {
      setTasks(currentTasks => currentTasks.filter(t => t.id !== task.id))
      toast.success('Task deleted')
      onOpenChange(false)
    }
  }

  const handleCampaignChange = (newCampaignId: string) => {
    setSelectedCampaignId(newCampaignId)
    const newCampaignLists = lists.filter(l => l.campaignId === newCampaignId)
    if (newCampaignLists.length > 0) {
      setSelectedListId(newCampaignLists[0].id)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <UILabel htmlFor="task-title">Title</UILabel>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title..."
            />
          </div>

          <div className="space-y-2">
            <UILabel htmlFor="task-description">Description</UILabel>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <UILabel htmlFor="task-campaign">Campaign</UILabel>
            <Select value={selectedCampaignId} onValueChange={handleCampaignChange}>
              <SelectTrigger id="task-campaign">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map(campaign => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    <div className="flex items-center gap-2">
                      <Target size={14} weight="duotone" />
                      {campaign.title}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {availableLists.length > 0 && (
            <div className="space-y-2">
              <UILabel htmlFor="task-list">List</UILabel>
              <Select value={selectedListId} onValueChange={setSelectedListId}>
                <SelectTrigger id="task-list">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableLists.map(list => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="destructive" onClick={handleDelete}>
              <Trash size={16} weight="bold" />
              Delete Task
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
