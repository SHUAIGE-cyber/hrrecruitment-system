import axios from 'axios'
import { ElMessage } from 'element-plus'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
api.interceptors.response.use(
  response => response.data,
  error => {
    const { response } = error
    if (response) {
      switch (response.status) {
        case 401:
          // 只在非登录请求时跳转
          if (!error.config?.url?.includes('/auth/login')) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            window.location.href = '/login'
          }
          break
        case 403:
          ElMessage.error('权限不足')
          break
        case 404:
          ElMessage.error('请求资源不存在')
          break
        case 500:
          ElMessage.error('服务器错误')
          break
        default:
          ElMessage.error(response.data?.message || '请求失败')
      }
    } else {
      ElMessage.error('网络错误，请检查连接')
    }
    return Promise.reject(error)
  }
)

export default api

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updatePassword: (data) => api.put('/auth/password', data)
}

export const positionAPI = {
  list: (params) => api.get('/positions', { params }),
  get: (id) => api.get(`/positions/${id}`),
  create: (data) => api.post('/positions', data),
  update: (id, data) => api.put(`/positions/${id}`, data),
  delete: (id) => api.delete(`/positions/${id}`)
}

export const candidateAPI = {
  list: (params) => api.get('/candidates', { params }),
  get: (id) => api.get(`/candidates/${id}`),
  create: (data) => api.post('/candidates', data),
  update: (id, data) => api.put(`/candidates/${id}`, data),
  delete: (id) => api.delete(`/candidates/${id}`),
  upload: (formData) => api.post('/candidates/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  search: (keyword) => api.get(`/candidates/search/${keyword}`),
  matchScore: (candidateId, positionId) => api.post(`/candidates/${candidateId}/match/${positionId}`),
  generateQuestions: (candidateId, positionId, stage) =>
    api.post(`/candidates/${candidateId}/interview-questions/${positionId}`, { stage })
}

export const interviewAPI = {
  list: (params) => api.get('/interviews', { params }),
  get: (id) => api.get(`/interviews/${id}`),
  create: (data) => api.post('/interviews', data),
  update: (id, data) => api.put(`/interviews/${id}`, data),
  delete: (id) => api.delete(`/interviews/${id}`),
  summarize: (id) => api.post(`/interviews/${id}/summarize`)
}

export const offerAPI = {
  list: (params) => api.get('/offers', { params }),
  get: (id) => api.get(`/offers/${id}`),
  create: (formData) => api.post('/offers', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.put(`/offers/${id}`, data),
  delete: (id) => api.delete(`/offers/${id}`),
  approve: (id, data) => api.post(`/offers/${id}/approve`, data)
}

export const certificateAPI = {
  list: (params) => api.get('/certificates', { params }),
  create: (formData) => api.post('/certificates', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.put(`/certificates/${id}`, data),
  delete: (id) => api.delete(`/certificates/${id}`)
}

export const dashboardAPI = {
  getDashboard: () => api.get('/dashboard/dashboard'),
  exportData: (type) => {
    const token = localStorage.getItem('token')
    return `${window.location.origin}/api/dashboard/export?type=${type}`
  }
}

export const userAPI = {
  list: (params) => api.get('/users', { params }),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`)
}
