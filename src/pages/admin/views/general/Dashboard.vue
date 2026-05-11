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
      <div class="info-container">
        <info-card color="#909399" icon="el-icon-fa-users" :message=" $t('m.Total_users')" iconSize="30px" class="info-item"
                   :value="infoData.user_count"></info-card>
        <info-card color="#67C23A" icon="el-icon-fa-list" :message=" $t('m.Today_submit_source_num')" class="info-item" 
                   :value="infoData.today_submission_count"></info-card>
        <info-card color="#409EFF" icon="el-icon-fa-trophy" :message=" $t('m.Recent_assignments_and_labs')" class="info-item"
                   :value="infoData.recent_contest_count"></info-card>
      </div>
      <panel style="margin-top: 5px">
        <span slot="title">정성평가 큐 상태
          <el-tag v-if="evalCfg.slots_in_use >= evalCfg.slots_total && evalCfg.slots_total > 0"
                  size="mini" type="warning" style="margin-left:8px;">FULL</el-tag>
        </span>
        <div class="eval-widget">
          <div class="eval-stats">
            <div class="stat">
              <div class="lbl">슬롯</div>
              <div class="val">{{ evalCfg.slots_in_use }} / {{ evalCfg.slots_total }}</div>
            </div>
            <div class="stat">
              <div class="lbl">대기 큐</div>
              <div class="val">{{ evalCfg.queue_size }}</div>
            </div>
            <div class="stat">
              <div class="lbl">진행 중 job</div>
              <div class="val">{{ evalCfg.running.length }}</div>
            </div>
          </div>
          <div v-if="evalCfg.running.length" class="eval-list">
            <p class="eval-list-title">진행 중</p>
            <div v-for="r in evalCfg.running" :key="'r' + r.id" class="eval-row">
              <span class="eval-row-id">#{{ r.id }}</span>
              <span class="eval-row-meta">강의 {{ r.lecture_id }} / 컨테스트 {{ r.contest_id }}</span>
              <el-progress :percentage="evalPct(r)" :stroke-width="6"
                           :status="r.n_failed > 0 ? 'warning' : 'success'"
                           style="flex:1;margin-left:12px;"></el-progress>
              <span class="eval-row-num">{{ r.n_done + r.n_failed }} / {{ r.n_total }}</span>
            </div>
          </div>
          <div v-if="evalCfg.pending.length" class="eval-list">
            <p class="eval-list-title">대기 중</p>
            <div v-for="p in evalCfg.pending" :key="'p' + p.id" class="eval-row">
              <span class="eval-row-id">#{{ p.id }}</span>
              <span class="eval-row-meta">강의 {{ p.lecture_id }} / 컨테스트 {{ p.contest_id }}</span>
              <span class="eval-row-num">예정 {{ p.n_total }}</span>
            </div>
          </div>
          <p v-if="!evalCfg.running.length && !evalCfg.pending.length" class="eval-empty">
            활성 작업 없음
          </p>
          <p class="eval-link">
            <router-link to="/eval-queue">→ 슬롯 수 설정 및 상세</router-link>
          </p>
        </div>
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
        infoData: {
          user_count: 0,
          recent_contest_count: 0,
          today_submission_count: 0,
          judge_server_count: 0,
          env: {}
        },
        session: {},
        evalCfg: { slots_total: 0, slots_in_use: 0, queue_size: 0, running: [], pending: [] },
        evalPollHandle: null
      }
    },
    mounted () {
      api.getDashboardInfo().then(resp => {
        this.infoData = resp.data.data
      }, () => {
      })
      api.getSessions().then(resp => {
        this.parseSession(resp.data.data)
      }, () => {
      })
      // 정성평가 큐 — Super Admin 만 폴링
      if (this.$store.getters.isSuperAdmin) {
        this.fetchEvalCfg()
        this.evalPollHandle = setInterval(() => this.fetchEvalCfg(), 4000)
      }
    },
    beforeDestroy () {
      if (this.evalPollHandle) clearInterval(this.evalPollHandle)
    },
    methods: {
      fetchEvalCfg () {
        api.getEvalQueueConfig().then(resp => {
          if (!resp.data.error && resp.data.data) {
            this.evalCfg = resp.data.data
          }
        }, () => {})
      },
      evalPct (row) {
        if (!row.n_total) return 0
        return Math.min(100, Math.round(((row.n_done + row.n_failed) / row.n_total) * 100))
      },
      parseSession (sessions) {
        let session = sessions[0]
        if (sessions.length > 1) {
          session = sessions.filter(s => !s.current_session).sort((a, b) => {
            return a.last_activity < b.last_activity
          })[0]
        }
        this.session = session
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

  .eval-widget {
    .eval-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 14px;
      .stat {
        background: #f5f7fa;
        border: 1px solid #ebeef5;
        border-radius: 6px;
        padding: 10px 12px;
        text-align: center;
        .lbl { font-size: 10px; opacity: 0.65; text-transform: uppercase; letter-spacing: 0.05em; }
        .val { font-size: 18px; font-weight: 700; margin-top: 2px; font-variant-numeric: tabular-nums; }
      }
    }
    .eval-list {
      margin-bottom: 12px;
    }
    .eval-list-title {
      font-size: 12px;
      color: #606266;
      font-weight: 600;
      margin: 8px 0 6px;
    }
    .eval-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 0;
      border-bottom: 1px solid #f0f2f5;
      font-size: 12px;
      &:last-child { border-bottom: none; }
      .eval-row-id { font-weight: 700; color: #409eff; min-width: 36px; }
      .eval-row-meta { color: #606266; }
      .eval-row-num { font-variant-numeric: tabular-nums; font-size: 11px; opacity: 0.75; min-width: 70px; text-align: right; }
    }
    .eval-empty {
      text-align: center;
      padding: 16px;
      color: #909399;
      font-size: 12px;
    }
    .eval-link {
      margin-top: 12px;
      text-align: right;
      font-size: 12px;
      a { color: #409eff; }
    }
  }

</style>
