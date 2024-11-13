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
    // color: #ff0000;
    color: var(--text-color);
  }

  .panel-extra {
    // color: #ff0000;
    color: var(--text-color); 
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
    // color: #ff0000;
    color: var(--text-color);
    word-break: break-all;
    word-wrap: break-word;
  }
  
  // 테이블 색상
  .ivu-table{
    color: var(--table-text-color);
    border: 1px solid var(--table-border-color);
    box-shadow: none !important;
  }
  .ivu-table th {
    background: var(--table-head-backgound);
    color: var(--table-text-color);
    border-color: var(--table-border-color) !important;
    padding: 0 !important; /* 내부 여백 제거 */
    margin: 0 !important;
  }

  .ivu-table td {
    background: var(--table-body-background);
    color: var(--table-text-color);
    border-color: var(--table-border-color) !important;
    padding: 0 !important; /* 내부 여백 제거 */
    margin: 0 !important;
    .ivu-btn-text {
      color: var(--table-text-color);
    }
    .ivu-btn-text:hover {
      color: var(--text-hover-color);
    }
  }
  // .ivu-table-row:hover td {
  //   background: var(--vertivalMenu-item-hover-color) !important;
  //   color: var(--text-hover-color) !important;
  // }
  .ivu-table::before {
    background-color: transparent !important;
    border: none !important;
    box-shadow: none !important;
  }
  .ivu-table::after {
    background-color: transparent !important;
    border: none !important;
    box-shadow: none !important;
  }

  .ivu-card-bordered {
    border: none !important;
  }
</style>