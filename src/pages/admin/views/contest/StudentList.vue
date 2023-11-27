<template>
  <div class="view">
    <Panel :title="this.lectureTitle + ' ' + $t('m.Lecture_UserList')">
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
          <el-tab-pane label="등록여부" name="synthesis">
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
              <el-table-column prop="isallow" label="가입 유무" align="center">
                <template slot-scope="scope"> <!--true 일 때 출력하는 템플릿-->
                  <span v-if="scope.row.isallow" style="background-color:green; color:white">
                    {{ scope.row.isallow }}
                  </span>
                  <span v-else style="background-color:red; color:white">
                    {{ scope.row.isallow }}
                  </span>
                </template>
              </el-table-column>

              <el-table-column fixed="right" label="" width="200">
                <template slot-scope="{row}">
                  <icon-btn name="Accept" icon="edit" @click.native="AcceptStudent(row.user.id)"></icon-btn>
                  <icon-btn name="Deny" icon="trash" @click.native="DenyStudent(row.id)"></icon-btn>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="Excel export" name="export">
            <el-checkbox-group v-model="checkList">
              <el-checkbox label="대회"></el-checkbox>
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

    <Panel>
      <span slot="title">{{$t('m.Import_Student')}}
        <el-popover placement="right" trigger="hover">
          <p><img src="./example.png"/></p>
          <span>위 이미지와 동일한 형태로 존재하는 엑셀 학생 리스트를 가져올 수 있습니다.</span>
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
        ContestTitle: '',
        searchUser: '',
        contestId: '',
        lectureId: '',
        lectureTitle: '',
        lectureCreator: '',
        pageSize: 50,
        total: 0,
        RegistUser: 0,
        noRegistUser: 0,
        loading: false,
        border: false,
        userList: [],
        scoreListTable: [
          {
            lecDict: {
              sample2: 0,
              sample1: 0
            }
          }
        ],
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
      console.log('StudentList.vue')
      this.lectureId = this.$route.params.lectureId
      this.currentLectureInfo(this.lectureId)
      this.getUserList(1)
    },
    components: {
    },
    methods: {
      checkboxChange (check, ssn) {
        api.updateTAuserPermit(check, ssn, this.lectureID).then(res => {
          console.log(res)
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
          api.denyContStudent(id, this.contestId).then(res => {
            this.getUserList(0)
          }).catch(() => {
            this.getUserList(0)
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
        api.getPublicContestUserList((page - 1) * this.pageSize, this.pageSize, this.contestId).then(res => {
          this.scoreListTable = res.data.data.results
          console.log(this.scoreListTable)
        })
        api.getContestUserList((page - 1) * this.pageSize, this.pageSize, this.keyword, this.contestId).then(res => {
          console.log('res')
          console.log(res)
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
        aJson.push('contestId')
        aJson.push(this.$route.params.contestId)
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
        api.getPublicContestUserList(0, this.total, this.contestId).then(res => {
          this.scoreListTable = res.data.data.results
          console.log(this.scoreListTable)
          var wb = XLSX.utils.book_new()
          var exceldata = {
            '대회': [

            ]
          }
          for (var exportval in this.checkList) {
            console.log(this.checkList[exportval])
            if (this.checkList[exportval] === '대회') {
              this.scoreListTable.forEach(user => {
                var contestdata = {}
                contestdata.이름 = user.realname
                contestdata.학번 = user.schoolssn
                for (var prob in user.lecDict) {
                  contestdata[prob] = user.lecDict[prob]
                }
                contestdata.총점 = user.totalScore.toFixed(2)
                exceldata['대회'].push(contestdata)
              })
              var contestxls = XLSX.utils.json_to_sheet(exceldata.대회)
              XLSX.utils.book_append_sheet(wb, contestxls, '대회')
            }
          }
          console.log(exceldata)
          XLSX.writeFile(wb, 'export.xlsx')
        })
      },
      currentLectureInfo (lectureId) {
        console.log('currentLectureInfo called')
        api.getLecture(lectureId).then(res => {
          console.log(res)
          this.lectureTitle = res.data.data.title
          this.lectureCreator = res.data.data.created_by.realname
        })
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
