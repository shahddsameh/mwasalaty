import { computed, readonly, ref } from "vue";
import { supabase, type SupabaseAuthSession, type SupabaseAuthUser } from "./supabaseAuth";

const authUser = ref<SupabaseAuthUser | null>(null);
const authSession = ref<SupabaseAuthSession | null>(null);
const authReady = ref(false);

let initPromise: Promise<void> | null = null;
let authSubscription:
  | {
      unsubscribe: () => void;
    }
  | null = null;

function applySession(session: SupabaseAuthSession | null) {
  authSession.value = session;
  authUser.value = session?.user ?? null;
}

export function setAuthSession(session: SupabaseAuthSession | null) {
  applySession(session);
  authReady.value = true;
}

export function clearAuthState() {
  applySession(null);
  authReady.value = true;
}

export async function ensureAuthInitialized() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const { data } = await supabase.auth.getSession();
    applySession(data.session ?? null);

    authSubscription?.unsubscribe();
    authSubscription = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
      authReady.value = true;
      if (session) {
        void import("@/core/offline/syncService").then(({ performSync }) => performSync(true));
      }
    }).data.subscription;

    authReady.value = true;
  })();

  return initPromise;
}

export function useAuthState() {
  return {
    user: readonly(authUser),
    session: readonly(authSession),
    ready: readonly(authReady),
    isAuthenticated: computed(() => !!authSession.value),
    ensureAuthInitialized,
    setAuthSession,
    clearAuthState,
  };
}
