require('dotenv').config({ path: __dirname + '/../.env' })
const redis = require('./cache')
const dayjs = require('dayjs')
var utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const generateBulletinOpenTime = async () => {
  const randomHour = Math.floor(Math.random() * 24)

  const nowUTC = dayjs().utc()

  const keyForDatetime = nowUTC.add(2, 'day').format('YYYY-MM-DD')

  const valueForDatetime = nowUTC
    .add(2, 'day')
    .hour(randomHour)
    .minute(0)
    .second(0)
    .format('YYYY-MM-DD HH:mm:ss')

  await redis.set(keyForDatetime, valueForDatetime)
}

generateBulletinOpenTime()
