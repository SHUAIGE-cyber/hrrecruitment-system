import { defineStore } from 'pinia'
import { authAPI } from '../api.js'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: null,
    isLoggedIn: !!localStorage.getItem('token')
  }),
  actions: {
    async login(username, password) {
      try {
        const res = await authAPI.login({ username, password })
        if (res && res.success) {
          this.token = res.data.token
          this.user = res.data.user
          this.isLoggedIn = true
          localStorage.setItem('token', res.data.token)
          localStorage.setItem('user', JSON.stringify(res.data.user))
          return { success: true }
        }
        return { success: false, message: res?.message || '登录失败' }
      } catch (e) {
        return { success: false, message: '网络错误' }
      }
    },
    logout() {
      this.token = ''
      this.user = null
      this.isLoggedIn = false
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }
})
