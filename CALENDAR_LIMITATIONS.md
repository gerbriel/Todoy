# Calendar View Limitations & Design Notes

## Task Date Handling

### Current Behavior
**Tasks appear as single-day events** on the calendar because the Task data model only contains a `dueDate` field, not a date range.

### Why This Happens
```typescript
// Task interface (src/lib/types.ts)
export interface Task {
  dueDate?: string  // Only has due date, no start date
  // ... other fields
}

// Calendar converter (src/components/Calendar/converters.ts)
export function tasksToCalendarEvents(tasks: Task[]): CalendarEvent[] {
  return tasks.map(task => ({
    startDate: dueDate,  // ← Same as end date
    endDate: dueDate,    // ← Single day event
    // ...
  }))
}
```

### What Works
- ✅ **Moving tasks** - Drag tasks to different dates (updates `dueDate`)
- ✅ **Clicking tasks** - Opens TaskDetailDialog to edit details
- ✅ **Viewing tasks** - Shows on calendar on due date

### What Doesn't Work
- ❌ **Resizing tasks** - Cannot make tasks span multiple days (no `startDate` field)
- ❌ **Multi-day task display** - Tasks always show as single bars

### Multi-Day Events That Work
**Campaigns and Projects** have proper date ranges and work as expected:
- ✅ **Campaign stages** - Span across multiple days
- ✅ **Project phases** - Show duration correctly
- ✅ **Resizing** - Adjust start and end dates
- ✅ **Week-spanning** - Visual continuity across weeks

Example from your screenshot:
- "2026 World Ag Expo: Event In Progress" spans Feb 9-11 ✅
- Tasks show as single bars even if conceptually multi-day ❌

## Solutions

### Option 1: Add Start Date to Tasks (Recommended)
Update the Task model to support date ranges:

```typescript
// Update Task interface
export interface Task {
  startDate?: string    // NEW: When work begins
  dueDate?: string      // Existing: When work must be done
  // ...
}

// Update database schema
ALTER TABLE tasks ADD COLUMN start_date TIMESTAMP;

// Update converter
export function tasksToCalendarEvents(tasks: Task[]): CalendarEvent[] {
  return tasks.map(task => ({
    startDate: task.startDate ? new Date(task.startDate) : dueDate,
    endDate: dueDate,
    // ...
  }))
}
```

**Benefits:**
- Tasks can span multiple days
- Resize handles work correctly
- Better project planning visibility
- Matches real-world workflow

**Considerations:**
- Database migration required
- UI updates needed in TaskDetailDialog
- Existing tasks need `startDate = dueDate` default

### Option 2: Keep Tasks as Single-Day (Current)
Accept that tasks are point-in-time deliverables.

**Benefits:**
- No code changes needed
- Simpler mental model
- Matches some project management philosophies

**Drawbacks:**
- Can't visualize multi-day work
- Resize handles don't apply to tasks
- Less useful for sprint planning

### Option 3: Use Stage Dates for Multi-Day Work
Tasks already support `stageDates` array:

```typescript
export interface Task {
  stageDates?: StageDate[]  // Already exists!
  // ...
}
```

You could display stage dates as the multi-day spans and the task itself as a milestone.

## Current Recommendation

For your workflow, **Option 1** is recommended because:
1. Events like "World Ag Expo" naturally span days
2. Task resizing would be intuitive
3. Aligns with direct manipulation design principles
4. Campaigns/projects already work this way

The calendar system is **ready to support this** - only the Task data model needs updating.

## Temporary Workaround

Until start dates are added:
- Use **campaigns** for multi-day events
- Use **project stages** for phases
- Use **tasks** for single-day deliverables or milestones

The calendar will correctly display all three types with proper multi-day spanning.
