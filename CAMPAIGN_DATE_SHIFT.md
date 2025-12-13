# Campaign Date Shift Feature

## Overview
When a campaign is moved to a new date, all child tasks automatically shift relative to the campaign's new start date, preserving their original spacing and order within the campaign timeline.

## How It Works

### Core Logic
1. **Calculate Offset**: Each task's position is calculated as days offset from the campaign's original start date
2. **Apply Shift**: When campaign moves, tasks maintain the same offset from the new start date
3. **Preserve Spacing**: Tasks keep their relative positions to each other
4. **Optional Clamping**: Tasks can be constrained to stay within campaign bounds

### Example
```
Original Campaign: Jan 1 - Jan 10
- Task A: Jan 3 (offset: +2 days)
- Task B: Jan 5 (offset: +4 days)
- Task C: Jan 8 (offset: +7 days)

Campaign moved to: Jan 15 - Jan 24
- Task A: Jan 17 (offset: +2 days) ✅
- Task B: Jan 19 (offset: +4 days) ✅
- Task C: Jan 22 (offset: +7 days) ✅
```

## API Reference

### `shiftCampaignTasks()`
Main function to shift all tasks when a campaign moves.

```typescript
function shiftCampaignTasks(
  tasks: Task[],
  campaignId: string,
  oldCampaignStartDate: string,
  newCampaignStartDate: string,
  newCampaignEndDate?: string,
  clampToCampaign?: boolean
): Task[]
```

**Parameters:**
- `tasks` - Array of all tasks
- `campaignId` - ID of the campaign being moved
- `oldCampaignStartDate` - Campaign's original start date (ISO string)
- `newCampaignStartDate` - Campaign's new start date (ISO string)
- `newCampaignEndDate` - Campaign's new end date (optional, for clamping)
- `clampToCampaign` - If true, constrains tasks to campaign bounds (default: false)

**Returns:** Updated tasks array with shifted dates

### `shiftTaskDates()`
Shift a single task's dates.

```typescript
function shiftTaskDates(
  task: Task,
  oldCampaignStartDate: string,
  newCampaignStartDate: string,
  newCampaignEndDate?: string,
  clampToCampaign?: boolean
): Task | null
```

**Returns:** Updated task, or null if task has no dates

### `calculateShiftStats()`
Get statistics about how tasks will shift (useful for previews/confirmations).

```typescript
function calculateShiftStats(
  tasks: Task[],
  campaignId: string,
  oldCampaignStartDate: string,
  newCampaignStartDate: string
): {
  tasksAffected: number
  daysDifference: number
  direction: 'forward' | 'backward' | 'none'
  taskIds: string[]
}
```

### `validateCampaignTaskDates()`
Check if all tasks in a campaign have dates assigned.

```typescript
function validateCampaignTaskDates(
  tasks: Task[],
  campaignId: string
): {
  valid: boolean
  tasksWithoutDates: Task[]
  totalTasks: number
}
```

## Usage Examples

### 1. In Calendar Drag-and-Drop Handler

```typescript
import { shiftCampaignTasks, calculateShiftStats } from '@/lib/campaignDateShift'
import { toast } from 'sonner'

const handleCampaignDrop = async (
  campaign: Campaign,
  newStartDate: Date
) => {
  const oldStartDate = campaign.startDate
  const newStartISO = newStartDate.toISOString()
  
  // Calculate how many tasks will be affected
  const stats = calculateShiftStats(
    tasks,
    campaign.id,
    oldStartDate,
    newStartISO
  )
  
  // Update campaign in database
  const updatedCampaign = await campaignsService.update(campaign.id, {
    startDate: newStartISO,
    endDate: calculateNewEndDate(newStartDate, campaign).toISOString()
  })
  
  // Shift all child tasks
  const updatedTasks = shiftCampaignTasks(
    tasks,
    campaign.id,
    oldStartDate,
    newStartISO,
    updatedCampaign.endDate,
    true // clamp to campaign bounds
  )
  
  // Update tasks in database
  const tasksToUpdate = updatedTasks.filter(t => 
    t.campaignId === campaign.id && t.dueDate
  )
  
  for (const task of tasksToUpdate) {
    await tasksService.update(task.id, {
      dueDate: task.dueDate,
      startDate: task.startDate
    })
  }
  
  // Update local state
  setCampaigns(prev => prev.map(c => 
    c.id === campaign.id ? updatedCampaign : c
  ))
  setTasks(updatedTasks)
  
  toast.success(
    `Campaign moved. ${stats.tasksAffected} task(s) shifted ${Math.abs(stats.daysDifference)} day(s) ${stats.direction}`
  )
}
```

### 2. In Campaign Edit Dialog

```typescript
import { shiftCampaignTasks } from '@/lib/campaignDateShift'

const handleSaveCampaign = async () => {
  const oldStartDate = campaign.startDate
  const newStartDate = formData.startDate
  
  // Update campaign
  await campaignsService.update(campaign.id, {
    startDate: newStartDate,
    endDate: formData.endDate
  })
  
  // Shift tasks if start date changed
  if (oldStartDate !== newStartDate) {
    const updatedTasks = shiftCampaignTasks(
      tasks,
      campaign.id,
      oldStartDate,
      newStartDate,
      formData.endDate,
      true
    )
    
    // Persist task updates
    const tasksToUpdate = updatedTasks.filter(t => t.campaignId === campaign.id)
    await Promise.all(
      tasksToUpdate.map(task =>
        tasksService.update(task.id, {
          dueDate: task.dueDate,
          startDate: task.startDate
        })
      )
    )
    
    setTasks(updatedTasks)
    toast.success('Campaign and tasks updated')
  }
}
```

