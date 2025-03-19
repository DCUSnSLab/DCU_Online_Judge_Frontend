<template>
  <Panel shadow :padding="10">
    <div slot="title" :style="currentTheme">
      {{title}}
    </div>
    <div slot="extra">
      <Button v-if="listVisible" type="info" @click="init" :loading="btnLoading">{{$t('m.Refresh')}}</Button>
      <Button v-else type="ghost" icon="ios-undo" class="btn-back" @click="goBack">{{$t('m.Back')}}</Button>
    </div>
    <transition-group name="announcement-animate" mode="in-out">
      <div class="no-announcement" v-if="!announcements.length" key="no-announcement">
        <p>{{$t('m.No_Announcements')}}</p>
      </div>
      <template v-if="listVisible">
        <ul class="announcements-container" key="list">
          <li v-for="announcement in announcements" :key="announcement.title">
            <div class="flex-container">
              <div class="title"><a class="entry" @click="goAnnouncement(announcement)">
                {{announcement.title}}</a></div>
              <div class="date">{{announcement.create_time | localtime }}</div>
              <div class="creator"> {{$t('m.By')}} {{announcement.created_by.username}}</div>
            </div>
          </li>
        </ul>
        <Pagination v-if="!isContest"
                    key="page"
                    :total="total"
                    :page-size="limit"
                    :current="page"
                    @on-change="getAnnouncementList">
        </Pagination>
      </template>
      <template v-else>
        <div v-katex v-html="announcement.content" key="content" class="content-container markdown-body"></div>
      </template>
    </transition-group>
  </Panel>
</template>



<script>
  import api from '@oj/api'
  import Pagination from '@oj/components/Pagination'
  import { mapState } from 'vuex'
  import { lightTheme, darkTheme } from '@/theme'
  import { page } from 'vue-analytics'

  var pageFoo = 1 // 페이지 위치 임시로 저장하는거

  export default {
    name: 'Announcement',
    components: {
      Pagination
    },
    data () {
      return {
        limit: 10, // 페이지당 보여주는 공지사항 수
        total: 10,
        btnLoading: false,
        announcements: [],
        announcement: '',
        listVisible: true
      }
    },
    mounted () {
      this.init()
    },
    methods: {
      init () { // 초기화
        if (this.isContest) {
          this.getContestAnnouncementList()
        } else {
          this.getAnnouncementList()
        }
      },
      getAnnouncementList (page = 1) { // 원래 page = 1, 공지사항 새로고침? 페이지 2로 이동 ㄱㄴ 문제 : 새로고침 누르면 페이지 1로 이동 문제는 하단 공지 사항 페이지 번호가 1로 안바뀜
        console.log('getAnnouncement page', page)
        this.btnLoading = true
        api.getAnnouncementList((page - 1) * this.limit, this.limit).then(res => {
          this.btnLoading = false
          this.announcements = res.data.data.results
          this.total = res.data.data.total
        }, () => {
          this.btnLoading = false
        })
        pageFoo = page
        this.page = pageFoo
        console.log('pageFoo', pageFoo)
      },
      getContestAnnouncementList () {
        this.btnLoading = true
        api.getContestAnnouncementList(this.$route.params.contestID).then(res => {
          this.btnLoading = false
          this.announcements = res.data.data
        }, () => {
          this.btnLoading = false
        })
      },
      goAnnouncement (announcement) { // 공지사항 들어가는거
        console.log('page', this.page)
        console.log('pageFoo', pageFoo)
        this.announcement = announcement
        this.listVisible = false
        console.log('page', this.page)
      },
      // 공지사항 페이지로 돌아가기, 문제 : 공지사항 페이지 번호가 1로 바뀜
      goBack () {
        this.listVisible = true // 공지 리스트 보여주는거
        this.announcement = ''
        this.page = pageFoo // 내가 덕분에 산다...
        console.log('page', this.page)
        console.log('pageFoo', pageFoo)
      }
    },
    computed: {
      title () {
        if (this.listVisible) {
          return this.isContest ? this.$i18n.t('m.Contest_Announcements') : this.$i18n.t('m.Announcements 살려줘')
        } else {
          return this.announcement.title
        }
      },
      isContest () {
        return !!this.$route.params.contestID
      },
      computed: {
        ...mapState('theme', ['isDarkMode']),
        currentTheme () {
          return this.isDarkMode ? darkTheme : lightTheme
        }
      }
    }
  }
</script>

<style scoped lang="less">
  .announcements-container {
    margin-top: -10px;
    margin-bottom: 10px;
    li {
      padding-top: 15px;
      list-style: none;
      padding-bottom: 15px;
      margin-left: 20px;
      font-size: 16px;
      border-bottom: 1px solid var(--list-border-bottom);
      &:last-child {
        border-bottom: none;
      }
      .flex-container {
        .title {
          flex: 1 1;
          text-align: left;
          padding-left: 10px;
          a.entry {
            color: var(--announcement-title-color);
            &:hover {
              color: var(--announcement-title-hover-color);
              border-bottom: 1px solid var(--announcement-title-hover-color);
            }
          }
        }
        .creator {
          flex: none;
          width: 200px;
          text-align: center;
        }
        .date {
          flex: none;
          width: 200px;
          text-align: center;
        }
      }
    }
  }

  .btn-back {
    color: var(--button-text-color);
  }
  
  .content-container {
    padding: 0 20px 20px 20px;
  }

  .no-announcement {
    text-align: center;
    font-size: 16px;
  }changeLocale

  .announcement-animate-enter-active {
    animation: fadeIn 1s;
  }
</style>
