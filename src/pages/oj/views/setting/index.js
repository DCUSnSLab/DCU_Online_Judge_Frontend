const Settings = () => import(/* webpackChunkName: "setting" */ './Settings.vue')
const ProfileSetting = () => import(/* webpackChunkName: "setting" */ './children/ProfileSetting.vue')
const SecuritySetting = () => import(/* webpackChunkName: "setting" */ './children/SecuritySetting.vue')
const AccountSetting = () => import(/* webpackChunkName: "setting" */ './children/AccountSetting.vue')
const TestSetting = () => import(/* webpackChunkName: "setting" */ './children/Test.vue') // 테스트를 위해 임시로 추가한 부분

export {Settings, ProfileSetting, SecuritySetting, AccountSetting, TestSetting}
