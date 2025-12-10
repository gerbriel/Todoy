# GitHub Spark KV Rate Limit Issue

## Problem

You're seeing these errors:
```
Failed to load resource: the server responded with a status of 403 (rate limit exceeded)
Failed to load resource: the server responded with a status of 401 (Unauthorized)
```

## Root Cause

**GitHub Spark KV Storage has rate limits** that you're exceeding. The app is making too many KV read/write operations:

Current KV keys being accessed:
- `notifications`
- `projects`
- `labels`
- `lists`
- `campaigns`
- `tasks`
- `stageTemplates`
- Plus others...

**Every component mount/update** triggers a KV read via `useKV()`, and **every state change** triggers a KV write.

## Immediate Solutions

### Option 1: Use Demo/Development Mode (Easiest)
Switch to localStorage instead of GitHub Spark KV for development:

**Modify `src/App.tsx`:**
```typescript
// Instead of useKV, use useState with localStorage fallback
const [projects, setProjects] = useState<Project[]>(() => {
  const stored = localStorage.getItem('projects')
  return stored ? JSON.parse(stored) : []
})

// Add effect to persist to localStorage
useEffect(() => {
  localStorage.setItem('projects', JSON.stringify(projects))
}, [projects])
```

### Option 2: Reduce KV Calls (Medium Effort)
Implement debouncing and batching:

**Create a debounced KV hook:**
```typescript
// src/hooks/useDebouncedKV.ts
import { useState, useEffect, useRef } from 'react'
import { useKV } from '@github/spark/hooks'

export function useDebouncedKV<T>(key: string, initialValue: T, delay = 500) {
  const [kvValue, setKVValue] = useKV<T>(key, initialValue)
  const [localValue, setLocalValue] = useState(kvValue)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    setLocalValue(kvValue)
  }, [kvValue])

  const setDebouncedValue = (value: T | ((prev: T) => T)) => {
    const newValue = typeof value === 'function' ? (value as (prev: T) => T)(localValue) : value
    setLocalValue(newValue)
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      setKVValue(newValue)
    }, delay)
  }

  return [localValue, setDebouncedValue] as const
}
```

**Usage:**
```typescript
// In App.tsx
import { useDebouncedKV } from './hooks/useDebouncedKV'

// Instead of:
const [tasks, setTasks] = useKV<Task[]>('tasks', [])

// Use:
const [tasks, setTasks] = useDebouncedKV<Task[]>('tasks', [], 1000) // Save to KV only after 1 second of no changes
```

### Option 3: Implement Caching Layer (Advanced)
Create a cache that only writes to KV periodically:

```typescript
// src/lib/kvCache.ts
class KVCache {
  private cache: Map<string, any> = new Map()
  private dirty: Set<string> = new Set()
  private flushInterval: NodeJS.Timeout

  constructor(flushIntervalMs = 5000) {
    this.flushInterval = setInterval(() => this.flush(), flushIntervalMs)
  }

  get<T>(key: string, defaultValue: T): T {
    return this.cache.has(key) ? this.cache.get(key) : defaultValue
  }

  set<T>(key: string, value: T): void {
    this.cache.set(key, value)
    this.dirty.add(key)
  }

  private async flush(): Promise<void> {
    if (this.dirty.size === 0) return

    const dirtyKeys = Array.from(this.dirty)
    this.dirty.clear()

    // Batch write to KV
    for (const key of dirtyKeys) {
      try {
        await fetch(`/_spark/kv/${key}`, {
          method: 'PUT',
          body: JSON.stringify(this.cache.get(key))
        })
      } catch (err) {
        console.error(`Failed to flush ${key}:`, err)
        // Re-mark as dirty
        this.dirty.add(key)
      }
    }
  }

  cleanup(): void {
    clearInterval(this.flushInterval)
    this.flush()
  }
}

export const kvCache = new KVCache()
```

## Recommended Approach

**For Development:** Use localStorage (Option 1)
**For Production:** Implement debouncing (Option 2)

## Implementation Steps

1. **Create localStorage fallback wrapper:**
   ```bash
   # Create new file
   touch src/hooks/useLocalStorage.ts
   ```

2. **Add the hook:**
   ```typescript
   // src/hooks/useLocalStorage.ts
   import { useState, useEffect } from 'react'

   export function useLocalStorage<T>(key: string, initialValue: T) {
     const [value, setValue] = useState<T>(() => {
       try {
         const item = window.localStorage.getItem(key)
         return item ? JSON.parse(item) : initialValue
       } catch (error) {
         console.error(`Error loading ${key} from localStorage:`, error)
         return initialValue
       }
     })

     useEffect(() => {
       try {
         window.localStorage.setItem(key, JSON.stringify(value))
       } catch (error) {
         console.error(`Error saving ${key} to localStorage:`, error)
       }
     }, [key, value])

     return [value, setValue] as const
   }
   ```

3. **Replace useKV calls in App.tsx:**
   ```typescript
   // Replace:
   import { useKV } from '@github/spark/hooks'
   
   // With:
   import { useLocalStorage } from './hooks/useLocalStorage'
   
   // Replace all useKV calls:
   const [projects, setProjects] = useLocalStorage<Project[]>('projects', [])
   const [campaigns, setCampaigns] = useLocalStorage<Campaign[]>('campaigns', [])
   const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', [])
   // etc...
   ```

4. **Optional: Add environment toggle:**
   ```typescript
   // src/lib/storage.ts
   import { useKV } from '@github/spark/hooks'
   import { useLocalStorage } from '../hooks/useLocalStorage'

   const USE_LOCAL_STORAGE = import.meta.env.DEV // Use localStorage in dev mode

   export function useStorage<T>(key: string, initialValue: T) {
     if (USE_LOCAL_STORAGE) {
       return useLocalStorage(key, initialValue)
     }
     return useKV(key, initialValue)
   }
   ```

## Rate Limit Information

GitHub Spark KV typically has:
- **Read limit:** ~100 requests per minute
- **Write limit:** ~50 requests per minute
- **Burst limit:** ~10 requests per second

Your app is likely exceeding these during initial load and rapid editing.

## Long-Term Solution

For production deployment, consider:
1. **Backend API:** Build a proper backend with database
2. **Supabase/Firebase:** Use a real-time database service
3. **IndexedDB:** Use browser-side IndexedDB for offline-first approach
4. **Sync Strategy:** Only sync to cloud periodically, not on every change

## Testing the Fix

After implementing localStorage:
1. Clear browser cache and reload
2. Check console for errors (should be gone)
3. Test creating/editing projects/campaigns/tasks
4. Check `Application > Local Storage` in DevTools to see data
5. Refresh page to verify persistence works

## Notes

- The 401 Unauthorized errors suggest you might not be properly authenticated with GitHub Spark
- Rate limits reset after a short period (usually 1 minute)
- Consider implementing exponential backoff for failed KV operations
