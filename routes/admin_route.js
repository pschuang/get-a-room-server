const router = require('express').Router()

const { authentication, wrapAsync } = require('../util/util')

const { getDailyStats } = require('../controllers/admin_controller')

router.route('/admin/stats').get(wrapAsync(getDailyStats))

module.exports = router
