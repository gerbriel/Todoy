import { useState } from 'react'
import { Campaign, Task, Label, List, FilterState, Project, StageDate } from '@/lib/types'
import { Button } from './ui/button'
import { CaretLeft, CaretRight, Calendar as CalendarIcon } from '@phosphor-icons/react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns'
import { ScrollArea } from './ui/scroll-area'
import { Badge } from './ui/badge'
import { getLabelColor } from '@/lib/helpers'
import { cn } from '@/lib/utils'
import TaskDetailDialog from './TaskDetailDialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

interface CalendarViewProps {
  campaigns: Campaign[]
  tasks: Task[]
  setTasks: (updater: (tasks: Task[]) => Task[]) => void
  labels: Label[]
  setLabels: (updater: (labels: Label[]) => Label[]) => void
  lists: List[]
  activeCampaignId: string | null
  filters: FilterState
  projects?: Project[]
  viewLevel?: 'campaign' | 'project' | 'all'
}

export default function CalendarView({
  campaigns,
  tasks,
  setTasks,
  labels,
  setLabels,
  lists,
  activeCampaignId,
  filters,
  projects = [],
  viewLevel = 'campaign',
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [calendarMode, setCalendarMode] = useState<'tasks' | 'stages' | 'both'>('both')

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const visibleTasks = activeCampaignId
    ? tasks.filter(t => t.campaignId === activeCampaignId)
    : tasks

  const getTasksForDate = (date: Date) => {
    return visibleTasks.filter(task => {
      if (!task.dueDate) return false
      return isSameDay(new Date(task.dueDate), date)
    })
  }

  const getStageDatesForDate = (date: Date): StageDate[] => {
    const stages: StageDate[] = []

    if (activeCampaignId) {
      const campaign = campaigns.find(c => c.id === activeCampaignId)
      if (campaign?.stageDates) {
        campaign.stageDates.forEach(stage => {
          const stageStart = new Date(stage.startDate)
          const stageEnd = new Date(stage.endDate)
          if (isWithinInterval(date, { start: stageStart, end: stageEnd })) {
            stages.push(stage)
          }
        })
      }
    } else if (viewLevel === 'all') {
      campaigns.forEach(campaign => {
        campaign.stageDates?.forEach(stage => {
          const stageStart = new Date(stage.startDate)
          const stageEnd = new Date(stage.endDate)
          if (isWithinInterval(date, { start: stageStart, end: stageEnd })) {
            stages.push({ ...stage, stageName: `${campaign.title}: ${stage.stageName}` })
          }
        })
      })

      projects.forEach(project => {
        project.stageDates?.forEach(stage => {
          const stageStart = new Date(stage.startDate)
          const stageEnd = new Date(stage.endDate)
          if (isWithinInterval(date, { start: stageStart, end: stageEnd })) {
            stages.push({ ...stage, stageName: `${project.title}: ${stage.stageName}` })
          }
        })
      })
    }

    return stages
  }

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const handleToday = () => setCurrentDate(new Date())

  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) : null

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrevMonth}>
              <CaretLeft size={16} weight="bold" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextMonth}>
              <CaretRight size={16} weight="bold" />
            </Button>
            <h3 className="text-lg font-semibold ml-2">
              {format(currentDate, 'MMMM yyyy')}
            </h3>
          </div>

          <Select value={calendarMode} onValueChange={(v) => setCalendarMode(v as typeof calendarMode)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tasks">Tasks Only</SelectItem>
              <SelectItem value="stages">Stages Only</SelectItem>
              <SelectItem value="both">Tasks & Stages</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-muted-foreground">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day) => {
              const dayTasks = getTasksForDate(day)
              const dayStages = getStageDatesForDate(day)
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isToday = isSameDay(day, new Date())
              const showTasks = calendarMode === 'tasks' || calendarMode === 'both'
              const showStages = calendarMode === 'stages' || calendarMode === 'both'

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'min-h-[120px] p-2 rounded-lg border transition-colors',
                    isCurrentMonth ? 'bg-card' : 'bg-muted/30',
                    isToday && 'ring-2 ring-accent'
                  )}
                >
                  <div className={cn(
                    'text-xs font-medium mb-2',
                    isToday && 'text-accent font-semibold',
                    !isCurrentMonth && 'text-muted-foreground'
                  )}>
                    {format(day, 'd')}
                  </div>

                  <div className="space-y-1">
                    {showStages && dayStages.map((stage, idx) => (
                      <div
                        key={`${stage.id}-${idx}`}
                        className="text-[10px] px-1.5 py-0.5 rounded truncate"
                        style={{
                          backgroundColor: `${stage.color}20`,
                          borderLeft: `3px solid ${stage.color}`,
                        }}
                        title={stage.stageName}
                      >
                        {stage.stageName}
                      </div>
                    ))}

                    {showTasks && dayTasks.map((task) => {
                      const taskLabels = labels.filter(l => task.labelIds.includes(l.id))
                      const firstLabel = taskLabels[0]

                      return (
                        <button
                          key={task.id}
                          onClick={() => setSelectedTaskId(task.id)}
                          className="w-full text-left text-[10px] px-1.5 py-0.5 rounded hover:ring-1 ring-accent transition-all truncate bg-primary/10 border-l-2 border-primary"
                          title={task.title}
                        >
                          {firstLabel && (
                            <span
                              className="inline-block w-1.5 h-1.5 rounded-full mr-1"
                              style={{ backgroundColor: getLabelColor(firstLabel.color) }}
                            />
                          )}
                          {task.title}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </ScrollArea>

      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          tasks={tasks}
          setTasks={setTasks}
          labels={labels}
          setLabels={setLabels}
          campaigns={campaigns}
          lists={lists}
          open={!!selectedTaskId}
          onOpenChange={(open) => !open && setSelectedTaskId(null)}
        />
      )}
    </div>
  )
}

