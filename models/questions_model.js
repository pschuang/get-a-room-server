const db = require('./mysqlconf')
const { BULLETIN_OPEN_TIME_SPAN } = process.env
const dayjs = require('dayjs')
const redis = require('../util/cache')

const getQuestionsDetails = async (questionId) => {
  const [details] = await db.query(
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
    const [roomId] = await db.query(
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
  const openTimeTodayUTC = await redis.get(dayjs().utc().format('YYYY-MM-DD'))
  const closeTimeTodayUTC = dayjs(openTimeTodayUTC)
    .add(BULLETIN_OPEN_TIME_SPAN, 'minute')
    .format('YYYY-MM-DD HH:mm:ss')
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
    sql: 'LIMIT ?, ?',
    binding: [paging * questionsPerPage, questionsPerPage],
  }

  const questionQuery =
    'SELECT questions.*, categories.category, user.id AS user_id, user.nickname, picture.picture_URL AS pictureURL FROM questions, user, categories, picture WHERE questions.user_id = user.id AND questions.category_id = categories.id AND user.picture_id = picture.id AND start_time > ? AND start_time < ? ' +
    condition.sql +
    order.sql +
    limit.sql
  const questionBindings = condition.binding.concat(limit.binding)

  const questionCountQuery =
    'SELECT count(*) AS total FROM questions, categories WHERE questions.category_id = categories.id AND start_time > ? AND start_time < ?' +
    condition.sql

  const questionCountBindings = condition.binding

  const [questions] = await db.query(questionQuery, questionBindings)
  const [questionsCount] = await db.query(
    questionCountQuery,
    questionCountBindings
  )
  return { questions, questionsCount }
}

const checkStatus = async (userId) => {
  // 加上時間判斷
  const openTimeTodayUTC = await redis.get(dayjs().utc().format('YYYY-MM-DD'))

  const closeTimeTodayUTC = dayjs(openTimeTodayUTC)
    .add(BULLETIN_OPEN_TIME_SPAN, 'minute')
    .format('YYYY-MM-DD HH:mm:ss')

  const [question] = await db.query(
    'SELECT questions.*, categories.category, user.id AS user_id, user.nickname, picture.picture_URL AS pictureURL FROM questions, user, categories, picture WHERE questions.user_id = user.id AND questions.category_id = categories.id AND user.picture_id = picture.id AND user_id = ? AND start_time > ? AND start_time < ?',
    [userId, openTimeTodayUTC, closeTimeTodayUTC]
  )
  const alreadyCreatedQuestion = question.length !== 0

  return { alreadyCreatedQuestion, question: question[0] || null }
}

const getReplyCounts = async (questionId) => {
  const [data] = await db.query(
    `SELECT count(*) AS reply_counts FROM replies WHERE question_id =?`,
    [questionId]
  )

  return data
}

const createQuestion = async (userId, categoryId, content) => {
  const currentDateTime = dayjs().utc().format('YYYY-MM-DD HH:mm:ss')

  const question = {
    user_id: userId,
    category_id: categoryId,
    start_time: currentDateTime,
    content: content,
    is_closed: 0,
  }
  await db.query(`INSERT INTO questions SET?`, question)
}

const createReply = async (userId, questionId, reply) => {
  const currentDateTime = dayjs().utc().format('YYYY-MM-DD HH:mm:ss')

  const replyData = {
    user_id: userId,
    question_id: questionId,
    reply: reply,
    time: currentDateTime,
  }

  await db.query(`INSERT INTO replies SET ?`, replyData)
}

const closeQuestion = async (questionId) => {
  await db.query('UPDATE questions SET is_closed = 1 WHERE id = ?', [
    questionId,
  ])
}

module.exports = {
  getQuestionsDetails,
  getQuestions,
  checkStatus,
  getReplyCounts,
  createQuestion,
  createReply,
  closeQuestion,
}
