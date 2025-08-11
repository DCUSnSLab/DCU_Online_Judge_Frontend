<template>
  <div class="flex-container" v-if="accsessR && (this.isAdminRole && !this.isSemiAdmin) || (this.isSemiAdmin && this.Ta !== false)">
    <div id="manage">
      <Panel v-show="chkContesttype" :title="this.lectureTitle + ' ' + $t('m.Lecture_UserList')">
        <div slot="title"><b>사용자 퇴실 관리</b>
          <el-input
            type="text"
            v-model="keyword"
            @input="currentChange(1)"
            prefix-icon="el-icon-search"
            :placeholder="$t('m.User_Search')"
            style="width: 200px; margin-left: 10px; display: inline-flex; align-items: center;">
          </el-input>
          <Button @click.native="exitAllStudent()" style="float:right">전체 퇴실 처리</Button>
        </div>
        <template>
          <el-table
            v-loading="loadingTable"
            element-loading-text="loading"
            @selection-change="handleSelectionChange"
            :data="filteredUserList"
            style="width: 100%">
            <el-table-column prop="realname" label="이름" align="center">
              <template slot-scope="scope"><!--lecture_signup_class에 실제 이름이 있는 경우,-->
                <span v-if="scope.row.realname"><!--해당 값을 출력하고-->
                    {{ scope.row.realname }}
                  </span>
                <span v-else><!--아닌 경우에는 User 테이블에 있는 realname 값을 출력한다.-->
                    {{ scope.row.user.realname }}
                  </span>
              </template>
            </el-table-column>
            <el-table-column prop="schoolssn" label="학번" align="center">
              <template slot-scope="scope"><!--마찬가지로 lecture_signup_class에 학번이 있는 경우,-->
                <span v-if="scope.row.schoolssn"> <!--해당 값을 출력하고-->
                    {{ scope.row.schoolssn }}
                  </span>
                <span v-else><!--아닌 경우에는 User 테이블에 있는 schoolssn 값을 출력한다.-->
                    {{ scope.row.user.schoolssn }}
                  </span>
              </template>
            </el-table-column>
            <el-table-column prop="startTime" label="입실시간" align="center">
              <template slot-scope="scope"><!--마찬가지로 lecture_signup_class에 학번이 있는 경우,-->
                <span v-if="scope.row.start_time"> <!--해당 값을 출력하고-->
                    {{ formatDate(scope.row.start_time) }}
                  </span>
                <span v-else><!--아닌 경우에는 User 테이블에 있는 schoolssn 값을 출력한다.-->
                  </span>
              </template>
            </el-table-column>
            <el-table-column prop="endTime" label="퇴실시간" align="center">
              <template slot-scope="scope"><!--마찬가지로 lecture_signup_class에 학번이 있는 경우,-->
                <span v-if="scope.row.end_time"> <!--해당 값을 출력하고-->
                    {{ formatDate(scope.row.end_time) }}
                  </span>
                <span v-else><!--아닌 경우에는 User 테이블에 있는 schoolssn 값을 출력한다.-->
                  </span>
              </template>
            </el-table-column>
            <!--<el-table-column prop="userScore" label="점수" align="center"></el-table-column>-->
            <el-table-column prop="exit_status" label="시험 상태" align="center">
              <template slot-scope="scope"><!--lecture_signup_class에 실제 이름이 있는 경우,-->
                <span v-if="scope.row.exit_status" style="color:green">
                  <b>응시완료</b>
                </span>
                <span v-else-if="scope.row.start_time" style="color:blue">
                  <b>응시중</b>
                </span>
                <span v-else style="color:red">
                  <b>미응시</b>
                </span>
              </template>
            </el-table-column>
            <el-table-column fixed="right" label="응시 상태 변경" width="200" align="center">
              <template slot-scope="{row}">
                <select v-model="row.exit_status" @change="ExitStudent(row.user.id)" class="custom-select">
                  <option value="true">응시완료</option>
                  <option value="false">미응시</option>
                </select>
              </template>
            </el-table-column>
          </el-table>
        </template>
        <!---->
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
      <Panel style="margin-top: 20px;" title="학생별 문제 점수">
        <div slot="title" style="display: inline-flex; align-items: center;">
          <b>사용자 부정 행위 조회</b>
          <el-tooltip content="Problem copied: 복사 횟수, Screen focusing: 포커스 이탈 횟수" placement="top">
            <span
              style="
                display: flex;
                align-items: center;
                justify-content: center;
                margin-left: 0.5em;
                cursor: pointer;
                background-color: #eeeeee;
                color: #9a9a9a;
                border-radius: 50%;
                width: 1.2em;
                height: 1.2em;
                font-size: 0.7em;
                font-weight: bold;
              "
            >
              ?
            </span>
          </el-tooltip>
        </div>
        <el-table v-loading="loadingTable"
            element-loading-text="loading"
            @selection-change="handleSelectionChange"
            :data="userList"
            style="width: 100%">
          <el-table-column prop="realname" label="이름" fixed width="120" align="center">
            <template slot-scope="scope">
              <span>{{ scope.row.realname || scope.row.user.realname }}</span>
            </template>
          </el-table-column>

          <!-- 문제별 열 동적 생성 -->
          <el-table-column
            v-for="problem in problemList"
            :key="problem.id"
            :label="problem.title"
            align="center"
          >
            <template slot-scope="scope">
              <span>
                {{
                  studentProblemData[scope.row.user.id] &&
                  studentProblemData[scope.row.user.id][problem.id]
                    ?
                    studentProblemData[scope.row.user.id][problem.id].copied +
                    ',' +
                    studentProblemData[scope.row.user.id][problem.id].focusing
                    : '-'
                }}
              </span>
            </template>
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
  </div>
  <div class="flex-container" v-else>
    <div id="exit">
      <div v-if="contestExitStatus">
        <Panel shadow>
          <div slot="title">퇴실 완료 안내</div>
          <div slot="title"><br/>{{formatDate(contestEndtime)}} 퇴실 하였습니다.</div>
          <div align="center">
            <!-- <h2>귀하의 현재 점수는 <b>{{userTotalScore}}</b>점 입니다.<br/><br/></h2>
            <h3>가채점 결과이므로 변경될 수 있습니다.<br/></h3><br/> -->
          </div>
        </Panel>
      </div>
      <div v-else>
        <Panel shadow>
          <div slot="title">퇴실하시겠습니까?</div>
          <div slot="extra">
            <Button @click="contestExit">퇴실</Button>
          </div>
        </Panel>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../../api.js'
