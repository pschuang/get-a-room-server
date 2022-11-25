const router = require('express').Router()

const { authentication, wrapAsync } = require('../util/util')

const { getWeekStats } = require('../controllers/admin_controller')

router.route('/admin/stats').get(wrapAsync(getWeekStats))

module.exports = router
