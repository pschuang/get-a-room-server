require('dotenv').config()
const { TOKEN_SECRET, BULLETIN_OPEN_TIME_SPAN } = process.env
const redis = require('./cache')
const jwt = require('jsonwebtoken')
const dayjs = require('dayjs')
var utc = require('dayjs/plugin/utc')
var isBetween = require('dayjs/plugin/isBetween')
var timezone = require('dayjs/plugin/timezone') // dependent on utc plugin
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(isBetween)
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
  const nowUTC = dayjs().utc() // 這邊 .utc() 會把轉換時區到 utc
  const openTimeTodayUTC = await redis.get(nowUTC.format('YYYY-MM-DD'))

  // 布告欄下一個開啟時間
  const nextOpenAt = await redis.get(nowUTC.add(1, 'day').format('YYYY-MM-DD'))

  const closeTimeTodayUTC = dayjs(openTimeTodayUTC).add(
    BULLETIN_OPEN_TIME_SPAN,
    'minute'
  )

  // 判斷是否在區間
  const canGetIn = nowUTC.isBetween(
    dayjs(openTimeTodayUTC).utc(true), // 要把時區轉換到 utc 才可比較
    closeTimeTodayUTC.utc(true)
  )

  // 布告欄如果在開啟時間內，要帶 bullertinCloseTime 給 common controller 回傳給前端
  req.bulletinCloseTime = closeTimeTodayUTC.format('YYYY-MM-DD HH:mm:ss')

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
      closedAt: closeTimeTodayUTC.format('YYYY-MM-DD HH:mm:ss'),
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
