<template>
  <div>
    <!-- Tabs Container -->
    <div class="tabs-container">
      <!-- Individual Tabs -->
      <div
        v-for="(containerURL, index) in multiContainer"
        :key="containerURL"
        :class="['tab', { active: editContainer === containerURL }]"
        @click="editContainer = containerURL"
      >
        <span>{{ 'DCU Shell ' + (index + 1) }}</span>
        <button class="close-btn" @click.stop="removeTab(containerURL)">×</button>
      </div>
      <button class="add-tab-btn" @click="addContainer">+</button>
    </div>
    
    <!-- Tab Content -->
    <!-- <div class="content">
      <iframe
        id="container"
        :name="editContainer"
        width="100%"
        height="800px"
        :src="editContainer"
        frameborder="0"
      ></iframe>
    </div> -->
    <div class="content">
      <div v-for="(containerURL, index) in multiContainer" :key="containerURL">
        <iframe
          v-show="editContainer === containerURL"
          :name="containerURL"
          width="100%"
          height="800px"
          :src="containerURL"
          frameborder="0"
        ></iframe>
      </div>
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
      sessionId: '',
      editContainer: null,
      input: []
    }
  },
  mounted () {
    this.init()
    this.addContainer()
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
      const hiddenIframe = document.createElement('iframe')
      hiddenIframe.style.display = 'none'
      hiddenIframe.name = 'hidden_iframe'
      document.body.appendChild(hiddenIframe)
      form.target = newContainerUrl
      this.addFormInput(form, 'username', 'dcucode-' + this.userData.id)
      this.addFormInput(form, 'userpassword', localStorage.getItem('access_token'))
      this.addFormInput(form, 'fontSize', '20')
      document.body.appendChild(form)
      form.submit()
      document.body.removeChild(form)
      setTimeout(() => document.body.removeChild(hiddenIframe), 1000)
    },
    addContainer () {
      const newContainerUrl = 'http://203.250.33.87:31647/ssh/host/container$' + this.containerCount
      // const newContainerUrl = 'http://localhost:2224/ssh/host/container$' + this.containerCount
      this.containerCount += 1
      this.multiContainer.push(newContainerUrl)
      this.editContainer = newContainerUrl // 새로 추가된 탭으로 활성화
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
        this.editContainer = this.multiContainer.length ? this.multiContainer[0] : null
      }
    }
  },
  computed: {
    ...mapGetters(['isAuthenticated', 'user'])
  }
}
</script>

<style scoped>
.tabs-container {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0;
  background-color: #1e1e1e;
  border-bottom: 1px solid #333;
  height: 35px; 
}

.tab {
  display: flex;
  align-items: center;
  background-color: #2d2d2d;
  color: #cccccc;
  padding: 6px 12px;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  cursor: pointer;
  position: relative;
  height: 100%;
  transition: background-color 0.2s, color 0.2s;
}

.tab.active {
  background-color: #1e1e1e;
  color: #ffffff;
  border-bottom: 2px solid #007acc;
}

.tab:hover {
  background-color: #3a3a3a;
}

.tab span {
  margin-right: 6px;
  font-size: 13px;
}

.close-btn {
  background: none;
  border: none;
  color: #888888;
  font-size: 12px;
  cursor: pointer;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #ffffff;
}

.add-tab-btn {
  background: none;
  color: #007acc;
  border: none;
  padding: 0;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  transition: color 0.2s;
}

.add-tab-btn:hover {
  color: #3399ff;
}

.content {
  margin-top: 0;
  background-color: #1e1e1e;
}
</style>
