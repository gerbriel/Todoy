import { format, isSameDay, isSameMonth } from 'date-fns'
import { cn } from '@/lib/utils'
import { CalendarEvent } from './types'
import { getEventsForDate } from './utils'
import { useState, useRef } from 'react'
import { EventPopover } from './EventPopover'

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
  'data-calendar-cell'?: boolean
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
  const [isDragOver, setIsDragOver] = useState(false)
  const [showPopover, setShowPopover] = useState(false)
  const cellRef = useRef<HTMLDivElement>(null)
  const isCurrentMonth = isSameMonth(date, currentMonth)
  const isToday = isSameDay(date, today)
  const dayEvents = getEventsForDate(events, date)
  
  const visibleEvents = dayEvents.slice(0, maxVisibleEvents)
  const hiddenCount = dayEvents.length - maxVisibleEvents
  
  const getPopoverPosition = () => {
    if (!cellRef.current) return undefined
    const rect = cellRef.current.getBoundingClientRect()
    return {
      top: rect.bottom + 4,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - 328)) // Keep within viewport
    }
  }
  
  return (
    <>
      <div
        ref={cellRef}
        data-calendar-cell
        data-date={date.toISOString()}
        className={cn(
          'relative min-h-[120px] border-r border-b border-border p-2',
          'hover:bg-accent/5 transition-colors cursor-pointer',
          !isCurrentMonth && 'bg-muted/30',
          isToday && 'bg-accent/10',
          isDragOver && 'bg-accent/20 ring-2 ring-accent ring-inset'
        )}
        onClick={() => onDateClick(date)}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
          onDragOver(date, e)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragOver(false)
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
              className={cn(
                'text-xs font-medium px-2 py-1 rounded',
                'hover:bg-accent hover:text-accent-foreground',
                'transition-colors'
              )}
              onClick={(e) => {
                e.stopPropagation()
                setShowPopover(true)
              }}
            >
              + {hiddenCount} more
            </button>
          )}
        </div>
      </div>
      
      {/* Popover overlay */}
      {showPopover && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPopover(false)}
          />
          
          {/* Popover */}
          <EventPopover
            date={date}
            events={dayEvents}
            onEventClick={(event) => {
              onEventClick(event, {} as React.MouseEvent)
              setShowPopover(false)
            }}
            onClose={() => setShowPopover(false)}
            position={getPopoverPosition()}
          />
        </>
      )}
    </>
  )
}
