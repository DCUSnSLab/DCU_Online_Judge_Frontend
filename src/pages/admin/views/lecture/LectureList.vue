<template>
  <div class="view">
    <Panel :title="$t('m.Lecture_List')">
      <div slot="header">
        <div class="filter-row">
          <el-select v-model="query.year" :placeholder="$t('m.LectureList_Filter_Year')" clearable size="small" style="width: 110px; margin-right: 8px;" @change="applyFilter">
            <el-option v-for="y in yearOptions" :key="y" :label="y + $t('m.LectureList_Year_Suffix')" :value="y"></el-option>
          </el-select>
          <el-select v-model="query.semester" :placeholder="$t('m.LectureList_Filter_Semester')" clearable size="small" style="width: 120px; margin-right: 8px;" @change="applyFilter">
            <el-option :label="$t('m.LectureList_Semester_1')" :value="1"></el-option>
            <el-option :label="$t('m.LectureList_Semester_2')" :value="2"></el-option>
            <el-option :label="$t('m.LectureList_Pre_Admission_Education')" :value="3"></el-option>
          </el-select>
          <el-select v-model="query.professor" :placeholder="$t('m.LectureList_Filter_Professor')" clearable size="small" style="width: 130px; margin-right: 8px;" @change="applyFilter">
            <el-option v-for="p in professorOptions" :key="p" :label="p" :value="p"></el-option>
          </el-select>
          <el-input
            v-model="query.keyword"
            prefix-icon="el-icon-search"
            placeholder="Keywords"
            size="small"
            style="width: 200px;">
          </el-input>
        </div>
      </div>
      <el-table
        v-loading="loading"
        element-loading-text="loading"
        ref="table"
        :data="lectureList"
        :default-sort="{prop: 'id', order: 'descending'}"
        style="width: 100%">
        <el-table-column type="expand">
          <template slot-scope="props">
            <p>Start Time: {{props.row.start_time | localtime }}</p>
            <p>End Time: {{props.row.end_time | localtime }}</p>
            <p>Create Time: {{props.row.create_time | localtime}}</p>
            <p>Creator: {{props.row.created_by.username}}</p>
          </template>
        </el-table-column>
        <el-table-column
          prop="id"
          width="80"
          sortable
          label="ID">
        </el-table-column>
        <el-table-column
          prop="year"
          width="80"
          sortable
          :label="$t('m.Lecture_Year')">
        </el-table-column>
        <el-table-column
          prop="semester"
          width="100"
          sortable
          align="center"
          :label="$t('m.Lecture_Semester')">
          <template slot-scope="scope">
            <span v-if="scope.row.semester < 3">{{scope.row.semester}}{{$t('m.LectureList_Semester_Suffix')}}</span>
            <span v-else>{{$t('m.LectureList_Pre_Admission')}}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="created_by.realname"
          width="80"
          align="center"
          :label="$t('m.Assigned_professor')">
        </el-table-column>
        <el-table-column
          prop="title"
          sortable
          :label="$t('m.Lecture_title')">
        </el-table-column>
        <el-table-column
          width="100"
          :label="$t('m.Lecture_Status')">
          <template slot-scope="scope">
            <el-switch v-model="scope.row.status"
                    active-text=""
                inactive-text=""
                @change="handleVisibleSwitch(scope.row)">
            </el-switch>
          </template>
        </el-table-column>
        <el-table-column
          fixed="right"
          width="250"
          label="">
          <div slot-scope="scope">
            <icon-btn :name="$t('m.LectureList_Edit_Lecture')" icon="edit" @click.native="goEdit(scope.row.id)"></icon-btn>
            <icon-btn :name="$t('m.LectureList_Practice_Assignment_List')" icon="list-ol" @click.native="goLectureContestList(scope.row.id, scope.row.title, scope.row.created_by.realname)"></icon-btn>
            <el-tooltip class="item" effect="dark" :content="$t('m.LectureList_Student_List')" placement="top">
              <el-button :name="$t('m.LectureList_Student_List')" size="mini" icon="el-icon-user" @click.native="goLectureStudentList(scope.row.id, scope.row.title, scope.row.created_by.realname)"></el-button>
            </el-tooltip>
            <icon-btn :name="$t('m.LectureList_Delete_Lecture')" icon="trash" @click.native="deleteLecture(scope.row.id)"></icon-btn>
          </div>
        </el-table-column>
      </el-table>
      <div class="panel-options">
        <el-pagination
          class="page"
          layout="prev, pager, next"
          @current-change="pushRouter"
          :page-size="pageSize"
          :total="total"
          :current-page.sync="query.page">
        </el-pagination>
      </div>
    </Panel>
  </div>