### 3. React State Update Pattern

```typescript
// When campaign start date changes
const handleCampaignDateChange = (
  campaignId: string,
  oldStartDate: string,
  newStartDate: string,
  newEndDate: string
) => {
  // Update campaign state
  setCampaigns(prevCampaigns =>
    prevCampaigns.map(c =>
      c.id === campaignId
        ? { ...c, startDate: newStartDate, endDate: newEndDate }
        : c
    )
  )
  
  // Update tasks state with shifted dates
  setTasks(prevTasks =>
    shiftCampaignTasks(
      prevTasks,
      campaignId,
      oldStartDate,
      newStartDate,
      newEndDate,
      true // clamp to campaign
    )
  )
}
```

### 4. With User Confirmation

```typescript
const handleCampaignMove = async (campaign: Campaign, newDate: Date) => {
  const stats = calculateShiftStats(
    tasks,
    campaign.id,
    campaign.startDate,
    newDate.toISOString()
  )
  
  if (stats.tasksAffected > 0) {
    const confirmed = window.confirm(
      `Moving this campaign will shift ${stats.tasksAffected} task(s) by ${Math.abs(stats.daysDifference)} day(s) ${stats.direction}. Continue?`
    )
    
    if (!confirmed) {
      return
    }
  }
  
  // Proceed with move...
}
```

### 5. Validation Before Shift

```typescript
const validateAndShift = (campaign: Campaign, newStartDate: string) => {
  // Validate all tasks have dates
  const validation = validateCampaignTaskDates(tasks, campaign.id)
  
  if (!validation.valid) {
    toast.warning(
      `${validation.tasksWithoutDates.length} task(s) don't have dates and won't be shifted`
    )
  }
  
  // Proceed with shift
  const updatedTasks = shiftCampaignTasks(
    tasks,
    campaign.id,
    campaign.startDate,
    newStartDate
  )
  
  return updatedTasks
}
```

## Integration Points

### NewCalendarView.tsx
Update the `handleEventChange` function to shift tasks when a campaign is dragged:

```typescript
// In handleEventChange
if (event.type === 'campaign') {
  const campaign = campaigns.find(c => c.id === event.id)
  if (campaign && campaign.startDate) {
    // Shift tasks
    const updatedTasks = shiftCampaignTasks(
      tasks,
      campaign.id,
      campaign.startDate,
      newStart.toISOString(),
      newEnd.toISOString(),
      true
    )
    // Update database and state...
  }
}
```

### CampaignEditDialog.tsx
Update the save handler to shift tasks when start date is manually changed:

```typescript
// In handleSave
if (campaign.startDate && campaign.startDate !== startDate) {
  const updatedTasks = shiftCampaignTasks(
    tasks,
    campaign.id,
    campaign.startDate,
    startDate,
    endDate,
    true
  )
  // Persist and update state...
}
```

## Configuration Options

### Clamping Behavior
- `clampToCampaign: false` - Tasks can extend beyond campaign dates (preserves exact offsets)
- `clampToCampaign: true` - Tasks are constrained within campaign bounds

### Edge Cases Handled
- ✅ Tasks without dates (skipped)
- ✅ Tasks with only dueDate (startDate optional)
- ✅ Tasks with both startDate and dueDate
- ✅ Negative offsets (tasks before campaign start)
- ✅ Tasks outside campaign bounds (clamped if enabled)
- ✅ No change in campaign date (returns original tasks)

## Testing

```typescript
describe('shiftCampaignTasks', () => {
  it('should shift tasks forward when campaign moves forward', () => {
    const tasks = [
      { id: '1', campaignId: 'c1', dueDate: '2024-01-03T00:00:00Z' }
    ]
    const result = shiftCampaignTasks(
      tasks,
      'c1',
      '2024-01-01T00:00:00Z', // old start
      '2024-01-10T00:00:00Z'  // new start (+9 days)
    )
    expect(result[0].dueDate).toBe('2024-01-12T00:00:00Z') // +9 days
  })
  
  it('should preserve task spacing within campaign', () => {
    const tasks = [
      { id: '1', campaignId: 'c1', dueDate: '2024-01-03T00:00:00Z' },
      { id: '2', campaignId: 'c1', dueDate: '2024-01-05T00:00:00Z' },
      { id: '3', campaignId: 'c1', dueDate: '2024-01-08T00:00:00Z' }
    ]
    const result = shiftCampaignTasks(
      tasks,
      'c1',
      '2024-01-01T00:00:00Z',
      '2024-02-01T00:00:00Z'
    )
    // Should maintain 2-day and 3-day gaps between tasks
    const day1 = new Date(result[0].dueDate!)
    const day2 = new Date(result[1].dueDate!)
    const day3 = new Date(result[2].dueDate!)
    
    expect(differenceInDays(day2, day1)).toBe(2)
    expect(differenceInDays(day3, day2)).toBe(3)
  })
})
```

## Performance Considerations

- **Batch Updates**: Update database in batches for many tasks
- **Optimistic UI**: Update local state immediately, sync database in background
- **Debouncing**: For live drag operations, debounce database updates
- **Selective Updates**: Only update tasks that actually belong to the campaign

## Future Enhancements

- [ ] Support for task dependencies (respect task order constraints)
- [ ] Undo/redo functionality for campaign moves
- [ ] Bulk campaign moves (shift multiple campaigns at once)
- [ ] Smart conflict resolution (when tasks would overlap)
- [ ] Animation/transition for task shifts in UI
