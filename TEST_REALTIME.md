# Test Real-Time Updates

## Open Browser Console (F12) and test:

### 1. Check if subscriptions are connected:
```javascript
// This should show active channels
console.log('Active channels:', window.supabase?.getChannels?.())
```

### 2. Test creating a project manually:
```javascript
const { data: session } = await supabase.auth.getSession()
const orgId = session?.session?.user?.user_metadata?.organization_id

console.log('Your Org ID:', orgId)

// Try creating a project
const { data, error } = await supabase
  .from('projects')
  .insert({
    title: 'Real-time Test Project',
    description: 'Testing',
    order: 0,
    org_id: orgId,
    completed: false,
    archived: false
  })
  .select()
  .single()

console.log('Created:', data)
console.log('Error:', error)

// Now check if it appears in the UI automatically
// If not, the subscription isn't working
```

### 3. Check what's happening with subscriptions:
```javascript
// Add this to see subscription events
supabase
  .channel('test-projects')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'projects' 
  }, (payload) => {
    console.log('🔴 PROJECT CHANGED:', payload)
  })
  .subscribe()
```

## What should happen:
1. Create project → Console shows "🔴 PROJECT CHANGED"
2. Project appears in sidebar immediately (no refresh needed)
3. Delete project → Disappears immediately

## If it doesn't work:
- Check if you added the redirect URLs in Supabase (SUPABASE_AUTH_FIX.md)
- Look for errors in console
- Share what you see!
