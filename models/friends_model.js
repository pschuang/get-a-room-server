const db = require('./mysqlconf')
const dayjs = require('dayjs')

const getFriends = async (userId) => {
  const [friends] = await db.query(
    'SELECT friends.friend_user_id AS userId, friends.room_id AS roomId, user.nickname, picture.picture_URL AS pictureURL FROM friends, user, picture WHERE user.id = friends.friend_user_id AND user.picture_id = picture.id AND friends.user_id = ?',
    [userId]
  )
  return friends
}

const createFriendship = async (roomId, members) => {
  const currentDateTime = dayjs().utc().format('YYYY-MM-DD HH:mm:ss')
  await db.query(
    'INSERT INTO friends (user_id, friend_user_id, room_id, created_at) VALUES ?',
    [
      [
        [members[0], members[1], roomId, currentDateTime],
        [members[1], members[0], roomId, currentDateTime],
      ],
    ]
  )
}

module.exports = {
  getFriends,
  createFriendship,
}
