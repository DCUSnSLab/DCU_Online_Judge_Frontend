<template>
  <panel>
    <iframe
      id="webssh"
      name="webssh"
      width="100%"
      height="800px"
      src="http://localhost:2222/ssh/host/127.0.0.1"
      frameborder="0"
      allowfullscreen
    ></iframe>
  </panel>
</template>

<script>
export default {
  name: 'Terminal',
  methods: {
    submitForm () {
    }
  }
}
</script>

<style lang="less" scoped>
</style>
