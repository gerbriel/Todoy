import { useState, useRef, useEffect, DragEvent } from 'react'
import { Plus, Kanban, CaretDown, CaretRight, Folder, Target, DotsThreeVertical, PencilSimple, DotsSixVertical, Stack, CheckSquare, Briefcase, ChartBar, Archive, Funnel, Tag, CaretLeft } from '@phosphor-icons/react'
import { Project, Campaign, FilterState, List, StageTemplate, Task, Organization } from '@/lib/types'
import { NavigationView } from '@/App'
import { generateId, getProjects, getCampaignsForProject, getStandaloneCampaigns, getCampaignStageLabel } from '@/lib/helpers'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { projectsService } from '@/services/projects.service'
import { campaignsService } from '@/services/campaigns.service'
import { tasksService } from '@/services/tasks.service'
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
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set())
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

  const sortedProjects = getProjects(projects).filter(p => !p.archived)
  const standaloneCampaigns = getStandaloneCampaigns(campaigns).filter(c => !c.archived)

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
        const newProject = await projectsService.create({
          title: newTitle.trim(),
          description: '',
          order: projects.length,
          orgId: organization?.id || '',
        })
        // Optimistically update local state
        setProjects(prev => [...prev, newProject])
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
        // Optimistically update local state
        setCampaigns(prev => [...prev, newCampaign])
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

  const handleSaveEditCampaign = async (campaignId: string) => {
    if (!editingTitle.trim()) {
      toast.error('Title cannot be empty')
      return
    }
    
    try {
      await campaignsService.update(campaignId, { title: editingTitle.trim() })
      setEditingCampaignId(null)
      toast.success('Renamed')
    } catch (error) {
      console.error('Error renaming campaign:', error)
      toast.error('Failed to rename campaign')
    }
  }

  const handleSaveEditProject = async (projectId: string) => {
    if (!editingTitle.trim()) {
      toast.error('Title cannot be empty')
      return
    }
    
    try {
      await projectsService.update(projectId, { title: editingTitle.trim() })
      setEditingProjectId(null)
      toast.success('Renamed')
    } catch (error) {
      console.error('Error renaming project:', error)
      toast.error('Failed to rename project')
    }
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

      // Persist the new order to database
      updatedCampaigns.forEach(async (c) => {
        try {
          await campaignsService.update(c.id, { order: c.order })
        } catch (error) {
          console.error('Error updating campaign order:', error)
        }
      })

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
    const campaignTasks = tasks.filter(t => t.campaignId === campaign.id && !t.completed)
    const hasChildren = campaignTasks.length > 0
    const isExpanded = expandedCampaigns.has(campaign.id)

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
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setExpandedCampaigns(prev => {
                  const newExpanded = new Set(prev)
                  if (newExpanded.has(campaign.id)) {
                    newExpanded.delete(campaign.id)
                  } else {
                    newExpanded.add(campaign.id)
                  }
                  return newExpanded
                })
              }}
              className="w-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              {isExpanded ? <CaretDown size={14} weight="bold" /> : <CaretRight size={14} weight="bold" />}
            </button>
          ) : (
            <div className="w-6" />
          )}
          
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
                'flex-1 text-left px-2 py-1.5 rounded text-sm transition-colors flex items-start gap-2 min-w-0',
                isActive
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-foreground hover:bg-muted'
              )}
              title={campaign.title}
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
              <Target size={14} weight="duotone" className="flex-shrink-0 mt-0.5" />
              <span className="flex-1 min-w-0 break-words">{campaign.title}</span>
              {campaign.campaignStage && (
                <span className="text-[10px] opacity-60 uppercase tracking-wide flex-shrink-0">
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
                      onClick={async () => {
                        try {
                          await campaignsService.update(campaign.id, { projectId: project.id })
                          setExpandedProjects(prev => new Set(prev).add(project.id))
                          toast.success(`Moved to "${project.title}"`)
                        } catch (error) {
                          console.error('Error moving campaign:', error)
                          toast.error('Failed to move campaign')
                        }
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
                      onClick={async () => {
                        try {
                          await campaignsService.update(campaign.id, { projectId: undefined })
                          toast.success('Moved to standalone campaigns')
                        } catch (error) {
                          console.error('Error moving campaign:', error)
                          toast.error('Failed to move campaign')
                        }
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
                      // Optimistically update local state
                      setCampaigns(prev => prev.filter(c => c.id !== campaign.id))
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
        
        {/* Nested Tasks */}
        {isExpanded && hasChildren && (
          <div className="ml-6">
            {campaignTasks.slice(0, 5).map(task => (
              <button
                key={task.id}
                onClick={() => onNavigateToCampaign(campaign.id)}
                className={cn(
                  'w-full text-left px-2 py-1 rounded text-xs transition-colors flex items-start gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 min-w-0'
                )}
                title={task.title}
              >
                <CheckSquare size={12} weight="duotone" className="flex-shrink-0 mt-0.5" />
                <span className="flex-1 min-w-0 break-words">{task.title}</span>
              </button>
            ))}
            {campaignTasks.length > 5 && (
              <div className="px-2 py-1 text-[10px] text-muted-foreground">
                +{campaignTasks.length - 5} more tasks
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderProjectItem = (project: Project) => {
    const projectCampaigns = getCampaignsForProject(campaigns, project.id).filter(c => !c.archived)
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

    const handleProjectDrop = async (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOverProjectId(null)

      const campaignId = e.dataTransfer.getData('campaignId')
      if (!campaignId) return

      const campaign = campaigns.find(c => c.id === campaignId)
      if (!campaign) return

      if (campaign.projectId === project.id) return

      try {
        await campaignsService.update(campaignId, { projectId: project.id })
        setExpandedProjects(prev => new Set(prev).add(project.id))
        toast.success(`Moved "${campaign.title}" to "${project.title}"`)
      } catch (error) {
        console.error('Error moving campaign to project:', error)
        toast.error('Failed to move campaign')
      }
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
                'flex-1 text-left px-2 py-1.5 rounded text-sm transition-colors flex items-start gap-2 min-w-0',
                isActive
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-foreground hover:bg-muted'
              )}
              title={project.title}
            >
              <Folder size={14} weight="duotone" className="flex-shrink-0 mt-0.5" />
              <span className="flex-1 min-w-0 break-words">{project.title}</span>
              <span className="text-xs text-muted-foreground flex-shrink-0">{projectCampaigns.length}</span>
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
                      // Optimistically update local state
                      setProjects(prev => prev.filter(p => p.id !== project.id))
                      setCampaigns(prev => prev.filter(c => c.projectId !== project.id))
                      if (activeProjectId === project.id) {
                        onNavigateToAllProjects()
                      }
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
      <aside className={cn(
        "border-r border-border bg-card flex flex-col transition-all duration-300",
        isCollapsed ? "w-16" : "w-72"
      )}>
        <div className="p-4 border-b border-border">
          {!isCollapsed && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Kanban className="text-primary" size={24} weight="duotone" />
                <h1 className="text-lg font-semibold text-foreground truncate">Marketing</h1>
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
            </>
          )}
          
          {/* Collapse/Expand Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "w-full flex items-center justify-center p-2 hover:bg-muted rounded transition-colors",
              !isCollapsed && "mt-4"
            )}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <CaretRight size={20} weight="bold" />
            ) : (
              <CaretLeft size={20} weight="bold" />
            )}
          </button>
        </div>
        
        <ScrollArea className="flex-1 h-full">
          <div className="p-2">
            <div className="space-y-1 mb-3">
              {onNavigateToMaster && (
                <button
                  onClick={onNavigateToMaster}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2',
                    navigationView === 'master'
                      ? 'bg-accent text-accent-foreground'
                      : 'text-foreground hover:bg-muted',
                    isCollapsed && 'justify-center px-0'
                  )}
                  title={isCollapsed ? "Master View" : ""}
                >
                  <ChartBar size={16} weight="duotone" />
                  {!isCollapsed && "Master View"}
                </button>
              )}
              
              <button
                onClick={onNavigateToAllProjects}
                className={cn(
                  'w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2',
                  navigationView === 'all-projects'
                    ? 'bg-accent text-accent-foreground'
                    : 'text-foreground hover:bg-muted',
                  isCollapsed && 'justify-center px-0'
                )}
                title={isCollapsed ? "All Projects" : ""}
              >
                <Stack size={16} weight="duotone" />
                {!isCollapsed && "All Projects"}
              </button>
              
              <button
                onClick={onNavigateToAllCampaigns}
                className={cn(
                  'w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2',
                  navigationView === 'all-campaigns'
                    ? 'bg-accent text-accent-foreground'
                    : 'text-foreground hover:bg-muted',
                  isCollapsed && 'justify-center px-0'
                )}
                title={isCollapsed ? "All Campaigns" : ""}
              >
                <Briefcase size={16} weight="duotone" />
                {!isCollapsed && "All Campaigns"}
              </button>
              
              <button
                onClick={onNavigateToAllTasks}
                className={cn(
                  'w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2',
                  navigationView === 'all-tasks'
                    ? 'bg-accent text-accent-foreground'
                    : 'text-foreground hover:bg-muted',
                  isCollapsed && 'justify-center px-0'
                )}
                title={isCollapsed ? "All Tasks" : ""}
              >
                <CheckSquare size={16} weight="duotone" />
                {!isCollapsed && "All Tasks"}
              </button>
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
            
            {!isCollapsed && sortedProjects.length > 0 && (
              <div className="mb-4">
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Projects
                </div>
                <div className="space-y-0.5">
                  {sortedProjects.map(project => renderProjectItem(project))}
                </div>
              </div>
            )}

            {!isCollapsed && standaloneCampaigns.length > 0 && (
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
