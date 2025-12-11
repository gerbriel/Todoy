# Fix for 406 Error When Updating Stage Dates

## Problem

Getting HTTP 406 error: "Cannot coerce the result to a single JSON object" when updating stage dates in projects, campaigns, or tasks.

```
llygmucahdxrzbzepkzg.supabase.co/rest/v1/projects?id=eq.xxx&select=*:1  
Failed to load resource: the server responded with a status of 406 ()

Failed to update project: Cannot coerce the result to a single JSON object
```

## Root Cause

When updating **only** stage dates (or other related data like assigned users, labels), the main update object was empty `{}`. This happened because of the conditional spreading pattern:

```typescript
// ❌ OLD CODE - BROKEN
.update({
  ...(updates.title && { title: updates.title }),          // Only if title exists
  ...(updates.description !== undefined && { ... }),        // Only if description exists
  // ... etc
})
```

**What went wrong:**
1. User edits only stage dates in dialog
2. Dialog calls `service.update(id, { stageDates: [...] })`
3. All main fields (title, description, etc.) are undefined
4. Update object becomes `{}` (empty!)
5. Supabase tries to update with empty object
6. Query returns 0 rows (nothing to update)
7. `.single()` fails because it expects exactly 1 row
8. **Result:** HTTP 406 error

## Solution

Check if there are any main fields to update. If not, skip the update query and just fetch the current data:

```typescript
// ✅ NEW CODE - FIXED
async update(id: string, updates: Partial<Project>): Promise<Project> {
  // Build update object only with provided fields
  const updateData: any = {}
  if (updates.title !== undefined) updateData.title = updates.title
  if (updates.description !== undefined) updateData.description = updates.description
  // ... etc for all main fields

  // Only update main fields if there are any changes
  let data: any
  if (Object.keys(updateData).length > 0) {
    // Has main field changes - do update
    const result = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (result.error) throw result.error
    data = result.data
  } else {
    // No main field changes - just fetch current data
    const result = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()
    
    if (result.error) throw result.error
    data = result.data
  }

  // Handle stage dates in separate table
  if (updates.stageDates !== undefined) {
    await this.updateStageDates(id, updates.stageDates)
  }

  return data
}
```

## Files Fixed

### 1. projects.service.ts
- Fixed `update()` method
- Now handles stage dates-only updates
- Won't send empty update objects

### 2. campaigns.service.ts
- Fixed `update()` method
- Handles stage dates and other related data
- Same pattern as projects

### 3. tasks.service.ts
- Fixed `update()` method  
- Handles assigned users and labels updates
- Won't fail when only updating relations

## Testing

### ✅ Test Stage Dates Updates:

1. **Project Stage Dates:**
   - Open project edit dialog
   - Click "Stage Dates" tab
   - Add/edit/delete a stage date
   - Click Save
   - **Should work** without 406 error

2. **Campaign Stage Dates:**
   - Open campaign edit dialog
   - Click "Stage Dates" tab
   - Add/edit/delete a stage date
   - Click Save
   - **Should work** without 406 error

3. **Task Stage Dates:**
   - Open task detail dialog
   - Click "Stages" tab
   - Add/edit/delete a stage date
   - Click Save
   - **Should work** without 406 error

### ✅ Test Relations Updates:

4. **Task Labels (no other changes):**
   - Open task dialog
   - Change only labels
   - Save
   - **Should work**

5. **Task Assignees (no other changes):**
   - Open task dialog
   - Change only assigned users
   - Save
   - **Should work**

### ✅ Test Normal Updates Still Work:

6. **Update main fields:**
   - Edit title, description, dates
   - **Should still work** as before

7. **Update main fields + stage dates:**
   - Edit title AND stage dates
   - **Should work** for both

## Technical Details

### The Empty Object Problem:

```typescript
// When all conditions are false, spreading produces empty object
{
  ...(false && { field1: value1 }),  // Nothing
  ...(false && { field2: value2 }),  // Nothing  
  ...(false && { field3: value3 }),  // Nothing
}
// Result: {} (empty object!)

// Supabase can't update with empty object
await supabase.from('table').update({}).eq('id', id)
// Returns 0 rows, .single() throws 406 error
```

### The Fix Pattern:

```typescript
// 1. Build update object explicitly
const updateData: any = {}
if (condition1) updateData.field1 = value1
if (condition2) updateData.field2 = value2

// 2. Check if there's anything to update
if (Object.keys(updateData).length > 0) {
  // Yes - do update
  await supabase.update(updateData)
} else {
  // No - just fetch current data
  await supabase.select()
}

// 3. Handle related data separately
await handleRelatedData()
```

## Why This Pattern is Better

1. **Explicit**: Clear which fields are being updated
2. **Safe**: Won't send empty updates to database
3. **Efficient**: Skips unnecessary update queries
4. **Reliable**: Won't fail with 406 errors
5. **Maintains**: Related data (stage dates, etc.) handled separately anyway

## Commit

`90b92e7` - Fix 406 error when updating only stage dates or relations - handle empty update objects properly

---

**Result:** ✅ Stage dates can now be updated without errors! All CRUD operations work properly whether updating main fields, related data, or both.
