import { useState, useEffect } from 'react'
import { Campaign, CampaignType, CampaignStage, Project, List, Task } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { toast } from 'sonner'
import { Separator } from './ui/separator'
import { Folder, Archive, DotsThree, ArrowsLeftRight, Copy, ArrowsClockwise, CalendarX } from '@phosphor-icons/react'
import { campaignsService } from '@/services/campaigns.service'
import { listsService } from '@/services/lists.service'
import { tasksService } from '@/services/tasks.service'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import StageDateManager from './StageDateManager'
import DuplicateDialog from './DuplicateDialog'
import { addDays } from 'date-fns'

interface CampaignEditDialogProps {
  campaign: Campaign
  campaigns: Campaign[]
  setCampaigns: (updater: (campaigns: Campaign[]) => Campaign[]) => void
  projects: Project[]
  lists: List[]
  tasks?: Task[]
  setLists?: (updater: (lists: List[]) => List[]) => void
  setTasks?: (updater: (tasks: Task[]) => Task[]) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

const campaignTypes: { value: CampaignType; label: string }[] = [
  { value: 'webinar', label: 'Webinar' },
  { value: 'tradeshow', label: 'Trade Show' },
  { value: 'paid-social', label: 'Paid Social' },
  { value: 'content', label: 'Content Marketing' },
  { value: 'email', label: 'Email Campaign' },
  { value: 'event', label: 'Event' },
  { value: 'other', label: 'Other' },
]

const campaignStages: { value: CampaignStage; label: string }[] = [
  { value: 'planning', label: 'Planning' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'launched', label: 'Launched' },
  { value: 'completed', label: 'Completed' },
  { value: 'follow-up', label: 'Follow-up' },
]

export default function CampaignEditDialog({
  campaign,
  campaigns,
  setCampaigns,
  projects,
  lists,
  tasks,
  setLists,
  setTasks,
  open,
  onOpenChange,
}: CampaignEditDialogProps) {
  const [title, setTitle] = useState(campaign.title)
  const [description, setDescription] = useState(campaign.description || '')
  const [projectId, setProjectId] = useState(campaign.projectId || '')
  const [campaignType, setCampaignType] = useState<CampaignType | ''>(campaign.campaignType || '')
  const [campaignStage, setCampaignStage] = useState<CampaignStage | ''>(campaign.campaignStage || '')
  const [budget, setBudget] = useState(campaign.budget?.toString() || '')
  const [actualSpend, setActualSpend] = useState(campaign.actualSpend?.toString() || '')
  const [goals, setGoals] = useState(campaign.goals || '')
  const [startDate, setStartDate] = useState(
    campaign.startDate ? new Date(campaign.startDate).toISOString().split('T')[0] : ''
  )
  const [endDate, setEndDate] = useState(
    campaign.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : ''
  )
  const [stageDates, setStageDates] = useState(campaign.stageDates || [])
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)

