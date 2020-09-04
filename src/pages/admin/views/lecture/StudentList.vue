<template>
  <div class="view">
    <Panel :title="this.lectureTitle + ' ' + $t('m.Lecture_UserList')">
      <div>
        <strong>개설자 : {{ this.lectureFounder }}</strong>
      </div>
      <div slot="header">
        <el-row :gutter="20">
          <el-col :span="selectedUsers.length ? 16: 24">
            <el-input v-model="keyword" prefix-icon="el-icon-search" placeholder="Keywords"></el-input>
          </el-col>
        </el-row>
      </div>
      <strong>총 수강 학생/등록/미등록 : {{ userList.length }}명 / {{ RegistUser }}명 / {{ noRegistUser }}명</strong>
      <!--<div style="padding-top:10px">
        <el-checkbox v-model="persentage">실습, 과제, 시험 점수 진행도(%)로 보기</el-checkbox>
      </div>-->
      <template>
        <el-tabs v-model="activeName">
          <el-tab-pane label="종합" name="synthesis">
            <el-table
              v-loading="loadingTable"
              element-loading-text="loading"
              @selection-change="handleSelectionChange"
              ref="table"
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
                  <span v-if="scope.row.schoolssn"><!--해당 값을 출력하고-->
                    {{ scope.row.schoolssn }}
                  </span>
                  <span v-else><!--아닌 경우에는 User 테이블에 있는 schoolssn 값을 출력한다.-->
                    {{ scope.row.user.schoolssn }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="isallow" label="수강 유무" align="center">
                <template slot-scope="scope"> <!--true 일 때 출력하는 템플릿-->
                  <span v-if="scope.row.isallow" style="background-color:green; color:white">
                    {{ scope.row.isallow }}
                  </span>
                  <span v-else style="background-color:red; color:white">
                    {{ scope.row.isallow }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="총실습/도전/해결" align="center">
                <template slot-scope="scope">
                  <span style="text-align:center">
                    {{ scope.row.totalPractice }}/{{ scope.row.subPractice }}/{{ scope.row.solvePractice }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="총과제/도전/해결" align="center">
                <template slot-scope="scope">
                  <span style="text-align:center">
                    {{ scope.row.totalAssign }}/{{ scope.row.subAssign }}/{{ scope.row.solveAssign }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="총문제/도전/해결" align="center">
                <template slot-scope="scope">
                  <span style="text-align:center">
                    {{ scope.row.totalProblem }}/{{ scope.row.tryProblem }}/{{ scope.row.solveProblem }}
                  </span>
                </template>
              </el-table-column>
              
              <el-table-column prop="maxScore" label="만점" width="90" align="center"></el-table-column>
              <el-table-column prop="totalScore" label="총점" width="90" align="center"></el-table-column>
              <el-table-column prop="avgScore" label="평균" width="90" align="center"></el-table-column>
              <el-table-column prop="progress" label="진행율" width="90" align="center"></el-table-column>
              
              <el-table-column fixed="right" label="" width="200">
                <template slot-scope="{row}">
                  <icon-btn name="Accept" icon="edit" @click.native="AcceptStudent(row.user.id)"></icon-btn>
                  <icon-btn name="Deny" icon="trash" @click.native="DenyStudent(row.id)"></icon-btn>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
          <!---->
          <el-tab-pane label="실습" name="train">
            <table>
              <thead>
                <tr>
                  <th>
                    이름
                  </th>
                  <th>
                    학번
                  </th>
                  <template v-if="scoreListTable[0] !== undefined">
                    <template v-for="(contests, index) in scoreListTable['0'].score.traincolumnscore.contests">
                      <th>
                        {{ index + 1 }}주차
                      </th>
                    </template>
                  </template>
                  <th>
                    총점
                  </th>
                  <th>
                    평균
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in scoreListTable">
                  <td>
                    {{ user.realname }}
                  </td>
                  <td>
                    {{ user.schoolssn }}
                  </td>
                  <td v-if="persentage == false" v-for="contest in user.score.traincolumnscore.contests">
                    {{ contest.Info.score }}
                  </td>
                  <td v-if="persentage == true" v-for="contest in user.score.traincolumnscore.contests">
                    {{ contest.Info.average }}
                  </td>
                  <td>
                    {{ user.score.traincolumnscore.persentSum.toFixed(2) }}
                  </td>
                  <td v-if="persentage == true">
                    {{ user.score.traincolumnscore.persentavg.toFixed(2) }}
                  </td>
                  <td v-else>
                    {{ user.score.traincolumnscore.persentavg.toFixed(2) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </el-tab-pane>
          <!---->
          <el-tab-pane label="과제" name="assign">
            <table>
              <thead>
                <tr>
                  <th>
                    이름
                  </th>
                  <th>
                    학번
                  </th>
                  <template v-if="scoreListTable[0] !== undefined">
                    <template v-for="(contests, index) in scoreListTable['0'].score.assigncolumnscore.contests">
                      <th>
                        {{ index + 1 }}주차
                      </th>
                    </template>
                  </template>
                  <th>
                    총점
                  </th>
                  <th>
                    평균
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in scoreListTable">
                  <td>
                    {{ user.realname }}
                  </td>
                  <td>
                    {{ user.schoolssn }}
                  </td>
                  <td v-if="persentage == false" v-for="contest in user.score.assigncolumnscore.contests">
                    {{ contest.Info.score }}
                  </td>
                  <td v-if="persentage == true" v-for="contest in user.score.assigncolumnscore.contests">
                    {{ contest.Info.average }}
                  </td>
                  <td>
                    {{ user.score.assigncolumnscore.persentSum.toFixed(2) }}
                  </td>
                  <td v-if="persentage == true">
                    {{ user.score.assigncolumnscore.persentavg.toFixed(2) }}
                  </td>
                  <td v-else>
                    {{ user.score.assigncolumnscore.persentavg.toFixed(2) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </el-tab-pane>
          <!---->
          <el-tab-pane label="시험" name="contest">
            <table>
              <thead>
                <tr>
                  <th>
                    이름
                  </th>
                  <th>
                    학번
                  </th>
                  <template v-if="scoreListTable[0] !== undefined">
                    <template v-for="(contests, index) in scoreListTable['0'].score.contestcolumnscore.contests">
                      <th>
                        {{ index + 1 }}주차
                      </th>
                    </template>
                  </template>
                  <th>
                    총점
                  </th>
                  <th>
                    평균
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in scoreListTable">
                  <td>
                    {{ user.realname }}
                  </td>
                  <td>
                    {{ user.schoolssn }}
                  </td>
                  <td v-if="persentage == false" v-for="contest in user.score.contestcolumnscore.contests">
                    {{ contest.Info.score }}
                  </td>
                  <td v-if="persentage == true" v-for="contest in user.score.contestcolumnscore.contests">
                    {{ contest.Info.average }}
                  </td>
                  <td>
                    {{ user.score.contestcolumnscore.persentSum.toFixed(2) }}
                  </td>
                  <td v-if="persentage == true">
                    {{ user.score.contestcolumnscore.persentavg.toFixed(2) }}
                  </td>
                  <td v-else>
                    {{ user.score.contestcolumnscore.avg }}
                  </td>
                </tr>
              </tbody>
            </table>
          </el-tab-pane>
          <!---->
          <el-tab-pane label="Excel export" name="export">
            <el-checkbox-group v-model="checkList">
              <el-checkbox label="실습"></el-checkbox>
              <el-checkbox label="과제"></el-checkbox>
              <el-checkbox label="시험"></el-checkbox>
            </el-checkbox-group>
            <el-checkbox-group v-model="exceloption">
              <el-checkbox label="최종 제출일 포함"></el-checkbox>
            </el-checkbox-group>
            <template>
              <button type="button" @click="exportToExcel">Excel download</button>
            </template>
          </el-tab-pane>
          <!---->
        </el-tabs>
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
    <Panel :title="$t('TA/RA 학생 추가')" v-if="isAdmin">
      <div slot="header">
        <el-row :gutter="20">
          <el-col :span="selectedUsers.length ? 16: 24">
            <el-input v-model="ta_name" @click.native="onEnter" v-on:keyup.native.enter="onEnter" prefix-icon="el-icon-search" placeholder="TA/RA 학생 학번"></el-input>
          </el-col>
        </el-row>
      </div>
      <el-table :data="talist" v-loading="loading">
        <el-table-column
          label="이름"
          prop="realname">
        </el-table-column>
        <el-table-column
          label="학번"
          prop="schoolssn">
        </el-table-column>
        <el-table-column
          label="문제 접근 권한"
          align="center">
          <template slot-scope="props">
            <el-checkbox-group @change="checkboxChange(props.row.checklist, props.row.schoolssn)" v-bind:style="checkboxstyle" v-model="props.row.checklist">
              <el-checkbox label="문제 수정"></el-checkbox>
            </el-checkbox-group>
          </template>
        </el-table-column>
        <el-table-column
          label="답안 접근 권한"
          align="center">
          <template slot-scope="props">
            <el-checkbox-group @change="checkboxChange(props.row.checklist, props.row.schoolssn)" v-bind:style="checkboxstyle" v-model="props.row.checklist">
              <el-checkbox label="답안 확인"></el-checkbox>
            </el-checkbox-group>
          </template>
        </el-table-column>
        <el-table-column
          label="점수 확인 권한"
          align="center">
          <template slot-scope="props">
            <el-checkbox-group @change="checkboxChange(props.row.checklist, props.row.schoolssn)" v-bind:style="checkboxstyle" v-model="props.row.checklist">
              <el-checkbox label="점수 확인"></el-checkbox>
            </el-checkbox-group>
          </template>
        </el-table-column>
        <el-table-column
        label="삭제하기"
        align="center">
        <template slot-scope="{row}">
          <icon-btn icon="close" name="Delete the TA User"
                    @click.native="deleteTaUser(row.schoolssn)"></icon-btn>
        </template>
      </el-table-column>
      </el-table>
    </Panel>
    <el-dialog title="TA/RA 이름 검색 결과"
               v-if="lectureID"
               width="80%"
               :modal-append-to-body='true'
               @close-on-click-modal="false"
               :visible.sync="outerVisible">
                <add-t-a-user :lectureID.sync="lectureID" :studentName.sync="ta_name" @on-change="updateTAList"></add-t-a-user>
    </el-dialog>
    <Panel>
      <span slot="title">{{$t('m.Import_Student')}}
        <el-popover placement="right" trigger="hover">
          <p><img src="./example.png"/></p>
          <span>위 이미지와 동일한 형태로 존재하는 엑셀 학생 리스트를 가져올 수 있습니다.</span></br>
          <span>학생 이름이 ?와 같이 표시되는 경우, 인코딩 방식을 utf-8로 변경하여야 합니다.</span>
          <i slot="reference" class="el-icon-fa-question-circle import-user-icon"></i>
        </el-popover>
      </span>
      <el-upload v-if="!uploadUsers.length"
                 action=""
                 :show-file-list="false"
                 accept=".csv"
                 :before-upload="handleUsersCSV">
        <el-button size="small" icon="el-icon-fa-upload" type="primary">엑셀 파일 선택 (.csv 확장자)</el-button><!--엑셀 형태의 사용자 정보 파일 가져오는 기능-->
      </el-upload>
      <template v-else>
        <el-table :data="uploadUsersPage">
          <el-table-column label="학번">
            <template slot-scope="{row}">
              {{ row[0] }}
            </template>
          </el-table-column>
          <el-table-column label="이름">
            <template slot-scope="{row}">
              {{ row[1] }}
            </template>
          </el-table-column>
        </el-table>
        <div class="panel-options">
          <el-button type="primary" size="small"
                     icon="el-icon-fa-upload"
                     @click="handleUsersUpload">Import All
          </el-button>
          <el-button type="warning" size="small"
                     icon="el-icon-fa-undo"
                     @click="handleResetData">Reset Data
          </el-button>
          <el-pagination
            class="page"
            layout="prev, pager, next"
            :page-size="uploadUsersPageSize"
            :current-page.sync="uploadUsersCurrentPage"
            :total="uploadUsers.length">
          </el-pagination>
        </div>
      </template>
    </Panel>
  </div>
</template>
<script>
  import papa from 'papaparse'
  import api from '../../api.js'
  import utils from '@/utils/utils'
  import XLSX from 'xlsx'
  import AddTAUser from './addTAUserLecture'
  import { mapGetters } from 'vuex'

  export default {
    data () {
      return {
        outerVisible: false,
        persentage: true, // 학생 관리 페이지의 점수 산정 방식을 결정하는 boolean 변수, 기존 점수 산정 방식은 사용하지 않으므로 항상 true로 두어야 함.
        checkList: [
          '실습',
          '과제',
          '시험'
        ],
        exceloption: [
        ],
        checkboxstyle: {
          'padding-bottom': '0px'
        },
        // activeName: 'synthesis', // 페이지 내 여러 탭 표현을 위한 변수, synthesis와 동일한 name을 가진 pane이 default로 출력된다.
        activeName: 'synthesis', // 임시 지정
        showContestDialog: false,
        lectureID: '',
        searchUser: '',
        addTAUserDialogVisible: false,
        lectureFounder: '', // 강의 개설자 realname
        lectureTitle: '', // 수강과목 title
        pageSize: 50,
        total: 0,
        RegistUser: 0,
        noRegistUser: 0,
        loading: false,
        border: false,
        userList: [],
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
        loadingGenerate: false,
        currentPage: 0,
        talist: [],
        selectedUsers: [],
        formGenerateUser: {
          prefix: '',
          suffix: '',
          number_from: 0,
          number_to: 0,
          password_length: 8
        }
      }
    },
    mounted () {
      this.lectureID = this.$route.params.lectureId
      this.lectureTitle = this.$route.params.lectureTitle
      this.lectureFounder = this.$route.params.lectureFounder
      this.getUserList(1)
      this.getTAList(this.lectureID)
    },
    components: {
      AddTAUser
    },
    methods: {
      checkboxChange (check, ssn) {
        api.updateTAuserPermit(check, ssn, this.lectureID).then(res => {
          console.log(res)
        })
      },
      deleteTaUser (schoolssn) {
        let result = this.talist.findIndex(ssn => ssn.schoolssn === schoolssn)
        api.deleteTAUser(this.talist[result].schoolssn, this.lectureID).then(res => {
          console.log(res)
        })
        this.talist.splice(result, 1)
      },
      updateTAList () {
        api.getTAUserList(this.lectureID).then(res => {
          this.talist = res.data.data.results
        })
      },
      getTAList (lectureID) {
        api.getTAUserList(lectureID).then(res => {
          this.talist = res.data.data.results
        })
      },
      onEnter: function () {
        this.outerVisible = true
      },
      currentChange (page) {
        this.currentPage = page
        this.getUserList(page)
      },
      AcceptStudent (userid) {
        let data = {
          lecture_id: this.lectureID,
          user_id: userid
        }
        api.acceptStudent(data).then(res => {
          this.getUserList(this.page)
          this.$success('Success')
        })
      },
      DenyStudent (id) {
        this.$confirm('해당 학생의 수강신청을 삭제하시겠습니까?', 'confirm', {
          type: 'warning'
        }).then(() => {
          api.denyStudent(id, this.lectureID).then(res => {
            this.getUserList(this.page)
          }).catch(() => {
            this.getUserList(this.page)
          })
        }, () => {
        })
      },
      saveUser () {
        api.editUser(this.user).then(res => {
          // 更新列表
          this.getUserList(this.currentPage)
        }).then(() => {
          this.showUserDialog = false
        }).catch(() => {
        })
      },
      openUserDialog (id) {
        this.showUserDialog = true
        api.getUser(id).then(res => {
          this.user = res.data.data
          this.user.password = ''
          this.user.real_tfa = this.user.two_factor_auth
        })
      },
      // 获取用户列表
      getUserList (page) {
        console.log('getUserList Called')
        this.loadingTable = true
        api.getLectureUserList((page - 1) * this.pageSize, this.pageSize, this.keyword, this.lectureID).then(res => {
          this.loadingTable = false
          this.total = res.data.data.total
          this.userList = res.data.data.results
          if (this.userList.length === 0) {
            console.log('null')
          } else {
            this.userList.forEach(user => {
              if (user.score !== null) {
                if (user.score.constructor === Object && Object.keys(user.score).length === 0) {
                  console.log('empty object')
                } else {
                  var userinfo = {}
                  userinfo['realname'] = user.realname
                  userinfo['schoolssn'] = user.schoolssn
                  var trains = []
                  var assigns = []
                  var contests = []
                  var trainpersentSum = 0
                  var assignpersentSum = 0
                  var contestpersentSum = 0
                  for (var train in user.score.ContestAnalysis.실습.contests) {
                    trainpersentSum = trainpersentSum + user.score.ContestAnalysis.실습.contests[train].Info.average
                  }
                  for (var assign in user.score.ContestAnalysis.과제.contests) {
                    assignpersentSum = assignpersentSum + user.score.ContestAnalysis.과제.contests[assign].Info.average
                  }
                  for (var contest in user.score.ContestAnalysis.대회.contests) {
                    contestpersentSum = contestpersentSum + user.score.ContestAnalysis.대회.contests[contest].Info.average
                  }
                  for (var i in user.score.ContestAnalysis.실습.contests) {
                    trains.push(user.score.ContestAnalysis.실습.contests[i])
                  }
                  for (var j in user.score.ContestAnalysis.과제.contests) {
                    assigns.push(user.score.ContestAnalysis.과제.contests[j])
                  }
                  for (var k in user.score.ContestAnalysis.대회.contests) {
                    contests.push(user.score.ContestAnalysis.대회.contests[k])
                  }
                  var columnscore = {
                    traincolumnscore: {
                      contests: trains,
                      totalscore: user.score.ContestAnalysis.실습.Info.score,
                      // avg: user.score.ContestAnalysis.실습.Info.score / user.score.ContestAnalysis.실습.Info.numofcontents
                      avg: user.score.ContestAnalysis.실습.Info.average,
                      persentSum: trainpersentSum,
                      persentavg: trainpersentSum / user.score.ContestAnalysis.실습.Info.numofcontents
                    },
                    assigncolumnscore: {
                      contests: assigns,
                      totalscore: user.score.ContestAnalysis.과제.Info.score,
                      // avg: user.score.ContestAnalysis.과제.Info.score / user.score.ContestAnalysis.실습.Info.numofcontents
                      avg: user.score.ContestAnalysis.과제.Info.average,
                      persentSum: assignpersentSum,
                      persentavg: assignpersentSum / user.score.ContestAnalysis.과제.Info.numofcontents
                    },
                    contestcolumnscore: {
                      contests: contests,
                      totalscore: user.score.ContestAnalysis.대회.Info.score,
                      // avg: user.score.ContestAnalysis.대회.Info.score / user.score.ContestAnalysis.실습.Info.numofcontents
                      avg: user.score.ContestAnalysis.대회.Info.average,
                      persentSum: contestpersentSum,
                      persentavg: contestpersentSum / user.score.ContestAnalysis.대회.Info.numofcontents
                    }
                  }
                  userinfo.score = columnscore
                  this.scoreListTable.push(userinfo)
                }
              }
            })
          }
          this.noRegistUser = 0
          for (let uu of this.userList) {
            if (uu.isallow === false) {
              this.noRegistUser = this.noRegistUser + 1
            }
          }
          this.RegistUser = this.userList.length - this.noRegistUser
          // console.log(this.userList)
        }, res => {
          this.loadingTable = false
        })
      },
      handleSelectionChange (val) {
        this.selectedUsers = val
      },
      generateUser () {
        this.$refs['formGenerateUser'].validate((valid) => {
          if (!valid) {
            this.$error('Please validate the error fields')
            return
          }
          this.loadingGenerate = true
          let data = Object.assign({}, this.formGenerateUser)
          api.generateUser(data).then(res => {
            this.loadingGenerate = false
            let url = '/admin/generate_user?file_id=' + res.data.data.file_id
            utils.downloadFile(url).then(() => {
              this.$alert('All users created successfully, the users sheets have downloaded to your disk.', 'Notice')
            })
            this.getUserList(1)
          }).catch(() => {
            this.loadingGenerate = false
          })
        })
      },
      handleUsersCSV (file) {
        papa.parse(file, {
          encoding: 'euc-kr',
          complete: (results) => {
            let data = results.data.filter(user => {
              return user[0] && user[1]
            })
            let delta = results.data.length - data.length
            if (delta > 0) {
              this.$warning(delta + ' users have been filtered due to empty value')
            }
            this.uploadUsersCurrentPage = 1
            this.uploadUsers = data
            this.uploadUsersPage = data.slice(0, this.uploadUsersPageSize)
          },
          error: (error) => {
            this.$error(error)
          }
        })
      },
      handleUsersUpload () {
        console.log(this.uploadUsers)
        let aJson = []
        aJson.push(-1)
        aJson.push(this.$route.params.lectureId)
        this.uploadUsers.unshift(aJson)
        api.importStudents(this.uploadUsers).then(res => {
          this.getUserList(1)
          this.handleResetData()
        }).catch(() => {
        })
      },
      handleResetData () {
        this.uploadUsers = []
      },
      exportToExcel () {
        var wb = XLSX.utils.book_new()
        var exceldata = {
          '실습': [

          ],
          '과제': [

          ],
          '시험': [

          ]
        }
        for (var exportval in this.checkList) {
          console.log(this.checkList[exportval])
          if (this.checkList[exportval] === '실습') {
            this.scoreListTable.forEach(user => {
              var traindata = {}
              traindata.이름 = user.realname
              traindata.학번 = user.schoolssn
              for (var i in user.score.traincolumnscore.contests) {
                if (this.persentage === true) {
                  traindata[Number(i) + 1 + '주차'] = user.score.traincolumnscore.contests[i].Info.average
                } else {
                  traindata[Number(i) + 1 + '주차'] = user.score.traincolumnscore.contests[i].Info.score
                }
                if (this.exceloption[0] === '최종 제출일 포함') {
                  traindata[Number(i) + 1 + '주 최종 제출일'] = 0
                  console.log('date added')
                }
              }
              traindata.총점 = user.score.traincolumnscore.persentSum.toFixed(2)
              if (this.persentage === true) {
                traindata.평균 = user.score.traincolumnscore.persentavg.toFixed(2)
              } else {
                traindata.평균 = user.score.traincolumnscore.avg
              }
              exceldata['실습'].push(traindata)
            })
            var trainxls = XLSX.utils.json_to_sheet(exceldata.실습)
            XLSX.utils.book_append_sheet(wb, trainxls, '실습')
          } else if (this.checkList[exportval] === '과제') {
            this.scoreListTable.forEach(user => {
              var assigndata = {}
              assigndata.이름 = user.realname
              assigndata.학번 = user.schoolssn
              for (var i in user.score.assigncolumnscore.contests) {
                if (this.persentage === true) {
                  assigndata[Number(i) + 1 + '주차'] = user.score.assigncolumnscore.contests[i].Info.average
                } else {
                  assigndata[Number(i) + 1 + '주차'] = user.score.assigncolumnscore.contests[i].Info.score
                }
              }
              assigndata.총점 = user.score.assigncolumnscore.persentSum.toFixed(2)
              if (this.persentage === true) {
                assigndata.평균 = user.score.assigncolumnscore.persentavg.toFixed(2)
              } else {
                assigndata.평균 = user.score.assigncolumnscore.avg
              }
              exceldata['과제'].push(assigndata)
            })
            var assignxls = XLSX.utils.json_to_sheet(exceldata.과제)
            XLSX.utils.book_append_sheet(wb, assignxls, '과제')
          } else if (this.checkList[exportval] === '시험') {
            this.scoreListTable.forEach(user => {
              var contestdata = {}
              contestdata.이름 = user.realname
              contestdata.학번 = user.schoolssn
              for (var i in user.score.contestcolumnscore.contests) {
                if (this.persentage === true) {
                  contestdata[Number(i) + 1 + '주차'] = user.score.contestcolumnscore.contests[i].Info.average
                } else {
                  contestdata[Number(i) + 1 + '주차'] = user.score.contestcolumnscore.contests[i].Info.score
                }
              }
              contestdata.총점 = user.score.contestcolumnscore.persentSum.toFixed(2)
              if (this.persentage === true) {
                contestdata.평균 = user.score.contestcolumnscore.persentavg.toFixed(2)
              } else {
                contestdata.평균 = user.score.contestcolumnscore.avg
              }
              exceldata['시험'].push(contestdata)
            })
            var contestxls = XLSX.utils.json_to_sheet(exceldata.시험)
            XLSX.utils.book_append_sheet(wb, contestxls, '시험')
          }
        }
        console.log(exceldata)
        XLSX.writeFile(wb, 'export.xlsx')
      }
    },
    computed: {
      ...mapGetters(['isAdmin']),
      selectedUserIDs () {
        let ids = []
        for (let user of this.selectedUsers) {
          ids.push(user.id)
        }
        return ids
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
  .import-user-icon {
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
