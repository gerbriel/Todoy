# Date Fields and Calendar View Summary

## Date Fields Across Entities

### 📋 Projects
- **`createdAt`**: string - When the project was created
- **`stageDates`**: StageDate[] - Array of stage dates with start/end times
  - Each StageDate has: `startDate`, `endDate`, `stageName`, `color`, `completed`
- **No direct date fields** for project start/end (uses stageDates)

### 🎯 Campaigns  
- **`createdAt`**: string - When the campaign was created
- **`planningStartDate`**: string (optional) - When planning begins
- **`launchDate`**: string (optional) - When campaign launches
- **`endDate`**: string (optional) - When campaign ends
- **`followUpDate`**: string (optional) - Follow-up date
- **`stageDates`**: StageDate[] (optional) - Array of custom stage dates

### ✅ Tasks
- **`createdAt`**: string - When the task was created
- **`updatedAt`**: string (optional) - Last update time
- **`dueDate`**: string (optional) - When task is due
- **`stageDates`**: StageDate[] (optional) - Array of stage progression dates

## Calendar View Date Display Logic

### Tasks on Calendar
1. **With stageDates**: 
   - Shows all stages with start and end dates
   - Spans across multiple days if stage duration > 1 day
   - Each stage has its own color bar
   
2. **With dueDate only**: 
   - Shows as a single point on the due date
   - No spanning across days

3. **Without dates**: 
   - Not shown on calendar

### Campaigns on Calendar
1. **Planning Phase** (`planningStartDate` to `launchDate`):
   - Shows as a blue/purple bar spanning the planning period
   - Marked with "Planning" label

2. **Active Phase** (`launchDate` to `endDate`):
   - Shows as a different colored bar (green/teal)
   - Marked with "Active" or campaign stage

3. **Single Date Events**:
   - If only `planningStartDate`: Shows as dot
   - If only `launchDate`: Shows as launch marker
   - If only `endDate`: Shows as end marker

### Projects on Calendar
- Projects currently use `stageDates` for calendar display
- No direct project-level calendar events (shows through campaigns/tasks)

## Current Issues Identified

### ❌ Stage Templates Not Persisting
**Problem**: `stageTemplates` state is initialized but never loaded from database
**Impact**: 
- Stage templates created by users don't persist on refresh
- Stage colors and names are lost
- Filtering by stage doesn't work reliably

**Solution Needed**:
1. Create `stageTemplates.service.ts` 
2. Load stage templates from Supabase on app init
3. Subscribe to realtime updates
4. Save new templates to database

### ⚠️ Date Relationships
**Current State**:
- Task dates are independent (not linked to campaign)
- Campaign dates are independent (not linked to project)
- No validation that task dueDate falls within campaign dates
- No automatic date inheritance

**Potential Enhancement**:
- Validate task dates against campaign timeline
- Show warnings if dates are outside expected range
- Optionally inherit campaign dates to tasks

## Recommended Date Field Structure

### For Complete Calendar Integration:

**Projects** (Portfolio/Program level):
- `startDate`: When project work begins
- `targetEndDate`: Expected completion
- `stageDates`: Milestone dates

**Campaigns** (Initiative level):
- `planningStartDate`: Planning phase start ✅ (exists)
- `planningEndDate`: When planning should complete (NEW)
- `launchDate`: Go-live date ✅ (exists)
- `endDate`: Campaign completion ✅ (exists)
- `followUpDate`: Post-campaign activities ✅ (exists)

**Tasks** (Work item level):
- `startDate`: When work can begin (NEW)
- `dueDate`: Deadline ✅ (exists)
- `stageDates`: For multi-stage tasks ✅ (exists)

## Next Steps

1. **Fix Stage Templates Persistence**
   - [ ] Create stage templates service
   - [ ] Load templates on app initialization
   - [ ] Subscribe to realtime updates
   - [ ] Test create/update/delete operations

2. **Enhance Date Validation**
   - [ ] Add date range validation
   - [ ] Show warnings for date conflicts
   - [ ] Add visual indicators for overdue items

3. **Calendar View Improvements**
   - [ ] Add project-level milestones
   - [ ] Show campaign planning phases more clearly
   - [ ] Add date range filters
   - [ ] Enable drag-and-drop date editing

4. **Documentation**
   - [ ] Document date field relationships
   - [ ] Create user guide for calendar view
   - [ ] Add tooltips explaining date fields
