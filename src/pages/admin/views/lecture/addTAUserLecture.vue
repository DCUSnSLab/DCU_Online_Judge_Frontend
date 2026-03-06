<template>
  <div>
    <el-row :gutter="20">
      <el-col :span="4">
        <el-select v-model="searchType">
          <el-option :value="$t('m.TA_Search_Name')">{{$t('m.TA_Search_Name')}}</el-option>
          <el-option :value="$t('m.TA_Search_StudentID')">{{$t('m.TA_Search_StudentID')}}</el-option>
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
        <el-button @click="searchUser">{{$t('m.TA_Search_Button')}}</el-button>
      </el-col>
    </el-row>
    <el-table :data="talist" v-loading="loading">
      <el-table-column
        label="ID"
        prop="id">
      </el-table-column>
      <el-table-column
        :label="$t('m.TA_Search_Name')"
        prop="realname">
      </el-table-column>
      <el-table-column
        :label="$t('m.TA_Search_StudentID')"
        prop="schoolssn">
      </el-table-column>
      <el-table-column
        :label="$t('m.TA_Add_Column')"
        align="center">
        <template slot-scope="{row}">
          <icon-btn icon="plus" :name="$t('m.TA_Register')"
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
    props: ['lectureId', 'studentName'],
    data () {
      return {
        innerVisible: false,
        loading: false,
        searchType: '',
        keyword: '',
        talist: [],
        addtalist: []
      }
    },
    mounted () {
      this.searchType = this.$t('m.TA_Search_Name')
      console.log(this.lectureId)
      // this.getTalist()
    },
    methods: {
      searchUser () {
        let data = {
          lecture_id: this.lectureId,
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
          lecture_id: this.lectureId,
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
          lecture_id: this.lectureId,
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
