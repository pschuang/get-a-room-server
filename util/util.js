require('dotenv').config()
const { TOKEN_SECRET } = process.env
const jwt = require('jsonwebtoken')
const dayjs = require('dayjs')
var utc = require('dayjs/plugin/utc')
var isBetween = require('dayjs/plugin/isBetween')
var timezone = require('dayjs/plugin/timezone') // dependent on utc plugin
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(isBetween)

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
    console.log('user: ', user)
    req.user = user
    next()
  } catch (error) {
    res.status(403).json({ message: error.message })
    return
  }
}

const isBulletinOpen = (req, res, next) => {
  // 布告欄開放時間 Asia/Taipei 16:00:00   UTC 08:00:00
  const bulletinOpenUTC = '07:55:00'
  const openTimeTodayUTC = dayjs().format('YYYY-MM-DD ') + bulletinOpenUTC
  const closeTimeTodayUTC = dayjs(openTimeTodayUTC)
    .add(60, 'minute')
    .format('YYYY-MM-DD HH:mm:ss')

  const openTimeTodayLocal = dayjs(openTimeTodayUTC)
    .utc(true)
    .tz(dayjs.tz.guess())

  const closeTimeTodayLocal = dayjs(closeTimeTodayUTC)
    .utc(true)
    .tz(dayjs.tz.guess())

  const now = dayjs()

  console.log(
    'Today bulletin is open at: ',
    openTimeTodayLocal.format('YYYY-MM-DD HH:mm:ss')
  )
  console.log(
    'Today bulletin is close at: ',
    closeTimeTodayLocal.format('YYYY-MM-DD HH:mm:ss')
  )
  console.log('datetime now is: ', now.format('YYYY-MM-DD HH:mm:ss'))
  const canGetIn = now.isBetween(openTimeTodayLocal, closeTimeTodayLocal)
  if (canGetIn) {
    // 在時間內的話放行
    console.log('bulletin is open')
    next()
  } else {
    // 不在時間內則擋住
    console.log('bulletin is close')
    res.status(403).json({ message: 'the bulletin is close' })
    return
  }
}

module.exports = {
  wrapAsync,
  authentication,
  isBulletinOpen,
}
