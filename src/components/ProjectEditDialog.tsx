import { useState, useEffect } from 'react'
import { Project, Campaign, Task } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Button } from './ui/button'
import { toast } from 'sonner'
import { Separator } from './ui/separator'
import { Archive, DotsThree, CalendarCheck, CalendarX } from '@phosphor-icons/react'
import { projectsService } from '@/services/projects.service'
import { campaignsService } from '@/services/campaigns.service'
import { tasksService } from '@/services/tasks.service'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import StageDateManager from './StageDateManager'

interface ProjectEditDialogProps {
  project: Project
  projects: Project[]
  setProjects: (updater: (projects: Project[]) => Project[]) => void
  campaigns: Campaign[]
  setCampaigns: (updater: (campaigns: Campaign[]) => Campaign[]) => void
  tasks?: Task[]
  setTasks?: (updater: (tasks: Task[]) => Task[]) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ProjectEditDialog({
  project,
  projects,
  setProjects,
  campaigns,
  setCampaigns,
  tasks,
  setTasks,
  open,
  onOpenChange,
}: ProjectEditDialogProps) {
  const [title, setTitle] = useState(project.title)
  const [description, setDescription] = useState(project.description)
  const [budget, setBudget] = useState(project.budget?.toString() || '')
  const [startDate, setStartDate] = useState(
    project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : ''
  )
  const [endDate, setEndDate] = useState(
    project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : ''
  )
  const [stageDates, setStageDates] = useState(project.stageDates || [])

  // Calculate actual spend from campaigns and tasks
  const actualSpend = campaigns
    .filter(c => c.projectId === project.id)
    .reduce((sum, c) => sum + (c.actualSpend || 0), 0) +
    (tasks?.filter(t => {
      const campaign = campaigns.find(c => c.id === t.campaignId)
      return campaign?.projectId === project.id
    }).reduce((sum, t) => sum + (t.actualSpend || 0), 0) || 0)

  // Update form when project prop changes (e.g., after drag-and-drop)
  useEffect(() => {
    setTitle(project.title)
    setDescription(project.description)
    setBudget(project.budget?.toString() || '')
    // Convert ISO dates to YYYY-MM-DD format for date inputs
    setStartDate(project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '')
    setEndDate(project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '')
    setStageDates(project.stageDates || [])
  }, [project])

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Project title cannot be empty')
      return
    }

