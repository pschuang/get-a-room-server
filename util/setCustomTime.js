require('dotenv').config({ path: '../.env' })
const redis = require('./cache')
const db = require('../models/mysqlconf')
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

  const valueForQuestionDatetime = nowUTC
    .add(timeSpan + 10, 'second')
    .format('YYYY-MM-DD HH:mm:ss')

  // 更新布告欄時間為 argv[2] 秒後開啟
  await redis.set(keyForDatetime, valueForDatetime)

  // 更新問題發問時間
  await db.query('UPDATE questions SET start_time = ? WHERE id IN (?)', [
    valueForQuestionDatetime,
    [118, 119, 120, 121, 122, 123, 124, 125, 126, 127],
  ])
  await redis.disconnect()
  await db.end()
}

setBulletinOpenTime()
