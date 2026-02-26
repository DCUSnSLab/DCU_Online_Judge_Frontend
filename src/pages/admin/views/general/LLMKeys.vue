<template>
  <div class="view">
    <Panel :title="$t('m.LLM_Gateway_Config')">
      <el-form inline>
        <el-form-item :label="$t('m.LLM_Gateway_Default_Model')">
          <el-input v-model="gatewayForm.default_model" style="width: 320px"/>
        </el-form-item>
        <el-form-item :label="$t('m.LLM_Gateway_API_Key')">
          <el-input
            v-model="gatewayForm.api_key"
            type="password"
            show-password
            :placeholder="$t('m.LLM_Gateway_API_Key_Placeholder')"
            style="width: 420px"/>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="gatewaySaving" @click="saveGatewayConfig">{{ $t('m.LLM_Save') }}</el-button>
        </el-form-item>
      </el-form>
      <div v-if="gatewayMeta.api_key_configured" style="font-size: 12px; color: #606266; margin-top: 8px;">
        {{ $t('m.LLM_Gateway_API_Key_Current') }}: {{ gatewayMeta.api_key_preview }}
      </div>
    </Panel>

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
        <el-table-column prop="total_requests" :label="$t('m.LLM_Total_Requests')" min-width="130"/>
        <el-table-column prop="total_prompt_tokens" :label="$t('m.LLM_Total_Prompt_Tokens')" min-width="160"/>
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
          :current-page.sync="keyPage"
          :total="total"
          @current-change="loadKeys"/>
      </div>
    </Panel>

    <Panel :title="$t('m.LLM_Route_Create')">
      <el-form inline>
        <el-form-item :label="$t('m.LLM_Model_Name')">
          <el-input v-model="routeForm.model_name" style="width: 260px"/>
        </el-form-item>
        <el-form-item :label="$t('m.LLM_Upstream_URL')">
          <el-input v-model="routeForm.upstream_url" style="width: 420px"/>
        </el-form-item>
        <el-form-item :label="$t('m.LLM_Priority')">
          <el-input-number v-model="routeForm.priority" :min="0" :step="1"/>
        </el-form-item>
        <el-form-item :label="$t('m.LLM_Weight')">
          <el-input-number v-model="routeForm.weight" :min="0" :step="1"/>
        </el-form-item>
        <el-form-item :label="$t('m.LLM_Enabled')">
          <el-switch v-model="routeForm.enabled"/>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveRoute" :loading="routeSaving">{{ $t('m.LLM_Save') }}</el-button>
          <el-button v-if="routeForm.id" @click="resetRouteForm">{{ $t('m.LLM_Cancel') }}</el-button>
        </el-form-item>
      </el-form>
    </Panel>

    <Panel :title="$t('m.LLM_Route_List')">
      <el-table :data="routeRows" v-loading="routeLoading">
        <el-table-column prop="model_name" :label="$t('m.LLM_Model_Name')" min-width="220"/>
        <el-table-column prop="upstream_url" :label="$t('m.LLM_Upstream_URL')" min-width="380"/>
        <el-table-column prop="priority" :label="$t('m.LLM_Priority')" width="120"/>
        <el-table-column prop="weight" :label="$t('m.LLM_Weight')" width="120"/>
        <el-table-column :label="$t('m.LLM_Enabled')" width="120">
          <template slot-scope="scope">
            <el-tag :type="scope.row.enabled ? 'success' : 'info'">
              {{ scope.row.enabled ? $t('m.LLM_Enabled_On') : $t('m.LLM_Enabled_Off') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('m.User_Options')" width="200">
          <template slot-scope="scope">
            <el-button size="mini" @click="startEditRoute(scope.row)">{{ $t('m.User_Options_Edit') }}</el-button>
            <el-button size="mini" type="danger" @click="deleteRoute(scope.row.id)">{{ $t('m.User_Options_Delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="panel-options">
        <el-pagination
          class="page"
          layout="prev, pager, next"
          :page-size="routeLimit"
          :current-page.sync="routePage"
          :total="routeTotal"
          @current-change="loadRoutes"/>
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
      keyPage: 1,
      limit: 10,
      total: 0,
      rows: [],
      createdRawKey: '',
      createForm: {
        name: '',
        models: '*'
      },
      gatewaySaving: false,
      gatewayMeta: {
        api_key_configured: false,
        api_key_preview: ''
      },
      gatewayForm: {
        default_model: '',
        api_key: ''
      },
      routeLoading: false,
      routeSaving: false,
      routePage: 1,
      routeLimit: 10,
      routeTotal: 0,
      routeRows: [],
      routeForm: {
        id: null,
        model_name: '',
        upstream_url: '',
        priority: 100,
        weight: 100,
        enabled: true
      }
    }
  },
  mounted () {
    this.loadGatewayConfig()
    this.loadKeys(1)
    this.loadRoutes(1)
  },
  methods: {
    async loadGatewayConfig () {
      const res = await api.getLLMGatewayConfig()
      const data = res.data.data || {}
      this.gatewayMeta = {
        api_key_configured: !!data.api_key_configured,
        api_key_preview: data.api_key_preview || ''
      }
      this.gatewayForm.default_model = data.default_model || ''
      this.gatewayForm.api_key = ''
    },
    async saveGatewayConfig () {
      const defaultModel = this.gatewayForm.default_model.trim()
      if (!defaultModel) {
        this.$error(this.$t('m.LLM_Model_Name_Required'))
        return
      }

      const payload = {
        default_model: defaultModel
      }
      const apiKey = this.gatewayForm.api_key.trim()
      if (apiKey) {
        payload.api_key = apiKey
      }

      this.gatewaySaving = true
      try {
        await api.saveLLMGatewayConfig(payload)
        await this.loadGatewayConfig()
      } finally {
        this.gatewaySaving = false
      }
    },
    async loadKeys (page) {
      this.keyPage = page
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
      await this.loadKeys(this.keyPage)
    },
    async loadRoutes (page) {
      this.routePage = page
      this.routeLoading = true
      try {
        const offset = (page - 1) * this.routeLimit
        const res = await api.getLLMRouteList(offset, this.routeLimit)
        this.routeRows = res.data.data.results
        this.routeTotal = res.data.data.total
      } finally {
        this.routeLoading = false
      }
    },
    resetRouteForm () {
      this.routeForm = {
        id: null,
        model_name: '',
        upstream_url: '',
        priority: 100,
        weight: 100,
        enabled: true
      }
    },
    startEditRoute (row) {
      this.routeForm = {
        id: row.id,
        model_name: row.model_name,
        upstream_url: row.upstream_url,
        priority: row.priority,
        weight: row.weight,
        enabled: row.enabled
      }
    },
    async saveRoute () {
      const modelName = this.routeForm.model_name.trim()
      const upstreamURL = this.routeForm.upstream_url.trim()
      if (!modelName) {
        this.$error(this.$t('m.LLM_Model_Name_Required'))
        return
      }
      if (!upstreamURL) {
        this.$error(this.$t('m.LLM_Upstream_Required'))
        return
      }

      const payload = {
        model_name: modelName,
        upstream_url: upstreamURL,
        priority: this.routeForm.priority,
        weight: this.routeForm.weight,
        enabled: this.routeForm.enabled
      }

      this.routeSaving = true
      try {
        if (this.routeForm.id) {
          await api.updateLLMRoute(Object.assign({id: this.routeForm.id}, payload))
          await this.loadRoutes(this.routePage)
        } else {
          await api.createLLMRoute(payload)
          await this.loadRoutes(1)
        }
        this.resetRouteForm()
      } finally {
        this.routeSaving = false
      }
    },
    async deleteRoute (id) {
      await api.deleteLLMRoute(id)
      await this.loadRoutes(this.routePage)
    }
  }
}
</script>
