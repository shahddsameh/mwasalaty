import { db, type RecentSearchRecord } from '@/db/appDb';
import { queuePendingAction, registerSyncHandler } from '../syncQueue';

/**
 * Recent Searches Repository
 * Implements offline-first pattern for recent searches
 */

const MAX_RECENT_SEARCHES = 20;

export interface RecentSearchesResult {
  data: RecentSearchRecord[];
  source: 'cache' | 'network';
}

/**
 * Get recent searches (offline-first)
 */
export async function getRecentSearches(limit = 10): Promise<RecentSearchesResult> {
  const searches = await db.recentSearches
    .orderBy('searchedAt')
    .reverse()
    .limit(limit)
    .toArray();

  return {
    data: searches,
    source: 'cache',
  };
}

/**
 * Add a recent search
 */
export async function addRecentSearch(
  search: Omit<RecentSearchRecord, 'id'>,
): Promise<void> {
  // Check for duplicate (same from/to/filter)
  const existing = await db.recentSearches
    .where('[from+to+filter]')
    .equals([search.from, search.to, search.filter])
    .first();

  if (existing && existing.id) {
    // Update timestamp of existing search
    await db.recentSearches.update(existing.id, {
      searchedAt: Date.now(),
    });
  } else {
    // Add new search
    await db.recentSearches.add({
      ...search,
      searchedAt: Date.now(),
    });

    // Keep only the most recent N searches
    const allSearches = await db.recentSearches
      .orderBy('searchedAt')
      .reverse()
      .toArray();

    if (allSearches.length > MAX_RECENT_SEARCHES) {
      const toDelete = allSearches.slice(MAX_RECENT_SEARCHES);
      const idsToDelete = toDelete.map(s => s.id).filter(Boolean) as number[];
      await db.recentSearches.bulkDelete(idsToDelete);
    }
  }

  // Recent searches are local-only by default, no sync needed
  // If you want to sync to backend, uncomment:
  // await queuePendingAction('create', 'recentSearch', search);
}

/**
 * Clear recent searches
 */
export async function clearRecentSearches(): Promise<void> {
  await db.recentSearches.clear();
}

/**
 * Remove a specific recent search
 */
export async function removeRecentSearch(id: number): Promise<void> {
  await db.recentSearches.delete(id);
}

/**
 * Sync handler for recent searches (optional)
 */
async function syncRecentSearchAction(action: any): Promise<void> {
  // Recent searches are typically local-only
  // Implement backend sync if needed
  console.log(`[Sync] RecentSearch ${action.actionType}:`, action.payload);
}

// Register the sync handler (optional)
registerSyncHandler('recentSearch', syncRecentSearchAction);
