<!-- src/pages/oj/components/ThemeToggle.vue -->
<template>
  <div class="theme-toggle">
    <el-switch
    v-model="isDarkMode"
    active-text="Dark"
    inactive-text="Light"
    @change="toggleDarkMode"
    ></el-switch>
  </div>
</template>
  
<script>
  import { mapState, mapMutations } from 'vuex'
  import { lightTheme, darkTheme } from '@/theme'

  export default {
    computed: {
      ...mapState('theme', ['isDarkMode'])
    },
    methods: {
      ...mapMutations('theme', ['toggleTheme']),
      toggleDarkMode () {
        this.toggleTheme()
      }
    }
  }
</script>

<style scoped>
  .theme-toggle {
    margin-right: 15px;
    margin-top: 15px;
  }
</style>
