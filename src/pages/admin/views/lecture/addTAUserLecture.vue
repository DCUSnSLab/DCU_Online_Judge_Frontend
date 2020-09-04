<template>
  <div>
    <el-row :gutter="20">
      <el-col :span="4">
        <el-select v-model="searchType">
          <el-option value="이름">이름</el-option>
          <el-option value="학번">학번</el-option>
        </el-select>
      </el-col>
      <el-col :span="17" fixed="right">
        <el-input
          v-model="keyword"
          placeholder="Keywords"
          prefix-icon="el-icon-search"
          width="150">
        </el-input>
      </el-col>
      <el-col :span="3" fixed="right">
        <el-button @click="searchUser">검색</el-button>
      </el-col>
    </el-row>
    <el-table :data="talist" v-loading="loading">
      <el-table-column
        label="ID"
        prop="id">
      </el-table-column>
      <el-table-column
        label="이름"
        prop="realname">
      </el-table-column>
      <el-table-column
        label="학번"
        prop="schoolssn">
      </el-table-column>
      <el-table-column
        label="추가하기"
        align="center">
        <template slot-scope="{row}">
          <icon-btn icon="plus" name="TA 학생 등록"
                    @click.native="handleAddContest(row.id)"></icon-btn>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
<script>
  import api from '@admin/api'

  export default {
    name: 'add-TA-user',
    props: ['lectureID', 'studentName'],
    data () {
      return {
        innerVisible: false,
        loading: false,
        searchType: '이름',
        keyword: '',
        talist: [],
        addtalist: []
      }
    },
    mounted () {
      console.log(this.lectureID)
      // this.getTalist()
    },
    methods: {
      searchUser () {
        let data = {
          lecture_id: this.lectureID,
          Name: this.keyword,
          add: false,
          searchType: this.searchType
        }
        api.getUserInfo(data).then(res => {
          console.log(res)
          this.talist = res.data.data.results
        })
      },
      getTalist () {
        let data = {
          lecture_id: this.lectureID,
          Name: this.keyword,
          add: false
        }
        api.getUserInfo(data).then(res => {
          this.talist = res.data.data.results
        })
      },
      handleAddContest (userID) {
        let result = this.talist.findIndex(userID => userID.id === userID)
        this.talist.splice(result, 1)
        let data = {
          lecture_id: this.lectureID,
          User: userID,
          add: true
        }
        api.getUserInfo(data).then(() => {
          this.$emit('on-change')
        }, () => {
        })
      }
    },
    watch: {
      keyword: function (val) {
        console.log(val)
        this.keyword = val
      }
    },
    components: {
    }
  }
</script>
<style>
</style>
