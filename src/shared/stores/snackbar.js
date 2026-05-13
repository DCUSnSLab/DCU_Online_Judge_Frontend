import { defineStore } from 'pinia'
import { ref } from 'vue'

let seq = 0

export const useSnackbarStore = defineStore('snackbar', () => {
  const items = ref([])

  function push(message, { color = 'info', timeout = 3000 } = {}) {
    const id = ++seq
    items.value.push({ id, message, color, timeout, visible: true })
    if (timeout > 0) {
      setTimeout(() => dismiss(id), timeout)
    }
    return id
  }

  function dismiss(id) {
    items.value = items.value.filter((it) => it.id !== id)
  }

  return {
    items,
    push,
    dismiss,
    success: (m, o) => push(m, { color: 'success', ...o }),
    info: (m, o) => push(m, { color: 'info', ...o }),
    warning: (m, o) => push(m, { color: 'warning', ...o }),
    error: (m, o) => push(m, { color: 'error', ...o })
  }
})
