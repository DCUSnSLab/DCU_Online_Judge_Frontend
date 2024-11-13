<template>
  <li @click.stop="handleClick" :class="{disabled: disabled}" :style="currentTheme">
    <slot></slot>
  </li>
</template>

<script>
  import Emitter from '../mixins/emitter'
  import { mapState } from 'vuex'
  import { lightTheme, darkTheme } from '@/theme'

  export default {
    name: 'VerticalMenu-item',
    mixins: [Emitter],
    props: {
      route: {
        type: [String, Object]
      },
      disabled: {
        type: Boolean,
        default: false
      }
    },
    methods: {
      handleClick () {
        if (this.route) {
          this.dispatch('VerticalMenu', 'on-click', this.route)
        }
      }
    },
    computed: {
      ...mapState('theme', ['isDarkMode']),
      currentTheme () {
        return this.isDarkMode ? darkTheme : lightTheme
      }
    }
  }
</script>

<style scoped lang="less">
  .disabled {
    /*background-color: #ccc;*/
    opacity: 1;
    /*cursor: not-allowed;*/
    pointer-events: none;
    color: #ccc;
    &:hover {
      border-left: none;
      color: #ccc;
      background: #fff;
    }
  }

  li {
    border-bottom: 1px dashed var(--list-border-bottom);
    color: var(--verticalMenu-item-color);
    display: block;
    text-align: left;
    padding: 15px 20px;
    background-color: var(--verticalMenu-item-backgound);
    &:hover {
      background: var(--vertivalMenu-item-hover-color);
      border-left: 2px solid var(--text-hover-color);
      color: var(--text-hover-color);
    }
    & > .ivu-icon {
      font-size: 16px;
      margin-right: 8px;
    }
    &:last-child {
      border-bottom: none;
    }
  }
</style>
