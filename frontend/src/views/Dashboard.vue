<template>
  <div class="dashboard">
    <h2 style="margin-bottom:20px">📊 招聘仪表盘</h2>

    <!-- 统计卡片 -->
    <el-row :gutter="16" style="margin-bottom:20px">
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

    <!-- 快捷入口 -->
    <el-row :gutter="16">
      <el-col :span="6">
        <el-card shadow="hover" style="cursor:pointer" @click="$router.push('/positions')">
          <div style="text-align:center">
            <el-icon size="48" color="#409EFF"><Document /></el-icon>
            <div style="margin-top:10px;font-size:14px">岗位管理</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" style="cursor:pointer" @click="$router.push('/candidates')">
          <div style="text-align:center">
            <el-icon size="48" color="#67C23A"><User /></el-icon>
            <div style="margin-top:10px;font-size:14px">候选人管理</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" style="cursor:pointer" @click="$router.push('/kanban')">
          <div style="text-align:center">
            <el-icon size="48" color="#E6A23C"><Operation /></el-icon>
            <div style="margin-top:10px;font-size:14px">面试看板</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" style="cursor:pointer" @click="$router.push('/offers')">
          <div style="text-align:center">
            <el-icon size="48" color="#F56C6C"><Promotion /></el-icon>
            <div style="margin-top:10px;font-size:14px">Offer管理</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-divider />

    <!-- 功能说明 -->
    <el-card>
      <template #header><span>🚀 系统功能</span></template>
      <el-row :gutter="20">
        <el-col :span="12">
          <h4>✅ 已完成功能</h4>
          <ul style="line-height:2">
            <li>岗位管理 - 新增/编辑/停用岗位</li>
            <li>候选人管理 - 手动录入 + 简历上传</li>
            <li>面试看板 - 拖拽式流程管理</li>
            <li>Offer管理 - 新建Offer + 审批流</li>
            <li>证书上传 - AI提取证书信息</li>
            <li>仪表盘 - 招聘漏斗 + 数据导出</li>
            <li>权限管理 - 管理员/HR/面试官</li>
          </ul>
        </el-col>
        <el-col :span="12">
          <h4>🤖 AI能力</h4>
          <ul style="line-height:2">
            <li>简历解析 - 自动提取结构化信息</li>
            <li>JD匹配打分 - 输出匹配理由</li>
            <li>生成面试题 - 根据JD+简历生成</li>
            <li>面试总结 - AI自动整理手记</li>
            <li>证书识别 - 提取有效期</li>
          </ul>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { dashboardAPI } from '../api.js'

const router = useRouter()
const stats = ref({
  totalCandidates: 0,
  totalPositions: 0,
  monthInterviews: 0,
  totalOffers: 0
})

const loadStats = async () => {
  try {
    const res = await dashboardAPI.getDashboard()
    if (res.success) {
      stats.value = res.data.stats
    }
  } catch (e) {
    console.log('Dashboard load error:', e)
  }
}

onMounted(loadStats)
</script>

<style scoped>
.dashboard { padding: 20px; }
</style>
