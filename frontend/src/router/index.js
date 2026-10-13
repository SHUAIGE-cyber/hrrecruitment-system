import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../views/Layout.vue'

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
      component: Layout,
      redirect: () => {
        // 部门主管默认进入招聘需求页
        try {
          const user = JSON.parse(localStorage.getItem('user') || 'null')
          if (user?.role === 'dept_manager') return '/hiring-requests'
        } catch (e) {}
        return '/dashboard'
      },
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('../views/Dashboard.vue'),
          meta: { title: '仪表盘', roles: ['super_admin', 'hr', 'interviewer'] }
        },
        {
          path: 'hiring-requests',
          name: 'HiringRequests',
          component: () => import('../views/HiringRequests.vue'),
          meta: { title: '招聘需求' }
        },
        {
          path: 'positions',
          name: 'Positions',
          component: () => import('../views/Positions.vue'),
          meta: { title: '岗位管理', roles: ['super_admin', 'hr'] }
        },
        {
          path: 'candidates',
          name: 'Candidates',
          component: () => import('../views/Candidates.vue'),
          meta: { title: '候选人管理', roles: ['super_admin', 'hr', 'interviewer'] }
        },
        {
          path: 'candidates/:id',
          name: 'CandidateDetail',
          component: () => import('../views/CandidateDetail.vue'),
          meta: { title: '候选人详情', roles: ['super_admin', 'hr', 'interviewer'] }
        },
        {
          path: 'kanban',
          name: 'Kanban',
          component: () => import('../views/Kanban.vue'),
          meta: { title: '面试看板', roles: ['super_admin', 'hr', 'interviewer'] }
        },
        {
          path: 'offers',
          name: 'Offers',
          component: () => import('../views/Offers.vue'),
          meta: { title: 'Offer管理', roles: ['super_admin', 'hr'] }
        },
        {
          path: 'certificates',
          name: 'Certificates',
          component: () => import('../views/Certificates.vue'),
          meta: { title: '证书管理', roles: ['super_admin', 'hr', 'interviewer'] }
        },
        {
          path: 'users',
          name: 'Users',
          component: () => import('../views/Users.vue'),
          meta: { title: '用户管理', roles: ['super_admin'] }
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

// 路由守卫：权限控制
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  // 未登录 → 去登录页
  if (!token && to.path !== '/login') {
    return next('/login')
  }

  // 已登录访问登录页 → 回首页
  if (token && to.path === '/login') {
    return next('/')
  }

  // 角色权限检查
  if (to.meta?.roles) {
    let user = null
    try {
      user = JSON.parse(localStorage.getItem('user') || 'null')
    } catch (e) {}

    const role = user?.role
    if (role && !to.meta.roles.includes(role)) {
      // 无权限 → 部门主管去招聘需求，其他人去仪表盘
      return next(role === 'dept_manager' ? '/hiring-requests' : '/dashboard')
    }
  }

  next()
})

export default router
