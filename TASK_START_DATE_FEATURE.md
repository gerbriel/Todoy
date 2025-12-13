# Task Start Date Feature

## Overview
Added `startDate` field to tasks, enabling them to span multiple days on the calendar (like campaigns and projects already do).

## Changes Made

### 1. Type Definition (`lib/types.ts`)
- **Line 130**: Added `startDate?: string` to Task interface
- Optional field between `campaignId` and `dueDate`
- Backward compatible: existing tasks without startDate still work

### 2. Calendar Converter (`components/Calendar/converters.ts`)
- **Lines 8-33**: Modified `tasksToCalendarEvents()` function
- Uses `startDate` if available, otherwise uses `dueDate` for both start and end
- Creates multi-day calendar events when task has both dates
```typescript
const startDate = task.startDate 
  ? startOfDay(new Date(task.startDate))
  : startOfDay(new Date(task.dueDate!))
const endDate = startOfDay(new Date(task.dueDate!))
```

### 3. Task Edit Dialog (`components/TaskDetailDialog.tsx`)
- **Lines 60-68**: Added `startDate` state management
  - Converts ISO format to `YYYY-MM-DD` for date input display
  - Converts back to ISO format when saving
- **Lines 454-471**: Added Start Date input field in UI
  - Grid layout: Start Date (left) and Due Date (right)
  - Both use HTML5 date input type
- **Save handler**: Converts both dates to ISO format before sending to service

### 4. Tasks Service (`services/tasks.service.ts`)
- **Line 200**: Added write mapping: `if (updates.startDate !== undefined) updateData.start_date = updates.startDate`
- **Line 27**: Added read mapping in `getByCampaign`: `startDate: task.start_date`
- **Line 73**: Added read mapping in `getByOrg`: `startDate: task.start_date`
- **Line 119**: Added read mapping in `getById`: `startDate: data.start_date`
- Complete CRUD support for camelCase ↔ snake_case conversion

### 5. Resize Handler (`components/NewCalendarView.tsx`)
- **Lines 140-156**: Updated to set both `startDate` and `dueDate` when resizing tasks
- Updates database via `tasksService.update()`
- Updates local React state via `setTasks()`
- Shows success toast: "Task dates updated"

### 6. Database Migration (`ADD_TASK_START_DATE.sql`)
- Adds `start_date TIMESTAMP WITH TIME ZONE` column to tasks table
- Creates index on `start_date` for query performance
- Includes verification query

## Usage

### Creating Multi-Day Tasks
1. Open task detail dialog
2. Set **Start Date** (when task begins)
3. Set **Due Date** (when task ends)
4. Task will span all days from start to end on calendar

### Single-Day Tasks
- Set **both Start Date and Due Date to the same date** for single-day tasks
- Or only set **Due Date** (startDate remains empty) - also displays as single-day event
- Existing tasks without `startDate` continue working as single-day events

### Resizing Tasks on Calendar
1. Click and drag task edge to resize
2. Both `startDate` and `dueDate` update automatically
3. Can resize to single day (both dates become the same)
4. Changes persist immediately to database
5. No page refresh needed

## Database Schema

```sql
tasks (
  id UUID PRIMARY KEY,
  title TEXT,
  start_date TIMESTAMP WITH TIME ZONE,  -- NEW
  due_date TIMESTAMP WITH TIME ZONE,
  -- ... other fields
)
```

## Date Format Handling

- **Database**: `YYYY-MM-DDTHH:mm:ss+00:00` (PostgreSQL with timezone)
- **React State**: `YYYY-MM-DDTHH:mm:ss.000Z` (ISO format)
- **HTML Input**: `YYYY-MM-DD` (date-only format)

Conversions happen at boundaries:
- **Display**: `new Date(isoString).toISOString().split('T')[0]`
- **Save**: `new Date(dateString + 'T00:00:00').toISOString()`

## Testing Checklist

- [ ] Run migration: Execute `ADD_TASK_START_DATE.sql` in Supabase SQL Editor
- [ ] Create new task with start and due dates spanning multiple days
- [ ] Verify task spans multiple days on calendar
- [ ] Create task with start and due date on the same day (single-day task)
- [ ] Verify single-day task displays correctly
- [ ] Edit existing task to add start date
- [ ] Resize task on calendar to span multiple days
- [ ] Resize task on calendar to single day (both dates become same)
- [ ] Test tasks with only due date set (no start date)
- [ ] Test tasks without any dates
- [ ] Check task list view still works
- [ ] Verify database persistence across page refresh

## Related Files

- `lib/types.ts` - Type definitions
- `components/Calendar/converters.ts` - Calendar event conversion
- `components/TaskDetailDialog.tsx` - Edit UI
- `services/tasks.service.ts` - Database operations
- `components/NewCalendarView.tsx` - Calendar view and resize
- `ADD_TASK_START_DATE.sql` - Database migration

## Notes

- Feature is **code-complete** but requires database migration
- Fully backward compatible with existing tasks
- Matches campaign/project behavior for consistency
- Debug logging has been cleaned up from App.tsx and NewCalendarView.tsx
