<template>
  <div>
    <b-sidebar id="sidebar-right" title="Sidebar" width="500px" no-header right shadow>
      <div class="sidebar" id="wrapper">
        <el-button class="sidebar-margin" v-b-toggle.sidebar-right icon="el-icon-close" circle></el-button>
        <h2 class="sidebar-header">{{$t('m.qna')}}</h2>
        <hr/>
        <div class="sidebar-content">
          <br/>
          <span>{{$t('m.Contents') }}</span>
          <el-input class="sidebar-content-margin" :placeholder="$t('m.Please_enter_subject')" v-model="qnaContent.title"></el-input>
          <Simditor class="sidebar-content-margin" v-model="qnaContent.content"></Simditor>
          <el-button type="primary" v-b-toggle.sidebar-right @click.native="QnAWrite">{{$t('m.Save') }}</el-button>
        </div>
      </div>
    </b-sidebar>
  </div>
</template>
<script>
  export default {
    name: 'add-problem-qna',
    props: ['infomation'],
    data () {
      return {
        page: 1,
        limit: 10,
        total: 0,
        loading: false,
        problems: [],
        contest: {},
        keyword: '',
        showPublic: false,
        searchType: '문제'
      }
    },
    mounted () {
      this.getPublicProblem()
    },
    methods: {
      getPublicProblem () {
        console.log(this.infomation)
      }
    }
  }
</script>
<style scoped>
  .page {
    margin-top: 20px;
    text-align: right
  }
</style>
