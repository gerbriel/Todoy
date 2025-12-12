import { useState } from 'react'
import { Folder, Kanban, CheckSquare, Archive, Tag, Briefcase, Stack, X } from '@phosphor-icons/react'
import { NavigationView } from '@/App'
import { cn } from '@/lib/utils'
import Sidebar from './Sidebar'
import { Project, Campaign, List, StageTemplate, Task, Organization, FilterState } from '@/lib/types'

interface MobileBottomNavProps {
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
  onNavigateToRecentlyCompleted?: () => void
  onNavigateToOrganization?: () => void
  onNavigateToLabels?: () => void
  onNavigateToProject: (projectId: string) => void
  onNavigateToCampaign: (campaignId: string) => void
  filters: FilterState
  setFilters: (filters: FilterState) => void
}

type SlideView = 'projects' | 'campaigns' | 'tasks' | 'archive' | 'labels' | 'organization' | null

export default function MobileBottomNav(props: MobileBottomNavProps) {
  const [slideView, setSlideView] = useState<SlideView>(null)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left')

  const openSlide = (view: SlideView, direction: 'left' | 'right') => {
    setSlideDirection(direction)
    setSlideView(view)
  }

  const closeSlide = () => {
    setSlideView(null)
  }

  const handleNavigate = (action: () => void) => {
    action()
    closeSlide()
  }

  return (
    <>
      {/* Bottom Navigation Bar - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-[60]">
        <div className="grid grid-cols-6 gap-1 px-2 py-2">
          {/* Left side items - slide in from left */}
          <button
            onClick={() => openSlide('projects', 'left')}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors",
              props.navigationView === 'all-projects' || props.navigationView === 'project'
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Folder size={20} weight="duotone" />
            <span className="text-[10px] mt-1">Projects</span>
          </button>

          <button
            onClick={() => openSlide('campaigns', 'left')}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors",
              props.navigationView === 'all-campaigns' || props.navigationView === 'campaign'
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Kanban size={20} weight="duotone" />
            <span className="text-[10px] mt-1">Campaigns</span>
          </button>

          <button
            onClick={() => openSlide('tasks', 'left')}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors",
              props.navigationView === 'master'
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <CheckSquare size={20} weight="duotone" />
            <span className="text-[10px] mt-1">Tasks</span>
          </button>

          {/* Right side items - slide in from right */}
          <button
            onClick={() => openSlide('archive', 'right')}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors",
              props.navigationView === 'archive'
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Archive size={20} weight="duotone" />
            <span className="text-[10px] mt-1">Archive</span>
          </button>

          <button
            onClick={() => openSlide('labels', 'right')}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors",
              props.navigationView === 'labels'
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Tag size={20} weight="duotone" />
            <span className="text-[10px] mt-1">Labels</span>
          </button>

          <button
            onClick={() => openSlide('organization', 'right')}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors",
              props.navigationView === 'organization'
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Briefcase size={20} weight="duotone" />
            <span className="text-[10px] mt-1">Org</span>
          </button>
        </div>
      </nav>

      {/* Slide-out Panel */}
      {slideView && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-300"
            onClick={closeSlide}
          />
          
          {/* Slide Panel - Full Screen */}
          <div
            className={cn(
              "md:hidden fixed top-0 bottom-0 w-full bg-card z-50 shadow-2xl transition-transform duration-300 ease-out overflow-hidden",
              slideDirection === 'left' ? 'left-0' : 'right-0',
              slideView
                ? 'translate-x-0'
                : slideDirection === 'left'
                ? '-translate-x-full'
                : 'translate-x-full'
            )}
          >
            {/* Close button */}
            <button
              onClick={closeSlide}
              className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <X size={24} weight="bold" />
            </button>

            {/* Sidebar content in full screen */}
            <div className="h-full w-full flex flex-col pb-16">
              <div className="flex-1 overflow-y-auto [&>aside]:w-full [&>aside]:h-full [&>aside]:border-r-0">
                <Sidebar
                  {...props}
                  onNavigateToAllProjects={() => handleNavigate(props.onNavigateToAllProjects)}
                  onNavigateToAllCampaigns={() => handleNavigate(props.onNavigateToAllCampaigns)}
                  onNavigateToAllTasks={() => handleNavigate(props.onNavigateToAllTasks)}
                  onNavigateToMaster={() => handleNavigate(props.onNavigateToMaster || (() => {}))}
                  onNavigateToArchive={() => handleNavigate(props.onNavigateToArchive || (() => {}))}
                  onNavigateToRecentlyCompleted={() => handleNavigate(props.onNavigateToRecentlyCompleted || (() => {}))}
                  onNavigateToOrganization={() => handleNavigate(props.onNavigateToOrganization || (() => {}))}
                  onNavigateToLabels={() => handleNavigate(props.onNavigateToLabels || (() => {}))}
                  onNavigateToProject={(id) => handleNavigate(() => props.onNavigateToProject(id))}
                  onNavigateToCampaign={(id) => handleNavigate(() => props.onNavigateToCampaign(id))}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
