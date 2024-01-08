import Vue from 'vue'
import VueI18n from 'vue-i18n'

Vue.use(VueI18n)

const languages = [
  {value: 'en-US', label: 'English'},
  {value: 'zh-CN', label: '简体中文'},
  {value: 'zh-TW', label: '繁體中文'},
  {value: 'ko-KR', label: '한국어'}
]
const messages = {}

// combine admin and oj
for (let lang of languages) {
  let locale = lang.value
  let m = require(`./oj/${locale}`).m
  Object.assign(m, require(`./admin/${locale}`).m)
  messages[locale] = {m: m}
}
// load language packages
export default new VueI18n({
  locale: 'en-US',
  fallbackLocale: 'ko-KR', // 지정한 언어에 번역이 없을 때 보여줄 언어
  messages: messages
})

export {languages}
