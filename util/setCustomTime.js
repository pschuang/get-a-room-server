require('dotenv').config({ path: '../.env' })
const redis = require('./cache')
const dayjs = require('dayjs')
var utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const setBulletinOpenTime = async () => {
  const args = process.argv
  console.log(args)

  const timeSpan = process.argv[2]

  const nowUTC = dayjs().utc()
  const keyForDatetime = nowUTC.format('YYYY-MM-DD')
  const valueForDatetime = nowUTC
    .add(timeSpan, 'second')
    .format('YYYY-MM-DD HH:mm:ss')

  await redis.set(keyForDatetime, valueForDatetime)
}

setBulletinOpenTime()
