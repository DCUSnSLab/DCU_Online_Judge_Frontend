<template>
<div>
    <Form ref="formRegister" :model="formRegister" :rules="ruleRegister" autocomplete="on">
      <FormItem prop="username">
        <Input type="text" v-model="formRegister.username" :placeholder="$t('아이디를 입력해주세요.')" size="large" @on-enter="handleRegister" name="username">
        <Icon type="ios-person-outline" slot="prepend"></Icon>
        </Input>
      </FormItem>
      <FormItem prop="realname">
        <Input type="text" v-model="formRegister.realname" :placeholder="$t('m.RegisterRealname')" size="large" @on-enter="handleRegister" name="name">
        <Icon type="ios-person-outline" slot="prepend"></Icon>
        </Input>
      </FormItem>
      <FormItem prop="email">
        <Input v-model="formRegister.email" :placeholder="$t('m.Email_Address')" size="large" @on-enter="handleRegister" name="email">
        <Icon type="ios-email-outline" slot="prepend"></Icon>
        </Input>
      </FormItem>
      <FormItem prop="password">
        <Input type="password" v-model="formRegister.password" :placeholder="$t('m.RegisterPassword')" size="large" @on-enter="handleRegister" autocomplete="off">
        <Icon type="ios-locked-outline" slot="prepend"></Icon>
        </Input>
      </FormItem>
      <FormItem prop="passwordAgain">
        <Input type="password" v-model="formRegister.passwordAgain" :placeholder="$t('m.Password_Again')" size="large" @on-enter="handleRegister" autocomplete="off">
        <Icon type="ios-locked-outline" slot="prepend"></Icon>
        </Input>
      </FormItem>
      <FormItem prop="schoolssn">
        <Input type="text" v-model="formRegister.schoolssn" :placeholder="$t('m.schoolssn')" size="large" @on-enter="handleRegister">
        <Icon type="ios-person-outline" slot="prepend"></Icon>
        </Input>
      </FormItem>
      <FormItem prop="schoolssnAgain">
        <Input type="text" v-model="formRegister.schoolssnAgain" :placeholder="$t('m.schoolssn_Again')" size="large" @on-enter="handleRegister">
        <Icon type="ios-person-outline" slot="prepend"></Icon>
        </Input>
      </FormItem>
      <FormItem prop="captcha" style="margin-bottom:10px">
        <div class="oj-captcha">
          <div class="oj-captcha-code">
            <Input v-model="formRegister.captcha" :placeholder="$t('m.Captcha')" size="large" @on-enter="handleRegister">
            <Icon type="ios-lightbulb-outline" slot="prepend"></Icon>
            </Input>
          </div>
          <div class="oj-captcha-img">
            <Tooltip content="클릭하여 새로고침" placement="top">
              <img :src="captchaSrc" @click="getCaptchaSrc"/>
            </Tooltip>
          </div>
        </div>
      </FormItem>
    </Form>
    <div class="footer">
      <Button
        type="primary"
        @click="handleRegister"
        class="btn" long
        :loading="btnRegisterLoading">
        {{$t('m.UserRegister')}}
      </Button>
      <Button
        type="ghost"
        @click="switchMode('login')"
        class="btn" long>
        {{$t('m.Already_Registed')}}
      </Button>
    </div>
  </div>
</template>

