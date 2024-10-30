<template>
  <div>
    <el-row>
      <!--실습, 과제, 대회 목록에서 실습,과제 가져오기 페이지 -->
      <el-col :span="2">
        <el-select v-model="year">
          <!-- 현재 년도를 기준으로 년도 출력 -->
          <el-option v-for="year in years" :key="year" :value="year">
            {{ year }}
          </el-option>
        </el-select>
        <!-- <el-select v-model="year">
          <el-option value="2020">2020년도</el-option>
          <el-option value="2021">2021년도</el-option>
          <el-option value="2022">2022년도</el-option>
          <el-option value="2023">2023년도</el-option>
          <el-option value="2024">2024년도</el-option>
        </el-select> -->
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
        <el-checkbox @change="handleVisibleSwitch" v-model="showPublic" :label="$t('m.AddPublickContest_All_Practice')" border></el-checkbox>
        <!-- <el-checkbox-button :label="showPublicCont"></el-checkbox-button> -->
      </el-col>
      <el-col :span="3">
        <el-date-picker
          v-model="start_time"
          type="datetime"
          :placeholder="$t('실습 시작 시간')">
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
        :label="$t('m.ProblemList_Creation_Date')"
        width="150">
        <template slot-scope="props">
          {{ props.row.create_time | localtime }}
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('m.Lecture_title')"
        width="200"
        prop="lecture_title">
      </el-table-column>
      <el-table-column
        :label="$t('m.Contest_title')"
        prop="title">
      </el-table-column>
      <el-table-column
        :label="$t('m.DetailSet')"
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
        dropdown: '',
        start_time: ''
      }
    },
    computed: {
      years () {
        const startYear = 2019 // 2019년도부터
        const endYear = new Date().getFullYear() // 현재 년도
        const yearArray = []
        for (let i = startYear; i <= endYear; i++) {
          yearArray.push(i)
        }
        return yearArray
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
        if (this.start_time === '') {
          this.$error('실습 시작 시간을 입력해 주세요.(실습 시작 시간 입력 시, 해당 시작 시간 기준으로 실습시간이 변경됩니다.)')
          return
        }
        let data = {
          prob_id: selectProb,
          contest_id: contestID,
          lecture_id: this.lectureID,
          start_time: this.start_time
        }
        // initialize values
        this.data[0].elements = []
        this.data[0].elements_id = []
        // data send to server
        console.log(data)
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
