# List UX Improvements & Archive 406 Fix

## Summary

Fixed three issues:
1. **Double-click to rename lists** - No longer need to click 3-dots menu
2. **Simplified delete UI** - Replaced dropdown menu with direct trash icon
3. **Fixed archive 406 error** - Removed `.select().single()` from update operations

## Changes Made

### 1. Double-Click to Rename Lists (TaskList.tsx)

**Issue**: Users had to click the 3-dots menu and select "Rename" to edit list titles.

**Fix**: Added `onDoubleClick` handler to the list title.

**Before**:
```tsx
<h3 className="font-semibold text-foreground flex-1 truncate">
  {list.title} <span className="text-muted-foreground text-sm font-normal">({listTasks.length})</span>
</h3>
```

**After**:
```tsx
<h3 
  className="font-semibold text-foreground flex-1 truncate cursor-pointer hover:text-accent-foreground transition-colors"
  onDoubleClick={() => setIsEditingTitle(true)}
  title="Double-click to rename"
>
  {list.title} <span className="text-muted-foreground text-sm font-normal">({listTasks.length})</span>
</h3>
```

**Features**:
- Visual feedback: `cursor-pointer` and `hover:text-accent-foreground`
- Tooltip: "Double-click to rename"
- More intuitive than menu navigation

---

### 2. Replace Dropdown with Trash Icon (TaskList.tsx)

**Issue**: Delete was hidden in a 3-dots dropdown menu alongside rename option.

**Fix**: Replaced entire dropdown menu with a simple trash icon button.

**Before** (Dropdown Menu):
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <button className="p-1 opacity-0 group-hover:opacity-100 hover:bg-muted rounded transition-all">
      <DotsThreeVertical size={16} weight="bold" />
    </button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
      <PencilSimple size={14} className="mr-2" />
      Rename
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-destructive" onClick={handleDeleteList}>
      Delete List
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**After** (Direct Trash Button):
```tsx
<button 
  className="p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-destructive rounded transition-all"
  onClick={handleDeleteList}
  title="Delete list"
>
  <Trash size={16} weight="bold" />
</button>
```

**Removed Imports**:
```tsx
// No longer needed
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
```

**Added Import**:
```tsx
import { Plus, Trash, ArrowsOutSimple } from '@phosphor-icons/react'
```

**Benefits**:
- More direct and discoverable
- One less click to delete
- Cleaner UI with less complexity
- Red color clearly indicates destructive action
- Rename moved to double-click (more intuitive)

---

### 3. Fixed Archive 406 Error (All Service Files)

**Issue**: Archive operations were failing with:
```
Failed to load resource: the server responded with a status of 406 ()
Failed to update project: Cannot coerce the result to a single JSON object
```

**Root Cause**: The update query was using `.select().single()` which expects exactly 1 row to be returned. However, Supabase's update doesn't always return a row in the response, causing `.single()` to fail with a 406 error.

**Solution**: Remove `.select().single()` from update operations and use `getById()` to fetch the updated entity with all relations instead.

#### Files Modified:

**projects.service.ts** (Line 121-128):

**Before**:
```typescript
if (Object.keys(updateData).length > 0) {
  const { data, error } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()  // ← This was failing

  if (error) throw error
}
```

**After**:
```typescript
if (Object.keys(updateData).length > 0) {
  const { error } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', id)
    // No .select().single()

  if (error) throw error
}
```

Then at the end:
```typescript
// Fetch updated project with relations
return await this.getById(id) as Project
```

**campaigns.service.ts** (Line 134-141):

Applied the same fix:
```typescript
// Only update main fields if there are any changes
if (Object.keys(updateData).length > 0) {
  const { error } = await supabase
    .from('campaigns')
    .update(updateData)
    .eq('id', id)

  if (error) throw error
}

// ... handle stage dates ...

// Fetch updated campaign with relations
return await this.getById(id) as Campaign
```

