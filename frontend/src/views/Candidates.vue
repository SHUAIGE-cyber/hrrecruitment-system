<template>
  <div class="candidates">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="card-title">候选人管理</span>
          <div class="card-actions">
            <el-button type="success" :icon="Upload" @click="showUploadDialog = true">上传简历</el-button>
            <el-button type="primary" :icon="Plus" @click="handleCreate">新增候选人</el-button>
            <el-button @click="handleExport">导出</el-button>
          </div>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item>
          <el-input
            v-model="searchForm.search"
            placeholder="搜索姓名/关键词"
            clearable
            @keyup.enter="handleSearch"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item>
          <el-select v-model="searchForm.stage" placeholder="面试阶段" clearable>
            <el-option label="简历初筛" value="resume_screen" />
            <el-option label="一面" value="interview_1" />
            <el-option label="二面" value="interview_2" />
            <el-option label="终面" value="interview_3" />
            <el-option label="Offer" value="offer" />
            <el-option label="待入职" value="onboard" />
            <el-option label="淘汰" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 表格 -->
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="name" label="姓名" min-width="100" />
        <el-table-column prop="education" label="学历" width="100" />
        <el-table-column prop="university" label="学校" width="140" />
        <el-table-column label="工作经验" width="100">
          <template #default="{ row }">
            {{ row.workExperience }}年
          </template>
        </el-table-column>
        <el-table-column prop="currentStage" label="当前阶段" width="100">
          <template #default="{ row }">
            <el-tag :type="getStageType(row.currentStage)">{{ getStageName(row.currentStage) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="匹配度" width="100">
          <template #default="{ row }">
            <el-progress
              :percentage="row.matchScore || 0"
              :status="getScoreStatus(row.matchScore)"
              :format="() => row.matchScore ? row.matchScore + '分' : '-'"
            />
          </template>
        </el-table-column>
        <el-table-column label="标签" min-width="150">
          <template #default="{ row }">
            <el-tag
              v-for="(tag, i) in row.aiTags?.slice(0, 3)"
              :key="i"
              size="small"
              class="tag-item"
            >{{ tag }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">
            {{ new Date(row.createdAt).toLocaleDateString('zh-CN') }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">详情</el-button>
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @change="handlePageChange"
        class="pagination"
      />
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="form.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别">
              <el-select v-model="form.gender" placeholder="请选择" style="width: 100%">
                <el-option label="男" value="男" />
                <el-option label="女" value="女" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="年龄">
              <el-input-number v-model="form.age" :min="18" :max="65" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="电话" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="邮箱">
              <el-input v-model="form.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所在城市">
              <el-input v-model="form.location" placeholder="请输入城市" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="学历">
              <el-select v-model="form.education" placeholder="请选择" style="width: 100%">
                <el-option label="大专" value="大专" />
                <el-option label="本科" value="本科" />
                <el-option label="硕士" value="硕士" />
                <el-option label="博士" value="博士" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="毕业院校">
              <el-input v-model="form.university" placeholder="请输入院校" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="工作经验">
              <el-input-number v-model="form.workExperience" :min="0" :max="50" style="width: 100%" /> 年
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="当前薪资">
              <el-input-number v-model="form.currentSalary" :min="0" placeholder="千元/月" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="求职意向">
          <el-select v-model="form.appliedPositions" multiple placeholder="选择意向岗位" style="width: 100%">
            <el-option
              v-for="pos in openPositions"
              :key="pos._id"
              :label="pos.name + ' (' + pos.department + ')'"
              :value="pos._id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.notes" type="textarea" :rows="3" placeholder="备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 上传简历弹窗 -->
    <el-dialog
      v-model="showUploadDialog"
      title="上传简历"
      width="500px"
      destroy-on-close
    >
      <el-form label-width="80px">
        <el-form-item label="关联岗位">
          <el-select v-model="uploadForm.positionId" placeholder="选择岗位" style="width: 100%">
            <el-option
              v-for="pos in openPositions"
              :key="pos._id"
              :label="pos.name + ' (' + pos.department + ')'"
              :value="pos._id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="简历文件">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            :on-change="handleFileChange"
          >
            <el-button type="primary">选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持 PDF、图片、Word 格式，最大 10MB</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" :loading="uploadLoading" @click="handleUpload">上传并解析</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { candidateAPI, positionAPI } from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const submitLoading = ref(false)
const uploadLoading = ref(false)
const dialogVisible = ref(false)
const showUploadDialog = ref(false)
const formRef = ref(null)
const uploadRef = ref(null)
const tableData = ref([])
const openPositions = ref([])
const dialogTitle = ref('新增候选人')
const editId = ref(null)
const selectedFile = ref(null)

const searchForm = reactive({
  search: '',
  stage: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const form = reactive({
  name: '',
  gender: '',
  age: null,
  phone: '',
  email: '',
  location: '',
  education: '',
  university: '',
  major: '',
  workExperience: 0,
  currentSalary: null,
  expectedSalary: null,
  noticePeriod: '',
  appliedPositions: [],
  notes: ''
})

const uploadForm = reactive({
  positionId: ''
})

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }]
}

const stageMap = {
  resume_screen: '简历初筛',
  interview_1: '一面',
  interview_2: '二面',
  interview_3: '终面',
  offer: 'Offer',
  onboard: '待入职',
  rejected: '淘汰'
}

const getStageName = (stage) => stageMap[stage] || stage
const getStageType = (stage) => {
  const types = { resume_screen: '', interview_1: 'success', interview_2: 'warning', interview_3: 'danger', offer: 'primary', onboard: 'info', rejected: 'info' }
  return types[stage] || ''
}
const getScoreStatus = (score) => {
  if (!score) return ''
  if (score >= 80) return 'success'
  if (score >= 60) return ''
  return 'exception'
}

const loadPositions = async () => {
  try {
    const res = await positionAPI.list({ status: 'open' })
    if (res.success) openPositions.value = res.data
  } catch (error) {
    console.error('加载岗位失败:', error)
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await candidateAPI.list({
      search: searchForm.search,
      stage: searchForm.stage,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    if (res.success) {
      tableData.value = res.data
      pagination.total = res.total || 0
    }
  } catch (error) {
    console.error('加载候选人列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  searchForm.search = ''
  searchForm.stage = ''
  handleSearch()
}

const handlePageChange = () => {
  loadData()
}

const handleCreate = () => {
  editId.value = null
  Object.assign(form, {
    name: '',
    gender: '',
    age: null,
    phone: '',
    email: '',
    location: '',
    education: '',
    university: '',
    major: '',
    workExperience: 0,
    currentSalary: null,
    expectedSalary: null,
    noticePeriod: '',
    appliedPositions: [],
    notes: ''
  })
  dialogTitle.value = '新增候选人'
  dialogVisible.value = true
}

const handleEdit = (row) => {
  editId.value = row._id
  Object.assign(form, {
    name: row.name,
    gender: row.gender,
    age: row.age,
    phone: row.phone,
    email: row.email,
    location: row.location,
    education: row.education,
    university: row.university,
    major: row.major,
    workExperience: row.workExperience,
    currentSalary: row.currentSalary,
    expectedSalary: row.expectedSalary,
    noticePeriod: row.noticePeriod,
    appliedPositions: row.appliedPositions?.map(p => p.positionId?._id || p.positionId) || [],
    notes: row.overallEvaluation || ''
  })
  dialogTitle.value = '编辑候选人'
  dialogVisible.value = true
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    const data = { ...form }
    if (editId.value) {
      await candidateAPI.update(editId.value, data)
      ElMessage.success('更新成功')
    } else {
      await candidateAPI.create(data)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    submitLoading.value = false
  }
}

const handleView = (row) => {
  router.push(`/candidates/${row._id}`)
}

const handleDelete = async (row) => {
  await ElMessageBox.confirm(`确定要删除候选人「${row.name}」吗？`, '提示', { type: 'warning' })
  await candidateAPI.delete(row._id)
  ElMessage.success('删除成功')
  loadData()
}

const handleFileChange = (file) => {
  selectedFile.value = file.raw
}

const handleUpload = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请选择文件')
    return
  }

  uploadLoading.value = true
  try {
    const formData = new FormData()
    formData.append('resume', selectedFile.value)
    if (uploadForm.positionId) {
      formData.append('positionId', uploadForm.positionId)
    }

    const res = await candidateAPI.upload(formData)
    if (res.success) {
      ElMessage.success('简历上传并解析成功')
      showUploadDialog.value = false
      loadData()
    }
  } finally {
    uploadLoading.value = false
  }
}

const handleExport = () => {
  const url = candidateAPI.export ? candidateAPI.export('candidates') : `/api/dashboard/export?type=candidates`
  const link = document.createElement('a')
  link.href = url
  link.download = `candidates_${new Date().toISOString().split('T')[0]}.xlsx`
  link.click()
}

onMounted(() => {
  loadPositions()
  loadData()
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

.card-actions {
  display: flex;
  gap: 8px;
}

.search-form {
  margin-bottom: 16px;
}

.tag-item {
  margin-right: 4px;
  margin-bottom: 4px;
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
