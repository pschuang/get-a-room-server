const router = require('express').Router()

const {
  getQuestions,
  getQuestionsDetails,
  createQuestion
} = require('../controllers/questions_controller')

router.route('/questions').get(getQuestions)
router.route('/questions/details/:questionId').get(getQuestionsDetails)
router.route('/questions').post(createQuestion)

module.exports = router
