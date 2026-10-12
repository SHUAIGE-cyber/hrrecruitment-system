<template>
  <div class="positions">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="card-title">岗位管理</span>
          <el-button type="primary" :icon="Plus" @click="handleCreate">新增岗位</el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option label="招聘中" value="open" />
            <el-option label="暂停" value="paused" />
            <el-option label="招满" value="filled" />
            <el-option label="关闭" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item label="部门">
          <el-select v-model="searchForm.department" placeholder="全部" clearable>
            <el-option label="技术部" value="技术部" />
            <el-option label="产品部" value="产品部" />
            <el-option label="市场部" value="市场部" />
            <el-option label="人力资源部" value="人力资源部" />
            <el-option label="财务部" value="财务部" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.search" placeholder="搜索岗位名" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 表格 -->
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="name" label="岗位名" min-width="120" />
        <el-table-column prop="department" label="部门" width="120" />
        <el-table-column prop="location" label="地点" width="100" />
        <el-table-column label="薪资范围" width="140">
          <template #default="{ row }">
            {{ row.salaryMin ? row.salaryMin + '-' + row.salaryMax : '面议' }}
          </template>
        </el-table-column>
        <el-table-column label="招聘人数" width="100">
          <template #default="{ row }">
            {{ row.filledCount }}/{{ row.headcount }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusName(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">
            {{ new Date(row.createdAt).toLocaleDateString('zh-CN') }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="warning" @click="handleToggleStatus(row)">
              {{ row.status === 'open' ? '暂停' : '启用' }}
            </el-button>
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
      width="700px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="岗位名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入岗位名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="部门" prop="department">
              <el-select v-model="form.department" placeholder="请选择部门" style="width: 100%">
                <el-option label="技术部" value="技术部" />
                <el-option label="产品部" value="产品部" />
                <el-option label="市场部" value="市场部" />
                <el-option label="人力资源部" value="人力资源部" />
                <el-option label="财务部" value="财务部" />
                <el-option label="运营部" value="运营部" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="工作地点" prop="location">
              <el-input v-model="form.location" placeholder="请输入工作地点" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="招聘人数" prop="headcount">
              <el-input-number v-model="form.headcount" :min="1" :max="100" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="最低薪资">
              <el-input-number v-model="form.salaryMin" :min="0" placeholder="元" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最高薪资">
              <el-input-number v-model="form.salaryMax" :min="0" placeholder="元" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="职位描述" prop="jd">
          <el-input v-model="form.jd" type="textarea" :rows="4" placeholder="请输入职位描述" />
        </el-form-item>
        <el-form-item label="任职要求" prop="requirements">
          <el-input v-model="form.requirements" type="textarea" :rows="4" placeholder="请输入任职要求" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio label="open">招聘中</el-radio>
            <el-radio label="paused">暂停</el-radio>
            <el-radio label="filled">招满</el-radio>
            <el-radio label="closed">关闭</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { positionAPI } from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const formRef = ref(null)
const tableData = ref([])
const dialogTitle = ref('新增岗位')
const editId = ref(null)

const searchForm = reactive({
  status: '',
  department: '',
  search: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const form = reactive({
  name: '',
  department: '',
  location: '',
  headcount: 1,
  salaryMin: null,
  salaryMax: null,
  jd: '',
  requirements: '',
  status: 'open'
})

const rules = {
  name: [{ required: true, message: '请输入岗位名称', trigger: 'blur' }],
  department: [{ required: true, message: '请选择部门', trigger: 'change' }],
  location: [{ required: true, message: '请输入工作地点', trigger: 'blur' }],
  jd: [{ required: true, message: '请输入职位描述', trigger: 'blur' }],
  requirements: [{ required: true, message: '请输入任职要求', trigger: 'blur' }]
}

const getStatusName = (status) => {
  const names = { open: '招聘中', paused: '暂停', filled: '招满', closed: '关闭' }
  return names[status] || status
}

const getStatusType = (status) => {
  const types = { open: 'success', paused: 'warning', filled: '', closed: 'info' }
  return types[status] || ''
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await positionAPI.list({
      ...searchForm,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    if (res.success) {
      tableData.value = res.data
      pagination.total = res.total || 0
    }
  } catch (error) {
    console.error('加载岗位列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  searchForm.status = ''
  searchForm.department = ''
  searchForm.search = ''
  handleSearch()
}

const handlePageChange = () => {
  loadData()
}

const handleCreate = () => {
  editId.value = null
  Object.assign(form, {
    name: '',
    department: '',
    location: '',
    headcount: 1,
    salaryMin: null,
    salaryMax: null,
    jd: '',
    requirements: '',
    status: 'open'
  })
  dialogTitle.value = '新增岗位'
  dialogVisible.value = true
}

const handleEdit = (row) => {
  editId.value = row._id
  Object.assign(form, {
    name: row.name,
    department: row.department,
    location: row.location,
    headcount: row.headcount,
    salaryMin: row.salaryMin,
    salaryMax: row.salaryMax,
    jd: row.jd,
    requirements: row.requirements,
    status: row.status
  })
  dialogTitle.value = '编辑岗位'
  dialogVisible.value = true
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    if (editId.value) {
      await positionAPI.update(editId.value, form)
      ElMessage.success('更新成功')
    } else {
      await positionAPI.create(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    submitLoading.value = false
  }
}

const handleToggleStatus = async (row) => {
  const newStatus = row.status === 'open' ? 'paused' : 'open'
  await positionAPI.update(row._id, { status: newStatus })
  ElMessage.success('状态已更新')
  loadData()
}

const handleDelete = async (row) => {
  await ElMessageBox.confirm(`确定要删除岗位「${row.name}」吗？`, '提示', { type: 'warning' })
  await positionAPI.delete(row._id)
  ElMessage.success('删除成功')
  loadData()
}

onMounted(loadData)
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

.search-form {
  margin-bottom: 16px;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
