<template>
  <div>
    <Form ref="formRegister" :model="formRegister" :rules="ruleRegister">
      <FormItem prop="username">
        <Input type="text" v-model="formRegister.username" :placeholder="$t('아이디를 입력해주세요.')" size="large" @on-enter="handleRegister">
          <Icon type="ios-person-outline" slot="prepend"></Icon>
        </Input>
      </FormItem>
      <FormItem prop="realname">
        <Input type="text" v-model="formRegister.realname" :placeholder="$t('m.RegisterRealname')" size="large" @on-enter="handleRegister">
          <Icon type="ios-person-outline" slot="prepend"></Icon>
        </Input>
      </FormItem>
      <FormItem prop="email">
        <Input v-model="formRegister.email" :placeholder="$t('m.Email_Address')" size="large" @on-enter="handleRegister">
          <Icon type="ios-email-outline" slot="prepend"></Icon>
        </Input>
      </FormItem>
      <FormItem prop="password">
        <Input type="password" v-model="formRegister.password" :placeholder="$t('m.RegisterPassword')" size="large" @on-enter="handleRegister">
          <Icon type="ios-locked-outline" slot="prepend"></Icon>
        </Input>
      </FormItem>
      <FormItem prop="passwordAgain">
        <Input type="password" v-model="formRegister.passwordAgain" :placeholder="$t('m.Password_Again')" size="large" @on-enter="handleRegister">
          <Icon type="ios-locked-outline" slot="prepend"></Icon>
        </Input>
      </FormItem>
      <FormItem prop="phonenum">
        <Input type="text" v-model="formRegister.phonenum" :placeholder="$t('m.Phonenum')" size="large" @on-enter="handleRegister">
          <Icon type="ios-person-outline" slot="prepend"></Icon>
        </Input>
      </FormItem>
      <FormItem prop="phonenumAgain">
        <Input type="text" v-model="formRegister.phonenumAgain" :placeholder="$t('m.Phonenum_Again')" size="large" @on-enter="handleRegister">
          <Icon type="ios-person-outline" slot="prepend"></Icon>
        </Input>
      </FormItem>
      <FormItem prop="affiliation">
        <Input type="text" v-model="formRegister.affiliation" :placeholder="$t('m.Affiliation')" size="large" @on-enter="handleRegister">
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
    const CheckPhonenumNotExist = (rule, value, callback) => {
      api.checkPhonenum(undefined, undefined, value).then(res => {
        if (this.formRegister.phonenum.length !== 11) {
          callback(new Error(this.$i18n.t('전화번호는 11자리로 입력하세요.')))
        } else if (res.data.data.phonenum === true) {
          callback(new Error(this.$i18n.t('전화번호가 이미 존재합니다.')))
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
    const CheckAgainPhonenum = (rule, value, callback) => {
      if (value !== this.formRegister.phonenum) {
        callback(new Error(this.$i18n.t('전화번호가 일치하지 않습니다.')))
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
        phonenum: '',
        phonenumAgain: '',
        email: '',
        captcha: '',
        affiliation: ''
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
        phonenum: [
          {required: true, trigger: 'blur'},
          {validator: CheckPhonenumNotExist, required: true, trigger: 'blur'}
        ],
        phonenumAgain: [
          {required: true, validator: CheckAgainPhonenum, trigger: 'change'}
        ],
        affiliation: [
          {required: true, trigger: 'blur'},
          {trigger: 'blur'}
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
