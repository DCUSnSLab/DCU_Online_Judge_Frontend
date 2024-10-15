<template>
  <div>
    <!-- <Card :padding="20" id="Terminal" dis-hover class="terminal-card">
      <div class="form-container" v-if="!passwordEntered">
        <label for="passwordInput">Password: </label>
        <input type="password" v-model="password" id="passwordInput" />
        <button @click="setPassword">Connect</button>
      </div>
      <div class="form-container" v-else>
        <button @click="resetPassword">PWreset</button>
        <button @click="addContainer">addContainer</button>
        <button @click="debug">debug</button>
      </div>
    </Card> -->
    <div>
      <el-tabs
        v-model="editConainer"
        type="border-card"
        editable
        @tab-remove="removeTab"
        @tab-add="addContainer"
      >
        <el-tab-pane 
          v-for="(containerURL, index) of multiContainer"
          :key="containerURL"
          :label="'container '+(index+1)"
          :name="containerURL"
        >
          <div class="iframe-container">
            <iframe
              id="container"
              :name="containerURL"
              width="100%"
              height="800px"
              :src="containerURL"
              frameborder="0"
              allowfullscreen
            ></iframe>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import api from '@oj/api'

export default {
  name: 'Container',
  data () {
    return {
      userData: {
        id: '',
        password: ''
      },
      multiContainer: [],
      passwordEntered: false,
      containerCount: 0,
      sessionId: ''
    }
  },
  mounted () {
    this.init()
  },
  methods: {
    init () {
      if (!this.isAuthenticated) {
        this.$error(this.$i18n.t('m.Please_login_first'))
        this.$router.push({ name: 'Home' })
      }
      api.getUserInfo().then(res => {
        this.userData.id = res.data.data.user.username
      })
    },
    addFormInput (form, name, value) {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = name
      input.value = value
      form.appendChild(input)
    },
    debug () {
    },
    settingNewContainer (newContainerUrl) {
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = newContainerUrl
      form.target = newContainerUrl
      this.addFormInput(form, 'username', 'jwt' + this.userData.id)
      this.addFormInput(form, 'userpassword', localStorage.getItem('access_token'))
      this.addFormInput(form, 'fontSize', '20')
      document.body.appendChild(form)
      form.submit()
      document.body.removeChild(form)
    },
    addContainer () {
      const newContainerUrl = 'http://203.250.33.87:31647/ssh/host/container$' + this.containerCount
      // const newContainerUrl = 'http://localhost:2224/ssh/host/container$' + this.containerCount // develop
      this.containerCount = this.containerCount + 1
      this.multiContainer.push(newContainerUrl)
      const refreshToken = localStorage.getItem('refresh_token')
      let data = {
        refresh_token: refreshToken
      }
      api.tokenRefresh(data).then(res => {
        localStorage.setItem('access_token', res.data.data.access_token)
      })
      this.$nextTick(() => {
        this.settingNewContainer(newContainerUrl)
      })
    },
    setPassword () {
      this.userData.password = this.password
      this.password = ''
      this.passwordEntered = true
    },
    resetPassword () {
      this.passwordEntered = false
    },
    removeTab (targetName) {
      this.multiContainer = this.multiContainer.filter(multiContainer => multiContainer !== targetName)
      if (this.editContainer === targetName) {
        this.editContainer = this.tabs.length ? this.tabs[0].name : ''
      }
    }
  },
  computed: {
    ...mapGetters(['isAuthenticated', 'user'])
  }
}
</script>

<style lang="less" scoped>
.terminal-card {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
}
.form-container {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
