# Stage Filter Fix - Implementation Summary

## Problem Identified

The "Filter by Stage" feature in the sidebar was fundamentally broken:

**Previous (Wrong) Behavior:**
- Filtered tasks by their `listId` (Kanban columns like "To Do", "In Progress", "Done")
- These are UI organization columns, NOT workflow stages

**New (Correct) Behavior:**
- Filters tasks by their `currentStage` field (actual workflow stages like "Planning", "Development", "Testing")
- Shows only stage names that exist in the current campaign's tasks
- Supports stage templates with colors

## Key Changes Made

### 1. Type System Updates (`src/lib/types.ts`)

Added new interfaces and fields:

```typescript
// Template for reusable stage names
interface StageTemplate {
  id: string
  name: string
  color: string
  order: number
  createdBy?: string
  orgId?: string
}

// Tasks now track their current stage
interface Task {
  // ... existing fields
  currentStage?: string  // NEW - tracks which stage the task is in
}

// Filter state now uses stage names instead of list IDs
interface FilterState {
  // ... existing fields
  stageNames: string[]  // NEW - filter by task stages, not kanban columns
}
```

### 2. Sidebar Component Updates (`src/components/Sidebar.tsx`)

**Key Changes:**
- Added `stageTemplates` and `tasks` props to Sidebar
- Replaced list-based filter with stage-based filter
- Dynamically discovers unique stage names from tasks in current campaign
- Shows color indicators from stage templates (if they exist)
- Filters using `stageNames` array in FilterState

**Code Snippet:**
```typescript
// Get unique stage names from tasks in the current campaign
const campaignTasks = tasks.filter(t => t.campaignId === activeCampaignId)
const uniqueStageNames = Array.from(new Set(
  campaignTasks.map(t => t.currentStage).filter((s): s is string => !!s)
))
```

### 3. Filter Helper Updates (`src/lib/helpers.ts`)

Added stage name filtering logic to `filterTasks` function:

```typescript
// Filter by task stage (currentStage field)
if (filters.stageNames.length > 0) {
  if (!task.currentStage || !filters.stageNames.includes(task.currentStage)) {
    return false
  }
}
```

### 4. App Component Updates (`src/App.tsx`)

- Added `stageTemplates` state with KV storage persistence
- Passed `stageTemplates` and `tasks` props to Sidebar
- Initialized `stageNames: []` in filters state

## Understanding: Lists vs Stages

### Lists (Kanban Columns)
- **Purpose:** UI organization for task management
- **Examples:** "To Do", "In Progress", "Done", "Blocked"
- **Field:** `task.listId`
- **Scope:** Per campaign
- **Use Case:** Visual board organization, drag-and-drop management

### Stages (Workflow Phases)
- **Purpose:** Track actual progress through a defined workflow
- **Examples:** "Planning", "Development", "Testing", "Review", "Deployed"
- **Field:** `task.currentStage`
- **Scope:** Reusable across tasks and campaigns
- **Use Case:** Filter tasks by workflow phase, track project progress

**Important:** A task in the "In Progress" list might be in the "Testing" stage. They represent different concepts!

## Current State

✅ **Completed:**
- Type system supports stage templates and current stage tracking
- Sidebar shows stage filter based on actual task stages
- Filter logic correctly uses `stageNames` array
- Stage templates can have colors for visual distinction
- Filter only shows stages that exist in current campaign

⏳ **Still Needed:**
- Stage template management UI (create/edit/delete templates)
- UI to set `currentStage` on tasks (dropdown in TaskDetailDialog)
- Populate initial stage templates (or allow users to create them)
- Stage template picker when setting task stage
- Org-scoped vs user-scoped stage templates

## Testing the Fix

To verify the fix is working:

1. **Create tasks with stages:**
   - Add `currentStage` field to some tasks manually (via dev tools or KV editor)
   - Example: `task.currentStage = "Planning"`

2. **View stage filter:**
   - Navigate to a campaign with staged tasks
   - Check sidebar for "Filter by Stage" section
   - Should show unique stage names from tasks, NOT list titles

3. **Test filtering:**
   - Click on a stage name in the sidebar
   - Only tasks with that `currentStage` should be visible
   - Click another stage to add to filter
   - Click "Clear filters" to reset

## Next Steps

See `STAGE_TEMPLATES.md` for the next phase of implementation:
- Stage template management UI
- Task stage assignment UI
- Stage template picker with type-ahead
- Org-wide template sharing
