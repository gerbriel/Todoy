# Calendar View - Comprehensive Enhancement

## Overview
Major update to calendar view adding clickable stages, enhanced filtering, and improved name display for all calendar items.

## Issues Fixed

### 1. **Stages Are Now Fully Clickable**
**Problem:** Stages were displayed as `<div>` elements with no click interaction.

**Solution:** Converted stages to `<button>` elements with click handlers that:
- Find the parent campaign or project containing the stage
- Call `onCampaignClick` or `onProjectClick` with the appropriate ID
- Navigate to the edit dialog for that entity

```typescript
<button
  onClick={() => {
    const parentCampaign = campaigns.find(c => 
      c.stageDates?.some(sd => sd.id === stage.id)
    )
    const parentProject = projects.find(p => 
      p.stageDates?.some(sd => sd.id === stage.id)
    )
    
    if (parentCampaign) {
      onCampaignClick?.(parentCampaign.id)
    } else if (parentProject) {
      onProjectClick?.(parentProject.id)
    }
  }}
>
  {cleanStageName}
</button>
```

### 2. **Stage Names Display Properly**
**Problem:** Stage names showing as "B" even on start positions.

**Solution:** 
- Explicit conditional rendering with clear flags
- Used ternary operator for mutually exclusive conditions
- Wrapped text in `<span>` blocks to ensure rendering

```typescript
const showFullText = stage.position === 'start' || stage.position === 'single'
const showInitial = stage.position === 'middle'
const showLine = stage.position === 'end'

{showFullText ? (
  <span className="block w-full">{cleanStageName}</span>
) : showInitial ? (
  <div className="h-full w-full flex items-center justify-center">
    <span className="font-bold text-xs">{cleanStageName.charAt(0).toUpperCase()}</span>
  </div>
) : showLine ? (
  <div className="h-full w-full flex items-center justify-center">
    <div className="w-full h-0.5" style={{ backgroundColor: stage.color }} />
  </div>
) : null}
```

### 3. **Enhanced Calendar Filter Dropdown**
**Problem:** Filter only had "Tasks Only", "Stage Dates Only", "All Events" - no way to filter by specific projects, campaigns, or stage names.

**Solution:** Added comprehensive filtering with grouped sections:

#### Filter Options:
1. **Basic Modes**
   - All Events
   - Tasks Only
   - Stage Dates Only

2. **Projects Section**
   - Lists all projects with 📁 icon
   - Click to show only that project's timeline stages

3. **Campaigns Section**
   - Lists all campaigns with 🎯 icon
   - Click to show only that campaign's stages and tasks

4. **Stage Names Section**
   - Lists unique stage names from all entities with 📅 icon
   - Click to show only that specific stage across all projects/campaigns

#### Filter Value Format:
- Basic modes: `"both"`, `"tasks"`, `"stages"`
- Project filters: `"project:{projectId}"`
- Campaign filters: `"campaign:{campaignId}"`
- Stage name filters: `"stage:{stageName}"`

### 4. **Smart Filtering Logic**
The calendar now intelligently filters content based on selection:

```typescript
if (isProjectFilter) {
  // Show only selected project's stages and project events
  const projectId = calendarMode.split(':')[1]
  filteredProjects = projectEvents.filter(e => e.projectId === projectId)
  filteredStages = dayStages.filter(s => {
    const project = projects.find(p => p.id === projectId)
    return project?.stageDates?.some(sd => sd.id === s.id)
  })
} else if (isCampaignFilter) {
  // Show selected campaign's stages, events, and tasks
  const campaignId = calendarMode.split(':')[1]
  filteredCampaigns = campaignEvents.filter(e => e.campaignId === campaignId)
  filteredStages = dayStages.filter(s => {
    const campaign = campaigns.find(c => c.id === campaignId)
    return campaign?.stageDates?.some(sd => sd.id === s.id)
  })
} else if (isStageFilter) {
  // Show only stages with specific name
  const stageName = calendarMode.split(':')[1]
  filteredStages = dayStages.filter(s => s.stageName === stageName)
}
```

## User Experience Improvements

### Before
❌ Stages not clickable - couldn't navigate to edit
❌ Stage names showing as initials even on start positions
❌ Limited filtering - only 3 basic modes
❌ No way to view specific project/campaign timeline
❌ No way to filter by stage name
❌ Campaigns/projects clickable but not obviously so

### After
✅ Click any stage to open parent campaign/project edit dialog
✅ Stage names display full text on start/single positions
✅ Initial letter on middle positions for continuity
✅ Line continuation on end positions
✅ Comprehensive dropdown with grouped sections
✅ Filter by specific projects, campaigns, or stage names
✅ Visual feedback (hover effects) on all clickable items
✅ Smart filtering shows only relevant content

## UI Changes

### Dropdown Structure
```
┌─────────────────────┐
│ All Events         ▼│
├─────────────────────┤
│ All Events          │
│ Tasks Only          │
│ Stage Dates Only    │
├─────────────────────┤
│ Projects            │ ← Section header
│ 📁 Test project     │
│ 📁 Q1 Marketing     │
├─────────────────────┤
│ Campaigns           │ ← Section header
│ 🎯 Test campaign    │
│ 🎯 Email blast      │
├─────────────────────┤
│ Stage Names         │ ← Section header
│ 📅 Brainstorming    │
│ 📅 Execution        │
│ 📅 Review           │
└─────────────────────┘
```

### Calendar Display Examples

