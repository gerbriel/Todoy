# Drag-and-Drop Feature Restoration

## Summary
Successfully restored the drag-and-drop functionality with duration preservation and campaign/project handlers after file corruption.

## What Was Restored

### 1. Duration Preservation on Drag-and-Drop
**File**: `src/components/NewCalendarView.tsx`

The `handleEventMove` function now:
- Accepts `newStartDate` and `newEndDate` parameters (not just single date)
- Preserves the duration of events when dragging
- Duration is calculated in CalendarGrid and passed to the handler

**Signature Change**:
```typescript
// Before: handleEventMove(eventId: string, newStartDate: Date)
// After:  handleEventMove(eventId: string, newStartDate: Date, newEndDate: Date)
```

### 2. Task Move Handler
```typescript
if (event.type === 'task' && event.metadata.taskId) {
  await tasksService.update(event.metadata.taskId, {
    startDate: newStartDate.toISOString(),
    dueDate: newEndDate.toISOString()
  })
  
  setTasks(prevTasks => 
    prevTasks.map(t => 
      t.id === event.metadata.taskId 
        ? { ...t, startDate: newStartDate.toISOString(), dueDate: newEndDate.toISOString() }
        : t
    )
  )
  
  toast.success('Task dates updated')
}
```

**Features**:
- Updates both `startDate` and `dueDate`
- Preserves task duration when dragging
- Updates database via `tasksService.update()`
- Updates local React state
- Shows success notification

### 3. Campaign Move Handler
```typescript
if (event.type === 'campaign' && event.metadata.campaignId && setCampaigns) {
  const campaign = campaigns.find(c => c.id === event.metadata.campaignId)
  if (!campaign) return
  
  const updates: Partial<Campaign> = {}
  
  // Determine which phase and update all dates to maintain campaign structure
  if (eventId.includes('-planning-')) {
    updates.planningStartDate = newStartDate.toISOString()
    updates.launchDate = newEndDate.toISOString()
    // Keep active period the same duration
    if (campaign.endDate && campaign.launchDate) {
      const activeDuration = new Date(campaign.endDate).getTime() - new Date(campaign.launchDate).getTime()
      updates.endDate = new Date(newEndDate.getTime() + activeDuration).toISOString()
    }
  } else if (eventId.includes('-active-')) {
    updates.launchDate = newStartDate.toISOString()
    updates.endDate = newEndDate.toISOString()
  }
  
  await campaignsService.update(event.metadata.campaignId, updates)
  setCampaigns(prevCampaigns =>
    prevCampaigns.map(c =>
      c.id === event.metadata.campaignId ? { ...c, ...updates } : c
    )
  )
  
  toast.success('Campaign dates updated')
}
```

**Features**:
- Handles planning phase moves (adjusts following phases)
- Handles active phase moves
- Preserves campaign structure
- Updates database and state
- Shows success notification

### 4. Project Move Handler
```typescript
if (event.type === 'project' && event.metadata.projectId && setProjects) {
  await projectsServices.update(event.metadata.projectId, {
    startDate: newStartDate.toISOString(),
    targetEndDate: newEndDate.toISOString()
  })
  
  setProjects(prevProjects =>
    prevProjects.map(p =>
      p.id === event.metadata.projectId
        ? { ...p, startDate: newStartDate.toISOString(), targetEndDate: newEndDate.toISOString() }
        : p
    )
  )
  
  toast.success('Project dates updated')
}
```

**Features**:
- Updates project start and target end dates
- Preserves project duration
- Updates database and state
- Shows success notification

### 5. Stage Move Handler
```typescript
if (event.type === 'stage' && event.metadata.stageId) {
  toast.info('Move the campaign to update stage dates')
  return
}
```

**Features**:
- Prevents direct stage moves (stages are managed by parent campaign/project)
- Shows informative message to user

### 6. Task Resize Handler
Updated to handle both `startDate` and `dueDate`:

