const router = require('express').Router()

const { wrapAsync, authentication, isBulletinOpen } = require('../util/util')

const {
  getQuestions,
  getQuestionsDetails,
  checkStatus,
  createQuestion,
  createReply,
} = require('../controllers/questions_controller')

router
  .route('/questions/status')
  .get(authentication, isBulletinOpen, checkStatus)
router.route('/questions/:category').get(isBulletinOpen, getQuestions)
router
  .route('/questions/details/:questionId')
  .get(authentication, isBulletinOpen, getQuestionsDetails)
router.route('/questions').post(authentication, isBulletinOpen, createQuestion)
router.route('/reply').post(authentication, isBulletinOpen, createReply)

module.exports = router
