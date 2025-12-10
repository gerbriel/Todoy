# Calendar View - Multi-Day Event Spanning

## Overview

The calendar view now displays events that span multiple days as continuous bars across the calendar grid, making it much easier to visualize timelines and date ranges for campaigns, projects, and stage dates.

## Visual Behavior

### Spanning Events

Events that have date ranges now visually span across multiple calendar cells with three distinct visual states:

1. **Start Position** - Left side of the span
   - Rounded left corners (`rounded-l`)
   - Border on left and right sides
   - Shows the full event title
   - Example: "📋 Campaign Name (Planning)"

2. **Middle Position** - Days in between start and end
   - No rounded corners (`rounded-none`)
   - No side borders, only top/bottom borders
   - Shows a horizontal line indicator
   - No text displayed (preserves space)

3. **End Position** - Right side of the span
   - Rounded right corners (`rounded-r`)
   - Border on left and right sides
   - No text displayed
   - Marks the end of the date range

4. **Single Day** - Start and end on the same day
   - Fully rounded corners (`rounded`)
   - All borders present
   - Shows full event title
   - Example: Stand-alone events

## Campaign Date Ranges

Campaigns now display as **three distinct phases** based on their date fields:

### 1. Planning Phase (Blue - #3b82f6)
- **Range**: `planningStartDate` → `launchDate`
- **Label**: "📋 [Campaign] (Planning)"
- **When**: Both planning start and launch dates are set
- **Fallback**: If only planning start is set, shows as single-day event

### 2. Active Phase (Green - #10b981)
- **Range**: `launchDate` → `endDate`
- **Label**: "🚀 [Campaign] (Active)"
- **When**: Both launch and end dates are set
- **Fallback**: If only launch date is set, shows as single-day event "🚀 [Campaign] (Launch)"

### 3. Follow-up Phase (Cyan - #06b6d4)
- **Range**: `endDate` → `followUpDate`
- **Label**: "📞 [Campaign] (Follow-up)"
- **When**: Both end and follow-up dates are set
- **Fallback**: If only follow-up date is set, shows as single-day event

### Default Display
- **Created Date**: If no other dates are set, shows "📢 [Campaign] (Created)" on creation date

## Stage Dates

Stage dates continue to work as before, spanning their defined ranges:

- **Range**: `startDate` → `endDate`
- **Display**: Stage name with custom color
- **Positions**: start, middle, end, or single
- **Context**: Shows campaign/project name in "all" view level

## Project Events

Projects display single-day events:

