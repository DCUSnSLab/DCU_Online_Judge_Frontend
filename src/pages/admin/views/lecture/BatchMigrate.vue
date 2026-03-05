<template>
  <div class="view">
    <Panel :title="$t('m.Lecture') + $t('m.Batch_Title_Suffix')">
      <div slot="header">
        <el-row :gutter="20" type="flex" align="middle">
          <el-col :span="5">
            <el-select v-model="year" :placeholder="$t('m.Batch_Select_Year')" style="width: 100%" @change="fetchLectures">
              <el-option v-for="y in yearOptions" :key="y" :label="y + $t('m.Batch_Year_Suffix')" :value="y"></el-option>
            </el-select>
          </el-col>
          <el-col :span="5">
            <el-select v-model="semester" :placeholder="$t('m.Batch_Select_Semester')" style="width: 100%" @change="fetchLectures">
              <el-option :label="$t('m.Batch_Semester_1')" :value="1"></el-option>
              <el-option :label="$t('m.Batch_Semester_2')" :value="2"></el-option>
            </el-select>
          </el-col>
          <el-col :span="5">
            <el-button type="primary" icon="el-icon-refresh" :loading="migrating" :disabled="!lectures.length" @click="startBatchMigrate">
              {{$t('m.Batch_Start')}}
            </el-button>
          </el-col>
        </el-row>
      </div>

      <!-- 로딩 -->
      <div v-if="loading" style="text-align: center; padding: 40px 0;">
        <i class="el-icon-loading" style="font-size: 32px; color: #409EFF;"></i>
        <p style="margin-top: 10px; color: #909399;">{{$t('m.Batch_Loading')}}</p>
      </div>

      <!-- 재계산 진행 상태 -->
      <div v-if="migrating" style="margin-bottom: 20px;">
        <div class="progress-container">
          <div class="progress-header">
            <span class="progress-title">
              <i class="el-icon-loading" style="color: #E6A23C;"></i>
              {{$t('m.Batch_In_Progress')}}
            </span>
            <span class="progress-count">{{ migrateProgress.completed }} / {{ migrateProgress.total }} {{$t('m.Batch_Courses_Unit')}}</span>
          </div>
          <el-progress
            :percentage="migrateProgress.total > 0 ? Math.round(migrateProgress.completed / migrateProgress.total * 100) : 0"
            :stroke-width="20"
            :text-inside="true"
            :color="progressColors"
            style="margin: 10px 0;">
          </el-progress>
          <p v-if="migrateProgress.currentLecture" class="progress-current">
            {{$t('m.Batch_Processing')}} <strong>{{ migrateProgress.currentLecture }}</strong>
          </p>
        </div>
      </div>

      <!-- 교과목 요약 정보 -->
      <div v-if="summary && !loading" style="margin-bottom: 20px;">
        <el-row :gutter="20">
          <el-col :span="4">
            <div class="summary-card">
              <div class="summary-value">{{ summary.total_lectures }}</div>
              <div class="summary-label">{{$t('m.Batch_Summary_Courses')}}</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="summary-card">
              <div class="summary-value">{{ summary.total_students }}</div>
              <div class="summary-label">{{$t('m.Batch_Summary_Students')}}</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="summary-card">
              <div class="summary-value">{{ summary.total_contests }}</div>
              <div class="summary-label">{{$t('m.Batch_Summary_Lectures')}}</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="summary-card">
              <div class="summary-value">{{ summary.total_problems }}</div>
              <div class="summary-label">{{$t('m.Batch_Summary_Problems')}}</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="summary-card">
              <div class="summary-value">{{ summary.total_submissions }}</div>
              <div class="summary-label">{{$t('m.Batch_Summary_Submissions')}}</div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 교과목 리스트 테이블 -->
      <div v-if="lectures.length && !loading">
        <el-table :data="lectures" style="width: 100%" border stripe size="small" :row-class-name="tableRowClassName">
          <el-table-column prop="id" label="ID" width="60" align="center"></el-table-column>
          <el-table-column prop="title" :label="$t('m.Batch_Col_Course_Name')" min-width="200">
            <template slot-scope="scope">
              <span>{{ scope.row.title }}</span>
              <el-tag v-if="!scope.row.status" type="info" size="mini" style="margin-left: 5px;">{{$t('m.Batch_Col_Inactive')}}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_by" :label="$t('m.Batch_Col_Professor')" width="100" align="center"></el-table-column>
          <el-table-column prop="student_count" :label="$t('m.Batch_Col_Students')" width="75" align="center">
            <template slot-scope="scope">
              <span>{{ scope.row.student_count }}{{$t('m.Batch_Col_Students_Unit')}}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('m.Batch_Col_Practice_Assignment_Exam')" width="120" align="center">
            <template slot-scope="scope">
              <span>{{ scope.row.training_count }} / {{ scope.row.assignment_count }} / {{ scope.row.exam_count }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="problem_count" :label="$t('m.Batch_Col_Problem_Count')" width="80" align="center"></el-table-column>
          <el-table-column :label="$t('m.Batch_Col_Submissions')" width="120" align="center">
            <template slot-scope="scope">
              <span>{{ scope.row.submission_count }}</span>
              <span v-if="scope.row.submission_count > 0" style="color: #67C23A; font-size: 12px;">
                ({{ Math.round(scope.row.accepted_count / scope.row.submission_count * 100) }}% AC)
              </span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('m.Batch_Col_Recalculate')" width="110" align="center">
            <template slot-scope="scope">
              <span v-if="scope.row._migrate_status === 'done'">
                <i class="el-icon-success" style="color: #67C23A; font-size: 16px;"></i>
                <span style="color: #67C23A; font-size: 12px; margin-left: 3px;">{{ scope.row._migrate_students }}{{$t('m.Batch_Col_Students_Unit')}}</span>
                <span v-if="scope.row._migrate_elapsed" style="color: #909399; font-size: 11px; margin-left: 2px;">({{ scope.row._migrate_elapsed }}ms)</span>
              </span>
              <span v-else-if="scope.row._migrate_status === 'error'">
                <el-tooltip :content="scope.row._migrate_error" placement="top">
                  <i class="el-icon-warning" style="color: #F56C6C; font-size: 16px;"></i>
                </el-tooltip>
              </span>
              <span v-else-if="scope.row._migrate_status === 'processing'">
                <i class="el-icon-loading" style="color: #E6A23C; font-size: 16px;"></i>
                <span style="color: #E6A23C; font-size: 12px; margin-left: 3px;">{{$t('m.Batch_Status_Processing')}}</span>
              </span>
              <span v-else-if="scope.row._migrate_status === 'waiting'">
                <i class="el-icon-time" style="color: #909399; font-size: 14px;"></i>
                <span style="color: #909399; font-size: 12px; margin-left: 3px;">{{$t('m.Batch_Status_Waiting')}}</span>
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
        <p style="margin-top: 15px;">{{$t('m.Batch_Empty_Msg')}}</p>
        <p style="font-size: 12px; color: #C0C4CC;">{{$t('m.Batch_Empty_Hint')}}</p>
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
        const totalElapsed = this.lectures.reduce((sum, l) => sum + (l._migrate_elapsed || 0), 0)
        let msg = this.$t('m.Batch_Complete_Msg').replace('{done}', done).replace('{students}', totalStudents).replace('{elapsed}', (totalElapsed / 1000).toFixed(1))
        if (errors > 0) msg += ` (${this.$t('m.Batch_Error_Count').replace('{errors}', errors)})`
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
            l._migrate_elapsed = 0
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
            `${this.year}${this.$t('m.Batch_Year_Suffix')} ${this.semester}${this.$t('m.Batch_Select_Semester')} - ${this.lectures.length} ${this.$t('m.Batch_Courses_Unit')}`,
            this.$t('m.Batch_Confirm_Title'),
            { type: 'warning', confirmButtonText: this.$t('m.Batch_Confirm_Start'), cancelButtonText: this.$t('m.Batch_Confirm_Cancel') }
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
          l._migrate_elapsed = 0
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
            lecture._migrate_elapsed = data.elapsed_ms || 0
          } catch (e) {
            lecture._migrate_status = 'error'
            lecture._migrate_error = this.$t('m.Batch_Request_Failed')
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
