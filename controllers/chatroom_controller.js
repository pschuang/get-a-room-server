require('dotenv').config
// const cache = require('../util/cache')
const Chatroom = require('../models/chatroom_model')

const getMessages = async (req, res) => {
  const { roomId } = req.params
  const userId = req.user.id
  console.log('room id: ', roomId)

  const messages = await Chatroom.getMessages(roomId)
  const counterpartInfo = await Chatroom.getCounterPartInfo(userId, roomId)

  res.json({ messages, counterpartInfo })
}

module.exports = { getMessages }
