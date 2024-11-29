<template>
  <el-row type="flex" :gutter="20">
    <el-col :md="10" :lg="8">
      <el-card class="admin-info">
        <el-row :gutter="20">
          <el-col :span="10">
            <img class="avatar" :src="profile.avatar"/>
          </el-col>
          <el-col :span="14">
            <p class="admin-info-name">{{user.username}}</p>
            <p>{{user.admin_type}}</p>
          </el-col>
        </el-row>
        <hr/>
        <div class="last-info">
          <p class="last-info-title">{{$t('m.Last_Login')}}</p>
          <el-form label-width="140px" class="last-info-body">
            <el-form-item :label="$t('m.Access_time')">
              <span>{{session.last_activity | localtime}}</span>
            </el-form-item>
            <el-form-item :label="$t('m.IP_address')">
              <span>{{session.ip}}</span>
            </el-form-item>
            <el-form-item :label="$t('m.OS')">
              <span>{{os}}</span>
            </el-form-item>
            <el-form-item :label="$t('m.Browser')">
              <span>{{browser}}</span>
            </el-form-item>
          </el-form>
        </div>
      </el-card>
      <panel :title="$t('m.System_Overview')" v-if="isSuperAdmin">
        <p>{{$t('m.DashBoardJudge_Server')}}:  {{infoData.judge_server_count}}</p>
        <p>{{$t('m.HTTPS_Status')}}:
          <el-tag :type="https ? 'success' : 'danger'" size="small">
            {{ https ? $t('m.Enable') : $t('m.Disabled')}}
          </el-tag>
        </p>
        <p>{{$t('m.Force_HTTPS')}}:
          <el-tag :type="forceHttps ? 'success' : 'danger'" size="small">
            {{forceHttps ? $t('m.Enable') : $t('m.Disabled')}}
          </el-tag>
        </p>
        <p>{{$t('m.CDN_HOST')}}:
          <el-tag :type="cdn ? 'success' : 'warning'" size="small">
            {{cdn ? cdn : $t('m.Not_used')}}
          </el-tag>
        </p>
      </panel>
    </el-col>
    
    <el-col :md="14" :lg="16" v-if="isSuperAdmin">
      <panel :title="$t('m.System_Statistics')" v-if="isSuperAdmin">
        <h2>{{$t('m.Submission_Date_Statistics')}}</h2>
        <div style="margin-bottom: 20px; text-align: center;">
          <el-select v-model="dateFilter_sub" placeholder="Select period" @change="updateChartData_sub" style="width: 200px;">
            <el-option :label="$t('m.Daily')" value="daily"></el-option>
            <el-option :label="$t('m.Weekly')" value="weekly"></el-option>
            <el-option :label="$t('m.Monthly')" value="monthly"></el-option>
          </el-select>
        </div>
        <div>
          <div class="echarts">
            <ECharts :options="optionsSub" ref="chartSub" autoresize></ECharts>
          </div>
        </div>
        <h2>{{$t('m.UserLoginStat')}}</h2>
        <div style="margin-bottom: 20px; text-align: center;">
          <el-select v-model="dateFilter_login" placeholder="Select period" @change="updateChartData_login" style="width: 200px;">
            <el-option :label="$t('m.Daily')" value="daily"></el-option>
            <el-option :label="$t('m.Weekly')" value="weekly"></el-option>
            <el-option :label="$t('m.Monthly')" value="monthly"></el-option>
          </el-select>
        </div>
        <div>
          <div class="echarts">
            <ECharts :options="optionsLogin" ref="chartLogin" autoresize></ECharts>
          </div>
        </div>
        <h2>{{$t('m.Submission_Ranking')}}</h2>
        <div>
          <div class="echarts">
            <ECharts :options="optionsRanking" ref="chartRanking" autoresize></ECharts>
          </div>
        </div>
      </panel>
    </el-col>

    <el-col :md="14" :lg="16" v-if="isSuperAdmin">
      <div class="info-container">
        <info-card color="#909399" icon="el-icon-fa-users" :message=" $t('m.Total_users')" iconSize="30px" class="info-item"
                   :value="infoData.user_count"></info-card>
        <info-card color="#67C23A" icon="el-icon-fa-list" :message=" $t('m.Today_submit_source_num')" class="info-item" 
                   :value="infoData.today_submission_count"></info-card>
        <info-card color="#409EFF" icon="el-icon-fa-trophy" :message=" $t('m.Recent_assignments_and_labs')" class="info-item"
                   :value="infoData.recent_contest_count"></info-card>
      </div>
      <panel style="margin-top: 5px">
        <span slot="title" v-loading="loadingReleases">{{ $t('m.Release_note') }}

        <el-popover placement="right" trigger="hover">
          <i slot="reference" class="el-icon-fa-question-circle import-user-icon"></i>
          <p>{{ $t('m.upgradePrompt') }}</p>
          <p>{{ $t('m.note') }} <a href="http://docs.onlinejudge.me/#/onlinejudge/guide/upgrade" target="_blank">
          http://docs.onlinejudge.me/#/onlinejudge/guide/upgrade</a>
          </p>
        </el-popover>

        </span>

        <el-collapse v-model="activeNames" v-for="(release, index) of releases" :key="'release' + index">
          <el-collapse-item :name="index+1">
            <template slot="title">
              <div v-if="release.new_version">{{release.title}}
                <el-tag size="mini" type="success">{{$t('m.latestVersion')}}</el-tag>
              </div>
              <span v-else>{{release.title}}</span>
            </template>
            <p>{{$t('m.recommendedLevel')}} {{release.level}}</p>
            <p>{{$t('m.details')}}</p>
            <div class="release-body">
              <ul v-for="detail in release.details" :key="detail">
                <li v-html="detail"></li>
              </ul>

            </div>
          </el-collapse-item>
        </el-collapse>
      </panel>
    </el-col>
  </el-row>
