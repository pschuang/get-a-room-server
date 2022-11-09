const db = require('./mysqlconf')

const getQuestionsDetails = async (questionId) => {
  const [details] = await db.query(
    'SELECT questions.user_id, questions.content, replies.user_id AS userId, replies.reply AS answer, user.nickname, picture.picture_URL AS pictureURL FROM questions, replies, user, picture WHERE questions.id = replies.question_id AND user.id = replies.user_id AND user.picture_id = picture.id AND questions.id = ?',
    [questionId]
  )
  console.log(details)

  // 問問題的人的 userId
  const questionUserId = details[0].user_id
  console.log('question user id: ', questionUserId)

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

  console.log('repliers: ', repliers)

  // 取得 回答問題的人的 userId
  const replierUserIds = repliers.map((replier) => replier.userId)

  console.log("repliers' userID:", replierUserIds)

  // 找出該 回答問題的人 與 問問題的人 的 roomId，並在 replier 物件上加上 isFriend, roomId
  for (let i = 0; i < replierUserIds.length; i++) {
    const [roomId] = await db.query(
      'SELECT friend_user_id, room_id FROM friends WHERE user_id = ? AND friend_user_id = ?',
      [questionUserId, replierUserIds[i]]
    )
    if (roomId.length === 0) continue

    console.log(roomId)
    repliers[i].isFriend = true
    repliers[i].roomId = roomId[0].room_id
  }
  console.log('repliers: ', repliers)

  const data = { content: details[0].content, repliers }
  return data
}

const getQuestions = async (paging, questionsPerPage) => {
  const [data] = await db.query(
    'SELECT questions.*, categories.category, user.id AS user_id, user.nickname, picture.picture_URL AS pictureURL FROM questions, user, categories, picture WHERE questions.user_id = user.id AND questions.category_id = categories.id AND user.picture_id = picture.id ORDER BY questions.id LIMIT ? ,?',
    [questionsPerPage * paging, questionsPerPage]
  )

  return data
}

const getQuestionsByCategory = async (category, paging, questionsPerPage) => {
  const [data] = await db.query(
    'SELECT questions.*, categories.category, user.id AS user_id, user.nickname, picture.picture_URL AS pictureURL FROM questions, user, categories, picture WHERE questions.user_id = user.id AND questions.category_id = categories.id AND user.picture_id = picture.id AND category = ? ORDER BY questions.id LIMIT ? ,?',
    [category, questionsPerPage * paging, questionsPerPage]
  )

  return data
}

const getTotalQuestions = async () => {
  const [totalQuestions] = await db.query(
    'SELECT count(*) AS total FROM questions'
  )
  return totalQuestions[0].total
}

const getTotalQuestionsByCategory = async (category) => {
  const [totalQuestions] = await db.query(
    'SELECT count(*) AS total FROM questions, categories WHERE questions.category_id = categories.id AND categories.category = ?',
    [category]
  )
  return totalQuestions[0].total
}

const getReplyCounts = async (questionId) => {
  const [data] = await db.query(
    `SELECT count(*) AS reply_counts FROM replies WHERE question_id =?`,
    [questionId]
  )

  return data
}

const createQuestion = async (userId, categoryId, content) => {
  const datetime = Date.now()
  const [result] = await db.query(
    `INSERT INTO questions (user_id, category_id, start_time, content, is_closed) VALUES (?, ?, ?, ?, ?)`,
    [userId, categoryId, datetime, content, 0]
  )
  console.log(`created question successfully! question id: ${result.insertId}`)
}

const createReply = async (userId, questionId, reply) => {
  const datetime = Date.now()
  const [result] = await db.query(
    `INSERT INTO replies (user_id, question_id, reply, time) VALUES (?, ?, ?, ?)`,
    [userId, questionId, reply, datetime]
  )
  console.log(
    `Reply create at ${new Date().toLocaleString()} reply id: ${
      result.insertId
    }`
  )
}

module.exports = {
  getQuestionsDetails,
  getQuestions,
  getQuestionsByCategory,
  getTotalQuestions,
  getTotalQuestionsByCategory,
  getReplyCounts,
  createQuestion,
  createReply,
}
