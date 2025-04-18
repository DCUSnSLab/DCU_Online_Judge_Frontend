<template>
  <div class="flex-container">
    <div id="main">
      <Panel shadow>
        <div slot="title">{{title}}</div>
        <div slot="extra">
          <ul class="filter">
            <li>
              <Dropdown @on-click="handleProblemChange">
                <span>{{ currentProblemDisplay }}
                  <Icon type="arrow-down-b"></Icon>
                </span>
                <Dropdown-menu slot="list">
                  <Dropdown-item name="">{{ $t('m.All') }}</Dropdown-item>
                  <Dropdown-item
                    v-for="(problem, index) in problems"
                    :key="problem.id"
                    :name="problem.id">
                    {{ $t('m.Problem') }} {{ index + 1 }}
                  </Dropdown-item>
                </Dropdown-menu>
              </Dropdown>
            </li>
            <li>
              <Dropdown @on-click="handleResultChange">
                <span>{{status}}
                  <Icon type="arrow-down-b"></Icon>
                </span>
                <Dropdown-menu slot="list">
                  <Dropdown-item name="">{{$t('m.All')}}</Dropdown-item>
                  <Dropdown-item v-for="status in Object.keys(JUDGE_STATUS)" :key="status" :name="status">
                    {{$t('m.' + JUDGE_STATUS[status].name.replace(/ /g, "_"))}}
                  </Dropdown-item>
                </Dropdown-menu>
              </Dropdown>
            </li>

            <li>
              <i-switch size="large" v-model="formFilter.myself" @on-change="handleQueryChange">
                <span slot="open">{{$t('m.All')}}</span>
                <span slot="close">{{$t('m.Mine')}}</span>
              </i-switch>
            </li>
            <li>
              <Input v-model="formFilter.username" :placeholder="$t('m.Search_Author')" @on-enter="handleQueryChange"/>
            </li>

            <li>
              <Button type="info" icon="refresh" @click="getSubmissions">{{$t('m.Refresh')}}</Button>
            </li>
          </ul>
        </div>
        <Table stripe :disabled-hover="true" :columns="columns" :data="submissions" :loading="loadingTable"></Table>
        <Pagination :total="total" :page-size="limit" @on-change="changePage" :current.sync="page"></Pagination>
      </Panel>
    </div>
  </div>
</template>

