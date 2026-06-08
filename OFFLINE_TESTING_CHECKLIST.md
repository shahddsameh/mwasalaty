# Offline-First Testing Checklist

Use this checklist to verify that all offline features are working correctly.

## Prerequisites

- [ ] Frontend build successful: `npm run build`
- [ ] Development server running: `npm run dev`
- [ ] Browser DevTools open (F12)
- [ ] IndexedDB visible in Application tab

## 1. Initial Setup

### Database Initialization
- [ ] Open app in browser
- [ ] Check console for "mwasalaty-offline" database creation
- [ ] Verify tables exist in DevTools → Application → IndexedDB:
  - [ ] favoritePlaces
  - [ ] recentSearches
  - [ ] savedTrips
  - [ ] cachedRoutes
  - [ ] syncMetadata
  - [ ] pendingActions
  - [ ] tickets
  - [ ] settings

### Sync Service
- [ ] Check console for "Starting sync..." message
- [ ] Verify no errors on startup
- [ ] OfflineIndicator NOT visible (no pending changes)

## 2. Online Functionality

### Route Search (Online)
- [ ] Navigate to route search page
- [ ] Enter "Tahrir Square" → "Cairo Airport"
- [ ] Click search
- [ ] Routes display correctly
- [ ] Check console: "PLAN RESPONSE FROM BACKEND"
- [ ] Verify in IndexedDB: `cachedRoutes` table has new entry
- [ ] Check `recentSearches` table has new entry

### Favorite Places (Online)
- [ ] Navigate to saved places section
- [ ] Add a new favorite place
- [ ] Place appears immediately in list
- [ ] Check console for sync activity (may be stubbed)
- [ ] Verify in IndexedDB: `favoritePlaces` table has entry
- [ ] Delete the place
- [ ] Place removed from list
- [ ] Entry removed from IndexedDB

### Saved Trips (Online)
- [ ] Save a trip from route results
- [ ] Trip appears in saved trips list
- [ ] Check IndexedDB: `savedTrips` table has entry
- [ ] Delete trip
- [ ] Trip removed from list

## 3. Offline Mode Testing

### Go Offline
- [ ] Open DevTools → Network tab
- [ ] Change throttling to "Offline"
- [ ] Verify OfflineIndicator appears at top of page
- [ ] Banner shows: "You are currently offline"
- [ ] Banner is yellow/warning colored

### Route Search (Offline - Cached)
- [ ] Try searching the same route as before
- [ ] Routes load from cache
- [ ] Check indicator: "Using saved data from X minutes ago"
- [ ] Routes display correctly
- [ ] No network errors in console

### Route Search (Offline - Not Cached)
- [ ] Try searching a NEW route (never searched before)
- [ ] Error message appears
- [ ] Message mentions "offline" or "no cached route"
- [ ] No crash or hang

### Favorite Places (Offline)
- [ ] Add a new favorite place while offline
- [ ] Place appears immediately in list
- [ ] Check OfflineIndicator: "1 change pending sync"
- [ ] Check IndexedDB: `pendingActions` table has entry
- [ ] Action type should be "create"
- [ ] Entity type should be "favoritePlace"

- [ ] Edit an existing favorite place
- [ ] Changes appear immediately
- [ ] Pending count increases: "2 changes pending sync"

- [ ] Delete a favorite place
- [ ] Place removed immediately
- [ ] Pending count increases: "3 changes pending sync"

### Saved Trips (Offline)
- [ ] Save a new trip while offline
- [ ] Trip appears in list immediately
- [ ] Pending count increases
- [ ] Check `pendingActions` in IndexedDB

### Recent Searches (Offline)
- [ ] Recent searches display correctly
- [ ] Can view recent searches
- [ ] Can clear recent searches
- [ ] (Recent searches are local-only, no sync)

## 4. Sync Testing

### Manual Sync (While Offline)
- [ ] Click "Sync" button on OfflineIndicator
- [ ] Nothing happens (still offline)
- [ ] Pending count unchanged

