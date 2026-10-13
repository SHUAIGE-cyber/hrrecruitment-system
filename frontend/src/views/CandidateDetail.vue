<template>
  <div class="candidate-detail" v-loading="loading">
    <el-row :gutter="16">
      <!-- 左列：基本信息 -->
      <el-col :span="8">
        <el-card>
          <template #header><span class="card-title">👤 基本信息</span></template>
          <div class="info-grid">
            <div class="info-item"><span class="info-label">姓名</span><span class="info-value">{{ candidate.name || '-' }}</span></div>
            <div class="info-item"><span class="info-label">性别</span><span class="info-value">{{ candidate.gender || '-' }}</span></div>
            <div class="info-item"><span class="info-label">年龄</span><span class="info-value">{{ candidate.age || '-' }}</span></div>
            <div class="info-item"><span class="info-label">电话</span><span class="info-value">{{ maskPhone(candidate.phone) }}</span></div>
            <div class="info-item"><span class="info-label">邮箱</span><span class="info-value">{{ candidate.email || '-' }}</span></div>
            <div class="info-item"><span class="info-label">城市</span><span class="info-value">{{ candidate.location || '-' }}</span></div>
            <div class="info-item"><span class="info-label">学历</span><span class="info-value">{{ candidate.education || '-' }}</span></div>
            <div class="info-item"><span class="info-label">学校</span><span class="info-value">{{ candidate.university || '-' }}</span></div>
            <div class="info-item"><span class="info-label">专业</span><span class="info-value">{{ candidate.major || '-' }}</span></div>
            <div class="info-item"><span class="info-label">工作年限</span><span class="info-value">{{ candidate.workExperience ?? '-' }}年</span></div>
          </div>

          <div v-if="candidate.aiTags?.length" style="margin-top:16px">
            <div class="section-title">🏷️ AI标签</div>
            <el-tag v-for="(tag, i) in candidate.aiTags" :key="i" size="small" style="margin:2px">{{ tag }}</el-tag>
          </div>

          <!-- 查看原始简历 -->
          <div style="margin-top:16px;border-top:1px solid #ebeef5;padding-top:12px">
            <el-button v-if="candidate.resumeFile" type="primary" plain style="width:100%" @click="viewResume">
              查看完整简历
            </el-button>
            <el-button v-else plain disabled style="width:100%">无简历文件</el-button>
          </div>
        </el-card>

        <!-- 匹配打分卡片 -->
        <el-card style="margin-top:16px">
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span class="card-title">🎯 JD匹配打分</span>
              <el-button v-if="positions.length" size="small" type="primary" :loading="matchLoading" @click="runMatchScore">
                开始打分
              </el-button>
            </div>
          </template>

          <!-- 选择岗位 -->
          <el-select v-model="selectedPositionId" placeholder="选择要匹配的岗位" style="width:100%;margin-bottom:12px" @change="resetMatch">
            <el-option v-for="p in positions" :key="p._id" :label="`${p.name} (${p.department})`" :value="p._id" />
          </el-select>

          <!-- 评分结果 -->
          <div v-if="matchResult" class="match-result">
            <div style="text-align:center;margin:12px 0">
              <el-progress type="dashboard" :percentage="matchResult.score" :width="140" :color="matchColor">
                <template #default>
                  <div style="font-size:28px;font-weight:bold">{{ matchResult.score }}</div>
                  <div style="font-size:12px;color:#999">匹配度</div>
                </template>
              </el-progress>
            </div>

            <!-- 分维度评分 -->
            <div v-if="matchResult.dimensions" style="margin-top:12px">
              <div v-for="(dim, key) in matchResult.dimensions" :key="key" style="margin-bottom:8px">
                <div style="display:flex;justify-content:space-between;font-size:12px">
                  <span>{{ dimName(key) }}</span>
                  <span style="color:#409EFF">{{ dim.score }}分</span>
                </div>
                <el-progress :percentage="dim.score" :show-text="false" :stroke-width="8" :color="dim.score >= 80 ? '#67C23A' : dim.score >= 60 ? '#E6A23C' : '#F56C6C'" />
                <div style="font-size:11px;color:#909399">{{ dim.comment }}</div>
              </div>
            </div>

            <!-- 匹配理由 -->
            <div v-if="matchResult.matchReason" style="margin-top:8px">
              <div class="section-title">💡 匹配理由</div>
              <div class="match-reason-text">{{ matchResult.matchReason }}</div>
            </div>

            <!-- 优势和差距 -->
            <div v-if="matchResult.strengths?.length" style="margin-top:8px">
              <div class="section-title" style="color:#67C23A">✅ 优势</div>
              <div v-for="(s, i) in matchResult.strengths" :key="i" style="font-size:12px;margin:2px 0">• {{ s }}</div>
            </div>
            <div v-if="matchResult.gaps?.length" style="margin-top:8px">
              <div class="section-title" style="color:#F56C6C">⚠️ 差距</div>
              <div v-for="(g, i) in matchResult.gaps" :key="i" style="font-size:12px;margin:2px 0">• {{ g }}</div>
            </div>
          </div>
          <el-empty v-else-if="selectedPositionId" description="点击「开始打分」进行AI匹配分析" :image-size="60" />
          <el-empty v-else description="先选择岗位" :image-size="60" />
        </el-card>
      </el-col>

      <!-- 右列：面试记录 -->
      <el-col :span="16">
        <el-card>
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span class="card-title">📅 面试记录</span>
              <el-button size="small" type="primary" @click="handleAddInterview">+ 添加面试</el-button>
            </div>
          </template>

          <el-timeline v-if="candidate.interviews?.length">
            <el-timeline-item
              v-for="(interview, index) in candidate.interviews"
              :key="index"
              :timestamp="formatDate(interview.interviewDate || interview.createdAt)"
              :type="interview.score >= 80 ? 'success' : interview.score >= 60 ? 'primary' : 'danger'"
            >
              <el-card>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                  <span style="font-weight:600">{{ getStageName(interview.stage) }}</span>
                  <el-tag size="small" :type="interview.score >= 80 ? 'success' : interview.score >= 60 ? 'warning' : 'danger'">
                    {{ interview.score || '未评分' }}分
                  </el-tag>
                </div>
                <div style="font-size:13px;color:#606266;line-height:1.8">
                  <p v-if="interview.interviewer">面试官：{{ interview.interviewer }}</p>
                  <p v-if="interview.evaluation">评价：{{ interview.evaluation }}</p>
                  <p v-if="interview.aiSummary" style="color:#409EFF;background:#ecf5ff;padding:8px;border-radius:4px">
                    🤖 AI总结：{{ interview.aiSummary }}
                  </p>
                  <p v-if="interview.reason" style="color:#F56C6C">淘汰原因：{{ interview.reason }}</p>
                </div>
                <div style="margin-top:8px;display:flex;gap:8px">
                  <el-button size="small" @click="handleEditInterview(interview)">编辑</el-button>
                  <el-button size="small" type="success" :loading="summarizeLoadingId === interview._id" @click="handleAISummarize(interview)">
                    AI总结
                  </el-button>
                  <el-button size="small" type="warning" :loading="questionsLoadingId === interview._id" @click="handleGenerateQuestions(interview)">
                    AI面试题
                  </el-button>
                </div>

                <!-- 面试题展示 -->
                <div v-if="interview.questions?.length" style="margin-top:8px;border-top:1px dashed #ddd;padding-top:8px">
                  <div style="font-weight:600;font-size:13px;margin-bottom:4px">📝 AI生成的面试题：</div>
                  <div v-for="(q, qi) in interview.questions" :key="qi" style="font-size:12px;margin:4px 0;background:#f5f7fa;padding:6px;border-radius:4px">
                    <b>{{ qi + 1 }}. {{ q.question }}</b>
                    <span style="color:#909399">【{{ q.type }}·{{ q.difficulty || '中等' }}】</span>
                    <div v-if="q.focus" style="color:#606266">考察：{{ q.focus }}</div>
                  </div>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else description="暂无面试记录" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 添加/编辑面试弹窗 -->
    <el-dialog v-model="interviewDialogVisible" :title="interviewEditId ? '编辑面试' : '添加面试'" width="600px" destroy-on-close>
      <el-form ref="interviewFormRef" :model="interviewForm" :rules="interviewRules" label-width="100px">
        <el-form-item label="面试阶段" prop="stage">
          <el-select v-model="interviewForm.stage" style="width:100%">
            <el-option label="简历初筛" value="resume_screen" />
            <el-option label="一面" value="interview_1" />
            <el-option label="二面" value="interview_2" />
            <el-option label="终面" value="interview_3" />
            <el-option label="Offer" value="offer" />
          </el-select>
        </el-form-item>
        <el-form-item label="面试官">
          <el-input v-model="interviewForm.interviewer" placeholder="面试官姓名" />
        </el-form-item>
        <el-form-item label="面试时间">
          <el-date-picker v-model="interviewForm.interviewDate" type="datetime" placeholder="选择时间" style="width:100%" />
        </el-form-item>
        <el-form-item label="评分">
          <el-slider v-model="interviewForm.score" :min="0" :max="100" show-input />
        </el-form-item>
        <el-form-item label="面试评价">
          <el-input v-model="interviewForm.evaluation" type="textarea" :rows="4" placeholder="面试评价/手记" />
        </el-form-item>
        <el-form-item label="淘汰原因" v-if="interviewForm.reason !== undefined">
          <el-input v-model="interviewForm.reason" type="textarea" :rows="2" placeholder="如淘汰请填写原因" />
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
import { candidateAPI, interviewAPI, positionAPI } from '../api.js'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const authStore = useAuthStore()
const loading = ref(false)
const candidate = ref({})
const positions = ref([])
const selectedPositionId = ref('')
const matchLoading = ref(false)
const matchResult = ref(null)
const summarizeLoadingId = ref(null)
const questionsLoadingId = ref(null)

