const router = require('express').Router()

const { getFriends } = require('../controllers/chatroom_controller')

router.route('/chatroom').get(getFriends)

module.exports = router
