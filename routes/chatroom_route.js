const router = require('express').Router()

const {
  getMessages,
  getMatchCounterPartInfo,
} = require('../controllers/chatroom_controller')
const { wrapAsync, authentication, isBulletinOpen } = require('../util/util')

router
  .route('/chatroom/messages/:roomId')
  .get(authentication, wrapAsync(getMessages))

router
  .route('/chatroom/counterpart/:roomId')
  .get(authentication, wrapAsync(getMatchCounterPartInfo))

module.exports = router