### Reconnect and Auto-Sync
- [ ] Go back online: DevTools → Network → "No throttling"
- [ ] Wait 2-3 seconds
- [ ] Check console: "Network online: triggering sync"
- [ ] Check console: "Starting sync..."
- [ ] OfflineIndicator shows "Syncing" with spinning icon
- [ ] After sync: "All changes synced"
- [ ] Pending count becomes 0
- [ ] OfflineIndicator disappears after 3 seconds
- [ ] Check IndexedDB: `pendingActions` table is empty

### Sync Status Messages
- [ ] Offline: Yellow banner "You are currently offline"
- [ ] Syncing: Blue banner "Syncing changes..." with spinner
- [ ] Pending: Blue banner "X changes pending sync"
- [ ] Success: Brief "All changes synced" message
- [ ] Error: Red banner "Sync error: ..." (test by stopping backend)

## 5. Cache Behavior

### Cache Expiration
- [ ] Search for a route
- [ ] Wait 11 minutes (or change `CACHE_DURATION_MS` to 10 seconds for testing)
- [ ] Search same route again
- [ ] Should fetch from network, not cache
- [ ] Cache entry updated with new timestamp

### Cache Cleanup
- [ ] Open browser console
- [ ] Run: `localStorage.setItem('DEBUG_OFFLINE', 'true')`
- [ ] Wait for hourly cleanup (or trigger manually)
- [ ] Check console: "Cache cleanup: removed X expired route caches"
- [ ] Expired entries removed from IndexedDB

### Cache Statistics
- [ ] Open debug panel (if implemented in UI)
- [ ] OR run in console:
  ```javascript
  const { getCacheStats } = await import('./src/core/offline/cacheManager.ts');
  console.table(await getCacheStats());
  ```
- [ ] Verify counts match IndexedDB
- [ ] Check total size estimate

## 6. Debug Panel (Optional)

If you've added the debug panel to a page:

- [ ] Open debug panel
- [ ] Network status shows "Online" or "Offline"
- [ ] Sync status displays correctly
- [ ] Pending count matches OfflineIndicator
- [ ] Cache statistics displayed
- [ ] "Sync Now" button works
- [ ] "Refresh Stats" button updates display
- [ ] "Cleanup Cache" button removes expired entries
- [ ] "Clear All Cache" button (with confirmation) works

## 7. Error Scenarios

### Network Failure (Online but API Down)
- [ ] Stop the backend server
- [ ] Try to search a NEW route
- [ ] Error handled gracefully
- [ ] Try to search a CACHED route
- [ ] Loads from cache successfully
- [ ] Shows "Using saved data" indicator

### Sync Failure
- [ ] Go offline
- [ ] Make changes (add favorite place)
- [ ] Stop backend server
- [ ] Go online
- [ ] Sync should fail
- [ ] Error message displayed
- [ ] Retry count incremented in `pendingActions`
- [ ] Changes still in pending queue

### Quota Exceeded (Rare)
- [ ] Fill cache with large amount of data
- [ ] Browser may show quota warning
- [ ] App should handle gracefully (currently no handling)

## 8. Cross-Tab/Window Testing

### Multiple Tabs
- [ ] Open app in two tabs
- [ ] Add favorite place in Tab 1
- [ ] Place appears in Tab 2 automatically (reactive)
- [ ] Delete place in Tab 2
- [ ] Place removed in Tab 1 automatically

### Multiple Windows
- [ ] Open app in two browser windows
- [ ] Same reactive behavior as tabs
- [ ] IndexedDB changes propagate automatically

## 9. Performance Testing

### Large Dataset
- [ ] Add 50+ favorite places
- [ ] UI remains responsive
- [ ] List renders quickly
- [ ] No lag when scrolling

### Heavy Cache
- [ ] Search 20+ different routes
- [ ] Cache size remains reasonable
- [ ] Cleanup removes old entries
- [ ] App performance not degraded

### Rapid Actions
- [ ] Quickly add/delete multiple places
- [ ] All actions queued correctly
- [ ] UI updates smoothly
- [ ] No race conditions
- [ ] All syncs process successfully

## 10. Mobile Testing

