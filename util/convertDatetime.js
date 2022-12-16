const dayjs = require('dayjs')
var utc = require('dayjs/plugin/utc')
var isBetween = require('dayjs/plugin/isBetween')
var timezone = require('dayjs/plugin/timezone') // dependent on utc plugin
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(isBetween)

const currentUTCDateTime = () => {
  return dayjs().utc().format('YYYY-MM-DD HH:mm:ss')
}

// 拿到 UTC 時間 (YYYY-MM-DD)，目前多用在作為 redis 的 key
const currentUTCDate = () => {
  return dayjs().utc().format('YYYY-MM-DD')
}
const addTimeBySecond = (from, seconds) => {
  return dayjs(from).add(seconds, 'second').format('YYYY-MM-DD HH:mm:ss')
}

const addTimeByMinute = (from, minutes) => {
  return dayjs(from).add(minutes, 'minute').format('YYYY-MM-DD HH:mm:ss')
}

const addTimeByDay = (from, days) => {
  return dayjs(from).add(days, 'day').format('YYYY-MM-DD')
}

const isTimeBetween = (time, openTime, closeTime) => {
  return dayjs(time).isBetween(dayjs(openTime), dayjs(closeTime))
}

module.exports = {
  currentUTCDateTime,
  currentUTCDate,
  addTimeBySecond,
  addTimeByMinute,
  addTimeByDay,
  isTimeBetween,
}