import { mapGetters } from 'vuex'
import moment from 'moment'

export default {
  name: 'lecturecontestExit',
  data () {
    return {
      lectureID: '',
      contestID: '',
      userTotalScore: 0,
      outerVisible: false,
      persentage: true, // 학생 관리 페이지의 점수 산정 방식을 결정하는 boolean 변수, 기존 점수 산정 방식은 사용하지 않으므로 항상 true로 두어야 함.
      exceloption: [
      ],
      checkboxstyle: {
        'padding-bottom': '0px'
      },
      showContestDialog: false,
      searchUser: '',
      addTAUserDialogVisible: false,
      lectureFounder: '', // 강의 개설자 realname
      lectureTitle: '', // 수강과목 title
      pageSize: 50,
      total: 0,
      loading: false,
      border: false,
      userList: [],
      contestStartTime: '',
      contestEndtime: '',
      contestExitStatus: false,
      exitStatus: false,
      scoreListTable: [],
      uploadUsers: [],
      uploadUsersPage: [],
      uploadUsersCurrentPage: 1,
      uploadUsersPageSize: 15,
      // 학생 유형별 카운트
      signup: 0, // 정상 수강 인원
      notgegistered: 0, // 미등록된 인원
      outoflecture: 0, // 정원 외 인원 (학생 개인 임의 수강신청)
      keyword: '',
      ta_name: '',
      showUserDialog: false,
      user: {},
      loadingTable: false,
      currentPage: 0,
      problemList: [], // 문제 ID 또는 이름 목록
      studentProblemData: {}, // { userID: { problemID: { score, copied, focusing } } }
      Ta: null,
      accsessR: false,
      chkContesttype: false // 대회 여부 확인
    }
  },
  mounted () {
    this.contestID = this.$route.params.contestID
    this.lectureID = this.$route.params.lectureID
    this.lectureTitle = this.$route.params.lectureTitle
    this.lectureFounder = this.$route.params.lectureFounder
    console.log(this.isAdminRole)
    console.log(this.isSemiAdmin)
    this.$store.dispatch('getContest').then(res => {
      this.chkContesttype = res.data.data.lecture_contest_type === '대회' // 대회 여부 확인
    })
    api.getTAList(this.lectureID).then(res => {
      console.log(res)
      this.Ta = res.data.data
      console.log(this.Ta)
      const allow = (this.isAdminRole && !this.isSemiAdmin) || (this.isSemiAdmin && this.Ta)
      this.accsessR = allow
      if (this.accsessR) {
        console.log('관리자')
        this.getUserList(1)
      } else {
        console.log('학생')
        this.CheckContestExit()
      }
    })
  },
  methods: {
    /* 학생 전용 (일반, TA/RA) */
    CheckContestExit () {
      api.checkContestExit(this.$route.params.contestID).then(res => {
        this.contestEndtime = res.data.data.end_time
        if (this.contestEndtime) {
          this.contestExitStatus = true
          this.contestScore()
        } else {
          this.contestExitStatus = false
        }
        console.log(this.contestExitStatus)
      }).catch(() => {
      })
    },
    contestExit () {
      api.getContestExit(this.$route.params.contestID).then(res => {
        console.log(this.contestID)
        console.log(this.lectureID)
        console.log(res.data)
        window.location.reload()
      }).catch(() => {
      })
    },
    // contestScore () {
    //   api.checkContestScore(this.$route.params.contestID).then(res => {
    //     this.userTotalScore = res.data.data.total_score
    //     console.log(this.userTotalScore)
    //   }).catch(() => {
    //   })
    // },
    /* 관리 전용 (교수, 관리자) */
    currentChange (page) {
      this.currentPage = page
      this.getUserList(page)
    },
    // 퇴실 철회 (수정 필요)
    ExitStudent (userid) {
      alert('응시 상태가 변경되었습니다.')
      if (userid === undefined) {
        userid = null
      }
      let data = {
        contest_id: this.contestID,
        user_id: userid
      }
      console.log(data)
      api.exitStudent(data).then(res => {
        this.getUserList(this.page)
        this.$success('Success')
      })
    },
    exitAllStudent () {
      let data = {
        lec_stu_userID: this.userList.map(item => item.user.id).join(','),
        contest_id: this.contestID
      }
      console.log(data)
      api.exitStudent(data).then(res => {
        this.getUserList(this.page)
        this.$success('Success')
      })
    },
    // 사용자 목록 가져오기
    getUserList (page) {
      console.log('getLectureUserList Called')
      this.loadingTable = true
      api.getLectureUserList((page - 1) * this.pageSize, this.pageSize, this.keyword, this.lectureID, this.contestID).then(res => {
        this.loadingTable = false

        // 문제 목록
        this.problemList = res.data.data.problem_list.map(problem => {
          return {
            id: problem.id.toString(),
            title: problem.title
          }
        })

        this.total = res.data.data.student_list.total
        this.userList = res.data.data.student_list.results

        // 학생별 문제별 점수 초기화
        this.studentProblemData = {}

        this.userList.forEach(user => {
          const uid = user.user.id
          const cheatLog = user.cheat_log || {}
          this.studentProblemData[uid] = {}

          this.problemList.forEach(problem => {
            const pid = problem.id
            const log = cheatLog[pid]
            this.studentProblemData[uid][pid] = {
              copied: log && log.copied ? log.copied : 0,
              focusing: log && log.focusing ? log.focusing : 0
            }
          })
        })

        if (this.userList.length === 0) {
          console.log('null')
        } else {
          this.userList.forEach(user => {
            this.userID = user.user.id
            if (user.score !== null) {
              if (user.score.constructor === Object && Object.keys(user.score).length === 0) {
                console.log('empty object')
              } else {
                const userinfo = {
                  realname: user.realname,
                  schoolssn: user.schoolssn,
                  startTime: user.start_time,
                  endTime: user.end_time
                }
                console.log(userinfo)
              }
            }
          })
        }
      }, res => {
        this.loadingTable = false
      })
    },
    handleSelectionChange (val) {
      this.selectedUsers = val
    },
    formatDate (datetime) {
      return moment(datetime).format('YY년 MM월 DD일 HH시 mm분')
    }
  },
  computed: {
    filteredUserList () {
      const keyword = this.keyword.trim()
      if (!keyword) return this.userList

      return this.userList.filter(user => {
        const name = user.realname || (user.user && user.user.realname) || ''
        return name.includes(keyword)
      })
    },
    ...mapGetters(['isAdmin', 'isSemiAdmin']),
    selectedUserIDs () {
      let ids = []
      for (let user of this.selectedUsers) {
        ids.push(user.id)
      }
      return ids
    },
    isAdminRole () {
      return this.$store.getters.isAdminRole
    },
    isContestMode () {
      return (this.$route.params.lectureContestType || '').trim() === '대회'
    },
    isSemiAdmin () {
      return this.$store.getters.isSemiAdmin
    },
    accsess () {
      if (this.Ta === null) {
        return false
      }
      return (this.isAdminRole && !this.isSemiAdmin) || (this.isSemiAdmin && this.Ta !== false)
    }
  },
  watch: {
    'keyword' () {
      this.currentChange(1)
    },
    'user.admin_type' () {
      if (this.user.admin_type === 'Super Admin') {
        this.user.problem_permission = 'All'
      } else if (this.user.admin_type === 'Regular User') {
        this.user.problem_permission = 'None'
      }
    },
    'uploadUsersCurrentPage' (page) {
      this.uploadUsersPage = this.uploadUsers.slice((page - 1) * this.uploadUsersPageSize, page * this.uploadUsersPageSize)
    }
  }
}
</script>

<style scoped lang="less">
.flex-container {
  #manage {
    overflow-x: auto;
    flex: auto;
    margin-right: 18px;
    .filter {
      margin-right: -10px;
    }
  }
  #exit {
    flex: auto;
    margin-right: 18px;
    .filter {
      margin-right: -10px;
    }
  }
}
.leftBtn {
  color: #555555;
  margin-left: 4px;
}

.userPreview {
  padding-left: 10px;
}

.notification {
  p {
    margin: 0;
    text-align: left;
  }
}

table {
  width: 100%;
}

tr {
  border-bottom: 1.5px solid rgba(220, 220, 220, 0.5);
}

th {
  color: rgba(75, 75, 75, 0.5);
}

td {
  text-align: center;
}

th, td {
  min-width: 100px;
  padding: 20px;
  border-bottom: 1px solid rgba(220, 220, 220, 0.5);
}

.el-checkbox-group { // el 로 시작하는 tag들은 class에 css를 적용하는것과 비슷하게 적용하면 된다.
  padding-bottom: 20px;
}

.custom-select {
  // text-align: center;
  width: 100px;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 14px;
  border: 1px solid rgba(220, 220, 220, 0.5);
}
</style>
