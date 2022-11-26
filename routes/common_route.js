const router = require('express').Router()

const { isBulletinOpen, wrapAsync } = require('../util/util')

const { getCloseTime } = require('../controllers/common_controller')

router.route('/common/time').get(isBulletinOpen, wrapAsync(getCloseTime))

module.exports = router
