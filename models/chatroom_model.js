const db = require('./mysqlconf')
const { currentUTCDateTime } = require('../util/convertDatetime')

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
  await db.query(
    `INSERT INTO messages (send_user_id, content, created_at, room_id) VALUES (?, ?, ?, ?)`,
    [userId, message, currentUTCDateTime(), roomId]
  )
}

const checkUserAuth = async (userId, roomId) => {
  const [result] = await db.query(
    'SELECT * FROM friends WHERE user_id = ? AND room_id = ?',
    [userId, roomId]
  )
  const canJoinRoom = result.length === 0 ? false : true
  return canJoinRoom
}

const getCounterPartInfo = async (userId, roomId) => {
  const [result] = await db.query(
    'SELECT user.nickname, picture.picture_URL AS pictureURL FROM friends, user, picture WHERE user.id = friends.friend_user_id AND user.picture_id = picture.id AND friends.user_id = ? AND friends.room_id = ?',
    [userId, roomId]
  )

  const data = {
    nickname: result[0].nickname,
    pictureURL: result[0].pictureURL,
  }

  return data
}

module.exports = {
  getMessages,
  createMessage,
  checkUserAuth,
  getCounterPartInfo,
}
