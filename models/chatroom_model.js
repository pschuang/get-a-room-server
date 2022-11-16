const db = require('./mysqlconf')
const dayjs = require('dayjs')

const getMessages = async (roomId) => {
  const [messages] = await db.query(
    'SELECT * FROM messages WHERE room_id = ?',
    [roomId]
  )

  const data = messages.map((message) => {
    return {
      userId: message.send_user_id,
      message: message.content,
      created_at: message.created_at,
    }
  })
  return data
}

const createMessage = async (userId, message, roomId) => {
  const currentDateTime = dayjs().utc().format('YYYY-MM-DD HH:mm:ss')
  const [result] = await db.query(
    `INSERT INTO messages (send_user_id, content, created_at, room_id) VALUES (?, ?, ?, ?)`,
    [userId, message, currentDateTime, roomId]
  )
  console.log(`insert message successfully! insertId: ${result.insertId}`)
}

const checkUserAuth = async (userId, roomId) => {
  const [result] = await db.query(
    'SELECT * FROM friends WHERE user_id = ? AND room_id = ?',
    [userId, roomId]
  )
  const canJoinRoom = result.length === 0 ? false : true
  return canJoinRoom
}

module.exports = {
  getMessages,
  createMessage,
  checkUserAuth,
}
