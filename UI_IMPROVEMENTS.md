# UI Improvements - Lists, Text Wrapping, and Delete Buttons

## Summary

Fixed three major UI issues:
1. Lists not updating visually after CRUD operations
2. Long campaign/task names getting cut off in sidebar (now wrap instead of truncate)
3. Added delete buttons to top navigation for projects, campaigns, and tasks

## Changes Made

### 1. Lists Visual Updates (TaskList.tsx)

**Issue**: When renaming a list, the change wouldn't appear until page refresh.

**Fix**: Added optimistic UI update when renaming lists.

```typescript
// TaskList.tsx - handleSaveTitle
await listsService.update(list.id, { title: editedTitle.trim() })
// Optimistically update local state
setLists(prev => prev.map(l => 
  l.id === list.id ? { ...l, title: editedTitle.trim() } : l
))
```

**Result**: List title updates appear instantly in the UI.

---

### 2. Sidebar Text Wrapping (Sidebar.tsx)

**Issue**: Long project/campaign/task names were getting cut off behind the sidebar edge, making it hard to click delete buttons and read full names.

**Fix**: Changed from `truncate` (ellipsis) to `break-words` (wrap) for all sidebar items.

#### Changes Made:

**Campaign Buttons:**
```typescript
// Before: items-center, truncate
className="... flex items-center gap-2 ..."
<span className="flex-1 truncate min-w-0">{campaign.title}</span>

// After: items-start, break-words, icon mt-0.5
className="... flex items-start gap-2 ..."
<Target size={14} weight="duotone" className="flex-shrink-0 mt-0.5" />
<span className="flex-1 min-w-0 break-words">{campaign.title}</span>
```

**Nested Tasks:**
```typescript
// Before: items-center, truncate
className="... flex items-center gap-2 ..."
<span className="flex-1 truncate min-w-0">{task.title}</span>

// After: items-start, break-words, icon mt-0.5
className="... flex items-start gap-2 ..."
<CheckSquare size={12} weight="duotone" className="flex-shrink-0 mt-0.5" />
<span className="flex-1 min-w-0 break-words">{task.title}</span>
```

**Project Buttons:**
```typescript
// Before: items-center, truncate
className="... flex items-center gap-2 ..."
<span className="flex-1 truncate min-w-0">{project.title}</span>

// After: items-start, break-words, icon mt-0.5
className="... flex items-start gap-2 ..."
<Folder size={14} weight="duotone" className="flex-shrink-0 mt-0.5" />
<span className="flex-1 min-w-0 break-words">{project.title}</span>
```

**Result**: 
- Text wraps to multiple lines instead of being cut off
- Icons stay aligned at the top with `mt-0.5`
- All content is readable and accessible
- Delete buttons are no longer hidden by overflow

---

### 3. Delete Buttons in Top Navigation

Added delete buttons next to Edit buttons for projects, campaigns, and tasks.

#### A. Project Delete (ProjectView.tsx)

**Added:**
- Import: `Trash` icon, `projectsService`
- Interface: `onNavigateBack` prop
- Handler: `handleDeleteProject` with confirmation
- UI: Delete button in header next to Edit

```typescript
// Import
import { Target, CheckSquare, Calendar, Plus, PencilSimple, Trash } from '@phosphor-icons/react'
import { projectsService } from '@/services/projects.service'

// Handler
const handleDeleteProject = async () => {
  const campaignCount = projectCampaigns.length
  const taskCount = tasks.filter(t => t.campaignId && projectCampaigns.some(c => c.id === t.campaignId)).length
  
  const confirmMessage = campaignCount > 0
    ? `Delete "${project.title}" and its ${campaignCount} campaign(s) and ${taskCount} task(s)? This cannot be undone.`
    : `Delete "${project.title}"? This cannot be undone.`
  
  if (!confirm(confirmMessage)) return

  try {
    await projectsService.delete(project.id)
    setProjects(prev => prev.filter(p => p.id !== project.id))
    setCampaigns(prev => prev.filter(c => c.projectId !== project.id))
    toast.success('Project deleted')
    onNavigateBack()
  } catch (error) {
    toast.error('Failed to delete project')
  }
}

// UI Button
<Button variant="outline" onClick={handleDeleteProject} className="text-destructive hover:bg-destructive/10">
  <Trash size={16} weight="bold" />
  Delete
</Button>
```

**App.tsx Update:**
```typescript
<ProjectView
  // ... existing props
  onNavigateBack={handleNavigateToAllProjects}
/>
```

**Features:**
- Confirmation dialog shows campaign and task counts
- Optimistic UI update (instant removal)
- Navigates back to All Projects after deletion
- Cascade deletes campaigns belonging to the project

---

#### B. Campaign Delete (Header.tsx)

**Added:**
- Import: `Trash` icon, `campaignsService`, `toast`
- Parameter: `onNavigateToAllProjects`
- Handler: `handleDeleteCampaign` with confirmation
- UI: Delete button next to Edit Campaign

