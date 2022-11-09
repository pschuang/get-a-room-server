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

const getQuestions = async (questionsPerQuery, questionsPerPage) => {
  const [data] = await db.query(
    'SELECT questions.*, categories.category, user.id AS user_id, user.nickname, picture.picture_URL AS pictureURL FROM questions, user, categories, picture WHERE questions.user_id = user.id AND questions.category_id = categories.id AND user.picture_id = picture.id ORDER BY questions.id LIMIT ? OFFSET ?',
    [questionsPerQuery, questionsPerPage]
  )

  return data
}

const GetReplyCounts = async (questionId) => {
  const [data] = await db.query(
    `SELECT count(*) AS reply_counts FROM replies WHERE question_id =?`,
    [questionId]
  )

  return data
}

const createQuestion = async () => {
  //
}

const createReply = async () => {
  //
}

module.exports = {
  getQuestionsDetails,
  getQuestions,
  GetReplyCounts,
  createQuestion,
  createReply,
}
