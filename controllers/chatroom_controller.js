require('dotenv').config
// const cache = require('../util/cache')

const getMessages = async (req, res) => {

  const { roomId } = req.params
  console.log('room id: ', roomId)
  const messages = [
    { userId: '1', message: '哈囉你好嗎' },
    { userId: '2', message: '我很好' },
    { userId: '1', message: 'QQ 我今天不想 coding' },
    { userId: '2', message: '要不要出去玩?' },
    { userId: '1', message: '好!' },
  ]

  res.json({ messages })
}

module.exports = { getMessages }