```typescript
// Import
import { ..., Trash } from '@phosphor-icons/react'
import { campaignsService } from '@/services/campaigns.service'
import { toast } from 'sonner'

// Handler
const handleDeleteCampaign = async () => {
  if (!activeCampaign) return
  
  const taskCount = tasks.filter(t => t.campaignId === activeCampaign.id).length
  const confirmMessage = taskCount > 0
    ? `Delete "${activeCampaign.title}" and its ${taskCount} task(s)? This cannot be undone.`
    : `Delete "${activeCampaign.title}"? This cannot be undone.`
  
  if (!confirm(confirmMessage)) return

  try {
    await campaignsService.delete(activeCampaign.id)
    setCampaigns(prev => prev.filter(c => c.id !== activeCampaign.id))
    toast.success('Campaign deleted')
    // Navigate to project if it exists, otherwise to all projects
    if (activeProject) {
      onNavigateToProject(activeProject.id)
    } else {
      onNavigateToAllProjects()
    }
  } catch (error) {
    toast.error('Failed to delete campaign')
  }
}

// UI Button (in campaign header section)
<Button
  variant="outline"
  size="sm"
  onClick={handleDeleteCampaign}
  className="text-destructive hover:bg-destructive/10"
>
  <Trash size={16} weight="bold" />
  Delete
</Button>
```

**Features:**
- Confirmation dialog shows task count
- Optimistic UI update
- Navigates to parent project or All Projects after deletion
- Positioned between Edit and view mode buttons

---

#### C. Task Delete (TaskDetailDialog.tsx)

**Added:**
- UI: Archive and Delete buttons in DialogHeader (top right)
- Moved from dropdown menu to prominent header position

```typescript
// UI in DialogHeader
<DialogHeader>
  <div className="flex items-center justify-between">
    <DialogTitle>Edit Task</DialogTitle>
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleArchive}
        className="text-orange-600 hover:bg-orange-50"
      >
        <Archive size={16} weight="bold" />
        Archive
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDelete}
        className="text-destructive hover:bg-destructive/10"
      >
        <Trash size={16} weight="bold" />
        Delete
      </Button>
    </div>
  </div>
</DialogHeader>
```

**Features:**
- Archive and Delete buttons now in header (more prominent)
- Still available in dropdown menu for discoverability
- Consistent styling with other delete buttons
- Orange styling for Archive, red for Delete

---

## Files Modified

1. **TaskList.tsx** - Added optimistic update for list rename
2. **Sidebar.tsx** - Changed text from truncate to wrap for all items
3. **ProjectView.tsx** - Added delete button and handler
4. **App.tsx** - Added onNavigateBack prop to ProjectView
5. **Header.tsx** - Added delete button and handler for campaigns
6. **TaskDetailDialog.tsx** - Added Archive/Delete buttons to header

---

## Testing Checklist

### Lists Visual Updates
- [ ] Rename a list in KanbanView
- [ ] Verify the title updates instantly without refresh
- [ ] Check that real-time subscription still works

### Text Wrapping
- [ ] Create a project with a very long name (50+ characters)
- [ ] Verify it wraps to multiple lines in sidebar
- [ ] Create a campaign with long name - verify wrapping
- [ ] Create a task with long name - verify wrapping in nested view
- [ ] Verify text doesn't overflow behind sidebar edge
- [ ] Verify delete buttons are accessible with long names

### Delete Buttons

#### Project Delete
- [ ] Open a project view
- [ ] Click Delete button in header
- [ ] Verify confirmation shows campaign/task counts
- [ ] Confirm deletion
- [ ] Verify navigates to All Projects
- [ ] Verify project removed from sidebar
- [ ] Verify campaigns under project also deleted

#### Campaign Delete
- [ ] Open a campaign view
- [ ] Click Delete button in header (between Edit and Kanban)
- [ ] Verify confirmation shows task count
- [ ] Confirm deletion
- [ ] Verify navigates to parent project (or All Projects)
- [ ] Verify campaign removed from sidebar
- [ ] Verify tasks under campaign also deleted

#### Task Delete
- [ ] Open a task detail dialog
- [ ] Verify Archive and Delete buttons in header (top right)
- [ ] Click Delete button
- [ ] Verify confirmation dialog appears
- [ ] Confirm deletion
- [ ] Verify dialog closes and task removed from list

---

## Design Decisions

### Text Wrapping vs Truncation
- **Before**: Used `truncate` (ellipsis "...")
- **After**: Changed to `break-words` (wrap to multiple lines)
- **Reason**: User reported content was getting cut off and causing issues with delete buttons. Wrapping ensures all content is readable and accessible.
- **Trade-off**: Sidebar items may take more vertical space, but readability and accessibility improved significantly.

### Delete Button Placement
- **Projects**: Added to ProjectView header (next to Edit)
- **Campaigns**: Added to Header component (between Edit and view mode buttons)
- **Tasks**: Moved to DialogHeader (was only in dropdown menu)
- **Consistency**: All delete buttons use the same styling (`text-destructive hover:bg-destructive/10`)

### Confirmation Messages
All delete operations show confirmation dialogs with:
- Item name in quotes
- Count of child items that will also be deleted
- "This cannot be undone" warning
- Specific wording for each context

### Navigation After Delete
- **Project delete**: Navigate to All Projects (clear activeProjectId)
- **Campaign delete**: Navigate to parent project if exists, otherwise All Projects
- **Task delete**: Close dialog, stay in current view

---

## Development Server

Server is running on: **http://localhost:5174/Todoy/**

Note: Port 5173 was in use, so it automatically switched to 5174.

---

## Next Steps

1. Test all delete operations with various data configurations
2. Verify cascading deletes work correctly (project → campaigns → tasks)
3. Check that optimistic updates work smoothly
4. Ensure navigation after delete feels natural
5. Test with very long names to verify wrapping works well
6. Consider adding undo functionality in the future
