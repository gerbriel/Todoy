# Auto-Schedule and Reassign Feature

## Overview
Enhanced the calendar sidebar with comprehensive auto-scheduling and reassignment capabilities for managing project hierarchies efficiently.

## Features Implemented

### 1. Individual Task Auto-Schedule
- **Location**: Unscheduled Tasks section
- **Icon**: Lightning bolt icon next to each task
- **Functionality**: Schedules individual task to its campaign's start date with 1-day duration
- **Validation**: 
  - Task must be assigned to a campaign
  - Campaign must have start and end dates

### 2. Scheduled Items Section
- **New Sidebar Section**: Shows hierarchical view of all scheduled items
- **Hierarchy Display**: Projects → Campaigns → Tasks
- **Visual Structure**:
  - Projects (purple border, folder icon)
  - Campaigns nested under projects (green border, target icon)
  - Tasks nested under campaigns (checkbox icon)
- **Collapsible**: Projects section can be expanded/collapsed

### 3. Bulk Reassign All
- **Location**: "Reassign All" button at top of scheduled section
- **Functionality**: Reassigns all campaigns and tasks to optimal dates
  - Campaigns → placed at their project's start date
  - Tasks → placed at their campaign's start date
- **Feedback**: Shows count of items reassigned and skipped

### 4. Individual Reassign Buttons
- **Campaign Reassign**: Lightning icon on each campaign
  - Repositions campaign to project start date
  - Validates project has dates assigned
- **Task Reassign**: Lightning icon on each task
  - Repositions task to campaign start date
  - Validates campaign has dates assigned
- **Project Note**: Projects show disabled icon with tooltip explaining they cannot be auto-reassigned

### 5. Validation Rules

#### Task Auto-Schedule/Reassign
- ✅ Task must be assigned to a campaign
- ✅ Campaign must have start_date and end_date
- ❌ Error: "Task must be assigned to a campaign to auto-schedule"
- ❌ Error: "Campaign must have start and end dates assigned first"

#### Campaign Auto-Schedule/Reassign
- ✅ Campaign must be assigned to a project
- ✅ Project must have start_date and end_date
- ❌ Error: "Campaign must be assigned to a project to reassign"
- ❌ Error: "Project must have start and end dates assigned first"

#### Projects
- ❌ Projects cannot be auto-scheduled (no parent entity)
- ℹ️ Disabled button with tooltip: "Projects cannot be auto-reassigned"

### 6. Scheduling Logic

**Campaign Auto-Schedule:**
```typescript
startDate = project.startDate
endDate = startDate + 1 day
```

**Task Auto-Schedule:**
```typescript
startDate = campaign.startDate  
dueDate = startDate + 1 day
```

**Duration**: All auto-scheduled items get 1-day duration by default
**User Control**: Users can manually drag items to adjust dates after auto-scheduling

## UI Components

### Updated Sidebar Header
- **Title**: Changed from "Unscheduled Items" to "Calendar Sidebar"
- **Badges**: 
  - Gray badge: "X unscheduled" items
  - Outline badge: "X scheduled" items

### Icons Used
- 🗲 Lightning (filled): Auto-schedule/reassign action buttons
- 📁 Folder: Projects
- 🎯 Target: Campaigns
- ☑ CheckSquare: Tasks
- 🚩 Flag: Stages

## Database Updates
No schema changes required. Uses existing:
- `campaigns.start_date`, `campaigns.end_date`
- `projects.start_date`, `projects.end_date`
- `tasks.start_date`, `tasks.due_date`

## User Workflow

### Auto-Scheduling Workflow
1. User drags project from sidebar → assigns dates
2. User drags campaign from sidebar → assigns dates OR uses auto-schedule icon
3. Campaign auto-schedules to project start
4. User drags tasks from sidebar → assigns dates OR uses auto-schedule icon
5. Tasks auto-schedule to campaign start
6. User manually adjusts dates as needed via drag-and-drop

### Bulk Reassign Workflow
1. User has multiple campaigns and tasks already scheduled
2. Clicks "Reassign All" button
3. System repositions:
   - All campaigns to their respective project start dates
   - All tasks to their respective campaign start dates
4. User sees success message with count
5. Items appear at new dates on calendar

## Error Handling
- Clear error messages for validation failures
- Success toasts with specific counts
- Warning toasts for skipped items
- Graceful handling of missing parent entities

## Technical Implementation

### Files Modified
- `src/components/Calendar/UnscheduledItemsSidebar.tsx`
  - Added individual auto-schedule functions
  - Added reassign functions (individual and bulk)
  - Added scheduled items section UI
  - Added hierarchy display logic
- `src/components/NewCalendarView.tsx`
  - Passed `setCampaigns` and `setProjects` props to sidebar

### New Functions
- `handleAutoScheduleTask(task)` - Schedule single task
- `handleReassignCampaign(campaign)` - Reassign single campaign
- `handleReassignTask(task)` - Reassign single task
- `handleReassignAll()` - Bulk reassign all items

### Services Used
- `tasksService.update()` - Update task dates
- `campaignsService.update()` - Update campaign dates
- `projectsService.update()` - Update project dates (if needed)

## Benefits

1. **Efficiency**: Quickly schedule multiple items with one click
2. **Hierarchy Awareness**: Respects project → campaign → task relationships
3. **Flexibility**: Individual and bulk operations available
4. **Safety**: Validation prevents orphaned items
5. **Visibility**: Shows both scheduled and unscheduled items
6. **User Control**: 1-day default duration with manual adjustment capability

## Future Enhancements
- Smart duration calculation based on item complexity
- Auto-space items within date range instead of stacking
- Undo/redo for bulk operations
- Custom duration settings per item type
- Batch operations with selection checkboxes
