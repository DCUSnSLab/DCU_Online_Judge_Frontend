<template>
  <div :style="currentTheme">
    <NavBar ref="navbar"></NavBar>
    <div class="content-app" v-bind:style="navbarmargin">
      <transition name="fadeInUp" mode="out-in">
        <router-view></router-view>
      </transition>
      <div class="footer">
        <el-row  type="flex" class="row-bg" justify="center">
        <div v-for="img in imgList">
          <el-col :span="4" >
            <a :href="img.link" target="_blank"><img :src="img.url" :style="{width: img.style.width, height: img.style.height}" style="margin-right: 30px" /></a>
          </el-col>
        </div>
        <el-col :span="8">
          <p>신고 및 문의 : <a href="mailto:dcucode@gmail.com">dcucode@gmail.com</a></p>
          <p>Powered by <a href="https://cu.ac.kr" target="_blank">Daegu Catholic university</a> and <a href="https://github.com/QingdaoU" target="_blank">Qingdao University</a>
          </p>
        </el-col>
        </el-row>
      </div>
    </div>
    <BackTop></BackTop>
  </div>
</template>

<script>
  import { mapActions, mapState } from 'vuex'
  import NavBar from '@oj/components/NavBar.vue'
  import Vue from 'vue'
  import router from './router'
  import VueAnalytics from 'vue-analytics'
  import { lightTheme, darkTheme } from '../../theme'

  Vue.use(VueAnalytics, {
    id: 'UA-161262014-1',
    router
  })

  export default {
    name: 'app',
    components: {
      NavBar
    },
    data () {
      return {
        imgList: [
          {
            url: 'https://www.cu.ac.kr/images/common/link_logo_active.png',
            style: {
              width: '220px',
              height: '35px',
              margin: '10px'
            },
            link: 'https://www.cu.ac.kr'
          }, {
            url: 'http://sw.cu.ac.kr/pages/layout/A_layout/A_type/images/common/logo.png',
            style: {
              width: '178px',
              height: '35px',
              margin: '10px'
            },
            link: 'http://sw.cu.ac.kr/'
          }, {
            url: 'http://software.cu.ac.kr/pages/layout/A_layout/A_type/images/common/logo.png',
            style: {
              width: '178px',
              height: '35px',
              margin: '10px'
            },
            link: 'http://software.cu.ac.kr/'
          }
        ],
        version: process.env.VERSION,
        navbarmargin: { }
      }
    },
    created () {
      try {
        document.body.removeChild(document.getElementById('app-loader'))
      } catch (e) {
      }
    },
    mounted () {
      this.getWebsiteConfig()
      this.getInfoHeight()
      window.ontransitionend = () => {
        this.getInfoHeight()
      }
      window.onresize = () => {
        this.getInfoHeight()
      }
    },
    methods: {
      getInfoHeight () {
        var margin = this.$refs.navbar.$el.scrollHeight + 30 + 'px'
        Vue.set(this.navbarmargin, 'marginTop', margin)
      },
      ...mapActions(['getWebsiteConfig', 'changeDomTitle'])
    },
    computed: {
      ...mapState(['website']),
      ...mapState('theme', ['isDarkMode']),
      // isDarkMode 값에 따라 현재 테마를 선택합니다
      currentTheme () {
        return this.isDarkMode ? darkTheme : lightTheme
      }
    },
    watch: {
      'website' () {
        this.changeDomTitle()
      },
      '$route' () {
        this.changeDomTitle()
      },
      currentTheme: {
        immediate: true,
        handler (newTheme) {
          Object.keys(newTheme).forEach(key => {
            document.documentElement.style.setProperty(key, newTheme[key])
          })
        }
      }
    }
  }
</script>

<style lang="less">
  html {
    background-color: var(--background-color) !important;
    color: var(--text-color) !important;
  }
  
  body {
    background-color: var(--background-color) !important;
    color: var(--text-color) !important;
  }

  * {
    -webkit-box-sizing: border-box;
    -moz-box-sizing: border-box;
    box-sizing: border-box;
  }

  a {
    text-decoration: none;
    background-color: transparent;
    &:active, &:hover {
      outline-width: 0;
    }
  }

  .content-app {
    padding: 0 2%;
    margin-top: '80px';
  }

  .footer {
    margin-top: 20px;
    margin-bottom: 10px;
    text-align: center;
    font-size: small;
  }

  .fadeInUp-enter-active {
    animation: fadeInUp .8s;
  }

</style>