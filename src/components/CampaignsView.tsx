import { Campaign, Project, Task } from '@/lib/types'
import { Card } from './ui/card'
import { ScrollArea } from './ui/scroll-area'
import { Badge } from './ui/badge'
import { Target, CalendarBlank, CurrencyDollar } from '@phosphor-icons/react'
import { getCampaignStageLabel } from '@/lib/helpers'
import { format } from 'date-fns'

interface CampaignsViewProps {
  campaigns: Campaign[]
  projects: Project[]
  tasks: Task[]
  onNavigateToCampaign: (campaignId: string) => void
}

export default function CampaignsView({
  campaigns,
  projects,
  tasks,
  onNavigateToCampaign,
}: CampaignsViewProps) {
  const getProjectForCampaign = (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId)
    if (!campaign?.projectId) return null
    return projects.find(p => p.id === campaign.projectId)
  }

  const getTaskCount = (campaignId: string) => {
    return tasks.filter(t => t.campaignId === campaignId).length
  }

  const getCompletedTaskCount = (campaignId: string) => {
    return tasks.filter(t => t.campaignId === campaignId && t.subtasks?.every(st => st.completed)).length
  }

  // Filter out archived campaigns
  const activeCampaigns = campaigns.filter(c => !c.archived)
  
  const sortedCampaigns = [...activeCampaigns].sort((a, b) => {
    if (a.launchDate && b.launchDate) {
      return new Date(a.launchDate).getTime() - new Date(b.launchDate).getTime()
    }
    if (a.launchDate) return -1
    if (b.launchDate) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <ScrollArea className="h-full">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-foreground mb-2">All Campaigns</h2>
          <p className="text-muted-foreground">
            {activeCampaigns.length} {activeCampaigns.length === 1 ? 'campaign' : 'campaigns'}
          </p>
        </div>

        {sortedCampaigns.length === 0 ? (
          <Card className="p-12 text-center">
            <Target size={48} className="mx-auto mb-4 text-muted-foreground" weight="duotone" />
            <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
            <p className="text-muted-foreground">Create your first campaign to get started</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedCampaigns.map(campaign => {
              const project = getProjectForCampaign(campaign.id)
              const taskCount = getTaskCount(campaign.id)
              const completedCount = getCompletedTaskCount(campaign.id)
              const progressPercent = taskCount > 0 ? (completedCount / taskCount) * 100 : 0

              return (
                <Card
                  key={campaign.id}
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onNavigateToCampaign(campaign.id)}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{campaign.title}</h3>
                        {project && (
                          <p className="text-xs text-muted-foreground truncate">{project.title}</p>
                        )}
                      </div>
                      {campaign.campaignStage && (
                        <Badge variant="outline" className="shrink-0">
                          {getCampaignStageLabel(campaign.campaignStage)}
                        </Badge>
                      )}
                    </div>

                    {campaign.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {campaign.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {campaign.launchDate && (
                        <div className="flex items-center gap-1">
                          <CalendarBlank size={14} weight="duotone" />
                          {format(new Date(campaign.launchDate), 'MMM d, yyyy')}
                        </div>
                      )}
                      
                      {campaign.budget && (
                        <div className="flex items-center gap-1">
                          <CurrencyDollar size={14} weight="duotone" />
                          ${campaign.budget.toLocaleString()}
                        </div>
                      )}
                    </div>

                    {taskCount > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{completedCount} / {taskCount} tasks</span>
                          <span>{Math.round(progressPercent)}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent transition-all"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
