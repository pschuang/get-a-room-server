require('dotenv').config
const Questions = require('../models/questions_model')

const getQuestions = async (req, res) => {
  const paging = req.query.paging ? parseInt(req.query.paging) : 0
  if (paging < 0 || isNaN(paging)) {
    return res.status(400).json({ error: 'wrong parameter' })
  }
  console.log(paging)

  // 定義每頁取的筆數
  const questionsPerPage = 8

  // params
  const { category } = req.params

  const totalQuestions =
    category === 'all'
      ? await Questions.getTotalQuestions()
      : await Questions.getTotalQuestionsByCategory(category)

  const questions =
    category === 'all'
      ? await Questions.getQuestions(paging, questionsPerPage)
      : await Questions.getQuestionsByCategory(
          category,
          paging,
          questionsPerPage
        )

  // 每個問題加上 replies 個數
  for (const question of questions) {
    const replyCounts = await Questions.getReplyCounts(question.id)
    question.reply_counts = replyCounts[0].reply_counts
    delete question.category_id
  }

  const data =
    totalQuestions > (paging + 1) * questionsPerPage
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
  const { questionId } = req.params
  console.log(questionId)

  const data = await Questions.getQuestionsDetails(questionId)

  res.json(data)
}

const createQuestion = async (req, res) => {
  const { user_id, category_id, content } = req.body
  if (!user_id || !category_id || !content) {
    return res.status(400).json({ message: 'question detail insufficient' })
  }
  await Questions.createQuestion(user_id, category_id, content)
  res.json({ message: 'created question successfully!' })
}

const createReply = async (req, res) => {
  const { user_id, question_id, reply } = req.body
  await Questions.createReply(user_id, question_id, reply)
  res.json({ message: 'created reply successfully!' })
}

module.exports = {
  getQuestions,
  getQuestionsDetails,
  createQuestion,
  createReply,
}
