<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="16" style="margin-bottom:16px">
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align:center">
            <div style="font-size:32px;font-weight:bold;color:#409EFF">{{ stats.totalCandidates }}</div>
            <div style="color:#909399">候选人总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align:center">
            <div style="font-size:32px;font-weight:bold;color:#67C23A">{{ stats.totalPositions }}</div>
            <div style="color:#909399">招聘中岗位</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align:center">
            <div style="font-size:32px;font-weight:bold;color:#E6A23C">{{ stats.monthInterviews }}</div>
            <div style="color:#909399">本月面试</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align:center">
            <div style="font-size:32px;font-weight:bold;color:#F56C6C">{{ stats.totalOffers }}</div>
            <div style="color:#909399">已发Offer</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <!-- 招聘漏斗 -->
      <el-col :span="14">
        <el-card>
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-weight:600">📊 招聘漏斗</span>
              <el-button size="small" @click="handleExport('candidates')">导出候选人</el-button>
            </div>
          </template>
          <div style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:10px 0">
            <div v-for="(stage, index) in funnelStages" :key="stage.key" style="width:100%;display:flex;align-items:center;justify-content:center;gap:12px">
              <div
                :style="{
                  width: Math.max(15, (stage.count / maxFunnelCount) * 80) + '%',
                  background: funnelColors[index],
                  height: '38px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  transition: 'all 0.3s'
                }"
              >
                {{ stage.count }}
              </div>
              <div style="width:90px;font-size:13px;color:#606266">{{ stage.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 最近面试 -->
      <el-col :span="10">
        <el-card>
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-weight:600">📅 最近面试</span>
              <el-button size="small" @click="handleExport('interviews')">导出面试</el-button>
            </div>
          </template>
          <el-table :data="recentInterviews" size="small" v-if="recentInterviews.length">
            <el-table-column label="候选人" min-width="80">
              <template #default="{ row }">{{ row.candidateId?.name || '-' }}</template>
            </el-table-column>
            <el-table-column label="阶段" width="80">
              <template #default="{ row }">{{ getStageName(row.stage) }}</template>
            </el-table-column>
            <el-table-column label="评分" width="60">
              <template #default="{ row }">
                <span :style="{ color: row.score >= 80 ? '#67C23A' : row.score >= 60 ? '#E6A23C' : '#F56C6C' }">
                  {{ row.score || '-' }}
                </span>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无面试记录" :image-size="60" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 导出按钮区 -->
    <el-card style="margin-top:16px">
      <template #header><span style="font-weight:600">📤 数据导出</span></template>
      <el-space>
        <el-button type="primary" @click="handleExport('candidates')">导出候选人Excel</el-button>
        <el-button type="success" @click="handleExport('positions')">导出岗位Excel</el-button>
        <el-button type="warning" @click="handleExport('interviews')">导出面试记录Excel</el-button>
      </el-space>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { dashboardAPI } from '../api.js'
import { ElMessage } from 'element-plus'

const stats = ref({ totalCandidates: 0, totalPositions: 0, monthInterviews: 0, totalOffers: 0 })
const funnel = ref([])
const recentInterviews = ref([])

const funnelStages = computed(() => {
  const order = [
    { key: 'resume_screen', label: '简历初筛' },
    { key: 'interview_1', label: '一面' },
    { key: 'interview_2', label: '二面' },
    { key: 'interview_3', label: '终面' },
    { key: 'offer', label: 'Offer' },
    { key: 'onboard', label: '待入职' }
  ]
  return order.map(s => ({
    ...s,
    count: funnel.value.find(f => f._id === s.key)?.count || 0
  }))
})

const maxFunnelCount = computed(() => Math.max(1, ...funnel.value.map(f => f.count)))

const funnelColors = ['#909399', '#409EFF', '#E6A23C', '#F56C6C', '#67C23A', '#000000']

const getStageName = (stage) => ({
  resume_screen: '初筛', interview_1: '一面', interview_2: '二面',
  interview_3: '终面', offer: 'Offer', onboard: '待入职', rejected: '淘汰'
}[stage] || stage)

const loadDashboard = async () => {
  try {
    const res = await dashboardAPI.getDashboard()
    if (res.success) {
      stats.value = res.data.stats
      funnel.value = res.data.funnel || []
      recentInterviews.value = res.data.recentInterviews || []
    }
  } catch (e) {
    console.error(e)
  }
}

const handleExport = (type) => {
  const token = localStorage.getItem('token')
  const url = `/api/dashboard/export?type=${type}`
  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then(res => {
      if (!res.ok) throw new Error('导出失败')
      return res.blob()
    })
    .then(blob => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${type}_${new Date().toISOString().split('T')[0]}.xlsx`
      a.click()
      URL.revokeObjectURL(a.href)
      ElMessage.success('导出成功')
    })
    .catch(() => ElMessage.error('导出失败'))
}

onMounted(loadDashboard)
</script>

<style scoped>
.dashboard { padding: 4px; }
</style>
