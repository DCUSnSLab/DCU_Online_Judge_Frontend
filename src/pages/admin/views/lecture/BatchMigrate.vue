<template>
  <div class="view">
    <Panel :title="$t('m.Lecture') + ' - 일괄 성적 재계산'">
      <div slot="header">
        <el-row :gutter="20" type="flex" align="middle">
          <el-col :span="5">
            <el-select v-model="year" placeholder="년도 선택" style="width: 100%" @change="fetchLectures">
              <el-option v-for="y in yearOptions" :key="y" :label="y + '년'" :value="y"></el-option>
            </el-select>
          </el-col>
          <el-col :span="5">
            <el-select v-model="semester" placeholder="학기 선택" style="width: 100%" @change="fetchLectures">
              <el-option :label="'1학기'" :value="1"></el-option>
              <el-option :label="'2학기'" :value="2"></el-option>
            </el-select>
          </el-col>
          <el-col :span="5">
            <el-button type="primary" icon="el-icon-refresh" :loading="migrating" :disabled="!lectures.length" @click="startBatchMigrate">
              재계산 시작
            </el-button>
          </el-col>
        </el-row>
      </div>

      <!-- 로딩 -->
      <div v-if="loading" style="text-align: center; padding: 40px 0;">
        <i class="el-icon-loading" style="font-size: 32px; color: #409EFF;"></i>
        <p style="margin-top: 10px; color: #909399;">교과목 정보 조회 중...</p>
      </div>

      <!-- 재계산 진행 상태 -->
      <div v-if="migrating" style="margin-bottom: 20px;">
        <div class="progress-container">
          <div class="progress-header">
            <span class="progress-title">
              <i class="el-icon-loading" style="color: #E6A23C;"></i>
              재계산 진행 중
            </span>
            <span class="progress-count">{{ migrateProgress.completed }} / {{ migrateProgress.total }} 교과목</span>
          </div>
          <el-progress
            :percentage="migrateProgress.total > 0 ? Math.round(migrateProgress.completed / migrateProgress.total * 100) : 0"
            :stroke-width="20"
            :text-inside="true"
            :color="progressColors"
            style="margin: 10px 0;">
          </el-progress>
          <p v-if="migrateProgress.currentLecture" class="progress-current">
            처리 중: <strong>{{ migrateProgress.currentLecture }}</strong>
          </p>
        </div>
      </div>

      <!-- 교과목 요약 정보 -->
      <div v-if="summary && !loading" style="margin-bottom: 20px;">
        <el-row :gutter="20">
          <el-col :span="4">
            <div class="summary-card">
              <div class="summary-value">{{ summary.total_lectures }}</div>
              <div class="summary-label">교과목</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="summary-card">
              <div class="summary-value">{{ summary.total_students }}</div>
              <div class="summary-label">총 수강생</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="summary-card">
              <div class="summary-value">{{ summary.total_contests }}</div>
              <div class="summary-label">총 강의</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="summary-card">
              <div class="summary-value">{{ summary.total_problems }}</div>
              <div class="summary-label">총 문제</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="summary-card">
              <div class="summary-value">{{ summary.total_submissions }}</div>
              <div class="summary-label">총 제출</div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 교과목 리스트 테이블 -->
      <div v-if="lectures.length && !loading">
        <el-table :data="lectures" style="width: 100%" border stripe size="small" :row-class-name="tableRowClassName">
          <el-table-column prop="id" label="ID" width="60" align="center"></el-table-column>
          <el-table-column prop="title" label="교과목명" min-width="200">
            <template slot-scope="scope">
              <span>{{ scope.row.title }}</span>
              <el-tag v-if="!scope.row.status" type="info" size="mini" style="margin-left: 5px;">비활성</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_by" label="담당교수" width="100" align="center"></el-table-column>
          <el-table-column prop="student_count" label="수강생" width="75" align="center">
            <template slot-scope="scope">
              <span>{{ scope.row.student_count }}명</span>
            </template>
          </el-table-column>
          <el-table-column label="실습/과제/시험" width="120" align="center">
            <template slot-scope="scope">
              <span>{{ scope.row.training_count }} / {{ scope.row.assignment_count }} / {{ scope.row.exam_count }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="problem_count" label="문제 수" width="80" align="center"></el-table-column>
          <el-table-column label="제출" width="120" align="center">
            <template slot-scope="scope">
              <span>{{ scope.row.submission_count }}</span>
              <span v-if="scope.row.submission_count > 0" style="color: #67C23A; font-size: 12px;">
                ({{ Math.round(scope.row.accepted_count / scope.row.submission_count * 100) }}% AC)
              </span>
            </template>
          </el-table-column>
          <el-table-column label="재계산" width="110" align="center">
            <template slot-scope="scope">
              <span v-if="scope.row._migrate_status === 'done'">
                <i class="el-icon-success" style="color: #67C23A; font-size: 16px;"></i>
                <span style="color: #67C23A; font-size: 12px; margin-left: 3px;">{{ scope.row._migrate_students }}명</span>
              </span>
              <span v-else-if="scope.row._migrate_status === 'error'">
                <el-tooltip :content="scope.row._migrate_error" placement="top">
                  <i class="el-icon-warning" style="color: #F56C6C; font-size: 16px;"></i>
                </el-tooltip>
              </span>
              <span v-else-if="scope.row._migrate_status === 'processing'">
                <i class="el-icon-loading" style="color: #E6A23C; font-size: 16px;"></i>
                <span style="color: #E6A23C; font-size: 12px; margin-left: 3px;">처리중</span>
              </span>
              <span v-else-if="scope.row._migrate_status === 'waiting'">
                <i class="el-icon-time" style="color: #909399; font-size: 14px;"></i>
                <span style="color: #909399; font-size: 12px; margin-left: 3px;">대기</span>
              </span>
              <span v-else style="color: #C0C4CC;">-</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 재계산 완료 요약 -->
      <div v-if="migrateCompleted && !migrating" style="margin-top: 15px;">
        <el-alert
          :title="migrateCompleteSummary"
          :type="migrateHasErrors ? 'warning' : 'success'"
          show-icon
          :closable="false">
        </el-alert>
      </div>

      <!-- 초기 상태 -->
      <div v-if="!lectures.length && !loading && !migrating" style="text-align: center; padding: 60px 0; color: #909399;">
        <i class="el-icon-s-data" style="font-size: 48px;"></i>
        <p style="margin-top: 15px;">년도와 학기를 선택하면 교과목 정보가 표시됩니다.</p>
        <p style="font-size: 12px; color: #C0C4CC;">교과목을 확인한 후 "재계산 시작" 버튼으로 일괄 재계산할 수 있습니다.</p>
      </div>
    </Panel>
  </div>
</template>

<script>
  import api from '../../api.js'

  export default {
    name: 'BatchMigrate',
    data () {
      return {
        year: new Date().getFullYear(),
        semester: 1,
        loading: false,
        migrating: false,
        migrateCompleted: false,
        lectures: [],
        summary: null,
        migrateProgress: {
          total: 0,
          completed: 0,
          currentLecture: ''
        }
      }
    },
    computed: {
      yearOptions () {
        const currentYear = new Date().getFullYear()
        const years = []
        for (let y = currentYear; y >= currentYear - 5; y--) {
          years.push(y)
        }
        return years
      },
      progressColors () {
        return [
          {color: '#E6A23C', percentage: 50},
          {color: '#409EFF', percentage: 80},
          {color: '#67C23A', percentage: 100}
        ]
      },
      migrateHasErrors () {
        return this.lectures.some(l => l._migrate_status === 'error')
      },
      migrateCompleteSummary () {
        const done = this.lectures.filter(l => l._migrate_status === 'done').length
        const errors = this.lectures.filter(l => l._migrate_status === 'error').length
        const totalStudents = this.lectures.reduce((sum, l) => sum + (l._migrate_students || 0), 0)
        let msg = `완료: ${done}개 교과목, ${totalStudents}명 학생 처리`
        if (errors > 0) msg += ` (${errors}개 오류 발생)`
        return msg
      }
    },
    mounted () {
      this.fetchLectures()
    },
    methods: {
      fetchLectures () {
        if (!this.year || !this.semester) return
        this.loading = true
        this.lectures = []
        this.summary = null
        this.migrateCompleted = false
        api.getBatchMigrateLectures(this.year, this.semester).then(res => {
          this.loading = false
          const lectures = res.data.data.lectures || []
          // 각 lecture에 재계산 상태 필드 추가
          lectures.forEach(l => {
            l._migrate_status = ''
            l._migrate_students = 0
            l._migrate_error = ''
          })
          this.lectures = lectures
          this.summary = res.data.data.summary || null
        }).catch(() => {
          this.loading = false
        })
      },
      tableRowClassName ({row}) {
        if (row._migrate_status === 'done') return 'row-success'
        if (row._migrate_status === 'error') return 'row-error'
        if (row._migrate_status === 'processing') return 'row-processing'
        return ''
      },
      async startBatchMigrate () {
        if (!this.lectures.length) return

        try {
          await this.$confirm(
            `${this.year}년 ${this.semester}학기의 ${this.lectures.length}개 교과목 성적을 재계산합니다. 계속하시겠습니까?`,
            '일괄 재계산 확인',
            { type: 'warning', confirmButtonText: '시작', cancelButtonText: '취소' }
          )
        } catch (e) {
          return // 취소
        }

        this.migrating = true
        this.migrateCompleted = false
        this.migrateProgress = {
          total: this.lectures.length,
          completed: 0,
          currentLecture: ''
        }

        // 모든 lecture를 대기 상태로
        this.lectures.forEach(l => {
          l._migrate_status = 'waiting'
          l._migrate_students = 0
          l._migrate_error = ''
        })

        // 순차적으로 각 교과목 처리
        for (let i = 0; i < this.lectures.length; i++) {
          const lecture = this.lectures[i]
          lecture._migrate_status = 'processing'
          this.migrateProgress.currentLecture = lecture.title
          // Vue reactivity
          this.$set(this.lectures, i, Object.assign({}, lecture))

          try {
            const res = await api.batchMigrateLecture({lecture_id: lecture.id})
            const data = res.data.data
            lecture._migrate_status = data.error ? 'error' : 'done'
            lecture._migrate_students = data.student_count || 0
            lecture._migrate_error = data.error || ''
          } catch (e) {
            lecture._migrate_status = 'error'
            lecture._migrate_error = '요청 실패'
          }

          this.migrateProgress.completed = i + 1
          this.$set(this.lectures, i, Object.assign({}, lecture))
        }

        this.migrating = false
        this.migrateCompleted = true
        this.migrateProgress.currentLecture = ''
      }
    }
  }
</script>

<style scoped>
  .summary-card {
    text-align: center;
    padding: 15px 0;
    background: #f5f7fa;
    border-radius: 6px;
    margin-bottom: 15px;
  }
  .summary-value {
    font-size: 24px;
    font-weight: bold;
    color: #303133;
  }
  .summary-label {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }
  .progress-container {
    background: #fdf6ec;
    border: 1px solid #faecd8;
    border-radius: 8px;
    padding: 15px 20px;
  }
  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
  }
  .progress-title {
    font-weight: bold;
    color: #E6A23C;
    font-size: 14px;
  }
  .progress-count {
    font-size: 16px;
    font-weight: bold;
    color: #303133;
  }
  .progress-current {
    margin: 8px 0 0 0;
    font-size: 13px;
    color: #909399;
  }
</style>

<style>
  .el-table .row-success {
    background: #f0f9eb !important;
  }
  .el-table .row-error {
    background: #fef0f0 !important;
  }
  .el-table .row-processing {
    background: #fdf6ec !important;
  }
</style>
