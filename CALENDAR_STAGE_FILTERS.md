# Calendar & Stage Filter Improvements

## Overview
Enhanced the calendar view to display all project, campaign, and task dates, and added a dedicated stage/list filter to the sidebar for better task organization.

## Features Implemented

### 1. Enhanced Calendar View
The calendar now displays comprehensive date information across all entity types:

#### Project Events
- **Creation Date**: Shows when projects were created (📁 icon)
- **Color**: Purple (`#8b5cf6`)
- **Visibility**: Shown in 'All' view level

#### Campaign Events
- **Planning Start Date**: When campaign planning begins (📋 icon, Blue `#3b82f6`)
- **Launch Date**: Campaign launch day (🚀 icon, Green `#10b981`)
- **End Date**: Campaign conclusion (🏁 icon, Orange `#f59e0b`)
- **Follow-up Date**: Post-campaign follow-up (📞 icon, Cyan `#06b6d4`)
- **Creation Date**: Fallback if no other dates set (📢 icon, Indigo `#6366f1`)

#### Task Events
- **Due Dates**: Task deadlines with label color indicators
- **Interactive**: Click to open task detail dialog

#### Stage Date Ranges
- **Campaign Stage Dates**: Custom stage date ranges from StageDateManager
- **Project Stage Dates**: Project milestone date ranges
- **Visual**: Colored bars spanning the duration

### 2. Calendar Mode Selector
Updated the calendar mode dropdown to better reflect its purpose:
- **All Events**: Shows projects, campaigns, tasks, and stage dates
- **Tasks Only**: Only displays task due dates
- **Stage Dates Only**: Only shows stage date ranges

### 3. Sidebar Stage Filters
Added a new filterable section in the sidebar when viewing a campaign:

**Features:**
- **Appears Automatically**: Only shows when viewing a campaign with stages/lists
- **Filter by Stage**: Click any stage name to filter tasks to that stage only
- **Multiple Selection**: Select multiple stages to see tasks from those stages
- **Visual Feedback**: Selected stages are highlighted with checkmark
- **Clear Filters**: Quick button to remove all stage filters

**Location**: Between navigation buttons and project list in sidebar

**Behavior**:
- Filters are persisted in the FilterState
- Works with other filters (labels, search, date range)
- Immediately updates the kanban view

## Technical Implementation

### Type Updates

```typescript
interface FilterState {
  campaignIds: string[]
  labelIds: string[]
  listIds: string[]  // NEW: Stage/list filter
  searchText: string
  // ...other fields
}
```

### Calendar View Changes

**File**: `src/components/CalendarView.tsx`

**New Functions**:
- `getProjectEventsForDate(date)` - Returns project events for a specific date
- `getCampaignEventsForDate(date)` - Returns campaign milestone events for a date
- Enhanced `getStageDatesForDate(date)` - Already existed but now properly integrated

**Event Display Order** (top to bottom in calendar cells):
1. Project events
2. Campaign events  
3. Stage date ranges
4. Task due dates

### Sidebar Updates

**File**: `src/components/Sidebar.tsx`

**New Props**:
- `lists: List[]` - Array of all lists/stages

**New UI Section**:
```tsx
{activeCampaignId && lists.filter(l => l.campaignId === activeCampaignId).length > 0 && (
  // Stage filter UI
)}
```

**Features**:
- Funnel icon to indicate filtering
- Toggle buttons for each stage
- Clear filters button when active
- Sorted by list order

### Filter Logic

**File**: `src/lib/helpers.ts`

Updated `filterTasks()` function:
```typescript
if (filters.listIds.length > 0 && !filters.listIds.includes(task.listId)) {
  return false
}
```

## User Workflows

### Viewing Dates on Calendar

1. **Navigate to Calendar View** (toggle in header)
2. **Set Calendar Mode**:
   - "All Events" - See everything
   - "Tasks Only" - Focus on deadlines
   - "Stage Dates Only" - View campaign timelines
3. **Look for Icons**:
   - 📁 = Project created
   - 📋 = Planning starts
   - 🚀 = Launch
   - 🏁 = End
   - 📞 = Follow-up
   - 📢 = Campaign created
4. **Click Tasks** to open details

### Filtering by Stage

1. **Open a Campaign** from sidebar
2. **Look for "Filter by Stage"** section (below navigation buttons)
3. **Click Stage Names** to filter:
   - Click once to filter to that stage
   - Click again to remove filter
   - Click multiple stages for multi-stage view
4. **Clear Filters** button removes all stage filters
5. **View Updated Board** - Kanban updates instantly

### Combining Filters

Stage filters work with all other filters:
- Filter by stage + label
- Filter by stage + search text
- Filter by stage + date range
- All filters combine (AND logic)

## Visual Design

### Calendar Events
- **Color-coded**: Each event type has a distinct color
- **Icons**: Emoji icons for quick recognition
- **Border Accent**: 3px left border in event color
- **Hover**: Title shows full text on hover
- **Compact**: 10px font size for dense information

### Sidebar Stage Filter
- **Conditional Display**: Only appears when relevant
- **Toggle State**: Selected stages highlighted with accent color
- **Checkmark**: Visual indicator for active filters
- **Grouped**: Clearly separated section with header
- **Responsive**: Maintains sidebar scroll behavior

## Benefits

### For Users
- ✅ **Complete Visibility**: All important dates in one view
- ✅ **Better Planning**: See campaign timelines and milestones
- ✅ **Quick Filtering**: Find tasks by stage without navigating away
- ✅ **Context Awareness**: Calendar mode selector clarifies what's shown
- ✅ **Multi-filter**: Combine stage filters with existing filters

### For Project Management
- 📊 See project lifecycles at a glance
- 🎯 Track campaign milestones visually
- 🔍 Quickly isolate tasks by workflow stage
- 📅 Plan resources around multiple date types
- 🚀 Monitor launches and follow-ups

## Future Enhancements
- Add project-level dates (not just creation)
- Click campaign events to navigate
- Drag-and-drop to reschedule events
- Filter calendar by project/campaign
- Export calendar view
- Stage progress indicators in sidebar
- Keyboard shortcuts for stage filtering
