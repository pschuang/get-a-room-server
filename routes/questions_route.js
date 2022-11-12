const router = require('express').Router()

const { wrapAsync, authentication } = require('../util/util')

const {
  getQuestions,
  getQuestionsDetails,
  checkStatus,
  createQuestion,
  createReply,
} = require('../controllers/questions_controller')

router.route('/questions/status').get(authentication, checkStatus)
router.route('/questions/:category').get(getQuestions)
router.route('/questions/details/:questionId').get(getQuestionsDetails)
router.route('/questions').post(authentication, createQuestion)
router.route('/reply').post(createReply)

module.exports = router
