// src/store/modules/theme.js
const state = {
  isDarkMode: JSON.parse(localStorage.getItem('isDarkMode')) || false
}
const mutations = {
  toggleTheme (state) {
    state.isDarkMode = !state.isDarkMode
    localStorage.setItem('isDarkMode', JSON.stringify(state.isDarkMode))
  }
}
export default {
  namespaced: true,
  state,
  mutations
}
