<script setup>
import { ref } from 'vue'

const open = ref(0)

const faqs = [
  { q: '계정은 어떻게 만들 수 있나요?', a: '회원가입 페이지에서 학번과 학교 이메일로 가입할 수 있습니다. 학교 이메일이 아닌 경우 관리자가 별도 승인합니다.' },
  { q: '수강 중인 강의는 어디서 볼 수 있나요?', a: '상단 메뉴의 "수강과목"에서 확인할 수 있습니다. 수강신청은 같은 페이지의 "수강신청" 탭에서 진행합니다.' },
  { q: '제출이 채점되지 않습니다.', a: '채점 서버가 일시적으로 바쁠 수 있습니다. 1분 이상 "대기 중" 상태이면 관리자에게 문의해주세요.' },
  { q: '비밀번호를 잊어버렸어요.', a: '로그인 화면의 "비밀번호 찾기"로 이메일 인증 후 재설정할 수 있습니다.' },
  { q: 'IDE에서 입력값은 어떻게 넣나요?', a: '문제 풀이 화면 우측 하단의 "테스트 실행" 영역에서 직접 입력값을 넣고 빠르게 실행해볼 수 있습니다.' },
  { q: '시간 제한을 넘으면 어떻게 되나요?', a: 'TLE(Time Limit Exceeded)로 채점됩니다. 알고리즘을 개선해보세요.' }
]
</script>

<template>
  <div class="page">
    <header class="hero">
      <div class="mono eyebrow">FAQ</div>
      <h1 class="title">자주 묻는 질문</h1>
    </header>

    <section class="surface card">
      <ul class="faq-list">
        <li v-for="(f, i) in faqs" :key="i" :class="{ open: open === i }">
          <button class="q" @click="open = open === i ? -1 : i">
            <span>{{ f.q }}</span>
            <span class="mono caret">{{ open === i ? '−' : '+' }}</span>
          </button>
          <div v-if="open === i" class="a">{{ f.a }}</div>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.page { max-width: 760px; margin: 0 auto; padding: 40px 32px 80px; display: flex; flex-direction: column; gap: 20px; }
.eyebrow { font-size: 11px; color: var(--ink-3); letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 6px; }
.title { font-size: 32px; font-weight: 600; letter-spacing: -0.8px; margin: 0; color: var(--ink); }
.card { padding: 8px 8px; }
.faq-list { list-style: none; margin: 0; padding: 0; }
.faq-list li { border-bottom: 1px solid var(--line); }
.faq-list li:last-child { border-bottom: none; }
.q { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 16px 18px; background: transparent; border: none; font-size: 14px; font-weight: 500; color: var(--ink); cursor: pointer; text-align: left; font-family: inherit; }
.q:hover { background: var(--sunken); }
.caret { color: var(--ink-3); font-size: 18px; width: 20px; text-align: center; }
.a { padding: 0 18px 18px; font-size: 13px; color: var(--ink-2); line-height: 1.6; }
.open .q { color: var(--accent); }
</style>
