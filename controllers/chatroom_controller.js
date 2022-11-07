require('dotenv').config
// const cache = require('../util/cache')

const getMessages = async (req, res) => {
  const { roomId } = req.params
  console.log('room id: ', roomId)
  const messages = [
    { userId: '1', message: '哈囉你好嗎' },
    { userId: '2', message: '我很好' },
    { userId: '1', message: '想不想來杯珍奶?' },
    { userId: '2', message: '當然?' },
    { userId: '1', message: '^____^' },
  ]

  res.json({ messages })
}

module.exports = { getMessages }
