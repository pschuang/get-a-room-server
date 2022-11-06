const router = require('express').Router()

const { getMessages } = require('../controllers/chatroom_controller')

router.route('/chatroom/messages/:roomId').get(getMessages)

module.exports = router
