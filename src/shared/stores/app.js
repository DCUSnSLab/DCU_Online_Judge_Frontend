import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const themeMode = ref(localStorage.getItem('app.theme') || 'light')
  const isLoading = ref(false)

  function setTheme(mode) {
    themeMode.value = mode
    localStorage.setItem('app.theme', mode)
  }

  function toggleTheme() {
    setTheme(themeMode.value === 'light' ? 'dark' : 'light')
  }

  return { themeMode, isLoading, setTheme, toggleTheme }
})
