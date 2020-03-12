<template>
  <Row type="flex">
    <Col :span="24">
    <Panel id="lecture-card" shadow>
      <div slot="title"><b>{{$t('m.Lectures')}}</b></div>
      <div slot="extra">
        <ul class="filter">
          <li>
            <Input id="keyword" @on-enter="changeRoute" @on-click="changeRoute" v-model="query.keyword"
                   icon="ios-search-strong" placeholder="Keyword"/>
          </li>
        </ul>
      </div>
      <p id="no-lecture" v-if="lectures.length == 0">{{$t('m.No_lecture')}}</p>
      <ol id="lecture-list">
        <li v-if="lectures != 0"><!--표시될 개설과목 수가 0이 아닌 경우에만 출력-->
          <Row id="tb-column" type="flex" justify="space-between" align="middle">
            <Col :span="1" style="text-align: center">
              년도
			      </Col>
            <Col :span="1" style="text-align: center">
              학기
			      </Col>
            <Col :span="16">
              과목명
            </Col>
            <Col :span="2">
              담당교수
			      </Col>
            <Col :span="4" style="text-align: center">
              수강신청 상태
			      </Col>
          </Row>
        </li>
        <li v-for="lecture in lectures" :key="lecture.id"><!--v-if 조건식을 통해 열림 상태인 수강 과목만 출력한다.-->
          <Row type="flex" justify="space-between" align="middle">
            <!--<img class="trophy" src="../../../../assets/Cup.png"/>--><!--트로피 대신 다른 이미지 추가-->
            <Col :span="1" style="text-align: center">
              {{ lecture.year }}
			      </Col>
            <Col :span="1" style="text-align: center">
              {{ lecture.semester }}
			      </Col>
            <Col :span="16" class="lecture-main">
              <p class="title">
                <span>{{ lecture.title }}</span>
              </p>
            </Col>
            <Col :span="2">
              {{ lecture.created_by.realname }}
			      </Col>
            <Col :span="4" style="text-align: center">
              <Button @click="applylecture(lecture)">수강신청</Button>
			      </Col>
          </Row>
        </li>
      </ol>
    </Panel>
    <Pagination :total="total" :pageSize="limit" @on-change="getLectureList" :current.sync="page"></Pagination>
    </Col>
  </Row>

</template>

<script>
  import api from '@oj/api'
  import { mapGetters } from 'vuex'
  import utils from '@/utils/utils'
  import Pagination from '@/pages/oj/components/Pagination'
  import time from '@/utils/time'

  const limit = 8

  export default {
    name: 'lecture-list',
    components: {
      Pagination
    },
    data () {
      return {
        page: 1,
        query: {
          status: '',
          keyword: '',
          rule_type: ''
        },
        limit: limit,
        total: 0,
        rows: '',
        lectures: [],
//      for password modal use
        cur_lecture_id: '',
        sugaing: false,
        apptext: 'Apply'
      }
    },
    beforeRouteEnter (to, from, next) {
      api.getLectureList(0, limit).then((res) => {
        next((vm) => {
          vm.lectures = res.data.data.results
          vm.total = res.data.data.total
        })
      }, (res) => {
        next()
      })
    },
    methods: {
      init () {
        let route = this.$route.query
        this.query.rule_type = route.rule_type || ''
        this.query.keyword = route.keyword || ''
        this.page = parseInt(route.page) || 1
        this.getLectureList()
      },
      getLectureList (page = 1) {
        let offset = (page - 1) * this.limit
        api.getLectureList(offset, this.limit, this.query).then((res) => {
          this.lectures = res.data.data.results
          this.total = res.data.data.total
        })
      },
      changeRoute () {
        let query = Object.assign({}, this.query)
        query.page = this.page
        this.$router.push({
          name: 'contest-list',
          query: utils.filterEmptyValue(query)
        })
      },
      onStatusChange (status) {
        this.query.status = status
        this.page = 1
        this.changeRoute()
      },
      goLecture (lecture) {
        this.cur_lecture_id = lecture.id
        this.$router.push({name: 'lecture-details', params: {lectureID: lecture.id, lectureTitle: lecture.title}})
      },
      applylecture (lecture) {
        if (!this.user.username) {
          this.$error('로그인 후 가능합니다.')
        } else {
          let data = {
            lecture_id: lecture.id,
            user_id: this.user.id,
            user_realname: this.user.realname,
            user_schoolssn: this.user.schoolssn,
            status: false
          }
          console.log(data)
          api.applyLecture(data).then(res => {
            this.getLectureList(this.page)
            this.$success('Success')
          })
        }
      },
      getDuration (startTime, endTime) {
        return time.duration(startTime, endTime)
      }
    },
    computed: {
      ...mapGetters(['isAuthenticated', 'user'])
    },
    watch: {
      '$route' (newVal, oldVal) {
        if (newVal !== oldVal) {
          this.init()
        }
      }
    }

  }
</script>
<style lang="less" scoped>
  #lecture-card {
    #keyword {
      width: 80%;
      margin-right: 30px;
    }
    #no-lecture {
      text-align: center;
      font-size: 16px;
      padding: 20px;
    }
    #lecture-list {
      > li {
        padding: 20px;
        border-bottom: 1px solid rgba(187, 187, 187, 0.5);
        list-style: none;

        .trophy {
          height: 40px;
          margin-left: 10px;
          margin-right: -20px;
        }
        .lecture-main {
          .title {
            font-size: 18px;
            a.entry {
              color: #495060;
              &:hover {
                color: #2d8cf0;
                border-bottom: 1px solid #2d8cf0;
              }
            }
          }
          li {
            display: inline-block;
            padding: 10px 0 0 10px;
            &:first-child {
              padding: 10px 0 0 0;
            }
          }
        }
      }
    }
    #tb-column {
      font-weight: bold;
      font-size: 18px;
    }
  }
</style>
