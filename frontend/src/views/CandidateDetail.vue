<template>
  <div class="candidate-detail" v-loading="loading">
    <el-page-header @back="$router.back()" :title="'返回'">
      <template #content>
        <span class="page-title">候选人详情</span>
      </template>
    </el-page-header>

    <el-row :gutter="16" class="content-row">
      <!-- 基本信息 -->
      <el-col :span="8">
        <el-card class="info-card">
          <template #header>
            <span class="card-title">基本信息</span>
          </template>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">姓名</span>
              <span class="info-value">{{ candidate.name }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">性别</span>
              <span class="info-value">{{ candidate.gender || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">年龄</span>
              <span class="info-value">{{ candidate.age || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">电话</span>
              <span class="info-value">{{ maskPhone(candidate.phone) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">邮箱</span>
              <span class="info-value">{{ candidate.email || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">城市</span>
              <span class="info-value">{{ candidate.location || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">学历</span>
              <span class="info-value">{{ candidate.education || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">学校</span>
              <span class="info-value">{{ candidate.university || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">专业</span>
              <span class="info-value">{{ candidate.major || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">工作经验</span>
              <span class="info-value">{{ candidate.workExperience || 0 }}年</span>
            </div>
            <div class="info-item">
              <span class="info-label">当前薪资</span>
              <span class="info-value">{{ candidate.currentSalary ? candidate.currentSalary + 'K' : '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">期望薪资</span>
              <span class="info-value">{{ candidate.expectedSalary ? candidate.expectedSalary + 'K' : '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">到岗时间</span>
              <span class="info-value">{{ candidate.noticePeriod || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">微信</span>
              <span class="info-value">{{ candidate.wechat || '-' }}</span>
            </div>
          </div>

          <!-- AI 标签 -->
          <div class="tags-section" v-if="candidate.aiTags?.length">
            <div class="section-title">AI 标签</div>
            <el-tag
              v-for="(tag, i) in candidate.aiTags"
              :key="i"
              size="small"
              class="tag-item"
            >{{ tag }}</el-tag>
          </div>

          <!-- 匹配度 -->
          <div class="match-section" v-if="candidate.matchScore">
            <div class="section-title">JD 匹配度</div>
            <el-progress
              :percentage="candidate.matchScore"
              :status="candidate.matchScore >= 80 ? 'success' : candidate.matchScore >= 60 ? '' : 'exception'"
              :format="() => candidate.matchScore + '分'"
            />
            <div class="match-reason" v-if="candidate.matchReason">{{ candidate.matchReason }}</div>
          </div>
        </el-card>
      </el-col>

      <!-- 面试记录 -->
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span class="card-title">面试记录</span>
              <el-button type="primary" size="small" @click="handleAddInterview" v-if="canEdit">
                + 添加面试
              </el-button>
            </div>
          </template>

          <el-timeline>
            <el-timeline-item
              v-for="(interview, index) in candidate.interviews"
              :key="index"
              :timestamp="formatDate(interview.interviewDate || interview.createdAt)"
              :type="getInterviewType(interview)"
              :color="getInterviewColor(interview)"
            >
              <el-card class="interview-card">
                <div class="interview-header">
                  <span class="interview-stage">{{ getStageName(interview.stage) }}</span>
                  <el-tag size="small" :type="getInterviewStatusType(interview.status)">
                    {{ getInterviewStatusName(interview.status) }}
                  </el-tag>
                </div>
                <div class="interview-body">
                  <p v-if="interview.interviewer"><strong>面试官：</strong>{{ interview.interviewer }}</p>
                  <p v-if="interview.score"><strong>评分：</strong><span :class="getScoreClass(interview.score)">{{ interview.score }}分</span></p>
                  <p v-if="interview.evaluation"><strong>评价：</strong>{{ interview.evaluation }}</p>
                  <p v-if="interview.aiSummary" class="ai-summary">
                    <strong>AI 总结：</strong>{{ interview.aiSummary }}
                  </p>
                  <p v-if="interview.reason" class="reject-reason">
                    <strong>淘汰原因：</strong>{{ interview.reason }}
                  </p>
                </div>
                <div class="interview-actions" v-if="canEdit">
                  <el-button size="small" @click="handleEditInterview(interview)">编辑</el-button>
                  <el-button size="small" type="success" @click="handleAISummarize(interview)">AI 总结</el-button>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>

          <el-empty v-if="!candidate.interviews?.length" description="暂无面试记录" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 添加/编辑面试弹窗 -->
    <el-dialog
      v-model="interviewDialogVisible"
      :title="interviewEditId ? '编辑面试' : '添加面试'"
      width="600px"
      destroy-on-close
    >
      <el-form ref="interviewFormRef" :model="interviewForm" :rules="interviewRules" label-width="100px">
        <el-form-item label="面试阶段" prop="stage">
          <el-select v-model="interviewForm.stage" placeholder="请选择阶段" style="width: 100%">
            <el-option label="简历初筛" value="resume_screen" />
            <el-option label="一面" value="interview_1" />
            <el-option label="二面" value="interview_2" />
            <el-option label="终面" value="interview_3" />
            <el-option label="Offer" value="offer" />
          </el-select>
        </el-form-item>
        <el-form-item label="面试官">
          <el-input v-model="interviewForm.interviewer" placeholder="请输入面试官姓名" />
        </el-form-item>
        <el-form-item label="面试时间">
          <el-date-picker
            v-model="interviewForm.interviewDate"
            type="datetime"
            placeholder="选择面试日期时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="评分">
          <el-slider v-model="interviewForm.score" :min="0" :max="100" show-input />
        </el-form-item>
        <el-form-item label="面试评价">
          <el-input v-model="interviewForm.evaluation" type="textarea" :rows="4" placeholder="请输入面试评价" />
        </el-form-item>
        <el-form-item label="淘汰原因" v-if="interviewForm.status === 'rejected'">
          <el-input v-model="interviewForm.reason" type="textarea" :rows="2" placeholder="请输入淘汰原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="interviewDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="interviewSubmitLoading" @click="handleInterviewSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { candidateAPI, interviewAPI } from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const authStore = useAuthStore()
const loading = ref(false)
const interviewDialogVisible = ref(false)
const interviewSubmitLoading = ref(false)
const interviewEditId = ref(null)
const interviewFormRef = ref(null)
const candidate = ref({})
const candidateInterviews = ref([])

const canEdit = computed(() => ['super_admin', 'hr'].includes(authStore.user?.role))

const interviewForm = reactive({
  stage: 'interview_1',
  interviewer: '',
  interviewDate: null,
  score: 60,
  evaluation: '',
  reason: '',
  status: 'scheduled'
})

const interviewRules = {
  stage: [{ required: true, message: '请选择面试阶段', trigger: 'change' }]
}

const maskPhone = (phone) => {
  if (!phone || authStore.user?.role === 'super_admin' || authStore.user?.role === 'hr') return phone
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

const getStageName = (stage) => {
  const names = {
    resume_screen: '简历初筛',
    interview_1: '一面',
    interview_2: '二面',
    interview_3: '终面',
    offer: 'Offer',
    onboard: '待入职',
    rejected: '淘汰'
  }
  return names[stage] || stage
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const getInterviewType = (interview) => {
  const types = { scheduled: 'primary', completed: 'success', cancelled: 'danger' }
  return types[interview.status] || ''
}

const getInterviewColor = (interview) => {
  if (interview.score >= 80) return '#67C23A'
  if (interview.score >= 60) return '#E6A23C'
  return '#F56C6C'
}

const getInterviewStatusName = (status) => {
  const names = { scheduled: '已预约', completed: '已完成', cancelled: '已取消' }
  return names[status] || status
}

const getInterviewStatusType = (status) => {
  const types = { scheduled: 'primary', completed: 'success', cancelled: 'danger' }
  return types[status] || ''
}

const getScoreClass = (score) => {
  if (score >= 80) return 'score-high'
  if (score >= 60) return 'score-medium'
  return 'score-low'
}

const loadCandidate = async () => {
  loading.value = true
  try {
    const res = await candidateAPI.get(route.params.id)
    if (res.success) {
      candidate.value = res.data
    }
  } catch (error) {
    console.error('加载候选人详情失败:', error)
  } finally {
    loading.value = false
  }
}

const handleAddInterview = () => {
  interviewEditId.value = null
  Object.assign(interviewForm, {
    stage: 'interview_1',
    interviewer: '',
    interviewDate: null,
    score: 60,
    evaluation: '',
    reason: '',
    status: 'scheduled'
  })
  interviewDialogVisible.value = true
}

const handleEditInterview = (interview) => {
  interviewEditId.value = interview._id
  Object.assign(interviewForm, {
    stage: interview.stage,
    interviewer: interview.interviewer,
    interviewDate: interview.interviewDate ? new Date(interview.interviewDate) : null,
    score: interview.score || 60,
    evaluation: interview.evaluation || '',
    reason: interview.reason || '',
    status: interview.status
  })
  interviewDialogVisible.value = true
}

const handleInterviewSubmit = async () => {
  const valid = await interviewFormRef.value.validate().catch(() => false)
  if (!valid) return

  interviewSubmitLoading.value = true
  try {
    const data = {
      ...interviewForm,
      candidateId: route.params.id,
      interviewDate: interviewForm.interviewDate ? interviewForm.interviewDate.toISOString() : undefined
    }

    if (interviewEditId.value) {
      await interviewAPI.update(interviewEditId.value, data)
      ElMessage.success('更新成功')
    } else {
      await interviewAPI.create(data)
      ElMessage.success('添加成功')
    }
    interviewDialogVisible.value = false
    loadCandidate()
  } finally {
    interviewSubmitLoading.value = false
  }
}

const handleAISummarize = async (interview) => {
  try {
    const res = await interviewAPI.summarize(interview._id)
    if (res.success) {
      ElMessage.success('AI 总结生成成功')
      loadCandidate()
    }
  } catch (error) {
    console.error('AI 总结失败:', error)
    ElMessage.error('AI 总结失败')
  }
}

onMounted(loadCandidate)
</script>

<style scoped>
.candidate-detail {
  padding: 20px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  margin-left: 12px;
}

.content-row {
  margin-top: 16px;
}

.info-card {
  margin-bottom: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #909399;
}

.info-value {
  font-size: 14px;
  color: #303133;
}

.tags-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.tag-item {
  margin-right: 6px;
  margin-bottom: 6px;
}

.match-section {
  margin-top: 16px;
}

.match-reason {
  margin-top: 8px;
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.interview-card {
  margin-bottom: 0;
}

.interview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.interview-stage {
  font-weight: 600;
  color: #303133;
}

.interview-body {
  font-size: 13px;
  color: #606266;
  line-height: 1.8;
}

.interview-body p {
  margin: 4px 0;
}

.ai-summary {
  color: #409EFF;
  background: #ecf5ff;
  padding: 8px;
  border-radius: 4px;
  margin-top: 8px !important;
}

.reject-reason {
  color: #F56C6C;
}

.score-high { color: #67C23A; font-weight: 600; }
.score-medium { color: #E6A23C; font-weight: 600; }
.score-low { color: #F56C6C; font-weight: 600; }

.interview-actions {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
  display: flex;
  gap: 8px;
}
</style>
