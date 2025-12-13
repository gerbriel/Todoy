# Campaign and Project Drag-and-Drop Fix

## Issue
Campaigns and projects were not responding to drag-and-drop operations or the duration wasn't being preserved correctly.

## Root Cause Analysis

### Campaign Events Structure
Campaigns are split into three separate calendar events:
- **Planning Phase**: `campaign-planning-${campaignId}` 
  - From `planningStartDate` to `launchDate`
- **Active Phase**: `campaign-active-${campaignId}`
  - From `launchDate` to `endDate`
- **Follow-up Phase**: `campaign-followup-${campaignId}`
  - From `endDate` to `followUpDate`

### Project Events Structure
Projects are rendered as single events:
- **Project**: `project-${projectId}`
  - From `startDate` to `targetEndDate` or `actualEndDate`

## Fix Applied

### 1. Enhanced Campaign Move Handler
**File**: `src/components/NewCalendarView.tsx` - `handleEventMove()`

Added support for **follow-up phase** moves:

```typescript
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
  // Keep follow-up period the same duration if it exists
  if (campaign.followUpDate && campaign.endDate) {
    const followUpDuration = new Date(campaign.followUpDate).getTime() - new Date(campaign.endDate).getTime()
    updates.followUpDate = new Date(newEndDate.getTime() + followUpDuration).toISOString()
  }
} else if (eventId.includes('-followup-')) {
  updates.endDate = newStartDate.toISOString()
  updates.followUpDate = newEndDate.toISOString()
}
```

**Key Features**:
- ✅ **Planning Phase**: When moved, adjusts launch date and preserves active phase duration
- ✅ **Active Phase**: When moved, adjusts launch and end dates, preserves follow-up duration
- ✅ **Follow-up Phase**: When moved, adjusts end and follow-up dates
- ✅ **Duration Preservation**: Each phase's duration is maintained during drag

### 2. Added Debug Logging
Added comprehensive logging to diagnose issues:

```typescript
console.log('🎯 Event Move:', { 
  eventId, 
  type: event.type, 
  newStartDate: newStartDate.toISOString(), 
  newEndDate: newEndDate.toISOString(),
  hasCampaignId: !!event.metadata.campaignId,
  hasProjectId: !!event.metadata.projectId,
  hasSetCampaigns: !!setCampaigns,
  hasSetProjects: !!setProjects
})
```

**Helps diagnose**:
- Event type being dragged
- Presence of required metadata (campaignId, projectId)
- Availability of state setters (setCampaigns, setProjects)
- New date values being applied

## How It Works

### Campaign Drag Flow
1. **User drags** planning phase to new dates
2. **CalendarGrid** calculates duration: `endDate - startDate`
3. **CalendarGrid** calls: `onEventMove(eventId, newStartDate, newEndDate)`
4. **Handler detects** `-planning-` in eventId
5. **Handler updates**:
   - `planningStartDate` = new start
   - `launchDate` = new end
   - `endDate` = new end + active duration (preserved)
6. **Database** updated via `campaignsService.update()`
7. **State** updated via `setCampaigns()`
8. **Toast** shows "Campaign dates updated"
9. **Calendar** re-renders with new positions

### Project Drag Flow
1. **User drags** project to new dates
2. **CalendarGrid** calculates duration: `targetEndDate - startDate`
3. **CalendarGrid** calls: `onEventMove(eventId, newStartDate, newEndDate)`
4. **Handler detects** `event.type === 'project'`
5. **Handler updates**:
   - `startDate` = new start
   - `targetEndDate` = new end (duration preserved)
6. **Database** updated via `projectsService.update()`
7. **State** updated via `setProjects()`
8. **Toast** shows "Project dates updated"
9. **Calendar** re-renders with new positions

## Testing Checklist

### Campaign Testing
- [ ] Drag **planning phase** → Verify launch date and active phase move together
- [ ] Drag **active phase** → Verify both launch and end dates update
- [ ] Drag **follow-up phase** → Verify end and follow-up dates update
- [ ] Verify **database persistence** after page refresh
- [ ] Check **console logs** show correct event type and metadata

### Project Testing
- [ ] Drag **project** → Verify both start and target end dates update
- [ ] Verify **duration preserved** (project spans same number of days)
- [ ] Verify **database persistence** after page refresh
- [ ] Check **console logs** show correct event type and metadata

### Edge Cases
- [ ] Campaign with only planning phase (no active/follow-up)
- [ ] Campaign with planning + active (no follow-up)
- [ ] Project with actualEndDate (completed project)
- [ ] Project with only startDate (no target end date)

## Required Props Verification

Both instances of `NewCalendarView` in `App.tsx` must pass:
- ✅ `setCampaigns={setCampaigns}` - Required for campaign moves
- ✅ `setProjects={setProjects}` - Required for project moves

**Verified in**:
- Line 554: Project-level calendar view ✅
- Line 595: Campaign-level calendar view ✅

## Event Type Summary

| Event Type | Event ID Pattern | Handler Check | Requires |
|------------|-----------------|---------------|----------|
| Task | `task-${taskId}` | `event.type === 'task'` | `setTasks` |
| Campaign Planning | `campaign-planning-${campaignId}` | `eventId.includes('-planning-')` | `setCampaigns` |
| Campaign Active | `campaign-active-${campaignId}` | `eventId.includes('-active-')` | `setCampaigns` |
| Campaign Follow-up | `campaign-followup-${campaignId}` | `eventId.includes('-followup-')` | `setCampaigns` |
| Project | `project-${projectId}` | `event.type === 'project'` | `setProjects` |
| Stage | `stage-${stageId}` | `event.type === 'stage'` | Info message only |

## Success Indicators

✅ **Console logs** show event type and has correct metadata
✅ **Toast notification** appears: "Campaign dates updated" or "Project dates updated"
✅ **Visual update** happens immediately on calendar
✅ **Database persists** changes (check after page refresh)
✅ **Duration preserved** (event spans same number of days after move)

## Troubleshooting

If campaigns/projects still don't move:

1. **Check console logs** - Look for the 🎯 Event Move log
2. **Verify metadata** - Ensure `hasCampaignId` or `hasProjectId` is true
3. **Check setters** - Ensure `hasSetCampaigns` or `hasSetProjects` is true
4. **Check event type** - Verify type matches expected value
5. **Check eventId pattern** - Ensure ID includes expected prefix
6. **Database permissions** - Verify user can update campaigns/projects
7. **Network tab** - Check if API calls are being made

## Related Files

- `src/components/NewCalendarView.tsx` - Event move handlers
- `src/components/Calendar/CalendarGrid.tsx` - Drag-and-drop logic
- `src/components/Calendar/converters.ts` - Event ID generation
- `src/services/campaigns.service.ts` - Campaign updates
- `src/services/projects.service.ts` - Project updates
- `src/App.tsx` - Props passing to NewCalendarView

## Next Steps

1. Test drag-and-drop for campaigns (all three phases)
2. Test drag-and-drop for projects
3. Verify duration preservation in console logs
4. Check database updates persist across page refresh
5. Remove debug console.log if everything works correctly
6. Document any additional edge cases discovered
