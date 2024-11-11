<template>
  <Card :padding="padding" :shadow="shadow" :dis-hover="disHover" :bordered="bordered" :style="{ backgroundColor: 'var(--panelBackground)', borderColor: 'var(--panel-border-color)' }">
    <div slot="title" class="panel-title" >
      <slot name="title"></slot>
    </div>
    <div slot="extra" class="panel-extra" :style="currentTheme">
      <slot name="extra"></slot>
    </div>
    <div class="panel-body">
      <slot></slot>
    </div>
  </Card>
</template>

<script>
  import { mapState } from 'vuex'
  import { lightTheme, darkTheme } from '@/theme'

  export default {
    name: 'Panel',
    props: {
      shadow: {
        required: false,
        type: Boolean,
        default: false
      },
      padding: {
        required: false,
        type: Number,
        default: 0
      },
      disHover: {
        required: false,
        type: Boolean,
        default: false
      },
      bordered: {
        required: false,
        type: Boolean,
        default: true
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

<style lang="less">
  @import (reference) '../../../styles/common.less';

  .panel-title {
    .section-title;
    padding: 5px 15px;
  }

  .panel-extra {
    line-height: 40px;
    .ivu-input-wrapper:hover .ivu-input {
      border: 1px solid var(--search-box-hovor-color);
    }    
    .ivu-input {
      background-color: var(--search-box-color); 
      border: 1px solid var(--search-box-border-color);
      color: var(--text-color); 
    }
    .ivu-input-icon {
      line-height: 40px;
    }
    ul.filter {
      > li {
        display: inline-block;
        padding: 0 10px;
      }
    }
  }
  .panel-body {
    word-break: break-all;
    word-wrap: break-word;
  }
</style>