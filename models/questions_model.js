const db = require('./mysqlconf')
const { BULLETIN_OPEN_TIME_SPAN, QUESTIONS_PER_PAGE } = process.env
const {
  currentUTCDateTime,
  addTimeByMinute,
} = require('../util/convertDatetime')

const Cache = require('../models/cache_model')

const getQuestionsDetails = async (questionId) => {
  const [details] = await db.execute(
    `SELECT questions.user_id, questions.content, questions.is_closed, replies.user_id AS userId, replies.reply AS answer, user.nickname, picture.picture_URL AS pictureURL
    FROM questions
    LEFT JOIN replies 
    ON questions.id = replies.question_id
    LEFT JOIN user
    ON user.id = replies.user_id
    LEFT JOIN picture
    ON user.picture_id = picture.id
    WHERE questions.id = ?`,
    [questionId]
  )
  if (details.length === 0) {
    return { error: 'no such question' }
  }

  // 問問題的人的 userId
  const questionUserId = details[0].user_id

  const repliers = details.map((detail) => {
    return {
      userId: detail.userId,
      isFriend: false,
      roomId: null,
      answer: detail.answer,
      nickname: detail.nickname,
      pictureURL: detail.pictureURL,
    }
  })

  // 取得 回答問題的人的 userId
  const replierUserIds = repliers.map((replier) => replier.userId)

  // 找出該 回答問題的人 與 問問題的人 的 roomId，並在 replier 物件上加上 isFriend, roomId
  for (let i = 0; i < replierUserIds.length; i++) {
    const [roomId] = await db.execute(
      'SELECT friend_user_id, room_id FROM friends WHERE user_id = ? AND friend_user_id = ?',
      [questionUserId, replierUserIds[i]]
    )
    if (roomId.length === 0) continue

    repliers[i].isFriend = true
    repliers[i].roomId = roomId[0].room_id
  }

  const data = {
    content: details[0].content,
    repliers,
    questionUserId,
    isClosed: details[0].is_closed,
  }
  return data
}

const getQuestions = async (paging, questionsPerPage, requirements = {}) => {
  // 只撈布告欄開放時間內建立的問題
  const openTimeTodayUTC = await Cache.getOpenTimeTodayUTC()
  const closeTimeTodayUTC = addTimeByMinute(
    openTimeTodayUTC,
    BULLETIN_OPEN_TIME_SPAN
  )

  const condition = {
    sql: '',
    binding: [openTimeTodayUTC, closeTimeTodayUTC],
  }

  if (!requirements.category && !requirements.keyword) {
  } else if (!requirements.category && requirements.keyword) {
    condition.sql += 'AND questions.content LIKE ? '
    condition.binding.push(`%${requirements.keyword}%`)
  } else if (requirements.category && !requirements.keyword) {
    condition.sql += 'AND categories.category = ? '
    condition.binding.push(requirements.category)
  } else if (requirements.category && requirements.keyword) {
    condition.sql += 'AND categories.category = ? AND questions.content LIKE ? '
    condition.binding.push(requirements.category, `%${requirements.keyword}%`)
  }

  const order = {
    sql: 'ORDER BY questions.id DESC ',
  }

  const limit = {
    sql: 'LIMIT ?, ? ',
    binding: [
      (paging * questionsPerPage).toString(),
      questionsPerPage.toString(),
    ],
  }

  const questionQuery =
    'SELECT questions.*, categories.category, user.id AS user_id, user.nickname, picture.picture_URL AS pictureURL FROM questions, user, categories, picture WHERE questions.user_id = user.id AND questions.category_id = categories.id AND user.picture_id = picture.id AND start_time > ? AND start_time < ? ' +
    condition.sql +
    order.sql +
    limit.sql
  const questionBindings = condition.binding.concat(limit.binding)

  const questionCountQuery =
    'SELECT count(*) AS total FROM questions, categories WHERE questions.category_id = categories.id AND start_time > ? AND start_time < ? ' +
    condition.sql

  const questionCountBindings = condition.binding

  const [questions] = await db.execute(questionQuery, questionBindings)
  const [questionsCount] = await db.execute(
    questionCountQuery,
    questionCountBindings
  )

  // 先判斷是否有 paging，再回給 controller
  if (questionsCount[0].total > (paging + 1) * QUESTIONS_PER_PAGE) {
    return { questions, next_paging: paging + 1 }
  }
  return { questions }
}

const checkStatus = async (userId) => {
  // 加上時間判斷
  const openTimeTodayUTC = await Cache.getOpenTimeTodayUTC()
  const closeTimeTodayUTC = addTimeByMinute(
    openTimeTodayUTC,
    BULLETIN_OPEN_TIME_SPAN
  )

  const [question] = await db.execute(
    'SELECT questions.*, categories.category, user.id AS user_id, user.nickname, picture.picture_URL AS pictureURL FROM questions, user, categories, picture WHERE questions.user_id = user.id AND questions.category_id = categories.id AND user.picture_id = picture.id AND user_id = ? AND start_time > ? AND start_time < ?',
    [userId, openTimeTodayUTC, closeTimeTodayUTC]
  )
  const alreadyCreatedQuestion = question.length !== 0

  return { alreadyCreatedQuestion, question: question[0] || null }
}

const getReplyCounts = async (questionId) => {
  const [data] = await db.execute(
    `SELECT count(*) AS reply_counts FROM replies WHERE question_id =?`,
    [questionId]
  )

  return data
}

const createQuestion = async (userId, categoryId, content) => {
  const question = {
    user_id: userId,
    category_id: categoryId,
    start_time: currentUTCDateTime(),
    content: content,
    is_closed: 0,
  }
  await db.query(`INSERT INTO questions SET ?`, question)
}

const createReply = async (userId, questionId, reply) => {
  const replyData = {
    user_id: userId,
    question_id: questionId,
    reply: reply,
    time: currentUTCDateTime(),
  }

  await db.query(`INSERT INTO replies SET ?`, replyData)
}

const closeQuestion = async (questionId) => {
  await db.execute('UPDATE questions SET is_closed = 1 WHERE id = ?', [
    questionId,
  ])
}

const checkIsOwnQuestion = async (questionId, userId) => {
  const [result] = await db.execute(
    'SELECT * FROM questions WHERE id = ? AND user_id = ?',
    [questionId, userId]
  )

  return result.length
}

const getReplies = async (questionId) => {
  const [replies] = await db.execute(
    `SELECT replies.reply AS answer, user.nickname, picture.picture_URL AS pictureURL
      FROM questions
      RIGHT JOIN replies 
      ON questions.id = replies.question_id
      JOIN user
      ON user.id = replies.user_id
      JOIN picture
      ON user.picture_id = picture.id
      WHERE questions.id = ?`,
    [questionId]
  )
  return replies
}

module.exports = {
  getQuestionsDetails,
  getQuestions,
  checkStatus,
  getReplyCounts,
  createQuestion,
  createReply,
  closeQuestion,
  checkIsOwnQuestion,
  getReplies,
}
