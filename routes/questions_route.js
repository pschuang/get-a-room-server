const router = require('express').Router()

const { wrapAsync, authentication, isBulletinOpen } = require('../util/util')

const {
  getQuestions,
  getQuestionsDetails,
  checkStatus,
  createQuestion,
  createReply,
} = require('../controllers/questions_controller')

router.route('/questions/status').get(authentication, checkStatus)
router.route('/questions/:category').get(isBulletinOpen, getQuestions)
router
  .route('/questions/details/:questionId')
  .get(authentication, getQuestionsDetails)
router.route('/questions').post(authentication, createQuestion)
router.route('/reply').post(authentication, createReply)

module.exports = router
