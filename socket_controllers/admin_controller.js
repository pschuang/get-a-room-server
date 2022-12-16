const Admin = require('../models/admin_model')
const getRecentMatches = require('../service/recentMatches')

const getOnlineCounts = async (socket, countOfClients) => {
  const matches = await getRecentMatches()

  socket.emit('online-count', {
    onlineCounts: countOfClients,
    recentMatches: matches,
  })
}

const refreshDashboard = async (socket) => {
  // 收到前端請求後，從 model 拿資料並回傳
  const askedQuestionCount = await Admin.getAskedQuestionCount()
  const openQuestionCount = await Admin.getOpenQuestionCount()
  const questionCountByCategory = await Admin.getQuestionsCountByCategory()
  const userCount = await Admin.getUserCount()
  const friendshipCount = await Admin.getFriendshipCount()
  const replyCount = await Admin.getReplyCount()
  socket.emit('refresh-dashboard-success', {
    askedQuestionCount,
    openQuestionCount,
    questionCountByCategory,
    userCount,
    friendshipCount,
    replyCount,
  })
}

module.exports = { getOnlineCounts, refreshDashboard }
