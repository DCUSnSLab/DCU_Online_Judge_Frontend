module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  // https://github.com/feross/standard/blob/master/RULES.md#javascript-standard-style
  extends: 'standard',
  // required to lint *.vue files
  plugins: [
    'html'
  ],
  env: {
    browser: true, // 브라우저 전역 변수(localStorage 등)를 인식하도록 설정
    node: true // Node.js 환경도 필요하다면 추가
  },
  // add your custom rules here
  'rules': {
    // allow paren-less arrow functions
    'arrow-parens': 0,
    // allow async-await
    'generator-star-spacing': 0,
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    "no-irregular-whitespace": ["error", {
      "skipComments": true,
      "skipTemplates": true
    }],
    "no-unused-vars": ["warn"]
  }
}
