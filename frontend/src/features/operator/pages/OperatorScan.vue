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

        <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="text-sm text-foreground" for="scanner-profile">
              Scanner profile
            </label>
            <select
              id="scanner-profile"
              v-model="scannerProfileId"
              class="mt-2 w-full rounded-lg border border-border bg-muted p-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="scanner_subway_001">Subway Scanner</option>
              <option value="scanner_subway_m2">Subway M2</option>
              <option value="scanner_bus_001">Bus Scanner</option>
            </select>
          </div>

          <div>
            <label class="text-sm text-foreground" for="stations-traveled">
              Stations traveled (metro)
            </label>
            <input
              id="stations-traveled"
              v-model="stationsTraveled"
              type="number"
              min="1"
              inputmode="numeric"
              placeholder="e.g. 12"
              class="mt-2 w-full rounded-lg border border-border bg-muted p-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="mt-1 text-xs text-muted-foreground">
              Rejected if it exceeds the tier the ticket was paid for. Leave blank
              for buses.
            </p>
          </div>
        </div>

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
const scannerProfileId = ref("scanner_subway_001");
const stationsTraveled = ref("");
const message = ref("");
const { loading, post } = useApi();

async function validateTicket() {
  message.value = "";

  try {
    const payload = JSON.parse(qrPayload.value);
    // Only send a numeric station count when the operator entered one; an empty
    // field (or a bus scan) leaves the metro station limit unchecked.
    const stations = Number.parseInt(stationsTraveled.value, 10);
    const result = await post<{ status: string; message?: string }>(
      "/api/tickets/scan/validate",
      {
        qrPayload: payload,
        scannerProfileId: scannerProfileId.value,
        ...(Number.isFinite(stations) && stations > 0
          ? { stationsTraversed: stations }
          : {}),
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
