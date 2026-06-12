# Offline-First Quick Start Guide

## What's New?

The Mwaslaty PWA now works offline! Here's what you can do without an internet connection:

✅ View previously searched routes
✅ Access saved favorite places
✅ Browse recent searches
✅ View saved trips
✅ See your tickets

When you're back online, all changes sync automatically.

## For Developers

### Quick Integration

#### 1. Use Existing Composables (Already Updated)

Your existing code continues to work, now with offline support:

```typescript
// Favorite places - now works offline!
import { useFavoritePlaces } from '@/composables/useFavoritePlaces';

const { favoritePlaces, saveFavoritePlace } = useFavoritePlaces();

// Recent searches - already offline-only
import { useRecentSearches } from '@/composables/useRecentSearches';

const { recentSearches, addRecentSearch } = useRecentSearches();

// Saved trips - now syncs when online
import { useSavedTrips } from '@/composables/useSavedTrips';

const { savedTrips, saveTrip } = useSavedTrips();
```

#### 2. Route Planning with Offline Support

Use the new route planning composable:

```typescript
import { useRoutePlanning } from '@/composables/useRoutePlanning';

const { 
  routes, 
  isLoading, 
  isFromCache,
  cacheStatusMessage,
  searchRoutes 
} = useRoutePlanning();

// Search routes (works offline if previously searched)
await searchRoutes('Tahrir Square', 'Cairo Airport', 'fastest');

// Show cache indicator
if (isFromCache.value) {
  console.log(cacheStatusMessage.value);
  // "Cached 5 minutes ago"
}
```

#### 3. Show Offline/Sync Status

The `OfflineIndicator` component is already added to the app. To use offline state in your components:

```typescript
import { useOffline } from '@/composables/useOffline';

const { 
  isOffline, 
  syncStatus,
  offlineMessage,
  syncMessage,
  performSync 
} = useOffline();
```

```vue
<template>
  <div v-if="isOffline" class="offline-warning">
    {{ offlineMessage }}
  </div>
  
  <div v-if="syncMessage" class="sync-status">
    {{ syncMessage }}
  </div>
  
  <button 
    v-if="hasPendingChanges" 
    @click="performSync()"
  >
    Sync Now
  </button>
</template>
```

### Common Patterns

#### Pattern 1: Show Cache Status

```typescript
const { isFromCache, cacheStatusMessage } = useRoutePlanning();

// In template
<div v-if="isFromCache" class="cache-notice">
  {{ cacheStatusMessage }}
</div>
```

#### Pattern 2: Handle Offline Errors Gracefully

```typescript
try {
  await searchRoutes(from, to, filter);
} catch (error) {
  if (!navigator.onLine) {
    // User-friendly offline message
    showError('No cached routes available. Please try again when online.');
  } else {
    // Other error
    showError(error.message);
  }
}
```

#### Pattern 3: Optimistic UI Updates

```typescript
// The repositories handle this automatically!
const { saveFavoritePlace } = useFavoritePlaces();

// This updates UI immediately and syncs in background
await saveFavoritePlace(newPlace);

// UI is already updated - no need to wait for sync
```

### Direct Repository Access (Advanced)

For more control, use repositories directly:

```typescript
import { 
  getFavoritePlaces,
  saveFavoritePlace,
} from '@/core/offline/repositories/favoritePlacesRepository';

const result = await getFavoritePlaces();
console.log('Data source:', result.source); // 'cache' or 'network'
console.log('Places:', result.data);
```

### Cache Management

```typescript
import { 
  getCacheStats,
  cleanupCache,
} from '@/core/offline/cacheManager';

// View cache statistics
const stats = await getCacheStats();
console.log(`Cache size: ${stats.totalSize}`);
console.log(`Pending syncs: ${stats.pendingActions}`);

// Clean up expired cache
await cleanupCache();
```

## Testing Offline Mode

### In Chrome DevTools

1. Open DevTools (F12)
2. Go to Network tab
3. Change throttling dropdown to "Offline"
4. Reload the app and test functionality

### Programmatic Testing

