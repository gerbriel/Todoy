# Calendar Stage Name Display Enhancement

## Overview
Improved calendar view to show stage names more prominently across all spanning positions, and ensured campaigns/projects are visible when viewing stages.

## Issues Fixed

### 1. Stage Names Not Visible on All Positions
**Problem:** Stage names only appeared on start/single positions. Middle and end positions showed only horizontal lines.

**Solution:** 
- **Start/Single positions**: Show full stage name (as before)
- **Middle positions**: Show first letter initial (bold, centered)
- **End positions**: Show horizontal line (visual continuation)

### 2. Campaigns/Projects Hidden in Stage Mode
**Problem:** When `calendarMode` was set to "Stage Dates Only", campaigns and projects didn't display at all.

**Solution:** Changed visibility logic to show campaigns/projects in both "stages" and "both" modes since they're related event types.

**Before:**
```typescript
const showEvents = calendarMode === 'both'
```

**After:**
```typescript
const showEvents = calendarMode === 'stages' || calendarMode === 'both'
```

### 3. Emoji Clutter in Stage Names
**Problem:** Stage names could contain emojis which cluttered the calendar display.

**Solution:** Applied same emoji removal regex used for tasks and campaigns.

## Implementation Details

### Stage Display Logic

```typescript
{showStages && dayStages.map((stage, idx) => {
  const showText = stage.position === 'start' || stage.position === 'single'
  const showInitial = stage.position === 'middle'
  
  // Clean stage name
  const cleanStageName = stage.stageName
    .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
    .trim()
  
  return (
    <div title={cleanStageName}>
      {showText && cleanStageName}
      {showInitial && (
        <span className="font-bold">
          {cleanStageName.charAt(0).toUpperCase()}
        </span>
      )}
      {stage.position === 'end' && <div className="w-full h-0.5" />}
    </div>
  )
})}
```

### Visual Display Format

**Stage Spanning Across Multiple Days:**

| Position | Display | Example |
|----------|---------|---------|
| Start | Full name | `Brainstorming` |
| Middle | First letter | `B` |
| Middle | First letter | `B` |
| End | Line | `─────` |

### Color Coding
- Each stage retains its unique color
- 30% opacity background
- 80% opacity borders
- Solid color for text and lines

## User Experience Improvements

### Before
❌ Stage names invisible on middle positions (just blank bars)
❌ Campaigns/projects hidden in "Stage Dates Only" mode
❌ Unclear what stages are spanning across days
❌ Had to hover to see stage names

### After
✅ First letter visible on all middle positions
✅ Campaigns/projects visible in stage mode
✅ Clear visual continuity across spanning days
✅ Immediate recognition of which stage is active
✅ No emoji clutter

## Calendar Mode Behavior

### "Tasks Only"
- ✅ Shows tasks
- ❌ Hides stages
- ❌ Hides campaigns/projects

### "Stage Dates Only"
- ❌ Hides tasks
- ✅ Shows stages (with initials on middle)
- ✅ Shows campaigns/projects (NEW)

### "All Events"
- ✅ Shows tasks
- ✅ Shows stages (with initials on middle)
- ✅ Shows campaigns/projects

## Example Calendar Display

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Dec 14      │ Dec 15      │ Dec 16      │ Dec 17      │
├─────────────┼─────────────┼─────────────┼─────────────┤
│ Test        │ Test        │ Test        │ Test        │
│ campaign    │ campaign    │ campaign    │ campaign    │
│ (Created)   │ (Planning)  │ (Planning)  │ (Planning)  │
│             │             │             │             │
│ ┌──────────┐│ │         ││ │         ││ │         ┐ │
│ │Brainstorm││ │    B    ││ │    B    ││ │    B    │ │
│ └──────────┘│ └─────────┘│ └─────────┘│ └─────────┘ │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

## Tooltip Enhancement

All stage positions now show full clean stage name in tooltip:
```typescript
title={cleanStageName}  // "Brainstorming" without emojis
```

## CSS Classes Applied

### Start/Single Position
```css
.text-[10px] .px-1.5 .py-0.5 .font-medium .truncate .rounded
```

### Middle Position (with initial)
```css
.text-[10px] .px-1.5 .py-0.5 .font-medium .flex .items-center .justify-center
```
- Letter is **bold** and **centered**

### End Position
```css
.text-[10px] .px-1.5 .py-0.5 .font-medium .rounded-r
```

## Files Modified

### src/components/CalendarView.tsx
1. **Calendar Mode Logic** (line ~402):
   - Changed `showEvents` from `=== 'both'` to `=== 'stages' || === 'both'`

2. **Stage Rendering** (lines ~479-535):
   - Added `showInitial` flag for middle positions
   - Added emoji removal for stage names
   - Added first letter display logic
   - Improved conditional rendering for all positions

## Technical Notes

### Performance
- No performance impact (same number of elements rendered)
- Emoji regex is efficient (compiled once)
- Initial extraction is O(1) operation

### Accessibility
- Tooltip provides full name for screen readers
- Color contrast maintained per WCAG standards
- Font weight distinguishes initials from other text

### Browser Compatibility
- Works in all modern browsers
- Emoji regex uses Unicode escape sequences
- Flexbox centering widely supported

## Future Enhancements

Potential improvements:
1. **Configurable display mode** - Let users choose full name vs initial
2. **Stage progress indicator** - Show completion percentage
3. **Multi-line stage names** - For longer names, wrap text
4. **Stage icons** - Custom icons instead of initials
5. **Animation** - Smooth transition when toggling modes

## Testing Checklist

- [x] Stage names appear on start position
- [x] Initials appear on middle positions (bold, centered)
- [x] End positions show visual continuation
- [x] Campaigns visible in stage mode
- [x] Projects visible in stage mode
- [x] Emojis removed from stage names
- [x] Tooltips show full clean names
- [x] Colors properly applied
- [x] Click handlers work on campaigns/projects
- [x] Responsive on different screen sizes

## Related Documentation
- `CALENDAR_TASK_ENHANCEMENTS.md` - Task display improvements
- `CALENDAR_SPANNING_EVENTS.md` - Original spanning logic
- `CALENDAR_CLICK_NAVIGATION.md` - Click handlers for navigation