**Removed**:
- All the conditional logic for fetching campaign data
- The manual field transformation code

**tasks.service.ts** (Line 143-150):

Applied the same fix:
```typescript
// Only update main fields if there are any changes
if (Object.keys(updateData).length > 0) {
  const { error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', id)

  if (error) throw error
}

// ... handle assignees and labels ...

// Fetch updated task with relations
return await this.getById(id) as Task
```

**Benefits**:
1. **No more 406 errors** - Update no longer fails
2. **Simpler code** - Less conditional logic
3. **Consistent with design** - Always use `getById()` for complete entity data
4. **Handles relations properly** - `getById()` already joins all related data
5. **More reliable** - No assumptions about what Supabase returns

---

## Testing Checklist

### Double-Click Rename
- [ ] Open KanbanView with lists
- [ ] Double-click on a list title
- [ ] Verify edit mode starts (input appears)
- [ ] Rename the list
- [ ] Press Enter or click away
- [ ] Verify name updates instantly

### Trash Icon Delete
- [ ] Hover over list header
- [ ] Verify trash icon appears (red, on the right)
- [ ] Click trash icon
- [ ] Verify confirmation dialog appears
- [ ] Confirm deletion
- [ ] Verify list deleted instantly

### Archive Function
- [ ] Open ProjectEditDialog
- [ ] Click "Actions" → "Archive Project"
- [ ] Verify project archives without 406 error
- [ ] Check browser console - no errors
- [ ] Verify project appears in Archive view
- [ ] Try archiving a campaign (if applicable)
- [ ] Try archiving a task (if applicable)

---

## User Experience Flow

### Before (Rename):
1. Hover over list
2. Click 3-dots menu
3. Click "Rename"
4. Edit title
5. Save

**Total**: 5 steps

### After (Rename):
1. Double-click list title
2. Edit title
3. Save

**Total**: 3 steps (40% fewer steps)

---

### Before (Delete):
1. Hover over list
2. Click 3-dots menu
3. Click "Delete List"
4. Confirm

**Total**: 4 steps

### After (Delete):
1. Hover over list
2. Click trash icon
3. Confirm

**Total**: 3 steps (25% fewer steps)

---

## Technical Details

### Why Remove `.select().single()`?

**The Problem**:
- Supabase's `.update()` returns an empty array `[]` if successful
- `.single()` expects exactly 1 row
- When it gets 0 rows (empty array), it throws 406 "Cannot coerce to single JSON object"

**The Solution**:
- Don't try to get data from update response
- Always use `getById()` after successful update
- `getById()` properly joins all relations (stage_dates, assignees, labels, etc.)
- More consistent and predictable

**Why This Works Better**:
1. Update just does the update (single responsibility)
2. `getById()` is the single source of truth for fetching entities
3. No duplication of field transformation logic
4. Handles complex relations properly

---

## Code Quality Improvements

### Cleaner Imports (TaskList.tsx)
**Before**: 12 imports including dropdown components
**After**: 7 imports (42% reduction)

### Simpler UI Logic (TaskList.tsx)
**Before**: Complex dropdown with menu items, separators, icons
**After**: Single button with icon

### More Robust Services
**Before**: Complex conditional logic for update responses
**After**: Simple update + fetch pattern

---

## Related Documentation

This fix is related to the previous 406 error fix documented in `STAGE_DATES_406_FIX.md`. The root cause was slightly different:
- **Stage dates fix**: Empty update object when all fields undefined
- **Archive fix**: `.select().single()` failing on successful updates

Both are now solved by:
1. Explicitly checking which fields to update
2. Removing `.select().single()` from updates
3. Using `getById()` to fetch final entity

---

## Development Server

After these changes, the app should:
- Allow double-click rename on all lists
- Show trash icon instead of dropdown menu
- Archive projects/campaigns/tasks without 406 errors
- Have cleaner, more maintainable code