<script>
  import { mapGetters, mapActions } from 'vuex'
  import api from '@oj/api'
  import { FormMixin } from '@oj/components/mixins'

  export default {
    mixins: [FormMixin],
    mounted () {
      this.getCaptchaSrc()
    },
    data () {
      const CheckUsernameNotExist = (rule, value, callback) => {
        api.checkUsernameOrEmail(value, undefined, undefined).then(res => {
          if (res.data.data.username === true) {
            callback(new Error(this.$i18n.t('아이디가 이미 존재합니다.')))
          } else {
            callback()
          }
        }, _ => callback())
      }
      const CheckEmailNotExist = (rule, value, callback) => {
        api.checkUsernameOrEmail(undefined, value, undefined).then(res => {
          if (res.data.data.email === true) {
            callback(new Error(this.$i18n.t('이메일 주소가 이미 존재합니다.')))
          } else {
            callback()
          }
        }, _ => callback())
      }
      const CheckSchoolssnNotExist = (rule, value, callback) => {
        api.checkUsernameOrEmail(undefined, undefined, value).then(res => {
          if (this.formRegister.schoolssn.length < 5 || this.formRegister.schoolssn.length > 8) {
            callback(new Error(this.$i18n.t('학번/교직번호는 5자 이상, 8자 이하로 입력하세요.')))
          } else if (res.data.data.schoolssn === true) {
            callback(new Error(this.$i18n.t('학번/교직번호가 이미 입력되었습니다.')))
          } else {
            callback()
          }
        }, _ => callback())
      }
      const CheckPassword = (rule, value, callback) => {
        if (this.formRegister.password !== '') {
          // 对第二个密码框再次验证
          this.$refs.formRegister.validateField('passwordAgain')
        }
        callback()
      }
      const CheckAgainPassword = (rule, value, callback) => {
        if (value !== this.formRegister.password) {
          callback(new Error(this.$i18n.t('패스워드가 일치하지 않습니다.')))
        }
        callback()
      }
      const CheckAgainSchoolssn = (rule, value, callback) => {
        if (value !== this.formRegister.schoolssn) {
          callback(new Error(this.$i18n.t('학번이 일치하지 않습니다.')))
        }
        callback()
      }

      return {
        btnRegisterLoading: false,
        formRegister: {
          username: '',
          realname: '',
          password: '',
          passwordAgain: '',
          schoolssn: '',
          schoolssnAgain: '',
          email: '',
          captcha: ''
        },
        ruleRegister: {
          username: [
            {required: true, trigger: 'blur'},
            {validator: CheckUsernameNotExist, trigger: 'blur'}
          ],
          realname: [
            {required: true, trigger: 'blur'},
            {trigger: 'blur'}
          ],
          email: [
            {required: true, type: 'email', trigger: 'blur'},
            {validator: CheckEmailNotExist, trigger: 'blur'}
          ],
          password: [
            {required: true, trigger: 'blur', min: 6, max: 20},
            {validator: CheckPassword, trigger: 'blur'}
          ],
          passwordAgain: [
            {required: true, validator: CheckAgainPassword, trigger: 'change'}
          ],
          schoolssn: [
            {required: true, trigger: 'blur'},
            {validator: CheckSchoolssnNotExist, required: true, trigger: 'blur'}
          ],
          schoolssnAgain: [
            {required: true, validator: CheckAgainSchoolssn, trigger: 'blur'}
          ],
          captcha: [
            {required: true, trigger: 'blur', min: 1, max: 10}
          ]
        }
      }
    },
    methods: {
      ...mapActions(['changeModalStatus', 'getProfile']),
      switchMode (mode) {
        this.changeModalStatus({
          mode,
          visible: true
        })
      },
      handleRegister () {
        this.validateForm('formRegister').then(valid => {
          let formData = Object.assign({}, this.formRegister)
          console.log(formData)
          delete formData['passwordAgain']
          this.btnRegisterLoading = true
          api.register(formData).then(res => {
            this.$success(this.$i18n.t('가입해주셔서 감사합니다.'))
            this.switchMode('login')
            this.btnRegisterLoading = false
          }, _ => {
            this.getCaptchaSrc()
            this.formRegister.captcha = ''
            this.btnRegisterLoading = false
          })
        })
      }
    },
    computed: {
      ...mapGetters(['website', 'modalStatus'])

    }
  }
</script>

<style scoped lang="less">
  .footer {
    overflow: auto;
    margin-top: 20px;
    margin-bottom: -15px;
    text-align: left;
    .btn {
      margin: 0 0 15px 0;
      &:last-child {
        margin: 0;
      }
    }
  }
</style>
