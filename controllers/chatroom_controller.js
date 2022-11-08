require('dotenv').config
// const cache = require('../util/cache')
const Chatroom = require('../models/chatroom_model')

const getMessages = async (req, res) => {
  const { roomId } = req.params
  console.log('room id: ', roomId)

  const messages = await Chatroom.getMessages(roomId)

  res.json({ messages })
}

module.exports = { getMessages }
