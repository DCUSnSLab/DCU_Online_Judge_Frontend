<template>
  <div class="view">
    <Panel :title="contestId ? this.$i18n.t('m.Contest_Problem_List') : this.$i18n.t('m.Problem_List')">
      <div v-if=this.lectureTitle>
        {{ $t('m.Lecture_title') }} : {{ this.lectureTitle }}
      </div>
      <div v-if=this.contestTitle>
        {{ $t('m.Contest_title') }} : {{ this.contestTitle }}
      </div>
      <div v-if=this.lectureCreator>
        {{ $t('m.Assigned_professor') }} : {{ this.lectureCreator }}
      </div>
      <div slot="header">
        <el-inputD
          v-model="keyword"
          prefix-icon="el-icon-search"
          :placeholder="$t('m.ProblemList_Keywords_Placeholder')">
        </el-inputD>
      </div>
      <el-table
        v-loading="loading"
        element-loading-text="loading"
        ref="table"
        :data="problemList"
        @row-dblclick="handleDblclick"
        style="width: 100%">
        <el-table-column
          width="100"
          prop="id"
          :label="$t('m.ProblemList_ID')">
        </el-table-column>
        <el-table-column
          width="150"
          :label="$t('m.ProblemList_Problem_ID')">
          <template slot-scope="{row}">
            <span v-show="!row.isEditing">{{row._id}}</span>
            <el-input v-show="row.isEditing" v-model="row._id"
                      @keyup.enter.native="handleInlineEdit(row)">

            </el-input>
          </template>
        </el-table-column>
        <el-table-column
          prop="title"
          :label="$t('m.ProblemList_Title')">
          <template slot-scope="{row}">
            <span v-show="!row.isEditing">{{row.title}}</span>
            <el-input v-show="row.isEditing" v-model="row.title"
                      @keyup.enter.native="handleInlineEdit(row)">
            </el-input>
          </template>
        </el-table-column>
        <el-table-column
          prop="created_by.username"
          :label="$t('m.ProblemList_Title')">
        </el-table-column>
        <el-table-column
          width="200"
          prop="create_time"
          :label="$t('m.ProblemList_Creation_Date')">
          <template slot-scope="scope">
            {{scope.row.create_time | localtime }}
          </template>
        </el-table-column>
        <el-table-column
          width="100"
          prop="visible"
          :label="$t('m.ProblemList_Visibility')">
          <template slot-scope="scope">
            <el-switch v-model="scope.row.visible"
                       active-text=""
                       inactive-text=""
                       @change="updateProblem(scope.row)">
            </el-switch>
          </template>
        </el-table-column>
        <el-table-column
          fixed="right"
          :label="$t('m.ProblemList_Additional_Options')"
          width="250">
          <div slot-scope="scope">
            <icon-btn :name="$t('m.ProblemList_Edit')" icon="edit" @click.native="goEdit(scope.row.id)"></icon-btn>
            <icon-btn v-if="contestId" :name="$t('m.ProblemList_Make_Public')" icon="clone"
                      @click.native="makeContestProblemPublic(scope.row.id)"></icon-btn>
            <icon-btn icon="download" :name="$t('m.ProblemList_Download_Test_Cases')"
                      @click.native="downloadTestCase(scope.row.id)"></icon-btn>
            <icon-btn icon="trash" :name="$t('m.ProblemList_Delete')"
                      @click.native="deleteProblem(scope.row.id)"></icon-btn>
            <el-tooltip v-if="routeName === 'contest-problem-list'" class="item" effect="dark" :content="$t('m.ProblemList_Similarity_Check')" placement="top">
              <el-button :name="$t('m.ProblemList_Similarity_Check')" size="mini" @click.native="copyKiller(scope.row.id)" icon="el-icon-user"></el-button>
            </el-tooltip>
          </div>
        </el-table-column>
      </el-table>
      <div class="panel-options">
        <el-button v-if="contestId" type="primary" size="small"
                   @click="goCreateProblem" icon="el-icon-plus"> {{ $t('m.ProblemList_Create_Problem') }}
        </el-button>
        <el-button v-if="contestId" type="primary"
                   size="small" icon="el-icon-plus"
                   @click="addProblemDialogVisible = true"> {{ $t('m.ProblemList_Import_Problem') }}
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
    <el-dialog title="Sure to update the problem? "
               width="20%"
               :visible.sync="InlineEditDialogVisible"
               @close-on-click-modal="false">
      <div>
        <p>DisplayID: {{currentRow._id}}</p>
        <p>Title: {{currentRow.title}}</p>
      </div>
      <span slot="footer">
        <cancel @click.native="InlineEditDialogVisible = false; getProblemList(currentPage)"></cancel>
        <save @click.native="updateProblem(currentRow)"></save>
      </span>
    </el-dialog>
    <el-dialog title="Add Contest Problem"
               v-if="contestId"
               width="80%"
               :visible.sync="addProblemDialogVisible"
               @close-on-click-modal="false">
      <add-problem-component :contestID="contestId" @on-change="getProblemList"></add-problem-component>
    </el-dialog>
  </div>
