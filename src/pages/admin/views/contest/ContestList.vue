<template>
  <div class="view">
    <Panel :title="$t('m.WeeklyContest_List')">
      <div v-if=this.lectureTitle>
        {{ $t('m.Lecture_title') }} : {{ this.lectureTitle }}
      </div>
      <div v-if=this.lectureCreator>
        {{ $t('m.Assigned_professor') }} : {{ this.lectureCreator }}
      </div>
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
        :data="contestList"
        style="width: 100%">
        <el-table-column type="expand">
          <template slot-scope="props">
            <p>{{ $t('m.Contest_Start_Time')}} : {{props.row.start_time | localtime }}</p>
            <p>{{ $t('m.Contest_End_Time')}}: {{props.row.end_time | localtime }}</p>
            <p>{{ $t('m.Contest_Create_Time')}}: {{props.row.create_time | localtime}}</p>
            <p>{{ $t('m.Contest_Ccreator')}}: {{props.row.created_by.username}}</p>
          </template>
        </el-table-column>
        <el-table-column
          prop="id"
          width="50"
          label="ID">
        </el-table-column>
        <el-table-column
          v-if="!this.lectureId"
          prop="lecture_title"
          :label="$t('m.Contest_Assigned_lecture')">
        </el-table-column>
        <el-table-column
          prop="title"
          :label="$t('m.Contest_Assigned_lecture_title')">
        </el-table-column>
        <el-table-column
          :label="$t('m.Contest_Contest_rule_type')"
          width="100">
          <template slot-scope="scope">
            <el-tag type="gray">{{scope.row.rule_type}}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('m.Contest_Type')"
          width="120">
          <template slot-scope="scope">
            <el-tag :type="scope.row.contest_type === 'Public' ? 'success' : 'primary'">
              {{ scope.row.contest_type}}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('m.Contest_status')"
          width="130">
          <template slot-scope="scope">
            <el-tag
              :type="scope.row.status === '-1' ? 'danger' : scope.row.status === '0' ? 'success' : 'primary'">
              {{ scope.row.status | contestStatus}}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          width="80"
          :label="$t('m.Contest_Visible')">
          <template slot-scope="scope">
            <el-switch v-model="scope.row.visible"
                       active-text=""
                       inactive-text=""
                       @change="handleVisibleSwitch(scope.row)">
            </el-switch>
          </template>
        </el-table-column>
        <el-table-column
          fixed="right"
          width="280"
          label="">
          <div slot-scope="scope">
            <icon-btn :name="$t('m.ContestList_Edit_Contest')" icon="edit" @click.native="goEdit(scope.row.id)"></icon-btn>
            <icon-btn :name="$t('m.ContestList_Problem_List')" icon="list-ol" @click.native="goContestProblemList(scope.row.id)"></icon-btn>
            <icon-btn :name="$t('m.ContestList_Contest_Announcement')" icon="info-circle"
                      @click.native="goContestAnnouncement(scope.row.id)"></icon-btn>
            <icon-btn :name="$t('m.ContestList_Download_Pass_Submissions')" icon="download"
                      @click.native="openDownloadOptions(scope.row.id)"></icon-btn>
            <icon-btn :name="$t('m.ContestList_Delete_Contest')" icon="trash" @click.native="deleteContest(scope.row.id)"></icon-btn>
            <el-tooltip v-if="scope.row.private" class="item" effect="dark" :content="$t('m.ContestList_Contest_Access')" placement="top">
              <el-button :name="$t('m.ContestList_Contest_Access')" size="mini" icon="el-icon-user" @click.native="goContestStudentList(scope.row.id, scope.row.title)"></el-button>
            </el-tooltip>
            <!--<icon-btn name="대회 접근 권한" icon="el-icon-user" @click.native="deleteContest(scope.row.id)"></icon-btn>-->
          </div>
        </el-table-column>
      </el-table>
      <div class="panel-options">
        <el-button v-if="lectureId"
                   type="primary" size="small"
                   @click="goCreateContest" icon="el-icon-plus"> {{ $t('m.ContestList_Create_Lecture') }}
        </el-button>
        <el-button v-if="lectureId" type="primary"
                   size="small" icon="el-icon-plus"
                   @click="addContestDialogVisible = true"> {{ $t('m.ContestList_Import_Contest') }}
        </el-button>
        <el-button v-if="lectureId" type="primary"
                   size="small" icon="el-icon-plus"
                   @click="addLectureDialogVisible = true"> {{ $t('m.ContestList_Copy_Lecture') }}
        </el-button>
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
    <el-dialog :title="$t('m.ContestList_Download_Contest_Submissions')"
               width="30%"
               :visible.sync="downloadDialogVisible">
      <el-switch v-model="excludeAdmin" active-text="Exclude admin submissions"></el-switch>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="downloadSubmissions">确 定</el-button>
      </span>
    </el-dialog>
    <el-dialog title="실습, 과제, 대회 전체 복사"
               v-if="lectureId"
               width="80%"
               :modal-append-to-body='true'
               :visible.sync="addContestDialogVisible"
               @close-on-click-modal="false">
      <add-contest-component :lectureID="lectureId" @on-change="getContestList"></add-contest-component>
    </el-dialog>
    <el-dialog :title="$t('m.ContestList_Copy_Lecture')"
               v-if="lectureId"
               width="80%"
               :modal-append-to-body='true'
               :visible.sync="addLectureDialogVisible"
               @close-on-click-modal="false">
      <add-lecture-component :lectureID="lectureId" @on-change="getContestList"></add-lecture-component>
      <!-- <add-contest-component :lectureID="lectureId" @on-change="getContestList"></add-contest-component> -->
    </el-dialog>
  </div>