**Filtering by Project "Test project":**
- Shows only "Test project (Created)" event
- Shows only stages belonging to Test project
- Hides other projects' stages
- Hides campaigns and tasks

**Filtering by Campaign "Test campaign":**
- Shows only "Test campaign" events (Planning/Active/Follow-up)
- Shows only stages belonging to Test campaign
- Shows tasks in Test campaign
- Hides other campaigns

**Filtering by Stage "Brainstorming":**
- Shows only "Brainstorming" stage across all entities
- Hides all other stages
- Hides campaigns, projects, tasks

## Technical Implementation

### State Management
```typescript
const [calendarMode, setCalendarMode] = useState<'tasks' | 'stages' | 'both' | string>('both')
```
Extended type to allow custom filter strings.

### Filter Option Collection
```typescript
const allStageNames = new Set<string>()
campaigns.forEach(c => c.stageDates?.forEach(sd => allStageNames.add(sd.stageName)))
projects.forEach(p => p.stageDates?.forEach(sd => allStageNames.add(sd.stageName)))
```
Collects unique stage names from all sources.

### Filtered Rendering
```typescript
let filteredStages = dayStages
let filteredCampaigns = campaignEvents
let filteredProjects = projectEvents

// Apply filters based on mode
if (isProjectFilter) { /* filter logic */ }
if (isCampaignFilter) { /* filter logic */ }
if (isStageFilter) { /* filter logic */ }

// Render using filtered arrays
{showStages && filteredStages.map((stage) => ...)}
{showEvents && filteredCampaigns.map((event) => ...)}
{showEvents && filteredProjects.map((event) => ...)}
```

### Debug Logging
Added console logging to track position detection:
```typescript
console.log(`Stage "${stage.stageName}" on ${format(date, 'MMM d')}: position=${position}`)
```

This helps identify any date comparison issues.

## Clickability Features

### All Clickable Items:
1. **Tasks** → Opens TaskDetailDialog
2. **Campaigns** → Opens campaign edit (navigates to campaign view)
3. **Projects** → Opens project edit (navigates to project view)
4. **Stages** → Opens parent campaign/project edit dialog

### Visual Feedback:
- `hover:opacity-80` on all buttons
- `transition-opacity` for smooth hover effect
- `cursor-pointer` for proper cursor indication
- Tooltip shows full names on hover

## Files Modified

### src/components/CalendarView.tsx

**State Changes:**
- Line ~46: Extended `calendarMode` type to accept string values
- Lines ~48-88: Added filter option collection logic

**Rendering Changes:**
- Lines ~430-478: New filtering logic for different modes
- Lines ~420+: Updated to use `filteredProjects`, `filteredCampaigns`, `filteredStages`
- Lines ~514-577: Stage rendering with click handlers and improved display logic
- Lines ~387-425: Enhanced dropdown with grouped sections

**Click Handlers:**
- Lines ~520-537: Stage click handler finding parent entity

## Performance Considerations

- Filter options calculated once per render
- Set used for efficient unique stage name collection  
- Filtered arrays created per calendar day (minimal overhead)
- Click handlers use optional chaining for safety

## Accessibility

- All interactive elements are buttons
- Tooltips provide full context on hover
- Keyboard navigation supported (native button behavior)
- Semantic HTML structure

## Testing Recommendations

### Manual Tests:
1. **Stage Clicking:**
   - Click stage on start position → Should open edit dialog
   - Click stage on middle position → Should open edit dialog
   - Click stage on end position → Should open edit dialog
   - Verify correct campaign/project dialog opens

2. **Name Display:**
   - Verify full name on start/single positions
   - Verify initial letter on middle positions
   - Verify line on end positions

3. **Filter Dropdown:**
   - Select "All Events" → See everything
   - Select specific project → See only that project
   - Select specific campaign → See only that campaign
   - Select specific stage name → See only that stage
   - Verify grouped sections display correctly

4. **Clicking from Calendar:**
   - Click campaign event → Navigate to campaign view
   - Click project event → Navigate to project view
   - Click task → Open task detail dialog
   - Click stage → Open parent edit dialog

### Edge Cases:
- Empty calendar (no data) → Dropdown shows only basic modes
- Stage in both campaign and project with same name → Filter shows both
- Multiple stages with same name → Filter groups them together
- Long project/campaign/stage names → Truncate properly

## Known Issues & Future Enhancements

### Potential Issues:
- Stage name filter shows ALL stages with that name across entities
  - May want to add sub-filtering by parent entity
- Console logs left in for debugging
  - Should be removed in production
- Dropdown can get long with many entities
  - Consider search/filter within dropdown

### Future Enhancements:
1. **Search in Filter:** Add search box to filter dropdown options
2. **Multi-Select:** Allow selecting multiple filters at once
3. **Recent Filters:** Show recently used filters at top
4. **Custom Views:** Save filter combinations as named views
5. **Keyboard Shortcuts:** Quick switch between common filters
6. **Filter Chips:** Show active filters as removable chips
7. **Stage Progress:** Show completion % on stages
8. **Drag & Drop:** Click-drag stages to reschedule

## Migration Notes

### Breaking Changes:
None - all changes are backward compatible.

### New Dependencies:
None - uses existing libraries.

### API Changes:
None - props interface unchanged (handlers already existed).

## Conclusion

This update transforms the calendar from a passive display into an interactive navigation tool. Users can now:
- Click any calendar item to view/edit details
- Filter calendar by granular criteria
- See full stage names clearly
- Navigate efficiently between entities

All while maintaining visual clarity and performance.
