import { useState, useEffect, useCallback } from 'react'
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  addMonths,
  subMonths,
  format,
  differenceInDays,
  addDays,
  startOfDay,
  isSameDay
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
  const [resizeStartX, setResizeStartX] = useState<number | null>(null)
  const [resizeCellWidth, setResizeCellWidth] = useState<number>(0)
  
  // Store cell width for resize calculations
  useEffect(() => {
    const updateCellWidth = () => {
      const firstCell = document.querySelector('[data-calendar-cell]')
      if (firstCell) {
        setResizeCellWidth(firstCell.getBoundingClientRect().width)
      }
    }
    
    updateCellWidth()
    window.addEventListener('resize', updateCellWidth)
    return () => window.removeEventListener('resize', updateCellWidth)
  }, [])
  
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
  
  // If resizing, create a preview event with adjusted dates
  let resizePreviewSegments: ReturnType<typeof calculateEventSegments> = []
  if (dragState.isResizing && dragState.eventId && dragState.startDate && dragState.endDate) {
    const originalEvent = events.find(e => e.id === dragState.eventId)
    if (originalEvent) {
      const previewEvent: CalendarEvent = {
        ...originalEvent,
        startDate: dragState.startDate,
        endDate: dragState.endDate
      }
      resizePreviewSegments = calculateEventSegments(previewEvent, calendarStart, calendarEnd)
    }
  }
  
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
    e.preventDefault()
    
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
    
    setResizeStartX(e.clientX)
    
    // Add global mouse move and mouse up listeners
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizeCellWidth) return
      
      const deltaX = moveEvent.clientX - e.clientX
      const daysDelta = Math.round(deltaX / resizeCellWidth)
      
      if (daysDelta === 0) return
      
      setDragState(prev => {
        if (!prev.originalStartDate || !prev.originalEndDate) return prev
        
        let newStartDate = prev.originalStartDate
        let newEndDate = prev.originalEndDate
        
        if (handle === 'start') {
          newStartDate = startOfDay(addDays(prev.originalStartDate, daysDelta))
          // Prevent start from going past end
          if (newStartDate >= prev.originalEndDate) {
            newStartDate = startOfDay(addDays(prev.originalEndDate, -1))
          }
        } else {
          newEndDate = startOfDay(addDays(prev.originalEndDate, daysDelta))
          // Prevent end from going before start
          if (newEndDate <= prev.originalStartDate) {
            newEndDate = startOfDay(addDays(prev.originalStartDate, 1))
          }
        }
        
        return {
          ...prev,
          startDate: newStartDate,
          endDate: newEndDate
        }
      })
    }
    
    const handleMouseUp = () => {
      setDragState(prev => {
        if (prev.isResizing && prev.eventId && prev.startDate && prev.endDate) {
          onEventResize(prev.eventId, prev.startDate, prev.endDate)
        }
        
        return {
          eventId: null,
          isDragging: false,
          isResizing: false,
          resizeHandle: null,
          startDate: null,
          endDate: null,
          originalStartDate: null,
          originalEndDate: null
        }
      })
      setResizeStartX(null)
      
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
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
                data-calendar-cell
              />
            ))}
          </div>
          
          {/* Event bars overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from(segmentsByRow.entries()).map(([row, layers]) => 
              layers.map((layer, layerIndex) => 
                layer.map(segment => {
                  const isDraggingThis = dragState.isDragging && dragState.eventId === segment.event.id
                  const isResizingThis = dragState.isResizing && dragState.eventId === segment.event.id
                  
                  // Don't render original if we're showing preview
                  if (isResizingThis) return null
                  
                  return (
                    <div
                      key={`${segment.event.id}-${segment.row}-${segment.startCol}`}
                      className="pointer-events-auto"
                      style={{
                        position: 'absolute',
                        top: `${row * (120 / 6)}px`,
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
                        isDragging={isDraggingThis}
                        isResizing={isResizingThis}
                      />
                    </div>
                  )
                })
              )
            )}
            
            {/* Resize preview overlay */}
            {dragState.isResizing && resizePreviewSegments.length > 0 && (
              <>
                {resizePreviewSegments.map((segment, index) => (
                  <div
                    key={`preview-${index}`}
                    className="pointer-events-none"
                    style={{
                      position: 'absolute',
                      top: `${segment.row * (120 / 6)}px`,
                      left: `${(segment.startCol / 7) * 100}%`,
                      width: `${(segment.span / 7) * 100}%`,
                      height: '24px',
                      marginTop: '2.5rem',
                      backgroundColor: `${events.find(e => e.id === dragState.eventId)?.color}40`,
                      border: `2px dashed ${events.find(e => e.id === dragState.eventId)?.color}`,
                      borderRadius: segment.isStart && segment.isEnd ? '0.375rem' : 
                                   segment.isStart ? '0.375rem 0 0 0.375rem' :
                                   segment.isEnd ? '0 0.375rem 0.375rem 0' : '0',
                      zIndex: 50
                    }}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