</template>

<script>
  import api from '../../api.js'
  import utils from '@/utils/utils'
  import {CONTEST_STATUS_REVERSE} from '@/utils/constants'
  import AddContestComponent from './AddPublicContest.vue'
  import AddLectureComponent from './AddLectureCopy.vue'

  export default {
    name: 'ContestList',
    components: {
      AddContestComponent,
      AddLectureComponent
    },
    data () {
      return {
        pageSize: 10,
        total: 0,
        contestList: [],
        keyword: '',
        loading: false,
        excludeAdmin: true,
        currentPage: 1,
        routeName: '',
        currentId: 1,
        lectureId: '',
        lectureTitle: '',
        lectureCreator: '',
        downloadDialogVisible: false,
        addContestDialogVisible: false,
        addLectureDialogVisible: false,
        query: {
          page: parseInt(this.$route.query.page) || 1
        }
      }
    },
    mounted () {
      this.routeName = this.$route.name
      this.lectureId = this.$route.params.lectureId
      this.query.page = parseInt(this.$route.query.page) || 1
      if (this.query.page < 1) {
        this.query.page = 1
      }
      this.currentLectureInfo(this.lectureId)
      this.getContestList(this.currentPage)
    },
    filters: {
      contestStatus (value) {
        return CONTEST_STATUS_REVERSE[value].name
      }
    },
    methods: {
      // 切换页码回调
      currentChange (page) {
        this.currentPage = page
        this.getContestList(page)
      },
      pushRouter () {
        this.$router.push({
          name: this.routeName,
          query: utils.filterEmptyValue(this.query)
        })
        this.getContestList()
      },
      goContestStudentList (contestId, ContestTitle) {
        this.$router.push({name: 'contest-student-list', params: {contestId, ContestTitle}})
      },
      goCreateContest () {
        if (this.routeName === 'contest-list') {
          this.$router.push({name: 'create-contest'})
        } else if (this.routeName === 'lecture-contest-list') {
          this.$router.push({name: 'create-lecture-contest', params: {contestId: this.contestId}})
        }
      },
      getContestList () {
        this.loading = true
        let funcName = this.routeName === 'contest-list' ? 'getContestList' : 'getLectureContestList'
        let params = {
          limit: this.pageSize,
          offset: (this.query.page - 1) * this.pageSize,
          keyword: this.keyword,
          lecture_id: this.lectureId
        }
        api[funcName](params).then(res => {
          this.loading = false
          this.total = res.data.data.total
          this.contestList = res.data.data.results
          console.log(this.contestList)
        }, res => {
          this.loading = false
        })
      },
      deleteContest (id) {
        this.$confirm(this.$t('m.ContestList_Delete_Msg'), this.$t('m.ContestList_Delete_Title'), {
          type: 'warning'
        }).then(() => {
          api.deleteContest(id).then(res => {
            this.getContestList(this.currentPage)
          }).catch(() => {
            this.getContestList(this.currentPage)
          })
        }, () => {
        })
      },
      openDownloadOptions (contestId) {
        this.downloadDialogVisible = true
        this.currentId = contestId
      },
      downloadSubmissions () {
        let excludeAdmin = this.excludeAdmin ? '1' : '0'
        let url = `/admin/download_submissions?contest_id=${this.currentId}&exclude_admin=${excludeAdmin}`
        utils.downloadFile(url)
      },
      goEdit (contestId) {
        this.$router.push({name: 'edit-contest', params: {contestId}})
      },
      goContestAnnouncement (contestId) {
        this.$router.push({name: 'contest-announcement', params: {contestId}})
      },
      goContestProblemList (contestId) {
        this.$router.push({name: 'contest-problem-list', params: {contestId}})
      },
      handleVisibleSwitch (row) {
        row.lecture_id = row.lecture
        api.editContest(row)
      },
      currentLectureInfo (lectureId) {
        api.getLecture(lectureId).then(res => {
          console.log(res)
          this.lectureTitle = res.data.data.title
          this.lectureCreator = res.data.data.created_by.realname
        })
      }
    },
    watch: {
      'keyword' () {
        this.currentChange(1)
      }
    }
  }
</script>
