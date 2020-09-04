const CourseList = () => import(/* webpackChunkName: "contest" */ './CourseList.vue')
const LectureList = () => import(/* webpackChunkName: "contest" */ './LectureList.vue')
const LectureDetails = () => import(/* webpackChunkName: "contest" */ './LectureDetail.vue')
const LectureContestDetails = () => import(/* webpackChunkName: "contest" */ './LectureContestDetail.vue')
const LectureSubmissionDetails = () => import(/* webpackChunkName: "contest" */ './LectureSubmissionDetail.vue')
const LectureContestProblemList = () => import(/* webpackChunkName: "contest" */ './children/ContestProblemList.vue')
const LectureContestRank = () => import(/* webpackChunkName: "contest" */ './children/ContestRank.vue')
const LectureACMContestHelper = () => import(/* webpackChunkName: "contest" */ './children/ACMHelper.vue')

export {LectureDetails, LectureList, CourseList, LectureContestDetails, LectureContestProblemList, LectureContestRank, LectureACMContestHelper, LectureSubmissionDetails}
