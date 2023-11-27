<template>
  <div>
    <Panel :style="panelStyle">
      <div slot="title">{{$t('m.Problems_List')}}</div>
      <!--
      <el-table
        :data="lectureData"
        :resizable="resize"
        @cell-click="cellClick"
        style="width: 100%; font-size: 12px">
        <el-table-column
          prop="_id"
          width="150"
          label="#">
        </el-table-column>
        <el-table-column
          prop="title"
          width="300"
          :label="this.$i18n.t('m.Title')">
        </el-table-column>
        <el-table-column
          prop="submission_number"
          width="100"
          :label="this.$i18n.t('m.Total')">
        </el-table-column>
        <el-table-column
          prop="submission_number"
          width="100"
          :label="this.$i18n.t('m.AC_Rate')">
          <template slot-scope="scope">
            {{getACRate(scope.row.accepted_number, scope.row.submission_number)}}
          </template>
        </el-table-column>
        <el-table-column
          width="100"
          label="">
          <template slot-scope="scope">
            <el-buttons
              size="mini"
              @click="goQnA(scope.row)">질문보기</el-buttons>
          </template>
        </el-table-column>
      </el-table>
      -->
      <Table v-if="contestRuleType == 'ACM' || OIContestRealTimePermission"
             :columns="ACMTableColumns"
             :data="problems"
             @on-row-click="goContestProblem"
             :no-data-text="$t('m.No_Problems')"></Table>
      <Table v-else
             :data="problems"
             :columns="OITableColumns"
             @on-row-click="goContestProblem"
             no-data-text="$t('m.No_Problems')"></Table>
    </Panel>

  </div>
</template>

<script>
  import {mapState, mapGetters} from 'vuex'
  import {ProblemMixin} from '@oj/components/mixins'
  import api from '@oj/api'

  export default {
    name: 'ContestProblemList',
    mixins: [ProblemMixin],
    data () {
      return {
        lectureData: [],
        resize: true,
        panelStyle: { display: 'none' },
        ACMTableColumns: [
          {
            title: '#',
            key: '_id',
            sortType: 'asc',
            width: 150
          },
          {
            title: this.$i18n.t('m.Title'),
            key: 'title'
          },
          {
            title: this.$i18n.t('m.Total'),
            key: 'submission_number'
          },
          {
            title: this.$i18n.t('m.AC_Rate'),
            render: (h, params) => {
              return h('span', this.getACRate(params.row.accepted_number, params.row.submission_number))
            }
          }
        ],
        OITableColumns: [
          {
            title: '#',
            key: '_id',
            width: 150
          },
          {
            title: this.$i18n.t('m.Title'),
            key: 'title'
          }
        ]
      }
    },
    mounted () {
      this.getContestProblems()
    },
    methods: {
      getContestProblems () {
        this.$store.dispatch('getContestProblems').then(res => {
          this.lectureData = res.data.data
          if (this.isAuthenticated) {
            if (this.contestRuleType === 'ACM') {
              this.addStatusColumn(this.ACMTableColumns, res.data.data)
            } else if (this.OIContestRealTimePermission) {
              this.addStatusColumn(this.ACMTableColumns, res.data.data)
            }
          }
          this.panelStyle = {display: 'block'}
        })
      },
      goQnA (row) {
        this.$router.push({
          name: 'constest-problem-qna',
          params: {
            lectureID: this.$route.params.lectureID,
            contestID: this.$route.params.contestID,
            problemID: row.id
          }
        })
      },
      cellClick (row, column, cell, event) {
        if (column.label !== '공개 질문') {
          this.goContestProblem(row)
        }
      },
      goContestProblem (row) {
        this.$router.push({
          name: 'contest-problem-details',
          params: {
            lectureID: this.$route.params.lectureID,
            contestID: this.$route.params.contestID,
            problemID: row._id
          }
        })
      }
    },
    computed: {
      ...mapState({
        problems: state => state.contest.contestProblems
      }),
      ...mapGetters(['isAuthenticated', 'contestRuleType', 'OIContestRealTimePermission'])
    }
  }
</script>

<style>
  .el-table th, .el-table tr {
    background-color: transparent;
  }
  .el-table__header-wrapper {
    background-color: #f8f8f9;
  }
</style>
