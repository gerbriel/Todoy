import { useState, useEffect, useCallback, useRef } from 'react'
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
import { CaretLeft, CaretRight, Funnel } from '@phosphor-icons/react'
import { CalendarEvent, DragState } from './types'
import { DateCell } from './DateCell'
import { EventBar } from './EventBar'
import { calculateEventSegments, organizeSegmentsByRow } from './utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface CalendarGridProps {
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onEventMove: (eventId: string, newStartDate: Date, newEndDate: Date) => void
  onEventResize: (eventId: string, newStartDate: Date, newEndDate: Date) => void
  onDateClick?: (date: Date) => void
  onSidebarItemDrop?: (item: any, date: Date) => void
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function CalendarGrid({
  events,
  onEventClick,
  onEventMove,
  onEventResize,
  onDateClick,
  onSidebarItemDrop
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
  const dragStateRef = useRef(dragState)
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null)
  const dragOverDateRef = useRef(dragOverDate)
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null)
  const [resizeStartX, setResizeStartX] = useState<number | null>(null)
  const [resizeCellWidth, setResizeCellWidth] = useState<number>(0)
  
  // Filter state
  const [eventTypeFilters, setEventTypeFilters] = useState({
    tasks: true,
    campaigns: true,
    projects: true,
    stages: true
  })
  
  // Keep refs in sync with state
  useEffect(() => {
    dragStateRef.current = dragState
  }, [dragState])
  
  useEffect(() => {
    dragOverDateRef.current = dragOverDate
  }, [dragOverDate])
  
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
  
  // Filter events based on selected types
  const filteredEvents = events.filter(event => {
    if (event.type === 'task') return eventTypeFilters.tasks
    if (event.type === 'campaign') return eventTypeFilters.campaigns
    if (event.type === 'project') return eventTypeFilters.projects
    if (event.type === 'stage') return eventTypeFilters.stages
    return true
  })
  
  // Calculate event segments
  const allSegments = filteredEvents.flatMap(event => 
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
  
  // If dragging, create a preview event at the new position
  let dragPreviewSegments: ReturnType<typeof calculateEventSegments> = []
  if (dragState.isDragging && dragState.eventId && dragOverDate && dragState.originalStartDate && dragState.originalEndDate) {
    const originalEvent = events.find(e => e.id === dragState.eventId)
    if (originalEvent) {
      const durationMs = dragState.originalEndDate.getTime() - dragState.originalStartDate.getTime()
      const newStartDate = startOfDay(dragOverDate)
      const newEndDate = new Date(newStartDate.getTime() + durationMs)
      
      const previewEvent: CalendarEvent = {
        ...originalEvent,
        startDate: newStartDate,
        endDate: newEndDate
      }
      dragPreviewSegments = calculateEventSegments(previewEvent, calendarStart, calendarEnd)
    }
  }
  
  // Organize segments by row and layer
  const segmentsByRow = organizeSegmentsByRow(allSegments)
  
  const handleDragStart = (event: CalendarEvent, e: React.MouseEvent) => {
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
    setDragStartPos({ x: e.clientX, y: e.clientY })
    
    // Add global mouse move and mouse up listeners
    const handleMouseMove = (moveEvent: MouseEvent) => {
      // Find which date cell we're over
      const elements = document.elementsFromPoint(moveEvent.clientX, moveEvent.clientY)
      const dateCell = elements.find(el => el.hasAttribute('data-calendar-cell'))
      
      if (dateCell) {
        const dateStr = dateCell.getAttribute('data-date')
        if (dateStr) {
          const date = new Date(dateStr)
          setDragOverDate(date)
        }
      }
    }
    
    const handleMouseUp = () => {
      const currentDragState = dragStateRef.current
      const currentDragOverDate = dragOverDateRef.current
      
      if (currentDragState.isDragging && currentDragState.eventId && currentDragOverDate && currentDragState.originalStartDate && currentDragState.originalEndDate) {
        // Calculate the duration of the original event
        const durationMs = currentDragState.originalEndDate.getTime() - currentDragState.originalStartDate.getTime()
        
        // Apply the same duration to the new position
        const newStartDate = startOfDay(currentDragOverDate)
        const newEndDate = new Date(newStartDate.getTime() + durationMs)
        
        onEventMove(currentDragState.eventId, newStartDate, newEndDate)
      }
      
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
      setDragStartPos(null)
      
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }
  
  const handleDragOver = (date: Date, e: React.DragEvent) => {
    e.preventDefault() // Allow drop
    if (dragState.isDragging) {
      setDragOverDate(date)
    }
  }
  
  const handleDrop = (date: Date, e: React.DragEvent) => {
    e.preventDefault()
    const currentDragState = dragStateRef.current
    
    // Check if this is a drop from the sidebar
    try {
      const dataStr = e.dataTransfer.getData('application/json')
      if (dataStr) {
        const data = JSON.parse(dataStr)
        if (data.fromSidebar && onSidebarItemDrop) {
          onSidebarItemDrop(data, date)
          return
        }
      }
    } catch (err) {
      // Not JSON data, continue with normal drop handling
    }
    
    // Handle normal event move
    if (currentDragState.isDragging && currentDragState.eventId && currentDragState.originalStartDate && currentDragState.originalEndDate) {
      // Calculate the duration of the original event
      const durationMs = currentDragState.originalEndDate.getTime() - currentDragState.originalStartDate.getTime()
      
      // Apply the same duration to the new position
      const newStartDate = startOfDay(date)
      const newEndDate = new Date(newStartDate.getTime() + durationMs)
      
      onEventMove(currentDragState.eventId, newStartDate, newEndDate)
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
      // Find which date cell we're over
      const elements = document.elementsFromPoint(moveEvent.clientX, moveEvent.clientY)
      const dateCell = elements.find(el => el.hasAttribute('data-calendar-cell'))
      
      if (!dateCell) return
      
      const dateStr = dateCell.getAttribute('data-date')
      if (!dateStr) return
      
      const hoveredDate = startOfDay(new Date(dateStr))
      
      setDragState(prev => {
        if (!prev.resizeHandle || !prev.originalStartDate || !prev.originalEndDate) return prev
        
        let newStartDate = prev.originalStartDate
        let newEndDate = prev.originalEndDate
        
        if (prev.resizeHandle === 'start') {
          newStartDate = hoveredDate
          // Prevent start from going past end (allow same day for single-day events)
          if (newStartDate > prev.originalEndDate) {
            newStartDate = prev.originalEndDate
          }
        } else {
          newEndDate = hoveredDate
          // Prevent end from going before start (allow same day for single-day events)
          if (newEndDate < prev.originalStartDate) {
            newEndDate = prev.originalStartDate
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
          
          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Funnel size={16} weight="bold" />
                Filter
                {(Object.values(eventTypeFilters).filter(v => !v).length > 0) && (
                  <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                    {Object.values(eventTypeFilters).filter(v => v).length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Event Types</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={eventTypeFilters.tasks}
                onCheckedChange={(checked) => setEventTypeFilters(prev => ({ ...prev, tasks: checked }))}
              >
                Tasks
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={eventTypeFilters.campaigns}
                onCheckedChange={(checked) => setEventTypeFilters(prev => ({ ...prev, campaigns: checked }))}
              >
                Campaigns
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={eventTypeFilters.projects}
                onCheckedChange={(checked) => setEventTypeFilters(prev => ({ ...prev, projects: checked }))}
              >
                Projects
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={eventTypeFilters.stages}
                onCheckedChange={(checked) => setEventTypeFilters(prev => ({ ...prev, stages: checked }))}
              >
                Stages
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                isDragging={dragState.isDragging}
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
                  
                  // Don't render original if we're dragging or resizing (show preview instead)
                  if (isDraggingThis || isResizingThis) return null
                  
                  return (
                    <div
                      key={`${segment.event.id}-${segment.row}-${segment.startCol}`}
                      className="pointer-events-auto"
                      style={{
                        position: 'absolute',
                        top: `${row * 120}px`,
                        left: `${(segment.startCol / 7) * 100}%`,
                        width: `${(segment.span / 7) * 100}%`,
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
                      top: `${segment.row * 120}px`,
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
            
            {/* Drag preview overlay */}
            {dragState.isDragging && dragPreviewSegments.length > 0 && (
              <>
                {dragPreviewSegments.map((segment, index) => (
                  <div
                    key={`drag-preview-${index}`}
                    className="pointer-events-none"
                    style={{
                      position: 'absolute',
                      top: `${segment.row * 120}px`,
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
