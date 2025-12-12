import { CalendarEvent } from './types'
import { isSameDay, addDays, differenceInDays, startOfDay } from 'date-fns'

/**
 * Processes events into grid-aware segments for rendering
 * Each event may span multiple weeks, so we break it into row segments
 */
export interface EventSegment {
  event: CalendarEvent
  startDate: Date
  endDate: Date
  isStart: boolean // True if this segment contains the event's start
  isEnd: boolean // True if this segment contains the event's end
  row: number // Which week row (0-5)
  startCol: number // Which day column to start (0-6)
  span: number // How many cells to span (1-7)
}

export function calculateEventSegments(
  event: CalendarEvent,
  calendarStart: Date,
  calendarEnd: Date
): EventSegment[] {
  const segments: EventSegment[] = []
  const eventStart = startOfDay(event.startDate)
  const eventEnd = startOfDay(event.endDate)
  
  // Clamp event to calendar bounds
  const displayStart = eventStart < calendarStart ? calendarStart : eventStart
  const displayEnd = eventEnd > calendarEnd ? calendarEnd : eventEnd
  
  if (displayStart > calendarEnd || displayEnd < calendarStart) {
    return segments // Event not visible in this calendar view
  }
  
  let currentDate = displayStart
  let row = 0
  
  while (currentDate <= displayEnd) {
    // Find which row and column this date falls on
    const daysSinceStart = differenceInDays(currentDate, calendarStart)
    row = Math.floor(daysSinceStart / 7)
    const startCol = daysSinceStart % 7
    
    // Calculate end of this segment (either end of week or end of event)
    const endOfWeek = addDays(calendarStart, (row + 1) * 7 - 1)
    const segmentEnd = displayEnd < endOfWeek ? displayEnd : endOfWeek
    const span = differenceInDays(segmentEnd, currentDate) + 1
    
    segments.push({
      event,
      startDate: currentDate,
      endDate: segmentEnd,
      isStart: isSameDay(currentDate, eventStart),
      isEnd: isSameDay(segmentEnd, eventEnd),
      row,
      startCol,
      span
    })
    
    // Move to next week
    currentDate = addDays(segmentEnd, 1)
  }
  
  return segments
}

/**
 * Organize segments by row and layer (for stacking multiple events)
 */
export function organizeSegmentsByRow(segments: EventSegment[]): Map<number, EventSegment[][]> {
  const rowMap = new Map<number, EventSegment[][]>()
  
  segments.forEach(segment => {
    if (!rowMap.has(segment.row)) {
      rowMap.set(segment.row, [])
    }
    
    const rowLayers = rowMap.get(segment.row)!
    
    // Find a layer where this segment doesn't overlap with existing segments
    let placed = false
    for (const layer of rowLayers) {
      const hasOverlap = layer.some(existingSegment => {
        // Check if segments overlap in columns
        const existingEnd = existingSegment.startCol + existingSegment.span - 1
        const newEnd = segment.startCol + segment.span - 1
        return !(newEnd < existingSegment.startCol || segment.startCol > existingEnd)
      })
      
      if (!hasOverlap) {
        layer.push(segment)
        placed = true
        break
      }
    }
    
    // If no suitable layer found, create a new one
    if (!placed) {
      rowLayers.push([segment])
    }
  })
  
  return rowMap
}

/**
 * Get events for a specific date cell
 */
export function getEventsForDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
  return events.filter(event => {
    const start = startOfDay(event.startDate)
    const end = startOfDay(event.endDate)
    const target = startOfDay(date)
    return target >= start && target <= end
  })
}
