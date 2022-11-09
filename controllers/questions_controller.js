require('dotenv').config
const Questions = require('../models/questions_model')

const getQuestions = async (req, res) => {
  const paging = req.query.paging ? parseInt(req.query.paging) : 0
  if (paging < 0 || isNaN(paging)) {
    return res.status(400).json({ error: 'wrong parameter' })
  }
  console.log(paging)

  // 定義每頁取的筆數 & 每次撈資料筆數
  const questionsPerPage = 8
  const questionsPerQuery = 9

  const questions = await Questions.getQuestions(
    questionsPerQuery,
    questionsPerPage * paging
  )

  // 每個問題加上 replies 個數
  for (const question of questions) {
    const replyCounts = await Questions.GetReplyCounts(question.id)
    question.reply_counts = replyCounts[0].reply_counts
    delete question.category_id
  }

  const data =
    questions.length === questionsPerQuery
      ? { questions, next_paging: paging + 1 }
      : { questions }
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

// const createReply = async(req,res)=>{
//   res.json(data)
// }

module.exports = { getQuestions, getQuestionsDetails, createQuestion }
