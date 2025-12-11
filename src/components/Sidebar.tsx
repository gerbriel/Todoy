import { useState, useRef, useEffect, DragEvent } from 'react'
import { Plus, Kanban, CaretDown, CaretRight, Folder, Target, DotsThreeVertical, PencilSimple, DotsSixVertical, Stack, CheckSquare, Briefcase, ChartBar, Archive, Funnel, Tag } from '@phosphor-icons/react'
import { Project, Campaign, FilterState, List, StageTemplate, Task, Organization } from '@/lib/types'
import { NavigationView } from '@/App'
import { generateId, getProjects, getCampaignsForProject, getStandaloneCampaigns, getCampaignStageLabel } from '@/lib/helpers'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { projectsService } from '@/services/projects.service'
import { campaignsService } from '@/services/campaigns.service'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
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

interface SidebarProps {
  projects: Project[]
  setProjects: (updater: (projects: Project[]) => Project[]) => void
  campaigns: Campaign[]
  setCampaigns: (updater: (campaigns: Campaign[]) => Campaign[]) => void
  lists: List[]
  stageTemplates: StageTemplate[]
  tasks: Task[]
  activeProjectId: string | null
  activeCampaignId: string | null
  navigationView: NavigationView
  organization: Organization | null
  onNavigateToAllProjects: () => void
  onNavigateToAllCampaigns: () => void
  onNavigateToAllTasks: () => void
  onNavigateToMaster?: () => void
  onNavigateToArchive?: () => void
  onNavigateToOrganization?: () => void
  onNavigateToLabels?: () => void
  onNavigateToProject: (projectId: string) => void
  onNavigateToCampaign: (campaignId: string) => void
  filters: FilterState
  setFilters: (filters: FilterState) => void
}

