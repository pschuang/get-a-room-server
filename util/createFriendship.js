require('dotenv').config({ path: __dirname + '/../.env' })
const { currentUTCDateTime } = require('../util/convertDatetime')
const db = require('../models/mysqlconf')
const { v4: uuidv4 } = require('uuid')

const createFriendship = async (roomId, member1, member2) => {
  await db.query(
    'INSERT INTO friends (user_id, friend_user_id, room_id, created_at) VALUES ?',
    [
      [
        [member1, member2, roomId, currentUTCDateTime()],
        [member2, member1, roomId, currentUTCDateTime()],
      ],
    ]
  )
  await db.end()
}

createFriendship(uuidv4(), process.argv[2], process.argv[3])
