<template>
  <div class="flex-container" v-if="isAdmin">
    <div id="manage">
      <Panel :title="this.lectureTitle + ' ' + $t('m.Lecture_UserList')">
        <div slot="title"><b>사용자 퇴실 관리</b>
          <Button @click.native="ExitStudent()" style="float:right">전체 퇴실 처리</Button>
        </div>
        <template>
          <el-table
            v-loading="loadingTable"
            element-loading-text="loading"
            @selection-change="handleSelectionChange"
            :data="userList"
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

<!--            <el-table-column prop="userScore" label="점수" align="center"></el-table-column>-->
            <el-table-column prop="exit_status" label="퇴실 유무" align="center">
              <template slot-scope="scope"><!--lecture_signup_class에 실제 이름이 있는 경우,-->
                <span v-if="scope.row.exit_status" style="color:green"> <!--true인 경우-->
                    <b>퇴실 완료</b>
                  </span>
                <span v-else style="color:red"> <!--false인 경우-->
                    <b>미완료</b>
                  </span>
              </template>
            </el-table-column>

            <el-table-column fixed="right" label="퇴실 철회" width="200" align="center">
              <template slot-scope="{row}">
                <icon-btn name="철회" icon="edit" @click.native="ExitStudent(row.user.id)"></icon-btn>
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
    </div>
  </div>
  <div class="flex-container" v-else>
    <div id="exit">
      <div v-if="contestExitStatus">
        <Panel shadow>
          <div slot="title">퇴실 완료 안내</div>
          <div slot="title" align="center"><br/><h1><b>퇴실 완료</b></h1></div>
          <div align="center"><h2>귀하의 현재 점수는 <b>{{userTotalScore}}</b>점 입니다.<br/><br/></h2><h3>가채점 결과이므로 변경될 수 있습니다.<br/>
            실습실을 나가기 전 조교에게 확인을 받으시기 바랍니다.<br/></h3><br/></div>
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
      currentPage: 0
    }
  },
  mounted () {
    this.contestID = this.$route.params.contestID
    this.lectureID = this.$route.params.lectureID
    this.lectureTitle = this.$route.params.lectureTitle
    this.lectureFounder = this.$route.params.lectureFounder
    if (this.isAdminRole) {
      this.getUserList(1)
    } else {
      this.CheckContestExit()
    }
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
      }).catch(() => {
      })
      this.$router.push({name: 'home'})
    },
    contestScore () {
      api.checkContestScore(this.$route.params.contestID).then(res => {
        this.userTotalScore = res.data.data.total_score
        console.log(this.userTotalScore)
      }).catch(() => {
      })
    },
    /* 관리 전용 (교수, 관리자) */
    currentChange (page) {
      this.currentPage = page
      this.getUserList(page)
    },
    // 퇴실 철회 (수정 필요)
    ExitStudent (userid) {
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
    // 사용자 목록 가져오기
    getUserList (page) {
      console.log('getLectureUserList Called')
      this.loadingTable = true
      api.getLectureUserList((page - 1) * this.pageSize, this.pageSize, this.keyword, this.lectureID, this.contestID).then(res => {
        this.loadingTable = false
        this.total = res.data.data.total  // 인스턴스 개수
        this.userList = res.data.data.results
        if (this.userList.length === 0) {
          console.log('null')
        } else {
          // let k = 0
          this.userList.forEach(user => {
            this.userID = user.user.id
            if (user.score !== null) {
              if (user.score.constructor === Object && Object.keys(user.score).length === 0) {
                console.log('empty object')
              } else {
                var userinfo = {}
                userinfo['realname'] = user.realname
                userinfo['schoolssn'] = user.schoolssn
                // console.log(user.score.ContestAnalysis.대회.contests[this.$route.params.contestID].Info.score)
              }
            }
            // api.checkContestExitManage(this.$route.params.contestID, this.userID).then(res => {
            //   // this.contestStartTime = res.data.data.start_time
            //   this.contestEndtime = res.data.data.end_time
            //   this.exitStatus = false
            //   if (this.contestEndtime) {
            //     this.exitStatus = true
            //   }
            //   this.userList[k] = Object.assign({}, this.userList[k], {exit_status: this.exitStatus, userScore: user.score.ContestAnalysis.대회.contests[this.$route.params.contestID].Info.score})
            //   console.log(this.exitStatus)
            //   k = k + 1
            // })
            // // this.userList[k].push({userScore: user.score.ContestAnalysis.대회.contests[this.$route.params.contestID].Info.score})
            // // this.userList[k] = Object.assign({}, this.userList[k], {userScore: user.score.ContestAnalysis.대회.contests[this.$route.params.contestID].Info.score})
          })
        }
        console.log(this.userList)
      }, res => {
        this.loadingTable = false
      })
    },
    handleSelectionChange (val) {
      this.selectedUsers = val
    }
  },
  computed: {
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
</style>
