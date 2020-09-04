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
        <el-checkbox v-model="showPublic" label="공개 문제 보기" border></el-checkbox>
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
        label="생성일자"
        width="150">
        <template slot-scope="props">
          {{ props.row.create_time | localtime }}
        </template>
      </el-table-column>
      <el-table-column
        label="소속 수강과목"
        width="200"
        prop="lecture_title">
      </el-table-column>
      <el-table-column
        label="실습, 과제, 대회명"
        prop="title">
      </el-table-column>
      <el-table-column
        label="세부 설정"
        align="center"
        width="200"
        fixed="right">
        <template slot-scope="{row}">
          <div>
            <vue-multi-select
              v-model="values"
              search
              historyButton
              :filters="filters"
              :options="options"
              :position="position"
              :btnLabel="btnLabel"
              @click.native="getContestProblemList(row.id)"
              :selectOptions="data"/>
              <button v-show=false
                @click="reloadFunction" >
                Change v-model
              </button>
          </div>
        </template>
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
      @current-change="getPublicContest"
      :page-size="limit"
      :total="total">
    </el-pagination>
  </div>
</template>
<script>
  import api from '@admin/api'
  import vueMultiSelect from 'vue-multi-select'
  import 'vue-multi-select/dist/lib/vue-multi-select.css'

  export default {
    name: 'add-contest-from-public',
    props: ['lectureID'],
    data () {
      return {
        name: 'first group',
        btnLabel: values => `문제 선택`,
        showPublic: false,
        showPublicCont: '공개 문제 보기',
        values: [
          // { label: '2' },
          // { label: '3' }
        ],
        data: [{
          title: '문제 이름',
          elements: [],
          elements_id: []
        }],
        filters: [{
          nameAll: 'Select all',
          nameNotAll: 'Deselect all',
          func () {
            return true
          }
        }],
        options: {
          multi: true,
          groups: true,
          labelName: 'label',
          labelList: 'elements',
          groupName: 'title',
          cssSelected: option => (option.selected ? { 'background-color': '#5764c6' } : '')
        },
        element: [],
        year: 0,
        semester: 0,
        page: 1,
        limit: 5,
        total: 0,
        position: 'top-right',
        loading: false,
        contests: [],
        lecture: {},
        keyword: '',
        dropdown: ''
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
      api.getLecture(this.lectureID).then(res => {
        this.lecture = res.data.data
        this.getPublicContest()
      }).catch(() => {
      })
    },
    methods: {
      handleVisibleSwitch () {
        if (this.showPublic) {
          this.showPublic = true
        } else {
          this.showPublic = false
        }
        console.log(this.showPublic)
      },
      getContestProblemList (id) {
        api.getContProblemList(id).then(res => {
          this.data[0].elements = []
          for (let element in res.data.data.results) {
            this.data[0].elements.push(res.data.data.results[element].title)
            this.data[0].elements_id.push(res.data.data.results[element].id)
          }
        })
      },
      getPublicContest (page) {
        this.loading = true
        let params = {
          keyword: this.keyword,
          offset: (page - 1) * this.limit,
          limit: this.limit,
          year: this.year,
          semester: this.semester,
          publicProb: this.showPublic
        }
        api.getContestList(params).then(res => {
          this.loading = false
          this.total = res.data.data.total
          this.contests = res.data.data.results
        }).catch(() => {
        })
      },
      handleAddContest (contestID) {
        let selectProb = []
        for (let val in this.values) {
          selectProb.push(this.data[0].elements_id[this.data[0].elements.indexOf(this.values[val])])
        }
        let data = {
          prob_id: selectProb,
          contest_id: contestID,
          lecture_id: this.lectureID
        }
        // initialize values
        this.data[0].elements = []
        this.data[0].elements_id = []
        // data send to server
        api.addContestFromPublic(data).then(() => {
          this.$emit('on-change')
        }, () => {
        })
      },
      reloadFunction () {
        this.values = [
          { label: '2' },
          { label: '3' }
        ]
      },
      searchLecture (page) {
        let params = {
          keyword: this.keyword,
          offset: (page - 1) * this.limit,
          limit: this.limit,
          year: this.year,
          semester: this.semester,
          publicProb: this.showPublic
        }
        api.getContestList(params).then(res => {
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
    },
    components: {
      vueMultiSelect
    }
  }
</script>
<style scoped>
  .page {
    margin-top: 20px;
    text-align: right
  }

</style>