    try {
      const hadDates = !!(project.startDate && project.endDate)
      const nowHasDates = !!(startDate && endDate)
      const datesRemoved = hadDates && !nowHasDates
      
      const updates = {
        title: title.trim(),
        description: description.trim(),
        budget: budget ? parseFloat(budget) : undefined,
        actualSpend,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        stageDates,
      }
      
      await projectsService.update(project.id, updates)
      
      // Update local project state immediately
      setProjects(prev => prev.map(p =>
        p.id === project.id
          ? { ...p, ...updates }
          : p
      ))
      
      // If dates were removed, cascade removal to campaigns and tasks
      if (datesRemoved) {
        const projectCampaigns = campaigns.filter(c => c.projectId === project.id)
        
        if (projectCampaigns.length > 0) {
          // Remove dates from all campaigns in this project
          for (const campaign of projectCampaigns) {
            await campaignsService.update(campaign.id, {
              startDate: undefined,
              endDate: undefined
            })
          }
          
          // Update campaign state
          setCampaigns(prev => prev.map(c =>
            c.projectId === project.id
              ? { ...c, startDate: undefined, endDate: undefined }
              : c
          ))
          
          // Remove dates from all tasks in those campaigns
          if (tasks && setTasks) {
            const campaignIds = projectCampaigns.map(c => c.id)
            const affectedTasks = tasks.filter(t => t.campaignId && campaignIds.includes(t.campaignId))
            
            if (affectedTasks.length > 0) {
              for (const task of affectedTasks) {
                await tasksService.update(task.id, {
                  startDate: undefined,
                  dueDate: undefined
                })
              }
              
              // Update task state
              setTasks(prev => prev.map(t =>
                t.campaignId && campaignIds.includes(t.campaignId)
                  ? { ...t, startDate: undefined, dueDate: undefined }
                  : t
              ))
              
              toast.success(`Project updated. Removed dates from ${projectCampaigns.length} campaign(s) and ${affectedTasks.length} task(s)`)
            } else {
              toast.success(`Project updated. Removed dates from ${projectCampaigns.length} campaign(s)`)
            }
          } else {
            toast.success(`Project updated. Removed dates from ${projectCampaigns.length} campaign(s)`)
          }
        } else {
          toast.success('Project updated')
        }
      } else {
        toast.success('Project updated')
      }
      
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating project:', error)
      toast.error('Failed to update project')
    }
  }

  const handleCancel = () => {
    // Reset to original values
    setTitle(project.title)
    setDescription(project.description)
    setBudget(project.budget?.toString() || '')
    setStartDate(project.startDate || '')
    setEndDate(project.endDate || '')
    setStageDates(project.stageDates || [])
    onOpenChange(false)
  }

  const handleArchive = async () => {
    try {
      const result = await projectsService.update(project.id, { archived: true })
      console.log('Archived project:', result, 'archived flag:', result.archived)
      
      // Archive all campaigns for this project
      const projectCampaigns = campaigns.filter(c => c.projectId === project.id && !c.archived)
      if (projectCampaigns.length > 0) {
        const campaignArchivePromises = projectCampaigns.map(campaign => 
          campaignsService.update(campaign.id, { archived: true })
        )
        await Promise.all(campaignArchivePromises)
        console.log(`Archived ${projectCampaigns.length} campaigns`)
      }
      
      // Optimistically remove from parent view
      setProjects(prev => prev.filter(p => p.id !== project.id))
      
      toast.success('Project archived')
      onOpenChange(false)
      // Real-time subscription will sync the state
    } catch (error) {
      console.error('Error archiving project:', error)
      toast.error('Failed to archive project')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-title">Project Name</Label>
            <Input
              id="project-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter project name..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project..."
              rows={4}
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Budget</Label>
              <p className="text-sm text-muted-foreground">
                Set project budget and track actual spending
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project-budget">Budget ($)</Label>
                <Input
                  id="project-budget"
                  type="number"
                  min="0"
                  step="0.01"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-actual-spend">Actual Spend ($)</Label>
                <Input
                  id="project-actual-spend"
                  type="number"
                  value={actualSpend.toFixed(2)}
                  disabled
                  className="bg-muted"
                  title="Auto-calculated from campaigns and tasks"
                />
                <p className="text-xs text-muted-foreground">
                  Auto-calculated from campaigns and tasks
                </p>
              </div>
            </div>
            
            {budget && parseFloat(budget) > 0 && (
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Budget Utilization</span>
                  <span className="text-sm font-semibold">
                    {((actualSpend / parseFloat(budget)) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      actualSpend > parseFloat(budget) 
                        ? 'bg-destructive' 
                        : actualSpend > parseFloat(budget) * 0.9
                        ? 'bg-yellow-500'
                        : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min((actualSpend / parseFloat(budget)) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-muted-foreground">
                    Remaining: ${(parseFloat(budget) - actualSpend).toFixed(2)}
                  </span>
                  {actualSpend > parseFloat(budget) && (
                    <span className="text-xs text-destructive font-medium">
                      Over budget by ${(actualSpend - parseFloat(budget)).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Project Timeline</Label>
              <p className="text-sm text-muted-foreground">
                Define the overall timeline for this project
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project-start-date">Start Date</Label>
                <Input
                  id="project-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-end-date">End Date</Label>
                <Input
                  id="project-end-date"
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
                  if (!setCampaigns) return
                  
                  if (!startDate || !endDate) {
                    toast.error('Project must have dates assigned first')
                    return
                  }
                  
                  const projectCampaigns = campaigns.filter(c => c.projectId === project.id)
                  
                  if (projectCampaigns.length === 0) {
                    toast.info('No campaigns found in this project')
                    return
                  }
                  
                  try {
                    const startDateISO = new Date(startDate).toISOString()
                    const endDateISO = new Date(endDate).toISOString()
                    
                    for (const campaign of projectCampaigns) {
                      await campaignsService.update(campaign.id, {
                        startDate: startDateISO,
                        endDate: endDateISO
                      })
                    }
                    
                    setCampaigns(prevCampaigns =>
                      prevCampaigns.map(c =>
                        projectCampaigns.some(pc => pc.id === c.id)
                          ? { ...c, startDate: startDateISO, endDate: endDateISO }
                          : c
                      )
                    )
                    
                    toast.success(`Synced ${projectCampaigns.length} campaign${projectCampaigns.length > 1 ? 's' : ''} to project dates`)
                  } catch (error) {
                    console.error('Error syncing campaign dates:', error)
                    toast.error('Failed to sync campaign dates')
                  }
                }}
                className="flex-1"
                title="Sync all campaign dates to match project dates"
              >
                <CalendarCheck className="mr-2" size={16} weight="bold" />
                Sync Campaigns
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (!setCampaigns) return
                  
                  const projectCampaigns = campaigns.filter(c => c.projectId === project.id && (c.startDate || c.endDate))
                  
                  if (projectCampaigns.length === 0) {
                    toast.info('No campaigns with dates found in this project')
                    return
                  }
                  
                  try {
                    // Unassign all campaigns
                    for (const campaign of projectCampaigns) {
                      await campaignsService.update(campaign.id, {
                        startDate: null as any,
                        endDate: null as any
                      })
                    }
                    
                    setCampaigns(prevCampaigns =>
                      prevCampaigns.map(c =>
                        projectCampaigns.some(pc => pc.id === c.id)
                          ? { ...c, startDate: undefined, endDate: undefined }
                          : c
                      )
                    )
                    
                    // Also unassign all tasks in those campaigns
                    if (tasks && setTasks) {
                      const campaignIds = projectCampaigns.map(c => c.id)
                      const campaignTasks = tasks.filter(t => 
                        campaignIds.includes(t.campaignId || '') && (t.startDate || t.dueDate)
                      )
                      
                      if (campaignTasks.length > 0) {
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
                        
                        toast.success(`Removed dates from ${projectCampaigns.length} campaign${projectCampaigns.length > 1 ? 's' : ''} and ${campaignTasks.length} task${campaignTasks.length > 1 ? 's' : ''}`)
                      } else {
                        toast.success(`Removed dates from ${projectCampaigns.length} campaign${projectCampaigns.length > 1 ? 's' : ''}`)
                      }
                    } else {
                      toast.success(`Removed dates from ${projectCampaigns.length} campaign${projectCampaigns.length > 1 ? 's' : ''}`)
                    }
                  } catch (error) {
                    console.error('Error removing campaign dates:', error)
                    toast.error('Failed to remove campaign dates')
                  }
                }}
                className="flex-1"
                title="Remove dates from all campaigns and tasks in this project"
              >
                <CalendarX className="mr-2" size={16} weight="bold" />
                Unassign All
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              <strong>Sync:</strong> Set all campaigns to project dates • <strong>Unassign:</strong> Remove dates from campaigns and tasks
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Project Timeline & Milestones</Label>
            <p className="text-sm text-muted-foreground">
              Define key stages and milestones for this project
            </p>
            <StageDateManager
              stageDates={stageDates}
              onChange={setStageDates}
              entityType="project"
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
              
              <DropdownMenuItem onClick={handleArchive} className="text-orange-600">
                <Archive size={16} className="mr-2" />
                Archive Project
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
