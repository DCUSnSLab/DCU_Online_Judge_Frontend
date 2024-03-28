<template>
  <Row type="flex" :gutter="18">
    <Col :span=28>
    <Panel shadow>
      <Table style="width: 100%; font-size: 16px;"
             :columns="problemTableColumns"
             :data="problemList"
             :loading="loadings.table"
             disabled-hover></Table>
    </Panel>


    </Col>


  </Row>
</template>

<script>
  import { mapGetters } from 'vuex'
  import api from '@oj/api'
  import utils from '@/utils/utils'
  import { ProblemMixin } from '@oj/components/mixins'

  export default {
    name: 'ProblemList',
    mixins: [ProblemMixin],
    data () {
      return {
        tagList: [],
        problemTableColumns: [
          {
            title: 'id',
            key: 'id'
          },
          {
            title: 'title',
            key: 'title'
          },
          {
            title: 'description',
            key: 'description'
          },
          {
            title: 'input_description',
            key: 'input_description'
          },
          {
            title: 'output_description',
            key: 'output_description'
          },
          {
            title: 'teset_case_id',
            key: 'test_case_id'
          },
          {
            title: 'hint',
            key: 'hint'
          },
          {
            title: 'create_time',
            key: 'create_time'
          },
          {
            title: 'last_update_time',
            key: 'last_update_time'
          },
          {
            title: 'time_limit',
            key: 'time_limit'
          },
          {
            title: 'memory_limit',
            key: 'memory_limit'
          },
          {
            title: 'spj',
            key: 'spj'
          },
          {
            title: 'rule_type',
            key: 'rule_type'
          },
          {
            title: 'visible',
            key: 'visible'
          },
          {
            title: 'difficulty',
            key: 'difficulty'
          },
          {
            title: 'source',
            key: 'source'
          },
          {
            title: 'submission_number',
            key: 'submission_number'
          },
          {
            title: 'accepted_number',
            key: 'accepted_number'
          },
          {
            title: 'created_by_id',
            key: 'created_by_id'
          },
          {
            title: '_id',
            key: '_id'
          },
          {
            title: 'total_score',
            key: 'total_score'
          },
          {
            title: 'contest_id',
            key: 'contest_id'
          },
          {
            title: 'is_public',
            key: 'is_public'
          },
          {
            title: 'io_mode',
            key: 'io_mode'
          },
          {
            title: 'share_submission',
            key: 'share_submission'
          }
        ],
        problemList: [],
        limit: 20,
        total: 0,
        loadings: {
          table: true,
          tag: true
        },
        routeName: '',
        query: {
          keyword: '',
          difficulty: '',
          tag: '',
          page: 1
        }
      }
    },
    mounted () {
      this.init()
    },
    methods: {
      init (simulate = false) {
        this.routeName = this.$route.name
        let query = this.$route.query
        this.query.difficulty = query.difficulty || ''
        this.query.keyword = query.keyword || ''
        this.query.tag = query.tag || ''
        this.query.page = parseInt(query.page) || 1
        if (this.query.page < 1) {
          this.query.page = 1
        }
        if (!simulate) {
          this.getTagList()
        }
        this.getProblemList()
      },
      pushRouter () {
        this.$router.push({
          name: 'problem-list',
          query: utils.filterEmptyValue(this.query)
        })
      },
      getProblemList () {
        let offset = (this.query.page - 1) * this.limit
        this.loadings.table = true
        api.getProblemList(offset, this.limit, this.query).then(res => {
          this.loadings.table = false
          this.total = res.data.data.total
          this.problemList = res.data.data.results
          if (this.isAuthenticated) {
            this.addStatusColumn(this.problemTableColumns, res.data.data.results)
          }
        }, res => {
          this.loadings.table = false
        })
      },
      getTagList () {
        api.getProblemTagList().then(res => {
          this.tagList = res.data.data
          this.loadings.tag = false
        }, res => {
          this.loadings.tag = false
        })
      },
      filterByTag (tagName) {
        this.query.tag = tagName
        this.query.page = 1
        this.pushRouter()
      },
      filterByDifficulty (difficulty) {
        this.query.difficulty = difficulty
        this.query.page = 1
        this.pushRouter()
      },
      filterByKeyword () {
        this.query.page = 1
        this.pushRouter()
      },
      handleTagsVisible (value) {
        if (value) {
          this.problemTableColumns.push(
            {
              title: 'Tags',
              align: 'center',
              render: (h, params) => {
                let tags = []
                params.row.tags.forEach(tag => {
                  tags.push(h('Tag', {}, tag))
                })
                return h('div', {
                  style: {
                    margin: '8px 0'
                  }
                }, tags)
              }
            })
        } else {
          this.problemTableColumns.splice(this.problemTableColumns.length - 1, 1)
        }
      },
      onReset () {
        this.$router.push({name: 'problem-list'})
      },
      pickone () {
        api.pickone().then(res => {
          this.$success('Good Luck')
          this.$router.push({name: 'problem-details', params: {problemID: res.data.data}})
        })
      }
    },
    computed: {
      ...mapGetters(['isAuthenticated'])
    },
    watch: {
      '$route' (newVal, oldVal) {
        if (newVal !== oldVal) {
          this.init(true)
        }
      },
      'isAuthenticated' (newVal) {
        if (newVal === true) {
          this.init()
        }
      }
    }
  }
</script>

<style scoped lang="less">
  .taglist-title {
    margin-left: -10px;
    margin-bottom: -10px;
  }

  .tag-btn {
    margin-right: 5px;
    margin-bottom: 10px;
  }

  #pick-one {
    margin-top: 10px;
  }
</style>
