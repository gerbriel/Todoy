import { useState } from 'react'
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
}

export function EventBar({
  segment,
  layer,
  onEventClick,
  onDragStart,
  onResizeStart
}: EventBarProps) {
  const [isHovered, setIsHovered] = useState(false)
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
      draggable
      onDragStart={(e) => onDragStart(event, e)}
      onClick={(e) => {
        e.stopPropagation()
        onEventClick(event, e)
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'absolute h-6 px-2 py-1 cursor-move',
        'transition-all duration-150',
        'flex items-center gap-1',
        'border-t-2 border-b-2',
        borderRadius,
        isHovered && 'shadow-md z-10 scale-[1.02]'
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
      title={`${event.title} (${format(event.startDate, 'MMM d')} - ${format(event.endDate, 'MMM d')})`}
    >
      {/* Start resize handle */}
      {isStart && showHandle && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-current hover:opacity-50"
          onMouseDown={(e) => {
            e.stopPropagation()
            onResizeStart(event, 'start', e)
          }}
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
          className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-current hover:opacity-50"
          onMouseDown={(e) => {
            e.stopPropagation()
            onResizeStart(event, 'end', e)
          }}
        />
      )}
    </div>
  )
}