- **Created Date**: "📁 [Project] (Created)" in purple (#8b5cf6)
- **Stage Dates**: Span across their defined ranges (handled separately)

## Technical Implementation

### Position Detection Logic

```typescript
const isStart = isSameDay(date, startDate)
const isEnd = isSameDay(date, endDate)
const position = isStart && isEnd ? 'single' : 
                 isStart ? 'start' : 
                 isEnd ? 'end' : 
                 'middle'
```

### Campaign Events Function

The `getCampaignEventsForDate()` function now:
1. Checks if the current date falls within each phase range using `isWithinInterval()`
2. Determines the position (start/middle/end/single)
3. Returns events with position metadata
4. Handles fallback cases for incomplete date ranges

### Rendering with Position Awareness

```typescript
const roundedCorners = event.position === 'single' 
  ? 'rounded' 
  : event.position === 'start' 
  ? 'rounded-l' 
  : event.position === 'end' 
  ? 'rounded-r' 
  : 'rounded-none'

const showText = event.position === 'start' || event.position === 'single'
```

### Visual Styling

**Border Strategy**:
- Left border: Only on start/single positions
- Right border: Only on end/single positions  
- Top/Bottom borders: On all positions for continuity
- Middle positions: Show horizontal line indicator

**Color Application**:
```typescript
style={{
  backgroundColor: `${color}20`,  // 20% opacity fill
  borderLeft: position === 'start' || position === 'single' ? `3px solid ${color}` : 'none',
  borderRight: position === 'end' || position === 'single' ? `3px solid ${color}` : 'none',
  borderTop: `2px solid ${color}80`,  // 80% opacity
  borderBottom: `2px solid ${color}80`,
  color: color  // Text color
}}
```

## User Experience Improvements

### Before
- Events only appeared on their start date
- No visual indication of duration
- Hard to see overlapping time periods
- Required mentally calculating date spans

### After
- ✅ Events span visually across their entire duration
- ✅ Clear start and end points with visual markers
- ✅ Easy to identify overlapping phases
- ✅ Timeline is immediately comprehensible
- ✅ Consistent with professional calendar apps

## Calendar Mode Filter

The calendar mode selector controls what displays:

- **Tasks Only**: Shows only task due dates
- **Stage Dates Only**: Shows only stage date spans
- **All Events**: Shows tasks, stages, campaigns, and projects

Spanning behavior applies regardless of mode.

## Edge Cases Handled

1. **Same-day Events**: If start and end are the same day, displays as `position: 'single'` with full borders
2. **Missing End Dates**: Falls back to single-day display with descriptive label
3. **Overlapping Phases**: Multiple campaign phases can display on same dates (stacked vertically)
4. **Multi-Month Spans**: Events continue across month boundaries (since calendar shows partial weeks)
5. **No Dates Set**: Shows creation date as fallback

## Color Scheme

Events use semantic colors for quick identification:

| Event Type | Color | Hex | Visual |
|------------|-------|-----|--------|
| Planning Phase | Blue | #3b82f6 | 📋 |
| Active Phase | Green | #10b981 | 🚀 |
| Follow-up Phase | Cyan | #06b6d4 | 📞 |
| Created | Indigo | #6366f1 | 📢 |
| Project Created | Purple | #8b5cf6 | 📁 |
| Stage Dates | Custom | Variable | (varies) |

## Code Changes

### Files Modified
- **CalendarView.tsx**: Updated `getCampaignEventsForDate()` and rendering logic

### Key Changes
1. Added `position` property to campaign event objects
2. Implemented date range checking with `isWithinInterval()`
3. Updated rendering to handle position-based styling
4. Added middle-position indicator (horizontal line)
5. Made text conditional on position

## Example Scenarios

### Scenario 1: Full Campaign Timeline
```
Campaign: "Summer Sale 2025"
- Planning Start: June 1
- Launch: June 15
- End: July 31
- Follow-up: August 15

Calendar displays:
June 1-14: Blue bar "📋 Summer Sale 2025 (Planning)"
June 15-July 31: Green bar "🚀 Summer Sale 2025 (Active)"
Aug 1-15: Cyan bar "📞 Summer Sale 2025 (Follow-up)"
```

### Scenario 2: Incomplete Dates
```
Campaign: "Product Launch"
- Launch: December 10
- (No other dates set)

Calendar displays:
Dec 10: Single green badge "🚀 Product Launch (Launch)"
```

### Scenario 3: Stage Dates with Campaign
```
Campaign: "Q1 Marketing"
Stage: "Content Creation" (Jan 5 - Jan 20)

Calendar displays:
Jan 5-20: Colored bar spanning across days with stage name
```

## Testing Checklist

- [ ] Campaign with all dates set displays three distinct phase bars
- [ ] Bars span correctly across week boundaries
- [ ] Start dates show event title
- [ ] Middle dates show horizontal line
- [ ] End dates show no text
- [ ] Single-day events display fully rounded with title
- [ ] Fallback to single-day display works when end date missing
- [ ] Multiple campaigns can overlap on same dates
- [ ] Stage dates continue to span correctly
- [ ] Project created events display correctly
- [ ] Calendar mode filter shows/hides events appropriately
- [ ] Tooltip shows full event name on hover (all positions)

## Future Enhancements

### 1. Interactive Spanning Events
- Click anywhere on span to open event details
- Drag to adjust date ranges
- Resize handles on start/end positions

### 2. Visual Improvements
- Gradient fill for long spans
- Pulse animation on active phase
- Thickness variation by importance

### 3. Collision Detection
- Smart vertical stacking for overlaps
- Compressed view when many events
- Expand/collapse groups

### 4. Additional Event Types
- Task date ranges (if start/end dates added)
- Milestones that span preparation periods
- Recurring events

## Related Documentation

- [STAGE_FILTER_FIX.md](./STAGE_FILTER_FIX.md) - Stage system overview
- [ORGANIZATION_MANAGEMENT.md](./ORGANIZATION_MANAGEMENT.md) - Organization features
- [SIGNUP_FLOW.md](./SIGNUP_FLOW.md) - User onboarding

## Summary

The calendar view now provides a true timeline visualization where campaigns and stage dates span visually across their entire duration. This makes it much easier to:

- See project timelines at a glance
- Identify overlapping work periods  
- Plan around busy periods
- Understand campaign phases
- Coordinate team activities

The implementation uses position-aware rendering (start/middle/end/single) with appropriate styling for each state, creating a professional calendar experience similar to Google Calendar or Outlook.
