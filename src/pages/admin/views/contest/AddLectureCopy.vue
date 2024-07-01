<template>
  <div>
    <el-row>
      <el-col :span="2">
        <el-select v-model="year">
          <el-option value="2020">2020년도</el-option>
          <el-option value="2021">2021년도</el-option>
          <el-option value="2022">2022년도</el-option>
          <el-option value="2023">2023년도</el-option>
          <el-option value="2024">2024년도</el-option>
        </el-select>
      </el-col>
      <el-col :span="1">
        <el-select v-model="semester">
          <el-option value="1">{{$t('m.First_Semester')}}</el-option>
          <el-option value="2">{{$t('m.Second_Semester')}}</el-option>
          <el-option value="3">{{$t('m.Semester_Before')}}</el-option>
        </el-select>
      </el-col>
      <el-col :span="12">
        <el-input
          v-model="keyword"
          :placeholder="$t('m.Lecture_Search')"
          width="100">
        </el-input>
      </el-col>
      <el-col :span="2">
        <el-button @click="searchLecture">{{$t('m.Lecture_Search')}}</el-button>
      </el-col>
      <el-col :span="3">
        <el-checkbox v-model="showPublic" :label="$t('m.CopyPublickContest_All_Lecture')" border></el-checkbox>
        <!-- <el-checkbox-button :label="showPublicCont"></el-checkbox-button> -->
      </el-col>
      <el-col :span="3">
        <el-date-picker
          v-model="start_time"
          type="datetime"
          :placeholder="$t('첫 번째 실습 시작 시간')">
        </el-date-picker>
      </el-col>
    </el-row>
    <el-table :data="contests" v-loading="loading">
      <el-table-column
        label="ID"
        width="70"
        prop="id">
      </el-table-column>
      <el-table-column
        :label="$t('m.StudentList_Creator')"
        width="70"
        prop="created_by.realname">
      </el-table-column>
      <el-table-column
        :label="$t('m.Lecture_title')"
        prop="title">
      </el-table-column>
      <el-table-column
        :label="$t('m.Add')"
        align="center"
        width="100"
        fixed="right">
        <template slot-scope="{row}">
          <icon-btn icon="plus" name="Add the Contest"
                    @click.native="handleAddContest(row.id)"></icon-btn>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      class="page"
      layout="prev, pager, next"
      @current-change="listUpLecture"
      :page-size="limit"
      :total="total">
    </el-pagination>
  </div>
</template>
<script>
  import api from '@admin/api'

  export default {
    name: 'copy-lecture',
    props: ['lectureID'],
    data () {
      return {
        showPublic: false,
        year: 0,
        semester: 0,
        page: 1,
        limit: 5,
        total: 0,
        loading: false,
        contests: [],
        keyword: '',
        start_time: ''
      }
    },
    mounted () {
      // 현재 년도, 월 기준으로 default 값 세팅 수행
      let today = new Date()
      this.year = today.getFullYear()
      if (today.getMonth() >= 3 & today.getMonth() < 8) {
        this.semester = 1
      } else {
        this.semester = 2
      }
      let params = {
        lecture_id: this.lectureID,
        year: this.year,
        semester: this.semester,
        keyword: this.keyword,
        showPublic: this.showPublic
      }
      api.addLectureCopy(params).then(res => {
        this.contests = res.data.data.results
        this.listUpLecture()
      }).catch(() => {
      })
    },
    methods: {
      listUpLecture (page) {
        this.loading = true
        let params = {
          lecture_id: this.lectureID,
          year: this.year,
          offset: (page - 1) * this.limit,
          limit: this.limit,
          semester: this.semester,
          keyword: this.keyword,
          showPublic: this.showPublic
        }
        api.addLectureCopy(params).then(res => {
          this.loading = false
          this.total = res.data.data.total
          this.contests = res.data.data.results
        }).catch(() => {
        })
      },
      handleAddContest (lectureID) {
        let data = {
          select_lecture_ID: lectureID,
          lecture_id: this.lectureID,
          start_time: this.start_time
        }
        if (this.start_time === '') {
          this.$error('첫 번째 실습 시작 시간을 입력해 주세요.(첫 번째 실습 시작 시간 입력 시, 해당 시작 시간 기준으로 모든 실습시간이 변경됩니다.)')
          return
        }
        api.LectureCopy(data).then(() => {
          this.$emit('on-change')
        }, () => {
        })
      },
      searchLecture (page) {
        let params = {
          lecture_id: this.lectureID,
          year: this.year,
          offset: (page - 1) * this.limit,
          limit: this.limit,
          semester: this.semester,
          keyword: this.keyword,
          showPublic: this.showPublic
        }
        api.addLectureCopy(params).then(res => {
          this.loading = false
          this.total = res.data.data.total
          this.contests = res.data.data.results
        }).catch(() => {
        })
      }
    },
    watch: {
      keyword: function (val) {
        this.keyword = val
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
