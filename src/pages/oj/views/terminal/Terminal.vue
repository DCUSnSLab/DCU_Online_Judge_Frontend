<template>
  <Card :padding="20" id="Terminal" dis-hover class="terminal-card">
    <div>
      <label for="passwordInput">Password: </label>
      <input type="password" v-model="password" id="passwordInput" />
    </div>
    <button @click="submitForm">Connect</button>
    <iframe
      id="webssh"
      name="webssh"
      width="100%"
      height="800px"
      src=""
      frameborder="0"
      allowfullscreen
    ></iframe>
  </Card>
</template>

<script>
import { mapGetters } from 'vuex'
import api from '@oj/api'

export default {
  name: 'Terminal',
  data () {
    return {
      userData: {
        id: '',
        password: ''
      }
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
      this.userData.id = 'dcucodetest'
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
    submitForm () {
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = 'http://localhost:2224/ssh/host'
      form.target = 'webssh'

      this.addFormInput(form, 'username', this.userData.id)
      this.addFormInput(form, 'userpassword', this.password)
      this.addFormInput(form, 'fontSize', '20')

      document.body.appendChild(form)
      form.submit()

      document.body.removeChild(form)
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
</style>
