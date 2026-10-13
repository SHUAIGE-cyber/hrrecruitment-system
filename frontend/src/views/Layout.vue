<template>
  <el-container style="height: 100vh">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '220px'" class="sidebar">
      <div class="logo">
        <el-icon size="28"><Briefcase /></el-icon>
        <span v-show="!isCollapse">招聘管理</span>
      </div>
      <el-menu
        :default-active="route.path"
        :collapse="isCollapse"
        :collapse-transition="false"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
      >
        <el-menu-item index="/dashboard" v-if="!isDeptManager">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>仪表盘</template>
        </el-menu-item>

        <el-menu-item index="/hiring-requests">
          <el-icon><Tickets /></el-icon>
          <template #title>招聘需求</template>
        </el-menu-item>

        <el-menu-item index="/positions" v-if="canAccess('super_admin', 'hr')">
          <el-icon><Document /></el-icon>
          <template #title>岗位管理</template>
        </el-menu-item>

        <el-menu-item index="/candidates" v-if="!isDeptManager">
          <el-icon><User /></el-icon>
          <template #title>候选人管理</template>
        </el-menu-item>

        <el-menu-item index="/kanban" v-if="!isDeptManager">
          <el-icon><Operation /></el-icon>
          <template #title>面试看板</template>
        </el-menu-item>

        <el-menu-item index="/offers" v-if="canAccess('super_admin', 'hr')">
          <el-icon><Promotion /></el-icon>
          <template #title>Offer管理</template>
        </el-menu-item>

        <el-menu-item index="/certificates" v-if="!isDeptManager">
          <el-icon><Certificate /></el-icon>
          <template #title>证书管理</template>
        </el-menu-item>

        <el-menu-item index="/users" v-if="canAccess('super_admin')">
          <el-icon><Setting /></el-icon>
          <template #title>用户管理</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="isCollapse = !isCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <span class="page-title">{{ route.meta.title || '首页' }}</span>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" icon="UserFilled" />
              <span class="username">{{ userName }}</span>
              <el-tag size="small" :type="roleTagType" effect="dark">{{ roleName }}</el-tag>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox } from 'element-plus'

const router = useRouter()
const route = useRoute()
const isCollapse = ref(false)

const user = computed(() => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')
  } catch {
    return null
  }
})

const userName = computed(() => user.value?.realName || user.value?.username || '用户')
const roleName = computed(() => {
  const names = { super_admin: '管理员', hr: 'HR', interviewer: '面试官', dept_manager: '部门主管' }
  return names[user.value?.role] || ''
})
const roleTagType = computed(() => {
  const types = { super_admin: '', hr: 'success', interviewer: 'warning', dept_manager: 'primary' }
  return types[user.value?.role] || ''
})
const canAccess = (...roles) => roles.includes(user.value?.role)
const isDeptManager = computed(() => user.value?.role === 'dept_manager')

const handleCommand = async (command) => {
  if (command === 'logout') {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', { type: 'warning' })
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.replace('/login')
  }
}
</script>

<style scoped>
.sidebar {
  background: #304156;
  transition: width 0.3s;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: white;
  font-size: 18px;
  font-weight: 600;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.header {
  background: white;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: #606266;
}

.collapse-btn:hover {
  color: #409EFF;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.username {
  font-size: 14px;
  color: #303133;
}

.main {
  background: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
}
</style>
