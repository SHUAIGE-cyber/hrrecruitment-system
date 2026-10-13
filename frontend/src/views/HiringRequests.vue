<template>
  <div class="hiring-requests">
    <el-card>
      <template #header>
        <div class="card-header">
          <div style="display:flex;align-items:center;gap:12px">
            <span class="card-title">招聘需求</span>
            <el-badge v-if="pendingCount > 0 && isApprover" :value="pendingCount" type="danger">
              <el-tag type="warning" size="small">{{ pendingCount }} 条待审批</el-tag>
            </el-badge>
          </div>
          <el-button type="primary" :icon="Plus" @click="handleCreate">提交招聘需求</el-button>
        </div>
      </template>

      <!-- 筛选 -->
      <el-form :inline="true" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="filterStatus" placeholder="全部" clearable style="width:140px" @change="loadData">
            <el-option label="待审批" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已驳回" value="rejected" />
            <el-option label="已转岗位" value="transferred" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="loadData">刷新</el-button>
        </el-form-item>
      </el-form>

      <!-- 列表 -->
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="positionName" label="岗位名称" min-width="130" />
        <el-table-column prop="department" label="部门" width="110" />
        <el-table-column prop="requesterName" label="提交人" width="100" />
        <el-table-column label="招聘人数" width="90">
          <template #default="{ row }">{{ row.headcount }}人</template>
        </el-table-column>
        <el-table-column label="紧急程度" width="100">
          <template #default="{ row }">
            <el-tag :type="urgencyType(row.urgency)" size="small">{{ urgencyName(row.urgency) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="期望到岗" width="110">
          <template #default="{ row }">
            {{ row.expectedDate ? new Date(row.expectedDate).toLocaleDateString('zh-CN') : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusName(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="approverName" label="审批人" width="100">
          <template #default="{ row }">{{ row.approverName || '-' }}</template>
        </el-table-column>
        <el-table-column label="提交时间" width="110">
          <template #default="{ row }">{{ new Date(row.createdAt).toLocaleDateString('zh-CN') }}</template>
        </el-table-column>
        <el-table-column label="操作" width="230" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">详情</el-button>
            <template v-if="isApprover && row.status === 'pending'">
              <el-button link type="success" @click="handleApprove(row)">通过</el-button>
              <el-button link type="danger" @click="handleReject(row)">驳回</el-button>
            </template>
            <el-button
              v-if="isApprover && row.status === 'approved'"
              link type="warning"
              @click="handleTransfer(row)"
            >转正式岗位</el-button>
            <el-button
              v-if="canDelete(row)"
              link type="danger"
              @click="handleDelete(row)"
            >{{ row.status === 'pending' && !isApprover ? '撤销' : '删除' }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        layout="total, prev, pager, next"
        @change="loadData"
        class="pagination"
      />
    </el-card>

    <!-- 提交需求弹窗 -->
    <el-dialog v-model="dialogVisible" title="提交招聘需求" width="700px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="岗位名称" prop="positionName">
              <el-input v-model="form.positionName" placeholder="如：高级前端工程师" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属部门" prop="department">
              <el-input v-model="form.department" placeholder="如：技术部" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="招聘人数" prop="headcount">
              <el-input-number v-model="form.headcount" :min="1" :max="100" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="工作地点">
              <el-input v-model="form.location" placeholder="如：北京" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="紧急程度">
              <el-select v-model="form.urgency" style="width:100%">
                <el-option label="普通" value="normal" />
                <el-option label="紧急" value="urgent" />
                <el-option label="非常紧急" value="critical" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="期望到岗">
              <el-date-picker v-model="form.expectedDate" type="date" placeholder="期望到岗日期" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="最低薪资">
              <el-input-number v-model="form.salaryMin" :min="0" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="最高薪资">
              <el-input-number v-model="form.salaryMax" :min="0" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="招聘原因" prop="reason">
          <el-input v-model="form.reason" type="textarea" :rows="2" placeholder="如：业务扩张、人员离职补缺等" />
        </el-form-item>
        <el-form-item label="岗位职责" prop="jd">
          <el-input v-model="form.jd" type="textarea" :rows="4" placeholder="该岗位的主要工作内容" />
        </el-form-item>
        <el-form-item label="任职要求" prop="requirements">
          <el-input v-model="form.requirements" type="textarea" :rows="3" placeholder="学历、经验、技能要求等" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">提交需求</el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="需求详情" width="650px">
      <el-descriptions :column="2" border v-if="currentRequest">
        <el-descriptions-item label="岗位名称">{{ currentRequest.positionName }}</el-descriptions-item>
        <el-descriptions-item label="部门">{{ currentRequest.department }}</el-descriptions-item>
        <el-descriptions-item label="招聘人数">{{ currentRequest.headcount }}人</el-descriptions-item>
        <el-descriptions-item label="紧急程度">
          <el-tag :type="urgencyType(currentRequest.urgency)" size="small">{{ urgencyName(currentRequest.urgency) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="提交人">{{ currentRequest.requesterName }}</el-descriptions-item>
        <el-descriptions-item label="期望到岗">
          {{ currentRequest.expectedDate ? new Date(currentRequest.expectedDate).toLocaleDateString('zh-CN') : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="薪资范围" :span="2">
          {{ currentRequest.salaryMin ? currentRequest.salaryMin + 'K - ' + (currentRequest.salaryMax || '?') + 'K' : '面议' }}
        </el-descriptions-item>
        <el-descriptions-item label="状态" :span="2">
          <el-tag :type="statusType(currentRequest.status)">{{ statusName(currentRequest.status) }}</el-tag>
          <span v-if="currentRequest.approverName" style="margin-left:8px;color:#909399;font-size:12px">
            审批人：{{ currentRequest.approverName }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="招聘原因" :span="2">{{ currentRequest.reason }}</el-descriptions-item>
        <el-descriptions-item label="岗位职责" :span="2">
          <div style="white-space:pre-wrap">{{ currentRequest.jd }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="任职要求" :span="2">
          <div style="white-space:pre-wrap">{{ currentRequest.requirements }}</div>
        </el-descriptions-item>
        <el-descriptions-item v-if="currentRequest.rejectReason" label="驳回原因" :span="2">
          <span style="color:#F56C6C">{{ currentRequest.rejectReason }}</span>
        </el-descriptions-item>
        <el-descriptions-item v-if="currentRequest.reviewComment && currentRequest.status !== 'rejected'" label="审批意见" :span="2">
          {{ currentRequest.reviewComment }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { hiringRequestAPI } from '../api.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const detailVisible = ref(false)
const formRef = ref(null)
const tableData = ref([])
const pendingCount = ref(0)
const filterStatus = ref('')
const currentRequest = ref(null)

const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const user = computed(() => {
  try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null }
})
const isApprover = computed(() => ['super_admin', 'hr'].includes(user.value?.role))

const form = reactive({
  positionName: '',
  department: '',
  headcount: 1,
  location: '',
  urgency: 'normal',
  expectedDate: null,
  salaryMin: null,
  salaryMax: null,
  reason: '',
  jd: '',
  requirements: ''
})

const rules = {
  positionName: [{ required: true, message: '请输入岗位名称', trigger: 'blur' }],
  department: [{ required: true, message: '请输入部门', trigger: 'blur' }],
  reason: [{ required: true, message: '请输入招聘原因', trigger: 'blur' }],
  jd: [{ required: true, message: '请输入岗位职责', trigger: 'blur' }],
  requirements: [{ required: true, message: '请输入任职要求', trigger: 'blur' }]
}

const statusName = (s) => ({ pending: '待审批', approved: '已通过', rejected: '已驳回', transferred: '已转岗位' }[s] || s)
const statusType = (s) => ({ pending: 'warning', approved: 'success', rejected: 'danger', transferred: 'primary' }[s] || '')
const urgencyName = (u) => ({ normal: '普通', urgent: '紧急', critical: '非常紧急' }[u] || u)
const urgencyType = (u) => ({ normal: 'info', urgent: 'warning', critical: 'danger' }[u] || 'info')

const canDelete = (row) => {
  if (user.value?.role === 'super_admin') return true
  if (row.requesterId?._id === user.value?.id && row.status === 'pending') return true
  return false
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await hiringRequestAPI.list({
      status: filterStatus.value,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    if (res.success) {
      tableData.value = res.data
      pagination.total = res.total || 0
      pendingCount.value = res.pendingCount || 0
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleCreate = () => {
  Object.assign(form, {
    positionName: '',
    department: user.value?.department || '',
    headcount: 1,
    location: '',
    urgency: 'normal',
    expectedDate: null,
    salaryMin: null,
    salaryMax: null,
    reason: '',
    jd: '',
    requirements: ''
  })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    const data = { ...form }
    if (data.expectedDate) data.expectedDate = data.expectedDate.toISOString()
    const res = await hiringRequestAPI.create(data)
    if (res.success) {
      ElMessage.success('需求已提交，等待HR审批')
      dialogVisible.value = false
      loadData()
    }
  } catch (e) {
    ElMessage.error('提交失败')
  } finally {
    submitLoading.value = false
  }
}

const handleView = async (row) => {
  try {
    const res = await hiringRequestAPI.get(row._id)
    if (res.success) {
      currentRequest.value = res.data
      detailVisible.value = true
    }
  } catch (e) {
    currentRequest.value = row
    detailVisible.value = true
  }
}

const handleApprove = async (row) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入审批意见（可选）', '通过审批', {
      confirmButtonText: '确认通过',
      cancelButtonText: '取消',
      inputPlaceholder: '如：同意，请尽快启动招聘',
      inputValue: '同意'
    })
    const res = await hiringRequestAPI.review(row._id, { approved: true, comment: value })
    if (res.success) {
      ElMessage.success('已通过')
      loadData()
    }
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

const handleReject = async (row) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入驳回原因', '驳回需求', {
      confirmButtonText: '确认驳回',
      cancelButtonText: '取消',
      inputPlaceholder: '请说明驳回原因',
      inputValidator: (v) => (v && v.trim() ? true : '驳回原因不能为空')
    })
    const res = await hiringRequestAPI.review(row._id, { approved: false, comment: value, rejectReason: value })
    if (res.success) {
      ElMessage.success('已驳回')
      loadData()
    }
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

const handleTransfer = async (row) => {
  await ElMessageBox.confirm(
    `确定将「${row.positionName}」转为正式岗位吗？转换后可在「岗位管理」中开始招聘。`,
    '转正式岗位',
    { type: 'warning' }
  )
  try {
    const res = await hiringRequestAPI.transfer(row._id)
    if (res.success) {
      ElMessage.success('已转为正式岗位')
      loadData()
    }
  } catch (e) {
    ElMessage.error('转换失败')
  }
}

const handleDelete = async (row) => {
  await ElMessageBox.confirm('确定要删除这条需求吗？', '提示', { type: 'warning' })
  await hiringRequestAPI.delete(row._id)
  ElMessage.success('已删除')
  loadData()
}

onMounted(loadData)
</script>

<style scoped>
.card-header { display: flex; align-items: center; justify-content: space-between; }
.card-title { font-size: 18px; font-weight: 600; }
.search-form { margin-bottom: 16px; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
