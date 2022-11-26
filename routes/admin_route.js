const router = require('express').Router()

const { authentication, authorization, wrapAsync } = require('../util/util')

const { getWeekStats } = require('../controllers/admin_controller')

router
  .route('/admin/stats')
  .get(authentication, authorization, wrapAsync(getWeekStats))

module.exports = router
