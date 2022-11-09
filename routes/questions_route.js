const router = require('express').Router()

const {
  getQuestions,
  getQuestionsDetails,
  createQuestion,
  createReply
} = require('../controllers/questions_controller')

router.route('/questions').get(getQuestions)
router.route('/questions/details/:questionId').get(getQuestionsDetails)
router.route('/questions').post(createQuestion)
router.route('/reply').post(createReply)

module.exports = router
