<template>
  <div class="view">
    <Panel :title="$t('m.LLM_Key_Create')">
      <el-form inline>
        <el-form-item :label="$t('m.LLM_Name')">
          <el-input v-model="createForm.name" style="width: 280px"/>
        </el-form-item>
        <el-form-item :label="$t('m.LLM_Model_Scope')">
          <el-input
            v-model="createForm.models"
            style="width: 360px"
            :placeholder="$t('m.LLM_Model_Scope_Placeholder')"/>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="createKey" :loading="creating">{{ $t('m.LLM_Create') }}</el-button>
        </el-form-item>
      </el-form>

      <el-alert
        v-if="createdRawKey"
        :title="$t('m.LLM_Key_One_Time')"
        type="warning"
        :closable="false"
        show-icon>
      </el-alert>
      <el-input
        v-if="createdRawKey"
        v-model="createdRawKey"
        readonly
        style="margin-top: 10px;"
      />
    </Panel>

    <Panel :title="$t('m.LLM_Key_List')">
      <el-table :data="rows" v-loading="loading">
        <el-table-column prop="name" :label="$t('m.LLM_Name')" min-width="160"/>
        <el-table-column prop="key_prefix" :label="$t('m.LLM_Key_Prefix')" min-width="150"/>
        <el-table-column prop="status" :label="$t('m.LLM_Status')" min-width="100"/>
        <el-table-column prop="created_by.username" :label="$t('m.User_Username')" min-width="140"/>
        <el-table-column prop="created_at" :label="$t('m.Create_Time')" min-width="180">
          <template slot-scope="scope">{{ scope.row.created_at | localtime }}</template>
        </el-table-column>
        <el-table-column :label="$t('m.User_Options')" width="160">
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="danger"
              :disabled="scope.row.status !== 'active'"
              @click="revokeKey(scope.row.id)">
              {{ $t('m.Revoke') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="panel-options">
        <el-pagination
          class="page"
          layout="prev, pager, next"
          :page-size="limit"
          :current-page.sync="page"
          :total="total"
          @current-change="loadKeys"/>
      </div>
    </Panel>
  </div>
</template>

<script>
import api from '@admin/api'

export default {
  name: 'LLMKeys',
  data () {
    return {
      loading: false,
      creating: false,
      page: 1,
      limit: 10,
      total: 0,
      rows: [],
      createdRawKey: '',
      createForm: {
        name: '',
        models: '*'
      }
    }
  },
  mounted () {
    this.loadKeys(1)
  },
  methods: {
    async loadKeys (page) {
      this.page = page
      this.loading = true
      try {
        const offset = (page - 1) * this.limit
        const res = await api.getLLMKeyList(offset, this.limit)
        this.rows = res.data.data.results
        this.total = res.data.data.total
      } finally {
        this.loading = false
      }
    },
    async createKey () {
      const name = this.createForm.name.trim()
      if (!name) {
        this.$error(this.$t('m.LLM_Name_Required'))
        return
      }

      this.creating = true
      try {
        const models = this.createForm.models.split(',').map(x => x.trim()).filter(Boolean)
        const res = await api.createLLMKey({
          name,
          scope: {
            models: models.length ? models : ['*']
          }
        })
        this.createdRawKey = res.data.data.key
        this.createForm.name = ''
        await this.loadKeys(1)
      } finally {
        this.creating = false
      }
    },
    async revokeKey (id) {
      await api.revokeLLMKey(id)
      await this.loadKeys(this.page)
    }
  }
}
</script>
