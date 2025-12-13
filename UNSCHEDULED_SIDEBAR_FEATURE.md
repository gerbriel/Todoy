# Unscheduled Items Sidebar Feature

## Overview
Added a collapsible right-hand sidebar to the calendar view that displays all projects, campaigns, stages, and tasks that don't have dates assigned. Users can easily drag-and-drop these items onto the calendar to assign dates quickly.

## Features

### Sidebar Display
- **Collapsible**: Toggle button to expand/collapse the sidebar
- **Badge Counter**: Shows total number of unscheduled items
- **Organized Sections**: Items grouped by type (Campaigns, Projects, Stages, Tasks)
- **Collapsible Sections**: Each type can be expanded/collapsed independently
- **Empty State**: Shows helpful message when all items are scheduled

### Drag-and-Drop
- **Draggable Items**: All unscheduled items can be dragged
- **Visual Feedback**: Hover effects and border colors for each item type
- **Drop on Calendar**: Drop items on any date cell to assign dates
- **Default Duration**: Assigns 1-day span by default (can be resized after)
- **Instant Update**: Updates database and UI immediately

### Item Types Supported
1. **Campaigns** - Shows campaigns without startDate or endDate
2. **Projects** - Shows projects without startDate or endDate  
3. **Stages** - Shows stages (from both campaigns and projects) without dates
4. **Tasks** - Shows tasks without startDate or dueDate

## Files Created

### `src/components/Calendar/UnscheduledItemsSidebar.tsx`
New component that renders the sidebar with all unscheduled items.

**Key Features:**
- Filters items to show only those without dates
- Groups stages from both campaigns and projects
- Implements drag start with metadata
- Collapsible sections with individual state
- Badge counters for each section
- Icon-based visual hierarchy

**Props:**
```typescript
interface UnscheduledItemsSidebarProps {
  campaigns: Campaign[]
  projects: Project[]
  tasks: Task[]
  isCollapsed: boolean
  onToggle: () => void
}
```

## Files Modified

### `src/components/NewCalendarView.tsx`
**Changes:**
- Added `UnscheduledItemsSidebar` import
- Added `sidebarCollapsed` state
- Added `handleSidebarItemDrop` function to process drops
- Wrapped CalendarGrid in flex container with sidebar
- Pass `onSidebarItemDrop` callback to CalendarGrid

**New Handler:**
```typescript
const handleSidebarItemDrop = async (item: any, date: Date) => {
  // Assigns startDate and endDate (1-day default)
  // Updates database via appropriate service
  // Updates local state
  // Shows success toast
}
```

### `src/components/Calendar/CalendarGrid.tsx`
**Changes:**
- Added `onSidebarItemDrop` prop to interface
- Enhanced `handleDrop` to detect sidebar items via `fromSidebar` flag
- Added `e.preventDefault()` to `handleDragOver` to allow drops
- Parses JSON data from drag event to identify source

**Logic:**
```typescript
const handleDrop = (date: Date, e: React.DragEvent) => {
  // Check if from sidebar
  const data = JSON.parse(e.dataTransfer.getData('application/json'))
  if (data.fromSidebar) {
    onSidebarItemDrop(data, date)
    return
  }
  // Otherwise handle normal event move
}
```

## User Experience

### Finding Unscheduled Items
1. Open calendar view
2. Look at right sidebar (auto-expanded if items exist)
3. See badge with total count
4. Expand/collapse sections to browse items

### Scheduling Items
1. Find item in sidebar
2. Drag item with mouse
3. Hover over desired date on calendar
4. Release to drop
5. Item immediately appears on calendar with 1-day span
6. Resize if needed using drag handles

### Visual Design
- **Campaigns**: Green left border (#10b981) with Target icon
- **Projects**: Purple left border (#8b5cf6) with Folder icon
- **Stages**: Custom color border with Flag icon (shows parent name)
- **Tasks**: Default border with CheckSquare icon
- **Hover**: Accent background with border highlight
- **Icons**: Phosphor icons for consistent design

## Benefits

### Speed
- No need to open edit dialogs
- No form filling required
- Instant scheduling with drag-and-drop
- Visual feedback throughout

### Discovery
- See all unscheduled items at a glance
- Badge counters show what needs attention
- Organized by type for easy scanning
- Empty state confirms everything is scheduled

### Flexibility
- Collapse sidebar when not needed
- Individual section collapse for focus
- Works alongside existing edit dialogs
- Can adjust dates after initial assignment

## Technical Details

### Data Transfer Format
```json
{
  "id": "item-id",
  "type": "campaign|project|task|stage",
  "title": "Item Title",
  "metadata": {
    "campaignId": "...",
    "projectId": "...",
    "stageId": "...",
    "taskId": "..."
  },
  "fromSidebar": true
}
```

### Default Behavior
- **Start Date**: Midnight of dropped date
- **End Date**: Midnight of next day (1-day span)
- **Stage Parent**: Automatically detected and updated
- **State Updates**: Both database and React state updated

### Error Handling
- Try-catch blocks on all API calls
- Toast notifications for success/failure
- Console logging for debugging
- Graceful fallback if data parsing fails

## Future Enhancements

### Possible Improvements
1. **Custom Duration**: Allow selecting duration before dropping
2. **Multi-Select**: Drag multiple items at once
3. **Keyboard Shortcuts**: Keyboard navigation and actions
4. **Search/Filter**: Search within unscheduled items
5. **Sort Options**: Sort by creation date, title, etc.
6. **Bulk Actions**: Schedule multiple items to same date
7. **Preview**: Show preview on hover over calendar
8. **Persistence**: Remember sidebar collapsed state
9. **Smart Scheduling**: Suggest dates based on dependencies
10. **Undo**: Undo scheduling action

### Potential Features
- Drag from calendar back to sidebar to "unschedule"
- Right-click context menu on sidebar items
- Double-click to schedule to today
- Keyboard shortcut to open sidebar
- Filter unscheduled by campaign/project

## Testing Checklist

- [ ] Sidebar shows correct unscheduled items
- [ ] Badge counter matches item count
- [ ] Sections expand/collapse correctly
- [ ] Collapse/expand sidebar button works
- [ ] Items are draggable
- [ ] Drop on calendar assigns dates
- [ ] Database updates persist after refresh
- [ ] Toast notifications appear
- [ ] Works for all item types (campaigns, projects, stages, tasks)
- [ ] Stage parents are correctly identified
- [ ] Empty state displays when no unscheduled items
- [ ] Sidebar state persists during navigation
- [ ] Responsive design works on different screen sizes

## Usage Examples

### Scheduling a Campaign
1. See "Product Launch" campaign in sidebar under Campaigns
2. Drag to January 15th on calendar
3. Campaign appears spanning Jan 15-16 (1 day default)
4. Resize to actual campaign duration (e.g., 3 months)

### Scheduling a Task
1. See "Write blog post" in sidebar under Tasks
2. Drag to next Monday
3. Task appears on Monday with due date set
4. Can adjust start date or due date as needed

### Scheduling Multiple Stages
1. See project stages without dates in sidebar
2. Drag each stage to appropriate timeline position
3. Stages appear with visual indicators
4. Project timeline updates automatically

## Notes

- Sidebar filters are applied to same data as calendar (respects activeCampaignId)
- Stages inherit color from their definition
- Default 1-day span can be immediately resized using existing resize handles
- Sidebar collapses to narrow icon bar when toggled
- Works seamlessly with existing vertical resize feature
