require('dotenv').config({ path: '../.env' })
const {
  BULLETIN_OPEN_TIME_SPAN,
  MATCH_CHATROOM_TIME_SPAN,
  DECIDE_TO_BE_FRIEND_TIME_SPAN,
} = process.env
const db = require('./mysqlconf')
const Cache = require('./cache_model')
const { currentUTCDate, addTimeByMinute } = require('../util/convertDatetime')

const getAskedQuestionCount = async () => {
  const openTimeTodayUTC = await Cache.getOpenTimeTodayUTC()

  const closeTimeTodayUTC = addTimeByMinute(
    openTimeTodayUTC,
    BULLETIN_OPEN_TIME_SPAN
  )

  try {
    const [result] = await db.execute(
      'SELECT count(*) AS count FROM questions WHERE start_time > ? AND start_time < ?',
      [openTimeTodayUTC, closeTimeTodayUTC]
    )
    return result[0].count
  } catch (error) {
    console.log(error)
    return { error }
  }
}

const getOpenQuestionCount = async () => {
  const openTimeTodayUTC = await Cache.getOpenTimeTodayUTC()
  const closeTimeTodayUTC = addTimeByMinute(
    openTimeTodayUTC,
    BULLETIN_OPEN_TIME_SPAN
  )

  try {
    const [result] = await db.execute(
      'SELECT count(*) AS count FROM questions WHERE start_time > ? AND start_time < ? AND is_closed = 0',
      [openTimeTodayUTC, closeTimeTodayUTC]
    )

    return result[0].count
  } catch (error) {
    console.log(error)
    return { error }
  }
}

const getQuestionsCountByCategory = async () => {
  const openTimeTodayUTC = await Cache.getOpenTimeTodayUTC()
  const closeTimeTodayUTC = addTimeByMinute(
    openTimeTodayUTC,
    BULLETIN_OPEN_TIME_SPAN
  )

  try {
    const [result] = await db.execute(
      'SELECT count(*) AS count, categories.category FROM questions, categories WHERE questions.category_id = categories.id AND start_time > ? AND start_time < ? GROUP BY category_id;',
      [openTimeTodayUTC, closeTimeTodayUTC]
    )
    return result
  } catch (error) {
    console.log(error)
    return { error }
  }
}

const getUserCount = async () => {
  const openTimeTodayUTC = await Cache.getOpenTimeTodayUTC()
  const closeTimeTodayUTC = addTimeByMinute(
    openTimeTodayUTC,
    BULLETIN_OPEN_TIME_SPAN
  )

  try {
    const [result] = await db.execute(
      'SELECT count(*) AS count From user WHERE created_at > ? AND created_at < ?',
      [openTimeTodayUTC, closeTimeTodayUTC]
    )
    return result[0].count
  } catch (error) {
    console.log(error)
    return { error }
  }
}

const getFriendshipCount = async () => {
  const openTimeTodayUTC = await Cache.getOpenTimeTodayUTC()

  const closeTimeTodayUTC = addTimeByMinute(
    openTimeTodayUTC,
    BULLETIN_OPEN_TIME_SPAN +
      MATCH_CHATROOM_TIME_SPAN / 1000 +
      DECIDE_TO_BE_FRIEND_TIME_SPAN / 1000
  )
  try {
    const [result] = await db.execute(
      'SELECT count(*) AS count FROM friends WHERE created_at > ? AND created_at < ?',
      [openTimeTodayUTC, closeTimeTodayUTC]
    )

    const FriendshipCount = result[0].count / 2
    return FriendshipCount
  } catch (error) {
    console.log(error)
    return { error }
  }
}

const getQuestionsInAWeek = async () => {
  const todayUTC = currentUTCDate()
  const [result] = await db.execute(
    `SELECT count(*) AS count, CAST(start_time AS DATE) AS date from questions WHERE CAST(start_time AS DATE) <= ? GROUP BY CAST(start_time AS DATE) ORDER BY CAST(start_time AS DATE) DESC LIMIT 7`,
    [todayUTC]
  )
  return result
}

const getReplyCount = async () => {
  try {
    const openTimeTodayUTC = await Cache.getOpenTimeTodayUTC()
    const closeTimeTodayUTC = addTimeByMinute(
      openTimeTodayUTC,
      BULLETIN_OPEN_TIME_SPAN
    )

    const [result] = await db.execute(
      'SELECT count(*) AS count FROM replies WHERE time > ? AND time < ?',
      [openTimeTodayUTC, closeTimeTodayUTC]
    )
    return result[0].count
  } catch (error) {
    console.log(error)
    return { error }
  }
}

const getPageViewsInAWeek = async () => {
  const todayUTC = currentUTCDate()
  const [result] = await db.execute(
    `SELECT * FROM page_views WHERE time <= ? ORDER BY time DESC LIMIT 7`,
    [todayUTC]
  )
  return result
}

module.exports = {
  getAskedQuestionCount,
  getOpenQuestionCount,
  getQuestionsCountByCategory,
  getUserCount,
  getFriendshipCount,
  getQuestionsInAWeek,
  getReplyCount,
  getPageViewsInAWeek,
}
