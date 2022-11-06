const router = require('express').Router()

const { getFriends } = require('../controllers/friends_controller')

router.route('/friends/:userId').get(getFriends)

module.exports = router
