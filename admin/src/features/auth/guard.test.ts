import { beforeEach, describe, expect, it, vi } from "vitest";
import { router } from "@/app/router";
import * as api from "@/services/api";
import { getToken, setSession } from "@/services/session";

describe("admin auth guard", () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await router.push("/login");
  });

  it("redirects unauthenticated protected navigation to login", async () => {
    await router.push("/dashboard");
    expect(router.currentRoute.value.name).toBe("login");
  });

  it("clears the session and redirects after a 401", async () => {
    setSession({ token: "admtok_test", expiresAt: new Date(Date.now() + 60_000).toISOString() });
    await router.push("/dashboard");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: "ADMIN_UNAUTHORIZED", message: "expired", details: {} } }), { status: 401, headers: { "Content-Type": "application/json" } })));
    await expect(api.getDashboard()).rejects.toMatchObject({ code: "ADMIN_UNAUTHORIZED" });
    expect(getToken()).toBeNull();
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe("login"));
    vi.unstubAllGlobals();
  });
});
