import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays as addDaysUtil,
  format,
  differenceInDays,
  addDays,
  startOfDay,
  isSameDay,
  isSameWeek,
  isSameMonth
} from 'date-fns'
import { Button } from '../ui/button'
import { CaretLeft, CaretRight, Funnel } from '@phosphor-icons/react'
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

interface CalendarGridProps {
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onEventMove: (eventId: string, newStartDate: Date, newEndDate: Date) => void
  onEventResize: (eventId: string, newStartDate: Date, newEndDate: Date) => void
  onDateClick?: (date: Date) => void
  onSidebarItemDrop?: (item: any, date: Date) => void
  onGoToDate?: (goToDate: (date: Date) => void) => void
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MAX_VISIBLE_LAYERS = 4 // Show max 4 events before "show more" button

type ViewMode = 'month' | 'week' | 'day'

export function CalendarGrid({
  events,
  onEventClick,
  onEventMove,
  onEventResize,
  onDateClick,
  onSidebarItemDrop,
  onGoToDate
}: CalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month') // Default to month view
  const [expandedCells, setExpandedCells] = useState<Set<string>>(new Set())
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [visibleMonths, setVisibleMonths] = useState<Date[]>([])
  const monthRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const hasInitializedScroll = useRef(false)
  const allowScrollUpdates = useRef(false)
  
  // Generate initial months based on view mode
  useEffect(() => {
    const today = new Date()
    const todayMonth = startOfMonth(today)
    const prevMonth = subMonths(todayMonth, 1)
    const nextMonth = addMonths(todayMonth, 1)
    
    setCurrentDate(today)
    // Load 3 months on initial load for scrolling context
    setVisibleMonths([prevMonth, todayMonth, nextMonth])
  }, [])
  
  // Expose goToDate function to parent
  useEffect(() => {
    if (onGoToDate) {
      onGoToDate((date: Date) => {
        setCurrentDate(date)
        // Scroll to the date in month view
        if (viewMode === 'month') {
          const monthKey = format(date, 'yyyy-MM')
          const monthElement = monthRefs.current.get(monthKey)
          if (monthElement && scrollContainerRef.current) {
            monthElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }
      })
    }
  }, [onGoToDate, viewMode])
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
  
  // Helper function to calculate calendar grid for a specific month
  const getMonthCalendarData = (monthDate: Date) => {
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)
    
    // For continuous scroll, only show actual month days without padding
    // Start from the first day of the month's week
    const calendarStart = startOfWeek(monthStart)
    // End at the last day of the month's week
    const calendarEnd = endOfWeek(monthEnd)
    
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
    
    return { monthStart, monthEnd, calendarStart, calendarEnd, calendarDays }
  }
  
  // Filter events based on selected types
  const filteredEvents = events.filter(event => {
    if (event.type === 'task') return eventTypeFilters.tasks
    if (event.type === 'campaign') return eventTypeFilters.campaigns
    if (event.type === 'project') return eventTypeFilters.projects
    if (event.type === 'stage') return eventTypeFilters.stages
    return true
  })
  
  // Get calendar data for the current date (for preview calculations)
  const currentMonthData = getMonthCalendarData(currentDate)
  
  // Calculate event segments for the current month (for preview calculations)
  const allSegments = filteredEvents.flatMap(event => 
    calculateEventSegments(event, currentMonthData.calendarStart, currentMonthData.calendarEnd)
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
      resizePreviewSegments = calculateEventSegments(previewEvent, currentMonthData.calendarStart, currentMonthData.calendarEnd)
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
      dragPreviewSegments = calculateEventSegments(previewEvent, currentMonthData.calendarStart, currentMonthData.calendarEnd)
    }
  }
  
  // Organize segments by row and layer  
  const segmentsByRow = organizeSegmentsByRow(allSegments)
  
  // Helper to toggle cell expanded state (now accepts string keys for multi-month support)
  const toggleCellExpanded = (cellKey: string) => {
    setExpandedCells(prev => {
      const next = new Set(prev)
      if (next.has(cellKey)) {
        next.delete(cellKey)
      } else {
        next.add(cellKey)
      }
      return next
    })
  }
  
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
  
