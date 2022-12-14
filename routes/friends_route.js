const router = require('express').Router()

const { wrapAsync, authentication } = require('../util/util')

const { getFriends } = require('../controllers/friends_controller')

router.route('/friends').get(authentication, wrapAsync(getFriends))

module.exports = router