const interviewDialogVisible = ref(false)
const interviewSubmitLoading = ref(false)
const interviewEditId = ref(null)
const interviewFormRef = ref(null)

const interviewForm = reactive({
  stage: 'interview_1',
  interviewer: '',
  interviewDate: null,
  score: 60,
  evaluation: '',
  reason: ''
})

const interviewRules = {
  stage: [{ required: true, message: '请选择面试阶段', trigger: 'change' }]
}

const matchColor = computed(() => {
  if (!matchResult.value) return '#409EFF'
  const s = matchResult.value.score
  if (s >= 80) return '#67C23A'
  if (s >= 60) return '#E6A23C'
  return '#F56C6C'
})

const dimName = (key) => ({ education: '学历', experience: '经验', skills: '技能', age: '年龄' }[key] || key)

const maskPhone = (phone) => {
  if (!phone) return '-'
  const role = authStore.user?.role
  if (role === 'super_admin' || role === 'hr') return phone
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

const getStageName = (stage) => ({
  resume_screen: '简历初筛', interview_1: '一面', interview_2: '二面',
  interview_3: '终面', offer: 'Offer', onboard: '待入职', rejected: '淘汰'
}[stage] || stage)

const formatDate = (date) => date ? new Date(date).toLocaleString('zh-CN') : '-'

const loadCandidate = async () => {
  loading.value = true
  try {
    const res = await candidateAPI.get(route.params.id)
    if (res.success) candidate.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const loadPositions = async () => {
  try {
    const res = await positionAPI.list({ status: 'open' })
    if (res.success) positions.value = res.data
  } catch (e) {
    console.error(e)
  }
}

const resetMatch = () => {
  matchResult.value = null
}

const viewResume = () => {
  if (candidate.value.resumeFile) {
    window.open(`/uploads/${candidate.value.resumeFile}`, '_blank')
  }
}

const runMatchScore = async () => {
  if (!selectedPositionId.value) {
    ElMessage.warning('请先选择岗位')
    return
  }
  matchLoading.value = true
  try {
    const res = await candidateAPI.matchScore(route.params.id, selectedPositionId.value)
    if (res.success) {
      matchResult.value = res.data
      ElMessage.success(`匹配打分完成：${res.data.score}分`)
    }
  } catch (e) {
    ElMessage.error('打分失败，请确认AI配置')
  } finally {
    matchLoading.value = false
  }
}

const handleAddInterview = () => {
  interviewEditId.value = null
  Object.assign(interviewForm, {
    stage: 'interview_1', interviewer: '', interviewDate: null,
    score: 60, evaluation: '', reason: ''
  })
  interviewDialogVisible.value = true
}

const handleEditInterview = (interview) => {
  interviewEditId.value = interview._id
  Object.assign(interviewForm, {
    stage: interview.stage, interviewer: interview.interviewer || '',
    interviewDate: interview.interviewDate ? new Date(interview.interviewDate) : null,
    score: interview.score || 60, evaluation: interview.evaluation || '', reason: interview.reason || ''
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
  summarizeLoadingId.value = interview._id
  try {
    const res = await interviewAPI.summarize(interview._id)
    if (res.success) {
      ElMessage.success('AI总结生成成功')
      loadCandidate()
    }
  } catch (e) {
    ElMessage.error('AI总结失败')
  } finally {
    summarizeLoadingId.value = null
  }
}

const handleGenerateQuestions = async (interview) => {
  if (!selectedPositionId.value) {
    ElMessage.warning('请先在左侧选择岗位')
    return
  }
  questionsLoadingId.value = interview._id
  try {
    const res = await candidateAPI.generateQuestions(route.params.id, selectedPositionId.value, interview.stage)
    if (res.success) {
      interview.questions = res.data
      ElMessage.success('面试题生成成功')
    }
  } catch (e) {
    ElMessage.error('生成失败，请确认AI配置')
  } finally {
    questionsLoadingId.value = null
  }
}

onMounted(() => {
  loadCandidate()
  loadPositions()
})
</script>

<style scoped>
.candidate-detail { min-height: 400px; }
.card-title { font-weight: 600; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.info-item { display: flex; flex-direction: column; gap: 2px; }
.info-label { font-size: 12px; color: #909399; }
.info-value { font-size: 14px; color: #303133; }
.section-title { font-size: 13px; font-weight: 600; color: #303133; margin: 8px 0 4px; }
.match-result { margin-top: 8px; }
.match-reason-text { font-size: 12px; color: #606266; line-height: 1.8; background: #f5f7fa; padding: 8px; border-radius: 4px; }
</style>
