import { useState, useEffect } from 'react'
import { Board, CampaignType, CampaignStage } from '@/lib/types'
import { getCampaignTypeLabel, getCampaignStageLabel, formatCurrency } from '@/lib/helpers'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { toast } from 'sonner'
import { Separator } from './ui/separator'
import { Calendar } from './ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { CalendarBlank } from '@phosphor-icons/react'
import { format } from 'date-fns'

interface BoardDetailDialogProps {
  board: Board
  boards: Board[]
  setBoards: (updater: (boards: Board[]) => Board[]) => void
  isOpen: boolean
  onClose: () => void
}

export default function BoardDetailDialog({
  board,
  boards,
  setBoards,
  isOpen,
  onClose,
}: BoardDetailDialogProps) {
  const [title, setTitle] = useState(board.title)
  const [description, setDescription] = useState(board.description)
  const [parentId, setParentId] = useState<string | undefined>(board.parentId)
  const [campaignType, setCampaignType] = useState<CampaignType>(board.campaignType || 'other')
  const [campaignStage, setCampaignStage] = useState<CampaignStage>(board.campaignStage || 'planning')
  const [budget, setBudget] = useState(board.budget?.toString() || '')
  const [actualSpend, setActualSpend] = useState(board.actualSpend?.toString() || '')
  const [goals, setGoals] = useState(board.goals || '')
  const [planningStartDate, setPlanningStartDate] = useState<Date | undefined>(
    board.planningStartDate ? new Date(board.planningStartDate) : undefined
  )
  const [launchDate, setLaunchDate] = useState<Date | undefined>(
    board.launchDate ? new Date(board.launchDate) : undefined
  )
  const [endDate, setEndDate] = useState<Date | undefined>(
    board.endDate ? new Date(board.endDate) : undefined
  )
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>(
    board.followUpDate ? new Date(board.followUpDate) : undefined
  )

  useEffect(() => {
    setTitle(board.title)
    setDescription(board.description)
    setParentId(board.parentId)
    setCampaignType(board.campaignType || 'other')
    setCampaignStage(board.campaignStage || 'planning')
    setBudget(board.budget?.toString() || '')
    setActualSpend(board.actualSpend?.toString() || '')
    setGoals(board.goals || '')
    setPlanningStartDate(board.planningStartDate ? new Date(board.planningStartDate) : undefined)
    setLaunchDate(board.launchDate ? new Date(board.launchDate) : undefined)
    setEndDate(board.endDate ? new Date(board.endDate) : undefined)
    setFollowUpDate(board.followUpDate ? new Date(board.followUpDate) : undefined)
  }, [board])

  const handleSave = () => {
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }

    if (parentId === board.id) {
      toast.error('Cannot set item as its own parent')
      return
    }

    setBoards(currentBoards =>
      currentBoards.map(b =>
        b.id === board.id
          ? {
              ...b,
              title: title.trim(),
              description: description.trim(),
              parentId: parentId || undefined,
              ...(board.type === 'campaign' && {
                campaignType,
                campaignStage,
              }),
              budget: budget ? parseFloat(budget) : undefined,
              actualSpend: actualSpend ? parseFloat(actualSpend) : undefined,
              goals: goals.trim() || undefined,
              planningStartDate: planningStartDate?.toISOString(),
              launchDate: launchDate?.toISOString(),
              endDate: endDate?.toISOString(),
              followUpDate: followUpDate?.toISOString(),
            }
          : b
      )
    )

    toast.success('Saved')
    onClose()
  }

  const availableParents = boards.filter(b => {
    if (b.id === board.id) return false
    
    if (board.type === 'project') return false
    if (board.type === 'campaign') return b.type === 'project'
    if (board.type === 'board') return b.type === 'campaign' || b.type === 'project'
    
    return false
  })

  const budgetNum = budget ? parseFloat(budget) : 0
  const spendNum = actualSpend ? parseFloat(actualSpend) : 0
  const remaining = budgetNum - spendNum
  const percentSpent = budgetNum > 0 ? (spendNum / budgetNum) * 100 : 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {board.type === 'project' ? 'Project' : board.type === 'campaign' ? 'Campaign' : 'Board'} Details
          </DialogTitle>
          <DialogDescription>
            Configure settings, budget, goals, and timeline
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description..."
                rows={3}
              />
            </div>

            {availableParents.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="parent">Parent {board.type === 'campaign' ? 'Project' : board.type === 'board' ? 'Campaign/Project' : ''}</Label>
                <Select value={parentId || 'none'} onValueChange={(v) => setParentId(v === 'none' ? undefined : v)}>
                  <SelectTrigger id="parent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Standalone)</SelectItem>
                    {availableParents.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title} ({p.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {board.type === 'campaign' && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground">Campaign Details</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="campaign-type">Campaign Type</Label>
                    <Select value={campaignType} onValueChange={(v) => setCampaignType(v as CampaignType)}>
                      <SelectTrigger id="campaign-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="webinar">{getCampaignTypeLabel('webinar')}</SelectItem>
                        <SelectItem value="tradeshow">{getCampaignTypeLabel('tradeshow')}</SelectItem>
                        <SelectItem value="paid-social">{getCampaignTypeLabel('paid-social')}</SelectItem>
                        <SelectItem value="content">{getCampaignTypeLabel('content')}</SelectItem>
                        <SelectItem value="email">{getCampaignTypeLabel('email')}</SelectItem>
                        <SelectItem value="event">{getCampaignTypeLabel('event')}</SelectItem>
                        <SelectItem value="other">{getCampaignTypeLabel('other')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="campaign-stage">Campaign Stage</Label>
                    <Select value={campaignStage} onValueChange={(v) => setCampaignStage(v as CampaignStage)}>
                      <SelectTrigger id="campaign-stage">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">{getCampaignStageLabel('planning')}</SelectItem>
                        <SelectItem value="in-progress">{getCampaignStageLabel('in-progress')}</SelectItem>
                        <SelectItem value="launched">{getCampaignStageLabel('launched')}</SelectItem>
                        <SelectItem value="completed">{getCampaignStageLabel('completed')}</SelectItem>
                        <SelectItem value="follow-up">{getCampaignStageLabel('follow-up')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Budget & Goals</h4>
            
            <div className="space-y-2">
              <Label htmlFor="goals">Goals & Objectives</Label>
              <Textarea
                id="goals"
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="Define success metrics and objectives..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Budget</Label>
                <Input
                  id="budget"
                  type="number"
                  min="0"
                  step="100"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="actual-spend">Actual Spend</Label>
                <Input
                  id="actual-spend"
                  type="number"
                  min="0"
                  step="100"
                  value={actualSpend}
                  onChange={(e) => setActualSpend(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            {budgetNum > 0 && (
              <div className="bg-muted rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Budget Used</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(spendNum)} / {formatCurrency(budgetNum)}
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all"
                    style={{ width: `${Math.min(percentSpent, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className={remaining >= 0 ? 'text-green-600' : 'text-destructive'}>
                    {remaining >= 0 ? formatCurrency(remaining) + ' remaining' : formatCurrency(Math.abs(remaining)) + ' over budget'}
                  </span>
                  <span className="text-muted-foreground">{percentSpent.toFixed(1)}%</span>
                </div>
              </div>
            )}
          </div>

          <Separator />
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Timeline</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Planning Start</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarBlank size={16} className="mr-2" />
                      {planningStartDate ? format(planningStartDate, 'MMM d, yyyy') : 'Set date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={planningStartDate}
                      onSelect={setPlanningStartDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Launch Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarBlank size={16} className="mr-2" />
                      {launchDate ? format(launchDate, 'MMM d, yyyy') : 'Set date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={launchDate}
                      onSelect={setLaunchDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarBlank size={16} className="mr-2" />
                      {endDate ? format(endDate, 'MMM d, yyyy') : 'Set date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Follow-up Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarBlank size={16} className="mr-2" />
                      {followUpDate ? format(followUpDate, 'MMM d, yyyy') : 'Set date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={followUpDate}
                      onSelect={setFollowUpDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
