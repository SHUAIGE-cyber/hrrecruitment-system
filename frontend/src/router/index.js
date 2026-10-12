import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue')
    },
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('../views/Dashboard.vue'),
      meta: { title: '仪表盘' }
    },
    {
      path: '/positions',
      name: 'Positions',
      component: () => import('../views/Positions.vue'),
      meta: { title: '岗位管理' }
    },
    {
      path: '/candidates',
      name: 'Candidates',
      component: () => import('../views/Candidates.vue'),
      meta: { title: '候选人管理' }
    },
    {
      path: '/candidates/:id',
      name: 'CandidateDetail',
      component: () => import('../views/CandidateDetail.vue'),
      meta: { title: '候选人详情' }
    },
    {
      path: '/kanban',
      name: 'Kanban',
      component: () => import('../views/Kanban.vue'),
      meta: { title: '面试看板' }
    },
    {
      path: '/offers',
      name: 'Offers',
      component: () => import('../views/Offers.vue'),
      meta: { title: 'Offer管理' }
    },
    {
      path: '/certificates',
      name: 'Certificates',
      component: () => import('../views/Certificates.vue'),
      meta: { title: '证书管理' }
    },
    {
      path: '/users',
      name: 'Users',
      component: () => import('../views/Users.vue'),
      meta: { title: '用户管理' }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard'
    }
  ]
})

export default router
