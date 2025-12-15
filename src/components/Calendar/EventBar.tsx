import { useState, useRef } from 'react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { CalendarEvent } from './types'
import { EventSegment } from './utils'

interface EventBarProps {
  segment: EventSegment
  layer: number
  onEventClick: (event: CalendarEvent, e: React.MouseEvent) => void
  onDragStart: (event: CalendarEvent, e: React.MouseEvent) => void
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
  const top = `${2.5 + layer * 2.25}rem` // Offset by date number + stack layers (increased spacing for h-8 bars)
  
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
  
  // Handle mouse down on the event bar (for dragging)
  const handleMouseDown = (e: React.MouseEvent) => {
    console.log('EventBar mouseDown:', event.title)
    
    // Ignore if clicking on resize handle
    if ((e.target as HTMLElement).hasAttribute('data-resize-handle')) {
      console.log('  -> Clicked on resize handle, ignoring')
      return
    }
    
    const startPos = { x: e.clientX, y: e.clientY }
    let hasMoved = false
    
    // Start drag after a small movement threshold
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startPos.x
      const dy = moveEvent.clientY - startPos.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      // If moved more than 5px, start dragging
      if (distance > 5 && !hasMoved) {
        console.log('  -> Started dragging (moved >5px)')
        hasMoved = true
        onDragStart(event, e)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
    
    const handleMouseUp = (upEvent: MouseEvent) => {
      // If no significant movement, treat as click
      if (!hasMoved) {
        const dx = upEvent.clientX - startPos.x
        const dy = upEvent.clientY - startPos.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        console.log(`  -> Mouse up, distance: ${distance.toFixed(2)}px, hasMoved: ${hasMoved}`)
        
        if (distance <= 5) {
          console.log('  -> Treating as click, calling onEventClick')
          // Create a synthetic React mouse event for the click handler
          onEventClick(event, e)
        }
      } else {
        console.log('  -> Mouse up after drag, not treating as click')
      }
      
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }
  
  return (
    <div
      ref={eventBarRef}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'group absolute h-8 px-2 py-1.5 cursor-pointer select-none',
        'transition-all duration-150',
        'flex items-center gap-1',
        'border-t-2 border-b-2',
        borderRadius,
        isHovered && !isDragging && !isResizing && 'shadow-md z-10 scale-[1.02]',
        isDragging && 'opacity-50 cursor-grabbing',
        isResizing && 'cursor-ew-resize'
      )}
      style={{
        left: 0,
        width: '100%',
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
          data-resize-handle
          className={cn(
            'absolute left-0 top-0 bottom-0 w-5 cursor-ew-resize z-20',
            'hover:bg-white hover:opacity-40 active:opacity-60',
            'transition-all duration-150',
            '-ml-2 rounded-l-md', // Extend beyond edge and match event radius
            'group-hover:opacity-20' // Subtle hint when hovering over event
          )}
          onMouseDown={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onResizeStart(event, 'start', e)
          }}
          title="Drag to change start date"
        />
      )}
      
      {/* Main clickable content area - positioned above event background */}
      <div 
        className="relative z-10 flex items-center gap-1 flex-1 min-w-0 px-1"
        style={{ pointerEvents: 'auto' }}
      >
        {/* Event content - aggressively remove any "+X more" patterns */}
        {showFullTitle ? (
          <span className="text-sm font-medium truncate flex-1">
            {event.title.split(/[\+\s]*\d+\s*more/i)[0].trim()}
          </span>
        ) : (
          <span className="text-sm font-medium w-full text-center">
            {event.title.split(/[\+\s]*\d+\s*more/i)[0].trim().substring(0, 3).toUpperCase()}
          </span>
        )}
        
        {/* Completion indicator */}
        {event.metadata.completed && (
          <span className="text-sm">✓</span>
        )}
      </div>
      
      {/* End resize handle */}
      {isEnd && showHandle && (
        <div
          data-resize-handle
          className={cn(
            'absolute right-0 top-0 bottom-0 w-5 cursor-ew-resize z-20',
            'hover:bg-white hover:opacity-40 active:opacity-60',
            'transition-all duration-150',
            '-mr-2 rounded-r-md', // Extend beyond edge and match event radius
            'group-hover:opacity-20' // Subtle hint when hovering over event
          )}
          onMouseDown={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onResizeStart(event, 'end', e)
          }}
          title="Drag to change end date"
        />
      )}
    </div>
  )
}