```typescript
// Force offline state
window.dispatchEvent(new Event('offline'));

// Force online state
window.dispatchEvent(new Event('online'));
```

## What Gets Cached?

### Automatically Cached
- Route search results (10-minute expiration)
- Favorite places (permanent until deleted)
- Recent searches (last 20 searches)
- Saved trips (permanent until deleted)
- Tickets (permanent until deleted)

### Not Cached (Security)
- Passwords
- Payment credentials
- Auth tokens
- API keys

## Sync Behavior

### When Sync Happens
1. **App Startup**: Syncs pending changes if online
2. **Network Reconnection**: Automatic sync when connection returns
3. **Periodic**: Every 5 minutes if changes are pending
4. **Manual**: User clicks "Sync" button

### Sync Indicators
- **Syncing**: Blue banner with spinning icon
- **Pending**: Shows count of unsynced changes
- **Success**: Brief "Synced" message
- **Error**: Red banner with error message

## Migration from Old Code

### Before (Direct IndexedDB)
```typescript
// Old way
await db.favoritePlaces.put(place);
await db.favoritePlaces.delete(id);
```

### After (Offline-First)
```typescript
// New way - same API, but now syncs!
const { saveFavoritePlace, removeFavoritePlace } = useFavoritePlaces();

await saveFavoritePlace(place); // Syncs in background
await removeFavoritePlace(id);   // Queues deletion
```

No breaking changes! Existing code works as before, now with sync support.

## FAQ

### Q: Will my existing data be lost?
**A:** No. The database schema upgrades automatically preserve existing data.

### Q: What if sync fails?
**A:** The system retries up to 5 times with exponential backoff. After that, changes remain in the queue until manually synced.

### Q: Can users see pending changes?
**A:** Yes, the offline indicator shows the count of pending changes.

### Q: How do I force a sync?
**A:**
```typescript
const { performSync } = useOffline();
await performSync();
```

### Q: How much storage is used?
**A:**
```typescript
const { getCacheStats } = useOffline();
const stats = await getCacheStats();
console.log(stats.totalSize);
```

### Q: Can I disable offline mode?
**A:** The offline features are always active, but you can clear the cache:
```typescript
import { clearAllCache } from '@/core/offline/cacheManager';
await clearAllCache();
```

## Next Steps

1. ✅ Test offline functionality in DevTools
2. ✅ Add cache status indicators to your UI
3. ✅ Handle offline errors gracefully
4. ✅ Monitor cache size and cleanup as needed
5. ✅ Update user documentation about offline features

## Getting Help

- **Check Console**: Detailed logs for debugging
- **DevTools**: View IndexedDB contents
- **Network Tab**: See which requests are cached
- **Documentation**: See `OFFLINE_ARCHITECTURE.md` for details

## Example Component

Here's a complete example using offline features:

```vue
<template>
  <div class="route-search">
    <!-- Offline warning -->
    <div v-if="isOffline" class="alert alert-warning">
      {{ offlineMessage }}
    </div>

    <!-- Cache status -->
    <div v-if="isFromCache && cacheStatusMessage" class="cache-notice">
      {{ cacheStatusMessage }}
    </div>

    <!-- Search form -->
    <form @submit.prevent="handleSearch">
      <input v-model="from" placeholder="From" />
      <input v-model="to" placeholder="To" />
      <button type="submit" :disabled="isLoading">
        {{ isLoading ? 'Searching...' : 'Search' }}
      </button>
    </form>

    <!-- Results -->
    <div v-if="hasRoutes">
      <div v-for="route in routes" :key="route.id">
        {{ route.summary }}
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="alert alert-error">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoutePlanning } from '@/composables/useRoutePlanning';
import { useOffline } from '@/composables/useOffline';

const from = ref('');
const to = ref('');

const {
  routes,
  hasRoutes,
  isLoading,
  error,
  isFromCache,
  cacheStatusMessage,
  searchRoutes,
} = useRoutePlanning();

const { isOffline, offlineMessage } = useOffline();

async function handleSearch() {
  await searchRoutes(from.value, to.value, 'fastest');
}
</script>
```

That's it! Your app now works offline. 🎉
