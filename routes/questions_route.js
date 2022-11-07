const router = require('express').Router()

const {
  getQuestions,
  getQuestionsDetails,
} = require('../controllers/questions_controller')

router.route('/questions').get(getQuestions)
router.route('/questions/details/:questionId').get(getQuestionsDetails)

module.exports = router
