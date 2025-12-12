import { useState, useRef } from 'react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { CalendarEvent } from './types'
import { EventSegment } from './utils'

interface EventBarProps {
  segment: EventSegment
  layer: number
  onEventClick: (event: CalendarEvent, e: React.MouseEvent) => void
  onDragStart: (event: CalendarEvent, e: React.DragEvent) => void
  onResizeStart: (event: CalendarEvent, handle: 'start' | 'end', e: React.MouseEvent) => void
  isDragging?: boolean
  isResizing?: boolean
}

export function EventBar({
  segment,
  layer,
  onEventClick,
  onDragStart,
  onResizeStart,
  isDragging = false,
  isResizing = false
}: EventBarProps) {
  const [isHovered, setIsHovered] = useState(false)
  const eventBarRef = useRef<HTMLDivElement>(null)
  const { event, isStart, isEnd, startCol, span } = segment
  
  // Calculate positioning
  const left = `${(startCol / 7) * 100}%`
  const width = `${(span / 7) * 100}%`
  const top = `${2.5 + layer * 1.75}rem` // Offset by date number + stack layers
  
  // Determine border radius
  const borderRadius = isStart && isEnd 
    ? 'rounded-md' 
    : isStart 
    ? 'rounded-l-md rounded-r-none' 
    : isEnd 
    ? 'rounded-r-md rounded-l-none' 
    : 'rounded-none'
  
  // Show content based on segment position
  const showFullTitle = isStart || (isEnd && span > 1)
  const showHandle = isStart || isEnd
  
  return (
    <div
      ref={eventBarRef}
      draggable
      onDragStart={(e) => {
        e.stopPropagation()
        onDragStart(event, e)
      }}
      onClick={(e) => {
        e.stopPropagation()
        onEventClick(event, e)
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'absolute h-6 px-2 py-1 cursor-move select-none',
        'transition-all duration-150',
        'flex items-center gap-1',
        'border-t-2 border-b-2',
        borderRadius,
        isHovered && !isDragging && !isResizing && 'shadow-md z-10 scale-[1.02]',
        isDragging && 'opacity-50 cursor-grabbing',
        isResizing && 'cursor-ew-resize'
      )}
      style={{
        left,
        width,
        top,
        backgroundColor: `${event.color}20`,
        borderColor: event.color,
        borderLeftWidth: isStart ? '3px' : '0',
        borderRightWidth: isEnd ? '3px' : '0',
        borderLeftStyle: 'solid',
        borderRightStyle: 'solid',
        color: event.color,
      }}
      title={`${event.title}\n${format(event.startDate, 'MMM d')} - ${format(event.endDate, 'MMM d')}\nDrag to move • Drag edges to resize • Click for details`}
    >
      {/* Start resize handle */}
      {isStart && showHandle && (
        <div
          className={cn(
            'absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-10',
            'hover:bg-current hover:opacity-30 active:opacity-50',
            'transition-opacity'
          )}
          onMouseDown={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onResizeStart(event, 'start', e)
          }}
          onClick={(e) => e.stopPropagation()}
          draggable={false}
          title="Drag to change start date"
        />
      )}
      
      {/* Event content */}
      {showFullTitle ? (
        <span className="text-xs font-medium truncate flex-1">
          {event.title}
        </span>
      ) : (
        <span className="text-xs font-medium w-full text-center">
          {event.title.substring(0, 3).toUpperCase()}
        </span>
      )}
      
      {/* Completion indicator */}
      {event.metadata.completed && (
        <span className="text-xs">✓</span>
      )}
      
      {/* End resize handle */}
      {isEnd && showHandle && (
        <div
          className={cn(
            'absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize z-10',
            'hover:bg-current hover:opacity-30 active:opacity-50',
            'transition-opacity'
          )}
          onMouseDown={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onResizeStart(event, 'end', e)
          }}
          onClick={(e) => e.stopPropagation()}
          draggable={false}
          title="Drag to change end date"
        />
      )}
    </div>
  )
}
