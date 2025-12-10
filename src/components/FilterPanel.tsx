import { Campaign, Label, FilterState } from '@/lib/types'
import { X } from '@phosphor-icons/react'
import { Button } from './ui/button'

interface FilterPanelProps {
  campaigns: Campaign[]
  labels: Label[]
  filters: FilterState
  setFilters: (filters: FilterState) => void
  onClose: () => void
}

export default function FilterPanel({
  onClose,
}: FilterPanelProps) {
  return (
    <div className="absolute top-0 right-0 bottom-0 w-80 bg-card border-l border-border p-6 shadow-lg z-10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Filters</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X size={16} />
        </Button>
      </div>
      <p className="text-muted-foreground text-sm">Filter options coming soon</p>
    </div>
  )
}
