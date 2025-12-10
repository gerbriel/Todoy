# GitHub Spark KV Rate Limiting Issue

## Problem
The application is experiencing rate limit errors from GitHub Spark KV storage API:
```
Failed to load resource: the server responded with a status of 403 (rate limit exceeded)
Error: Failed to fetch KV key: rate limit exceeded
Error: Failed to set key: rate limit exceeded
```

## Root Cause
The app makes **8+ simultaneous KV requests** on initial page load:
1. `projects`
2. `campaigns`  
3. `lists`
4. `tasks`
5. `labels`
6. `notifications`
7. `orgMembers`
8. `orgInvites`
9. `stageTemplates`

GitHub Spark enforces rate limits on KV storage operations to prevent abuse and manage server load.

## Impact
- App fails to load data when rate limit is hit
- User sees empty views
- Console shows multiple 403 errors
- Data persistence may fail

## Immediate Workarounds

### For Users:
1. **Wait 1-5 minutes** - Rate limits typically reset quickly
2. **Reload the page** after waiting
3. **Avoid rapid page refreshes** - This triggers more requests
4. **Use localStorage backup** - Check browser localStorage for cached data

### For Developers:
1. **Reduce refresh frequency** during development
2. **Use mock data** for testing
3. **Implement localStorage caching** to reduce KV dependency

## Long-Term Solutions

### 1. Request Batching
Instead of individual `useKV` calls, batch requests:
```typescript
const [data, setData] = useKV('appData', {
  projects: [],
  campaigns: [],
  // ... all data in one key
})
```

**Pros:** Single request
**Cons:** Larger payload, atomic updates only

### 2. Lazy Loading
Load data progressively instead of all at once:
```typescript
// Load critical data first
const [projects] = useKV('projects', [])
const [campaigns] = useKV('campaigns', [])

// Load secondary data after mount
useEffect(() => {
  // Delayed load of less critical data
}, [])
```

### 3. localStorage + KV Hybrid
Use localStorage as primary, KV as sync:
```typescript
const [data, setData] = useState(() => {
  // Load from localStorage first (instant)
  return localStorage.getItem('projects') || []
})

// Sync with KV in background
useEffect(() => {
  syncWithKV()
}, [])
```

**Pros:** Fast load, no rate limits for reads
**Cons:** Sync complexity, potential conflicts

### 4. Request Debouncing
Add delays between KV requests:
```typescript
const [projects] = useKV('projects', [])
// Wait 100ms
setTimeout(() => {
  const [campaigns] = useKV('campaigns', [])
}, 100)
```

**Pros:** Simple to implement
**Cons:** Slower initial load

### 5. Error Boundaries with Retry
Wrap components in error boundaries that retry after delay:
```typescript
<ErrorBoundary fallback={<RetryAfter seconds={60} />}>
  <App />
</ErrorBoundary>
```

## Current Implementation

The app uses direct `useKV` hooks in App.tsx:
```typescript
const [projects, setProjects] = useKV<Project[]>('projects', [])
const [campaigns, setCampaigns] = useKV<Campaign[]>('campaigns', [])
const [lists, setLists] = useKV<List[]>('lists', [])
const [tasks, setTasks] = useKV<Task[]>('tasks', [])
const [labels, setLabels] = useKV<Label[]>('labels', [])
const [stageTemplates, setStageTemplates] = useKV<StageTemplate[]>('stageTemplates', [])
const [orgMembers, setOrgMembers] = useKV<OrgMember[]>('orgMembers', [])
const [orgInvites, setOrgInvites] = useKV<OrgInvite[]>('orgInvites', [])
```

## Recommended Next Steps

### Priority 1: User Communication
- ✅ Add error banner explaining rate limits
- ✅ Show "Loading..." states
- ✅ Provide retry button

### Priority 2: Caching Layer
- Implement localStorage fallback
- Cache successful KV responses
- Reduce redundant requests

### Priority 3: Request Optimization  
- Batch related data (projects + campaigns)
- Lazy load non-critical data (orgInvites, stageTemplates)
- Implement exponential backoff for retries

### Priority 4: Alternative Storage
- Consider IndexedDB for larger datasets
- Implement service worker for offline support
- Use sessionStorage for temporary data

## Monitoring

Track rate limit occurrences:
```typescript
window.addEventListener('error', (e) => {
  if (e.message.includes('rate limit')) {
    // Log to analytics
    // Show user-friendly message
    // Attempt recovery
  }
})
```

## Testing Rate Limits

To test rate limit handling:
```typescript
// Simulate rapid requests
for (let i = 0; i < 20; i++) {
  await kvClient.get(`test-${i}`)
}
```

## Related Issues
- GitHub Spark KV rate limit documentation
- Spark storage best practices
- Performance optimization guides

## Status
**Current State:** Experiencing rate limits during normal operation
**Target State:** Graceful handling with automatic retry and caching
**Effort:** Medium (requires architecture changes)
**Timeline:** Can implement Priority 1 immediately, Priorities 2-3 within sprint

---

**Note:** GitHub Spark is in preview. Rate limits may change. Monitor official documentation for updates.
