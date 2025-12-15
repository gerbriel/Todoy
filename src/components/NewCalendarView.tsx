import { useState, forwardRef, useImperativeHandle } from 'react'
import { Campaign, Task, Project, Label, List, FilterState, User } from '@/lib/types'
import { CalendarGrid } from './Calendar/CalendarGrid'
import { CalendarEvent } from './Calendar/types'
import { convertToCalendarEvents } from './Calendar/converters'
import { differenceInDays, addDays, startOfDay } from 'date-fns'
import { toast } from 'sonner'
import { tasksService } from '@/services/tasks.service'
import { campaignsService } from '@/services/campaigns.service'
import { projectsService } from '@/services/projects.service'
import { shiftCampaignTasks, calculateShiftStats, shiftProjectCampaignsAndTasks, calculateProjectShiftStats } from '@/lib/campaignDateShift'
import TaskDetailDialog from './TaskDetailDialog'
import CampaignEditDialog from './CampaignEditDialog'
import ProjectEditDialog from './ProjectEditDialog'
import UnscheduledItemsSidebar from './Calendar/UnscheduledItemsSidebar'
import { X } from '@phosphor-icons/react'

export interface CalendarViewHandle {
  openItemsPanel: () => void
}

interface NewCalendarViewProps {
  campaigns: Campaign[]
  tasks: Task[]
  setTasks: (updater: (tasks: Task[]) => Task[]) => void
  labels: Label[]
  setLabels: (updater: (labels: Label[]) => Label[]) => void
  lists: List[]
  activeCampaignId: string | null
  filters: FilterState
  projects?: Project[]
  setProjects?: (updater: (projects: Project[]) => Project[]) => void
  users?: User[]
  viewLevel?: 'campaign' | 'project' | 'all'
  onCampaignClick?: (campaignId: string) => void
  onProjectClick?: (projectId: string) => void
  orgId: string
  setCampaigns?: (updater: (campaigns: Campaign[]) => Campaign[]) => void
  onNavigateBack?: () => void
  filterMode?: 'all' | 'projects' | 'campaigns' | 'tasks'
}

