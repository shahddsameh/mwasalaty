# Offline-First Architecture

## Overview

The Mwaslaty PWA now includes a comprehensive offline-first architecture that allows users to access core functionality even when disconnected from the internet. The backend remains the source of truth, while IndexedDB serves as a local cache for offline access.

## Architecture Principles

1. **Backend as Source of Truth**: The backend API remains authoritative for all data
2. **Local Cache**: IndexedDB stores data for offline access
3. **Network-First with Fallback**: Try network first, fallback to cache when offline
4. **Optimistic Updates**: Update local cache immediately, sync to backend later
5. **Transparent Sync**: Automatic background synchronization when online

## Core Components

### 1. Database Layer (`/src/db/appDb.ts`)

Extended Dexie database with the following tables:

- **favoritePlaces**: User's saved places with sync support
- **recentSearches**: Recent route searches (local-only)
- **savedTrips**: Saved trip plans
- **cachedRoutes**: Cached route planning results
- **cachedPlaces**: Cached place data
- **syncMetadata**: Sync status tracking
- **pendingActions**: Queue for offline actions
- **tickets**: Offline ticket storage
- **settings**: App settings

### 2. Network Status (`/src/core/offline/networkStatus.ts`)

Monitors online/offline state:

```typescript
import { useNetworkStatus } from '@/core/offline/networkStatus';

const { isOnline, lastOnlineAt, lastOfflineAt } = useNetworkStatus();
```

### 3. Sync Queue (`/src/core/offline/syncQueue.ts`)

Manages pending actions for offline changes:

- Queues create/update/delete operations
- Retries failed syncs with exponential backoff
- Max retry limit to prevent infinite loops
- Pluggable sync handlers per entity type

### 4. Sync Service (`/src/core/offline/syncService.ts`)

Coordinates synchronization:

- Automatic sync on network reconnection
- Periodic background sync (5-minute interval)
- Sync on app startup (if online)
- Manual sync trigger

### 5. Repository Layer

Implements offline-first data access patterns:

#### Favorite Places (`/src/core/offline/repositories/favoritePlacesRepository.ts`)
- Optimistic updates to local cache
- Background sync to backend
- Full CRUD operations

#### Recent Searches (`/src/core/offline/repositories/recentSearchesRepository.ts`)
- Local-only storage
- Automatic deduplication
- Limited to last 20 searches

#### Routes (`/src/core/offline/repositories/routesRepository.ts`)
- Network-first with cache fallback
- 10-minute cache expiration
- Automatic cache cleanup

#### Saved Trips (`/src/core/offline/repositories/savedTripsRepository.ts`)
- Optimistic updates
- Background sync

### 6. Cache Manager (`/src/core/offline/cacheManager.ts`)

Provides cache maintenance:

- Cache statistics
- Cleanup expired entries
- Manual cache clearing
- Database reset

## Data Flow

### Online Flow

```
User Action → Repository → Network API → Success
                ↓
            Update Cache
                ↓
            UI Updates (reactive)
```

### Offline Flow

```
User Action → Repository → Update Cache (Optimistic)
                ↓
            Queue Pending Action
                ↓
            UI Updates (reactive)
                ↓
        [Wait for network]
                ↓
        Sync to Backend
```

### Read Flow

```
Request Data → Repository → Check Online?
                              ↓
                    Yes: Try Network
                         ↓ (Success)
                    Update Cache → Return Data
                         ↓ (Failure)
                    Fallback to Cache
                              ↓
                    No: Read from Cache → Return Data
```

## UI Components

### 1. OfflineIndicator (`/src/components/shared/OfflineIndicator.vue`)

Persistent status banner that shows:

- **Offline Mode**: Yellow banner when no connection
- **Syncing**: Blue banner with spinning icon during sync
- **Pending Changes**: Shows count of unsynced changes
- **Sync Errors**: Red banner for failed syncs
- **Manual Sync**: Button to trigger sync when pending changes exist

### 2. Composables

#### useOffline (`/src/composables/useOffline.ts`)
Central composable for offline/sync state:

```typescript
import { useOffline } from '@/composables/useOffline';

const {
  isOnline,
  isOffline,
  syncStatus,
  pendingCount,
  offlineMessage,
  syncMessage,
  performSync,
} = useOffline();
```

#### useRoutePlanning (`/src/composables/useRoutePlanning.ts`)
Route planning with offline support:

```typescript
import { useRoutePlanning } from '@/composables/useRoutePlanning';

const {
  routes,
  isLoading,
  isFromCache,
  cacheStatusMessage,
  searchRoutes,
} = useRoutePlanning();

// Search with automatic caching and offline fallback
await searchRoutes('Tahrir Square', 'Cairo Airport', 'fastest');
```

## Usage Examples

### 1. Save a Favorite Place (Offline-First)

