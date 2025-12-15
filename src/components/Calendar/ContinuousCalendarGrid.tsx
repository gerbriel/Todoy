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
  isSameDay,
  isSameMonth
} from 'date-fns'
import { Button } from '../ui/button'
import { Funnel } from '@phosphor-icons/react'
import { CalendarEvent, DragState } from './types'
import { DateCell } from './DateCell'
import { EventBar } from './EventBar'
import { cn } from '@/lib/utils'
import { ShowMoreButton } from './ShowMoreButton'
import { calculateEventSegments, organizeSegmentsByRow } from './utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface ContinuousCalendarGridProps {
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onEventMove: (eventId: string, newStartDate: Date, newEndDate: Date) => void
  onEventResize: (eventId: string, newStartDate: Date, newEndDate: Date) => void
  onDateClick?: (date: Date) => void
  onSidebarItemDrop?: (item: any, date: Date) => void
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MAX_VISIBLE_LAYERS = 4
const MONTHS_TO_RENDER = 12 // Render 12 months total (6 before, current, 5 after)

export function ContinuousCalendarGrid({
  events,
  onEventClick,
  onEventMove,
  onEventResize,
  onDateClick,
  onSidebarItemDrop
}: ContinuousCalendarGridProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [expandedCells, setExpandedCells] = useState<Set<string>>(new Set())
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const monthRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const isScrollingProgrammatically = useRef(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
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
  const [isAnyDragActive, setIsAnyDragActive] = useState(false)
  
  // Filter state
  const [eventTypeFilters, setEventTypeFilters] = useState({
    tasks: true,
    campaigns: true,
    projects: true,
    stages: true
  })
  
  // Generate array of months to render
  const monthsToRender = Array.from({ length: MONTHS_TO_RENDER }, (_, i) => {
    return addMonths(currentMonth, i - 6) // 6 months before, current, 5 after
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
  
  // Scroll to current month on mount
  useEffect(() => {
    const monthKey = format(currentMonth, 'yyyy-MM')
    const monthElement = monthRefs.current.get(monthKey)
    
    if (monthElement && scrollContainerRef.current) {
      isScrollingProgrammatically.current = true
      monthElement.scrollIntoView({ block: 'start' })
      // Give enough time for scroll to complete before allowing user scroll detection
      setTimeout(() => {
        isScrollingProgrammatically.current = false
      }, 300)
    } else {
      // If element not found, still clear the flag
      setTimeout(() => {
        isScrollingProgrammatically.current = false
      }, 100)
    }
  }, []) // Only on mount
  
  // Detect which month is in view and update currentMonth
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    
    const handleScroll = () => {
      if (isScrollingProgrammatically.current) return
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      
      // Debounce the month update to avoid rapid changes
      scrollTimeoutRef.current = setTimeout(() => {
        const containerRect = container.getBoundingClientRect()
        const containerCenter = containerRect.top + containerRect.height / 2 // Use center as reference
        
        // Find which month has the most visible area near the center
        let bestMatch: { monthKey: string; distance: number } | null = null
        
        for (const [monthKey, monthElement] of monthRefs.current.entries()) {
          const rect = monthElement.getBoundingClientRect()
          
          // Calculate distance from month center to container center
          const monthCenter = rect.top + rect.height / 2
          const distance = Math.abs(monthCenter - containerCenter)
          
          // Only consider months that are at least partially visible
          if (rect.bottom > containerRect.top && rect.top < containerRect.bottom) {
            if (!bestMatch || distance < bestMatch.distance) {
              bestMatch = { monthKey, distance }
            }
          }
        }
        
        if (bestMatch) {
          const [year, month] = bestMatch.monthKey.split('-')
          const newMonth = new Date(parseInt(year), parseInt(month) - 1)
          // Use a callback to avoid dependency on currentMonth
          setCurrentMonth(prevMonth => {
            if (!isSameMonth(newMonth, prevMonth)) {
              return newMonth
            }
            return prevMonth
          })
        }
      }, 150) // 150ms debounce
    }
    
    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, []) // Remove currentMonth dependency to avoid re-registering listener
  
  const handleToday = () => {
    const today = new Date()
    setCurrentMonth(today)
    
    // Scroll to today's month
    setTimeout(() => {
      const monthKey = format(today, 'yyyy-MM')
      const monthElement = monthRefs.current.get(monthKey)
      
      if (monthElement && scrollContainerRef.current) {
        isScrollingProgrammatically.current = true
        monthElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setTimeout(() => {
          isScrollingProgrammatically.current = false
        }, 500)
      }
    }, 0)
  }
  
  // Filter events based on selected types
  const filteredEvents = events.filter(event => {
    if (event.type === 'task') return eventTypeFilters.tasks
    if (event.type === 'campaign') return eventTypeFilters.campaigns
    if (event.type === 'project') return eventTypeFilters.projects
    if (event.type === 'stage') return eventTypeFilters.stages
    return true
  })
  
  // Rest of the drag/drop handlers remain the same...
  const handleDragStart = useCallback((event: CalendarEvent, e: React.MouseEvent) => {
    // ... (keep existing handleDragStart implementation)
  }, [])
  
  const handleResizeStart = useCallback((event: CalendarEvent, handle: 'start' | 'end', e: React.MouseEvent) => {
    // ... (keep existing handleResizeStart implementation)
  }, [resizeCellWidth])
  
  const handleDragOver = (date: Date, e: React.DragEvent) => {
    e.preventDefault()
    setIsAnyDragActive(true)
    if (dragState.isDragging) {
      setDragOverDate(date)
    }
  }
  
  const handleDrop = (date: Date, e: React.DragEvent) => {
    e.preventDefault()
    setIsAnyDragActive(false)
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
    
    if (currentDragState.isDragging && currentDragState.eventId && currentDragState.originalStartDate && currentDragState.originalEndDate) {
      const durationMs = currentDragState.originalEndDate.getTime() - currentDragState.originalStartDate.getTime()
      const newStartDate = startOfDay(date)
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
  }
  
  const handleDragEnd = () => {
    setIsAnyDragActive(false)
  }
  
  // Render a single month
  const renderMonth = (month: Date) => {
    const monthKey = format(month, 'yyyy-MM')
    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)
    
    const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
    const weeks = []
    
    for (let i = 0; i < allDays.length; i += 7) {
      weeks.push(allDays.slice(i, i + 7))
    }
    
    return (
      <div 
        key={monthKey}
        ref={(el) => {
          if (el) monthRefs.current.set(monthKey, el)
          else monthRefs.current.delete(monthKey)
        }}
        className="border-b-4 border-border"
      >
        {/* Month Header */}
        <div className="sticky top-0 z-30 bg-card border-b-2 border-border px-4 py-3">
          <h2 className="text-lg font-semibold">
            {format(month, 'MMMM yyyy')}
          </h2>
        </div>
        
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/50 sticky top-[52px] z-20">
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
          <div className="flex flex-col">
            {weeks.map((week, weekIndex) => {
              const weekKey = `${monthKey}-week-${weekIndex}`
              const weekStart = week[0]
              const weekEnd = week[6]
              
              // Get events for this week
              const weekEvents = filteredEvents.filter(event => {
                const eventStart = startOfDay(event.startDate)
                const eventEnd = startOfDay(event.endDate)
                return eventStart <= weekEnd && eventEnd >= weekStart
              })
              
              // Calculate segments for this week
              const segments = calculateEventSegments(weekEvents, weekStart, weekEnd)
              const { visibleLayers, hiddenCount } = organizeSegmentsByRow(segments, MAX_VISIBLE_LAYERS)
              
              const eventSpace = visibleLayers.length > 0 ? visibleLayers.length * 2.25 + 2.5 : 0
              const showMoreSpace = hiddenCount > 0 ? 30 : 0
              const rowHeight = `${180 + eventSpace * 16 + showMoreSpace}px`
              
              const isExpanded = expandedCells.has(weekKey)
              const layersToShow = isExpanded ? segments.length : MAX_VISIBLE_LAYERS
              
              return (
                <div 
                  key={weekKey}
                  className="relative grid grid-cols-7 overflow-hidden"
                  style={{ minHeight: rowHeight }}
                >
                  {/* Date cells */}
                  {week.map((date) => {
                    const isCurrentMonth = isSameMonth(date, month)
                    return (
                      <DateCell
                        key={date.toISOString()}
                        date={date}
                        isCurrentMonth={isCurrentMonth}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={onDateClick}
                      />
                    )
                  })}
                  
                  {/* Event bars */}
                  <div className={cn("absolute inset-0", isAnyDragActive ? "pointer-events-none" : "pointer-events-none")}>
                    {visibleLayers.map((layer, layerIndex) => 
                      layer.map(segment => {
                        const isDraggingThis = dragState.isDragging && dragState.eventId === segment.event.id
                        const isResizingThis = dragState.isResizing && dragState.eventId === segment.event.id
                        
                        if (isDraggingThis || isResizingThis) return null
                        
                        return (
                          <div
                            key={`${segment.event.id}-${segment.row}-${segment.startCol}`}
                            className={cn("pointer-events-auto", isAnyDragActive && "pointer-events-none")}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: `${(segment.startCol / 7) * 100}%`,
                              width: `${(segment.span / 7) * 100}%`,
                              height: '100%'
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
                    )}
                  </div>
                  
                  {/* Show more button */}
                  {hiddenCount > 0 && (
                    <ShowMoreButton
                      hiddenCount={hiddenCount}
                      isExpanded={isExpanded}
                      onToggle={() => {
                        setExpandedCells(prev => {
                          const next = new Set(prev)
                          if (next.has(weekKey)) {
                            next.delete(weekKey)
                          } else {
                            next.add(weekKey)
                          }
                          return next
                        })
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div 
      className="h-full flex flex-col bg-background"
      onDragEnd={handleDragEnd}
    >
      {/* Header */}
      <div className="p-4 border-b border-border bg-card sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
            <h2 className="text-lg font-semibold ml-2">
              {format(currentMonth, 'MMMM yyyy')}
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
                checked={eventTypeFilters.projects}
                onCheckedChange={(checked) => setEventTypeFilters(prev => ({ ...prev, projects: checked }))}
              >
                Projects
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={eventTypeFilters.campaigns}
                onCheckedChange={(checked) => setEventTypeFilters(prev => ({ ...prev, campaigns: checked }))}
              >
                Campaigns
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={eventTypeFilters.tasks}
                onCheckedChange={(checked) => setEventTypeFilters(prev => ({ ...prev, tasks: checked }))}
              >
                Tasks
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
      
      {/* Scrollable calendar */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden"
      >
        {monthsToRender.map(month => renderMonth(month))}
      </div>
    </div>
  )
}
