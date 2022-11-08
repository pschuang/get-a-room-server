const db = require('./mysqlconf')

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
  const [result] = await db.query(
    `INSERT INTO messages (send_user_id, content, created_at, room_id) VALUES (?, ?, convert_tz(UTC_TIMESTAMP(),'+00:00','+08:00'), ?)`,
    [userId, message, roomId]
  )
  console.log(`insert message successfully! insertId: ${result.insertId}`)
}

module.exports = {
  getMessages,
  createMessage,
}
