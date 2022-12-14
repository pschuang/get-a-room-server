require('dotenv').config
const Chatroom = require('../models/chatroom_model')
const User = require('../models/user_model')
const Cache = require('../models/cache_model')

const getMessages = async (req, res) => {
  const { roomId } = req.params
  const userId = req.user.id
  const messages = await Chatroom.getMessages(roomId)
  const counterpartInfo = await Chatroom.getCounterPartInfo(userId, roomId)

  res.json({ messages, counterpartInfo })
}

const getMatchCounterPartInfo = async (req, res) => {
  const { roomId } = req.params
  const userId = req.user.id
  // 去 redis 拿 counterpart
  const result = await Cache.getMembers(roomId)
  const members = JSON.parse(result)
  const counterpartId = members.find((id) => id != userId)

  const user = await User.getUserInfo(counterpartId)
  res.json({ user })
}

module.exports = { getMessages, getMatchCounterPartInfo }
