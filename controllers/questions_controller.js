require('dotenv').config
const Questions = require('../models/questions_model')

const getQuestions = async (req, res) => {
  const paging = req.query.paging ? parseInt(req.query.paging) : 0
  if (paging < 0 || isNaN(paging)) {
    return res.status(400).json({ error: 'wrong parameter' })
  }

  // 定義每頁取的筆數
  const questionsPerPage = 8

  // params
  const { category } = req.params
  // query strings
  const { keyword } = req.query

  const findQuestion = async (category) => {
    switch (category) {
      case 'all':
        return await Questions.getQuestions(paging, questionsPerPage, {
          keyword,
        })
      default:
        return await Questions.getQuestions(paging, questionsPerPage, {
          category,
          keyword,
        })
    }
  }

  const { questions, questionsCount } = await findQuestion(category)

  // 每個問題加上 replies 個數
  for (const question of questions) {
    const replyCounts = await Questions.getReplyCounts(question.id)
    question.reply_counts = replyCounts[0].reply_counts
    delete question.category_id
  }

  const data =
    questionsCount[0].total > (paging + 1) * questionsPerPage
      ? {
          questions,
          next_paging: paging + 1,
        }
      : {
          questions,
        }

  return res.json(data)
}

const getQuestionsDetails = async (req, res) => {
  const userId = req.user.id
  // 接 question_id
  const { questionId } = req.params

  const { content, repliers, questionUserId, isClosed, error } =
    await Questions.getQuestionsDetails(questionId)

  if (error) {
    res.status(400).json({ message: error })
    return
  }

  if (questionUserId !== userId) {
    res.status(403).json({ message: 'not authorized to view this question' })
    return
  }
  res.json({ content, repliers, isClosed })
}

const checkStatus = async (req, res) => {
  const user = req.user
  const { alreadyCreatedQuestion, question } = await Questions.checkStatus(
    user.id
  )
  if (question) {
    const reply_counts = await Questions.getReplyCounts(question.id)
    question.reply_counts = reply_counts[0].reply_counts
  }
  const data = { alreadyCreatedQuestion, question }
  res.json(data)
}

const createQuestion = async (req, res) => {
  const user_id = req.user.id
  const { category_id, content } = req.body
  if (!user_id || !category_id || !content) {
    return res.status(400).json({ message: 'question detail insufficient' })
  }

  if (content.length > 150) {
    return res
      .status(400)
      .json({ message: 'Question content word limit: 150 words.' })
  }

  //TODO: 要確認這個 user 該時段是否已經發布過問題

  await Questions.createQuestion(user_id, category_id, content)
  res.json({ message: 'created question successfully!' })
}

const createReply = async (req, res) => {
  const user_id = req.user.id
  const { question_id, reply } = req.body
  if (!user_id || !question_id || !reply) {
    return res.status(400).json({ message: 'reply detail insufficient' })
  }

  if (reply.length > 150) {
    return res
      .status(400)
      .json({ message: 'Question content word limit: 150 words.' })
  }

  // 判斷是否為回答自己的問題
  const isOwnQuestion = await Questions.checkIsOwnQuestion(question_id, user_id)
  if (isOwnQuestion)
    return res
      .status(400)
      .json({ message: 'not allow to reply your own question!' })

  await Questions.createReply(user_id, question_id, reply)
  res.json({ message: 'created reply successfully!' })
}

const getReplies = async (req, res) => {
  const { questionId } = req.params
  if (!questionId) {
    res.status(400).json({ message: 'Please provide question id!' })
    return
  }
  const replies = await Questions.getReplies(questionId)
  res.json({ replies })
}

module.exports = {
  getQuestions,
  getQuestionsDetails,
  checkStatus,
  createQuestion,
  createReply,
  getReplies,
}
