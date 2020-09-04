<template>
  <Panel id="contest-card" shadow>
    <span>LectureID : {{ this.LectureID}} in test page</span>
  </Panel>
</template>

<script>
  export default {
    name: 'lecture-submission-list',
    components: {},
    data () {
      return {
        LectureID: ''
      }
    },
    mounted () {
      this.init()
    },
    methods: {
      init () {
        this.LectureID = this.$route.params.lectureID
      }
    },
    computed: {
    },
    watch: {
    }
  }
</script>