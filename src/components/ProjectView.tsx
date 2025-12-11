import { useState } from 'react'
import { Project, Campaign, Task, Organization } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Target, CheckSquare, Calendar, Plus, PencilSimple } from '@phosphor-icons/react'
import { getCampaignsForProject, getCampaignStageLabel } from '@/lib/helpers'
import { campaignsService } from '@/services/campaigns.service'
import { Badge } from './ui/badge'
import { format } from 'date-fns'
import { Button } from './ui/button'
import { toast } from 'sonner'
import ProjectEditDialog from './ProjectEditDialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'

interface ProjectViewProps {
  project: Project
  projects: Project[]
  setProjects: (updater: (projects: Project[]) => Project[]) => void
  campaigns: Campaign[]
  setCampaigns: (updater: (campaigns: Campaign[]) => Campaign[]) => void
  tasks: Task[]
  organization: Organization | null
  onNavigateToCampaign: (campaignId: string) => void
}

export default function ProjectView({
  project,
  projects,
  setProjects,
  campaigns,
  setCampaigns,
  tasks,
  organization,
  onNavigateToCampaign,
}: ProjectViewProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [newCampaignTitle, setNewCampaignTitle] = useState('')
  
  const projectCampaigns = getCampaignsForProject(campaigns, project.id)
  const sortedCampaigns = [...projectCampaigns].sort((a, b) => a.order - b.order)

  const handleCreateCampaign = async () => {
    if (!newCampaignTitle.trim()) {
      toast.error('Please enter a campaign title')
      return
    }

    try {
      const newCampaign = await campaignsService.create({
        title: newCampaignTitle.trim(),
        description: '',
        order: campaigns.length,
        projectId: project.id,
        campaignType: 'other',
        campaignStage: 'planning',
        orgId: organization?.id || '',
      })
      toast.success('Campaign created')
      setShowCreateDialog(false)
      setNewCampaignTitle('')
      onNavigateToCampaign(newCampaign.id)
    } catch (error) {
      console.error('Error creating campaign:', error)
      toast.error('Failed to create campaign')
    }
  }

  const getCampaignStats = (campaignId: string) => {
    const campaignTasks = tasks.filter(task => task.campaignId === campaignId)
    return {
      taskCount: campaignTasks.length,
    }
  }

  const getStageColor = (stage?: string) => {
    switch (stage) {
      case 'planning':
        return 'bg-label-blue text-white'
      case 'in-progress':
        return 'bg-label-orange text-white'
      case 'launched':
        return 'bg-label-purple text-white'
      case 'completed':
        return 'bg-label-green text-white'
      case 'follow-up':
        return 'bg-label-teal text-white'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="h-full overflow-auto p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">{project.title}</h2>
            {project.description && (
              <p className="text-muted-foreground">{project.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(true)}>
              <PencilSimple size={16} weight="bold" />
              Edit Project
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus size={16} weight="bold" />
              New Campaign
            </Button>
          </div>
        </div>

        {sortedCampaigns.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Target size={64} className="text-muted-foreground mb-4" weight="duotone" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No campaigns yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first campaign for this project
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus size={16} weight="bold" />
                Create Campaign
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedCampaigns.map(campaign => {
              const stats = getCampaignStats(campaign.id)
              return (
                <Card
                  key={campaign.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                  onClick={() => onNavigateToCampaign(campaign.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Target size={32} className="text-accent" weight="duotone" />
                      {campaign.campaignStage && (
                        <Badge className={getStageColor(campaign.campaignStage)}>
                          {getCampaignStageLabel(campaign.campaignStage)}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl">{campaign.title}</CardTitle>
                    {campaign.description && (
                      <CardDescription className="line-clamp-2">
                        {campaign.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {campaign.launchDate && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar size={16} weight="duotone" />
                          <span>Launch: {format(new Date(campaign.launchDate), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckSquare size={16} weight="duotone" />
                        <span>{stats.taskCount} task{stats.taskCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription>
              Create a new campaign for {project.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-title">Campaign Title</Label>
              <Input
                id="campaign-title"
                value={newCampaignTitle}
                onChange={(e) => setNewCampaignTitle(e.target.value)}
                placeholder="Enter campaign name..."
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCampaign()}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCampaign}>
              Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProjectEditDialog
        project={project}
        projects={projects}
        setProjects={setProjects}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
    </div>
  )
}
