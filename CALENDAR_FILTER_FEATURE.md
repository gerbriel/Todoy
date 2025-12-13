# Calendar Event Type Filter Feature

## Overview
Added a multi-select dropdown filter to the calendar header bar that allows filtering events by type: Tasks, Campaigns, Projects, and Stages.

## UI Location
The filter button appears in the **top-right corner** of the calendar header, next to the month navigation controls.

## Features

### 1. Filter Button
- **Icon**: Funnel icon with "Filter" label
- **Badge**: Shows count of active filters when any types are hidden
- **Position**: Right side of calendar header

### 2. Filter Options
- ✅ **Tasks** - Show/hide all task events
- ✅ **Campaigns** - Show/hide campaign phase events (Planning, Active, Follow-up)
- ✅ **Projects** - Show/hide project events
- ✅ **Stages** - Show/hide stage events (both campaign and project stages)

### 3. Filter Behavior
- **Multi-select**: Can toggle any combination of event types
- **Real-time**: Calendar updates immediately when filters change
- **Persistent**: Filters remain active while navigating months
- **Visual feedback**: Badge shows number of active filters

## Implementation Details

### State Management
```typescript
const [eventTypeFilters, setEventTypeFilters] = useState({
  tasks: true,
  campaigns: true,
  projects: true,
  stages: true
})
```

### Filtering Logic
```typescript
const filteredEvents = events.filter(event => {
  if (event.type === 'task') return eventTypeFilters.tasks
  if (event.type === 'campaign') return eventTypeFilters.campaigns
  if (event.type === 'project') return eventTypeFilters.projects
  if (event.type === 'stage') return eventTypeFilters.stages
  return true
})
```

### Event Type Mapping
| Event Type | Filter Category | Examples |
|------------|----------------|----------|
| `task` | Tasks | "Update Recording's Logo" |
| `campaign` | Campaigns | "Campaign (Planning)", "Campaign (Active)", "Campaign (Follow-up)" |
| `project` | Projects | "Project Name" |
| `stage` | Stages | "2026 World Ag Expo: Event In Progress", "Campaign: Stage Name" |

## Usage

### Filtering Tasks Only
1. Click the **Filter** button
2. Uncheck **Campaigns**, **Projects**, and **Stages**
3. Only tasks will be visible on the calendar

### Filtering Campaigns and Projects
1. Click the **Filter** button
2. Uncheck **Tasks** and **Stages**
3. Only campaign and project events will be visible

### Viewing Everything
1. Click the **Filter** button
2. Ensure all checkboxes are checked
3. All event types will be visible

## Visual Indicators

### Badge Display
- **No badge**: All event types visible (4 active)
- **Badge "3"**: One event type hidden (3 active)
- **Badge "2"**: Two event types hidden (2 active)
- **Badge "1"**: Three event types hidden (1 active)

The badge shows how many event types are currently **active** (visible).

## Code Changes

### Files Modified
- `src/components/Calendar/CalendarGrid.tsx`

### Imports Added
```typescript
import { Funnel } from '@phosphor-icons/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
```

### Components Used
- **DropdownMenu**: Shadcn/ui dropdown component
- **Button**: Outline variant for trigger button
- **Funnel**: Phosphor icon for filter
- **CheckboxItems**: Multi-select checkboxes for each event type

## Benefits

### 1. Reduced Visual Clutter
- Hide event types you're not currently interested in
- Focus on specific types (e.g., only tasks during planning)
- Cleaner calendar view when many events overlap

### 2. Better Focus
- Review campaign schedule without task noise
- See only project timelines
- Isolate stages for milestone planning

### 3. Improved Performance
- Fewer events to render = faster calendar
- Especially helpful with 100+ events
- Reduces visual processing load

### 4. Flexible Workflows
- **Project Manager**: Show projects + campaigns only
- **Task Coordinator**: Show tasks only
- **Executive View**: Show campaigns + projects only
- **Milestone Tracking**: Show stages only

## Use Cases

### Sprint Planning
1. Filter to show **Tasks** only
2. Focus on task scheduling without campaign context
3. Plan team capacity and task assignments

### Campaign Review
1. Filter to show **Campaigns** and **Stages** only
2. Review campaign phases and milestones
3. Ensure proper campaign scheduling

### Executive Dashboard
1. Filter to show **Projects** and **Campaigns** only
2. High-level view of strategic initiatives
3. Remove task-level details

### Milestone Tracking
1. Filter to show **Stages** only
2. Focus on key milestones across all campaigns/projects
3. Track progress checkpoints

## Technical Notes

### Filter Scope
- Filters apply to **all events** in the calendar
- Does not affect the event data (database remains unchanged)
- Client-side filtering only (no server calls)

### Performance
- Filtering is instant (no API calls)
- Event segments recalculated only for visible events
- Minimal performance impact

### Persistence
- Filters reset when page reloads
- Could be extended to save in localStorage
- Currently session-only state

## Future Enhancements

### Potential Improvements
1. **Save Filter Preferences**: Persist in localStorage
2. **More Filter Options**: 
   - Filter by assignee
   - Filter by date range
   - Filter by campaign/project
3. **Quick Filters**: Preset combinations (e.g., "My Tasks", "Active Campaigns")
4. **Filter Presets**: Save named filter combinations
5. **Filter URL Params**: Share filtered calendar views

### Extension Ideas
- **Color Filters**: Filter by event color
- **Status Filters**: Filter by completed/incomplete
- **Priority Filters**: High/medium/low priority
- **Team Filters**: Filter by assigned team members

## Testing Checklist

- [x] Filter button appears in header
- [x] All event types show by default
- [x] Unchecking "Tasks" hides all tasks
- [x] Unchecking "Campaigns" hides all campaign phases
- [x] Unchecking "Projects" hides all projects
- [x] Unchecking "Stages" hides all stage events
- [x] Badge shows correct count of active filters
- [x] Calendar updates immediately when filters change
- [x] Filters persist when navigating months
- [x] Drag-and-drop still works on filtered events
- [x] Resize still works on filtered events
- [x] Clicking filtered events still opens dialogs

## Related Features

Works seamlessly with:
- ✅ Drag-and-drop (duration preservation)
- ✅ Event resizing
- ✅ Event clicking (task/campaign/project dialogs)
- ✅ Month navigation
- ✅ Date clicking (create new events)

## Summary

The event type filter provides a powerful way to customize the calendar view, reducing clutter and improving focus. Users can now easily toggle between different views depending on their current needs, making the calendar more versatile and user-friendly.

**Key Benefits:**
- 🎯 Better focus on relevant events
- 🧹 Reduced visual clutter
- ⚡ Improved performance with many events
- 🔄 Flexible workflows for different roles
- 💨 Instant filtering with no loading time