const NewCalendarView = forwardRef<CalendarViewHandle, NewCalendarViewProps>(({
  campaigns,
  tasks,
  setTasks,
  labels,
  setLabels,
  lists,
  activeCampaignId,
  filters,
  projects = [],
  setProjects,
  users = [],
  viewLevel = 'campaign',
  onCampaignClick,
  onProjectClick,
  orgId,
  setCampaigns,
  onNavigateBack,
  filterMode = 'all',
}, ref) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showMobileItemsPanel, setShowMobileItemsPanel] = useState(false)

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    openItemsPanel: () => setShowMobileItemsPanel(true)
  }))
  
  // Convert data to calendar events
  const filteredTasks = activeCampaignId 
    ? tasks.filter(t => t.campaignId === activeCampaignId)
    : tasks
  
  const filteredCampaigns = activeCampaignId
    ? campaigns.filter(c => c.id === activeCampaignId)
    : campaigns
  
  // Apply filterMode to what's displayed on the calendar
  let calendarProjects: typeof projects = []
  let calendarCampaigns: typeof filteredCampaigns = []
  let calendarTasks: typeof filteredTasks = []
  
  if (filterMode === 'all') {
    // Master View: Show everything
    calendarProjects = projects
    calendarCampaigns = filteredCampaigns
    calendarTasks = filteredTasks
  } else if (filterMode === 'projects') {
    // All Projects: Show ONLY projects (no campaigns or tasks)
    calendarProjects = projects
    calendarCampaigns = []
    calendarTasks = []
  } else if (filterMode === 'campaigns') {
    // All Campaigns: Show ONLY campaigns (no projects or tasks)
    calendarProjects = []
    calendarCampaigns = filteredCampaigns
    calendarTasks = []
  } else if (filterMode === 'tasks') {
    // All Tasks: Show ONLY tasks (no projects or campaigns)
    calendarProjects = []
    calendarCampaigns = []
    calendarTasks = filteredTasks
  }
  
  const calendarEvents = convertToCalendarEvents(
    calendarTasks,
    calendarCampaigns,
    calendarProjects
  )
  
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    
    // If it's a task, open the task detail dialog
    if (event.type === 'task' && event.metadata.taskId) {
      setSelectedTaskId(event.metadata.taskId)
    }
    
    // If it's a campaign or stage with campaignId, open campaign dialog
    if ((event.type === 'campaign' || event.type === 'stage') && event.metadata.campaignId) {
      setSelectedCampaignId(event.metadata.campaignId)
    }
    
    // If it's a project or project stage, open project dialog
    if (event.type === 'project' && event.metadata.projectId) {
      setSelectedProjectId(event.metadata.projectId)
    }
  }
  
  const handleEventMove = async (eventId: string, newStartDate: Date, newEndDate: Date) => {
    const event = calendarEvents.find(e => e.id === eventId)
    if (!event) return
    
    console.log('🎯 Event Move:', { 
      eventId, 
      type: event.type, 
      newStartDate: newStartDate.toISOString(), 
      newEndDate: newEndDate.toISOString(),
      hasCampaignId: !!event.metadata.campaignId,
      hasProjectId: !!event.metadata.projectId,
      hasSetCampaigns: !!setCampaigns,
      hasSetProjects: !!setProjects
    })
    
    try {
      // Handle task moves - update both startDate and dueDate
      if (event.type === 'task' && event.metadata.taskId) {
        // Validate: Task must have campaign and campaign must have dates
        const task = tasks.find(t => t.id === event.metadata.taskId)
        if (!task) {
          toast.error('Task not found')
          return
        }
        
        if (!task.campaignId) {
          toast.error('Task must be assigned to a campaign')
          return
        }
        
        const campaign = campaigns.find(c => c.id === task.campaignId)
        if (!campaign || !campaign.startDate || !campaign.endDate) {
          toast.error('Campaign must have dates assigned')
          return
        }
        
        // Validate: Task dates must be within campaign dates
        const campaignStart = startOfDay(new Date(campaign.startDate))
        const campaignEnd = startOfDay(new Date(campaign.endDate))
        
        if (newStartDate < campaignStart || newEndDate > campaignEnd) {
          toast.error(`Task must remain within campaign dates (${new Date(campaign.startDate).toLocaleDateString()} - ${new Date(campaign.endDate).toLocaleDateString()})`)
          return
        }
        
        await tasksService.update(event.metadata.taskId, {
          startDate: newStartDate.toISOString(),
          dueDate: newEndDate.toISOString()
        })
        
        setTasks(prevTasks => 
          prevTasks.map(t => 
            t.id === event.metadata.taskId 
              ? { ...t, startDate: newStartDate.toISOString(), dueDate: newEndDate.toISOString() }
              : t
          )
        )
        
        toast.success('Task dates updated')
        return
      }
      
      // Handle campaign phase moves
      if (event.type === 'campaign' && event.metadata.campaignId && setCampaigns) {
        console.log('📅 Campaign Move Detected:', { eventId, campaignId: event.metadata.campaignId })
        const campaign = campaigns.find(c => c.id === event.metadata.campaignId)
        if (!campaign) {
          console.log('❌ Campaign not found in campaigns array')
          return
        }
        console.log('✅ Campaign found:', campaign.title)
        
        // Validate: If campaign has a project, must be within project dates
        if (campaign.projectId) {
          const project = projects.find(p => p.id === campaign.projectId)
          if (!project || !project.startDate || !project.endDate) {
            toast.error('Project must have dates assigned')
            return
          }
          
          const projectStart = startOfDay(new Date(project.startDate))
          const projectEnd = startOfDay(new Date(project.endDate))
          
          if (newStartDate < projectStart || newEndDate > projectEnd) {
            toast.error(`Campaign must remain within project dates (${new Date(project.startDate).toLocaleDateString()} - ${new Date(project.endDate).toLocaleDateString()})`)
            return
          }
        }
        
        const updates: Partial<Campaign> = {
          startDate: newStartDate.toISOString(),
          endDate: newEndDate.toISOString()
        }
        
        console.log('📝 Updating campaign with:', updates)
        await campaignsService.update(event.metadata.campaignId, updates)
        console.log('✅ Database updated')
        
        // Shift all child tasks if campaign had a previous start date
        const oldStartDate = campaign.startDate
        const newStartDateISO = newStartDate.toISOString()
        const newEndDateISO = newEndDate.toISOString()
        
        if (oldStartDate) {
          const stats = calculateShiftStats(tasks, campaign.id, oldStartDate, newStartDateISO)
          
          if (stats.tasksAffected > 0) {
            console.log(`🔄 Shifting ${stats.tasksAffected} child task(s)...`)
            
            const updatedTasks = shiftCampaignTasks(
              tasks,
              campaign.id,
              oldStartDate,
              newStartDateISO,
              newEndDateISO,
              true // clamp tasks to campaign bounds
            )
            
            // Update tasks in database
            const tasksToUpdate = updatedTasks.filter(t => 
              t.campaignId === campaign.id && t.dueDate
            )
            
            for (const task of tasksToUpdate) {
              await tasksService.update(task.id, {
                startDate: task.startDate,
                dueDate: task.dueDate
              })
            }
            
            // Update local task state
            setTasks(() => updatedTasks)
            console.log('✅ Tasks shifted and updated')
          }
        }
        
        setCampaigns(prevCampaigns =>
          prevCampaigns.map(c =>
            c.id === event.metadata.campaignId ? { ...c, ...updates } : c
          )
        )
        console.log('✅ State updated')
        
        const stats = oldStartDate 
          ? calculateShiftStats(tasks, campaign.id, oldStartDate, newStartDateISO)
          : null
        
        if (stats && stats.tasksAffected > 0) {
          toast.success(
            `Campaign moved. ${stats.tasksAffected} task(s) shifted ${Math.abs(stats.daysDifference)} day(s) ${stats.direction}`
          )
        } else {
          toast.success('Campaign dates updated')
        }
        
        return
      }
      
      // Handle project moves
      if (event.type === 'project' && event.metadata.projectId && setProjects) {
        const project = projects.find(p => p.id === event.metadata.projectId)
        if (!project) {
          toast.error('Project not found')
          return
        }

        await projectsService.update(event.metadata.projectId, {
          startDate: newStartDate.toISOString(),
          endDate: newEndDate.toISOString()
        })
        
        // Shift all child campaigns and tasks if project had a previous start date
        const oldStartDate = project.startDate
        const newStartDateISO = newStartDate.toISOString()
        const newEndDateISO = newEndDate.toISOString()
        
        if (oldStartDate && setCampaigns && setTasks) {
          const stats = calculateProjectShiftStats(campaigns, tasks, project.id, oldStartDate, newStartDateISO)
          
          if (stats.campaignsAffected > 0 || stats.tasksAffected > 0) {
            console.log(`🔄 Shifting ${stats.campaignsAffected} campaign(s) and ${stats.tasksAffected} task(s)...`)
            
            const { campaigns: updatedCampaigns, tasks: updatedTasks } = shiftProjectCampaignsAndTasks(
              campaigns,
              tasks,
              project.id,
              oldStartDate,
              newStartDateISO,
              newEndDateISO,
              true // clamp to project bounds
            )
            
            // Update campaigns in database
            const campaignsToUpdate = updatedCampaigns.filter(c => 
              c.projectId === project.id && c.startDate
            )
            
            for (const campaign of campaignsToUpdate) {
              await campaignsService.update(campaign.id, {
                startDate: campaign.startDate,
                endDate: campaign.endDate
              })
            }
            
            // Update tasks in database
            const tasksToUpdate = updatedTasks.filter(t => {
              const campaign = updatedCampaigns.find(c => c.id === t.campaignId)
              return campaign && campaign.projectId === project.id && t.dueDate
            })
            
            for (const task of tasksToUpdate) {
              await tasksService.update(task.id, {
                startDate: task.startDate,
                dueDate: task.dueDate
              })
            }
            
            // Update local state
            setCampaigns(() => updatedCampaigns)
            setTasks(() => updatedTasks)
            console.log('✅ Campaigns and tasks shifted and updated')
          }
        }

        setProjects(prevProjects =>
          prevProjects.map(p =>
            p.id === event.metadata.projectId
              ? { ...p, startDate: newStartDateISO, endDate: newEndDateISO }
              : p
          )
        )
        
        const stats = oldStartDate 
          ? calculateProjectShiftStats(campaigns, tasks, project.id, oldStartDate, newStartDateISO)
          : null
        
        if (stats && (stats.campaignsAffected > 0 || stats.tasksAffected > 0)) {
          toast.success(
            `Project moved. ${stats.campaignsAffected} campaign(s) and ${stats.tasksAffected} task(s) shifted ${Math.abs(stats.daysDifference)} day(s) ${stats.direction}`
          )
        } else {
          toast.success('Project dates updated')
        }
        
        return
      }
      
      // Handle stage moves (campaign stages shown on calendar)
      if (event.type === 'stage' && event.metadata.stageId) {
        console.log('📊 Stage Move Detected:', { stageId: event.metadata.stageId, campaignId: event.metadata.campaignId, projectId: event.metadata.projectId })
        
        // Handle campaign stage moves
        if (event.metadata.campaignId) {
          const campaign = campaigns.find(c => c.id === event.metadata.campaignId)
          if (!campaign || !campaign.stageDates) {
            console.log('❌ Campaign or stageDates not found')
            return
          }
          
          const updatedStageDates = campaign.stageDates.map(stage => 
            stage.id === event.metadata.stageId
              ? { ...stage, startDate: newStartDate.toISOString(), endDate: newEndDate.toISOString() }
              : stage
          )
          
          console.log('💾 Updating campaign stage dates')
          await campaignsService.update(event.metadata.campaignId, {
            stageDates: updatedStageDates
          })
          
          if (setCampaigns) {
            setCampaigns(prevCampaigns =>
              prevCampaigns.map(c =>
                c.id === event.metadata.campaignId
                  ? { ...c, stageDates: updatedStageDates }
                  : c
              )
            )
          }
          
          console.log('✅ Campaign stage updated')
          toast.success('Stage dates updated')
          return
        }
        
        // Handle project stage moves
        if (event.metadata.projectId && setProjects) {
          const project = projects.find(p => p.id === event.metadata.projectId)
          if (!project || !project.stageDates) {
            console.log('❌ Project or stageDates not found')
            return
          }
          
          const updatedStageDates = project.stageDates.map(stage =>
            stage.id === event.metadata.stageId
              ? { ...stage, startDate: newStartDate.toISOString(), endDate: newEndDate.toISOString() }
              : stage
          )
          
          console.log('💾 Updating project stage dates')
          await projectsService.update(event.metadata.projectId, {
            stageDates: updatedStageDates
          })
          
          setProjects(prevProjects =>
            prevProjects.map(p =>
              p.id === event.metadata.projectId
                ? { ...p, stageDates: updatedStageDates }
                : p
            )
          )
          
          console.log('✅ Project stage updated')
          toast.success('Stage dates updated')
          return
        }
        
        console.log('❌ Stage has no campaignId or projectId')
        return
      }
      
    } catch (error) {
      console.error('Error moving event:', error)
      toast.error('Failed to update event')
    }
  }
  
  const handleEventResize = async (eventId: string, newStartDate: Date, newEndDate: Date) => {
    const event = calendarEvents.find(e => e.id === eventId)
    if (!event) return
    
    try {
      // Handle task resizes - update both startDate and dueDate
      if (event.type === 'task' && event.metadata.taskId) {
        // Validate: Task must have campaign and campaign must have dates
        const task = tasks.find(t => t.id === event.metadata.taskId)
        if (!task) {
          toast.error('Task not found')
          return
        }
        
        if (!task.campaignId) {
          toast.error('Task must be assigned to a campaign')
          return
        }
        
        const campaign = campaigns.find(c => c.id === task.campaignId)
        if (!campaign || !campaign.startDate || !campaign.endDate) {
          toast.error('Campaign must have dates assigned')
          return
        }
        
        // Validate: Task dates must be within campaign dates
        const campaignStart = startOfDay(new Date(campaign.startDate))
        const campaignEnd = startOfDay(new Date(campaign.endDate))
        
        if (newStartDate < campaignStart || newEndDate > campaignEnd) {
          toast.error(`Task must remain within campaign dates (${new Date(campaign.startDate).toLocaleDateString()} - ${new Date(campaign.endDate).toLocaleDateString()})`)
          return
        }
        
        await tasksService.update(event.metadata.taskId, {
          startDate: newStartDate.toISOString(),
          dueDate: newEndDate.toISOString()
        })
        
        setTasks(prevTasks =>
          prevTasks.map(t => 
            t.id === event.metadata.taskId 
              ? { ...t, startDate: newStartDate.toISOString(), dueDate: newEndDate.toISOString() }
              : t
          )
        )
        
        toast.success('Task dates updated')
        return
      }
      
      // Handle campaign phase resizes
      if (event.type === 'campaign' && event.metadata.campaignId) {
        const campaign = campaigns.find(c => c.id === event.metadata.campaignId)
        if (!campaign) return
        
        // Validate: If campaign has a project, must be within project dates
        if (campaign.projectId) {
          const project = projects.find(p => p.id === campaign.projectId)
          if (!project || !project.startDate || !project.endDate) {
            toast.error('Project must have dates assigned')
            return
          }
          
          const projectStart = startOfDay(new Date(project.startDate))
          const projectEnd = startOfDay(new Date(project.endDate))
          
          if (newStartDate < projectStart || newEndDate > projectEnd) {
            toast.error(`Campaign must remain within project dates (${new Date(project.startDate).toLocaleDateString()} - ${new Date(project.endDate).toLocaleDateString()})`)
            return
          }
        }
        
        const updates: Partial<Campaign> = {
          startDate: newStartDate.toISOString(),
          endDate: newEndDate.toISOString()
        }
        
        await campaignsService.update(event.metadata.campaignId, updates)
        
        if (setCampaigns) {
          setCampaigns(prevCampaigns =>
            prevCampaigns.map(c =>
              c.id === event.metadata.campaignId
                ? { ...c, ...updates }
                : c
            )
          )
        }
        
        toast.success('Campaign dates updated')
      }
      
      // Handle project resizes
      if (event.type === 'project' && event.metadata.projectId) {
        await projectsService.update(event.metadata.projectId, {
          startDate: newStartDate.toISOString(),
          endDate: newEndDate.toISOString()
        })
        
        if (setProjects) {
          setProjects(prevProjects =>
            prevProjects.map(p =>
              p.id === event.metadata.projectId
                ? { 
                    ...p, 
                    startDate: newStartDate.toISOString(),
                    endDate: newEndDate.toISOString()
                  }
                : p
            )
          )
        }
        
        toast.success('Project dates updated')
      }
      
      // Handle stage date resizes (for both campaigns and projects)
      if (event.type === 'stage' && event.metadata.stageId) {
        console.log('  -> Resizing stage:', event.metadata.stageId)
        
        if (event.metadata.campaignId) {
          console.log('  -> Campaign stage')
          const campaign = campaigns.find(c => c.id === event.metadata.campaignId)
          if (campaign?.stageDates) {
            console.log('  -> Found campaign with stageDates')
            const updatedStageDates = campaign.stageDates.map(stage =>
              stage.id === event.metadata.stageId
                ? { 
                    ...stage, 
                    startDate: newStartDate.toISOString(),
                    endDate: newEndDate.toISOString()
                  }
                : stage
            )
            
            console.log('  -> Updating campaign stageDates')
            await campaignsService.update(event.metadata.campaignId, {
              stageDates: updatedStageDates
            })
            
            if (setCampaigns) {
              setCampaigns(prevCampaigns =>
                prevCampaigns.map(c =>
                  c.id === event.metadata.campaignId
                    ? { ...c, stageDates: updatedStageDates }
                    : c
                )
              )
            }
            
            console.log('  -> Campaign stage dates updated successfully')
            toast.success('Stage dates updated')
          } else {
            console.log('  -> Campaign not found or no stageDates')
          }
        } else if (event.metadata.projectId) {
          console.log('  -> Project stage')
          const project = projects.find(p => p.id === event.metadata.projectId)
          if (project?.stageDates) {
            console.log('  -> Found project with stageDates')
            const updatedStageDates = project.stageDates.map(stage =>
              stage.id === event.metadata.stageId
                ? { 
                    ...stage, 
                    startDate: newStartDate.toISOString(),
                    endDate: newEndDate.toISOString()
                  }
                : stage
            )
            
            console.log('  -> Updating project stageDates')
            await projectsService.update(event.metadata.projectId, {
              stageDates: updatedStageDates
            })
            
            if (setProjects) {
              setProjects(prevProjects =>
                prevProjects.map(p =>
                  p.id === event.metadata.projectId
                    ? { ...p, stageDates: updatedStageDates }
                    : p
                )
              )
            }
            
            console.log('  -> Project stage dates updated successfully')
            toast.success('Stage dates updated')
          } else {
            console.log('  -> Project not found or no stageDates')
          }
        } else {
          console.log('  -> Stage has no campaignId or projectId!')
        }
      } else {
        console.log('  -> Event type not handled:', event.type)
      }
      
    } catch (error) {
      console.error('Error resizing event:', error)
      toast.error('Failed to update event')
    }
  }
  
  const handleDateClick = (date: Date) => {
    console.log('Date clicked:', date)
    // TODO: Could open a "create event" dialog
  }
  
  const handleSidebarItemDrop = async (item: any, date: Date) => {
    console.log('📦 Sidebar item dropped:', item, 'on date:', date)
    
    try {
      const startDate = startOfDay(date)
      // Default to 1 day duration for new items
      const endDate = startOfDay(addDays(date, 1))
      
      if (item.type === 'task' && item.metadata.taskId) {
        // Validate: Task must have a campaign assigned
        const task = tasks.find(t => t.id === item.metadata.taskId)
        if (!task) {
          toast.error('Task not found')
          return
        }
        
        if (!task.campaignId) {
          toast.error('Task must be assigned to a campaign before scheduling')
          return
        }
        
        // Validate: Campaign must have dates
        const campaign = campaigns.find(c => c.id === task.campaignId)
        if (!campaign) {
          toast.error('Campaign not found')
          return
        }
        
        if (!campaign.startDate || !campaign.endDate) {
          toast.error('Campaign must have dates assigned before scheduling tasks')
          return
        }
        
        // Validate: Task dates must be within campaign dates
        const campaignStart = startOfDay(new Date(campaign.startDate))
        const campaignEnd = startOfDay(new Date(campaign.endDate))
        
        if (startDate < campaignStart || endDate > campaignEnd) {
          toast.error(`Task must be scheduled within campaign dates (${new Date(campaign.startDate).toLocaleDateString()} - ${new Date(campaign.endDate).toLocaleDateString()})`)
          return
        }
        
        await tasksService.update(item.metadata.taskId, {
          startDate: startDate.toISOString(),
          dueDate: endDate.toISOString()
        })
        
        setTasks(prevTasks =>
          prevTasks.map(t =>
            t.id === item.metadata.taskId
              ? { ...t, startDate: startDate.toISOString(), dueDate: endDate.toISOString() }
              : t
          )
        )
        
        toast.success('Task scheduled')
      } else if (item.type === 'campaign' && item.metadata.campaignId && setCampaigns) {
        // Validate: Campaign must have a project assigned if there are projects
        const campaign = campaigns.find(c => c.id === item.metadata.campaignId)
        if (!campaign) {
          toast.error('Campaign not found')
          return
        }
        
        if (campaign.projectId) {
          // Campaign has a project - validate project has dates
          const project = projects.find(p => p.id === campaign.projectId)
          if (!project) {
            toast.error('Project not found')
            return
          }
          
          if (!project.startDate || !project.endDate) {
            toast.error('Project must have dates assigned before scheduling campaigns')
            return
          }
          
          // Validate: Campaign dates must be within project dates
          const projectStart = startOfDay(new Date(project.startDate))
          const projectEnd = startOfDay(new Date(project.endDate))
          
          if (startDate < projectStart || endDate > projectEnd) {
            toast.error(`Campaign must be scheduled within project dates (${new Date(project.startDate).toLocaleDateString()} - ${new Date(project.endDate).toLocaleDateString()})`)
            return
          }
        }
        
        await campaignsService.update(item.metadata.campaignId, {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
        
        setCampaigns(prevCampaigns =>
          prevCampaigns.map(c =>
            c.id === item.metadata.campaignId
              ? { ...c, startDate: startDate.toISOString(), endDate: endDate.toISOString() }
              : c
          )
        )
        
        toast.success('Campaign scheduled')
      } else if (item.type === 'project' && item.metadata.projectId && setProjects) {
        await projectsService.update(item.metadata.projectId, {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
        
        setProjects(prevProjects =>
          prevProjects.map(p =>
            p.id === item.metadata.projectId
              ? { ...p, startDate: startDate.toISOString(), endDate: endDate.toISOString() }
              : p
          )
        )
        
        toast.success('Project scheduled')
      } else if (item.type === 'stage' && item.metadata.stageId) {
        // Handle stage scheduling
        if (item.metadata.campaignId && setCampaigns) {
          const campaign = campaigns.find(c => c.id === item.metadata.campaignId)
          if (campaign) {
            const updatedStageDates = (campaign.stageDates || []).map(stage =>
              stage.id === item.metadata.stageId
                ? { ...stage, startDate: startDate.toISOString(), endDate: endDate.toISOString() }
                : stage
            )
            
            await campaignsService.update(item.metadata.campaignId, {
              stageDates: updatedStageDates
            })
            
            setCampaigns(prevCampaigns =>
              prevCampaigns.map(c =>
                c.id === item.metadata.campaignId
                  ? { ...c, stageDates: updatedStageDates }
                  : c
              )
            )
            
            toast.success('Stage scheduled')
          }
        } else if (item.metadata.projectId && setProjects) {
          const project = projects.find(p => p.id === item.metadata.projectId)
          if (project) {
            const updatedStageDates = (project.stageDates || []).map(stage =>
              stage.id === item.metadata.stageId
                ? { ...stage, startDate: startDate.toISOString(), endDate: endDate.toISOString() }
                : stage
            )
            
            await projectsService.update(item.metadata.projectId, {
              stageDates: updatedStageDates
            })
            
            setProjects(prevProjects =>
              prevProjects.map(p =>
                p.id === item.metadata.projectId
                  ? { ...p, stageDates: updatedStageDates }
                  : p
              )
            )
            
            toast.success('Stage scheduled')
          }
        }
      }
    } catch (error) {
      console.error('Error scheduling item:', error)
      toast.error('Failed to schedule item')
    }
  }
  
  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) : null
  const selectedCampaign = selectedCampaignId ? campaigns.find(c => c.id === selectedCampaignId) : null
  const selectedProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null
  
  return (
    <>
      <div className="flex h-full">
        <div className="flex-1 overflow-auto">
          <CalendarGrid
            events={calendarEvents}
            onEventClick={handleEventClick}
            onEventMove={handleEventMove}
            onEventResize={handleEventResize}
            onDateClick={handleDateClick}
            onSidebarItemDrop={handleSidebarItemDrop}
          />
        </div>
        
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <UnscheduledItemsSidebar
            campaigns={filteredCampaigns}
            projects={projects}
            tasks={filteredTasks}
            filterMode={filterMode}
            isCollapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            setTasks={setTasks}
            setCampaigns={setCampaigns}
            setProjects={setProjects}
          />
        </div>
      </div>

      {/* Mobile Full-Page Items Panel */}
      {showMobileItemsPanel && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] animate-in fade-in duration-300"
            onClick={() => setShowMobileItemsPanel(false)}
          />
          
          {/* Full-Page Panel */}
          <div className="md:hidden fixed inset-0 bg-card z-[80] animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Items</h2>
              <button
                onClick={() => setShowMobileItemsPanel(false)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X size={24} weight="bold" />
              </button>
            </div>
            
            {/* Content */}
            <div className="h-[calc(100%-4rem)] overflow-auto">
              <UnscheduledItemsSidebar
                campaigns={filteredCampaigns}
                projects={projects}
                tasks={filteredTasks}
                filterMode={filterMode}
                isCollapsed={false}
                onToggle={() => {}}
                setTasks={setTasks}
                setCampaigns={setCampaigns}
                setProjects={setProjects}
              />
            </div>
          </div>
        </>
      )}
      
      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          tasks={tasks}
          setTasks={setTasks}
          labels={labels}
          setLabels={setLabels}
          lists={lists}
          campaigns={campaigns}
          projects={projects}
          open={!!selectedTaskId}
          onOpenChange={(open) => !open && setSelectedTaskId(null)}
          orgId={orgId}
        />
      )}
      
      {selectedCampaign && setCampaigns && (
        <CampaignEditDialog
          campaign={selectedCampaign}
          campaigns={campaigns}
          setCampaigns={setCampaigns}
          projects={projects}
          lists={lists}
          setLists={undefined}
          setTasks={setTasks}
          tasks={tasks}
          open={!!selectedCampaignId}
          onOpenChange={(open) => !open && setSelectedCampaignId(null)}
        />
      )}
      
      {selectedProject && setProjects && setCampaigns && (
        <ProjectEditDialog
          project={selectedProject}
          projects={projects}
          setProjects={setProjects}
          campaigns={campaigns}
          setCampaigns={setCampaigns}
          tasks={tasks}
          setTasks={setTasks}
          open={!!selectedProjectId}
          onOpenChange={(open) => !open && setSelectedProjectId(null)}
        />
      )}
    </>
  )
})

NewCalendarView.displayName = 'NewCalendarView'

export default NewCalendarView
