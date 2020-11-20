<template>
  <Panel id="contest-card" shadow>
    <span>LectureID : {{ this.LectureID}} in test page</span>
    <span><br><bold>ID :{{this.id}} <br></bold><Highlight :code="code" :language="submission.language"></Highlight></span>
    <span>Input : {{ this.input}} <br></span>
    <span>Result : {{ this.result}} </span>
    <span><br><br></span>
    <span><br><bold>ID :{{this.id2}} <br></bold><Highlight :code="code2" :language="submission.language"></Highlight></span>
    <span>Input : {{ this.input2}} <br></span>
    <span>Result : {{ this.result2}} </span>
    <span><br><br></span>
    <span><br><bold>ID :{{this.id3}} <br></bold><Highlight :code="code3" :language="submission.language"></Highlight></span>
    <span>Input : {{ this.input3}} <br></span>
    <span>Result : {{ this.result3}} </span>
    <span><br><br></span>
    <span><br><bold>ID :{{this.id4}} <br></bold><Highlight :code="code4" :language="submission.language"></Highlight></span>
    <span>Input : {{ this.input4}} <br></span>
    <span>Result : {{ this.result4}} </span>
    <span><br><br></span>
    <span><br><bold>ID :{{this.id5}} <br></bold><Highlight :code="code5" :language="submission.language"></Highlight></span>
    <span>Input : {{ this.input5}} <br></span>
    <span>Result : {{ this.result5}} </span>
    <span><br><br></span>
    <span><br><bold>ID :{{this.id6}} <br></bold><Highlight :code="code6" :language="submission.language"></Highlight></span>
    <span>Input : {{ this.input6}} <br></span>
    <span>Result : {{ this.result6}} </span>
    <Row>
    </Row>
  </Panel>
</template>

<script>
  import api from '@oj/api'
  import Highlight from '@/pages/oj/components/Highlight'

  export default {
    name: 'submission-code',
    components: {
      Highlight
    },
    data () {
      return {
        LectureID: '',
        result: '',
        code: '',
        submission: {
          result: '0',
          code: '',
          info: {
            data: []
          },
          statistic_info: {
            time_cost: '',
            memory_cost: ''
          }
        }
      }
    },
    mounted () {
      this.init()
      this.getSubmissionscode()
    },
    methods: {
      init () {
        this.LectureID = this.$route.params.lectureID
      },
      getSubmissionscode () {
        api.getcode().then((res) => {
          console.log(res.data.data)
          console.log(res.data.data[0].id)
          this.id = res.data.data[0].id
          this.code = res.data.data[0].code
          this.input = res.data.data[0].inputt
          this.result = res.data.data[0].result
          this.id1 = res.data.data[1].id
          this.code1 = res.data.data[1].code
          this.input1 = res.data.data[1].inputt
          this.result1 = res.data.data[1].result
          this.id2 = res.data.data[2].id
          this.code2 = res.data.data[2].code
          this.input2 = res.data.data[2].inputt
          this.result2 = res.data.data[2].result
          this.id3 = res.data.data[3].id
          this.code3 = res.data.data[3].code
          this.input3 = res.data.data[3].inputt
          this.result3 = res.data.data[3].result
          this.id4 = res.data.data[4].id
          this.code4 = res.data.data[4].code
          this.input4 = res.data.data[4].inputt
          this.result4 = res.data.data[4].result
          this.id5 = res.data.data[5].id
          this.code5 = res.data.data[5].code
          this.input5 = res.data.data[5].inputt
          this.result5 = res.data.data[5].result
          this.id6 = res.data.data[6].id
          this.code6 = res.data.data[6].code
          this.input6 = res.data.data[6].inputt
          this.result6 = res.data.data[6].result
        })
      }
    },
    computed: {
    },
    watch: {
    }
  }
</script>