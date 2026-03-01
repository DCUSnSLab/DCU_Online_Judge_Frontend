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

      <!-- 재계산 진행 중 -->
      <div v-if="migrating" style="text-align: center; padding: 40px 0;">
        <i class="el-icon-loading" style="font-size: 32px; color: #E6A23C;"></i>
        <p style="margin-top: 10px; color: #909399;">재계산 진행 중... 강의 수에 따라 시간이 소요될 수 있습니다.</p>
      </div>

      <!-- 교과목 요약 정보 -->
      <div v-if="summary && !loading && !migrating" style="margin-bottom: 20px;">
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
      <div v-if="lectures.length && !loading && !migrating">
        <el-table :data="lectures" style="width: 100%" border stripe size="small">
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
          <el-table-column label="성적 반영" width="100" align="center">
            <template slot-scope="scope">
              <el-progress
                :percentage="scope.row.student_count > 0 ? Math.round(scope.row.scored_students / scope.row.student_count * 100) : 0"
                :stroke-width="14"
                :text-inside="true"
                :color="scope.row.scored_students === scope.row.student_count ? '#67C23A' : '#E6A23C'"
                style="width: 80px;">
              </el-progress>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 재계산 결과 -->
      <div v-if="migrateResult && !migrating" style="margin-top: 20px;">
        <el-alert
          :title="'완료: ' + migrateResult.total_lectures + '개 강의, ' + migrateResult.total_students + '명 학생 처리됨'"
          type="success"
          show-icon
          :closable="false"
          style="margin-bottom: 15px;">
        </el-alert>
        <el-table :data="migrateResult.results" style="width: 100%" border size="small">
          <el-table-column prop="lecture_id" label="강의 ID" width="80" align="center"></el-table-column>
          <el-table-column prop="title" label="교과목명"></el-table-column>
          <el-table-column label="처리 결과" width="150" align="center">
            <template slot-scope="scope">
              <el-tag v-if="!scope.row.error" type="success" size="small">{{ scope.row.student_count }}명 완료</el-tag>
              <el-tag v-else type="danger" size="small">오류</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="상세">
            <template slot-scope="scope">
              <span v-if="scope.row.error" style="color: #F56C6C;">{{ scope.row.error }}</span>
              <span v-else style="color: #67C23A;">정상 처리</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 초기 상태 -->
      <div v-if="!lectures.length && !loading && !migrating && !migrateResult" style="text-align: center; padding: 60px 0; color: #909399;">
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
        lectures: [],
        summary: null,
        migrateResult: null
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
        this.migrateResult = null
        api.getBatchMigrateLectures(this.year, this.semester).then(res => {
          this.loading = false
          this.lectures = res.data.data.lectures || []
          this.summary = res.data.data.summary || null
        }).catch(() => {
          this.loading = false
        })
      },
      startBatchMigrate () {
        if (!this.lectures.length) {
          this.$warning('조회된 교과목이 없습니다.')
          return
        }
        this.$confirm(
          `${this.year}년 ${this.semester}학기의 ${this.lectures.length}개 교과목 성적을 재계산합니다. 계속하시겠습니까?`,
          '일괄 재계산 확인',
          {
            type: 'warning',
            confirmButtonText: '시작',
            cancelButtonText: '취소'
          }
        ).then(() => {
          this.migrating = true
          this.migrateResult = null
          api.batchMigrateLecture({year: this.year, semester: this.semester}).then(res => {
            this.migrating = false
            this.migrateResult = res.data.data
            // 재계산 후 교과목 정보 새로고침
            this.fetchLectures()
          }).catch(() => {
            this.migrating = false
          })
        }).catch(() => {})
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
</style>
