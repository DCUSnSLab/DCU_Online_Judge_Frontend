<template>
  <!--관리자 페이지의 수강과목 생성 페이지 -->
  <div class="view">
      <Panel :title="title">
          <el-form label-position="top">
              <el-row :gutter="20">
                  <el-col :span="4">
                    <el-form-item :label="$t('m.Lecture_Year')" required="required">
                      <el-select v-model="lecture.year">
                        <!-- 현재 년도를 기준으로 년도 출력 -->
                        <el-option v-for="year in years" :key="year" :value="year">
                          {{ year }}
                        </el-option>
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="3">
                      <el-form-item :label="$t('m.Lecture_Semester')" required="required">
                        <el-select v-model="lecture.semester">
                          <el-option value="1">1</el-option>
                          <el-option value="2">2</el-option>
                          <el-option value="3" label="입학 전">입학 전</el-option>
                        </el-select>
                      </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item :label="$t('m.Lecture_Founder')">
                      <el-select v-model="lecture.created_by_id">
                        <el-option v-for="professor in this.professor_list" v-bind:value="professor.id" v-bind:label="professor.realname" :key="professor.id">
                          {{ professor.realname }}
                        </el-option>
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="24">
                      <el-form-item :label="$t('m.LectureTitle')" required="required">
                          <el-input v-model="lecture.title" :placeholder="$t('m.LectureTitle')"></el-input>
                      </el-form-item>
                  </el-col>
                  <el-col :span="24">
                      <el-form-item :label="$t('m.LectureDescription')" required="required">
                          <Simditor v-model="lecture.description"></Simditor>
                      </el-form-item>
                  </el-col>
                  <el-col :span="12">
                      <el-form-item :label="$t('m.LectureStatus')">
                          <el-switch v-model="lecture.status" active-text="" inactive-text=""></el-switch>
                      </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item :label="$t('m.AI_helper_flag')">
                      <el-switch v-model="lecture.aihelper_status" active-text="" inactive-text=""></el-switch>
                    </el-form-item>
                  </el-col>
              </el-row>
          </el-form>
          <save @click.native="saveLecture"></save>
      </Panel>
  </div>
</template>

<script>
import api from '../../api.js'
import Simditor from '../../components/Simditor.vue'

export var now = new Date()
export var curYear = now.getFullYear()
export var curMonth = now.getMonth()

if (curMonth < 8) {
  curMonth = 1
} else {
  curMonth = 2
}

export default {
  name: 'CreateLecture',
  components: {
    Simditor
  },
  mounted () {
    api.getProfessorList().then(res => {
      for (var key in res.data.data.results) {
        this.professor_list.push({'id': res.data.data.results[key].id, 'realname': res.data.data.results[key].realname})
        // this.professor_list[res.data.data.results[key].id] = res.data.data.results[key].realname
      }
      this.$forceUpdate() // Vue에서는 시스템의 모든 변화를 감지하지 못합니다. 해당 코드가 있어야 불러온 교수님 리스트를 현재 화면에 적용할 수 있습니다.
    })
    if (this.$route.name === 'edit-lecture') {
      this.title = 'Edit Lecture'
      api.getLecture(this.$route.params.lectureId).then(res => {
        let data = res.data.data
        this.lecture = data
        // this.lecture.created_by_id = data.created_by.realname
      }).catch(() => {
      })
    } else if (this.$route.name === 'lecture-contest-list') {
      this.title = 'Add Lecture'
    }
  },
  data () {
    return {
      // title: this.$i18n.t('m.Lecture_create'),
      title: 'Title',
      disableRuleType: false,
      professor_list: [],
      lecture: {
        title: '',
        description: '',
        status: true,
        aihelper_status: false,
        password: '',
        year: curYear,
        semester: curMonth,
        created_by_id: null,
        contestlist: [{
          value: ''
        }]
      }
    }
  },
  computed: { // 현재 년도를 기준으로 년도 계산
    years () {
      const startYear = curYear - 1 // 현재 년도에서 1년 전부터 시작
      const endYear = curYear + 1 // 현재 년도에서 1년 후까지
      const yearArray = []
      for (let i = startYear; i <= endYear; i++) {
        yearArray.push(i)
      }
      return yearArray
    }
  },
  methods: {
    saveLecture () {
      let funcName = this.$route.name === 'edit-lecture' ? 'editLecture' : 'createLecture'
      let data = Object.assign({}, this.lecture)
      api[funcName](data).then(res => {
        // this.$router.push({name: 'lecture-list', query: {refresh: 'true'}})
        this.$router.go(-1)
      }).catch(() => {
      })
      console.log(data)
    }
  }
}
</script>