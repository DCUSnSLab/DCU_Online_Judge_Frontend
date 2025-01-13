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
          :label="$t('m.Lecture_Year')">
        </el-table-column>
        <el-table-column
          width="90"
          align="center"
          :label="$t('m.Lecture_Semester')">
          <template slot-scope="scope">
            <p v-if="scope.row.semester < 3">{{scope.row.semester}}</p>
            <p v-else>입학 전</p>
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
            <!--<icon-btn name="Student List" icon="list-ol" @click.native="goLectureStudentList(scope.row.id, scope.row.title, scope.row.created_by.realname)"></icon-btn>-->
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
      return {
        pageSize: 25,
        total: 0,
        lectureList: [],
        keyword: '',
        loading: false,
        excludeAdmin: true,
        currentPage: 1,
        currentId: 1,
        downloadDialogVisible: false,
        query: {
          page: parseInt(this.$route.query.page) || 1
        }
      }
    },
    mounted () {
      this.query.page = parseInt(this.$route.query.page) || 1
      if (this.query.page < 1) {
        this.query.page = 1
      }
      this.getLectureList(this.currentPage)
    },
    methods: {
      currentChange (page) {
        this.currentPage = page
        this.getLectureList(page)
      },
      pushRouter () {
        this.$router.push({
          name: 'lecture-list',
          query: utils.filterEmptyValue(this.query)
        })
        this.getLectureList()
      },
      getLectureList () {
        this.loading = true
        api.getLectureList((this.query.page - 1) * this.pageSize, this.pageSize, this.keyword).then(res => {
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
