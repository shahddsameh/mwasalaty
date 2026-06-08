import { db, type PendingAction } from '@/db/appDb';
import { checkOnline } from './networkStatus';

/**
 * Sync Queue Manager
 * Handles pending actions and syncs them when online
 */

const MAX_RETRY_COUNT = 5;
const RETRY_DELAY_MS = 2000;

export type SyncHandler = (action: PendingAction) => Promise<void>;

const syncHandlers = new Map<string, SyncHandler>();

/**
 * Register a sync handler for a specific entity type
 */
export function registerSyncHandler(entityType: string, handler: SyncHandler) {
  syncHandlers.set(entityType, handler);
}

/**
 * Add a pending action to the sync queue
 */
export async function queuePendingAction(
  actionType: 'create' | 'update' | 'delete',
  entityType: PendingAction['entityType'],
  payload: Record<string, unknown>,
  entityId?: string,
): Promise<void> {
  await db.pendingActions.add({
    actionType,
    entityType,
    entityId,
    payload,
    createdAt: Date.now(),
    retryCount: 0,
  });
}

/**
 * Process a single pending action
 */
async function processPendingAction(action: PendingAction): Promise<boolean> {
  const handler = syncHandlers.get(action.entityType);
  
  if (!handler) {
    console.warn(`No sync handler registered for entity type: ${action.entityType}`);
    return false;
  }

  try {
    await handler(action);
    
    // Success: remove from queue
    if (action.id) {
      await db.pendingActions.delete(action.id);
    }
    
    return true;
  } catch (error) {
    console.error(`Failed to sync action ${action.id}:`, error);
    
    // Update retry count and error message
    if (action.id) {
      await db.pendingActions.update(action.id, {
        retryCount: action.retryCount + 1,
        lastAttemptAt: Date.now(),
        error: error instanceof Error ? error.message : String(error),
      });
    }
    
    return false;
  }
}

/**
 * Process all pending actions in the queue
 */
export async function processSyncQueue(): Promise<{
  processed: number;
  successful: number;
  failed: number;
}> {
  if (!checkOnline()) {
    console.log('Offline: skipping sync queue processing');
    return { processed: 0, successful: 0, failed: 0 };
  }

  const pendingActions = await db.pendingActions
    .where('retryCount')
    .below(MAX_RETRY_COUNT)
    .sortBy('createdAt');

  let successful = 0;
  let failed = 0;

  for (const action of pendingActions) {
    const success = await processPendingAction(action);
    
    if (success) {
      successful++;
    } else {
      failed++;
      
      // Add delay between retries to avoid hammering the server
      if (failed > 0) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }

  return {
    processed: pendingActions.length,
    successful,
    failed,
  };
}

/**
 * Get count of pending actions
 */
export async function getPendingActionCount(): Promise<number> {
  return await db.pendingActions.count();
}

/**
 * Clear all pending actions (use with caution!)
 */
export async function clearPendingActions(): Promise<void> {
  await db.pendingActions.clear();
}

/**
 * Get all pending actions for debugging
 */
export async function getAllPendingActions(): Promise<PendingAction[]> {
  return await db.pendingActions.toArray();
}
