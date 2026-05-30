import { createRouter, createWebHistory } from 'vue-router'
import Home from './screens/Home.vue'
import RouteResults from './screens/RouteResults.vue'
import RouteDetails from './screens/RouteDetails.vue'
import LiveNavigation from './screens/LiveNavigation.vue'
import Saved from './screens/Saved.vue'
import AIAssistant from './screens/AIAssistant.vue'
import AITripPlanner from './screens/AITripPlanner.vue'
import AIPlan from './screens/AIPlan.vue'
import Booking from './screens/Booking.vue'
import Ticket from './screens/Ticket.vue'
import Auth from './screens/Auth.vue'
import Login from './screens/Login.vue'
import SignUp from './screens/SignUp.vue'
import ForgotPassword from './screens/ForgotPassword.vue'
import Profile from './screens/Profile.vue'
import Settings from './screens/Settings.vue'
import Support from './screens/Support.vue'
import AllTickets from './screens/AllTickets.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/route-results', name: 'route-results', component: RouteResults },
    { path: '/route-details', name: 'route-details', component: RouteDetails },
    { path: '/live-navigation', name: 'live-navigation', component: LiveNavigation },
    { path: '/saved', name: 'saved', component: Saved },
    { path: '/ai-assistant', name: 'ai-assistant', component: AIAssistant },
    { path: '/ai-trip-planner', name: 'ai-trip-planner', component: AITripPlanner },
    { path: '/ai-plan', name: 'ai-plan', component: AIPlan },
    { path: '/booking', name: 'booking', component: Booking },
    { path: '/ticket', name: 'ticket', component: Ticket },
    { path: '/all-tickets', name: 'all-tickets', component: AllTickets },
    { path: '/auth', name: 'auth', component: Auth },
    { path: '/login', name: 'login', component: Login },
    { path: '/signup', name: 'signup', component: SignUp },
    { path: '/forgot-password', name: 'forgot-password', component: ForgotPassword },
    { path: '/profile', name: 'profile', component: Profile },
    { path: '/settings', name: 'settings', component: Settings },
    { path: '/support', name: 'support', component: Support },
  ],
})

export default router
