const router = require('express').Router()

const { authentication, authorization, wrapAsync } = require('../util/util')

const { getWeekStats,getDailyStats } = require('../controllers/admin_controller')

router
  .route('/admin/stats')
  .get(authentication, authorization, wrapAsync(getWeekStats))

router // 測試用
  .route('/admin/daily')
  .get(wrapAsync(getDailyStats))

module.exports = router
