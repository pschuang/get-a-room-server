require('dotenv').config({ path: '../.env' })
const {
  BULLETIN_OPEN_TIME_SPAN,
  MATCH_CHATROOM_TIME_SPAN,
  DECIDE_TO_BE_FRIEND_TIME_SPAN,
} = process.env
const db = require('./mysqlconf')
const redis = require('../util/cache')
const dayjs = require('dayjs')
var utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const getAskedQuestionCount = async () => {
  // 取 "今天" 布告欄開啟的時間區間
  const openTimeTodayUTC = await redis.get(dayjs().utc().format('YYYY-MM-DD'))
  const closeTimeTodayUTC = dayjs(openTimeTodayUTC)
    .add(BULLETIN_OPEN_TIME_SPAN, 'minute')
    .format('YYYY-MM-DD HH:mm:ss')
  const [result] = await db.query(
    'SELECT count(*) AS count FROM questions WHERE start_time > ? AND start_time < ?',
    [openTimeTodayUTC, closeTimeTodayUTC]
  )
  return result[0].count
}

const getOpenQuestionCount = async () => {
  const openTimeTodayUTC = await redis.get(dayjs().utc().format('YYYY-MM-DD'))
  const closeTimeTodayUTC = dayjs(openTimeTodayUTC)
    .add(BULLETIN_OPEN_TIME_SPAN, 'minute')
    .format('YYYY-MM-DD HH:mm:ss')
  const [result] = await db.query(
    'SELECT count(*) AS count FROM questions WHERE start_time > ? AND start_time < ? AND is_closed = 0',
    [openTimeTodayUTC, closeTimeTodayUTC]
  )

  return result[0].count
}

const getQuestionsCountByCategory = async () => {
  const openTimeTodayUTC = await redis.get(dayjs().utc().format('YYYY-MM-DD'))
  const closeTimeTodayUTC = dayjs(openTimeTodayUTC)
    .add(BULLETIN_OPEN_TIME_SPAN, 'minute')
    .format('YYYY-MM-DD HH:mm:ss')
  const [result] = await db.query(
    'SELECT count(*) AS count, categories.category FROM questions, categories WHERE questions.category_id = categories.id AND start_time > ? AND start_time < ? GROUP BY category_id;',
    [openTimeTodayUTC, closeTimeTodayUTC]
  )
  return result
}

const getUserCount = async () => {
  const openTimeTodayUTC = await redis.get(dayjs().utc().format('YYYY-MM-DD'))
  const closeTimeTodayUTC = dayjs(openTimeTodayUTC)
    .add(BULLETIN_OPEN_TIME_SPAN, 'minute')
    .format('YYYY-MM-DD HH:mm:ss')
  const [result] = await db.query(
    'SELECT count(*) AS count From user WHERE created_at > ? AND created_at < ?',
    [openTimeTodayUTC, closeTimeTodayUTC]
  )
  return result[0].count
}

const getFriendshipCount = async () => {
  const openTimeTodayUTC = await redis.get(dayjs().utc().format('YYYY-MM-DD'))
  const closeTimeTodayUTC = dayjs(openTimeTodayUTC)
    .add(
      BULLETIN_OPEN_TIME_SPAN +
        MATCH_CHATROOM_TIME_SPAN / 1000 +
        DECIDE_TO_BE_FRIEND_TIME_SPAN / 1000,
      'minute'
    )
    .format('YYYY-MM-DD HH:mm:ss')
  const [result] = await db.query(
    'SELECT count(*) AS count FROM friends WHERE created_at > ? AND created_at < ?',
    [openTimeTodayUTC, closeTimeTodayUTC]
  )

  const FriendshipCount = result[0].count / 2
  return FriendshipCount
}

module.exports = {
  getAskedQuestionCount,
  getOpenQuestionCount,
  getQuestionsCountByCategory,
  getUserCount,
  getFriendshipCount,
}
