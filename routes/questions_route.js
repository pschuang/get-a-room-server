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
  .get(authentication, isBulletinOpen, wrapAsync(checkStatus))
router
  .route('/questions/:category')
  .get(isBulletinOpen, wrapAsync(getQuestions))
router
  .route('/questions/details/:questionId')
  .get(authentication, isBulletinOpen, wrapAsync(getQuestionsDetails))
router
  .route('/questions')
  .post(authentication, isBulletinOpen, wrapAsync(createQuestion))
router
  .route('/reply')
  .post(authentication, isBulletinOpen, wrapAsync(createReply))

module.exports = router
