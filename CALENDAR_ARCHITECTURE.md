# Calendar Redesign - Architecture Document

## Overview
This is a complete rewrite of the calendar system following foundational principles of direct manipulation interfaces. The calendar is designed as a fixed grid where events are physical objects anchored to time, easy to move, easy to adjust, and always clearly tied to their position in the calendar.

## Core Principles

### 1. Fixed Grid Structure
- **7×6 layout (42 cells)**: The grid never changes shape
- **Consistent spatial memory**: Users can build strong mental models
- **Events adapt to grid**: The grid doesn't adapt to events
- Each cell represents a single day and is an interactive container

### 2. Events as Physical Objects
- **Continuous bars**: Multi-day events span horizontally across cells
- **Visual continuity**: When crossing week boundaries, events break visually but remain a single logical entity
- **Rounded corners**: Applied only at true start/end dates, reinforcing single entity
- **Color-coded**: Each event type has distinct coloring

### 3. Direct Manipulation
- **Drag to move**: Drag event body to move entire event (preserves duration)
- **Resize handles**: Left handle adjusts start, right handle adjusts end
- **Click to view**: Opens detail panel without leaving calendar context
- **Optimistic updates**: UI responds immediately, reverts on failure

## Architecture

### Component Structure

```
Calendar/
├── types.ts              # TypeScript interfaces for events and state
├── utils.ts              # Event calculation and organization logic
├── converters.ts         # Convert app data to CalendarEvent format
├── CalendarGrid.tsx      # Main container with month navigation
├── DateCell.tsx          # Individual day cells
├── EventBar.tsx          # Draggable/resizable event visualization
└── index.ts              # Public exports
```

### Data Flow

```
App Data (Tasks, Campaigns, Projects)
    ↓
Converters
    ↓
CalendarEvent[] (normalized format)
    ↓
calculateEventSegments() (break into week rows)
    ↓
organizeSegmentsByRow() (stack without overlaps)
    ↓
EventBar components (render as continuous bars)
```

### Key Types

#### CalendarEvent
```typescript
interface CalendarEvent {
  id: string
  title: string
  startDate: Date
  endDate: Date
  color: string
  type: 'task' | 'campaign' | 'project' | 'stage'
  metadata: {
    taskId?: string
    campaignId?: string
    projectId?: string
    stageId?: string
    description?: string
    completed?: boolean
    assignedTo?: string[]
  }
}
```

#### EventSegment
```typescript
interface EventSegment {
  event: CalendarEvent
  startDate: Date      // Segment start (may differ from event start)
  endDate: Date        // Segment end (may differ from event end)
  isStart: boolean     // True if this segment contains event's start
  isEnd: boolean       // True if this segment contains event's end
  row: number          // Which week row (0-5)
  startCol: number     // Which day column (0-6)
  span: number         // How many cells to span (1-7)
}
```

## Segment Calculation Algorithm

The `calculateEventSegments()` function is crucial for rendering multi-day events:

1. **Clamp to calendar bounds**: Only show portions visible in current month view
2. **Break into week rows**: Events longer than one week get multiple segments
3. **Track true start/end**: Each segment knows if it contains the actual event boundaries
4. **Calculate span**: How many days each segment covers

Example: A 10-day event starting on Wednesday of week 1:
- Segment 1: Wed-Sun (row 1, startCol 3, span 5, isStart=true, isEnd=false)
- Segment 2: Mon-Tue (row 2, startCol 0, span 2, isStart=false, isEnd=true)

## Layer Stacking

The `organizeSegmentsByRow()` function prevents overlaps:

1. Group segments by week row
2. For each segment, try to place in existing layer
3. Check for column overlap with segments in that layer
4. If overlap exists, create new layer
5. Result: Each row has multiple layers, events stack vertically

## Event Rendering

### EventBar Component
- Positioned absolutely with calculated left/width/top
- Drag handle on the entire bar
- Resize handles on left/right edges (only at true start/end)
- Border radius applied based on isStart/isEnd flags
- Color from event.color with 20% opacity background
- Hover state with scale and shadow

### Border Treatment
```
isStart && isEnd:  rounded-md (single day)
isStart:           rounded-l-md (first segment)
isEnd:             rounded-r-md (last segment)
middle:            rounded-none (continuation)
```

### Content Display
- **Start segment**: Full title
- **End segment**: Full title (if span > 1)
- **Middle segments**: 3-letter abbreviation
- **Completion**: Checkmark icon if completed

## Interaction States

### Drag State
```typescript
interface DragState {
  eventId: string | null
  isDragging: boolean
  isResizing: boolean
  resizeHandle: 'start' | 'end' | null
  startDate: Date | null
  endDate: Date | null
  originalStartDate: Date | null  // For revert on failure
  originalEndDate: Date | null
}
```

