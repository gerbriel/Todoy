import { format, isSameDay, isSameMonth } from 'date-fns'
import { cn } from '@/lib/utils'
import { CalendarEvent } from './types'
import { getEventsForDate } from './utils'

interface DateCellProps {
  date: Date
  currentMonth: Date
  today: Date
  events: CalendarEvent[]
  onDateClick: (date: Date) => void
  onEventClick: (event: CalendarEvent, e: React.MouseEvent) => void
  onDragOver: (date: Date, e: React.DragEvent) => void
  onDrop: (date: Date, e: React.DragEvent) => void
  maxVisibleEvents?: number
}

export function DateCell({
  date,
  currentMonth,
  today,
  events,
  onDateClick,
  onEventClick,
  onDragOver,
  onDrop,
  maxVisibleEvents = 3
}: DateCellProps) {
  const isCurrentMonth = isSameMonth(date, currentMonth)
  const isToday = isSameDay(date, today)
  const dayEvents = getEventsForDate(events, date)
  
  const visibleEvents = dayEvents.slice(0, maxVisibleEvents)
  const hiddenCount = dayEvents.length - maxVisibleEvents
  
  return (
    <div
      className={cn(
        'relative min-h-[120px] border-r border-b border-border p-2',
        'hover:bg-accent/5 transition-colors cursor-pointer',
        !isCurrentMonth && 'bg-muted/30',
        isToday && 'bg-accent/10'
      )}
      onClick={() => onDateClick(date)}
      onDragOver={(e) => {
        e.preventDefault()
        onDragOver(date, e)
      }}
      onDrop={(e) => {
        e.preventDefault()
        onDrop(date, e)
      }}
    >
      {/* Date number */}
      <div
        className={cn(
          'text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full',
          isToday && 'bg-accent text-accent-foreground font-bold',
          !isCurrentMonth && !isToday && 'text-muted-foreground'
        )}
      >
        {format(date, 'd')}
      </div>
      
      {/* Event list placeholder - actual events will be rendered as overlays */}
      <div className="space-y-1">
        {visibleEvents.map((event, index) => (
          <div
            key={`${event.id}-${index}`}
            className="h-6" // Placeholder for event height
          />
        ))}
        
        {hiddenCount > 0 && (
          <button
            className="text-xs text-muted-foreground hover:text-foreground font-medium"
            onClick={(e) => {
              e.stopPropagation()
              // TODO: Show popover with all events
            }}
          >
            + {hiddenCount} more
          </button>
        )}
      </div>
    </div>
  )
}