</template>


<script>
  import { mapGetters } from 'vuex'
  import browserDetector from 'browser-detect'
  import InfoCard from '@admin/components/infoCard.vue'
  import api from '@admin/api'

  export default {
    name: 'dashboard',
    components: {
      InfoCard
    },
    data () {
      return {
        topSubmittersData: [],
        optionsRanking: {
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'shadow'
            }
          },
          xAxis: {
            type: 'category',
            data: []
          },
          yAxis: {
            type: 'value',
            boundaryGap: [0, 0.01]
          },
          series: [
            {
              name: this.$t('m.Submissions'),
              type: 'bar',
              data: []
            }
          ],
          dataZoom: [
            {
              type: 'slider',
              show: true,
              xAxisIndex: [0],
              start: 0,
              end: 50,
              handleSize: '8%',
              zoomLock: true
            }
          ]
        },
        dateFilter_sub: 'daily',
        submissionData: [],
        dateFilter_login: 'daily',
        loginData: [],
        optionsSub: {
          tooltip: {
            trigger: 'axis'
          },
          legend: {
            data: [this.$i18n.t('m.Submit_date'), this.$i18n.t('m.Submit_cnt')]
          },
          xAxis: {
            type: 'category',
            data: [],
            axisLabel: {
              formatter: (value) => value
            }
          },
          yAxis: {
            type: 'value',
            max: 'dataMax'
          },
          series: [
            {
              name: '문제 제출 수',
              type: 'line',
              data: []
            }
          ],
          dataZoom: [
            {
              type: 'slider',
              show: true,
              xAxisIndex: [0],
              start: 0,
              end: 50,
              handleSize: '8%',
              zoomLock: true
            }
          ]
        },
        optionsLogin: {
          tooltip: {
            trigger: 'axis'
          },
          legend: {
            data: [this.$i18n.t('m.Submit_date'), this.$i18n.t('m.Submit_cnt')]
          },
          xAxis: {
            type: 'category',
            data: [],
            axisLabel: {
              formatter: (value) => value
            }
          },
          yAxis: {
            type: 'value',
            max: 'dataMax'
          },
          series: [
            {
              name: '로그인 수',
              type: 'line',
              data: [],
              itemStyle: {
                color: '#409EFF'
              },
              lineStyle: {
                color: '#409EFF'
              }
            }
          ],
          dataZoom: [
            {
              type: 'slider',
              show: true,
              xAxisIndex: [0],
              start: 0,
              end: 50,
              handleSize: '8%',
              zoomLock: true
            }
          ]
        },
        infoData: {
          user_count: 0,
          recent_contest_count: 0,
          today_submission_count: 0,
          judge_server_count: 0,
          env: {}
        },
        activeNames: [1],
        session: {},
        loadingReleases: true,
        releases: []
      }
    },
    mounted () {
      api.getTopsubmitters().then(resp => {
        const topSubmitters = resp.data.data
        const sortedSubmitters = topSubmitters.sort((a, b) => b.submission_count - a.submission_count)
        const names = sortedSubmitters.map(item => item.user__realname)
        const counts = sortedSubmitters.map(item => item.submission_count)
        const maxCount = Math.max(...counts)

        const ranks = names.map((name, index) => `${index + 1}등: ${name}`)
        this.optionsRanking.xAxis.data = ranks
        this.optionsRanking.series[0].data = counts

        this.optionsRanking.yAxis.max = maxCount + Math.ceil(maxCount * 0.1)
      }, () => {
      })
      api.getDashboardInfo().then(resp => {
        this.infoData = resp.data.data
      }, () => {
      })
      api.getSessions().then(resp => {
        this.parseSession(resp.data.data)
      }, () => {
      })
      api.getReleaseNotes().then(resp => {
        this.loadingReleases = false
        let data = resp.data.data
        if (!data) {
          return
        }
        let currentVersion = data.local_version
        data.update.forEach(release => {
          if (release.version > currentVersion) {
            release.new_version = true
          }
        })
        this.releases = data.update
      }, () => {
        this.loadingReleases = false
      })
      this.$nextTick(() => {
        this.loadsubmissionData()
        this.loadloginData()
      })
    },
    methods: {
      parseSession (sessions) {
        let session = sessions[0]
        if (sessions.length > 1) {
          session = sessions.filter(s => !s.current_session).sort((a, b) => {
            return a.last_activity < b.last_activity
          })[0]
        }
        this.session = session
      },
      loadsubmissionData () {
        let chartSub = this.$refs.chartSub
        chartSub.showLoading({maskColor: 'rgba(250, 250, 250, 0.8)'})
        api.getSubmissionDateCounts().then(resp => {
          this.submissionData = resp.data.data
          this.updateChartData_sub()
          chartSub.hideLoading()
        }).catch(() => {
          chartSub.hideLoading()
        })
      },
      loadloginData () {
        let chartLogin = this.$refs.chartLogin
        chartLogin.showLoading({maskColor: 'rgba(250, 250, 250, 0.8)'})
        api.getUserloginstats().then(resp => {
          this.loginData = resp.data.data
          console.log(123123)
          console.log(resp.data.data)
          this.updateChartData_login()
          chartLogin.hideLoading()
        }).catch(() => {
          chartLogin.hideLoading()
        })
      },
      groupDataByPeriod_sub (data, period) {
        const groupedData = {}
        data.forEach(entry => {
          let key
          const date = new Date(entry.date)
          if (period === 'weekly') {
            const month = String(date.getMonth() + 1).padStart(2, '0') // 월 계산
            const week = Math.ceil((date.getDate() + 6 - date.getDay()) / 7) // 주차 계산
            key = `${date.getFullYear()}-${month}월-${week}주` // 월과 주차 포함
          } else if (period === 'monthly') {
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          } else {
            key = entry.date // 기본적으로 일별
          }
          groupedData[key] = (groupedData[key] || 0) + entry.submission_count
        })
        return Object.entries(groupedData).map(([key, value]) => ({
          date: key,
          submission_count: value
        }))
      },
      groupDataByPeriod_login (data, period) {
        const groupedDatalogin = {}
        data.forEach(entry => {
          let key
          const date = new Date(entry.date)
          if (period === 'weekly') {
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const week = Math.ceil((date.getDate() + 6 - date.getDay()) / 7)
            key = `${date.getFullYear()}-${month}월-${week}주`
          } else if (period === 'monthly') {
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          } else {
            key = entry.date
          }
          groupedDatalogin[key] = (groupedDatalogin[key] || 0) + entry.login_count
        })
        return Object.entries(groupedDatalogin).map(([key, value]) => ({
          date: key,
          login_count: value
        }))
      },
      updateChartData_sub () {
        let filteredData = this.groupDataByPeriod_sub(this.submissionData, this.dateFilter_sub)

        let dates = []
        let counts = []
        let maxCount = 0
        filteredData.forEach(entry => {
          dates.push(entry.date)
          counts.push(entry.submission_count)
          maxCount = Math.max(maxCount, entry.submission_count)
        })

        this.optionsSub.xAxis.data = dates
        this.optionsSub.series[0].data = counts
        this.optionsSub.yAxis.max = maxCount + Math.ceil(maxCount * 0.1)
      },
      updateChartData_login () {
        let filteredData = this.groupDataByPeriod_login(this.loginData, this.dateFilter_login)

        let dates = []
        let counts = []
        let maxCount = 0
        filteredData.forEach(entry => {
          dates.push(entry.date)
          counts.push(entry.login_count)
          maxCount = Math.max(maxCount, entry.login_count)
        })

        this.optionsLogin.xAxis.data = dates
        this.optionsLogin.series[0].data = counts
        this.optionsLogin.yAxis.max = maxCount + Math.ceil(maxCount * 0.1)
      }
    },
    computed: {
      ...mapGetters(['profile', 'user', 'isSuperAdmin']),
      cdn () {
        return this.infoData.env.STATIC_CDN_HOST
      },
      https () {
        return document.URL.slice(0, 5) === 'https'
      },
      forceHttps () {
        return this.infoData.env.FORCE_HTTPS
      },
      browser () {
        let b = browserDetector(this.session.user_agent)
        if (b.name && b.version) {
          return b.name + ' ' + b.version
        } else {
          return 'Unknown'
        }
      },
      os () {
        let b = browserDetector(this.session.user_agent)
        return b.os ? b.os : 'Unknown'
      }
    }
  }
</script>

<style lang="less">
  .admin-info {
    margin-bottom: 20px;
    &-name {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 10px;
      color: #409EFF;
    }
    .avatar {
      max-width: 100%;
    }
    .last-info {
      &-title {
        font-size: 16px;
      }
      &-body {
        .el-form-item {
          margin-bottom: 5px;
        }
      }
    }
  }

  .info-container {
    display: flex;
    justify-content: flex-start;
    flex-wrap: wrap;
    .info-item {
      flex: 1 0 auto;
      min-width: 200px;
      margin-bottom: 10px;
    }
  }

  .echarts {
    margin: 0 auto;
    width: 95%;
    height: 400px;
  }

</style>