### Visual Feedback
- **Drag over**: Date cell highlights
- **Hover**: Event scales up with shadow
- **Resize**: Cursor changes to ew-resize
- **Moving**: Original position shows ghost/placeholder

## Data Integration

### Converting Existing Data

#### Tasks
```typescript
- Single day events (dueDate only)
- Color: Green if completed, blue otherwise
- Metadata includes taskId, campaignId, completion status
```

#### Campaigns
```typescript
- Multiple phases as separate events:
  * Planning: planningStartDate → launchDate (blue)
  * Active: launchDate → endDate (green)
  * Follow-up: endDate → followUpDate (purple)
- Stage dates as individual events
```

#### Projects
```typescript
- Active phase: startDate → targetEndDate/actualEndDate
- Color: Green if completed, purple otherwise
- Stage dates as individual events
```

### Update Handlers

When events are moved/resized:
1. Calculate new dates
2. Find original entity (task/campaign/project)
3. Call appropriate service update method
4. Optimistically update local state
5. Show toast notification
6. Revert on error

## Performance Considerations

- **Segment calculation**: Only runs when events or month changes
- **Layer organization**: Efficient O(n*m) where m is layers (typically 2-3)
- **Render optimization**: Events outside calendar bounds are filtered early
- **Event delegation**: Date cells use single handler for all events

## Future Enhancements

### Completed
- ✅ Fixed grid structure
- ✅ Multi-day event rendering
- ✅ Event segmentation algorithm
- ✅ Layer stacking

### In Progress
- 🔄 Event detail panel/modal
- 🔄 Drag-and-drop implementation
- 🔄 Resize handles

### Todo
- ⏳ Overflow handling ("+ X more" indicator)
- ⏳ Hover tooltips
- ⏳ Event creation (click empty cell)
- ⏳ Keyboard navigation
- ⏳ Week view option
- ⏳ Day view option
- ⏳ Print formatting
- ⏳ Export to iCal
- ⏳ Recurring events
- ⏳ Time-based events (not just all-day)

## Usage Example

```typescript
import { CalendarGrid } from './Calendar'
import { convertToCalendarEvents } from './Calendar/converters'

function MyCalendar() {
  const events = convertToCalendarEvents(tasks, campaigns, projects)
  
  return (
    <CalendarGrid
      events={events}
      onEventClick={handleEventClick}
      onEventMove={handleEventMove}
      onEventResize={handleEventResize}
      onDateClick={handleDateClick}
    />
  )
}
```

## Testing Strategy

### Visual Tests
- Events spanning 1, 2, 3, 7+ days
- Events crossing month boundaries
- Multiple events on same day
- 5+ layers of stacked events

### Interaction Tests
- Drag event within same week
- Drag event across weeks
- Drag event to different month (with navigation)
- Resize to extend duration
- Resize to shorten duration
- Click to open detail
- Click date to create event

### Edge Cases
- Event starting before calendar view
- Event ending after calendar view
- Event spanning entire month
- Zero-duration events
- Invalid date ranges

## Design Decisions

### Why Fixed 6-Week Grid?
- Prevents layout shift when navigating months
- Provides consistent spatial reference
- Simpler calculations (always 42 cells)
- Industry standard (Google Calendar, Apple Calendar)

### Why Segments Instead of Daily Items?
- Single event = single entity (better mental model)
- Easier to implement drag-and-drop
- More efficient rendering
- Clearer visual continuity

### Why Absolute Positioning for Events?
- Allows precise control over spans
- Enables smooth animations
- Simplifies overlap handling
- Better performance than flexbox stacking

### Why Separate DateCell and EventBar?
- Clear separation of concerns
- DateCell handles day logic
- EventBar handles event logic
- EventBar can overlay multiple cells
- Easier to test independently

## Accessibility

### Keyboard Navigation
- Arrow keys: Move between dates
- Enter: Select date/event
- Space: Open event details
- Tab: Navigate between events
- Escape: Close details/cancel drag

### Screen Readers
- ARIA labels for all interactive elements
- Semantic HTML structure
- Focus management during interactions
- Announce date changes
- Announce event moves/resizes

### Visual
- High contrast borders
- Color not sole indicator
- Adequate touch targets (>44px)
- Clear focus indicators
- Zoom support

## Conclusion

This calendar system provides a solid foundation for direct manipulation of temporal data. The fixed grid structure, continuous event rendering, and carefully designed interaction patterns create an interface where events feel like physical objects that users can confidently move and adjust.

The architecture is extensible, performant, and follows best practices for complex UI components. Next steps will focus on completing the interaction layer and adding progressive enhancements.
