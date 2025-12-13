# Task Campaign Visibility Feature

## Overview
Enhanced task displays across the application to show which campaign each task belongs to. This helps differentiate between tasks with the same name that belong to different campaigns.

## Problem
Tasks often have similar or identical names across different campaigns (e.g., "Design Assets", "Review Content", "Launch Prep"), making it difficult to identify which campaign a task belongs to at a glance.

## Solution
Added campaign name display in four key locations:

### 1. TaskCard Component
**File:** `src/components/TaskCard.tsx`

**Changes:**
- Added logic to find the campaign for each task using `task.campaignId`
- Display campaign name below the task title in a smaller, muted text style
- Campaign name is indented (pl-6) to align with the task title content

**Visual:**
```
✓ [Task Title]
  Campaign Name
  [Labels] [Due Date] [Subtasks]
```

### 2. Calendar Event Titles
**File:** `src/components/Calendar/converters.ts`

**Changes:**
- Updated `tasksToCalendarEvents()` to accept campaigns array
- Appended campaign name to task event titles: `"Task Name (Campaign Name)"`
- Added `campaignName` to event metadata for use in other components
- Updated `convertToCalendarEvents()` to pass campaigns to task converter

**Example:**
- Before: "Design Landing Page"
- After: "Design Landing Page (Q4 Campaign)"

### 3. Calendar Event Popover
**File:** `src/components/Calendar/EventPopover.tsx`

**Changes:**
- Added separate line showing "Campaign: [Name]" for task events
- Only displays for tasks (not campaigns/projects/stages)
- Uses muted styling to keep focus on the task title

**Visual in Popover:**
```
Task Name (Campaign Name)
Oct 15 - Oct 17
Campaign: Q4 Campaign
```

### 4. Unscheduled Items Sidebar
**File:** `src/components/Calendar/UnscheduledItemsSidebar.tsx`

**Changes:**
- Updated task items to show campaign name in parentheses
- Finds campaign for each unscheduled task
- Gracefully handles tasks without an associated campaign

**Example:**
```
Tasks (5)
  → Create Social Posts (Q4 Campaign)
  → Review Analytics (Product Launch)
  → Design Assets (Holiday Campaign)
```

## Type Updates
**File:** `src/components/Calendar/types.ts`

**Changes:**
- Added `campaignName?: string` to `CalendarEvent` metadata interface
- Allows calendar events to carry campaign name information

## Benefits

1. **Quick Identification**: Users can instantly see which campaign a task belongs to
2. **Context Switching**: Easier to understand task context when viewing "All Tasks" or calendar views
3. **Disambiguation**: Tasks with identical names are now distinguishable
4. **Consistent Display**: Campaign information appears in all major task views

## Affected Views

- ✅ Task Cards (in Kanban, list views)
- ✅ Calendar event bars
- ✅ Calendar event popover
- ✅ Unscheduled items sidebar
- ✅ Task detail dialog (already showed campaign in dropdown)

## Edge Cases Handled

1. **Task without campaign**: Gracefully omits campaign name (won't crash)
2. **Deleted campaign**: Campaign name won't show, but task still displays
3. **Long campaign names**: Truncated with ellipsis to prevent layout issues

## Testing Checklist

- [ ] Open a campaign with multiple tasks
- [ ] Verify campaign name appears below task title in cards
- [ ] Switch to calendar view
- [ ] Verify task events show "(Campaign Name)" in title
- [ ] Click on a task event
- [ ] Verify popover shows "Campaign: [Name]" line
- [ ] Open unscheduled items sidebar
- [ ] Create a task without dates
- [ ] Verify it appears with "(Campaign Name)" in sidebar
- [ ] Create two tasks with identical names in different campaigns
- [ ] Verify you can distinguish them by campaign name

## Future Enhancements

1. **Clickable campaign names**: Make campaign name a link to navigate to that campaign
2. **Campaign color coding**: Use campaign color as a visual indicator
3. **Filter by campaign**: In views showing multiple campaigns, add quick filter by campaign
4. **Project hierarchy**: Show "Project → Campaign" for fuller context
5. **Custom display format**: Allow users to configure how campaign name is shown

## Files Modified

1. `src/components/TaskCard.tsx` - Added campaign name display
2. `src/components/Calendar/converters.ts` - Added campaign to event titles
3. `src/components/Calendar/types.ts` - Added campaignName to metadata
4. `src/components/Calendar/EventPopover.tsx` - Added campaign line for tasks
5. `src/components/Calendar/UnscheduledItemsSidebar.tsx` - Added campaign to task titles

## Notes

- Campaign name is always shown in parentheses format: `(Campaign Name)`
- Uses muted text color to keep focus on task title
- No database changes required (uses existing `campaignId` field)
- Backward compatible (tasks without campaigns still work)
