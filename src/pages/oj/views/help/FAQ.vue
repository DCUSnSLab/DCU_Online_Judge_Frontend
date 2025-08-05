<template><!--해당 정보 Code.cu.ac.kr에 맞게 수정 필요-->
  <panel>
    <div slot="title">{{$t('m.Frequently_Asked_Questions')}}</div>
    <div class="content markdown-body">
      <ul>
        <!--<li>{{$t('m.Where_is_the_input_and_the_output')}}
          <p>{{$t('m.Where_is_the_input_and_the_output_answer_part_1')}} <code>stdin</code> ('{{$t('m.Standard_Input')}}') {{$t('m.Where_is_the_input_and_the_output_answer_part_3')}} <code>stdout</code>
            ('{{$t('m.Standard_Output')}}') {{$t('m.Where_is_the_input_and_the_output_answer_part_5')}} <code>scanf</code> {{$t('m.Where_is_the_input_and_the_output_answer_part_6')}} <code>cin</code>
            {{$t('m.Where_is_the_input_and_the_output_answer_part_7')}} <code>printf</code> {{$t('m.Where_is_the_input_and_the_output_answer_part_8')}} <code>cout</code> {{$t('m.Where_is_the_input_and_the_output_answer_part_9')}} <code>{{$t('m.Runtime_Error')}}</code>.
          </p>
        </li>
        <li>{{$t('m.What_is_the_meaning_of_submission_execution_time')}}
        <p>{{$t('m.What_is_the_meaning_of_submission_execution_time_answer')}}
        </p>
        </li>
        <li>{{$t('m.How_Can_I_use_CPP_Int64')}}
          <p>{{$t('m.How_Can_I_use_CPP_Int64_answer_part_1')}}<code>long long</code> {{$t('m.How_Can_I_use_CPP_Int64_answer_part_2')}} <code>cin/cout</code> {{$t('m.or')}} <code>%lld</code>, {{$t('m.using')}}<code> __int64</code> {{$t('m.How_Can_I_use_CPP_Int64_answer_part_3')}} <code>{{$t('m.Compile_Error')}}</code>.</p>
        </li>
        <li>{{$t('m.Java_specifications')}}
          <p>{{$t('m.Java_specifications_answer_part_1')}} <code>Main</code> {{$t('m.Java_specifications_answer_part_2')}} <code>Main</code> {{$t('m.Java_specifications_answer_part_3')}}</p>
        </li>
        <li>{{$t('m.About_presentation_error')}}
          <p>{{$t('m.About_presentation_error_answer_part_1')}} <b>{{$t('m.last')}}</b> {{$t('m.About_presentation_error_answer_part_2')}} <code> {{$t('m.Wrong_Answer')}}</code>.</p>
        </li>-->
        <li>{{$t('m.How_to_report_bugs')}}
          <p>
            버그 제보는 <a href="mailto:dcucode@gmail.com">dcucode@gmail.com</a>로 보내주시면 감사하겠습니다.<br>
            제보 시, 문제 상황과 재현 방법, 사용 환경(브라우저, OS 등)을 함께 알려주시면 신속한 처리에 도움이 됩니다.
          </p>
        </li>
        <li>[로그인] 비밀번호를 잊어서 찾기를 했는데 메일이 오지 않아요.
          <p>
            메일이 도착하지 않는 경우, 스팸 메일함을 먼저 확인해 주시길 바랍니다.<br>
            그래도 메일을 받지 못했다면 <a href="mailto:dcucode@gmail.com">dcucode@gmail.com</a>로 문의 부탁드립니다.
          </p>
        </li>
        <li>[로그인] 회원가입하려는데, 학번/교직번호가 이미 있다고 뜨는데 어떡하나요?
          <p>
            학번/교직번호는 중복 등록이 불가능합니다.
            이전에 가입한 적이 있는 경우, 기존 계정으로 로그인하거나 비밀번호 찾기를 진행해 주시길 바랍니다.<br>
            가입한 적이 없다면 학번과 이름을 적어 메일로 문의 주시기 바랍니다.
          </p>
        </li>
        <li>[수강과목] 실수로 수강신청을 눌러 수강대기로 뜹니다. 혹시 취소해주실 수 있나요?
          <p>
            수강대기 상태는 담당 교수님 또는 관리자에게 요청하여 취소가 가능합니다. <br>
            수강 신청한 과목명과 이름, 학번을 포함하여 요청해 주시길 바합니다.
          </p>
        </li>
        <li>[시스템] 언어를 영어로 변경하고 싶어요.
          <p>
            로그인 후 화면 상단의 본인 아이디를 클릭하면 ‘설정’ 메뉴가 있습니다. <br>
            설정에서 원하는 언어를 선택하고 저장하면 즉시 변경됩니다.<br>
          </p>
        </li>
        <li>[계정] 입학전 교육때문에 전화번호로 가입했는데, 학번으로 바꾸고 싶어요.
          <p>
            학기 초(3월)에는 DCUCode 메인 화면에서 직접 변경이 가능합니다. <br>
            해당 메뉴가 보이지 않는 경우, 화면 상단의 본인 아이디를 클릭해 ‘설정’ 메뉴로 이동할 수 있습니다.<br>
            설정에서 본인의 학번으로 변경한 뒤 저장해 주시기 바합니다.
          </p>
        </li>
      </ul>
    </div>
  </panel>
</template>

<script>
</script>

<style lang="less" scoped>
  .content {
    font-size: 16px;
    margin: 0 50px 40px 50px;
    > ul {
      list-style: disc;
      li {
        font-size: 20px;
        margin-top: 20px;
        &:first-child {
          margin-top: 0;
        }
        p {
          font-size: 16px;
          margin-top: 5px;
          margin-bottom: 20px;
        }
      }
    }
  }
</style>
