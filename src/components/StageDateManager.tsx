import { useState } from 'react'
import { StageDate } from '@/lib/types'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Plus, Trash, CalendarBlank, Check, Pencil, X } from '@phosphor-icons/react'
import { generateId } from '@/lib/helpers'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Checkbox } from './ui/checkbox'
import { cn } from '@/lib/utils'

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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editStartDate, setEditStartDate] = useState('')
  const [editEndDate, setEditEndDate] = useState('')

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
      completed: false,
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

  const handleToggleComplete = (stageId: string) => {
    onChange(stageDates.map(s => 
      s.id === stageId ? { ...s, completed: !s.completed } : s
    ))
  }

  const handleStartEdit = (stage: StageDate) => {
    setEditingId(stage.id)
    setEditName(stage.stageName)
    setEditStartDate(stage.startDate)
    setEditEndDate(stage.endDate)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditStartDate('')
    setEditEndDate('')
  }

  const handleSaveEdit = () => {
    if (!editName.trim()) {
      toast.error('Stage name is required')
      return
    }
    if (!editStartDate || !editEndDate) {
      toast.error('Both start and end dates are required')
      return
    }
    if (new Date(editStartDate) > new Date(editEndDate)) {
      toast.error('Start date must be before end date')
      return
    }

    onChange(stageDates.map(s => 
      s.id === editingId 
        ? { ...s, stageName: editName.trim(), startDate: editStartDate, endDate: editEndDate }
        : s
    ))
    handleCancelEdit()
    toast.success('Stage updated')
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
              className="flex items-start gap-2 p-3 bg-muted rounded-lg"
            >
              {/* Completion checkbox */}
              <Checkbox
                checked={stage.completed || false}
                onCheckedChange={() => handleToggleComplete(stage.id)}
                className="mt-0.5"
              />

              <div
                className="w-3 h-3 rounded-full shrink-0 mt-0.5"
                style={{ backgroundColor: stage.color }}
              />

              {editingId === stage.id ? (
                // Edit mode
                <div className="flex-1 space-y-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Stage name"
                    className="h-8 text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Input
                      type="date"
                      value={editEndDate}
                      onChange={(e) => setEditEndDate(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      className="h-7"
                    >
                      <Check size={14} weight="bold" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelEdit}
                      className="h-7"
                    >
                      <X size={14} weight="bold" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                // View mode
                <>
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      "font-medium text-sm truncate",
                      stage.completed && "line-through text-muted-foreground"
                    )}>
                      {stage.stageName}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <CalendarBlank size={12} weight="duotone" />
                      {stage.startDate && stage.endDate ? (
                        <>
                          {format(new Date(stage.startDate), 'MMM d, yyyy')} → {format(new Date(stage.endDate), 'MMM d, yyyy')}
                        </>
                      ) : (
                        <span className="text-destructive">Invalid dates</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEdit(stage)}
                      className="shrink-0 h-7 w-7 p-0"
                    >
                      <Pencil size={14} weight="duotone" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveStage(stage.id)}
                      className="shrink-0 h-7 w-7 p-0"
                    >
                      <Trash size={14} weight="duotone" />
                    </Button>
                  </div>
                </>
              )}
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