### Mobile Browser
- [ ] Test on actual mobile device (iOS/Android)
- [ ] Enable airplane mode
- [ ] Test offline functionality
- [ ] OfflineIndicator displays correctly
- [ ] Touch interactions work
- [ ] Reconnection triggers sync

### PWA (Installed)
- [ ] Install PWA on mobile
- [ ] Test offline in standalone mode
- [ ] Service Worker + IndexedDB work together
- [ ] Background sync (if implemented)

## 11. Data Integrity

### No Data Loss
- [ ] Make changes offline
- [ ] Close browser completely
- [ ] Reopen browser
- [ ] Changes still in pending queue
- [ ] Sync happens on reconnection

### Optimistic Updates
- [ ] Add place offline
- [ ] Place visible immediately in UI
- [ ] Place persists in IndexedDB
- [ ] After sync, place remains (no duplication)

### Deduplication
- [ ] Search same route multiple times
- [ ] Only one entry in `recentSearches`
- [ ] Timestamp updated on repeat search

## 12. Security Verification

### No Sensitive Data Cached
- [ ] Check IndexedDB for passwords: ❌ None found
- [ ] Check for auth tokens: ❌ None found
- [ ] Check for payment info: ❌ None found
- [ ] Check for API keys: ❌ None found
- [ ] Only safe data cached: ✅ Confirmed

## 13. TypeScript & Build

### Type Safety
- [ ] Run: `npm run build`
- [ ] No TypeScript errors
- [ ] All imports resolve correctly
- [ ] Build completes successfully

### Bundle Size
- [ ] Check dist output
- [ ] Bundle size reasonable (~700-800KB)
- [ ] Service Worker generated
- [ ] No warnings except chunk size (acceptable)

## 14. Browser Compatibility

Test in multiple browsers:

### Chrome/Edge
- [ ] All features work
- [ ] IndexedDB supported
- [ ] Network status detection works

### Firefox
- [ ] All features work
- [ ] IndexedDB supported
- [ ] Network status detection works

### Safari (if available)
- [ ] All features work
- [ ] IndexedDB supported
- [ ] Network status detection works

## 15. Regression Testing

### Existing Features Still Work
- [ ] Route search works as before
- [ ] Saved places work as before
- [ ] Recent searches work as before
- [ ] Tickets work as before
- [ ] Navigation works
- [ ] Authentication works
- [ ] Payments work (online only)

### No Breaking Changes
- [ ] All existing pages load
- [ ] No console errors on startup
- [ ] Existing composables work unchanged
- [ ] No layout issues

## Test Results Summary

| Category | Status | Notes |
|----------|--------|-------|
| Database Setup | ⬜ | |
| Online Functionality | ⬜ | |
| Offline Mode | ⬜ | |
| Sync | ⬜ | |
| Cache | ⬜ | |
| Error Handling | ⬜ | |
| Performance | ⬜ | |
| Mobile | ⬜ | |
| Security | ⬜ | |
| TypeScript | ⬜ | |
| Browser Compat | ⬜ | |
| Regression | ⬜ | |

**Legend:**
- ⬜ Not tested
- ✅ Passed
- ❌ Failed
- ⚠️ Issues found

## Quick Debug Commands

Open browser console and run:

```javascript
// View cache stats
const stats = await (await import('./src/core/offline/cacheManager.ts')).getCacheStats();
console.table(stats);

// View pending actions
const pending = await (await import('./src/core/offline/syncQueue.ts')).getAllPendingActions();
console.table(pending);

// Force sync
const { performSync } = await import('./src/core/offline/syncService.ts');
await performSync(true);

// Clear cache
const { clearAllCache } = await import('./src/core/offline/cacheManager.ts');
await clearAllCache();

// Simulate offline
window.dispatchEvent(new Event('offline'));

// Simulate online
window.dispatchEvent(new Event('online'));
```

## Issues Found

Document any issues here:

1. Issue: ________________
   - Steps to reproduce: ________________
   - Expected: ________________
   - Actual: ________________
   - Priority: ________________

---

**Tester Name**: ________________
**Date**: ________________
**Browser**: ________________
**OS**: ________________
**Result**: ⬜ Pass ⬜ Fail ⬜ Pass with Issues
