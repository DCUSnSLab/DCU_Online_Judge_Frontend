<template>
  <div id="header">
  <el-menu mode="horizontal" @select="handleSelect" :default-active="activeIndex" class="oj-menu">
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
   공개 질문
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
  <el-menu-item1 index="register" v-if="!isAuthenticated" style="float:right;">
    <div class="btn-menu">
      <Button v-if="website.allow_register" 
              type="ghost"
              shape="circle"
              @click="handleBtnClick('register')"
              style="margin-left: 5px;">{{$t('m.Register')}}
      </Button>
    </div>
  </el-menu-item1>
  <el-menu-item1 index="login" v-if="!isAuthenticated" style="float:right;">
    <div class="btn-menu">
      <Button index="login" type="ghost"
            ref="loginBtn"
            shape="circle"
            @click="handleBtnClick('login')">{{$t('m.Login')}}
      </Button>
    </div>
  </el-menu-item1>
  <el-submenu v-else style="float:right;">
           <template index="/user-home" @on-click="handleRoute" slot="title" trigger="click" style="margin-left: 50px;">{{ user.username }}</template>
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
  </el-menu>
<Modal v-model="modalVisible" :width="500">
  <div slot="header" class="modal-title">{{$t('m.Welcome_to')}} {{website.website_name_shortcut}}</div>
  <component :is="modalStatus.mode" v-if="modalVisible"></component>
  <div slot="footer" style="display: none"></div>
</Modal>
</div>
</template>

<script src="//unpkg.com/vue/dist/vue.js"></script>
<script src="//unpkg.com/element-ui@2.14.1/lib/index.js"></script>
<script>
  import { mapGetters, mapActions } from 'vuex'
  import login from '@oj/views/user/Login'
  import register from '@oj/views/user/Register'
  import api from '@oj/api'
  export default {
    components: {
      login,
      register
    },
    mounted () {
      this.getProfile()
    },
    data () {
      return {
        activeIndex: '1',
        inCollapse: true
      }
    },
    methods: {
      ...mapActions(['getProfile', 'changeModalStatus']),
      handleRoute (route) {
        if (route && route.indexOf('admin') < 0) {
          this.$router.push(route)
        } else {
          window.open('/admin/')
        }
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
<style>
  @import url("//unpkg.com/element-ui@2.14.1/lib/theme-chalk/index.css");
</style>
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

  .modal {
    &-title {
      font-size: 18px;
      font-weight: 600;
    }
  }
</style>