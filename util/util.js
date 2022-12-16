require('dotenv').config()
const { TOKEN_SECRET, BULLETIN_OPEN_TIME_SPAN } = process.env
const jwt = require('jsonwebtoken')
const {
  currentUTCDateTime,
  addTimeByMinute,
  addTimeByDay,
  isTimeBetween,
} = require('./convertDatetime')

const Cache = require('../models/cache_model')

const role = {
  ADMIN: 1,
  USER: 2,
}

const wrapAsync = (fn) => {
  return function (req, res, next) {
    // Make sure to `.catch()` any errors and pass them along to the `next()`
    // middleware in the chain, in this case the error handler.
    fn(req, res, next).catch(next)
  }
}

const authentication = async (req, res, next) => {
  let accessToken = req.get('Authorization')
  if (!accessToken) {
    res.status(401).json({ message: 'token is required' })
    return
  }

  try {
    accessToken = accessToken.split(' ')[1]
    const user = jwt.verify(accessToken, TOKEN_SECRET)
    req.user = user
    next()
  } catch (error) {
    res.status(403).json({ message: error.message })
    return
  }
}

const authorization = async (req, res, next) => {
  const roleId = req.user.role

  if (roleId === role.ADMIN) {
    next()
  }
  if (roleId === role.USER) {
    return res
      .status(403)
      .json({ message: 'Sorry, you are not authorized to use this page' })
  }
}

const isBulletinOpen = async (req, res, next) => {
  const openTimeTodayUTC = await Cache.getOpenTimeTodayUTC()
  const tomorrowUTC = addTimeByDay(openTimeTodayUTC, 1)

  // 布告欄下一個開啟時間
  const nextOpenAt = await Cache.getValue(tomorrowUTC)

  const closeTimeTodayUTC = addTimeByMinute(
    openTimeTodayUTC,
    BULLETIN_OPEN_TIME_SPAN
  )

  // 判斷是否在區間
  const canGetIn = isTimeBetween(
    currentUTCDateTime(),
    openTimeTodayUTC,
    closeTimeTodayUTC
  )

  // 布告欄如果在開啟時間內，要帶 bullertinCloseTime 給 common controller 回傳給前端
  req.bulletinCloseTime = closeTimeTodayUTC

  if (canGetIn) {
    // 在時間內的話放行
    console.log('bulletin is open')
    next()
  } else {
    // 不在時間內則擋住
    console.log('bulletin is close')

    res.status(423).json({
      message: 'the bulletin is closed',
      openAt: openTimeTodayUTC,
      closedAt: closeTimeTodayUTC,
      nextOpenAt,
    })
    return
  }
}

module.exports = {
  wrapAsync,
  authentication,
  authorization,
  isBulletinOpen,
}