  // Update form when campaign prop changes (e.g., after drag-and-drop)
  useEffect(() => {
    setTitle(campaign.title)
    setDescription(campaign.description || '')
    setProjectId(campaign.projectId || '')
    setCampaignType(campaign.campaignType || '')
    setCampaignStage(campaign.campaignStage || '')
    setBudget(campaign.budget?.toString() || '')
    setActualSpend(campaign.actualSpend?.toString() || '')
    setGoals(campaign.goals || '')
    // Convert ISO dates to YYYY-MM-DD format for date inputs
    setStartDate(campaign.startDate ? new Date(campaign.startDate).toISOString().split('T')[0] : '')
    setEndDate(campaign.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : '')
    setStageDates(campaign.stageDates || [])
  }, [campaign])

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Campaign title cannot be empty')
      return
    }

    try {
      const hadDates = !!(campaign.startDate && campaign.endDate)
      const nowHasDates = !!(startDate && endDate)
      const datesRemoved = hadDates && !nowHasDates
      
      const updates = {
        title: title.trim(),
        description: description.trim(),
        projectId: projectId || undefined,
        campaignType: campaignType || undefined,
        campaignStage: campaignStage || undefined,
        budget: budget ? parseFloat(budget) : undefined,
        actualSpend: actualSpend ? parseFloat(actualSpend) : undefined,
        goals: goals.trim() || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        stageDates,
      }
      
      await campaignsService.update(campaign.id, updates)
      
      // Update local campaign state immediately
      setCampaigns(prev => prev.map(c =>
        c.id === campaign.id
          ? { ...c, ...updates }
          : c
      ))
      
      // If dates were removed, cascade removal to tasks
      if (datesRemoved && tasks && setTasks) {
        const campaignTasks = tasks.filter(t => t.campaignId === campaign.id)
        
        if (campaignTasks.length > 0) {
          // Remove dates from all tasks in this campaign
          for (const task of campaignTasks) {
            await tasksService.update(task.id, {
              startDate: undefined,
              dueDate: undefined
            })
          }
          
          // Update task state
          setTasks(prev => prev.map(t =>
            t.campaignId === campaign.id
              ? { ...t, startDate: undefined, dueDate: undefined }
              : t
          ))
          
          toast.success(`Campaign updated. Removed dates from ${campaignTasks.length} task(s)`)
        } else {
          toast.success('Campaign updated')
        }
      } else {
        toast.success('Campaign updated')
      }
      
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating campaign:', error)
      toast.error('Failed to update campaign')
    }
  }

  const handleCancel = () => {
    // Reset to original values
    setTitle(campaign.title)
    setDescription(campaign.description || '')
    setProjectId(campaign.projectId || '')
    setCampaignType(campaign.campaignType || '')
    setCampaignStage(campaign.campaignStage || '')
    setBudget(campaign.budget?.toString() || '')
    setActualSpend(campaign.actualSpend?.toString() || '')
    setGoals(campaign.goals || '')
    setStartDate(campaign.startDate || '')
    setEndDate(campaign.endDate || '')
    setStageDates(campaign.stageDates || [])
    onOpenChange(false)
  }

  const handleArchive = async () => {
    try {
      const result = await campaignsService.update(campaign.id, { archived: true })
      console.log('Archived campaign:', result, 'archived flag:', result.archived)
      
      // Optimistically remove from parent view
      setCampaigns(prev => prev.filter(c => c.id !== campaign.id))
      
      toast.success('Campaign archived')
      onOpenChange(false)
      // Real-time subscription will sync the state
    } catch (error) {
      console.error('Error archiving campaign:', error)
      toast.error('Failed to archive campaign')
    }
  }

  const handleDuplicate = async (targetProjectId: string, targetCampaignId?: string, targetListId?: string, newName?: string) => {
    try {
      const campaignName = newName || `${campaign.title} (Copy)`
      const duplicatedCampaign = await campaignsService.duplicate(campaign.id, campaignName, targetProjectId)
      
      // Optimistically add to local state
      setCampaigns(prev => [...prev, duplicatedCampaign])
      
      // Refetch lists and tasks for the new campaign to populate UI immediately
      if (setLists && setTasks) {
        const newLists = await listsService.getByCampaign(duplicatedCampaign.id)
        const newTasks = await tasksService.getByCampaign(duplicatedCampaign.id)
        
        setLists(prev => [...prev, ...newLists])
        setTasks(prev => [...prev, ...newTasks])
      }
      
      toast.success('Campaign duplicated successfully')
      setShowDuplicateDialog(false)
      onOpenChange(false)
    } catch (error) {
      console.error('Error duplicating campaign:', error)
      toast.error('Failed to duplicate campaign')
    }
  }

  const handleMoveToProject = async (newProjectId: string | undefined) => {
    try {
      await campaignsService.update(campaign.id, { projectId: newProjectId })
      setProjectId(newProjectId || '')
      const projectName = newProjectId 
        ? projects.find(p => p.id === newProjectId)?.title 
        : 'standalone'
      toast.success(`Moved to ${projectName}`)
    } catch (error) {
      console.error('Error moving campaign:', error)
      toast.error('Failed to move campaign')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Campaign</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-title">Campaign Name</Label>
              <Input
                id="campaign-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter campaign name..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-project">Project (Optional)</Label>
              <Select value={projectId || '__none__'} onValueChange={(val) => setProjectId(val === '__none__' ? '' : val)}>
                <SelectTrigger id="campaign-project">
                  <SelectValue placeholder="Select a project..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No Project</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        <Folder size={14} weight="duotone" />
                        {project.title}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaign-description">Description</Label>
            <Textarea
              id="campaign-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your campaign..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-type">Campaign Type</Label>
              <Select value={campaignType || '__none__'} onValueChange={(value) => setCampaignType(value === '__none__' ? '' : value as CampaignType)}>
                <SelectTrigger id="campaign-type">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {campaignTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-stage">Campaign Stage</Label>
              <Select value={campaignStage || '__none__'} onValueChange={(value) => setCampaignStage(value === '__none__' ? '' : value as CampaignStage)}>
                <SelectTrigger id="campaign-stage">
                  <SelectValue placeholder="Select stage..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {campaignStages.map(stage => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="campaign-goals">Goals & Objectives</Label>
            <Textarea
              id="campaign-goals"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder="What are the goals for this campaign?"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-budget">Budget ($)</Label>
              <Input
                id="campaign-budget"
                type="number"
                min="0"
                step="0.01"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-spend">Actual Spend ($)</Label>
              <Input
                id="campaign-spend"
                type="number"
                min="0"
                step="0.01"
                value={actualSpend}
                onChange={(e) => setActualSpend(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Campaign Timeline</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date" className="text-sm font-normal">
                  Start Date
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date" className="text-sm font-normal">
                  End Date
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            
            {/* Date Management Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (!tasks || !setTasks) return
                  
                  if (!startDate || !endDate) {
                    toast.error('Campaign must have dates assigned first')
                    return
                  }
                  
                  const campaignTasks = tasks.filter(t => t.campaignId === campaign.id && t.dueDate)
                  
                  if (campaignTasks.length === 0) {
                    toast.info('No scheduled tasks found in this campaign')
                    return
                  }
                  
                  try {
                    const campaignStartDate = new Date(startDate)
                    const dueDate = addDays(campaignStartDate, 1)
                    const startDateISO = campaignStartDate.toISOString()
                    const dueDateISO = dueDate.toISOString()
                    
                    for (const task of campaignTasks) {
                      await tasksService.update(task.id, {
                        startDate: startDateISO,
                        dueDate: dueDateISO
                      })
                    }
                    
                    setTasks(prevTasks =>
                      prevTasks.map(t =>
                        campaignTasks.some(ct => ct.id === t.id)
                          ? { ...t, startDate: startDateISO, dueDate: dueDateISO }
                          : t
                      )
                    )
                    
                    toast.success(`Reassigned ${campaignTasks.length} task(s) to campaign start date`)
                  } catch (error) {
                    console.error('Error reassigning tasks:', error)
                    toast.error('Failed to reassign tasks')
                  }
                }}
                className="flex-1"
                title="Reassign all tasks to campaign start date"
              >
                <ArrowsClockwise className="mr-2" size={16} weight="bold" />
                Reassign Tasks
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (!tasks || !setTasks) return
                  
                  const campaignTasks = tasks.filter(t => t.campaignId === campaign.id && (t.startDate || t.dueDate))
                  
                  if (campaignTasks.length === 0) {
                    toast.info('No scheduled tasks found in this campaign')
                    return
                  }
                  
                  try {
                    for (const task of campaignTasks) {
                      await tasksService.update(task.id, {
                        startDate: null as any,
                        dueDate: null as any
                      })
                    }
                    
                    setTasks(prevTasks =>
                      prevTasks.map(t =>
                        campaignTasks.some(ct => ct.id === t.id)
                          ? { ...t, startDate: undefined, dueDate: undefined }
                          : t
                      )
                    )
                    
                    toast.success(`Removed dates from ${campaignTasks.length} task(s)`)
                  } catch (error) {
                    console.error('Error removing task dates:', error)
                    toast.error('Failed to remove task dates')
                  }
                }}
                className="flex-1"
                title="Remove dates from all tasks in this campaign"
              >
                <CalendarX className="mr-2" size={16} weight="bold" />
                Unassign Tasks
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              <strong>Reassign:</strong> Move all scheduled tasks to campaign start date • <strong>Unassign:</strong> Remove dates from all tasks
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Custom Stage Dates & Milestones</Label>
            <p className="text-sm text-muted-foreground">
              Define custom stages and milestones for this campaign
            </p>
            <StageDateManager
              stageDates={stageDates}
              onChange={setStageDates}
              entityType="campaign"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 flex-col sm:flex-row sm:justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="text-muted-foreground hover:text-foreground sm:mr-auto"
              >
                <DotsThree size={20} weight="bold" className="mr-2" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <ArrowsLeftRight size={16} className="mr-2" />
                  Move to Project
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => handleMoveToProject(undefined)}>
                    <span className="text-muted-foreground">No Project (Standalone)</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {projects.map(project => (
                    <DropdownMenuItem 
                      key={project.id} 
                      onClick={() => handleMoveToProject(project.id)}
                      disabled={project.id === projectId}
                    >
                      <Folder size={14} className="mr-2" />
                      {project.title}
                      {project.id === projectId && <span className="ml-auto text-xs text-muted-foreground">(current)</span>}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => setShowDuplicateDialog(true)} className="text-blue-600">
                <Copy size={16} className="mr-2" />
                Duplicate Campaign
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={handleArchive} className="text-orange-600">
                <Archive size={16} className="mr-2" />
                Archive Campaign
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      <DuplicateDialog
        open={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}
        type="campaign"
        itemName={campaign.title}
        onDuplicate={handleDuplicate}
        projects={projects}
        campaigns={campaigns}
        lists={lists}
        currentProjectId={campaign.projectId}
      />
    </Dialog>
  )
}
