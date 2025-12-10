# Drag-and-Drop Archive & Search Archive Features

## Status: **PLANNED** (Not Yet Implemented)

This document outlines the drag-and-drop archive functionality and search-based archive features that are planned but not yet implemented. These features were requested but require additional development time.

---

## 🎯 Feature 1: Drag-and-Drop to Archive

### Concept
Users should be able to drag projects, campaigns, or tasks directly onto an "Archive" drop zone to archive them quickly.

### Planned Implementation

#### 1. Archive Drop Zone in Sidebar
```typescript
// Add to Sidebar.tsx
<div 
  className="archive-drop-zone"
  onDragOver={handleDragOver}
  onDrop={handleDrop}
>
  <Archive size={20} />
  Drop here to archive
</div>
```

#### 2. Make Items Draggable
- Projects in ProjectsView
- Campaigns in CampaignsView
- Campaign items in Sidebar
- Tasks in TaskCard

#### 3. Drag Data Transfer
```typescript
const handleDragStart = (e: DragEvent, item: Project | Campaign | Task, type: string) => {
  e.dataTransfer.setData('itemId', item.id)
  e.dataTransfer.setData('itemType', type)
  e.dataTransfer.effectAllowed = 'move'
}
```

#### 4. Drop Handler
```typescript
const handleArchiveDrop = (e: DragEvent) => {
  const itemId = e.dataTransfer.getData('itemId')
  const itemType = e.dataTransfer.getData('itemType')
  
  switch(itemType) {
    case 'project':
      archiveProject(itemId)
      break
    case 'campaign':
      archiveCampaign(itemId)
      break
    case 'task':
      archiveTask(itemId)
      break
  }
}
```

### Visual Feedback
- **Dragging**: Semi-transparent ghost image
- **Drop Zone Hover**: Highlighted border, background change
- **Success**: Toast notification "Project archived"
- **Animation**: Smooth fade-out of archived item

### Files to Modify
- `src/components/Sidebar.tsx` - Add drop zone
- `src/components/ProjectsView.tsx` - Make projects draggable
- `src/components/CampaignsView.tsx` - Make campaigns draggable
- `src/components/TaskCard.tsx` - Make tasks draggable (already partially implemented)
- `src/lib/types.ts` - Add `archived` field to Campaign and Task if needed

---

## 🔍 Feature 2: Search-Based Archive Function

### Concept
A dedicated search interface specifically for finding and archiving items in bulk.

### Planned Implementation

#### 1. Archive Search Dialog
```typescript
<Dialog>
  <DialogHeader>
    <DialogTitle>Archive Items</DialogTitle>
    <DialogDescription>
      Search for projects, campaigns, or tasks to archive
    </DialogDescription>
  </DialogHeader>
  
  <Input 
    placeholder="Search by name, description, or date..."
    value={searchQuery}
    onChange={handleSearch}
  />
  
  <SearchResults>
    {results.map(item => (
      <SearchResultItem 
        item={item}
        onArchive={handleArchive}
      />
    ))}
  </SearchResults>
</Dialog>
```

#### 2. Advanced Search Filters
- **By Type**: Projects, Campaigns, Tasks, or All
- **By Date**: Created before date, not updated since
- **By Status**: Completed, incomplete, overdue
- **By Owner**: Filter by user
- **By Project/Campaign**: Scope search

#### 3. Bulk Actions
- Select multiple items with checkboxes
- "Archive Selected" button
- "Archive All Results" option
- Confirmation dialog for bulk operations

#### 4. Search Algorithm
```typescript
function searchForArchiveCandidates(
  query: string,
  type: 'all' | 'project' | 'campaign' | 'task',
  filters: ArchiveSearchFilters
): SearchResult[] {
  // Search across all content
  // Apply filters
  // Rank by relevance
  // Suggest archive candidates (old, completed, etc)
}
```

### UI Components

#### Search Result Card
```tsx
<Card>
  <Checkbox />
  <Icon type={item.type} />
  <div>
    <h4>{item.title}</h4>
    <p>{item.description}</p>
    <div className="metadata">
      <span>Created: {item.createdAt}</span>
      <span>Last Updated: {item.updatedAt}</span>
      {item.completed && <Badge>Completed</Badge>}
    </div>
  </div>
  <Button onClick={() => archiveItem(item.id)}>
    <Archive size={16} />
    Archive
  </Button>
</Card>
```

### Smart Suggestions

The system could suggest items to archive:
- Completed projects older than 30 days
- Campaigns with end dates in the past
- Tasks completed over 90 days ago
- Projects with no activity in 6 months

