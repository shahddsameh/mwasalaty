<template>
  <main class="min-h-screen bg-background flex items-center justify-center px-4 py-12">
    <section
      class="w-full max-w-md bg-card rounded-2xl border-2 border-border p-8 text-center"
    >
      <template v-if="state !== 'error'">
        <div
          class="w-16 h-16 mx-auto mb-6 rounded-full bg-primary-soft flex items-center justify-center"
        >
          <Loader2 class="w-8 h-8 text-primary animate-spin" />
        </div>
        <h1 class="font-display text-2xl text-foreground mb-2">
          {{ headings[state] }}
        </h1>
        <p class="text-muted-foreground">
          {{ subtexts[state] }}
        </p>
      </template>

      <template v-else>
        <div
          class="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center"
        >
          <AlertTriangle class="w-8 h-8 text-destructive" />
        </div>
        <h1 class="font-display text-2xl text-foreground mb-2">
          We couldn't confirm your payment
        </h1>
        <p class="text-muted-foreground mb-6">{{ errorMessage }}</p>
        <div class="space-y-2">
          <AppButton class="w-full" @click="router.replace('/booking')">
            Try again
          </AppButton>
          <AppButton variant="ghost" class="w-full" @click="router.replace('/')">
            Back to home
          </AppButton>
        </div>
      </template>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { AlertTriangle, Loader2 } from "@lucide/vue";
import AppButton from "@/components/ui/AppButton.vue";
import { confirmCheckoutRedirect, getCheckoutSessionResult, type Ticket } from "@/services/api";
import { storeCurrentTicket } from "@/services/currentTicket";
import { db } from "@/db/appDb";

type State = "verifying" | "issuing" | "error";

const route = useRoute();
const router = useRouter();

const CHECKOUT_SESSION_KEY = "mwasalaty:checkout-session-id";
// PayMob's webhook (and the 3DS step before it) can take well over 16s to land,
// so poll for ~40s before giving up. The webhook is the only thing that issues
// the ticket, so cutting this short strands a paid user on the error screen.
const MAX_ATTEMPTS = 20;
const RETRY_DELAY_MS = 2000;

const state = ref<State>("verifying");
const errorMessage = ref("");
let timer: ReturnType<typeof setTimeout> | null = null;
let cancelled = false;

const headings: Record<Exclude<State, "error">, string> = {
  verifying: "Verifying your payment…",
  issuing: "Payment confirmed — issuing your ticket…",
};
const subtexts: Record<Exclude<State, "error">, string> = {
  verifying: "Please wait while we confirm your payment with PayMob.",
  issuing: "Almost there. Your trip ticket is being prepared.",
};

function queryValue(value: unknown): string | undefined {
  return Array.isArray(value) ? value[0] : typeof value === "string" ? value : undefined;
}

function resolveSessionId(): string | null {
  const fromUrl = queryValue(route.query.merchant_order_id);
  if (fromUrl) return fromUrl;
  try {
    return sessionStorage.getItem(CHECKOUT_SESSION_KEY);
  } catch {
    return null;
  }
}

// Issue the ticket locally and route to it. Shared by the redirect-confirm path
// and the poll fallback.
async function issueAndGo(ticket: Ticket) {
  state.value = "issuing";
  storeCurrentTicket(ticket);
  // Persist the issued ticket so it stays viewable offline (req 9).
  try {
    await db.tickets.put({ ...ticket, savedAt: Date.now() });
  } catch {
    // IndexedDB may be unavailable (private mode); the ticket still
    // renders this session via storeCurrentTicket.
  }
  router.replace(`/ticket/${ticket.ticketId}`);
}

// Flatten Vue's LocationQuery (string | string[] | null) into plain strings so
// the backend can verify PayMob's HMAC over the redirect params.
function flattenQuery(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(route.query)) {
    const v = queryValue(value);
    if (v !== undefined) out[key] = v;
  }
  return out;
}

async function poll(sessionId: string, attempt = 0) {
  if (cancelled) return;
  try {
    const result = await getCheckoutSessionResult(sessionId);
    if (cancelled) return;

    if (result.status === "ready") {
      await issueAndGo(result.ticket);
      return;
    }

    // pending
    if (attempt + 1 >= MAX_ATTEMPTS) {
      fail("Your payment is taking longer than expected. If you were charged, your ticket will appear in All Tickets.");
      return;
    }
    timer = setTimeout(() => poll(sessionId, attempt + 1), RETRY_DELAY_MS);
  } catch (err) {
    if (cancelled) return;
    fail(err instanceof Error ? err.message : "Something went wrong while confirming your payment.");
  }
}

function fail(message: string) {
  errorMessage.value = message;
  state.value = "error";
}

onMounted(async () => {
  // PayMob redirects to this single URL for both success and failure.
  if (queryValue(route.query.success) === "false") {
    router.replace("/payment/cancelled");
    return;
  }

  const sessionId = resolveSessionId();
  if (!sessionId) {
    fail("We couldn't find your checkout session. Please start the booking again.");
    return;
  }

  // Preferred path: PayMob's redirect carries signed (hmac) transaction params.
  // Confirm server-side right away so the ticket is issued even if the webhook
  // is late or never arrives. Fall back to polling on any failure.
  if (queryValue(route.query.hmac)) {
    try {
      const params = flattenQuery();
      // Ensure the backend can locate the session even if the redirect omitted it.
      if (!params.merchant_order_id) params.merchant_order_id = sessionId;
      const { ticket } = await confirmCheckoutRedirect(params);
      if (cancelled) return;
      await issueAndGo(ticket);
      return;
    } catch {
      // Redirect confirmation failed (e.g. HMAC mismatch or transient error);
      // the webhook may still complete it, so fall through to polling.
      if (cancelled) return;
    }
  }

  poll(sessionId);
});

onUnmounted(() => {
  cancelled = true;
  if (timer) clearTimeout(timer);
});
</script>
