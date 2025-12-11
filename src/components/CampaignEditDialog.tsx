import { useState } from 'react'
import { Campaign, CampaignType, CampaignStage, Project } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { toast } from 'sonner'
import { Separator } from './ui/separator'
import { Folder, Archive, DotsThree, ArrowsLeftRight } from '@phosphor-icons/react'
import { campaignsService } from '@/services/campaigns.service'
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

interface CampaignEditDialogProps {
  campaign: Campaign
  campaigns: Campaign[]
  setCampaigns: (updater: (campaigns: Campaign[]) => Campaign[]) => void
  projects: Project[]
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
  const [planningStartDate, setPlanningStartDate] = useState(campaign.planningStartDate || '')
  const [launchDate, setLaunchDate] = useState(campaign.launchDate || '')
  const [endDate, setEndDate] = useState(campaign.endDate || '')
  const [followUpDate, setFollowUpDate] = useState(campaign.followUpDate || '')
  const [stageDates, setStageDates] = useState(campaign.stageDates || [])

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Campaign title cannot be empty')
      return
    }

    try {
      await campaignsService.update(campaign.id, {
        title: title.trim(),
        description: description.trim(),
        projectId: projectId || undefined,
        campaignType: campaignType || undefined,
        campaignStage: campaignStage || undefined,
        budget: budget ? parseFloat(budget) : undefined,
        actualSpend: actualSpend ? parseFloat(actualSpend) : undefined,
        goals: goals.trim() || undefined,
        planningStartDate: planningStartDate || undefined,
        launchDate: launchDate || undefined,
        endDate: endDate || undefined,
        followUpDate: followUpDate || undefined,
        stageDates,
      })
      toast.success('Campaign updated')
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
    setPlanningStartDate(campaign.planningStartDate || '')
    setLaunchDate(campaign.launchDate || '')
    setEndDate(campaign.endDate || '')
    setFollowUpDate(campaign.followUpDate || '')
    setStageDates(campaign.stageDates || [])
    onOpenChange(false)
  }

  const handleArchive = async () => {
    try {
      await campaignsService.update(campaign.id, { archived: true })
      toast.success('Campaign archived')
      onOpenChange(false)
    } catch (error) {
      console.error('Error archiving campaign:', error)
      toast.error('Failed to archive campaign')
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
            <Label>Key Dates</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="planning-start" className="text-sm font-normal">
                  Planning Start Date
                </Label>
                <Input
                  id="planning-start"
                  type="date"
                  value={planningStartDate}
                  onChange={(e) => setPlanningStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="launch-date" className="text-sm font-normal">
                  Launch Date
                </Label>
                <Input
                  id="launch-date"
                  type="date"
                  value={launchDate}
                  onChange={(e) => setLaunchDate(e.target.value)}
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

              <div className="space-y-2">
                <Label htmlFor="followup-date" className="text-sm font-normal">
                  Follow-up Date
                </Label>
                <Input
                  id="followup-date"
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                />
              </div>
            </div>
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
    </Dialog>
  )
}
