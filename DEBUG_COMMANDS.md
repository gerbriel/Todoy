## 🚨 Quick Debug Commands

Open browser console (F12) and run these:

### 1. Check if you're logged in:
```javascript
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)
console.log('User:', session?.user)
```

### 2. Check your organization:
```javascript
const { data: org } = await supabase
  .from('organizations')
  .select('*')
  .limit(1)
  .single()
console.log('Organization:', org)
```

### 3. Try creating a project manually:
```javascript
const { data, error } = await supabase
  .from('projects')
  .insert({
    title: 'Test Project',
    description: 'Testing',
    order: 0,
    org_id: 'YOUR_ORG_ID_HERE'
  })
  .select()
  .single()

console.log('Result:', data)
console.log('Error:', error)
```

If any of these fail, share the error message!
