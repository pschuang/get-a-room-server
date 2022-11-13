require('dotenv').config
const Friends = require('../models/friends_model')
// const cache = require('../util/cache')

const getFriends = async (req, res) => {
  const userId = req.user.id

  // call model
  const friends = await Friends.getFriends(userId)

  res.json({ friends })
}

module.exports = { getFriends }