</template>

<script>
  import api from '../../api.js'
  import utils from '@/utils/utils'
  export default {
    name: '',
    data () {
      // 페이지·필터·검색어를 모두 URL 쿼리에 보존해, 상세 보고 뒤로가기 시 상태가 복원되도록 한다.
      // watch 등록 전인 data 단계에서 라우트 값을 읽어 초기화한다(복원값이 watch 를 트리거하지 않도록).
      const q = this.$route.query
      let page = parseInt(q.page) || 1
      if (page < 1) {
        page = 1
      }
      return {
        pageSize: 25,
        total: 0,
        lectureList: [],
        yearOptions: [],
        professorOptions: [],
        loading: false,
        excludeAdmin: true,
        currentId: 1,
        downloadDialogVisible: false,
        query: {
          page: page,
          // el-select 옵션 값이 숫자이므로 연도·학기는 숫자로 복원해야 선택 상태가 반영된다.
          year: q.year ? parseInt(q.year) : '',
          semester: q.semester ? parseInt(q.semester) : '',
          professor: q.professor || '',
          keyword: q.keyword || ''
        }
      }
    },
    mounted () {
      this.getFilterOptions()
      this.getLectureList()
    },
    methods: {
      applyFilter () {
        // 필터 변경 시 1페이지로 리셋한 뒤 전체 레코드 기준으로 서버에서 재조회
        this.query.page = 1
        this.pushRouter()
      },
      pushRouter () {
        this.$router.push({
          name: 'lecture-list',
          query: utils.filterEmptyValue(this.query)
        }).catch(() => {})
        this.getLectureList()
      },
      getFilterOptions () {
        api.getLectureFilterOptions().then(res => {
          this.yearOptions = res.data.data.years || []
          this.professorOptions = res.data.data.professors || []
        }, () => {})
      },
      getLectureList () {
        this.loading = true
        api.getLectureList((this.query.page - 1) * this.pageSize, this.pageSize, this.query.keyword, this.query.year, this.query.semester, this.query.professor).then(res => {
          this.loading = false
          this.total = res.data.data.total
          this.lectureList = res.data.data.results
        }, res => {
          this.loading = false
        })
      },
      openDownloadOptions (lectureId) {
        this.downloadDialogVisible = true
        this.currentId = lectureId
      },
      goEdit (lectureId) {
        this.$router.push({name: 'edit-lecture', params: {lectureId}})
      },
      goLectureContestList (lectureId) {
        this.$router.push({name: 'lecture-contest-list', params: {lectureId}})
      },
      goLectureStudentList (lectureId) {
        this.$router.push({name: 'lecture-student-list', params: {lectureId}})
      },
      deleteLecture (lectureId) {
        this.$confirm(this.$t('m.LectureList_Delete_Alert_Msg'), this.$t('m.LectureList_Delete_Alert_Confirm'), {
          type: 'warning'
        }).then(() => {
          api.deleteLecture(lectureId).then(res => {
            this.getLectureList()
          }).catch(() => {
            this.getLectureList()
          })
        }, () => {
        })
      },
      filterHandler (value, row, column) {
        const property = column['property']
        return row[property] === value
      },
      handleVisibleSwitch (row) {
        api.editLecture(row)
      }
    },
    watch: {
      'query.keyword' () {
        // 검색어는 입력마다 갱신되므로 history 를 늘리지 않도록 replace 로 URL 만 동기화한다.
        this.query.page = 1
        this.$router.replace({
          name: 'lecture-list',
          query: utils.filterEmptyValue(this.query)
        }).catch(() => {})
        this.getLectureList()
      }
    }
  }
</script>

<style scoped>
  .filter-row {
    display: flex;
    align-items: center;
  }
</style>