```typescript
if (event.type === 'task' && event.metadata.taskId) {
  await tasksService.update(event.metadata.taskId, {
    startDate: newStartDate.toISOString(),
    dueDate: newEndDate.toISOString()
  })
  
  setTasks(prevTasks =>
    prevTasks.map(t => 
      t.id === event.metadata.taskId 
        ? { ...t, startDate: newStartDate.toISOString(), dueDate: newEndDate.toISOString() }
        : t
    )
  )
  
  toast.success('Task dates updated')
}
```

**Before**: Only updated `dueDate`
**After**: Updates both `startDate` and `dueDate`

### 7. Calendar Grid Key Prop
Added key prop to force re-renders when task dates change:

```typescript
<CalendarGrid
  key={tasks.filter(t => t.dueDate).map(t => `${t.id}:${new Date(t.dueDate!).getTime()}`).join('|')}
  events={calendarEvents}
  onEventClick={handleEventClick}
  onEventMove={handleEventMove}
  onEventResize={handleEventResize}
  onDateClick={handleDateClick}
/>
```

**Purpose**: Ensures calendar re-renders immediately when task dates change

### 8. Debug Console Log
Added helpful console log:

```typescript
console.log('[Calendar Render] Converting', filteredTasks.length, 'tasks to events')
```

**Purpose**: Helps debug event conversion and rendering issues

## Architecture

### Duration Preservation Flow
1. **User drags event** → EventBar detects drag start (5px threshold)
2. **CalendarGrid tracks mouse** → Updates dragOverDate via refs
3. **User drops event** → CalendarGrid calculates:
   ```typescript
   const durationMs = originalEndDate.getTime() - originalStartDate.getTime()
   const newStartDate = startOfDay(date)
   const newEndDate = new Date(newStartDate.getTime() + durationMs)
   ```
4. **CalendarGrid calls** → `onEventMove(eventId, newStartDate, newEndDate)`
5. **NewCalendarView handles** → Updates database + state based on event type

### Event Type Handlers
- **Tasks**: Update `startDate` and `dueDate`
- **Campaigns**: Update phase dates, preserve campaign structure
- **Projects**: Update `startDate` and `targetEndDate`
- **Stages**: Show info message (managed by parent)

## Integration Points

### CalendarGrid (src/components/Calendar/CalendarGrid.tsx)
- Already has ref-based drag state management
- Already calculates duration and passes both dates
- Already has drag preview visualization
- **No changes needed** - signature already correct

### DateCell (src/components/Calendar/DateCell.tsx)
- Already has `isDragging` prop
- Already prevents clicks during drag
- **No changes needed**

### EventBar (src/components/Calendar/EventBar.tsx)
- Already detects drag with 5px threshold
- Already distinguishes between drag and click
- **No changes needed**

## Testing Status

✅ **File restored** - No syntax errors
✅ **Development server running** - No compilation errors
✅ **Type checking passes** - No TypeScript errors

### Ready to Test:
- [ ] Drag tasks to new dates (verify duration preserved)
- [ ] Drag campaigns to new dates (verify phases move together)
- [ ] Drag projects to new dates (verify duration preserved)
- [ ] Resize tasks (verify both start and end dates update)
- [ ] Verify database persistence across page refresh

## Files Modified

1. `src/components/NewCalendarView.tsx` - Main handler updates
   - Updated `handleEventMove` signature and implementation
   - Updated `handleEventResize` for tasks
   - Added console log for debugging
   - Added key prop to CalendarGrid

## Notes

- All handlers include early returns after completing their work
- All handlers show appropriate toast notifications
- Error handling catches and logs failures
- Feature is fully backward compatible
- No changes needed to CalendarGrid, EventBar, or DateCell (already correct)

## Next Steps

1. Test drag-and-drop for all event types
2. Run database migration: `ADD_TASK_START_DATE.sql`
3. Test with real multi-day tasks
4. Consider removing console.log after confirming everything works
5. Commit changes to git
