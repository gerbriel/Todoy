# Calendar Component System

A modern, fully-featured calendar system with direct manipulation interfaces. Events are treated as physical objects anchored to time, with drag-and-drop, resizing, and intuitive interactions.

## Features

### ✅ Fixed Grid Structure
- Consistent 7×6 layout (42 cells)
- Each cell represents a single day
- Grid never changes shape - events adapt to it
- Strong spatial memory for users

### ✅ Multi-Day Event Rendering
- Events span horizontally across cells
- Visual breaks at week boundaries
- Single logical entity maintained
- Rounded corners only at true start/end
- Smart layer stacking prevents overlaps

### ✅ Direct Manipulation
- **Drag to Move**: Drag event body, preserves duration
- **Resize Handles**: Drag left/right edges to adjust dates
- **Live Preview**: Dashed overlay shows changes in real-time
- **Visual Feedback**: Opacity, scaling, and highlighting
- **Optimistic Updates**: Instant UI response

### ✅ Overflow Handling
- Shows max 3 events per cell (configurable)
- "+ X more" indicator for additional events
- Click to open popover with all events
- Events remain fully interactive in popover

### ✅ Event Details
- Click event to open detail panel/modal
- Stay in calendar context
- Changes reflect immediately

### ✅ Smart Interactions
- Hover tooltips with title and date range
- Drag-over highlighting for drop zones
- Cursor changes (move, resize)
- Prevents invalid states
- Keyboard accessible

## Quick Start

