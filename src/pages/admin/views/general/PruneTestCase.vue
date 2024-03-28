<template>
  <div>
    <panel>
      <span slot="title">{{$t('m.Test_Case_Prune_Test_Case')}}
        <el-popover placement="right" trigger="hover">
         이 테스트 케이스는 어떤 문제도 소유하지 않으므로 안전하게 제거할 수 있습니다.
         <!-- These test cases are not owned by any problem, you can clean them safely. -->
          <i slot="reference" class="el-icon-fa-question-circle import-user-icon"></i>
        </el-popover>
      </span>
      <el-table :data="data">
        <el-table-column
          label="마지막 수정">
          <template slot-scope="{row}">
            {{row.create_time | timestampFormat }}
          </template>
        </el-table-column>
        <el-table-column
          prop="id"
          label="테스트 케이스 ID">
        </el-table-column>
        <el-table-column
          label="옵션"
          fixed="right"
          width="200">
          <template slot-scope="{row}">
            <icon-btn name="삭제" icon="trash" @click.native="deleteTestCase(row.id)"></icon-btn>
          </template>
        </el-table-column>
      </el-table>
      <div class="panel-options" v-show="data.length > 0">
        <el-button type="warning" size="small"
                   :loading="loading"
                   icon="el-icon-fa-trash"
                   @click="deleteTestCase()">모두 삭제
        </el-button>
      </div>
    </panel>
  </div>
</template>

<script>
  import api from '@admin/api'
  import moment from 'moment'

  export default {
    name: 'prune-test-case',
    data () {
      return {
        data: [],
        loading: false
      }
    },
    mounted () {
      this.init()
    },
    methods: {
      init () {
        api.getInvalidTestCaseList().then(resp => {
          this.data = resp.data.data
        }, () => {
        })
      },
      deleteTestCase (id) {
        if (!id) {
          this.loading = true
        }
        api.pruneTestCase(id).then(resp => {
          this.loading = false
          this.init()
        })
      }
    },
    filters: {
      timestampFormat (value) {
        return moment.unix(value).format('YYYY-M-D  HH:mm:ss')
      }
    }
  }
</script>

<style>

</style>
