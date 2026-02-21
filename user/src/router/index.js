import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Trading from '../views/Trading.vue'
import Admin from '../views/Admin.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      component: Login
    },
    {
      path: '/trading',
      component: Trading
    },
    {
      path: '/admin',
      component: Admin
    }
  ]
})

export default router