### Files to Create
- `src/components/ArchiveSearchDialog.tsx` - Main search UI
- `src/components/ArchiveSearchResult.tsx` - Result item component
- `src/lib/archiveHelpers.ts` - Search and archive logic

### Files to Modify
- `src/components/Header.tsx` - Add "Archive Search" button
- `src/components/ArchiveView.tsx` - Link to search function

---

## 🎨 UI/UX Mockup

### Drag-and-Drop Flow
```
1. User hovers over project card
   ↓
2. Cursor changes to grab hand
   ↓
3. User starts dragging
   ↓
4. Archive drop zone appears/highlights in sidebar
   ↓
5. User drags over drop zone
   ↓
6. Drop zone glows, shows "Drop to archive"
   ↓
7. User releases
   ↓
8. Item fades out with animation
   ↓
9. Toast: "Project archived. Undo?"
   ↓
10. Item moves to Archive view
```

### Search Archive Flow
```
1. User clicks "Archive Search" in header
   ↓
2. Dialog opens with search input
   ↓
3. User types "marketing" 
   ↓
4. Results show matching items instantly
   ↓
5. User can filter by type, date, status
   ↓
6. User selects 3 old completed campaigns
   ↓
7. Clicks "Archive Selected (3)"
   ↓
8. Confirmation: "Archive 3 campaigns?"
   ↓
9. Confirmed
   ↓
10. Toast: "3 campaigns archived"
```

---

## 🛠️ Implementation Priority

### High Priority
1. **Drag-and-drop archive** - Most intuitive UX
2. **Archive drop zone in sidebar** - Always visible
3. **Basic search and archive** - One-by-one archiving

### Medium Priority
1. **Bulk archive from search** - Efficiency for large cleanups
2. **Advanced search filters** - Power user feature
3. **Undo archive action** - Safety net

### Low Priority
1. **Smart suggestions** - AI-like feature
2. **Keyboard shortcuts** - Power user optimization
3. **Archive analytics** - How much archived, when, etc.

---

## 🚧 Why Not Implemented Yet?

These features require significant development time:

1. **Drag-and-Drop**:
   - Need to refactor existing drag-and-drop code
   - Prevent conflicts with task dragging in Kanban
   - Handle edge cases (drag between views, etc.)
   - Test across all components

2. **Search Archive**:
   - Build robust search algorithm
   - Create new UI components
   - Handle large result sets efficiently
   - Implement bulk operations safely

**Estimated Time**: 4-6 hours for full implementation

---

## 💡 Workarounds Available Now

Until these features are implemented, users can:

### Archive Projects
1. Go to "All Projects" view
2. Click Archive icon on project card
3. Item moves to Archive view

### Find Items to Archive
1. Use Global Search (Cmd/Ctrl+K or Search button)
2. Search for item name
3. Navigate to item
4. Click archive button

### Bulk Archive
1. Go to Master View
2. See all projects/campaigns in tables
3. Click edit button
4. Archive from edit dialog

---

## 📋 Next Steps for Implementation

1. Create feature branch: `feat/drag-drop-archive`
2. Implement drag-and-drop for projects first
3. Add archive drop zone to sidebar
4. Test thoroughly
5. Extend to campaigns and tasks
6. Build search archive dialog
7. Add bulk operations
8. Testing and polish
9. Merge to main

---

## 🎯 Success Metrics

When implemented, we'll measure:
- **Usage**: How often users drag-and-drop vs click archive
- **Efficiency**: Time saved with bulk archive
- **Errors**: Accidental archives (need for undo)
- **Adoption**: % of users using these features

---

## 🔗 Related Features

These features work well with:
- ✅ **Archive View** (already implemented)
- ✅ **Project Archive** (already implemented)
- ⏳ **Campaign Archive** (needs `archived` field)
- ⏳ **Task Archive** (needs `archived` field)
- ⏳ **Bulk Restore** (from archive view)
- ⏳ **Archive Filters** (date ranges, types)

---

## 📝 Note

These features are documented here for future implementation. The core archive functionality (Archive view, restore, delete) is already working. The drag-and-drop and search enhancements would make the archive workflow even more efficient.

**Current Status**: 
- ✅ Archive View exists
- ✅ Can archive projects manually
- ✅ Can restore from archive
- ✅ Can permanently delete
- ⏳ Drag-and-drop not yet implemented
- ⏳ Search-based archive not yet implemented

---

**Want these features implemented?** 
The foundation is ready. These would be great additions for a future update!