export default function Sidebar({
  projects,
  setProjects,
  campaigns,
  setCampaigns,
  lists,
  stageTemplates,
  tasks,
  activeProjectId,
  activeCampaignId,
  navigationView,
  organization,
  onNavigateToAllProjects,
  onNavigateToAllCampaigns,
  onNavigateToAllTasks,
  onNavigateToMaster,
  onNavigateToArchive,
  onNavigateToOrganization,
  onNavigateToLabels,
  onNavigateToProject,
  onNavigateToCampaign,
  filters,
  setFilters,
}: SidebarProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createType, setCreateType] = useState<'project' | 'campaign'>('project')
  const [createProjectId, setCreateProjectId] = useState<string | undefined>()
  const [newTitle, setNewTitle] = useState('')
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null)
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [draggingCampaignId, setDraggingCampaignId] = useState<string | null>(null)
  const [draggingProjectId, setDraggingProjectId] = useState<string | null>(null)
  const [dragOverProjectId, setDragOverProjectId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const sortedProjects = getProjects(projects)
  const standaloneCampaigns = getStandaloneCampaigns(campaigns)

  useEffect(() => {
    if ((editingCampaignId || editingProjectId) && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingCampaignId, editingProjectId])

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects)
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId)
    } else {
      newExpanded.add(projectId)
    }
    setExpandedProjects(newExpanded)
  }

  const handleCreateNew = (type: 'project' | 'campaign', projectId?: string) => {
    setCreateType(type)
    setCreateProjectId(projectId)
    setNewTitle('')
    setShowCreateDialog(true)
  }

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      toast.error('Please enter a title')
      return
    }

    try {
      if (createType === 'project') {
        await projectsService.create({
          title: newTitle.trim(),
          description: '',
          order: projects.length,
          orgId: organization?.id || '',
        })
        toast.success('Project created')
      } else {
        const newCampaign = await campaignsService.create({
          title: newTitle.trim(),
          description: '',
          order: campaigns.length,
          projectId: createProjectId,
          campaignType: 'other',
          campaignStage: 'planning',
          orgId: organization?.id || '',
        })
        onNavigateToCampaign(newCampaign.id)
        
        if (createProjectId) {
          setExpandedProjects(prev => new Set(prev).add(createProjectId))
        }
        
        toast.success('Campaign created')
      }
      
      setShowCreateDialog(false)
      setNewTitle('')
    } catch (error) {
      console.error(`Error creating ${createType}:`, error)
      toast.error(`Failed to create ${createType}`)
    }
  }



  const handleStartEditCampaign = (campaign: Campaign) => {
    setEditingCampaignId(campaign.id)
    setEditingTitle(campaign.title)
  }

  const handleStartEditProject = (project: Project) => {
    setEditingProjectId(project.id)
    setEditingTitle(project.title)
  }

  const handleSaveEditCampaign = (campaignId: string) => {
    if (!editingTitle.trim()) {
      toast.error('Title cannot be empty')
      return
    }
    
    setCampaigns(currentCampaigns =>
      currentCampaigns.map(c =>
        c.id === campaignId ? { ...c, title: editingTitle.trim() } : c
      )
    )
    setEditingCampaignId(null)
    toast.success('Renamed')
  }

  const handleSaveEditProject = (projectId: string) => {
    if (!editingTitle.trim()) {
      toast.error('Title cannot be empty')
      return
    }
    
    setProjects(currentProjects =>
      currentProjects.map(p =>
        p.id === projectId ? { ...p, title: editingTitle.trim() } : p
      )
    )
    setEditingProjectId(null)
    toast.success('Renamed')
  }

  const handleCancelEdit = () => {
    setEditingCampaignId(null)
    setEditingProjectId(null)
    setEditingTitle('')
  }

  const handleCampaignDragStart = (e: DragEvent<HTMLDivElement>, campaign: Campaign) => {
    e.stopPropagation()
    setDraggingCampaignId(campaign.id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('campaignId', campaign.id)
    e.dataTransfer.setData('campaignProjectId', campaign.projectId || 'root')
  }

  const handleCampaignDragEnd = () => {
    setDraggingCampaignId(null)
  }

  const handleCampaignDragOver = (e: DragEvent<HTMLDivElement>, targetCampaign: Campaign) => {
    e.preventDefault()
    e.stopPropagation()
    const campaignId = e.dataTransfer.types.includes('text/plain') ? null : e.dataTransfer.getData('campaignId')
    if (campaignId && campaignId !== targetCampaign.id) {
      e.dataTransfer.dropEffect = 'move'
    }
  }

  const handleCampaignDrop = (e: DragEvent<HTMLDivElement>, targetCampaign: Campaign) => {
    e.preventDefault()
    e.stopPropagation()
    
    const draggedCampaignId = e.dataTransfer.getData('campaignId')
    const draggedCampaignProjectId = e.dataTransfer.getData('campaignProjectId')

    if (!draggedCampaignId || draggedCampaignId === targetCampaign.id) return

    const projectId = targetCampaign.projectId || 'root'
    if (draggedCampaignProjectId !== projectId) return

    setCampaigns(currentCampaigns => {
      const draggedCampaign = currentCampaigns.find(c => c.id === draggedCampaignId)
      if (!draggedCampaign) return currentCampaigns

      const siblingCampaigns = currentCampaigns
        .filter(c => (c.projectId || 'root') === projectId)
        .sort((a, b) => a.order - b.order)

      const draggedIndex = siblingCampaigns.findIndex(c => c.id === draggedCampaignId)
      const targetIndex = siblingCampaigns.findIndex(c => c.id === targetCampaign.id)

      if (draggedIndex === targetIndex) return currentCampaigns

      const reorderedCampaigns = [...siblingCampaigns]
      const [movedCampaign] = reorderedCampaigns.splice(draggedIndex, 1)
      reorderedCampaigns.splice(targetIndex, 0, movedCampaign)

      const updatedCampaigns = reorderedCampaigns.map((c, index) => ({
        ...c,
        order: index,
      }))

      return currentCampaigns.map(c => {
        const updated = updatedCampaigns.find(uc => uc.id === c.id)
        return updated || c
      })
    })

    toast.success('Campaign reordered')
  }

  const renderCampaignItem = (campaign: Campaign, depth: number = 0) => {
    const isActive = activeCampaignId === campaign.id && navigationView === 'campaign'
    const isEditing = editingCampaignId === campaign.id
    const isDragging = draggingCampaignId === campaign.id

    return (
      <div key={campaign.id}>
        <div
          draggable={!isEditing}
          onDragStart={(e) => handleCampaignDragStart(e, campaign)}
          onDragEnd={handleCampaignDragEnd}
          onDragOver={(e) => handleCampaignDragOver(e, campaign)}
          onDrop={(e) => handleCampaignDrop(e, campaign)}
          className={cn(
            "flex items-center gap-1 group transition-opacity",
            isDragging && "opacity-40"
          )}
        >
          <div className="w-6" />
          
          {!isEditing && (
            <DotsSixVertical size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing" weight="bold" />
          )}
          
          {isEditing ? (
            <div className="flex-1 flex items-center gap-1" style={{ paddingLeft: `${depth * 12 + 8}px` }}>
              <Input
                ref={inputRef}
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveEditCampaign(campaign.id)
                  } else if (e.key === 'Escape') {
                    handleCancelEdit()
                  }
                }}
                onBlur={() => handleSaveEditCampaign(campaign.id)}
                className="h-7 text-sm"
              />
            </div>
          ) : (
            <button
              onClick={() => onNavigateToCampaign(campaign.id)}
              className={cn(
                'flex-1 text-left px-2 py-1.5 rounded text-sm transition-colors truncate flex items-center gap-2',
                isActive
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-foreground hover:bg-muted'
              )}
              title={campaign.title}
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
              <Target size={14} weight="duotone" />
              <span className="flex-1 truncate">{campaign.title}</span>
              {campaign.campaignStage && (
                <span className="text-[10px] opacity-60 uppercase tracking-wide">
                  {getCampaignStageLabel(campaign.campaignStage).slice(0, 3)}
                </span>
              )}
            </button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1 opacity-0 group-hover:opacity-100 hover:bg-muted rounded transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                <DotsThreeVertical size={14} weight="bold" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleStartEditCampaign(campaign)}>
                <PencilSimple size={14} className="mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {projects.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Move to Project
                  </div>
                  {projects.map(project => (
                    <DropdownMenuItem
                      key={project.id}
                      onClick={() => {
                        setCampaigns(currentCampaigns =>
                          currentCampaigns.map(c =>
                            c.id === campaign.id ? { ...c, projectId: project.id } : c
                          )
                        )
                        setExpandedProjects(prev => new Set(prev).add(project.id))
                        toast.success(`Moved to "${project.title}"`)
                      }}
                      disabled={campaign.projectId === project.id}
                    >
                      <Folder size={14} className="mr-2" weight="duotone" />
                      {project.title}
                      {campaign.projectId === project.id && (
                        <span className="ml-auto text-xs text-muted-foreground">Current</span>
                      )}
                    </DropdownMenuItem>
                  ))}
                  {campaign.projectId && (
                    <DropdownMenuItem
                      onClick={() => {
                        setCampaigns(currentCampaigns =>
                          currentCampaigns.map(c =>
                            c.id === campaign.id ? { ...c, projectId: undefined } : c
                          )
                        )
                        toast.success('Moved to standalone campaigns')
                      }}
                    >
                      <Target size={14} className="mr-2" weight="duotone" />
                      Remove from project
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                className="text-destructive"
                onClick={async () => {
                  if (confirm(`Delete ${campaign.title}?`)) {
                    try {
                      await campaignsService.delete(campaign.id)
                      if (activeCampaignId === campaign.id) {
                        onNavigateToAllProjects()
                      }
                      toast.success('Campaign deleted')
                    } catch (error) {
                      console.error('Error deleting campaign:', error)
                      toast.error('Failed to delete campaign')
                    }
                  }
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    )
  }

  const renderProjectItem = (project: Project) => {
    const projectCampaigns = getCampaignsForProject(campaigns, project.id)
    const hasChildren = projectCampaigns.length > 0
    const isExpanded = expandedProjects.has(project.id)
    const isEditing = editingProjectId === project.id
    const isActive = activeProjectId === project.id && navigationView === 'project'
    const isDragOver = dragOverProjectId === project.id

    const handleProjectDragOver = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      const campaignId = e.dataTransfer.getData('campaignId')
      if (campaignId) {
        setDragOverProjectId(project.id)
        e.dataTransfer.dropEffect = 'move'
      }
    }

    const handleProjectDragLeave = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOverProjectId(null)
    }

    const handleProjectDrop = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOverProjectId(null)

      const campaignId = e.dataTransfer.getData('campaignId')
      if (!campaignId) return

      const campaign = campaigns.find(c => c.id === campaignId)
      if (!campaign) return

      if (campaign.projectId === project.id) return

      setCampaigns(currentCampaigns =>
        currentCampaigns.map(c =>
          c.id === campaignId ? { ...c, projectId: project.id } : c
        )
      )

      setExpandedProjects(prev => new Set(prev).add(project.id))
      toast.success(`Moved "${campaign.title}" to "${project.title}"`)
    }

    return (
      <div key={project.id}>
        <div 
          className={cn(
            "flex items-center gap-1 group transition-colors rounded",
            isDragOver && "bg-accent/20"
          )}
          onDragOver={handleProjectDragOver}
          onDragLeave={handleProjectDragLeave}
          onDrop={handleProjectDrop}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleProject(project.id)
              }}
              className="p-1 hover:bg-muted rounded transition-colors"
            >
              {isExpanded ? (
                <CaretDown size={14} weight="bold" />
              ) : (
                <CaretRight size={14} weight="bold" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}
          
          {isEditing ? (
            <div className="flex-1 flex items-center gap-1">
              <Input
                ref={inputRef}
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveEditProject(project.id)
                  } else if (e.key === 'Escape') {
                    handleCancelEdit()
                  }
                }}
                onBlur={() => handleSaveEditProject(project.id)}
                className="h-7 text-sm"
              />
            </div>
          ) : (
            <button
              onClick={() => onNavigateToProject(project.id)}
              className={cn(
                'flex-1 text-left px-2 py-1.5 rounded text-sm transition-colors truncate flex items-center gap-2',
                isActive
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-foreground hover:bg-muted'
              )}
              title={project.title}
            >
              <Folder size={14} weight="duotone" />
              <span className="flex-1 truncate">{project.title}</span>
              <span className="text-xs text-muted-foreground">{projectCampaigns.length}</span>
            </button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1 opacity-0 group-hover:opacity-100 hover:bg-muted rounded transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                <DotsThreeVertical size={14} weight="bold" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleStartEditProject(project)}>
                <PencilSimple size={14} className="mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleCreateNew('campaign', project.id)}>
                <Plus size={14} className="mr-2" />
                Add Campaign
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={async () => {
                  if (confirm(`Delete ${project.title} and all its campaigns?`)) {
                    try {
                      await projectsService.delete(project.id)
                      toast.success('Project deleted')
                    } catch (error) {
                      console.error('Error deleting project:', error)
                      toast.error('Failed to delete project')
                    }
                  }
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {hasChildren && isExpanded && (
          <div className="ml-3">
            {projectCampaigns.map(campaign => renderCampaignItem(campaign, 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-4">
            <Kanban className="text-primary" size={24} weight="duotone" />
            <h1 className="text-lg font-semibold text-foreground">Marketing</h1>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => handleCreateNew('project')}
              className="flex-1"
              size="sm"
            >
              <Plus size={14} weight="bold" />
              Project
            </Button>
            <Button
              onClick={() => handleCreateNew('campaign')}
              variant="outline"
              size="sm"
            >
              <Plus size={14} weight="bold" />
            </Button>
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2">
            <div className="space-y-1 mb-3">
              <button
                onClick={onNavigateToAllProjects}
                className={cn(
                  'w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2',
                  navigationView === 'all-projects'
                    ? 'bg-accent text-accent-foreground'
                    : 'text-foreground hover:bg-muted'
                )}
              >
                <Stack size={16} weight="duotone" />
                All Projects
              </button>
              
              <button
                onClick={onNavigateToAllCampaigns}
                className={cn(
                  'w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2',
                  navigationView === 'all-campaigns'
                    ? 'bg-accent text-accent-foreground'
                    : 'text-foreground hover:bg-muted'
                )}
              >
                <Briefcase size={16} weight="duotone" />
                All Campaigns
              </button>
              
              <button
                onClick={onNavigateToAllTasks}
                className={cn(
                  'w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2',
                  navigationView === 'all-tasks'
                    ? 'bg-accent text-accent-foreground'
                    : 'text-foreground hover:bg-muted'
                )}
              >
                <CheckSquare size={16} weight="duotone" />
                All Tasks
              </button>
              
              {onNavigateToMaster && (
                <button
                  onClick={onNavigateToMaster}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2',
                    navigationView === 'master'
                      ? 'bg-accent text-accent-foreground'
                      : 'text-foreground hover:bg-muted'
                  )}
                >
                  <ChartBar size={16} weight="duotone" />
                  Master View
                </button>
              )}
              
              {onNavigateToArchive && (
                <button
                  onClick={onNavigateToArchive}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2',
                    navigationView === 'archive'
                      ? 'bg-accent text-accent-foreground'
                      : 'text-foreground hover:bg-muted'
                  )}
                >
                  <Archive size={16} weight="duotone" />
                  Archive
                </button>
              )}
              
              {onNavigateToLabels && (
                <button
                  onClick={onNavigateToLabels}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2',
                    navigationView === 'labels'
                      ? 'bg-accent text-accent-foreground'
                      : 'text-foreground hover:bg-muted'
                  )}
                >
                  <Tag size={16} weight="duotone" />
                  Labels
                </button>
              )}
              
              {onNavigateToOrganization && (
                <button
                  onClick={onNavigateToOrganization}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2',
                    navigationView === 'organization'
                      ? 'bg-accent text-accent-foreground'
                      : 'text-foreground hover:bg-muted'
                  )}
                >
                  <Briefcase size={16} weight="duotone" />
                  Organization
                </button>
              )}
            </div>

            {/* Stage Filters - Filter by task current stage */}
            {activeCampaignId && (() => {
              // Get unique stage names from tasks in the current campaign
              const campaignTasks = tasks.filter(t => t.campaignId === activeCampaignId)
              const uniqueStageNames = Array.from(new Set(campaignTasks.map(t => t.currentStage).filter((s): s is string => !!s)))
              
              return uniqueStageNames.length > 0 && (
                <div className="mb-4">
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <Funnel size={12} weight="bold" />
                    Filter by Stage
                  </div>
                  <div className="space-y-0.5">
                    {uniqueStageNames.sort().map(stageName => {
                      const isFiltered = filters.stageNames.includes(stageName)
                      // Find template to get color, if it exists
                      const template = stageTemplates.find(t => t.name === stageName)
                      
                      return (
                        <button
                          key={stageName}
                          onClick={() => {
                            setFilters({
                              ...filters,
                              stageNames: isFiltered
                                ? filters.stageNames.filter(s => s !== stageName)
                                : [...filters.stageNames, stageName]
                            })
                          }}
                          className={cn(
                            'w-full text-left px-3 py-1.5 rounded text-sm transition-colors flex items-center justify-between',
                            isFiltered
                              ? 'bg-accent/50 text-accent-foreground'
                              : 'text-foreground hover:bg-muted'
                          )}
                        >
                          <span className="flex items-center gap-2">
                            {template && (
                              <span 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: template.color }}
                              />
                            )}
                            {stageName}
                          </span>
                          {isFiltered && (
                            <CheckSquare size={14} weight="fill" className="text-accent-foreground" />
                          )}
                        </button>
                      )
                    })}
                    {filters.stageNames.length > 0 && (
                      <button
                        onClick={() => setFilters({ ...filters, stageNames: [] })}
                        className="w-full text-left px-3 py-1 rounded text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </div>
              )
            })()}
            
            {sortedProjects.length > 0 && (
              <div className="mb-4">
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Projects
                </div>
                <div className="space-y-0.5">
                  {sortedProjects.map(project => renderProjectItem(project))}
                </div>
              </div>
            )}

            {standaloneCampaigns.length > 0 && (
              <div>
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Campaigns
                </div>
                <div className="space-y-0.5">
                  {standaloneCampaigns.map(campaign => renderCampaignItem(campaign))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </aside>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Create New {createType === 'project' ? 'Project' : 'Campaign'}
            </DialogTitle>
            <DialogDescription>
              {createType === 'project' && 'Projects help organize your marketing campaigns.'}
              {createType === 'campaign' && 'Campaigns contain tasks for specific marketing activities.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={`Enter ${createType} name...`}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
