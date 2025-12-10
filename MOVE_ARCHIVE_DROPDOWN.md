# Move & Archive Dropdown Actions - Feature Documentation

## Overview

Added comprehensive dropdown menus to all edit dialogs that allow users to quickly move items between containers (projects, campaigns, lists) and archive them without needing to navigate away.

## Features Implemented

### 1. Campaign Edit Dialog
**Location:** `src/components/CampaignEditDialog.tsx`

**Actions Menu:**
- **Move to Project** (submenu)
  - No Project (Standalone) - Makes campaign standalone
  - List of all projects - Move campaign to selected project
  - Shows "(current)" indicator for the campaign's current project
  - Disabled for current project
- **Archive Campaign** - Archives the campaign immediately

**Behavior:**
- Moving to a different project updates the campaign's `projectId`
- Shows toast notification with target project name
- Current project is disabled in the list
- Changes are saved immediately

### 2. Task Detail Dialog
**Location:** `src/components/TaskDetailDialog.tsx`

**Actions Menu:**
- **Move to Campaign** (submenu)
  - Lists all available campaigns
  - Automatically moves task to first list in target campaign
  - Shows "(current)" indicator
  - Disabled for current campaign
- **Move to List** (submenu)
  - Shows lists only from current campaign
  - Quick list switching without changing campaigns
  - Shows "(current)" indicator
  - Disabled for current list
- **Archive Task** - Marks task as completed
- **Delete Task** - Permanently deletes the task

**Behavior:**
- Moving to campaign updates both `campaignId` and `listId`
- Moving to list only updates `listId`
- Task detail dialog closes after moving to a different campaign
- Task detail dialog stays open when moving to a different list (same campaign)
- Shows toast notification with target name

### 3. Project Edit Dialog
**Location:** `src/components/ProjectEditDialog.tsx`

**Actions Menu:**
- **Archive Project** - Archives the project immediately

**Note:** Projects are top-level containers and don't move to other containers, so the menu is simpler.

## UI/UX Design

### Button Style
- **Trigger Button:**
  - Icon: Three dots (DotsThree icon)
  - Text: "Actions"
  - Variant: Outline
  - Position: Left side of dialog footer

### Menu Structure
```
Actions ▼
├─ Quick Actions (label)
├─ ────────────── (separator)
├─ Move to [Container] ▶
│  ├─ Option 1
│  ├─ Option 2 (current)
│  └─ Option 3
├─ ────────────── (separator)
├─ Archive [Item] (orange text)
└─ Delete [Item] (red text - task only)
```

### Color Coding
- **Move actions:** Default text color with arrow icon
- **Archive action:** Orange text (`text-orange-600`)
- **Delete action:** Red/destructive text (`text-destructive`)

### Icons Used
- `DotsThree` - Menu trigger
- `ArrowsLeftRight` - Move actions
- `Folder` - Project items in submenu
- `Target` - Campaign items in submenu
- `Archive` - Archive action
- `Trash` - Delete action

## User Flows

### Moving a Campaign to Another Project

1. Open campaign edit dialog
2. Click "Actions" dropdown button
3. Hover over "Move to Project"
4. Click target project from submenu
5. Campaign is moved immediately
6. Toast notification confirms move
7. Dialog stays open for further edits

### Moving a Task to Another Campaign

1. Open task detail dialog
2. Click "Actions" dropdown button
3. Hover over "Move to Campaign"
4. Click target campaign from submenu
5. Task moves to first list of target campaign
6. Toast notification confirms move
7. Dialog closes (different context now)

### Moving a Task to Another List (Same Campaign)

1. Open task detail dialog
2. Click "Actions" dropdown button
3. Hover over "Move to List"
4. Click target list from submenu
5. Task moves to selected list
6. Toast notification confirms move
7. Dialog stays open for further edits

### Archiving from Edit Dialog

1. Open any edit dialog (project/campaign/task)
2. Click "Actions" dropdown button
3. Click "Archive [Item]"
4. Item is archived immediately
5. Toast notification confirms archive
6. Dialog closes

## Implementation Details

### State Management

All move operations update the state immediately:

**Campaign Move:**
```typescript
setCampaigns(currentCampaigns =>
  currentCampaigns.map(c =>
    c.id === campaign.id ? { ...c, projectId: newProjectId } : c
  )
)
```

