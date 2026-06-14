import { createRouter, createWebHistory } from "vue-router";
import ProfileSelect from "@/features/session/pages/ProfileSelect.vue";
import Dashboard from "@/features/session/pages/Dashboard.vue";
import Scanner from "@/features/scanner/pages/Scanner.vue";
import ResultValid from "@/features/results/pages/ResultValid.vue";
import ResultAlreadyUsed from "@/features/results/pages/ResultAlreadyUsed.vue";
import ResultInvalid from "@/features/results/pages/ResultInvalid.vue";
import ResultNoMatch from "@/features/results/pages/ResultNoMatch.vue";
import ResultAmbiguous from "@/features/results/pages/ResultAmbiguous.vue";
import ResultUnverified from "@/features/results/pages/ResultUnverified.vue";
import TicketDetail from "@/features/ticket/pages/TicketDetail.vue";
import History from "@/features/history/pages/History.vue";
import SyncQueue from "@/features/history/pages/SyncQueue.vue";
import CameraHelp from "@/features/scanner/pages/CameraHelp.vue";
import ShiftSummary from "@/features/session/pages/ShiftSummary.vue";
import Account from "@/features/session/pages/Account.vue";
import { getSelectedProfile } from "@/services/session";
import { profileRouteRedirect } from "@/app/profileNavigation";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "profile-select", component: ProfileSelect },
    { path: "/dashboard", name: "dashboard", component: Dashboard },
    { path: "/scan", name: "scan", component: Scanner },
    { path: "/result/valid", name: "result-valid", component: ResultValid },
    { path: "/result/used", name: "result-used", component: ResultAlreadyUsed },
    { path: "/result/invalid", name: "result-invalid", component: ResultInvalid },
    { path: "/result/no-match", name: "result-no-match", component: ResultNoMatch },
    { path: "/result/ambiguous", name: "result-ambiguous", component: ResultAmbiguous },
    { path: "/result/unverified", name: "result-unverified", component: ResultUnverified },
    { path: "/ticket/:id", name: "ticket-detail", component: TicketDetail, props: true },
    { path: "/history", name: "history", component: History },
    { path: "/sync", name: "sync", component: SyncQueue },
    { path: "/camera-help", name: "camera-help", component: CameraHelp },
    { path: "/shift-summary", name: "shift-summary", component: ShiftSummary },
    { path: "/account", name: "account", component: Account }
  ]
});

router.beforeEach((to) => {
  return profileRouteRedirect(
    to.name,
    to.query,
    getSelectedProfile(),
    navigator.onLine
  ) ?? true;
});
