import { createRouter, createWebHistory } from "vue-router";
import Home from "../features/home/pages/Home.vue";
import RouteResults from "../features/trip-planner/pages/RouteResults.vue";
import RouteDetails from "../features/trip-planner/pages/RouteDetails.vue";
import LiveNavigation from "../features/trip-planner/pages/LiveNavigation.vue";
import Saved from "../features/trip-planner/pages/Saved.vue";
import AIAssistant from "../features/ai/pages/AIAssistant.vue";
import AITripPlanner from "../features/ai/pages/AITripPlanner.vue";
import AIPlan from "../features/ai/pages/AIPlan.vue";
import Booking from "../features/tickets/pages/Booking.vue";
import Ticket from "../features/tickets/pages/Ticket.vue";
import PaymentSuccess from "../features/tickets/pages/PaymentSuccess.vue";
import PaymentCancelled from "../features/tickets/pages/PaymentCancelled.vue";
import Auth from "../features/auth/pages/Auth.vue";
import Login from "../features/auth/pages/Login.vue";
import SignUp from "../features/auth/pages/SignUp.vue";
import AuthCallback from "../features/auth/pages/AuthCallback.vue";
import ForgotPassword from "../features/auth/pages/ForgotPassword.vue";
import ResetPassword from "../features/auth/pages/ResetPassword.vue";
import Profile from "../features/account/pages/Profile.vue";
import Settings from "../features/account/pages/Settings.vue";
import Support from "../features/account/pages/Support.vue";
import AllTickets from "../features/tickets/pages/AllTickets.vue";
import OperatorScan from "../features/operator/pages/OperatorScan.vue";
import { ensureAuthInitialized, useAuthState } from "@/services/authState";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home", component: Home },
    { path: "/plan", name: "plan", component: RouteResults },
    { path: "/route-results", name: "route-results", component: RouteResults },
    { path: "/route/:id", name: "route-detail", component: RouteDetails },
    { path: "/route-details", name: "route-details", component: RouteDetails },
    {
      path: "/live-navigation",
      name: "live-navigation",
      component: LiveNavigation,
    },
    { path: "/saved", name: "saved", component: Saved },
    { path: "/ai-assistant", name: "ai-assistant", component: AIAssistant },
    {
      path: "/ai-trip-planner",
      name: "ai-trip-planner",
      component: AITripPlanner,
    },
    { path: "/ai-plan", name: "ai-plan", component: AIPlan },
    { path: "/booking", name: "booking", component: Booking },
    {
      path: "/payment/success",
      name: "payment-success",
      component: PaymentSuccess,
    },
    {
      path: "/payment/cancelled",
      name: "payment-cancelled",
      component: PaymentCancelled,
    },
    { path: "/ticket/:id?", name: "ticket", component: Ticket },
    { path: "/all-tickets", name: "all-tickets", component: AllTickets },
    {
      path: "/operator/scan",
      name: "operator-scan",
      component: OperatorScan,
      meta: { requiresOperator: true },
    },
    { path: "/auth", name: "auth", component: Auth },
    { path: "/login", name: "login", component: Login },
    { path: "/signup", name: "signup", component: SignUp },
    { path: "/auth/callback", name: "auth-callback", component: AuthCallback },
    {
      path: "/forgot-password",
      name: "forgot-password",
      component: ForgotPassword,
    },
    {
      path: "/reset-password",
      name: "reset-password",
      component: ResetPassword,
    },
    {
      path: "/profile",
      name: "profile",
      component: Profile,
      meta: { requiresAuth: true },
    },
    {
      path: "/settings",
      name: "settings",
      component: Settings,
    },
    { path: "/support", name: "support", component: Support },
  ],
});

router.beforeEach(async (to) => {
  if (!to.meta.requiresOperator) return true;

  const operatorSession = localStorage.getItem("mwasalaty:operator-session");
  if (operatorSession) return true;

  return {
    path: "/login",
    query: { redirect: to.fullPath },
  };
});

router.beforeEach(async (to) => {
  await ensureAuthInitialized();
  const { isAuthenticated } = useAuthState();

  if (to.meta.requiresAuth) {
    if (!isAuthenticated.value) {
      return {
        path: "/login",
        query: { redirect: to.fullPath },
      };
    }
  }

  if (["login", "signup", "auth"].includes(String(to.name))) {
    if (isAuthenticated.value) {
      return { path: "/profile" };
    }
  }

  return true;
});

export default router;