  const handlePrevMonth = () => {
    // Disable scroll updates during navigation
    allowScrollUpdates.current = false
    
    // Calculate new date based on view mode
    let newDate: Date
    if (viewMode === 'month') {
      newDate = subMonths(currentDate, 1) // Go back 1 month
    } else if (viewMode === 'week') {
      newDate = addDaysUtil(currentDate, -7) // Go back 7 days (1 week)
    } else {
      newDate = addDaysUtil(currentDate, -1) // Go back 1 day
    }
    
    const newMonth = startOfMonth(newDate)
    
    // Ensure the month exists in visibleMonths
    setVisibleMonths(prev => {
      const monthKey = format(newMonth, 'yyyy-MM')
      
      // Check if month already exists
      if (prev.some(m => format(m, 'yyyy-MM') === monthKey)) {
        return prev
      }
      
      // Add new month and deduplicate
      const newMonths = [newMonth, ...prev]
      const uniqueMonths = newMonths.filter((month, index, self) => 
        index === self.findIndex(m => format(m, 'yyyy-MM') === format(month, 'yyyy-MM'))
      )
      return uniqueMonths
    })
    
    // Update current date
    setCurrentDate(newDate)
    
    // Scroll to the new date
    setTimeout(() => {
      // In week/day views, DON'T scroll - just update currentDate and let React re-render
      if (viewMode === 'month') {
        scrollToMonth(newDate)
      }
      // No scrolling needed for week/day views - they show current month only
      
      // Re-enable scroll updates after navigation completes
      setTimeout(() => {
        allowScrollUpdates.current = true
      }, 500)
    }, 350)
  }
  
  const handleNextMonth = () => {
    
    // Disable scroll updates during navigation
    allowScrollUpdates.current = false
    
    // Calculate new date based on view mode
    let newDate: Date
    if (viewMode === 'month') {
      newDate = addMonths(currentDate, 1) // Go forward 1 month
    } else if (viewMode === 'week') {
      newDate = addDaysUtil(currentDate, 7) // Go forward 7 days (1 week)
    } else {
      newDate = addDaysUtil(currentDate, 1) // Go forward 1 day
    }
    
    const newMonth = startOfMonth(newDate)
    
    // Ensure the month exists in visibleMonths
    setVisibleMonths(prev => {
      const monthKey = format(newMonth, 'yyyy-MM')
      
      // Check if month already exists
      if (prev.some(m => format(m, 'yyyy-MM') === monthKey)) {
        return prev
      }
      
      // Add new month and deduplicate
      const newMonths = [...prev, newMonth]
      const uniqueMonths = newMonths.filter((month, index, self) => 
        index === self.findIndex(m => format(m, 'yyyy-MM') === format(month, 'yyyy-MM'))
      )
      return uniqueMonths
    })
    
    // Update current date
    setCurrentDate(newDate)
    
    // Scroll to the new date
    setTimeout(() => {
      // In week/day views, DON'T scroll - just update currentDate and let React re-render
      if (viewMode === 'month') {
        scrollToMonth(newDate)
      }
      // No scrolling needed for week/day views - they show current month only
      
      // Re-enable scroll updates after navigation completes
      setTimeout(() => {
        allowScrollUpdates.current = true
      }, 500)
    }, 350)
  }
  
  const handleToday = () => {
    // Disable scroll updates during navigation
    allowScrollUpdates.current = false
    
    const today = new Date()
    const todayMonth = startOfMonth(today)
    const prevMonth = subMonths(todayMonth, 1)
    const nextMonth = addMonths(todayMonth, 1)
    
    // Load today's month plus previous and next for scrolling context
    setVisibleMonths([prevMonth, todayMonth, nextMonth])
    setCurrentDate(today)
    
    // Scroll to today after state updates
    setTimeout(() => {
      scrollToMonth(today)
      // Re-enable scroll updates after navigation completes
      setTimeout(() => {
        allowScrollUpdates.current = true
      }, 500)
    }, 350)
  }
  
