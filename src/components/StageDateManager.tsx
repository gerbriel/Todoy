import { useState } from 'react'
import { StageDate } from '@/lib/types'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Plus, Trash, CalendarBlank } from '@phosphor-icons/react'
import { generateId } from '@/lib/helpers'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface StageDateManagerProps {
  stageDates: StageDate[]
  onChange: (stageDates: StageDate[]) => void
  entityType: 'project' | 'campaign' | 'task'
}

const defaultStageColors = [
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#F59E0B',
  '#10B981',
  '#3B82F6',
]

export default function StageDateManager({
  stageDates,
  onChange,
  entityType,
}: StageDateManagerProps) {
  const [newStageName, setNewStageName] = useState('')
  const [newStartDate, setNewStartDate] = useState('')
  const [newEndDate, setNewEndDate] = useState('')

  const handleAddStage = () => {
    if (!newStageName.trim()) {
      toast.error('Stage name is required')
      return
    }
    if (!newStartDate || !newEndDate) {
      toast.error('Both start and end dates are required')
      return
    }
    if (new Date(newStartDate) > new Date(newEndDate)) {
      toast.error('Start date must be before end date')
      return
    }

    const newStage: StageDate = {
      id: generateId(),
      stageName: newStageName.trim(),
      startDate: newStartDate,
      endDate: newEndDate,
      color: defaultStageColors[stageDates.length % defaultStageColors.length],
    }

    onChange([...stageDates, newStage])
    setNewStageName('')
    setNewStartDate('')
    setNewEndDate('')
    toast.success('Stage added')
  }

  const handleRemoveStage = (stageId: string) => {
    onChange(stageDates.filter(s => s.id !== stageId))
    toast.success('Stage removed')
  }

  const sortedStages = [...stageDates].sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  )

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Timeline Stages</Label>
        <p className="text-xs text-muted-foreground">
          Define stages with date ranges for this {entityType}
        </p>
      </div>

      {sortedStages.length > 0 && (
        <div className="space-y-2">
          {sortedStages.map((stage) => (
            <div
              key={stage.id}
              className="flex items-center gap-2 p-3 bg-muted rounded-lg"
            >
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: stage.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{stage.stageName}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarBlank size={12} weight="duotone" />
                  {format(new Date(stage.startDate), 'MMM d, yyyy')} → {format(new Date(stage.endDate), 'MMM d, yyyy')}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveStage(stage.id)}
                className="shrink-0"
              >
                <Trash size={14} weight="duotone" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="border-t pt-4 space-y-3">
        <div className="space-y-2">
          <Label htmlFor="stage-name" className="text-xs">Stage Name</Label>
          <Input
            id="stage-name"
            value={newStageName}
            onChange={(e) => setNewStageName(e.target.value)}
            placeholder="e.g., Planning, Execution, Review"
            className="h-9"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label htmlFor="start-date" className="text-xs">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={newStartDate}
              onChange={(e) => setNewStartDate(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date" className="text-xs">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={newEndDate}
              onChange={(e) => setNewEndDate(e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        <Button
          onClick={handleAddStage}
          size="sm"
          className="w-full"
          variant="outline"
        >
          <Plus size={14} weight="bold" />
          Add Stage
        </Button>
      </div>
    </div>
  )
}
