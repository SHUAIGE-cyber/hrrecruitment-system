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
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width:120px">
            <el-option label="招聘中" value="open" />
            <el-option label="暂停" value="paused" />
            <el-option label="招满" value="filled" />
            <el-option label="关闭" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.search" placeholder="搜索岗位名/部门" clearable @keyup.enter="loadData" style="width:200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 表格 -->
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="name" label="岗位名" min-width="140" />
        <el-table-column prop="department" label="部门" width="110" />
        <el-table-column prop="location" label="地点" width="100" />
        <el-table-column label="薪资范围" width="130">
          <template #default="{ row }">
            {{ row.salaryMin ? row.salaryMin + 'K-' + row.salaryMax + 'K' : '面议' }}
          </template>
        </el-table-column>
        <el-table-column label="招聘人数" width="90">
          <template #default="{ row }">
            {{ row.filledCount || 0 }}/{{ row.headcount }}
          </template>
        </el-table-column>
        <el-table-column label="评分标准" min-width="150">
          <template #default="{ row }">
            <el-tag v-if="row.matchCriteria?.minEducation" size="small" style="margin-right:4px">{{ row.matchCriteria.minEducation }}+</el-tag>
            <el-tag v-if="row.matchCriteria?.minExperience" size="small" type="success" style="margin-right:4px">{{ row.matchCriteria.minExperience }}年+</el-tag>
            <el-tag v-if="row.matchCriteria?.requiredSkills?.length" size="small" type="warning">{{ row.matchCriteria.requiredSkills.length }}项必备技能</el-tag>
            <span v-if="!row.matchCriteria || Object.keys(row.matchCriteria).length === 0" style="color:#999">未设置</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusName(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="warning" @click="handleToggleStatus(row)">
              {{ row.status === 'open' ? '暂停' : '启用' }}
            </el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="750px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-divider content-position="left">基本信息</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="岗位名称" prop="name">
              <el-input v-model="form.name" placeholder="如：高级前端工程师" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="部门" prop="department">
              <el-input v-model="form.department" placeholder="如：技术部" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="工作地点" prop="location">
              <el-input v-model="form.location" placeholder="如：北京" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="招聘人数" prop="headcount">
              <el-input-number v-model="form.headcount" :min="1" :max="100" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="最低薪资">
              <el-input-number v-model="form.salaryMin" :min="0" :max="500" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="最高薪资">
              <el-input-number v-model="form.salaryMax" :min="0" :max="500" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="状态">
              <el-select v-model="form.status" style="width:100%">
                <el-option label="招聘中" value="open" />
                <el-option label="暂停" value="paused" />
                <el-option label="招满" value="filled" />
                <el-option label="关闭" value="closed" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8" />
        </el-row>
        <el-form-item label="职位描述(JD)" prop="jd">
          <el-input v-model="form.jd" type="textarea" :rows="4" placeholder="岗位职责、工作内容等" />
        </el-form-item>
        <el-form-item label="任职要求" prop="requirements">
          <el-input v-model="form.requirements" type="textarea" :rows="3" placeholder="技能要求、经验要求等" />
        </el-form-item>

        <el-divider content-position="left">🎯 匹配评分标准（AI打分依据）</el-divider>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="最低学历">
              <el-select v-model="form.matchCriteria.minEducation" placeholder="不限" clearable style="width:100%">
                <el-option label="高中" value="高中" />
                <el-option label="大专" value="大专" />
                <el-option label="本科" value="本科" />
                <el-option label="硕士" value="硕士" />
                <el-option label="博士" value="博士" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="最低工作年限">
              <el-input-number v-model="form.matchCriteria.minExperience" :min="0" :max="30" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="最小年龄">
              <el-input-number v-model="form.matchCriteria.minAge" :min="16" :max="70" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="最大年龄">
              <el-input-number v-model="form.matchCriteria.maxAge" :min="16" :max="70" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="必备技能">
          <el-select v-model="form.matchCriteria.requiredSkills" multiple filterable allow-create default-first-option placeholder="输入技能名回车添加，如：Vue.js" style="width:100%">
            <el-option v-for="s in skillOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先技能">
          <el-select v-model="form.matchCriteria.preferredSkills" multiple filterable allow-create default-first-option placeholder="加分技能，如：TypeScript" style="width:100%">
            <el-option v-for="s in skillOptions" :key="s" :label="s" :value="s" />
          </el-select>
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
import { positionAPI } from '../api.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const formRef = ref(null)
const tableData = ref([])
const dialogTitle = ref('新增岗位')
const editId = ref(null)

const skillOptions = ['JavaScript', 'TypeScript', 'Vue.js', 'React', 'Node.js', 'Python', 'Java', 'Go', 'SQL', 'Docker', 'Kubernetes', 'AWS', '产品设计', 'UI设计', '数据分析', '项目管理', '销售', '市场营销', '人力资源']

const searchForm = reactive({ status: '', search: '' })

const form = reactive({
  name: '',
  department: '',
  location: '',
  headcount: 1,
  salaryMin: null,
  salaryMax: null,
  jd: '',
  requirements: '',
  status: 'open',
  matchCriteria: {
    minEducation: '',
    minExperience: null,
    minAge: 18,
    maxAge: 65,
    requiredSkills: [],
    preferredSkills: []
  }
})

const rules = {
  name: [{ required: true, message: '请输入岗位名称', trigger: 'blur' }],
  department: [{ required: true, message: '请输入部门', trigger: 'blur' }],
  location: [{ required: true, message: '请输入工作地点', trigger: 'blur' }],
  jd: [{ required: true, message: '请输入职位描述', trigger: 'blur' }],
  requirements: [{ required: true, message: '请输入任职要求', trigger: 'blur' }]
}

const getStatusName = (s) => ({ open: '招聘中', paused: '暂停', filled: '招满', closed: '关闭' }[s] || s)
const getStatusType = (s) => ({ open: 'success', paused: 'warning', filled: '', closed: 'info' }[s] || '')

const loadData = async () => {
  loading.value = true
  try {
    const res = await positionAPI.list(searchForm)
    if (res.success) tableData.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  searchForm.status = ''
  searchForm.search = ''
  loadData()
}

const resetForm = () => {
  Object.assign(form, {
    name: '', department: '', location: '', headcount: 1,
    salaryMin: null, salaryMax: null, jd: '', requirements: '', status: 'open',
    matchCriteria: {
      minEducation: '', minExperience: null, minAge: 18, maxAge: 65,
      requiredSkills: [], preferredSkills: []
    }
  })
}

const handleCreate = () => {
  editId.value = null
  resetForm()
  dialogTitle.value = '新增岗位'
  dialogVisible.value = true
}

const handleEdit = (row) => {
  editId.value = row._id
  Object.assign(form, {
    name: row.name, department: row.department, location: row.location,
    headcount: row.headcount, salaryMin: row.salaryMin, salaryMax: row.salaryMax,
    jd: row.jd, requirements: row.requirements, status: row.status,
    matchCriteria: {
      minEducation: row.matchCriteria?.minEducation || '',
      minExperience: row.matchCriteria?.minExperience ?? null,
      minAge: row.matchCriteria?.minAge || 18,
      maxAge: row.matchCriteria?.maxAge || 65,
      requiredSkills: row.matchCriteria?.requiredSkills || [],
      preferredSkills: row.matchCriteria?.preferredSkills || []
    }
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
      await positionAPI.update(editId.value, { ...form })
      ElMessage.success('更新成功')
    } else {
      await positionAPI.create({ ...form })
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error('操作失败')
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
.card-header { display: flex; align-items: center; justify-content: space-between; }
.card-title { font-size: 18px; font-weight: 600; }
.search-form { margin-bottom: 16px; }
</style>
