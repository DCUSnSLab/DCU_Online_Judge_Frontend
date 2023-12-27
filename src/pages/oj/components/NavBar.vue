<template>
  <div id="header">
  <el-menu mode="horizontal" @select="handleSelect" :default-active="activeIndex" class="oj-menu" ref="test">
  <a href="/"><div class="logo"><img id="logo" src="../../../assets/logo.jpg" alt="oj logo"/></div></a>
  <el-menu-item index="/">
    <Icon type="home"></Icon>
    {{$t('m.Home')}}
  </el-menu-item>
  <el-menu-item index="/CourseList">
    <Icon type="ios-book"></Icon>
    {{$t('m.Signup_Lectures')}}
  </el-menu-item>
  <el-menu-item index="/lecture">
    <Icon type="ios-book"></Icon>
    {{$t('m.Lectures')}}
  </el-menu-item>
  <el-menu-item index="/contest">
    <Icon type="ios-book"></Icon>
    {{$t('m.Public_Contests')}}
  </el-menu-item>
  <el-menu-item index="/problem">
    <Icon type="ios-keypad"></Icon>
    {{$t('m.NavProblems')}}
  </el-menu-item>
  <el-menu-item index="/status">
    <Icon type="ios-pulse-strong"></Icon>
    {{$t('m.NavStatus')}}
  </el-menu-item>
  <el-menu-item index="/question">
   <Icon type="help"></Icon>
    {{$t('m.publicQA')}}
  </el-menu-item>
  <el-submenu index="8" name="rank">
    <template slot="title"><Icon type="podium"></Icon>{{$t('m.Rank')}}</template>
    <el-menu-item index="/acm-rank">{{$t('m.ACM_Rank')}}</el-menu-item>
    <el-menu-item index="/oi-rank">{{$t('m.OI_Rank')}}</el-menu-item>
  </el-submenu>
  <el-submenu index="9">
    <template slot="title"><Icon type="information-circled"></Icon>{{$t('m.About')}}</template>
    <el-menu-item index="/about">{{$t('m.Judger')}}</el-menu-item>
    <el-menu-item index="/FAQ">{{$t('m.FAQ')}}</el-menu-item>
  </el-submenu>
  <template v-if="!isAuthenticated" >
    <el-menu-item index="register" style="float:right;">
      <div class="btn-menu">
        <Button v-if="website.allow_register"
                type="ghost"
                shape="circle"
                @click="handleBtnClick('register')"
                style="margin-left: 5px;">{{$t('m.Register')}}
        </Button>
      </div>
    </el-menu-item>
    <el-menu-item index="login" style="float:right;">
      <div class="btn-menu">
        <Button index="login" type="ghost"
              ref="loginBtn"
              shape="circle"
              @click="handleBtnClick('login')">{{$t('m.Login')}}
        </Button>
      </div>
    </el-menu-item>
  </template>
  <template v-else>
    <div class="tile" >
      <span class="notify">
        <span class="notify-badge" v-if="!(pushTotal === 0)">{{pushTotal}}</span>
        <el-button class="drop-menu-bell" style="float:right; margin-right: 10px;margin-top: 10px;" icon="el-icon-bell" @click="dialogFormVisible = true"></el-button>
      </span>
    </div>
    <el-submenu style="float:right;">
      <template index="/user-home" @on-click="handleRoute" slot="title" trigger="click" ><span style="color: black; font-weight:bold;">{{ user.username }}</span></template>
        <el-menu-item index="/user-home">
          {{$t('m.MyHome')}}
        </el-menu-item>
        <el-menu-item index="/status?myself=1">
          {{$t('m.MySubmissions')}}
        </el-menu-item>
        <el-menu-item index="/setting/profile">
          {{$t('m.Settings')}}
        </el-menu-item>
        <el-menu-item v-if="isAdminRole" index="/admin">
          {{$t('m.Management')}}
        </el-menu-item>
        <el-menu-item divided index="/logout">
          {{$t('m.Logout')}}
        </el-menu-item>
    </el-submenu>
  </template>
  </el-menu>
<Modal v-model="modalVisible" :width="500">
  <div slot="header" class="modal-title">{{$t('m.Welcome_to')}} {{website.website_name_shortcut}}</div>
  <component :is="modalStatus.mode" v-if="modalVisible"></component>
  <div slot="footer" style="display: none"></div>
</Modal>
<el-dialog title="QnA 확인 알림 리스트" :modal=false :visible.sync="dialogFormVisible">
  <el-table :data="pushData" v-loading="loading">
    <el-table-column
      label="ID"
      prop="id">
    </el-table-column>
    <el-table-column
      label="수강과목"
      prop="problem.contest.lecture_title">
    </el-table-column>
    <el-table-column
      label="이름"
      prop="author.realname">
    </el-table-column>
    <el-table-column
      label="바로가기"
      align="center">
      <template slot-scope="{row}">
        <div v-if="row.lecture === 'null'">
          <el-button icon="el-icon-monitor" name="바로가기"
                    @click.native="goContestQnA(row.lecture, row.contest, row.problem.id, row.id)"></el-button>
        </div>
        <div v-else>
          <el-button icon="el-icon-monitor" name="바로가기"
                    @click.native="goPublicContestQnA(row.id)"></el-button>
        </div>
      </template>
    </el-table-column>
    <el-table-column
      v-if="!isAdminRole"
      label="해결완료"
      align="center">
      <template slot-scope="{row}">
        <el-button icon="el-icon-check"
                  @click.native="solveToQnA(row.id, row)"></el-button>
      </template>
    </el-table-column>
  </el-table>
  <div class="panel-options">
    <el-pagination
      class="page"
      layout="prev, pager, next"
      @current-change="currentChange"
      :total="pushTotal" :pageSize="limit">
    </el-pagination>
  </div>
