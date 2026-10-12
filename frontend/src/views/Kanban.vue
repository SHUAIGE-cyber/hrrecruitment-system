<template>
  <div class="kanban">
    <div class="kanban-header">
      <h2>面试看板</h2>
      <div class="kanban-actions">
        <el-select v-model="selectedPosition" placeholder="选择岗位" clearable style="width: 200px">
          <el-option v-for="pos in positions" :key="pos._id" :label="pos.name" :value="pos._id" />
        </el-select>
      </div>
    </div>

    <div class="kanban-board" ref="boardRef">
      <div
        v-for="stage in stages"
        :key="stage.value"
        class="kanban-column"
        :style="{ '--column-color': stage.color }"
      >
        <div class="kanban-column-header" :style="{ background: stage.color + '20', color: stage.color }">
          <span>{{ stage.label }}</span>
          <el-tag size="small" :type="stage.tagType">{{ getStageCount(stage.value) }}</el-tag>
        </div>
        <div
          class="kanban-cards"
          :data-stage="stage.value"
          @dragover="handleDragOver"
          @drop="handleDrop"
        >
          <div
            v-for="candidate in getStageCandidates(stage.value)"
            :key="candidate._id"
            class="kanban-card"
            draggable="true"
            @dragstart="handleDragStart($event, candidate)"
            @click="handleCardClick(candidate)"
          >
            <div class="card-header">
              <span class="card-name">{{ candidate.name }}</span>
              <el-tag v-if="candidate.matchScore" size="small" :type="getMatchType(candidate.matchScore)">
                {{ candidate.matchScore }}分
              </el-tag>
            </div>
            <div class="card-info">
              <span class="info-item">{{ candidate.education || '未知学历' }}</span>
              <span class="info-item">{{ candidate.workExperience || 0 }}年经验</span>
            </div>
            <div class="card-tags" v-if="candidate.aiTags?.length">
              <el-tag
                v-for="(tag, i) in candidate.aiTags.slice(0, 3)"
                :key="i"
                size="small"
                class="card-tag"
              >{{ tag }}</el-tag>
            </div>
            <div class="card-footer">
              <span class="card-time">{{ formatDate(candidate.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 面试详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="面试详情"
      width="700px"
      destroy-on-close
    >
      <CandidateDetail v-if="selectedCandidate" :candidate-id="selectedCandidate._id" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { candidateAPI, positionAPI } from '../api'
import CandidateDetail from './CandidateDetail.vue'

const stages = [
  { label: '简历初筛', value: 'resume_screen', color: '#909399', tagType: 'info' },
  { label: '一面', value: 'interview_1', color: '#409EFF', tagType: '' },
  { label: '二面', value: 'interview_2', color: '#E6A23C', tagType: 'warning' },
  { label: '终面', value: 'interview_3', color: '#F56C6C', tagType: 'danger' },
  { label: 'Offer', value: 'offer', color: '#67C23A', tagType: 'success' },
  { label: '待入职', value: 'onboard', color: '#000000', tagType: 'info' },
  { label: '淘汰', value: 'rejected', color: '#C0C4CC', tagType: 'info' }
]

const candidates = ref([])
const positions = ref([])
const selectedPosition = ref('')
const detailDialogVisible = ref(false)
const selectedCandidate = ref(null)
const boardRef = ref(null)
const draggedCandidate = ref(null)

const getStageCount = (stageValue) => {
  return candidates.value.filter(c => c.currentStage === stageValue).length
}

const getStageCandidates = (stageValue) => {
  let filtered = candidates.value.filter(c => c.currentStage === stageValue)
  if (selectedPosition.value) {
    filtered = filtered.filter(c =>
      c.appliedPositions?.some(p => p.positionId?._id === selectedPosition.value || p.positionId === selectedPosition.value)
    )
  }
  return filtered
}

const getMatchType = (score) => {
  if (score >= 80) return 'success'
  if (score >= 60) return ''
  return 'danger'
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

const handleDragStart = (event, candidate) => {
  draggedCandidate.value = candidate
  event.dataTransfer.effectAllowed = 'move'
  event.target.classList.add('dragging')
}

const handleDragOver = (event) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
}

const handleDrop = async (event) => {
  event.preventDefault()
  const column = event.target.closest('.kanban-cards')
  if (!column || !draggedCandidate.value) return

  const newStage = column.dataset.stage
  const candidate = draggedCandidate.value

  try {
    await candidateAPI.update(candidate._id, { currentStage: newStage })
    candidate.currentStage = newStage
  } catch (error) {
    console.error('更新阶段失败:', error)
  }

  draggedCandidate.value = null
}

const handleCardClick = (candidate) => {
  selectedCandidate.value = candidate
  detailDialogVisible.value = true
}

const loadCandidates = async () => {
  try {
    const res = await candidateAPI.list({ page: 1, pageSize: 200 })
    if (res.success) {
      candidates.value = res.data
    }
  } catch (error) {
    console.error('加载候选人失败:', error)
  }
}

const loadPositions = async () => {
  try {
    const res = await positionAPI.list({ status: 'open' })
    if (res.success) {
      positions.value = res.data
    }
  } catch (error) {
    console.error('加载岗位失败:', error)
  }
}

onMounted(() => {
  loadCandidates()
  loadPositions()
})
</script>

<style scoped>
.kanban {
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

.kanban-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.kanban-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.kanban-actions {
  display: flex;
  gap: 12px;
}

.kanban-board {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 8px 0;
  flex: 1;
  min-height: 0;
}

.kanban-column {
  min-width: 260px;
  max-width: 300px;
  flex: 1;
  background: #f0f2f5;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.kanban-column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 8px 8px 0 0;
  font-weight: 600;
  font-size: 14px;
}

.kanban-cards {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  min-height: 100px;
}

.kanban-card {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: all 0.2s;
}

.kanban-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transform: translateY(-1px);
}

.kanban-card.dragging {
  opacity: 0.5;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.card-name {
  font-weight: 600;
  font-size: 15px;
  color: #303133;
}

.card-info {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.info-item {
  font-size: 12px;
  color: #909399;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.card-tag {
  font-size: 11px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-time {
  font-size: 11px;
  color: #c0c4cc;
}
</style>