**Task Move to Campaign:**
```typescript
setTasks(currentTasks =>
  currentTasks.map(t =>
    t.id === task.id 
      ? { ...t, campaignId: newCampaignId, listId: targetListId } 
      : t
  )
)
```

**Task Move to List:**
```typescript
setTasks(currentTasks =>
  currentTasks.map(t =>
    t.id === task.id ? { ...t, listId: newListId } : t
  )
)
```

### Disabled State Logic

Current containers are disabled to prevent redundant moves:

```typescript
disabled={project.id === projectId}  // For campaign's current project
disabled={campaign.id === selectedCampaignId}  // For task's current campaign
disabled={list.id === selectedListId}  // For task's current list
```

### Dialog Behavior

- **Close on move:** When context changes significantly (e.g., task moving to different campaign)
- **Stay open:** When making edits within same context (e.g., task moving to different list in same campaign)

## Benefits

1. **Efficiency:** Move items without navigating away from edit dialog
2. **Discoverability:** Actions menu makes features more discoverable
3. **Context:** Shows current location with "(current)" indicator
4. **Safety:** Disables current option to prevent confusion
5. **Feedback:** Toast notifications confirm every action
6. **Consistency:** Same pattern across all edit dialogs

## Future Enhancements

Potential additions to the actions menu:

1. **Duplicate Item** - Create a copy of the current item
2. **Move Multiple** - Select and move multiple items at once
3. **Convert Type** - Change campaign type or convert tasks to projects
4. **Share/Export** - Quick sharing or export options
5. **Add to Favorites** - Mark items as favorites
6. **Set Reminder** - Add quick reminders
7. **Bulk Operations** - Apply changes to related items

## Accessibility

- Dropdown menus are keyboard navigable
- Screen reader friendly with proper ARIA labels
- Clear visual indicators for current state
- Consistent spacing and sizing
- Color is not the only indicator (icons also used)

## Testing Checklist

- [ ] Campaign moves to different project successfully
- [ ] Campaign moves to standalone (no project) successfully
- [ ] Task moves to different campaign successfully
- [ ] Task moves to different list within same campaign successfully
- [ ] Current containers show "(current)" indicator
- [ ] Current containers are disabled
- [ ] Toast notifications show correct names
- [ ] Dialog closes when appropriate
- [ ] Dialog stays open when appropriate
- [ ] Archive actions work from all dialogs
- [ ] Changes persist after page refresh
- [ ] Dropdown menus close after selection
- [ ] Keyboard navigation works
- [ ] Submenus open on hover

## Known Limitations

1. **No Undo:** Moves are immediate with no undo option (yet)
2. **No Confirmation:** Move actions don't ask for confirmation (design choice for speed)
3. **First List Default:** Tasks moving to new campaign always go to first list
4. **No Batch Moves:** Can only move one item at a time
5. **No Move History:** No log of previous locations

## Related Files

- `src/components/CampaignEditDialog.tsx` - Campaign move & archive
- `src/components/TaskDetailDialog.tsx` - Task move & archive
- `src/components/ProjectEditDialog.tsx` - Project archive
- `src/components/ui/dropdown-menu.tsx` - Radix UI dropdown component

## Design Rationale

### Why Dropdown Menu Instead of Buttons?

1. **Space Efficiency:** Reduces clutter in dialog footer
2. **Scalability:** Easy to add more actions in future
3. **Organization:** Groups related actions logically
4. **Discoverability:** "Actions" button suggests more options available
5. **Consistency:** Matches common UI patterns (Gmail, Notion, etc.)

### Why Immediate Action Instead of Form Fields?

1. **Speed:** One click to move instead of changing form field + saving
2. **Clarity:** Clear what will happen when you click
3. **Separation:** Distinguishes between editing and organizing
4. **Safety:** Archive/move are separate from edit operations
5. **Feedback:** Immediate toast notification confirms action

## Code Quality

- ✅ TypeScript strict mode compatible
- ✅ No prop drilling (uses callbacks)
- ✅ Consistent naming conventions
- ✅ Proper event handlers
- ✅ Accessible components
- ✅ Clean separation of concerns
- ✅ Reusable patterns
