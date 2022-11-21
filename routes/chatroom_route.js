const router = require('express').Router()

const { getMessages } = require('../controllers/chatroom_controller')
const { wrapAsync, authentication, isBulletinOpen } = require('../util/util')

router.route('/chatroom/messages/:roomId').get(authentication, wrapAsync(getMessages))

module.exports = router
