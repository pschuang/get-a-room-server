const Admin = require('../models/admin_model')

const getDailyStats = async (req, res) => {
  const askedQuestionCount = await Admin.getAskedQuestionCount()
  const openQuestionCount = await Admin.getOpenQuestionCount()
  const questionCountByCategory = await Admin.getQuestionsCountByCategory()
  const newRegisterCount = await Admin.getUserCount()
  const friendshipCount = await Admin.getFriendshipCount()
  res.json({
    askedQuestionCount,
    openQuestionCount,
    questionCountByCategory,
    newRegisterCount,
    friendshipCount,
  })
}

const getWeekStats = async (req, res) => {
  const questionsInAWeek = await Admin.getQuestionsInAWeek()
  res.json({ questionsInAWeek })
}

module.exports = {
  getDailyStats,
  getWeekStats,
}
