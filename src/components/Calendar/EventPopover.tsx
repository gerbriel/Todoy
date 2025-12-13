import { CalendarEvent } from './types'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { X } from '@phosphor-icons/react'
import { Button } from '../ui/button'

interface EventPopoverProps {
  date: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onClose: () => void
  position?: { top: number; left: number }
}

export function EventPopover({
  date,
  events,
  onEventClick,
  onClose,
  position
}: EventPopoverProps) {
  return (
    <div
      className="fixed z-50 w-80 bg-card border border-border rounded-lg shadow-lg"
      style={{
        top: position?.top || '50%',
        left: position?.left || '50%',
        transform: position ? 'none' : 'translate(-50%, -50%)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="font-semibold">
          {format(date, 'EEEE, MMMM d')}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onClose}
        >
          <X size={14} weight="bold" />
        </Button>
      </div>
      
      {/* Event list */}
      <div className="max-h-96 overflow-y-auto">
        {events.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">
            No events on this day
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {events.map(event => (
              <button
                key={event.id}
                onClick={() => {
                  onEventClick(event)
                  onClose()
                }}
                className={cn(
                  'w-full text-left p-2 rounded transition-colors',
                  'hover:bg-accent/50 active:scale-[0.98]',
                  'flex items-center gap-2'
                )}
              >
                {/* Color indicator */}
                <div
                  className="w-1 h-8 rounded-full flex-shrink-0"
                  style={{ backgroundColor: event.color }}
                />
                
                {/* Event details */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {event.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(event.startDate, 'MMM d')} - {format(event.endDate, 'MMM d')}
                  </div>
                  {event.type === 'task' && event.metadata.campaignName && (
                    <div className="text-xs text-muted-foreground/80 truncate mt-0.5">
                      Campaign: {event.metadata.campaignName}
                    </div>
                  )}
                  {event.metadata.description && event.type !== 'task' && (
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                      {event.metadata.description}
                    </div>
                  )}
                </div>
                
                {/* Status indicators */}
                <div className="flex-shrink-0">
                  {event.metadata.completed && (
                    <span className="text-green-600 text-sm">✓</span>
                  )}
                  {event.type === 'task' && (
                    <span className="text-xs text-muted-foreground">Task</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
