import { Campaign, ViewMode, FilterState } from '@/lib/types'
import { Button } from './ui/button'
import { Kanban, CalendarBlank } from '@phosphor-icons/react'

interface HeaderProps {
  activeCampaign?: Campaign
  campaigns: Campaign[]
  setCampaigns: (updater: (campaigns: Campaign[]) => Campaign[]) => void
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  showFilterPanel: boolean
  setShowFilterPanel: (show: boolean) => void
  filters: FilterState
  setFilters: (filters: FilterState) => void
}

export default function Header({
  activeCampaign,
  viewMode,
  setViewMode,
}: HeaderProps) {
  return (
    <header className="border-b border-border bg-card px-6 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          {activeCampaign?.title || 'All Campaigns'}
        </h2>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('kanban')}
          >
            <Kanban size={16} weight="bold" />
            Kanban
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
          >
            <CalendarBlank size={16} weight="bold" />
            Calendar
          </Button>
        </div>
      </div>
    </header>
  )
}
