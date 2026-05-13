import 'vuetify/styles'
import '@/styles/tokens.scss'
import '@/styles/utilities.scss'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'

// Paper (light) — values mirror tokens.scss
const paper = {
  dark: false,
  colors: {
    background: '#FAFAF7',
    surface: '#FFFFFF',
    'surface-bright': '#FFFFFF',
    'surface-variant': '#F4F3EE',
    'on-surface-variant': '#4A4A48',
    primary: '#3D52D5', // oklch(0.52 0.18 264) approx in sRGB
    'primary-darken-1': '#2F40B0',
    secondary: '#4A4A48',
    accent: '#3D52D5',
    error: '#C8403B', // status-wa
    info: '#3676CC', // status-judging
    success: '#3F9F5E', // status-ac
    warning: '#C68A2E' // status-tle/mle
  },
  variables: {
    'border-color': '#E8E6DF',
    'border-opacity': 1,
    'medium-emphasis-opacity': 0.74,
    'disabled-opacity': 0.5
  }
}

// Carbon (dark)
const carbon = {
  dark: true,
  colors: {
    background: '#131316',
    surface: '#1A1A1E',
    'surface-bright': '#22222A',
    'surface-variant': '#0E0E11',
    'on-surface-variant': '#B8B8B2',
    primary: '#7E8FE9',
    'primary-darken-1': '#5E6FC9',
    secondary: '#B8B8B2',
    accent: '#7E8FE9',
    error: '#E26A65',
    info: '#5E92E0',
    success: '#62B783',
    warning: '#D9A24F'
  },
  variables: {
    'border-color': '#2A2A30',
    'border-opacity': 1,
    'medium-emphasis-opacity': 0.7,
    'disabled-opacity': 0.45
  }
}

export function createAppVuetify() {
  return createVuetify({
    theme: {
      defaultTheme: 'paper',
      themes: { paper, carbon }
    },
    icons: {
      defaultSet: 'mdi',
      aliases,
      sets: { mdi }
    },
    defaults: {
      VBtn: { variant: 'flat', rounded: 'md' },
      VCard: { rounded: 'md', flat: true, border: 'thin' },
      VTextField: { variant: 'outlined', density: 'comfortable' },
      VSelect: { variant: 'outlined', density: 'comfortable' },
      VTextarea: { variant: 'outlined', density: 'comfortable' },
      VTable: { density: 'comfortable' }
    }
  })
}

/** Map a `light` / `dark` mode value to one of our Vuetify theme names. */
export function themeNameFor(mode) {
  return mode === 'dark' ? 'carbon' : 'paper'
}

/** Sync the `data-theme` attribute on <html> so CSS variables in tokens.scss flip. */
export function applyHtmlTheme(mode) {
  if (typeof document === 'undefined') return
  if (mode === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}
