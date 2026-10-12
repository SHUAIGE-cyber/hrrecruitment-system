<template>
  <div class="certificates">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="card-title">证书管理</span>
          <el-button type="primary" :icon="Upload" @click="showUploadDialog = true">上传证书</el-button>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="name" label="证书名称" min-width="150" />
        <el-table-column prop="type" label="类型" width="120" />
        <el-table-column prop="issuer" label="发证机构" width="150" />
        <el-table-column label="发证日期" width="120">
          <template #default="{ row }">
            {{ row.issueDate ? new Date(row.issueDate).toLocaleDateString('zh-CN') : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="到期日期" width="120">
          <template #default="{ row }">
            {{ row.expireDate ? new Date(row.expireDate).toLocaleDateString('zh-CN') : '永久有效' }}
          </template>
        </el-table-column>
        <el-table-column label="证书编号" width="150">
          <template #default="{ row }">
            {{ row.certificateNo || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="关联人员" width="120">
          <template #default="{ row }">
            {{ row.candidateId?.name || row.employeeId?.realName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next"
        @change="loadData"
        class="pagination"
      />
    </el-card>

    <!-- 上传证书弹窗 -->
    <el-dialog v-model="showUploadDialog" title="上传证书" width="500px" destroy-on-close>
      <el-form label-width="80px">
        <el-form-item label="证书类型">
          <el-select v-model="uploadForm.type" placeholder="请选择类型" style="width: 100%">
            <el-option label="学历证" value="学历证" />
            <el-option label="学位证" value="学位证" />
            <el-option label="身份证" value="身份证" />
            <el-option label="资格证书" value="资格证书" />
            <el-option label="职业资格证书" value="职业资格证书" />
            <el-option label="语言证书" value="语言证书" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联人员">
          <el-select v-model="uploadForm.candidateId" placeholder="选择候选人" clearable style="width: 100%">
            <el-option v-for="c in candidates" :key="c._id" :label="c.name" :value="c._id" />
          </el-select>
        </el-form-item>
        <el-form-item label="证书文件">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            accept=".pdf,.jpg,.jpeg,.png"
            :on-change="handleFileChange"
          >
            <el-button type="primary">选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持 PDF、图片，最大 10MB</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" :loading="uploadLoading" @click="handleUpload">上传并识别</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { certificateAPI, candidateAPI } from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload } from '@element-plus/icons-vue'

const loading = ref(false)
const uploadLoading = ref(false)
const showUploadDialog = ref(false)
const tableData = ref([])
const candidates = ref([])
const selectedFile = ref(null)
const uploadRef = ref(null)
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const uploadForm = reactive({
  type: '',
  candidateId: ''
})

const getStatusName = (status) => {
  const names = { valid: '有效', expiring_soon: '即将过期', expired: '已过期', unknown: '待识别' }
  return names[status] || status
}

const getStatusType = (status) => {
  const types = { valid: 'success', expiring_soon: 'warning', expired: 'danger', unknown: 'info' }
  return types[status] || 'info'
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await certificateAPI.list({ page: pagination.page, pageSize: pagination.pageSize })
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

const handleFileChange = (file) => {
  selectedFile.value = file.raw
}

const handleUpload = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请选择文件')
    return
  }
  if (!uploadForm.type) {
    ElMessage.warning('请选择证书类型')
    return
  }

  uploadLoading.value = true
  try {
    const formData = new FormData()
    formData.append('certificate', selectedFile.value)
    formData.append('type', uploadForm.type)
    if (uploadForm.candidateId) {
      formData.append('candidateId', uploadForm.candidateId)
    }

    const res = await certificateAPI.create(formData)
    if (res.success) {
      ElMessage.success('证书上传并识别成功')
      showUploadDialog.value = false
      loadData()
    }
  } finally {
    uploadLoading.value = false
  }
}

const handleDelete = async (row) => {
  await ElMessageBox.confirm('确定要删除此证书吗？', '提示', { type: 'warning' })
  await certificateAPI.delete(row._id)
  ElMessage.success('删除成功')
  loadData()
}

onMounted(() => {
  loadData()
  loadCandidates()
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

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.el-upload__tip {
  color: #909399;
  font-size: 12px;
  margin-top: 8px;
}
</style>
