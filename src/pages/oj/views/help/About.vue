<script setup>
const languages = [
  { name: 'C', compile: 'gcc -DONLINE_JUDGE=1 -O2 -std=c11 -o main main.c' },
  { name: 'C++', compile: 'g++ -DONLINE_JUDGE=1 -O2 -std=c++17 -o main main.cpp' },
  { name: 'Python 3', compile: '(no compile)', run: 'python3 main.py' },
  { name: 'Java', compile: 'javac Main.java' },
  { name: 'Go', compile: 'go build -o main main.go' }
]

const statuses = [
  { code: 'AC', tone: 'ac', label: 'Accepted', desc: '모든 테스트 케이스를 통과했습니다.' },
  { code: 'WA', tone: 'wa', label: 'Wrong Answer', desc: '출력이 예상과 다릅니다.' },
  { code: 'TLE', tone: 'tle', label: 'Time Limit Exceeded', desc: '시간 제한을 초과했습니다.' },
  { code: 'MLE', tone: 'mle', label: 'Memory Limit Exceeded', desc: '메모리 제한을 초과했습니다.' },
  { code: 'CE', tone: 'ce', label: 'Compile Error', desc: '소스코드 컴파일에 실패했습니다.' },
  { code: 'RE', tone: 'wa', label: 'Runtime Error', desc: '실행 도중 비정상 종료되었습니다.' }
]
</script>

<template>
  <div class="page">
    <header class="hero">
      <div class="mono eyebrow">ABOUT</div>
      <h1 class="title">DCUCODE 안내</h1>
      <p class="subtitle">대구가톨릭대학교 온라인 저지 시스템 소개와 채점 환경.</p>
    </header>

    <section class="surface card">
      <h2 class="card-title">지원 언어 / 컴파일 옵션</h2>
      <table class="data-table">
        <thead><tr><th>언어</th><th>컴파일 / 실행 명령</th></tr></thead>
        <tbody>
          <tr v-for="l in languages" :key="l.name">
            <td><span class="chip">{{ l.name }}</span></td>
            <td class="mono">{{ l.compile }}{{ l.run ? ' · ' + l.run : '' }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="surface card">
      <h2 class="card-title">채점 결과 코드</h2>
      <ul class="status-list">
        <li v-for="s in statuses" :key="s.code">
          <span :class="['dot', `dot-${s.tone}`]" />
          <span class="mono status-code">{{ s.code }}</span>
          <span class="status-label">{{ s.label }}</span>
          <span class="status-desc">{{ s.desc }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.page { max-width: 880px; margin: 0 auto; padding: 40px 32px 80px; display: flex; flex-direction: column; gap: 20px; }
.eyebrow { font-size: 11px; color: var(--ink-3); letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 6px; }
.title { font-size: 32px; font-weight: 600; letter-spacing: -0.8px; margin: 0 0 6px; color: var(--ink); }
.subtitle { font-size: 14px; color: var(--ink-2); margin: 0; }
.card { padding: 22px 24px; }
.card-title { font-size: 15px; font-weight: 600; margin: 0 0 14px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { text-align: left; padding: 10px 14px; border-top: 1px solid var(--line); }
.data-table th { background: var(--sunken); border-top: none; font-size: 11px; font-weight: 600; color: var(--ink-3); text-transform: uppercase; letter-spacing: 1px; }
.status-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; font-size: 13px; }
.status-list li { display: grid; grid-template-columns: 8px 50px 130px 1fr; align-items: center; gap: 12px; }
.status-code { font-weight: 700; color: var(--ink); }
.status-label { color: var(--ink); }
.status-desc { color: var(--ink-2); }
</style>