</template>

<script>
  import api from '../../api.js'
  import utils from '@/utils/utils'
  import AddProblemComponent from './AddPublicProblem.vue'

  export default {
    name: 'ProblemList',
    components: {
      AddProblemComponent
    },
    data () {
      return {
        pageSize: 20,
        total: 0,
        problemList: [],
        keyword: '',
        loading: false,
        currentPage: 1,
        routeName: '',
        contestId: '',
        lectureId: '',
        contestTitle: '',
        lectureTitle: '',
        lectureCreator: '',
        // for make public use
        currentProblemID: '',
        currentRow: {},
        InlineEditDialogVisible: false,
        makePublicDialogVisible: false,
        addProblemDialogVisible: false,
        query: {
          page: 1
        }
      }
    },
    mounted () {
      this.routeName = this.$route.name
      this.query.page = parseInt(this.$route.query.page) || 1
      if (this.query.page < 1) {
        this.query.page = 1
      }
      this.contestId = this.$route.params.contestId
      this.currentContestInfo(this.contestId)
      this.getProblemList(this.currentPage)
    },
    methods: {
      handleDblclick (row) {
        row.isEditing = true
      },
      goEdit (problemId) {
        if (this.routeName === 'problem-list') {
          this.$router.push({name: 'edit-problem', params: {problemId}})
        } else if (this.routeName === 'contest-problem-list') {
          this.$router.push({name: 'edit-contest-problem', params: {problemId: problemId, contestId: this.contestId}})
        }
      },
      pushRouter () {
        this.$router.push({
          name: this.routeName,
          query: utils.filterEmptyValue(this.query)
        })
      },
      goCreateProblem () {
        if (this.routeName === 'problem-list') {
          this.$router.push({name: 'create-problem'})
        } else if (this.routeName === 'contest-problem-list') {
          this.$router.push({name: 'create-contest-problem', params: {contestId: this.contestId}})
        }
      },
      // 切换页码回调
      currentChange (page) {
        this.currentPage = page
        this.getProblemList(page)
      },
      copyKiller (id) {
        this.$router.push({name: 'copyKiller', params: {problemID: id}})
      },
      getProblemList () {
        this.loading = true
        let funcName = this.routeName === 'problem-list' ? 'getProblemList' : 'getContestProblemList'
        let params = {
          limit: this.pageSize,
          offset: (this.query.page - 1) * this.pageSize,
          keyword: this.keyword,
          showPublic: this.routeName === 'problem-list' ? 'true' : 'false',
          contest_id: this.contestId
        }
        api[funcName](params).then(res => {
          this.loading = false
          this.total = res.data.data.total
          for (let problem of res.data.data.results) {
            problem.isEditing = false
          }
          this.problemList = res.data.data.results
        }, res => {
          this.loading = false
        })
      },
      deleteProblem (id) {
        this.$confirm(this.$t('m.ProblemList_Delete_Alert_Msg'), this.$t('m.ProblemList_Delete_Alert_Title'), {
          type: 'warning'
        }).then(() => {
          let funcName = this.routeName === 'problem-list' ? 'deleteProblem' : 'deleteContestProblem'
          api[funcName](id).then(() => [
            this.getProblemList(this.currentPage - 1)
          ]).catch(() => {
          })
        }, () => {
        })
      },
      makeContestProblemPublic (problemID) {
        this.$prompt(this.$t('m.ProblemList_Make_Public_Alert_Msg'), this.$t('m.ProblemList_Make_Public_Alert_Confirm')).then(({value}) => {
          api.makeContestProblemPublic({id: problemID, display_id: value}).catch()
        }, () => {
        })
      },
      updateProblem (row) {
        let data = Object.assign({}, row)
        let funcName = ''
        if (this.contestId) {
          data.contest_id = this.contestId
          funcName = 'editContestProblem'
        } else {
          funcName = 'editProblem'
        }
        api[funcName](data).then(res => {
          this.InlineEditDialogVisible = false
          this.getProblemList(this.currentPage)
        }).catch(() => {
          this.InlineEditDialogVisible = false
        })
      },
      handleInlineEdit (row) {
        this.currentRow = row
        this.InlineEditDialogVisible = true
      },
      downloadTestCase (problemID) {
        let url = '/admin/test_case?problem_id=' + problemID
        utils.downloadFile(url)
      },
      getPublicProblem () {
        api.getProblemList()
      },
      currentContestInfo (contestId) {
        api.getContest(contestId).then(res => {
          console.log(res)
          this.contestTitle = res.data.data.title
          this.lectureTitle = res.data.data.lecture_title
          this.lectureCreator = res.data.data.created_by.realname
        })
      }
    },
    watch: {
      '$route' (newVal, oldVal) {
        this.contestId = newVal.params.contestId
        this.routeName = newVal.name
        this.getProblemList(this.currentPage)
      },
      'keyword' () {
        this.currentChange()
      }
    }
  }
</script>

