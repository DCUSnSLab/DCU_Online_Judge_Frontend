<template>
  <div>
    <el-row>
      <el-col :span="4">
        <el-select v-model="searchType">
          <el-option value="과목">과목</el-option>
          <el-option value="문제">문제</el-option>
        </el-select>
      </el-col>
      <el-col :span="16">
        <el-input
          v-model="keyword"
          placeholder="Keywords"
          :width="150"
          prefix-icon="el-icon-search">
        </el-input>
      </el-col>
      <el-col :span="4">
        <el-checkbox v-model="showPublic" label="공개 문제 보기" border></el-checkbox>
        <!-- <el-checkbox-button :label="showPublicCont"></el-checkbox-button> -->
      </el-col>
    </el-row>
    <el-table :data="problems" v-loading="loading">
      <el-table-column
        label="ID"
        width="80"
        prop="id">
      </el-table-column>
      <el-table-column
        label="생성자"
        width="80"
        prop="created_by.realname">
      </el-table-column>
      <el-table-column
        label="과목명"
        width="150"
        prop="contest.lecture_title">
      </el-table-column>
      <el-table-column
        label="실습/과제/시험"
        width="150"
        prop="contest.title">
      </el-table-column>
      <el-table-column
        label="문제이름"
        prop="title">
      </el-table-column>
      <el-table-column
        label="option"
        align="center"
        width="100"
        fixed="right">
        <template slot-scope="{row}">
          <icon-btn icon="plus" name="Add the problem"
                    @click.native="handleAddProblem(row.id)"></icon-btn>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      class="page"
      layout="prev, pager, next"
      @current-change="getPublicProblem"
      :page-size="limit"
      :total="total">
    </el-pagination>
  </div>
</template>
<script>
  import api from '@admin/api'

  export default {
    name: 'add-problem-from-public',
    props: ['contestID'],
    data () {
      return {
        page: 1,
        limit: 10,
        total: 0,
        loading: false,
        problems: [],
        contest: {},
        keyword: '',
        showPublic: false,
        searchType: '문제'
      }
    },
    mounted () {
      api.getContest(this.contestID).then(res => {
        this.contest = res.data.data
        this.getPublicProblem()
      }).catch(() => {
      })
    },
    methods: {
      getPublicProblem (page) {
        this.loading = true
        let params = {
          keyword: this.keyword,
          searchType: this.searchType,
          offset: (page - 1) * this.limit,
          limit: this.limit,
          rule_type: this.contest.rule_type,
          showPublic: this.showPublic
        }
        api.getProblemList(params).then(res => {
          this.loading = false
          this.total = res.data.data.total
          this.problems = res.data.data.results
          console.log(this.problems)
        }).catch(() => {
        })
      },
      handleAddProblem (problemID) {
        this.$prompt('Please input display id for the contest problem', 'confirm').then(({value}) => {
          let data = {
            problem_id: problemID,
            contest_id: this.contestID,
            display_id: value
          }
          api.addProblemFromPublic(data).then(() => {
            this.$emit('on-change')
          }, () => {
          })
        }, () => {
        })
      }
    },
    watch: {
      'keyword' () {
        this.getPublicProblem(this.page)
      },
      'showPublic' () {
        this.getPublicProblem(1)
      },
      'searchType' () {
        this.getPublicProblem(1)
      }
    }
  }
</script>
<style scoped>
  .page {
    margin-top: 20px;
    text-align: right
  }

</style>
