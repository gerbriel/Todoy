# Calendar Sidebar Features - Usage Guide

## ✅ Already Implemented Features

Both features you requested are **already fully implemented and working**:

### 1. 🎯 Drag & Drop to Calendar

**How to use:**
- Open the Calendar View (Master View, All Projects View, All Campaigns View, or All Tasks View in calendar mode)
- Open the sidebar on the right (desktop) or tap the items button (mobile)
- Switch between tabs:
  - **Unscheduled** - Items without dates
  - **Scheduled** - Items with dates
  - **Unassign** - Remove dates from items
- Drag any item from the sidebar and drop it onto a date in the calendar
- The item will be scheduled to that date

**What can be dragged:**
- ✅ Campaigns (unscheduled)
- ✅ Projects (unscheduled)
- ✅ Tasks (unscheduled)
- ✅ Stages (unscheduled campaign/project stages)

**Visual feedback:**
- Items have a border on the left side (colored by type)
- Cursor changes to "move" when hovering over draggable items
- Calendar cells highlight when you drag over them

### 2. 🚀 Click to Jump to Scheduled Date

**How to use:**
- Open the Calendar View
- Open the sidebar
- Switch to the **"Scheduled"** tab
- Click on any scheduled item (project, campaign, or task)
- The calendar will automatically scroll/jump to that item's date

**What's clickable:**
- ✅ Scheduled Projects - jumps to project start date
- ✅ Scheduled Campaigns - jumps to campaign start date  
- ✅ Scheduled Tasks - jumps to task start date

**Visual feedback:**
- Items have a colored left border indicating their type
- Hover shows a background highlight
- Cursor changes to "pointer" when hovering
- Date cells in the calendar are highlighted when navigating

## 🎨 Sidebar Organization

The sidebar has **3 tabs**:

### Tab 1: Unscheduled (default)
Shows items without dates assigned:
- 📁 **Projects** (without start/end dates)
  - Can expand to show campaigns within
- 🎯 **Campaigns** (without start/end dates)
  - Can expand to show tasks within
- ✅ **Tasks** (without start/due dates)
- 📊 **Stages** (campaign/project stages without dates)

**Actions available:**
- Drag to calendar to schedule
- "Auto" button to auto-schedule all items
- ⚡ Lightning icon on individual items to auto-schedule

### Tab 2: Scheduled
Shows items that already have dates:
- 📁 **Projects** (with start/end dates)
  - Expandable to show campaigns
    - Expandable to show tasks
- 🎯 **Campaigns** (with start/end dates)
  - Expandable to show tasks
- ✅ **Tasks** (with start/due dates)

**Actions available:**
- **Click any item** to jump to its date on the calendar
- 🔄 Reassign button to re-sync dates
- "Reassign All" button at the top

### Tab 3: Unassign
Remove dates from scheduled items:
- Same hierarchy as Scheduled tab
- 📅 ❌ Button to remove dates from individual items
- Option to cascade (remove dates from child items too)

## 💡 Tips

1. **Drag from Unscheduled, Click from Scheduled**
   - Unscheduled items → Drag to calendar
   - Scheduled items → Click to jump to date

2. **Auto-schedule Options**
   - "Auto" buttons schedule items to their campaign/project start dates
   - "Reassign All" button syncs all items to optimal dates

3. **Hierarchical View**
   - Expand projects to see their campaigns
   - Expand campaigns to see their tasks
   - Click the caret (▶/▼) to expand/collapse

4. **Mobile Support**
   - On mobile, tap the "📋 Items" button at bottom to open sidebar
   - Sidebar opens as full-page panel
   - All features work the same way

5. **Visual Cues**
   - Purple border = Project
   - Green border = Campaign
   - Blue border = Task
   - Orange/other = Stage

## 🔧 Technical Implementation

Both features are implemented in:

**Files:**
- `src/components/Calendar/UnscheduledItemsSidebar.tsx`
  - `DraggableItem` component handles drag-and-drop
  - Click handlers on scheduled items call `onNavigateToDate()`
- `src/components/NewCalendarView.tsx`
  - `handleSidebarItemDrop()` handles drop events
  - `handleGoToDate()` callback jumps to dates
- `src/components/Calendar/CalendarGrid.tsx`
  - Handles drop events on calendar dates
  - Implements `goToDate()` function to scroll to dates

**Features:**
- HTML5 Drag & Drop API
- JSON data transfer with item metadata
- React state management for navigation
- Smooth scroll behavior to date cells
