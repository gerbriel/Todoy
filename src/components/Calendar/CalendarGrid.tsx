import { useState } from 'react'
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  addMonths,
  subMonths,
  format
} from 'date-fns'
import { Button } from '../ui/button'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { CalendarEvent, DragState } from './types'
import { DateCell } from './DateCell'
import { EventBar } from './EventBar'
import { calculateEventSegments, organizeSegmentsByRow } from './utils'

interface CalendarGridProps {
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onEventMove: (eventId: string, newStartDate: Date) => void
  onEventResize: (eventId: string, newStartDate: Date, newEndDate: Date) => void
  onDateClick?: (date: Date) => void
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function CalendarGrid({
  events,
  onEventClick,
  onEventMove,
  onEventResize,
  onDateClick
}: CalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [dragState, setDragState] = useState<DragState>({
    eventId: null,
    isDragging: false,
    isResizing: false,
    resizeHandle: null,
    startDate: null,
    endDate: null,
    originalStartDate: null,
    originalEndDate: null
  })
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null)
  
  // Calculate calendar grid (always 6 weeks for consistency)
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  
  // Ensure we always have 6 weeks (42 days)
  while (calendarDays.length < 42) {
    const lastDay = calendarDays[calendarDays.length - 1]
    calendarDays.push(new Date(lastDay.getTime() + 24 * 60 * 60 * 1000))
  }
  
  // Calculate event segments
  const allSegments = events.flatMap(event => 
    calculateEventSegments(event, calendarStart, calendarEnd)
  )
  
  // Organize segments by row and layer
  const segmentsByRow = organizeSegmentsByRow(allSegments)
  
  const handleDragStart = (event: CalendarEvent, e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move'
    setDragState({
      eventId: event.id,
      isDragging: true,
      isResizing: false,
      resizeHandle: null,
      startDate: event.startDate,
      endDate: event.endDate,
      originalStartDate: event.startDate,
      originalEndDate: event.endDate
    })
  }
  
  const handleDragOver = (date: Date, e: React.DragEvent) => {
    if (dragState.isDragging) {
      setDragOverDate(date)
    }
  }
  
  const handleDrop = (date: Date, e: React.DragEvent) => {
    if (dragState.isDragging && dragState.eventId) {
      onEventMove(dragState.eventId, date)
      setDragState({
        eventId: null,
        isDragging: false,
        isResizing: false,
        resizeHandle: null,
        startDate: null,
        endDate: null,
        originalStartDate: null,
        originalEndDate: null
      })
      setDragOverDate(null)
    }
  }
  
  const handleResizeStart = (event: CalendarEvent, handle: 'start' | 'end', e: React.MouseEvent) => {
    e.stopPropagation()
    setDragState({
      eventId: event.id,
      isDragging: false,
      isResizing: true,
      resizeHandle: handle,
      startDate: event.startDate,
      endDate: event.endDate,
      originalStartDate: event.startDate,
      originalEndDate: event.endDate
    })
    // TODO: Add mouse move listeners for resize
  }
  
  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const handleToday = () => setCurrentDate(new Date())
  
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrevMonth}>
              <CaretLeft size={16} weight="bold" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextMonth}>
              <CaretRight size={16} weight="bold" />
            </Button>
            <h2 className="text-lg font-semibold ml-2">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
          </div>
        </div>
      </div>
      
      {/* Calendar grid */}
      <div className="flex-1 overflow-auto">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/50 sticky top-0 z-20">
          {WEEKDAYS.map(day => (
            <div
              key={day}
              className="px-2 py-2 text-xs font-semibold text-center text-muted-foreground border-r last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar cells */}
        <div className="relative">
          {/* Date cells grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => (
              <DateCell
                key={day.toISOString()}
                date={day}
                currentMonth={currentDate}
                today={new Date()}
                events={events}
                onDateClick={onDateClick || (() => {})}
                onEventClick={onEventClick}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              />
            ))}
          </div>
          
          {/* Event bars overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from(segmentsByRow.entries()).map(([row, layers]) => 
              layers.map((layer, layerIndex) => 
                layer.map(segment => (
                  <div
                    key={`${segment.event.id}-${segment.row}-${segment.startCol}`}
                    className="pointer-events-auto"
                    style={{
                      position: 'absolute',
                      top: `${row * (120 / 6)}px`, // Distribute across 6 weeks
                      left: 0,
                      right: 0,
                      height: '120px'
                    }}
                  >
                    <EventBar
                      segment={segment}
                      layer={layerIndex}
                      onEventClick={onEventClick}
                      onDragStart={handleDragStart}
                      onResizeStart={handleResizeStart}
                    />
                  </div>
                ))
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
