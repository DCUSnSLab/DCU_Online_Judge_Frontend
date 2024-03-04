<template>
    <div>
        <Panel :title="$t('m.CopyKiller_Title')">
            <el-tabs v-model="activeName" @tab-click="handleClick">
                <el-tab-pane :label="$t('m.CopyKiller_Single_Lecture_Tab')" name="first">
                    <div v-loading="loading">
                      {{$t('m.CopyKiller_Perform_Single')}} <el-button type="primary" icon="el-icon-download" @click.native="single_download"></el-button>
                    </div>
                </el-tab-pane>
                <el-tab-pane :label="$t('m.CopyKiller_Multiple_Lecture_Tab')" name="second" :disable=check>
                    <br/>
                    <el-row>
                        <el-col :span="4">
                            <h3 style="margin: 10px">{{$t('m.CopyKiller_Perform_Multiple')}}</h3>
                        </el-col>
                        <el-col :span="4">
                            <el-input v-model="keyword"
                              prefix-icon="el-icon-search"
                               @keyup.enter.native="searchProblem"
                               :placeholder="$t('m.CopyKiller_Search_Keyword')">
                            </el-input>
                        </el-col>
                        <el-col :span="2">
                            <el-button type="primary" size="small" style="margin: 4px"
                                       @click="searchProblem" icon="el-icon-search">{{$t('m.CopyKiller_Search')}}
                            </el-button>
                        </el-col>
                    </el-row>
                    <hr/>
                    <el-transfer
                        style="width: auto;"
                        v-loading="loading"
                        v-model="value"
                        :props="{
                          key: 'value',
                          label: 'desc'
                        }"
                        :titles="[$t('m.CopyKiller_Search_List'), $t('m.CopyKiller_Target')]"
                        @change="handleChange"
                        :format="{
                          noChecked: '${total}',
                          hasChecked: '${checked}/${total}'
                        }"
                        :data="data">
                        <el-button class="transfer-footer" slot="right-footer" @click="multiple_download" size="small">{{$t('m.CopyKiller_Execute')}}</el-button>
                    </el-transfer>
                </el-tab-pane>
              </el-tabs>
        </Panel>
    </div>
</template>

<script>
  import utils from '@/utils/utils'
  import api from '../../api'

  export default {
    name: 'CopyKiller',
    components: {
    },
    data () {
      return {
        loading: false,
        activeName: 'first',
        index_html: '',
        keyword: '',
        check: true,
        Checked: [],
        problem: '',
        value: [0],
        data: [],
        defaultData: []
      }
    },
    mounted () {
      this.problem = this.$route.params.problemID
      this.init()
    },
    methods: {
      init () {
        api.getProblem(this.problem).then(res => {
          console.log(res)
          this.data = [{'value': 0, 'id': res.data.data.id, 'disabled': true, 'desc': res.data.data.contest.created_by.realname + '-' + res.data.data.contest.lecture_title + '_' + res.data.data.title}]
          this.defaultData = this.data
        }).catch(() => {
        })
      },
      single_download () {
        this.loading = true
        let url = '/admin/problem/copy_killer?id=' + this.problem + '&'
        utils.downloadFile(url)
        this.loading = false
      },
      multiple_download () {
        let url = '/admin/problem/copy_killer?'
        for (let id in this.Checked) {
          url += 'id=' + this.data[id].id + '&'
        }
        utils.downloadFile(url)
        console.log(url)
      },
      handleChange (value, direction, movedKeys) {
        this.Checked = value
        console.log(value, direction, movedKeys)
      },
      searchProblem () {
        this.data = this.defaultData
        api.copy_killer(this.keyword, this.problem).then(res => {
          this.data = this.data.concat(res.data.data)
        }).catch(() => {
        })
      },
      handleClick (tab, event) {
        console.log(tab, event)
      }
    },
    watch: {
      'keyword' () {
      }
    }
  }
</script>

<style>
.el-transfer-panel {
  min-width: 200px;
  width: 500px;
}
.transfer-footer {
  margin-left: 20px;
  padding: 6px 5px;
}
</style>