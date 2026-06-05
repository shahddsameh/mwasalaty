<template>
  <main class="min-h-screen bg-background pb-20">
    <div class="mx-auto max-w-[720px] px-4 py-6 md:px-6 md:py-8">
      <section class="mb-6">
        <h1 class="font-display text-2xl text-foreground md:text-3xl">
          Operator Scan
        </h1>
        <p class="mt-2 text-sm text-muted-foreground">
          Validate a passenger ticket QR payload from an operator device.
        </p>
      </section>

      <section class="rounded-xl border-2 border-border bg-card p-4 md:p-6">
        <label class="text-sm text-foreground" for="qr-payload">QR payload</label>
        <textarea
          id="qr-payload"
          v-model="qrPayload"
          class="mt-2 min-h-40 w-full rounded-lg border border-border bg-muted p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder='{"ticketId":"ticket_demo","signature":"demo_signature"}'
        />

        <button
          class="mt-4 w-full rounded-lg bg-primary px-4 py-2.5 text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
          :disabled="loading"
          @click="validateTicket"
        >
          {{ loading ? "Validating..." : "Validate ticket" }}
        </button>

        <div
          v-if="message"
          class="mt-4 rounded-lg border border-border bg-secondary p-3 text-sm text-foreground"
        >
          {{ message }}
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useApi } from "@/composables/useApi";

const qrPayload = ref("");
const message = ref("");
const { loading, post } = useApi();

async function validateTicket() {
  message.value = "";

  try {
    const payload = JSON.parse(qrPayload.value);
    const result = await post<{ status: string; message?: string }>(
      "/api/tickets/scan/validate",
      {
        qrPayload: payload,
        operatorId: "operator_demo",
        deviceId: "web_scanner",
        validatedAt: new Date().toISOString(),
      },
    );
    message.value = result.message ?? `Scan result: ${result.status}`;
  } catch (error) {
    message.value =
      error instanceof Error ? error.message : "Could not validate ticket.";
  }
}
</script>