<script>
  import { mapGetters } from 'vuex'
  import api from '@oj/api'
  import { JUDGE_STATUS, USER_TYPE } from '@/utils/constants'
  import utils from '@/utils/utils'
  import time from '@/utils/time'
  import Pagination from '@/pages/oj/components/Pagination'

  export default {
    name: 'submissionList',
    components: {
      Pagination
    },
    data () {
      return {
        formFilter: {
          myself: true,
          result: '',
          username: ''
        },
        columns: [
          {
            title: this.$i18n.t('m.When'),
            align: 'center',
            render: (h, params) => {
              return h('span', time.utcToLocal(params.row.create_time))
            }
          },
          {
            title: this.$i18n.t('m.ID'),
            align: 'center',
            render: (h, params) => {
              console.log(params)
              if (params.row.show_link) {
                return h('span', {
                  style: {
                    color: '#57a3f3',
                    cursor: 'pointer'
                  },
                  on: {
                    click: () => {
                      this.$router.push('/status/' + params.row.id)
                    }
                  }
                }, params.row.id.slice(0, 12))
              } else {
                return h('span', params.row.id.slice(0, 12))
              }
            }
          },
          {
            title: this.$i18n.t('m.Status'),
            align: 'center',
            render: (h, params) => {
              return h('Tag', {
                props: {
                  color: JUDGE_STATUS[params.row.result].color
                }
              }, this.$i18n.t('m.' + JUDGE_STATUS[params.row.result].name.replace(/ /g, '_')))
            }
          },
          {
            title: this.$i18n.t('m.Problem'),
            align: 'center',
            render: (h, params) => {
              return h('span',
                {
                  style: {
                    color: '#57a3f3',
                    cursor: 'pointer'
                  },
                  on: {
                    click: () => {
                      if (this.contestID) {
                        this.$router.push(
                          {
                            name: 'contest-problem-details',
                            params: {problemID: params.row.problem, contestID: this.contestID}
                          })
                      } else {
                        this.$router.push({name: 'problem-details', params: {problemID: params.row.problem}})
                      }
                    }
                  }
                },
                params.row.problem)
            }
          },
          {
            title: this.$i18n.t('m.Time'),
            align: 'center',
            render: (h, params) => {
              return h('span', utils.submissionTimeFormat(params.row.statistic_info.time_cost))
            }
          },
          {
            title: this.$i18n.t('m.Memory'),
            align: 'center',
            render: (h, params) => {
              return h('span', utils.submissionMemoryFormat(params.row.statistic_info.memory_cost))
            }
          },
          {
            title: this.$i18n.t('m.Language'),
            align: 'center',
            key: 'language'
          },
          {
            title: this.$i18n.t('m.Author'),
            align: 'center',
            render: (h, params) => {
              return h('a', {
                style: {
                  'display': 'inline-block',
                  'max-width': '100px'
                },
                on: {
                  click: () => {
                    this.$router.push(
                      {
                        name: 'user-home',
                        query: {username: params.row.username}
                      })
                  }
                }
              }, params.row.username)
            }
          },
          {
            title: this.$i18n.t('m.AuthorRealname'),
            align: 'center',
            render: (h, params) => {
              return h('span', params.row.user.realname)
            }
          },
          {
            title: this.$i18n.t('m.Lecture_id'),
            align: 'center',
            key: 'lecture'
          }
        ],
        loadingTable: false,
        submissions: [],
        total: 30,
        limit: 12,
        page: 1,
        myself: true,
        contestID: '',
        problemID: '',
        routeName: '',
        JUDGE_STATUS: '',
        rejudge_column: true,
        problems: [ {id: 1}, {id: 2} ],
        selectedProblem: ''
      }
    },
    mounted () {
      this.init()
      this.fetchProblemList() // 수정하였음.
      this.JUDGE_STATUS = Object.assign({}, JUDGE_STATUS)
      // 去除submitting的状态 和 两个
      delete this.JUDGE_STATUS['9']
      delete this.JUDGE_STATUS['2']
    },
    methods: {
      init () {
        this.contestID = this.$route.params.contestID
        let query = this.$route.query
        this.selectedProblem = query.problemID || null // 2차
        this.formFilter.myself = query.myself === '0'
        this.formFilter.result = query.result || ''
        this.formFilter.username = query.username || ''
        this.page = parseInt(query.page) || 1
        if (this.page < 1) {
          this.page = 1
        }
        this.routeName = this.$route.name
        this.getSubmissions()
      },
      buildQuery () {
        const query = {
          myself: this.formFilter.myself === true ? '0' : '1',
          result: this.formFilter.result,
          username: this.formFilter.username,
          page: this.page
        }
        if (this.selectedProblem && this.selectedProblem !== '') {
          query.problem_id = this.selectedProblem
        }
        return query
      },
      getSubmissions () {
        let params = this.buildQuery()
        params.contest_id = this.contestID
        let offset = (this.page - 1) * this.limit
        let func = this.contestID ? 'getContestSubmissionList' : 'getSubmissionList'
        this.loadingTable = true
        api[func](offset, this.limit, params).then(res => {
          let data = res.data.data
          for (let v of data.results) {
            v.loading = false
          }
          this.adjustRejudgeColumn()
          this.loadingTable = false
          this.submissions = data.results
          this.total = data.total
        }).catch(() => {
          this.loadingTable = false
        })
      },
      changePage (newPage) {
        this.page = newPage
        this.getSubmissions()
      },
      // 改变route， 通过监听route变化请求数据，这样可以产生route history， 用户返回时就会保存之前的状态
      changeRoute () {
        let query = utils.filterEmptyValue(this.buildQuery())
        query.contestID = this.contestID
        query.problemID = this.selectedProblemID

        if (JSON.stringify(this.$route.query) === JSON.stringify(query)) {
          return
        }

        let routeName = query.contestID ? 'contest-submission-list' : 'submission-list'
        this.$router.push({
          name: routeName,
          query: utils.filterEmptyValue(query)  // 2차 수정중 복원하였음
        })
      },
      goRoute (route) {
        this.$router.push(route)
      },
      adjustRejudgeColumn () {
        if (!this.rejudgeColumnVisible || this.rejudge_column) { // rejudge 권한 확인 및 rejudge 컬럼 값 확인
          console.log('adjustRejudgeColumn called.')
          const judgeColumn = {
            title: this.$i18n.t('m.Option'),
            fixed: 'right',
            align: 'center',
            width: 90,
            render: (h, params) => {
              return h('Button', {
                props: {
                  type: 'primary',
                  size: 'small',
                  loading: params.row.loading
                },
                on: {
                  click: () => {
                    this.handleRejudge(params.row.id, params.index)
                  }
                }
              }, this.$i18n.t('m.Rejudge'))
            }
          }
          // this.columns.push(judgeColumn)
          this.rejudge_column = true
        }
      },
      handleResultChange (status) { // 2차 수정하였음.
        this.page = 1
        this.formFilter.result = status
        const query = Object.assign({}, this.$route.query)
        if (status === '') {
          delete query.result // 상태가 'All'이면 result 제거
        } else {
          query.result = status // 상태 값 설정
        }
        query.page = this.page // 페이지네이션 정보 갱신

        // problemID 유지
        if (this.selectedProblem && this.selectedProblem !== '') {
          query.problemID = this.selectedProblem
        } else {
          delete query.problemID // 선택된 문제가 없으면 제거
        }

        this.$nextTick(() => {
          this.$router.push({ query })
          this.getSubmissions() // 데이터 갱신
        })
      },
      handleQueryChange () {
        this.page = 1
        this.getSubmissions()
      },
      handleRejudge (id, index) {
        this.submissions[index].loading = true
        api.submissionRejudge(id).then(res => {
          this.submissions[index].loading = false
          this.$success('Succeeded')
          this.changeRoute()
        }, () => {
          this.submissions[index].loading = false
        })
      },
      handleProblemChange (problemID) {
        this.selectedProblem = problemID === '' ? null : problemID
        this.page = 1
        // 아래 부터 2차수정
        const query = Object.assign({}, this.$route.query)
        if (problemID === '') {
          delete query.problemID
        } else {
          query.problemID = problemID
        }
        query.page = this.page

        this.$nextTick(() => {
          this.$router.push({ query })
          // 위 부터 2차수정
          this.getSubmissions()
        })
      },
      fetchProblemList () {
        api.getContestProblemList(this.contestID).then(res => {
          this.problems = (res.data.data || []).map(problem => ({
            id: problem._id,
            title: problem.title
          }))
        }).catch(() => {
          this.problems = []
        })
      }
    },
    computed: {
      ...mapGetters(['isAuthenticated', 'user']),
      title () {
        if (!this.contestID) {
          return this.$i18n.t('m.Status')
        } else if (this.problemID) {
          return this.$i18n.t('m.Problem_Submissions')
        } else {
          return this.$i18n.t('m.Submissions')
        }
      },
      status () {
        return this.formFilter.result === '' ? this.$i18n.t('m.Status') : this.$i18n.t('m.' + JUDGE_STATUS[this.formFilter.result].name.replace(/ /g, '_'))
      },
      rejudgeColumnVisible () {
        // return !this.contestID && this.user.admin_type === USER_TYPE.SUPER_ADMIN // 특정 대회에 소속된 문제이면서, 사용자가 관리자인 경우에면 Rejudge 옵션 추가
        console.log('rejudgeColumnVisible')
        return this.user.admin_type === USER_TYPE.SUPER_ADMIN
      },
      currentProblemDisplay () {
        if (!this.selectedProblem) {
          return this.$t('m.Select_Problem')
        }
        const index = this.problems.findIndex(p => p.id === this.selectedProblem)
        if (index === -1) return this.$t('m.Select_Problem')
        return this.$t('m.Problem') + ' ' + (index + 1)
      }
    },
    watch: {
      '$route' (newVal, oldVal) {
        if (newVal !== oldVal) {
          this.init()
        }
      },
      'rejudgeColumnVisible' () {
        this.adjustRejudgeColumn()
      },
      'isAuthenticated' () {
        this.init()
      }
    }
  }
</script>

<style scoped lang="less">
  .ivu-btn-text {
    color: #57a3f3;
  }

  .flex-container {
    #main {
      flex: auto;
      margin-right: 18px;
      .filter {
        margin-right: -10px;
      }
    }
    #contest-menu {
      flex: none;
      width: 210px;
    }
  }
</style>