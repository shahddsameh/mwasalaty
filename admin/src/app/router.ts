import { createRouter, createWebHistory } from "vue-router";
import Login from "@/features/auth/pages/Login.vue";
import Dashboard from "@/features/dashboard/pages/Dashboard.vue";
import StopList from "@/features/stops/pages/StopList.vue";
import StopForm from "@/features/stops/pages/StopForm.vue";
import StationList from "@/features/stations/pages/StationList.vue";
import StationForm from "@/features/stations/pages/StationForm.vue";
import { isAuthenticated } from "@/services/session";
import { onUnauthorized } from "@/services/api";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/login", name: "login", component: Login },
    { path: "/", redirect: "/dashboard" },
    { path: "/dashboard", name: "dashboard", component: Dashboard },
    { path: "/stops", name: "stops", component: StopList },
    { path: "/stops/new", name: "stop-new", component: StopForm },
    { path: "/stops/:id", name: "stop-edit", component: StopForm, props: true },
    { path: "/stations", name: "stations", component: StationList },
    { path: "/stations/new", name: "station-new", component: StationForm },
    { path: "/stations/:id", name: "station-edit", component: StationForm, props: true }
  ]
});

router.beforeEach((to) => {
  if (to.name !== "login" && !isAuthenticated()) return { name: "login" };
  if (to.name === "login" && isAuthenticated()) return { name: "dashboard" };
  return true;
});
onUnauthorized(() => void router.push({ name: "login", query: { message: "sessionExpired" } }));
