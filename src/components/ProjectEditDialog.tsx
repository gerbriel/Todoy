import { useState, useEffect } from 'react'
import { Project, Campaign, Task } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Button } from './ui/button'
import { toast } from 'sonner'
import { Separator } from './ui/separator'
import { Archive, DotsThree } from '@phosphor-icons/react'
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
  const [startDate, setStartDate] = useState(
    project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : ''
  )
  const [endDate, setEndDate] = useState(
    project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : ''
  )
  const [stageDates, setStageDates] = useState(project.stageDates || [])

  // Update form when project prop changes (e.g., after drag-and-drop)
  useEffect(() => {
    setTitle(project.title)
    setDescription(project.description)
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