```typescript
import { useFavoritePlaces } from '@/composables/useFavoritePlaces';

const { saveFavoritePlace } = useFavoritePlaces();

// Works offline - syncs when back online
await saveFavoritePlace({
  id: crypto.randomUUID(),
  name: 'Home',
  address: 'Nasr City, Cairo',
  lat: 30.0444,
  lng: 31.2357,
  createdAt: Date.now(),
});
```

### 2. Search Routes with Offline Fallback

```typescript
import { useRoutePlanning } from '@/composables/useRoutePlanning';

const { searchRoutes, routes, isFromCache } = useRoutePlanning();

await searchRoutes('Tahrir Square', 'Cairo Airport', 'fastest');

if (isFromCache.value) {
  console.log('Using cached routes from previous search');
}
```

### 3. Check Sync Status

```typescript
import { useOffline } from '@/composables/useOffline';

const { pendingCount, performSync } = useOffline();

if (pendingCount.value > 0) {
  await performSync(); // Manually trigger sync
}
```

### 4. Get Cache Statistics

```typescript
import { getCacheStats } from '@/core/offline/cacheManager';

const stats = await getCacheStats();
console.log(`Cache size: ${stats.totalSize}`);
console.log(`Pending actions: ${stats.pendingActions}`);
```

## Configuration

### Cache Expiration

Route cache expires after 10 minutes by default. Adjust in:
`/src/core/offline/repositories/routesRepository.ts`

```typescript
const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes
```

### Sync Retry Settings

Configure retry behavior in:
`/src/core/offline/syncQueue.ts`

```typescript
const MAX_RETRY_COUNT = 5;
const RETRY_DELAY_MS = 2000;
```

### Recent Searches Limit

Limit in:
`/src/core/offline/repositories/recentSearchesRepository.ts`

```typescript
const MAX_RECENT_SEARCHES = 20;
```

## Security Considerations

### Data NOT Stored in IndexedDB

For security, the following are **never** stored in IndexedDB:

- User passwords
- Authentication tokens (except session identifiers)
- Payment credentials
- Credit card information
- API keys or secrets

### Data Stored in IndexedDB

Safe to cache:

- Route planning results
- Station/stop information
- User preferences (non-sensitive)
- Recent searches (non-PII)
- Saved places
- Ticket information (post-purchase only)

## Monitoring and Debugging

### Enable Debug Logging

Add to browser console:

```javascript
localStorage.setItem('DEBUG_OFFLINE', 'true');
```

### View Pending Actions

```typescript
import { getAllPendingActions } from '@/core/offline/syncQueue';

const pending = await getAllPendingActions();
console.table(pending);
```

### Database Inspection

Use browser DevTools:
1. Open DevTools → Application tab
2. Navigate to IndexedDB → mwasalaty-offline
3. Inspect tables and data

### Force Sync

```typescript
import { performSync } from '@/core/offline/syncService';
await performSync(true); // Force sync even if already running
```

## Migration and Upgrades

Database schema migrations are handled automatically by Dexie. When adding new tables:

```typescript
// In appDb.ts
this.version(4).stores({
  // ... existing tables
  newTable: "id, field1, field2",
});
```

Dexie will automatically migrate existing data to the new schema.

## Performance Considerations

1. **Bulk Operations**: Use `bulkPut()` and `bulkDelete()` for multiple records
2. **Indexed Queries**: Ensure frequently-queried fields are indexed
3. **Cache Cleanup**: Automatic cleanup runs hourly to remove expired data
4. **Lazy Loading**: Use pagination for large result sets

## Testing Offline Behavior

### Chrome DevTools

1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Test app functionality

### Programmatic Testing

```typescript
// Simulate offline
Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
window.dispatchEvent(new Event('offline'));

// Simulate online
Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
window.dispatchEvent(new Event('online'));
```

## Future Enhancements

Potential improvements:

1. **Background Sync API**: Use Service Worker Background Sync
2. **Conflict Resolution**: Implement CRDTs for multi-device sync
3. **Differential Sync**: Only sync changed fields
4. **Compression**: Compress cached data to reduce storage
5. **IndexedDB Quotas**: Monitor and manage storage quotas
6. **Delta Updates**: Incremental data updates instead of full replacements

## Troubleshooting

### Sync Not Working

1. Check network status: `navigator.onLine`
2. Check pending actions count
3. View sync errors in console
4. Try manual sync

### Stale Data

1. Clear cache: `clearAllCache()`
2. Force refresh from network
3. Check cache expiration settings

### Database Errors

1. Check browser console for Dexie errors
2. Try database reset: `resetOfflineDatabase()`
3. Clear browser data and reload

## Support

For issues or questions:
- Check browser console for error messages
- View database state in DevTools
- Check network requests in Network tab
- Review pending actions in sync queue
