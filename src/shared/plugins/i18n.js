import { createI18n } from 'vue-i18n'
import ko from '@/i18n/ko'
import en from '@/i18n/en'

const STORAGE_KEY = 'app.locale'

function detectLocale() {
  const saved = typeof window !== 'undefined' && window.localStorage?.getItem(STORAGE_KEY)
  if (saved) return saved
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'ko'
  return nav.startsWith('ko') ? 'ko' : 'en'
}

export function createAppI18n() {
  return createI18n({
    legacy: false,
    locale: detectLocale(),
    fallbackLocale: 'en',
    messages: { ko, en }
  })
}

export function setLocale(i18n, locale) {
  i18n.global.locale.value = locale
  if (typeof window !== 'undefined') {
    window.localStorage?.setItem(STORAGE_KEY, locale)
  }
}