</el-dialog>
</div>
</template>

<script>
  import { mapGetters, mapActions } from 'vuex'
  import login from '@oj/views/user/Login'
  import register from '@oj/views/user/Register'
  import api from '@oj/api'
  import Vue from 'vue'
  import ElementUI from 'element-ui'
  import locale from 'element-ui/lib/locale/lang/en'
  
  Vue.use(ElementUI, { locale })
  
  export default {
    components: {
      login,
      register
    },
    mounted () {
      this.getProfile()
      this.qnapushlist()
    },
    data () {
      return {
        activeIndex: '/',
        navHeight: null,
        inCollapse: true,
        pushTotal: 0,
        pushData: '',
        limit: 10,
        public_qna: '공개질문',
        loading: false,
        gridData: [{
          date: '2016-05-02',
          name: 'John Smith',
          address: 'No.1518,  Jinshajiang Road, Putuo District'
        }, {
          date: '2016-05-04',
          name: 'John Smith',
          address: 'No.1518,  Jinshajiang Road, Putuo District'
        }, {
          date: '2016-05-01',
          name: 'John Smith',
          address: 'No.1518,  Jinshajiang Road, Putuo District'
        }, {
          date: '2016-05-03',
          name: 'John Smith',
          address: 'No.1518,  Jinshajiang Road, Putuo District'
        }],
        dialogTableVisible: false,
        dialogFormVisible: false,
        form: {
          name: '',
          region: '',
          date1: '',
          date2: '',
          delivery: false,
          type: [],
          resource: '',
          desc: ''
        },
        formLabelWidth: '120px'
      }
    },
    methods: {
      ...mapActions(['getProfile', 'changeModalStatus', 'isAdminRole']),
      handleRoute (route) {
        if (route && route.indexOf('admin') < 0) {
          this.$router.push(route)
        } else {
          window.open('/admin/')
        }
      },
      qnapushlist () {
        let params = { offset: 0,
          limit: this.limit }
        api.PostListPushSerializer(params).then((res) => {
          this.pushTotal = res.data.data.total
          this.pushData = res.data.data.results
        })
      },
      currentChange (page) {
        let params = { offset: (page - 1) * this.limit,
          limit: this.limit }
        api.PostListPushSerializer(params).then((res) => {
          this.pushTotal = res.data.data.total
          this.pushData = res.data.data.results
        })
      },
      handleBtnClick (mode) {
        console.log(mode)
        this.changeModalStatus({
          visible: true,
          mode: mode
        })
      },
      goPublicContestQnA (questionID) {
        this.$router.push({
          name: 'problem-qna-detail',
          params: {
            questionID: questionID
          }
        })
      },
      solveToQnA (questionID, row) {
        let data = {'questionID': questionID}
        api.solvedQuestion(data).then((res) => {
          let idx = this.pushData.findIndex(function (item) { return item.id === questionID })
          if (idx > -1) this.pushData.splice(idx, 1)
        })
      },
      goContestQnA (lectureID, contestID, problemID, questionID) {
        this.$router.push({
          name: 'constest-problem-qna-detail',
          params: {
            lectureID: lectureID,
            problemID: problemID,
            contestID: contestID,
            questionID: questionID
          }
        })
      },
      handleSelect (key, keypath) {
        console.log(key)
        console.log(keypath)
        if (key && key.indexOf('admin') < 0) {
          this.$router.push(key)
        } else {
          window.open('/admin/')
          // window.open('/admin/') 없애도 되는지 모르겠다
          // root 계정으로 '관리' 메뉴에 들어가려면 위 코드가 필히 필요해 보임.
          // 검토 요망.. 다예
        }
      }
    },
    computed: {
      ...mapGetters(['website', 'modalStatus', 'user', 'isAuthenticated', 'isAdminRole']),
      // 跟随路由变化
      activeMenu () {
        // 여기서 이전 주소의 [1], [4]가 CourseList, problems 일때 return을 CourseList
        if (this.$route.path.split('/')[1] === 'contest' && parseInt(this.$route.path.split('/')[2]) > 0) {
          return '/' + 'CourseList'
        }
        return '/' + this.$route.path.split('/')[1]
      },
      modalVisible: {
        get () {
          return this.modalStatus.visible
        },
        set (value) {
          this.changeModalStatus({visible: value})
        }
      }
    }
  }
</script>
<style lang="less" scoped>
  #header {
    position: fixed;
    top: 0;
    left: 0;
    height: 60px;
    width: 100%;
    z-index: 1000;
    background-color: #fff;
    box-shadow: 0 1px 5px 0 rgba(0, 0, 0, 0.1);
    .oj-menu {
      background: #fdfdfd;
    }

    .logo {
      margin-left: 2%;
      margin-right: 2%;
      font-size: 20px;
      float: left;
      line-height: 30px;
      #logo{
        width: 130px;
        padding-top: 5px;
      }
    }

    .drop-menu {
      float: right;
      margin-right: 30px;
      position: absolute;
      right: 10px;
      &-title {
        font-size: 18px;
      }
    }
    .btn-menu {
      font-size: 16px;
      float: right;
      margin-right: 10px;
      margin-top: 15px;
    }
    .el-menu-item1 {
      padding-right: 0 !important;
    }
  }
  .notify-badge{
    position: relative;
    background: rgba(255,0,0,1);
    height:1.2rem;
    top: 3px;
    right: -60px;
    width:1.2rem;
    text-align: center;
    line-height: 1rem;
    border-radius: 50%;
    color:white;
    border:1px solid red;
  }
  .modal {
    &-title {
      font-size: 18px;
      font-weight: 600;
    }
  }
  .tile {
      float: right;
   }
  .notify {
      display: flex;
  }
</style>