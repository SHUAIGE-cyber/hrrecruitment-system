<template>
  <div class="offers">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="card-title">Offer 管理</span>
          <el-button type="primary" :icon="Plus" @click="handleCreate">新建 Offer</el-button>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="candidateId.name" label="候选人" min-width="100" />
        <el-table-column prop="positionId.name" label="岗位" min-width="120" />
        <el-table-column label="薪资" min-width="120">
          <template #default="{ row }">
            {{ row.salary ? row.salary + 'K' : '-' }}
            <span v-if="row.bonus" class="bonus-text">+ 奖金 {{ row.bonus }}K</span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="职位" min-width="120" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusName(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审批进度" min-width="200">
          <template #default="{ row }">
            <el-progress
              :percentage="getApprovalProgress(row)"
              :status="row.status === 'approved' ? 'success' : row.status === 'rejected' ? 'exception' : ''"
            />
            <div class="approval-text">{{ getApprovalText(row) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="有效期" width="120">
          <template #default="{ row }">
            {{ row.expireDate ? new Date(row.expireDate).toLocaleDateString('zh-CN') : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">
            {{ new Date(row.createdAt).toLocaleDateString('zh-CN') }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">详情</el-button>
            <el-button link type="warning" @click="handleApprove(row)" v-if="row.status === 'pending_approval'">审批</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @change="loadData"
        class="pagination"
      />
    </el-card>

    <!-- 新建 Offer 弹窗 -->
    <el-dialog v-model="dialogVisible" title="新建 Offer" width="700px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="候选人" prop="candidateId">
              <el-select v-model="form.candidateId" placeholder="选择候选人" style="width: 100%">
                <el-option
                  v-for="c in candidates"
                  :key="c._id"
                  :label="c.name"
                  :value="c._id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="岗位" prop="positionId">
              <el-select v-model="form.positionId" placeholder="选择岗位" style="width: 100%">
                <el-option
                  v-for="p in positions"
                  :key="p._id"
                  :label="p.name"
                  :value="p._id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="职位头衔">
              <el-input v-model="form.title" placeholder="如：高级前端工程师" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="薪资 (K/月)">
              <el-input-number v-model="form.salary" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="奖金 (K)">
              <el-input-number v-model="form.bonus" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="入职日期">
              <el-date-picker v-model="form.startDate" type="date" placeholder="选择日期" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="有效期">
          <el-date-picker v-model="form.expireDate" type="date" placeholder="选择有效期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="福利">
          <el-input v-model="form.benefits" placeholder="多个福利用逗号分隔，如：五险一金、年终奖、股票期权" />
        </el-form-item>
        <el-form-item label="审批人">
          <el-input v-model="form.approvers" placeholder="多个审批人用逗号分隔" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 审批弹窗 -->
    <el-dialog v-model="approveDialogVisible" title="审批 Offer" width="500px">
      <el-form label-width="80px">
        <el-form-item label="审批结果">
          <el-radio-group v-model="approveForm.result">
            <el-radio :value="true">通过</el-radio>
            <el-radio :value="false">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审批意见">
          <el-input v-model="approveForm.comment" type="textarea" :rows="3" placeholder="请输入审批意见" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="approveLoading" @click="handleApproveSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { offerAPI, candidateAPI, positionAPI } from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const loading = ref(false)
const submitLoading = ref(false)
const approveLoading = ref(false)
const dialogVisible = ref(false)
const approveDialogVisible = ref(false)
const formRef = ref(null)
const tableData = ref([])
const candidates = ref([])
const positions = ref([])
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })
const approveTarget = ref(null)

const form = reactive({
  candidateId: '',
  positionId: '',
  title: '',
  salary: null,
  bonus: null,
  startDate: null,
  expireDate: null,
  benefits: '',
  approvers: '',
  remark: ''
})

const rules = {
  candidateId: [{ required: true, message: '请选择候选人', trigger: 'change' }],
  positionId: [{ required: true, message: '请选择岗位', trigger: 'change' }]
}

const approveForm = reactive({
  result: true,
  comment: ''
})

const getStatusName = (status) => {
  const names = {
    draft: '草稿',
    pending_approval: '待审批',
    approved: '已批准',
    sent: '已发送',
    accepted: '已接受',
    rejected: '已拒绝',
    expired: '已过期'
  }
  return names[status] || status
}

const getStatusType = (status) => {
  const types = {
    draft: 'info',
    pending_approval: 'warning',
    approved: 'success',
    sent: 'primary',
    accepted: 'success',
    rejected: 'danger',
    expired: 'info'
  }
  return types[status] || ''
}

const getApprovalProgress = (offer) => {
  if (!offer.approvalFlow?.length) return 0
  const total = offer.approvalFlow.length
  const done = offer.approvalFlow.filter(s => s.status !== 'pending').length
  return Math.round((done / total) * 100)
}

const getApprovalText = (offer) => {
  if (!offer.approvalFlow?.length) return '无需审批'
  const total = offer.approvalFlow.length
  const done = offer.approvalFlow.filter(s => s.status !== 'pending').length
  return `${done}/${total} 人已审批`
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await offerAPI.list({ page: pagination.page, pageSize: pagination.pageSize })
    if (res.success) {
      tableData.value = res.data
      pagination.total = res.total || 0
    }
  } finally {
    loading.value = false
  }
}

const loadCandidates = async () => {
  try {
    const res = await candidateAPI.list({ page: 1, pageSize: 100 })
    if (res.success) candidates.value = res.data
  } catch (error) { console.error(error) }
}

const loadPositions = async () => {
  try {
    const res = await positionAPI.list({ status: 'open' })
    if (res.success) positions.value = res.data
  } catch (error) { console.error(error) }
}

const handleCreate = () => {
  Object.assign(form, {
    candidateId: '',
    positionId: '',
    title: '',
    salary: null,
    bonus: null,
    startDate: null,
    expireDate: null,
    benefits: '',
    approvers: '',
    remark: ''
  })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    const data = { ...form }
    if (data.benefits) data.benefits = data.benefits.split('，').filter(Boolean)
    if (data.approvers) {
      const approverList = data.approvers.split('，').filter(Boolean)
      data.approvalFlow = approverList.map(name => ({
        approver: name,
        role: '审批人',
        status: 'pending',
        comment: null,
        approvedAt: null
      }))
    }
    data.status = data.approvalFlow?.length ? 'pending_approval' : 'draft'

    await offerAPI.create(data)
    ElMessage.success('创建成功')
    dialogVisible.value = false
    loadData()
  } finally {
    submitLoading.value = false
  }
}

const handleView = (row) => {
  // 跳转到候选人详情
  const route = new URL(window.location.href)
  window.location.href = `/candidates/${row.candidateId?._id || row.candidateId}`
}

const handleApprove = (row) => {
  approveTarget.value = row
  approveForm.result = true
  approveForm.comment = ''
  approveDialogVisible.value = true
}

const handleApproveSubmit = async () => {
  approveLoading.value = true
  try {
    await offerAPI.approve(approveTarget.value._id, {
      approved: approveForm.result,
      comment: approveForm.comment
    })
    ElMessage.success('审批成功')
    approveDialogVisible.value = false
    loadData()
  } finally {
    approveLoading.value = false
  }
}

const handleDelete = async (row) => {
  await ElMessageBox.confirm('确定要删除此 Offer 吗？', '提示', { type: 'warning' })
  await offerAPI.delete(row._id)
  ElMessage.success('删除成功')
  loadData()
}

onMounted(() => {
  loadData()
  loadCandidates()
  loadPositions()
})
</script>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
}

.bonus-text {
  color: #67C23A;
  font-size: 12px;
  margin-left: 4px;
}

.approval-text {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