  // Handler to change view mode and reset to today
  const handleViewModeChange = (newMode: ViewMode) => {
    // Disable scroll updates during view change
    allowScrollUpdates.current = false
    
    setViewMode(newMode)
    const today = new Date()
    setCurrentDate(today)
    
    // ALWAYS reset to just current month when switching views
    const todayMonth = startOfMonth(today)
    setVisibleMonths([todayMonth])
    
    // Scroll to current period after view mode changes
    setTimeout(() => {
      if (newMode === 'month') {
        scrollToMonth(today)
      } else {
        scrollToCurrentWeek()
      }
      // Re-enable scroll updates after navigation completes
      setTimeout(() => {
        allowScrollUpdates.current = true
      }, 500)
    }, 200)
  }
  
  // Scroll to a specific month
  const scrollToMonth = (date: Date, retryCount: number = 0) => {
    if (!scrollContainerRef.current) {
      return
    }
    
    // Stop after 5 retries
    if (retryCount > 5) {
      return
    }
    
    const monthKey = format(date, 'yyyy-MM')
    const monthElement = monthRefs.current.get(monthKey)
    
    if (monthElement) {
      const container = scrollContainerRef.current
      const containerRect = container.getBoundingClientRect()
      const elementRect = monthElement.getBoundingClientRect()
      
      // Calculate absolute scroll position
      const scrollTop = elementRect.top - containerRect.top + container.scrollTop
      
      container.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      })
    } else {
      // Retry after a short delay if element not found
      setTimeout(() => scrollToMonth(date, retryCount + 1), 100)
    }
  }
  
  // Handle scroll to load more months
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return
    
    const container = scrollContainerRef.current
    const scrollTop = container.scrollTop
    const scrollHeight = container.scrollHeight
    const clientHeight = container.clientHeight
    
    // Only load additional months if scroll updates are enabled
    // This prevents loading months during navigation
    if (allowScrollUpdates.current) {
      // Load previous months when scrolling near top
      // Increased threshold from 200 to 100 and require scrollTop > 50 to avoid bounce triggers
      if (scrollTop < 100 && scrollTop > 50 && visibleMonths.length > 0) {
        const firstMonth = visibleMonths[0]
        const prevMonth = subMonths(firstMonth, 1)
        const monthKey = format(prevMonth, 'yyyy-MM')
        if (!visibleMonths.some(m => format(m, 'yyyy-MM') === monthKey)) {
          // Temporarily disable updates during month loading
          allowScrollUpdates.current = false
          setVisibleMonths(prev => {
            // Deduplicate just in case
            const newMonths = [prevMonth, ...prev]
            return newMonths.filter((month, index, self) => 
              index === self.findIndex(m => format(m, 'yyyy-MM') === format(month, 'yyyy-MM'))
            )
          })
          // Re-enable after a delay
          setTimeout(() => {
            allowScrollUpdates.current = true
          }, 300)
        }
      }
      
      // Load next months when scrolling near bottom
      if (scrollHeight - scrollTop - clientHeight < 100 && visibleMonths.length > 0) {
        const lastMonth = visibleMonths[visibleMonths.length - 1]
        const nextMonth = addMonths(lastMonth, 1)
        const monthKey = format(nextMonth, 'yyyy-MM')
        if (!visibleMonths.some(m => format(m, 'yyyy-MM') === monthKey)) {
          // Temporarily disable updates during month loading
          allowScrollUpdates.current = false
          setVisibleMonths(prev => {
            // Deduplicate just in case
            const newMonths = [...prev, nextMonth]
            return newMonths.filter((month, index, self) => 
              index === self.findIndex(m => format(m, 'yyyy-MM') === format(month, 'yyyy-MM'))
            )
          })
          // Re-enable after a delay
          setTimeout(() => {
            allowScrollUpdates.current = true
          }, 300)
        }
      }
    }
    
    // Update current date based on visible month in viewport
    // Only update after initial scroll is complete
    if (allowScrollUpdates.current && scrollTop > 50) {
      const viewportCenter = scrollTop + clientHeight / 2
      for (const month of visibleMonths) {
        const monthKey = format(month, 'yyyy-MM')
        const monthElement = monthRefs.current.get(monthKey)
        if (monthElement) {
          const rect = monthElement.getBoundingClientRect()
          const elementTop = rect.top - container.getBoundingClientRect().top + scrollTop
          const elementBottom = elementTop + rect.height
          
          if (viewportCenter >= elementTop && viewportCenter <= elementBottom) {
            if (format(currentDate, 'yyyy-MM') !== monthKey) {
              setCurrentDate(month)
            }
            break
          }
        }
      }
    }
  }, [visibleMonths, currentDate])
  
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])
  
  // Scroll to current period on initial load
  useEffect(() => {
    if (visibleMonths.length > 0 && !hasInitializedScroll.current) {
      hasInitializedScroll.current = true
      // Since we start with current month only, minimal delay needed
      setTimeout(() => {
        if (viewMode === 'week' || viewMode === 'day') {
          scrollToCurrentWeek()
        }
        // Month view doesn't need scroll since we start at current month
        
        // Allow scroll updates after initial render is complete
        setTimeout(() => {
          allowScrollUpdates.current = true
        }, 300)
      }, 100)
    }
  }, [visibleMonths])
  
  // Re-center when view mode changes
  useEffect(() => {
    if (hasInitializedScroll.current) {
      setTimeout(() => {
        if (viewMode === 'week' || viewMode === 'day') {
          scrollToCurrentWeek()
        } else if (viewMode === 'month') {
          scrollToMonth(currentDate)
        }
      }, 250)
    }
  }, [viewMode])
  
  // Function to scroll to current week/day with centering
  const scrollToCurrentWeek = () => {
    if (!scrollContainerRef.current) return
    
    const container = scrollContainerRef.current
    const weekStart = startOfWeek(currentDate)
    
    // Find the row that contains the current week/day
    const dateStr = format(weekStart, 'yyyy-MM-dd')
    const weekElement = container.querySelector(`[data-week-start="${dateStr}"]`)
    
    if (weekElement) {
      const containerRect = container.getBoundingClientRect()
      const elementRect = weekElement.getBoundingClientRect()
      
      // Center the element in the viewport for week/day views
      let offset = 100 // Default offset for month view
      if (viewMode === 'week' || viewMode === 'day') {
        // Calculate center position
        offset = (containerRect.height - elementRect.height) / 2
      }
      
      const scrollTop = elementRect.top - containerRect.top + container.scrollTop - offset
      
      container.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      })
    } else {
      // Retry after a short delay if element not found
      setTimeout(() => scrollToCurrentWeek(), 100)
    }
  }
  
  // Handle drag end to reset state
  const handleDragEnd = () => {
    setIsAnyDragActive(false)
  }
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      setIsAnyDragActive(false)
    }
  }, [])
  
  return (
    <div 
      className="h-full flex flex-col bg-background"
      onDragEnd={handleDragEnd}
    >
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
              {viewMode === 'month' && format(currentDate, 'MMMM yyyy')}
              {viewMode === 'week' && `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`}
              {viewMode === 'day' && format(currentDate, 'EEEE, MMMM d, yyyy')}
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Mode Selector */}
            <div className="flex items-center border border-border rounded-md overflow-hidden">
              <Button
                variant={viewMode === 'month' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none border-0"
                onClick={() => handleViewModeChange('month')}
              >
                Month
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none border-0 border-l border-r border-border"
                onClick={() => handleViewModeChange('week')}
              >
                Week
              </Button>
              <Button
                variant={viewMode === 'day' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none border-0"
                onClick={() => handleViewModeChange('day')}
              >
                Day
              </Button>
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
      </div>
      
      {/* Calendar grid */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto px-4 pb-4">
        {/* Weekday headers - hide in day view since we only show one cell */}
        {viewMode !== 'day' && (
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
        )}
        
        {/* Render multiple months */}
        {/* Render continuous calendar grid across all months */}
        {(() => {
          // Calculate the full continuous date range
          if (visibleMonths.length === 0) return null
          
          const firstMonth = visibleMonths[0]
          const lastMonth = visibleMonths[visibleMonths.length - 1]
          
          const firstMonthStart = startOfMonth(firstMonth)
          const lastMonthEnd = endOfMonth(lastMonth)
          
          const calendarStart = startOfWeek(firstMonthStart)
          const calendarEnd = endOfWeek(lastMonthEnd)
          
          // Always show all dates for continuous scroll
          const allCalendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
          
          // Calculate event segments for the entire range
          const allSegments = filteredEvents.flatMap(event => 
            calculateEventSegments(event, calendarStart, calendarEnd)
          )
          const segmentsByRow = organizeSegmentsByRow(allSegments)
          
          // Recalculate preview segments with the correct date range
          let previewResizeSegments: ReturnType<typeof calculateEventSegments> = []
          if (dragState.isResizing && dragState.eventId && dragState.startDate && dragState.endDate) {
            const originalEvent = events.find(e => e.id === dragState.eventId)
            if (originalEvent) {
              const previewEvent: CalendarEvent = {
                ...originalEvent,
                startDate: dragState.startDate,
                endDate: dragState.endDate
              }
              previewResizeSegments = calculateEventSegments(previewEvent, calendarStart, calendarEnd)
            }
          }
          
          let previewDragSegments: ReturnType<typeof calculateEventSegments> = []
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
              previewDragSegments = calculateEventSegments(previewEvent, calendarStart, calendarEnd)
            }
          }
          
          return (
            <div className="flex flex-col">
              {Array.from({ length: Math.ceil(allCalendarDays.length / 7) }, (_, rowIndex) => {
                const rowStart = rowIndex * 7
                const rowDays = allCalendarDays.slice(rowStart, rowStart + 7)
                
                // Skip if no days in this row
                if (rowDays.length === 0) return null
                
                // Check if this row has events and calculate height
                const layers = segmentsByRow.get(rowIndex) || []
                const cellKey = `row-${rowIndex}`
                const isExpanded = expandedCells.has(cellKey)
                const totalLayers = layers.length
                const hiddenCount = Math.max(0, totalLayers - MAX_VISIBLE_LAYERS)
                
                // Filter rows based on view mode
                const firstDayOfWeek = rowDays[0]
                const isCurrentWeek = rowDays.some(day => isSameWeek(day, currentDate))
                const isCurrentDay = rowDays.some(day => isSameDay(day, currentDate))
                
                // Skip rows not in current week/day for week/day views
                if (viewMode === 'week' && !isCurrentWeek) return null
                if (viewMode === 'day' && !isCurrentDay) return null
                
                // For day view, filter to show only the current day
                const visibleDays = viewMode === 'day' 
                  ? rowDays.filter(day => isSameDay(day, currentDate))
                  : rowDays
                
                // Calculate row height based on view mode
                // Month view: compact (180px base)
                // Week view: fill available space (much larger)
                // Day view: fill maximum space (largest)
                let baseHeight = 180
                if (viewMode === 'week') {
                  baseHeight = 500 // Much taller for single week view
                } else if (viewMode === 'day') {
                  baseHeight = 700 // Maximum height for single day view
                }
                
                const visibleLayerCount = isExpanded ? totalLayers : Math.min(totalLayers, MAX_VISIBLE_LAYERS)
                const eventSpace = visibleLayerCount > MAX_VISIBLE_LAYERS ? (visibleLayerCount - MAX_VISIBLE_LAYERS) * 36 : 0
                const rowHeight = baseHeight + eventSpace + (hiddenCount > 0 ? 30 : 0)
                
                const visibleLayers = isExpanded ? layers : layers.slice(0, MAX_VISIBLE_LAYERS)
                
                // Find the first cell (leftmost column) that has events in this row
                const firstEventCol = layers.length > 0 && layers[0].length > 0
                  ? Math.min(...layers.flatMap(layer => layer.map(seg => seg.startCol)))
                  : 0
                
                // Determine which month this row belongs to for ref placement
                const monthKey = format(startOfMonth(firstDayOfWeek), 'yyyy-MM')
                const weekStartKey = format(startOfWeek(firstDayOfWeek), 'yyyy-MM-dd')
                
                return (
                  <div 
                    key={`row-${rowIndex}`} 
                    className={cn(
                      "relative overflow-hidden",
                      viewMode === 'day' ? "grid grid-cols-1" : "grid grid-cols-7"
                    )}
                    style={{ 
                      height: `${rowHeight}px`
                    }}
                    data-week-start={weekStartKey}
                    ref={(el) => {
                      // Set month ref for the first row of each month
                      if (el && rowDays[0].getDate() === 1 && rowDays[0].getDay() === 0) {
                        monthRefs.current.set(monthKey, el)
                      } else if (el && rowIndex > 0) {
                        const prevRowFirstDay = allCalendarDays[(rowIndex - 1) * 7]
                        const currentRowFirstDay = rowDays[0]
                        // Set ref if this is the first row showing days from a new month
                        if (prevRowFirstDay.getMonth() !== currentRowFirstDay.getMonth() || 
                            prevRowFirstDay.getFullYear() !== currentRowFirstDay.getFullYear()) {
                          const newMonthKey = format(startOfMonth(currentRowFirstDay), 'yyyy-MM')
                          monthRefs.current.set(newMonthKey, el)
                        }
                      }
                    }}
                  >
                    {/* Date cells */}
                    {visibleDays.map((day) => {
                      // Determine which month this day belongs to for currentMonth prop
                      const dayMonthStart = startOfMonth(day)
                      
                      // Determine if this date is in the focus period based on view mode
                      let isInFocusPeriod = true
                      if (viewMode === 'month') {
                        isInFocusPeriod = isSameMonth(day, currentDate)
                      } else if (viewMode === 'week') {
                        isInFocusPeriod = isSameWeek(day, currentDate)
                      } else if (viewMode === 'day') {
                        isInFocusPeriod = isSameDay(day, currentDate)
                      }
                      
                      return (
                        <DateCell
                          key={day.toISOString()}
                          date={day}
                          currentMonth={dayMonthStart}
                          today={new Date()}
                          events={events}
                          onDateClick={onDateClick || (() => {})}
                          onEventClick={onEventClick}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          isDragging={dragState.isDragging}
                          isInFocusPeriod={isInFocusPeriod}
                          viewMode={viewMode}
                          data-calendar-cell
                        />
                      )
                    })}
                    
                    {/* Event bars for this row - absolutely positioned within the row */}
                    <div className={cn("absolute inset-0", isAnyDragActive ? "pointer-events-none" : "pointer-events-none")}>
                      {visibleLayers.map((layer, layerIndex) => 
                        layer.map(segment => {
                          const isDraggingThis = dragState.isDragging && dragState.eventId === segment.event.id
                          const isResizingThis = dragState.isResizing && dragState.eventId === segment.event.id
                          
                          // Don't render original if we're dragging or resizing (show preview instead)
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
                      
                      {/* Show more button */}
                      {!isExpanded && hiddenCount > 0 && (
                        <div
                          className="pointer-events-auto"
                          style={{
                            position: 'absolute',
                            bottom: '4px',
                            left: `${(firstEventCol / 7) * 100}%`,
                            width: `${(1 / 7) * 100}%`,
                            height: '24px'
                          }}
                        >
                          <ShowMoreButton
                            count={hiddenCount}
                            isExpanded={false}
                            onClick={() => toggleCellExpanded(cellKey)}
                            layer={0}
                          />
                        </div>
                      )}
                      
                      {/* Show less button when expanded */}
                      {isExpanded && hiddenCount > 0 && (
                        <div
                          className="pointer-events-auto"
                          style={{
                            position: 'absolute',
                            bottom: '4px',
                            left: `${(firstEventCol / 7) * 100}%`,
                            width: `${(1 / 7) * 100}%`,
                            height: '24px'
                          }}
                        >
                          <ShowMoreButton
                            count={hiddenCount}
                            isExpanded={true}
                            onClick={() => toggleCellExpanded(cellKey)}
                            layer={0}
                          />
                        </div>
                      )}
                      
                      {/* Drag and resize preview overlays */}
                      {dragState.isResizing && previewResizeSegments.length > 0 && (
                        <>
                          {previewResizeSegments.filter(seg => seg.row === rowIndex).map((segment, index) => {
                            // Find which layer this preview segment would be placed at
                            // by checking for overlaps with existing segments in this row
                            const rowLayers = segmentsByRow.get(rowIndex) || []
                            let previewLayer = 0
                            
                            for (let layerIdx = 0; layerIdx < rowLayers.length; layerIdx++) {
                              const layer = rowLayers[layerIdx]
                              const hasOverlap = layer.some(existingSegment => {
                                // Skip if this is the segment being resized
                                if (existingSegment.event.id === dragState.eventId) return false
                                
                                // Check if segments overlap in columns
                                const existingEnd = existingSegment.startCol + existingSegment.span - 1
                                const newEnd = segment.startCol + segment.span - 1
                                return !(newEnd < existingSegment.startCol || segment.startCol > existingEnd)
                              })
                              
                              if (!hasOverlap) {
                                previewLayer = layerIdx
                                break
                              }
                              previewLayer = layerIdx + 1
                            }
                            
                            // Use the same positioning formula as EventBar
                            const topPosition = `${2.5 + previewLayer * 2.25}rem`
                            
                            return (
                              <div
                                key={`resize-preview-${rowIndex}-${index}`}
                                className="pointer-events-none"
                                style={{
                                  position: 'absolute',
                                  top: topPosition,
                                  left: `${(segment.startCol / 7) * 100}%`,
                                  width: `${(segment.span / 7) * 100}%`,
                                  height: '24px',
                                  backgroundColor: `${events.find(e => e.id === dragState.eventId)?.color}40`,
                                  border: `2px dashed ${events.find(e => e.id === dragState.eventId)?.color}`,
                                  borderRadius: segment.isStart && segment.isEnd ? '0.375rem' : 
                                               segment.isStart ? '0.375rem 0 0 0.375rem' :
                                               segment.isEnd ? '0 0.375rem 0.375rem 0' : '0',
                                  zIndex: 50
                                }}
                              />
                            )
                          })}
                        </>
                      )}
                      
                      {dragState.isDragging && previewDragSegments.length > 0 && (
                        <>
                          {previewDragSegments.filter(seg => seg.row === rowIndex).map((segment, index) => {
                            // Find which layer this preview segment would be placed at
                            // by checking for overlaps with existing segments in this row
                            const rowLayers = segmentsByRow.get(rowIndex) || []
                            let previewLayer = 0
                            
                            for (let layerIdx = 0; layerIdx < rowLayers.length; layerIdx++) {
                              const layer = rowLayers[layerIdx]
                              const hasOverlap = layer.some(existingSegment => {
                                // Skip if this is the segment being dragged
                                if (existingSegment.event.id === dragState.eventId) return false
                                
                                // Check if segments overlap in columns
                                const existingEnd = existingSegment.startCol + existingSegment.span - 1
                                const newEnd = segment.startCol + segment.span - 1
                                return !(newEnd < existingSegment.startCol || segment.startCol > existingEnd)
                              })
                              
                              if (!hasOverlap) {
                                previewLayer = layerIdx
                                break
                              }
                              previewLayer = layerIdx + 1
                            }
                            
                            // Use the same positioning formula as EventBar
                            const topPosition = `${2.5 + previewLayer * 2.25}rem`
                            
                            return (
                              <div
                                key={`drag-preview-${rowIndex}-${index}`}
                                className="pointer-events-none"
                                style={{
                                  position: 'absolute',
                                  top: topPosition,
                                  left: `${(segment.startCol / 7) * 100}%`,
                                  width: `${(segment.span / 7) * 100}%`,
                                  height: '24px',
                                  backgroundColor: `${events.find(e => e.id === dragState.eventId)?.color}40`,
                                  border: `2px dashed ${events.find(e => e.id === dragState.eventId)?.color}`,
                                  borderRadius: segment.isStart && segment.isEnd ? '0.375rem' : 
                                               segment.isStart ? '0.375rem 0 0 0.375rem' :
                                               segment.isEnd ? '0 0.375rem 0.375rem 0' : '0',
                                  zIndex: 50
                                }}
                              />
                            )
                          })}
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })()}
      </div>
    </div>
  )
}
