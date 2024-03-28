<template>
  <div class="view">
    <Panel :title="$t('m.Lecture_List')">
      <div slot="header">
        <el-input
          v-model="keyword"
          prefix-icon="el-icon-search"
          placeholder="Keywords">
        </el-input>
      </div>
      <el-table
        v-loading="loading"
        element-loading-text="loading"
        ref="table"
        :data="lectureList"
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
          label="ID">
        </el-table-column>
        <el-table-column
          prop="year"
          width="70"
          label="년도">
        </el-table-column>
        <el-table-column
          width="90"
          align="center"
          label="학기">
          <template slot-scope="scope">
            <p v-if="scope.row.semester < 3">{{scope.row.semester}}</p>
            <p v-else>입학 전</p>
          </template>
        </el-table-column>
        <el-table-column
          prop="created_by.realname"
          width="80"
          align="center"
          label="담당교수">
        </el-table-column>
        <el-table-column
          prop="title"
          label="과목명">
        </el-table-column>
		<el-table-column
		  width="100"
		  label="상태">
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
            <icon-btn name="과목 수정" icon="edit" @click.native="goEdit(scope.row.id)"></icon-btn>
            <icon-btn name="실습, 과제 목록" icon="list-ol" @click.native="goLectureContestList(scope.row.id, scope.row.title, scope.row.created_by.realname)"></icon-btn>
            <!--<icon-btn name="Student List" icon="list-ol" @click.native="goLectureStudentList(scope.row.id, scope.row.title, scope.row.created_by.realname)"></icon-btn>-->
            <el-tooltip class="item" effect="dark" content="학생 목록" placement="top">
              <el-button name="Student List" size="mini" icon="el-icon-user" @click.native="goLectureStudentList(scope.row.id, scope.row.title, scope.row.created_by.realname)"></el-button>
            </el-tooltip>
            <icon-btn name="과목 삭제" icon="trash" @click.native="deleteLecture(scope.row.id)"></icon-btn>
          </div>
        </el-table-column>
      </el-table>
      <div class="panel-options">
        <el-pagination
          class="page"
          layout="prev, pager, next"
          @current-change="currentChange"
          :page-size="pageSize"
          :total="total">
        </el-pagination>
      </div>
    </Panel>
  </div>
</template>

<script>
  import api from '../../api.js'

  export default {
    name: '',
    data () {
      return {
        pageSize: 25,
        total: 0,
        lectureList: [],
        keyword: '',
        loading: false,
        excludeAdmin: true,
        currentPage: 1,
        currentId: 1,
        downloadDialogVisible: false
      }
    },
    mounted () {
      this.getLectureList(this.currentPage)
    },
    methods: {
      currentChange (page) {
        this.currentPage = page
        this.getLectureList(page)
      },
      getLectureList (page) {
        this.loading = true
        api.getLectureList((page - 1) * this.pageSize, this.pageSize, this.keyword).then(res => {
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
        this.$confirm('정말로 이 수강과목을 삭제하시겠습니까?', 'confirm', {
          type: 'warning'
        }).then(() => {
          api.deleteLecture(lectureId).then(res => {
            this.getLectureList(this.currentPage)
          }).catch(() => {
            this.getLectureList(this.currentPage)
          })
        }, () => {
        })
      },
      filterHandler (value, row, column) {
        const property = column['property']
        console.log(value, row, column)
        return row[property] === value
      },
      handleVisibleSwitch (row) {
        api.editLecture(row)
      }
    },
    watch: {
      'keyword' () {
        this.currentChange(1)
      }
    }
  }
</script>