```typescript
import { CalendarGrid } from './components/Calendar'
import { convertToCalendarEvents } from './components/Calendar/converters'

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

## API Reference

### CalendarGrid Props

```typescript
interface CalendarGridProps {
  events: CalendarEvent[]                              // Array of events to display
  onEventClick: (event: CalendarEvent) => void        // Called when event is clicked
  onEventMove: (eventId: string, newStartDate: Date) => void  // Called after drag-drop
  onEventResize: (eventId: string, newStartDate: Date, newEndDate: Date) => void
  onDateClick?: (date: Date) => void                  // Called when empty cell clicked
}
```

### CalendarEvent Type

```typescript
interface CalendarEvent {
  id: string              // Unique identifier
  title: string           // Display name
  startDate: Date         // Event start (inclusive)
  endDate: Date           // Event end (inclusive)
  color: string           // Hex color code
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

## Data Conversion

Use the converter functions to transform your data:

```typescript
import { 
  tasksToCalendarEvents,
  campaignsToCalendarEvents,
  projectsToCalendarEvents,
  convertToCalendarEvents 
} from './components/Calendar/converters'

// Convert individual types
const taskEvents = tasksToCalendarEvents(tasks)
const campaignEvents = campaignsToCalendarEvents(campaigns)
const projectEvents = projectsToCalendarEvents(projects)

// Or convert all at once
const allEvents = convertToCalendarEvents(tasks, campaigns, projects)
```

## Event Handlers

### Moving Events

```typescript
const handleEventMove = async (eventId: string, newStartDate: Date) => {
  const event = events.find(e => e.id === eventId)
  if (!event) return
  
  const duration = differenceInDays(event.endDate, event.startDate)
  const newEndDate = addDays(newStartDate, duration)
  
  try {
    // Optimistically update UI
    setEvents(prev => prev.map(e => 
      e.id === eventId 
        ? { ...e, startDate: newStartDate, endDate: newEndDate }
        : e
    ))
    
    // Save to backend
    await api.updateEvent(eventId, { startDate: newStartDate, endDate: newEndDate })
    toast.success('Event updated')
  } catch (error) {
    // Revert on error
    setEvents(originalEvents)
    toast.error('Failed to update event')
  }
}
```

### Resizing Events

```typescript
const handleEventResize = async (
  eventId: string, 
  newStartDate: Date, 
  newEndDate: Date
) => {
  try {
    // Optimistic update
    setEvents(prev => prev.map(e => 
      e.id === eventId 
        ? { ...e, startDate: newStartDate, endDate: newEndDate }
        : e
    ))
    
    // Save to backend
    await api.updateEvent(eventId, { startDate: newStartDate, endDate: newEndDate })
    toast.success('Event updated')
  } catch (error) {
    setEvents(originalEvents)
    toast.error('Failed to update event')
  }
}
```

### Clicking Events

```typescript
const handleEventClick = (event: CalendarEvent) => {
  if (event.type === 'task' && event.metadata.taskId) {
    setSelectedTaskId(event.metadata.taskId)
  }
  
  if (event.type === 'campaign' && event.metadata.campaignId) {
    navigateToCampaign(event.metadata.campaignId)
  }
  
  // etc.
}
```

## Customization

### Max Visible Events Per Cell

```typescript
// In DateCell.tsx, change the default:
maxVisibleEvents = 3  // Default

// Or pass as prop:
<DateCell maxVisibleEvents={5} />
```

### Event Colors

Events use their `color` property with 20% opacity background:

```typescript
const event: CalendarEvent = {
  color: '#3b82f6',  // Blue
  // ...
}
```

### Cell Height

Adjust in CalendarGrid.tsx:

```typescript
className="relative min-h-[120px]"  // Default 120px
```

## Architecture

### Component Hierarchy

```
CalendarGrid (main container)
├── DateCell (42 instances, one per day)
│   ├── Event placeholders (for spacing)
│   └── EventPopover (when "+ more" clicked)
└── EventBar (overlay layer, positioned absolutely)
    ├── Resize handle (left)
    └── Resize handle (right)
```

### Event Segmentation

Multi-day events are broken into segments:

1. **Calculate segments**: `calculateEventSegments(event, calendarStart, calendarEnd)`
2. **Organize by row**: `organizeSegmentsByRow(segments)`
3. **Render segments**: Each segment knows its position and styling

Example:
- Event: Wed Week 1 → Tue Week 2 (7 days)
- Segment 1: Wed-Sun, row 1, span 5, isStart=true
- Segment 2: Mon-Tue, row 2, span 2, isEnd=true

### State Management

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

## Performance

- **Segment calculation**: Only runs when events or month changes
- **Layer organization**: O(n*m) where m is layers (typically 2-3)
- **Render optimization**: Events outside bounds filtered early
- **Event delegation**: Minimal event listeners

## Accessibility

- Keyboard navigation (TODO)
- ARIA labels (TODO)
- Focus management (TODO)
- Screen reader support (TODO)
- High contrast mode compatible

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires ES2020+ features
- CSS Grid support required
- Drag and Drop API required

## Known Limitations

- Events are all-day only (no time-based events yet)
- No recurring events
- No event creation UI (only click handler)
- No week/day view (only month)
- No print styling

## Future Enhancements

- [ ] Keyboard navigation
- [ ] Event creation dialog
- [ ] Week view
- [ ] Day view
- [ ] Time-based events (not just all-day)
- [ ] Recurring events
- [ ] Event categories/filters
- [ ] Print formatting
- [ ] Export to iCal
- [ ] Multi-select events
- [ ] Bulk operations

## Troubleshooting

### Events not appearing
- Check `startDate` and `endDate` are valid Date objects
- Ensure events fall within the current month view
- Verify `id` is unique for each event

### Drag-and-drop not working
- Check `onEventMove` handler is provided
- Verify events have valid `startDate` and `endDate`
- Ensure browser supports Drag and Drop API

### Resize not working
- Check `onEventResize` handler is provided
- Ensure resize handles are visible (only at true start/end)
- Verify cell width calculation is working

### Popover positioning issues
- Check viewport dimensions
- Adjust `maxVisibleEvents` if needed
- Verify `data-calendar-cell` attribute exists

## Contributing

When adding features:
1. Maintain the "events as physical objects" metaphor
2. Keep interactions direct and immediate
3. Use optimistic updates with revert on failure
4. Add visual feedback for all interactions
5. Test with multi-day events spanning weeks
6. Ensure keyboard accessibility

## License

Same as parent project.
