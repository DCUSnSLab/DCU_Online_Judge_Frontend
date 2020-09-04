<template>
  <div>
    <el-row>
      <el-col :span="4">
        <el-select v-model="year">
          <el-option value="2020">2020년도</el-option>
          <el-option value="2021">2021년도</el-option>
          <el-option value="2022">2022년도</el-option>
          <el-option value="2022">2023년도</el-option>
          <el-option value="2022">2024년도</el-option>
        </el-select>
      </el-col>
      <el-col :span="2">
        <el-select v-model="semester">
          <el-option value="1">1학기</el-option>
          <el-option value="2">2학기</el-option>
        </el-select>
      </el-col>
      <el-col :span="12">
        <el-input
          v-model="keyword"
          placeholder="과목 검색"
          width="100">
        </el-input>
      </el-col>
      <el-col :span="2">
        <el-button @click="searchLecture">검색</el-button>
      </el-col>
      <el-col :span="4">
        <el-checkbox v-model="showPublic" label="전체 과목 보기" border></el-checkbox>
        <!-- <el-checkbox-button :label="showPublicCont"></el-checkbox-button> -->
      </el-col>
    </el-row>
    <el-table :data="contests" v-loading="loading">
      <el-table-column
        label="ID"
        width="70"
        prop="id">
      </el-table-column>
      <el-table-column
        label="생성자"
        width="70"
        prop="created_by.realname">
      </el-table-column>
      <el-table-column
        label="과목 명"
        prop="title">
      </el-table-column>
      <el-table-column
        label="추가하기"
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
        keyword: ''
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
          selectLectureID: lectureID,
          lecture_id: this.lectureID
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
